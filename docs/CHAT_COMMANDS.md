
# Sterowanie przeglądarką przez czat AI

Rozszerzenie Taxy AI pozwala na sterowanie przeglądarką bezpośrednio z interfejsów czatów AI, takich jak ChatGPT i Google Bard.

## Dostępne polecenia

Aby wydać polecenie, wpisz `/taxy` na początku wiersza w odpowiedzi AI, a następnie podaj jedno z poniższych poleceń:

- `/taxy click "selector"` - Kliknięcie elementu określonego przez selektor CSS
- `/taxy type "tekst" in "selector"` - Wpisuje tekst w pole określone przez selektor CSS
- `/taxy navigate example.com` - Przejście do określonego URL
- `/taxy goto example.com` - Alias dla polecenia navigate
- `/taxy automate "instrukcja"` - Wykonanie złożonej automatyzacji na podstawie instrukcji w języku naturalnym

## Przykłady użycia

- `/taxy click ".submit-button"`
- `/taxy type "Hello world" in "#search-input"`
- `/taxy navigate google.com`
- `/taxy automate "Wypełnij formularz kontaktowy, podając imię Jan Kowalski i email test@example.com"`

## Wskazówki

1. Selektory CSS powinny być ujęte w cudzysłowy
2. W przypadku polecenia `type`, format to `"tekst" in "selektor"`
3. Dla URL nie są wymagane cudzysłowy, a protokół http:// jest dodawany automatycznie jeśli nie jest podany
4. Aby zobaczyć selektor elementu na stronie, kliknij prawym przyciskiem myszy i wybierz "Zbadaj" lub "Inspect Element"
# Komendy Czatu Taxy AI

Ten dokument opisuje dostępne polecenia, które można wydawać rozszerzeniu Taxy AI bezpośrednio z czatów AI.

## Podstawowe Polecenia

Wszystkie polecenia zaczynają się od prefiksu `/taxy`.

### Nawigacja i Interakcja

| Polecenie | Składnia | Opis | Przykład |
|-----------|----------|------|----------|
| **click** | `/taxy click [selektor]` | Kliknij element na stronie | `/taxy click #submit-button` |
| **type** | `/taxy type [selektor] [tekst]` lub `/taxy type [selektor]|[tekst]` | Wpisz tekst w polu formularza | `/taxy type #search-input szukana fraza` lub `/taxy type #search-input|szukana fraza` |
| **navigate** | `/taxy navigate [url]` | Przejdź do określonego URL | `/taxy navigate google.com` |

### Zaawansowane Operacje

| Polecenie | Składnia | Opis | Przykład |
|-----------|----------|------|----------|
| **scroll** | `/taxy scroll [top/bottom/selektor/x,y]` | Przewiń stronę | `/taxy scroll bottom` lub `/taxy scroll #section-3` lub `/taxy scroll 0,500` |
| **drag** | `/taxy drag [źródło]|[cel]` | Przeciągnij element do innego miejsca | `/taxy drag #drag-me|#drop-zone` |
| **wait** | `/taxy wait [czas_w_ms]` | Poczekaj określony czas | `/taxy wait 2000` |
| **screenshot** | `/taxy screenshot [opcjonalny selektor]` | Wykonaj zrzut ekranu | `/taxy screenshot` lub `/taxy screenshot .main-content` |

### Automatyzacja

| Polecenie | Składnia | Opis | Przykład |
|-----------|----------|------|----------|
| **automate** | `/taxy automate [instrukcja]` | Wykonaj złożoną sekwencję operacji | `/taxy automate wypełnij formularz kontaktowy` |

## Formaty Komend

Komendy Taxy AI obsługują różne formaty zapisu parametrów:

1. **Standardowy format**: `/taxy akcja parametry`
2. **Format z nawiasami kwadratowymi**: `/taxy akcja [parametry]`
3. **Format z cudzysłowami**: `/taxy akcja "parametry"`
4. **Format JSON**: `/taxy akcja {"parametr1": "wartość1", "parametr2": "wartość2"}`

## Przykłady Użycia

### Wypełnianie formularza

```
/taxy click #contact-form
/taxy type #name|Jan Kowalski
/taxy type #email|jan.kowalski@example.com
/taxy type #message|Witam, proszę o kontakt w sprawie współpracy.
/taxy click #submit-button
```

### Wyszukiwanie i nawigacja

```
/taxy navigate google.com
/taxy type input[name="q"]|najlepsze restauracje w Warszawie
/taxy click input[name="btnK"]
/taxy wait 2000
/taxy click #search-result-1
```

### Przeciąganie elementów

```
/taxy drag #task-1|#completed-tasks
/taxy screenshot .task-board
```
