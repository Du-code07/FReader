// Read-only 2-D OOXML chart renderer. Uses the saved numeric/string caches;
// never executes workbook formulas or fetches external workbooks/resources.
const C = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const children = (p, name, ns = C) => [...(p?.children || [])].filter(e => e.localName === name && e.namespaceURI === ns);
const child = (p, name, ns = C) => children(p, name, ns)[0];
const descendants = (p, name, ns = C) => [...(p?.getElementsByTagNameNS(ns, name) || [])];
const value = (p, name, fallback) => child(p, name)?.getAttribute('val') ?? fallback;
const numeric = (v, fallback = null) => v != null && String(v).trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : fallback;
const xml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const round = n => String(Number(n.toPrecision(6)));
function cache(parent) {
  const data = descendants(parent, 'numCache')[0] || descendants(parent, 'strCache')[0]
    || child(parent, 'numLit') || child(parent, 'strLit');
  return new Map(children(data, 'pt').map(p => [Number(p.getAttribute('idx')), child(p, 'v')?.textContent ?? '']));
}
function text(p) { return descendants(p, 't', A).map(t => t.textContent).join(''); }
function color(p, theme, fallback) {
  const fill = child(p, 'solidFill', A);
  const rgb = child(fill, 'srgbClr', A)?.getAttribute('val');
  const scheme = child(fill, 'schemeClr', A)?.getAttribute('val');
  const key = ({ tx1: 'dk1', tx2: 'dk2', bg1: 'lt1', bg2: 'lt2' })[scheme] || scheme;
  const chosen = rgb || theme[key];
  return /^[\da-f]{6}$/i.test(chosen || '') ? '#' + chosen : fallback;
}
export function linearFit(points, intercept = null) {
  const n = points.length;
  if (n < 2) return null;
  const sx = points.reduce((s, p) => s + p.x, 0), sy = points.reduce((s, p) => s + p.y, 0);
  const xx = points.reduce((s, p) => s + p.x * p.x, 0), xy = points.reduce((s, p) => s + p.x * p.y, 0);
  const denominator = intercept == null ? n * xx - sx * sx : xx;
  if (Math.abs(denominator) < 1e-15) return null;
  const slope = intercept == null ? (n * xy - sx * sy) / denominator : (xy - intercept * sx) / denominator;
  const offset = intercept ?? (sy - slope * sx) / n;
  const residual = points.reduce((s, p) => s + (p.y - slope * p.x - offset) ** 2, 0);
  const total = points.reduce((s, p) => s + (intercept == null ? p.y - sy / n : p.y) ** 2, 0);
  return { slope, offset, r2: total > 0 ? 1 - residual / total : null };
}
function axisRange(values, axis, zero) {
  const scale = child(axis, 'scaling');
  if (child(scale, 'logBase')) throw new Error('Logarithmic axis is not supported');
  let lo = Math.min(...values), hi = Math.max(...values);
  if (zero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
  if (lo === hi) { lo -= Math.abs(lo) * .1 || 1; hi += Math.abs(hi) * .1 || 1; }
  const raw = (hi - lo) / 5, power = 10 ** Math.floor(Math.log10(raw));
  const step = numeric(value(axis, 'majorUnit'), [1, 2, 2.5, 5, 10].find(n => n * power >= raw) * power);
  if (!(step > 0)) throw new Error('Invalid axis step');
  lo = numeric(value(scale, 'min'), Math.floor(lo / step) * step);
  hi = numeric(value(scale, 'max'), Math.ceil(hi / step) * step);
  if (!(hi > lo)) throw new Error('Invalid axis bounds');
  const ticks = [];
  for (let n = Math.ceil((lo - 1e-10) / step) * step; n <= hi + step * 1e-8 && ticks.length < 100; n += step) ticks.push(n);
  return { lo, hi, ticks, reverse: value(scale, 'orientation') === 'maxMin' };
}
export function chartSvg(source, width, height, theme = {}) {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  if (doc.querySelector('parsererror')) return null;
  const chart = descendants(doc, 'chart')[0], plot = child(chart, 'plotArea');
  const types = [...(plot?.children || [])].filter(e => e.localName.endsWith('Chart'));
  // Do not silently flatten 3-D, stacked, combo or secondary-axis charts.
  if (types.length !== 1) return null;
  const type = types[0], kind = type.localName;
  if (!['scatterChart', 'lineChart', 'barChart', 'pieChart', 'doughnutChart'].includes(kind)) return null;
  if (['stacked', 'percentStacked'].includes(value(type, 'grouping'))) return null;
  const palette = ['4472C4', 'ED7D31', 'A5A5A5', 'FFC000', '5B9BD5', '70AD47'].map((c, i) => '#' + (theme['accent' + (i + 1)] || c));
  const series = children(type, 'ser').map((node, i) => {
    const xs = cache(child(node, kind === 'scatterChart' ? 'xVal' : 'cat'));
    const ys = cache(child(node, kind === 'scatterChart' ? 'yVal' : 'val'));
    const name = child(child(node, 'tx'), 'v')?.textContent || [...cache(child(node, 'tx')).values()][0] || '';
    const points = [...ys].map(([index, y]) => ({ index, x: kind === 'scatterChart' ? numeric(xs.get(index)) : index,
      y: numeric(y), label: xs.get(index) ?? String(index + 1) })).filter(p => p.x != null && p.y != null);
    const style = child(node, 'spPr'), line = child(style, 'ln', A), marker = child(node, 'marker');
    return { node, name, points, xs, color: color(child(marker, 'spPr'), theme, color(style, theme, color(line, theme, palette[i % palette.length]))),
      noLine: !!child(line, 'noFill', A), marker: value(marker, 'symbol', kind === 'scatterChart' ? 'circle' : 'none'),
      markerSize: Math.max(2, Math.min(12, numeric(value(marker, 'size'), 5))) };
  });
  if (!series.length || series.some(s => !s.points.length || s.points.length > 10000)) return null;
  if (series.reduce((n, s) => n + s.points.length, 0) > 50000) return null;
  const W = 640, H = Math.max(280, Math.min(800, W * (height > 0 && width > 0 ? height / width : .6)));
  const title = value(chart, 'autoTitleDeleted') === '1' ? '' : text(child(chart, 'title')) || (series.length === 1 ? series[0].name : '');
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${xml(title || 'Word chart')}</title><rect width="${W}" height="${H}" fill="white" stroke="#d9d9d9"/><g font-family="Arial, sans-serif" fill="#595959" font-size="12">`];
  const label = (x, y, str, attrs = '') => out.push(`<text x="${x}" y="${y}" ${attrs}>${xml(str)}</text>`);
  const line = (x, y, x2, y2, stroke = '#d9d9d9', extra = '') => out.push(`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${stroke}" ${extra}/>`);
  if (title) label(W / 2, 27, title, 'text-anchor="middle" font-size="19"');
  const legend = !!child(chart, 'legend');
  if (kind === 'pieChart' || kind === 'doughnutChart') {
    if (series.length !== 1 || series[0].points.some(p => p.y < 0)) return null;
    const sum = series[0].points.reduce((s, p) => s + p.y, 0); if (!(sum > 0)) return null;
    const cx = legend ? W * .4 : W / 2, cy = (H + 35) / 2, radius = Math.min(W * .29, (H - 75) / 2);
    let angle = (numeric(value(type, 'firstSliceAng'), 0) - 90) * Math.PI / 180;
    series[0].points.forEach((p, i) => {
      const sweep = p.y / sum * 2 * Math.PI, end = angle + sweep, fill = palette[i % palette.length];
      if (sweep >= 2 * Math.PI - 1e-8) out.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}"/>`);
      else out.push(`<path d="M ${cx} ${cy} L ${cx + radius * Math.cos(angle)} ${cy + radius * Math.sin(angle)} A ${radius} ${radius} 0 ${sweep > Math.PI ? 1 : 0} 1 ${cx + radius * Math.cos(end)} ${cy + radius * Math.sin(end)} Z" fill="${fill}" stroke="white"/>`);
      angle = end;
      if (legend) { out.push(`<rect x="480" y="${60 + i * 20}" width="10" height="10" fill="${fill}"/>`); label(496, 69 + i * 20, p.label); }
    });
    if (kind === 'doughnutChart') out.push(`<circle cx="${cx}" cy="${cy}" r="${radius * Math.max(10, Math.min(90, numeric(value(type, 'holeSize'), 50))) / 100}" fill="white"/>`);
  } else {
    const axes = children(plot, 'valAx'), scatter = kind === 'scatterChart', horizontal = kind === 'barChart' && value(type, 'barDir') === 'bar';
    const xAxis = scatter ? axes.find(a => ['b', 't'].includes(value(a, 'axPos'))) || axes[0] : child(plot, 'catAx');
    const yAxis = scatter ? axes.find(a => a !== xAxis) : axes[0];
    const points = series.flatMap(s => s.points);
    const categoryCount = Math.max(...points.map(p => p.index)) + 1;
    const yr = axisRange(points.map(p => p.y), yAxis, true);
    const xr = scatter ? axisRange(points.map(p => p.x), xAxis, false) : { lo: -.5, hi: categoryCount - .5, reverse: value(child(xAxis, 'scaling'), 'orientation') === 'maxMin' };
    const L = horizontal ? 110 : 75, T = title ? 51 : 25, R = W - 30, B = H - (legend ? 95 : 70);
    const fraction = (v, range) => range.reverse ? 1 - (v - range.lo) / (range.hi - range.lo) : (v - range.lo) / (range.hi - range.lo);
    const px = v => horizontal ? L + fraction(v, yr) * (R - L) : L + fraction(v, xr) * (R - L);
    const py = v => horizontal ? T + fraction(v, xr) * (B - T) : B - fraction(v, yr) * (B - T);
    const cats = [...new Set(points.map(p => p.index))].sort((a, b) => a - b);
    for (const n of yr.ticks) {
      if (horizontal) { line(px(n), T, px(n), B); label(px(n), B + 18, round(n), 'text-anchor="middle"'); }
      else { line(L, py(n), R, py(n)); label(L - 10, py(n) + 4, round(n), 'text-anchor="end"'); }
    }
    if (scatter) for (const n of xr.ticks) {
      if (child(xAxis, 'majorGridlines')) line(px(n), T, px(n), B);
      label(px(n), B + 20, round(n), 'text-anchor="middle"');
    }
    else for (const n of cats.filter((_, i) => i % Math.max(1, Math.ceil(cats.length / (horizontal ? 15 : 8))) === 0)) {
      const name = series.map(s => s.xs.get(n)).find(v => v != null) ?? String(n + 1);
      if (horizontal) label(L - 8, py(n) + 4, name, 'text-anchor="end"'); else label(px(n), B + 20, name, 'text-anchor="middle"');
    }
    line(L, B, R, B, '#bfbfbf'); line(L, T, L, B, '#bfbfbf');
    const xt = text(child(xAxis, 'title')), yt = text(child(yAxis, 'title'));
    label((L + R) / 2, B + 48, horizontal ? yt : xt, 'text-anchor="middle" font-size="14"');
    const verticalTitle = horizontal ? xt : yt;
    label(20, (T + B) / 2, verticalTitle, `text-anchor="middle" font-size="14" transform="rotate(-90 20 ${(T + B) / 2})"`);
    out.push(`<defs><clipPath id="plot"><rect x="${L}" y="${T}" width="${R - L}" height="${B - T}"/></clipPath></defs>`);
    const trendLabels = [];
    series.forEach((s, si) => {
      out.push('<g clip-path="url(#plot)">');
      if (kind === 'barChart') {
        const band = (horizontal ? B - T : R - L) / categoryCount;
        const bar = band * .75 / series.length, zero = Math.max(yr.lo, Math.min(yr.hi, 0));
        for (const p of s.points) {
          const center = (horizontal ? py(p.x) : px(p.x)) - band * .375 + si * bar;
          const first = horizontal ? px(zero) : py(zero), last = horizontal ? px(p.y) : py(p.y);
          out.push(horizontal ? `<rect x="${Math.min(first, last)}" y="${center}" width="${Math.abs(last - first)}" height="${bar}" fill="${s.color}"/>`
            : `<rect x="${center}" y="${Math.min(first, last)}" width="${bar}" height="${Math.abs(last - first)}" fill="${s.color}"/>`);
        }
      } else {
        const drawLine = !s.noLine && (kind === 'lineChart' || ['line', 'lineMarker', 'smooth', 'smoothMarker'].includes(value(type, 'scatterStyle')));
        if (drawLine) {
          let prev = -2;
          const d = s.points.map(p => { const cmd = p.index === prev + 1 || value(chart, 'dispBlanksAs') === 'span' ? 'L' : 'M'; prev = p.index; return `${cmd}${px(p.x)},${py(p.y)}`; }).join(' ');
          out.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2"/>`);
        }
        if (s.marker !== 'none') for (const p of s.points) {
          const x = px(p.x), y = py(p.y), r = s.markerSize * .65;
          out.push(s.marker === 'square' ? `<rect x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}" fill="${s.color}"/>`
            : `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.color}"/>`);
        }
      }
      for (const trend of children(s.node, 'trendline')) {
        if (value(trend, 'trendlineType') !== 'linear') continue;
        const shift = scatter ? 0 : 1; // Category trendlines use indices 1, 2, ...
        const fit = linearFit(s.points.map(p => ({ x: p.x + shift, y: p.y })), numeric(value(trend, 'intercept'))); if (!fit) continue;
        const lo = Math.min(...s.points.map(p => p.x)) + shift - numeric(value(trend, 'backward'), 0);
        const hi = Math.max(...s.points.map(p => p.x)) + shift + numeric(value(trend, 'forward'), 0);
        if (horizontal) line(px(fit.slope * lo + fit.offset), py(lo - shift), px(fit.slope * hi + fit.offset), py(hi - shift), s.color, 'stroke-width="2" stroke-dasharray="2 3"');
        else line(px(lo - shift), py(fit.slope * lo + fit.offset), px(hi - shift), py(fit.slope * hi + fit.offset), s.color, 'stroke-width="2" stroke-dasharray="2 3"');
        const parts = [];
        if (value(trend, 'dispEq') === '1') parts.push(`y = ${round(fit.slope)}x ${fit.offset < 0 ? '−' : '+'} ${round(Math.abs(fit.offset))}`);
        if (value(trend, 'dispRSqr') === '1' && fit.r2 != null) parts.push(`R² = ${round(fit.r2)}`);
        if (parts.length) trendLabels.push(parts.join('   '));
      }
      out.push('</g>');
      if (legend) { const x = L + si * (R - L) / series.length; out.push(`<rect x="${x}" y="${H-26}" width="10" height="10" fill="${s.color}"/>`); label(x + 15, H - 17, s.name); }
    });
    trendLabels.forEach((str, i) => label(L + 10, T + 18 + i * 17, str));
  }
  out.push('</g></svg>'); return out.join('');
}
export function replaceDocxChart(img, drawing, theme) {
  try {
    const svg = chartSvg(drawing.chartXml, Number(drawing.width), Number(drawing.height), theme);
    if (!svg) return false;
    img.removeAttribute('data-resource');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.alt = 'Word 차트'; img.dataset.docxChart = 'true';
    return true;
  } catch (_) { return false; } // Preserve the existing unsupported-image notice.
}
