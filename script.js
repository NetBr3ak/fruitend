document.addEventListener('DOMContentLoaded', function () {
 const root = document.documentElement;
 const open = el => {
  if (!el.matches(':popover-open')) el.showPopover();
 };
 const close = el => {
  if (el.matches(':popover-open')) el.hidePopover();
 };
 const bar = document.querySelector('.bar');
 if ('ResizeObserver' in window) {
  new ResizeObserver(() => root.style.setProperty('--bar-h', `${bar.offsetHeight}px`)).observe(bar);
 }
 const motionBtn = document.getElementById('motion-toggle');
 let paused = false;
 let resumeMotion = false;
 function setPaused(on) {
  paused = on;
  root.classList.toggle('paused', paused);
  motionBtn.textContent = paused ? 'Play motion' : 'Pause motion';
 }
 motionBtn.addEventListener('click', () => {
  resumeMotion = false;
  setPaused(!paused);
 });
 root.classList.add('is-ready');
 motionBtn.hidden = false;
 if ('getEntriesByType' in performance) {
  const entries = performance.getEntriesByType('resource');
  const timing = file =>
   file === 'index.html'
    ? performance.getEntriesByType('navigation')[0]
    : entries.find(resource => new URL(resource.name).pathname.endsWith('/' + file));
  const sizes = new Map();
  const chips = document.querySelector('.chips');
  chips.querySelectorAll('li').forEach(li => {
   const entry = timing(li.textContent.trim());
   if (!entry?.decodedBodySize) return;
   for (const text of [
    `${(entry.decodedBodySize / 1000).toFixed(1)} kB`,
    `${Math.round(entry.responseEnd - entry.startTime)} ms`
   ]) {
    const cell = document.createElement('span');
    cell.textContent = text;
    li.append(cell);
   }
   sizes.set(li, entry.decodedBodySize);
  });
  const largest = Math.max(...sizes.values());
  sizes.forEach((size, li) => li.style.setProperty('--share', (size / largest).toFixed(3)));
  chips.classList.toggle('measured', sizes.size > 0);
  document.querySelector('.files-note').hidden = !sizes.size;
 }
 if (!('popover' in HTMLElement.prototype)) return;
 const probe = document.getElementById('probe');
 const halo = document.getElementById('probe-halo');
 const probeBtn = document.getElementById('probe-toggle');
 const probeTarget = probe.querySelector('.probe-target');
 const probeBox = probe.querySelector('.probe-box');
 const probeLabel = probe.querySelector('.probe-label');
 const probeRules = probe.querySelector('.probe-rules');
 probe.hidden = false;
 probeBtn.parentElement.hidden = false;
 probeBtn.hidden = false;
 const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
 let inspecting = false;
 let inspected = null;
 let frame = 0;
 const linear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
 const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
 function paint(color) {
  swatch.clearRect(0, 0, 1, 1);
  swatch.fillStyle = color;
  swatch.fillRect(0, 0, 1, 1);
  return [...swatch.getImageData(0, 0, 1, 1).data].map(channel => channel / 255);
 }
 function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
 }
 function groundOf(el) {
  for (let node = el; node; node = node.parentElement) {
   const style = getComputedStyle(node);
   if (style.backgroundImage !== 'none') return null;
   const color = paint(style.backgroundColor);
   if (color[3] === 1) return color;
   if (color[3] > 0) return null;
  }
  return null;
 }
 function textContrast(el, style) {
  const ink = paint(style.color);
  const ground = groundOf(el);
  if (ink[3] < 1 || !ground || style.opacity !== '1') return 'text contrast not calculated for this background';
  return `text ${contrast(ink, ground).toFixed(2)}:1`;
 }
 const inContainer = rule => rule.constructor.name === 'CSSContainerRule';
 const live = rule =>
  rule.media
   ? matchMedia(rule.conditionText).matches
   : inContainer(rule) || rule.conditionText === undefined
     ? true
     : CSS.supports(rule.conditionText);
 const ruleText = rule =>
  rule.parentRule && inContainer(rule.parentRule)
   ? `@container ${rule.parentRule.conditionText} {\n${rule.cssText}\n}`
   : rule.cssText;
 const flatten = rules =>
  [...rules].flatMap(rule => (rule.cssRules ? (live(rule) ? [rule, ...flatten(rule.cssRules)] : []) : [rule]));
 function authoredRules(el) {
  return [...document.styleSheets]
   .flatMap(sheet => {
    try {
     return flatten(sheet.cssRules);
    } catch {
     return [];
    }
   })
   .filter(rule => {
    if (!rule.selectorText) return false;
    try {
     return el.matches(rule.selectorText);
    } catch {
     return false;
    }
   });
 }
 function place(rect) {
  halo.style.translate = `${rect.left}px ${rect.top}px`;
  halo.style.width = `${rect.width}px`;
  halo.style.height = `${rect.height}px`;
  halo.hidden = false;
 }
 const track = () => {
  if (inspected) place(inspected.getBoundingClientRect());
 };
 function refresh() {
  if (!inspected || frame) return;
  frame = requestAnimationFrame(() => {
   frame = 0;
   if (inspected) describe(inspected);
  });
 }
 function describe(el) {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const matched = authoredRules(el);
  inspected = el;
  place(rect);
  probeTarget.textContent = el.tagName.toLowerCase() + [...el.classList].map(name => '.' + name).join('');
  probeBox.textContent = [
   `${Math.round(rect.width)} x ${Math.round(rect.height)} px`,
   `padding ${style.padding}`,
   `radius ${style.borderRadius}`,
   style.display.includes('flex') || style.display.includes('grid') ? `gap ${style.gap}` : null,
   textContrast(el, style)
  ]
   .filter(Boolean)
   .join('  |  ');
  probeLabel.hidden = false;
  probeRules.textContent = matched.length
   ? matched
      .slice(-6)
      .map(rule => ruleText(rule).slice(0, 320))
      .join('\n\n')
   : 'No authored rules readable. Opened from the disk, the browser treats styles.css ' +
     'as another origin and cssRules throws, so only the computed values above survive. ' +
     'Serve the folder over http and this fills in.';
 }
 function look(event) {
  const el = event.target;
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
  if (!on) {
   cancelAnimationFrame(frame);
   frame = 0;
   close(probe);
   halo.hidden = true;
   inspected = null;
   if (resumeMotion) setPaused(false);
   return;
  }
  probeTarget.textContent = 'Point at anything';
  probeBox.textContent = matchMedia('(hover: hover)').matches
   ? 'Hover or tab to an element and its real box lands here.'
   : 'Tap an element and its real box lands here.';
  probeLabel.hidden = true;
  probeRules.textContent = '';
  open(probe);
  resumeMotion = !paused;
  setPaused(true);
 }
 probeBtn.addEventListener('click', () => setInspecting(!inspecting));
 probe.querySelector('.probe-close').addEventListener('click', () => {
  setInspecting(false);
  probeBtn.focus();
 });
 addEventListener('keydown', event => {
  if (event.key === 'Escape' && inspecting) setInspecting(false);
 });
});
