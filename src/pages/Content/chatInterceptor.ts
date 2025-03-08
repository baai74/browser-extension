
import { t, getCurrentLocale } from '../../common/i18n';
import { showSuccess, showError, showInfo } from '../../common/notifications';

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
