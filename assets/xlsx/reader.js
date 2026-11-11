// Read-only local Excel sheets. The existing Flutter toolbar owns navigation.
import { XlsxSheetViewer } from './engine/xlsx.js';
import { legacyXls } from './legacy/xls.js';
import { math } from './engine/math.js';
import { chartEx } from './engine/chart-ex.js';
import { threeD } from './engine/three-d.js';
import { tiff } from './engine/tiff.js';

const host = document.getElementById('sheet');
const MAX_BYTES = 256 * 1024 * 1024;
let options = { format: 'xlsx', theme: 'white', position: null, progress: 0 };
let incoming, received = 0, viewer, generation = 0, disposed = false;
let loaded = false, opening = false, awaitingPassword = false;
let events = [], flushing = false, navigation = Promise.resolve(), fontPromise;
let locationTimer, resizeTimer, frameRequest = 0, desiredView, applyingView = false;
let gesture = null;
let searchMatches = [];
const pointers = new Map();

function emit(type, data = {}) { events.push({ type, ...data }); void flush(); }
async function flush() {
  if (disposed || flushing || !window.flutter_inappwebview?.callHandler) return;
  flushing = true;
  try {
    while (events.length && !disposed) {
      await window.flutter_inappwebview.callHandler('freaderXlsx', events[0]); events.shift();
    }
  } catch (_) { /* Retry when the Android bridge finishes attaching. */ }
  finally { flushing = false; }
}
const bridgeTimer = setInterval(flush, 150);
window.addEventListener('flutterInAppWebViewPlatformReady', flush);
function errorMessage(error) {
  switch (error?.code) {
    case 'unsupported-content': return '이 구형 XLS에는 아직 지원하지 않는 내용이 있습니다. Excel에서 XLSX로 저장한 뒤 열어 주세요.';
    case 'unsupported-encryption': return '이 엑셀 파일의 암호화 방식은 지원하지 않습니다. 암호를 해제한 사본을 열어 주세요.';
    case 'ooxml-resource-limit': return '엑셀 파일의 압축 해제 데이터 또는 셀 수가 처리 한도를 초과했습니다. 시트를 나눈 사본을 열어 주세요.';
    case 'ooxml-decoded-image-limit': return '시트의 그림을 처리할 메모리가 부족합니다. 그림 해상도를 낮춘 사본을 열어 주세요.';
    default: return '엑셀 파일을 표시하지 못했습니다: ' + String(error?.message || error).slice(0, 400);
  }
}
function fail(error) { emit('error', { message: errorMessage(error) }); return false; }
function wipe(bytes) { if (bytes?.byteLength) bytes.fill(0); }
function closeViewer() {
  loaded = false; desiredView = null; gesture = null; pointers.clear();
  searchMatches = [];
  clearTimeout(locationTimer); clearTimeout(resizeTimer); cancelAnimationFrame(frameRequest);
  viewer?.destroy(); viewer = null; host.replaceChildren();
}
function beginDocument(length, config = {}) {
  if (disposed) throw new Error('뷰어가 종료되었습니다.');
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_BYTES) throw new Error('열 수 있는 문서 크기는 256MB 이하입니다.');
  generation++; closeViewer(); wipe(incoming);
  incoming = new Uint8Array(length); received = 0;
  opening = false; awaitingPassword = false; navigation = Promise.resolve();
  options = { format: 'xlsx', theme: 'white', position: null, progress: 0, ...config };
  configure(options);
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
  const sans = ['Noto Sans KR', 'Noto Sans CJK KR', '맑은 고딕', 'Malgun Gothic', '굴림', 'Gulim', '돋움', 'Dotum', 'Arial', 'Calibri', 'Calibri Light', 'Aptos', 'Arial Unicode MS'];
  const serif = ['Noto Serif KR', 'Noto Serif CJK KR', '바탕', 'Batang', 'Times New Roman', 'Cambria'];
  fontPromise = Promise.all([...sans, ...serif].flatMap(name => [400, 700].map(async weight => {
    const base = serif.includes(name) ? 'NotoSerifKR' : 'NotoSansKR';
    const face = new FontFace(name, `local(${JSON.stringify(name)}), url(../hwp/fonts/${base}-${weight === 700 ? 'Bold' : 'Regular'}.woff2)`, { weight: String(weight) });
    await face.load(); document.fonts.add(face);
  })));
  return fontPromise;
}
function clampSheet(value) { return Math.max(0, Math.min((viewer?.sheetCount || 1) - 1, Number.isFinite(value) ? Math.trunc(value) : 0)); }
function savedPosition(position, progress = 0) {
  const m = /^(?:xlsx|xlsm|xls):(\d+)(?::([\d.]+):([\d.]+):([\d.]+))?$/.exec(String(position || ''));
  const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return { sheet: clampSheet(m ? Number(m[1]) : Math.round(number(progress, 0) * ((viewer?.sheetCount || 1) - 1))),
    x: m ? Math.max(0, number(m[2], 0)) : 0, y: m ? Math.max(0, number(m[3], 0)) : 0,
    scale: m ? Math.max(.25, Math.min(4, number(m[4], 1))) : 1 };
}
function reportLocation() {
  if (!loaded || !viewer) return;
  const { x, y } = viewer.getViewportOffset(), count = viewer.sheetCount, page = viewer.sheetIndex;
  const scale = Math.round(viewer.getScale() * 1000) / 1000;
  emit('location', { page, pageCount: count,
    position: `${options.format}:${page}:${Math.round(x)}:${Math.round(y)}:${scale}`,
    progress: count > 1 ? page / (count - 1) : 1 });
}
function scheduleLocation() { clearTimeout(locationTimer); locationTimer = setTimeout(reportLocation, 250); }
async function restorePosition(position, progress = 0) {
  const at = savedPosition(position, progress), active = viewer;
  if (!active) return;
  await active.goToSheet(at.sheet);
  if (active !== viewer) return;
  active.setScale(at.scale);
  await active.setViewportOffset({ x: at.x, y: at.y });
}
async function openDocument(password = null) {
  if (opening || disposed) return false;
  const current = generation, bytes = incoming;
  opening = true;
  try {
    if (!bytes || received !== bytes.length) throw new Error('문서 데이터를 모두 받지 못했습니다.');
    await loadFonts();
    if (disposed || current !== generation) return false;
    const start = performance.now();
    while (host.clientWidth < 2 || host.clientHeight < 2) {
      if (disposed || current !== generation) return false;
      if (performance.now() - start > 15000) throw new Error('엑셀 화면 크기를 확인하지 못했습니다.');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    closeViewer();
    const canvas = document.createElement('canvas');
    canvas.style.width = `${host.clientWidth}px`; canvas.style.height = `${host.clientHeight}px`;
    host.appendChild(canvas);
    const active = new XlsxSheetViewer(canvas, {
      legacyXls, math, chartEx, threeD, tiff, mode: 'main',
      useGoogleFonts: false, cjkFallback: 'kr', password: password ?? undefined,
      workerTimeoutMs: 240000, resizable: false, showScrollbars: true,
      // Logical grid bounds only: sparse axes and viewport painting do not
      // allocate these empty cells. Keep long overflowing text and content
      // beyond the saved used range reachable in every worksheet.
      minRows: options.format === 'xls' ? 65536 : 1048576,
      minCols: options.format === 'xls' ? 256 : 16384,
      marginRows: 0, marginCols: 0,
      enableHyperlinks: false, hiddenSheetMode: 'show', zoomMin: .25, zoomMax: 4,
      resourceLimits: { maxArchiveEntryBytes: 128 * 1024 * 1024, maxTotalInflatedBytes: 512 * 1024 * 1024, maxArchiveEntries: 20000 },
      imageResources: { decodedByteBudget: 64 * 1024 * 1024, strategy: 'adaptive', resolution: 'display' },
      onViewportChange: scheduleLocation, onScaleChange: scheduleLocation,
      onError: error => { if (loaded && !disposed && current === generation) fail(error); },
    });
    viewer = active;
    await active.load(bytes.buffer);
    password = null;
    if (disposed || current !== generation) { active.destroy(); return false; }
    if (!Number.isSafeInteger(active.sheetCount) || active.sheetCount < 1) throw new Error('표시할 시트가 없습니다.');
    await restorePosition(options.position, options.progress);
    if (disposed || current !== generation) return false;
    awaitingPassword = false; incoming = null; received = 0; wipe(bytes);
    loaded = true;
    emit('loaded', { pageCount: active.sheetCount, chapters: active.sheetNames }); reportLocation();
    return true;
  } catch (error) {
    if (disposed || current !== generation) return false;
    closeViewer();
    if (error?.code === 'encrypted' || error?.code === 'invalid-password') {
      awaitingPassword = true; emit('password', { incorrect: error.code === 'invalid-password' }); return false;
    }
    wipe(incoming); incoming = null; received = 0; awaitingPassword = false;
    return fail(error);
  } finally { password = null; if (current === generation) opening = false; }
}
function configure(config = {}) {
  options = { ...options, ...config };
  if (!['xlsx', 'xlsm', 'xls'].includes(options.format)) options.format = 'xlsx';
  document.body.dataset.theme = ['white', 'sepia', 'dark'].includes(options.theme) ? options.theme : 'white';
}
function enqueue(action) {
  const current = generation;
  navigation = navigation.catch(() => {}).then(async () => {
    if (!loaded || !viewer || disposed || current !== generation) return;
    try { const result = await action(); if (current === generation) reportLocation(); return result; }
    catch (error) { if (!disposed && current === generation) fail(error); }
  });
  return navigation;
}
function display(position) {
  return enqueue(() => restorePosition(/^\d+$/.test(String(position)) ? `${options.format}:${position}` : position));
}
function turnSheet(delta) {
  return enqueue(() => {
    const target = clampSheet(viewer.sheetIndex + delta);
    if (target !== viewer.sheetIndex) return restorePosition(`${options.format}:${target}`);
  });
}
function next() { return turnSheet(1); }
function previous() { return turnSheet(-1); }
function progress(value) { return enqueue(() => restorePosition(null, Math.max(0, Math.min(1, Number(value) || 0)))); }
function highlightSelection() { viewer?.setSelectionColor('#ffc107'); }

// Connect v86's existing Find bar to all workbook sheets, including hidden ones.
function search(text) {
  return enqueue(async () => {
    searchMatches = await viewer.findText(String(text || ''));
    return { count: searchMatches.length };
  });
}
function cellAddress(row, col) {
  let letters = '';
  while (col > 0) { col--; letters = String.fromCharCode(65 + col % 26) + letters; col = Math.floor(col / 26); }
  return `${letters}${row}`;
}
function showSearchResult(index) {
  return enqueue(async () => {
    const match = searchMatches[Math.trunc(Number(index))];
    if (!match) return;
    const { sheet, row, col } = match.location;
    await viewer.goToSheet(sheet);
    await viewer.scrollToCell(cellAddress(row, col), { align: 'center' });
  });
}
function clearSearch() {
  return enqueue(() => { searchMatches = []; viewer.clearFind(); });
}

// Native mobile panning and pinch zoom. A horizontal drag stays inside a sheet;
// sheet changes use the existing toolbar, volume keys, and contents drawer.
function rebaseGesture() {
  if (!viewer || !pointers.size) { gesture = null; return; }
  const points = [...pointers.values()], a = points[0], b = points[1];
  gesture = { count: points.length, x: b ? (a.x + b.x) / 2 : a.x, y: b ? (a.y + b.y) / 2 : a.y,
    distance: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
    offset: viewer.getViewportOffset(), scale: viewer.getScale() };
}
async function applyDesiredView() {
  if (applyingView) return;
  applyingView = true;
  try {
    while (desiredView && loaded && viewer && !disposed) {
      const desired = desiredView; desiredView = null;
      const active = viewer, current = generation;
      active.setScale(desired.scale);
      try { await active.setViewportOffset({ x: desired.x, y: desired.y }); }
      catch (error) { if (!disposed && current === generation) fail(error); }
    }
  } finally { applyingView = false; }
}
host.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' || !loaded) return;
  event.preventDefault(); event.stopPropagation();
  host.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); rebaseGesture();
}, true);
host.addEventListener('pointermove', event => {
  if (!pointers.has(event.pointerId) || !gesture || !viewer) return;
  event.preventDefault(); event.stopPropagation();
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  const [a, b] = [...pointers.values()], x = b ? (a.x + b.x) / 2 : a.x, y = b ? (a.y + b.y) / 2 : a.y;
  const scale = b && gesture.distance > 0 ? Math.max(.25, Math.min(4, gesture.scale * Math.hypot(a.x - b.x, a.y - b.y) / gesture.distance)) : gesture.scale;
  const ratio = scale / gesture.scale, bounds = host.getBoundingClientRect();
  desiredView = { scale, x: (gesture.offset.x + gesture.x - bounds.left) * ratio - (x - bounds.left),
    y: (gesture.offset.y + gesture.y - bounds.top) * ratio - (y - bounds.top) };
  cancelAnimationFrame(frameRequest); frameRequest = requestAnimationFrame(() => { void applyDesiredView(); });
}, true);
function endPointer(event) {
  if (!pointers.has(event.pointerId)) return;
  event.preventDefault(); event.stopPropagation(); pointers.delete(event.pointerId);
  if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
  rebaseGesture(); scheduleLocation();
}
host.addEventListener('pointerup', endPointer, true);
host.addEventListener('pointercancel', endPointer, true);
const observer = new ResizeObserver(() => {
  clearTimeout(resizeTimer);
  const current = generation;
  resizeTimer = setTimeout(() => {
    if (!loaded || !viewer || disposed || current !== generation) return;
    const canvas = viewer.canvasElement;
    canvas.style.width = `${host.clientWidth}px`; canvas.style.height = `${host.clientHeight}px`;
    void enqueue(() => viewer.relayout());
  }, 80);
});
observer.observe(host);
function destroy() {
  disposed = true; generation++; clearInterval(bridgeTimer); observer.disconnect();
  closeViewer(); wipe(incoming); incoming = null; received = 0; events = [];
}
window.freaderXlsx = { beginDocument, appendChunk, openDocument, configure, display, next, previous, progress, highlightSelection, destroy,
  search, showSearchResult, clearSearch,
  getState: () => ({ ready: !disposed, loaded, page: viewer?.sheetIndex || 0, count: viewer?.sheetCount || 0,
    sheets: viewer?.sheetNames || [], viewport: viewer?.getViewportOffset() || { x: 0, y: 0 }, scale: viewer?.getScale() || 1,
    received, awaitingPassword, format: options.format, maxBytes: MAX_BYTES }) };
emit('ready');
