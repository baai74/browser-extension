
/**
 * Narzędzia do debugowania i testowania rozszerzenia na dynamicznych stronach
 */

// Monitorowanie zmian w DOM
export function monitorDOMChanges(selector: string, callback: (elements: NodeList) => void): { stop: () => void } {
  let observer: MutationObserver | null = null;
  
  const checkForElements = () => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      callback(elements);
    }
  };
  
  // Natychmiastowe sprawdzenie
  checkForElements();
  
  // Skonfiguruj obserwator zmian
  observer = new MutationObserver((mutations) => {
    checkForElements();
  });
  
  // Rozpocznij obserwację całego dokumentu z konfiguracją do śledzenia zmian
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  
  // Zwróć funkcję zatrzymującą obserwację
  return {
    stop: () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  };
}

// Pomoc w budowaniu odpornych selektorów
export function buildRobustSelector(element: HTMLElement): string {
  const selectors: string[] = [];
  
  // Spróbuj ID
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Spróbuj data atrybuty
  const dataAttributes = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .map(attr => `[${attr.name}="${attr.value}"]`);
    
  if (dataAttributes.length > 0) {
    selectors.push(`${element.tagName.toLowerCase()}${dataAttributes.join('')}`);
  }
  
  // Spróbuj klasy
  if (element.classList.length > 0) {
    const classSelector = `.${Array.from(element.classList).join('.')}`;
    selectors.push(classSelector);
  }
  
  // Spróbuj tekst wewnętrzny dla przycisków i linków
  if ((element.tagName === 'BUTTON' || element.tagName === 'A') && element.textContent?.trim()) {
    selectors.push(`${element.tagName.toLowerCase()}:contains("${element.textContent.trim()}")`);
  }
  
  // Połącz z indeksem rodzica jako plan awaryjny
  if (element.parentElement) {
    const siblings = Array.from(element.parentElement.children);
    const index = siblings.indexOf(element);
    if (index !== -1) {
      selectors.push(`${element.tagName.toLowerCase()}:nth-child(${index + 1})`);
    }
  }
  
  return selectors.join(', ');
}

// Weryfikacja widoczności elementu
export function isElementVisible(element: HTMLElement): boolean {
  if (!element.offsetParent && element.offsetWidth === 0 && element.offsetHeight === 0) {
    return false;
  }
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
    return false;
  }
  
  // Sprawdzamy, czy element jest w widocznym obszarze
  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0
  );
}

// Analiza dynamicznych zmian strony
export function analyzeDynamicChanges(duration: number = 5000): Promise<{ addedElements: Element[], removedElements: Element[] }> {
  return new Promise((resolve) => {
    const addedElements: Element[] = [];
    const removedElements: Element[] = [];
    
    // Obserwator dodanych elementów
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              addedElements.push(node as Element);
            }
          });
          
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              removedElements.push(node as Element);
            }
          });
        }
      });
    });
    
    // Rozpocznij obserwację
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // Zakończ obserwację po określonym czasie
    setTimeout(() => {
      observer.disconnect();
      resolve({ addedElements, removedElements });
    }, duration);
  });
}
