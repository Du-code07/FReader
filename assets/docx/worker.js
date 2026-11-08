// Keep the unmodified OpenDocument.core parser off Android's UI thread.
import { Odr } from './engine/index.js';

let document;
const engine = (async () => {
  const response = await fetch('./engine/odr-core.wasm');
  if (!response.ok) throw new Error('DOCX 엔진 파일을 읽지 못했습니다.');
  const odr = await Odr.load({ wasmBinary: new Uint8Array(await response.arrayBuffer()) });
  postMessage({ type: 'ready', version: '7.7.0' });
  return odr;
})();
engine.catch(error => postMessage({ type: 'error', message: String(error.message || error) }));

function closeDocument() {
  if (document) { document.close(); document = null; }
}

async function perform({ action, bytes, password }) {
  const odr = await engine;
  if (action === 'open') {
    closeDocument();
    try {
      document = odr.open(bytes, {
        name: 'document.docx', allowExternalContent: false, editable: false,
        lazyLayout: false, textDocumentMargin: true,
        viewportMode: odr.enums.HtmlViewportMode.none,
        keyboardNavigation: false, keyboardShortcuts: false,
      });
    } finally { bytes.fill(0); }
  }
  if (action === 'close') { closeDocument(); return { type: 'closed' }; }
  if (!document) throw new Error('DOCX 문서가 열려 있지 않습니다.');
  if (document.isPasswordEncrypted()) {
    if (password == null) return { type: 'password', incorrect: false };
    try { document.decrypt(password); }
    catch (error) {
      if (error.name === 'WrongPassword') return { type: 'password', incorrect: true };
      throw error;
    } finally { password = null; }
  }
  try {
    if (document.fileType !== odr.enums.FileType.docx) throw new Error('파일 내용이 DOCX 문서 형식과 일치하지 않습니다.');
    const result = document.render(0);
    if (result.externalResources.length) throw new Error('문서의 일부 자료를 내부에 포함하지 못했습니다.');
    if (result.html.length > 32 * 1024 * 1024) throw new Error('이 문서는 표시할 내용이 너무 큽니다.');
    return { type: 'rendered', html: result.html };
  } finally { closeDocument(); }
}

let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try { postMessage({ id: data.id, ...await perform(data) }); }
    catch (error) {
      closeDocument();
      postMessage({ id: data.id, type: 'error', message: String(error.message || error).slice(0, 600) });
    }
  });
};
