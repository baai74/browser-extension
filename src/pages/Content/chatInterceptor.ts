import { t, getCurrentLocale } from '../../common/i18n';
import { showSuccess, showError, showInfo } from '../../common/notifications';
import selectionManager from './selectionManager';

// Lista wspieranych platform czatowych
const SUPPORTED_PLATFORMS = {
  CHATGPT: 'chat.openai.com',
  BARD: 'bard.google.com',
  CLAUDE: 'claude.ai',
  PERPLEXITY: 'perplexity.ai',
};

// Prefiksy komend w różnych językach
const COMMAND_PREFIXES: Record<string, string[]> = {
  en: ['/taxy'],
  pl: ['/taxy', '/taksówka'],
};

// Pobierz aktualne prefiksy na podstawie języka
function getCommandPrefixes(): string[] {
  const locale = getCurrentLocale();
  return COMMAND_PREFIXES[locale] || COMMAND_PREFIXES.en;
}

// Sprawdź, czy tekst zawiera prefiks komendy
function hasCommandPrefix(text: string): boolean {
  const prefixes = getCommandPrefixes();
  return prefixes.some(prefix => text.trim().startsWith(prefix));
}

// Funkcja do identyfikacji platformy czatu
function identifyPlatform(): string {
  const hostname = window.location.hostname;

  for (const [platform, domain] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (hostname.includes(domain)) {
      return platform;
    }
  }

  return 'UNKNOWN';
}

// Funkcja do przetwarzania komendy
function processCommand(command: string, source: string): void {
  // Usuń prefiks komendy
  const prefixes = getCommandPrefixes();
  let commandWithoutPrefix = command;

  for (const prefix of prefixes) {
    if (command.startsWith(prefix)) {
      commandWithoutPrefix = command.substring(prefix.length).trim();
      break;
    }
  }

  // Podziel komendę na części
  const parts = commandWithoutPrefix.split(' ');
  const action = parts[0].toLowerCase();

  // Obsługa różnych akcji
  switch (action) {
    case 'click':
      if (parts.length >= 2) {
        const selector = parts.slice(1).join(' ');
        executeCommand('click', selector, source);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;

    case 'type':
      if (parts.length >= 3) {
        const selector = parts[1];
        const text = parts.slice(2).join(' ');
        executeCommand('type', { selector, text }, source);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;

    case 'navigate':
      if (parts.length >= 2) {
        const url = parts.slice(1).join(' ');
        executeCommand('navigate', url, source);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;

    case 'scroll':
      if (parts.length >= 2) {
        // Obsługa różnych wariantów przewijania
        if (parts[1] === 'to' && parts.length >= 3) {
          // /taxy scroll to element
          const selector = parts.slice(2).join(' ');
          executeCommand('scroll', { type: 'selector', selector }, source);
        } else if (parts.length >= 3 && !isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
          // /taxy scroll 100 200 (x, y)
          executeCommand('scroll', { 
            type: 'position', 
            x: parseInt(parts[1]), 
            y: parseInt(parts[2]) 
          }, source);
        } else {
          showError(t('chatCommands.invalidCommand'));
        }
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;

    case 'drag':
      if (parts.length >= 5 && parts[2] === 'to') {
        // /taxy drag #element to #target
        executeCommand('drag', {
          source: parts[1],
          target: parts.slice(3).join(' ')
        }, source);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;

    case 'wait':
      if (parts.length >= 2 && !isNaN(parseInt(parts[1]))) {
        // /taxy wait 1000
        executeCommand('wait', parseInt(parts[1]), source);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;

    case 'screenshot':
      if (parts.length >= 2) {
        // /taxy screenshot #element
        executeCommand('screenshot', parts.slice(1).join(' '), source);
      } else {
        // /taxy screenshot (całej strony)
        executeCommand('screenshot', 'body', source);
      }
      break;

    case 'automate':
      if (parts.length >= 2) {
        // /taxy automate wypełnij formularz danymi: Jan Kowalski, jan@example.com
        executeCommand('automate', parts.slice(1).join(' '), source);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;
    case 'test':
      if (parts.length >= 2) {
        const selector = parts.slice(1).join(' ');
        handleTestSelector(selector);
      } else {
        showError(t('chatCommands.invalidCommand'));
      }
      break;
    case 'help':
      // Wyświetl listę dostępnych komend
      showInfo(t('chatCommands.help'));
      break;

    default:
      showError(t('chatCommands.unknownCommand', { command: action }));
      break;
  }
}

// Funkcja do wykonania komendy
function executeCommand(action: string, params: any, source: string): void {
  console.log(`Wykonywanie akcji: ${action}`);

  // Pokaż powiadomienie o rozpoczęciu akcji
  showInfo(t('notifications.actionStarted', { action: t(`actions.${action}`) }));

  // Wysyłamy polecenie do skryptu tła
  chrome.runtime.sendMessage({
    type: 'CHAT_COMMAND',
    payload: {
      action,
      params,
      source
    }
  }, (response) => {
    // Obsługa odpowiedzi i pokazanie powiadomienia o zakończeniu
    if (response && response.success) {
      showSuccess(t('notifications.actionCompleted', { action: t(`actions.${action}`) }));
    } else {
      showError(t('notifications.actionFailed', { 
        action: t(`actions.${action}`), 
        error: response?.error || '' 
      }));
    }
  });
}

// Obserwator pola tekstowego dla różnych czatów AI
function setupChatObservers(): void {
  const platform = identifyPlatform();
  console.log(`Wykryto platformę czatu: ${platform}`);

  // Na podstawie platformy, obserwujemy różne elementy
  switch (platform) {
    case 'CHATGPT':
      observeChatGPT();
      break;
    case 'BARD':
      observeBard();
      break;
    case 'CLAUDE':
      observeClaude();
      break;
    case 'PERPLEXITY':
      observePerplexity();
      break;
    default:
      console.log('Nieznana platforma czatu, używam ogólnego obserwatora.');
      observeGenericChatInputs();
      break;
  }
}

// Obserwator dla ChatGPT
function observeChatGPT(): void {
  // Obserwuj główne pole tekstowe
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const textareaElement = document.querySelector('textarea[data-id="root"]');
        if (textareaElement) {
          checkForCommands(textareaElement as HTMLTextAreaElement, 'CHATGPT');
        }
      }
    }
  });

  // Obserwuj cały dokument, aby złapać moment, gdy pole tekstowe zostanie załadowane
  observer.observe(document.body, { childList: true, subtree: true });

  // Sprawdź istniejące pole tekstowe
  const textareaElement = document.querySelector('textarea[data-id="root"]');
  if (textareaElement) {
    checkForCommands(textareaElement as HTMLTextAreaElement, 'CHATGPT');
  }
}

// Obserwator dla Google Bard
function observeBard(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const textareaElement = document.querySelector('textarea[aria-label*="Prompt"]');
        if (textareaElement) {
          checkForCommands(textareaElement as HTMLTextAreaElement, 'BARD');
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const textareaElement = document.querySelector('textarea[aria-label*="Prompt"]');
  if (textareaElement) {
    checkForCommands(textareaElement as HTMLTextAreaElement, 'BARD');
  }
}

// Obserwator dla Claude
function observeClaude(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const textareaElement = document.querySelector('[contenteditable="true"]');
        if (textareaElement) {
          // Claude używa contenteditable zamiast textarea
          const text = textareaElement.textContent || '';
          if (hasCommandPrefix(text)) {
            processCommand(text, 'CLAUDE');
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const textareaElement = document.querySelector('[contenteditable="true"]');
  if (textareaElement) {
    const text = textareaElement.textContent || '';
    if (hasCommandPrefix(text)) {
      processCommand(text, 'CLAUDE');
    }
  }
}

// Obserwator dla Perplexity
function observePerplexity(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const textareaElement = document.querySelector('textarea[placeholder*="Ask"]');
        if (textareaElement) {
          checkForCommands(textareaElement as HTMLTextAreaElement, 'PERPLEXITY');
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const textareaElement = document.querySelector('textarea[placeholder*="Ask"]');
  if (textareaElement) {
    checkForCommands(textareaElement as HTMLTextAreaElement, 'PERPLEXITY');
  }
}

// Ogólny obserwator dla pól tekstowych
function observeGenericChatInputs(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Szukaj wszystkich pól tekstowych na stronie
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          checkForCommands(textarea, 'GENERIC');
        });

        // Szukaj contenteditable divów
        const editables = document.querySelectorAll('[contenteditable="true"]');
        editables.forEach(editable => {
          const text = editable.textContent || '';
          if (hasCommandPrefix(text)) {
            processCommand(text, 'GENERIC');
          }
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Sprawdź istniejące pola tekstowe
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    checkForCommands(textarea, 'GENERIC');
  });

  // Sprawdź istniejące contenteditable divy
  const editables = document.querySelectorAll('[contenteditable="true"]');
  editables.forEach(editable => {
    const text = editable.textContent || '';
    if (hasCommandPrefix(text)) {
      processCommand(text, 'GENERIC');
    }
  });
}

// Funkcja sprawdzająca, czy pole tekstowe zawiera komendę
function checkForCommands(textarea: HTMLTextAreaElement, source: string): void {
  // Aktualna wartość textarea
  let currentValue = textarea.value;

  // Monitoruj zmiany w textarea
  textarea.addEventListener('input', () => {
    const newValue = textarea.value;

    // Jeśli w nowej wartości jest komenda
    if (hasCommandPrefix(newValue)) {
      currentValue = newValue;

      // Dodaj obsługę naciśnięcia Enter, aby wykonać komendę
      textarea.addEventListener('keydown', function commandListener(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          // Zatrzymaj domyślną akcję (wysłanie formularza)
          event.preventDefault();

          // Wykonaj komendę
          processCommand(currentValue, source);

          // Wyczyść pole tekstowe
          textarea.value = '';

          // Usuwamy nasłuchiwacz, aby nie duplikować wykonania komendy
          textarea.removeEventListener('keydown', commandListener);
        }
      });
    }
  });
}

// Inicjalizacja obserwatorów po załadowaniu strony
function initChatInterceptor(): void {
  console.log('Inicjalizacja interceptora czatu Taxy AI');
  setupChatObservers();

  // Pokaż komunikat powitalny
  showInfo('Taxy AI Chat Interceptor aktywny. Użyj /taxy help, aby zobaczyć dostępne komendy.');
}

// Eksportujemy funkcję inicjalizującą
export { initChatInterceptor };


// Funkcja do debugowania selektorów CSS na danej stronie
async function handleTestSelector(selector: string) {
  if (!selector || selector.trim() === '') {
    console.error('Błąd: Nie podano selektora CSS do testowania');
    return { success: false, message: 'Nie podano selektora CSS' };
  }

  try {
    const { testCSSSelector, highlightElements } = await import('./actionExecutor');
    const result = testCSSSelector(selector);

    if (result.success) {
      highlightElements(selector, 3000);
      console.log(`Test selektora CSS: ${selector}`);
      console.log(`Znaleziono ${result.count} elementów pasujących do selektora`);
    } else {
      console.error(`Test selektora CSS nieudany: ${result.errorMessage}`);
    }

    // Wyślij wynik do skryptu tła, aby mógł być wyświetlony w UI
    chrome.runtime.sendMessage({
      type: 'TEST_SELECTOR_RESULT',
      payload: {
        selector,
        result
      }
    });
    return { success: true, message: `Testowanie selektora: ${selector}` };
  } catch (error) {
    console.error("Błąd podczas importowania actionExecutor:", error);
    return { success: false, message: "Błąd podczas testowania selektora" };
  }
}

// Obsługa komend z czatów AI
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // Sprawdź czy znajdujemy się w polu tekstowym lub obszarze tekstowym
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      setTimeout(() => {
        interceptChatCommand();
      }, 100);
    }
  }
});

function interceptChatCommand() {
    //  This function needs to be implemented based on the actual implementation details.  
    //  It would likely involve getting the text from the active input, checking for prefixes, 
    //  and calling processCommand.  This is a placeholder.
}

// Implementacja interceptora czatu dla różnych platform
export class ChatInterceptor {
  private initialized: boolean = false;
  private platform: string = 'unknown';
  private customInputSelector: string | null = null;
  private customOutputSelector: string | null = null;

  constructor() {
    this.detectPlatform();
  }

  private detectPlatform() {
    const url = window.location.href;

    if (url.includes('chat.openai.com')) {
      this.platform = 'chatgpt';
    } else if (url.includes('bard.google.com')) {
      this.platform = 'bard';
    } else {
      this.platform = 'unknown';
    }

    console.log(`Wykryto platformę czatu: ${this.platform}`);
  }

  public initialize() {
    if (this.initialized) return;

    this.setupInterception();
    this.initialized = true;

    // Wczytaj zapisane selektory z pamięci
    this.loadSavedSelectors();

    console.log('Interceptor czatu zainicjalizowany');
  }

  private loadSavedSelectors() {
    chrome.storage.local.get(['customInputSelector', 'customOutputSelector'], (result) => {
      if (result.customInputSelector) {
        this.customInputSelector = result.customInputSelector;
        console.log('Wczytano niestandardowy selektor dla pola wprowadzania:', this.customInputSelector);
      }

      if (result.customOutputSelector) {
        this.customOutputSelector = result.customOutputSelector;
        console.log('Wczytano niestandardowy selektor dla obszaru odpowiedzi:', this.customOutputSelector);
      }
    });
  }

  private setupInterception() {
    // Obserwacja wprowadzanych komend w polu tekstowym
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Nasłuchuj wiadomości o wybraniu obszaru
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'START_AREA_SELECTION') {
        selectionManager.startSelectionMode(message.payload.type);
      } else if (message.type === 'AREA_SELECTED') {
        if (message.payload.type === 'input') {
          this.customInputSelector = message.payload.selector;
          chrome.storage.local.set({ 'customInputSelector': message.payload.selector });
        } else if (message.payload.type === 'output') {
          this.customOutputSelector = message.payload.selector;
          chrome.storage.local.set({ 'customOutputSelector': message.payload.selector });
        }
      }
    });
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        // Sprawdź czy znajdujemy się w polu tekstowym lub obszarze tekstowym
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
          setTimeout(() => {
            this.interceptChatCommand();
          }, 100);
        }
    }
  }
    private interceptChatCommand() {
        let inputElement: HTMLElement | null = null;
        if (this.customInputSelector) {
          inputElement = document.querySelector(this.customInputSelector);
        } else {
          inputElement = document.activeElement as HTMLElement;
        }

        if (inputElement && inputElement.tagName === 'TEXTAREA' || inputElement.tagName === 'INPUT') {
          const currentValue = (inputElement.tagName === 'TEXTAREA') ? (inputElement as HTMLTextAreaElement).value : (inputElement as HTMLInputElement).value;
          if (hasCommandPrefix(currentValue)) {
            processCommand(currentValue, this.platform);
            if (inputElement.tagName === 'TEXTAREA') {
              (inputElement as HTMLTextAreaElement).value = '';
            } else {
              (inputElement as HTMLInputElement).value = '';
            }
          }
        }
    }
}

export {ChatInterceptor};