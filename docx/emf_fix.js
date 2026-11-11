// FReader: EMF 변환 보정 (emf-converter 결과 SVG 후처리). 원본 변환기는 수정하지 않는다.
// EMF→SVG 변환 결과 보정: 이전 칸의 잘라내기 영역과 겹치는 부분이 전혀 없는 '연결된 잘라내기'를 끊는다.
export function fixDisjointClipChains(svg) {
  const defs = new Map();
  const re = /<clipPath id="([^"]+)"( clip-path="url\(#([^)]+)\)")?([^>]*)>([\s\S]*?)<\/clipPath>/g;
  let m;
  while ((m = re.exec(svg))) defs.set(m[1], { parent: m[3] || null, body: m[5] });
  const boxCache = new Map();
  function pathBox(d) {
    const tokens = d.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e-?\d+)?/g);
    if (!tokens) return null;
    let x = 0, y = 0, cmd = null, i = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, sx = 0, sy = 0;
    const add = () => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    while (i < tokens.length) {
      const t = tokens[i];
      if (/[A-Za-z]/.test(t)) { cmd = t; i++; if (cmd === 'Z' || cmd === 'z') { x = sx; y = sy; } continue; }
      const n = () => parseFloat(tokens[i++]);
      switch (cmd) {
        case 'M': x = n(); y = n(); sx = x; sy = y; cmd = 'L'; break;
        case 'm': x += n(); y += n(); sx = x; sy = y; cmd = 'l'; break;
        case 'L': x = n(); y = n(); break;
        case 'l': x += n(); y += n(); break;
        case 'H': x = n(); break;
        case 'h': x += n(); break;
        case 'V': y = n(); break;
        case 'v': y += n(); break;
        default: return null; // 곡선 등은 판단하지 않음
      }
      add();
    }
    return minX <= maxX ? [minX, minY, maxX, maxY] : null;
  }
  function ownBox(body) {
    const r = body.match(/^<rect x="([-\d.e]+)" y="([-\d.e]+)" width="([-\d.e]+)" height="([-\d.e]+)"[^>]*\/>$/);
    if (r) { const [x, y, w, h] = r.slice(1).map(Number); return [x, y, x + w, y + h]; }
    const p = body.match(/^<path d="([^"]+)"[^>]*\/>$/);
    if (p) return pathBox(p[1]);
    return null;
  }
  function box(id, depth = 0) {
    if (boxCache.has(id)) return boxCache.get(id);
    const def = defs.get(id); if (!def || depth > 64) return null;
    let b = ownBox(def.body);
    if (b && def.parent) {
      const pb = box(def.parent, depth + 1);
      if (pb) b = [Math.max(b[0], pb[0]), Math.max(b[1], pb[1]), Math.min(b[2], pb[2]), Math.min(b[3], pb[3])];
      else b = null;
    }
    boxCache.set(id, b); return b;
  }
  const broken = new Set();
  for (const [id, def] of defs) {
    if (!def.parent) continue;
    const own = ownBox(def.body), parent = box(def.parent);
    if (!own || !parent) continue;
    const empty = Math.min(own[2], parent[2]) <= Math.max(own[0], parent[0]) || Math.min(own[3], parent[3]) <= Math.max(own[1], parent[1]);
    if (empty) broken.add(id);
  }
  if (!broken.size) return svg;
  let out = svg.replace(/<clipPath id="([^"]+)" clip-path="url\(#[^)]+\)"/g, (all, id) => broken.has(id) ? `<clipPath id="${id}"` : all);
  // 변환기가 앞 칸의 잘라내기 영역을 그대로 남긴 경우: 그 영역 밖에만 그려지는 도형(예: 사진 위 빨간 네모)은
  // 잘라내기 없이 보이게 한다. 끊긴 사슬에 걸린 영역에서만 판단한다.
  const own = id => { const d = defs.get(id); return d ? ownBox(d.body) : null; };
  out = out.replace(/<g clip-path="url\(#([^)]+)\)">(<path d="([^"]+)"[^>]*\/>)<\/g>/g,
    (all, id, el, d) => {
      const matrix = (el.match(/ transform="matrix\(([^)]+)\)"/) || [])[1];
      if (/ transform="/.test(el) && !matrix) return all;
      if (!broken.has(id) && !chainHasBroken(id)) return all;
      const clip = own(id), b = pathBox(d);
      if (!clip || !b) return all;
      let [x0, y0, x1, y1] = b;
      if (matrix) {
        const m = matrix.trim().split(/[\s,]+/).map(Number);
        if (m.length !== 6 || m[1] !== 0 || m[2] !== 0) return all;
        [x0, x1] = [x0 * m[0] + m[4], x1 * m[0] + m[4]].sort((a, c) => a - c);
        [y0, y1] = [y0 * m[3] + m[5], y1 * m[3] + m[5]].sort((a, c) => a - c);
      }
      const outside = x1 <= clip[0] || x0 >= clip[2] || y1 <= clip[1] || y0 >= clip[3];
      return outside ? `<g>${el}</g>` : all;
    });
  return out;
  function chainHasBroken(id) {
    for (let c = id, n = 0; c && n < 64; c = defs.get(c)?.parent, n++) if (broken.has(c)) return true;
    return false;
  }
}

// 그림자 캔버스가 필요한 그림인지: EMF에서 SRCCOPY/PATCOPY 같은 단순 복사 외의 래스터 연산(마스크 등)을
// GDI로만 그리는 경우. EMF+ 기록이 있는 Office 그림은 EMF+ 쪽 그리기를 쓰므로 빠른 방식으로 충분하다.
export function needsExactRasterOps(buffer) {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 88 || view.getUint32(0, true) !== 1 || view.getUint32(40, true) !== 0x464D4520) return true; // EMF가 아니면(WMF 등) 원래대로
    const simple = new Set([0x00CC0020, 0x00F00021, 0x00000042, 0x00FF0062, 0x00AA0029]);
    let off = 0, plus = false, rop = false;
    for (let n = 0; off + 8 <= view.byteLength && n < 2000000; n++) {
      const type = view.getUint32(off, true), size = view.getUint32(off + 4, true);
      if (size < 8 || off + size > view.byteLength) break;
      if (type === 70 && size >= 20 && view.getUint32(off + 12, true) === 0x2B464D45) plus = true; // 'EMF+'
      const at = type === 76 || type === 77 ? 40 : type === 81 ? 68 : 0;
      if (at && size >= at + 4 && !simple.has(view.getUint32(off + at, true))) rop = true;
      if (type === 14) break;
      off += size;
    }
    return rop && !plus;
  } catch (_) {
    return true;
  }
}
