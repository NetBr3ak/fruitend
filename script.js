document.addEventListener('DOMContentLoaded', function () {
	const root = document.documentElement;
	const pad = n => String(n).padStart(2, '0');

	// hidePopover() on a closed popover and showPopover() on an open one both throw.
	const open = el => { if (!el.matches(':popover-open')) el.showPopover(); };
	const close = el => { if (el.matches(':popover-open')) el.hidePopover(); };

	/* ---------- the citrus slice is the clock ---------- */

	const clock = document.getElementById('clock');
	const clockTime = clock.querySelector('.clock-time');
	// Without script the dial is a picture of noon, so the slider semantics and the drag note
	// arrive only here, with the code that makes them true.
	const slider = { role: 'slider', tabindex: '0', 'aria-label': 'Time of day', 'aria-valuemin': '0',
		'aria-valuemax': '1439', 'aria-describedby': 'clock-note' };
	Object.entries(slider).forEach(([name, value]) => clock.setAttribute(name, value));
	document.getElementById('clock-note').hidden = false;
	const STEP = { ArrowUp: 15, ArrowRight: 15, ArrowDown: -15, ArrowLeft: -15, PageUp: 60, PageDown: -60 };
	const nowBtn = document.getElementById('clock-now');
	const timeBar = document.getElementById('time-bar');
	const barClock = document.querySelector('.bar-clock');
	let minutes = null; // the dial's time in minutes since midnight, 0 to 1439
	let hand = 0; // degrees, never wrapped, so every move turns the hand the short way round
	let following = false; // the dial keeps up with the wall clock until someone sets it
	let drag = null; // pointerId of the one pointer that moves the hand
	let touchStart = null; // [x, y] of a touch that has not set the time yet

	const wallMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
	// Minutes from m to the nearest noon: 0 at 12:00, 360 at 06:00 and 18:00, 720 at 00:00.
	const noonDistance = m => { const d = (m + 720) % 1440; return Math.min(d, 1440 - d); };

	function setTod(next) {
		next = (Math.round(next) % 1440 + 1440) % 1440;
		if (next === minutes) return;
		minutes = next;
		// Noon sits at the top and midnight at the bottom. --tod is the distance from noon:
		// 0 at 12:00, .5 at 06:00 and 18:00, 1 at 00:00, so a turn never jumps.
		root.style.setProperty('--tod', (noonDistance(minutes) / 720).toFixed(4));
		const fromNoon = (minutes + 720) % 1440;
		hand += ((fromNoon / 4 - hand) % 360 + 540) % 360 - 180;
		root.style.setProperty('--hand', `${hand.toFixed(2)}deg`);
		const time = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
		clock.setAttribute('aria-valuenow', minutes);
		clock.setAttribute('aria-valuetext', time);
		clockTime.textContent = time;
		// The range steps by 15 minutes, so it may round; the time beside it stays exact.
		timeBar.value = minutes;
		timeBar.setAttribute('aria-valuetext', time);
		barClock.textContent = time;
		clock.dispatchEvent(new Event('input'));
	}

	// Any hand on the dial stops it following the wall clock; "Back to now" starts it again.
	function choose(next) {
		following = false;
		nowBtn.hidden = pinned;
		setTod(next);
	}

	// Night is 18:00 to 06:00, where --tod is .5 or more (styles.css, the round() block).
	const isNight = m => noonDistance(m) >= 360;
	const calm = matchMedia('(prefers-reduced-motion: reduce)');

	// A jump across 06:00 or 18:00 cross-fades the whole page in one 400 ms view transition,
	// instead of the night switching in one frame halfway through the 600 ms colour fade.
	// A drag stays direct. The fade sets the time one frame later, so until then `pending` holds
	// it: keys pressed in that frame count from it, and the fade shows the newest one. A second
	// fade never starts over a running one, which would skip it and reject its promises.
	let fade = null;
	let pending = null; // { next, show } until the running fade has set the time

	function across(next, show = choose) {
		if (pending) {
			pending = { next, show };
			return;
		}
		if (fade || typeof document.startViewTransition !== 'function' || calm.matches || isNight(next) === isNight(minutes)) {
			show(next);
			return;
		}
		pending = { next, show };
		root.classList.add('scrubbing');
		fade = document.startViewTransition(() => {
			pending.show(pending.next);
			pending = null;
		});
		fade.finished.finally(() => {
			fade = null;
			root.classList.remove('scrubbing');
		});
	}

	// Minutes since midnight under the pointer, read clockwise from noon at the top. Null on the
	// cream disc in the middle (26% of the padding box's radius, as styles.css paints it): there
	// the angle swings wildly with every pixel, so a press on the time would throw the hand anywhere.
	function minutesAt(e) {
		const r = clock.getBoundingClientRect();
		const x = e.clientX - r.left - r.width / 2;
		const y = r.top + r.height / 2 - e.clientY;
		if (Math.hypot(x, y) < clock.clientWidth / 2 * .26) return null;
		return 720 + (Math.atan2(x, y) * 180 / Math.PI + 360) % 360 * 4;
	}

	const jumpTo = e => { const next = minutesAt(e); if (next !== null) choose(next); };

	// Only the main button of the primary pointer turns the hand: a right click opens the menu,
	// and a second finger must not take over a drag in progress.
	clock.addEventListener('pointerdown', e => {
		if (drag !== null || !e.isPrimary || e.button !== 0) return;
		drag = e.pointerId;
		clock.setPointerCapture(e.pointerId);
		root.classList.add('scrubbing');
		// A press sets the time at once. A touch off the knob waits: it may still turn into a
		// page scroll. The knob has touch-action: none, so a finger there always drags.
		touchStart = e.pointerType === 'touch' && !e.target.closest('.knob') ? [e.clientX, e.clientY] : null;
		if (!touchStart) jumpTo(e);
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
		}
		jumpTo(e);
	});

	function end(e) {
		if (e.pointerId !== drag) return;
		// A tap: the finger lifted before it went sideways.
		const tap = e.type === 'pointerup' && touchStart ? minutesAt(e) : null;
		drag = null;
		touchStart = null;
		root.classList.remove('scrubbing');
		if (tap !== null) across(tap);
	}

	['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => clock.addEventListener(type, end));

	// WAI-ARIA slider keys. The pointer may wrap past midnight; the keys stop at 00:00 and 23:59.
	clock.addEventListener('keydown', e => {
		// Alt+Left is Back, Ctrl and Cmd shortcuts belong to the browser.
		if (e.altKey || e.ctrlKey || e.metaKey) return;
		const jump = e.key === 'Home' ? 0 : e.key === 'End' ? 1439 : null;
		if (jump === null && STEP[e.key] === undefined) return;
		e.preventDefault();
		const next = jump ?? Math.min(1439, Math.max(0, (pending?.next ?? minutes) + STEP[e.key]));
		across(next);
	});

	timeBar.addEventListener('input', () => choose(Number(timeBar.value)));

	// scroll-padding in styles.css keeps focus and anchors below the bar at its real height.
	const bar = document.querySelector('.bar');
	if ('ResizeObserver' in window) {
		new ResizeObserver(() => root.style.setProperty('--bar-h', `${bar.offsetHeight}px`)).observe(bar);
	}

	// The bar's slider shows while the dial is off screen (under the bar counts as off), so the
	// time stays in reach next to the blocks it colours. It stays while it has the focus.
	if ('IntersectionObserver' in window) {
		let dialOnScreen = true;
		const showTimeBar = () => {
			const show = !dialOnScreen || document.activeElement === timeBar;
			timeBar.parentElement.hidden = !show;
			bar.classList.toggle('timed', show);
		};
		new IntersectionObserver(([entry]) => {
			dialOnScreen = entry.isIntersecting;
			showTimeBar();
		}, { rootMargin: `-${bar.offsetHeight}px 0px 0px 0px` }).observe(clock);
		timeBar.addEventListener('blur', showTimeBar);
	}

	nowBtn.addEventListener('click', () => {
		across(wallMinutes(), wall => {
			following = true;
			nowBtn.hidden = true;
			setTod(wall);
		});
		// The button hides under the focus; the dial is where the visitor was working.
		clock.focus();
	});

	// One tick at the turn of each minute, so a page left open keeps the real time.
	function tick() {
		if (following) setTod(wallMinutes());
		setTimeout(tick, 60000 - Date.now() % 60000);
	}

	// ?t=23 or ?t=9.5 pins the dial for a screenshot and stops it following the clock.
	const raw = new URLSearchParams(location.search).get('t');
	const hours = raw === null ? NaN : Number(raw);
	const pinned = Number.isFinite(hours);
	following = !pinned;
	// The first time lands without the 600 ms fade, or a page opened at night would show noon
	// first. Reading the computed style applies it while the fade is off.
	root.classList.add('scrubbing');
	setTod(pinned ? hours * 60 : wallMinutes());
	getComputedStyle(root).getPropertyValue('--tod');
	requestAnimationFrame(() => root.classList.remove('scrubbing'));
	if (following) tick();

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
	// The ticker moves only once Pause works (WCAG 2.2.2), so without JavaScript it stands still.
	ticker.classList.add('is-ready');
	tickerBtn.parentElement.hidden = false;
	tickerBtn.hidden = false;

	/* ---------- the three files, measured on this visit ---------- */

	// Resource Timing gives each file this page fetched its decoded size and load time; the page
	// itself is the navigation entry. Opened from the disk the sizes are 0, so nothing shows.
	if ('getEntriesByType' in performance) {
		const entries = performance.getEntriesByType('resource');
		const timing = file => file === 'index.html' ? performance.getEntriesByType('navigation')[0]
			: entries.find(e => new URL(e.name).pathname.endsWith('/' + file));
		let measured = 0;
		document.querySelectorAll('.chips li').forEach(li => {
			const entry = timing(li.textContent.trim());
			if (!entry?.decodedBodySize) return;
			for (const text of [`${(entry.decodedBodySize / 1000).toFixed(1)} kB`, `${Math.round(entry.responseEnd - entry.startTime)} ms`]) {
				const cell = document.createElement('span');
				cell.textContent = text;
				li.append(cell);
			}
			measured++;
		});
		document.querySelector('.files-note').hidden = !measured;
	}

	/* ---------- inspector ---------- */

	// The panel is a popover. Without the API, matches(':popover-open') throws, so the button
	// stays hidden and nothing below runs.
	if (!('popover' in HTMLElement.prototype)) return;

	const probe = document.getElementById('probe');
	const halo = document.getElementById('probe-halo');
	const probeBtn = document.getElementById('probe-toggle');
	const probeTarget = probe.querySelector('.probe-target');
	const probeBox = probe.querySelector('.probe-box');
	const probeLabel = probe.querySelector('.probe-label');
	const probeRules = probe.querySelector('.probe-rules');
	probe.hidden = false;
	probeBtn.hidden = false;
	const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
	let inspecting = false;
	let inspected = null;
	let frame = 0;

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

	// A ratio is only honest against one solid colour. A gradient or an image on the way up (the
	// cream disc in the clock is a radial-gradient over the mango hero) or any transparency
	// means the text sits on something this cannot measure, so it returns null.
	function groundOf(el) {
		for (let n = el; n; n = n.parentElement) {
			const s = getComputedStyle(n);
			if (s.backgroundImage !== 'none') return null;
			const c = paint(s.backgroundColor);
			if (c[3] === 1) return c;
			if (c[3] > 0) return null;
		}
		return null;
	}

	function textContrast(el, s) {
		const ink = paint(s.color);
		const ground = groundOf(el);
		if (ink[3] < 1 || !ground || s.opacity !== '1') return 'text contrast not calculated for this background';
		return `text ${contrast(ink, ground).toFixed(2)}:1`;
	}

	// A rule inside a @media or @supports block is only worth showing when its condition is
	// live right now, otherwise the panel lists CSS the element is not actually getting.
	// A @container condition depends on the box around the element, which no API evaluates,
	// so those rules stay and the panel writes their condition in front of them.
	const inContainer = rule => rule.constructor.name === 'CSSContainerRule';
	const live = rule => rule.media ? matchMedia(rule.conditionText).matches
		: inContainer(rule) || rule.conditionText === undefined ? true
			: CSS.supports(rule.conditionText);
	const ruleText = rule => rule.parentRule && inContainer(rule.parentRule)
		? `@container ${rule.parentRule.conditionText} {\n${rule.cssText}\n}` : rule.cssText;

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
	function place(r) {
		halo.style.translate = `${r.left}px ${r.top}px`;
		halo.style.width = `${r.width}px`;
		halo.style.height = `${r.height}px`;
		// Shown here, not with the panel: before the first element it was a dot at the top left.
		halo.hidden = false;
	}

	const track = () => { if (inspected) place(inspected.getBoundingClientRect()); };

	// The clock, a resize and the end of the palette's 600 ms fade all change what the panel
	// shows; one frame folds a burst of them into one read.
	function refresh() {
		if (!inspected || frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (inspected) describe(inspected);
		});
	}

	const settle = e => { if (e.propertyName === '--tod') refresh(); };

	function describe(el) {
		const s = getComputedStyle(el);
		const r = el.getBoundingClientRect();
		const matched = authoredRules(el);

		inspected = el;
		place(r);

		probeTarget.textContent = el.tagName.toLowerCase() + [...el.classList].map(c => '.' + c).join('');
		probeBox.textContent = [
			`${Math.round(r.width)} x ${Math.round(r.height)} px`,
			`padding ${s.padding}`,
			`radius ${s.borderRadius}`,
			s.display.includes('flex') || s.display.includes('grid') ? `gap ${s.gap}` : null,
			textContrast(el, s),
		].filter(Boolean).join('  |  ');

		probeLabel.hidden = false;
		probeRules.textContent = matched.length
			? matched.slice(-6).map(rule => ruleText(rule).slice(0, 320)).join('\n\n')
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
		window[bind]('resize', refresh);
		clock[bind]('input', refresh);
		root[bind]('transitionend', settle);

		if (!on) {
			cancelAnimationFrame(frame);
			frame = 0;
			close(probe);
			halo.hidden = true;
			inspected = null;
			if (resumeTicker) setPaused(false);
			return;
		}
		probeTarget.textContent = 'Point at anything';
		probeBox.textContent = 'Hover or tab to an element and its real box lands here.';
		probeLabel.hidden = true;
		probeRules.textContent = '';
		open(probe);
		resumeTicker = !paused;
		setPaused(true);
	}

	probeBtn.addEventListener('click', () => setInspecting(!inspecting));
	probe.querySelector('.probe-close').addEventListener('click', () => {
		setInspecting(false);
		// The close button disappears with the panel; without this, focus falls back to the top of the page.
		probeBtn.focus();
	});

	addEventListener('keydown', e => {
		if (e.key === 'Escape' && inspecting) setInspecting(false);
	});
});
