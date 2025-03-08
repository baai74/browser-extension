
import { watchForRPCRequests } from '../../helpers/pageRPC';

// Lista obsługiwanych interfejsów czatu AI
const SUPPORTED_CHAT_PLATFORMS = [
  { name: 'ChatGPT', selector: '.markdown' },
  { name: 'Google Bard', selector: '.response-content' },
  { name: 'Claude', selector: '.claude-answer' },
  // W razie potrzeby dodaj więcej platform
];

// Prefiks polecenia do identyfikacji poleceń Taxy
const COMMAND_PREFIX = '/taxy';

function extractCommandFromElement(element: Element): string | null {
  const text = element.textContent || '';
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.trim().startsWith(COMMAND_PREFIX)) {
      return line.trim().substring(COMMAND_PREFIX.length).trim();
    }
  }
  
  return null;
}

function processCommand(command: string, platform: string) {
  console.log(`Wykryto polecenie z ${platform}: ${command}`);
  
  // Analizuj polecenie, aby wyodrębnić akcję i parametry
  const parts = command.split(' ');
  const action = parts[0].toLowerCase();
  const params = parts.slice(1).join(' ');
  
  // Wyślij polecenie do skryptu tła (background.js)
  chrome.runtime.sendMessage({
    type: 'CHAT_COMMAND',
    payload: {
      action,
      params,
      source: platform
    }
  });
}

function setupChatListeners() {
  // Sprawdź każdą obsługiwaną platformę
  for (const platform of SUPPORTED_CHAT_PLATFORMS) {
    const responseElements = document.querySelectorAll(platform.selector);
    
    responseElements.forEach(element => {
      // Przetwarzaj istniejącą zawartość
      const command = extractCommandFromElement(element);
      if (command) {
        processCommand(command, platform.name);
      }
      
      // Monitoruj zmiany w treści
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' || mutation.type === 'childList') {
            const updatedCommand = extractCommandFromElement(element);
            if (updatedCommand) {
              processCommand(updatedCommand, platform.name);
            }
          }
        }
      });
      
      observer.observe(element, { 
        characterData: true, 
        childList: true, 
        subtree: true 
      });
    });
  }
}

function initialize() {
  console.log('Taxy chat interceptor initialized');
  setupChatListeners();
  
  // Okresowe sprawdzanie nowych elementów czatu, które mogły zostać załadowane
  setInterval(setupChatListeners, 5000);
}

// Skonfiguruj obsługę żądań RPC
watchForRPCRequests();

// Inicjalizuj skrypt treści
initialize();
