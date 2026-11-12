'use strict';

// Enter supplements the checkbox's native Space key.
const sliceSwitch = document.querySelector('.slice-switch');
sliceSwitch.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  sliceSwitch.click();
});

// Resource Timing counts received bytes, not decoded sizes.
const entriesByUrl = new Map();
const kilobytes = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});
const formatKilobytes = bytes => `${kilobytes.format(bytes / 1000)} kB`;

function fileNameOf(entry) {
  if (entry.entryType === 'navigation') return 'index.html';
  return new URL(entry.name).pathname.split('/').pop();
}

function kindOf(entry) {
  const name = fileNameOf(entry);
  if (/\.(html|css|js)$/.test(name)) return 'code';
  if (name.endsWith('.woff2')) return 'fonts';
  return 'images';
}

function ensureChild(row, className) {
  const element = row.querySelector(`.${className}`);
  return element ?? row.appendChild(Object.assign(document.createElement('span'), { className }));
}

function showFileSizes(entries) {
  const sizes = new Map();
  for (const row of document.querySelectorAll('.file-list li')) {
    const entry = entries.find(item => fileNameOf(item) === row.dataset.file);
    if (entry) sizes.set(row, entry.encodedBodySize);
  }
  if (sizes.size === 0) return;
  const largest = Math.max(...sizes.values());
  for (const [row, size] of sizes) {
    ensureChild(row, 'file-size').textContent = formatKilobytes(size);
    ensureChild(row, 'file-bar').style.setProperty('--share', (size / largest).toFixed(3));
  }
  document.querySelector('.files-note').hidden = false;
}

function showVisitTotal(entries) {
  const sum = list => list.reduce((total, entry) => total + entry.encodedBodySize, 0);
  const groups = Object.groupBy(entries, kindOf);
  const parts = ['code', 'fonts', 'images']
    .filter(kind => groups[kind])
    .map(kind => `${kind} ${formatKilobytes(sum(groups[kind]))}`);
  const line = document.querySelector('.visit-total');
  line.textContent =
    `Measured this visit: ${entries.length} files, ` +
    `${formatKilobytes(sum(entries))} in all: ${parts.join(', ')}.`;
  line.hidden = false;
}

// Disk visits have no HTTP transfer size.
const observer = new PerformanceObserver(list => {
  if (location.protocol === 'file:') return;
  for (const entry of list.getEntries()) entriesByUrl.set(entry.name, entry);
  const measured = [...entriesByUrl.values()].filter(entry => entry.encodedBodySize > 0);
  if (measured.length === 0) return;
  showFileSizes(measured);
  showVisitTotal(measured);
});
observer.observe({ type: 'navigation', buffered: true });
observer.observe({ type: 'resource', buffered: true });

// Popovers keep the page usable.
const inspector = document.getElementById('inspector');
const inspectButton = document.querySelector('.inspect-button');
const halo = document.querySelector('.inspector-halo');
const targetLine = inspector.querySelector('.inspector-target');
const boxLine = inspector.querySelector('.inspector-box');
const rulesBlock = inspector.querySelector('.inspector-rules');
const startTarget = targetLine.textContent;
const startBox = boxLine.textContent;
const diskNote = rulesBlock.textContent;
const anchorsWork = CSS.supports('anchor-name: --inspected');
const swatch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
let inspected = null;
let listeners = null;

function toRgba(color) {
  swatch.clearRect(0, 0, 1, 1);
  swatch.fillStyle = color;
  swatch.fillRect(0, 0, 1, 1);
  return [...swatch.getImageData(0, 0, 1, 1).data].map(channel => channel / 255);
}

function luminance([red, green, blue]) {
  const linear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function contrastRatio(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function groundOf(element) {
  for (let node = element; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.backgroundImage !== 'none') return null;
    const color = toRgba(style.backgroundColor);
    if (color[3] === 1) return color;
    if (color[3] > 0) return null;
  }
  return null;
}

function describeContrast(element, style) {
  const text = toRgba(style.color);
  const ground = groundOf(element);
  if (text[3] < 1 || !ground) return 'text contrast not measured on this background';
  return `text ${contrastRatio(text, ground).toFixed(2)}:1`;
}

function resolveSelector(selector, parent) {
  if (!parent) return selector;
  if (selector.includes('&')) return selector.replaceAll('&', `:is(${parent})`);
  return `:is(${parent}) :is(${selector})`;
}

function matchesSafely(element, selector) {
  // Unparseable selectors cannot apply.
  try {
    return element.matches(selector);
  } catch (error) {
    if (error.name !== 'SyntaxError') throw error;
    return false;
  }
}

function collectRules(rules, element, context, found) {
  const descend = (rule, step) =>
    collectRules(rule.cssRules, element, { ...context, chain: [...context.chain, step] }, found);
  for (const rule of rules) {
    if (rule instanceof CSSLayerBlockRule) {
      descend(rule, `@layer ${rule.name}`);
    } else if (rule instanceof CSSMediaRule) {
      if (matchMedia(rule.conditionText).matches) descend(rule, `@media ${rule.conditionText}`);
    } else if (rule instanceof CSSSupportsRule) {
      if (CSS.supports(rule.conditionText)) descend(rule, `@supports ${rule.conditionText}`);
    } else if (rule instanceof CSSContainerRule) {
      descend(rule, `@container ${rule.conditionText} (container condition not checked)`);
    } else if (rule instanceof CSSStyleRule) {
      const selector = resolveSelector(rule.selectorText, context.parent);
      if (matchesSafely(element, selector)) found.push({ chain: context.chain, selector, rule });
      collectRules(rule.cssRules, element, { ...context, parent: selector }, found);
    }
  }
}

function matchingRules(element) {
  const found = [];
  for (const sheet of document.styleSheets) {
    // Local-file security can block CSS rules.
    try {
      collectRules(sheet.cssRules, element, { chain: [], parent: null }, found);
    } catch (error) {
      if (error.name !== 'SecurityError') throw error;
      return null;
    }
  }
  return found;
}

function formatRule({ chain, selector, rule }) {
  const declarations = rule.style.cssText.replaceAll('; ', ';\n  ');
  return [...chain, `${selector} {\n  ${declarations}\n}`].join('\n');
}

function describeBox(element, style) {
  // Layout sizes stay steady while the slice turns; SVG has no offsetWidth.
  const { width, height } = element instanceof HTMLElement
    ? { width: element.offsetWidth, height: element.offsetHeight }
    : element.getBoundingClientRect();
  const box = `${Math.round(width)} x ${Math.round(height)} px`;
  const isFlexOrGrid = /flex|grid/.test(style.display);
  return [
    box,
    `padding ${style.padding}`,
    `radius ${style.borderRadius}`,
    isFlexOrGrid ? `gap ${style.gap}` : null,
    describeContrast(element, style)
  ]
    .filter(Boolean)
    .join('  |  ');
}

function moveHalo(element) {
  if (!anchorsWork) return;
  inspected?.style.removeProperty('anchor-name');
  element.style.setProperty('anchor-name', '--inspected');
  halo.hidden = false;
}

function describeElement(element) {
  // The static label avoids transformed-anchor drift.
  if (element.matches('.slice-segments, .slice-switch')) element = element.closest('.slice');
  const style = getComputedStyle(element);
  const rules = matchingRules(element);
  moveHalo(element);
  inspected = element;
  targetLine.textContent =
    element.tagName.toLowerCase() + [...element.classList].map(name => `.${name}`).join('');
  boxLine.textContent = describeBox(element, style);
  rulesBlock.textContent = rules
    ? rules.slice(-6).map(formatRule).join('\n\n')
    : diskNote;
  const box = element.getBoundingClientRect();
  inspector.classList.toggle('inspector-left', box.left + box.width / 2 > innerWidth / 2);
}

function inspectTarget(event) {
  const element = event.target;
  if (!(element instanceof Element) || inspector.contains(element) || element === halo) return;
  describeElement(element);
}

function startInspecting() {
  targetLine.textContent = matchMedia('(hover: none)').matches ? targetLine.dataset.touch : startTarget;
  boxLine.textContent = startBox;
  rulesBlock.textContent = '';
  listeners = new AbortController();
  const { signal } = listeners;
  document.addEventListener('pointerover', inspectTarget, { signal });
  document.addEventListener('focusin', inspectTarget, { signal });
  // A manual popover has no light dismiss.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    inspector.hidePopover();
    inspectButton.focus();
  }, { signal });
}

function stopInspecting() {
  listeners.abort();
  inspected?.style.removeProperty('anchor-name');
  inspected = null;
  halo.hidden = true;
}

if ('popover' in HTMLElement.prototype) {
  inspector.hidden = false;
  inspectButton.hidden = false;
  // beforetoggle catches the next Tab; toggle can arrive too late.
  inspector.addEventListener('beforetoggle', event => {
    if (event.newState === 'open') startInspecting();
    else stopInspecting();
  });
}
