
import { watchForRPCRequests } from '../../helpers/pageRPC';

// List of supported AI chat interfaces
const SUPPORTED_CHAT_PLATFORMS = [
  { name: 'ChatGPT', selector: '.markdown' },
  { name: 'Google Bard', selector: '.response-content' },
  // Add more platforms as needed
];

// Command prefix to identify Taxy commands
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

function setupChatListeners() {
  // Check each supported platform
  for (const platform of SUPPORTED_CHAT_PLATFORMS) {
    const responseElements = document.querySelectorAll(platform.selector);
    
    responseElements.forEach(element => {
      // Process existing content
      const command = extractCommandFromElement(element);
      if (command) {
        processCommand(command, platform.name);
      }
      
      // Set up mutation observer to catch new responses
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const updatedCommand = extractCommandFromElement(element);
            if (updatedCommand) {
              processCommand(updatedCommand, platform.name);
            }
          }
        }
      });
      
      observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  }
}

function processCommand(command: string, platform: string) {
  console.log(`Received Taxy command from ${platform}: ${command}`);
  
  // Send the command to the background script for processing
  chrome.runtime.sendMessage({
    type: 'TAXY_CHAT_COMMAND',
    payload: {
      command,
      source: platform
    }
  });
}

// Initialize when the content script loads
function initialize() {
  console.log('Taxy chat interceptor initialized');
  setupChatListeners();
  
  // Re-check periodically for new chat elements that might have loaded
  setInterval(setupChatListeners, 5000);
}

// Set up RPC requests handling
watchForRPCRequests();

// Initialize the content script
initialize();
