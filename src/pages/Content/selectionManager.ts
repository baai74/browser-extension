
// Moduł do zarządzania wyborem obszarów na stronie
export interface SelectedArea {
  selector: string;
  element: HTMLElement | null;
  type: 'input' | 'output';
  name: string;
}

class SelectionManager {
  private selectedAreas: Map<string, SelectedArea> = new Map();
  private isSelectionMode: boolean = false;
  private currentSelectionType: 'input' | 'output' = 'input';
  private highlightOverlay: HTMLElement | null = null;

  constructor() {
    this.initOverlay();
  }

  private initOverlay() {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.border = '2px dashed #FF5722';
    overlay.style.backgroundColor = 'rgba(255, 87, 34, 0.2)';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    overlay.id = 'taxy-selection-overlay';
    document.body.appendChild(overlay);
    this.highlightOverlay = overlay;
  }

  public startSelectionMode(type: 'input' | 'output') {
    this.isSelectionMode = true;
    this.currentSelectionType = type;
    
    // Dodaj klase do body, żeby zmienić kursor
    document.body.classList.add('taxy-selection-mode');
    document.body.style.cursor = 'crosshair';
    
    // Dodaj komunikat dla użytkownika
    this.showSelectionMessage(`Wybierz obszar ${type === 'input' ? 'do wysyłania' : 'do odbierania'} wiadomości. Kliknij na element.`);
    
    // Dodaj tymczasowe nasłuchiwacze zdarzeń
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private showSelectionMessage(message: string) {
    let msgElement = document.getElementById('taxy-selection-message');
    if (!msgElement) {
      msgElement = document.createElement('div');
      msgElement.id = 'taxy-selection-message';
      msgElement.style.position = 'fixed';
      msgElement.style.top = '10px';
      msgElement.style.left = '50%';
      msgElement.style.transform = 'translateX(-50%)';
      msgElement.style.padding = '10px 15px';
      msgElement.style.backgroundColor = '#333';
      msgElement.style.color = 'white';
      msgElement.style.borderRadius = '4px';
      msgElement.style.zIndex = '10000';
      msgElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
      document.body.appendChild(msgElement);
    }
    
    msgElement.textContent = message;
    msgElement.style.display = 'block';
  }

  private hideSelectionMessage() {
    const msgElement = document.getElementById('taxy-selection-message');
    if (msgElement) {
      msgElement.style.display = 'none';
    }
  }

  private handleMouseOver = (event: MouseEvent) => {
    if (!this.isSelectionMode || !this.highlightOverlay) return;
    
    const target = event.target as HTMLElement;
    if (!target || target === this.highlightOverlay) return;
    
    const rect = target.getBoundingClientRect();
    
    this.highlightOverlay.style.display = 'block';
    this.highlightOverlay.style.top = `${rect.top}px`;
    this.highlightOverlay.style.left = `${rect.left}px`;
    this.highlightOverlay.style.width = `${rect.width}px`;
    this.highlightOverlay.style.height = `${rect.height}px`;
  }

  private handleClick = (event: MouseEvent) => {
    if (!this.isSelectionMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    if (!target || target === this.highlightOverlay) return;
    
    this.selectElement(target);
    this.stopSelectionMode();
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isSelectionMode) return;
    
    // Anuluj wybór przy naciśnięciu Escape
    if (event.key === 'Escape') {
      this.stopSelectionMode(true);
    }
  }

  private selectElement(element: HTMLElement) {
    // Generuj unikalny selektor CSS dla wybranego elementu
    const selector = this.generateSelector(element);
    
    const areaName = this.currentSelectionType === 'input' 
      ? 'Obszar wysyłania wiadomości' 
      : 'Obszar odbierania wiadomości';
    
    const area: SelectedArea = {
      selector,
      element,
      type: this.currentSelectionType,
      name: areaName
    };
    
    // Zapisz obszar
    this.selectedAreas.set(this.currentSelectionType, area);
    
    // Powiadom o wyborze
    chrome.runtime.sendMessage({
      type: 'AREA_SELECTED',
      payload: {
        type: this.currentSelectionType,
        selector: selector,
        name: areaName
      }
    });
    
    console.log(`Wybrano obszar ${this.currentSelectionType}:`, selector);
  }

  private generateSelector(element: HTMLElement): string {
    // Prosty algorytm generowania selektora
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Spróbuj użyć klasy, jeśli istnieje
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    // Użyj tagName i pozycji wśród rodzeństwa
    let selector = element.tagName.toLowerCase();
    if (element.parentElement) {
      const siblings = Array.from(element.parentElement.children);
      const index = siblings.indexOf(element) + 1;
      if (siblings.length > 1) {
        selector += `:nth-child(${index})`;
      }
    }
    
    return selector;
  }

  public stopSelectionMode(cancelled = false) {
    this.isSelectionMode = false;
    document.body.classList.remove('taxy-selection-mode');
    document.body.style.cursor = '';
    
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
    
    this.hideSelectionMessage();
    
    // Usuń nasłuchiwacze zdarzeń
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    if (cancelled) {
      console.log('Anulowano wybór obszaru');
    }
  }

  public getSelectedArea(type: 'input' | 'output'): SelectedArea | undefined {
    return this.selectedAreas.get(type);
  }

  public clearSelections() {
    this.selectedAreas.clear();
  }
}

// Eksportuj pojedynczą instancję
export const selectionManager = new SelectionManager();
export default selectionManager;
