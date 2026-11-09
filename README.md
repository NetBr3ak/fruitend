# 🍎 Fruitend

Read this in: **English** | [Polski](README.pl.md)

A fruit-themed demo landing page. It runs through six flat color blocks, from noon to midnight.

## What this is

Fruitend is a static demo page. It is not a real product. The nav links and the "Sign Up" buttons do not go anywhere. Each one shows a short message at the bottom of the screen instead. This is a template for practicing layout and styling.

## Features

- Works on phones, tablets, and desktops
- Six flat color blocks that run from noon to midnight, set by the time on your own clock
- A citrus slice drawn in CSS, no image file. It is also the clock: drag it or use the arrow keys and the whole palette travels
- An **Inspect** button that shows the real CSS rules behind whatever you point at
- A ticker you can pause
- Reveal and hover animations that stop when the system asks for reduced motion
- Smooth scroll behavior

Add `?t=23` to the address to pin the palette at a given hour. The run starts at noon, so
earlier hours stay at noon.

## Getting started

1. Clone the repository:
   ```bash
   git clone https://github.com/NetBr3ak/fruitend.git
   cd fruitend
   ```
2. Open `index.html` in any modern browser.

No build step. No dependencies. No install command needed. The page makes no request to any
other server: the three fonts ship with it.

One thing works better over http than off the disk. **Inspect** reads the page's own
stylesheet, and a browser treats a local file as a separate origin, so `cssRules` is blocked
there. Off the disk you get the measurements; over http you also get the source rules. Any
static server does it, for example `python3 -m http.server`.

## Project structure

```
fruitend/
├── .github/            # Issue templates
├── fonts/              # The three fonts, subset and self-hosted
├── images/             # Fruit photos used on the page
├── index.html          # Main page
├── styles.css          # All styling
├── script.js           # Toast, clock dial, ticker, inspector
├── check-palette.mjs   # node check-palette.mjs: contrast guard for the palette
├── CONTRIBUTING.md     # How to open a pull request or an issue
├── SECURITY.md         # How to report a security issue
├── LICENSE             # Full MIT license text
├── README.md
└── README.pl.md        # Polish version of this file
```

## The palette is one number

Every block color comes from `--tod`, a single number where 0 is noon and 1 is midnight. CSS
derives all six colors from it with `oklch()` relative colors, so moving the clock moves the
whole page and no JavaScript touches a color. `check-palette.mjs` walks that whole range and
fails if any text pair drops under its WCAG contrast floor.

## Built with

- HTML5
- CSS3 (flat color blocks, CSS-drawn citrus slice, `oklch()` relative colors, `@property`)
- Vanilla JavaScript (no framework, no build tool)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to open a pull request or an issue.

## Security

See [SECURITY.md](SECURITY.md) for how to report a security issue.

## License

This project uses the MIT License. See [LICENSE](LICENSE) for the full text.

The four fruit photos come from Wikimedia Commons. Each one is cropped to a 360 px square.

| File | Photo | Author | Licence |
|---|---|---|---|
| `images/strawberries.webp` | [Strawberries in basket 2018 G1](https://commons.wikimedia.org/wiki/File:Strawberries_in_basket_2018_G1.jpg) | George Chernilevsky | Public domain |
| `images/kiwi.webp` | [Kiwi-halbiert](https://commons.wikimedia.org/wiki/File:Kiwi-halbiert.jpg) | MartinThoma | CC0 1.0 |
| `images/pineapple.webp` | [Canned Pineapple Chunks](https://commons.wikimedia.org/wiki/File:Canned_Pineapple_Chunks.jpg) | Alabama Extension | CC0 1.0 |
| `images/blueberries.webp` | [Aberdeenshire blueberries](https://commons.wikimedia.org/wiki/File:Aberdeenshire_blueberries.jpg) | Mx. Granger | CC0 1.0 |

The three fonts are Bricolage Grotesque, Hanken Grotesk, and Martian Mono, all under the SIL
Open Font License. See [fonts/OFL.txt](fonts/OFL.txt).
