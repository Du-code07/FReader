// FReader v87: keep merged-cell coverage as rectangles, never one entry per cell.
// Whole-column merges may span 1,048,576 rows despite having almost no data.
// Only the renderer's membership operation is needed for continuation cells.
export function mergedContinuations(ranges) {
  function build(items) {
    if (!items.length) return null;
    const midpoints = items.map(r => Math.floor((r.top + r.bottom) / 2)).sort((a, b) => a - b);
    const center = midpoints[Math.floor(midpoints.length / 2)];
    const left = [], right = [], crossing = [];
    for (const r of items) {
      if (r.bottom < center) left.push(r);
      else if (r.top > center) right.push(r);
      else crossing.push(r);
    }
    return { center, byTop: crossing.slice().sort((a, b) => a.top - b.top),
      byBottom: crossing.slice().sort((a, b) => b.bottom - a.bottom),
      left: build(left), right: build(right) };
  }
  const root = build(ranges);
  function contains(node, row, col) {
    if (!node) return false;
    const before = row < node.center;
    for (const r of before ? node.byTop : node.byBottom) {
      if (before ? r.top > row : r.bottom < row) break;
      if (col >= r.left && col <= r.right && (row !== r.top || col !== r.left)) return true;
    }
    return row === node.center ? false : contains(before ? node.left : node.right, row, col);
  }
  return Object.freeze({ has(key) {
    if (typeof key !== 'string') return false;
    const separator = key.indexOf(':');
    if (separator < 1) return false;
    const row = Number(key.slice(0, separator)), col = Number(key.slice(separator + 1));
    return Number.isSafeInteger(row) && Number.isSafeInteger(col) && contains(root, row, col);
  } });
}
