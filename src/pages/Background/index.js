
// Background script for Taxy AI extension

// Funkcja do pobierania aktywnej karty
const getCurrentTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

const processCommand = (command, source) => {
  console.log(`Processing command from ${source}: ${command}`);

  // Parse the command to extract action and parameters
  const parts = command.split(' ');
  const action = parts[0].toLowerCase();
  const params = parts.slice(1).join(' ');

  switch (action) {
    case 'click':
      executeClickAction(params);
      break;
    case 'type':
    case 'input':
      executeTypeAction(params);
      break;
    case 'navigate':
    case 'goto':
      executeNavigateAction(params);
      break;
    case 'automate':
      executeAutomationAction(params);
      break;
    default:
      console.log(`Unknown command action: ${action}`);
  }
};

const executeClickAction = (selector) => {
  getCurrentTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'click',
          selector
        }
      });
    }
  });
};

const executeTypeAction = (params) => {
  // Format expected: "text" in "selector"
  const match = params.match(/"([^"]+)"\s+in\s+"([^"]+)"/);
  if (match) {
    const text = match[1];
    const selector = match[2];

    getCurrentTab().then(tab => {
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'EXECUTE_ACTION',
          payload: {
            action: 'type',
            selector,
            text
          }
        });
      }
    });
  } else {
    console.log('Invalid format for type command. Expected: "text" in "selector"');
  }
};

const executeNavigateAction = (url) => {
  getCurrentTab().then(tab => {
    if (tab) {
      // Dodaj protokół HTTP jeśli nie został podany
      if (!url.startsWith('http') && !url.startsWith('https')) {
        url = 'https://' + url;
      }
      
      chrome.tabs.update(tab.id, { url });
    }
  });
};

const executeAutomationAction = (instruction) => {
  getCurrentTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_AUTOMATION',
        payload: {
          instruction
        }
      });
    }
  });
};

// Nasłuchuj wiadomości z content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_COMMAND') {
    const { action, params, source } = message.payload;
    console.log(`Otrzymano polecenie z ${source}: ${action} ${params}`);
    
    // Przetwarzanie poleceń z czatu
    switch (action) {
      case 'click':
        executeClickAction(params);
        break;
      case 'type':
      case 'input':
        executeTypeAction(params);
        break;
      case 'navigate':
      case 'goto':
        executeNavigateAction(params);
        break;
      case 'automate':
        executeAutomationAction(params);
        break;
      default:
        console.log(`Nieznana akcja: ${action}`);
    }
  }
  
  // Zawsze zwracaj true dla asynchronicznych odpowiedzi
  return true;
});

// Obsługa komunikatów z devtools
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'taxy-devtools') {
    port.onMessage.addListener((message) => {
      if (message.type === 'EXECUTE_COMMAND') {
        processCommand(message.command, 'devtools');
      }
    });
  }
});

console.log('Taxy AI Background script loaded');
