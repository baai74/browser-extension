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

// Obsługa komend z przechwytywacza czatu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_COMMAND') {
    console.log('Otrzymano komendę z czatu:', request.payload);
    const { action, params, source } = request.payload;

    // Przekaż polecenie do aktywnej karty
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(
          tabs[0].id, 
          {
            type: 'EXECUTE_ACTION',
            payload: {
              action,
              params
            }
          },
          (response) => {
            // Odpowiedź od content script z wynikiem wykonania akcji
            console.log('Odpowiedź z content script:', response);
            // Przekaż odpowiedź z powrotem do nadawcy
            sendResponse(response);
          }
        );
      } else {
        // Brak aktywnych kart
        sendResponse({ 
          success: false, 
          error: 'Nie znaleziono aktywnej karty przeglądarki' 
        });
      }
    });

    // Informuje Chrome, że sendResponse zostanie wywołane asynchronicznie
    return true;
  }

  // Obsługa innych typów wiadomości...

  // Automatyczne wykonanie zrzutu ekranu
  if (request.type === 'TAKE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      console.log('Wykonano zrzut ekranu');

      // Opcjonalne zapisanie zrzutu lub wysłanie go do innej części rozszerzenia
      chrome.storage.local.set({ 'lastScreenshot': dataUrl }, () => {
        console.log('Zrzut ekranu zapisany w storage');
        sendResponse({ success: true, dataUrl });
      });
    });
    return true;
  }

  // Obsługa automatyzacji
  if (request.type === 'EXECUTE_AUTOMATION') {
    const { instruction } = request.payload;
    console.log('Przetwarzanie automatyzacji:', instruction);

    // Tutaj można zaimplementować bardziej złożoną logikę automatyzacji,
    // np. użycie API rozpoznawania języka naturalnego do tłumaczenia instrukcji na sekwencję poleceń

    // Na razie po prostu informujemy o zakończeniu
    sendResponse({ success: true, message: 'Automatyzacja w trakcie implementacji' });
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