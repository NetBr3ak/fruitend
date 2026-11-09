# 🍎 Fruitend

Czytaj w: [English](README.md) | **Polski**

Strona demo w owocowym motywie. Prowadzi przez sześć bloków w płaskich kolorach, od południa do północy.

## Czym to jest

Fruitend to statyczna strona demo. To nie jest prawdziwy produkt. Linki w menu i przyciski "Sign Up" nigdzie nie prowadzą. Każdy z nich pokazuje tylko krótki komunikat na dole ekranu. To szablon do ćwiczenia układu strony i stylowania.

## Funkcje

- Działa na telefonach, tabletach i komputerach
- Sześć bloków w płaskich kolorach, od południa do północy, ustawianych według twojego zegara
- Plaster cytrusa narysowany w CSS, bez pliku graficznego. Jest też zegarem: przeciągnij go albo użyj strzałek, a cała paleta przesunie się razem z nim
- Przycisk **Inspect**, który pokazuje prawdziwe reguły CSS elementu pod kursorem
- Pasek z tekstem, który można zatrzymać
- Animacje pojawiania się i najechania, wyłączane przy ustawieniu ograniczonego ruchu
- Płynne przewijanie strony

Dopisz `?t=23` do adresu, aby przypiąć paletę do wybranej godziny. Bieg zaczyna się w
południe, więc wcześniejsze godziny zostają na południu.

## Jak zacząć

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/NetBr3ak/fruitend.git
   cd fruitend
   ```
2. Otwórz plik `index.html` w dowolnej nowoczesnej przeglądarce.

Nie trzeba niczego budować. Nie ma żadnych zależności. Nie trzeba nic instalować. Strona nie
wysyła żadnego zapytania do obcego serwera: trzy fonty leżą obok niej.

Jedna rzecz działa lepiej po http niż z dysku. **Inspect** czyta własny arkusz stylów strony,
a przeglądarka traktuje plik lokalny jak inne pochodzenie, więc blokuje tam `cssRules`.
Z dysku dostaniesz pomiary, po http także reguły źródłowe. Wystarczy dowolny serwer
statyczny, na przykład `python3 -m http.server`.

## Struktura projektu

```
fruitend/
├── .github/            # Workflow CI, który uruchamia sprawdzenie palety
├── fonts/              # Trzy fonty, okrojone i hostowane lokalnie
├── images/             # Zdjęcia owoców użyte na stronie
├── index.html          # Strona główna
├── styles.css          # Cały styl strony
├── script.js           # Komunikat, tarcza zegara, pasek, inspektor
├── check-palette.mjs   # node check-palette.mjs: strażnik kontrastu palety
├── LICENSE             # Pełny tekst licencji MIT
├── README.md           # Angielska wersja tego pliku
└── README.pl.md
```

## Paleta to jedna liczba

Każdy kolor bloku wynika z `--tod`, jednej liczby, gdzie 0 to południe, a 1 to północ. CSS
wyprowadza z niej wszystkie sześć kolorów przez kolory względne `oklch()`, więc ruch zegara
przesuwa całą stronę i żaden JavaScript nie dotyka koloru. `check-palette.mjs` przechodzi
cały ten zakres i zgłasza błąd, jeśli któraś para tekstu spadnie poniżej progu kontrastu WCAG.

## Zbudowano w

- HTML5
- CSS3 (płaskie bloki kolorów, plaster cytrusa narysowany w CSS, kolory względne `oklch()`, `@property`)
- Czysty JavaScript (bez frameworka, bez narzędzi budujących)

## Licencja

Projekt jest na licencji MIT. Pełny tekst jest w pliku [LICENSE](LICENSE) (po angielsku).

Cztery zdjęcia owoców pochodzą z Wikimedia Commons. Każde jest przycięte do kwadratu 360 px.

| Plik | Zdjęcie | Autor | Licencja |
|---|---|---|---|
| `images/strawberries.webp` | [Strawberries in basket 2018 G1](https://commons.wikimedia.org/wiki/File:Strawberries_in_basket_2018_G1.jpg) | George Chernilevsky | domena publiczna |
| `images/kiwi.webp` | [Kiwi-halbiert](https://commons.wikimedia.org/wiki/File:Kiwi-halbiert.jpg) | MartinThoma | CC0 1.0 |
| `images/pineapple.webp` | [Canned Pineapple Chunks](https://commons.wikimedia.org/wiki/File:Canned_Pineapple_Chunks.jpg) | Alabama Extension | CC0 1.0 |
| `images/blueberries.webp` | [Aberdeenshire blueberries](https://commons.wikimedia.org/wiki/File:Aberdeenshire_blueberries.jpg) | Mx. Granger | CC0 1.0 |

Trzy fonty to Bricolage Grotesque, Hanken Grotesk i Martian Mono, wszystkie na licencji SIL
Open Font License. Zobacz [fonts/OFL.txt](fonts/OFL.txt).
