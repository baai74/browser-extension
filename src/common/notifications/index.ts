
import { t } from '../i18n';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number; // czas w ms, jak długo powiadomienie ma być widoczne
  timestamp: number;
}

// Lista aktywnych powiadomień
const activeNotifications: Notification[] = [];

// Maksymalna liczba powiadomień wyświetlanych jednocześnie
const MAX_NOTIFICATIONS = 5;

// Domyślny czas wyświetlania powiadomienia (3 sekundy)
const DEFAULT_DURATION = 3000;

// Funkcja do tworzenia powiadomienia
export function createNotification(
  type: NotificationType,
  message: string,
  duration = DEFAULT_DURATION
): Notification {
  const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const notification: Notification = {
    id,
    type,
    message,
    duration,
    timestamp: Date.now(),
  };

  // Dodaj powiadomienie do listy aktywnych
  activeNotifications.push(notification);

  // Ogranicz liczbę wyświetlanych powiadomień
  while (activeNotifications.length > MAX_NOTIFICATIONS) {
    const oldest = activeNotifications.shift();
    if (oldest) {
      removeNotificationElement(oldest.id);
    }
  }

  // Utwórz i wyświetl powiadomienie w DOM
  createNotificationElement(notification);

  // Usuń powiadomienie po określonym czasie
  if (duration !== Infinity) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }

  return notification;
}

// Funkcje pomocnicze dla typów powiadomień
export function showSuccess(message: string, duration = DEFAULT_DURATION): Notification {
  return createNotification('success', message, duration);
}

export function showError(message: string, duration = DEFAULT_DURATION): Notification {
  return createNotification('error', message, duration);
}

export function showWarning(message: string, duration = DEFAULT_DURATION): Notification {
  return createNotification('warning', message, duration);
}

export function showInfo(message: string, duration = DEFAULT_DURATION): Notification {
  return createNotification('info', message, duration);
}

// Funkcja usuwająca powiadomienie
export function removeNotification(id: string): boolean {
  const index = activeNotifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    activeNotifications.splice(index, 1);
    removeNotificationElement(id);
    return true;
  }
  return false;
}

// Funkcja tworząca element powiadomienia w DOM
function createNotificationElement(notification: Notification): void {
  // Sprawdź, czy kontener powiadomień istnieje, jeśli nie - utwórz go
  let container = document.getElementById('taxy-notifications-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'taxy-notifications-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }

  // Utwórz element powiadomienia
  const element = document.createElement('div');
  element.id = notification.id;
  element.classList.add('taxy-notification');
  element.classList.add(`taxy-notification-${notification.type}`);
  element.style.padding = '12px 20px';
  element.style.borderRadius = '4px';
  element.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'space-between';
  element.style.minWidth = '300px';
  element.style.maxWidth = '400px';
  element.style.animation = 'taxy-fade-in 0.3s ease-in-out';

  // Ustawienie tła w zależności od typu powiadomienia
  switch (notification.type) {
    case 'success':
      element.style.backgroundColor = '#4CAF50';
      element.style.color = 'white';
      break;
    case 'error':
      element.style.backgroundColor = '#F44336';
      element.style.color = 'white';
      break;
    case 'warning':
      element.style.backgroundColor = '#FF9800';
      element.style.color = 'white';
      break;
    case 'info':
      element.style.backgroundColor = '#2196F3';
      element.style.color = 'white';
      break;
  }

  // Zawartość powiadomienia
  element.innerHTML = `
    <div style="flex-grow: 1;">${notification.message}</div>
    <button style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">×</button>
  `;

  // Dodaj obsługę przycisku zamknięcia
  const closeButton = element.querySelector('button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      removeNotification(notification.id);
    });
  }

  // Dodaj element do kontenera
  container.prepend(element);

  // Dodaj styl animacji, jeśli jeszcze nie istnieje
  if (!document.getElementById('taxy-notifications-style')) {
    const style = document.createElement('style');
    style.id = 'taxy-notifications-style';
    style.innerHTML = `
      @keyframes taxy-fade-in {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes taxy-fade-out {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(20px); }
      }
      .taxy-notification-removing {
        animation: taxy-fade-out 0.3s ease-in-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
}

// Funkcja usuwająca element powiadomienia z DOM
function removeNotificationElement(id: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.classList.add('taxy-notification-removing');
    setTimeout(() => {
      element.remove();
    }, 300);
  }
}

// Funkcja wyświetlająca powiadomienie o akcji
export function notifyAction(action: string, params: any, success: boolean = true): void {
  const actionKey = `actions.${action}`;
  const actionName = t(actionKey);
  
  if (success) {
    showSuccess(t('notifications.actionCompleted', { action: actionName }));
  } else {
    showError(t('notifications.actionFailed', { action: actionName, error: params.error || '' }));
  }
}
