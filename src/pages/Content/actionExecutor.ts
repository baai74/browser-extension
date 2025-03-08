// ActionExecutor handles execution of commands on the web page

type ActionType = 'click' | 'type' | 'navigate' | 'automate';

interface ActionPayload {
  action: ActionType;
  selector?: string;
  text?: string;
  instruction?: string;
}

/**
 * Wykonuje kliknięcie na elemencie określonym przez selektor CSS
 */
const executeClick = (selector: string) => {
  try {
    const element = document.querySelector(selector);
    if (element) {
      (element as HTMLElement).click();
      console.log(`Kliknięto element: ${selector}`);
      return true;
    } else {
      console.error(`Nie znaleziono elementu: ${selector}`);
      return false;
    }
  } catch (error) {
    console.error(`Błąd podczas klikania elementu ${selector}:`, error);
    return false;
  }
};

/**
 * Wpisuje tekst w pole określone przez selektor CSS
 */
const executeType = (selector: string, text: string) => {
  try {
    const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      element.focus();
      element.value = text;

      // Wyzwól zdarzenie input, aby powiadomić o zmianie wartości
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);

      console.log(`Wpisano tekst "${text}" w element: ${selector}`);
      return true;
    } else {
      console.error(`Nie znaleziono pola tekstowego: ${selector}`);
      return false;
    }
  } catch (error) {
    console.error(`Błąd podczas wpisywania tekstu w element ${selector}:`, error);
    return false;
  }
};

/**
 * Wykonuje złożoną automatyzację na podstawie instrukcji
 */
const executeAutomation = (instruction: string) => {
  // To jest bardziej złożona funkcja, która mogłaby analizować instrukcje w języku naturalnym
  // i wykonywać serię akcji. Na razie wyświetlamy tylko komunikat.
  console.log(`Wykonywanie automatyzacji na podstawie instrukcji: ${instruction}`);

  // Tu można dodać bardziej zaawansowaną logikę, np. wywołania API lub sekwencje akcji

  return true;
};

/**
 * Konfiguruje nasłuchiwanie komunikatów o akcjach do wykonania
 */
export const setupActionListener = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_ACTION') {
      const payload = message.payload as ActionPayload;
      console.log(`Otrzymano żądanie wykonania akcji: ${payload.action}`);

      let result = false;

      switch (payload.action) {
        case 'click':
          if (payload.selector) {
            result = executeClick(payload.selector);
          }
          break;
        case 'type':
          if (payload.selector && payload.text) {
            result = executeType(payload.selector, payload.text);
          }
          break;
        case 'automate':
          if (payload.instruction) {
            result = executeAutomation(payload.instruction);
          }
          break;
      }

      // Wyślij odpowiedź z wynikiem wykonania akcji
      sendResponse({ success: result });
    }

    // Zawsze zwracaj true dla asynchronicznych odpowiedzi
    return true;
  });

  console.log('Taxy AI: Action Executor initialized');
};