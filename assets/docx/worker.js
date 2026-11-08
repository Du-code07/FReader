// Read-only parser and resource broker. Original files never leave this device.
import { Odr } from './engine/index.js';
import { prepareRtfPictures, restoreRtfPictures } from './rtf_images.js';
let document, session = 0, resourcePaths = new Set(), rtfPictures = new Map();
let preparedRtf;
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
  rtfPictures.clear(); preparedRtf = null;
  if (document) { document.close(); document = null; }
}
async function perform({ action, bytes, password, path, session: requestedSession, format }) {
  const odr = await engine;
  if (action === 'resource') {
    if (!document || requestedSession !== session || !resourcePaths.has(path)) throw new Error('문서 이미지 요청이 만료되었습니다.');
    const picture = rtfPictures.get(path);
    const result = picture ? { bytes: picture.bytes.slice(), mimeType: picture.mimeType } : document.read(path);
    if (/image\/(?:x-)?(?:emf|wmf)/i.test(result.mimeType)) {
      const { convertMetafileToSvg } = await import('./metafile/converter.js');
      const svg = await convertMetafileToSvg(result.bytes.buffer.slice(result.bytes.byteOffset, result.bytes.byteOffset + result.bytes.byteLength));
      if (!svg) throw new Error('이 벡터 그림을 변환하지 못했습니다.');
      return { type: 'resource', bytes: new TextEncoder().encode(svg), mimeType: 'image/svg+xml', session };
    }
    // This owned buffer can cross the worker boundary without another clone.
    return { type: 'resource', bytes: result.bytes, mimeType: result.mimeType, session };
  }
  if (action === 'open') {
    closeDocument(); session++;
    try {
      preparedRtf = prepareRtfPictures(bytes);
      document = odr.open(preparedRtf.bytes, {
        name: format === 'doc' ? 'document.doc' : 'document.docx', embedImages: false, allowExternalContent: false,
        editable: false, lazyLayout: false, textDocumentMargin: true,
        viewportMode: odr.enums.HtmlViewportMode.none,
        keyboardNavigation: false, keyboardShortcuts: false,
      });
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
  const result = document.render(0);
  let html = result.html;
  if (detectedFormat === 'rtf' && preparedRtf) {
    const restored = restoreRtfPictures(html, preparedRtf);
    html = restored.html; rtfPictures = restored.resources;
  }
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
