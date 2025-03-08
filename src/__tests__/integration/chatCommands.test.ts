
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
    });

    // Symuluj wpisanie komendy
    await page.type('#test-input', '/taxy click #test-button');
    
    // Naciśnij Enter (normalne zachowanie na chatach)
    await page.keyboard.press('Enter');
    
    // Sprawdź czy komenda została przechwycona - możemy sprawdzić wartość pola
    // która powinna być pusta po przechwyceniu komendy przez rozszerzenie
    const inputValue = await page.evaluate(() => {
      return (document.querySelector('#test-input') as HTMLTextAreaElement).value;
    });
    
    expect(inputValue).toBe('');
    
    // Możemy też dodać timeout by dać rozszerzeniu czas na przetworzenie
    await page.waitForTimeout(500);
  });

  test('Powinien wykonać akcję kliknięcia po poleceniu /taxy click', async () => {
    // Dodaj testowy przycisk do strony
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.textContent = 'Test Button';
      button.onclick = function() {
        document.body.dataset.clicked = 'true';
      };
      document.body.appendChild(button);
      
      const input = document.createElement('textarea');
      input.id = 'test-input';
      document.body.appendChild(input);
    });

    // Symuluj wpisanie komendy kliknięcia
    await page.type('#test-input', '/taxy click #test-button');
    await page.keyboard.press('Enter');
    
    // Daj czas na wykonanie akcji
    await page.waitForTimeout(1000);
    
    // Sprawdź czy przycisk został kliknięty
    const wasClicked = await page.evaluate(() => {
      return document.body.dataset.clicked === 'true';
    });
    
    expect(wasClicked).toBe(true);
  });
});
