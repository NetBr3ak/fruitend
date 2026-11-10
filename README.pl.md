# Fruitend

Czytaj w: [English](README.md) | **Polski**

Statyczna strona demo w owocowych kolorach. Plaster cytrusa na górze strony jest narysowany
gradientami CSS i powoli się obraca, jak wyciskarka do cytrusów. Wycięte owoce wokół niego
unoszą się w miejscu.

Strona na żywo: https://netbr3ak.github.io/fruitend/

![Strona Fruitend na ekranie laptopa 1280 px i na ekranie telefonu 375 px](images/preview.png)

## Co robi strona

- Plaster cytrusa robi pełny obrót w 48 sekund. Obracają się jego cząstki, ale odblask zostaje
  w lewym górnym rogu, więc światło wydaje się stać w miejscu. Cztery wycięte owoce unoszą się
  o 6 px i przechylają o 2 stopnie, a potem wracają. Każdy owoc ma własne tempo (jeden ruch
  trwa 7, 9, 11 albo 13 sekund), więc po chwili nie ruszają się już razem. Ruch zmienia tylko
  `rotate` i `translate`.
- Światło pada z lewego górnego rogu: poświata na górze strony, odblask na plastrze i cienie
  naklejek oraz bloków z owocami.
- "Three files" pokazuje rozmiar i czas pobrania każdego pliku, zmierzone przez twoją
  przeglądarkę przy tej wizycie, z paskiem rozmiaru każdego pliku względem największego.
- **Inspect styles** pokazuje rozmiar, padding, kontrast tekstu i pasujące reguły CSS elementu pod
  kursorem albo z fokusem. Potrzebuje Popover API; bez niego przycisk zostaje ukryty.
- Pod plastrem jest przycisk **Pause motion**. Zatrzymuje trzy zapętlone ruchy: pasek z
  tekstem, plaster i owoce. **Inspect styles** na pasku też je zatrzymuje, dopóki jest
  włączony. Jeśli system prosi o ograniczenie ruchu, nic na stronie się nie rusza, a przycisk
  jest ukryty.
- Każdy link działa bez JavaScriptu. "Fruits", "Files" i "See the fruits" przewijają do
  swojej sekcji; "Source", "View source" i "Make it your own" otwierają to repozytorium. Bez
  JavaScriptu animacja wejścia i efekty przewijania nadal działają, ale nic się nie zapętla:
  pasek, plaster i owoce stoją, a przyciski, które potrzebują skryptu, zostają ukryte.

Nie ma frameworka, budowania ani zapytań do innego serwera. Fonty leżą obok strony.

## Jak uruchomić

```bash
git clone https://github.com/NetBr3ak/fruitend.git
cd fruitend
python3 -m http.server 8000
```

Potem otwórz http://localhost:8000/. Plik `index.html` otwarty prosto z dysku też działa,
z jedną luką: przeglądarka traktuje plik lokalny jak inne pochodzenie i blokuje `cssRules`,
więc **Inspect styles** pokazuje pomiary, ale nie reguły źródłowe.

## Sprawdzenie palety

```bash
node check-palette.mjs
```

Skrypt sprawdza 14 par tekstu i tła z palety względem progu kontrastu WCAG: 4,5:1 albo 3:1 dla
dużego tekstu. Kończy się kodem 1, jeśli któraś para nie spełnia progu. CI uruchamia
go przy każdym pushu do `main` i przy każdym pull requeście.

## Pliki

```
fruitend/
├── .github/workflows/  # CI: uruchamia check-palette.mjs
├── fonts/              # Trzy fonty, okrojone do znaków i jednej grubości ze strony, i OFL.txt
├── images/             # Cztery zdjęcia owoców, cztery wycięte owoce, cztery rysunki naklejek (SVG) i obraz podglądu powyżej
├── index.html          # Strona
├── styles.css          # Wszystkie style, razem z paletą
├── script.js           # Przycisk Pause motion, rozmiary plików, inspektor
├── check-palette.mjs   # Sprawdzenie kontrastu palety
├── favicon.svg
├── sitemap.xml
├── LICENSE
├── README.md           # Angielska wersja tego pliku
└── README.pl.md
```

## Źródła

Cztery zdjęcia owoców pochodzą z Wikimedia Commons. Każde jest przycięte do kwadratu 400 i 800 px
(truskawki także 1000 px), w AVIF i WebP, na przykład `kiwi-400.avif` i `kiwi-800.webp`.
Atrybut `sizes` mówi przeglądarce, jak szerokie jest każde zdjęcie na stronie, więc może wziąć
mniejszy plik tam, gdzie wystarczy.

| Plik | Zdjęcie | Autor | Licencja |
|---|---|---|---|
| `images/strawberries-*` | [Strawberries in basket 2018 G1](https://commons.wikimedia.org/wiki/File:Strawberries_in_basket_2018_G1.jpg) | George Chernilevsky | domena publiczna |
| `images/kiwi-*` | [Kiwi-halbiert](https://commons.wikimedia.org/wiki/File:Kiwi-halbiert.jpg) | MartinThoma | CC0 1.0 |
| `images/pineapple-*` | [Ananas bozor rastasida](https://commons.wikimedia.org/wiki/File:Ananas_bozor_rastasida.jpg) | Usmonov Gayrat | CC0 1.0 |
| `images/blueberries-*` | [Aberdeenshire blueberries](https://commons.wikimedia.org/wiki/File:Aberdeenshire_blueberries.jpg) | Mx. Granger | CC0 1.0 |

Cztery wycięte owoce wokół plastra (`images/cut-*`) też pochodzą z Wikimedia Commons. Framework
Vision od Apple (`VNGenerateForegroundInstanceMaskRequest`) oddzielił każdy owoc od tła, a potem
dodano wokół niego kremową obwódkę. Każdy plik ma najwyżej 480 px na dłuższym boku, w AVIF i WebP.

| Plik | Zdjęcie | Autor | Licencja |
|---|---|---|---|
| `images/cut-strawberry-*` | [Strawberry on white background](https://commons.wikimedia.org/wiki/File:Strawberry_on_white_background.jpg) | Joselodos | CC0 1.0 |
| `images/cut-kiwi-*` | [Kiwi](https://commons.wikimedia.org/wiki/File:Kiwi.jpg) | Renee Comet, National Cancer Institute | domena publiczna |
| `images/cut-pineapple-*` | [Pineapple on white table](https://commons.wikimedia.org/wiki/File:Pineapple_on_white_table.jpg) | Julien Pianetti | CC0 1.0 |
| `images/cut-pint-*` | [Blueberries-In-Pack](https://commons.wikimedia.org/wiki/File:Blueberries-In-Pack.jpg) | Evan-Amos | CC0 1.0 |

Trzy fonty to Bricolage Grotesque, Hanken Grotesk i Martian Mono, wszystkie na licencji SIL Open
Font License. Zobacz [fonts/OFL.txt](fonts/OFL.txt).

## Licencja

Kod jest na licencji MIT. Zobacz [LICENSE](LICENSE) (po angielsku). Zdjęcia i fonty mają
licencje podane w sekcji Źródła.
