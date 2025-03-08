
import en from './locales/en';
import pl from './locales/pl';

type TranslationKey = string;
type TemplateValues = Record<string, string | number>;

const locales = {
  en,
  pl,
};

export type SupportedLocale = keyof typeof locales;

// Domyślny język - angielski
let currentLocale: SupportedLocale = 'en';

// Funkcja ustawiająca aktualny język
export function setLocale(locale: SupportedLocale): void {
  if (locales[locale]) {
    currentLocale = locale;
    localStorage.setItem('taxy_language', locale);
  }
}

// Funkcja inicjalizująca język z zapisanych ustawień
export function initLocale(): void {
  const savedLocale = localStorage.getItem('taxy_language') as SupportedLocale;
  if (savedLocale && locales[savedLocale]) {
    currentLocale = savedLocale;
  } else {
    // Próba wykrycia języka przeglądarki
    const browserLocale = navigator.language.split('-')[0] as SupportedLocale;
    if (locales[browserLocale]) {
      currentLocale = browserLocale;
    }
  }
}

// Funkcja do zastępowania placeholderów w tłumaczeniu
function replacePlaceholders(text: string, values?: TemplateValues): string {
  if (!values) return text;
  
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }, text);
}

// Funkcja do pobierania tłumaczenia na podstawie klucza
export function t(key: TranslationKey, values?: TemplateValues): string {
  const keys = key.split('.');
  let translation: any = locales[currentLocale];
  
  for (const k of keys) {
    if (!translation[k]) {
      // Fallback do angielskiego
      translation = locales.en;
      break;
    }
    translation = translation[k];
  }
  
  for (const k of keys) {
    if (!translation[k]) {
      return key; // Zwróć klucz, jeśli nie znaleziono tłumaczenia
    }
    translation = translation[k];
  }
  
  if (typeof translation === 'string') {
    return replacePlaceholders(translation, values);
  }
  
  return key;
}

// Lista dostępnych języków
export function getAvailableLocales(): SupportedLocale[] {
  return Object.keys(locales) as SupportedLocale[];
}

// Aktualny język
export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

// Inicjalizacja przy imporcie
initLocale();
