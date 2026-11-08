// Read-only RTF layout adapter. It runs in the parser worker, never in the UI.
// Pictures are external resources; no document content or fonts leave the device.
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cssString = s => escape(JSON.stringify(String(s)));
const twips = n => Math.max(-20000, Math.min(20000, Number(n || 0) / 15));
const charDefaults = font => ({ font, size: 24, bold: false, italic: false, underline: false, strike: false, color: 0, highlight: null, shift: 0, caps: false, hidden: false, spacing: 0 });
const paraDefaults = () => ({ align: 'left', left: 0, right: 0, first: 0, before: 0, after: 0, line: 0, multiple: false, inTable: false, keep: false, keepNext: false, pageBefore: false, rtl: false, tabs: [] });
const geometryDefaults = () => ({ width: 12240, height: 15840, left: 1800, right: 1800, top: 1440, bottom: 1440, header: 720, footer: 720, titlePage: false, facing: false, pageStart: null });
const ignored = new Set(('filetbl listtable listoverridetable revtbl rsidtbl info generator footnote annotation atnauthor atndate atnid '
  + 'atnparent atnref atntime atnicn xe tc txe bkmkstart bkmkend nonshppict object objdata result do shptxt '
  + 'falt fname ffname panose keycode mmath factoidname datafield template private pict').split(' '));
const charsets = { 0: 1252, 128: 932, 129: 949, 130: 1361, 134: 936, 136: 950, 161: 1253, 162: 1254, 163: 1258, 177: 1255, 178: 1256, 186: 1257, 204: 1251, 222: 874, 238: 1250, 255: 437 };
const labels = { 65001: 'utf-8', 932: 'shift_jis', 936: 'gb18030', 949: 'euc-kr', 950: 'big5', 874: 'windows-874', 10000: 'macintosh' };
function textDecoder(page) {
  const key = labels[page] || (page >= 1250 && page <= 1258 ? 'windows-' + page : 'windows-1252');
  return new TextDecoder(key);
}

function* tokenize(bytes) {
  let i = 0;
  const letter = n => n >= 65 && n <= 90 || n >= 97 && n <= 122;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c === 123 || c === 125) { yield { type: c === 123 ? 'open' : 'close' }; continue; }
    if (c === 10 || c === 13) continue;
    if (c !== 92) { yield { type: 'byte', value: c }; continue; }
    if (i >= bytes.length) throw new Error('RTF 제어 문자가 잘렸습니다.');
    if (!letter(bytes[i])) {
      const symbol = bytes[i++];
      if (symbol === 39) {
        const hex = String.fromCharCode(...bytes.subarray(i, i + 2)); i += 2;
        if (!/^[0-9a-f]{2}$/i.test(hex)) throw new Error('RTF 문자 데이터가 올바르지 않습니다.');
        yield { type: 'byte', value: parseInt(hex, 16) };
      } else yield { type: 'symbol', value: String.fromCharCode(symbol) };
      continue;
    }
    const start = i;
    while (i < bytes.length && letter(bytes[i])) i++;
    if (i - start > 64) throw new Error('RTF 제어 문자가 너무 깁니다.');
    const word = String.fromCharCode(...bytes.subarray(start, i));
    let sign = 1, value = null;
    if (bytes[i] === 45) { sign = -1; i++; }
    if (bytes[i] >= 48 && bytes[i] <= 57) {
      value = 0;
      while (bytes[i] >= 48 && bytes[i] <= 57) value = value * 10 + bytes[i++] - 48;
      value *= sign;
      if (!Number.isSafeInteger(value)) throw new Error('RTF 숫자 값이 올바르지 않습니다.');
    }
    if (bytes[i] === 32) i++;
    if (word === 'bin') {
      if (value === null || value < 0 || i + value > bytes.length) throw new Error('RTF 바이너리 데이터가 잘렸습니다.');
      i += value; yield { type: 'binary' };
    } else yield { type: 'word', word, value };
  }
}

export function parseRtfLayout(bytes, prepared) {
  let defaultFont = 0, byteRun = [], byteDecoder = null, skip = 0, textSize = 0;
  const fonts = new Map(), colors = [], styles = new Map();
  let color = {}, frame;
  const context = () => ({ blocks: [], paragraph: null, row: null });
  const section = (previous = null) => ({ geometry: { ...(previous?.geometry || geometryDefaults()) }, stories: { ...(previous?.stories || {}) }, body: context() });
  const sections = [section()]; let current = sections[0];
  const stack = [];
  const rootFrame = () => ({ ch: charDefaults(defaultFont), p: paraDefaults(), codepage: 1252, uc: 1, destination: 'body', ctx: current.body, star: false, firstWord: true });
  const para = () => {
    if (!frame.ctx.paragraph) frame.ctx.paragraph = { type: 'paragraph', p: { ...frame.p }, ch: { ...frame.ch }, runs: [] };
    return frame.ctx.paragraph;
  };
  const addText = (text, field = null) => {
    if (!text && !field) return;
    if (frame.destination === 'fonttbl') {
      if (frame.fontId != null) { const f = fonts.get(frame.fontId); if (f) f.name = (f.name + text).slice(0, 1024); }
      return;
    }
    if (frame.destination === 'colortbl') {
      for (const c of text) if (c === ';') { colors.push('red' in color ? `rgb(${color.red || 0},${color.green || 0},${color.blue || 0})` : null); color = {}; }
      return;
    }
    if (frame.destination === 'fldinst') { if (frame.field) frame.field.instruction += text; return; }
    if (frame.destination === 'skip' || frame.destination === 'stylesheet' || frame.ch.hidden || frame.suppressResult) return;
    const p = para();
    const previous = p.runs.at(-1), key = JSON.stringify(frame.ch);
    if (!field && previous?.key === key && !previous.field) previous.text += text;
    else p.runs.push({ text, field, ch: { ...frame.ch }, key });
    textSize += text.length;
    if (textSize > 32 * 1024 * 1024) throw new Error('RTF 문서의 본문이 너무 큽니다.');
  };
  const flush = (partial = false) => {
    if ((!byteRun.length && !byteDecoder) || !frame) return;
    const charset = fonts.get(frame.destination === 'fonttbl' ? frame.fontId : frame.ch.font)?.charset;
    const page = charset && charsets[charset] ? charsets[charset] : frame.codepage;
    byteDecoder ||= textDecoder(page);
    addText(byteDecoder.decode(new Uint8Array(byteRun), { stream: partial })); byteRun = [];
    if (!partial) byteDecoder = null;
  };
  const finishParagraph = force => {
    if (!frame.ctx || frame.destination === 'skip') return;
    const p = frame.ctx.paragraph;
    if (!p && !force) return;
    const block = p || { type: 'paragraph', p: { ...frame.p }, ch: { ...frame.ch }, runs: [] };
    if (frame.ctx.row && block.p.inTable) frame.ctx.row.current.push(block);
    else frame.ctx.blocks.push(block);
    frame.ctx.paragraph = null;
  };
  const finishCell = () => {
    if (!frame.ctx.row) frame.ctx.row = { cells: [], current: [], edges: [], definitions: [], definition: {}, left: 0, width: 0 };
    finishParagraph(false);
    frame.ctx.row.cells.push(frame.ctx.row.current); frame.ctx.row.current = [];
  };
  const finishRow = () => {
    const row = frame.ctx.row;
    if (!row) return;
    if (frame.ctx.paragraph || row.current.length) finishCell();
    if (row.cells.length) frame.ctx.blocks.push({ type: 'table', row });
    frame.ctx.row = null;
  };
  const setChar = (key, value) => { frame.ch[key] = value; if (frame.definition) frame.definition.ch[key] = value; };
  const setPara = (key, value) => {
    frame.p[key] = value;
    if (frame.definition) frame.definition.p[key] = value;
    if (frame.ctx?.paragraph) frame.ctx.paragraph.p[key] = value;
  };
  const resolveStyle = (id, seen = new Set()) => {
    if (seen.has(id) || seen.size >= 32 || !styles.has(id)) return { ch: {}, p: {} };
    seen.add(id); const s = styles.get(id), base = resolveStyle(s.base, seen);
    return { ch: { ...base.ch, ...s.ch }, p: { ...base.p, ...s.p } };
  };
  for (const token of tokenize(bytes)) {
    if (token.type === 'open') {
      flush(); skip = 0;
      if (stack.length >= 1024) throw new Error('RTF 문서 구조가 너무 깊습니다.');
      const previous = frame || rootFrame(); stack.push(frame);
      frame = { ...previous, ch: { ...previous.ch }, p: { ...previous.p, tabs: [...previous.p.tabs] }, star: false, firstWord: true, storyOwner: null, definition: null };
      continue;
    }
    if (token.type === 'close') {
      flush(); skip = 0;
      if (!stack.length || !frame) throw new Error('RTF 문서의 괄호 구조가 올바르지 않습니다.');
      if (frame.definition?.id != null) styles.set(frame.definition.id, frame.definition);
      if (frame.storyOwner) { finishParagraph(false); finishRow(); current.stories[frame.storyOwner] = frame.ctx.blocks; }
      if (stack.length === 1) { finishParagraph(false); finishRow(); }
      frame = stack.pop(); continue;
    }
    if (!frame) continue;
    if (skip > 0) { skip--; continue; }
    if (token.type === 'byte') { byteRun.push(token.value); if (byteRun.length >= 16384) flush(true); continue; }
    flush();
    if (token.type === 'binary') continue;
    if (token.type === 'symbol') {
      if (token.value === '*') frame.star = true;
      else addText(({ '\\': '\\', '{': '{', '}': '}', '~': '\u00a0', '_': '\u2011', '-': '\u00ad' })[token.value] || '');
      continue;
    }
    const w = token.word, n = token.value, enabled = n !== 0;
    if (frame.firstWord) {
      frame.firstWord = false;
      if (frame.star && !['shppict', 'fldinst', 'listtext', 'pntext'].includes(w)) frame.destination = 'skip';
    }
    if (ignored.has(w)) { frame.destination = 'skip'; continue; }
    if (frame.destination === 'skip') continue;
    if (['fonttbl', 'colortbl', 'stylesheet'].includes(w)) { frame.destination = w; continue; }
    if (/^(header|footer)[lrf]?$/.test(w)) {
      frame.destination = 'story'; frame.storyOwner = w; frame.ctx = context(); frame.ch = charDefaults(defaultFont); frame.p = paraDefaults(); continue;
    }
    if (w === 'field') { frame.field = { instruction: '' }; continue; }
    if (w === 'fldinst') { frame.destination = 'fldinst'; continue; }
    if (w === 'fldrslt') {
      frame.destination = 'body';
      const field = frame.field?.instruction.trim().split(/\s+/)[0].toUpperCase();
      if (['PAGE', 'NUMPAGES', 'SECTIONPAGES'].includes(field)) { addText('', field); frame.suppressResult = true; }
      continue;
    }
    if (w === 'ansicpg') { frame.codepage = n || 1252; continue; }
    if (w === 'uc') { frame.uc = Math.max(0, Math.min(32768, n || 0)); continue; }
    if (w === 'u') { addText(String.fromCharCode((n || 0) & 0xffff)); skip = frame.uc; continue; }
    if (w === 'deff') { defaultFont = n || 0; frame.ch.font = defaultFont; continue; }
    if (frame.destination === 'fonttbl') {
      if (w === 'f') { frame.fontId = n; if (!fonts.has(n)) fonts.set(n, { name: '', charset: 0 }); }
      if (w === 'fcharset' && fonts.has(frame.fontId)) fonts.get(frame.fontId).charset = n;
      continue;
    }
    if (frame.destination === 'colortbl') { if (['red', 'green', 'blue'].includes(w)) color[w] = Math.max(0, Math.min(255, n || 0)); continue; }
    if (frame.destination === 'stylesheet' && (w === 's' || w === 'cs')) {
      frame.definition = { id: n, ch: {}, p: {}, base: null }; frame.ch = charDefaults(defaultFont); frame.p = paraDefaults(); continue;
    }
    if (w === 'sbasedon' && frame.definition) { frame.definition.base = n; continue; }
    if (w === 's' || w === 'cs') {
      const style = resolveStyle(n); Object.assign(frame.ch, style.ch); Object.assign(frame.p, style.p);
      if (frame.ctx?.paragraph) Object.assign(frame.ctx.paragraph.p, style.p); continue;
    }
    if (w === 'plain') { frame.ch = charDefaults(defaultFont); continue; }
    if (w === 'pard') { frame.p = paraDefaults(); if (frame.ctx?.paragraph) frame.ctx.paragraph.p = { ...frame.p }; continue; }
    const charMap = { b: 'bold', i: 'italic', ul: 'underline', uldb: 'underline', strike: 'strike', caps: 'caps', v: 'hidden' };
    if (charMap[w]) { setChar(charMap[w], enabled); continue; }
    if (['ulnone', 'ul0'].includes(w)) { setChar('underline', false); continue; }
    if (w === 'f') { setChar('font', n); continue; }
    if (w === 'fs') { setChar('size', Math.max(2, Math.min(600, n || 24))); continue; }
    if (w === 'cf') { setChar('color', n); continue; }
    if (w === 'highlight' || w === 'chcbpat') { setChar('highlight', n); continue; }
    if (w === 'super' || w === 'sub' || w === 'nosupersub') { setChar('shift', w === 'super' ? 1 : w === 'sub' ? -1 : 0); continue; }
    if (w === 'expndtw' || w === 'expnd') { setChar('spacing', w === 'expndtw' ? n : (n || 0) * 5); continue; }
    const aligns = { ql: 'left', qc: 'center', qr: 'right', qj: 'justify', qd: 'justify' };
    if (aligns[w]) { setPara('align', aligns[w]); continue; }
    const paraMap = { li: 'left', ri: 'right', fi: 'first', sb: 'before', sa: 'after', sl: 'line' };
    if (paraMap[w]) { setPara(paraMap[w], n || 0); continue; }
    if (w === 'slmult') { setPara('multiple', enabled); continue; }
    const paraBool = { intbl: 'inTable', keep: 'keep', keepn: 'keepNext', pagebb: 'pageBefore', rtlpar: 'rtl' };
    if (paraBool[w]) { setPara(paraBool[w], enabled); continue; }
    if (w === 'ltrpar') { setPara('rtl', false); continue; }
    if (w === 'tx') { setPara('tabs', [...frame.p.tabs, n || 0]); continue; }
    const geoMap = { paperw: 'width', pgwsxn: 'width', paperh: 'height', pghsxn: 'height', margl: 'left', marglsxn: 'left', margr: 'right', margrsxn: 'right', margt: 'top', margtsxn: 'top', margb: 'bottom', margbsxn: 'bottom', headery: 'header', footery: 'footer', pgnstarts: 'pageStart' };
    if (geoMap[w]) { current.geometry[geoMap[w]] = n || 0; continue; }
    if (w === 'landscape' && current.geometry.width < current.geometry.height) {
      [current.geometry.width, current.geometry.height] = [current.geometry.height, current.geometry.width]; continue;
    }
    if (w === 'pgncont') { current.geometry.pageStart = null; continue; }
    if (w === 'titlepg' || w === 'facingp') { current.geometry[w === 'titlepg' ? 'titlePage' : 'facing'] = enabled; continue; }
    if (w === 'sect') {
      finishParagraph(false); finishRow(); current = section(current); sections.push(current); frame.ctx = current.body; continue;
    }
    if (w === 'par') { finishParagraph(true); continue; }
    if (w === 'page' || w === 'column') { finishParagraph(false); frame.ctx.blocks.push({ type: 'break' }); continue; }
    if (w === 'line') { addText('\n'); continue; }
    if (w === 'tab') { addText('\t'); continue; }
    const literals = { emdash: '\u2014', endash: '\u2013', bullet: '\u2022', lquote: '\u2018', rquote: '\u2019', ldblquote: '\u201c', rdblquote: '\u201d', emspace: '\u2003', enspace: '\u2002', qmspace: '\u2005' };
    if (literals[w]) { addText(literals[w]); continue; }
    if (w === 'trowd') {
      if (!frame.ctx.row) frame.ctx.row = { cells: [], current: [], left: 0, width: 0 };
      Object.assign(frame.ctx.row, { edges: [], definitions: [], definition: {} }); continue;
    }
    if (frame.ctx?.row) {
      const row = frame.ctx.row;
      if (w === 'trleft') row.left = n || 0;
      if (w === 'trwWidth') row.width = n || 0;
      if (w === 'trrh') row.height = n || 0;
      if (w === 'clcbpat') row.definition.background = n;
      if (w === 'clvmgf') row.definition.mergeStart = true;
      if (w === 'clvmrg') row.definition.mergeContinue = true;
      if (w === 'cellx') { row.edges.push(n || 0); row.definitions.push(row.definition); row.definition = {}; }
    }
    if (w === 'cell') { finishCell(); continue; }
    if (w === 'row') { finishRow(); frame.p.inTable = false; continue; }
  }
  if (stack.length) throw new Error('RTF 문서가 끝까지 저장되지 않았습니다.');
  for (const font of fonts.values()) font.name = font.name.split(';')[0].trim().slice(0, 160);
  const pictureByToken = new Map(prepared.pictures.map(p => [p.token, p]));
  const usedPictures = new Map();
  const picturePattern = prepared.prefix ? new RegExp('(' + prepared.prefix + '\\d+END)', 'g') : null;
  const fontName = ch => fonts.get(ch.font)?.name || 'Times New Roman';
  const characterCss = ch => {
    const serif = /myeong|명조|바탕|궁서|serif|times|cambria/i.test(fontName(ch));
    return `font-family:${cssString(fontName(ch))},${serif ? 'FReaderSerif,serif' : 'FReaderSans,sans-serif'};font-size:${ch.size / 2}pt;font-weight:${ch.bold ? 700 : 400};font-style:${ch.italic ? 'italic' : 'normal'};`
      + (ch.underline || ch.strike ? `text-decoration:${ch.underline ? 'underline ' : ''}${ch.strike ? 'line-through' : ''};` : '')
      + (colors[ch.color] ? `color:${colors[ch.color]};` : '')
      + (colors[ch.highlight] ? `background-color:${colors[ch.highlight]};` : '')
      + (ch.spacing ? `letter-spacing:${twips(ch.spacing)}px;` : '')
      + (ch.shift ? `vertical-align:${ch.shift > 0 ? 'super' : 'sub'};font-size:${ch.size * .35}pt;` : '');
  };
  const pictureHtml = token => {
    const p = pictureByToken.get(token); if (!p) return escape(token);
    usedPictures.set(p.path, p);
    const size = (goal, scale) => goal > 0 && scale > 0 ? Math.min(20000, goal / 15 * scale / 100) : 0;
    const w = size(p.width, p.scaleX), h = size(p.height, p.scaleY);
    return `<img src="${p.path}" style="${w ? `width:${w}px;` : ''}${h ? `height:${h}px;` : ''}" alt="" loading="lazy">`;
  };
  const runHtml = run => {
    if (run.field) return `<span class="rtf-run" data-rtf-field="${run.field}" style="${characterCss(run.ch)}">1</span>`;
    const parts = picturePattern ? run.text.split(picturePattern) : [run.text];
    return parts.map(part => pictureByToken.has(part) ? pictureHtml(part) : `<span class="rtf-run" style="${characterCss(run.ch)}">${escape(run.ch.caps ? part.toUpperCase() : part)}</span>`).join('');
  };
  const renderBlocks = blocks => blocks.map(block => {
    if (block.type === 'break') return '<div class="rtf-page-break"></div>';
    if (block.type === 'table') {
      const row = block.row, width = row.width || row.edges.at(-1) - row.left;
      return `<table class="rtf-table" style="${width > 0 ? `width:${twips(width)}px;` : 'width:100%;'}margin-left:${twips(row.left)}px"><tbody><tr>${row.cells.map((cell, index) => {
        const cellWidth = (row.edges[index] || 0) - (index ? row.edges[index - 1] : row.left);
        const bg = colors[row.definitions[index]?.background];
        return `<td style="${cellWidth > 0 ? `width:${twips(cellWidth)}px;` : ''}${bg ? `background:${bg};` : ''}">${renderBlocks(cell)}</td>`;
      }).join('')}</tr></tbody></table>`;
    }
    const p = block.p;
    const size = block.runs.reduce((largest, r) => Math.max(largest, r.ch.size), block.ch.size) / 2 * 96 / 72;
    const line = p.multiple && p.line ? Math.abs(p.line) / 240 * size * 1.2 : p.line ? Math.max(p.line < 0 ? 0 : size * 1.2, Math.abs(twips(p.line))) : size * 1.2;
    // RTF puts excess line leading above the glyphs; CSS normally splits it.
    const leading = Math.max(0, (line - size * 1.2) / 2);
    const css = `text-align:${p.align};margin:${twips(p.before)}px ${twips(p.right)}px ${twips(p.after)}px ${twips(p.left)}px;text-indent:${twips(p.first)}px;line-height:${line}px;--rtf-leading:${leading}px;`
      + characterCss(block.ch) + (p.rtl ? 'direction:rtl;' : '')
      + (p.keep ? 'break-inside:avoid;' : '') + (p.keepNext ? 'break-after:avoid;' : '') + (p.pageBefore ? 'break-before:column;' : '');
    return `<x-p class="rtf-paragraph" style="${css}">${block.runs.length ? block.runs.map(runHtml).join('') : '<br>'}</x-p>`;
  }).join('');
  const htmlSections = sections.filter(s => s.body.blocks.length).map((s, index) => {
    const g = s.geometry;
    if (!(g.width > 0 && g.height > 0 && g.width < 300000 && g.height < 300000)) throw new Error('RTF 용지 크기가 올바르지 않습니다.');
    const furniture = kind => `<div class="rtf-page-${kind}" style="${kind === 'header' ? 'top' : 'bottom'}:${twips(g[kind])}px;left:${twips(g.left)}px;right:${twips(g.right)}px">`
      + ['', 'f', 'l', 'r'].filter(suffix => s.stories[kind + suffix]).map(suffix => `<div data-rtf-story="${kind + suffix}">${renderBlocks(s.stories[kind + suffix])}</div>`).join('') + '</div>';
    return `<div class="odr-page-outer rtf-paper" data-rtf-section="${index}" data-rtf-first="${g.titlePage}" data-rtf-facing="${g.facing}" data-rtf-start="${g.pageStart ?? ''}" style="width:${twips(g.width)}px;min-height:${twips(g.height)}px">`
      + furniture('header') + `<div class="odr-page-inner" style="margin:${twips(g.top)}px ${twips(g.right)}px ${twips(g.bottom)}px ${twips(g.left)}px">${renderBlocks(s.body.blocks)}</div>` + furniture('footer') + '</div>';
  }).join('');
  return { html: `<!doctype html><html><head></head><body><div class="odr-pages">${htmlSections || '<div class="odr-page-outer rtf-paper" style="width:210mm;min-height:297mm"><div class="odr-page-inner" style="margin:25.4mm"><x-p class="rtf-paragraph"><br></x-p></div></div>'}</div></body></html>`, resources: usedPictures };
}
