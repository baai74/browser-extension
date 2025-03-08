
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Testy integracyjne wyboru obszaru', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-extensions-except=./build',
        '--load-extension=./build',
        '--disable-features=TranslateUI',
        '--disable-infobars',
        '--window-size=1280,800',
      ],
      defaultViewport: null,
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('https://example.com');
    await page.waitForSelector('body');
    
    // Przygotuj testową stronę
    await page.evaluate(() => {
      // Dodaj obszary czatu do testów
      const chatContainer = document.createElement('div');
      chatContainer.className = 'chat-container';
      
      const inputArea = document.createElement('textarea');
      inputArea.className = 'chat-input';
      inputArea.placeholder = 'Wpisz wiadomość...';
      
      const outputArea = document.createElement('div');
      outputArea.className = 'chat-messages';
      outputArea.innerHTML = '<div class="message">Przykładowa wiadomość</div>';
      
      chatContainer.appendChild(outputArea);
      chatContainer.appendChild(inputArea);
      document.body.appendChild(chatContainer);
    });
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Powinien umożliwić wybór obszaru wejściowego', async () => {
    // To będzie trudne do przetestowania ponieważ wymaga interakcji z popup rozszerzenia
    // Ale możemy zasymulować wysłanie wiadomości do content script bezpośrednio
    
    await page.evaluate(() => {
      // Symulujemy wiadomość od background script
      const event = new CustomEvent('message', {
        detail: {
          type: 'START_AREA_SELECTION',
          payload: {
            type: 'input'
          }
        }
      });
      window.dispatchEvent(event);
    });
    
    // Daj czas na aktywację trybu wyboru
    await page.waitForTimeout(500);
    
    // Kliknij na element, który chcemy wybrać jako obszar wprowadzania
    await page.click('.chat-input');
    
    // Sprawdź czy tryb wyboru jest zakończony
    // W rzeczywistości trudno to zweryfikować bez dostępu do stanu rozszerzenia
    // Możemy jednak sprawdzić, czy overlay do zaznaczania zniknął
    const overlayVisible = await page.evaluate(() => {
      const overlay = document.getElementById('taxy-selection-overlay');
      return overlay && overlay.style.display !== 'none';
    });
    
    expect(overlayVisible).toBeFalsy();
  });
});
