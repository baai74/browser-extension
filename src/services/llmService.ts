
// Interfejs dla odpowiedzi z modelu językowego
export interface LLMResponse {
  text: string;
  actions?: Array<{
    type: 'click' | 'setValue' | 'navigate' | 'automate' | 'wait' | 'scroll';
    selector?: string;
    value?: string;
    url?: string;
    duration?: number;
  }>;
  isComplete: boolean;
  error?: string;
}

// Klasa obsługująca komunikację z OpenAI
export class LLMService {
  private apiKey: string | null = null;
  private modelName: string = 'gpt-3.5-turbo';
  
  constructor(apiKey?: string, modelName?: string) {
    if (apiKey) this.apiKey = apiKey;
    if (modelName) this.modelName = modelName;
    
    // Spróbuj pobrać klucz API z pamięci
    this.loadApiKey();
  }
  
  // Metoda do ustawiania klucza API
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    // Zapisz klucz API w pamięci
    chrome.storage.local.set({ 'openai_api_key': apiKey });
  }
  
  // Metoda do ustawiania modelu
  public setModel(modelName: string): void {
    this.modelName = modelName;
  }
  
  // Metoda do wczytywania klucza API z pamięci
  private async loadApiKey(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get('openai_api_key', (result) => {
        if (result.openai_api_key) {
          this.apiKey = result.openai_api_key;
        }
        resolve();
      });
    });
  }
  
  // Metoda do sprawdzania, czy klucz API jest ustawiony
  public hasApiKey(): boolean {
    return !!this.apiKey;
  }
  
  // Metoda do wysyłania zapytania do API OpenAI
  public async processInstruction(
    instruction: string, 
    dom: string, 
    previousActions: string[] = []
  ): Promise<LLMResponse> {
    if (!this.apiKey) {
      return {
        text: 'Brak klucza API. Proszę skonfigurować klucz API OpenAI w ustawieniach.',
        isComplete: true,
        error: 'Brak klucza API'
      };
    }
    
    try {
      const systemPrompt = `
        Jesteś asystentem Taxy AI, który pomaga wykonywać akcje w przeglądarce.
        Twoim zadaniem jest analizowanie struktury DOM strony i wykonywanie akcji, które pozwolą
        zrealizować instrukcje użytkownika. Możesz korzystać z następujących akcji:
        1. click(id) - kliknij element o podanym id
        2. setValue(id, text) - ustaw wartość elementu o podanym id na podany tekst
        3. navigate(url) - przejdź do podanego URL
        4. wait(ms) - poczekaj określoną liczbę milisekund
        5. scroll(direction, amount) - przewiń stronę w określonym kierunku o określoną ilość
        
        Oto uproszczona reprezentacja DOM strony:
        ${dom}
        
        Oto historia dotychczasowych akcji:
        ${previousActions.join('\n')}
      `;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: instruction }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd API: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parsowanie odpowiedzi w celu wyodrębnienia akcji
      const actions = this.parseActions(content);
      
      return {
        text: content,
        actions: actions,
        isComplete: content.toLowerCase().includes('task complete') || 
                   content.toLowerCase().includes('zadanie zakończone')
      };
      
    } catch (error) {
      console.error('Błąd podczas przetwarzania instrukcji:', error);
      return {
        text: error instanceof Error ? error.message : 'Nieznany błąd',
        isComplete: true,
        error: error instanceof Error ? error.message : 'Nieznany błąd'
      };
    }
  }
  
  // Parsowanie odpowiedzi w celu wyodrębnienia akcji
  private parseActions(content: string): Array<any> {
    const actions = [];
    
    // Wzorce regexp do wykrywania akcji
    const patterns = [
      {
        type: 'click',
        regex: /click\(['"]([^'"]+)['"]\)/g,
        extract: (matches: RegExpExecArray) => ({ type: 'click', selector: matches[1] })
      },
      {
        type: 'setValue',
        regex: /setValue\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g,
        extract: (matches: RegExpExecArray) => ({ 
          type: 'setValue', 
          selector: matches[1],
          value: matches[2]
        })
      },
      {
        type: 'navigate',
        regex: /navigate\(['"]([^'"]+)['"]\)/g,
        extract: (matches: RegExpExecArray) => ({ type: 'navigate', url: matches[1] })
      },
      {
        type: 'wait',
        regex: /wait\((\d+)\)/g,
        extract: (matches: RegExpExecArray) => ({ type: 'wait', duration: parseInt(matches[1]) })
      },
      {
        type: 'scroll',
        regex: /scroll\(['"]([^'"]+)['"],\s*(\d+)\)/g,
        extract: (matches: RegExpExecArray) => ({ 
          type: 'scroll', 
          direction: matches[1],
          amount: parseInt(matches[2])
        })
      }
    ];
    
    // Wyszukaj wszystkie akcje w tekście
    for (const pattern of patterns) {
      let matches;
      const regex = new RegExp(pattern.regex);
      while ((matches = regex.exec(content)) !== null) {
        actions.push(pattern.extract(matches));
      }
    }
    
    return actions;
  }
}

// Eksportuj instancję
export default new LLMService();
