
export default {
  common: {
    execute: 'Wykonaj',
    cancel: 'Anuluj',
    close: 'Zamknij',
    success: 'Sukces',
    error: 'Błąd',
    warning: 'Ostrzeżenie',
    info: 'Informacja',
  },
  actions: {
    click: 'Kliknięcie elementu',
    type: 'Wpisanie tekstu',
    navigate: 'Nawigacja do strony',
    scroll: 'Przewijanie strony',
    drag: 'Przeciągnięcie elementu',
    wait: 'Oczekiwanie',
    screenshot: 'Zrzut ekranu',
    automate: 'Automatyzacja',
  },
  notifications: {
    actionStarted: 'Rozpoczęto: {{action}}',
    actionCompleted: 'Zakończono: {{action}}',
    actionFailed: 'Błąd: {{action}} - {{error}}',
    commandExecuted: 'Wykonano polecenie: {{command}}',
  },
  chatCommands: {
    help: 'Dostępne komendy:\n/taxy click [selector] - kliknij element\n/taxy type [selector] [text] - wpisz tekst\n/taxy navigate [url] - przejdź do strony\n/taxy scroll [options] - przewiń stronę\n/taxy drag [options] - przeciągnij element\n/taxy wait [ms] - czekaj\n/taxy screenshot [selector] - zrzut ekranu\n/taxy automate [instruction] - wykonaj złożoną automatyzację',
    invalidCommand: 'Nieprawidłowe polecenie. Użyj /taxy help, aby zobaczyć listę dostępnych poleceń.',
    unknownCommand: 'Nieznane polecenie: {{command}}',
  }
};
