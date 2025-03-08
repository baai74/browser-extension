
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
  
  test('Powinien umożliwiać wybór obszaru do wysyłania wiadomości', async () => {
    // Zasymuluj otwarcie popupu rozszerzenia (to jest uproszczone w teście)
    const extensionId = await getExtensionId(browser);
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Kliknij przycisk wyboru obszaru w popupie
    await popupPage.waitForSelector('#select-input-area-button');
    await popupPage.click('#select-input-area-button');
    
    // Poczekaj na załadowanie narzędzia wyboru
    await page.waitForTimeout(1000);
    
    // Symuluj kliknięcie w obszar czatu input
    await page.waitForSelector('.chat-input');
    await page.click('.chat-input');
    
    // Sprawdź czy selektor został zapisany (uproszczone w teście)
    await page.waitForTimeout(1000);
    const selectorSaved = await page.evaluate(() => {
      return localStorage.getItem('customInputSelector') !== null;
    });
    
    expect(selectorSaved).toBeTruthy();
    
    await popupPage.close();
  }, 15000);
  
  test('Powinien umożliwiać wybór obszaru do odbierania wiadomości', async () => {
    // Zasymuluj otwarcie popupu rozszerzenia (to jest uproszczone w teście)
    const extensionId = await getExtensionId(browser);
    const popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Kliknij przycisk wyboru obszaru w popupie
    await popupPage.waitForSelector('#select-output-area-button');
    await popupPage.click('#select-output-area-button');
    
    // Poczekaj na załadowanie narzędzia wyboru
    await page.waitForTimeout(1000);
    
    // Symuluj kliknięcie w obszar chat-messages
    await page.waitForSelector('.chat-messages');
    await page.click('.chat-messages');
    
    // Sprawdź czy selektor został zapisany (uproszczone w teście)
    await page.waitForTimeout(1000);
    const selectorSaved = await page.evaluate(() => {
      return localStorage.getItem('customOutputSelector') !== null;
    });
    
    expect(selectorSaved).toBeTruthy();
    
    await popupPage.close();
  }, 15000);
});

// Helper do uzyskania ID rozszerzenia
async function getExtensionId(browser: Browser): Promise<string> {
  const page = await browser.newPage();
  await page.goto('chrome://extensions');
  
  // Uproszczona implementacja - w rzeczywistym teście należałoby użyć bardziej
  // zaawansowanej metody uzyskania ID rozszerzenia
  const extensionId = 'dummyExtensionId';
  await page.close();
  return extensionId;
}
