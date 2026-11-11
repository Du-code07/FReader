// Read-only parser and resource broker. Original files never leave this device.
import { Odr } from './engine/index.js';
import { prepareRtfPictures } from './rtf_images.js';
import { parseRtfLayout } from './rtf_layout.js';
let document, session = 0, resourcePaths = new Set(), rtfPictures = new Map();
let preparedRtf;
let rtfLayout;
const engine = (async () => {
  const response = await fetch('./engine/odr-core.wasm');
  if (!response.ok) throw new Error('Word 문서 엔진 파일을 읽지 못했습니다.');
  const odr = await Odr.load({ wasmBinary: new Uint8Array(await response.arrayBuffer()) });
  postMessage({ type: 'ready', version: '7.7.0' });
  return odr;
})();
engine.catch(error => postMessage({ type: 'error', message: String(error.message || error) }));
function closeDocument() {
  resourcePaths.clear();
  rtfPictures.clear(); preparedRtf = null; rtfLayout = null;
  if (document) { document.close(); document = null; }
}
const SHRINK_MAX_SIDE = 2200;
async function shrinkRaster(bytes, mimeType) {
  if (!/^image\/(jpeg|jpg|png|webp|bmp)$/i.test(mimeType || '') || bytes.byteLength < 300 * 1024) return { bytes, mimeType };
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas !== 'function') return { bytes, mimeType };
  let bitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
    const side = Math.max(bitmap.width, bitmap.height);
    if (side <= SHRINK_MAX_SIDE) return { bytes, mimeType };
    const scale = SHRINK_MAX_SIDE / side;
    const canvas = new OffscreenCanvas(Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale)));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const type = /jpe?g/i.test(mimeType) ? 'image/jpeg' : 'image/webp';
    const blob = await canvas.convertToBlob({ type, quality: 0.9 });
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type || type };
  } catch (_) {
    return { bytes, mimeType };
  } finally {
    bitmap?.close?.();
  }
}
async function perform({ action, bytes, password, path, session: requestedSession, format }) {
  const odr = await engine;
  if (action === 'resource') {
    if (!document || requestedSession !== session || !resourcePaths.has(path)) throw new Error('문서 이미지 요청이 만료되었습니다.');
    const picture = rtfPictures.get(path);
    const result = picture ? { bytes: picture.bytes.slice(), mimeType: picture.mimeType } : document.read(path);
    if (/image\/(?:x-)?(?:emf|wmf)/i.test(result.mimeType)) {
      const { convertMetafileToSvg } = await import('./metafile/converter.js');
      const buffer = result.bytes.buffer.slice(result.bytes.byteOffset, result.bytes.byteOffset + result.bytes.byteLength);
      // FReader: 정밀 래스터 연산(그림자 캔버스)은 매우 느리다(사진 표 한 장에 30초 이상).
      // 마스크 연산이 실제로 쓰이는 그림에서만 켠다 (Office의 EMF+ 그림은 사진을 EMF+로 그리므로 필요 없음).
      const { needsExactRasterOps } = await import('./emf_fix.js').catch(() => ({ needsExactRasterOps: () => true }));
      let svg = await convertMetafileToSvg(buffer, needsExactRasterOps(buffer) ? undefined : { exactRasterOps: false });
      if (!svg) throw new Error('이 벡터 그림을 변환하지 못했습니다.');
      // FReader: 표 칸마다 넣은 사진이 앞 칸의 잘라내기 영역과 잘못 겹쳐 사라지는 문제 보정
      try { const { fixDisjointClipChains } = await import('./emf_fix.js'); svg = fixDisjointClipChains(svg); } catch (_) {}
      return { type: 'resource', bytes: new TextEncoder().encode(svg), mimeType: 'image/svg+xml', session };
    }
    // FReader: 폰 카메라 사진처럼 아주 큰 그림은 화면에 필요한 크기로 줄여 보낸다 (푸는 시간·메모리 절약)
    const shrunk = await shrinkRaster(result.bytes, result.mimeType);
    // This owned buffer can cross the worker boundary without another clone.
    return { type: 'resource', bytes: shrunk.bytes, mimeType: shrunk.mimeType, session };
  }
  if (action === 'open') {
    closeDocument(); session++;
    try {
      preparedRtf = prepareRtfPictures(bytes, { includePageFurniture: true });
      document = odr.open(preparedRtf.bytes, {
        name: format === 'doc' ? 'document.doc' : 'document.docx', embedImages: false, allowExternalContent: false,
        editable: false, lazyLayout: false, textDocumentMargin: true,
        viewportMode: odr.enums.HtmlViewportMode.none,
        keyboardNavigation: false, keyboardShortcuts: false,
      });
      if (document.fileType === odr.enums.FileType.rtf) rtfLayout = parseRtfLayout(preparedRtf.bytes, preparedRtf);
    } finally {
      if (preparedRtf) { preparedRtf.bytes.fill(0); preparedRtf.bytes = null; }
      bytes.fill(0);
    }
  }
  if (action === 'close') { closeDocument(); session++; return { type: 'closed' }; }
  if (!document) throw new Error('Word 문서가 열려 있지 않습니다.');
  if (document.isPasswordEncrypted()) {
    if (password == null) return { type: 'password', incorrect: false };
    try { document.decrypt(password); }
    catch (error) {
      if (error.name === 'WrongPassword') return { type: 'password', incorrect: true };
      throw error;
    } finally { password = null; }
  }
  const actualType = document.fileType;
  // Word also opens RTF files distributed with a .doc extension. Trust the
  // parser's content detection rather than rejecting them by their filename.
  const detectedFormat = actualType === odr.enums.FileType.doc ? 'doc'
    : actualType === odr.enums.FileType.docx ? 'docx'
    : actualType === odr.enums.FileType.rtf ? 'rtf' : null;
  if (!detectedFormat) throw new Error('파일 내용이 Word(DOC/DOCX/RTF) 문서 형식과 일치하지 않습니다.');
  const result = detectedFormat === 'rtf' && rtfLayout
    ? { html: rtfLayout.html, externalResources: [] } : document.render(0);
  let html = result.html;
  if (detectedFormat === 'rtf' && rtfLayout) rtfPictures = rtfLayout.resources;
  rtfLayout = null;
  preparedRtf = null;
  // Images no longer count against this text-only safety budget.
  if (html.length > 64 * 1024 * 1024) throw new Error('문서의 본문 구조가 너무 큽니다. 문서를 나누어 열어 주세요.');
  const resources = [...new Map(result.externalResources.map(r => [r.path, r])).values()];
  for (const picture of rtfPictures.values()) resources.push({ path: picture.path, mimeType: picture.mimeType });
  resourcePaths = new Set(resources.map(r => r.path));
  // Keep the parser alive for on-demand image reads; close it on replacement/exit.
  return { type: 'rendered', html, resources, session, format: detectedFormat };
}
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      const result = await perform(data);
      postMessage({ id: data.id, ...result }, result.bytes ? [result.bytes.buffer] : []);
    } catch (error) {
      // One broken image must not invalidate the rest of the document.
      if (data.action !== 'resource') closeDocument();
      postMessage({ id: data.id, type: 'error', message: String(error.message || error).slice(0, 600) });
    }
  });
};
