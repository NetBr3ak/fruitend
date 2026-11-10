document.addEventListener('DOMContentLoaded', function () {
	const root = document.documentElement;
	const pad = n => String(n).padStart(2, '0');

	// hidePopover() on a closed popover and showPopover() on an open one both throw.
	const open = el => { if (!el.matches(':popover-open')) el.showPopover(); };
	const close = el => { if (el.matches(':popover-open')) el.hidePopover(); };

	/* ---------- reveal ---------- */

	const reveal = document.querySelectorAll('[data-reveal]');

	if ('IntersectionObserver' in window && reveal.length) {
		const seen = new IntersectionObserver((entries, obs) => {
			entries.forEach(entry => {
				if (!entry.isIntersecting) return;
				entry.target.classList.add('in');
				obs.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -12% 0px' });

		// The hiding class goes on only once the observer exists, so a script failure
		// anywhere above this line leaves the content visible instead of blank.
		root.classList.add('js');
		reveal.forEach(el => seen.observe(el));
	}

	/* ---------- the citrus slice is the clock ---------- */

	const clock = document.getElementById('clock');
	const clockTime = clock.querySelector('.clock-time');
	const STEP = { ArrowUp: 15, ArrowRight: 15, ArrowDown: -15, ArrowLeft: -15, PageUp: 60, PageDown: -60 };
	let tod = null; // minutes past noon, 0 to 720
	let drag = null; // pointerId of the one pointer that moves the hand
	let touchStart = null; // [x, y] of a touch that has not set the time yet

	function setTod(minutes) {
		const next = Math.min(720, Math.max(0, Math.round(minutes)));
		if (next === tod) return;
		tod = next;
		root.style.setProperty('--tod', (tod / 720).toFixed(4));
		const wall = (720 + tod) % 1440;
		const time = `${pad(Math.floor(wall / 60))}:${pad(wall % 60)}`;
		clock.setAttribute('aria-valuenow', tod);
		clock.setAttribute('aria-valuetext', time);
		clockTime.textContent = time;
	}

	// Minutes past noon under the pointer, read clockwise from twelve. Null on the cream disc in
	// the middle (26% of the padding box's radius, as styles.css paints it): there the angle swings
	// wildly with every pixel, so a press on the time would throw the hand anywhere.
	function minutesAt(e) {
		const r = clock.getBoundingClientRect();
		const x = e.clientX - r.left - r.width / 2;
		const y = r.top + r.height / 2 - e.clientY;
		if (Math.hypot(x, y) < clock.clientWidth / 2 * .26) return null;
		return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360 / 360 * 720;
	}

	const jumpTo = e => { const next = minutesAt(e); if (next !== null) setTod(next); };

	// Past twelve the drag stops at the end it reached: wrapping round would flip the
	// whole page between midnight and noon in one frame.
	function follow(e) {
		let next = minutesAt(e);
		if (next === null) return;
		if (Math.abs(next - tod) > 360) next = tod > 360 ? 720 : 0;
		setTod(next);
	}

	// Only the main button of the primary pointer turns the hand: a right click opens the menu,
	// and a second finger must not take over a drag in progress.
	clock.addEventListener('pointerdown', e => {
		if (drag !== null || !e.isPrimary || e.button !== 0) return;
		drag = e.pointerId;
		clock.setPointerCapture(e.pointerId);
		root.classList.add('scrubbing');
		// On the knob the drag rule holds from the first touch, so grabbing it just left of twelve
		// at noon does not jump to midnight. A press anywhere else jumps to that time; a touch off
		// the knob may still turn into a page scroll.
		const onKnob = e.target.closest('.knob');
		touchStart = e.pointerType === 'touch' && !onKnob ? [e.clientX, e.clientY] : null;
		if (onKnob) follow(e);
		else if (!touchStart) jumpTo(e);
	});

	clock.addEventListener('pointermove', e => {
		if (e.pointerId !== drag) return;
		if (touchStart) {
			// touch-action: pan-y turns a mostly vertical swipe into a page scroll, but Chromium
			// still sends about three pointermoves (20 px) before its pointercancel. Until the
			// finger goes sideways the time stays put, or every scroll would flash the palette.
			const [x, y] = touchStart;
			if (Math.abs(e.clientY - y) >= Math.abs(e.clientX - x)) return;
			touchStart = null;
			jumpTo(e);
			return;
		}
		follow(e);
	});

	function end(e) {
		if (e.pointerId !== drag) return;
		// A tap: the finger lifted before it went sideways.
		if (e.type === 'pointerup' && touchStart) jumpTo(e);
		drag = null;
		touchStart = null;
		root.classList.remove('scrubbing');
	}

	['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => clock.addEventListener(type, end));

	clock.addEventListener('keydown', e => {
		// Alt+Left is Back, Ctrl and Cmd shortcuts belong to the browser.
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		const jump = e.key === 'Home' ? 0 : e.key === 'End' ? 720 : null;
		if (jump === null && STEP[e.key] === undefined) return;
		e.preventDefault();
		setTod(jump === null ? tod + STEP[e.key] : jump);
	});

	// ?t=23 pins the dial for a screenshot. The ramp starts at noon, so earlier hours clamp there.
	const raw = new URLSearchParams(location.search).get('t');
	const pinned = raw === null ? NaN : Number(raw) * 60 - 720;
	const now = new Date();
	setTod(Number.isFinite(pinned) ? pinned : now.getHours() * 60 + now.getMinutes() - 720);

	/* ---------- ticker ---------- */

	const ticker = document.querySelector('.ticker');
	const tickerBtn = document.getElementById('ticker-toggle');
	let paused = false;
	// Inspect stops a running ticker so a hover target holds still; leaving Inspect starts it
	// again, unless the visitor pressed Pause or Play in between.
	let resumeTicker = false;

	function setPaused(on) {
		paused = on;
		ticker.classList.toggle('paused', paused);
		tickerBtn.textContent = paused ? 'Play' : 'Pause';
	}

	tickerBtn.addEventListener('click', () => {
		resumeTicker = false;
		setPaused(!paused);
	});

	/* ---------- inspector ---------- */

	const probe = document.getElementById('probe');
	const halo = document.getElementById('probe-halo');
	const probeBtn = document.getElementById('probe-toggle');
	const probeTarget = probe.querySelector('.probe-target');
	const probeBox = probe.querySelector('.probe-box');
	const probeRules = probe.querySelector('.probe-rules');
	const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
	let inspecting = false;
	let inspected = null;

	const lin = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
	const luminance = ([r, g, b]) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);

	// The palette is authored in oklch(), so computed values come back as oklch strings.
	// One canvas pixel is the shortest way to get sRGB out of any colour the engine parses.
	function paint(color) {
		swatch.clearRect(0, 0, 1, 1);
		swatch.fillStyle = color;
		swatch.fillRect(0, 0, 1, 1);
		return [...swatch.getImageData(0, 0, 1, 1).data].map(v => v / 255);
	}

	function contrast(a, b) {
		const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return (hi + .05) / (lo + .05);
	}

	function groundOf(el) {
		for (let n = el; n; n = n.parentElement) {
			const c = paint(getComputedStyle(n).backgroundColor);
			if (c[3] > 0) return c;
		}
		return [0, 0, 0, 1];
	}

	// A rule inside a @media or @supports block is only worth showing when its condition is
	// live right now, otherwise the panel lists CSS the element is not actually getting.
	const live = rule => rule.media ? matchMedia(rule.conditionText).matches
		: rule.conditionText === undefined ? true
			: CSS.supports(rule.conditionText);

	const flatten = rules => [...rules].flatMap(r =>
		r.cssRules ? (live(r) ? [r, ...flatten(r.cssRules)] : []) : [r]);

	function authoredRules(el) {
		return [...document.styleSheets].flatMap(sheet => {
			// cssRules throws SecurityError on a cross-origin sheet, and also on this page's
			// own styles.css whenever index.html is opened straight off the disk, which is
			// exactly what the README tells people to do. The computed-value readout below
			// is the common path here, not a defensive extra.
			try { return flatten(sheet.cssRules); } catch { return []; }
		}).filter(rule => {
			if (!rule.selectorText) return false;
			try { return el.matches(rule.selectorText); } catch { return false; }
		});
	}

	// The halo is position: fixed, and a scroll by finger fires no pointerover or focusin, so
	// it is placed again on every scroll or it stays where the element used to be.
	function place() {
		const r = inspected.getBoundingClientRect();
		halo.style.translate = `${r.left}px ${r.top}px`;
		halo.style.width = `${r.width}px`;
		halo.style.height = `${r.height}px`;
		// Shown here, not with the panel: before the first element it was a dot at the top left.
		halo.hidden = false;
	}

	const track = () => { if (inspected) place(); };

	function describe(el) {
		const s = getComputedStyle(el);
		const r = el.getBoundingClientRect();
		const matched = authoredRules(el);

		inspected = el;
		place();

		probeTarget.textContent = el.tagName.toLowerCase() + [...el.classList].map(c => '.' + c).join('');
		probeBox.textContent = [
			`${Math.round(r.width)} x ${Math.round(r.height)} px`,
			`padding ${s.padding}`,
			`radius ${s.borderRadius}`,
			s.display.includes('flex') || s.display.includes('grid') ? `gap ${s.gap}` : null,
			`text ${contrast(paint(s.color), groundOf(el)).toFixed(2)}:1`,
		].filter(Boolean).join('  |  ');

		probeRules.textContent = matched.length
			? matched.slice(-6).map(rule => rule.cssText.slice(0, 320)).join('\n\n')
			: 'No authored rules readable. Opened from the disk, the browser treats styles.css '
			+ 'as another origin and cssRules throws, so only the computed values above survive. '
			+ 'Serve the folder over http and this fills in.';
	}

	function look(e) {
		const el = e.target;
		if (!(el instanceof Element) || probe.contains(el)) return;
		describe(el);
	}

	function setInspecting(on) {
		inspecting = on;
		probeBtn.setAttribute('aria-pressed', String(on));

		const bind = on ? 'addEventListener' : 'removeEventListener';
		document[bind]('pointerover', look);
		document[bind]('focusin', look);
		document[bind]('scroll', track, { passive: true });

		if (!on) {
			close(probe);
			halo.hidden = true;
			inspected = null;
			if (resumeTicker) setPaused(false);
			return;
		}
		probeTarget.textContent = 'Point at anything';
		probeBox.textContent = 'Hover or tab to an element and its real box lands here.';
		probeRules.textContent = '';
		open(probe);
		resumeTicker = !paused;
		setPaused(true);
	}

	probeBtn.addEventListener('click', () => setInspecting(!inspecting));

	addEventListener('keydown', e => {
		if (e.key === 'Escape' && inspecting) setInspecting(false);
	});
});
