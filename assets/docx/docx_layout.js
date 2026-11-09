// Read-only OOXML layout supplements. No text, images or source bytes are removed.
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
  if (marker && hanging) {
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
    } else p.style.breakBefore = 'column';
    return;
  }
  if (cached && p.closest('td')) return; // A cached split in one cell cannot split an entire row.
  const nodes = contentNodes(p); let remaining = offset;
  for (const node of nodes) {
    if (remaining > node.length) { remaining -= node.length; continue; }
    const range = p.ownerDocument.createRange();
    range.setStart(node, remaining); range.setEnd(p, p.childNodes.length);
    const next = p.cloneNode(false); next.append(range.extractContents());
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
    literalLeaders(p, hint);
  }
  applyTables(root, layout.tables || []);
  sections(root, layout.sections || [], matches);
  for (const hint of layout.paragraphs) {
    const p = matches.get(hint.index); if (!p) continue;
    const explicit = new Set(hint.breaks), offsets = [...new Set([...hint.breaks, ...hint.cachedBreaks])].sort((a,b) => b-a);
    for (const offset of offsets) splitAt(p, offset, !explicit.has(offset));
  }
  root.querySelectorAll('.odr-page-inner').forEach(x => x.classList.add('docx-layout'));
  return true;
}

// Resolve tab stops against the actual fonts and text width, before pagination.
export function finalizeDocxLayout(root, layout) {
  if (layout?.version !== 1) return;
  const step = Math.max(1, number(layout.defaultTab, 720)) / 15;
  for (const p of root.querySelectorAll('.docx-layout x-p')) {
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
