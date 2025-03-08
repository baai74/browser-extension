
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
