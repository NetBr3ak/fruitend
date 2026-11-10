# Fruitend

Czytaj w: [English](README.md) | **Polski**

Statyczna strona demo w owocowym motywie. Plaster cytrusa na górze strony jest narysowany w CSS
i jest też zegarem 24-godzinnym: pokazuje twój czas lokalny, a kolory strony idą za godziną na
nim. Od 18:00 do 06:00 strona robi się ciemna.

Strona na żywo: https://netbr3ak.github.io/fruitend/

![Strona Fruitend o 17:00 na ekranie laptopa 1280 px i na ekranie telefonu 375 px](images/preview.png)

## Co robi strona

- Jedna liczba, `--tod`, steruje paletą. 0 to południe, 0,5 to 06:00 albo 18:00, 1 to
  północ. CSS wyprowadza z niej kolory przez kolory względne `oklch()`. JavaScript ustawia
  tylko tę liczbę.
- Od 18:00 do 06:00 jasne tła robią się ciemne, a ich tekst zmienia się z kakaowego na
  kremowy. Ta zmiana to skok zrobiony w CSS przez `round()`, nie płynne przejście, więc żaden
  tekst nie stoi na tle, na którym nie ma kontrastu. Cztery zdjęcia ciemnieją z godziną przez
  CSS `filter`.
- Plaster cytrusa to suwak (`role="slider"`): południe na górze, północ na dole, a ciemna
  połowa obręczy to noc. Przeciągnij go albo przejdź do niego klawiszem Tab i użyj klawiszy:
  każda strzałka to 15 minut, Page Up i Page Down to godzina, Home skacze do 00:00, a End do
  23:59. Przeciąganie może minąć południe i północ. Na ekranie dotykowym przeciągnij gałkę na
  końcu wskazówki, stuknij plaster albo przeciągnij po nim w bok; ruch w pionie zaczęty poza
  gałką przewija stronę.
- Po wczytaniu zegar pokazuje twój czas lokalny i co minutę idzie razem z nim. Gdy go
  przesuniesz, zostaje tam, gdzie go zostawisz, a **Back to now** wraca do bieżącej godziny.
  Dopisz `?t=21` do adresu, aby przypiąć stronę do 21:00.
- Gdy plaster zniknie z ekranu, w górnym pasku pojawia się suwak z godziną. Przesuwa ten sam
  zegar.
- Skok przez 06:00 albo 18:00 (klawiszem, stuknięciem albo **Back to now**) przechodzi
  łagodnie w przeglądarkach z View Transitions. Przeciąganie zmienia kolory od razu.
- "Three files" pokazuje rozmiar i czas pobrania każdego pliku, zmierzone przez twoją
  przeglądarkę przy tej wizycie.
- **Inspect styles** pokazuje rozmiar, padding, kontrast tekstu i pasujące reguły CSS elementu pod
  kursorem albo z fokusem. Potrzebuje Popover API; bez niego przycisk zostaje ukryty.
- Pasek z tekstem ma przycisk Pause. Jeśli system prosi o ograniczenie ruchu, nic na stronie
  się nie rusza, a przycisk Pause jest ukryty.
- Każdy link działa bez JavaScriptu. "Fruits", "Files" i "See the fruits" przewijają do
  swojej sekcji; "Source", "View source" i "Make it your own" otwierają to repozytorium. Bez
  JavaScriptu zegar jest nieruchomym obrazkiem na 12:00, a przyciski, które potrzebują
  skryptu, zostają ukryte.

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

Skrypt przechodzi `--tod` od 0 do 1 w 21 krokach. W każdym kroku sprawdza 14 par tekstu i tła
względem progu kontrastu WCAG: 4,5:1 albo 3:1 dla dużego tekstu. Potem sprawdza 6 kolejnych
par, czyli tekst na tłach, które nocą robią się ciemne: dzień dla `--tod` od 0 do 0,5 i noc od
0,5 do 1, po 21 kroków. Kończy się kodem 1, jeśli któraś para nie spełnia progu. CI uruchamia
go przy każdym pushu do `main` i przy każdym pull requeście.

## Pliki

```
fruitend/
├── .github/workflows/  # CI: uruchamia check-palette.mjs
├── fonts/              # Trzy fonty, okrojone do znaków i jednej grubości ze strony, i OFL.txt
├── images/             # Cztery zdjęcia owoców i obraz podglądu powyżej
├── index.html          # Strona
├── styles.css          # Wszystkie style, razem z paletą
├── script.js           # Zegar, suwak w górnym pasku, pasek z tekstem, rozmiary plików, inspektor
├── check-palette.mjs   # Sprawdzenie kontrastu całej skali palety
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

Trzy fonty to Bricolage Grotesque, Hanken Grotesk i Martian Mono, wszystkie na licencji SIL Open
Font License. Zobacz [fonts/OFL.txt](fonts/OFL.txt).

## Licencja

Kod jest na licencji MIT. Zobacz [LICENSE](LICENSE) (po angielsku). Zdjęcia i fonty mają
licencje podane w sekcji Źródła.
