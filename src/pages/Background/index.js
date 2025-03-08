
// Background script dla rozszerzenia Taxy AI

// Funkcja do pobierania aktywnej karty
const getCurrentTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

// Główna funkcja do przetwarzania komend
const processCommand = (command, source) => {
  console.log(`Przetwarzanie komendy z ${source}: ${command}`);

  // Parsowanie komendy w celu wyodrębnienia akcji i parametrów
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
    case 'wait':
      executeWaitAction(parseInt(params));
      break;
    case 'scroll':
      executeScrollAction(params);
      break;
    case 'automate':
      executeAutomationAction(params);
      break;
    case 'screenshot':
      executeTakeScreenshotAction();
      break;
    case 'test':
    case 'test-selector':
      executeTestSelectorAction(params);
      break;
    case 'debug':
      executeDebugAction(params);
      break;
    case 'help':
      return {
        success: true,
        message: `Dostępne komendy:
- click "selector" - kliknij element
- type "text" in "selector" - wpisz tekst
- navigate "url" - przejdź do URL
- wait 1000 - czekaj 1000ms
- scroll "direction" "amount" - przewiń stronę
- automate "instrukcja" - wykonaj złożoną instrukcję
- screenshot - zrób zrzut ekranu
- test-selector "selector" - testuj selektor
- debug - debugging
`
      };
    default:
      console.log(`Nieznana akcja komendy: ${action}`);
      return { success: false, error: `Nieznana akcja: ${action}` };
  }

  return { success: true, message: `Wykonuję akcję: ${action}` };
};

// Funkcja do testowania selektorów
const executeTestSelectorAction = (selector) => {
  getCurrentTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'test-selector',
          selector
        }
      }, (response) => {
        console.log('Wynik testu selektora:', response);
        // Wyświetl powiadomienie z wynikiem testu
        if (response && response.success) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '/icon-128.png',
            title: 'Test selektora',
            message: `Znaleziono ${response.count} elementów dla selektora: ${selector}`
          });
        } else {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '/icon-128.png',
            title: 'Test selektora nieudany',
            message: response?.errorMessage || 'Brak elementów pasujących do selektora'
          });
        }
      });
    }
  });
};

// Funkcja do debugowania strony
const executeDebugAction = (params) => {
  getCurrentTab().then(tab => {
    if (tab) {
      // Otwarcie DevTools dla aktywnej karty
      chrome.debugger.attach({ tabId: tab.id }, '1.3', () => {
        if (chrome.runtime.lastError) {
          console.error('Błąd podczas dołączania debuggera:', chrome.runtime.lastError);
          return;
        }
        console.log('Debugger dołączony do karty', tab.id);
        
        // Wykonaj dodatkowe akcje debugujące w zależności od parametrów
        if (params.includes('dom')) {
          chrome.debugger.sendCommand({ tabId: tab.id }, 'DOM.getDocument', {}, (rootNode) => {
            console.log('DOM document:', rootNode);
          });
        }
      });
    }
  });
};

// Funkcja do klikania elementów
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

// Funkcja do wprowadzania tekstu
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
    console.log('Niepoprawny format dla komendy type. Oczekiwano: "tekst" in "selektor"');
  }
};

// Funkcja do nawigacji
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

// Funkcja do oczekiwania
const executeWaitAction = (timeout) => {
  if (isNaN(timeout)) {
    console.log('Niepoprawny format czasu oczekiwania. Oczekiwano liczby w milisekundach.');
    return;
  }
  
  setTimeout(() => {
    console.log(`Zakończono oczekiwanie ${timeout}ms`);
  }, timeout);
};

// Funkcja do przewijania strony
const executeScrollAction = (params) => {
  const parts = params.split(' ');
  const direction = parts[0];
  const amount = parseInt(parts[1]);
  
  if (!['up', 'down', 'left', 'right'].includes(direction) || isNaN(amount)) {
    console.log('Niepoprawny format dla komendy scroll. Oczekiwano: [up|down|left|right] [ilość]');
    return;
  }
  
  getCurrentTab().then(tab => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'scroll',
          direction,
          amount
        }
      });
    }
  });
};

// Funkcja do wykonania zrzutu ekranu
const executeTakeScreenshotAction = () => {
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    console.log('Wykonano zrzut ekranu');
    
    // Zapisz w localStorage
    chrome.storage.local.set({ 'lastScreenshot': dataUrl }, () => {
      console.log('Zrzut ekranu zapisany');
      
      // Powiadom o zapisaniu zrzutu
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon-128.png',
        title: 'Taxy AI',
        message: 'Zrzut ekranu został wykonany i zapisany'
      });
    });
  });
};

// Funkcja do automatyzacji
const executeAutomationAction = (instruction) => {
  getCurrentTab().then(tab => {
    if (tab) {
      // Pierwsze pobierz DOM strony
      chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PAGE_DOM'
      }, (response) => {
        if (response && response.success) {
          const simplifiedDom = response.dom;
          
          // Pobierz historię akcji
          chrome.storage.local.get('actionHistory', (result) => {
            const actionHistory = result.actionHistory || [];
            
            // Teraz wyślij do LLM
            chrome.runtime.sendMessage({
              type: 'PROCESS_WITH_LLM',
              payload: {
                instruction,
                dom: simplifiedDom,
                previousActions: actionHistory
              }
            }, (llmResponse) => {
              if (llmResponse && llmResponse.actions) {
                // Wykonaj akcje zwrócone przez LLM
                executeActionsSequentially(llmResponse.actions, tab.id);
              } else {
                // Zwykłe automatyzacja bez LLM
                chrome.tabs.sendMessage(tab.id, {
                  type: 'EXECUTE_AUTOMATION',
                  payload: { instruction }
                });
              }
            });
          });
        } else {
          // Zwykłe automatyzacja bez przetwarzania DOM
          chrome.tabs.sendMessage(tab.id, {
            type: 'EXECUTE_AUTOMATION',
            payload: { instruction }
          });
        }
      });
    }
  });
};

// Funkcja do sekwencyjnego wykonywania akcji
const executeActionsSequentially = (actions, tabId, index = 0) => {
  if (index >= actions.length) {
    console.log('Wszystkie akcje zostały wykonane');
    return;
  }
  
  const action = actions[index];
  
  // Wykonaj aktualną akcję
  switch (action.type) {
    case 'click':
      chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'click',
          selector: action.selector
        }
      }, () => {
        // Dodaj akcję do historii
        addToActionHistory(`click("${action.selector}")`);
        // Wykonaj następną akcję po krótkim opóźnieniu
        setTimeout(() => executeActionsSequentially(actions, tabId, index + 1), 500);
      });
      break;
    case 'setValue':
      chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'type',
          selector: action.selector,
          text: action.value
        }
      }, () => {
        // Dodaj akcję do historii
        addToActionHistory(`setValue("${action.selector}", "${action.value}")`);
        // Wykonaj następną akcję po krótkim opóźnieniu
        setTimeout(() => executeActionsSequentially(actions, tabId, index + 1), 500);
      });
      break;
    case 'navigate':
      // Dodaj protokół HTTP jeśli nie został podany
      let url = action.url;
      if (!url.startsWith('http') && !url.startsWith('https')) {
        url = 'https://' + url;
      }
      
      chrome.tabs.update(tabId, { url }, () => {
        // Dodaj akcję do historii
        addToActionHistory(`navigate("${url}")`);
        // Wykonaj następną akcję po dłuższym opóźnieniu (żeby strona mogła się załadować)
        setTimeout(() => executeActionsSequentially(actions, tabId, index + 1), 2000);
      });
      break;
    case 'wait':
      // Dodaj akcję do historii
      addToActionHistory(`wait(${action.duration})`);
      // Wykonaj następną akcję po określonym opóźnieniu
      setTimeout(() => executeActionsSequentially(actions, tabId, index + 1), action.duration);
      break;
    case 'scroll':
      chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_ACTION',
        payload: {
          action: 'scroll',
          direction: action.direction,
          amount: action.amount
        }
      }, () => {
        // Dodaj akcję do historii
        addToActionHistory(`scroll("${action.direction}", ${action.amount})`);
        // Wykonaj następną akcję po krótkim opóźnieniu
        setTimeout(() => executeActionsSequentially(actions, tabId, index + 1), 500);
      });
      break;
    default:
      console.warn('Nieznany typ akcji:', action.type);
      // Przejdź do następnej akcji
      executeActionsSequentially(actions, tabId, index + 1);
  }
};

// Funkcja do dodawania akcji do historii
const addToActionHistory = (actionText) => {
  chrome.storage.local.get('actionHistory', (result) => {
    const actionHistory = result.actionHistory || [];
    actionHistory.push(actionText);
    
    // Ogranicz historię do 50 ostatnich akcji
    if (actionHistory.length > 50) {
      actionHistory.shift();
    }
    
    chrome.storage.local.set({ 'actionHistory': actionHistory });
  });
};

// Obsługa komend z przechwytywacza czatu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHAT_COMMAND') {
    console.log('Otrzymano komendę z czatu:', request.payload);
    const { action, params, source } = request.payload;

    // Przetwórz komendę
    const result = processCommand(`${action} ${params}`, source);
    sendResponse(result);
    return true;
  }
  
  // Obsługa wyboru obszarów na stronie
  if (request.type === 'START_AREA_SELECTION') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      }
    });
    return true;
  }
  
  // Zapisanie wybranych obszarów
  if (request.type === 'AREA_SELECTED') {
    console.log('Obszar został wybrany:', request.payload);
    
    // Tutaj możemy zapisać selektor w pamięci lokalnej
    chrome.storage.local.set({
      [`custom${request.payload.type === 'input' ? 'Input' : 'Output'}Selector`]: request.payload.selector
    });
    
    // Powiadom użytkownika
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icon-128.png',
      title: 'Taxy AI',
      message: `Wybrano obszar ${request.payload.type === 'input' ? 'do wysyłania' : 'do odbierania'} wiadomości`
    });
    
    return true;
  }

  // Obsługa przetwarzania z LLM
  if (request.type === 'PROCESS_WITH_LLM') {
    // Tutaj można zintegrować LLM service
    // W tej wersji zwracamy przykładowe akcje
    const exampleActions = [
      { type: 'click', selector: '#submit-button' },
      { type: 'wait', duration: 1000 },
      { type: 'setValue', selector: '#search-input', value: 'przykładowe wyszukiwanie' }
    ];
    
    sendResponse({
      text: 'Przetworzone przez example LLM',
      actions: exampleActions,
      isComplete: false
    });
    
    return true;
  }

  // Automatyczne wykonanie zrzutu ekranu
  if (request.type === 'TAKE_SCREENSHOT') {
    executeTakeScreenshotAction();
    sendResponse({ success: true });
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
        const result = processCommand(message.command, 'devtools');
        port.postMessage({ type: 'COMMAND_RESULT', result });
      }
    });
  }
});

// Obsługa poleceń klawiaturowych
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_popup') {
    // Otwarcie popup lub wykonanie akcji
    console.log('Skrót klawiszowy do otwarcia popup został naciśnięty');
  }
});

console.log('Taxy AI Background script załadowany');
