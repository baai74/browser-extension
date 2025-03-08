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

// Funkcja do przetwarzania poleceń
function processCommand(command: string, source: string) {
  // Zaawansowany parser poleceń
  // Format: /taxy [akcja] [parametry]

  // Usuń zbędne białe znaki i podział na części
  const normalizedCommand = command.trim();

  // Sprawdzamy, czy polecenie jest w formacie z nawiasami kwadratowymi lub cudzysłowami
  let action: string;
  let params: any;

  // Regex do wyodrębnienia akcji i parametrów z różnych formatów
  const bracketFormat = /\/taxy\s+([a-zA-Z]+)\s+\[(.*?)\]/; // Format: /taxy akcja [parametr]
  const quoteFormat = /\/taxy\s+([a-zA-Z]+)\s+"(.*?)"/;     // Format: /taxy akcja "parametr"
  const jsonFormat = /\/taxy\s+([a-zA-Z]+)\s+(\{.*\})/;     // Format: /taxy akcja {json}
  const simpleFormat = /\/taxy\s+([a-zA-Z]+)(?:\s+(.*))?/;  // Format: /taxy akcja parametry

  let match;
  let paramString = '';

  if ((match = bracketFormat.exec(normalizedCommand)) !== null) {
    action = match[1];
    paramString = match[2];
  } else if ((match = quoteFormat.exec(normalizedCommand)) !== null) {
    action = match[1];
    paramString = match[2];
  } else if ((match = jsonFormat.exec(normalizedCommand)) !== null) {
    action = match[1];
    try {
      params = JSON.parse(match[2]);
    } catch (e) {
      console.error('Błąd parsowania parametrów JSON:', e);
      return;
    }
  } else if ((match = simpleFormat.exec(normalizedCommand)) !== null) {
    action = match[1];
    paramString = match[2] || '';
  } else {
    console.error('Nieprawidłowy format polecenia Taxy');
    return;
  }

  // Jeśli nie mamy jeszcze params (nie był to format JSON), przetwarzamy paramString
  if (!params) {
    // Przetwarzamy parametry w zależności od rodzaju akcji
    switch (action) {
      case 'click':
        params = paramString.trim(); // Selektor CSS
        break;
      case 'type':
        // Sprawdzamy, czy mamy format "selektor|tekst"
        if (paramString.includes('|')) {
          const [selector, text] = paramString.split('|', 2);
          params = {
            selector: selector.trim(),
            text: text.trim()
          };
        } else {
          // Zakładamy, że pierwszy argument to selektor, a reszta to tekst
          const parts = paramString.trim().split(' ');
          params = {
            selector: parts[0],
            text: parts.slice(1).join(' ')
          };
        }
        break;
      case 'navigate':
        params = paramString.trim(); // URL
        break;
      case 'automate':
        params = paramString.trim(); // Pełna instrukcja
        break;
      case 'scroll':
        // Obsługa przewijania strony
        // Format: scroll top|bottom|selector|x,y
        if (paramString === 'top') {
          params = { type: 'position', x: 0, y: 0 };
        } else if (paramString === 'bottom') {
          params = { type: 'position', x: 0, y: document.body.scrollHeight };
        } else if (paramString.includes(',')) {
          const [x, y] = paramString.split(',').map(coord => parseInt(coord.trim()));
          params = { type: 'position', x, y };
        } else {
          params = { type: 'selector', selector: paramString.trim() };
        }
        break;
      case 'drag':
        // Obsługa przeciągania
        // Format: drag sourceSelector targetSelector
        const [sourceSelector, targetSelector] = paramString.split('|').map(s => s.trim());
        if (!targetSelector) {
          console.error('Nieprawidłowy format dla akcji drag. Użyj: /taxy drag sourceSelector|targetSelector');
          return;
        }
        params = { source: sourceSelector, target: targetSelector };
        break;
      case 'wait':
        // Obsługa czekania
        // Format: wait 1000 (w milisekundach)
        const waitTime = parseInt(paramString.trim());
        if (isNaN(waitTime)) {
          console.error('Nieprawidłowy format dla akcji wait. Użyj: /taxy wait [czas_w_ms]');
          return;
        }
        params = waitTime;
        break;
      case 'screenshot':
        // Obsługa zrzutu ekranu
        // Format: screenshot [optional: selector]
        params = paramString.trim() || 'full'; // Jeśli brak selektora, zrzut całej strony
        break;
      default:
        console.error(`Nieznana akcja: ${action}`);
        return;
    }
  }

  // Wysyłamy polecenie do skryptu tła
  chrome.runtime.sendMessage({
    type: 'CHAT_COMMAND',
    payload: {
      action,
      params,
      source
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