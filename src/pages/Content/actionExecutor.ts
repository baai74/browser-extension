
// ActionExecutor handles execution of commands on the web page

// Function to find element by selector or text content
const findElement = (selector: string): Element | null => {
  try {
    // Try direct selector first
    let element = document.querySelector(selector);
    
    // If not found, try finding by text content
    if (!element) {
      const allElements = document.querySelectorAll('a, button, input, [role="button"]');
      for (const el of Array.from(allElements)) {
        if (el.textContent?.trim().includes(selector)) {
          element = el;
          break;
        }
      }
    }
    
    return element;
  } catch (error) {
    console.error('Error finding element:', error);
    return null;
  }
};

// Click on an element
export const clickElement = (selector: string): boolean => {
  const element = findElement(selector);
  if (!element) {
    console.error(`Element not found: ${selector}`);
    return false;
  }
  
  try {
    // Create and dispatch mouse events for more natural behavior
    const mouseDown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    const mouseUp = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    element.dispatchEvent(mouseDown);
    element.dispatchEvent(mouseUp);
    element.dispatchEvent(click);
    
    return true;
  } catch (error) {
    console.error('Error clicking element:', error);
    return false;
  }
};

// Type text into an input field
export const typeIntoElement = (selector: string, text: string): boolean => {
  const element = findElement(selector) as HTMLInputElement;
  if (!element || !('value' in element)) {
    console.error(`Input element not found: ${selector}`);
    return false;
  }
  
  try {
    // Focus the element
    element.focus();
    
    // Clear existing value
    element.value = '';
    
    // Trigger input event for reactivity
    const inputEvent = new Event('input', {
      bubbles: true,
      cancelable: true
    });
    
    // Set the new value
    element.value = text;
    element.dispatchEvent(inputEvent);
    
    // Trigger change event
    const changeEvent = new Event('change', {
      bubbles: true
    });
    element.dispatchEvent(changeEvent);
    
    return true;
  } catch (error) {
    console.error('Error typing into element:', error);
    return false;
  }
};

// Handle action execution from messages
export const setupActionListener = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_ACTION') {
      const { action, selector, text } = message.payload;
      
      let result = false;
      if (action === 'click') {
        result = clickElement(selector);
      } else if (action === 'type') {
        result = typeIntoElement(selector, text);
      }
      
      sendResponse({ success: result });
    }
    
    return true; // Keep the message channel open for async response
  });
};
