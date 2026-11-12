// Checks the palette in styles.css: gamut, WCAG contrast of each pair, each 5% flood frame.
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('styles.css', import.meta.url), 'utf8');
const p3Block = css.match(/@media \(color-gamut: p3\) \{\s*:root \{[^}]*\}\s*\}/)[0];
const readColors = text =>
  Object.fromEntries(
    [...text.matchAll(/--([a-z]+): oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\);/g)].map(
      ([, name, l, c, h]) => [name, [l / 100, Number(c), Number(h)]]
    )
  );
const readNumber = name => Number(css.match(new RegExp(`--${name}: ([\\d.]+);`))[1]);
const srgb = readColors(css.replace(p3Block, ''));
const p3Only = readColors(p3Block);

// OKLCH to linear sRGB (Ottosson's OKLab matrices).
function toLinearSrgb([l, c, h]) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short
  ];
}

// Per gamut: linear sRGB to its linear RGB, and the luminance (XYZ Y) row.
const GAMUTS = {
  srgb: { convert: rgb => rgb, luminanceRow: [0.2126, 0.7152, 0.0722] },
  p3: {
    convert: ([r, g, b]) => [
      0.8224621209 * r + 0.1775378791 * g,
      0.0331941989 * r + 0.9668058011 * g,
      0.0170826307 * r + 0.0723974407 * g + 0.9105199286 * b
    ],
    luminanceRow: [0.2289745641, 0.6917385218, 0.0792869141]
  }
};
const encode = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const decode = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamut = (color, gamut) => GAMUTS[gamut].convert(toLinearSrgb(color)).map(encode);
const inGamut = (color, gamut) => toGamut(color, gamut).every(c => c >= -0.0005 && c <= 1.0005);

// Out-of-gamut frames are clipped per channel.
function luminance(color, gamut) {
  const clipped = toGamut(color, gamut).map(c => decode(Math.min(1, Math.max(0, c))));
  return clipped.reduce((sum, c, i) => sum + c * GAMUTS[gamut].luminanceRow[i], 0);
}

function contrastRatio(a, b, gamut) {
  const [high, low] = [luminance(a, gamut), luminance(b, gamut)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// color-mix(in oklch, ...) on the shorter hue arc.
function mix(from, to, share) {
  const hueStep = ((((to[2] - from[2]) % 360) + 540) % 360) - 180;
  return [0, 1, 2].map(i => from[i] + (i === 2 ? hueStep : to[i] - from[i]) * share);
}

// oklch(from <tint> var(--dark-lightness) calc(c * var(--dark-chroma)) h)
const darken = ([, c, h]) => [readNumber('dark-lightness'), c * readNumber('dark-chroma'), h];

// Grounds in page order; from kiwi on, each floods from the one before.
const GROUNDS = [
  ['mango', '.hero'],
  ['straw', '.band-strawberries'],
  ['kiwi', '.band-kiwi'],
  ['lemon', '.band-pineapple'],
  ['bloom', '.band-blueberries'],
  ['cream', '.files']
];

const groundPairs = (ground, label) => [
  ['cocoa', ground, 4.5, `light: cocoa text on ${label}`],
  ['cream', darken(ground), 4.5, `dark: cream text on ${label}`],
  [ground, darken(ground), 3.0, `dark: heading on ${label}`]
];

function pairsFor(palette) {
  const floods = GROUNDS.slice(2).flatMap(([to, where], index) => {
    const from = GROUNDS[index + 1][0];
    return Array.from({ length: 21 }, (_, step) =>
      groundPairs(mix(palette[from], palette[to], step / 20), `${where}, ${from} to ${to} at ${step * 5}%`)
    ).flat();
  });
  return [
    ...GROUNDS.flatMap(([name, where]) => groundPairs(palette[name], `${where} (${name})`)),
    ...floods,
    ['mango', 'cocoa', 4.5, 'light: mango on cocoa (.pill)'],
    [darken(palette.mango), 'cream', 4.5, 'dark: dark mango on cream (.pill)'],
    ['cream', 'plum', 4.5, 'cream text on plum (.site-footer)'],
    ['kiwi', 'plum', 4.5, 'kiwi on plum (.footer-links a)'],
    ['mango', 'plum', 3.0, 'mango on plum (.footer-word)'],
    ['cream', 'cocoa', 4.5, 'cream on cocoa (.inspector)'],
    ['kiwi', 'cocoa', 4.5, 'kiwi on cocoa (.inspector-target)']
  ];
}

let failures = 0;
function report(passed, line) {
  if (!passed) failures++;
  console.log(`${passed ? 'ok  ' : 'FAIL'} ${line}`);
}

for (const [gamut, own] of [['srgb', srgb], ['p3', p3Only]]) {
  const palette = { ...srgb, ...own };
  for (const [name, color] of Object.entries(own)) report(inGamut(color, gamut), `${gamut} gamut: --${name}`);
  for (const [text, ground, floor, label] of pairsFor(palette)) {
    const ratio = contrastRatio(palette[text] ?? text, palette[ground] ?? ground, gamut);
    report(ratio >= floor, `${gamut} ${label}: ${ratio.toFixed(2)} >= ${floor.toFixed(1)}`);
  }
}

console.log(failures ? `\n${failures} failing` : '\nall checks hold');
process.exit(failures ? 1 : 0);
