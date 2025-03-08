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

// Obsługa komend z czatów AI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_COMMAND') {
    console.log('Otrzymano polecenie z czatu:', message.payload);

    const { action, params, source } = message.payload;

    // Przekaż polecenie do aktualnie aktywnej karty
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const activeTab = tabs[0];

        // Wyślij komunikat do content script w aktywnej karcie
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'EXECUTE_ACTION',
          payload: {
            action,
            params
          }
        }, (response) => {
          console.log('Wynik wykonania akcji:', response);
        });
      } else {
        console.error('Nie znaleziono aktywnej karty');
      }
    });

    // Wysyłamy odpowiedź, aby zwolnić port komunikacyjny
    sendResponse({ success: true });
    return true; // Informuje Chrome, że sendResponse zostanie wywołane asynchronicznie
  }

  if (message.type === 'EXECUTE_AUTOMATION') {
    console.log('Otrzymano żądanie automatyzacji:', message.payload);

    // Tutaj można zaimplementować bardziej złożoną logikę automatyzacji
    // wykorzystującą API Taxy i OpenAI

    // Na razie tylko potwierdzamy otrzymanie
    sendResponse({ success: true });
    return true;
  }
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