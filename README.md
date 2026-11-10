# Fruitend

Read this in: **English** | [Polski](README.pl.md)

A static demo landing page on a fruit theme. The citrus slice in the hero is drawn in CSS and is
also a clock: drag it, and the six color blocks of the page shift from noon to midnight.

Live page: https://netbr3ak.github.io/fruitend/

![The Fruitend page at 17:00 on a 1280 px laptop screen and a 375 px phone screen](images/preview.png)

## What the page does

- One number, `--tod`, drives the palette. 0 is noon and 1 is midnight. CSS derives six colors
  from it with `oklch()` relative colors. JavaScript sets only that number.
- The citrus slice is a slider (`role="slider"`) and shows the time in its middle. Drag it, or
  focus it with Tab and use the keys: each arrow moves 15 minutes, Page Up and Page Down move
  an hour, Home and End jump to noon and midnight. A drag past twelve stops at noon or
  midnight. On a touch screen, drag the knob at the tip of the hand, tap the slice or drag
  across it sideways; a vertical swipe that starts off the knob scrolls the page.
- On load the clock shows your local time. The ramp starts at noon, so an hour before noon
  shows noon. Add `?t=21` to the address to pin the page at 21:00.
- **Inspect** shows the size, padding, text contrast and matching CSS rules of the element
  you hover or focus.
- The ticker has a Pause button. If your system asks for reduced motion, nothing on the page
  moves and the Pause button is hidden.
- The nav links, "See the fruits" and "Sign up" are demos. They lead nowhere: a click shows a
  short message and sends nothing.

There is no framework, no build step and no request to another server. The fonts ship with
the page.

## Run it

```bash
git clone https://github.com/NetBr3ak/fruitend.git
cd fruitend
python3 -m http.server 8000
```

Then open http://localhost:8000/. Opening `index.html` straight from the disk also works, with
one gap: the browser treats a local file as a separate origin and blocks `cssRules`, so
**Inspect** shows the measurements but not the source rules.

## Check the palette

```bash
node check-palette.mjs
```

The script walks `--tod` from 0 to 1 in 21 steps. At each step it checks 12 text and background
pairs against their WCAG contrast floor: 4.5:1, or 3:1 for display-size text. It exits with
code 1 if any pair falls short. CI runs it on every push to `main` and on every pull request.

## Files

```
fruitend/
├── .github/workflows/  # CI: runs check-palette.mjs
├── fonts/              # The three fonts, cut to the characters and the one weight the page uses, and OFL.txt
├── images/             # The four fruit photos and the preview image above
├── index.html          # The page
├── styles.css          # All styles, including the palette
├── script.js           # Toast, clock, ticker, inspector
├── check-palette.mjs   # Contrast check for the whole palette ramp
├── favicon.svg
├── sitemap.xml
├── LICENSE
├── README.md
└── README.pl.md        # This file in Polish
```

## Credits

The four fruit photos come from Wikimedia Commons. Each one is cropped to a 360 px square, with
300 px and 200 px copies (`*-300.webp`, `*-200.webp`) for screens that need no more.

| File | Photo | Author | Licence |
|---|---|---|---|
| `images/strawberries.webp` | [Strawberries in basket 2018 G1](https://commons.wikimedia.org/wiki/File:Strawberries_in_basket_2018_G1.jpg) | George Chernilevsky | Public domain |
| `images/kiwi.webp` | [Kiwi-halbiert](https://commons.wikimedia.org/wiki/File:Kiwi-halbiert.jpg) | MartinThoma | CC0 1.0 |
| `images/pineapple.webp` | [Ananas bozor rastasida](https://commons.wikimedia.org/wiki/File:Ananas_bozor_rastasida.jpg) | Usmonov Gayrat | CC0 1.0 |
| `images/blueberries.webp` | [Aberdeenshire blueberries](https://commons.wikimedia.org/wiki/File:Aberdeenshire_blueberries.jpg) | Mx. Granger | CC0 1.0 |

The three fonts are Bricolage Grotesque, Hanken Grotesk and Martian Mono, all under the SIL Open
Font License. See [fonts/OFL.txt](fonts/OFL.txt).

## License

The code is under the MIT License. See [LICENSE](LICENSE). The photos and fonts keep the
licences listed in Credits.
