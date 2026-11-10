// Guards mechanism A: the whole palette is derived from --tod (0 = noon, 1 = midnight)
// with oklch() relative colours, so one number moves every block. This asserts that no
// value on that ramp leaves sRGB or drops a text pair under its WCAG floor.
// Run: node check-palette.mjs

// --tod 0 -> 1. Deltas are added to the seed's oklch L, C and H.
const RAMP = {
	mango: ['#ffa732', -0.10, 0, -28],
	lemon: ['#ffd166', -0.08, -0.025, -26],
	cream: ['#ffe9cf', -0.020, -0.020, -60],
	straw: ['#ef4040', -0.010, -0.010, -14],
	magenta: ['#b0107f', -0.035, -0.020, -12],
	kiwi: ['#5ce1a0', -0.060, -0.020, 26],
	// The dark end is already midnight, so it stays put and the warm end travels to meet it.
	midnight: ['#001a66', 0, 0, 0],
	plum: ['#0b0510', 0, 0, 0],
	cocoa: ['#1a0c05', 0, 0, 0],
};

// fg, bg, minimum ratio. 3.0 rows are display-size text only (>=24px or >=18.66px bold).
const PAIRS = [
	['cocoa', 'mango', 4.5, 'bar links, hero title, .press label'],
	['midnight', 'mango', 4.5, 'nav + ghost hover (M1 fix), 12-13px'],
	['cream', 'cocoa', 4.5, 'ticker, skip link, inspector'],
	['cocoa', 'straw', 4.5, '.pill-ink hover, .fruits-title'],
	['cream', 'straw', 3.0, '.numeral at 1.5em'],
	['cream', 'magenta', 4.5, '.blk-tall body copy'],
	['cocoa', 'kiwi', 4.5, '.blk-kiwi body copy'],
	['cocoa', 'lemon', 4.5, '.blk-lemon body copy'],
	['cocoa', 'cream', 4.5, '.files section'],
	['cream', 'midnight', 4.5, '.cta title and note'],
	['kiwi', 'plum', 4.5, 'footer links'],
	['cream', 'plum', 4.5, 'footer copy'],
	['mango', 'plum', 4.5, 'footer link hover'],
	['kiwi', 'cocoa', 4.5, 'inspector target and rules label'],
];

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function rgbToOklch([r, g, b]) {
	const [R, G, B] = [r, g, b].map(lin);
	const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
	const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
	const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	return [L, Math.hypot(A, Bb), (Math.atan2(Bb, A) * 180) / Math.PI];
}

function oklchToRgb([L, C, H]) {
	const h = (H * Math.PI) / 180;
	const A = C * Math.cos(h), B = C * Math.sin(h);
	const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
	const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
	const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
	return [
		gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
	];
}

const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
	return (x + 0.05) / (y + 0.05);
};

const at = (name, t) => {
	const [seed, dl, dc, dh] = RAMP[name];
	const [L, C, H] = rgbToOklch(hexToRgb(seed));
	return oklchToRgb([L + dl * t, Math.max(0, C + dc * t), H + dh * t]);
};

let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL ' + msg); };
const steps = Array.from({ length: 21 }, (_, i) => i / 20);

for (const name of Object.keys(RAMP)) {
	for (const t of steps) {
		const rgb = at(name, t);
		// Out of gamut means the browser silently gamut-maps and every ratio below is a guess.
		if (rgb.some((c) => c < -0.002 || c > 1.002)) {
			fail(`--${name} leaves sRGB at --tod ${t.toFixed(2)}: ${rgb.map((c) => c.toFixed(3))}`);
			break;
		}
	}
}

for (const [fg, bg, min, where] of PAIRS) {
	let worst = Infinity, worstT = 0;
	for (const t of steps) {
		const r = contrast(at(fg, t), at(bg, t));
		if (r < worst) { worst = r; worstT = t; }
	}
	const line = `${fg} on ${bg} >= ${min.toFixed(1)}  worst ${worst.toFixed(2)} at --tod ${worstT.toFixed(2)}  (${where})`;
	if (worst < min) fail(line); else console.log('ok   ' + line);
}

console.log(failures ? `\n${failures} failing` : '\nall pairs hold across the whole noon to midnight ramp');
process.exit(failures ? 1 : 0);
