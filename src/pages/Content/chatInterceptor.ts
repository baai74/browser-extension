
import { watchForRPCRequests } from '../../helpers/pageRPC';

// Lista obsługiwanych interfejsów czatu AI
const SUPPORTED_CHAT_PLATFORMS = [
  { name: 'ChatGPT', selector: '.markdown' },
  { name: 'Google Bard', selector: '.response-content' },
  { name: 'Claude', selector: '.claude-answer' },
  { name: 'Perplexity', selector: '.prose' },
  // W razie potrzeby dodaj więcej platform
];

// Prefiks polecenia do identyfikacji poleceń Taxy
const COMMAND_PREFIX = '/taxy';

function extractCommandFromElement(element: Element): string | null {
  const text = element.textContent || '';
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.trim().startsWith(COMMAND_PREFIX)) {
      return line.trim();
    }
  }
  
  return null;
}

function processCommand(command: string, platform: string) {
  console.log(`Wykryto polecenie z ${platform}: ${command}`);
  
  // Usuń prefiks polecenia
  const withoutPrefix = command.substring(COMMAND_PREFIX.length).trim();
  
  // Analizuj polecenie, aby wyodrębnić akcję i parametry
  let action, params;
  
  // Sprawdź różne rodzaje komend
  if (withoutPrefix.startsWith('click')) {
    action = 'click';
    // Wyodrębnij selektor w cudzysłowach
    const match = withoutPrefix.match(/click\s+"([^"]+)"/);
    params = match ? match[1] : '';
  } else if (withoutPrefix.startsWith('type')) {
    action = 'type';
    // Wyodrębnij tekst i selektor w formacie: type "tekst" in "selektor"
    const match = withoutPrefix.match(/type\s+"([^"]+)"\s+in\s+"([^"]+)"/);
    if (match) {
      params = {
        text: match[1],
        selector: match[2]
      };
    }
  } else if (withoutPrefix.startsWith('navigate') || withoutPrefix.startsWith('goto')) {
    action = 'navigate';
    // Wyodrębnij URL
    const parts = withoutPrefix.split(' ');
    params = parts[1] ? parts[1] : '';
  } else if (withoutPrefix.startsWith('automate')) {
    action = 'automate';
    // Wyodrębnij instrukcję w cudzysłowach
    const match = withoutPrefix.match(/automate\s+"([^"]+)"/);
    params = match ? match[1] : withoutPrefix.substring('automate'.length).trim();
  } else {
    // Jeśli nie rozpoznano konkretnego polecenia, traktuj całość jako polecenie automate
    action = 'automate';
    params = withoutPrefix;
  }
  
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

// Funkcja która obserwuje zmiany w DOM i wykrywa nowe odpowiedzi AI
function setupChatObserver() {
  // Funkcja obserwująca zmiany w konkretnym elemencie
  function observePlatform(platform: { name: string, selector: string }) {
    // Sprawdź, czy elementy platformy istnieją
    const elements = document.querySelectorAll(platform.selector);
    
    if (elements.length > 0) {
      console.log(`Wykryto platformę: ${platform.name}`);
      
      // Sprawdź, czy w istniejących elementach są już polecenia
      elements.forEach(element => {
        const command = extractCommandFromElement(element);
        if (command) {
          processCommand(command, platform.name);
        }
      });
      
      // Obserwuj nowe elementy
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target as Element;
            
            // Sprawdź, czy zmieniony element pasuje do selektora
            if (target.matches && target.matches(platform.selector)) {
              const command = extractCommandFromElement(target);
              if (command) {
                processCommand(command, platform.name);
              }
            } else if (target.querySelector) {
              // Sprawdź, czy któryś z dodanych węzłów pasuje do selektora
              const matchingElements = target.querySelectorAll(platform.selector);
              matchingElements.forEach(element => {
                const command = extractCommandFromElement(element);
                if (command) {
                  processCommand(command, platform.name);
                }
              });
            }
          }
        });
      });
      
      // Obserwuj zmiany w całym dokumencie
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }
  
  // Sprawdź wszystkie obsługiwane platformy
  SUPPORTED_CHAT_PLATFORMS.forEach(platform => {
    observePlatform(platform);
  });
}

// Uruchom obserwator po załadowaniu strony
function initChatInterceptor() {
  console.log('Taxy AI Chat Interceptor initialized');
  
  // Jeśli DOM jest już załadowany, ustaw obserwator od razu
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupChatObserver();
  } else {
    // W przeciwnym razie poczekaj na załadowanie DOM
    document.addEventListener('DOMContentLoaded', setupChatObserver);
  }
}

// Inicjalizacja interceptora
initChatInterceptor();

// Eksportujemy funkcje, które mogą być potrzebne w innych modułach
export { processCommand, extractCommandFromElement };
