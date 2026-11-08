// Thin, read-only FReader host. The vendored rhwp engine is unmodified.
const host = document.getElementById('pages');
const MAX_BYTES = 256 * 1024 * 1024;
const CACHE_BYTES = 12 * 1024 * 1024;
const cache = new Map();
const fonts = new Map();
let activeEntries = new Set();
let cachedBytes = 0;
let engine, doc, incoming, received = 0;
let page = 0, count = 0, renderSerial = 0, disposed = false;
let options = { theme: 'white', spread: false, rtl: false, position: null, progress: 0 };
let readyReported = false;
let pendingEvents = [];
let flushingEvents = false;

function bridge() {
  return window.flutter_inappwebview?.callHandler ? window.flutter_inappwebview : null;
}
function emit(type, data = {}) {
  pendingEvents.push({ type, ...data });
  void flushEvents();
}
async function flushEvents() {
  if (!bridge() || flushingEvents || disposed) return;
  flushingEvents = true;
  try {
    while (pendingEvents.length && !disposed) {
      // A handler can exist before Android's platform bridge is ready. Keep
      // the event until native acknowledges it, including the initial ready.
      await bridge().callHandler('freaderHwp', pendingEvents[0]);
      pendingEvents.shift();
    }
  } catch (_) {
    // The platform-ready event or interval retries without losing ordering.
  } finally { flushingEvents = false; }
}
window.addEventListener('flutterInAppWebViewPlatformReady', flushEvents);
const bridgeTimer = setInterval(flushEvents, 150);

function fail(error) {
  const message = String(error?.message || error).slice(0, 600);
  emit('error', { message });
  return false;
}
function fontKind(name) {
  if (/equation|hwp.?eq|hancom.?eq|math|수식/i.test(name)) return 'math';
  return /바탕|명조|궁서|batang|myeong|serif|times|cambria/i.test(name) ? 'serif' : 'sans';
}
async function loadFontAliases(names) {
  await Promise.all([...new Set(names)].slice(0, 128).map(async raw => {
    const name = String(raw).trim();
    if (!name || name.length > 160 || fonts.has(name)) return;
    const kind = fontKind(name);
    const basename = kind === 'math' ? 'LatinModernMath' : kind === 'serif' ? 'NotoSerifKR' : 'NotoSansKR';
    const job = Promise.all((kind === 'math' ? [400] : [400, 700]).map(async weight => {
      const suffix = weight === 700 ? 'Bold' : 'Regular';
      const face = new FontFace(name, `url(fonts/${basename}-${suffix}.woff2)`, { weight: String(weight) });
      await face.load(); document.fonts.add(face);
    }));
    fonts.set(name, job);
    await job;
  }));
}
function installFontMeasurement() {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('문서 표시용 Canvas를 초기화하지 못했습니다.');
  globalThis.measureTextWidth = (font, text) => {
    const fallback = fontKind(font) === 'serif' ? 'FReaderSerif' : fontKind(font) === 'math' ? 'FReaderMath' : 'FReaderSans';
    ctx.font = `${font}, ${fallback}`;
    return ctx.measureText(text).width;
  };
}
function configure(next = {}) {
  const previousSpread = options.spread;
  options = { ...options, ...next };
  document.body.dataset.theme = ['white', 'sepia', 'dark'].includes(options.theme) ? options.theme : 'white';
  host.classList.toggle('rtl', !!options.rtl);
  if (doc && previousSpread !== options.spread) return render();
  fitPages();
}
function beginDocument(length, config) {
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES) throw new Error('열 수 있는 문서 크기는 256MB 이하입니다.');
  releaseDocument();
  incoming = new Uint8Array(length); received = 0;
  configure(config);
  return true;
}
function appendChunk(offset, encoded) {
  if (!incoming || offset !== received) throw new Error('문서 전송 순서가 올바르지 않습니다.');
  const binary = atob(encoded);
  if (received + binary.length > incoming.length) throw new Error('문서 전송 크기가 일치하지 않습니다.');
  for (let i = 0; i < binary.length; i++) incoming[received + i] = binary.charCodeAt(i);
  received += binary.length;
  return received;
}
async function openDocument(password = null) {
  let candidate;
  try {
    if (disposed) return false;
    if (!incoming || received !== incoming.length) throw new Error('문서 데이터를 모두 받지 못했습니다.');
    candidate = password === null ? new engine.HwpDocument(incoming) : engine.HwpDocument.openWithPassword(incoming, password);
    password = null;
    const info = JSON.parse(candidate.getDocumentInfo());
    await loadFontAliases(info.fontsUsed || []);
    if (disposed) { candidate.free(); return false; }
    doc = candidate; candidate = null;
    count = doc.pageCount();
    if (count < 1) throw new Error('표시할 페이지가 없는 문서입니다.');
    const saved = /^hwp:(\d+)$/.exec(options.position || '');
    page = clampPage(saved ? Number(saved[1]) : Math.round(Number(options.progress || 0) * (count - 1)));
    incoming.fill(0); incoming = null; received = 0;
    await render();
    if (disposed) return false;
    emit('loaded', { pageCount: count });
    reportLocation();
    return true;
  } catch (error) {
    if (candidate) candidate.free();
    const message = String(error?.message || error);
    if (message.includes('비밀번호가 필요한') || message.includes('비밀번호가 일치하지')) {
      emit('password', { incorrect: password !== null });
      return false;
    }
    if (/DRM/.test(message)) return fail('DRM으로 보호된 문서는 이 뷰어에서 열 수 없습니다.');
    return fail(error);
  } finally { password = null; }
}
function clampPage(value) { return Math.max(0, Math.min(count - 1, Number.isFinite(value) ? Math.trunc(value) : 0)); }
function reportLocation() { emit('location', { page, pageCount: count, position: `hwp:${page}`, progress: count > 1 ? page / (count - 1) : 1 }); }
async function display(position) {
  if (!doc) return;
  const match = /^hwp:(\d+)$/.exec(String(position));
  const target = clampPage(match ? Number(match[1]) : Number(position));
  page = target;
  try { await render(); reportLocation(); } catch (error) { fail(error); }
}
function next() { return display(page + (options.spread ? 2 : 1)); }
function previous() { return display(page - (options.spread ? 2 : 1)); }
function progress(value) { return display(Math.round(Math.max(0, Math.min(1, Number(value))) * (count - 1))); }
function releaseEntry(entry) {
  for (const url of entry.urls) URL.revokeObjectURL(url);
  entry.urls = [];
}
function releaseIfUnused(entry) {
  if (!activeEntries.has(entry) && cache.get(entry.index) !== entry) releaseEntry(entry);
}
function svgForPage(index) {
  let entry = cache.get(index);
  if (entry) { cache.delete(index); cache.set(index, entry); return entry; }
  const source = doc.renderPageSvg(index), template = safeSvg(source), urls = [];
  let size = source.length * 2;
  try {
    for (const img of template.querySelectorAll('image')) {
      for (const attr of [...img.attributes]) {
        if (attr.localName !== 'href' || !attr.value.startsWith('data:image/')) continue;
        const uri = attr.value, comma = uri.indexOf(',');
        if (comma < 0) continue;
        const header = uri.slice(5, comma), mime = header.split(';')[0];
        let data;
        if (/;base64/i.test(header)) {
          const binary = atob(uri.slice(comma + 1));
          data = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
        } else data = new TextEncoder().encode(decodeURIComponent(uri.slice(comma + 1)));
        const blob = new Blob([data], { type: mime }), url = URL.createObjectURL(blob);
        urls.push(url); attr.value = url; size += blob.size - uri.length * 2 + url.length * 2;
      }
    }
  } catch (error) { for (const url of urls) URL.revokeObjectURL(url); throw error; }
  entry = { index, template, urls, size: Math.max(0, size) };
  // Keep only recent pages. A single very large page is displayable, but is
  // released on navigation instead of expanding the cache indefinitely.
  if (entry.size <= CACHE_BYTES) {
    while (cache.size && (cache.size >= 4 || cachedBytes + entry.size > CACHE_BYTES)) {
      const oldest = cache.keys().next().value, removed = cache.get(oldest);
      cachedBytes -= removed.size; cache.delete(oldest); releaseIfUnused(removed);
    }
    cache.set(index, entry); cachedBytes += entry.size;
  }
  return entry;
}
function safeSvg(source) {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = parsed.documentElement;
  if (svg.localName !== 'svg' || parsed.querySelector('parsererror')) throw new Error('페이지를 표시할 SVG 데이터가 올바르지 않습니다.');
  for (const el of svg.querySelectorAll('*')) {
    if (['script', 'foreignObject', 'iframe', 'object', 'embed', 'style'].includes(el.localName)) { el.remove(); continue; }
    for (const attr of [...el.attributes]) {
      const name = attr.localName.toLowerCase();
      if (name.startsWith('on')) el.removeAttributeNode(attr);
      else if (name === 'href' && !attr.value.startsWith('#') &&
          !(el.localName === 'image' && /^data:image\/(png|jpeg|jpg|gif|webp|bmp|svg\+xml)[;,]/i.test(attr.value))) el.removeAttributeNode(attr);
    }
  }
  for (const attr of [...svg.attributes]) if (attr.localName.toLowerCase().startsWith('on')) svg.removeAttributeNode(attr);
  return document.importNode(svg, true);
}
async function render() {
  if (!doc || disposed) return;
  const serial = ++renderSerial;
  const fragment = document.createDocumentFragment(), nextEntries = new Set();
  const pages = options.spread && page + 1 < count ? [page, page + 1] : [page];
  for (const index of pages) {
    const entry = svgForPage(index); nextEntries.add(entry);
    const svg = entry.template.cloneNode(true);
    const box = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
    const width = box?.[2] || parseFloat(svg.getAttribute('width'));
    const height = box?.[3] || parseFloat(svg.getAttribute('height'));
    if (!(width > 0 && height > 0 && Number.isFinite(width + height))) throw new Error('문서 페이지 크기가 올바르지 않습니다.');
    const frame = document.createElement('section');
    frame.className = 'page'; frame.dataset.page = String(index);
    frame.dataset.width = String(width); frame.dataset.height = String(height);
    frame.setAttribute('aria-label', `${index + 1} / ${count}`);
    frame.appendChild(svg); fragment.appendChild(frame);
  }
  if (serial !== renderSerial || disposed) return;
  host.replaceChildren(fragment);
  const previousEntries = activeEntries; activeEntries = nextEntries;
  for (const entry of previousEntries) releaseIfUnused(entry);
  fitPages();
  await new Promise(resolve => requestAnimationFrame(resolve));
}
function fitPages() {
  const frames = [...host.children];
  if (!frames.length) return;
  const width = host.clientWidth, height = host.clientHeight;
  const totalWidth = frames.reduce((total, frame) => total + Number(frame.dataset.width), 0);
  const maxHeight = Math.max(...frames.map(frame => Number(frame.dataset.height)));
  const scale = Math.max(0.01, Math.min((width - (frames.length - 1) * 8) / totalWidth, height / maxHeight));
  for (const frame of frames) {
    frame.style.width = `${Number(frame.dataset.width) * scale}px`;
    frame.style.height = `${Number(frame.dataset.height) * scale}px`;
  }
}
function highlightSelection() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return;
  const rects = [...selection.getRangeAt(0).getClientRects()];
  for (const frame of host.children) {
    const svg = frame.firstElementChild, bounds = svg.getBoundingClientRect();
    const scale = Number(frame.dataset.width) / bounds.width;
    for (const box of rects) {
      if (box.width < 1 || box.height < 1 || box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1) continue;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      for (const [key, value] of Object.entries({ x: (box.left - bounds.left) * scale, y: (box.top - bounds.top) * scale, width: box.width * scale, height: box.height * scale, fill: '#ffc107', opacity: 0.35, 'pointer-events': 'none' })) rect.setAttribute(key, String(value));
      svg.appendChild(rect);
    }
  }
  selection.removeAllRanges();
}
function releaseDocument() {
  renderSerial++;
  if (doc) { doc.free(); doc = null; }
  if (incoming) incoming.fill(0);
  incoming = null; received = 0; count = 0; page = 0;
  for (const entry of new Set([...cache.values(), ...activeEntries])) releaseEntry(entry);
  cache.clear(); activeEntries.clear(); cachedBytes = 0; host.replaceChildren();
}
function destroy() {
  disposed = true; clearInterval(bridgeTimer); resizeObserver.disconnect(); releaseDocument(); pendingEvents = [];
}
const resizeObserver = new ResizeObserver(fitPages); resizeObserver.observe(host);
window.freaderHwp = { beginDocument, appendChunk, openDocument, configure, display, next, previous, progress, highlightSelection, destroy,
  getState: () => ({ ready: readyReported, page, count, cachedPages: cache.size, cachedBytes, received, spread: options.spread, maxBytes: MAX_BYTES }) };
window.addEventListener('pagehide', destroy, { once: true });

(async () => {
  try {
    engine = await import('./rhwp.js');
    // ArrayBuffer init works even when Android's asset MIME database does not
    // recognize .wasm; it does not depend on instantiateStreaming MIME rules.
    const response = await fetch('./rhwp_bg.wasm');
    if (!response.ok) throw new Error('HWP 엔진 파일을 읽지 못했습니다.');
    await engine.default({ module_or_path: await response.arrayBuffer() });
    await Promise.all(['400 16px FReaderSans', '700 16px FReaderSans', '400 16px FReaderSerif', '700 16px FReaderSerif', '400 16px FReaderMath'].map(font => document.fonts.load(font)));
    await loadFontAliases(['함초롬돋움', '함초롬바탕', '함초롱돋움', '함초롱바탕', '한컴돋움', '한컴바탕', '맑은 고딕', '돋움', '굴림', '바탕', 'HY신명조', '한양신명조', 'HancomEQN']);
    installFontMeasurement();
    if (!disposed) { readyReported = true; emit('ready', { version: engine.version() }); }
  } catch (error) { fail(error); }
})();
