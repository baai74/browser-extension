
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

// Funkcja do obsługi przewijania strony
function executeScroll(params: any) {
  try {
    if (params.type === 'position') {
      window.scrollTo({
        left: params.x,
        top: params.y,
        behavior: 'smooth'
      });
      console.log(`Przewinięto stronę do pozycji: ${params.x}, ${params.y}`);
      return true;
    } else if (params.type === 'selector') {
      const element = document.querySelector(params.selector);
      if (!element) {
        console.error(`Element o selektorze "${params.selector}" nie został znaleziony`);
        return false;
      }
      
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      console.log(`Przewinięto stronę do elementu: ${params.selector}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Błąd podczas przewijania strony: ${error}`);
    return false;
  }
}

// Funkcja do obsługi przeciągania i upuszczania
function executeDrag(params: any) {
  try {
    const sourceElement = document.querySelector(params.source);
    const targetElement = document.querySelector(params.target);
    
    if (!sourceElement || !targetElement) {
      console.error(`Nie znaleziono elementu źródłowego lub docelowego`);
      return false;
    }
    
    // Uzyskujemy pozycje elementów
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    
    // Obliczamy środki elementów
    const sourceX = sourceRect.left + sourceRect.width / 2;
    const sourceY = sourceRect.top + sourceRect.height / 2;
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    
    // Tworzymy zdarzenia dla obsługi drag & drop
    // 1. Zdarzenie mousedown na elemencie źródłowym
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: sourceX,
      clientY: sourceY
    });
    sourceElement.dispatchEvent(mousedownEvent);
    
    // 2. Zdarzenie mousemove do docelowej pozycji
    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: targetX,
      clientY: targetY
    });
    document.dispatchEvent(mousemoveEvent);
    
    // 3. Zdarzenie mouseup na elemencie docelowym
    const mouseupEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: targetX,
      clientY: targetY
    });
    targetElement.dispatchEvent(mouseupEvent);
    
    console.log(`Przeciągnięto element z ${params.source} do ${params.target}`);
    return true;
  } catch (error) {
    console.error(`Błąd podczas przeciągania elementu: ${error}`);
    return false;
  }
}

// Funkcja do obsługi czekania
function executeWait(timeout: number) {
  console.log(`Oczekiwanie przez ${timeout}ms`);
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
}

// Funkcja do tworzenia zrzutu ekranu
function executeScreenshot(selector: string) {
  console.log(`Próba wykonania zrzutu ekranu dla: ${selector}`);
  
  // Informujemy skrypt tła o potrzebie wykonania zrzutu ekranu
  chrome.runtime.sendMessage({
    type: 'TAKE_SCREENSHOT',
    payload: {
      selector: selector
    }
  });
  
  return true;
}

import { showSuccess, showError, showInfo } from '../../common/notifications';
import { t } from '../../common/i18n';

// Główna funkcja do obsługi poleceń
function executeAction(action: string, params: any) {
  console.log(`Wykonywanie akcji: ${action} z parametrami:`, params);
  
  // Pokazujemy powiadomienie o rozpoczęciu akcji
  showInfo(t('notifications.actionStarted', { action: t(`actions.${action}`) }));
  
  let result = false;
  
  try {
    switch (action) {
      case 'click':
        result = executeClick(params);
        break;
      case 'type':
        if (typeof params === 'object' && params.text && params.selector) {
          result = executeType(params.selector, params.text);
        } else {
          console.error('Nieprawidłowe parametry dla akcji type');
          throw new Error('Nieprawidłowe parametry dla akcji type');
        }
        break;
      case 'navigate':
        result = executeNavigate(params);
        break;
      case 'automate':
        result = executeAutomate(params);
        break;
      case 'scroll':
        result = executeScroll(params);
        break;
      case 'drag':
        result = executeDrag(params);
        break;
      case 'wait':
        result = executeWait(params);
        break;
      case 'screenshot':
        result = executeScreenshot(params);
        break;
      default:
        console.error(`Nieznana akcja: ${action}`);
        throw new Error(`Nieznana akcja: ${action}`);
    }
    
    // Pokazujemy powiadomienie o sukcesie
    if (result) {
      showSuccess(t('notifications.actionCompleted', { action: t(`actions.${action}`) }));
    } else {
      showError(t('notifications.actionFailed', { action: t(`actions.${action}`), error: 'Akcja nie powiodła się' }));
    }
    
    return result;
  } catch (error) {
    // Pokazujemy powiadomienie o błędzie
    showError(t('notifications.actionFailed', { action: t(`actions.${action}`), error: error.message }));
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
