// FReader adapter: fixed slide geometry, existing Flutter navigation and no uploads.
import { PptxPresentation, buildPptxTextLayer } from './engine/pptx.js';
import { legacyPpt } from './legacy/ppt.js';
import { math } from './engine/math.js';
import { chartEx } from './engine/chart-ex.js';
import { threeD } from './engine/three-d.js';
import { tiff } from './engine/tiff.js';

const host = document.getElementById('slides');
const MAX_BYTES = 256 * 1024 * 1024;
let options = { format: 'pptx', theme: 'white', spread: false, rtl: false, position: null, progress: 0 };
let incoming, received = 0, presentation, page = 0, generation = 0;
let disposed = false, loaded = false, opening = false, awaitingPassword = false;
let paintRevision = 0, painting = null, paintedRevision = -1, paintedPage = -1;
let flushing = false, events = [], fontPromise;

function emit(type, data = {}) { events.push({ type, ...data }); void flush(); }
async function flush() {
  if (disposed || flushing || !window.flutter_inappwebview?.callHandler) return;
  flushing = true;
  try {
    while (events.length && !disposed) {
      await window.flutter_inappwebview.callHandler('freaderPpt', events[0]);
      events.shift();
    }
  } catch (_) { /* The Android bridge can become available after module startup. */ }
  finally { flushing = false; }
}
const bridgeTimer = setInterval(flush, 150);
window.addEventListener('flutterInAppWebViewPlatformReady', flush);

function errorMessage(error) {
  switch (error?.code) {
    case 'unsupported-content': return '이 구형 PPT에는 아직 지원하지 않는 내용이 있습니다. PowerPoint에서 PPTX 또는 PDF로 저장한 뒤 열어 주세요.';
    case 'unsupported-encryption': return '이 프레젠테이션의 암호화 방식은 지원하지 않습니다. 암호를 해제한 사본을 열어 주세요.';
    case 'ooxml-resource-limit': return '프레젠테이션을 압축 해제한 데이터가 처리 한도를 초과했습니다. 파일을 나누어 열어 주세요.';
    case 'ooxml-decoded-image-limit': return '슬라이드의 그림을 처리할 메모리가 부족합니다. 그림 해상도를 낮춘 사본을 열어 주세요.';
    default: return '프레젠테이션을 표시하지 못했습니다: ' + String(error?.message || error).slice(0, 400);
  }
}
function fail(error) { emit('error', { message: errorMessage(error) }); return false; }
function wipe(bytes) { if (bytes?.byteLength) bytes.fill(0); }
function clearFrames() {
  for (const canvas of host.querySelectorAll('canvas')) { canvas.width = 0; canvas.height = 0; }
  host.replaceChildren();
}
function closePresentation() {
  presentation?.destroy(); presentation = null;
  clearFrames(); loaded = false; paintedPage = -1;
}
function beginDocument(length, config = {}) {
  if (disposed) throw new Error('뷰어가 종료되었습니다.');
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES) throw new Error('열 수 있는 문서 크기는 256MB 이하입니다.');
  generation++; paintRevision++; closePresentation();
  wipe(incoming);
  incoming = new Uint8Array(length); received = 0; page = 0;
  opening = false; awaitingPassword = false;
  configure(config);
}
function appendChunk(offset, encoded) {
  if (!incoming || offset !== received) throw new Error('문서 전송 순서가 올바르지 않습니다.');
  const data = atob(encoded);
  if (received + data.length > incoming.length) throw new Error('문서 전송 크기가 일치하지 않습니다.');
  for (let i = 0; i < data.length; i++) incoming[received + i] = data.charCodeAt(i);
  received += data.length;
}
function loadFonts() {
  if (fontPromise) return fontPromise;
  // Only bundled OFL fonts; Office fonts are used locally when the device has them.
  const sans = ['Noto Sans KR', 'Noto Sans CJK KR', '맑은 고딕', 'Malgun Gothic', '굴림', 'Gulim', '돋움', 'Dotum', 'Arial', 'Calibri', 'Calibri Light', 'Aptos', 'Arial Unicode MS'];
  const serif = ['Noto Serif KR', 'Noto Serif CJK KR', '바탕', 'Batang', 'Times New Roman', 'Cambria'];
  fontPromise = Promise.all([...sans, ...serif].flatMap(name => [400, 700].map(async weight => {
    const base = serif.includes(name) ? 'NotoSerifKR' : 'NotoSansKR';
    const source = `local(${JSON.stringify(name)}), url(../hwp/fonts/${base}-${weight === 700 ? 'Bold' : 'Regular'}.woff2)`;
    const face = new FontFace(name, source, { weight: String(weight) });
    await face.load(); document.fonts.add(face);
  })));
  return fontPromise;
}
function clampPage(value) {
  return Math.max(0, Math.min((presentation?.slideCount || 1) - 1, Number.isFinite(value) ? Math.trunc(value) : 0));
}
function positionPage(position, progress = 0) {
  const saved = /^(?:ppt|pptx):(\d+)$/.exec(String(position || ''));
  return clampPage(saved ? Number(saved[1]) : Math.round(Number(progress || 0) * ((presentation?.slideCount || 1) - 1)));
}
function reportLocation() {
  if (!loaded || !presentation || paintedPage !== page) return;
  const count = presentation.slideCount;
  emit('location', { page, pageCount: count, position: `${options.format === 'ppt' ? 'ppt' : 'pptx'}:${page}`, progress: count > 1 ? page / (count - 1) : 1 });
}
async function openDocument(password = null) {
  if (opening || disposed) return false;
  const current = generation, bytes = incoming;
  opening = true;
  try {
    if (!bytes || received !== bytes.length) throw new Error('문서 데이터를 모두 받지 못했습니다.');
    await loadFonts();
    if (disposed || current !== generation) return false;
    const opened = await PptxPresentation.load(bytes.buffer, {
      legacyPpt, math, chartEx, threeD, tiff, mode: 'main',
      useGoogleFonts: false, cjkFallback: 'kr', password: password ?? undefined,
      workerTimeoutMs: 240000,
      resourceLimits: { maxArchiveEntryBytes: 128 * 1024 * 1024, maxTotalInflatedBytes: 512 * 1024 * 1024, maxArchiveEntries: 20000 },
    });
    password = null;
    if (disposed || current !== generation) { opened.destroy(); return false; }
    presentation = opened;
    if (!Number.isInteger(opened.slideCount) || opened.slideCount < 1 || opened.slideCount > 10000) throw new Error('표시할 슬라이드가 없거나 슬라이드 수가 너무 많습니다.');
    if (!(opened.slideWidth > 0 && opened.slideHeight > 0)) throw new Error('슬라이드 크기가 올바르지 않습니다.');
    // The parser transfers ownership to its Worker; that buffer may be detached.
    awaitingPassword = false; incoming = null; received = 0; wipe(bytes);
    page = positionPage(options.position, options.progress);
    await requestPaint();
    if (disposed || current !== generation || paintedPage !== page) return false;
    loaded = true; emit('loaded', { pageCount: opened.slideCount }); reportLocation();
    return true;
  } catch (error) {
    if (disposed || current !== generation) return false;
    if (error?.code === 'encrypted' || error?.code === 'invalid-password') {
      awaitingPassword = true; emit('password', { incorrect: error.code === 'invalid-password' }); return false;
    }
    closePresentation(); wipe(incoming); incoming = null; received = 0;
    return fail(error);
  } finally { password = null; if (current === generation) opening = false; }
}
async function waitForSize(current) {
  const start = performance.now();
  while (host.clientWidth < 2 || host.clientHeight < 2) {
    if (disposed || current !== generation) return false;
    if (performance.now() - start > 15000) throw new Error('슬라이드 화면 크기를 확인하지 못했습니다.');
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  return true;
}
async function paint() {
  while (!disposed && presentation && paintedRevision !== paintRevision) {
    const revision = paintRevision, current = generation, pres = presentation, requestedPage = page;
    if (!await waitForSize(current)) continue;
    const count = Math.min(options.spread ? 2 : 1, pres.slideCount - requestedPage);
    const ratio = pres.slideWidth / pres.slideHeight;
    const width = Math.max(1, Math.min((host.clientWidth - 8 * (count - 1)) / count, host.clientHeight * ratio));
    const height = width / ratio;
    const dpr = Math.max(.25, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4000000 / (width * height))));
    const fragment = document.createDocumentFragment();
    for (let index = requestedPage; index < requestedPage + count; index++) {
      const frame = document.createElement('section'), canvas = document.createElement('canvas');
      frame.className = 'slide'; frame.dataset.page = String(index);
      frame.style.width = `${width}px`; frame.style.height = `${height}px`;
      frame.setAttribute('aria-label', `${index + 1} / ${pres.slideCount}`);
      const runs = [];
      try {
        await pres.renderSlide(canvas, index, { width, dpr, skipMediaControls: true,
          imageResources: { decodedByteBudget: 64 * 1024 * 1024, strategy: 'adaptive', resolution: 'display' },
          onTextRun: run => runs.push(run) });
      } catch (error) {
        canvas.width = 0; canvas.height = 0;
        for (const previous of fragment.querySelectorAll('canvas')) { previous.width = 0; previous.height = 0; }
        // A replacement document may destroy the previous parser mid-render.
        if (!disposed && current === generation) throw error;
        break;
      }
      if (disposed || current !== generation || revision !== paintRevision) {
        canvas.width = 0; canvas.height = 0;
        for (const previous of fragment.querySelectorAll('canvas')) { previous.width = 0; previous.height = 0; }
        break;
      }
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      frame.appendChild(canvas);
      const textLayer = document.createElement('div'); textLayer.className = 'slide-text';
      buildPptxTextLayer(textLayer, runs, width, height, undefined, index);
      // Selection is available; document hyperlinks never replace the app's viewer.
      textLayer.querySelectorAll('a').forEach(a => a.removeAttribute('href'));
      frame.appendChild(textLayer); fragment.appendChild(frame);
    }
    if (disposed || current !== generation || revision !== paintRevision) continue;
    clearFrames(); host.appendChild(fragment); paintedRevision = revision; paintedPage = requestedPage;
    reportLocation();
  }
}
function requestPaint() {
  paintRevision++;
  if (!painting) painting = paint().finally(() => { painting = null; });
  return painting;
}
function configure(config = {}) {
  options = { ...options, ...config };
  document.body.dataset.theme = ['white', 'sepia', 'dark'].includes(options.theme) ? options.theme : 'white';
  host.classList.toggle('rtl', !!options.rtl);
  if (presentation) return requestPaint().catch(fail);
}
async function display(position) {
  if (!presentation || !loaded || disposed) return;
  const saved = /^(?:ppt|pptx):(\d+)$/.exec(String(position));
  page = clampPage(saved ? Number(saved[1]) : Number(position));
  try { await requestPaint(); } catch (error) { fail(error); }
}
function next() { return display(page + (options.spread ? 2 : 1)); }
function previous() { return display(page - (options.spread ? 2 : 1)); }
function progress(value) { return display(Math.round(Math.max(0, Math.min(1, Number(value))) * ((presentation?.slideCount || 1) - 1))); }
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
  disposed = true; generation++; paintRevision++; clearInterval(bridgeTimer); observer.disconnect();
  closePresentation(); wipe(incoming); incoming = null; received = 0; events = [];
}
const observer = new ResizeObserver(() => {
  if (presentation && host.clientWidth > 1 && host.clientHeight > 1) void requestPaint().catch(fail);
});
observer.observe(host);
host.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
window.freaderPpt = { beginDocument, appendChunk, openDocument, configure, display, next, previous, progress, highlightSelection, destroy,
  getState: () => ({ ready: !disposed, loaded, page, count: presentation?.slideCount || 0, received, awaitingPassword, spread: options.spread, format: options.format, maxBytes: MAX_BYTES }) };
window.addEventListener('pagehide', destroy, { once: true });
emit('ready', { version: '0.89.8' });
