# Fruitend

Read this in: **English** | [Polski](README.pl.md)

A static demo landing page in fruit colors. The citrus slice in the hero is drawn with CSS
gradients and turns slowly, like a juicer. The cut-out fruits around it float in place.

Live page: https://netbr3ak.github.io/fruitend/

![The Fruitend page on a 1280 px laptop screen and a 375 px phone screen](images/preview.png)

## What the page does

- The citrus slice turns once every 48 seconds. Its segments turn, but its highlight stays at
  the upper left, so the light seems to stand still. The four cut-out fruits rise by 6 px and
  tilt by 2 degrees, then go back. Each fruit has its own pace (one move takes 7, 9, 11 or 13
  seconds), so after a few seconds they no longer move together. The motion changes only `rotate`
  and `translate`.
- The light comes from the upper left: the glow in the hero, the highlight on the slice, and the
  shadows of the stickers and the fruit blocks.
- "Three files" shows the size and load time of each file, as your browser measured them on
  this visit, with a bar for each file's size against the largest one.
- **Inspect styles** shows the size, padding, text contrast and matching CSS rules of the element
  you hover or focus. It needs the Popover API; without it the button stays hidden.
- A **Pause motion** button sits under the slice. It stops the three loops: the ticker, the
  slice and the fruits. **Inspect styles**, in the ticker, also stops them while it is on. If
  your system asks for reduced motion, nothing on the page moves and the button is hidden.
- Every link works without JavaScript. "Fruits", "Files" and "See the fruits" jump to their
  section; "Source", "View source" and "Make it your own" open this repository. Without
  JavaScript the entrance animation and the scroll effects still run, but nothing loops: the
  ticker, the slice and the fruits stand still, and the controls that need a script stay hidden.

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
**Inspect styles** shows the measurements but not the source rules.

## Check the palette

```bash
node check-palette.mjs
```

The script checks 14 text and background pairs of the palette against their WCAG contrast floor:
4.5:1, or 3:1 for display-size text. It exits with code 1 if any pair falls short. CI runs it on
every push to `main` and on every pull request.

## Files

```
fruitend/
├── .github/workflows/  # CI: runs check-palette.mjs
├── fonts/              # The three fonts, cut to the characters and the one weight the page uses, and OFL.txt
├── images/             # Four fruit photos, four cut-out fruits, four sticker drawings (SVG) and the preview image above
├── index.html          # The page
├── styles.css          # All styles, including the palette
├── script.js           # Pause motion button, file sizes, inspector
├── check-palette.mjs   # Contrast check for the palette
├── favicon.svg
├── sitemap.xml
├── LICENSE
├── README.md
└── README.pl.md        # This file in Polish
```

## Credits

The four fruit photos come from Wikimedia Commons. Each one is cropped to a square at 400 and
800 px (strawberries also at 1000 px), in AVIF and WebP, for example `kiwi-400.avif` and
`kiwi-800.webp`. The `sizes` attribute tells the browser how wide each photo shows, so it can
take the smaller file where that is enough.

| File | Photo | Author | Licence |
|---|---|---|---|
| `images/strawberries-*` | [Strawberries in basket 2018 G1](https://commons.wikimedia.org/wiki/File:Strawberries_in_basket_2018_G1.jpg) | George Chernilevsky | Public domain |
| `images/kiwi-*` | [Kiwi-halbiert](https://commons.wikimedia.org/wiki/File:Kiwi-halbiert.jpg) | MartinThoma | CC0 1.0 |
| `images/pineapple-*` | [Ananas bozor rastasida](https://commons.wikimedia.org/wiki/File:Ananas_bozor_rastasida.jpg) | Usmonov Gayrat | CC0 1.0 |
| `images/blueberries-*` | [Aberdeenshire blueberries](https://commons.wikimedia.org/wiki/File:Aberdeenshire_blueberries.jpg) | Mx. Granger | CC0 1.0 |

The four cut-out fruits around the slice (`images/cut-*`) also come from Wikimedia Commons.
Apple's Vision framework (`VNGenerateForegroundInstanceMaskRequest`) lifted each fruit off its
background, then a cream edge was drawn around it. Each file is at most 480 px on its long side,
in AVIF and WebP.

| File | Photo | Author | Licence |
|---|---|---|---|
| `images/cut-strawberry-*` | [Strawberry on white background](https://commons.wikimedia.org/wiki/File:Strawberry_on_white_background.jpg) | Joselodos | CC0 1.0 |
| `images/cut-kiwi-*` | [Kiwi](https://commons.wikimedia.org/wiki/File:Kiwi.jpg) | Renee Comet, National Cancer Institute | Public domain |
| `images/cut-pineapple-*` | [Pineapple on white table](https://commons.wikimedia.org/wiki/File:Pineapple_on_white_table.jpg) | Julien Pianetti | CC0 1.0 |
| `images/cut-pint-*` | [Blueberries-In-Pack](https://commons.wikimedia.org/wiki/File:Blueberries-In-Pack.jpg) | Evan-Amos | CC0 1.0 |

The three fonts are Bricolage Grotesque, Hanken Grotesk and Martian Mono, all under the SIL Open
Font License. See [fonts/OFL.txt](fonts/OFL.txt).

## License

The code is under the MIT License. See [LICENSE](LICENSE). The photos and fonts keep the
licences listed in Credits.
