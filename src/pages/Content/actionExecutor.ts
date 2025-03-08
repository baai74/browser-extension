
// Executor dla poleceń z czatów AI

// Funkcja do wykonywania kliku na element o określonym selektorze
function executeClick(selector: string) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`Element o selektorze "${selector}" nie został znaleziony`);
      return false;
    }
    
    (element as HTMLElement).click();
    console.log(`Kliknięto element: ${selector}`);
    return true;
  } catch (error) {
    console.error(`Błąd podczas klikania elementu: ${error}`);
    return false;
  }
}

// Funkcja do wpisywania tekstu w element o określonym selektorze
function executeType(selector: string, text: string) {
  try {
    const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (!element || (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement))) {
      console.error(`Element do wpisania tekstu o selektorze "${selector}" nie został znaleziony lub nie jest polem tekstowym`);
      return false;
    }
    
    // Fokusuj element
    element.focus();
    
    // Wyczyść istniejący tekst
    element.value = '';
    
    // Wpisz nowy tekst
    element.value = text;
    
    // Wyemituj zdarzenie input, aby powiadomić stronę o zmianie wartości
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`Wpisano tekst w element: ${selector}`);
    return true;
  } catch (error) {
    console.error(`Błąd podczas wpisywania tekstu: ${error}`);
    return false;
  }
}

// Funkcja do nawigacji do podanego URL
function executeNavigate(url: string) {
  try {
    // Dodaj protokół http:// jeśli nie został podany
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log(`Nawigacja do: ${url}`);
    window.location.href = url;
    return true;
  } catch (error) {
    console.error(`Błąd podczas nawigacji: ${error}`);
    return false;
  }
}

// Funkcja do obsługi złożonych automatyzacji
function executeAutomate(instruction: string) {
  // Tutaj można zaimplementować bardziej zaawansowaną logikę automatyzacji
  // Na razie wysyłamy instrukcję do skryptu tła do dalszego przetwarzania
  console.log(`Wykonywanie automatyzacji: ${instruction}`);
  
  chrome.runtime.sendMessage({
    type: 'EXECUTE_AUTOMATION',
    payload: {
      instruction
    }
  });
  
  return true;
}

// Główna funkcja do obsługi poleceń
function executeAction(action: string, params: any) {
  console.log(`Wykonywanie akcji: ${action} z parametrami:`, params);
  
  switch (action) {
    case 'click':
      return executeClick(params);
    case 'type':
      if (typeof params === 'object' && params.text && params.selector) {
        return executeType(params.selector, params.text);
      } else {
        console.error('Nieprawidłowe parametry dla akcji type');
        return false;
      }
    case 'navigate':
      return executeNavigate(params);
    case 'automate':
      return executeAutomate(params);
    default:
      console.error(`Nieznana akcja: ${action}`);
      return false;
  }
}

// Funkcja ustanawiająca nasłuchiwanie na komunikaty z tła
function setupActionListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_ACTION') {
      const result = executeAction(message.payload.action, message.payload.params);
      sendResponse({ success: result });
      return true; // Informuje Chrome, że sendResponse zostanie wywołane asynchronicznie
    }
  });
  
  console.log('Taxy AI Action Executor initialized');
}

// Eksport funkcji do użycia w innych modułach
export { setupActionListener, executeAction };
