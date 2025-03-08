
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Testy integracyjne komend czatu', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    // Uruchom przeglądarkę z rozszerzeniem
    browser = await puppeteer.launch({
      headless: false, // Dla testowania rozszerzeń lepiej mieć widoczną przeglądarkę
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
    // Otwórz nową kartę dla każdego testu
    page = await browser.newPage();
    await page.goto('https://example.com');
    
    // Oczekuj na załadowanie strony
    await page.waitForSelector('body');
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Powinien wykryć polecenie /taxy na stronie', async () => {
    // Dodaj testowe pole tekstowe do strony
    await page.evaluate(() => {
      const input = document.createElement('textarea');
      input.id = 'test-input';
      document.body.appendChild(input);
      
      // Symulacja czatu
      const chatContainer = document.createElement('div');
      chatContainer.className = 'chat-container';
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message';
      messageDiv.textContent = '/taxy click #test-button';
      
      chatContainer.appendChild(messageDiv);
      document.body.appendChild(chatContainer);
      
      // Dodaj przycisk do testowania
      const button = document.createElement('button');
      button.id = 'test-button';
      button.textContent = 'Test Button';
      document.body.appendChild(button);
    });
    
    // Pozwól na załadowanie rozszerzenia i przechwycenie wiadomości
    await page.waitForTimeout(1000);
    
    // Symuluj kliknięcie przycisku, które powinno zostać przechwycone przez rozszerzenie
    const buttonClicked = await page.evaluate(() => {
      const event = new Event('DOMNodeInserted', { bubbles: true });
      document.querySelector('.message')?.dispatchEvent(event);
      
      // Daj czas na reakcję rozszerzenia
      return new Promise(resolve => {
        setTimeout(() => {
          // Sprawdź czy przycisk został kliknięty
          const wasClicked = document.querySelector('#test-button')?.getAttribute('data-clicked') === 'true';
          resolve(wasClicked);
        }, 2000);
      });
    });
    
    // Oczekujemy że komenda zostanie wykryta i przetworzona
    expect(buttonClicked).toBeTruthy();
  }, 10000); // Wydłużony timeout dla testu
  
  test('Powinien przetworzyć polecenie /taxy type', async () => {
    // Dodaj testowe elementy do strony
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'test-input-field';
      input.type = 'text';
      document.body.appendChild(input);
      
      // Symulacja czatu
      const chatContainer = document.createElement('div');
      chatContainer.className = 'chat-container';
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message';
      messageDiv.textContent = '/taxy type "Testowy tekst" in "#test-input-field"';
      
      chatContainer.appendChild(messageDiv);
      document.body.appendChild(chatContainer);
    });
    
    // Pozwól na załadowanie rozszerzenia i przechwycenie wiadomości
    await page.waitForTimeout(1000);
    
    // Symuluj wstawienie nowego elementu DOM, co powinno wywołać akcję
    await page.evaluate(() => {
      const event = new Event('DOMNodeInserted', { bubbles: true });
      document.querySelector('.message')?.dispatchEvent(event);
    });
    
    // Poczekaj na wykonanie akcji
    await page.waitForTimeout(2000);
    
    // Sprawdź czy tekst został wpisany
    const inputValue = await page.evaluate(() => {
      return (document.querySelector('#test-input-field') as HTMLInputElement)?.value;
    });
    
    expect(inputValue).toBe('Testowy tekst');
  }, 10000);
});
