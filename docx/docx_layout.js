// Read-only OOXML layout supplements. No text, images or source bytes are removed.
import { replaceDocxChart } from './docx_charts.js';
const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const pt = v => `${number(v) / 20}pt`;
const val = (p, k) => p?.[k]?.val;
const on = x => x && !['0', 'false', 'off'].includes(x.val);
const contentNodes = p => {
  const out = [], walk = p.ownerDocument.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let n; while ((n = walk.nextNode())) if (!n.parentElement.closest('.odr-list-marker')) out.push(n);
  return out;
};
const plain = p => contentNodes(p).map(n => n.data).join('');
const canonical = s => s.replace(/[\t\r\n\u200b]/g, '');
function families(r, theme) {
  const f = r?.rFonts || {}, resolve = (key, script) => {
    if (f[key]) return f[key];
    const t = f[key + 'Theme'];
    return t ? theme[t.startsWith('major') ? 'major' : 'minor']?.[script] : null;
  };
  const latin = resolve('ascii', 'latin') || resolve('hAnsi', 'latin');
  const east = resolve('eastAsia', 'eastAsia') || latin;
  return { latin, east };
}
function runStyle(span, r, theme, text) {
  const size = r.sz?.val ?? r.szCs?.val;
  if (number(size) > 0) span.style.fontSize = `${number(size) / 2}pt`;
  if (r.spacing?.val != null) span.style.letterSpacing = pt(r.spacing.val);
  const f = families(r, theme);
  // Word selects a font per script. A single CJK fallback gives Latin punctuation
  // (especially dotted leaders) a much wider advance than the original font.
  const name = /[\u2e80-\uffef]/.test(text) ? f.east : f.latin;
  if (name) span.style.fontFamily = `${JSON.stringify(name)}, FReaderSans, sans-serif`;
}
function applyRuns(p, hint, theme) {
  const nodes = contentNodes(p); let position = 0, ri = 0;
  // The engine exports tabs as text, but omits line/page breaks from textContent.
  if (nodes.map(n => n.data).join('') !== hint.text) return;
  for (const node of nodes) {
    const start = position; position += node.length;
    const frag = p.ownerDocument.createDocumentFragment(); let offset = start;
    while (offset < position) {
      while (ri < hint.runs.length && hint.runs[ri].end <= offset) ri++;
      const run = hint.runs[ri];
      const end = Math.min(position, run ? run.end : position);
      if (end <= offset) break;
      const text = node.data.slice(offset - start, end - start);
      // Split scripts without altering the string, including surrogate pairs.
      for (const piece of text.match(/[\u2e80-\uffef]+|[^\u2e80-\uffef]+/gu) || []) {
        const span = p.ownerDocument.createElement('span'); span.className = 'docx-run';
        span.textContent = piece; runStyle(span, run?.props || {}, theme, piece); frag.append(span);
      }
      offset = end;
    }
    node.replaceWith(frag);
  }
}
function paragraphStyle(p, hint, theme, tab) {
  const props = hint.props, ind = props.ind || {};
  const size = hint.mark.sz?.val ?? hint.mark.szCs?.val;
  if (number(size) > 0) p.style.fontSize = `${number(size) / 2}pt`;
  if (ind.left != null || ind.start != null) p.style.marginLeft = pt(ind.start ?? ind.left);
  if (ind.right != null || ind.end != null) p.style.marginRight = pt(ind.end ?? ind.right);
  const hanging = number(ind.hanging), first = number(ind.firstLine);
  const marker = p.querySelector('.odr-list-marker');
  if (marker && hint.numbering && hanging > 0) {
    // Core supplies generic 2em list padding and a literal suffix tab. OOXML
    // indentation below already defines the number/text positions; retaining
    // both the padding and that tab counts the gap twice.
    const item = p.closest('.odr-list-item');
    if (item) item.style.paddingLeft = '0';
    const list = hint.numbering, suffix = list.suffix || 'tab';
    marker.textContent = marker.textContent.replace(/[\t ]+$/, '') + (suffix === 'space' ? '\u00a0' : '');
    const left = number(ind.start ?? ind.left), start = left - hanging;
    const stop = (props.tabs?.stops || []).filter(t => ['num', 'left'].includes(t.val) && number(t.pos) > start)
      .sort((a, b) => number(a.pos) - number(b.pos))[0];
    const slot = suffix === 'tab' ? Math.max(0, (stop ? number(stop.pos) - start : hanging)) : null;
    Object.assign(marker.style, { marginLeft: pt(-hanging), minWidth: '0',
      width: slot == null ? 'auto' : pt(slot), marginRight: '0',
      textIndent: '0', whiteSpace: 'pre', textAlign: list.alignment || 'left' });
    runStyle(marker, { ...hint.mark, ...list.run }, theme, marker.textContent);
    marker.dataset.docxList = 'true';
    marker.dataset.docxSuffix = suffix;
    p.style.textIndent = '0';
  } else if (marker && hanging) {
    Object.assign(marker.style, { marginLeft: pt(-hanging), minWidth: pt(hanging), textIndent: '0' });
    p.style.textIndent = '0';
  } else if (ind.firstLine != null || ind.hanging != null) p.style.textIndent = pt(first - hanging);
  if (props.keepNext) p.style.breakAfter = on(props.keepNext) ? 'avoid' : 'auto';
  if (props.keepLines) p.style.breakInside = on(props.keepLines) ? 'avoid' : 'auto';
  if (props.widowControl) p.style.orphans = p.style.widows = on(props.widowControl) ? '2' : '1';
  if (on(props.pageBreakBefore)) p.style.breakBefore = 'column';
  p.style.setProperty('--docx-tab', pt(tab));
  if (props.spacing?.line != null) {
    const rule = props.spacing.lineRule || 'auto';
    if (rule === 'exact') p.style.lineHeight = pt(props.spacing.line);
    else if (rule === 'atLeast') p.dataset.docxMinLine = number(props.spacing.line) / 15;
    else p.dataset.docxAutoLine = number(props.spacing.line, 240) / 240;
  }
  const f = families(hint.mark, theme);
  if (f.east || f.latin) p.style.fontFamily = `${JSON.stringify(f.east || f.latin)}, FReaderSans, sans-serif`;
  if (props.tabs?.stops?.length) p.dataset.docxTabs = JSON.stringify(props.tabs.stops);
  p.dataset.docxParagraph = hint.index;
  applyRuns(p, hint, theme);
}
function literalLeaders(p, hint) {
  // Some Word-generated TOCs store a run of literal dots followed by a tab and
  // a page number, rather than w:tab leader. Keep every character in the DOM,
  // but let that decorative run absorb font substitution/width differences.
  if (p.closest('td') || p.querySelector('img') || plain(p) !== hint.text) return;
  const match = /^([^\t\r\n]+?)([·.]{8,})(\t+)([0-9ivxlcdm]+)\s*$/i.exec(hint.text);
  if (!match) return;
  const cuts = [match[1].length, match[1].length + match[2].length + match[3].length];
  const groups = ['docx-toc-label', 'docx-toc-leader', 'docx-toc-number'];
  const parts = [];
  for (let i = 2; i >= 0; i--) {
    const start = i ? cuts[i-1] : 0, nodes = contentNodes(p); let pos = 0;
    for (const node of nodes) {
      if (pos + node.length < start) { pos += node.length; continue; }
      const range = p.ownerDocument.createRange(); range.setStart(node, start - pos); range.setEnd(p, p.childNodes.length);
      const span = p.ownerDocument.createElement('span'); span.className = groups[i]; span.append(range.extractContents()); parts.unshift(span); break;
    }
  }
  // Empty cloned inline shells are harmless but can contribute font struts.
  p.replaceChildren(...parts); p.classList.add('docx-toc-entry');
}
function applyTables(root, hints) {
  const tables = [...root.querySelectorAll('.odr-page-inner table')];
  if (tables.length !== hints.length) return; // Guard against a different engine model.
  hints.forEach((h, i) => {
    const table = tables[i], tp = h.props, rows = [...table.rows];
    if (rows.length !== h.rows.length) return;
    table.classList.add('docx-table');
    const width = h.grid.reduce((s, n) => s + number(n), 0);
    if (width > 0 && tp.tblLayout?.type === 'fixed') { table.style.tableLayout = 'fixed'; table.style.width = pt(width); }
    if (tp.tblW?.type === 'dxa' && number(tp.tblW.w) > 0) table.style.width = pt(tp.tblW.w);
    if (tp.tblW?.type === 'pct' && number(tp.tblW.w) > 0) table.style.width = `${number(tp.tblW.w) / 50}%`;
    if (val(tp, 'jc') === 'center') { table.style.marginLeft = 'auto'; table.style.marginRight = 'auto'; }
    else if (val(tp, 'jc') === 'right') table.style.marginLeft = 'auto';
    else if (tp.tblInd?.w != null) table.style.marginLeft = pt(tp.tblInd.w);
    h.rows.forEach((row, n) => {
      const tr = rows[n], rh = row.props.trHeight;
      if (rh && rh.hRule !== 'auto') tr.style.height = pt(rh.val);
      // CSS table height is a minimum; never clip text to Word's exact height.
      // Splitting oversized rows is preferable to silently losing cell contents.
      tr.dataset.docxRow = n;
      const cells = row.cells.filter(c => !c.continuation);
      if (tr.cells.length !== cells.length) return;
      cells.forEach((cell, j) => {
        const td = tr.cells[j], cp = cell.props;
        // Core drops bottom/right edges when a neighbouring cell declares nil.
        // Restore all four OOXML edges so CSS collapse can resolve the shared
        // border, including the last row of a vertically merged cell.
        const tableBorders = tp.tblBorders?.children || {};
        let endProps = cp;
        if (td.rowSpan > 1) {
          const sourceIndex = row.cells.indexOf(cell);
          const start = row.cells.slice(0, sourceIndex).reduce((s, c) => s + number(c.props.gridSpan?.val, 1), 0);
          let col = 0;
          for (const c of h.rows[Math.min(n + td.rowSpan - 1, h.rows.length - 1)].cells) {
            if (col === start) { endProps = c.props; break; }
            col += number(c.props.gridSpan?.val, 1);
          }
        }
        for (const side of ['top', 'right', 'bottom', 'left']) {
          const cellBorders = (side === 'bottom' ? endProps : cp).tcBorders?.children || {};
          const outer = side === 'top' ? n === 0 : side === 'bottom' ? n + td.rowSpan >= rows.length
            : side === 'left' ? j === 0 : j === cells.length - 1;
          const border = cellBorders[side] || cellBorders[side === 'left' ? 'start' : side === 'right' ? 'end' : side]
            || tableBorders[outer ? side : ['left', 'right'].includes(side) ? 'insideV' : 'insideH'];
          if (!border) continue;
          const style = ['nil', 'none'].includes(border.val) ? 'none'
            : ({ double: 'double', dotted: 'dotted', dashed: 'dashed', dashSmallGap: 'dashed' }[border.val] || 'solid');
          td.style['border' + side[0].toUpperCase() + side.slice(1)] = style === 'none' ? '0 none'
            : `${Math.max(.125, number(border.sz, 4) / 8)}pt ${style} ${/^[0-9a-f]{6}$/i.test(border.color || '') ? '#' + border.color : '#000'}`;
        }
        const mar = { ...(tp.tblCellMar?.children || {}), ...(cp.tcMar?.children || {}) };
        for (const side of ['top', 'right', 'bottom', 'left']) {
          const m = mar[side] || mar[side === 'left' ? 'start' : side === 'right' ? 'end' : side];
          if (m?.w != null) td.style['padding' + side[0].toUpperCase() + side.slice(1)] = pt(m.w);
        }
        const fill = cp.shd?.fill;
        if (/^[0-9a-f]{6}$/i.test(fill || '')) td.style.backgroundColor = '#' + fill;
        const align = val(cp, 'vAlign');
        if (align) td.style.verticalAlign = align === 'center' ? 'middle' : align;
        if (on(cp.noWrap)) td.style.whiteSpace = 'nowrap';
      });
    });
  });
}
function splitAt(p, offset, cached) {
  if (offset === 0) {
    // Cached breaks inside cells are only safe at the beginning of a whole row.
    const row = p.closest('tr');
    if (row) {
      if (p === row.querySelector('x-p') && !row.querySelector('[rowspan]')) row.style.breakBefore = 'column';
    } else {
      if (cached && p.style.breakBefore !== 'column') p.dataset.docxCachedBreak = 'true';
      p.style.breakBefore = 'column';
    }
    return;
  }
  if (cached && p.closest('td')) return; // A cached split in one cell cannot split an entire row.
  const nodes = contentNodes(p); let remaining = offset;
  for (const node of nodes) {
    if (remaining > node.length) { remaining -= node.length; continue; }
    const range = p.ownerDocument.createRange();
    range.setStart(node, remaining); range.setEnd(p, p.childNodes.length);
    const next = p.cloneNode(false); next.append(range.extractContents());
    if (cached) next.dataset.docxCachedBreak = 'true';
    else delete next.dataset.docxCachedBreak;
    next.style.breakBefore = 'column'; next.style.textIndent = '0'; next.style.marginTop = '0';
    p.after(next); return;
  }
}
function sections(root, hints, matches) {
  const sources = [...root.querySelectorAll('.odr-pages > .odr-page-outer')];
  if (sources.length !== 1 || !hints.length) return;
  const source = sources[0], inner = source.querySelector(':scope > .odr-page-inner');
  if (!inner) return;
  const blocks = [...inner.children]; let cursor = 0, previous;
  for (let i = 0; i < hints.length; i++) {
    const h = hints[i], pp = h.props, end = matches.get(h.end);
    let last = end;
    while (last && last.parentElement !== inner) last = last.parentElement;
    let endIndex = i === hints.length - 1 ? blocks.length - 1 : blocks.indexOf(last);
    if (endIndex < cursor) continue;
    const geometry = JSON.stringify([pp.pgSz, pp.pgMar]);
    const continuous = val(pp, 'type') === 'continuous';
    let outer, body;
    if (previous && continuous && geometry === previous.geometry) { outer = previous.outer; body = previous.body; }
    else {
      outer = source.cloneNode(false); body = inner.cloneNode(false); outer.append(body); source.before(outer);
      const size = pp.pgSz || {}, margins = pp.pgMar || {};
      if (size.w) outer.style.width = pt(size.w);
      if (size.h) outer.style.minHeight = pt(size.h);
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) if (margins[side.toLowerCase()] != null) body.style['margin' + side] = pt(margins[side.toLowerCase()]);
    }
    for (; cursor <= endIndex; cursor++) body.append(blocks[cursor]);
    previous = { outer, body, geometry };
  }
  if (previous && cursor === blocks.length) source.remove();
}
// FReader: 각주·미주 번호 표시. 글자 노드를 만들지 않아(::after) 문단 글자 위치 계산에 영향이 없다.
function insertNoteRefs(p, notes) {
  for (const note of notes) {
    const sup = p.ownerDocument.createElement('sup');
    sup.className = 'docx-note-ref'; sup.dataset.note = note.label; sup.dataset.noteKey = note.key;
    let remaining = note.offset, placed = false;
    for (const node of contentNodes(p)) {
      const data = node.data;
      let count = 0, i = 0;
      for (; i < data.length; i++) {
        if (count === remaining) break;
        if (!/[\t\r\n\u200b]/.test(data[i])) count++;
      }
      if (count === remaining && (i < data.length || remaining === 0 || count > 0)) {
        if (i >= data.length) node.after(sup);
        else if (i === 0) node.before(sup);
        else node.splitText(i).before(sup);
        placed = true; break;
      }
      remaining -= count;
    }
    if (!placed) p.appendChild(sup);
  }
}
// FReader: 사진 위에 그린 네모·동그라미 같은 Word 도형. 문단 기준 위치에 겹쳐 그린다.
// 가로 위치는 본문(단/여백) 기준이므로, 문단 들여쓰기만큼은 fitDocxContent에서 빼 준다.
function insertDocxShapes(p, hint, layout) {
  const emu = v => (Number(v) || 0) / 9525;
  let pageLeft = 0;
  const section = (layout.sections || []).find(sec => sec.end >= hint.index);
  const pgMar = section?.props?.pgMar;
  if (pgMar) pageLeft = (Number(pgMar.left) || 0) / 15;
  for (const shape of hint.shapes) {
    const h = shape.horizontal || {}, v = shape.vertical || {};
    if (h.offset == null || v.offset == null) continue;
    if (!['column', 'margin', 'page', 'character'].includes(h.relativeFrom)) continue;
    if (!['paragraph', 'line'].includes(v.relativeFrom)) continue;
    const box = p.ownerDocument.createElement('div');
    box.className = 'docx-shape';
    const width = emu(shape.width), height = emu(shape.height), line = Math.max(0.5, emu(shape.strokeWidth));
    let left = emu(h.offset);
    if (h.relativeFrom === 'page') left -= pageLeft;
    box.dataset.docxShapeLeft = String(left);
    Object.assign(box.style, {
      position: 'absolute', left: `${left}px`, top: `${emu(v.offset)}px`, width: `${width}px`, height: `${height}px`,
      boxSizing: 'border-box', pointerEvents: 'none', zIndex: shape.behind ? '0' : '2',
      border: shape.stroke && shape.stroke !== 'none' ? `${line}px solid ${shape.stroke}` : 'none',
      background: shape.fill && shape.fill !== 'none' ? shape.fill : 'transparent',
      borderRadius: shape.geom === 'ellipse' ? '50%' : shape.geom === 'roundRect' ? `${Math.min(width, height) / 6}px` : '0',
    });
    if (!p.style.position) p.style.position = 'relative';
    p.appendChild(box);
  }
}
// FReader: 사진 상자(크기가 정해진 div) 안에서 원본을 키우고 옮겨, Word에서 자른 부분만 보이게 한다.
// FReader: Word에서 돌리거나 뒤집은 사진. 사진 상자 안에 원래(돌리기 전) 크기의 상자를 만들어 돌린다.
// 90°/270°는 Word처럼 자리를 돌린 모양(가로·세로 바뀜)으로 차지한다. 크기는 %로 잡아 이후 축소에도 따라간다.
function rotateDocxImage(img, d) {
  const frame = img.parentElement;
  if (!frame || frame.localName !== 'div' || !frame.style.width || !frame.style.height) return;
  const W = parseFloat(frame.style.width), H = parseFloat(frame.style.height);
  if (!(W > 0 && H > 0)) return;
  const rot = ((+d.rotation || 0) % 360 + 360) % 360;
  const quarter = Math.abs(rot - 90) < 0.5 || Math.abs(rot - 270) < 0.5;
  const unit = frame.style.width.replace(/^[\d.]+/, '') || 'px';
  const inner = frame.ownerDocument.createElement('div');
  inner.dataset.docxRotate = 'true';
  if (quarter) {
    frame.style.width = `${H}${unit}`; frame.style.height = `${W}${unit}`;
    Object.assign(inner.style, { position: 'absolute', width: `${W / H * 100}%`, height: `${H / W * 100}%`,
      left: `${(H - W) / 2 / H * 100}%`, top: `${(W - H) / 2 / W * 100}%` });
  } else {
    Object.assign(inner.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%' });
    if (rot) frame.style.overflow = 'visible';
  }
  const turns = [];
  if (rot) turns.push(`rotate(${rot}deg)`);
  if (d.flipH) turns.push('scaleX(-1)');
  if (d.flipV) turns.push('scaleY(-1)');
  inner.style.transform = turns.join(' ');
  inner.style.transformOrigin = '50% 50%';
  inner.style.overflow = 'hidden';
  if (!frame.style.position || frame.style.position === 'static') frame.style.position = 'relative';
  img.replaceWith(inner); inner.appendChild(img);
  if (!d.crop) Object.assign(img.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none' });
}
function cropDocxImage(img, crop) {
  const l = (+crop.l || 0) / 1e5, t = (+crop.t || 0) / 1e5, r = (+crop.r || 0) / 1e5, b = (+crop.b || 0) / 1e5;
  const w = 1 - l - r, h = 1 - t - b;
  if (!(w > 0.001 && h > 0.001)) return;
  const frame = img.parentElement;
  if (!frame || frame.localName !== 'div' || !frame.style.width || !frame.style.height) return;
  frame.style.overflow = 'hidden';
  if (!frame.style.position || frame.style.position === 'static') frame.style.position = 'relative';
  img.style.position = 'absolute';
  img.style.maxWidth = 'none'; img.style.maxHeight = 'none';
  img.style.width = `${100 / w}%`; img.style.height = `${100 / h}%`;
  img.style.left = `${(-l / w) * 100}%`; img.style.top = `${(-t / h) * 100}%`;
  img.dataset.docxCrop = 'true';
}
export function applyDocxLayout(root, layout) {
  if (layout?.version !== 1) return false;
  const paragraphs = [...root.querySelectorAll('.odr-page-inner x-p')], matches = new Map();
  const keys = paragraphs.map(p => canonical(plain(p))), positions = new Map(); let cursor = 0;
  keys.forEach((key, i) => { if (!positions.has(key)) positions.set(key, []); positions.get(key).push(i); });
  for (const hint of layout.paragraphs) {
    const key = canonical(hint.text); let found = -1;
    if (!key) { if (keys[cursor] === '') found = cursor; }
    else {
      const list = positions.get(key) || []; let lo = 0, hi = list.length;
      while (lo < hi) { const mid = (lo + hi) >>> 1; if (list[mid] < cursor) lo = mid + 1; else hi = mid; }
      if (lo < list.length) found = list[lo];
    }
    if (found < 0) continue;
    const p = paragraphs[found]; cursor = found + 1; matches.set(hint.index, p);
    paragraphStyle(p, hint, layout.theme || {}, layout.defaultTab || 720);
    const images = [...p.querySelectorAll('img')];
    // FReader: Word에서 잘라 낸 사진은 잘린 모양 그대로 보이게 (a:srcRect)
    const pictures = (hint.drawings || []).filter(d => d.picture);
    const cropPairs = images.length === pictures.length ? pictures.map((d, i) => [images[i], d])
      : images.length === hint.drawingCount ? (hint.drawings || []).map(d => [images[d.index], d]) : [];
    for (const [img, d] of cropPairs) {
      if (img && (d.rotation || d.flipH || d.flipV)) rotateDocxImage(img, d);
      if (img && d.crop) cropDocxImage(img, d.crop);
    }
    if (hint.notes) insertNoteRefs(p, hint.notes);
    if (hint.shapes) insertDocxShapes(p, hint, layout);
    if (images.length === hint.drawingCount) for (const drawing of hint.drawings || []) {
      const img = images[drawing.index], frame = img?.parentElement;
      if (drawing.chartXml && img) replaceDocxChart(img, drawing, layout.themeColors || {});
      if (drawing.kind === 'anchor' && frame?.localName === 'div' &&
          frame.children.length === 1 && frame.firstElementChild === img)
        frame.dataset.docxAnchor = JSON.stringify(drawing);
    }
    literalLeaders(p, hint);
  }
  applyTables(root, layout.tables || []);
  sections(root, layout.sections || [], matches);
  for (const hint of layout.paragraphs) {
    const p = matches.get(hint.index); if (!p) continue;
    const images = [...p.querySelectorAll('img')];
    const explicit = new Set(hint.breaks), offsets = [...new Set([...hint.breaks, ...hint.cachedBreaks])].sort((a,b) => b-a);
    for (const offset of offsets) splitAt(p, offset, !explicit.has(offset));
    // Text offsets alone cannot distinguish breaks between adjacent pictures:
    // a paragraph with ten pictures and no text has ten boundaries at offset 0.
    if (images.length === hint.drawingCount) {
      for (const br of [...(hint.drawingBreaks || [])].reverse()) {
        const img = images[br.index], paragraph = img?.closest('x-p');
        if (!paragraph || paragraph.closest('td,th')) continue;
        const holder = img.parentElement?.dataset?.docxRotate ? img.parentElement.parentElement : img.parentElement;
        const frame = holder?.localName === 'div' ? holder : img;
        const range = paragraph.ownerDocument.createRange();
        range.setStart(paragraph, 0); range.setEndBefore(frame);
        const before = range.cloneContents();
        if (!before.textContent.trim() && !before.querySelector('img')) {
          if (br.cached && paragraph.style.breakBefore !== 'column') paragraph.dataset.docxCachedBreak = 'true';
          paragraph.style.breakBefore = 'column'; continue;
        }
        range.setStartBefore(frame); range.setEnd(paragraph, paragraph.childNodes.length);
        const next = paragraph.cloneNode(false); next.append(range.extractContents());
        if (br.cached) next.dataset.docxCachedBreak = 'true';
        else delete next.dataset.docxCachedBreak;
        next.style.breakBefore = 'column'; next.style.textIndent = '0'; next.style.marginTop = '0';
        paragraph.after(next);
      }
    }
  }
  // FReader: Word 수식 — 쪽 나눔 위치(글자 수 기준)를 다 맞춘 뒤에 넣는다
  for (const hint of layout.paragraphs) {
    const p = matches.get(hint.index);
    if (p && hint.math?.length) insertDocxMath(p, hint.math);
  }
  root.querySelectorAll('.odr-page-inner').forEach(x => x.classList.add('docx-layout'));
  return true;
}
// FReader: 수식(OMML을 앱에서 MathML로 바꾼 것)을 문단의 제자리(글자 수 기준)에 넣는다
function insertDocxMath(p, maths) {
  const doc = p.ownerDocument;
  const textNodes = () => {
    const out = [], walker = doc.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement?.closest('math, .odr-list-marker, sup.docx-note-ref') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n);
    return out;
  };
  // 뒤에서부터 넣어야 앞의 위치가 바뀌지 않음
  for (const m of [...maths].sort((a, b) => b.offset - a.offset)) {
    const parsed = new DOMParser().parseFromString(m.mathml, 'text/html').body.firstElementChild;
    if (!parsed || parsed.localName !== 'math') continue;
    const el = doc.importNode(parsed, true);
    el.classList.add('docx-math');
    let remaining = m.offset, placed = false;
    for (const node of textNodes()) {
      const data = node.data; let count = 0, i = 0;
      for (; i < data.length; i++) { if (count === remaining) break; if (!/[\t\r\n\u200b]/.test(data[i])) count++; }
      if (count === remaining && (i < data.length || remaining === 0)) {
        if (i >= data.length) node.after(el); else if (i === 0) node.before(el); else node.splitText(i).before(el);
        placed = true; break;
      }
      remaining -= count;
    }
    if (!placed) {
      const marker = p.querySelector(':scope > .odr-list-marker');
      if (m.offset === 0 && !textNodes().length) (marker ? marker.after(el) : p.prepend(el)); else p.append(el);
    }
  }
}

// Fit only content that exceeds its printable width. Font substitution can
// increase a table's minimum width beyond the saved OOXML grid; with adjacent
// CSS columns that overflow used to appear over text on the following page.
export function fitDocxContent(inner, bodyWidth, bodyHeight) {
  inner.style.width = `${bodyWidth}px`;
  // 도형의 가로 위치: 본문 왼쪽 기준 → 문단(또는 표 칸) 안쪽 기준으로 바꾼다
  for (const box of inner.querySelectorAll('.docx-shape[data-docx-shape-left]')) {
    let inset = 0;
    for (let el = box.parentElement; el && el !== inner; el = el.parentElement) {
      const css = getComputedStyle(el);
      inset += (parseFloat(css.marginLeft) || 0) + (parseFloat(css.paddingLeft) || 0) + (parseFloat(css.borderLeftWidth) || 0);
      if (el.localName === 'td' || el.localName === 'th') break;
    }
    // 절대 위치의 기준은 문단의 안쪽(테두리 안) 가장자리이므로 문단 자신의 안쪽 여백은 빼지 않는다
    inset -= parseFloat(getComputedStyle(box.parentElement).paddingLeft) || 0;
    box.style.left = `${Number(box.dataset.docxShapeLeft) - inset}px`;
  }
  const anchors = [];
  for (const frame of inner.querySelectorAll('[data-docx-anchor]')) {
    const h = JSON.parse(frame.dataset.docxAnchor), p = frame.closest('x-p');
    // Top/bottom wrapping is a full-width exclusion at a paragraph-relative Y,
    // not an inline block before its paragraph's text. Leave unsupported shape
    // types/coordinate systems unchanged rather than guessing their placement.
    if (!p || p.closest('td,th') || p.querySelectorAll('img').length !== 1 ||
        h.wrap !== 'wrapTopAndBottom' || !['0', 'false'].includes(h.simplePosition) || h.vertical.relativeFrom !== 'paragraph' ||
        h.vertical.offset == null || number(h.vertical.offset, -1) <= 0 ||
        !['column', 'margin', 'page'].includes(h.horizontal.relativeFrom)) continue;
    const y = number(h.vertical.offset) / 9525, height = number(h.height) / 9525;
    if (!(height > 0) || y + height > bodyHeight) continue;
    // Core exports anchor offsets as block margins. They must not contribute
    // paragraph height or be added to its indentation a second time.
    frame.style.margin = '0'; frame.style.zIndex = 'auto';
    anchors.push({ frame, p, h, y });
  }
  for (const table of inner.querySelectorAll('table')) {
    const css = getComputedStyle(table), parent = table.parentElement;
    const parentWidth = parent === inner ? bodyWidth : parent.clientWidth
      - (parseFloat(getComputedStyle(parent).paddingLeft) || 0)
      - (parseFloat(getComputedStyle(parent).paddingRight) || 0);
    const available = Math.max(24, parentWidth - (parseFloat(css.marginLeft) || 0)
      - (parseFloat(css.marginRight) || 0));
    if (table.getBoundingClientRect().width <= available + .5) continue;
    const cols = [...table.querySelectorAll(':scope > colgroup > col')];
    const widths = cols.map(c => c.getBoundingClientRect().width);
    const total = widths.reduce((a, b) => a + b, 0);
    Object.assign(table.style, { tableLayout: 'fixed', width: `${available}px`, minWidth: '0' });
    if (total > 0) cols.forEach((col, i) => Object.assign(col.style,
      { width: `${widths[i] / total * 100}%`, minWidth: '0' }));
    table.classList.add('docx-fitted-table');
  }
  for (const img of inner.querySelectorAll('img')) {
    // 돌린 사진은 바깥 사진 상자 기준으로 맞춘다
    const frame = img.parentElement?.dataset?.docxRotate ? img.parentElement.parentElement : img.parentElement;
    if (frame?.localName !== 'div' || !frame.style.width || !frame.style.height) continue;
    const rect = frame.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) continue;
    const container = frame.closest('td,th') || frame.closest('x-p') || inner;
    const css = getComputedStyle(container), fc = getComputedStyle(frame);
    const available = Math.max(1, container.clientWidth
      - (parseFloat(css.paddingLeft) || 0) - (parseFloat(css.paddingRight) || 0)
      - Math.max(0, parseFloat(fc.marginLeft) || 0) - Math.max(0, parseFloat(fc.marginRight) || 0));
    const scale = Math.min(1, available / rect.width, bodyHeight / rect.height);
    if (scale < 1) {
      frame.style.width = `${rect.width * scale}px`;
      frame.style.height = `${rect.height * scale}px`;
    }
    // Core exports a single picture as an absolutely positioned img in a
    // sized frame. Keep it in normal flow so Chromium cannot fragment its
    // containing block separately from the image. Do not touch layered shapes.
    if (frame.children.length === 1 && frame.firstElementChild === img &&
        img.style.left === '0px' && img.style.top === '0px' &&
        img.style.width === '100%' && img.style.height === '100%') {
      img.style.position = 'static'; img.style.display = 'block';
    }
    frame.style.breakInside = 'avoid';
  }
  // FReader: 표 칸 안에 띄운 사진(지원서 증명사진·서명 등)
  for (const frame of inner.querySelectorAll('[data-docx-anchor]')) {
    let h; try { h = JSON.parse(frame.dataset.docxAnchor); } catch (_) { continue; }
    const cell = frame.closest('td,th');
    if (!cell || h.kind !== 'anchor' || h.wrap !== 'wrapNone') continue;
    // 아래 줄 칸의 배경색이 사진을 덮지 않게
    frame.style.zIndex = '3';
    // 가운데·아래 정렬 칸에서도 Word처럼 칸 위쪽을 기준으로 (문단이 칸 가운데로 내려가도 사진은 위에서부터)
    if (h.vertical?.relativeFrom === 'paragraph' && frame.parentElement !== cell &&
        getComputedStyle(cell).verticalAlign !== 'top') {
      const fr = frame.getBoundingClientRect(), cr = cell.getBoundingClientRect(), ccs = getComputedStyle(cell);
      const left = fr.left - cr.left - (parseFloat(ccs.borderLeftWidth) || 0);
      cell.prepend(frame);
      frame.style.left = `${left}px`;
      frame.style.top = `${number(h.vertical.offset) / 9525 + (parseFloat(ccs.paddingTop) || 0)}px`;
    }
  }
  // FReader: 띄운 사진이 본문 오른쪽 끝을 넘으면 안쪽으로 당김 (넘은 부분이 잘리거나 빈 쪽이 생기지 않게)
  {
    const limit = inner.getBoundingClientRect().left + bodyWidth;
    for (const frame of inner.querySelectorAll('[data-docx-anchor]')) {
      if (getComputedStyle(frame).position !== 'absolute') continue;
      const r = frame.getBoundingClientRect();
      if (r.width > 0 && r.right > limit + 0.5) {
        frame.style.left = `${frame.offsetLeft - Math.min(r.right - limit, Math.max(0, r.left - inner.getBoundingClientRect().left))}px`;
        // 당겨서 글 위에 겹치게 된 서명 같은 사진: 흰 바탕이 글을 가리지 않게 (도장처럼 겹쳐 보이게)
        frame.style.mixBlendMode = 'multiply';
      }
    }
  }
  // Browser multicolumn floats can detach a picture from its anchor and clip
  // part of a line. Materialize top/bottom pictures as flow blocks instead.
  // Measure paragraph anchors before reserving any picture space: Word's
  // paragraph-relative offsets can already account for a preceding picture.
  // Adding that offset after its full height again doubles the vertical gap.
  const direct = anchors;
  direct.forEach(a => a.frame.remove());
  let region = null;
  const regions = new Map();
  for (const block of inner.querySelectorAll('x-p')) {
    if (!region || block.style.breakBefore === 'column') region = block;
    regions.set(block, region);
  }
  for (const a of direct) {
    a.region = regions.get(a.p);
    a.relativeTop = a.p.getBoundingClientRect().top - a.region.getBoundingClientRect().top;
  }
  for (const { frame, p, h, y, region, relativeTop } of direct) {
    // Detached frames retain their CSS extents (usually inches), so read the
    // final width only once the frame has been reattached.
    const paragraphGap = getComputedStyle(p).marginBottom;
    const target = region.getBoundingClientRect().top + relativeTop + y;
    p.style.marginBottom = '0';
    Object.assign(frame.style, { position: 'relative', display: 'block',
      left: 'auto', top: 'auto', marginTop: '0', marginBottom: paragraphGap });
    p.after(frame);
    const pictureWidth = frame.getBoundingClientRect().width;
    let x = number(h.horizontal.offset) / 9525;
    if (h.horizontal.align === 'center') x = (bodyWidth - pictureWidth) / 2;
    else if (h.horizontal.align === 'right') x = bodyWidth - pictureWidth;
    if (h.horizontal.relativeFrom === 'page') x -= parseFloat(getComputedStyle(inner).marginLeft) || 0;
    const containerOffset = frame.getBoundingClientRect().left - inner.getBoundingClientRect().left;
    frame.style.marginLeft = `${x - containerOffset}px`;
    // Keep the complete anchor paragraph readable before a positive-Y picture.
    // Font substitution may add a line; never paint the picture over that line.
    frame.style.marginTop = `${Math.max(number(h.distanceTop) / 9525,
      target - frame.getBoundingClientRect().top)}px`;
    frame.style.marginBottom = `${Math.max(parseFloat(paragraphGap) || 0,
      number(h.distanceBottom) / 9525)}px`;
    frame.classList.add('docx-anchored-picture');
    p.style.breakAfter = 'avoid';
  }
  // Chromium's multicol table fragmentation can place a later cell relative to
  // the preceding column, even when tr has break-inside:avoid. Materialize safe
  // row groups as independent tables, preserving widths and merged-cell spans.
  for (const table of [...inner.querySelectorAll('table')].reverse()) {
    const rows = [...table.rows]; if (!rows.length) continue;
    const firstBreak = rows[0].style.breakBefore;
    if (firstBreak === 'column') {
      table.style.breakBefore = 'column'; rows[0].style.breakBefore = 'auto';
    }
    const forced = rows.some((r, i) => i > 0 && r.style.breakBefore === 'column');
    if (!forced && table.getBoundingClientRect().height <= bodyHeight) continue;
    const groups = [];
    for (let start = 0; start < rows.length;) {
      let end = start + 1;
      for (let i = start; i < end; i++) for (const cell of rows[i].cells)
        end = Math.max(end, Math.min(rows.length, cell.rowSpan === 0 ? rows.length : i + cell.rowSpan));
      groups.push(rows.slice(start, end)); start = end;
    }
    if (groups.length < 2) continue;
    const width = table.getBoundingClientRect().width;
    const cols = [...table.querySelectorAll(':scope > colgroup > col')];
    const colWidths = cols.map(c => c.getBoundingClientRect().width);
    const chunks = []; let chunk = [], height = 0;
    for (const group of groups) {
      const h = group.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0);
      if (chunk.length && (group[0].style.breakBefore === 'column' || height + h > bodyHeight - 2)) {
        chunks.push(chunk); chunk = []; height = 0;
      }
      chunk.push(...group); height += h;
    }
    if (chunk.length) chunks.push(chunk);
    if (chunks.length < 2) continue;
    for (let i = 0; i < chunks.length; i++) {
      const copy = table.cloneNode(false), body = document.createElement('tbody');
      Object.assign(copy.style, { width: `${width}px`, tableLayout: 'fixed', breakInside: 'avoid', breakBefore: i ? 'auto' : table.style.breakBefore });
      for (const colgroup of table.querySelectorAll(':scope > colgroup')) copy.append(colgroup.cloneNode(true));
      [...copy.querySelectorAll('col')].forEach((col, n) => {
        if (colWidths[n] > 0) Object.assign(col.style, { width: `${colWidths[n]}px`, minWidth: '0' });
      });
      if (chunks[i][0].style.breakBefore === 'column') {
        copy.style.breakBefore = 'column'; chunks[i][0].style.breakBefore = 'auto';
      }
      body.append(...chunks[i]); copy.append(body); table.before(copy);
    }
    table.remove();
  }
}

// lastRenderedPageBreak is a saved layout hint, not an author-inserted break.
// A substituted font can already carry the preceding paragraph onto that page;
// forcing another break then creates a nearly empty page. Keep explicit breaks
// and only apply a cached boundary if natural pagination has not reached it.
export function settleDocxPageBreaks(inner, columnStride) {
  const cached = [...inner.querySelectorAll('x-p[data-docx-cached-break="true"]')];
  if (!cached.length) return;
  cached.forEach(p => p.style.breakBefore = 'auto');
  const origin = inner.getBoundingClientRect().left;
  const columnOf = p => Math.max(0, Math.round(((p.getClientRects()[0]?.left ?? origin) - origin) / columnStride));
  let previous = 0;
  for (const p of cached) {
    if (columnOf(p) <= previous) p.style.breakBefore = 'column';
    previous = columnOf(p);
  }
}

// Resolve tab stops against the actual fonts and text width, before pagination.
export function finalizeDocxLayout(root, layout) {
  if (layout?.version !== 1) return;
  const step = Math.max(1, number(layout.defaultTab, 720)) / 15;
  for (const p of root.querySelectorAll('.docx-layout x-p')) {
    const marker = p.querySelector('[data-docx-list="true"]');
    if (marker?.dataset.docxSuffix === 'tab') {
      const range = p.ownerDocument.createRange(); range.selectNodeContents(marker);
      const needed = range.getBoundingClientRect().width + 4;
      if (needed > marker.getBoundingClientRect().width) marker.style.width = `${needed}px`;
    }
    if (p.dataset.docxAutoLine || p.dataset.docxMinLine) {
      // OOXML automatic leading multiplies the font's line box, not just its
      // em size. Treating 240/240 as CSS 1.0 crushes Korean glyphs/table rows.
      const css = getComputedStyle(p), canvas = p.ownerDocument.createElement('canvas').getContext('2d');
      canvas.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
      const metrics = canvas.measureText('Hg한');
      const normal = (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) || parseFloat(css.fontSize) * 1.2;
      p.style.lineHeight = (p.dataset.docxAutoLine ? normal * number(p.dataset.docxAutoLine, 1) : Math.max(normal, number(p.dataset.docxMinLine))) + 'px';
    }
    if (p.classList.contains('docx-toc-entry')) continue;
    const tabs = JSON.parse(p.dataset.docxTabs || '[]').filter(t => t.val !== 'clear').sort((a,b) => number(a.pos) - number(b.pos));
    for (const node of contentNodes(p)) {
      if (!node.data.includes('\t')) continue;
      const parts = node.data.split('\t'), frag = p.ownerDocument.createDocumentFragment();
      parts.forEach((part, i) => { if (i) { const span = p.ownerDocument.createElement('span'); span.className = 'docx-tab'; span.textContent = '\t'; frag.append(span); } frag.append(part); });
      node.replaceWith(frag);
    }
    for (const tab of p.querySelectorAll('.docx-tab')) {
      const origin = p.getBoundingClientRect().left - (parseFloat(getComputedStyle(p).marginLeft) || 0);
      const x = Math.max(0, tab.getBoundingClientRect().left - origin);
      const stop = tabs.find(t => number(t.pos) / 15 > x + .5);
      const target = stop ? number(stop.pos) / 15 : (Math.floor((x + .5) / step) + 1) * step;
      let following = 0;
      if (stop && ['right', 'center', 'decimal'].includes(stop.val)) {
        const range = p.ownerDocument.createRange(); range.setStartAfter(tab);
        const next = [...p.querySelectorAll('.docx-tab')].find(t => tab.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING);
        if (next) range.setEndBefore(next); else range.setEnd(p, p.childNodes.length);
        const font = getComputedStyle(tab), canvas = p.ownerDocument.createElement('canvas').getContext('2d');
        canvas.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
        let text = range.toString(); if (stop.val === 'decimal') text = text.split(/[.,]/)[0];
        following = canvas.measureText(text).width * (stop.val === 'center' ? .5 : 1);
      }
      tab.style.width = Math.max(0, target - x - following) + 'px';
      if (stop?.leader && stop.leader !== 'none') tab.dataset.leader = stop.leader;
    }
  }
}
