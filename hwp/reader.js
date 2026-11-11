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
  retryBridge();
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
// FReader(배터리): 보낼 알림이 남아 있을 때만 0.15초마다 다시 시도한다 (예전에는 책을 펴 둔 내내 계속 깨어 있었음)
let bridgeTimer = 0;
function retryBridge() {
  if (bridgeTimer || disposed) return;
  bridgeTimer = setInterval(() => {
    if (disposed || !pendingEvents.length) { clearInterval(bridgeTimer); bridgeTimer = 0; return; }
    void flushEvents();
  }, 150);
}

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
  applySearchHighlights();
  await new Promise(resolve => requestAnimationFrame(resolve));
  void finishPage(serial, [...nextEntries]);
}
// FReader: 쪽 안 그림을 다 풀면 'pageReady'를 알리고(앱이 이 쪽 화면을 저장해 다음에 먼저 띄움),
// 잠시 뒤 다음 쪽을 미리 만들어 둔다 (그림이 많은 쪽은 만드는 데 오래 걸림).
function decodeEntry(entry) {
  return Promise.all(entry.urls.map(url => { const probe = new Image(); probe.src = url; return probe.decode().catch(() => {}); }));
}
async function finishPage(serial, entries) {
  await Promise.all(entries.map(decodeEntry));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (disposed || serial !== renderSerial) return;
  emit('pageReady', { page, position: `hwp:${page}` });
  setTimeout(() => {
    if (disposed || serial !== renderSerial || !doc) return;
    const ahead = page + (options.spread ? 2 : 1);
    try {
      for (let index = ahead; index < Math.min(count, ahead + (options.spread ? 2 : 1)); index++) {
        if (!cache.has(index)) void decodeEntry(svgForPage(index));
      }
    } catch (_) {}
  }, 350);
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
  layoutCache.clear(); searchState = { query: '', results: [], current: -1 };
  if (incoming) incoming.fill(0);
  incoming = null; received = 0; count = 0; page = 0;
  for (const entry of new Set([...cache.values(), ...activeEntries])) releaseEntry(entry);
  cache.clear(); activeEntries.clear(); cachedBytes = 0; host.replaceChildren();
}
function destroy() {
  disposed = true; clearInterval(bridgeTimer); resizeObserver.disconnect(); releaseDocument(); pendingEvents = [];
}
const resizeObserver = new ResizeObserver(fitPages); resizeObserver.observe(host);
// ── 파일 내 단어 검색: 엔진이 알려 주는 쪽별 글자 위치로 노란 형광펜을 그린다 ──
let searchState = { query: '', results: [], current: -1 };
const layoutCache = new Map();
function searchNorm(text) { return text.replace(/\u00a0/g, ' ').toLowerCase(); }
function pageRuns(index) {
  if (layoutCache.has(index)) return layoutCache.get(index);
  let runs = [];
  try { runs = (JSON.parse(doc.getPageTextLayout(index)).runs || []).filter(r => r && typeof r.text === 'string' && r.text.length); } catch (_) {}
  layoutCache.set(index, runs);
  if (layoutCache.size > 60) layoutCache.delete(layoutCache.keys().next().value);
  return runs;
}
/** 한 쪽에서 찾은 곳들: 찾은 곳마다 쪽 좌표의 사각형 목록 */
function pageMatches(index, q) {
  const runs = pageRuns(index), owner = [];
  let text = '';
  runs.forEach((run, r) => { for (let c = 0; c < run.text.length; c++) owner.push([r, c]); text += run.text; });
  const hay = searchNorm(text), found = [];
  for (let at = hay.indexOf(q); at >= 0; at = hay.indexOf(q, at + q.length)) {
    const rects = [];
    for (let i = at; i < at + q.length && i < owner.length; i++) {
      const [r, c] = owner[i], run = runs[r], xs = run.charX || [];
      const x0 = run.x + (xs[c] ?? 0), x1 = run.x + (xs[c + 1] ?? xs[c] ?? run.w);
      const last = rects[rects.length - 1];
      if (last && last.run === r && Math.abs(last.x + last.w - x0) < 0.5) last.w = x1 - last.x;
      else rects.push({ run: r, x: x0, y: run.y, w: Math.max(0.5, x1 - x0), h: run.h });
    }
    found.push(rects);
  }
  return found;
}
async function search(query) {
  const q = searchNorm(String(query || '').trim());
  searchState = { query: q, results: [], current: -1 };
  if (!q || !doc) { applySearchHighlights(); return { count: 0, pages: [] }; }
  const results = [];
  for (let i = 0; i < count; i++) {
    const found = pageMatches(i, q);
    for (let k = 0; k < found.length; k++) results.push({ page: i, k });
    if (i % 15 === 14) await new Promise(resolve => setTimeout(resolve, 0)); // 긴 문서에서도 화면이 멈추지 않게
    if (searchState.query !== q) return { count: 0, pages: [] }; // 그 사이 다른 검색이 시작됨
  }
  searchState.results = results;
  applySearchHighlights();
  return { count: results.length, pages: results.map(r => r.page) };
}
async function showSearchResult(index) {
  const r = searchState.results[index]; if (!r) return;
  searchState.current = index;
  const shown = [...host.children].some(frame => Number(frame.dataset.page) === r.page);
  if (shown) { applySearchHighlights(); return; }
  await display(r.page);
}
function clearSearch() { searchState = { query: '', results: [], current: -1 }; applySearchHighlights(); }
function applySearchHighlights() {
  for (const old of host.querySelectorAll('.freader-search-mark')) old.remove();
  if (!searchState.query || !searchState.results.length || !doc) return;
  const current = searchState.results[searchState.current];
  for (const frame of host.children) {
    const index = Number(frame.dataset.page), svg = frame.firstElementChild;
    if (!svg || !searchState.results.some(r => r.page === index)) continue;
    const found = pageMatches(index, searchState.query);
    found.forEach((rects, k) => {
      const isCurrent = current && current.page === index && current.k === k;
      for (const box of rects) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'freader-search-mark');
        for (const [key, value] of Object.entries({ x: box.x, y: box.y, width: box.w, height: box.h, fill: isCurrent ? '#ffb300' : '#ffeb3b', opacity: isCurrent ? 0.6 : 0.45, 'pointer-events': 'none' })) rect.setAttribute(key, String(value));
        rect.style.mixBlendMode = 'multiply';
        svg.appendChild(rect);
      }
    });
  }
}
/** 지금 화면에 보이는 글과 그 위치 (화면 크기 대비 0~1) — 내보낸 PDF에 보이지 않는 글자 층을 넣는 데 씀 */
function visibleTextBoxes() {
  const W = innerWidth || 1, H = innerHeight || 1, out = [];
  for (const frame of host.children) {
    const index = Number(frame.dataset.page), svg = frame.firstElementChild;
    if (!svg || !Number.isFinite(index)) continue;
    const r = svg.getBoundingClientRect(), vw = Number(frame.dataset.width) || r.width;
    const s = vw > 0 ? r.width / vw : 1;
    for (const run of pageRuns(index)) {
      if (!run.text || !run.text.trim() || !(run.w > 0 && run.h > 0)) continue;
      out.push({ t: run.text, x: (r.left + run.x * s) / W, y: (r.top + run.y * s) / H, w: run.w * s / W, h: run.h * s / H });
    }
  }
  return out;
}
/** 쪽마다의 글 (문단마다 줄바꿈) — 앱이 '목차' 쪽을 찾는 데 씀 */
async function pageText(from, to) {
  if (!doc) return [];
  const out = [], current = doc, end = Math.min(count, Math.max(0, to | 0));
  for (let i = Math.max(0, from | 0); i < end; i++) {
    let text = '', key = null;
    for (const run of pageRuns(i)) {
      const k = run.paraIdx == null ? `c${run.y ?? ''}` : `${run.secIdx}:${run.paraIdx}`;
      if (key !== null && k !== key) text += '\n';
      text += run.text; key = k;
    }
    out.push(text);
    if (i % 20 === 19) await new Promise(resolve => setTimeout(resolve, 0));
    if (doc !== current) return [];
  }
  return out;
}
// ── 목차 후보: 번호로 시작하거나 굵은 글씨가 있는 짧은 문단 {title, page, bold, boldRatio, centered, fs}
// 앱이 '목차 쪽 → 번호 → 굵은 글씨(가운데 정렬 또는 전체 굵게)' 순서로 고른다. [from, to) 쪽만 (진행률 표시용) ──
const NUMBERED_START = /^\s*(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]|[IVX]{1,5}\s*[.)]|\(\s*\d|\d)/;
async function headingCandidates(from = 0, to = 1e9) {
  if (!doc) return [];
  const out = [], current = doc, end = Math.min(count, to);
  const sizeChars = new Map(); // 본문 글자 크기 = 이 쪽들에서 가장 많이 쓴 크기
  for (let i = Math.max(0, from); i < end; i++) {
    const runs = pageRuns(i);
    for (const run of runs) {
      const k = Math.round((run.fontSize || 0) * 10) / 10;
      if (k > 0) sizeChars.set(k, (sizeChars.get(k) || 0) + run.text.trim().length);
    }
    // 쪽의 글 영역 (가운데 정렬 가늠용)
    let L = Infinity, R = -Infinity;
    for (const run of runs) { L = Math.min(L, run.x); R = Math.max(R, run.x + (run.w || 0)); }
    const paras = new Map();
    for (const run of runs) {
      if (run.secIdx == null || run.paraIdx == null) continue; // 표 안 글자 등
      const key = `${run.secIdx}:${run.paraIdx}`;
      let b = paras.get(key);
      if (!b) { b = { text: '', bold: 0, chars: 0, fs: 0, x0: Infinity, x1: -Infinity }; paras.set(key, b); }
      b.text += run.text;
      const n = run.text.trim().length;
      b.chars += n; if (run.bold) b.bold += n;
      b.fs = Math.max(b.fs, run.fontSize || 0);
      if (n) { b.x0 = Math.min(b.x0, run.x); b.x1 = Math.max(b.x1, run.x + (run.w || 0)); }
    }
    const width = R - L;
    for (const b of paras.values()) {
      const text = b.text.replace(/\s+/g, ' ').trim();
      if (!text || !b.chars || text.length > 100) continue;
      const boldRatio = b.bold / b.chars;
      if (!NUMBERED_START.test(text) && boldRatio < 0.5) continue;
      const centered = width > 0 && b.x1 - b.x0 < width * 0.85 && Math.abs((b.x0 - L) - (R - b.x1)) < width * 0.06 + 2;
      out.push({ title: text, page: i, bold: boldRatio >= 0.9, boldRatio, centered, fs: b.fs });
    }
    if (i % 10 === 9) await new Promise(resolve => setTimeout(resolve, 0));
    if (doc !== current) return [];
  }
  let body = 0, most = -1;
  for (const [k, n] of sizeChars) if (n > most) { most = n; body = k; }
  return out.slice(0, 3000).map(c => ({ ...c, body }));
}
window.freaderHwp = { beginDocument, appendChunk, openDocument, configure, display, next, previous, progress, highlightSelection, destroy,
  search, showSearchResult, clearSearch, headingCandidates, pageText, visibleTextBoxes,
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
