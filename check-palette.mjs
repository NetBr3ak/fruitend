const COLORS = {
 mango: '#ffa732',
 lemon: '#ffd166',
 cream: '#ffe9cf',
 straw: '#ef4040',
 magenta: '#b0107f',
 kiwi: '#5ce1a0',
 midnight: '#001a66',
 plum: '#0b0510',
 cocoa: '#1a0c05'
};
const PAIRS = [
 ['cocoa', 'mango', 4.5, 'bar links, hero title, .press label'],
 ['midnight', 'mango', 4.5, 'nav + ghost hover (M1 fix), 12-13px'],
 ['cream', 'cocoa', 4.5, 'ticker, skip link, inspector'],
 ['cocoa', 'straw', 4.5, '.pill-ink hover, .fruits-title'],
 ['cream', 'straw', 3.0, '.numeral at 1.5em'],
 ['cream', 'magenta', 4.5, '.blk-tall body copy'],
 ['cocoa', 'kiwi', 4.5, '.blk-kiwi body copy'],
 ['cocoa', 'lemon', 4.5, '.blk-pineapple body copy'],
 ['cocoa', 'cream', 4.5, '.files section'],
 ['cream', 'midnight', 4.5, '.cta title and note'],
 ['kiwi', 'plum', 4.5, 'footer links'],
 ['cream', 'plum', 4.5, 'footer copy'],
 ['mango', 'plum', 4.5, 'footer link hover'],
 ['kiwi', 'cocoa', 4.5, 'inspector target and rules label']
];
const linear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hexToRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const contrast = (a, b) => {
 const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
 return (hi + 0.05) / (lo + 0.05);
};
let failures = 0;
const fail = msg => {
 failures++;
 console.log('FAIL ' + msg);
};
for (const [fg, bg, min, where] of PAIRS) {
 const ratio = contrast(hexToRgb(COLORS[fg]), hexToRgb(COLORS[bg]));
 const line = `${fg} on ${bg} >= ${min.toFixed(1)}  ratio ${ratio.toFixed(2)}  (${where})`;
 if (ratio < min) fail(line);
 else console.log('ok   ' + line);
}
console.log(failures ? `\n${failures} failing` : '\nall pairs hold');
process.exit(failures ? 1 : 0);
