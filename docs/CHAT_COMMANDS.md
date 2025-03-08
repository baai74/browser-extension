
# Komendy Czatu Taxy AI

Rozszerzenie Taxy AI obsługuje komendy czatu, które pozwalają na sterowanie przeglądarką bezpośrednio z interfejsu czatu takich platform jak ChatGPT, Google Bard, Claude czy Perplexity.

## Dostępne komendy

Wszystkie komendy zaczynają się od prefiksu `/taxy` (lub `/taksówka` w języku polskim):

### Podstawowe komendy

| Komenda | Składnia | Opis | Przykład |
|---------|----------|------|----------|
| click | `/taxy click [selektor]` | Kliknij element na stronie | `/taxy click #submit-button` |
| type | `/taxy type [selektor] [tekst]` | Wpisz tekst w pole wejściowe | `/taxy type #search-input Szukany tekst` |
| navigate | `/taxy navigate [url]` | Przejdź do podanego adresu URL | `/taxy navigate replit.com` |
| wait | `/taxy wait [ms]` | Czekaj określony czas (w milisekundach) | `/taxy wait 2000` |

### Zaawansowane komendy

| Komenda | Składnia | Opis | Przykład |
|---------|----------|------|----------|
| scroll | `/taxy scroll [x] [y]` lub `/taxy scroll to [selektor]` | Przewiń stronę do określonej pozycji lub elementu | `/taxy scroll 0 500` lub `/taxy scroll to #section-2` |
| drag | `/taxy drag [źródło] to [cel]` | Przeciągnij element z jednego miejsca do drugiego | `/taxy drag #draggable to #dropzone` |
| screenshot | `/taxy screenshot` lub `/taxy screenshot [selektor]` | Wykonaj zrzut ekranu całej strony lub wybranego elementu | `/taxy screenshot` lub `/taxy screenshot .product-card` |
| automate | `/taxy automate [instrukcja]` | Wykonaj złożoną automatyzację na podstawie instrukcji w języku naturalnym | `/taxy automate wypełnij formularz danymi: Jan Kowalski, jan@example.com, +48123456789` |

### Pomoc

| Komenda | Składnia | Opis | Przykład |
|---------|----------|------|----------|
| help | `/taxy help` | Wyświetl listę dostępnych komend | `/taxy help` |

## Obsługiwane platformy

Rozszerzenie obecnie obsługuje następujące platformy czatowe:

- OpenAI ChatGPT (chat.openai.com)
- Google Bard (bard.google.com)
- Anthropic Claude (claude.ai)
- Perplexity AI (perplexity.ai)

Na innych stronach rozszerzenie będzie próbowało wykryć pola tekstowe do wprowadzania komend, ale funkcjonalność może być ograniczona.

## Wielojęzyczność

Rozszerzenie obsługuje komendy w następujących językach:

- English (en): `/taxy`
- Polski (pl): `/taxy` lub `/taksówka`

Domyślny język jest wybierany na podstawie ustawień przeglądarki, ale można go zmienić w ustawieniach rozszerzenia.

## Przykłady użycia

### Wyszukiwanie w Google

```
/taxy navigate google.com
/taxy type input[name="q"] robotyka edukacyjna
/taxy click input[value="Szukaj w Google"]
```

### Wypełnianie formularza

```
/taxy click #email
/taxy type #email jan.kowalski@example.com
/taxy click #password
/taxy type #password MojeTajneHasło123
/taxy click #submit-button
```

### Automatyzacja złożonych zadań

```
/taxy automate Przejdź do gmail.com, utwórz nową wiadomość, adresuj ją do jan@example.com, z tematem "Spotkanie", treścią "Cześć Jan, czy możemy spotkać się jutro o 15:00?" i wyślij
```

## Najlepsze praktyki

1. Używaj jak najbardziej precyzyjnych selektorów CSS, aby jednoznacznie zidentyfikować elementy strony.
2. Między poszczególnymi akcjami używaj komend `/taxy wait`, aby dać stronie czas na załadowanie i przetworzenie zmian.
3. Dla złożonych automatyzacji używaj komendy `/taxy automate` z opisem w języku naturalnym.
4. Używaj `/taxy screenshot` do weryfikacji stanu strony podczas automatyzacji.

## Rozwiązywanie problemów

- Jeśli komenda nie działa, sprawdź poprawność selektora CSS.
- Jeśli strona się zmienia (np. dynamicznie generowany interfejs), selektory mogą przestać działać.
- Niektóre strony mogą blokować automatyczne interakcje.

## Testowanie selektorów na dynamicznych stronach

### Komendy testowe

Rozszerzenie oferuje specjalne komendy do testowania funkcjonalności na dynamicznych stronach:

1. `/taxy test-selector "selektor"` - testuje podany selektor CSS i podświetla pasujące elementy
2. `/taxy debug` - uruchamia tryb debugowania dla aktualnej strony
3. `/taxy monitor "selektor"` - monitoruje zmiany elementów pasujących do selektora

### Przykłady użycia

```
/taxy test-selector ".btn-primary"
/taxy test-selector "button:contains('Zaloguj')"
/taxy debug dom
/taxy monitor ".dynamic-container"
```

### Strategie dla dynamicznych stron

1. **Używaj odpornych selektorów:**
   - Preferuj selektory oparte na ID (`#id`)
   - Używaj atrybutów danych (`[data-testid="element"]`)
   - Używaj selektorów tekstowych (`button:contains('Tekst')`)

2. **Implementuj oczekiwanie:**
   - Używaj `/taxy wait 2000` przed następną akcją
   - Stosuj `/taxy waitFor ".element"` aby poczekać na pojawienie się elementu

3. **Debugowanie selektorów:**
   - Użyj `/taxy test-selector` aby zweryfikować działanie selektora
   - Sprawdź, czy selektor znajduje prawidłową liczbę elementów
   - Obserwuj, czy elementy są właściwie podświetlone

4. **Obsługa ramek (iframes):**
   - Używaj `/taxy frame "nazwa-ramki"` aby przełączyć kontekst do ramki
   - Wróć do głównego dokumentu używając `/taxy frame "main"`

5. **Analiza strony:**
   - Użyj `/taxy analyze` do analizy dynamicznych zmian na stronie
   - Zidentyfikuj wzorce ładowania treści (np. nieskończone przewijanie)

### Rozwiązywanie typowych problemów

1. **Element nie jest znajdowany:**
   - Sprawdź, czy element faktycznie istnieje w DOM
   - Zweryfikuj, czy element jest widoczny (nie jest ukryty przez CSS)
   - Poczekaj na załadowanie treści dynamicznej

2. **Klikanie nie działa:**
   - Upewnij się, że element jest widoczny i klikalny
   - Sprawdź, czy element nie jest zakryty przez inny element
   - Użyj `/taxy scroll-to "selektor"` przed kliknięciem

3. **Strona reaguje nieprawidłowo:**
   - Niektóre strony mogą wykrywać automatyzację
   - Dodaj losowe opóźnienia między akcjami
   - Symuluj bardziej naturalne zachowanie użytkownikaterakcje jako środek bezpieczeństwa.
- W przypadku problemów, używaj dłuższych czasów oczekiwania między akcjami.
