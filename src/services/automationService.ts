
/**
 * Serwis do automatyzacji działań w przeglądarce
 */
export class AutomationService {
  // Funkcja do kliknięcia w element
  public async clickElement(selector: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          resolve(false);
          return;
        }
        
        chrome.tabs.sendMessage(
          tabs[0].id as number, 
          { 
            type: 'EXECUTE_ACTION', 
            payload: { 
              action: 'click', 
              selector 
            } 
          }, 
          (response) => {
            resolve(response?.success || false);
          }
        );
      });
    });
  }
  
  // Funkcja do wprowadzania tekstu do elementu
  public async typeText(selector: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          resolve(false);
          return;
        }
        
        chrome.tabs.sendMessage(
          tabs[0].id as number, 
          { 
            type: 'EXECUTE_ACTION', 
            payload: { 
              action: 'type', 
              selector,
              text 
            } 
          }, 
          (response) => {
            resolve(response?.success || false);
          }
        );
      });
    });
  }
  
  // Funkcja do przewijania strony
  public async scrollPage(direction: 'up' | 'down' | 'left' | 'right', amount: number): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          resolve(false);
          return;
        }
        
        chrome.tabs.sendMessage(
          tabs[0].id as number, 
          { 
            type: 'EXECUTE_ACTION', 
            payload: { 
              action: 'scroll', 
              direction,
              amount
            } 
          }, 
          (response) => {
            resolve(response?.success || false);
          }
        );
      });
    });
  }
  
  // Funkcja do nawigacji do URL
  public async navigateTo(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          resolve(false);
          return;
        }
        
        // Dodaj protokół HTTP jeśli nie został podany
        if (!url.startsWith('http') && !url.startsWith('https')) {
          url = 'https://' + url;
        }
        
        chrome.tabs.update(tabs[0].id as number, { url }, () => {
          if (chrome.runtime.lastError) {
            console.error('Błąd podczas nawigacji:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    });
  }
  
  // Funkcja do zrobienia zrzutu ekranu
  public async takeScreenshot(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Błąd podczas wykonywania zrzutu ekranu:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(dataUrl);
        }
      });
    });
  }
  
  // Funkcja do oczekiwania określonego czasu
  public async wait(ms: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, ms);
    });
  }
  
  // Funkcja do wykonania sekwencji akcji
  public async executeSequence(actions: Array<any>): Promise<boolean> {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          await this.clickElement(action.selector);
          break;
        case 'setValue':
          await this.typeText(action.selector, action.value);
          break;
        case 'navigate':
          await this.navigateTo(action.url);
          break;
        case 'wait':
          await this.wait(action.duration);
          break;
        case 'scroll':
          await this.scrollPage(action.direction, action.amount);
          break;
        default:
          console.warn('Nieznany typ akcji:', action.type);
      }
    }
    
    return true;
  }
}

// Eksportuj instancję
export default new AutomationService();
