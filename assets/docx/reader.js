// Read-only adapter for OpenDocument.core. All assets and documents stay local.
const host = document.getElementById('pages');
const measure = document.getElementById('measure');
const MAX_BYTES = 256 * 1024 * 1024;
let incoming, received = 0, page = 0, pages = [], disposed = false;
const IMAGE_CACHE_BYTES = 32 * 1024 * 1024;
const imageCache = new Map(), imageJobs = new Map(), brokenImages = new Set();
let resourceIndex = new Map(), originalSources = new Set(), resourceSession = 0;
let imageCacheBytes = 0, activeImagePaths = new Set(), renderSerial = 0;
let ready = false, requestId = 0, generation = 0, awaitingPassword = false, unavailableImages = 0;
let detectedFormat = 'docx';
let options = { format: 'docx', theme: 'white', spread: false, rtl: false, position: null, progress: 0 };
const requests = new Map(), fonts = new Map();
let pendingEvents = [], flushing = false;

function emit(type, data = {}) { pendingEvents.push({ type, ...data }); void flush(); }
async function flush() {
  if (!window.flutter_inappwebview?.callHandler || flushing || disposed) return;
  flushing = true;
  try {
    while (pendingEvents.length && !disposed) {
      await window.flutter_inappwebview.callHandler('freaderDocx', pendingEvents[0]);
      pendingEvents.shift();
    }
  } catch (_) { /* Retry when the Android bridge becomes ready. */ }
  finally { flushing = false; }
}
const bridgeTimer = setInterval(flush, 150);
window.addEventListener('flutterInAppWebViewPlatformReady', flush);
function fail(error) { emit('error', { message: String(error?.message || error).slice(0, 600) }); return false; }

const worker = new Worker('./worker.js', { type: 'module' });
worker.onmessage = ({ data }) => {
  if (disposed) return;
  if (data.id) { requests.get(data.id)?.(data); requests.delete(data.id); }
  else if (data.type === 'ready') { ready = true; emit('ready', { version: data.version }); }
  else if (data.type === 'error') fail(data.message);
};
worker.onerror = event => fail(event.message || 'Word 문서 엔진을 시작하지 못했습니다.');
function request(action, data = {}, transfer = []) {
  return new Promise(resolve => {
    const id = ++requestId; requests.set(id, resolve);
    worker.postMessage({ id, action, ...data }, transfer);
  });
}
function clearPages() {
  renderSerial++;
  for (const item of imageCache.values()) URL.revokeObjectURL(item.url);
  imageCache.clear(); imageJobs.clear(); brokenImages.clear();
  resourceIndex.clear(); originalSources.clear(); activeImagePaths.clear(); imageCacheBytes = 0;
  pages = []; page = 0; unavailableImages = 0; host.replaceChildren(); measure.replaceChildren();
  document.querySelectorAll('style[data-document]').forEach(el => el.remove());
}
function beginDocument(length, config) {
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES) throw new Error('열 수 있는 문서 크기는 256MB 이하입니다.');
  generation++; clearPages();
  if (incoming) incoming.fill(0);
  incoming = new Uint8Array(length); received = 0; awaitingPassword = false;
  configure(config);
}
function appendChunk(offset, encoded) {
  if (!incoming || offset !== received) throw new Error('문서 전송 순서가 올바르지 않습니다.');
  const binary = atob(encoded);
  if (received + binary.length > incoming.length) throw new Error('문서 전송 크기가 일치하지 않습니다.');
  for (let i = 0; i < binary.length; i++) incoming[received + i] = binary.charCodeAt(i);
  received += binary.length;
}
async function openDocument(password = null) {
  const current = generation;
  try {
    let result;
    if (awaitingPassword) result = await request('password', { password });
    else {
      if (!incoming || received !== incoming.length) throw new Error('문서 데이터를 모두 받지 못했습니다.');
      const bytes = incoming; incoming = null; received = 0;
      result = await request('open', { bytes, password, format: options.format }, [bytes.buffer]);
    }
    password = null;
    if (disposed || current !== generation) return false;
    if (result.type === 'password') { awaitingPassword = true; emit('password', { incorrect: result.incorrect }); return false; }
    awaitingPassword = false;
    if (result.type === 'error') return fail(result.message);
    detectedFormat = result.format || 'docx';
    resourceSession = result.session;
    resourceIndex = new Map((result.resources || []).map(r => [r.path, r]));
    await preparePages(result.html, current);
    if (disposed || current !== generation) return false;
    const saved = /^(?:docx|doc):(\d+)$/.exec(options.position || '');
    page = clampPage(saved ? Number(saved[1]) : Math.round(Number(options.progress || 0) * (pages.length - 1)));
    await render(); emit('loaded', { pageCount: pages.length, unavailableImages }); reportLocation();
    return true;
  } catch (error) { return fail(error); }
  finally { password = null; }
}

function fontKind(name) {
  if (/math|equation|수식/i.test(name)) return 'math';
  return /바탕|명조|궁서|batang|myeong|serif|times|cambria/i.test(name) ? 'serif' : 'sans';
}
async function loadFonts(root) {
  const names = new Set(['맑은 고딕', '바탕', '굴림', '돋움', 'Calibri', 'Arial', 'Times New Roman']);
  for (const el of root.querySelectorAll('[style]')) {
    for (const part of el.style.fontFamily.split(',')) {
      const name = part.trim().replace(/^['"]|['"]$/g, '');
      if (name && !/^(sans-serif|serif|monospace|inherit|initial)$/i.test(name)) names.add(name);
    }
  }
  await Promise.all([...names].slice(0, 128).map(async name => {
    if (fonts.has(name)) return fonts.get(name);
    if (name.length > 160 || /[\x00-\x1f]/.test(name)) return;
    const kind = fontKind(name), base = kind === 'math' ? 'LatinModernMath' : kind === 'serif' ? 'NotoSerifKR' : 'NotoSansKR';
    const job = Promise.all((kind === 'math' ? [400] : [400, 700]).map(async weight => {
      const face = new FontFace(name, `local(${JSON.stringify(name)}), url(../hwp/fonts/${base}-${weight === 700 ? 'Bold' : 'Regular'}.woff2)`, { weight: String(weight) });
      await face.load(); document.fonts.add(face);
    }));
    fonts.set(name, job); return job;
  }));
  await Promise.all(['400 16px FReaderSans', '700 16px FReaderSans', '400 16px FReaderSerif', '700 16px FReaderSerif', '400 16px FReaderMath'].map(font => document.fonts.load(font)));
}
function sanitize(parsed) {
  for (const img of parsed.querySelectorAll('img')) {
    const path = img.getAttribute('src');
    if (resourceIndex.has(path)) { img.dataset.resource = path; img.removeAttribute('src'); }
  }
  parsed.querySelectorAll('script,link,meta,base,iframe,object,embed,form').forEach(el => el.remove());
  for (const el of parsed.querySelectorAll('*')) {
    for (const attr of [...el.attributes]) {
      const name = attr.localName.toLowerCase();
      if (name.startsWith('on') || name === 'contenteditable' || name === 'srcdoc') el.removeAttributeNode(attr);
      else if (['href', 'src', 'srcset', 'action'].includes(name) &&
          !(name === 'src' && el.localName === 'img' && /^data:image\/(png|jpeg|jpg|gif|webp|bmp|svg\+xml)[;,]/i.test(attr.value))) el.removeAttributeNode(attr);
    }
  }
}
function applyPageBreaks(parsed) {
  const paragraphs = [...parsed.querySelectorAll('.odr-page-inner x-p')];
  for (const hint of options.pageBreaks || []) {
    const paragraph = paragraphs[hint.index];
    // A model difference must not split a different paragraph's contents.
    if (!paragraph || paragraph.textContent !== hint.text) continue;
    for (const offset of [...hint.offsets].sort((a, b) => b - a)) {
      if (offset === 0) { paragraph.style.breakBefore = 'column'; continue; }
      const walker = parsed.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      let node, remaining = offset;
      while ((node = walker.nextNode())) {
        if (remaining > node.length) { remaining -= node.length; continue; }
        const range = parsed.createRange();
        range.setStart(node, remaining); range.setEnd(paragraph, paragraph.childNodes.length);
        const continuation = paragraph.cloneNode(false);
        continuation.appendChild(range.extractContents());
        continuation.style.breakBefore = 'column';
        paragraph.after(continuation);
        break;
      }
    }
  }
}
async function preparePages(html, current) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  sanitize(parsed);
  applyPageBreaks(parsed);
  const sources = [...parsed.querySelectorAll('.odr-pages > .odr-page-outer')];
  if (!sources.length) throw new Error('Word 문서에서 표시할 본문을 찾지 못했습니다.');
  for (const style of parsed.head.querySelectorAll('style')) {
    const copy = document.createElement('style'); copy.dataset.document = '';
    copy.textContent = style.textContent; document.head.insertBefore(copy, document.querySelector('link'));
  }
  await loadFonts(parsed);
  if (disposed || current !== generation) return;
  for (const source of sources) {
    source.style.height = source.style.minHeight || '297mm';
    source.style.width ||= '210mm';
    if (detectedFormat === 'doc' || detectedFormat === 'rtf') {
      // The legacy/RTF parser has no paper/margin information. Use a readable
      // fallback while preserving its paragraphs and explicit page breaks.
      const inner = source.querySelector(':scope > .odr-page-inner');
      if (inner && !inner.style.margin) inner.style.margin = '20mm';
    }
    measure.appendChild(document.importNode(source, true));
  }
  originalSources = new Set(measure.children);
  // OOXML specifies the display extents. Reserve them without decoding every
  // photograph. Only unusual images without extents need an intrinsic-size probe.
  for (const img of measure.querySelectorAll('img')) {
    if (!img.dataset.resource && !img.getAttribute('src')) { missingImage(img); continue; }
    if (!(parseFloat(img.style.width || img.getAttribute('width')) > 0) ||
        !(parseFloat(img.style.height || img.getAttribute('height')) > 0)) {
      try {
        const item = img.dataset.resource ? await imageFor(img.dataset.resource) : { url: img.src };
        if (disposed || current !== generation) return;
        const probe = new Image(); probe.src = item.url; await probe.decode();
        if (!img.style.width && !img.hasAttribute('width')) img.style.width = `${probe.naturalWidth}px`;
        if (!img.style.height && !img.hasAttribute('height')) img.style.height = `${probe.naturalHeight}px`;
        probe.src = ''; trimImages();
      } catch (_) { missingImage(img); }
    }
  }
  const result = [];
  for (const source of measure.children) {
    const inner = source.querySelector(':scope > .odr-page-inner');
    if (!inner) throw new Error('Word 문서 본문 구조가 올바르지 않습니다.');
    const bounds = source.getBoundingClientRect(), css = getComputedStyle(inner);
    const width = bounds.width, height = bounds.height;
    if (!(width > 0 && height > 0 && width < 20000 && height < 20000)) throw new Error('Word 문서 페이지 크기가 올바르지 않습니다.');
    const margin = ['Top', 'Right', 'Bottom', 'Left'].map(side => parseFloat(css['margin' + side]) || 0);
    const bodyWidth = Math.max(32, width - margin[1] - margin[3]);
    const bodyHeight = Math.max(32, height - margin[0] - margin[2]);
    const clip = document.createElement('div'); clip.className = 'freader-content';
    Object.assign(clip.style, { left: `${margin[3]}px`, top: `${margin[0]}px`, width: `${bodyWidth}px`, height: `${bodyHeight}px` });
    inner.replaceWith(clip); clip.appendChild(inner);
    inner.classList.add('freader-columns');
    Object.assign(inner.style, { width: `${bodyWidth}px`, height: `${bodyHeight}px`, columnWidth: `${bodyWidth}px` });
    const columns = Math.max(1, Math.ceil((inner.scrollWidth - 1) / bodyWidth));
    if (result.length + columns > 10000) throw new Error('표시할 Word 문서 페이지 수가 너무 많습니다.');
    for (let column = 0; column < columns; column++) result.push({ source, column, width, height, bodyWidth });
  }
  pages = result;
}
function clampPage(value) { return Math.max(0, Math.min(pages.length - 1, Number.isFinite(value) ? Math.trunc(value) : 0)); }
function reportLocation() { emit('location', { page, pageCount: pages.length, position: `${options.format === 'doc' ? 'doc' : 'docx'}:${page}`, progress: pages.length > 1 ? page / (pages.length - 1) : 1 }); }
function trimImages() {
  for (const [path, item] of imageCache) {
    if (imageCacheBytes <= IMAGE_CACHE_BYTES && imageCache.size <= 24) break;
    if (activeImagePaths.has(path)) continue;
    imageCache.delete(path); imageCacheBytes -= item.size; URL.revokeObjectURL(item.url);
  }
}
async function imageFor(path) {
  if (brokenImages.has(path)) throw new Error('Unsupported image');
  if (imageCache.has(path)) {
    const item = imageCache.get(path); imageCache.delete(path); imageCache.set(path, item); return item;
  }
  if (imageJobs.has(path)) return imageJobs.get(path);
  const current = generation, requestedSession = resourceSession;
  const job = (async () => {
    const result = await request('resource', { path, session: requestedSession });
    if (disposed || current !== generation || requestedSession !== resourceSession) throw new Error('Expired image');
    if (result.type !== 'resource' || !result.bytes) throw new Error(result.message || 'Missing image');
    const blob = new Blob([result.bytes], { type: result.mimeType });
    const item = { url: URL.createObjectURL(blob), size: blob.size };
    imageCache.set(path, item); imageCacheBytes += item.size; return item;
  })();
  imageJobs.set(path, job);
  try { return await job; }
  finally { if (imageJobs.get(path) === job) imageJobs.delete(path); }
}
function missingImage(img, reason) {
  const key = img.dataset.resource || img.getAttribute('src') || 'missing';
  if (!brokenImages.has(key)) { brokenImages.add(key); unavailableImages++; }
  const notice = document.createElement('span');
  notice.className = 'freader-missing-image'; notice.dataset.resource = key; if (reason) notice.dataset.reason = String(reason); notice.style.cssText = img.style.cssText;
  notice.textContent = '이 그림은 표시할 수 없습니다.'; img.replaceWith(notice);
}
async function render() {
  if (!pages.length || disposed) return;
  const serial = ++renderSerial;
  // Reuse the original layout tree in single-page mode. A spread only needs
  // one extra tree when both displayed pages belong to the same section.
  for (const frame of host.children) {
    for (const img of frame.querySelectorAll('img[data-resource]')) img.removeAttribute('src');
    const source = frame.firstElementChild;
    if (originalSources.has(source)) measure.appendChild(source);
  }
  const fragment = document.createDocumentFragment(), used = new Set();
  for (let index = page; index < Math.min(pages.length, page + (options.spread ? 2 : 1)); index++) {
    const entry = pages[index], frame = document.createElement('section');
    frame.className = 'page'; frame.dataset.page = String(index);
    frame.dataset.width = String(entry.width); frame.dataset.height = String(entry.height);
    frame.setAttribute('aria-label', `${index + 1} / ${pages.length}`);
    const source = used.has(entry.source) ? entry.source.cloneNode(true) : entry.source; used.add(entry.source);
    source.querySelector('.freader-columns').style.transform = `translateX(${-entry.column * entry.bodyWidth}px)`;
    frame.appendChild(source); fragment.appendChild(frame);
  }
  host.replaceChildren(fragment); fitPages();
  const visible = [...host.querySelectorAll('img[data-resource]')].filter(img => {
    const clip = img.closest('.freader-content').getBoundingClientRect();
    return [...img.getClientRects()].some(r => r.width > 0 && r.height > 0 && r.right > clip.left + .1 && r.left < clip.right - .1 && r.bottom > clip.top + .1 && r.top < clip.bottom - .1);
  });
  activeImagePaths = new Set(visible.map(img => img.dataset.resource));
  trimImages();
  // Sequential decoding bounds the temporary pixel buffers for photo-heavy files.
  for (const img of visible) {
    if (disposed || serial !== renderSerial) return;
    try {
      const item = await imageFor(img.dataset.resource);
      if (disposed || serial !== renderSerial) return;
      img.loading = 'eager'; img.src = item.url; await img.decode();
    } catch (error) { if (!disposed && serial === renderSerial) missingImage(img, error); }
  }
  if (serial === renderSerial) trimImages();
}
function fitPages() {
  const frames = [...host.children]; if (!frames.length) return;
  const totalWidth = frames.reduce((sum, f) => sum + Number(f.dataset.width), 0);
  const height = Math.max(...frames.map(f => Number(f.dataset.height)));
  const scale = Math.max(0.01, Math.min((host.clientWidth - 8 * (frames.length - 1)) / totalWidth, host.clientHeight / height));
  for (const frame of frames) {
    frame.style.width = `${Number(frame.dataset.width) * scale}px`;
    frame.style.height = `${Number(frame.dataset.height) * scale}px`;
    frame.firstElementChild.style.transform = `scale(${scale})`;
  }
}
function configure(next = {}) {
  const oldSpread = options.spread; options = { ...options, ...next };
  document.body.dataset.theme = ['white', 'sepia', 'dark'].includes(options.theme) ? options.theme : 'white';
  host.classList.toggle('rtl', !!options.rtl);
  if (oldSpread !== options.spread) return render();
  fitPages();
}
async function display(position) {
  if (!pages.length) return;
  const saved = /^(?:docx|doc):(\d+)$/.exec(String(position));
  page = clampPage(saved ? Number(saved[1]) : Number(position));
  await render(); reportLocation();
}
function next() { return display(page + (options.spread ? 2 : 1)); }
function previous() { return display(page - (options.spread ? 2 : 1)); }
function progress(value) { return display(Math.round(Math.max(0, Math.min(1, Number(value))) * (pages.length - 1))); }
function highlightSelection() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return;
  for (const frame of host.children) {
    const bounds = frame.getBoundingClientRect();
    for (const rect of selection.getRangeAt(0).getClientRects()) {
      if (rect.width < 1 || rect.height < 1 || rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1) continue;
      const mark = document.createElement('span');
      Object.assign(mark.style, { position: 'absolute', pointerEvents: 'none', background: '#ffc107', opacity: '.35', left: `${rect.left - bounds.left}px`, top: `${rect.top - bounds.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      frame.appendChild(mark);
    }
  }
  selection.removeAllRanges();
}
function destroy() {
  disposed = true; generation++; clearInterval(bridgeTimer); resizeObserver.disconnect();
  worker.terminate(); requests.forEach(resolve => resolve({ type: 'closed' })); requests.clear();
  if (incoming) incoming.fill(0); incoming = null; received = 0;
  clearPages(); pendingEvents = [];
}
const resizeObserver = new ResizeObserver(fitPages); resizeObserver.observe(host);
window.freaderDocx = { beginDocument, appendChunk, openDocument, configure, display, next, previous, progress, highlightSelection, destroy,
  getState: () => ({ ready, page, count: pages.length, received, spread: options.spread, awaitingPassword, unavailableImages, imageCacheBytes, cachedImages: imageCache.size, visibleImages: activeImagePaths.size, maxBytes: MAX_BYTES, format: detectedFormat }) };
window.addEventListener('pagehide', destroy, { once: true });
