// src/emf-color-helpers.ts
function colorRefToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r & 255)}${toHex(g & 255)}${toHex(b & 255)}`;
}
function argbToRgba(argb) {
  const a = (argb >>> 24 & 255) / 255;
  const r = argb >>> 16 & 255;
  const g = argb >>> 8 & 255;
  const b = argb & 255;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
function lerpArgbToRgba(argbA, argbB, t) {
  const tc = Math.min(1, Math.max(0, t));
  const mix2 = (a2, b2) => Math.round(a2 + (b2 - a2) * tc);
  const aA = argbA >>> 24 & 255;
  const aB = argbB >>> 24 & 255;
  const r = mix2(argbA >>> 16 & 255, argbB >>> 16 & 255);
  const g = mix2(argbA >>> 8 & 255, argbB >>> 8 & 255);
  const b = mix2(argbA & 255, argbB & 255);
  const a = mix2(aA, aB) / 255;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
function invertCssColor(color) {
  const hex5 = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex5) {
    const v = parseInt(hex5[1], 16);
    const inv2 = 16777215 ^ v;
    return `#${inv2.toString(16).padStart(6, "0")}`;
  }
  const shortHex = /^#([0-9a-f]{3})$/i.exec(color);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split("").map((c) => parseInt(c + c, 16));
    const toHex = (v) => (255 - v).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
  if (rgba) {
    const r = 255 - Math.min(255, parseInt(rgba[1], 10));
    const g = 255 - Math.min(255, parseInt(rgba[2], 10));
    const b = 255 - Math.min(255, parseInt(rgba[3], 10));
    return rgba[4] !== void 0 ? `rgba(${r},${g},${b},${rgba[4]})` : `rgb(${r},${g},${b})`;
  }
  return color;
}

// src/emf-dib-rle-decoder.ts
function decodeRleBitmap(view, bitsOffset, bitsSize, width, height, _topDown, isRle4, colorTable, out, setPixel) {
  let x = 0;
  let y = height - 1;
  let off = bitsOffset;
  const endOff = bitsOffset + bitsSize;
  while (off + 1 < endOff && y >= 0) {
    const first = view.getUint8(off);
    const second = view.getUint8(off + 1);
    off += 2;
    if (first === 0) {
      if (second === 0) {
        x = 0;
        y--;
      } else if (second === 1) {
        break;
      } else if (second === 2) {
        if (off + 1 >= endOff) {
          break;
        }
        x += view.getUint8(off);
        y -= view.getUint8(off + 1);
        off += 2;
      } else {
        const count = second;
        if (!isRle4) {
          for (let i = 0; i < count && off < endOff && x < width; i++) {
            const idx = view.getUint8(off++);
            if (idx < colorTable.length) {
              setPixel(
                x,
                height - 1 - y,
                colorTable[idx][0],
                colorTable[idx][1],
                colorTable[idx][2],
                255
              );
            }
            x++;
          }
          if (count & 1) {
            off++;
          }
        } else {
          const bytes = Math.ceil(count / 2);
          let pi = 0;
          for (let i = 0; i < bytes && off < endOff; i++) {
            const byte = view.getUint8(off++);
            for (let nibble = 0; nibble < 2 && pi < count; nibble++) {
              const idx = nibble === 0 ? byte >> 4 & 15 : byte & 15;
              if (idx < colorTable.length && x < width) {
                setPixel(
                  x,
                  height - 1 - y,
                  colorTable[idx][0],
                  colorTable[idx][1],
                  colorTable[idx][2],
                  255
                );
              }
              x++;
              pi++;
            }
          }
          if (bytes & 1) {
            off++;
          }
        }
      }
    } else if (!isRle4) {
      const idx = second;
      const c = idx < colorTable.length ? colorTable[idx] : [0, 0, 0];
      for (let i = 0; i < first && x < width; i++) {
        setPixel(x, height - 1 - y, c[0], c[1], c[2], 255);
        x++;
      }
    } else {
      const hi = second >> 4 & 15;
      const lo = second & 15;
      for (let i = 0; i < first && x < width; i++) {
        const idx = (i & 1) === 0 ? hi : lo;
        if (idx < colorTable.length) {
          setPixel(
            x,
            height - 1 - y,
            colorTable[idx][0],
            colorTable[idx][1],
            colorTable[idx][2],
            255
          );
        }
        x++;
      }
    }
  }
  return createImageDataCompat(
    new Uint8ClampedArray(out.buffer, out.byteOffset, out.byteLength),
    width,
    height
  );
}

// src/emf-dib-uncompressed.ts
function countTrailingZeros(v) {
  if (v === 0) {
    return 0;
  }
  let c = 0;
  let val = v;
  while ((val & 1) === 0) {
    val >>>= 1;
    c++;
  }
  return c;
}
var BI_BITFIELDS = 3;
function parseBitfieldMasks(view, bmiOffset, headerSize, compression, bitCount) {
  let rMask = 0, gMask = 0, bMask = 0;
  let rShift = 0, gShift = 0, bShift = 0;
  let rMax = 1, gMax = 1, bMax = 1;
  if (compression === BI_BITFIELDS) {
    const bfOff = bmiOffset + headerSize;
    if (bfOff + 12 > view.byteLength) {
      return null;
    }
    rMask = view.getUint32(bfOff, true);
    gMask = view.getUint32(bfOff + 4, true);
    bMask = view.getUint32(bfOff + 8, true);
    rShift = countTrailingZeros(rMask);
    gShift = countTrailingZeros(gMask);
    bShift = countTrailingZeros(bMask);
    rMax = rMask >>> rShift || 1;
    gMax = gMask >>> gShift || 1;
    bMax = bMask >>> bShift || 1;
  } else if (bitCount === 16) {
    rMask = 31744;
    gMask = 992;
    bMask = 31;
    rShift = 10;
    gShift = 5;
    bShift = 0;
    rMax = 31;
    gMax = 31;
    bMax = 31;
  }
  return { rMask, gMask, bMask, rShift, gShift, bShift, rMax, gMax, bMax };
}
function decodeUncompressedRows(view, bitsOffset, width, height, topDown, bitCount, colorTable, masks, out, rawAlpha = false) {
  const rowStride = Math.floor((bitCount * width + 31) / 32) * 4;
  const { rMask, gMask, bMask, rShift, gShift, bShift, rMax, gMax, bMax } = masks;
  for (let y = 0; y < height; y++) {
    const srcY = topDown ? y : height - 1 - y;
    const rowStart = bitsOffset + srcY * rowStride;
    if (rowStart + rowStride > view.byteLength) {
      continue;
    }
    for (let x = 0; x < width; x++) {
      const dstPx = (y * width + x) * 4;
      if (bitCount === 1) {
        const byteIdx = rowStart + (x >> 3);
        const bit = view.getUint8(byteIdx) >> 7 - (x & 7) & 1;
        if (bit < colorTable.length) {
          out[dstPx] = colorTable[bit][0];
          out[dstPx + 1] = colorTable[bit][1];
          out[dstPx + 2] = colorTable[bit][2];
        }
        out[dstPx + 3] = 255;
      } else if (bitCount === 4) {
        const byteIdx = rowStart + (x >> 1);
        const nibble = (x & 1) === 0 ? view.getUint8(byteIdx) >> 4 & 15 : view.getUint8(byteIdx) & 15;
        if (nibble < colorTable.length) {
          out[dstPx] = colorTable[nibble][0];
          out[dstPx + 1] = colorTable[nibble][1];
          out[dstPx + 2] = colorTable[nibble][2];
        }
        out[dstPx + 3] = 255;
      } else if (bitCount === 8) {
        const idx = view.getUint8(rowStart + x);
        if (idx < colorTable.length) {
          out[dstPx] = colorTable[idx][0];
          out[dstPx + 1] = colorTable[idx][1];
          out[dstPx + 2] = colorTable[idx][2];
        }
        out[dstPx + 3] = 255;
      } else if (bitCount === 16) {
        const val = view.getUint16(rowStart + x * 2, true);
        out[dstPx] = Math.round(((val & rMask) >>> rShift) * 255 / rMax);
        out[dstPx + 1] = Math.round(((val & gMask) >>> gShift) * 255 / gMax);
        out[dstPx + 2] = Math.round(((val & bMask) >>> bShift) * 255 / bMax);
        out[dstPx + 3] = 255;
      } else if (bitCount === 24) {
        const srcPx = rowStart + x * 3;
        out[dstPx] = view.getUint8(srcPx + 2);
        out[dstPx + 1] = view.getUint8(srcPx + 1);
        out[dstPx + 2] = view.getUint8(srcPx);
        out[dstPx + 3] = 255;
      } else {
        const srcPx = rowStart + x * 4;
        const bb = view.getUint8(srcPx);
        const gg = view.getUint8(srcPx + 1);
        const rr = view.getUint8(srcPx + 2);
        const aa = view.getUint8(srcPx + 3);
        out[dstPx] = rr;
        out[dstPx + 1] = gg;
        out[dstPx + 2] = bb;
        out[dstPx + 3] = aa === 0 && !rawAlpha ? 255 : aa;
      }
    }
  }
}

// src/emf-dib-decoder.ts
function decodeDibToImageData(view, bmiOffset, bitsOffset, bitsSize, paletteColors, rawAlpha = false) {
  if (bmiOffset < 0 || bitsOffset < 0 || bmiOffset + 40 > view.byteLength || bitsOffset + bitsSize > view.byteLength) {
    return null;
  }
  const headerSize = view.getUint32(bmiOffset, true);
  if (headerSize < 40 || bmiOffset + headerSize > view.byteLength) {
    return null;
  }
  const width = view.getInt32(bmiOffset + 4, true);
  const heightRaw = view.getInt32(bmiOffset + 8, true);
  const planes = view.getUint16(bmiOffset + 12, true);
  const bitCount = view.getUint16(bmiOffset + 14, true);
  const compression = view.getUint32(bmiOffset + 16, true);
  if (planes !== 1 || width <= 0 || heightRaw === 0) {
    return null;
  }
  if (width > 8192 || Math.abs(heightRaw) > 8192) {
    return null;
  }
  const BI_RGB = 0;
  const BI_RLE8 = 1;
  const BI_RLE4 = 2;
  const BI_BITFIELDS2 = 3;
  if (bitCount !== 1 && bitCount !== 4 && bitCount !== 8 && bitCount !== 16 && bitCount !== 24 && bitCount !== 32) {
    return null;
  }
  if (compression === BI_RLE8 && bitCount !== 8) {
    return null;
  }
  if (compression === BI_RLE4 && bitCount !== 4) {
    return null;
  }
  if (compression === BI_BITFIELDS2 && bitCount !== 16 && bitCount !== 32) {
    return null;
  }
  if (compression !== BI_RGB && compression !== BI_RLE8 && compression !== BI_RLE4 && compression !== BI_BITFIELDS2) {
    return null;
  }
  const height = Math.abs(heightRaw);
  const topDown = heightRaw < 0;
  const colorTable = [];
  if (bitCount <= 8) {
    const maxColors = 1 << bitCount;
    const colorsUsed = view.getUint32(bmiOffset + 32, true) || maxColors;
    const numColors = Math.min(colorsUsed, maxColors);
    const ctOffset = bmiOffset + headerSize;
    const indexed = !!paletteColors && paletteColors.length > 0;
    if (ctOffset + numColors * (indexed ? 2 : 4) > view.byteLength) {
      return null;
    }
    for (let i = 0; i < numColors; i++) {
      if (indexed) {
        const index = view.getUint16(ctOffset + i * 2, true);
        const rgb2 = paletteColors[index < paletteColors.length ? index : 0];
        colorTable.push([rgb2 >> 16 & 255, rgb2 >> 8 & 255, rgb2 & 255]);
        continue;
      }
      const b = view.getUint8(ctOffset + i * 4);
      const g = view.getUint8(ctOffset + i * 4 + 1);
      const r = view.getUint8(ctOffset + i * 4 + 2);
      colorTable.push([r, g, b]);
    }
  }
  const masks = parseBitfieldMasks(view, bmiOffset, headerSize, compression, bitCount);
  if (!masks) {
    return null;
  }
  const out = new Uint8ClampedArray(width * height * 4);
  if (compression === BI_RLE8 || compression === BI_RLE4) {
    const setPixel = (x, y, r, g, b, a) => {
      const dstPx = (y * width + x) * 4;
      out[dstPx] = r;
      out[dstPx + 1] = g;
      out[dstPx + 2] = b;
      out[dstPx + 3] = a;
    };
    return decodeRleBitmap(
      view,
      bitsOffset,
      bitsSize,
      width,
      height,
      topDown,
      compression === BI_RLE4,
      colorTable,
      out,
      setPixel
    );
  }
  decodeUncompressedRows(
    view,
    bitsOffset,
    width,
    height,
    topDown,
    bitCount,
    colorTable,
    masks,
    out,
    rawAlpha
  );
  return createImageDataCompat(out, width, height);
}

// src/emf-gdi-brush-pattern.ts
var HATCH_ROWS = [
  [0, 0, 0, 255, 0, 0, 0, 0],
  // HS_HORIZONTAL
  [8, 8, 8, 8, 8, 8, 8, 8],
  // HS_VERTICAL
  [128, 64, 32, 16, 8, 4, 2, 1],
  // HS_FDIAGONAL
  [1, 2, 4, 8, 16, 32, 64, 128],
  // HS_BDIAGONAL
  [8, 8, 8, 255, 8, 8, 8, 8],
  // HS_CROSS
  [129, 66, 36, 24, 24, 36, 66, 129]
  // HS_DIAGCROSS
];
function hatchBit(hatch, x, y) {
  const rows = HATCH_ROWS[hatch] ?? HATCH_ROWS[0];
  return (rows[y & 7] >> 7 - (x & 7) & 1) === 1;
}
function cssHexToRgb(color) {
  const m = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(color.trim());
  if (!m) {
    return 0;
  }
  const hex5 = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return parseInt(hex5, 16);
}
function decodeMonoBits(view, bmiOffset, bitsOffset) {
  if (bmiOffset + 16 > view.byteLength) {
    return null;
  }
  const width = view.getInt32(bmiOffset + 4, true);
  const heightRaw = view.getInt32(bmiOffset + 8, true);
  const bitCount = view.getUint16(bmiOffset + 14, true);
  const height = Math.abs(heightRaw);
  if (bitCount !== 1 || width <= 0 || height === 0 || width > 256 || height > 256) {
    return null;
  }
  const stride = (width + 31 >> 5) * 4;
  if (bitsOffset + stride * height > view.byteLength) {
    return null;
  }
  const bits = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    const y = heightRaw > 0 ? height - 1 - row : row;
    const rowOff = bitsOffset + row * stride;
    for (let x = 0; x < width; x++) {
      bits[y * width + x] = view.getUint8(rowOff + (x >> 3)) >> 7 - (x & 7) & 1;
    }
  }
  return { width, height, bits };
}
function parsePatternBrush(view, offset, dataOff, mono, paletteColors = null) {
  if (dataOff + 24 > view.byteLength) {
    return null;
  }
  const offBmi = view.getUint32(dataOff + 8, true);
  const offBits = view.getUint32(dataOff + 16, true);
  const cbBits = view.getUint32(dataOff + 20, true);
  const bmi = offset + offBmi;
  const bitsAt = offset + offBits;
  const bitCount = bmi + 16 <= view.byteLength ? view.getUint16(bmi + 14, true) : 0;
  if (mono || bitCount === 1) {
    const decoded = decodeMonoBits(view, bmi, bitsAt);
    if (decoded && mono) {
      return { kind: "mono", ...decoded };
    }
  }
  const image = decodeDibToImageData(view, bmi, bitsAt, cbBits, paletteColors);
  if (!image) {
    return null;
  }
  const rgb2 = new Uint32Array(image.width * image.height);
  const d = image.data;
  for (let i = 0; i < rgb2.length; i++) {
    rgb2[i] = d[i * 4] << 16 | d[i * 4 + 1] << 8 | d[i * 4 + 2];
  }
  return { kind: "bitmap", width: image.width, height: image.height, rgb: rgb2 };
}
function realizeBrush(state) {
  if (state.brushStyle === 1) {
    return { kind: "none" };
  }
  const pattern = state.brushPattern;
  if (!pattern) {
    return { kind: "solid", rgb: cssHexToRgb(state.brushColor) };
  }
  if (pattern.kind === "bitmap") {
    return { kind: "tile", width: pattern.width, height: pattern.height, rgb: pattern.rgb };
  }
  const bk = cssHexToRgb(state.bkColor);
  if (pattern.kind === "hatch") {
    const fg = cssHexToRgb(state.brushColor);
    const rgb3 = new Uint32Array(64);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        rgb3[y * 8 + x] = hatchBit(pattern.hatch, x, y) ? fg : bk;
      }
    }
    return { kind: "tile", width: 8, height: 8, rgb: rgb3 };
  }
  const text = cssHexToRgb(state.textColor);
  const rgb2 = new Uint32Array(pattern.width * pattern.height);
  for (let i = 0; i < rgb2.length; i++) {
    rgb2[i] = pattern.bits[i] ? bk : text;
  }
  return { kind: "tile", width: pattern.width, height: pattern.height, rgb: rgb2 };
}
function sampleTile(tile, devX, devY, orgX, orgY) {
  const tx = ((devX - orgX) % tile.width + tile.width) % tile.width;
  const ty = ((devY - orgY) % tile.height + tile.height) % tile.height;
  return tile.rgb[ty * tile.width + tx];
}

// src/emf-gdi-text-layout.ts
function cumulativeGlyphOffsets(dx) {
  const offsets = [];
  let acc = 0;
  for (let i = 0; i < dx.length; i++) {
    offsets.push(acc);
    acc += dx[i];
  }
  return offsets;
}
function totalGlyphAdvance(dx) {
  let sum = 0;
  for (const d of dx) {
    sum += d;
  }
  return sum;
}
function applyTextJustification(advances, characters, extra, count) {
  const result = advances.slice();
  if (extra === 0 || count <= 0) {
    return result;
  }
  let seen = 0;
  for (let i = 0; i < result.length && i < characters.length; i++) {
    if (characters[i] !== 32) {
      continue;
    }
    const before = Math.round(seen * extra / count);
    seen++;
    const after = Math.round(seen * extra / count);
    result[i] += after - before;
  }
  return result;
}
function alignmentStartOffset(totalWidth, align) {
  if (align === "center") {
    return -totalWidth / 2;
  }
  if (align === "right") {
    return -totalWidth;
  }
  return 0;
}
var DEG_TO_RAD = Math.PI / 180;
function escapementToCanvasRadians(tenthsOfDegree) {
  return -(tenthsOfDegree / 10) * DEG_TO_RAD;
}
var CELL_TO_CHAR_HEIGHT_RATIO = 1.15;
function resolveFontPixelHeight(lfHeight) {
  if (lfHeight === 0) {
    return 0;
  }
  if (lfHeight < 0) {
    return -lfHeight;
  }
  return lfHeight / CELL_TO_CHAR_HEIGHT_RATIO;
}

// src/emf-constants.ts
var EMR_HEADER = 1;
var EMR_POLYBEZIER = 2;
var EMR_POLYGON = 3;
var EMR_POLYLINE = 4;
var EMR_POLYBEZIERTO = 5;
var EMR_POLYLINETO = 6;
var EMR_POLYPOLYLINE = 7;
var EMR_POLYPOLYGON = 8;
var EMR_SETWINDOWEXTEX = 9;
var EMR_SETWINDOWORGEX = 10;
var EMR_SETVIEWPORTEXTEX = 11;
var EMR_SETVIEWPORTORGEX = 12;
var EMR_SETBRUSHORGEX = 13;
var EMR_CREATEMONOBRUSH = 93;
var EMR_CREATEDIBPATTERNBRUSHPT = 94;
var EMR_STRETCHBLT = 77;
var EMR_EOF = 14;
var EMR_SETPIXELV = 15;
var EMR_SETMAPMODE = 17;
var EMR_SETBKMODE = 18;
var EMR_SETPOLYFILLMODE = 19;
var EMR_SETROP2 = 20;
var EMR_SETSTRETCHBLTMODE = 21;
var R2_BLACK = 1;
var R2_NOTMERGEPEN = 2;
var R2_MASKNOTPEN = 3;
var R2_NOTCOPYPEN = 4;
var R2_MASKPENNOT = 5;
var R2_NOT = 6;
var R2_XORPEN = 7;
var R2_NOTMASKPEN = 8;
var R2_MASKPEN = 9;
var R2_NOTXORPEN = 10;
var R2_NOP = 11;
var R2_MERGENOTPEN = 12;
var R2_MERGEPENNOT = 14;
var R2_MERGEPEN = 15;
var R2_WHITE = 16;
var MAX_CANVAS_DIMENSION = 8192;
var MAX_RECORDS_DEFAULT = 2e5;
var MAX_RECORDS_EMFPLUS_DEFAULT = 5e5;
var EMR_SETTEXTALIGN = 22;
var EMR_SETTEXTCOLOR = 24;
var EMR_SETBKCOLOR = 25;
var EMR_OFFSETCLIPRGN = 26;
var EMR_MOVETOEX = 27;
var EMR_SETMETARGN = 28;
var EMR_EXCLUDECLIPRECT = 29;
var EMR_INTERSECTCLIPRECT = 30;
var EMR_SCALEVIEWPORTEXTEX = 31;
var EMR_SCALEWINDOWEXTEX = 32;
var EMR_SAVEDC = 33;
var EMR_RESTOREDC = 34;
var EMR_SETWORLDTRANSFORM = 35;
var EMR_MODIFYWORLDTRANSFORM = 36;
var EMR_SELECTOBJECT = 37;
var EMR_CREATEPEN = 38;
var EMR_CREATEBRUSHINDIRECT = 39;
var EMR_DELETEOBJECT = 40;
var EMR_ELLIPSE = 42;
var EMR_RECTANGLE = 43;
var EMR_ROUNDRECT = 44;
var EMR_ARC = 45;
var EMR_CHORD = 46;
var EMR_PIE = 47;
var EMR_LINETO = 54;
var EMR_ARCTO = 55;
var EMR_SETARCDIRECTION = 57;
var EMR_SETMITERLIMIT = 58;
var EMR_BEGINPATH = 59;
var EMR_ENDPATH = 60;
var EMR_CLOSEFIGURE = 61;
var EMR_FILLPATH = 62;
var EMR_STROKEANDFILLPATH = 63;
var EMR_STROKEPATH = 64;
var EMR_SELECTCLIPPATH = 67;
var EMR_COMMENT = 70;
var EMR_EXTSELECTCLIPRGN = 75;
var EMR_BITBLT = 76;
var EMR_STRETCHDIBITS = 81;
var EMR_EXTCREATEFONTINDIRECTW = 82;
var EMR_EXTTEXTOUTW = 84;
var EMR_POLYBEZIER16 = 85;
var EMR_POLYGON16 = 86;
var EMR_POLYLINE16 = 87;
var EMR_POLYBEZIERTO16 = 88;
var EMR_POLYLINETO16 = 89;
var EMR_POLYPOLYGON16 = 91;
var EMR_EXTCREATEPEN = 95;
var EMR_SETICMMODE = 98;
var EMR_SETLAYOUT = 115;
var EMR_SETMAPPERFLAGS = 16;
var EMR_SETCOLORADJUSTMENT = 23;
var EMR_ANGLEARC = 41;
var EMR_SELECTPALETTE = 48;
var EMR_CREATEPALETTE = 49;
var EMR_SETPALETTEENTRIES = 50;
var EMR_RESIZEPALETTE = 51;
var EMR_REALIZEPALETTE = 52;
var EMR_EXTFLOODFILL = 53;
var EMR_POLYDRAW = 56;
var EMR_FLATTENPATH = 65;
var EMR_WIDENPATH = 66;
var EMR_ABORTPATH = 68;
var EMR_FILLRGN = 71;
var EMR_FRAMERGN = 72;
var EMR_INVERTRGN = 73;
var EMR_PAINTRGN = 74;
var EMR_MASKBLT = 78;
var EMR_PLGBLT = 79;
var EMR_SETDIBITSTODEVICE = 80;
var EMR_EXTTEXTOUTA = 83;
var EMR_POLYPOLYLINE16 = 90;
var EMR_POLYDRAW16 = 92;
var EMR_POLYTEXTOUTA = 96;
var EMR_POLYTEXTOUTW = 97;
var EMR_CREATECOLORSPACE = 99;
var EMR_SETCOLORSPACE = 100;
var EMR_DELETECOLORSPACE = 101;
var EMR_GLSRECORD = 102;
var EMR_GLSBOUNDEDRECORD = 103;
var EMR_PIXELFORMAT = 104;
var EMR_DRAWESCAPE = 105;
var EMR_EXTESCAPE = 106;
var EMR_SMALLTEXTOUT = 108;
var EMR_FORCEUFIMAPPING = 109;
var EMR_NAMEDESCAPE = 110;
var EMR_COLORCORRECTPALETTE = 111;
var EMR_SETICMPROFILEA = 112;
var EMR_SETICMPROFILEW = 113;
var EMR_ALPHABLEND = 114;
var EMR_TRANSPARENTBLT = 116;
var EMR_GRADIENTFILL = 118;
var EMR_SETLINKEDUFIS = 119;
var EMR_SETTEXTJUSTIFICATION = 120;
var EMR_COLORMATCHTOTARGETW = 121;
var EMR_CREATECOLORSPACEW = 122;
var DEFAULT_PALETTE_STOCK_INDEX = 15;
var STOCK_OBJECT_BASE = 2147483648;
var EMFPLUS_SIGNATURE = 726027589;
var EMR_COMMENT_PUBLIC_SIGNATURE = 1128875079;
var EMFPLUS_HEADER = 16385;
var EMFPLUS_ENDOFFILE = 16386;
var EMFPLUS_GETDC = 16388;
var EMFPLUS_CLEAR = 16393;
var EMFPLUS_OBJECT = 16392;
var EMFPLUS_FILLRECTS = 16394;
var EMFPLUS_DRAWRECTS = 16395;
var EMFPLUS_FILLPOLYGON = 16396;
var EMFPLUS_DRAWLINES = 16397;
var EMFPLUS_FILLELLIPSE = 16398;
var EMFPLUS_DRAWELLIPSE = 16399;
var EMFPLUS_FILLPIE = 16400;
var EMFPLUS_DRAWPIE = 16401;
var EMFPLUS_DRAWARC = 16402;
var EMFPLUS_FILLPATH = 16404;
var EMFPLUS_DRAWPATH = 16405;
var EMFPLUS_DRAWIMAGE = 16410;
var EMFPLUS_DRAWIMAGEPOINTS = 16411;
var EMFPLUS_DRAWSTRING = 16412;
var EMFPLUS_SETANTIALIASMODE = 16414;
var EMFPLUS_SETTEXTRENDERINGHINT = 16415;
var EMFPLUS_SETINTERPOLATIONMODE = 16417;
var EMFPLUS_SETPIXELOFFSETMODE = 16418;
var EMFPLUS_SETCOMPOSITINGQUALITY = 16420;
var EMFPLUS_SAVE = 16421;
var EMFPLUS_RESTORE = 16422;
var EMFPLUS_BEGINCONTAINERNOPARAMS = 16424;
var EMFPLUS_ENDCONTAINER = 16425;
var EMFPLUS_SETWORLDTRANSFORM = 16426;
var EMFPLUS_RESETWORLDTRANSFORM = 16427;
var EMFPLUS_MULTIPLYWORLDTRANSFORM = 16428;
var EMFPLUS_TRANSLATEWORLDTRANSFORM = 16429;
var EMFPLUS_SCALEWORLDTRANSFORM = 16430;
var EMFPLUS_ROTATEWORLDTRANSFORM = 16431;
var EMFPLUS_SETPAGETRANSFORM = 16432;
var EMFPLUS_RESETCLIP = 16433;
var EMFPLUS_SETCLIPRECT = 16434;
var EMFPLUS_SETCLIPPATH = 16435;
var EMFPLUS_SETCLIPREGION = 16436;
var EMFPLUS_DRAWDRIVERSTRING = 16438;
var EMFPLUS_OFFSETCLIP = 16437;
var EMFPLUS_FILLCLOSEDCURVE = 16406;
var EMFPLUS_DRAWCLOSEDCURVE = 16407;
var EMFPLUS_DRAWCURVE = 16408;
var EMFPLUS_DRAWBEZIERS = 16409;
var EMFPLUS_BEGINCONTAINER = 16423;
var EMFPLUS_MULTIFORMATSTART = 16389;
var EMFPLUS_MULTIFORMATSECTION = 16390;
var EMFPLUS_MULTIFORMATEND = 16391;
var EMFPLUS_FILLREGION = 16403;
var EMFPLUS_SETRENDERINGORIGIN = 16413;
var EMFPLUS_SETTEXTCONTRAST = 16416;
var EMFPLUS_SETCOMPOSITINGMODE = 16419;
var EMFPLUS_STROKEFILLPATH = 16439;
var EMFPLUS_SERIALIZABLEOBJECT = 16440;
var EMFPLUS_SETTSGRAPHICS = 16441;
var EMFPLUS_SETTSCLIP = 16442;
var EMFPLUS_OBJECTTYPE_BRUSH = 1;
var EMFPLUS_OBJECTTYPE_PEN = 2;
var EMFPLUS_OBJECTTYPE_PATH = 3;
var EMFPLUS_OBJECTTYPE_REGION = 4;
var EMFPLUS_OBJECTTYPE_IMAGE = 5;
var EMFPLUS_OBJECTTYPE_FONT = 6;
var EMFPLUS_OBJECTTYPE_STRINGFORMAT = 7;
var EMFPLUS_OBJECTTYPE_IMAGEATTRIBUTES = 8;
var EMFPLUS_BRUSHTYPE_SOLID = 0;
var EMFPLUS_BRUSHTYPE_HATCHFILL = 1;
var EMFPLUS_BRUSHTYPE_TEXTUREFILL = 2;
var EMFPLUS_BRUSHTYPE_PATHGRADIENT = 3;
var EMFPLUS_BRUSHTYPE_LINEARGRADIENT = 4;
var META_EOF = 0;
var META_SETBKCOLOR = 513;
var META_SETBKMODE = 258;
var META_SETROP2 = 260;
var META_SETPOLYFILLMODE = 262;
var META_SETTEXTCOLOR = 521;
var META_SETTEXTALIGN = 302;
var META_SETWINDOWORG = 523;
var META_SETWINDOWEXT = 524;
var META_MOVETO = 532;
var META_LINETO = 531;
var META_RECTANGLE = 1051;
var META_ROUNDRECT = 1564;
var META_ELLIPSE = 1048;
var META_ARC = 2071;
var META_PIE = 2074;
var META_CHORD = 2096;
var META_POLYGON = 804;
var META_POLYLINE = 805;
var META_SELECTOBJECT = 301;
var META_DELETEOBJECT = 496;
var META_CREATEPENINDIRECT = 762;
var META_CREATEBRUSHINDIRECT = 764;
var META_CREATEFONTINDIRECT = 763;
var META_TEXTOUT = 1313;
var META_PATBLT = 1565;
var META_EXTTEXTOUT = 2610;
var META_SAVEDC = 30;
var META_RESTOREDC = 295;
var META_POLYPOLYGON = 1336;
var META_REALIZEPALETTE = 53;
var META_SETPALENTRIES = 55;
var META_SETMAPMODE = 259;
var META_SETRELABS = 261;
var META_SETSTRETCHBLTMODE = 263;
var META_SETTEXTCHAREXTRA = 264;
var META_RESIZEPALETTE = 313;
var META_DIBCREATEPATTERNBRUSH = 322;
var META_SETLAYOUT = 329;
var META_SETTEXTJUSTIFICATION = 522;
var META_SETVIEWPORTORG = 525;
var META_SETVIEWPORTEXT = 526;
var META_OFFSETWINDOWORG = 527;
var META_OFFSETVIEWPORTORG = 529;
var META_OFFSETCLIPRGN = 544;
var META_FILLREGION = 552;
var META_SETMAPPERFLAGS = 561;
var META_SELECTPALETTE = 564;
var META_SCALEWINDOWEXT = 1040;
var META_SCALEVIEWPORTEXT = 1042;
var META_EXCLUDECLIPRECT = 1045;
var META_INTERSECTCLIPRECT = 1046;
var META_FLOODFILL = 1049;
var META_SETPIXEL = 1055;
var META_FRAMEREGION = 1065;
var META_ANIMATEPALETTE = 1078;
var META_EXTFLOODFILL = 1352;
var META_ESCAPE = 1574;
var META_INVERTREGION = 298;
var META_PAINTREGION = 299;
var META_SELECTCLIPREGION = 300;
var META_BITBLT = 2338;
var META_STRETCHBLT = 2851;
var META_DIBBITBLT = 2368;
var META_DIBSTRETCHBLT = 2881;
var META_STRETCHDIB = 3907;
var META_SETDIBTODEV = 3379;
var META_CREATEPALETTE = 247;
var META_CREATEBRUSH = 248;
var META_CREATEPATTERNBRUSH = 505;
var META_CREATEBITMAPINDIRECT = 765;
var META_CREATEBITMAP = 1790;
var META_CREATEREGION = 1791;
var emfLog = (...args) => {
};
var emfWarn = (...args) => {
};

// src/png-decoder.ts
var SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
function isPng(bytes) {
  return bytes.length >= 8 && SIGNATURE.every((b, i) => bytes[i] === b);
}
async function inflateZlib(data) {
  if (typeof DecompressionStream === "function" && typeof Response === "function") {
    try {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
    }
  }
  return inflateZlibSync(data);
}
var LENGTH_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
var LENGTH_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
var DIST_BASE = [
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577
];
var DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
var CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
function buildHuffman(lengths, n) {
  const counts = new Uint16Array(16);
  for (let i = 0; i < n; i++) {
    counts[lengths[i]]++;
  }
  counts[0] = 0;
  const offs = new Uint16Array(16);
  for (let i = 1; i < 16; i++) {
    offs[i] = offs[i - 1] + counts[i - 1];
  }
  const symbols = new Uint16Array(n);
  for (let i = 0; i < n; i++) {
    if (lengths[i]) {
      symbols[offs[lengths[i]]++] = i;
    }
  }
  return { counts, symbols };
}
function inflateZlibSync(input) {
  let pos = 2;
  let bitBuf = 0;
  let bitCnt = 0;
  let out = new Uint8Array(Math.max(1024, input.length * 4));
  let outLen = 0;
  const need = (n) => {
    if (outLen + n > out.length) {
      const next = new Uint8Array(Math.max(out.length * 2, outLen + n));
      next.set(out.subarray(0, outLen));
      out = next;
    }
  };
  const bits = (n) => {
    while (bitCnt < n) {
      if (pos >= input.length) {
        throw new Error("inflate: unexpected end of data");
      }
      bitBuf |= input[pos++] << bitCnt;
      bitCnt += 8;
    }
    const v = bitBuf & (1 << n) - 1;
    bitBuf >>>= n;
    bitCnt -= n;
    return v;
  };
  const decode = (h) => {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len < 16; len++) {
      code |= bits(1);
      const count = h.counts[len];
      if (code - count < first) {
        return h.symbols[index + (code - first)];
      }
      index += count;
      first = first + count << 1;
      code <<= 1;
    }
    throw new Error("inflate: bad Huffman code");
  };
  let fixedLit = null;
  let fixedDist = null;
  let final = 0;
  while (!final) {
    final = bits(1);
    const type = bits(2);
    if (type === 0) {
      bitBuf = 0;
      bitCnt = 0;
      const len = input[pos] | input[pos + 1] << 8;
      pos += 4;
      need(len);
      out.set(input.subarray(pos, pos + len), outLen);
      outLen += len;
      pos += len;
      continue;
    }
    let lit;
    let dist;
    if (type === 1) {
      if (!fixedLit || !fixedDist) {
        const l = new Uint8Array(288);
        l.fill(8, 0, 144);
        l.fill(9, 144, 256);
        l.fill(7, 256, 280);
        l.fill(8, 280, 288);
        fixedLit = buildHuffman(l, 288);
        fixedDist = buildHuffman(new Uint8Array(30).fill(5), 30);
      }
      lit = fixedLit;
      dist = fixedDist;
    } else if (type === 2) {
      const hlit = bits(5) + 257;
      const hdist = bits(5) + 1;
      const hclen = bits(4) + 4;
      const cl = new Uint8Array(19);
      for (let i = 0; i < hclen; i++) {
        cl[CL_ORDER[i]] = bits(3);
      }
      const clh = buildHuffman(cl, 19);
      const lens = new Uint8Array(hlit + hdist);
      for (let i = 0; i < hlit + hdist; ) {
        const sym = decode(clh);
        if (sym < 16) {
          lens[i++] = sym;
        } else if (sym === 16) {
          const prev = lens[i - 1];
          for (let r = 3 + bits(2); r > 0; r--) {
            lens[i++] = prev;
          }
        } else if (sym === 17) {
          i += 3 + bits(3);
        } else {
          i += 11 + bits(7);
        }
      }
      lit = buildHuffman(lens.subarray(0, hlit), hlit);
      dist = buildHuffman(lens.subarray(hlit), hdist);
    } else {
      throw new Error("inflate: invalid block type");
    }
    for (; ; ) {
      const sym = decode(lit);
      if (sym < 256) {
        need(1);
        out[outLen++] = sym;
      } else if (sym === 256) {
        break;
      } else {
        const li = sym - 257;
        const len = LENGTH_BASE[li] + bits(LENGTH_EXTRA[li]);
        const di = decode(dist);
        const d = DIST_BASE[di] + bits(DIST_EXTRA[di]);
        need(len);
        for (let k = 0; k < len; k++) {
          out[outLen] = out[outLen - d];
          outLen++;
        }
      }
    }
  }
  return out.subarray(0, outLen);
}
var ADAM7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2]
];
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function unfilter(raw, offset, stride, rows, bpp) {
  let prev = -1;
  for (let y = 0; y < rows; y++) {
    const filter = raw[offset];
    const row = offset + 1;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? raw[row + i - bpp] : 0;
      const b = prev >= 0 ? raw[prev + i] : 0;
      const c = prev >= 0 && i >= bpp ? raw[prev + i - bpp] : 0;
      let v = raw[row + i];
      switch (filter) {
        case 1:
          v += a;
          break;
        case 2:
          v += b;
          break;
        case 3:
          v += a + b >> 1;
          break;
        case 4:
          v += paeth(a, b, c);
          break;
      }
      raw[row + i] = v & 255;
    }
    prev = row;
    offset = row + stride;
  }
  return offset;
}
async function decodePng(bytes) {
  if (!isPng(bytes)) {
    return null;
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = -1;
  let interlace = 0;
  let palette = null;
  let trns = null;
  const idat = [];
  let idatLen = 0;
  for (let p = 8; p + 12 <= bytes.length; ) {
    const len = dv.getUint32(p);
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    const body = bytes.subarray(p + 8, Math.min(bytes.length, p + 8 + len));
    if (type === "IHDR" && body.length >= 13) {
      width = dv.getUint32(p + 8);
      height = dv.getUint32(p + 12);
      depth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === "PLTE") {
      palette = body;
    } else if (type === "tRNS") {
      trns = body;
    } else if (type === "IDAT") {
      idat.push(body);
      idatLen += body.length;
    } else if (type === "IEND") {
      break;
    }
    p += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const validDepth = colorType === 0 ? [1, 2, 4, 8, 16].includes(depth) : colorType === 3 ? [1, 2, 4, 8].includes(depth) : [8, 16].includes(depth);
  if (!channels || !validDepth || width <= 0 || height <= 0 || idatLen === 0 || colorType === 3 && !palette) {
    return null;
  }
  if (width * height > 268435456) {
    return null;
  }
  const compressed = new Uint8Array(idatLen);
  let o = 0;
  for (const part of idat) {
    compressed.set(part, o);
    o += part.length;
  }
  let raw;
  try {
    raw = await inflateZlib(compressed);
  } catch {
    return null;
  }
  const bitsPerPixel = channels * depth;
  const bpp = Math.max(1, bitsPerPixel >> 3);
  const out = new Uint8ClampedArray(width * height * 4);
  const maxSample = (1 << depth) - 1;
  const keyGray = trns && colorType === 0 && trns.length >= 2 ? trns[0] << 8 | trns[1] : -1;
  const keyRgb = trns && colorType === 2 && trns.length >= 6 ? [trns[0] << 8 | trns[1], trns[2] << 8 | trns[3], trns[4] << 8 | trns[5]] : null;
  const sampleAt = (row, index) => {
    if (depth === 8) {
      return raw[row + index];
    }
    if (depth === 16) {
      return raw[row + index * 2] << 8 | raw[row + index * 2 + 1];
    }
    const bit = index * depth;
    return raw[row + (bit >> 3)] >> 8 - depth - (bit & 7) & maxSample;
  };
  const to8 = (v) => depth === 16 ? v >> 8 : depth === 8 ? v : Math.round(v * 255 / maxSample);
  const writeRow = (row, count, y, x0, dx) => {
    for (let i = 0; i < count; i++) {
      const di = (y * width + x0 + i * dx) * 4;
      if (colorType === 3) {
        const idx = sampleAt(row, i);
        out[di] = palette[idx * 3] ?? 0;
        out[di + 1] = palette[idx * 3 + 1] ?? 0;
        out[di + 2] = palette[idx * 3 + 2] ?? 0;
        out[di + 3] = trns && idx < trns.length ? trns[idx] : 255;
      } else if (colorType === 0 || colorType === 4) {
        const g = sampleAt(row, i * channels);
        const v = to8(g);
        out[di] = v;
        out[di + 1] = v;
        out[di + 2] = v;
        out[di + 3] = colorType === 4 ? to8(sampleAt(row, i * channels + 1)) : g === keyGray ? 0 : 255;
      } else {
        const r = sampleAt(row, i * channels);
        const g = sampleAt(row, i * channels + 1);
        const b = sampleAt(row, i * channels + 2);
        out[di] = to8(r);
        out[di + 1] = to8(g);
        out[di + 2] = to8(b);
        out[di + 3] = colorType === 6 ? to8(sampleAt(row, i * channels + 3)) : keyRgb && r === keyRgb[0] && g === keyRgb[1] && b === keyRgb[2] ? 0 : 255;
      }
    }
  };
  let offset = 0;
  const passes = interlace === 1 ? ADAM7 : [[0, 0, 1, 1]];
  for (const [px, py, sx, sy] of passes) {
    const pw = Math.ceil((width - px) / sx);
    const ph = Math.ceil((height - py) / sy);
    if (pw <= 0 || ph <= 0) {
      continue;
    }
    const stride = Math.ceil(pw * bitsPerPixel / 8);
    if (offset + ph * (stride + 1) > raw.length) {
      return null;
    }
    const start = offset;
    offset = unfilter(raw, offset, stride, ph, bpp);
    for (let r = 0; r < ph; r++) {
      writeRow(start + r * (stride + 1) + 1, pw, py + r * sy, px, sx);
    }
  }
  return { width, height, data: out };
}

// src/png-encoder.ts
var crcTable = null;
function crc32(bytes, start, end) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 4294967295;
  for (let i = start; i < end; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 255] ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
}
function adler32(bytes) {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; ) {
    const end = Math.min(bytes.length, i + 5552);
    for (; i < end; i++) {
      a += bytes[i];
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  return (b << 16 | a) >>> 0;
}
function zlibStored(raw) {
  const blocks = Math.max(1, Math.ceil(raw.length / 65535));
  const out = new Uint8Array(2 + raw.length + blocks * 5 + 4);
  out[0] = 120;
  out[1] = 1;
  let o = 2;
  for (let b = 0; b < blocks; b++) {
    const start = b * 65535;
    const len = Math.min(65535, raw.length - start);
    out[o++] = b === blocks - 1 ? 1 : 0;
    out[o++] = len & 255;
    out[o++] = len >>> 8;
    out[o++] = ~len & 255;
    out[o++] = ~len >>> 8 & 255;
    out.set(raw.subarray(start, start + len), o);
    o += len;
  }
  const ad = adler32(raw);
  out[o++] = ad >>> 24;
  out[o++] = ad >>> 16 & 255;
  out[o++] = ad >>> 8 & 255;
  out[o++] = ad & 255;
  return out;
}
async function zlibDeflate(raw) {
  if (typeof CompressionStream === "function" && typeof Response === "function") {
    try {
      const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
    }
  }
  return zlibStored(raw);
}
function paeth2(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function score(line, stride) {
  let s = 0;
  for (let i = 0; i < stride; i++) {
    const v = line[i];
    s += v < 128 ? v : 256 - v;
  }
  return s;
}
function filterScanlines(input, width, height) {
  const data = input instanceof Uint8Array || input instanceof Uint8ClampedArray ? new Uint8Array(input.buffer, input.byteOffset, input.length) : Uint8Array.from(input);
  const stride = width * 4;
  const words = data.byteOffset % 4 === 0 ? new Uint32Array(data.buffer, data.byteOffset, width * height) : null;
  const out = new Uint8Array((stride + 1) * height);
  const sub = new Uint8Array(stride);
  const up = new Uint8Array(stride);
  const pae = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    const prev = row - stride;
    const o = y * (stride + 1);
    if (words && y > 0) {
      const w0 = row >> 2;
      const p0 = prev >> 2;
      let same = true;
      for (let k = 0; k < width; k++) {
        if (words[w0 + k] !== words[p0 + k]) {
          same = false;
          break;
        }
      }
      if (same) {
        out[o] = 2;
        continue;
      }
    }
    const none = data.subarray(row, row + stride);
    const noneScore = score(none, stride);
    if (noneScore === 0) {
      out.set(none, o + 1);
      continue;
    }
    let subScore = 0;
    let upScore = 0;
    for (let i = 0; i < 4 && i < stride; i++) {
      const x = data[row + i];
      sub[i] = x;
      subScore += x < 128 ? x : 256 - x;
    }
    for (let i = 4; i < stride; i++) {
      const v = data[row + i] - data[row + i - 4] & 255;
      sub[i] = v;
      subScore += v < 128 ? v : 256 - v;
    }
    if (y > 0) {
      for (let i = 0; i < stride; i++) {
        const v = data[row + i] - data[prev + i] & 255;
        up[i] = v;
        upScore += v < 128 ? v : 256 - v;
      }
    } else {
      up.set(none);
      upScore = noneScore;
    }
    let best = none;
    let code = 0;
    let bestScore = noneScore;
    if (subScore < bestScore) {
      bestScore = subScore;
      best = sub;
      code = 1;
    }
    if (upScore < bestScore) {
      bestScore = upScore;
      best = up;
      code = 2;
    }
    if (y > 0 && bestScore > stride >> 3) {
      for (let i = 0; i < stride; i++) {
        const a = i >= 4 ? data[row + i - 4] : 0;
        const b = data[prev + i];
        const c = i >= 4 ? data[prev + i - 4] : 0;
        pae[i] = data[row + i] - paeth2(a, b, c) & 255;
      }
      const paethScore = score(pae, stride);
      if (paethScore < bestScore) {
        best = pae;
        code = 4;
      }
    }
    out[o] = code;
    out.set(best, o + 1);
  }
  return out;
}
function chunk(type, payload) {
  const out = new Uint8Array(12 + payload.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, payload.length);
  for (let i = 0; i < 4; i++) {
    out[4 + i] = type.charCodeAt(i);
  }
  out.set(payload, 8);
  dv.setUint32(8 + payload.length, crc32(out, 4, 8 + payload.length));
  return out;
}
async function encodePng(data, width, height) {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const idat = await zlibDeflate(filterScanlines(data, width, height));
  const parts = [
    Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0))
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    png.set(p, o);
    o += p.length;
  }
  return png;
}

// src/gdi-raster.ts
var SpanList = class {
  constructor() {
    /** Packed `(y, x0, x1)` triplets; only the first `length * 3` entries are valid. */
    this.data = new Int32Array(96);
    /** Number of spans. */
    this.length = 0;
  }
  /** Appends the span `x0 <= x < x1` on row `y` (ignored when empty). */
  add(y, x0, x1) {
    if (x1 <= x0) {
      return;
    }
    const n = this.length * 3;
    if (n > 0 && this.data[n - 3] === y && this.data[n - 1] === x0) {
      this.data[n - 1] = x1;
      return;
    }
    if (n + 3 > this.data.length) {
      const grown = new Int32Array(this.data.length * 2);
      grown.set(this.data);
      this.data = grown;
    }
    this.data[n] = y;
    this.data[n + 1] = x0;
    this.data[n + 2] = x1;
    this.length++;
  }
  /** Appends every span of `other`. */
  append(other) {
    for (let i = 0; i < other.length * 3; i += 3) {
      this.add(other.data[i], other.data[i + 1], other.data[i + 2]);
    }
  }
  /** The bounding box of all spans, or `null` when empty. `x1`/`y1` exclusive. */
  bounds() {
    if (this.length === 0) {
      return null;
    }
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const d = this.data;
    for (let i = 0; i < this.length * 3; i += 3) {
      if (d[i] < y0) y0 = d[i];
      if (d[i] + 1 > y1) y1 = d[i] + 1;
      if (d[i + 1] < x0) x0 = d[i + 1];
      if (d[i + 2] > x1) x1 = d[i + 2];
    }
    return { x0, y0, x1, y1 };
  }
};
function floorDiv(a, b) {
  return Math.floor(a / b);
}
function ceilDiv(a, b) {
  return -Math.floor(-a / b);
}
function fillPolygonSpans(polys, winding, out = new SpanList(), clipY0 = -Infinity, clipY1 = Infinity) {
  const edges = [];
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of polys) {
    const n = p.length >> 1;
    if (n < 2) {
      continue;
    }
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1;
      const xa = p[i * 2];
      const ya = p[i * 2 + 1];
      const xb = p[j * 2];
      const yb = p[j * 2 + 1];
      if (ya === yb) {
        continue;
      }
      const dir = yb > ya ? 1 : -1;
      const x0 = dir > 0 ? xa : xb;
      const y0 = dir > 0 ? ya : yb;
      const x1 = dir > 0 ? xb : xa;
      const y1 = dir > 0 ? yb : ya;
      const rTop = ceilDiv(y0, 16);
      const rBot = ceilDiv(y1, 16);
      if (rBot <= rTop) {
        continue;
      }
      edges.push([rTop, rBot, x0, y0, x1 - x0, y1 - y0, dir]);
      if (rTop < minY) minY = rTop;
      if (rBot > maxY) maxY = rBot;
    }
  }
  if (edges.length === 0) {
    return out;
  }
  edges.sort((a, b) => a[0] - b[0]);
  const yStart = Math.max(minY, Math.ceil(clipY0));
  const yEnd = Math.min(maxY, Math.floor(clipY1));
  const active = [];
  let next = 0;
  const xs = [];
  const dirs = [];
  while (next < edges.length && edges[next][1] <= yStart) {
    next++;
  }
  for (let y = yStart; y < yEnd; y++) {
    while (next < edges.length && edges[next][0] <= y) {
      if (edges[next][1] > y) {
        active.push(edges[next]);
      }
      next++;
    }
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i][1] <= y || active[i][0] > y) {
        if (active[i][1] <= y) {
          active.splice(i, 1);
        }
      }
    }
    xs.length = 0;
    dirs.length = 0;
    const fy = y * 16;
    for (const e of active) {
      if (e[0] > y) {
        continue;
      }
      const num = e[2] * e[5] + (fy - e[3]) * e[4];
      xs.push(ceilDiv(num, e[5] * 16));
      dirs.push(e[6]);
    }
    const n = xs.length;
    if (n < 2) {
      continue;
    }
    for (let i = 1; i < n; i++) {
      const x = xs[i];
      const d = dirs[i];
      let j = i - 1;
      while (j >= 0 && xs[j] > x) {
        xs[j + 1] = xs[j];
        dirs[j + 1] = dirs[j];
        j--;
      }
      xs[j + 1] = x;
      dirs[j + 1] = d;
    }
    if (!winding) {
      for (let i = 0; i + 1 < n; i += 2) {
        out.add(y, xs[i], xs[i + 1]);
      }
    } else {
      let w = 0;
      let start = 0;
      for (let i = 0; i < n; i++) {
        const before = w;
        w += dirs[i];
        if (before === 0 && w !== 0) {
          start = xs[i];
        } else if (before !== 0 && w === 0) {
          out.add(y, start, xs[i]);
        }
      }
    }
  }
  return out;
}
function diamondRule(dx, dy) {
  if (Math.abs(dx) !== Math.abs(dy)) {
    return 2 /* B */ | 8 /* R */;
  }
  if (dy > 0) {
    return 2 /* B */;
  }
  return dx > 0 ? 8 /* R */ | 128 /* BR */ : 4 /* L */ | 64 /* BL */;
}
function inDiamond(u, v, den, rule) {
  const s = Math.abs(u) + Math.abs(v);
  const lim = 8 * den;
  if (s < lim) {
    return true;
  }
  if (s > lim) {
    return false;
  }
  let part;
  if (u === 0) {
    part = v < 0 ? 1 /* T */ : 2 /* B */;
  } else if (v === 0) {
    part = u < 0 ? 4 /* L */ : 8 /* R */;
  } else if (u < 0) {
    part = v < 0 ? 16 /* TL */ : 64 /* BL */;
  } else {
    part = v < 0 ? 32 /* TR */ : 128 /* BR */;
  }
  return (rule & part) !== 0;
}
function cosmeticLine(x0, y0, x1, y1, plot) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  if (dx === 0 && dy === 0) {
    return;
  }
  const rule = diamondRule(dx, dy);
  const xMajor = Math.abs(dx) >= Math.abs(dy);
  const a0 = xMajor ? x0 : y0;
  const b0 = xMajor ? y0 : x0;
  const a1 = xMajor ? x1 : y1;
  const b1 = xMajor ? y1 : x1;
  const sa = a1 > a0 ? 1 : -1;
  const D = Math.abs(a1 - a0);
  const dbs = (b1 - b0) * sa;
  const diagonal = Math.abs(dx) === Math.abs(dy);
  const aMin = Math.min(a0, a1);
  const aMax = Math.max(a0, a1);
  const test = (u, v, den) => xMajor ? inDiamond(u, v, den, rule) : inDiamond(v, u, den, rule);
  const first = sa > 0 ? floorDiv(aMin, 16) - 1 : ceilDiv(aMax, 16) + 1;
  const last = sa > 0 ? ceilDiv(aMax, 16) + 1 : floorDiv(aMin, 16) - 1;
  for (let A = first; sa > 0 ? A <= last : A >= last; A += sa) {
    const ca = A * 16;
    const bN = b0 * D + (ca - a0) * dbs;
    const approx = bN / D / 16;
    const Bmid = Math.round(approx);
    for (let Bc = Bmid - 1; Bc <= Bmid + 1; Bc++) {
      const cb = Bc * 16;
      const dN = bN - cb * D;
      const umin = aMin - ca;
      const umax = aMax - ca;
      let hit;
      if (!diagonal) {
        const us = Math.max(umin, Math.min(0, umax));
        hit = test(us * D, dN + us * dbs, D);
      } else {
        const m = dbs / D;
        const d = dN / D;
        const ua = Math.max(umin, Math.min(0, umax));
        const ub = Math.max(umin, Math.min(-d / m, umax));
        hit = test(2 * ua, 2 * (d + m * ua), 2) || test(2 * ub, 2 * (d + m * ub), 2) || test(ua + ub, 2 * d + m * (ua + ub), 2);
      }
      if (!hit) {
        continue;
      }
      if (test(a1 - ca, b1 - cb, 1)) {
        continue;
      }
      if (xMajor) {
        plot(A, Bc);
      } else {
        plot(Bc, A);
      }
    }
  }
}
var HFD_INITIAL_SHIFT = 10;
var HFD_ADDITIONAL_SHIFT = 3;
var HFD_TEST_INITIAL = 6 * 10912;
var HFD_TEST_NORMAL = HFD_TEST_INITIAL * 8;
function sar(v, n) {
  return Math.floor(v / 2 ** n);
}
var HfdBasis = class {
  constructor(p0, p1, p2, p3) {
    const s = 2 ** HFD_INITIAL_SHIFT;
    this.e0 = p0 * s;
    this.e1 = (p3 - p0) * s;
    this.e2 = 6 * (p1 - p2 - p2 + p3) * s;
    this.e3 = 6 * (p0 - p1 - p1 + p2) * s;
  }
  lazyHalve(cShift) {
    this.e2 = sar(this.e2 + this.e3, 1);
    this.e1 = sar(this.e1 - sar(this.e2, cShift), 1);
  }
  steadyState(cShift) {
    const k = 2 ** HFD_ADDITIONAL_SHIFT;
    this.e0 *= k;
    this.e1 *= k;
    const l = cShift - HFD_ADDITIONAL_SHIFT;
    if (l < 0) {
      this.e2 *= 2 ** -l;
      this.e3 *= 2 ** -l;
    } else {
      this.e2 = sar(this.e2, l);
      this.e3 = sar(this.e3, l);
    }
  }
  halve() {
    this.e2 = sar(this.e2 + this.e3, 3);
    this.e1 = sar(this.e1 - this.e2, 1);
    this.e3 = sar(this.e3, 2);
  }
  double() {
    this.e1 += this.e1 + this.e2;
    this.e3 *= 4;
    this.e2 = this.e2 * 8 - this.e3;
  }
  step() {
    this.e0 += this.e1;
    const t = this.e2;
    this.e1 += t;
    this.e2 += t - this.e3;
    this.e3 = t;
  }
  error() {
    return Math.max(Math.abs(this.e2), Math.abs(this.e3));
  }
  parentErrorDividedBy4() {
    return Math.max(Math.abs(this.e3), Math.abs(this.e2 + this.e2 - this.e3));
  }
  value() {
    const total = HFD_INITIAL_SHIFT + HFD_ADDITIONAL_SHIFT;
    return sar(this.e0 + 2 ** (total - 1), total);
  }
};
function flattenBezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, out, tolerance = 1) {
  const testInitial = HFD_TEST_INITIAL * tolerance;
  const testNormal = HFD_TEST_NORMAL * tolerance;
  const x = new HfdBasis(p0x, p1x, p2x, p3x);
  const y = new HfdBasis(p0y, p1y, p2y, p3y);
  let cSteps = 1;
  let cShift = 0;
  while (cShift < 40 && (x.error() > testInitial * 2 ** cShift || y.error() > testInitial * 2 ** cShift)) {
    cShift += 2;
    x.lazyHalve(cShift);
    y.lazyHalve(cShift);
    cSteps *= 2;
  }
  x.steadyState(cShift);
  y.steadyState(cShift);
  for (let guard = 0; cSteps > 0 && guard < 1 << 20; guard++) {
    if (Math.max(x.error(), y.error()) > testNormal) {
      x.halve();
      y.halve();
      cSteps *= 2;
    }
    while (cSteps % 2 === 0 && x.parentErrorDividedBy4() <= testNormal / 4 && y.parentErrorDividedBy4() <= testNormal / 4) {
      x.double();
      y.double();
      cSteps /= 2;
    }
    cSteps--;
    x.step();
    y.step();
    out.push(x.value(), y.value());
  }
}
var KAPPA = 0.5522847498307936;
function axisBox(l, t, r, b) {
  return { ax: l, ay: t, exx: r - l, exy: 0, eyx: 0, eyy: b - t };
}
function ellipseBeziersBox(box, clockwise = false) {
  if (!clockwise) {
    return ellipsePoints(box, false);
  }
  const e = clockwiseEllipseBeziersBox(box);
  const out = [];
  for (let i = e.length - 2; i >= 0; i -= 2) {
    out.push(e[i], e[i + 1]);
  }
  return out;
}
function clockwiseEllipseBeziersBox(box) {
  return ellipsePoints(box, true);
}
function ellipsePoints(box, cwControls) {
  const half = (v, up) => up ? Math.ceil(v / 2) : Math.floor(v / 2);
  const hMidLo = (v) => half(v, false);
  const hMidHi = (v) => half(v, true);
  const hCtl = (v) => Math.floor(v / 2) + Math.ceil(KAPPA * Math.ceil(v / 2));
  const hCtl2 = (v) => Math.ceil(v / 2) - Math.ceil(KAPPA * Math.ceil(v / 2));
  const vMidLo = (v) => half(v, false);
  const vMidHi = (v) => half(v, true);
  const vCtl = (v) => Math.floor(v / 2) - Math.floor(KAPPA * Math.floor(v / 2));
  const vCtlR = (v) => v - vCtl(v);
  const vDist = (v) => Math.ceil(KAPPA * Math.floor(v / 2));
  const rightUpper = cwControls ? (v) => vMidHi(v) - vDist(v) : vCtl;
  const leftUpper = cwControls ? (v) => vMidLo(v) - vDist(v) : vCtl;
  const leftLower = cwControls ? (v) => vMidLo(v) + vDist(v) : vCtlR;
  const rightLower = cwControls ? (v) => vMidHi(v) + vDist(v) : vCtlR;
  const zero = () => 0;
  const full = (v) => v;
  const { ax, ay, exx, exy, eyx, eyy } = box;
  const out = [];
  const P = (gx, gy) => {
    out.push(ax + gx(exx) + gy(eyx), ay + gx(exy) + gy(eyy));
  };
  P(full, vMidHi);
  P(full, rightUpper);
  P(hCtl, zero);
  P(hMidLo, zero);
  P(hCtl2, zero);
  P(zero, leftUpper);
  P(zero, vMidLo);
  P(zero, leftLower);
  P(hCtl2, full);
  P(hMidHi, full);
  P(hCtl, full);
  P(full, rightLower);
  P(full, vMidHi);
  return out;
}
function ellipseBeziers(l, t, r, b) {
  return ellipseBeziersBox(axisBox(l, t, r, b));
}
function flattenBezierPath(pts) {
  const out = [pts[0], pts[1]];
  for (let i = 2; i + 5 < pts.length; i += 6) {
    flattenBezier(pts[i - 2], pts[i - 1], pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5], out);
  }
  return out;
}
function roundRectCorners(l, t, r, b, cw, ch) {
  const w = r - l;
  const h = b - t;
  let ew = Math.min(Math.abs(cw), w);
  let eh = Math.min(Math.abs(ch), h);
  if (ew === 0 || eh === 0) {
    ew = 0;
    eh = 0;
  }
  const hy = Math.floor(h / 2) - Math.floor((h - eh) / 2);
  const topX = Math.floor(r - ew / 2);
  const hx = r - topX;
  const q = [r, t + hy, r, t + hy - Math.floor(KAPPA * hy), r - hx + Math.ceil(KAPPA * hx), t, topX, t];
  const mx = (x) => l + r - x;
  const my = (y) => t + b - y;
  return [
    // top right: right edge -> top edge
    q[0],
    q[1],
    q[2],
    q[3],
    q[4],
    q[5],
    q[6],
    q[7],
    // top left: top edge -> left edge
    mx(q[6]),
    q[7],
    mx(q[4]),
    q[5],
    mx(q[2]),
    q[3],
    mx(q[0]),
    q[1],
    // bottom left: left edge -> bottom edge
    mx(q[0]),
    my(q[1]),
    mx(q[2]),
    my(q[3]),
    mx(q[4]),
    my(q[5]),
    mx(q[6]),
    my(q[7]),
    // bottom right: bottom edge -> right edge
    q[6],
    my(q[7]),
    q[4],
    my(q[5]),
    q[2],
    my(q[3]),
    q[0],
    my(q[1])
  ];
}
var TRIG_STEP = 2 * Math.PI / 128;
function tableTrig(fn) {
  return (a) => {
    let b = a % (2 * Math.PI);
    if (b < 0) {
      b += 2 * Math.PI;
    }
    const i = Math.floor(b / TRIG_STEP);
    const f = b / TRIG_STEP - i;
    return fn(i * TRIG_STEP) * (1 - f) + fn((i + 1) * TRIG_STEP) * f;
  };
}
var tableCos = tableTrig(Math.cos);
var tableSin = tableTrig(Math.sin);
function angleArcPieces(startDeg, sweepDeg) {
  const out = [];
  const arc = (from, to) => {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const pieces = Math.floor(hi / 90) - Math.floor(lo / 90) + 1;
    const cuts = [];
    for (let q = Math.floor(lo / 90) + 1; q * 90 < hi; q++) {
      cuts.push(q * 90);
    }
    if (to < from) {
      cuts.reverse();
    }
    const stops = [from, ...cuts, to];
    while (stops.length - 1 < pieces) {
      stops.push(to);
    }
    for (let i = 0; i + 1 < stops.length; i++) {
      out.push({ from: stops[i], to: stops[i + 1], first: i === 0 });
    }
  };
  const sign = sweepDeg < 0 ? -1 : 1;
  const turns = Math.min(8, Math.trunc(Math.abs(sweepDeg) / 360));
  const end = startDeg + sweepDeg - sign * turns * 360;
  arc(startDeg, end);
  for (let t = 1; t <= turns; t++) {
    arc(end + sign * 360 * (t - 1), startDeg + sign * 360 * t);
    arc(startDeg + sign * 360 * t, end + sign * 360 * t);
  }
  return out;
}
function circularArcBezier(cx, cy, rx, ry, fromDeg, toDeg) {
  const a = fromDeg * Math.PI / 180;
  const b = toDeg * Math.PI / 180;
  const k = 4 / 3 * Math.tan((b - a) / 4);
  const ax = cx + rx * tableCos(a);
  const ay = cy - ry * tableSin(a);
  const bx = cx + rx * tableCos(b);
  const by = cy - ry * tableSin(b);
  return [ax - k * rx * tableSin(a), ay - k * ry * tableCos(a), bx + k * rx * tableSin(b), by + k * ry * tableCos(b), bx, by];
}
function angleArcFix(box, startDeg, sweepDeg) {
  const l = Math.min(box.ax, box.ax + box.exx);
  const t = Math.min(box.ay, box.ay + box.eyy);
  const w = Math.abs(box.exx);
  const h = Math.abs(box.eyy);
  const cx = l + w / 2;
  const cy = t + h / 2;
  const E = ellipseBeziers(l, t, l + w, t + h);
  const Ecw = clockwiseEllipseBeziersBox(axisBox(l, t, l + w, t + h));
  const start = startDeg * Math.PI / 180;
  const out = [Math.round(cx + w / 2 * tableCos(start)), Math.round(cy - h / 2 * tableSin(start))];
  for (const p of angleArcPieces(startDeg, sweepDeg)) {
    const span = p.to - p.from;
    if (!p.first && Math.abs(span) === 90 && p.from % 90 === 0) {
      const q = Math.min(p.from, p.to) / 90;
      const qi = (q % 4 + 4) % 4 * 6;
      if (span > 0) {
        out.push(E[qi + 2], E[qi + 3], E[qi + 4], E[qi + 5], E[qi + 6], E[qi + 7]);
      } else {
        out.push(Ecw[qi + 4], Ecw[qi + 5], Ecw[qi + 2], Ecw[qi + 3], Ecw[qi], Ecw[qi + 1]);
      }
      continue;
    }
    for (const v of circularArcBezier(cx, cy, w / 2, h / 2, p.from, p.to)) {
      out.push(Math.round(v));
    }
  }
  return out;
}
function arcBeziers(l, t, r, b, xs, ys, xe, ye, clockwise) {
  const w = r - l;
  const h = b - t;
  const Q = Math.PI / 2;
  const rx = Math.ceil(w / 2);
  const ry = clockwise ? Math.ceil(h / 2) : Math.floor(h / 2);
  const cx = l + Math.ceil(w / 2);
  const cy = t + Math.ceil(h / 2);
  const tcx = (l + r) / 2;
  const tcy = (t + b) / 2;
  const angle = (x, y) => Math.atan2(-(y - tcy) / (h / 2 || 1), (x - tcx) / (w / 2 || 1));
  const a0 = angle(xs, ys);
  let a1 = angle(xe, ye);
  const s = clockwise ? -1 : 1;
  if (s > 0) {
    while (a1 <= a0) a1 += 2 * Math.PI;
  } else {
    while (a1 >= a0) a1 -= 2 * Math.PI;
  }
  const px = (a2) => cx + rx * tableCos(a2);
  const py = (a2) => cy - ry * tableSin(a2);
  const E = clockwise ? clockwiseEllipseBeziersBox(axisBox(l, t, r, b)) : ellipseBeziers(l, t, r, b);
  const out = [Math.round(px(a0)), Math.round(py(a0))];
  let a = a0;
  for (let guard = 0; guard < 8 && (s > 0 ? a < a1 - 1e-12 : a > a1 + 1e-12); guard++) {
    const next = s > 0 ? Math.floor(a / Q + 1e-9) * Q + Q : Math.ceil(a / Q - 1e-9) * Q - Q;
    const onBoundary = Math.abs(a / Q - Math.round(a / Q)) < 1e-9;
    if (onBoundary && (s > 0 ? next <= a1 + 1e-12 : next >= a1 - 1e-12)) {
      const qi = (Math.round(Math.min(a, next) / Q) % 4 + 4) % 4 * 6;
      if (s > 0) {
        out.push(E[qi + 2], E[qi + 3], E[qi + 4], E[qi + 5], E[qi + 6], E[qi + 7]);
      } else {
        out.push(E[qi + 4], E[qi + 5], E[qi + 2], E[qi + 3], E[qi], E[qi + 1]);
      }
      a = next;
      continue;
    }
    const e = s > 0 ? Math.min(next, a1) : Math.max(next, a1);
    const k = 4 / 3 * Math.tan((e - a) / 4);
    out.push(
      Math.round(px(a) - k * rx * tableSin(a)),
      Math.round(py(a) - k * ry * tableCos(a)),
      Math.round(px(e) + k * rx * tableSin(e)),
      Math.round(py(e) + k * ry * tableCos(e)),
      Math.round(px(e)),
      Math.round(py(e))
    );
    a = e;
  }
  return out;
}
var GdiRasterPath = class {
  constructor() {
    this.figures = [];
    /**
     * The path as `GetPath` reports it, before flattening: FIX points
     * (`[x0, y0, ...]`) and their `PT_*` types (`PT_MOVETO` 6, `PT_LINETO`
     * 2, `PT_BEZIERTO` 4, `PT_CLOSEFIGURE` 1 or-ed onto a figure's last
     * point). Used to check the geometry against Windows' own paths.
     */
    this.getPath = { pts: [], types: [] };
    this.current = null;
  }
  /** Starts a new figure at (`x`, `y`). */
  moveTo(x, y) {
    this.current = { pts: [x, y], closed: false };
    this.figures.push(this.current);
    this.log(x, y, 6);
  }
  /**
   * Starts a new figure at the current position (`x`, `y`) unless the open
   * figure already ends there. GDI opens a new figure for a drawing call
   * that continues from the current position (`LineTo`, `PolylineTo`,
   * `ArcTo`, ...) when the path is empty, its last figure is closed, or
   * the current position has moved away from the path's last point (a
   * `MoveTo`, or a call such as `Polyline`, `Arc` or `PolyPolygon` that
   * adds to the path without moving the current position; Windows'
   * `GetPath`, Wine `gdi32/tests/path.c`, `test_all_functions`).
   */
  continueAt(x, y) {
    const f = this.current;
    if (f && f.pts[f.pts.length - 2] === x && f.pts[f.pts.length - 1] === y) {
      return;
    }
    this.moveTo(x, y);
  }
  /** True when a figure is open (not closed and not ended by an appended path). */
  hasOpenFigure() {
    return this.current !== null;
  }
  log(x, y, type) {
    this.getPath.pts.push(x, y);
    this.getPath.types.push(type);
  }
  /** Adds a line to (`x`, `y`), starting a figure there when none is open. */
  lineTo(x, y) {
    if (!this.current) {
      const last = this.lastPoint();
      this.moveTo(last ? last[0] : x, last ? last[1] : y);
    }
    this.current.pts.push(x, y);
    this.log(x, y, 2);
  }
  /** Adds a cubic Bezier from the current point. */
  bezierTo(c1x, c1y, c2x, c2y, x, y) {
    if (!this.current) {
      const last = this.lastPoint();
      this.moveTo(last ? last[0] : c1x, last ? last[1] : c1y);
    }
    const p = this.current.pts;
    this.flattenInto(p[p.length - 2], p[p.length - 1], c1x, c1y, c2x, c2y, x, y);
    this.log(c1x, c1y, 4);
    this.log(c2x, c2y, 4);
    this.log(x, y, 4);
  }
  /** Flattens one Bezier onto the open figure, recording its end tangents. */
  flattenInto(x0, y0, c1x, c1y, c2x, c2y, x3, y3) {
    const f = this.current;
    const first = f.pts.length / 2 - 1;
    flattenBezier(x0, y0, c1x, c1y, c2x, c2y, x3, y3, f.pts);
    const last = f.pts.length / 2 - 2;
    if (last <= first) {
      return;
    }
    const tangent = (ax, ay, bx, by, cx, cy, dx, dy) => {
      if (bx !== ax || by !== ay) return [bx - ax, by - ay];
      if (cx !== ax || cy !== ay) return [cx - ax, cy - ay];
      if (dx !== ax || dy !== ay) return [dx - ax, dy - ay];
      return null;
    };
    const t0 = tangent(x0, y0, c1x, c1y, c2x, c2y, x3, y3);
    const t1 = tangent(c2x, c2y, x3, y3, x3, y3, x3, y3) ?? tangent(c1x, c1y, x3, y3, x3, y3, x3, y3) ?? tangent(x0, y0, x3, y3, x3, y3, x3, y3);
    f.tangents ?? (f.tangents = /* @__PURE__ */ new Map());
    if (t0) f.tangents.set(first, t0);
    if (t1) f.tangents.set(last, t1);
  }
  /**
   * Appends Beziers given as `1 + 3n` flat points; the first point is
   * joined with a line (or starts the figure when `move`).
   */
  addBeziers(pts, move) {
    if (move) {
      this.moveTo(pts[0], pts[1]);
    } else {
      this.lineTo(pts[0], pts[1]);
    }
    for (let i = 2; i + 5 < pts.length; i += 6) {
      this.flattenInto(pts[i - 2], pts[i - 1], pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5]);
      for (let k = i; k < i + 6; k += 2) {
        this.log(pts[k], pts[k + 1], 4);
      }
    }
  }
  /** Closes the open figure (the next drawing call starts a new one). */
  closeFigure() {
    if (this.current) {
      this.current.closed = true;
      this.current = null;
      const t = this.getPath.types;
      t[t.length - 1] |= 1;
    }
  }
  /** Appends every figure of `other`. */
  append(other) {
    for (const f of other.figures) {
      this.figures.push({ pts: f.pts.slice(), closed: f.closed, tangents: f.tangents && new Map(f.tangents) });
    }
    for (let i = 0; i < other.getPath.types.length; i++) {
      this.log(other.getPath.pts[2 * i], other.getPath.pts[2 * i + 1], other.getPath.types[i]);
    }
    this.current = null;
  }
  lastPoint() {
    const f = this.figures[this.figures.length - 1];
    if (!f) {
      return null;
    }
    return f.closed ? [f.pts[0], f.pts[1]] : [f.pts[f.pts.length - 2], f.pts[f.pts.length - 1]];
  }
};
function fillPathSpans(path, winding, out) {
  return fillPolygonSpans(
    path.figures.map((f) => f.pts),
    winding,
    out
  );
}
function cosmeticStyle(style, userStyle) {
  switch (style & 15) {
    case 1:
      return [18, 6];
    case 2:
      return [3, 3];
    case 3:
      return [9, 6, 3, 6];
    case 4:
      return [9, 3, 3, 3, 3, 3];
    case 7:
      return userStyle && userStyle.length > 0 && userStyle.some((v) => v > 0) ? userStyle.map((v) => Math.max(0, v) * 3) : null;
    case 8:
      return [1, 1];
    default:
      return null;
  }
}
function geometricStyle(flags, width, userStyle, userScale = 1) {
  const w = Math.max(width, 1);
  switch (flags & 15) {
    case 1:
      return [3 * w, w];
    case 2:
      return [w, w];
    case 3:
      return [3 * w, w, w, w];
    case 4:
      return [3 * w, w, w, w, w, w];
    case 7:
      return userStyle && userStyle.some((v) => v > 0) ? userStyle.map((v) => Math.max(0, v) * userScale) : null;
    default:
      return null;
  }
}
function styleGapsUseBackground(style) {
  const s = style & 15;
  return s >= 1 && s <= 4;
}
function strokeCosmetic(path, on, off, pattern, style = { pos: 0 }, resetPerFigure = true) {
  let period = 0;
  if (pattern) {
    for (const v of pattern) {
      period += v;
    }
  }
  const plot = (x, y) => {
    if (!pattern || period === 0) {
      on.add(y, x, x + 1);
      return;
    }
    let p = style.pos % period;
    style.pos++;
    for (let i = 0; i < pattern.length; i++) {
      if (p < pattern[i]) {
        if (i % 2 === 0) {
          on.add(y, x, x + 1);
        } else if (off) {
          off.add(y, x, x + 1);
        }
        return;
      }
      p -= pattern[i];
    }
  };
  path.figures.forEach((f, fi) => {
    if (fi > 0 && resetPerFigure) {
      style.pos = 0;
    }
    const p = f.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      cosmeticLine(p[i], p[i + 1], p[i + 2], p[i + 3], plot);
    }
    if (f.closed && p.length >= 4) {
      const n = p.length;
      if (p[n - 2] !== p[0] || p[n - 1] !== p[1]) {
        cosmeticLine(p[n - 2], p[n - 1], p[0], p[1], plot);
      }
    }
  });
}

// src/canvas-path.ts
var IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];
function multiplyMatrix(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5]
  ];
}
function invertMatrix(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!det || !Number.isFinite(det)) {
    return null;
  }
  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det
  ];
}
var PathBuilder = class _PathBuilder {
  constructor() {
    /** The segments, in device space. */
    this.segs = [];
    /** Current point and subpath start, in device space. */
    this.cur = null;
    this.start = null;
  }
  reset() {
    this.segs = [];
    this.cur = null;
    this.start = null;
  }
  moveDevice(p) {
    this.segs.push({ t: "M", x: p.x, y: p.y });
    this.cur = p;
    this.start = p;
  }
  lineDevice(p) {
    if (!this.cur) {
      this.moveDevice(p);
      return;
    }
    this.segs.push({ t: "L", x: p.x, y: p.y });
    this.cur = p;
  }
  static map(m, x, y) {
    return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
  }
  moveTo(m, x, y) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      this.moveDevice(_PathBuilder.map(m, x, y));
    }
  }
  lineTo(m, x, y) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      this.lineDevice(_PathBuilder.map(m, x, y));
    }
  }
  curveUser(m, x1, y1, x2, y2, x, y) {
    const p1 = _PathBuilder.map(m, x1, y1);
    const p2 = _PathBuilder.map(m, x2, y2);
    const p = _PathBuilder.map(m, x, y);
    if (!this.cur) {
      this.moveDevice(p1);
    }
    this.segs.push({ t: "C", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, x: p.x, y: p.y });
    this.cur = p;
  }
  bezierCurveTo(m, x1, y1, x2, y2, x, y) {
    if ([x1, y1, x2, y2, x, y].every(Number.isFinite)) {
      this.curveUser(m, x1, y1, x2, y2, x, y);
    }
  }
  quadraticCurveTo(m, cx, cy, x, y) {
    if (![cx, cy, x, y].every(Number.isFinite)) {
      return;
    }
    const i = invertMatrix(m);
    const p0 = this.cur && i ? { x: i[0] * this.cur.x + i[2] * this.cur.y + i[4], y: i[1] * this.cur.x + i[3] * this.cur.y + i[5] } : { x: cx, y: cy };
    this.curveUser(
      m,
      p0.x + 2 / 3 * (cx - p0.x),
      p0.y + 2 / 3 * (cy - p0.y),
      x + 2 / 3 * (cx - x),
      y + 2 / 3 * (cy - y),
      x,
      y
    );
  }
  closePath() {
    if (this.cur) {
      this.segs.push({ t: "Z" });
      this.cur = this.start;
    }
  }
  rect(m, x, y, w, h) {
    if ([x, y, w, h].every(Number.isFinite)) {
      this.moveDevice(_PathBuilder.map(m, x, y));
      this.lineDevice(_PathBuilder.map(m, x + w, y));
      this.lineDevice(_PathBuilder.map(m, x + w, y + h));
      this.lineDevice(_PathBuilder.map(m, x, y + h));
      this.segs.push({ t: "Z" });
      this.moveDevice(_PathBuilder.map(m, x, y));
    }
  }
  /** Appends an elliptical arc as cubic Beziers (user space, then mapped). */
  ellipseUser(m, cx, cy, rx, ry, rotation, startAngle, endAngle, ccw) {
    const TAU = Math.PI * 2;
    let sweep = endAngle - startAngle;
    if (!ccw) {
      sweep = sweep >= TAU ? TAU : (sweep % TAU + TAU) % TAU;
    } else {
      sweep = -sweep >= TAU ? -TAU : -((-sweep % TAU + TAU) % TAU);
    }
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const pt = (t) => {
      const ex = rx * Math.cos(t);
      const ey = ry * Math.sin(t);
      return { x: cx + ex * cosR - ey * sinR, y: cy + ex * sinR + ey * cosR };
    };
    const deriv = (t) => {
      const ex = -rx * Math.sin(t);
      const ey = ry * Math.cos(t);
      return { x: ex * cosR - ey * sinR, y: ex * sinR + ey * cosR };
    };
    const s = pt(startAngle);
    this.lineDevice(_PathBuilder.map(m, s.x, s.y));
    if (sweep === 0) {
      return;
    }
    const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9));
    const step = sweep / n;
    const k = 4 / 3 * Math.tan(step / 4);
    for (let i = 0; i < n; i++) {
      const t0 = startAngle + i * step;
      const t1 = t0 + step;
      const p0 = pt(t0);
      const p1 = pt(t1);
      const d0 = deriv(t0);
      const d1 = deriv(t1);
      this.curveUser(m, p0.x + k * d0.x, p0.y + k * d0.y, p1.x - k * d1.x, p1.y - k * d1.y, p1.x, p1.y);
    }
  }
  ellipse(m, x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise = false) {
    if (rx < 0 || ry < 0) {
      throw new RangeError("The radii provided are negative");
    }
    if ([x, y, rx, ry, rotation, startAngle, endAngle].every(Number.isFinite)) {
      this.ellipseUser(m, x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise);
    }
  }
  arc(m, x, y, r, startAngle, endAngle, counterclockwise = false) {
    if (r < 0) {
      throw new RangeError("The radius provided is negative");
    }
    if ([x, y, r, startAngle, endAngle].every(Number.isFinite)) {
      this.ellipseUser(m, x, y, r, r, 0, startAngle, endAngle, counterclockwise);
    }
  }
  arcTo(m, x1, y1, x2, y2, r) {
    if (![x1, y1, x2, y2, r].every(Number.isFinite) || r < 0) {
      return;
    }
    if (!this.cur) {
      this.moveDevice(_PathBuilder.map(m, x1, y1));
      return;
    }
    const i = invertMatrix(m);
    if (!i) {
      return;
    }
    const x0 = i[0] * this.cur.x + i[2] * this.cur.y + i[4];
    const y0 = i[1] * this.cur.x + i[3] * this.cur.y + i[5];
    const v1x = x0 - x1;
    const v1y = y0 - y1;
    const v2x = x2 - x1;
    const v2y = y2 - y1;
    const l1 = Math.hypot(v1x, v1y);
    const l2 = Math.hypot(v2x, v2y);
    const cross = v1x * v2y - v1y * v2x;
    if (r === 0 || l1 === 0 || l2 === 0 || Math.abs(cross) < 1e-12 * l1 * l2) {
      this.lineDevice(_PathBuilder.map(m, x1, y1));
      return;
    }
    const u1x = v1x / l1;
    const u1y = v1y / l1;
    const u2x = v2x / l2;
    const u2y = v2y / l2;
    const theta = Math.acos(Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y)));
    const dist = r / Math.tan(theta / 2);
    const t1 = { x: x1 + u1x * dist, y: y1 + u1y * dist };
    const t2 = { x: x1 + u2x * dist, y: y1 + u2y * dist };
    const bx = u1x + u2x;
    const by = u1y + u2y;
    const bl = Math.hypot(bx, by);
    const cd = r / Math.sin(theta / 2);
    const c = { x: x1 + bx / bl * cd, y: y1 + by / bl * cd };
    const a1 = Math.atan2(t1.y - c.y, t1.x - c.x);
    const a2 = Math.atan2(t2.y - c.y, t2.x - c.x);
    let delta = a2 - a1;
    while (delta > Math.PI) {
      delta -= 2 * Math.PI;
    }
    while (delta <= -Math.PI) {
      delta += 2 * Math.PI;
    }
    this.ellipseUser(m, c.x, c.y, r, r, 0, a1, a1 + delta, delta < 0);
  }
};
function flattenPath(segs2, tolerance, cubicSegments2) {
  const out = [];
  let cur = null;
  let sx = 0;
  let sy = 0;
  let lx = 0;
  let ly = 0;
  const begin = (x, y) => {
    const p = { pts: [x, y], smooth: [false], closed: false };
    out.push(p);
    return p;
  };
  for (const s of segs2) {
    switch (s.t) {
      case "M":
        cur = begin(s.x, s.y);
        sx = lx = s.x;
        sy = ly = s.y;
        break;
      case "L":
        if (!cur) {
          cur = begin(sx, sy);
        }
        cur.pts.push(s.x, s.y);
        cur.smooth.push(false);
        lx = s.x;
        ly = s.y;
        break;
      case "C": {
        if (!cur) {
          cur = begin(sx, sy);
        }
        const ddx = Math.max(Math.abs(lx - 2 * s.x1 + s.x2), Math.abs(s.x1 - 2 * s.x2 + s.x));
        const ddy = Math.max(Math.abs(ly - 2 * s.y1 + s.y2), Math.abs(s.y1 - 2 * s.y2 + s.y));
        const dd = Math.hypot(ddx, ddy);
        const n = cubicSegments2 ? cubicSegments2(lx, ly, s.x1, s.y1, s.x2, s.y2, s.x, s.y) : Math.max(1, Math.min(1e3, Math.ceil(Math.sqrt(0.75 * dd / tolerance))));
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          const u = 1 - t;
          const a = u * u * u;
          const b = 3 * u * u * t;
          const c = 3 * u * t * t;
          const d = t * t * t;
          cur.pts.push(a * lx + b * s.x1 + c * s.x2 + d * s.x, a * ly + b * s.y1 + c * s.y2 + d * s.y);
          cur.smooth.push(i < n);
        }
        lx = s.x;
        ly = s.y;
        break;
      }
      case "Z":
        if (cur) {
          cur.closed = true;
          cur = null;
          lx = sx;
          ly = sy;
        }
        break;
    }
  }
  return out;
}
function pointInPolylines(polys, x, y, rule) {
  let winding = 0;
  let crossings = 0;
  for (const poly of polys) {
    const p = poly.pts;
    const n = p.length / 2;
    if (n < 2) {
      continue;
    }
    for (let i = 0; i < n; i++) {
      const x0 = p[i * 2];
      const y0 = p[i * 2 + 1];
      const j = i + 1 < n ? i + 1 : 0;
      const x1 = p[j * 2];
      const y1 = p[j * 2 + 1];
      if (y0 <= y ? y1 > y : y1 <= y) {
        const xi = x0 + (y - y0) * (x1 - x0) / (y1 - y0);
        if (xi > x) {
          crossings++;
          winding += y1 > y0 ? 1 : -1;
        }
      }
    }
  }
  return rule === "evenodd" ? (crossings & 1) === 1 : winding !== 0;
}

// src/software-raster-coverage.ts
var BAND_CELLS = 1 << 20;
var accBuffer = new Float64Array(0);
var markBuffer = new Uint8Array(0);
var touched = [];
var segs = new Float64Array(0);
function growSegs(need) {
  if (segs.length < need) {
    const next = new Float64Array(Math.max(need, segs.length * 2, 1024));
    next.set(segs);
    segs = next;
  }
}
function accumulateLine(acc, mark, stride, rows, width, x0, y0, x1, y1) {
  if (y0 === y1) {
    return;
  }
  let dir = 1;
  if (y0 > y1) {
    dir = -1;
    let t = x0;
    x0 = x1;
    x1 = t;
    t = y0;
    y0 = y1;
    y1 = t;
  }
  const top = Math.max(0, y0);
  const bottom = Math.min(rows, y1);
  if (top >= bottom) {
    return;
  }
  const add = (row, cell, v) => {
    const i = row * stride + cell;
    acc[i] += v;
    if (!mark[i]) {
      mark[i] = 1;
      touched[row].push(cell);
    }
  };
  const dxdy = (x1 - x0) / (y1 - y0);
  let x = Math.min(width, Math.max(0, x0 + (top - y0) * dxdy));
  const rowEnd = Math.ceil(bottom);
  for (let row = Math.floor(top); row < rowEnd; row++) {
    const dy = Math.min(row + 1, bottom) - Math.max(row, top);
    let xnext = x + dxdy * dy;
    if (xnext < 0) {
      xnext = 0;
    } else if (xnext > width) {
      xnext = width;
    }
    const d = dy * dir;
    const lo = x < xnext ? x : xnext;
    const hi = x < xnext ? xnext : x;
    const loFloor = Math.floor(lo);
    const hiCeil = Math.ceil(hi);
    if (hiCeil <= loFloor + 1) {
      const xmf = 0.5 * (x + xnext) - loFloor;
      add(row, loFloor, d - d * xmf);
      add(row, loFloor + 1, d * xmf);
    } else {
      const s = 1 / (hi - lo);
      const x0f = lo - loFloor;
      const a0 = 0.5 * s * (1 - x0f) * (1 - x0f);
      const x1f = hi - hiCeil + 1;
      const am = 0.5 * s * x1f * x1f;
      add(row, loFloor, d * a0);
      if (hiCeil === loFloor + 2) {
        add(row, loFloor + 1, d * (1 - a0 - am));
      } else {
        const a1 = s * (1.5 - x0f);
        add(row, loFloor + 1, d * (a1 - a0));
        for (let xi = loFloor + 2; xi < hiCeil - 1; xi++) {
          add(row, xi, d * s);
        }
        const a2 = a1 + (hiCeil - loFloor - 3) * s;
        add(row, hiCeil - 1, d * (1 - a2 - am));
      }
      add(row, hiCeil, d * am);
    }
    x = xnext;
  }
}
function levelOf(sum, evenOdd) {
  let c;
  if (evenOdd) {
    let a = Math.abs(sum);
    a -= 2 * Math.floor(a / 2);
    c = a > 1 ? 2 - a : a;
  } else {
    c = Math.abs(sum);
    if (c > 1) {
      c = 1;
    }
  }
  return Math.round(c * 255);
}
var byNumber = (a, b) => a - b;
function rasterizeRings(rings, rule, bounds, sink) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rings) {
    for (let i = 0; i + 1 < r.length; i += 2) {
      const x = r[i];
      const y = r[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!(minX <= maxX) || !(minY <= maxY) || !Number.isFinite(minX + maxX + minY + maxY)) {
    return null;
  }
  const bx0 = Math.max(bounds.x0, Math.floor(minX));
  const by0 = Math.max(bounds.y0, Math.floor(minY));
  const bx1 = Math.min(bounds.x1, Math.ceil(maxX));
  const by1 = Math.min(bounds.y1, Math.ceil(maxY));
  if (bx1 <= bx0 || by1 <= by0) {
    return null;
  }
  const width = bx1 - bx0;
  let count = 0;
  const push = (xa, ya, xb, yb) => {
    if (ya === yb) {
      return;
    }
    growSegs((count + 1) * 4);
    segs[count * 4] = xa;
    segs[count * 4 + 1] = ya;
    segs[count * 4 + 2] = xb;
    segs[count * 4 + 3] = yb;
    count++;
  };
  const clipX = (xa, ya, xb, yb) => {
    if (ya === yb || Math.max(ya, yb) <= by0 || Math.min(ya, yb) >= by1) {
      return;
    }
    if (xa >= width && xb >= width) {
      return;
    }
    if (xa > width || xb > width) {
      const t = (width - xa) / (xb - xa);
      const ym = ya + (yb - ya) * t;
      if (xa > width) {
        xa = width;
        ya = ym;
      } else {
        xb = width;
        yb = ym;
      }
    }
    if (xa <= 0 && xb <= 0) {
      push(0, ya, 0, yb);
      return;
    }
    if (xa < 0 || xb < 0) {
      const t = (0 - xa) / (xb - xa);
      const ym = ya + (yb - ya) * t;
      if (xa < 0) {
        push(0, ya, 0, ym);
        push(0, ym, xb, yb);
      } else {
        push(xa, ya, 0, ym);
        push(0, ym, 0, yb);
      }
      return;
    }
    push(xa, ya, xb, yb);
  };
  for (const r of rings) {
    const n = r.length >> 1;
    if (n < 2) {
      continue;
    }
    for (let i = 0; i < n; i++) {
      const j = i + 1 < n ? i + 1 : 0;
      clipX(r[i * 2] - bx0, r[i * 2 + 1], r[j * 2] - bx0, r[j * 2 + 1]);
    }
  }
  if (count === 0) {
    return null;
  }
  const stride = width + 2;
  const bandRows = Math.max(1, Math.min(by1 - by0, Math.floor(BAND_CELLS / stride)));
  if (accBuffer.length < bandRows * stride) {
    accBuffer = new Float64Array(bandRows * stride);
    markBuffer = new Uint8Array(bandRows * stride);
  }
  while (touched.length < bandRows) {
    touched.push([]);
  }
  const acc = accBuffer;
  const mark = markBuffer;
  const evenOdd = rule === "evenodd";
  for (let bandTop = by0; bandTop < by1; bandTop += bandRows) {
    const rows = Math.min(bandRows, by1 - bandTop);
    for (let s = 0; s < count; s++) {
      const o = s * 4;
      const ya = segs[o + 1] - bandTop;
      const yb = segs[o + 3] - bandTop;
      if (ya <= 0 && yb <= 0 || ya >= rows && yb >= rows) {
        continue;
      }
      accumulateLine(acc, mark, stride, rows, width, segs[o], ya, segs[o + 2], yb);
    }
    for (let row = 0; row < rows; row++) {
      const cells = touched[row];
      if (cells.length === 0) {
        continue;
      }
      cells.sort(byNumber);
      const base = row * stride;
      const y = bandTop + row;
      let sum = 0;
      for (let k = 0; k < cells.length; k++) {
        const cell = cells[k];
        sum += acc[base + cell];
        acc[base + cell] = 0;
        mark[base + cell] = 0;
        if (cell >= width) {
          continue;
        }
        const next = k + 1 < cells.length ? Math.min(cells[k + 1], width) : width;
        const level = levelOf(sum, evenOdd);
        if (level) {
          sink(y, bx0 + cell, bx0 + next, level);
        }
      }
      cells.length = 0;
    }
  }
  return { x0: bx0, y0: by0, x1: bx1, y1: by1 };
}

// src/software-raster-paint.ts
var NAMED_COLORS = {
  black: 0,
  white: 16777215,
  red: 16711680,
  lime: 65280,
  green: 32768,
  blue: 255,
  yellow: 16776960,
  cyan: 65535,
  aqua: 65535,
  magenta: 16711935,
  fuchsia: 16711935,
  gray: 8421504,
  grey: 8421504,
  silver: 12632256,
  maroon: 8388608,
  olive: 8421376,
  teal: 32896,
  navy: 128,
  purple: 8388736,
  orange: 16753920,
  darkgray: 11119017,
  darkgrey: 11119017,
  lightgray: 13882323,
  lightgrey: 13882323,
  dimgray: 6908265,
  dimgrey: 6908265,
  whitesmoke: 16119285,
  gainsboro: 14474460
};
var colorCache = /* @__PURE__ */ new Map();
function parseColor(input) {
  const cached = colorCache.get(input);
  if (cached !== void 0) {
    return cached;
  }
  const result = parseColorUncached(input.trim().toLowerCase());
  if (colorCache.size > 4096) {
    colorCache.clear();
  }
  colorCache.set(input, result);
  return result;
}
function parseColorUncached(s) {
  if (s === "transparent") {
    return [0, 0, 0, 0];
  }
  if (s[0] === "#") {
    const h = s.slice(1);
    if (!/^[0-9a-f]+$/.test(h)) {
      return null;
    }
    if (h.length === 3 || h.length === 4) {
      const v = [...h].map((c) => parseInt(c + c, 16));
      return [v[0], v[1], v[2], h.length === 4 ? v[3] / 255 : 1];
    }
    if (h.length === 6 || h.length === 8) {
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
        h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
      ];
    }
    return null;
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(s);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) {
      return null;
    }
    const ch = (v) => {
      const n = v.endsWith("%") ? parseFloat(v) * 255 / 100 : parseFloat(v);
      return Math.max(0, Math.min(255, Math.round(n)));
    };
    const alpha = parts.length > 3 ? parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]) : 1;
    const rgb2 = [ch(parts[0]), ch(parts[1]), ch(parts[2])];
    if (rgb2.some((v) => !Number.isFinite(v)) || !Number.isFinite(alpha)) {
      return null;
    }
    return [rgb2[0], rgb2[1], rgb2[2], Math.max(0, Math.min(1, alpha))];
  }
  const named = NAMED_COLORS[s];
  return named === void 0 ? null : [named >> 16 & 255, named >> 8 & 255, named & 255, 1];
}
var SoftwareGradient = class {
  constructor(kind, coords) {
    this.kind = kind;
    this.coords = coords;
    this.stops = [];
    this.sorted = null;
  }
  addColorStop(offset, color) {
    if (!(offset >= 0 && offset <= 1)) {
      throw new RangeError("Gradient stop offset out of range");
    }
    const c = parseColor(color);
    if (!c) {
      throw new SyntaxError(`Invalid colour: ${color}`);
    }
    this.stops.push({ offset, color: c });
    this.sorted = null;
  }
  /** Stops ordered by offset; equal offsets keep insertion order. */
  sortedStops() {
    if (!this.sorted) {
      this.sorted = this.stops.map((s, i) => ({ s, i })).sort((a, b) => a.s.offset - b.s.offset || a.i - b.i).map((e) => e.s);
    }
    return this.sorted;
  }
};
var SoftwarePattern = class {
  constructor(data, width, height, repetition) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.repetition = repetition;
    this.matrix = [1, 0, 0, 1, 0, 0];
  }
  setTransform(m) {
    const next = [m?.a ?? 1, m?.b ?? 0, m?.c ?? 0, m?.d ?? 1, m?.e ?? 0, m?.f ?? 0];
    if (next.every(Number.isFinite)) {
      this.matrix = next;
    }
  }
};
function gradientColor(stops, t, out) {
  let c;
  const n = stops.length;
  if (t <= stops[0].offset) {
    c = stops[0].color;
  } else if (t >= stops[n - 1].offset) {
    c = stops[n - 1].color;
  } else {
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = lo + hi >> 1;
      if (stops[mid].offset <= t) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const a = stops[lo];
    const b = stops[hi];
    const span = b.offset - a.offset;
    const f = span > 0 ? (t - a.offset) / span : 1;
    const alpha = a.color[3] + (b.color[3] - a.color[3]) * f;
    out[0] = (a.color[0] + (b.color[0] - a.color[0]) * f) * alpha;
    out[1] = (a.color[1] + (b.color[1] - a.color[1]) * f) * alpha;
    out[2] = (a.color[2] + (b.color[2] - a.color[2]) * f) * alpha;
    out[3] = alpha * 255;
    return;
  }
  out[0] = c[0] * c[3];
  out[1] = c[1] * c[3];
  out[2] = c[2] * c[3];
  out[3] = c[3] * 255;
}
function gradientShader(g, fillTransform) {
  const stops = g.sortedStops();
  const inv2 = invertMatrix(fillTransform);
  if (stops.length === 0 || !inv2) {
    return null;
  }
  const c = g.coords;
  if (g.kind === "linear") {
    const [x02, y02, x12, y12] = c;
    const dx = x12 - x02;
    const dy = y12 - y02;
    const len2 = dx * dx + dy * dy;
    if (!(len2 > 0)) {
      return null;
    }
    return {
      shade(x, y, out) {
        const px = x + 0.5;
        const py = y + 0.5;
        const ux = inv2[0] * px + inv2[2] * py + inv2[4];
        const uy = inv2[1] * px + inv2[3] * py + inv2[5];
        gradientColor(stops, ((ux - x02) * dx + (uy - y02) * dy) / len2, out);
        return true;
      }
    };
  }
  const [x0, y0, r0, x1, y1, r1] = c;
  if (x0 === x1 && y0 === y1 && r0 === r1) {
    return null;
  }
  const cdx = x1 - x0;
  const cdy = y1 - y0;
  const dr = r1 - r0;
  const a = cdx * cdx + cdy * cdy - dr * dr;
  return {
    shade(x, y, out) {
      const px = x + 0.5;
      const py = y + 0.5;
      const ux = inv2[0] * px + inv2[2] * py + inv2[4] - x0;
      const uy = inv2[1] * px + inv2[3] * py + inv2[5] - y0;
      const b = ux * cdx + uy * cdy + r0 * dr;
      const cc = ux * ux + uy * uy - r0 * r0;
      let t;
      if (Math.abs(a) < 1e-12) {
        if (Math.abs(b) < 1e-12) {
          return false;
        }
        t = cc / (2 * b);
        if (r0 + t * dr < 0) {
          return false;
        }
      } else {
        const disc = b * b - a * cc;
        if (disc < 0) {
          return false;
        }
        const sq = Math.sqrt(disc);
        const t1 = (b + sq) / a;
        const t2 = (b - sq) / a;
        const hiT = Math.max(t1, t2);
        const loT = Math.min(t1, t2);
        if (r0 + hiT * dr >= 0) {
          t = hiT;
        } else if (r0 + loT * dr >= 0) {
          t = loT;
        } else {
          return false;
        }
      }
      gradientColor(stops, t, out);
      return true;
    }
  };
}
function wrapIndex(i, n) {
  const r = i % n;
  return r < 0 ? r + n : r;
}
function sample(s, u, v, out) {
  if (s.transparentOutside) {
    if (!s.wrapX && (u < s.minX || u >= s.maxX) || !s.wrapY && (v < s.minY || v >= s.maxY)) {
      return false;
    }
  }
  const d = s.data;
  const w = s.width;
  const texelX = (i) => s.wrapX ? wrapIndex(i, w) : Math.min(s.maxX - 1, Math.max(s.minX, i));
  const texelY = (j) => s.wrapY ? wrapIndex(j, s.height) : Math.min(s.maxY - 1, Math.max(s.minY, j));
  if (!s.smooth) {
    const o = (texelY(Math.floor(v)) * w + texelX(Math.floor(u))) * 4;
    out[0] = d[o];
    out[1] = d[o + 1];
    out[2] = d[o + 2];
    out[3] = d[o + 3];
    return true;
  }
  const fu = u - 0.5;
  const fv = v - 0.5;
  const i0 = Math.floor(fu);
  const j0 = Math.floor(fv);
  const tx = fu - i0;
  const ty = fv - j0;
  const xa = texelX(i0);
  const xb = texelX(i0 + 1);
  const ya = texelY(j0) * w;
  const yb = texelY(j0 + 1) * w;
  const o00 = (ya + xa) * 4;
  const o10 = (ya + xb) * 4;
  const o01 = (yb + xa) * 4;
  const o11 = (yb + xb) * 4;
  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;
  for (let c = 0; c < 4; c++) {
    out[c] = d[o00 + c] * w00 + d[o10 + c] * w10 + d[o01 + c] * w01 + d[o11 + c] * w11;
  }
  return true;
}
function imageShader(sampler, toDevice) {
  const inv2 = invertMatrix(toDevice);
  if (!inv2) {
    return null;
  }
  return {
    shade(x, y, out) {
      const px = x + 0.5;
      const py = y + 0.5;
      return sample(sampler, inv2[0] * px + inv2[2] * py + inv2[4], inv2[1] * px + inv2[3] * py + inv2[5], out);
    }
  };
}
function makeShader(style, fillTransform, smoothing) {
  if (typeof style === "string") {
    const c = parseColor(style);
    if (!c) {
      return null;
    }
    return { solid: [c[0] * c[3], c[1] * c[3], c[2] * c[3], c[3] * 255] };
  }
  if (style instanceof SoftwareGradient) {
    return gradientShader(style, fillTransform);
  }
  if (style instanceof SoftwarePattern) {
    const rep = style.repetition;
    const wrapX = rep === "repeat" || rep === "repeat-x";
    const wrapY = rep === "repeat" || rep === "repeat-y";
    return imageShader(
      {
        data: style.data,
        width: style.width,
        height: style.height,
        wrapX,
        wrapY,
        minX: 0,
        minY: 0,
        maxX: style.width,
        maxY: style.height,
        transparentOutside: true,
        smooth: smoothing
      },
      multiplyMatrix(fillTransform, style.matrix)
    );
  }
  return null;
}
var UNBOUNDED_OPS = /* @__PURE__ */ new Set(["copy", "source-in", "source-out", "destination-in", "destination-atop"]);
var SEPARABLE = {
  multiply: (s, d) => s * d,
  screen: (s, d) => s + d - s * d,
  overlay: (s, d) => hardLight(d, s),
  darken: (s, d) => Math.min(s, d),
  lighten: (s, d) => Math.max(s, d),
  "color-dodge": (s, d) => d === 0 ? 0 : s >= 1 ? 1 : Math.min(1, d / (1 - s)),
  "color-burn": (s, d) => d >= 1 ? 1 : s <= 0 ? 0 : 1 - Math.min(1, (1 - d) / s),
  "hard-light": (s, d) => hardLight(s, d),
  "soft-light": (s, d) => {
    if (s <= 0.5) {
      return d - (1 - 2 * s) * d * (1 - d);
    }
    const g = d <= 0.25 ? ((16 * d - 12) * d + 4) * d : Math.sqrt(d);
    return d + (2 * s - 1) * (g - d);
  },
  difference: (s, d) => Math.abs(s - d),
  exclusion: (s, d) => s + d - 2 * s * d
};
function hardLight(s, d) {
  return s <= 0.5 ? d * 2 * s : SEPARABLE.screen(2 * s - 1, d);
}
function lum(r, g, b) {
  return 0.3 * r + 0.59 * g + 0.11 * b;
}
function clipColor(c) {
  const l = lum(c[0], c[1], c[2]);
  const n = Math.min(c[0], c[1], c[2]);
  const x = Math.max(c[0], c[1], c[2]);
  let [r, g, b] = c;
  if (n < 0) {
    r = l + (r - l) * l / (l - n);
    g = l + (g - l) * l / (l - n);
    b = l + (b - l) * l / (l - n);
  }
  if (x > 1) {
    r = l + (r - l) * (1 - l) / (x - l);
    g = l + (g - l) * (1 - l) / (x - l);
    b = l + (b - l) * (1 - l) / (x - l);
  }
  return [r, g, b];
}
function setLum(c, l) {
  const d = l - lum(c[0], c[1], c[2]);
  return clipColor([c[0] + d, c[1] + d, c[2] + d]);
}
function sat(c) {
  return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
}
function setSat(c, s) {
  const idx = [0, 1, 2].sort((a, b) => c[a] - c[b]);
  const out = [0, 0, 0];
  const [lo, mid, hi] = idx;
  if (c[hi] > c[lo]) {
    out[mid] = (c[mid] - c[lo]) * s / (c[hi] - c[lo]);
    out[hi] = s;
  }
  return out;
}
var NON_SEPARABLE = {
  hue: (s, d) => setLum(setSat(s, sat(d)), lum(d[0], d[1], d[2])),
  saturation: (s, d) => setLum(setSat(d, sat(s)), lum(d[0], d[1], d[2])),
  color: (s, d) => setLum(s, lum(d[0], d[1], d[2])),
  luminosity: (s, d) => setLum(d, lum(s[0], s[1], s[2]))
};
function isCompositeOp(op) {
  return op in SEPARABLE || op in NON_SEPARABLE || [
    "source-over",
    "source-in",
    "source-out",
    "source-atop",
    "destination-over",
    "destination-in",
    "destination-out",
    "destination-atop",
    "xor",
    "copy",
    "lighter"
  ].includes(op);
}
function compositePixel(dst, di, sr, sg, sb, sa, coverage, op) {
  const dr = dst[di] / 255;
  const dg = dst[di + 1] / 255;
  const db = dst[di + 2] / 255;
  const da = dst[di + 3] / 255;
  let r;
  let g;
  let b;
  let a;
  switch (op) {
    case "source-over":
      r = sr + dr * (1 - sa);
      g = sg + dg * (1 - sa);
      b = sb + db * (1 - sa);
      a = sa + da * (1 - sa);
      break;
    case "copy":
      r = sr;
      g = sg;
      b = sb;
      a = sa;
      break;
    case "destination-over":
      r = sr * (1 - da) + dr;
      g = sg * (1 - da) + dg;
      b = sb * (1 - da) + db;
      a = sa * (1 - da) + da;
      break;
    case "source-in":
      r = sr * da;
      g = sg * da;
      b = sb * da;
      a = sa * da;
      break;
    case "destination-in":
      r = dr * sa;
      g = dg * sa;
      b = db * sa;
      a = da * sa;
      break;
    case "source-out":
      r = sr * (1 - da);
      g = sg * (1 - da);
      b = sb * (1 - da);
      a = sa * (1 - da);
      break;
    case "destination-out":
      r = dr * (1 - sa);
      g = dg * (1 - sa);
      b = db * (1 - sa);
      a = da * (1 - sa);
      break;
    case "source-atop":
      r = sr * da + dr * (1 - sa);
      g = sg * da + dg * (1 - sa);
      b = sb * da + db * (1 - sa);
      a = da;
      break;
    case "destination-atop":
      r = sr * (1 - da) + dr * sa;
      g = sg * (1 - da) + dg * sa;
      b = sb * (1 - da) + db * sa;
      a = sa;
      break;
    case "xor":
      r = sr * (1 - da) + dr * (1 - sa);
      g = sg * (1 - da) + dg * (1 - sa);
      b = sb * (1 - da) + db * (1 - sa);
      a = sa * (1 - da) + da * (1 - sa);
      break;
    case "lighter":
      r = Math.min(1, sr + dr);
      g = Math.min(1, sg + dg);
      b = Math.min(1, sb + db);
      a = Math.min(1, sa + da);
      break;
    default: {
      a = sa + da - sa * da;
      const both = sa * da;
      const us = [sa > 0 ? sr / sa : 0, sa > 0 ? sg / sa : 0, sa > 0 ? sb / sa : 0];
      const ud = [da > 0 ? dr / da : 0, da > 0 ? dg / da : 0, da > 0 ? db / da : 0];
      let mixed;
      const sepFn = SEPARABLE[op];
      if (sepFn) {
        mixed = [sepFn(us[0], ud[0]), sepFn(us[1], ud[1]), sepFn(us[2], ud[2])];
      } else {
        const nsFn = NON_SEPARABLE[op];
        if (!nsFn) {
          compositePixel(dst, di, sr, sg, sb, sa, coverage, "source-over");
          return;
        }
        mixed = nsFn(us, ud);
      }
      r = sr * (1 - da) + dr * (1 - sa) + both * mixed[0];
      g = sg * (1 - da) + dg * (1 - sa) + both * mixed[1];
      b = sb * (1 - da) + db * (1 - sa) + both * mixed[2];
    }
  }
  if (coverage < 1) {
    r = dr + (r - dr) * coverage;
    g = dg + (g - dg) * coverage;
    b = db + (b - db) * coverage;
    a = da + (a - da) * coverage;
  }
  dst[di] = r * 255;
  dst[di + 1] = g * 255;
  dst[di + 2] = b * 255;
  dst[di + 3] = a * 255;
}

// src/software-raster-hairline.ts
function fastLen(x, y) {
  let a = Math.abs(x);
  let b = Math.abs(y);
  if (a < b) {
    const t = a;
    a = b;
    b = t;
  }
  return a + b / 2;
}
function hairlineCoverage(m, lineWidth) {
  const len0 = fastLen(m[0] * lineWidth, m[1] * lineWidth);
  const len1 = fastLen(m[2] * lineWidth, m[3] * lineWidth);
  if (len0 <= 1 && len1 <= 1) {
    return (len0 + len1) / 2;
  }
  return null;
}
function hairlineCubicSegments(x0, y0, x1, y1, x2, y2, x3, y3) {
  const p13x = x3 / 3 + 2 * x0 / 3;
  const p13y = y3 / 3 + 2 * y0 / 3;
  const p23x = x0 / 3 + 2 * x3 / 3;
  const p23y = y0 / 3 + 2 * y3 / 3;
  const diff = Math.max(Math.abs(x1 - p13x), Math.abs(y1 - p13y), Math.abs(x2 - p23x), Math.abs(y2 - p23y));
  let tol = 1 / 8;
  for (let i = 0; i < 9; i++) {
    if (diff < tol) {
      return 1 << i;
    }
    tol *= 4;
  }
  return 1 << 9;
}
var FIXED_HALF = 32768;
function fixDiv(a, b) {
  return Math.trunc(a * 65536 / b);
}
function dot6Scale(value, mod64) {
  return value * mod64 >> 6;
}
function drawHairline(ax, ay, bx, by, width, height, plot) {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const edges = [
    [-dx, ax + 1],
    [dx, width + 1 - ax],
    [-dy, ay + 1],
    [dy, height + 1 - ay]
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) {
        return;
      }
    } else {
      const r = q / p;
      if (p < 0) {
        t0 = Math.max(t0, r);
      } else {
        t1 = Math.min(t1, r);
      }
    }
  }
  if (t0 > t1) {
    return;
  }
  antiHairline(
    Math.round((ax + dx * t0) * 64),
    Math.round((ay + dy * t0) * 64),
    Math.round((ax + dx * t1) * 64),
    Math.round((ay + dy * t1) * 64),
    plot
  );
}
function antiHairline(x0, y0, x1, y1, plot) {
  if (Math.abs(x1 - x0) > 511 * 64 || Math.abs(y1 - y0) > 511 * 64) {
    const hx = (x0 >> 1) + (x1 >> 1);
    const hy = (y0 >> 1) + (y1 >> 1);
    antiHairline(x0, y0, hx, hy, plot);
    antiHairline(hx, hy, x1, y1, plot);
    return;
  }
  if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) {
    if (x0 > x1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }
    const istart = x0 >> 6;
    const istop = x1 + 63 >> 6;
    let fstart = y0 << 10;
    const slope = y0 === y1 ? 0 : fixDiv(y1 - y0, x1 - x0);
    fstart += slope * (32 - (x0 & 63)) + 32 >> 6;
    walk(istart, istop, fstart, slope, x1 - x0, x0 & 63, x1 & 63, (i, lower, a0, a1) => {
      if (a0) plot(i, lower - 1, a0);
      if (a1) plot(i, lower, a1);
    });
  } else {
    if (x0 === x1 && y0 === y1) {
      return;
    }
    if (y0 > y1) {
      [x0, x1] = [x1, x0];
      [y0, y1] = [y1, y0];
    }
    const istart = y0 >> 6;
    const istop = y1 + 63 >> 6;
    let fstart = x0 << 10;
    const slope = x0 === x1 ? 0 : fixDiv(x1 - x0, y1 - y0);
    fstart += slope * (32 - (y0 & 63)) + 32 >> 6;
    walk(istart, istop, fstart, slope, y1 - y0, y0 & 63, y1 & 63, (i, lower, a0, a1) => {
      if (a0) plot(lower - 1, i, a0);
      if (a1) plot(lower, i, a1);
    });
  }
}
function walk(istart, istop, fstart, slope, len, startFrac, stopFrac, blit) {
  if (istop <= istart) {
    return;
  }
  let scaleStart;
  let scaleStop;
  if (istop - istart === 1) {
    scaleStart = len;
    scaleStop = 0;
  } else {
    scaleStart = 64 - startFrac;
    scaleStop = stopFrac;
  }
  const cap = (i2, fy2, mod64) => {
    fy2 += FIXED_HALF;
    const lower = fy2 >> 16;
    const a = fy2 >> 8 & 255;
    blit(i2, lower, dot6Scale(255 - a, mod64), dot6Scale(a, mod64));
    return fy2 + slope - FIXED_HALF;
  };
  let fy = cap(istart, fstart, scaleStart);
  let i = istart + 1;
  const fullSpans = istop - i - (scaleStop > 0 ? 1 : 0);
  if (fullSpans > 0) {
    fy += FIXED_HALF;
    for (let k = 0; k < fullSpans; k++, i++) {
      const lower = fy >> 16;
      const a = fy >> 8 & 255;
      blit(i, lower, 255 - a, a);
      fy += slope;
    }
    fy -= FIXED_HALF;
  }
  if (scaleStop > 0) {
    cap(istop - 1, fy, scaleStop);
  }
}

// src/software-raster-stroke.ts
var EPS = 1e-9;
function dedupe(poly) {
  const pts = [];
  const smooth = [];
  const p = poly.pts;
  for (let i = 0; i < p.length; i += 2) {
    const n = pts.length;
    if (n >= 2 && Math.abs(pts[n - 2] - p[i]) < EPS && Math.abs(pts[n - 1] - p[i + 1]) < EPS) {
      continue;
    }
    pts.push(p[i], p[i + 1]);
    smooth.push(poly.smooth[i >> 1] ?? false);
  }
  if (poly.closed && pts.length >= 4) {
    const n = pts.length;
    if (Math.abs(pts[n - 2] - pts[0]) < EPS && Math.abs(pts[n - 1] - pts[1]) < EPS) {
      pts.length -= 2;
      smooth.length -= 1;
    }
  }
  smooth[0] = false;
  return { pts, smooth, closed: poly.closed };
}
function dashPiece(piece, dash, offset) {
  const total = dash.reduce((s, d) => s + d, 0);
  if (!(total > 0)) {
    return [piece];
  }
  const p = piece.pts;
  const n = p.length >> 1;
  const segCount = piece.closed ? n : n - 1;
  if (segCount < 1) {
    return [piece];
  }
  let phase = offset % total;
  if (phase < 0) {
    phase += total;
  }
  let idx = 0;
  while (phase > 0 && phase >= dash[idx]) {
    phase -= dash[idx];
    idx = (idx + 1) % dash.length;
  }
  let remaining = dash[idx] - phase;
  let on = idx % 2 === 0;
  const out = [];
  let cur = on ? { pts: [p[0], p[1]], smooth: [false], closed: false } : null;
  const startsOn = on;
  for (let s = 0; s < segCount; s++) {
    const ax = p[s * 2];
    const ay = p[s * 2 + 1];
    const bi = (s + 1) % n;
    const bx = p[bi * 2];
    const by = p[bi * 2 + 1];
    const len = Math.hypot(bx - ax, by - ay);
    let pos = 0;
    while (len - pos > remaining) {
      pos += remaining;
      const t = pos / len;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      if (on && cur) {
        cur.pts.push(x, y);
        cur.smooth.push(false);
        if (cur.pts.length === 4 && Math.abs(cur.pts[0] - x) < EPS && Math.abs(cur.pts[1] - y) < EPS) {
          cur.pts.length = 2;
          cur.smooth.length = 1;
          cur.dir = [(bx - ax) / len, (by - ay) / len];
        }
        out.push(cur);
        cur = null;
      } else {
        cur = { pts: [x, y], smooth: [false], closed: false, dir: [(bx - ax) / len, (by - ay) / len] };
      }
      on = !on;
      idx = (idx + 1) % dash.length;
      remaining = dash[idx];
    }
    remaining -= len - pos;
    if (on && cur) {
      cur.pts.push(bx, by);
      cur.smooth.push(bi === 0 ? false : piece.smooth[bi]);
    }
  }
  if (on && cur) {
    if (piece.closed && startsOn && out.length > 0) {
      const first = out.shift();
      cur.pts.push(...first.pts.slice(2));
      cur.smooth.push(...first.smooth.slice(1));
    }
    out.push(cur);
  }
  for (const d of out) {
    if (d.pts.length > 2) {
      delete d.dir;
    }
  }
  return out;
}
function arcPoints(out, cx, cy, r, a0, sweep, step) {
  const n = Math.ceil(Math.abs(sweep) / step);
  for (let i = 1; i < n; i++) {
    const a = a0 + sweep * i / n;
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
}
function joinSide(out, px, py, d1x, d1y, d2x, d2y, n1x, n1y, n2x, n2y, hw, join, miterLimit, step) {
  const ax = px + n1x * hw;
  const ay = py + n1y * hw;
  const bx = px + n2x * hw;
  const by = py + n2y * hw;
  const dot = d1x * d2x + d1y * d2y;
  const cross = d1x * d2y - d1y * d2x;
  out.push(ax, ay);
  if (Math.abs(cross) < 1e-12 && dot > 0) {
    return;
  }
  const outer = n1x * d2x + n1y * d2y < 0 || Math.abs(cross) < 1e-12 && dot < 0;
  if (!outer) {
    out.push(px, py);
    out.push(bx, by);
    return;
  }
  if (join === "round") {
    const a0 = Math.atan2(n1y, n1x);
    let sweep = Math.atan2(n2y, n2x) - a0;
    while (sweep <= -Math.PI) {
      sweep += 2 * Math.PI;
    }
    while (sweep > Math.PI) {
      sweep -= 2 * Math.PI;
    }
    if (Math.abs(cross) < 1e-12) {
      sweep = Math.PI * Math.sign(n1x * d1y - n1y * d1x);
    }
    arcPoints(out, px, py, hw, a0, sweep, step);
  } else if (join === "miter") {
    const cosTheta = n1x * n2x + n1y * n2y;
    const cosHalf = Math.sqrt(Math.max(0, (1 + cosTheta) / 2));
    if (cosHalf > 1e-12 && 1 / cosHalf <= miterLimit) {
      const mx = n1x + n2x;
      const my = n1y + n2y;
      const ml = Math.hypot(mx, my);
      if (ml > 1e-12) {
        const len = hw / cosHalf;
        out.push(px + mx / ml * len, py + my / ml * len);
      }
    }
  }
  out.push(bx, by);
}
function outlinePiece(piece, params, step, hadSegment) {
  const hw = params.lineWidth / 2;
  const p = piece.pts;
  const n = p.length >> 1;
  const cap = params.lineCap;
  if (n === 1) {
    if (!hadSegment || piece.closed || cap === "butt") {
      return [];
    }
    const cx = p[0];
    const cy = p[1];
    const [dx, dy] = piece.dir ?? [1, 0];
    if (cap === "round") {
      const ring2 = [cx + hw, cy];
      arcPoints(ring2, cx, cy, hw, 0, 2 * Math.PI, step);
      return [ring2];
    }
    const nx = -dy;
    const ny = dx;
    return [
      [
        cx + (dx + nx) * hw,
        cy + (dy + ny) * hw,
        cx + (-dx + nx) * hw,
        cy + (-dy + ny) * hw,
        cx + (-dx - nx) * hw,
        cy + (-dy - ny) * hw,
        cx + (dx - nx) * hw,
        cy + (dy - ny) * hw
      ]
    ];
  }
  const segs2 = piece.closed ? n : n - 1;
  const dirs = new Float64Array(segs2 * 2);
  for (let s = 0; s < segs2; s++) {
    const b = (s + 1) % n;
    const dx = p[b * 2] - p[s * 2];
    const dy = p[b * 2 + 1] - p[s * 2 + 1];
    const len = Math.hypot(dx, dy) || 1;
    dirs[s * 2] = dx / len;
    dirs[s * 2 + 1] = dy / len;
  }
  const side = (sign) => {
    const out = [];
    const first = piece.closed ? 0 : 1;
    const last = piece.closed ? n - 1 : n - 2;
    if (!piece.closed) {
      out.push(p[0] + sign * dirs[1] * hw, p[1] - sign * dirs[0] * hw);
    }
    for (let k = first; k <= last; k++) {
      const s1 = (k - 1 + segs2) % segs2;
      const s2 = k % segs2;
      const d1x = dirs[s1 * 2];
      const d1y = dirs[s1 * 2 + 1];
      const d2x = dirs[s2 * 2];
      const d2y = dirs[s2 * 2 + 1];
      const join = piece.smooth[k] ? "round" : params.lineJoin;
      joinSide(
        out,
        p[k * 2],
        p[k * 2 + 1],
        d1x,
        d1y,
        d2x,
        d2y,
        sign * d1y,
        -sign * d1x,
        sign * d2y,
        -sign * d2x,
        hw,
        join,
        params.miterLimit,
        step
      );
    }
    if (!piece.closed) {
      const s = segs2 - 1;
      out.push(p[(n - 1) * 2] + sign * dirs[s * 2 + 1] * hw, p[(n - 1) * 2 + 1] - sign * dirs[s * 2] * hw);
    }
    return out;
  };
  const left = side(1);
  const right = side(-1);
  const reverse = (pts) => {
    const r = [];
    for (let i = pts.length - 2; i >= 0; i -= 2) {
      r.push(pts[i], pts[i + 1]);
    }
    return r;
  };
  if (piece.closed) {
    return [left, reverse(right)];
  }
  const ring = left.slice();
  const capAt = (x, y, dx, dy) => {
    if (cap === "square") {
      ring.push(x + (dy + dx) * hw, y + (-dx + dy) * hw);
      ring.push(x + (-dy + dx) * hw, y + (dx + dy) * hw);
    } else if (cap === "round") {
      const a0 = Math.atan2(-dx, dy);
      arcPoints(ring, x, y, hw, a0, Math.PI, step);
    }
  };
  const e = n - 1;
  capAt(p[e * 2], p[e * 2 + 1], dirs[(segs2 - 1) * 2], dirs[(segs2 - 1) * 2 + 1]);
  ring.push(...reverse(right));
  capAt(p[0], p[1], -dirs[0], -dirs[1]);
  return [ring];
}
function strokeCenterlines(polys, m, params) {
  const inv2 = invertMatrix(m);
  if (!inv2) {
    return [];
  }
  const out = [];
  for (const poly of polys) {
    const user = { pts: new Array(poly.pts.length), smooth: poly.smooth, closed: poly.closed };
    for (let i = 0; i < poly.pts.length; i += 2) {
      const x = poly.pts[i];
      const y = poly.pts[i + 1];
      user.pts[i] = inv2[0] * x + inv2[2] * y + inv2[4];
      user.pts[i + 1] = inv2[1] * x + inv2[3] * y + inv2[5];
    }
    const base = dedupe(user);
    const pieces = params.lineDash.length > 0 ? dashPiece(base, params.lineDash, params.lineDashOffset) : [base];
    for (const piece of pieces) {
      const pts = piece.pts;
      for (let i = 0; i < pts.length; i += 2) {
        const x = pts[i];
        const y = pts[i + 1];
        pts[i] = m[0] * x + m[2] * y + m[4];
        pts[i + 1] = m[1] * x + m[3] * y + m[5];
      }
      out.push({ pts, smooth: piece.smooth, closed: piece.closed });
    }
  }
  return out;
}
function strokeToRings(polys, m, params, tolerance) {
  const inv2 = invertMatrix(m);
  if (!inv2 || !(params.lineWidth > 0)) {
    return [];
  }
  const scale = Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
  const rDev = Math.max(1e-6, params.lineWidth / 2 * scale);
  const step = rDev <= tolerance ? Math.PI / 2 : Math.max(0.05, 2 * Math.acos(1 - tolerance / rDev));
  const rings = [];
  for (const poly of polys) {
    const user = { pts: new Array(poly.pts.length), smooth: poly.smooth, closed: poly.closed };
    for (let i = 0; i < poly.pts.length; i += 2) {
      const x = poly.pts[i];
      const y = poly.pts[i + 1];
      user.pts[i] = inv2[0] * x + inv2[2] * y + inv2[4];
      user.pts[i + 1] = inv2[1] * x + inv2[3] * y + inv2[5];
    }
    const hadSegment = poly.pts.length >= 4;
    const base = dedupe(user);
    const pieces = params.lineDash.length > 0 ? dashPiece(base, params.lineDash, params.lineDashOffset) : [base];
    for (const piece of pieces) {
      for (const ring of outlinePiece(piece, params, step, hadSegment)) {
        for (let i = 0; i < ring.length; i += 2) {
          const x = ring[i];
          const y = ring[i + 1];
          ring[i] = m[0] * x + m[2] * y + m[4];
          ring[i + 1] = m[1] * x + m[3] * y + m[5];
        }
        rings.push(ring);
      }
    }
  }
  return rings;
}

// src/text-estimate.ts
function parseFont(font) {
  const m = /^\s*((?:(?:italic|oblique|normal|bold|bolder|lighter|small-caps|\d{3})\s+)*)([\d.]+)px\s+(.+)$/i.exec(font);
  if (!m) {
    return { style: "", weight: "", size: 10, family: "sans-serif" };
  }
  const tokens = m[1].trim().split(/\s+/).filter(Boolean);
  const style = tokens.find((t) => /^(italic|oblique)$/i.test(t)) ?? "";
  const weight = tokens.find((t) => /^(bold|bolder|lighter|\d{3})$/i.test(t)) ?? "";
  return { style, weight, size: parseFloat(m[2]), family: m[3].trim() };
}
function estimateTextWidth(text, size) {
  let em = 0;
  for (const ch of text) {
    if (/[ilj.,;:'!|]/.test(ch)) {
      em += 0.28;
    } else if (/[mwMW@]/.test(ch)) {
      em += 0.83;
    } else if (/[A-Z0-9]/.test(ch)) {
      em += 0.64;
    } else if (ch === " ") {
      em += 0.28;
    } else if (ch.charCodeAt(0) > 11903) {
      em += 1;
    } else {
      em += 0.52;
    }
  }
  return em * size;
}
function textInkBox(text, x, y, font, textAlign, textBaseline, maxWidth) {
  const size = parseFont(font).size;
  let w = estimateTextWidth(text, size) * 1.5 + size;
  if (maxWidth !== void 0 && Number.isFinite(maxWidth) && maxWidth > 0) {
    w = Math.min(w, maxWidth + size);
  }
  const pad = size * 0.3;
  let x0;
  let x1;
  if (textAlign === "center") {
    x0 = x - w / 2;
    x1 = x + w / 2;
  } else if (textAlign === "right" || textAlign === "end") {
    x0 = x - w;
    x1 = x + pad;
  } else {
    x0 = x - pad;
    x1 = x + w;
  }
  let up;
  let down;
  switch (textBaseline) {
    case "top":
    case "hanging":
      up = 0.3;
      down = 1.5;
      break;
    case "middle":
      up = 0.9;
      down = 0.9;
      break;
    case "bottom":
    case "ideographic":
      up = 1.5;
      down = 0.3;
      break;
    default:
      up = 1.2;
      down = 0.5;
  }
  return { x0, y0: y - up * size, x1, y1: y + down * size };
}

// src/software-raster.ts
var FLATTEN_TOLERANCE = 0.05;
var unpremultiplied = null;
function unpremultiplyTable() {
  if (unpremultiplied) {
    return unpremultiplied;
  }
  const f = Math.fround;
  const inv255 = f(1 / 255);
  const table = new Uint8Array(256 * 256);
  for (let a = 1; a < 256; a++) {
    const recip = f(1 / f(a * inv255));
    for (let p = 0; p < 256; p++) {
      const x = f(f(f(p * inv255) * recip) * 255);
      const clamped = Math.min(Math.max(x, 0), 255);
      const lo = Math.floor(clamped);
      const frac = clamped - lo;
      table[a << 8 | p] = frac > 0.5 || frac === 0.5 && lo % 2 === 1 ? lo + 1 : lo;
    }
  }
  unpremultiplied = table;
  return table;
}
var SoftwareRasterCanvas = class {
  constructor(width, height) {
    /** Per-pixel flags: 1 where the pixel's true value is unknown (text glyphs). Lazily allocated. */
    this.unknown = null;
    /** Number of `fillText`/`strokeText` calls that would have painted glyphs. */
    this.textDraws = 0;
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.data = new Uint8ClampedArray(this.width * this.height * 4);
    this.words = new Uint32Array(this.data.buffer);
    this.ctx = new SoftwareRasterContext(this);
  }
  getContext(_type) {
    return this.ctx;
  }
  /** A straight-alpha (non-premultiplied) copy of every pixel, as `getImageData` would return it. */
  get pixels() {
    return this.readRgba(0, 0, this.width, this.height);
  }
  /** Straight-alpha RGBA of a rectangle; pixels outside the surface read as transparent. */
  readRgba(x, y, w, h) {
    const out = new Uint8ClampedArray(Math.max(0, w * h * 4));
    const { width, height, data } = this;
    for (let row = 0; row < h; row++) {
      const sy = y + row;
      if (sy < 0 || sy >= height) {
        continue;
      }
      for (let col = 0; col < w; col++) {
        const sx = x + col;
        if (sx < 0 || sx >= width) {
          continue;
        }
        const si = (sy * width + sx) * 4;
        const di = (row * w + col) * 4;
        const a = data[si + 3];
        if (a === 255) {
          out[di] = data[si];
          out[di + 1] = data[si + 1];
          out[di + 2] = data[si + 2];
          out[di + 3] = 255;
        } else if (a !== 0) {
          const table = unpremultiplyTable();
          const row2 = a << 8;
          out[di] = table[row2 | data[si]];
          out[di + 1] = table[row2 | data[si + 1]];
          out[di + 2] = table[row2 | data[si + 2]];
          out[di + 3] = a;
        }
      }
    }
    return out;
  }
  /**
   * The unknown-pixel flags of a rectangle (see the module doc), or `null`
   * when every pixel in it is known.
   */
  unknownIn(x, y, w, h) {
    const u = this.unknown;
    if (!u) {
      return null;
    }
    let out = null;
    for (let row = 0; row < h; row++) {
      const sy = y + row;
      if (sy < 0 || sy >= this.height) {
        continue;
      }
      for (let col = 0; col < w; col++) {
        const sx = x + col;
        if (sx >= 0 && sx < this.width && u[sy * this.width + sx]) {
          out ?? (out = new Uint8Array(w * h));
          out[row * w + col] = 1;
        }
      }
    }
    return out;
  }
  /** Marks every pixel touched by the device-space polygon `ring` (within `clip`) as unknown. */
  markUnknown(ring, clip = null) {
    const bounds = clip ? clip.box : { x0: 0, y0: 0, x1: this.width, y1: this.height };
    this.unknown ?? (this.unknown = new Uint8Array(this.width * this.height));
    const u = this.unknown;
    rasterizeRings([ring], "nonzero", bounds, (y, x0, x1) => {
      for (let x = x0; x < x1; x++) {
        if (!clip || clipAt(clip, x, y)) {
          u[y * this.width + x] = 1;
        }
      }
    });
  }
};
function isSoftwareRaster(value) {
  return value instanceof SoftwareRasterCanvas || value instanceof SoftwareRasterContext;
}
var LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
function packWord(r, g, b, a) {
  const rr = Math.round(r) & 255;
  const gg = Math.round(g) & 255;
  const bb = Math.round(b) & 255;
  const aa = Math.round(a) & 255;
  return (LITTLE_ENDIAN ? aa << 24 | bb << 16 | gg << 8 | rr : rr << 24 | gg << 16 | bb << 8 | aa) >>> 0;
}
function clipAt(clip, x, y) {
  const b = clip.box;
  if (x < b.x0 || x >= b.x1 || y < b.y0 || y >= b.y1) {
    return 0;
  }
  return clip.mask ? clip.mask[(y - b.y0) * (b.x1 - b.x0) + (x - b.x0)] : 255;
}
function extendEnd(p, i, j, d) {
  const dx = p[i * 2] - p[j * 2];
  const dy = p[i * 2 + 1] - p[j * 2 + 1];
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    p[i * 2] += dx / len * d;
    p[i * 2 + 1] += dy / len * d;
  }
}
function alignedRect(r) {
  let n = r.length >> 1;
  if (n === 5 && r[0] === r[8] && r[1] === r[9]) {
    n = 4;
  }
  if (n !== 4) {
    return null;
  }
  const xs = [r[0], r[2], r[4], r[6]];
  const ys = [r[1], r[3], r[5], r[7]];
  if (![...xs, ...ys].every(Number.isInteger)) {
    return null;
  }
  const horizontalFirst = ys[0] === ys[1] && xs[1] === xs[2] && ys[2] === ys[3] && xs[3] === xs[0];
  const verticalFirst = xs[0] === xs[1] && ys[1] === ys[2] && xs[2] === xs[3] && ys[3] === ys[0];
  if (!horizontalFirst && !verticalFirst) {
    return null;
  }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function sourcePixels(source) {
  if (source instanceof SoftwareRasterCanvas) {
    return { data: source.data, width: source.width, height: source.height };
  }
  if (source instanceof SoftwareRasterContext) {
    return sourcePixels(source.canvas);
  }
  const s = source;
  let straight = null;
  if (s && s.data instanceof Uint8ClampedArray && typeof s.width === "number" && typeof s.height === "number") {
    straight = { data: s.data, width: s.width, height: s.height };
  } else if (s && typeof s.getContext === "function" && typeof s.width === "number" && typeof s.height === "number") {
    try {
      const c = s.getContext("2d");
      const img = c?.getImageData?.(0, 0, s.width, s.height);
      if (img) {
        straight = { data: img.data, width: s.width, height: s.height };
      }
    } catch {
      straight = null;
    }
  }
  if (!straight || straight.width <= 0 || straight.height <= 0) {
    return null;
  }
  const n = straight.width * straight.height * 4;
  if (straight.data.length < n) {
    return null;
  }
  const data = new Uint8ClampedArray(n);
  const d = straight.data;
  for (let i = 0; i < n; i += 4) {
    const a = d[i + 3];
    if (a === 255) {
      data[i] = d[i];
      data[i + 1] = d[i + 1];
      data[i + 2] = d[i + 2];
      data[i + 3] = 255;
    } else if (a !== 0) {
      const k = a / 255;
      data[i] = d[i] * k;
      data[i + 1] = d[i + 1] * k;
      data[i + 2] = d[i + 2] * k;
      data[i + 3] = a;
    }
  }
  return { data, width: straight.width, height: straight.height };
}
var SoftwareRasterContext = class {
  constructor(canvas) {
    this.state = {
      transform: [...IDENTITY_MATRIX],
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      lineCap: "butt",
      lineJoin: "miter",
      miterLimit: 10,
      lineDash: [],
      lineDashOffset: 0,
      globalAlpha: 1,
      gco: "source-over",
      font: "10px sans-serif",
      textAlign: "start",
      textBaseline: "alphabetic",
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "low",
      clip: null
    };
    this.stack = [];
    this.path = new PathBuilder();
    this.flatCache = null;
    this.rowCache = null;
    this.px = new Float64Array(4);
    this.canvas = canvas;
  }
  // ---- state properties ---------------------------------------------------
  get fillStyle() {
    return this.state.fillStyle;
  }
  set fillStyle(v) {
    if (this.acceptStyle(v)) {
      this.state.fillStyle = v;
    }
  }
  get strokeStyle() {
    return this.state.strokeStyle;
  }
  set strokeStyle(v) {
    if (this.acceptStyle(v)) {
      this.state.strokeStyle = v;
    }
  }
  acceptStyle(v) {
    return typeof v === "string" && parseColor(v) !== null || v instanceof SoftwareGradient || v instanceof SoftwarePattern;
  }
  get lineWidth() {
    return this.state.lineWidth;
  }
  set lineWidth(v) {
    if (Number.isFinite(v) && v > 0) {
      this.state.lineWidth = v;
    }
  }
  get lineCap() {
    return this.state.lineCap;
  }
  set lineCap(v) {
    if (v === "butt" || v === "round" || v === "square") {
      this.state.lineCap = v;
    }
  }
  get lineJoin() {
    return this.state.lineJoin;
  }
  set lineJoin(v) {
    if (v === "miter" || v === "round" || v === "bevel") {
      this.state.lineJoin = v;
    }
  }
  get miterLimit() {
    return this.state.miterLimit;
  }
  set miterLimit(v) {
    if (Number.isFinite(v) && v > 0) {
      this.state.miterLimit = v;
    }
  }
  get lineDashOffset() {
    return this.state.lineDashOffset;
  }
  set lineDashOffset(v) {
    if (Number.isFinite(v)) {
      this.state.lineDashOffset = v;
    }
  }
  get globalAlpha() {
    return this.state.globalAlpha;
  }
  set globalAlpha(v) {
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      this.state.globalAlpha = v;
    }
  }
  get globalCompositeOperation() {
    return this.state.gco;
  }
  set globalCompositeOperation(v) {
    if (isCompositeOp(v)) {
      this.state.gco = v;
    }
  }
  get font() {
    return this.state.font;
  }
  set font(v) {
    this.state.font = v;
  }
  get textAlign() {
    return this.state.textAlign;
  }
  set textAlign(v) {
    this.state.textAlign = v;
  }
  get textBaseline() {
    return this.state.textBaseline;
  }
  set textBaseline(v) {
    this.state.textBaseline = v;
  }
  get imageSmoothingEnabled() {
    return this.state.imageSmoothingEnabled;
  }
  set imageSmoothingEnabled(v) {
    this.state.imageSmoothingEnabled = !!v;
  }
  get imageSmoothingQuality() {
    return this.state.imageSmoothingQuality;
  }
  set imageSmoothingQuality(v) {
    this.state.imageSmoothingQuality = v;
  }
  setLineDash(segments) {
    if (!Array.isArray(segments) || segments.some((s) => !Number.isFinite(s) || s < 0)) {
      return;
    }
    this.state.lineDash = segments.length % 2 ? [...segments, ...segments] : [...segments];
  }
  getLineDash() {
    return [...this.state.lineDash];
  }
  // ---- state stack & transforms -----------------------------------------
  save() {
    this.stack.push({ ...this.state, transform: [...this.state.transform], lineDash: [...this.state.lineDash] });
  }
  restore() {
    const s = this.stack.pop();
    if (s) {
      this.state = s;
    }
  }
  getTransform() {
    const [a, b, c, d, e, f] = this.state.transform;
    return { a, b, c, d, e, f };
  }
  setTransform(a, b, c, d, e, f) {
    const m = typeof a === "object" ? [a.a ?? 1, a.b ?? 0, a.c ?? 0, a.d ?? 1, a.e ?? 0, a.f ?? 0] : [a, b, c, d, e, f];
    if (m.every(Number.isFinite)) {
      this.state.transform = m;
    }
  }
  resetTransform() {
    this.state.transform = [...IDENTITY_MATRIX];
  }
  transform(a, b, c, d, e, f) {
    if ([a, b, c, d, e, f].every(Number.isFinite)) {
      this.state.transform = multiplyMatrix(this.state.transform, [a, b, c, d, e, f]);
    }
  }
  translate(x, y) {
    this.transform(1, 0, 0, 1, x, y);
  }
  scale(x, y) {
    this.transform(x, 0, 0, y, 0, 0);
  }
  rotate(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    this.transform(c, s, -s, c, 0, 0);
  }
  // ---- path construction -------------------------------------------------
  beginPath() {
    this.path.reset();
  }
  closePath() {
    this.path.closePath();
  }
  moveTo(x, y) {
    this.path.moveTo(this.state.transform, x, y);
  }
  lineTo(x, y) {
    this.path.lineTo(this.state.transform, x, y);
  }
  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this.path.bezierCurveTo(this.state.transform, x1, y1, x2, y2, x, y);
  }
  quadraticCurveTo(cx, cy, x, y) {
    this.path.quadraticCurveTo(this.state.transform, cx, cy, x, y);
  }
  arc(x, y, r, startAngle, endAngle, counterclockwise = false) {
    this.path.arc(this.state.transform, x, y, r, startAngle, endAngle, counterclockwise);
  }
  arcTo(x1, y1, x2, y2, r) {
    this.path.arcTo(this.state.transform, x1, y1, x2, y2, r);
  }
  ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise = false) {
    this.path.ellipse(this.state.transform, x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise);
  }
  rect(x, y, w, h) {
    this.path.rect(this.state.transform, x, y, w, h);
  }
  /** The current path flattened in device space (cached until the path changes). */
  flattened() {
    const segs2 = this.path.segs;
    const c = this.flatCache;
    if (c && c.segs === segs2 && c.length === segs2.length) {
      return c.polys;
    }
    const polys = flattenPath(segs2, FLATTEN_TOLERANCE);
    this.flatCache = { segs: segs2, length: segs2.length, polys };
    this.rowCache = null;
    return polys;
  }
  strokeParams() {
    const s = this.state;
    return {
      lineWidth: s.lineWidth,
      lineCap: s.lineCap,
      lineJoin: s.lineJoin,
      miterLimit: s.miterLimit,
      lineDash: s.lineDash,
      lineDashOffset: s.lineDashOffset
    };
  }
  // ---- painting ------------------------------------------------------------
  surfaceBounds() {
    const clip = this.state.clip;
    const b = { x0: 0, y0: 0, x1: this.canvas.width, y1: this.canvas.height };
    if (clip) {
      b.x0 = Math.max(b.x0, clip.box.x0);
      b.y0 = Math.max(b.y0, clip.box.y0);
      b.x1 = Math.min(b.x1, clip.box.x1);
      b.y1 = Math.min(b.y1, clip.box.y1);
    }
    return b;
  }
  /**
   * Paints `rings` (device space) with `shader` under the current clip,
   * `globalAlpha` and `globalCompositeOperation`.
   */
  paintRings(rings, rule, shader) {
    if (!shader || rings.length === 0) {
      return;
    }
    const bounds = this.surfaceBounds();
    if (bounds.x1 <= bounds.x0 || bounds.y1 <= bounds.y0) {
      return;
    }
    const op = this.state.gco;
    if (UNBOUNDED_OPS.has(op)) {
      this.paintUnbounded(rings, rule, shader, bounds);
      return;
    }
    const ga = this.state.globalAlpha;
    if (ga <= 0) {
      return;
    }
    const { data, width } = this.canvas;
    const clip = this.state.clip?.mask ? this.state.clip : null;
    const unknown = this.canvas.unknown;
    const px = this.px;
    const solid = shader.solid;
    const shade = solid ? null : shader.shade;
    const sr0 = solid ? solid[0] * ga / 255 : 0;
    const sg0 = solid ? solid[1] * ga / 255 : 0;
    const sb0 = solid ? solid[2] * ga / 255 : 0;
    const sa0 = solid ? solid[3] * ga / 255 : 0;
    if (solid && sa0 <= 0 && (op === "source-over" || op === "destination-out" || op === "source-atop" || op === "lighter" || op === "xor")) {
      return;
    }
    const fastOpaque = solid !== void 0 && sa0 >= 1 && op === "source-over";
    const words = fastOpaque ? this.canvas.words : null;
    const word = solid ? packWord(solid[0], solid[1], solid[2], 255) : 0;
    rasterizeRings(rings, rule, bounds, (y, x0, x1, level) => {
      const rowStart = y * width;
      if (words && level === 255 && !clip) {
        words.fill(word, rowStart + x0, rowStart + x1);
        if (unknown) {
          unknown.fill(0, rowStart + x0, rowStart + x1);
        }
        return;
      }
      let di = (rowStart + x0) * 4;
      let pi = rowStart + x0;
      for (let x = x0; x < x1; x++, di += 4, pi++) {
        let c = level;
        if (clip) {
          c = c * clipAt(clip, x, y) / 255;
        }
        if (c <= 0) {
          continue;
        }
        const cf = c >= 255 ? 1 : c / 255;
        let sr = sr0;
        let sg = sg0;
        let sb = sb0;
        let sa = sa0;
        if (shade) {
          if (!shade(x, y, px)) {
            continue;
          }
          sr = px[0] * ga / 255;
          sg = px[1] * ga / 255;
          sb = px[2] * ga / 255;
          sa = px[3] * ga / 255;
        }
        if (fastOpaque && cf === 1) {
          data[di] = solid[0];
          data[di + 1] = solid[1];
          data[di + 2] = solid[2];
          data[di + 3] = 255;
        } else {
          compositePixel(data, di, sr, sg, sb, sa, cf, op);
        }
        if (unknown && unknown[pi] && cf === 1 && sa >= 0.9999 && (op === "source-over" || op === "destination-out")) {
          unknown[pi] = 0;
        }
      }
    });
  }
  /** Operators that clear the destination outside the shape: the whole clip area is composited. */
  paintUnbounded(rings, rule, shader, b) {
    const bw = b.x1 - b.x0;
    const bh = b.y1 - b.y0;
    const coverage = new Uint8Array(bw * bh);
    rasterizeRings(rings, rule, b, (y, x0, x1, level) => {
      const o = (y - b.y0) * bw - b.x0;
      coverage.fill(level, o + x0, o + x1);
    });
    const { data, width } = this.canvas;
    const clip = this.state.clip;
    const unknown = this.canvas.unknown;
    const ga = this.state.globalAlpha;
    const op = this.state.gco;
    const px = this.px;
    for (let y = b.y0; y < b.y1; y++) {
      for (let x = b.x0; x < b.x1; x++) {
        const m = clip ? clipAt(clip, x, y) / 255 : 1;
        if (m <= 0) {
          continue;
        }
        const c = coverage[(y - b.y0) * bw + (x - b.x0)] / 255;
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let sa = 0;
        if (c > 0) {
          if (shader.solid) {
            [sr, sg, sb, sa] = shader.solid;
          } else if (shader.shade(x, y, px)) {
            [sr, sg, sb, sa] = px;
          }
          const k = c * ga / 255;
          sr *= k;
          sg *= k;
          sb *= k;
          sa *= k;
        }
        const pi = y * width + x;
        compositePixel(data, pi * 4, sr, sg, sb, sa, m, op);
        if (unknown && m >= 1 && op === "copy") {
          unknown[pi] = 0;
        }
      }
    }
  }
  fill(fillRule = "nonzero") {
    const polys = this.flattened();
    this.paintRings(
      polys.map((p) => p.pts),
      fillRule === "evenodd" ? "evenodd" : "nonzero",
      makeShader(this.state.fillStyle, this.state.transform, this.state.imageSmoothingEnabled)
    );
  }
  stroke() {
    this.strokeSegs(this.path.segs, this.flattened());
  }
  /**
   * Strokes device-space segments: as Skia hairlines when the stroke is at
   * most one device pixel wide (see `software-raster-hairline.ts`),
   * otherwise as an outline polygon.
   */
  strokeSegs(segs2, flat) {
    const shader = makeShader(this.state.strokeStyle, this.state.transform, this.state.imageSmoothingEnabled);
    if (!shader) {
      return;
    }
    const hair = hairlineCoverage(this.state.transform, this.state.lineWidth);
    if (hair === null) {
      const rings = strokeToRings(flat, this.state.transform, this.strokeParams(), FLATTEN_TOLERANCE);
      this.paintRings(rings, "nonzero", shader);
      return;
    }
    const lines = strokeCenterlines(flattenPath(segs2, FLATTEN_TOLERANCE, hairlineCubicSegments), this.state.transform, this.strokeParams());
    const outset = this.state.lineCap === "square" ? 0.5 : this.state.lineCap === "round" ? Math.PI / 8 : 0;
    const { width, height } = this.canvas;
    const plot = this.hairlinePlotter(shader, hair);
    for (const line of lines) {
      const p = line.pts.slice();
      const n = p.length >> 1;
      if (n < 2) {
        continue;
      }
      if (outset && !line.closed) {
        extendEnd(p, 0, 1, outset);
        extendEnd(p, n - 1, n - 2, outset);
      }
      const segCount = line.closed ? n : n - 1;
      for (let i = 0; i < segCount; i++) {
        const j = (i + 1) % n;
        drawHairline(p[i * 2], p[i * 2 + 1], p[j * 2], p[j * 2 + 1], width, height, plot);
      }
    }
  }
  /** Composites single hairline pixels with the paint, clip, alpha and operator. */
  hairlinePlotter(shader, coverage) {
    const { data, width, height } = this.canvas;
    const clip = this.state.clip;
    const op = this.state.gco;
    const ga = this.state.globalAlpha * Math.min(1, coverage);
    const px = this.px;
    return (x, y, alpha) => {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return;
      }
      let c = alpha / 255;
      if (clip) {
        c *= clipAt(clip, x, y) / 255;
      }
      if (c <= 0) {
        return;
      }
      let sr;
      let sg;
      let sb;
      let sa;
      if (shader.solid) {
        [sr, sg, sb, sa] = shader.solid;
      } else {
        if (!shader.shade(x, y, px)) {
          return;
        }
        [sr, sg, sb, sa] = px;
      }
      const k = ga / 255;
      compositePixel(data, (y * width + x) * 4, sr * k, sg * k, sb * k, sa * k, c, op);
    };
  }
  rectRing(x, y, w, h) {
    const m = this.state.transform;
    const pts = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h]
    ];
    const ring = [];
    for (const [u, v] of pts) {
      ring.push(m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]);
    }
    return ring;
  }
  fillRect(x, y, w, h) {
    if (![x, y, w, h].every(Number.isFinite) || w === 0 || h === 0) {
      return;
    }
    this.paintRings(
      [this.rectRing(x, y, w, h)],
      "nonzero",
      makeShader(this.state.fillStyle, this.state.transform, this.state.imageSmoothingEnabled)
    );
  }
  strokeRect(x, y, w, h) {
    if (![x, y, w, h].every(Number.isFinite)) {
      return;
    }
    const temp = new PathBuilder();
    temp.rect(this.state.transform, x, y, w, h);
    this.strokeSegs(temp.segs, flattenPath(temp.segs, FLATTEN_TOLERANCE));
  }
  clearRect(x, y, w, h) {
    if (![x, y, w, h].every(Number.isFinite) || w === 0 || h === 0) {
      return;
    }
    const saved = { gco: this.state.gco, ga: this.state.globalAlpha };
    this.state.gco = "destination-out";
    this.state.globalAlpha = 1;
    this.paintRings([this.rectRing(x, y, w, h)], "nonzero", { solid: [0, 0, 0, 255] });
    this.state.gco = saved.gco;
    this.state.globalAlpha = saved.ga;
  }
  clip(fillRule = "nonzero") {
    const bounds = this.surfaceBounds();
    const prev = this.state.clip;
    const rings = this.flattened().filter((p) => p.pts.length >= 6).map((p) => p.pts);
    const empty = { box: { x0: 0, y0: 0, x1: 0, y1: 0 }, mask: null };
    const rect = rings.length === 1 ? alignedRect(rings[0]) : null;
    if (rect) {
      const box = {
        x0: Math.max(bounds.x0, rect.x0),
        y0: Math.max(bounds.y0, rect.y0),
        x1: Math.min(bounds.x1, rect.x1),
        y1: Math.min(bounds.y1, rect.y1)
      };
      if (box.x1 <= box.x0 || box.y1 <= box.y0) {
        this.state.clip = empty;
        return;
      }
      let mask = null;
      if (prev?.mask) {
        const w = box.x1 - box.x0;
        mask = new Uint8Array(w * (box.y1 - box.y0));
        for (let y = box.y0; y < box.y1; y++) {
          for (let x = box.x0; x < box.x1; x++) {
            mask[(y - box.y0) * w + (x - box.x0)] = clipAt(prev, x, y);
          }
        }
      }
      this.state.clip = { box, mask };
      return;
    }
    let next = empty;
    let pathBox = null;
    for (const r of rings) {
      for (let i = 0; i + 1 < r.length; i += 2) {
        const x = r[i];
        const y = r[i + 1];
        pathBox ?? (pathBox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
        pathBox.x0 = Math.min(pathBox.x0, x);
        pathBox.y0 = Math.min(pathBox.y0, y);
        pathBox.x1 = Math.max(pathBox.x1, x);
        pathBox.y1 = Math.max(pathBox.y1, y);
      }
    }
    if (pathBox && Number.isFinite(pathBox.x0 + pathBox.x1 + pathBox.y0 + pathBox.y1)) {
      const area = {
        x0: Math.max(bounds.x0, Math.floor(pathBox.x0)),
        y0: Math.max(bounds.y0, Math.floor(pathBox.y0)),
        x1: Math.min(bounds.x1, Math.ceil(pathBox.x1)),
        y1: Math.min(bounds.y1, Math.ceil(pathBox.y1))
      };
      if (area.x1 > area.x0 && area.y1 > area.y0) {
        const bw = area.x1 - area.x0;
        const mask = new Uint8Array(bw * (area.y1 - area.y0));
        const scanned = rasterizeRings(rings, fillRule === "evenodd" ? "evenodd" : "nonzero", area, (y, x0, x1, level) => {
          const o = (y - area.y0) * bw - area.x0;
          if (!prev?.mask) {
            mask.fill(level, o + x0, o + x1);
            return;
          }
          for (let x = x0; x < x1; x++) {
            mask[o + x] = Math.round(level * clipAt(prev, x, y) / 255);
          }
        });
        if (scanned) {
          next = { box: area, mask };
        }
      }
    }
    this.state.clip = next;
  }
  /**
   * The active clip's coverage (0..255) over a device rectangle, or `null`
   * when nothing is clipped.
   */
  clipCoverage(x, y, w, h) {
    const clip = this.state.clip;
    if (!clip) {
      return null;
    }
    const out = new Uint8Array(Math.max(0, w * h));
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        out[row * w + col] = clipAt(clip, x + col, y + row);
      }
    }
    return out;
  }
  isPointInPath(x, y, fillRule = "nonzero") {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return false;
    }
    const polys = this.flattened();
    const key = `${y}`;
    let row = this.rowCache;
    if (!row || row.key !== key) {
      const xs = [];
      const dirs = [];
      for (const poly of polys) {
        const p = poly.pts;
        const n = p.length >> 1;
        if (n < 2) {
          continue;
        }
        for (let i = 0; i < n; i++) {
          const j = i + 1 < n ? i + 1 : 0;
          const x0 = p[i * 2];
          const y0 = p[i * 2 + 1];
          const x1 = p[j * 2];
          const y1 = p[j * 2 + 1];
          if (y0 <= y ? y1 > y : y1 <= y) {
            xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
            dirs.push(y1 > y0 ? 1 : -1);
          }
        }
      }
      const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
      const sortedX = new Float64Array(order.length);
      const suffix = new Int32Array(order.length + 1);
      for (let k = 0; k < order.length; k++) {
        sortedX[k] = xs[order[k]];
      }
      for (let k = order.length - 1; k >= 0; k--) {
        suffix[k] = suffix[k + 1] + dirs[order[k]];
      }
      row = { key, xs: sortedX, suffixWinding: suffix, count: order.length };
      this.rowCache = row;
    }
    let lo = 0;
    let hi = row.count;
    while (lo < hi) {
      const mid = lo + hi >> 1;
      if (row.xs[mid] > x) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    if (fillRule === "evenodd") {
      return (row.count - lo & 1) === 1;
    }
    return row.suffixWinding[lo] !== 0;
  }
  isPointInStroke(x, y) {
    const rings = strokeToRings(this.flattened(), this.state.transform, this.strokeParams(), FLATTEN_TOLERANCE);
    return pointInPolylines(
      rings.map((pts) => ({ pts, smooth: [], closed: true })),
      x,
      y,
      "nonzero"
    );
  }
  // ---- gradients & patterns ---------------------------------------------
  createLinearGradient(x0, y0, x1, y1) {
    return new SoftwareGradient("linear", [x0, y0, x1, y1]);
  }
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    if (r0 < 0 || r1 < 0) {
      throw new RangeError("The radius provided is negative");
    }
    return new SoftwareGradient("radial", [x0, y0, r0, x1, y1, r1]);
  }
  createPattern(image, repetition) {
    const src = sourcePixels(image);
    if (!src) {
      return null;
    }
    const rep = repetition === "repeat-x" || repetition === "repeat-y" || repetition === "no-repeat" ? repetition : "repeat";
    return new SoftwarePattern(src.data.slice(), src.width, src.height, rep);
  }
  // ---- text ------------------------------------------------------------------
  measureText(text) {
    const size = parseFont(this.state.font).size;
    const width = estimateTextWidth(String(text), size);
    return {
      width,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: width,
      actualBoundingBoxAscent: size * 0.8,
      actualBoundingBoxDescent: size * 0.2,
      fontBoundingBoxAscent: size * 0.9,
      fontBoundingBoxDescent: size * 0.25
    };
  }
  /** Glyphs cannot be rasterised without a font engine; see the module doc. */
  fillText(text, x, y, maxWidth) {
    this.recordText(text, x, y, maxWidth, this.state.fillStyle);
  }
  strokeText(text, x, y, maxWidth) {
    this.recordText(text, x, y, maxWidth, this.state.strokeStyle);
  }
  recordText(text, x, y, maxWidth, style) {
    const str = String(text ?? "");
    if (!str.trim() || ![x, y].every(Number.isFinite) || this.state.globalAlpha <= 0) {
      return;
    }
    const shader = makeShader(style, this.state.transform, true);
    if (!shader || shader.solid && shader.solid[3] <= 0) {
      return;
    }
    this.canvas.textDraws++;
    const box = textInkBox(str, x, y, this.state.font, this.state.textAlign, this.state.textBaseline, maxWidth);
    const m = this.state.transform;
    const ring = [];
    for (const [u, v] of [
      [box.x0, box.y0],
      [box.x1, box.y0],
      [box.x1, box.y1],
      [box.x0, box.y1]
    ]) {
      ring.push(m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]);
    }
    this.canvas.markUnknown(ring, this.state.clip);
  }
  // ---- images & pixels -------------------------------------------------
  /**
   * `drawImage(src, dx, dy)`, `(src, dx, dy, dw, dh)` or
   * `(src, sx, sy, sw, sh, dx, dy, dw, dh)`, from another software raster,
   * any `{ data, width, height }` pixel holder, or a canvas-like object
   * exposing `getContext('2d').getImageData`.
   */
  drawImage(source, ...args) {
    let src = sourcePixels(source);
    if (!src) {
      return;
    }
    if (source === this.canvas || source === this) {
      src = { ...src, data: src.data.slice() };
    }
    let sx = 0;
    let sy = 0;
    let sw = src.width;
    let sh = src.height;
    let dx;
    let dy;
    let dw;
    let dh;
    if (args.length >= 8) {
      [sx, sy, sw, sh, dx, dy, dw, dh] = args;
    } else if (args.length >= 4) {
      [dx, dy, dw, dh] = args;
    } else {
      [dx, dy] = args;
      dw = sw;
      dh = sh;
    }
    if (![sx, sy, sw, sh, dx, dy, dw, dh].every(Number.isFinite) || !sw || !sh || !dw || !dh) {
      return;
    }
    if (sw < 0) {
      sx += sw;
      sw = -sw;
    }
    if (sh < 0) {
      sy += sh;
      sh = -sh;
    }
    if (dw < 0) {
      dx += dw;
      dw = -dw;
    }
    if (dh < 0) {
      dy += dh;
      dh = -dh;
    }
    const kx = dw / sw;
    const ky = dh / sh;
    const cx0 = Math.max(0, sx);
    const cy0 = Math.max(0, sy);
    const cx1 = Math.min(src.width, sx + sw);
    const cy1 = Math.min(src.height, sy + sh);
    if (cx1 <= cx0 || cy1 <= cy0) {
      return;
    }
    dx += (cx0 - sx) * kx;
    dy += (cy0 - sy) * ky;
    sx = cx0;
    sy = cy0;
    sw = cx1 - cx0;
    sh = cy1 - cy0;
    const place = [kx, 0, 0, ky, dx - sx * kx, dy - sy * ky];
    const toDevice = multiplyMatrix(this.state.transform, place);
    const shader = imageShader(
      {
        data: src.data,
        width: src.width,
        height: src.height,
        wrapX: false,
        wrapY: false,
        minX: Math.floor(sx),
        minY: Math.floor(sy),
        maxX: Math.ceil(sx + sw),
        maxY: Math.ceil(sy + sh),
        transparentOutside: false,
        smooth: this.state.imageSmoothingEnabled
      },
      toDevice
    );
    const m = toDevice;
    const ring = [];
    for (const [u, v] of [
      [sx, sy],
      [sx + sw, sy],
      [sx + sw, sy + sh],
      [sx, sy + sh]
    ]) {
      ring.push(m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]);
    }
    this.paintRings([ring], "nonzero", shader);
  }
  createImageData(w, h) {
    const width = Math.abs(Math.floor(w)) || 1;
    const height = Math.abs(Math.floor(h)) || 1;
    return { data: new Uint8ClampedArray(width * height * 4), width, height };
  }
  getImageData(x, y, w, h) {
    let ix = Math.floor(x);
    let iy = Math.floor(y);
    let iw = Math.floor(w);
    let ih = Math.floor(h);
    if (iw < 0) {
      ix += iw;
      iw = -iw;
    }
    if (ih < 0) {
      iy += ih;
      ih = -ih;
    }
    return { data: this.canvas.readRgba(ix, iy, iw, ih), width: iw, height: ih, colorSpace: "srgb" };
  }
  putImageData(image, x, y, dirtyX = 0, dirtyY = 0, dirtyW = image.width, dirtyH = image.height) {
    const { width, height, data } = this.canvas;
    const unknown = this.canvas.unknown;
    const dx = Math.round(x);
    const dy = Math.round(y);
    if (dirtyW < 0) {
      dirtyX += dirtyW;
      dirtyW = -dirtyW;
    }
    if (dirtyH < 0) {
      dirtyY += dirtyH;
      dirtyH = -dirtyH;
    }
    const c0 = Math.max(0, Math.floor(dirtyX));
    const r0 = Math.max(0, Math.floor(dirtyY));
    const c1 = Math.min(image.width, Math.floor(dirtyX + dirtyW));
    const r1 = Math.min(image.height, Math.floor(dirtyY + dirtyH));
    const src = image.data;
    for (let row = r0; row < r1; row++) {
      const ty = dy + row;
      if (ty < 0 || ty >= height) {
        continue;
      }
      for (let col = c0; col < c1; col++) {
        const tx = dx + col;
        if (tx < 0 || tx >= width) {
          continue;
        }
        const si = (row * image.width + col) * 4;
        const di = (ty * width + tx) * 4;
        const a = src[si + 3];
        if (a === 255) {
          data[di] = src[si];
          data[di + 1] = src[si + 1];
          data[di + 2] = src[si + 2];
        } else {
          const k = a / 255;
          data[di] = src[si] * k;
          data[di + 1] = src[si + 1] * k;
          data[di + 2] = src[si + 2] * k;
        }
        data[di + 3] = a;
        if (unknown) {
          unknown[ty * width + tx] = 0;
        }
      }
    }
  }
};

// src/svg-tree.ts
function escapeXml(value) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "").replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "\uFFFD").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function writeNode(node, out) {
  out.push("<", node.tag);
  for (const key of Object.keys(node.attrs)) {
    out.push(" ", key, '="', escapeXml(String(node.attrs[key])), '"');
  }
  if (node.text !== void 0) {
    out.push(">", escapeXml(node.text), "</", node.tag, ">");
    return;
  }
  if (!node.children || node.children.length === 0) {
    out.push("/>");
    return;
  }
  out.push(">");
  for (const child of node.children) {
    writeNode(child, out);
  }
  out.push("</", node.tag, ">");
}
function svgTreeToString(node) {
  const out = [];
  writeNode(node, out);
  return out.join("");
}
var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function bytesToBase64(bytes) {
  const parts = [];
  const CHUNK = 3 * 4096;
  for (let start = 0; start < bytes.length; start += CHUNK) {
    const end = Math.min(bytes.length, start + CHUNK);
    let s = "";
    let i = start;
    for (; i + 2 < end; i += 3) {
      const n = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
      s += B64[n >> 18] + B64[n >> 12 & 63] + B64[n >> 6 & 63] + B64[n & 63];
    }
    if (i < end) {
      const n = bytes[i] << 16 | (i + 1 < end ? bytes[i + 1] : 0) << 8;
      s += B64[n >> 18] + B64[n >> 12 & 63] + (i + 1 < end ? B64[n >> 6 & 63] : "=") + "=";
    }
    parts.push(s);
  }
  return parts.join("");
}
function utf8(text) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text);
  }
  const bytes = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 128) {
      bytes.push(cp);
    } else if (cp < 2048) {
      bytes.push(192 | cp >> 6, 128 | cp & 63);
    } else if (cp < 65536) {
      bytes.push(224 | cp >> 12, 128 | cp >> 6 & 63, 128 | cp & 63);
    } else {
      bytes.push(240 | cp >> 18, 128 | cp >> 12 & 63, 128 | cp >> 6 & 63, 128 | cp & 63);
    }
  }
  return Uint8Array.from(bytes);
}
function svgMarkupToDataUrl(markup) {
  return `data:image/svg+xml;base64,${bytesToBase64(utf8(markup))}`;
}
function svgTreeToDataUrl(node) {
  return svgMarkupToDataUrl(svgTreeToString(node));
}
var REACT_ATTR_EXCEPTIONS = {
  class: "className",
  "xml:space": "xmlSpace",
  "xlink:href": "xlinkHref",
  "xmlns:xlink": "xmlnsXlink"
};
function reactAttrName(name) {
  const special = REACT_ATTR_EXCEPTIONS[name];
  if (special) {
    return special;
  }
  if (name.startsWith("data-") || name.startsWith("aria-")) {
    return name;
  }
  return name.replace(/[-:]([a-z])/g, (_m, c) => c.toUpperCase());
}
function parseStyle(style) {
  const out = {};
  for (const decl of style.split(";")) {
    const idx = decl.indexOf(":");
    if (idx <= 0) {
      continue;
    }
    const key = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!key) {
      continue;
    }
    const prop = key.startsWith("--") ? key : key.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
    out[prop] = value;
  }
  return out;
}
function reactProps(attrs) {
  const props = {};
  for (const key of Object.keys(attrs)) {
    const value = attrs[key];
    if (key === "style") {
      props.style = parseStyle(String(value));
    } else {
      props[reactAttrName(key)] = value;
    }
  }
  return props;
}
function svgTreeToReact(node, createElement, rootProps) {
  let key = 0;
  const build = (n, extra) => {
    const props = { key: key++, ...reactProps(n.attrs), ...extra };
    if (n.text !== void 0) {
      return createElement(n.tag, props, n.text);
    }
    const children = (n.children ?? []).map((c) => build(c));
    return createElement(n.tag, props, ...children);
  };
  const { key: _omit, ...rest } = rootProps ?? {};
  return build(node, rest);
}
function jsxString(value) {
  return JSON.stringify(value);
}
function jsxAttrValue(key, value) {
  if (key === "style") {
    const obj = parseStyle(String(value));
    const body = Object.keys(obj).map((k) => `${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : jsxString(k)}: ${jsxString(obj[k])}`).join(", ");
    return `{{ ${body} }}`;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? `{${value}}` : "{0}";
  }
  return /^[^"\\{}<>&\r\n]*$/.test(value) ? `"${value}"` : `{${jsxString(value)}}`;
}
function jsxText(text) {
  return `{${JSON.stringify(text)}}`;
}
function writeJsx(node, depth, out, rootSpread) {
  const pad = "	".repeat(depth);
  const attrs = Object.keys(node.attrs).map((k) => `${reactAttrName(k)}=${jsxAttrValue(k, node.attrs[k])}`);
  if (rootSpread) {
    attrs.push("{...props}");
  }
  const open = `${pad}<${node.tag}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (node.text !== void 0) {
    out.push(`${open}>${jsxText(node.text)}</${node.tag}>`);
    return;
  }
  if (!node.children || node.children.length === 0) {
    out.push(`${open} />`);
    return;
  }
  out.push(`${open}>`);
  for (const child of node.children) {
    writeJsx(child, depth + 1, out, false);
  }
  out.push(`${pad}</${node.tag}>`);
}
function svgTreeToJsx(node, options = {}) {
  const name = options.componentName ?? "Metafile";
  if (!/^[A-Z][A-Za-z0-9_$]*$/.test(name)) {
    throw new TypeError(`svgTreeToJsx: componentName must be a PascalCase identifier, got ${JSON.stringify(name)}`);
  }
  const ts = options.typescript ?? true;
  const spread = options.spreadProps ?? true;
  const body = [];
  writeJsx(node, 2, body, spread);
  const params = spread ? ts ? "props: SVGProps<SVGSVGElement>" : "props" : "";
  const lines = [
    ...ts && spread ? ["import type { SVGProps } from 'react';", ""] : [],
    `export function ${name}(${params}) {`,
    "	return (",
    ...body,
    "	);",
    "}",
    "",
    `export default ${name};`,
    ""
  ];
  return lines.join("\n");
}

// src/emf-canvas-helpers.ts
var nodeCanvasModule;
async function ensureNodeCanvasModule() {
  if (nodeCanvasModule !== void 0) {
    return nodeCanvasModule;
  }
  if (typeof OffscreenCanvas !== "undefined" || typeof document !== "undefined") {
    nodeCanvasModule = null;
    return nodeCanvasModule;
  }
  if (typeof process === "undefined" || !process.versions?.node) {
    nodeCanvasModule = null;
    return nodeCanvasModule;
  }
  try {
    nodeCanvasModule = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      '@napi-rs/canvas'
    );
  } catch {
    nodeCanvasModule = null;
  }
  return nodeCanvasModule;
}
function usingSoftwareCanvas() {
  return typeof OffscreenCanvas === "undefined" && typeof document === "undefined" && !nodeCanvasModule;
}
var DEFAULT_DPI_SCALE = 1;
function computeSurfaceSize(width, height, maxWidth, maxHeight, dpiScale = DEFAULT_DPI_SCALE, maxCanvasDimension = MAX_CANVAS_DIMENSION) {
  const effectiveScale = Math.max(1, Math.min(dpiScale, 4));
  let w = Math.round(width * effectiveScale);
  let h = Math.round(height * effectiveScale);
  let scaleX = effectiveScale;
  let scaleY = effectiveScale;
  if (maxWidth && w > maxWidth) {
    const factor = maxWidth / w;
    w = maxWidth;
    h = Math.round(h * factor);
    scaleX *= factor;
    scaleY *= factor;
  }
  if (maxHeight && h > maxHeight) {
    const factor = maxHeight / h;
    w = Math.round(w * factor);
    h = maxHeight;
    scaleX *= factor;
    scaleY *= factor;
  }
  const dimCap = Math.max(1, Math.floor(maxCanvasDimension));
  const clampedW = Math.max(1, Math.min(w, dimCap));
  const clampedH = Math.max(1, Math.min(h, dimCap));
  if (clampedW !== w || clampedH !== h) {
    console.warn(
      `[emf-converter] Canvas size clamped from ${w}\xD7${h} to ${clampedW}\xD7${clampedH}. Output may lose detail.`
    );
  }
  return { w: clampedW, h: clampedH, scaleX, scaleY };
}
function createCanvas(width, height, maxWidth, maxHeight, dpiScale = DEFAULT_DPI_SCALE, maxCanvasDimension = MAX_CANVAS_DIMENSION) {
  const { w, h, scaleX, scaleY } = computeSurfaceSize(width, height, maxWidth, maxHeight, dpiScale, maxCanvasDimension);
  try {
    if (usingSoftwareCanvas()) {
      emfLog(`createCanvas: using the software rasteriser ${w}\xD7${h}`);
      const soft = new SoftwareRasterCanvas(w, h);
      return { canvas: soft, ctx: soft.ctx, scaleX, scaleY };
    }
    if (typeof OffscreenCanvas !== "undefined") {
      emfLog(
        `createCanvas: using OffscreenCanvas ${w}\xD7${h}, scale=(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`
      );
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        emfWarn('createCanvas: OffscreenCanvas.getContext("2d") returned null');
        return null;
      }
      return { canvas, ctx, scaleX, scaleY };
    }
    if (typeof document !== "undefined") {
      emfLog(
        `createCanvas: using HTMLCanvasElement ${w}\xD7${h}, scale=(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`
      );
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        emfWarn('createCanvas: HTMLCanvasElement.getContext("2d") returned null');
        return null;
      }
      return { canvas, ctx, scaleX, scaleY };
    }
    if (nodeCanvasModule) {
      emfLog(
        `createCanvas: using @napi-rs/canvas ${w}\xD7${h}, scale=(${scaleX.toFixed(3)},${scaleY.toFixed(3)})`
      );
      const canvas = nodeCanvasModule.createCanvas(w, h);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        emfWarn('createCanvas: @napi-rs/canvas getContext("2d") returned null');
        return null;
      }
      return { canvas, ctx, scaleX, scaleY };
    }
    emfWarn(
      "createCanvas: no OffscreenCanvas, no document, and no @napi-rs/canvas, cannot create canvas"
    );
    return null;
  } catch (err) {
    return null;
  }
}
function createTempCanvas(width, height) {
  if (width <= 0 || height <= 0) {
    return null;
  }
  width = Math.max(1, Math.min(Math.floor(width), MAX_CANVAS_DIMENSION));
  height = Math.max(1, Math.min(Math.floor(height), MAX_CANVAS_DIMENSION));
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    return { canvas, ctx };
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    return { canvas, ctx };
  }
  if (nodeCanvasModule) {
    const canvas = nodeCanvasModule.createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    return { canvas, ctx };
  }
  const soft = new SoftwareRasterCanvas(width, height);
  return { canvas: soft, ctx: soft.ctx };
}
function rop2Paint(rop2) {
  switch (rop2) {
    case R2_BLACK:
      return { gco: "source-over", colorTransform: "black", exact: true };
    case R2_WHITE:
      return { gco: "source-over", colorTransform: "white", exact: true };
    case R2_NOP:
      return { gco: "source-over", colorTransform: "skip", exact: true };
    case R2_NOTCOPYPEN:
      return { gco: "source-over", colorTransform: "invert", exact: true };
    case R2_NOT:
      return { gco: "difference", colorTransform: "white", exact: true };
    case R2_XORPEN:
    case R2_MASKPENNOT:
      return { gco: "difference", colorTransform: "none", exact: false };
    case R2_NOTXORPEN:
      return { gco: "difference", colorTransform: "invert", exact: false };
    case R2_MASKPEN:
      return { gco: "darken", colorTransform: "none", exact: false };
    case R2_MASKNOTPEN:
    case R2_NOTMERGEPEN:
      return { gco: "darken", colorTransform: "invert", exact: false };
    case R2_MERGEPEN:
    case R2_MERGEPENNOT:
      return { gco: "lighten", colorTransform: "none", exact: false };
    case R2_MERGENOTPEN:
    case R2_NOTMASKPEN:
      return { gco: "lighten", colorTransform: "invert", exact: false };
    default:
      return { gco: "source-over", colorTransform: "none", exact: true };
  }
}
function rop2TransformColor(color, transform) {
  switch (transform) {
    case "invert":
      return invertCssColor(color);
    case "black":
      return "#000000";
    case "white":
      return "#ffffff";
    case "skip":
      return "rgba(0,0,0,0)";
    default:
      return color;
  }
}
function applyPen(ctx, state) {
  const paint = rop2Paint(state.rop2);
  ctx.globalCompositeOperation = paint.gco;
  if (state.penStyle === 5) {
    ctx.strokeStyle = "rgba(0,0,0,0)";
    ctx.lineWidth = 0;
    return;
  }
  ctx.strokeStyle = rop2TransformColor(state.penColor, paint.colorTransform);
  ctx.lineWidth = Math.max(state.penWidth, 1);
  ctx.setLineDash(state.penWidth <= 1 ? cosmeticStyle(state.penStyle, state.penUserStyle) ?? [] : []);
}
function applyBrush(ctx, state) {
  const paint = rop2Paint(state.rop2);
  ctx.globalCompositeOperation = paint.gco;
  const realized = realizeBrush(state);
  if (realized.kind === "none") {
    ctx.fillStyle = "rgba(0,0,0,0)";
    return;
  }
  ctx.fillStyle = rop2TransformColor(state.brushColor, paint.colorTransform);
}
function cssFontWeight(weight) {
  if (!weight || weight === 400) {
    return "";
  }
  const rounded = Math.round(weight / 100) * 100;
  if (rounded === 700) {
    return "bold";
  }
  if (rounded >= 100 && rounded <= 900) {
    return String(rounded);
  }
  return weight >= 700 ? "bold" : "";
}
function mapFontFamily(face, map) {
  const resolved = map?.[face.toLowerCase().trim()] ?? face;
  if (/[\s,]/.test(resolved) && !/^["']/.test(resolved)) {
    return `"${resolved}"`;
  }
  return resolved;
}
function fontSizePx(state, scale = 1) {
  return Math.max(resolveFontPixelHeight(state.fontHeight) * Math.abs(scale || 1), 8);
}
function applyFont(ctx, state, scale = 1) {
  const italic = state.fontItalic ? "italic " : "";
  const weight = cssFontWeight(state.fontWeight);
  const weightPart = weight ? `${weight} ` : "";
  const size = fontSizePx(state, scale);
  const family = mapFontFamily(state.fontFamily, state.fontFamilyMap);
  ctx.font = `${italic}${weightPart}${size}px ${family}`;
}
function drawTextDecorations(ctx, state, x, y, width, scale = 1) {
  if (!state.fontUnderline && !state.fontStrikeOut) {
    return;
  }
  const size = fontSizePx(state, scale);
  const thickness = Math.max(1, Math.round(size / 14));
  const prevFill = ctx.fillStyle;
  ctx.fillStyle = state.textColor;
  if (state.fontUnderline) {
    ctx.fillRect(x, y + Math.round(size * 0.12), width, thickness);
  }
  if (state.fontStrikeOut) {
    ctx.fillRect(x, y - Math.round(size * 0.3), width, thickness);
  }
  ctx.fillStyle = prevFill;
}
function readUtf16LE(view, offset, charCount) {
  if (charCount <= 0) {
    return "";
  }
  const maxBytes = view.byteLength - offset;
  if (maxBytes <= 0) {
    return "";
  }
  const usableChars = Math.min(charCount, Math.floor(maxBytes / 2));
  if (usableChars <= 0) {
    return "";
  }
  let decoded;
  try {
    const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, usableChars * 2);
    decoded = new TextDecoder("utf-16le").decode(bytes);
  } catch {
    const chars = [];
    for (let i = 0; i < usableChars; i++) {
      const code = view.getUint16(offset + i * 2, true);
      if (code === 0) {
        return chars.join("");
      }
      chars.push(String.fromCharCode(code));
    }
    return chars.join("");
  }
  const nul = decoded.indexOf(String.fromCharCode(0));
  return nul === -1 ? decoded : decoded.slice(0, nul);
}
function getStockObject(index) {
  switch (index) {
    case 0:
      return { kind: "brush", style: 0, color: "#ffffff" };
    case 1:
      return { kind: "brush", style: 0, color: "#c0c0c0" };
    case 2:
      return { kind: "brush", style: 0, color: "#808080" };
    case 3:
      return { kind: "brush", style: 0, color: "#404040" };
    case 4:
      return { kind: "brush", style: 0, color: "#000000" };
    case 5:
      return { kind: "brush", style: 1, color: "#000000" };
    case 6:
      return { kind: "pen", style: 0, widthX: 1, color: "#ffffff" };
    case 7:
      return { kind: "pen", style: 0, widthX: 1, color: "#000000" };
    case 8:
      return { kind: "pen", style: 5, widthX: 0, color: "#000000" };
    case 10:
    case 11:
      return {
        kind: "font",
        height: 12,
        weight: 400,
        italic: false,
        underline: false,
        strikeOut: false,
        family: "monospace"
      };
    case 12:
    case 13:
    case 14:
    case 17:
      return {
        kind: "font",
        height: 12,
        weight: 400,
        italic: false,
        underline: false,
        strikeOut: false,
        family: "sans-serif"
      };
    default:
      return null;
  }
}
async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
async function exportCanvasToPngDataUrl(canvas) {
  if (canvas instanceof SoftwareRasterCanvas) {
    const soft = canvas;
    emfLog(`exportCanvasToPngDataUrl: encoding the software raster (${soft.width}\xD7${soft.height})`);
    const png = await encodePng(soft.pixels, soft.width, soft.height);
    return `data:image/png;base64,${bytesToBase64(png)}`;
  }
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    emfLog(
      `exportCanvasToPngDataUrl: using OffscreenCanvas.convertToBlob (${canvas.width}\xD7${canvas.height})`
    );
    const blob = await canvas.convertToBlob({ type: "image/png" });
    emfLog(`exportCanvasToPngDataUrl: blob size=${blob.size} bytes, type=${blob.type}`);
    return blobToDataUrl(blob);
  }
  if (typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) {
    emfLog(
      `exportCanvasToPngDataUrl: using HTMLCanvasElement.toDataURL (${canvas.width}\xD7${canvas.height})`
    );
    return canvas.toDataURL("image/png");
  }
  if (nodeCanvasModule && canvas instanceof nodeCanvasModule.Canvas) {
    emfLog(
      `exportCanvasToPngDataUrl: using @napi-rs/canvas toDataURLAsync (${canvas.width}\xD7${canvas.height})`
    );
    return canvas.toDataURLAsync();
  }
  return null;
}
async function decodeDeferredImageBytes(bytes, mime) {
  if (usingSoftwareCanvas()) {
    const pixels = await decodeImageBytesBuiltIn(new Uint8Array(bytes));
    return pixels ? { drawable: pixels, width: pixels.width, height: pixels.height, close: () => {
    } } : null;
  }
  if (nodeCanvasModule) {
    const image = await nodeCanvasModule.loadImage(new Uint8Array(bytes));
    return { drawable: image, width: image.width, height: image.height, close: () => {
    } };
  }
  if (typeof createImageBitmap !== "function") {
    return null;
  }
  const blob = mime !== void 0 ? new Blob([bytes], { type: mime }) : new Blob([bytes]);
  const bitmap = await createImageBitmap(blob);
  return { drawable: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
}
async function decodeImageBytesBuiltIn(bytes) {
  if (isPng(bytes)) {
    return decodePng(bytes);
  }
  if (bytes.length >= 26 && bytes[0] === 66 && bytes[1] === 77) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const bitsOffset = view.getUint32(10, true);
    const image = decodeDibToImageData(view, 14, bitsOffset, view.byteLength - bitsOffset);
    return image ? { data: image.data, width: image.width, height: image.height } : null;
  }
  return null;
}
function canvasDrawImage(ctx, image, dx, dy, dw, dh) {
  const draw = ctx.drawImage;
  draw.call(ctx, image, dx, dy, dw, dh);
}
function canvasGetImageData(ctx, x, y, w, h) {
  const get = ctx.getImageData;
  return get.call(ctx, x, y, w, h);
}
function canvasPutImageData(ctx, data, x, y) {
  const put = ctx.putImageData;
  put.call(ctx, data, x, y);
}
function canvasCreatePattern(ctx, image, repetition) {
  const create = ctx.createPattern;
  return create.call(ctx, image, repetition);
}
function createImageDataCompat(data, width, height) {
  if (typeof ImageData !== "undefined") {
    return new ImageData(data, width, height);
  }
  if (nodeCanvasModule) {
    const Ctor = nodeCanvasModule.ImageData;
    return new Ctor(data, width, height);
  }
  return { data, width, height, colorSpace: "srgb" };
}

// src/fnt-font.ts
function parseFnt(view, base, end) {
  if (base + 118 > end) {
    return null;
  }
  const version = view.getUint16(base, true);
  if (version !== 512 && version !== 768) {
    return null;
  }
  const type = view.getUint16(base + 66, true);
  if (type & 1) {
    return null;
  }
  const u8 = (o) => view.getUint8(base + o);
  const u16 = (o) => view.getUint16(base + o, true);
  const u32 = (o) => view.getUint32(base + o, true);
  const firstChar = u8(95);
  const lastChar = u8(96);
  const pixHeight = u16(88);
  const faceOff = u32(105);
  let family = "";
  for (let p = base + faceOff; p < end && view.getUint8(p) !== 0 && family.length < 64; p++) {
    family += String.fromCharCode(view.getUint8(p));
  }
  const tableOff = version === 768 ? 148 : 118;
  const entry = version === 768 ? 6 : 4;
  const count = lastChar - firstChar + 2;
  if (base + tableOff + count * entry > end) {
    return null;
  }
  const widthAt = (i) => u16(tableOff + i * entry);
  const offsetAt = (i) => version === 768 ? u32(tableOff + i * entry + 2) : u16(tableOff + i * entry + 2);
  const defaultChar = u8(97) + firstChar;
  const index = (code) => {
    if (code < firstChar || code > lastChar) {
      code = defaultChar;
    }
    return code - firstChar;
  };
  const cache = /* @__PURE__ */ new Map();
  return {
    family,
    points: u16(68),
    vertRes: u16(70),
    horizRes: u16(72),
    pixHeight,
    ascent: u16(74),
    internalLeading: u16(76),
    externalLeading: u16(78),
    italic: u8(80) !== 0,
    underline: u8(81) !== 0,
    strikeOut: u8(82) !== 0,
    weight: u16(83),
    charSet: u8(85),
    pitchAndFamily: u8(90),
    avgWidth: u16(91),
    maxWidth: u16(93),
    firstChar,
    lastChar,
    defaultChar,
    breakChar: u8(98) + firstChar,
    width: (code) => {
      const i = index(code);
      return i >= 0 && i < count ? widthAt(i) : 0;
    },
    bitmap: (code) => {
      const i = index(code);
      if (i < 0 || i >= count) {
        return null;
      }
      let bmp = cache.get(i);
      if (bmp === void 0) {
        const w = widthAt(i);
        const off = offsetAt(i);
        const cols = Math.ceil(w / 8);
        if (w === 0 || base + off + cols * pixHeight > end) {
          bmp = null;
        } else {
          bmp = new Uint8Array(w * pixHeight);
          for (let c = 0; c < cols; c++) {
            for (let y = 0; y < pixHeight; y++) {
              const byte = view.getUint8(base + off + c * pixHeight + y);
              for (let b = 0; b < 8; b++) {
                const x = c * 8 + b;
                if (x < w && byte & 128 >> b) {
                  bmp[y * w + x] = 1;
                }
              }
            }
          }
        }
        cache.set(i, bmp);
      }
      return bmp;
    }
  };
}
function parseRasterFontFile(data) {
  const view = data instanceof ArrayBuffer ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
  const out = [];
  try {
    if (view.byteLength < 64) {
      return out;
    }
    const sig = view.getUint16(0, true);
    if (sig === 512 || sig === 768) {
      const f = parseFnt(view, 0, view.byteLength);
      return f ? [f] : out;
    }
    if (sig !== 23117) {
      return out;
    }
    const ne = view.getUint32(60, true);
    if (ne + 64 > view.byteLength || view.getUint16(ne, true) !== 17742) {
      return out;
    }
    const rt = ne + view.getUint16(ne + 36, true);
    const shift = view.getUint16(rt, true);
    let p = rt + 2;
    while (p + 8 <= view.byteLength) {
      const type = view.getUint16(p, true);
      if (type === 0) {
        break;
      }
      const n = view.getUint16(p + 2, true);
      p += 8;
      for (let i = 0; i < n && p + 12 <= view.byteLength; i++, p += 12) {
        if (type !== 32776) {
          continue;
        }
        const off = view.getUint16(p, true) * 2 ** shift;
        const len = view.getUint16(p + 2, true) * 2 ** shift;
        const f = parseFnt(view, off, Math.min(view.byteLength, off + len));
        if (f) {
          out.push(f);
        }
      }
    }
  } catch {
    return [];
  }
  return out;
}

// src/ttf-font.ts
var ARGS_ARE_XY_VALUES = 2;
var ROUND_XY_TO_GRID = 4;
var WE_HAVE_A_SCALE = 8;
var MORE_COMPONENTS = 32;
var WE_HAVE_AN_X_AND_Y_SCALE = 64;
var WE_HAVE_A_TWO_BY_TWO = 128;
var WE_HAVE_INSTRUCTIONS = 256;
var USE_MY_METRICS = 512;
function tag(view, off) {
  return String.fromCharCode(view.getUint8(off), view.getUint8(off + 1), view.getUint8(off + 2), view.getUint8(off + 3));
}
function readTables(view, base) {
  if (base + 12 > view.byteLength) {
    return null;
  }
  const version = view.getUint32(base);
  if (version !== 65536 && version !== 1953658213) {
    return null;
  }
  const numTables = view.getUint16(base + 4);
  const tables = /* @__PURE__ */ new Map();
  for (let i = 0; i < numTables; i++) {
    const rec = base + 12 + i * 16;
    if (rec + 16 > view.byteLength) {
      return null;
    }
    const offset = view.getUint32(rec + 8);
    const length = view.getUint32(rec + 12);
    if (offset + length <= view.byteLength) {
      tables.set(tag(view, rec), { offset, length });
    }
  }
  return tables;
}
function utf16be(view, off, len) {
  let s = "";
  for (let i = 0; i + 1 < len; i += 2) {
    s += String.fromCharCode(view.getUint16(off + i));
  }
  return s;
}
function latin1(view, off, len) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(view.getUint8(off + i));
  }
  return s;
}
function readNames(view, t) {
  const out = /* @__PURE__ */ new Map();
  if (!t) {
    return out;
  }
  const count = view.getUint16(t.offset + 2);
  const strOff = t.offset + view.getUint16(t.offset + 4);
  const score2 = /* @__PURE__ */ new Map();
  for (let i = 0; i < count; i++) {
    const r = t.offset + 6 + i * 12;
    const platform = view.getUint16(r);
    const encoding = view.getUint16(r + 2);
    const language = view.getUint16(r + 4);
    const nameId = view.getUint16(r + 6);
    const length = view.getUint16(r + 8);
    const offset = view.getUint16(r + 10);
    if (nameId !== 1 && nameId !== 2 && nameId !== 4 && nameId !== 16) {
      continue;
    }
    let s = null;
    let rank = 0;
    if (platform === 3 && (encoding === 1 || encoding === 0 || encoding === 10)) {
      s = utf16be(view, strOff + offset, length);
      rank = language === 1033 ? 3 : 2;
    } else if (platform === 1 && encoding === 0) {
      s = latin1(view, strOff + offset, length);
      rank = 1;
    }
    if (s !== null && rank > (score2.get(nameId) ?? 0)) {
      out.set(nameId, s);
      score2.set(nameId, rank);
    }
  }
  return out;
}
function cmapFormat4(view, off) {
  const segX2 = view.getUint16(off + 6);
  const ends = off + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const ranges = deltas + segX2;
  return (cp) => {
    if (cp > 65535) {
      return 0;
    }
    let lo = 0;
    let hi = segX2 / 2 - 1;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      const end = view.getUint16(ends + mid * 2);
      if (end < cp) {
        lo = mid + 1;
        continue;
      }
      const start = view.getUint16(starts + mid * 2);
      if (start > cp) {
        hi = mid - 1;
        continue;
      }
      const delta = view.getInt16(deltas + mid * 2);
      const rOff = view.getUint16(ranges + mid * 2);
      if (rOff === 0) {
        return cp + delta & 65535;
      }
      const gOff = ranges + mid * 2 + rOff + (cp - start) * 2;
      if (gOff + 2 > view.byteLength) {
        return 0;
      }
      const g = view.getUint16(gOff);
      return g === 0 ? 0 : g + delta & 65535;
    }
    return 0;
  };
}
function cmapFormat12(view, off) {
  const nGroups = view.getUint32(off + 12);
  return (cp) => {
    let lo = 0;
    let hi = nGroups - 1;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      const g = off + 16 + mid * 12;
      const start = view.getUint32(g);
      const end = view.getUint32(g + 4);
      if (cp < start) {
        hi = mid - 1;
      } else if (cp > end) {
        lo = mid + 1;
      } else {
        return view.getUint32(g + 8) + (cp - start);
      }
    }
    return 0;
  };
}
function cmapFormat6(view, off) {
  const first = view.getUint16(off + 6);
  const count = view.getUint16(off + 8);
  return (cp) => cp >= first && cp < first + count ? view.getUint16(off + 10 + (cp - first) * 2) : 0;
}
function cmapFormat0(view, off) {
  return (cp) => cp < 256 ? view.getUint8(off + 6 + cp) : 0;
}
function readCmap(view, t) {
  const none = { lookup: () => 0, symbol: false };
  if (!t) {
    return none;
  }
  const n = view.getUint16(t.offset + 2);
  let best = null;
  for (let i = 0; i < n; i++) {
    const r = t.offset + 4 + i * 8;
    const platform = view.getUint16(r);
    const encoding = view.getUint16(r + 2);
    const off = t.offset + view.getUint32(r + 4);
    if (off + 4 > view.byteLength) {
      continue;
    }
    let rank = 0;
    let symbol = false;
    if (platform === 3 && encoding === 10) {
      rank = 5;
    } else if (platform === 3 && encoding === 1) {
      rank = 4;
    } else if (platform === 3 && encoding === 0) {
      rank = 3;
      symbol = true;
    } else if (platform === 0) {
      rank = 2;
    } else if (platform === 1 && encoding === 0) {
      rank = 1;
    }
    if (rank > 0 && (!best || rank > best.rank)) {
      best = { off, rank, symbol };
    }
  }
  if (!best) {
    return none;
  }
  const format = view.getUint16(best.off);
  let lookup;
  switch (format) {
    case 4:
      lookup = cmapFormat4(view, best.off);
      break;
    case 12:
      lookup = cmapFormat12(view, best.off);
      break;
    case 6:
      lookup = cmapFormat6(view, best.off);
      break;
    case 0:
      lookup = cmapFormat0(view, best.off);
      break;
    default:
      return none;
  }
  if (best.symbol) {
    const inner = lookup;
    lookup = (cp) => inner(cp) || (cp < 256 ? inner(61440 + cp) : 0);
  }
  return { lookup, symbol: best.symbol };
}
function readHdmx(view, t, numGlyphs) {
  const out = /* @__PURE__ */ new Map();
  if (!t || t.length < 8) {
    return out;
  }
  const num = view.getInt16(t.offset + 2);
  const size = view.getInt32(t.offset + 4);
  for (let i = 0; i < num; i++) {
    const r = t.offset + 8 + i * size;
    if (r + 2 + numGlyphs > t.offset + t.length) {
      break;
    }
    out.set(view.getUint8(r), new Uint8Array(view.buffer, view.byteOffset + r + 2, numGlyphs));
  }
  return out;
}
function readVdmx(view, t) {
  if (!t || t.length < 6) {
    return null;
  }
  const numRatios = view.getUint16(t.offset + 4);
  let chosen = -1;
  for (let i = 0; i < numRatios; i++) {
    const r = t.offset + 6 + i * 4;
    const charSet = view.getUint8(r);
    const xRatio = view.getUint8(r + 1);
    const yStart = view.getUint8(r + 2);
    const yEnd = view.getUint8(r + 3);
    if (charSet !== 1) {
      continue;
    }
    if (xRatio === 0 && yStart === 0 && yEnd === 0 || xRatio === 1 && yStart <= 1 && yEnd >= 1) {
      chosen = i;
      break;
    }
  }
  if (chosen < 0) {
    return null;
  }
  const groupOff = t.offset + view.getUint16(t.offset + 6 + numRatios * 4 + chosen * 2);
  if (groupOff + 4 > view.byteLength) {
    return null;
  }
  const recs = view.getUint16(groupOff);
  const out = [];
  for (let i = 0; i < recs; i++) {
    const e = groupOff + 4 + i * 6;
    out.push({ ppem: view.getUint16(e), yMax: view.getInt16(e + 2), yMin: view.getInt16(e + 4) });
  }
  return out;
}
function readGlyph(view, glyf, start, end) {
  if (end <= start) {
    return null;
  }
  const p0 = glyf.offset + start;
  const nContours = view.getInt16(p0);
  const xMin = view.getInt16(p0 + 2);
  const yMin = view.getInt16(p0 + 4);
  const xMax = view.getInt16(p0 + 6);
  const yMax = view.getInt16(p0 + 8);
  let p = p0 + 10;
  if (nContours >= 0) {
    const endPts = [];
    for (let i = 0; i < nContours; i++) {
      endPts.push(view.getUint16(p));
      p += 2;
    }
    const nPts = nContours > 0 ? endPts[nContours - 1] + 1 : 0;
    const insLen = view.getUint16(p);
    p += 2;
    const instructions2 = new Uint8Array(view.buffer, view.byteOffset + p, insLen);
    p += insLen;
    const flags2 = new Uint8Array(nPts);
    for (let i = 0; i < nPts; ) {
      const f = view.getUint8(p++);
      flags2[i++] = f;
      if (f & 8) {
        let rep = view.getUint8(p++);
        while (rep-- > 0 && i < nPts) {
          flags2[i++] = f;
        }
      }
    }
    const xs = new Array(nPts);
    const ys = new Array(nPts);
    let v = 0;
    for (let i = 0; i < nPts; i++) {
      const f = flags2[i];
      if (f & 2) {
        const d = view.getUint8(p++);
        v += f & 16 ? d : -d;
      } else if (!(f & 16)) {
        v += view.getInt16(p);
        p += 2;
      }
      xs[i] = v;
    }
    v = 0;
    for (let i = 0; i < nPts; i++) {
      const f = flags2[i];
      if (f & 4) {
        const d = view.getUint8(p++);
        v += f & 32 ? d : -d;
      } else if (!(f & 32)) {
        v += view.getInt16(p);
        p += 2;
      }
      ys[i] = v;
    }
    const onCurve = new Array(nPts);
    for (let i = 0; i < nPts; i++) {
      onCurve[i] = (flags2[i] & 1) !== 0;
    }
    return { xs, ys, onCurve, endPts, instructions: instructions2, components: null, xMin, yMin, xMax, yMax };
  }
  const components = [];
  let flags = 0;
  do {
    flags = view.getUint16(p);
    const glyphIndex = view.getUint16(p + 2);
    p += 4;
    let arg1;
    let arg2;
    if (flags & 1) {
      arg1 = flags & ARGS_ARE_XY_VALUES ? view.getInt16(p) : view.getUint16(p);
      arg2 = flags & ARGS_ARE_XY_VALUES ? view.getInt16(p + 2) : view.getUint16(p + 2);
      p += 4;
    } else {
      arg1 = flags & ARGS_ARE_XY_VALUES ? view.getInt8(p) : view.getUint8(p);
      arg2 = flags & ARGS_ARE_XY_VALUES ? view.getInt8(p + 1) : view.getUint8(p + 1);
      p += 2;
    }
    let a = 1;
    let b = 0;
    let c = 0;
    let d = 1;
    if (flags & WE_HAVE_A_SCALE) {
      a = d = view.getInt16(p) / 16384;
      p += 2;
    } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
      a = view.getInt16(p) / 16384;
      d = view.getInt16(p + 2) / 16384;
      p += 4;
    } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
      a = view.getInt16(p) / 16384;
      b = view.getInt16(p + 2) / 16384;
      c = view.getInt16(p + 4) / 16384;
      d = view.getInt16(p + 6) / 16384;
      p += 8;
    }
    components.push({ glyphIndex, flags, arg1, arg2, a, b, c, d });
  } while (flags & MORE_COMPONENTS);
  let instructions = new Uint8Array(0);
  if (flags & WE_HAVE_INSTRUCTIONS) {
    const n = view.getUint16(p);
    instructions = new Uint8Array(view.buffer, view.byteOffset + p + 2, n);
  }
  return { xs: [], ys: [], onCurve: [], endPts: [], instructions, components, xMin, yMin, xMax, yMax };
}
function parseTrueTypeFace(view, base = 0) {
  const tables = readTables(view, base);
  if (!tables) {
    return null;
  }
  const head = tables.get("head");
  const hhea = tables.get("hhea");
  const maxp = tables.get("maxp");
  const hmtx = tables.get("hmtx");
  const loca = tables.get("loca");
  const glyf = tables.get("glyf");
  if (!head || !hhea || !maxp || !hmtx || !loca || !glyf) {
    return null;
  }
  const unitsPerEm = view.getUint16(head.offset + 18);
  const headFlags = view.getUint16(head.offset + 16);
  const macStyle = view.getUint16(head.offset + 44);
  const longLoca = view.getInt16(head.offset + 50) === 1;
  const numGlyphs = view.getUint16(maxp.offset + 4);
  const maxpV1 = maxp.length >= 32;
  const numHMetrics = view.getUint16(hhea.offset + 34);
  const names = readNames(view, tables.get("name"));
  const cmap = readCmap(view, tables.get("cmap"));
  const os2 = tables.get("OS/2");
  const post = tables.get("post");
  const cvtT = tables.get("cvt ");
  const fpgmT = tables.get("fpgm");
  const prepT = tables.get("prep");
  const gaspT = tables.get("gasp");
  const ltshT = tables.get("LTSH");
  const cvt = new Int16Array(cvtT ? cvtT.length >> 1 : 0);
  for (let i = 0; i < cvt.length; i++) {
    cvt[i] = view.getInt16(cvtT.offset + i * 2);
  }
  const bytes = (t) => t ? new Uint8Array(view.buffer, view.byteOffset + t.offset, t.length) : new Uint8Array(0);
  const gasp = [];
  if (gaspT && gaspT.length >= 4) {
    const n = view.getUint16(gaspT.offset + 2);
    for (let i = 0; i < n && 4 + i * 4 + 4 <= gaspT.length; i++) {
      gasp.push({
        maxPpem: view.getUint16(gaspT.offset + 4 + i * 4),
        behavior: view.getUint16(gaspT.offset + 6 + i * 4)
      });
    }
  }
  const locaAt = (g) => longLoca ? view.getUint32(loca.offset + g * 4) : view.getUint16(loca.offset + g * 2) * 2;
  const glyphCache = /* @__PURE__ */ new Map();
  return {
    family: names.get(1) ?? "",
    subfamily: names.get(2) ?? "",
    fullName: names.get(4) ?? "",
    typoFamily: names.get(16) ?? null,
    unitsPerEm,
    headFlags,
    macStyle,
    headYMax: view.getInt16(head.offset + 42),
    headYMin: view.getInt16(head.offset + 38),
    numGlyphs,
    hheaAscender: view.getInt16(hhea.offset + 4),
    hheaDescender: view.getInt16(hhea.offset + 6),
    hheaLineGap: view.getInt16(hhea.offset + 8),
    weightClass: os2 ? view.getUint16(os2.offset + 4) : macStyle & 1 ? 700 : 400,
    widthClass: os2 ? view.getUint16(os2.offset + 6) : 5,
    fsSelection: os2 ? view.getUint16(os2.offset + 62) : 0,
    winAscent: os2 ? view.getUint16(os2.offset + 74) : view.getInt16(hhea.offset + 4),
    winDescent: os2 ? view.getUint16(os2.offset + 76) : -view.getInt16(hhea.offset + 6),
    typoAscender: os2 ? view.getInt16(os2.offset + 68) : 0,
    typoDescender: os2 ? view.getInt16(os2.offset + 70) : 0,
    typoLineGap: os2 ? view.getInt16(os2.offset + 72) : 0,
    xAvgCharWidth: os2 ? view.getInt16(os2.offset + 2) : 0,
    strikeoutSize: os2 ? view.getInt16(os2.offset + 26) : 0,
    strikeoutPosition: os2 ? view.getInt16(os2.offset + 28) : 0,
    panose: os2 ? new Uint8Array(view.buffer, view.byteOffset + os2.offset + 32, 10) : null,
    underlinePosition: post ? view.getInt16(post.offset + 8) : 0,
    underlineThickness: post ? view.getInt16(post.offset + 10) : 0,
    isFixedPitch: post ? view.getUint32(post.offset + 12) !== 0 : false,
    isSymbol: cmap.symbol,
    maxStorage: maxpV1 ? view.getUint16(maxp.offset + 18) : 0,
    maxFunctionDefs: maxpV1 ? view.getUint16(maxp.offset + 20) : 0,
    maxInstructionDefs: maxpV1 ? view.getUint16(maxp.offset + 22) : 0,
    maxStackElements: maxpV1 ? view.getUint16(maxp.offset + 24) : 0,
    maxTwilightPoints: maxpV1 ? view.getUint16(maxp.offset + 16) : 0,
    cvt,
    fpgm: bytes(fpgmT),
    prep: bytes(prepT),
    gasp,
    hdmx: readHdmx(view, tables.get("hdmx"), numGlyphs),
    vdmx: readVdmx(view, tables.get("VDMX")),
    ltsh: ltshT && ltshT.length >= 4 + numGlyphs ? bytes(ltshT).subarray(4, 4 + numGlyphs) : null,
    glyphIndex: (cp) => {
      const g = cmap.lookup(cp);
      return g < numGlyphs ? g : 0;
    },
    hMetrics: (g) => {
      const i = Math.min(g, numHMetrics - 1);
      const advance = view.getUint16(hmtx.offset + i * 4);
      const lsb = g < numHMetrics ? view.getInt16(hmtx.offset + g * 4 + 2) : view.getInt16(hmtx.offset + numHMetrics * 4 + (g - numHMetrics) * 2);
      return { advance, lsb };
    },
    loadGlyph: (g) => {
      if (g < 0 || g >= numGlyphs) {
        return null;
      }
      let cached = glyphCache.get(g);
      if (cached === void 0) {
        try {
          cached = readGlyph(view, glyf, locaAt(g), locaAt(g + 1));
        } catch {
          cached = null;
        }
        glyphCache.set(g, cached);
      }
      return cached;
    }
  };
}
function parseFontFile(data) {
  const view = data instanceof ArrayBuffer ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
  try {
    if (view.byteLength >= 12 && tag(view, 0) === "ttcf") {
      const n = view.getUint32(8);
      const out = [];
      for (let i = 0; i < n && 12 + i * 4 + 4 <= view.byteLength; i++) {
        const face2 = parseTrueTypeFace(view, view.getUint32(12 + i * 4));
        if (face2) {
          out.push(face2);
        }
      }
      return out;
    }
    const face = parseTrueTypeFace(view, 0);
    return face ? [face] : [];
  } catch {
    return [];
  }
}

// src/ttf-hinting.ts
function mulFix(a, b) {
  return Math.floor((a * b + 32768) / 65536);
}
function mulDiv(a, b, c) {
  let s = 1;
  if (a < 0) {
    a = -a;
    s = -s;
  }
  if (b < 0) {
    b = -b;
    s = -s;
  }
  if (c < 0) {
    c = -c;
    s = -s;
  }
  const d = c > 0 ? Math.floor((a * b + Math.floor(c / 2)) / c) : 2147483647;
  return s < 0 ? -d : d;
}
function mulDivNoRound(a, b, c) {
  let s = 1;
  if (a < 0) {
    a = -a;
    s = -s;
  }
  if (c < 0) {
    c = -c;
    s = -s;
  }
  const d = c > 0 ? Math.floor(a * b / c) : 2147483647;
  return s < 0 ? -d : d;
}
function divFix(a, b) {
  let s = 1;
  if (a < 0) {
    a = -a;
    s = -s;
  }
  if (b < 0) {
    b = -b;
    s = -s;
  }
  const q = b === 0 ? 2147483647 : Math.floor((a * 65536 + Math.floor(b / 2)) / b);
  return s < 0 ? -q : q;
}
function dotFix14(ax, ay, bx, by) {
  const t = ax * bx + ay * by;
  return Math.floor((t + 8192 + (t < 0 ? -1 : 0)) / 16384);
}
function mulFix14(a, b) {
  const t = a * b;
  return Math.floor((t + 8192 + (t < 0 ? -1 : 0)) / 16384);
}
var floor64 = (x) => Math.floor(x / 64) * 64;
var round64 = (x) => floor64(x + 32);
var ceil64 = (x) => floor64(x + 63);
var ON_CURVE = 1;
var TOUCH_X = 8;
var TOUCH_Y = 16;
var Zone = class _Zone {
  constructor(n, endPts = []) {
    this.n = n;
    this.orusX = new Float64Array(n);
    this.orusY = new Float64Array(n);
    this.orgX = new Float64Array(n);
    this.orgY = new Float64Array(n);
    this.curX = new Float64Array(n);
    this.curY = new Float64Array(n);
    this.tags = new Uint8Array(n);
    this.endPts = endPts;
  }
  clone() {
    const z = new _Zone(this.n, this.endPts.slice());
    z.orusX.set(this.orusX);
    z.orusY.set(this.orusY);
    z.orgX.set(this.orgX);
    z.orgY.set(this.orgY);
    z.curX.set(this.curX);
    z.curY.set(this.curY);
    z.tags.set(this.tags);
    return z;
  }
};
function defaultGS() {
  return {
    rp0: 0,
    rp1: 0,
    rp2: 0,
    pvx: 16384,
    pvy: 0,
    fvx: 16384,
    fvy: 0,
    dvx: 16384,
    dvy: 0,
    loop: 1,
    minDist: 64,
    roundState: 1,
    autoFlip: true,
    cvtCutIn: 68,
    swCutIn: 0,
    swValue: 0,
    deltaBase: 9,
    deltaShift: 3,
    instructControl: 0,
    scanControl: false,
    scanType: 0,
    gep0: 1,
    gep1: 1,
    gep2: 1,
    period: 64,
    phase: 0,
    threshold: 32
  };
}
var HintError = class extends Error {
};
var MAX_INSTRUCTIONS = 1e6;
var HintedSize = class _HintedSize {
  constructor(font, ppemX, ppemY, env, hinting = true) {
    this.fdefs = [];
    this.idefs = /* @__PURE__ */ new Map();
    this.prepOk = true;
    // Execution state.
    this.stack = [];
    this.gs = defaultGS();
    this.fDotP = 16384;
    this.inPrep = false;
    /** The projection vector was set by SPVTL (for the ClearType RDTG exception). */
    this.pvFromSpvtl = false;
    /** Active function-call frames (for the ClearType legacy-function signatures). */
    this.callFrames = [];
    /** The glyph program being run belongs to a composite glyph. */
    this.inComposite = false;
    this.count = 0;
    this.font = font;
    this.env = env;
    this.hinting = hinting;
    const upem = font.unitsPerEm;
    this.xScale = divFix(ppemX * 64, upem);
    this.yScale = divFix(ppemY * 64, upem);
    if (ppemX >= ppemY) {
      this.ppem = ppemX;
      this.scale = this.xScale;
      this.xRatio = 65536;
      this.yRatio = divFix(ppemY, ppemX);
    } else {
      this.ppem = ppemY;
      this.scale = this.yScale;
      this.xRatio = divFix(ppemX, ppemY);
      this.yRatio = 65536;
    }
    this.stretched = ppemX !== ppemY;
    this.cvt0 = new Float64Array(font.cvt.length);
    for (let i = 0; i < font.cvt.length; i++) {
      this.cvt0[i] = mulFix(font.cvt[i], this.scale);
    }
    this.storage0 = new Float64Array(font.maxStorage);
    this.twilight0 = new Zone(font.maxTwilightPoints + 4);
    this.gs0 = defaultGS();
    if (hinting) {
      this.runSetup();
    }
  }
  /** Runs fpgm then prep and records the post-prep state every glyph starts from. */
  runSetup() {
    this.cvt = this.cvt0;
    this.storage = this.storage0;
    this.twilight = this.twilight0;
    this.pts = new Zone(0);
    this.zp0 = this.zp1 = this.zp2 = this.pts;
    this.gs = defaultGS();
    this.computeFuncs();
    try {
      this.execute(this.font.fpgm);
    } catch {
      this.prepOk = false;
    }
    this.gs = defaultGS();
    this.computeFuncs();
    this.inPrep = true;
    this.zp0 = this.zp1 = this.zp2 = this.pts;
    try {
      this.execute(this.font.prep);
    } catch {
    }
    this.inPrep = false;
    const gs = this.gs;
    gs.pvx = gs.fvx = gs.dvx = 16384;
    gs.pvy = gs.fvy = gs.dvy = 0;
    gs.rp0 = gs.rp1 = gs.rp2 = 0;
    gs.gep0 = gs.gep1 = gs.gep2 = 1;
    gs.loop = 1;
    this.gs0 = { ...gs };
  }
  /** Whether glyph programs are allowed to run at this size (INSTCTRL bit 0). */
  get glyphHinting() {
    return this.hinting && this.prepOk && (this.gs0.instructControl & 1) === 0;
  }
  /** The scan-conversion mode prep left, used when a glyph program doesn't set its own. */
  get defaultScan() {
    return { scanControl: this.gs0.scanControl, scanType: this.gs0.scanType };
  }
  // -----------------------------------------------------------------------
  // Glyph loading
  // -----------------------------------------------------------------------
  /** Loads and grid-fits glyph `g`. Never throws. */
  hintGlyph(g) {
    const { advance } = this.font.hMetrics(g);
    const res = this.loadRecursive(g, 0);
    const n = res.zone.n - 4;
    const pp1x = res.zone.curX[n];
    const pp2x = res.zone.curX[n + 1];
    const xs = new Float64Array(n);
    const ys = new Float64Array(n);
    const onCurve = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      xs[i] = res.zone.curX[i] - pp1x;
      ys[i] = res.zone.curY[i];
      onCurve[i] = res.zone.tags[i] & ON_CURVE;
    }
    return {
      xs,
      ys,
      onCurve,
      endPts: res.zone.endPts,
      advance: pp2x - pp1x,
      linearAdvance: mulFix(advance, this.xScale),
      scanControl: res.scanControl,
      scanType: res.scanType
    };
  }
  /**
   * Loads glyph `g` into a fresh zone (points + 4 phantom points), scaled
   * and, when hinting is on, instructed. Composite glyphs are assembled
   * from their hinted components and then run their own program.
   */
  loadRecursive(g, depth) {
    const font = this.font;
    const glyph = depth < 8 ? font.loadGlyph(g) : null;
    const { advance, lsb } = font.hMetrics(g);
    const xMin = glyph ? glyph.xMin : 0;
    glyph ? glyph.yMax : 0;
    const pp1 = xMin - lsb;
    const typoAsc = font.typoAscender || font.hheaAscender;
    const typoDesc = font.typoDescender || font.hheaDescender;
    const phantomOrus = [
      [pp1, 0],
      [pp1 + advance, 0],
      [0, typoAsc],
      [0, typoDesc]
    ];
    const scan = this.defaultScan;
    if (!glyph || !glyph.components && glyph.endPts.length === 0) {
      const zone2 = new Zone(4);
      for (let i = 0; i < 4; i++) {
        zone2.orusX[i] = phantomOrus[i][0];
        zone2.orusY[i] = phantomOrus[i][1];
        zone2.orgX[i] = zone2.curX[i] = mulFix(phantomOrus[i][0], this.xScale);
        zone2.orgY[i] = zone2.curY[i] = mulFix(phantomOrus[i][1], this.yScale);
      }
      if (this.hinting) {
        zone2.curX[0] = round64(zone2.curX[0]);
        zone2.curX[1] = round64(zone2.curX[1]);
        zone2.curY[2] = round64(zone2.curY[2]);
        zone2.curY[3] = round64(zone2.curY[3]);
      }
      return { zone: zone2, ...scan };
    }
    if (!glyph.components) {
      const n = glyph.xs.length;
      const zone2 = new Zone(n + 4, glyph.endPts.slice());
      for (let i = 0; i < n; i++) {
        zone2.orusX[i] = glyph.xs[i];
        zone2.orusY[i] = glyph.ys[i];
        zone2.tags[i] = glyph.onCurve[i] ? ON_CURVE : 0;
      }
      for (let i = 0; i < 4; i++) {
        zone2.orusX[n + i] = phantomOrus[i][0];
        zone2.orusY[n + i] = phantomOrus[i][1];
      }
      for (let i = 0; i < n + 4; i++) {
        zone2.orgX[i] = zone2.curX[i] = mulFix(zone2.orusX[i], this.xScale);
        zone2.orgY[i] = zone2.curY[i] = mulFix(zone2.orusY[i], this.yScale);
      }
      return this.hintZone(zone2, glyph.instructions);
    }
    const parts = [];
    let total = 0;
    let metricsFrom = null;
    let lastScan = scan;
    for (const comp of glyph.components) {
      const sub = this.loadRecursive(comp.glyphIndex, depth + 1);
      lastScan = { scanControl: sub.scanControl, scanType: sub.scanType };
      const z = sub.zone;
      const m = z.n - 4;
      if (comp.flags & (WE_HAVE_A_SCALE | WE_HAVE_AN_X_AND_Y_SCALE | WE_HAVE_A_TWO_BY_TWO)) {
        for (let i = 0; i < z.n; i++) {
          const tx = (x2, y2) => Math.round(x2 * comp.a + y2 * comp.c);
          const ty = (x2, y2) => Math.round(x2 * comp.b + y2 * comp.d);
          let x = z.curX[i];
          let y = z.curY[i];
          z.curX[i] = tx(x, y);
          z.curY[i] = ty(x, y);
          x = z.orgX[i];
          y = z.orgY[i];
          z.orgX[i] = tx(x, y);
          z.orgY[i] = ty(x, y);
          x = z.orusX[i];
          y = z.orusY[i];
          z.orusX[i] = x * comp.a + y * comp.c;
          z.orusY[i] = x * comp.b + y * comp.d;
        }
      }
      let dx;
      let dy;
      let dxOrus = 0;
      let dyOrus = 0;
      if (comp.flags & ARGS_ARE_XY_VALUES) {
        dxOrus = comp.arg1;
        dyOrus = comp.arg2;
        dx = mulFix(comp.arg1, this.xScale);
        dy = mulFix(comp.arg2, this.yScale);
        if (this.hinting && comp.flags & ROUND_XY_TO_GRID) {
          dx = round64(dx);
          dy = round64(dy);
        }
      } else {
        const p1 = comp.arg1;
        const p2 = comp.arg2;
        let px = 0;
        let py = 0;
        let seen = 0;
        for (const part2 of parts) {
          const pm = part2.n;
          if (p1 < seen + pm) {
            px = part2.curX[p1 - seen];
            py = part2.curY[p1 - seen];
            break;
          }
          seen += pm;
        }
        dx = p2 < m ? px - z.curX[p2] : 0;
        dy = p2 < m ? py - z.curY[p2] : 0;
      }
      const part = new Zone(m, z.endPts.slice());
      for (let i = 0; i < m; i++) {
        part.orusX[i] = z.orusX[i] + dxOrus;
        part.orusY[i] = z.orusY[i] + dyOrus;
        part.orgX[i] = z.orgX[i] + dx;
        part.orgY[i] = z.orgY[i] + dy;
        part.curX[i] = z.curX[i] + dx;
        part.curY[i] = z.curY[i] + dy;
        part.tags[i] = z.tags[i] & ON_CURVE;
      }
      if (comp.flags & USE_MY_METRICS) {
        metricsFrom = z;
      }
      parts.push(part);
      total += m;
    }
    const zone = new Zone(total + 4);
    let at = 0;
    for (const part of parts) {
      zone.orusX.set(part.orusX, at);
      zone.orusY.set(part.orusY, at);
      zone.orgX.set(part.orgX, at);
      zone.orgY.set(part.orgY, at);
      zone.curX.set(part.curX, at);
      zone.curY.set(part.curY, at);
      zone.tags.set(part.tags, at);
      for (const e of part.endPts) {
        zone.endPts.push(e + at);
      }
      at += part.n;
    }
    for (let i = 0; i < 4; i++) {
      const k = total + i;
      if (metricsFrom) {
        const mk = metricsFrom.n - 4 + i;
        zone.orusX[k] = metricsFrom.orusX[mk];
        zone.orusY[k] = metricsFrom.orusY[mk];
        zone.orgX[k] = metricsFrom.orgX[mk];
        zone.orgY[k] = metricsFrom.orgY[mk];
        zone.curX[k] = metricsFrom.curX[mk];
        zone.curY[k] = metricsFrom.curY[mk];
      } else {
        zone.orusX[k] = phantomOrus[i][0];
        zone.orusY[k] = phantomOrus[i][1];
        zone.orgX[k] = zone.curX[k] = mulFix(phantomOrus[i][0], this.xScale);
        zone.orgY[k] = zone.curY[k] = mulFix(phantomOrus[i][1], this.yScale);
      }
    }
    if (glyph.instructions.length > 0 && this.glyphHinting) {
      zone.orgX.set(zone.curX);
      zone.orgY.set(zone.curY);
      this.inComposite = true;
      const hinted = this.hintZone(zone, glyph.instructions, !metricsFrom);
      this.inComposite = false;
      return hinted;
    }
    if (this.hinting && !metricsFrom) {
      zone.curX[total] = round64(zone.curX[total]);
      zone.curX[total + 1] = round64(zone.curX[total + 1]);
      zone.curY[total + 2] = round64(zone.curY[total + 2]);
      zone.curY[total + 3] = round64(zone.curY[total + 3]);
    }
    return { zone, ...lastScan };
  }
  /** Rounds the phantom points and runs a glyph program over `zone`. */
  hintZone(zone, instructions, roundPhantoms = true) {
    const n = zone.n;
    if (this.hinting && roundPhantoms) {
      const rx = this.env.clearType ? (v) => Math.floor((v + 2) / 4) * 4 : round64;
      zone.curX[n - 4] = rx(zone.curX[n - 4]);
      zone.curX[n - 3] = rx(zone.curX[n - 3]);
      zone.curY[n - 2] = round64(zone.curY[n - 2]);
      zone.curY[n - 1] = round64(zone.curY[n - 1]);
    }
    if (!this.glyphHinting || instructions.length === 0) {
      return { zone, ...this.defaultScan };
    }
    this.gs = this.gs0.instructControl & 2 ? defaultGS() : { ...this.gs0 };
    this.cvt = this.cvt0.slice();
    this.storage = this.storage0.slice();
    this.twilight = this.twilight0.clone();
    this.pts = zone;
    this.zp0 = this.zp1 = this.zp2 = zone;
    this.stack = [];
    this.computeFuncs();
    try {
      this.execute(instructions);
    } catch {
    }
    return { zone, scanControl: this.gs.scanControl, scanType: this.gs.scanType };
  }
  // -----------------------------------------------------------------------
  // Vector / projection machinery
  // -----------------------------------------------------------------------
  computeFuncs() {
    const gs = this.gs;
    if (gs.fvx === 16384) {
      this.fDotP = gs.pvx;
    } else if (gs.fvy === 16384) {
      this.fDotP = gs.pvy;
    } else {
      this.fDotP = Math.floor((gs.pvx * gs.fvx + gs.pvy * gs.fvy) / 16384);
    }
    if (Math.abs(this.fDotP) < 1024) {
      this.fDotP = 16384;
    }
  }
  project(dx, dy) {
    return dotFix14(dx, dy, this.gs.pvx, this.gs.pvy);
  }
  dualProject(dx, dy) {
    return dotFix14(dx, dy, this.gs.dvx, this.gs.dvy);
  }
  /** Dual projection of an orus (font unit) difference, scaled to 26.6. */
  dualProjectOrus(dx, dy) {
    if (this.xScale === this.yScale) {
      return mulFix(this.dualProject(dx, dy), this.xScale);
    }
    return this.dualProject(mulFix(dx, this.xScale), mulFix(dy, this.yScale));
  }
  normalize(x, y) {
    if (x === 0 && y === 0) {
      return [16384, 0];
    }
    const len = Math.hypot(x, y);
    return [Math.round(x / len * 16384), Math.round(y / len * 16384)];
  }
  currentRatio() {
    if (!this.stretched) {
      return 65536;
    }
    const gs = this.gs;
    if (gs.pvy === 0) {
      return this.xRatio;
    }
    if (gs.pvx === 0) {
      return this.yRatio;
    }
    const x = mulDiv(gs.pvx, this.xRatio, 16384);
    const y = mulDiv(gs.pvy, this.yRatio, 16384);
    return Math.round(Math.hypot(x, y));
  }
  currentPpem() {
    return this.stretched ? mulFix(this.ppem, this.currentRatio()) : this.ppem;
  }
  readCvt(i) {
    if (i < 0 || i >= this.cvt.length) {
      throw new HintError("cvt");
    }
    return this.stretched ? mulFix(this.cvt[i], this.currentRatio()) : this.cvt[i];
  }
  writeCvt(i, v) {
    if (i < 0 || i >= this.cvt.length) {
      return;
    }
    this.cvt[i] = this.stretched ? divFix(v, this.currentRatio()) : v;
  }
  moveCvt(i, v) {
    if (i < 0 || i >= this.cvt.length) {
      return;
    }
    this.cvt[i] += this.stretched ? divFix(v, this.currentRatio()) : v;
  }
  move(zone, p, distance) {
    const gs = this.gs;
    if (gs.fvx !== 0) {
      zone.curX[p] += this.moveAmt(distance, gs.fvx);
      zone.tags[p] |= TOUCH_X;
    }
    if (gs.fvy !== 0) {
      zone.curY[p] += this.moveAmt(distance, gs.fvy);
      zone.tags[p] |= TOUCH_Y;
    }
  }
  /** A projected distance converted to a move along one freedom-vector component. */
  moveAmt(distance, f) {
    return mulDiv(distance, f, this.fDotP);
  }
  moveOrig(zone, p, distance) {
    const gs = this.gs;
    if (gs.fvx !== 0) {
      zone.orgX[p] += mulDiv(distance, gs.fvx, this.fDotP);
    }
    if (gs.fvy !== 0) {
      zone.orgY[p] += mulDiv(distance, gs.fvy, this.fDotP);
    }
  }
  /**
   * Backward-compatible ClearType reads storage 22 (TypeMan Talk
   * DStroke/IStroke), 24 (spacing functions) and 8 (VacuFormRound) as 0
   * inside the functions whose signatures Microsoft documents, which
   * bypasses them.
   */
  ctBypassStorage(i) {
    if (!this.ctCompat() || i !== 22 && i !== 24 && i !== 8) {
      return false;
    }
    const frame2 = this.callFrames[this.callFrames.length - 1];
    if (!frame2) {
      return false;
    }
    const c = frame2.def.code;
    const s = frame2.def.start;
    const at = (bytes) => bytes.every((b, k) => c[s + k] === b);
    if (i === 22) {
      return at([176, 22, 67, 88]);
    }
    if (i === 24) {
      return at([1, 176, 24, 67, 88]) || at([1, 24, 176, 24, 67, 88]);
    }
    return at([69, 35, 70, 96, 32, 176, 38]);
  }
  /** True when the projection vector points (mostly) along x, ClearType's direction. */
  ctDirection() {
    const gs = this.gs;
    return !!this.env.clearType && Math.abs(gs.pvx) > Math.abs(gs.pvy);
  }
  /** Backward-compatible ClearType: ClearType on and the font has not set INSTCTRL selector 3. */
  ctCompat() {
    return !!this.env.clearType && (this.gs0.instructControl & 4) === 0 && (this.gs.instructControl & 4) === 0;
  }
  /** CVT cut-in along the current projection (1/16 of it in the ClearType direction). */
  cutIn() {
    return this.ctDirection() ? this.gs.cvtCutIn / 16 : this.gs.cvtCutIn;
  }
  /** Minimum distance along the current projection (halved in the ClearType direction). */
  minDistance() {
    return this.ctDirection() ? Math.floor(this.gs.minDist / 2) : this.gs.minDist;
  }
  /**
   * Rounds `d` per the round state. In the ClearType direction the grid
   * is the 1/16-pixel virtual grid, except in prep and for RDTG after
   * SPVTL, which round on the physical grid.
   */
  round(d, mode = this.gs.roundState) {
    if (mode <= 5 && this.ctDirection() && !this.inPrep && !(mode === 3 && this.pvFromSpvtl)) {
      return this.roundPhysical(d * 16, mode) / 16;
    }
    return this.roundPhysical(d, mode);
  }
  roundPhysical(d, mode = this.gs.roundState) {
    const gs = this.gs;
    let v;
    switch (mode) {
      case 0:
        if (d >= 0) {
          v = floor64(d) + 32;
          if (v < 0) v = 32;
        } else {
          v = -(floor64(-d) + 32);
          if (v > 0) v = -32;
        }
        return v;
      case 1:
        if (d >= 0) {
          v = round64(d);
          if (v < 0) v = 0;
        } else {
          v = -round64(-d);
          if (v > 0) v = 0;
        }
        return v;
      case 2:
        if (d >= 0) {
          v = Math.floor((d + 16) / 32) * 32;
          if (v < 0) v = 0;
        } else {
          v = -Math.floor((-d + 16) / 32) * 32;
          if (v > 0) v = 0;
        }
        return v;
      case 3:
        if (d >= 0) {
          v = floor64(d);
          if (v < 0) v = 0;
        } else {
          v = -floor64(-d);
          if (v > 0) v = 0;
        }
        return v;
      case 4:
        if (d >= 0) {
          v = ceil64(d);
          if (v < 0) v = 0;
        } else {
          v = -ceil64(-d);
          if (v > 0) v = 0;
        }
        return v;
      case 5:
        return d;
      case 6:
        if (d >= 0) {
          v = Math.floor((d - gs.phase + gs.threshold) / gs.period) * gs.period;
          v += gs.phase;
          if (v < 0) v = gs.phase;
        } else {
          v = -(Math.floor((gs.threshold - gs.phase - d) / gs.period) * gs.period);
          v -= gs.phase;
          if (v > 0) v = -gs.phase;
        }
        return v;
      case 7:
        if (d >= 0) {
          v = Math.trunc((d - gs.phase + gs.threshold) / gs.period) * gs.period;
          v += gs.phase;
          if (v < 0) v = gs.phase;
        } else {
          v = -(Math.trunc((gs.threshold - gs.phase - d) / gs.period) * gs.period);
          v -= gs.phase;
          if (v > 0) v = -gs.phase;
        }
        return v;
      default:
        return d;
    }
  }
  setSuperRound(gridPeriod, selector) {
    const gs = this.gs;
    let period;
    switch (selector & 192) {
      case 0:
        period = Math.trunc(gridPeriod / 2);
        break;
      case 128:
        period = gridPeriod * 2;
        break;
      default:
        period = gridPeriod;
    }
    let phase;
    switch (selector & 48) {
      case 0:
        phase = 0;
        break;
      case 16:
        phase = Math.trunc(period / 4);
        break;
      case 32:
        phase = Math.trunc(period / 2);
        break;
      default:
        phase = Math.trunc(period * 3 / 4);
    }
    let threshold;
    if ((selector & 15) === 0) {
      threshold = period - 1;
    } else {
      threshold = Math.trunc(((selector & 15) - 4) * period / 8);
    }
    gs.period = Math.floor(period / 256);
    gs.phase = Math.floor(phase / 256);
    gs.threshold = Math.floor(threshold / 256);
    if (gs.period === 0) {
      gs.period = 1;
    }
  }
  /** The zone a SZP* argument names, or null for an invalid one (ignored, as GDI does). */
  zone(n) {
    if (n === 0) {
      return this.twilight;
    }
    if (n === 1) {
      return this.pts;
    }
    return null;
  }
  // -----------------------------------------------------------------------
  // Execution loop
  // -----------------------------------------------------------------------
  pop() {
    if (this.stack.length === 0) {
      throw new HintError("underflow");
    }
    return this.stack.pop();
  }
  push(v) {
    this.stack.push(v | 0);
  }
  /** Returns the length of the instruction at `ip` (for skipping). */
  static insLength(code, ip) {
    const op = code[ip];
    if (op === 64) {
      return 2 + code[ip + 1];
    }
    if (op === 65) {
      return 2 + code[ip + 1] * 2;
    }
    if (op >= 176 && op <= 183) {
      return 2 + (op - 176);
    }
    if (op >= 184 && op <= 191) {
      return 1 + (op - 184 + 1) * 2;
    }
    return 1;
  }
  execute(code) {
    const calls = [];
    this.callFrames = calls;
    let ip = 0;
    let cur = code;
    while (true) {
      if (ip >= cur.length) {
        if (calls.length === 0) {
          return;
        }
        throw new HintError("eof");
      }
      if (++this.count > MAX_INSTRUCTIONS) {
        throw new HintError("too long");
      }
      const op = cur[ip];
      let next = ip + _HintedSize.insLength(cur, ip);
      switch (op) {
        // ---- control flow handled inline ----
        case 88: {
          const cond = this.pop();
          if (cond === 0) {
            let nIfs = 1;
            let p = next;
            while (p < cur.length) {
              const o = cur[p];
              if (o === 88) {
                nIfs++;
              } else if (o === 27 && nIfs === 1) {
                break;
              } else if (o === 89) {
                nIfs--;
                if (nIfs === 0) {
                  break;
                }
              }
              p += _HintedSize.insLength(cur, p);
            }
            next = p + 1;
          }
          break;
        }
        case 27: {
          let nIfs = 1;
          let p = next;
          while (p < cur.length) {
            const o = cur[p];
            if (o === 88) {
              nIfs++;
            } else if (o === 89) {
              nIfs--;
              if (nIfs === 0) {
                break;
              }
            }
            p += _HintedSize.insLength(cur, p);
          }
          next = p + 1;
          break;
        }
        case 89:
          break;
        case 28: {
          const off = this.pop();
          next = ip + off;
          if (off === 0 || next < 0) {
            throw new HintError("jmpr");
          }
          break;
        }
        case 120: {
          const e = this.pop();
          const off = this.pop();
          if (e !== 0) {
            next = ip + off;
            if (off === 0 || next < 0) {
              throw new HintError("jrot");
            }
          }
          break;
        }
        case 121: {
          const e = this.pop();
          const off = this.pop();
          if (e === 0) {
            next = ip + off;
            if (off === 0 || next < 0) {
              throw new HintError("jrof");
            }
          }
          break;
        }
        case 44: {
          const f = this.pop();
          let p = next;
          while (p < cur.length && cur[p] !== 45) {
            if (cur[p] === 44 || cur[p] === 137) {
              throw new HintError("nested");
            }
            p += _HintedSize.insLength(cur, p);
          }
          if (f < 0 || f > 65535) {
            throw new HintError("fdef");
          }
          this.fdefs[f] = { code: cur, start: next, end: p };
          next = p + 1;
          break;
        }
        case 137: {
          const o = this.pop();
          let p = next;
          while (p < cur.length && cur[p] !== 45) {
            p += _HintedSize.insLength(cur, p);
          }
          this.idefs.set(o & 255, { code: cur, start: next, end: p });
          next = p + 1;
          break;
        }
        case 45: {
          const frame2 = calls.pop();
          if (!frame2) {
            throw new HintError("endf");
          }
          frame2.count--;
          if (frame2.count > 0) {
            calls.push(frame2);
            cur = frame2.def.code;
            ip = frame2.def.start;
            continue;
          }
          cur = frame2.code;
          ip = frame2.ip;
          continue;
        }
        case 43: {
          const f = this.pop();
          const def = this.fdefs[f];
          if (!def) {
            throw new HintError("call");
          }
          if (calls.length > 64) {
            throw new HintError("depth");
          }
          calls.push({ code: cur, ip: next, def, count: 1 });
          cur = def.code;
          ip = def.start;
          continue;
        }
        case 42: {
          const f = this.pop();
          const cnt = this.pop();
          const def = this.fdefs[f];
          if (!def) {
            throw new HintError("loopcall");
          }
          if (cnt > 0) {
            if (calls.length > 64) {
              throw new HintError("depth");
            }
            calls.push({ code: cur, ip: next, def, count: cnt });
            cur = def.code;
            ip = def.start;
            continue;
          }
          break;
        }
        default: {
          if (!this.step(op, cur, ip)) {
            const def = this.idefs.get(op);
            if (!def) {
              throw new HintError(`opcode ${op}`);
            }
            calls.push({ code: cur, ip: next, def, count: 1 });
            cur = def.code;
            ip = def.start;
            continue;
          }
        }
      }
      ip = next;
    }
  }
  /** Executes one non-flow-control instruction. Returns false for an undefined opcode. */
  step(op, code, ip) {
    const gs = this.gs;
    if (op >= 192) {
      if (op >= 224) {
        this.insMIRP(op);
      } else {
        this.insMDRP(op);
      }
      return true;
    }
    if (op >= 176) {
      if (op <= 183) {
        const n = op - 176 + 1;
        for (let i = 0; i < n; i++) {
          this.push(code[ip + 1 + i]);
        }
      } else {
        const n = op - 184 + 1;
        for (let i = 0; i < n; i++) {
          this.push((code[ip + 1 + i * 2] << 8 | code[ip + 2 + i * 2]) << 16 >> 16);
        }
      }
      return true;
    }
    switch (op) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5: {
        const x = (op & 1) !== 0;
        const ax = x ? 16384 : 0;
        const ay = x ? 0 : 16384;
        if (op < 4) {
          gs.pvx = gs.dvx = ax;
          gs.pvy = gs.dvy = ay;
          this.pvFromSpvtl = false;
        }
        if (op < 2 || op >= 4) {
          gs.fvx = ax;
          gs.fvy = ay;
        }
        this.computeFuncs();
        return true;
      }
      case 6:
      case 7:
      case 8:
      case 9: {
        const a1 = this.pop();
        const a0 = this.pop();
        if (a1 < 0 || a1 >= this.zp2.n || a0 < 0 || a0 >= this.zp1.n) {
          return true;
        }
        let A = this.zp1.curX[a0] - this.zp2.curX[a1];
        let B = this.zp1.curY[a0] - this.zp2.curY[a1];
        let opc = op;
        if (A === 0 && B === 0) {
          A = 16384;
          opc = 0;
        }
        if (opc & 1) {
          const C = B;
          B = A;
          A = -C;
        }
        const [vx, vy] = this.normalize(A, B);
        if (op < 8) {
          gs.pvx = gs.dvx = vx;
          gs.pvy = gs.dvy = vy;
          this.pvFromSpvtl = true;
        } else {
          gs.fvx = vx;
          gs.fvy = vy;
        }
        this.computeFuncs();
        return true;
      }
      case 10:
      case 11: {
        const y = this.pop() << 16 >> 16;
        const x = this.pop() << 16 >> 16;
        const [vx, vy] = this.normalize(x, y);
        if (op === 10) {
          gs.pvx = gs.dvx = vx;
          gs.pvy = gs.dvy = vy;
          this.pvFromSpvtl = false;
        } else {
          gs.fvx = vx;
          gs.fvy = vy;
        }
        this.computeFuncs();
        return true;
      }
      case 12:
        this.push(gs.pvx);
        this.push(gs.pvy);
        return true;
      case 13:
        this.push(gs.fvx);
        this.push(gs.fvy);
        return true;
      case 14:
        gs.fvx = gs.pvx;
        gs.fvy = gs.pvy;
        this.computeFuncs();
        return true;
      case 15:
        this.insISECT();
        return true;
      case 16:
        gs.rp0 = this.pop();
        return true;
      case 17:
        gs.rp1 = this.pop();
        return true;
      case 18:
        gs.rp2 = this.pop();
        return true;
      case 19:
      case 20:
      case 21:
      case 22: {
        const z = this.pop();
        const zone = this.zone(z);
        if (!zone) {
          return true;
        }
        if (op === 19 || op === 22) {
          this.zp0 = zone;
          gs.gep0 = z;
        }
        if (op === 20 || op === 22) {
          this.zp1 = zone;
          gs.gep1 = z;
        }
        if (op === 21 || op === 22) {
          this.zp2 = zone;
          gs.gep2 = z;
        }
        return true;
      }
      case 23: {
        const n = this.pop();
        if (n < 0) {
          throw new HintError("sloop");
        }
        gs.loop = Math.min(n, 65535);
        return true;
      }
      case 24:
        gs.roundState = 1;
        return true;
      case 25:
        gs.roundState = 0;
        return true;
      case 26:
        gs.minDist = this.pop();
        return true;
      case 29:
        gs.cvtCutIn = this.pop();
        return true;
      case 30:
        gs.swCutIn = this.pop();
        return true;
      case 31:
        gs.swValue = mulFix(this.pop(), this.scale);
        return true;
      case 32: {
        const v = this.pop();
        this.push(v);
        this.push(v);
        return true;
      }
      case 33:
        this.pop();
        return true;
      case 34:
        this.stack.length = 0;
        return true;
      case 35: {
        const b = this.pop();
        const a = this.pop();
        this.push(b);
        this.push(a);
        return true;
      }
      case 36:
        this.push(this.stack.length);
        return true;
      case 37: {
        const k = this.pop();
        this.push(k <= 0 || k > this.stack.length ? 0 : this.stack[this.stack.length - k]);
        return true;
      }
      case 38: {
        const k = this.pop();
        if (k <= 0 || k > this.stack.length) {
          return true;
        }
        const v = this.stack.splice(this.stack.length - k, 1)[0];
        this.push(v);
        return true;
      }
      case 39: {
        const p2 = this.pop();
        const p1 = this.pop();
        if (p1 < 0 || p1 >= this.zp1.n || p2 < 0 || p2 >= this.zp0.n) {
          return true;
        }
        const d = Math.trunc(
          this.project(this.zp0.curX[p2] - this.zp1.curX[p1], this.zp0.curY[p2] - this.zp1.curY[p1]) / 2
        );
        this.move(this.zp1, p1, d);
        this.move(this.zp0, p2, -d);
        return true;
      }
      case 41: {
        const p = this.pop();
        if (p < 0 || p >= this.zp0.n) {
          return true;
        }
        let mask = 255;
        if (gs.fvx !== 0) mask &= ~TOUCH_X;
        if (gs.fvy !== 0) mask &= ~TOUCH_Y;
        this.zp0.tags[p] &= mask;
        return true;
      }
      case 46:
      case 47: {
        const p = this.pop();
        if (p < 0 || p >= this.zp0.n) {
          return true;
        }
        let d = 0;
        if (op & 1) {
          const c = this.project(this.zp0.curX[p], this.zp0.curY[p]);
          d = this.round(c) - c;
        }
        this.move(this.zp0, p, d);
        gs.rp0 = gs.rp1 = p;
        return true;
      }
      case 48:
      case 49:
        this.insIUP(op & 1);
        return true;
      case 50:
      case 51:
        this.insSHP(op);
        return true;
      case 52:
      case 53:
        this.insSHC(op);
        return true;
      case 54:
      case 55:
        this.insSHZ(op);
        return true;
      case 56: {
        const amt = this.pop();
        const dx = mulFix14(amt, gs.fvx);
        const dy = mulFix14(amt, gs.fvy);
        while (gs.loop > 0) {
          const p = this.pop();
          if (p >= 0 && p < this.zp2.n) {
            const keep = !this.ctCompat() || this.inComposite || gs.fvx === 0 && (this.zp2.tags[p] & TOUCH_Y) !== 0;
            if (keep) {
              this.moveZp2(p, dx, dy, true);
            }
          }
          gs.loop--;
        }
        gs.loop = 1;
        return true;
      }
      case 57:
        this.insIP();
        return true;
      case 58:
      case 59: {
        const d = this.pop();
        const p = this.pop();
        if (p < 0 || p >= this.zp1.n || gs.rp0 < 0 || gs.rp0 >= this.zp0.n) {
          return true;
        }
        if (gs.gep1 === 0) {
          this.zp1.orgX[p] = this.zp0.orgX[gs.rp0];
          this.zp1.orgY[p] = this.zp0.orgY[gs.rp0];
          this.moveOrig(this.zp1, p, d);
          this.zp1.curX[p] = this.zp1.orgX[p];
          this.zp1.curY[p] = this.zp1.orgY[p];
        }
        const dist = this.project(
          this.zp1.curX[p] - this.zp0.curX[gs.rp0],
          this.zp1.curY[p] - this.zp0.curY[gs.rp0]
        );
        let target = d;
        if (this.ctCompat() && gs.gep0 !== 0 && gs.gep1 !== 0) {
          const org = this.dualProjectOrus(
            this.zp1.orusX[p] - this.zp0.orusX[gs.rp0],
            this.zp1.orusY[p] - this.zp0.orusY[gs.rp0]
          );
          if (org !== 0 && Math.abs(d - org) > this.cutIn()) {
            target = org;
          }
        }
        this.move(this.zp1, p, target - dist);
        gs.rp1 = gs.rp0;
        gs.rp2 = p;
        if (op & 1) {
          gs.rp0 = p;
        }
        return true;
      }
      case 60: {
        while (gs.loop > 0) {
          const p = this.pop();
          if (p >= 0 && p < this.zp1.n && gs.rp0 >= 0 && gs.rp0 < this.zp0.n) {
            const d = this.project(
              this.zp1.curX[p] - this.zp0.curX[gs.rp0],
              this.zp1.curY[p] - this.zp0.curY[gs.rp0]
            );
            this.move(this.zp1, p, -d);
          }
          gs.loop--;
        }
        gs.loop = 1;
        return true;
      }
      case 61:
        gs.roundState = 2;
        return true;
      case 62:
      case 63:
        this.insMIAP(op);
        return true;
      case 64: {
        const n = code[ip + 1];
        for (let i = 0; i < n; i++) {
          this.push(code[ip + 2 + i]);
        }
        return true;
      }
      case 65: {
        const n = code[ip + 1];
        for (let i = 0; i < n; i++) {
          this.push((code[ip + 2 + i * 2] << 8 | code[ip + 3 + i * 2]) << 16 >> 16);
        }
        return true;
      }
      case 66: {
        const v = this.pop();
        const i = this.pop();
        if (i >= 0 && i < this.storage.length) {
          this.storage[i] = v;
        }
        return true;
      }
      case 67: {
        const i = this.pop();
        this.push(i >= 0 && i < this.storage.length && !this.ctBypassStorage(i) ? this.storage[i] : 0);
        return true;
      }
      case 68: {
        const v = this.pop();
        const i = this.pop();
        this.writeCvt(i, v);
        return true;
      }
      case 69: {
        const i = this.pop();
        this.push(i >= 0 && i < this.cvt.length ? this.readCvt(i) : 0);
        return true;
      }
      case 70:
      case 71: {
        const p = this.pop();
        if (p < 0 || p >= this.zp2.n) {
          this.push(0);
          return true;
        }
        this.push(
          op & 1 ? this.dualProject(this.zp2.orgX[p], this.zp2.orgY[p]) : this.project(this.zp2.curX[p], this.zp2.curY[p])
        );
        return true;
      }
      case 72: {
        const v = this.pop();
        const p = this.pop();
        if (p < 0 || p >= this.zp2.n) {
          return true;
        }
        const k = this.project(this.zp2.curX[p], this.zp2.curY[p]);
        this.move(this.zp2, p, v - k);
        if (gs.gep2 === 0) {
          this.zp2.orgX[p] = this.zp2.curX[p];
          this.zp2.orgY[p] = this.zp2.curY[p];
        }
        return true;
      }
      case 73:
      case 74: {
        const k = this.pop();
        const l = this.pop();
        if (l < 0 || l >= this.zp0.n || k < 0 || k >= this.zp1.n) {
          this.push(0);
          return true;
        }
        let d;
        if (op & 1) {
          d = this.project(this.zp0.curX[l] - this.zp1.curX[k], this.zp0.curY[l] - this.zp1.curY[k]);
        } else if (gs.gep0 === 0 || gs.gep1 === 0) {
          d = this.dualProject(this.zp0.orgX[l] - this.zp1.orgX[k], this.zp0.orgY[l] - this.zp1.orgY[k]);
        } else {
          d = this.dualProjectOrus(this.zp0.orusX[l] - this.zp1.orusX[k], this.zp0.orusY[l] - this.zp1.orusY[k]);
        }
        this.push(d);
        return true;
      }
      case 75:
        this.push(this.currentPpem());
        return true;
      case 76:
        this.push(12);
        return true;
      case 77:
        gs.autoFlip = true;
        return true;
      case 78:
        gs.autoFlip = false;
        return true;
      case 79:
        this.pop();
        return true;
      case 80:
      case 81:
      case 82:
      case 83:
      case 84:
      case 85: {
        const b = this.pop();
        const a = this.pop();
        const r = op === 80 ? a < b : op === 81 ? a <= b : op === 82 ? a > b : op === 83 ? a >= b : op === 84 ? a === b : a !== b;
        this.push(r ? 1 : 0);
        return true;
      }
      case 86:
      case 87: {
        const odd = (this.round(this.pop()) & 127) === 64;
        this.push((op === 86 ? odd : !odd) ? 1 : 0);
        return true;
      }
      case 90:
      case 91: {
        const b = this.pop();
        const a = this.pop();
        this.push((op === 90 ? a !== 0 && b !== 0 : a !== 0 || b !== 0) ? 1 : 0);
        return true;
      }
      case 92:
        this.push(this.pop() === 0 ? 1 : 0);
        return true;
      case 93:
      case 113:
      case 114:
        this.insDELTAP(op);
        return true;
      case 115:
      case 116:
      case 117:
        this.insDELTAC(op);
        return true;
      case 94:
        gs.deltaBase = this.pop() & 65535;
        return true;
      case 95:
        gs.deltaShift = this.pop() & 65535;
        if (gs.deltaShift > 6) {
          throw new HintError("sds");
        }
        return true;
      case 96: {
        const b = this.pop();
        const a = this.pop();
        this.push(a + b);
        return true;
      }
      case 97: {
        const b = this.pop();
        const a = this.pop();
        this.push(a - b);
        return true;
      }
      case 98: {
        const b = this.pop();
        const a = this.pop();
        if (b === 0) {
          throw new HintError("div0");
        }
        this.push(mulDivNoRound(a, 64, b));
        return true;
      }
      case 99: {
        const b = this.pop();
        const a = this.pop();
        this.push(mulDiv(a, b, 64));
        return true;
      }
      case 100:
        this.push(Math.abs(this.pop()));
        return true;
      case 101:
        this.push(-this.pop());
        return true;
      case 102:
        this.push(floor64(this.pop()));
        return true;
      case 103:
        this.push(ceil64(this.pop()));
        return true;
      case 104:
      case 105:
      case 106:
      case 107:
        this.push(this.round(this.pop()));
        return true;
      case 108:
      case 109:
      case 110:
      case 111:
        return true;
      case 112: {
        const v = this.pop();
        const i = this.pop();
        if (i >= 0 && i < this.cvt.length) {
          this.cvt[i] = mulFix(v, this.scale);
        }
        return true;
      }
      case 118:
        this.setSuperRound(16384, this.pop());
        gs.roundState = 6;
        return true;
      case 119:
        this.setSuperRound(11585, this.pop());
        gs.roundState = 7;
        return true;
      case 122:
        gs.roundState = 5;
        return true;
      case 124:
        gs.roundState = 4;
        return true;
      case 125:
        gs.roundState = 3;
        return true;
      case 126:
      case 127:
        this.pop();
        return true;
      case 128: {
        while (gs.loop > 0) {
          const p = this.pop();
          if (p >= 0 && p < this.pts.n) {
            this.pts.tags[p] ^= ON_CURVE;
          }
          gs.loop--;
        }
        gs.loop = 1;
        return true;
      }
      case 129:
      case 130: {
        const k = this.pop();
        const l = this.pop();
        if (k < 0 || k >= this.pts.n || l < 0 || l > k) {
          return true;
        }
        for (let i = l; i <= k; i++) {
          if (op === 129) {
            this.pts.tags[i] |= ON_CURVE;
          } else {
            this.pts.tags[i] &= ~ON_CURVE;
          }
        }
        return true;
      }
      case 133: {
        const v = this.pop();
        const a = v & 255;
        if (a === 255) {
          gs.scanControl = true;
          return true;
        }
        if (a === 0) {
          gs.scanControl = false;
          return true;
        }
        if (v & 256 && this.ppem <= a) gs.scanControl = true;
        if (v & 512 && this.env.rotated) gs.scanControl = true;
        if (v & 1024 && this.stretched) gs.scanControl = true;
        if (v & 2048 && this.ppem > a) gs.scanControl = false;
        if (v & 4096 && this.env.rotated) gs.scanControl = false;
        if (v & 8192 && this.stretched) gs.scanControl = false;
        return true;
      }
      case 134:
      case 135:
        this.insSDPVTL(op);
        return true;
      case 136: {
        const sel = this.pop();
        let k = 0;
        if (sel & 1) k = this.env.version;
        if (sel & 2 && this.env.rotated) k |= 1 << 8;
        if (sel & 4 && this.stretched) k |= 1 << 9;
        if (sel & 32 && this.env.grayscale) k |= 1 << 12;
        if (sel & 64 && this.env.clearType) k |= 1 << 13;
        if (sel & 128 && this.env.clearType && this.env.compatibleWidths !== false) k |= 1 << 14;
        if (sel & 256 && this.env.symmetricSmoothing) k |= 1 << 15;
        this.push(k);
        return true;
      }
      case 138: {
        const a = this.pop();
        const b = this.pop();
        const c = this.pop();
        this.push(b);
        this.push(a);
        this.push(c);
        return true;
      }
      case 139: {
        const b = this.pop();
        const a = this.pop();
        this.push(Math.max(a, b));
        return true;
      }
      case 140: {
        const b = this.pop();
        const a = this.pop();
        this.push(Math.min(a, b));
        return true;
      }
      case 141: {
        const v = this.pop();
        if (v >= 0) {
          gs.scanType = v & 65535;
        }
        return true;
      }
      case 142: {
        const k = this.pop();
        const l = this.pop();
        if (k < 1 || k > 3) {
          throw new HintError("instctrl");
        }
        if (!this.inPrep) {
          return true;
        }
        const bit = 1 << k - 1;
        gs.instructControl = gs.instructControl & ~bit | (l ? bit : 0);
        return true;
      }
      default:
        return false;
    }
  }
  // -----------------------------------------------------------------------
  // Individual instructions
  // -----------------------------------------------------------------------
  moveZp2(p, dx, dy, touch) {
    const gs = this.gs;
    if (gs.fvx !== 0) {
      this.zp2.curX[p] += dx;
      if (touch) this.zp2.tags[p] |= TOUCH_X;
    }
    if (gs.fvy !== 0) {
      this.zp2.curY[p] += dy;
      if (touch) this.zp2.tags[p] |= TOUCH_Y;
    }
  }
  pointDisplacement(op) {
    const gs = this.gs;
    const zone = op & 1 ? this.zp0 : this.zp1;
    const ref = op & 1 ? gs.rp1 : gs.rp2;
    if (ref < 0 || ref >= zone.n) {
      return null;
    }
    const d = this.project(zone.curX[ref] - zone.orgX[ref], zone.curY[ref] - zone.orgY[ref]);
    return {
      dx: mulDiv(d, gs.fvx, this.fDotP),
      dy: mulDiv(d, gs.fvy, this.fDotP),
      zone,
      ref
    };
  }
  insSHP(op) {
    const gs = this.gs;
    const disp = this.pointDisplacement(op);
    while (gs.loop > 0) {
      const p = this.pop();
      if (disp && p >= 0 && p < this.zp2.n) {
        this.moveZp2(p, disp.dx, disp.dy, true);
      }
      gs.loop--;
    }
    gs.loop = 1;
  }
  insSHC(op) {
    const gs = this.gs;
    const contour = this.pop();
    const bounds = gs.gep2 === 0 ? 1 : this.zp2.endPts.length;
    if (contour < 0 || contour >= bounds) {
      return;
    }
    const disp = this.pointDisplacement(op);
    if (!disp) {
      return;
    }
    const start = contour === 0 ? 0 : this.zp2.endPts[contour - 1] + 1;
    const limit = gs.gep2 === 0 ? this.zp2.n : this.zp2.endPts[contour] + 1;
    for (let i = start; i < limit; i++) {
      if (disp.zone !== this.zp2 || disp.ref !== i) {
        this.moveZp2(i, disp.dx, disp.dy, true);
      }
    }
  }
  insSHZ(op) {
    const gs = this.gs;
    const z = this.pop();
    if (z < 0 || z > 1) {
      return;
    }
    const disp = this.pointDisplacement(op);
    if (!disp) {
      return;
    }
    let limit;
    if (gs.gep2 === 0) {
      limit = this.zp2.n;
    } else if (gs.gep2 === 1 && this.zp2.endPts.length > 0) {
      limit = this.zp2.endPts[this.zp2.endPts.length - 1] + 1;
    } else {
      limit = 0;
    }
    for (let i = 0; i < limit; i++) {
      if (disp.zone !== this.zp2 || disp.ref !== i) {
        this.moveZp2(i, disp.dx, disp.dy, false);
      }
    }
  }
  insMIAP(op) {
    const gs = this.gs;
    const cvtEntry = this.pop();
    const p = this.pop();
    if (p < 0 || p >= this.zp0.n || cvtEntry < 0 || cvtEntry >= this.cvt.length) {
      gs.rp0 = gs.rp1 = p;
      return;
    }
    let distance = this.readCvt(cvtEntry);
    if (gs.gep0 === 0) {
      this.zp0.orgX[p] = mulFix14(distance, gs.fvx);
      this.zp0.orgY[p] = mulFix14(distance, gs.fvy);
      this.zp0.curX[p] = this.zp0.orgX[p];
      this.zp0.curY[p] = this.zp0.orgY[p];
    }
    const orgDist = this.project(this.zp0.curX[p], this.zp0.curY[p]);
    if (op & 1) {
      if (Math.abs(distance - orgDist) > this.cutIn()) {
        distance = orgDist;
      }
      distance = this.round(distance);
    }
    this.move(this.zp0, p, distance - orgDist);
    gs.rp0 = gs.rp1 = p;
  }
  insMDRP(op) {
    const gs = this.gs;
    const p = this.pop();
    if (p < 0 || p >= this.zp1.n || gs.rp0 < 0 || gs.rp0 >= this.zp0.n) {
      gs.rp1 = gs.rp0;
      gs.rp2 = p;
      if (op & 16) gs.rp0 = p;
      return;
    }
    let orgDist;
    if (gs.gep0 === 0 || gs.gep1 === 0) {
      orgDist = this.dualProject(this.zp1.orgX[p] - this.zp0.orgX[gs.rp0], this.zp1.orgY[p] - this.zp0.orgY[gs.rp0]);
    } else {
      orgDist = this.dualProjectOrus(
        this.zp1.orusX[p] - this.zp0.orusX[gs.rp0],
        this.zp1.orusY[p] - this.zp0.orusY[gs.rp0]
      );
    }
    if (gs.swCutIn > 0 && orgDist < gs.swValue + gs.swCutIn && orgDist > gs.swValue - gs.swCutIn) {
      orgDist = orgDist >= 0 ? gs.swValue : -gs.swValue;
    }
    let distance = op & 4 ? this.round(orgDist) : orgDist;
    if (op & 8) {
      if (orgDist >= 0) {
        if (distance < this.minDistance()) distance = this.minDistance();
      } else if (distance > -this.minDistance()) {
        distance = -this.minDistance();
      }
    }
    const cur = this.project(this.zp1.curX[p] - this.zp0.curX[gs.rp0], this.zp1.curY[p] - this.zp0.curY[gs.rp0]);
    this.move(this.zp1, p, distance - cur);
    gs.rp1 = gs.rp0;
    gs.rp2 = p;
    if (op & 16) gs.rp0 = p;
  }
  insMIRP(op) {
    const gs = this.gs;
    const cvtIdx = this.pop() + 1;
    const p = this.pop();
    if (p < 0 || p >= this.zp1.n || cvtIdx < 0 || cvtIdx > this.cvt.length || gs.rp0 < 0 || gs.rp0 >= this.zp0.n) {
      gs.rp1 = gs.rp0;
      if (op & 16) gs.rp0 = p;
      gs.rp2 = p;
      return;
    }
    let cvtDist = cvtIdx === 0 ? 0 : this.readCvt(cvtIdx - 1);
    if (Math.abs(cvtDist - gs.swValue) < gs.swCutIn) {
      cvtDist = cvtDist >= 0 ? gs.swValue : -gs.swValue;
    }
    if (gs.gep1 === 0) {
      this.zp1.orgX[p] = this.zp0.orgX[gs.rp0] + mulFix14(cvtDist, gs.fvx);
      this.zp1.orgY[p] = this.zp0.orgY[gs.rp0] + mulFix14(cvtDist, gs.fvy);
      this.zp1.curX[p] = this.zp1.orgX[p];
      this.zp1.curY[p] = this.zp1.orgY[p];
    }
    const orgDist = this.dualProject(this.zp1.orgX[p] - this.zp0.orgX[gs.rp0], this.zp1.orgY[p] - this.zp0.orgY[gs.rp0]);
    const curDist = this.project(this.zp1.curX[p] - this.zp0.curX[gs.rp0], this.zp1.curY[p] - this.zp0.curY[gs.rp0]);
    if (gs.autoFlip && orgDist < 0 !== cvtDist < 0) {
      cvtDist = -cvtDist;
    }
    let distance;
    if (op & 4) {
      if (gs.gep0 === gs.gep1) {
        if (Math.abs(cvtDist - orgDist) > this.cutIn()) {
          cvtDist = orgDist;
        }
      }
      distance = this.round(cvtDist);
    } else {
      if (this.env.clearType && this.ctCompat() && gs.gep0 === gs.gep1 && Math.abs(cvtDist - orgDist) > this.cutIn()) {
        cvtDist = orgDist;
      }
      distance = cvtDist;
    }
    if (op & 8) {
      if (orgDist >= 0) {
        if (distance < this.minDistance()) distance = this.minDistance();
      } else if (distance > -this.minDistance()) {
        distance = -this.minDistance();
      }
    }
    this.move(this.zp1, p, distance - curDist);
    gs.rp1 = gs.rp0;
    if (op & 16) gs.rp0 = p;
    gs.rp2 = p;
  }
  insIP() {
    const gs = this.gs;
    const twilight = gs.gep0 === 0 || gs.gep1 === 0 || gs.gep2 === 0;
    const rp1 = gs.rp1;
    const rp2 = gs.rp2;
    let oldRange = 0;
    let curRange = 0;
    if (rp1 < 0 || rp1 >= this.zp0.n) {
      gs.loop = 1;
      return;
    }
    const valid = rp2 >= 0 && rp2 < this.zp1.n;
    if (valid) {
      if (twilight) {
        oldRange = this.dualProject(this.zp1.orgX[rp2] - this.zp0.orgX[rp1], this.zp1.orgY[rp2] - this.zp0.orgY[rp1]);
      } else {
        oldRange = this.dualProjectOrusRaw(
          this.zp1.orusX[rp2] - this.zp0.orusX[rp1],
          this.zp1.orusY[rp2] - this.zp0.orusY[rp1]
        );
      }
      curRange = this.project(this.zp1.curX[rp2] - this.zp0.curX[rp1], this.zp1.curY[rp2] - this.zp0.curY[rp1]);
    }
    while (gs.loop > 0) {
      const p = this.pop();
      gs.loop--;
      if (p < 0 || p >= this.zp2.n) {
        continue;
      }
      let orgDist;
      if (twilight) {
        orgDist = this.dualProject(this.zp2.orgX[p] - this.zp0.orgX[rp1], this.zp2.orgY[p] - this.zp0.orgY[rp1]);
      } else {
        orgDist = this.dualProjectOrusRaw(this.zp2.orusX[p] - this.zp0.orusX[rp1], this.zp2.orusY[p] - this.zp0.orusY[rp1]);
      }
      const curDist = this.project(this.zp2.curX[p] - this.zp0.curX[rp1], this.zp2.curY[p] - this.zp0.curY[rp1]);
      let newDist;
      if (orgDist) {
        newDist = oldRange ? mulDiv(orgDist, curRange, oldRange) : orgDist;
      } else {
        newDist = 0;
      }
      this.move(this.zp2, p, newDist - curDist);
    }
    gs.loop = 1;
  }
  /** IP's orus projection: unscaled when both axes share one scale (only the ratio matters). */
  dualProjectOrusRaw(dx, dy) {
    if (this.xScale === this.yScale) {
      return this.dualProject(dx, dy);
    }
    return this.dualProject(mulFix(dx, this.xScale), mulFix(dy, this.yScale));
  }
  insIUP(xAxis) {
    const z = this.pts;
    const mask = xAxis ? TOUCH_X : TOUCH_Y;
    const orgs = xAxis ? z.orgX : z.orgY;
    const curs = xAxis ? z.curX : z.curY;
    const orus = xAxis ? z.orusX : z.orusY;
    const nContours = z.endPts.length;
    let point = 0;
    for (let contour = 0; contour < nContours; contour++) {
      let endPoint = z.endPts[contour];
      const firstPoint = point;
      if (endPoint >= z.n) {
        endPoint = z.n - 1;
      }
      while (point <= endPoint && (z.tags[point] & mask) === 0) {
        point++;
      }
      if (point <= endPoint) {
        const firstTouched = point;
        let curTouched = point;
        point++;
        while (point <= endPoint) {
          if (z.tags[point] & mask) {
            iupInterpolate(orgs, curs, orus, curTouched + 1, point - 1, curTouched, point);
            curTouched = point;
          }
          point++;
        }
        if (curTouched === firstTouched) {
          const d = curs[curTouched] - orgs[curTouched];
          for (let i = firstPoint; i <= endPoint; i++) {
            if (i !== curTouched) {
              curs[i] += d;
            }
          }
        } else {
          iupInterpolate(orgs, curs, orus, curTouched + 1, endPoint, curTouched, firstTouched);
          if (firstTouched > 0) {
            iupInterpolate(orgs, curs, orus, firstPoint, firstTouched - 1, curTouched, firstTouched);
          }
        }
      }
      point = endPoint + 1;
    }
  }
  insISECT() {
    const b1 = this.pop();
    const b0 = this.pop();
    const a1 = this.pop();
    const a0 = this.pop();
    const p = this.pop();
    const zp0 = this.zp0;
    const zp1 = this.zp1;
    const zp2 = this.zp2;
    if (p < 0 || p >= zp2.n || a0 < 0 || a0 >= zp1.n || a1 < 0 || a1 >= zp1.n || b0 < 0 || b0 >= zp0.n || b1 < 0 || b1 >= zp0.n) {
      return;
    }
    const dbx = zp0.curX[b1] - zp0.curX[b0];
    const dby = zp0.curY[b1] - zp0.curY[b0];
    const dax = zp1.curX[a1] - zp1.curX[a0];
    const day = zp1.curY[a1] - zp1.curY[a0];
    const dx = zp0.curX[b0] - zp1.curX[a0];
    const dy = zp0.curY[b0] - zp1.curY[a0];
    const disc = mulDiv(dax, -dby, 64) + mulDiv(day, dbx, 64);
    const dot = mulDiv(dax, dbx, 64) + mulDiv(day, dby, 64);
    if (19 * Math.abs(disc) > Math.abs(dot)) {
      const val = mulDiv(dx, -dby, 64) + mulDiv(dy, dbx, 64);
      zp2.curX[p] = zp1.curX[a0] + mulDiv(val, dax, disc);
      zp2.curY[p] = zp1.curY[a0] + mulDiv(val, day, disc);
    } else {
      zp2.curX[p] = Math.trunc((zp1.curX[a0] + zp1.curX[a1] + zp0.curX[b0] + zp0.curX[b1]) / 4);
      zp2.curY[p] = Math.trunc((zp1.curY[a0] + zp1.curY[a1] + zp0.curY[b0] + zp0.curY[b1]) / 4);
    }
    zp2.tags[p] |= TOUCH_X | TOUCH_Y;
  }
  insSDPVTL(op) {
    const gs = this.gs;
    const p1 = this.pop();
    const p2 = this.pop();
    if (p1 < 0 || p1 >= this.zp2.n || p2 < 0 || p2 >= this.zp1.n) {
      return;
    }
    let opc = op;
    let A = this.zp1.orgX[p2] - this.zp2.orgX[p1];
    let B = this.zp1.orgY[p2] - this.zp2.orgY[p1];
    if (A === 0 && B === 0) {
      A = 16384;
      opc = 0;
    }
    if (opc & 1) {
      const C = B;
      B = A;
      A = -C;
    }
    [gs.dvx, gs.dvy] = this.normalize(A, B);
    opc = op;
    A = this.zp1.curX[p2] - this.zp2.curX[p1];
    B = this.zp1.curY[p2] - this.zp2.curY[p1];
    if (A === 0 && B === 0) {
      A = 16384;
      opc = 0;
    }
    if (opc & 1) {
      const C = B;
      B = A;
      A = -C;
    }
    [gs.pvx, gs.pvy] = this.normalize(A, B);
    this.pvFromSpvtl = false;
    this.computeFuncs();
  }
  insDELTAP(op) {
    const n = this.pop();
    const ppem = this.currentPpem();
    for (let k = 1; k <= n; k++) {
      if (this.stack.length < 2) {
        this.stack.length = 0;
        return;
      }
      const a = this.pop();
      const b = this.pop();
      if (a < 0 || a >= this.zp0.n) {
        continue;
      }
      let c = (b & 240) >> 4;
      if (op === 113) c += 16;
      if (op === 114) c += 32;
      c += this.gs.deltaBase;
      if (ppem === c) {
        let s = (b & 15) - 8;
        if (s >= 0) s++;
        s *= 1 << 6 - this.gs.deltaShift;
        if (this.ctCompat() && !(this.gs.fvx === 0 && (this.zp0.tags[a] & TOUCH_Y) !== 0)) {
          continue;
        }
        this.move(this.zp0, a, s);
      }
    }
  }
  insDELTAC(op) {
    const n = this.pop();
    const ppem = this.currentPpem();
    for (let k = 1; k <= n; k++) {
      if (this.stack.length < 2) {
        this.stack.length = 0;
        return;
      }
      const a = this.pop();
      const b = this.pop();
      let c = (b & 240) >> 4;
      if (op === 116) c += 16;
      if (op === 117) c += 32;
      c += this.gs.deltaBase;
      if (ppem === c) {
        let s = (b & 15) - 8;
        if (s >= 0) s++;
        s *= 1 << 6 - this.gs.deltaShift;
        this.moveCvt(a, s);
      }
    }
  }
};
function iupInterpolate(orgs, curs, orus, p1, p2, ref1, ref2) {
  if (p1 > p2) {
    return;
  }
  let orus1 = orus[ref1];
  let orus2 = orus[ref2];
  if (orus1 > orus2) {
    const t = orus1;
    orus1 = orus2;
    orus2 = t;
    const r = ref1;
    ref1 = ref2;
    ref2 = r;
  }
  const org1 = orgs[ref1];
  const org2 = orgs[ref2];
  const cur1 = curs[ref1];
  const cur2 = curs[ref2];
  const delta1 = cur1 - org1;
  const delta2 = cur2 - org2;
  if (cur1 === cur2 || orus1 === orus2) {
    for (let i = p1; i <= p2; i++) {
      let x = orgs[i];
      if (x <= org1) x += delta1;
      else if (x >= org2) x += delta2;
      else x = cur1;
      curs[i] = x;
    }
    return;
  }
  for (let i = p1; i <= p2; i++) {
    let x = orgs[i];
    if (x <= org1) {
      x += delta1;
    } else if (x >= org2) {
      x += delta2;
    } else {
      x = cur1 + mulDiv(orus[i] - orus1, cur2 - cur1, orus2 - orus1);
    }
    curs[i] = x;
  }
}

// src/ttf-raster.ts
var FLOW_UP = 8;
var OVERSHOOT_TOP = 16;
var OVERSHOOT_BOTTOM = 32;
function newProfile() {
  return { flags: 0, start: 0, height: 0, xs: [], next: null, X: 0, offset: 0, countL: 0 };
}
var UNKNOWN = 0;
var ASCENDING = 1;
var DESCENDING = 2;
function dropoutMode(scanControl, scanType) {
  if (!scanControl) {
    return 2;
  }
  switch (scanType) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 4:
      return 4;
    case 5:
      return 5;
    default:
      return 2;
  }
}
var Raster = class {
  constructor(dropOutControl) {
    this.dropOutControl = dropOutControl;
    this.minY = 0;
    this.maxY = 0;
    this.profiles = [];
    this.cProfile = newProfile();
    this.gProfile = null;
    this.fresh = false;
    this.joint = false;
    this.state = UNKNOWN;
    this.lastX = 0;
    this.lastY = 0;
    this.arcX = [];
    this.arcY = [];
    this.arc = 0;
    this.precBits = 16;
    this.precStep = 4096;
    this.precJitter = 480;
    this.prec = 2 ** this.precBits;
    this.precHalf = this.prec / 2;
    this.precScale = this.prec / 64;
  }
  floorP(x) {
    return Math.floor(x / this.prec) * this.prec;
  }
  ceilP(x) {
    return Math.floor((x + this.prec - 1) / this.prec) * this.prec;
  }
  trunc(x) {
    return Math.floor(x / this.prec);
  }
  frac(x) {
    return x - this.floorP(x);
  }
  scaled(x) {
    return x * this.precScale - this.precHalf;
  }
  isBottomOvershoot(y) {
    return this.ceilP(y) - y >= this.precHalf;
  }
  isTopOvershoot(y) {
    return y - this.floorP(y) >= this.precHalf;
  }
  // -------------------------------------------------------------------
  // Profile construction
  // -------------------------------------------------------------------
  newProfileState(state, overshoot) {
    const p = this.cProfile;
    p.start = 0;
    p.height = 0;
    p.xs = [];
    p.next = null;
    p.flags = this.dropOutControl;
    if (state === ASCENDING) {
      p.flags |= FLOW_UP;
      if (overshoot) p.flags |= OVERSHOOT_BOTTOM;
    } else if (overshoot) {
      p.flags |= OVERSHOOT_TOP;
    }
    if (!this.gProfile) {
      this.gProfile = p;
    }
    this.state = state;
    this.fresh = true;
    this.joint = false;
  }
  endProfile(overshoot) {
    const p = this.cProfile;
    const h = p.xs.length;
    if (h > 0) {
      if (overshoot) {
        p.flags |= p.flags & FLOW_UP ? OVERSHOOT_TOP : OVERSHOOT_BOTTOM;
      }
      p.height = h;
      this.profiles.push(p);
      const slot = newProfile();
      p.next = slot;
      this.cProfile = slot;
    }
    this.joint = false;
  }
  lineUp(x1, y1, x2, y2, miny, maxy) {
    let dx = x2 - x1;
    const dy = y2 - y1;
    if (dy <= 0 || y2 < miny || y1 > maxy) {
      return;
    }
    let e1;
    let f1;
    let e2;
    let f2;
    if (y1 < miny) {
      x1 += mulDivRound(dx, miny - y1, dy);
      e1 = this.trunc(miny);
      f1 = 0;
    } else {
      e1 = this.trunc(y1);
      f1 = this.frac(y1);
    }
    if (y2 > maxy) {
      e2 = this.trunc(maxy);
      f2 = 0;
    } else {
      e2 = this.trunc(y2);
      f2 = this.frac(y2);
    }
    const xs = this.cProfile.xs;
    if (f1 > 0) {
      if (e1 === e2) {
        return;
      }
      x1 += mulDivRound(dx, this.prec - f1, dy);
      e1 += 1;
    } else if (this.joint) {
      xs.pop();
      this.joint = false;
    }
    this.joint = f2 === 0;
    if (this.fresh) {
      this.cProfile.start = e1;
      this.fresh = false;
    }
    let size = e2 - e1 + 1;
    let ix;
    let rx;
    if (dx > 0) {
      ix = Math.floor(this.prec * dx / dy);
      rx = this.prec * dx % dy;
      dx = 1;
    } else {
      ix = -Math.floor(this.prec * -dx / dy);
      rx = this.prec * -dx % dy;
      dx = -1;
    }
    let ax = -dy;
    while (size > 0) {
      xs.push(x1);
      x1 += ix;
      ax += rx;
      if (ax >= 0) {
        ax -= dy;
        x1 += dx;
      }
      size--;
    }
  }
  lineDown(x1, y1, x2, y2, miny, maxy) {
    const fresh = this.fresh;
    this.lineUp(x1, -y1, x2, -y2, -maxy, -miny);
    if (fresh && !this.fresh) {
      this.cProfile.start = -this.cProfile.start;
    }
  }
  splitConic(base) {
    const X = this.arcX;
    const Y = this.arcY;
    X[base + 4] = X[base + 2];
    let a = X[base] + X[base + 1];
    let b = X[base + 1] + X[base + 2];
    X[base + 3] = Math.floor(b / 2);
    X[base + 2] = Math.floor((a + b) / 4);
    X[base + 1] = Math.floor(a / 2);
    Y[base + 4] = Y[base + 2];
    a = Y[base] + Y[base + 1];
    b = Y[base + 1] + Y[base + 2];
    Y[base + 3] = Math.floor(b / 2);
    Y[base + 2] = Math.floor((a + b) / 4);
    Y[base + 1] = Math.floor(a / 2);
  }
  bezierUp(miny, maxy) {
    const X = this.arcX;
    const Y = this.arcY;
    let arc = this.arc;
    const xs = this.cProfile.xs;
    let y1 = Y[arc + 2];
    let y2 = Y[arc];
    const fin = () => {
      this.arc -= 2;
    };
    if (y2 < miny || y1 > maxy) {
      fin();
      return;
    }
    let e2 = this.floorP(y2);
    if (e2 > maxy) e2 = maxy;
    let e0 = miny;
    let e;
    if (y1 < miny) {
      e = miny;
    } else {
      e = this.ceilP(y1);
      const f1 = this.frac(y1);
      e0 = e;
      if (f1 === 0) {
        if (this.joint) {
          xs.pop();
          this.joint = false;
        }
        xs.push(X[arc + 2]);
        e += this.prec;
      }
    }
    if (this.fresh) {
      this.cProfile.start = this.trunc(e0);
      this.fresh = false;
    }
    if (e2 < e) {
      fin();
      return;
    }
    const startArc = arc;
    do {
      this.joint = false;
      y2 = Y[arc];
      if (y2 > e) {
        y1 = Y[arc + 2];
        if (y2 - y1 >= this.precStep) {
          this.splitConic(arc);
          arc += 2;
        } else {
          xs.push(X[arc + 2] + mulDivRound(X[arc] - X[arc + 2], e - y1, y2 - y1));
          arc -= 2;
          e += this.prec;
        }
      } else {
        if (y2 === e) {
          this.joint = true;
          xs.push(X[arc]);
          e += this.prec;
        }
        arc -= 2;
      }
    } while (arc >= startArc && e <= e2);
    fin();
  }
  bezierDown(miny, maxy) {
    const Y = this.arcY;
    const a = this.arc;
    Y[a] = -Y[a];
    Y[a + 1] = -Y[a + 1];
    Y[a + 2] = -Y[a + 2];
    const fresh = this.fresh;
    this.bezierUp(-maxy, -miny);
    if (fresh && !this.fresh) {
      this.cProfile.start = -this.cProfile.start;
    }
    Y[a] = -Y[a];
  }
  lineTo(x, y) {
    switch (this.state) {
      case UNKNOWN:
        if (y > this.lastY) {
          this.newProfileState(ASCENDING, this.isBottomOvershoot(this.lastY));
        } else if (y < this.lastY) {
          this.newProfileState(DESCENDING, this.isTopOvershoot(this.lastY));
        }
        break;
      case ASCENDING:
        if (y < this.lastY) {
          this.endProfile(this.isTopOvershoot(this.lastY));
          this.newProfileState(DESCENDING, this.isTopOvershoot(this.lastY));
        }
        break;
      case DESCENDING:
        if (y > this.lastY) {
          this.endProfile(this.isBottomOvershoot(this.lastY));
          this.newProfileState(ASCENDING, this.isBottomOvershoot(this.lastY));
        }
        break;
    }
    if (this.state === ASCENDING) {
      this.lineUp(this.lastX, this.lastY, x, y, this.minY, this.maxY);
    } else if (this.state === DESCENDING) {
      this.lineDown(this.lastX, this.lastY, x, y, this.minY, this.maxY);
    }
    this.lastX = x;
    this.lastY = y;
  }
  conicTo(cx, cy, x, y) {
    const X = this.arcX;
    const Y = this.arcY;
    this.arc = 0;
    X[2] = this.lastX;
    Y[2] = this.lastY;
    X[1] = cx;
    Y[1] = cy;
    X[0] = x;
    Y[0] = y;
    let x3 = x;
    let y3 = y;
    do {
      const a = this.arc;
      const y1 = Y[a + 2];
      const y2 = Y[a + 1];
      y3 = Y[a];
      x3 = X[a];
      let ymin;
      let ymax;
      if (y1 <= y3) {
        ymin = y1;
        ymax = y3;
      } else {
        ymin = y3;
        ymax = y1;
      }
      if (y2 < ymin || y2 > ymax) {
        this.splitConic(a);
        this.arc += 2;
      } else if (y1 === y3) {
        this.arc -= 2;
      } else {
        const stateBez = y1 < y3 ? ASCENDING : DESCENDING;
        if (this.state !== stateBez) {
          const o = stateBez === ASCENDING ? this.isBottomOvershoot(y1) : this.isTopOvershoot(y1);
          if (this.state !== UNKNOWN) {
            this.endProfile(o);
          }
          this.newProfileState(stateBez, o);
        }
        if (stateBez === ASCENDING) {
          this.bezierUp(this.minY, this.maxY);
        } else {
          this.bezierDown(this.minY, this.maxY);
        }
      }
    } while (this.arc >= 0);
    this.lastX = x3;
    this.lastY = y3;
  }
  decomposeContour(o, first, last, flipped) {
    const px = (i) => this.scaled(flipped ? o.ys[i] : o.xs[i]);
    const py = (i) => this.scaled(flipped ? o.xs[i] : o.ys[i]);
    let startX = px(first);
    let startY = py(first);
    const lastX = px(last);
    const lastY = py(last);
    let limit = last;
    let point = first;
    if (!o.onCurve[first]) {
      if (o.onCurve[last]) {
        startX = lastX;
        startY = lastY;
        limit--;
      } else {
        startX = Math.trunc((startX + lastX) / 2);
        startY = Math.trunc((startY + lastY) / 2);
      }
      point--;
    }
    this.lastX = startX;
    this.lastY = startY;
    while (point < limit) {
      point++;
      if (o.onCurve[point]) {
        this.lineTo(px(point), py(point));
        continue;
      }
      let cx = px(point);
      let cy = py(point);
      let closed = false;
      while (true) {
        if (point < limit) {
          point++;
          const x = px(point);
          const y = py(point);
          if (o.onCurve[point]) {
            this.conicTo(cx, cy, x, y);
            break;
          }
          this.conicTo(cx, cy, Math.trunc((cx + x) / 2), Math.trunc((cy + y) / 2));
          cx = x;
          cy = y;
          continue;
        }
        this.conicTo(cx, cy, startX, startY);
        closed = true;
        break;
      }
      if (closed) {
        return;
      }
    }
    this.lineTo(startX, startY);
  }
  /** Converts the whole outline to profiles; returns false when nothing is drawable. */
  convert(o, flipped, minY, maxY) {
    this.minY = minY;
    this.maxY = maxY;
    this.profiles = [];
    this.cProfile = newProfile();
    let start = 0;
    for (const end of o.endPts) {
      this.state = UNKNOWN;
      this.gProfile = null;
      if (end >= start) {
        this.decomposeContour(o, start, end, flipped);
      }
      start = end + 1;
      if (this.frac(this.lastY) === 0 && this.lastY >= this.minY && this.lastY <= this.maxY) {
        const first = this.gProfile;
        if (first && (first.flags & FLOW_UP) === (this.cProfile.flags & FLOW_UP)) {
          this.cProfile.xs.pop();
        }
      }
      const lastProfile = this.cProfile;
      let ov;
      if (this.cProfile.xs.length > 0 && this.cProfile.flags & FLOW_UP) {
        ov = this.isTopOvershoot(this.lastY);
      } else {
        ov = this.isBottomOvershoot(this.lastY);
      }
      this.endProfile(ov);
      if (this.gProfile) {
        lastProfile.next = this.gProfile;
      }
    }
    return this.profiles.length > 0;
  }
  // -------------------------------------------------------------------
  // Sweep
  // -------------------------------------------------------------------
  /**
   * Sweeps the profiles. `span(y, x1, x2, left, right)` and
   * `drop(...)` receive the scanline index and the two crossings.
   */
  sweep(span, drop) {
    if (this.profiles.length === 0) {
      return;
    }
    let minYs = Infinity;
    let maxYs = -Infinity;
    for (const p of this.profiles) {
      if (p.flags & FLOW_UP) {
        p.offset = 0;
      } else {
        p.start = p.start - p.height + 1;
        p.offset = p.height - 1;
      }
      if (p.start < minYs) minYs = p.start;
      if (p.start + p.height - 1 > maxYs) maxYs = p.start + p.height - 1;
      p.X = 0;
    }
    const waiting = this.profiles.slice();
    let left = [];
    let right = [];
    const insNew = (list, p) => {
      let i = 0;
      while (i < list.length && !(p.X < list[i].X)) i++;
      list.splice(i, 0, p);
    };
    const sortList = (list) => {
      for (const p of list) {
        p.X = p.xs[p.offset];
        p.offset += p.flags & FLOW_UP ? 1 : -1;
        p.height--;
      }
      list.sort((a, b) => a.X - b.X);
    };
    for (let y = minYs; y <= maxYs; y++) {
      for (let i = 0; i < waiting.length; ) {
        const p = waiting[i];
        if (p.start === y) {
          waiting.splice(i, 1);
          insNew(p.flags & FLOW_UP ? left : right, p);
        } else {
          i++;
        }
      }
      sortList(left);
      sortList(right);
      let dropouts = 0;
      const n = Math.min(left.length, right.length);
      for (let i = 0; i < n; i++) {
        const pl = left[i];
        const pr = right[i];
        let x1 = pl.X;
        let x2 = pr.X;
        if (x1 > x2) {
          const t = x1;
          x1 = x2;
          x2 = t;
        }
        const e1 = this.floorP(x1);
        const e2 = this.ceilP(x2);
        if (x2 - x1 <= this.prec && e1 !== x1 && e2 !== x2) {
          if (e1 > e2 || e2 === e1 + this.prec) {
            if ((pl.flags & 7) !== 2) {
              pl.X = x1;
              pr.X = x2;
              pl.countL = 1;
              dropouts++;
            }
            continue;
          }
        }
        span(y, x1, x2);
      }
      if (dropouts > 0) {
        for (let i = 0; i < n; i++) {
          const pl = left[i];
          if (pl.countL) {
            pl.countL = 0;
            drop(y, pl.X, right[i].X, pl, right[i]);
          }
        }
      }
      left = left.filter((p) => p.height > 0);
      right = right.filter((p) => p.height > 0);
    }
  }
  get precision() {
    return this.prec;
  }
  get jitter() {
    return this.precJitter;
  }
  get half() {
    return this.precHalf;
  }
  floorPub(x) {
    return this.floorP(x);
  }
  ceilPub(x) {
    return this.ceilP(x);
  }
  truncPub(x) {
    return this.trunc(x);
  }
};
function mulDivRound(a, b, c) {
  let s = 1;
  if (a < 0) {
    a = -a;
    s = -s;
  }
  if (b < 0) {
    b = -b;
    s = -s;
  }
  if (c < 0) {
    c = -c;
    s = -s;
  }
  const d = c > 0 ? Math.floor((a * b + Math.floor(c / 2)) / c) : 2147483647;
  return s < 0 ? -d : d;
}
function monoBox(o) {
  const n = o.xs.length;
  if (n === 0) {
    return null;
  }
  let cxMin = Infinity;
  let cxMax = -Infinity;
  let cyMin = Infinity;
  let cyMax = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = o.xs[i];
    const y = o.ys[i];
    if (x < cxMin) cxMin = x;
    if (x > cxMax) cxMax = x;
    if (y < cyMin) cyMin = y;
    if (y > cyMax) cyMax = y;
  }
  let xMin = Math.floor((cxMin + 31) / 64);
  let xMax = Math.floor((cxMax + 32) / 64);
  let yMin = Math.floor((cyMin + 31) / 64);
  let yMax = Math.floor((cyMax + 32) / 64);
  const rem = (v, add) => (v + add & 63) - add;
  if (xMin === xMax) {
    if (rem(cxMin, 31) + rem(cxMax, 32) < 0) xMin -= 1;
    else xMax += 1;
  }
  if (yMin === yMax) {
    if (rem(cyMin, 31) + rem(cyMax, 32) < 0) yMin -= 1;
    else yMax += 1;
  }
  return { xMin, xMax, yMin, yMax };
}
function rasterizeMono(o, dropout, fixedBox) {
  const box = fixedBox ?? monoBox(o);
  if (!box) {
    return null;
  }
  const width = box.xMax - box.xMin;
  const height = box.yMax - box.yMin;
  if (width <= 0 || height <= 0 || width > 4096 || height > 4096) {
    return null;
  }
  const n = o.xs.length;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = o.xs[i] - box.xMin * 64;
    ys[i] = o.ys[i] - box.yMin * 64;
  }
  const local = { xs, ys, onCurve: o.onCurve, endPts: o.endPts };
  const data = new Uint8Array(width * height);
  const at = (col, row) => (height - 1 - row) * width + col;
  const r = new Raster(dropout);
  const P = r.precision;
  if (r.convert(local, false, 0, (height - 1) * P)) {
    r.sweep(
      (y, x1, x2) => {
        let e1 = r.ceilPub(x1);
        let e2 = r.floorPub(x2);
        if (dropout !== 2 && x2 - x1 - P <= r.jitter && e1 !== x1 && e2 !== x2) {
          e2 = e1;
        }
        e1 = r.truncPub(e1);
        e2 = r.truncPub(e2);
        if (e2 >= 0 && e1 < width && y >= 0 && y < height) {
          if (e1 < 0) e1 = 0;
          if (e2 >= width) e2 = width - 1;
          for (let c = e1; c <= e2; c++) data[at(c, y)] = 1;
        }
      },
      (y, x1, x2, left, right) => {
        let e1 = r.ceilPub(x1);
        let e2 = r.floorPub(x2);
        let pxl = e1;
        if (e1 > e2) {
          const mode = left.flags & 7;
          if (e1 !== e2 + P) {
            return;
          }
          switch (mode) {
            case 0:
              pxl = e2;
              break;
            case 4:
              pxl = r.floorPub(Math.floor((x1 + x2 + Math.floor(P * 63 / 64)) / 2));
              break;
            case 1:
            case 5:
              if (left.next === right && left.height <= 0 && !(left.flags & OVERSHOOT_TOP && x2 - x1 >= r.half)) {
                return;
              }
              if (right.next === left && left.start === y && !(left.flags & OVERSHOOT_BOTTOM && x2 - x1 >= r.half)) {
                return;
              }
              pxl = mode === 1 ? e2 : r.floorPub(Math.floor((x1 + x2 + Math.floor(P * 63 / 64)) / 2));
              break;
            default:
              return;
          }
          if (pxl < 0) pxl = e1;
          else if (r.truncPub(pxl) >= width) pxl = e2;
          const other = r.truncPub(pxl === e1 ? e2 : e1);
          if (other >= 0 && other < width && y >= 0 && y < height && data[at(other, y)]) {
            return;
          }
        }
        const c = r.truncPub(pxl);
        if (c >= 0 && c < width && y >= 0 && y < height) {
          data[at(c, y)] = 1;
        }
      }
    );
  }
  if (dropout !== 2) {
    const h = new Raster(dropout);
    if (h.convert(local, true, 0, (width - 1) * P)) {
      h.sweep(
        (col, x1, x2) => {
          if (x2 - x1 < P) {
            const e1 = h.ceilPub(x1);
            const e2 = h.floorPub(x2);
            if (e1 === e2) {
              const row = h.truncPub(e1);
              if (row >= 0 && row < height && col >= 0 && col < width) {
                data[at(col, row)] = 1;
              }
            }
          }
        },
        (col, x1, x2, left, right) => {
          let e1 = h.ceilPub(x1);
          const e2 = h.floorPub(x2);
          let pxl = e1;
          if (e1 > e2) {
            const mode = left.flags & 7;
            if (e1 !== e2 + P) {
              return;
            }
            switch (mode) {
              case 0:
                pxl = e2;
                break;
              case 4:
                pxl = h.floorPub(Math.floor((x1 + x2 + Math.floor(P * 63 / 64)) / 2));
                break;
              case 1:
              case 5:
                if (left.next === right && left.height <= 0 && !(left.flags & OVERSHOOT_TOP && x2 - x1 >= h.half)) {
                  return;
                }
                if (right.next === left && left.start === col && !(left.flags & OVERSHOOT_BOTTOM && x2 - x1 >= h.half)) {
                  return;
                }
                pxl = mode === 1 ? e2 : h.floorPub(Math.floor((x1 + x2 + Math.floor(P * 63 / 64)) / 2));
                break;
              default:
                return;
            }
            if (pxl < 0) pxl = e1;
            else if (h.truncPub(pxl) >= height) pxl = e2;
            e1 = h.truncPub(pxl === e1 ? e2 : e1);
            if (e1 >= 0 && e1 < height && col >= 0 && col < width && data[at(col, e1)]) {
              return;
            }
          }
          const row = h.truncPub(pxl);
          if (row >= 0 && row < height && col >= 0 && col < width) {
            data[at(col, row)] = 1;
          }
        }
      );
    }
  }
  return { width, height, left: box.xMin, top: box.yMax, data };
}
var GRAY_OVERSAMPLE = 4;
function rasterizeSamples(o, kx, ky, padX = 0) {
  const n = o.xs.length;
  if (n === 0) {
    return null;
  }
  let cxMin = Infinity;
  let cxMax = -Infinity;
  let cyMin = Infinity;
  let cyMax = -Infinity;
  for (let i = 0; i < n; i++) {
    cxMin = Math.min(cxMin, o.xs[i]);
    cxMax = Math.max(cxMax, o.xs[i]);
    cyMin = Math.min(cyMin, o.ys[i]);
    cyMax = Math.max(cyMax, o.ys[i]);
  }
  const box = {
    xMin: Math.floor(cxMin / 64) - padX,
    xMax: Math.ceil(cxMax / 64) + padX,
    yMin: Math.floor(cyMin / 64),
    yMax: Math.ceil(cyMax / 64)
  };
  if (box.xMax <= box.xMin) box.xMax = box.xMin + 1;
  if (box.yMax <= box.yMin) box.yMax = box.yMin + 1;
  const big = {
    xs: Array.from(o.xs, (v) => v * kx),
    ys: Array.from(o.ys, (v) => v * ky),
    onCurve: o.onCurve,
    endPts: o.endPts
  };
  const hi = rasterizeMono(big, 2, { xMin: box.xMin * kx, xMax: box.xMax * kx, yMin: box.yMin * ky, yMax: box.yMax * ky });
  return hi ? { box, hi } : null;
}
function rasterizeGray(o) {
  const n = o.xs.length;
  if (n === 0) {
    return null;
  }
  let cxMin = Infinity;
  let cxMax = -Infinity;
  let cyMin = Infinity;
  let cyMax = -Infinity;
  for (let i = 0; i < n; i++) {
    cxMin = Math.min(cxMin, o.xs[i]);
    cxMax = Math.max(cxMax, o.xs[i]);
    cyMin = Math.min(cyMin, o.ys[i]);
    cyMax = Math.max(cyMax, o.ys[i]);
  }
  const box = {
    xMin: Math.floor(cxMin / 64),
    xMax: Math.ceil(cxMax / 64),
    yMin: Math.floor(cyMin / 64),
    yMax: Math.ceil(cyMax / 64)
  };
  if (box.xMax <= box.xMin) box.xMax = box.xMin + 1;
  if (box.yMax <= box.yMin) box.yMax = box.yMin + 1;
  const k = GRAY_OVERSAMPLE;
  const big = {
    xs: Array.from(o.xs, (v) => v * k),
    ys: Array.from(o.ys, (v) => v * k),
    onCurve: o.onCurve,
    endPts: o.endPts
  };
  const hi = rasterizeMono(big, 2, { xMin: box.xMin * k, xMax: box.xMax * k, yMin: box.yMin * k, yMax: box.yMax * k });
  if (!hi) {
    return null;
  }
  const width = box.xMax - box.xMin;
  const height = box.yMax - box.yMin;
  const data = new Uint8Array(width * height);
  for (let y = 0; y < hi.height; y++) {
    const row = Math.floor(y / k) * width;
    for (let x = 0; x < hi.width; x++) {
      if (hi.data[y * hi.width + x]) {
        data[row + Math.floor(x / k)]++;
      }
    }
  }
  return { width, height, left: box.xMin, top: box.yMax, data };
}

// src/gdi-font-engine.ts
var NONANTIALIASED_QUALITY = 3;
var ANTIALIASED_QUALITY = 4;
var CLEARTYPE_QUALITY = 5;
var CLEARTYPE_NATURAL_QUALITY = 6;
var NOTDEF = 0;
var FONT_SUBSTITUTES = {
  "ms shell dlg": "microsoft sans serif",
  "ms shell dlg 2": "tahoma",
  helvetica: "arial",
  times: "times new roman",
  "arial ce": "arial",
  "arial cyr": "arial",
  "arial greek": "arial",
  "arial tur": "arial",
  "arial baltic": "arial",
  "courier new ce": "courier new",
  "courier new cyr": "courier new",
  "courier new greek": "courier new",
  "courier new tur": "courier new",
  "courier new baltic": "courier new",
  "times new roman ce": "times new roman",
  "times new roman cyr": "times new roman",
  "times new roman greek": "times new roman",
  "times new roman tur": "times new roman",
  "times new roman baltic": "times new roman",
  "tahoma armenian": "tahoma",
  "arabic transparent": "arial"
};
function slantRows(b) {
  const span = b.height - 1;
  const lean = Math.floor(span / 2);
  const shift = (r) => span > 0 ? Math.floor(((span - r) * lean * 2 + span) / (2 * span)) : 0;
  const width = b.width + lean;
  const data = new Uint8Array(width * b.height);
  for (let y = 0; y < b.height; y++) {
    data.set(b.data.subarray(y * b.width, (y + 1) * b.width), y * width + shift(y));
  }
  return { ...b, width, data };
}
var RASTER_STRETCH_COST = [0, 0, 120, 150, 250, 250];
function unitOf(f) {
  return Math.max(1, f.pixHeight - f.internalLeading);
}
var RASTER_SUBSTITUTES = {
  helv: "ms sans serif",
  "tms rmn": "ms serif"
};
var ITALIC_SHEAR = 22272 / 65536;
function isItalicFace(f) {
  return (f.fsSelection & 1) !== 0 || (f.macStyle & 2) !== 0;
}
var CP1252_HIGH = [
  8364,
  129,
  8218,
  402,
  8222,
  8230,
  8224,
  8225,
  710,
  8240,
  352,
  8249,
  338,
  141,
  381,
  143,
  144,
  8216,
  8217,
  8220,
  8221,
  8226,
  8211,
  8212,
  732,
  8482,
  353,
  8250,
  339,
  157,
  382,
  376
];
var OEM_CHARSET = 255;
var CP437_HIGH = [
  199,
  252,
  233,
  226,
  228,
  224,
  229,
  231,
  234,
  235,
  232,
  239,
  238,
  236,
  196,
  197,
  201,
  230,
  198,
  244,
  246,
  242,
  251,
  249,
  255,
  214,
  220,
  162,
  163,
  165,
  8359,
  402,
  225,
  237,
  243,
  250,
  241,
  209,
  170,
  186,
  191,
  8976,
  172,
  189,
  188,
  161,
  171,
  187,
  9617,
  9618,
  9619,
  9474,
  9508,
  9569,
  9570,
  9558,
  9557,
  9571,
  9553,
  9559,
  9565,
  9564,
  9563,
  9488,
  9492,
  9524,
  9516,
  9500,
  9472,
  9532,
  9566,
  9567,
  9562,
  9556,
  9577,
  9574,
  9568,
  9552,
  9580,
  9575,
  9576,
  9572,
  9573,
  9561,
  9560,
  9554,
  9555,
  9579,
  9578,
  9496,
  9484,
  9608,
  9604,
  9612,
  9616,
  9600,
  945,
  223,
  915,
  960,
  931,
  963,
  181,
  964,
  934,
  920,
  937,
  948,
  8734,
  966,
  949,
  8745,
  8801,
  177,
  8805,
  8804,
  8992,
  8993,
  247,
  8776,
  176,
  8729,
  183,
  8730,
  8319,
  178,
  9632,
  160
];
var RasterRealizedFont = class {
  /**
   * @param scale - Whole-number vertical stretch.
   * @param syntheticBold - Embolden (bold requested from a regular face).
   * @param scaleX - Whole-number horizontal stretch (defaults to `scale`;
   *   a non-zero lfWidth picks lfWidth / avgWidth rounded half down).
   * @param obliquify - Slant the bitmaps (italic requested from an
   *   upright face): GDI leans each row by about half its height above
   *   the cell bottom (see `slantRows`), keeping the advances.
   */
  constructor(face, scale, syntheticBold, scaleX = scale, obliquify = false) {
    this.face = face;
    this.scale = scale;
    this.scaleX = scaleX;
    this.obliquify = obliquify;
    this.mode = "mono";
    this.syntheticItalic = false;
    this.gridFit = true;
    this.glyphs = /* @__PURE__ */ new Map();
    const n = scale;
    this.syntheticBold = syntheticBold;
    this.ascent = face.ascent * n;
    this.descent = (face.pixHeight - face.ascent) * n;
    this.ppem = (face.pixHeight - face.internalLeading) * n;
    this.ppemX = (face.pixHeight - face.internalLeading) * scaleX;
    this.underlinePosition = -n;
    this.underlineThickness = n;
    this.strikeoutPosition = Math.ceil((face.ascent - face.internalLeading) * n / 3);
    this.strikeoutThickness = n;
    this.ttf = {
      family: face.family,
      weightClass: face.weight,
      fsSelection: face.italic ? 1 : 0,
      macStyle: 0,
      winAscent: this.ascent,
      unitsPerEm: this.ppem || 1
    };
  }
  /** The font's 8-bit code for a Unicode character (Windows-1252 for the ANSI charsets). */
  glyphIndex(code) {
    if (code < 128) {
      return code;
    }
    if (this.face.charSet === OEM_CHARSET) {
      const j = CP437_HIGH.indexOf(code);
      return j >= 0 ? 128 + j : this.face.defaultChar;
    }
    if (code >= 160 && code < 256) {
      return code;
    }
    const i = CP1252_HIGH.indexOf(code);
    return i >= 0 ? 128 + i : this.face.defaultChar;
  }
  charForGlyph(index) {
    if (index >= 128 && this.face.charSet === OEM_CHARSET) {
      return CP437_HIGH[index - 128] ?? index;
    }
    return index >= 128 && index < 160 ? CP1252_HIGH[index - 128] : index;
  }
  advance(index) {
    return this.face.width(index) * this.scaleX + (this.syntheticBold ? 1 : 0);
  }
  rotatedAdvance(index) {
    return this.advance(index);
  }
  glyph(index) {
    let g = this.glyphs.get(index);
    if (g) {
      return g;
    }
    const src = this.face.bitmap(index);
    const w = this.face.width(index);
    let bitmap = null;
    if (src && w > 0) {
      const n = this.scale;
      const nx = this.scaleX;
      const h = this.face.pixHeight;
      const data = new Uint8Array(w * nx * h * n);
      for (let y = 0; y < h * n; y++) {
        for (let x = 0; x < w * nx; x++) {
          data[y * w * nx + x] = src[Math.floor(y / n) * w + Math.floor(x / nx)];
        }
      }
      bitmap = { width: w * nx, height: h * n, left: 0, top: this.ascent, data };
      if (this.obliquify) {
        bitmap = slantRows(bitmap);
      }
      if (this.syntheticBold) {
        bitmap = embolden(bitmap, 1);
      }
    }
    g = { bitmap, advance: this.advance(index) };
    this.glyphs.set(index, g);
    return g;
  }
};
var RealizedFont = class {
  constructor(ttf, ppem, ppemX, mode, syntheticBold, syntheticItalic, cellHeight = 0, stretchWidth = 0, gridFit = true) {
    this.rotatedSize = null;
    this.rotOutlines = /* @__PURE__ */ new Map();
    this.outlines = /* @__PURE__ */ new Map();
    this.glyphs = /* @__PURE__ */ new Map();
    this.reverseCmap = null;
    this.ctSize = null;
    /** CLEARTYPE_NATURAL_QUALITY: ClearType glyphs keep their own (natural) widths. */
    this.naturalWidths = false;
    this.ctOutlines = /* @__PURE__ */ new Map();
    this.ttf = ttf;
    this.gridFit = gridFit;
    this.stretchWidth = ppemX !== ppem ? stretchWidth : 0;
    this.ppem = ppem;
    this.ppemX = ppemX;
    this.mode = mode;
    this.syntheticBold = syntheticBold;
    this.syntheticItalic = syntheticItalic;
    const upem = ttf.unitsPerEm;
    const scale = (v) => Math.round(v * ppem / upem);
    const vd = ttf.vdmx?.find((e) => e.ppem === ppem);
    const cellUnits = ttf.winAscent + ttf.winDescent;
    if (vd) {
      this.ascent = vd.yMax;
      this.descent = -vd.yMin;
    } else if (cellHeight > 0 && cellUnits > 0) {
      this.ascent = Math.round(ttf.winAscent * cellHeight / cellUnits);
      this.descent = cellHeight - this.ascent;
    } else {
      this.ascent = scale(ttf.winAscent);
      this.descent = scale(ttf.winDescent);
    }
    this.rotatedAscent = Math.floor(ttf.headYMax * ppem / upem + 1.27);
    this.rotatedDescent = Math.floor(-ttf.headYMin * ppem / upem + 1.27);
    this.underlinePosition = scale(ttf.underlinePosition);
    this.underlineThickness = scale(ttf.underlineThickness);
    this.strikeoutPosition = scale(ttf.strikeoutPosition);
    this.strikeoutThickness = scale(ttf.strikeoutSize);
    this.hinted = new HintedSize(ttf, ppemX, ppem, { version: 35, grayscale: mode !== "mono" }, gridFit);
    this.hdmx = ppemX === ppem ? ttf.hdmx.get(ppem) : void 0;
  }
  /** Glyph index for a character code (UTF-16 code unit or code point). */
  glyphIndex(code) {
    return this.ttf.glyphIndex(code);
  }
  /** A character that maps to glyph `index` (for SVG text of ETO_GLYPH_INDEX runs), or U+FFFD. */
  charForGlyph(index) {
    if (!this.reverseCmap) {
      this.reverseCmap = /* @__PURE__ */ new Map();
      for (let cp = 65535; cp >= 32; cp--) {
        const g = this.ttf.glyphIndex(cp);
        if (g) {
          this.reverseCmap.set(g, cp);
        }
      }
    }
    return this.reverseCmap.get(index) ?? 65533;
  }
  outline(index) {
    let g = this.outlines.get(index);
    if (!g) {
      g = this.hinted.hintGlyph(index < this.ttf.numGlyphs ? index : NOTDEF);
      this.outlines.set(index, g);
    }
    return g;
  }
  /**
   * The outline ClearType rasterises. It is grid-fitted at the real ppem
   * with the Microsoft rasterizer's ClearType interpreter rules (see
   * `HintEnvironment.clearType`: x rounds on a 1/16-pixel virtual grid,
   * legacy x-direction deltas are skipped, ...), then, for GDI's default
   * "compatible widths" ClearType, scaled horizontally so the glyph's
   * natural (unhinted) advance fills the black-and-white advance width
   * GDI keeps for ClearType text. CLEARTYPE_NATURAL_QUALITY keeps the
   * natural widths unscaled.
   */
  ctOutline(index) {
    let o = this.ctOutlines.get(index);
    if (o) {
      return o;
    }
    const gi = index < this.ttf.numGlyphs ? index : NOTDEF;
    this.ctSize ?? (this.ctSize = new HintedSize(this.ttf, this.ppemX, this.ppem, { version: 40, grayscale: false, clearType: true }));
    const u = this.ctSize.hintGlyph(gi);
    const natural = this.ttf.hMetrics(gi).advance * this.ppemX / this.ttf.unitsPerEm;
    const k = !this.naturalWidths && natural > 0 ? this.advance(index) / natural : 1;
    o = { xs: Array.from(u.xs, (v) => v * k), ys: u.ys, onCurve: u.onCurve, endPts: u.endPts };
    this.ctOutlines.set(index, o);
    return o;
  }
  rotatedOutline(index) {
    let g = this.rotOutlines.get(index);
    if (!g) {
      this.rotatedSize ?? (this.rotatedSize = new HintedSize(this.ttf, this.ppemX, this.ppem, {
        version: 35,
        grayscale: this.mode !== "mono",
        rotated: true
      }));
      g = this.rotatedSize.hintGlyph(index < this.ttf.numGlyphs ? index : NOTDEF);
      this.rotOutlines.set(index, g);
    }
    return g;
  }
  /** Integer advance width of glyph `index`, as GetCharWidth32 reports it. */
  advance(index) {
    const hd = this.hdmx;
    let base;
    if (this.stretchWidth > 0) {
      const { advance } = this.ttf.hMetrics(index < this.ttf.numGlyphs ? index : NOTDEF);
      base = Math.round(advance * this.stretchWidth / this.ttf.xAvgCharWidth);
    } else if (!this.gridFit) {
      base = this.outline(index).linearAdvance / 64;
    } else {
      base = hd && index < hd.length ? hd[index] : Math.round(this.outline(index).advance / 64);
    }
    return base + (this.syntheticBold ? 1 : 0);
  }
  /**
   * Advance of glyph `index` in a font realised with an escapement: GDI
   * does not use the hinted/hdmx widths there but the linearly scaled
   * advance, rounded (measured: the Dx GDI records for Times New Roman at
   * 30 and 90 degrees).
   */
  rotatedAdvance(index) {
    const { advance } = this.ttf.hMetrics(index < this.ttf.numGlyphs ? index : NOTDEF);
    return Math.round(advance * this.ppemX / this.ttf.unitsPerEm) + (this.syntheticBold ? 1 : 0);
  }
  /**
   * The glyph bitmap for `index`, optionally rotated by the 2x2 matrix
   * `m` = [a, b, c, d] (device, y down: x' = a*x + c*y, y' = b*x + d*y,
   * applied to the hinted outline about the pen position).
   */
  glyph(index, m, subX = 0) {
    const key = (m ? `${index}|${m.map((v) => v.toFixed(6)).join(",")}` : String(index)) + (subX ? `@${subX}` : "");
    let g = this.glyphs.get(key);
    if (g) {
      return g;
    }
    const skew = m && !(Math.abs(m[1]) < 1e-9 && Math.abs(m[2]) < 1e-9) && !(Math.abs(m[0]) < 1e-9 && Math.abs(m[3]) < 1e-9);
    const src = skew ? this.rotatedOutline(index) : this.outline(index);
    if (skew && m) {
      const p = this.ppem;
      m = [Math.round(m[0] * p) / p, Math.round(m[1] * p) / p, Math.round(m[2] * p) / p, Math.round(m[3] * p) / p];
    }
    let o = src;
    if (this.syntheticItalic || m || subX) {
      const n = src.xs.length;
      const xs = new Float64Array(n);
      const ys = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let x = src.xs[i];
        const y = src.ys[i];
        if (this.syntheticItalic) {
          x += y * ITALIC_SHEAR;
        }
        if (m) {
          xs[i] = Math.round(m[0] * x - m[2] * y);
          ys[i] = Math.round(-(m[1] * x - m[3] * y));
        } else {
          xs[i] = Math.round(x + subX);
          ys[i] = y;
        }
      }
      o = { xs, ys, onCurve: src.onCurve, endPts: src.endPts };
    }
    let bitmap;
    if (this.mode === "mono") {
      bitmap = rasterizeMono(o, dropoutMode(src.scanControl, src.scanType));
    } else if (this.mode === "cleartype") {
      bitmap = rasterizeClearType(!m && !this.syntheticItalic ? this.ctOutline(index) : o);
    } else {
      bitmap = rasterizeGray(o);
    }
    if (bitmap && this.syntheticBold) {
      bitmap = embolden(bitmap, this.mode === "mono" ? 1 : 16);
    }
    g = { bitmap, advance: this.advance(index) };
    this.glyphs.set(key, g);
    return g;
  }
};
function embolden(b, full) {
  const w = b.width + 1;
  const data = new Uint8Array(w * b.height);
  for (let y = 0; y < b.height; y++) {
    for (let x = 0; x < w; x++) {
      const a = x < b.width ? b.data[y * b.width + x] : 0;
      const l = x > 0 ? b.data[y * b.width + x - 1] : 0;
      data[y * w + x] = Math.min(full, Math.max(a, l));
    }
  }
  return { width: w, height: b.height, left: b.left, top: b.top, data };
}
var collectionCache = /* @__PURE__ */ new WeakMap();
var GdiFontCollection = class _GdiFontCollection {
  constructor(sources, defaultSmoothing = "cleartype") {
    this.families = /* @__PURE__ */ new Map();
    this.rasterFamilies = /* @__PURE__ */ new Map();
    this.realized = /* @__PURE__ */ new Map();
    this.defaultSmoothing = defaultSmoothing;
    for (const src of sources) {
      for (const face of parseRasterFontFile(src)) {
        const k = face.family.toLowerCase().trim();
        const list = this.rasterFamilies.get(k) ?? [];
        list.push(face);
        this.rasterFamilies.set(k, list);
      }
      for (const face of parseFontFile(src)) {
        this.add(face.family, face);
        if (face.typoFamily && face.typoFamily !== face.family) {
          this.addAlias(face.typoFamily, face);
        }
        if (face.fullName && face.fullName !== face.family) {
          this.addAlias(face.fullName, face);
        }
      }
    }
  }
  /**
   * A collection for `sources`, cached per sources array (so converting
   * many files with the same `fonts` option parses each font once).
   */
  static for(sources, defaultSmoothing = "cleartype") {
    const key = sources;
    let c = collectionCache.get(key);
    if (!c || c.defaultSmoothing !== defaultSmoothing) {
      c = new _GdiFontCollection(sources, defaultSmoothing);
      collectionCache.set(key, c);
    }
    return c;
  }
  get size() {
    return this.families.size + this.rasterFamilies.size;
  }
  add(name, face) {
    const k = name.toLowerCase().trim();
    const list = this.families.get(k) ?? [];
    list.push(face);
    this.families.set(k, list);
  }
  /** Secondary names only apply when no face claims them as its primary family. */
  addAlias(name, face) {
    const k = name.toLowerCase().trim();
    const list = this.families.get(k);
    if (!list) {
      this.families.set(k, [face]);
    } else if (!list.some((f) => f.family.toLowerCase().trim() === k)) {
      list.push(face);
    }
  }
  /** The faces of a family, following GDI's substitutions and pitch/family fallback. */
  familyFaces(face, pitchAndFamily, fontFamilyMap) {
    const k = face.toLowerCase().trim();
    const direct = this.families.get(k);
    if (direct) {
      return direct;
    }
    const mapped = fontFamilyMap?.[k];
    if (mapped) {
      const m = this.families.get(mapped.replace(/^["']|["']$/g, "").toLowerCase().trim());
      if (m) {
        return m;
      }
    }
    const sub = FONT_SUBSTITUTES[k];
    if (sub && this.families.get(sub)) {
      return this.families.get(sub);
    }
    const family = pitchAndFamily & 240;
    const fixed = (pitchAndFamily & 3) === 1;
    const fallback = family === 16 ? "times new roman" : family === 48 || fixed ? "courier new" : "arial";
    return this.families.get(fallback) ?? null;
  }
  /**
   * The raster size GDI's font mapper picks for a device height, as a face
   * and a whole-number stretch (1 to 5). Heights compare as character
   * heights for a negative lfHeight and cell heights for a positive one.
   * The cost model is fitted to GetTextMetrics over lfHeight -60..60 for
   * MS Sans Serif, MS Serif, Courier, Small Fonts, System and Terminal
   * (98% exact): 150 per pixel too small; 290 plus 350 per pixel too big;
   * a stretch cost by factor (120, 150, 250, 250 for 2x..5x) plus 100 per
   * extra factor divided by the face's character height (small faces
   * stretch less readily); ties go to the smaller stretch, then to the
   * 96 dpi face. A weight mismatch costs 3 per 10 units (so Terminal's
   * bold 8 pixel size serves regular requests).
   */
  pickRaster(faces, height, weight) {
    const pool = faces;
    if (pool.length === 0) {
      return null;
    }
    if (height === 0) {
      const sorted = pool.slice().sort((a, b) => a.pixHeight - b.pixHeight);
      return { face: sorted.find((f) => f.points >= 10) ?? sorted[0], scale: 1 };
    }
    const target = Math.abs(height);
    let best = null;
    let bestCost = Infinity;
    for (const f of pool) {
      const unit = height < 0 ? unitOf(f) : f.pixHeight;
      for (let n = 1; n <= 5; n++) {
        const d = unit * n - target;
        const cost = (d < 0 ? -d * 150 : d > 0 ? 290 + d * 350 : 0) + RASTER_STRETCH_COST[n] + (n > 1 ? 100 * (n - 1) / unitOf(f) : 0) + Math.abs(f.weight - weight) * 3 / 10 + n * 0.01 + (f.vertRes === 96 ? 0 : 1e-3);
        if (cost < bestCost) {
          bestCost = cost;
          best = { face: f, scale: n };
        }
      }
    }
    return best;
  }
  realizeRaster(faces, spec) {
    const weight = spec.weight || 400;
    const pick = this.pickRaster(faces, spec.height, weight);
    if (!pick) {
      return null;
    }
    const { face, scale } = pick;
    const scaleX = spec.width > 0 && face.avgWidth > 0 ? Math.max(1, Math.ceil(spec.width / face.avgWidth - 0.5)) : scale;
    return new RasterRealizedFont(face, scale, weight >= 600 && face.weight < 600, scaleX, spec.italic && !face.italic);
  }
  /**
   * MS Shell Dlg renders with Microsoft Sans Serif but GDI snaps small
   * sizes to the MS Sans Serif bitmap sizes: when the raster mapper would
   * pick an unstretched 8 or 10 point bitmap whose cell is at most one
   * pixel taller than the TrueType cell `ttCell`, the TrueType ppem
   * becomes that bitmap's character height (measured: lfHeight -9..-12
   * give ppem 11, -13..-15 ppem 13, cell heights 12..15 ppem 11 and
   * 16..19 ppem 13, while -8 and cell heights up to 11 stay unsnapped).
   */
  shellDlgPpem(spec, ttCell) {
    const raster = this.rasterFamilies.get("ms sans serif");
    if (!raster || spec.height === 0) {
      return 0;
    }
    const pick = this.pickRaster(raster, spec.height, spec.weight || 400);
    if (!pick || pick.scale !== 1 || pick.face.pixHeight > 16) {
      return 0;
    }
    const f = pick.face;
    return f.pixHeight <= ttCell + 1 ? f.pixHeight - f.internalLeading : 0;
  }
  /** Realises `spec`, or null when no supplied font can stand in for it. */
  realize(spec, fontFamilyMap) {
    const key = JSON.stringify(spec) + (fontFamilyMap ? JSON.stringify(fontFamilyMap) : "");
    if (this.realized.has(key)) {
      return this.realized.get(key);
    }
    const k = spec.face.toLowerCase().trim();
    if (!this.families.has(k)) {
      const rasterName = this.rasterFamilies.has(k) ? k : RASTER_SUBSTITUTES[k];
      const raster = rasterName ? this.rasterFamilies.get(rasterName) : void 0;
      if (raster) {
        const r = this.realizeRaster(raster, spec);
        this.realized.set(key, r);
        return r;
      }
    }
    const faces = this.familyFaces(spec.face, spec.pitchAndFamily, fontFamilyMap);
    let result = null;
    if (faces && faces.length > 0) {
      const weight = spec.weight || 400;
      let best = faces[0];
      let bestScore = Infinity;
      for (const f of faces) {
        const dw = f.weightClass - weight;
        const score2 = (isItalicFace(f) !== spec.italic ? 1e4 : 0) + (dw > 0 ? dw * 3 : -dw);
        if (score2 < bestScore) {
          best = f;
          bestScore = score2;
        }
      }
      const synthItalic = spec.italic && !isItalicFace(best);
      const synthBold = weight >= 600 && best.weightClass < 600;
      const make = (ppem, cellHeight) => {
        if (!(ppem > 0 && ppem <= 2048)) {
          return null;
        }
        const naturalAvg = Math.round(best.xAvgCharWidth * ppem / best.unitsPerEm);
        const ppemX = spec.width > 0 && best.xAvgCharWidth > 0 && spec.width !== naturalAvg ? Math.max(1, Math.round(spec.width * best.unitsPerEm / best.xAvgCharWidth)) : ppem;
        const tt2 = new RealizedFont(
          best,
          ppem,
          ppemX,
          this.modeFor(best, spec.quality, ppem, spec.ignoreGasp),
          synthBold,
          synthItalic,
          cellHeight,
          spec.width,
          !spec.unhinted
        );
        tt2.naturalWidths = spec.quality === CLEARTYPE_NATURAL_QUALITY;
        return tt2;
      };
      let tt = make(resolvePpem(best, spec.height), spec.height > 0 ? Math.round(spec.height) : 0);
      if (tt && k === "ms shell dlg") {
        const snapped = this.shellDlgPpem(spec, tt.ascent + tt.descent);
        if (snapped && snapped !== tt.ppem) {
          tt = make(snapped, 0);
        }
      }
      result = tt;
    }
    this.realized.set(key, result);
    return result;
  }
  /** Rendering mode for a LOGFONT quality at a ppem (honouring the font's `gasp`). */
  modeFor(font, quality, ppem, ignoreGasp = false) {
    let mode;
    switch (quality) {
      case NONANTIALIASED_QUALITY:
        return "mono";
      case ANTIALIASED_QUALITY:
        mode = "gray";
        break;
      case CLEARTYPE_QUALITY:
      case CLEARTYPE_NATURAL_QUALITY:
        mode = "cleartype";
        break;
      default:
        mode = this.defaultSmoothing;
    }
    if (mode === "gray" && !ignoreGasp) {
      const range = font.gasp.find((r) => ppem <= r.maxPpem);
      if (range && (range.behavior & 2) === 0) {
        return "mono";
      }
    }
    return mode;
  }
};
function resolvePpem(font, height) {
  if (height < 0) {
    return Math.round(-height);
  }
  const h = Math.round(height === 0 ? 16 : height);
  const vd = font.vdmx;
  if (vd && vd.length > 0) {
    let found = 0;
    for (let i = 0; i < vd.length; i++) {
      const cell = vd[i].yMax - vd[i].yMin;
      if (cell === h) {
        found = vd[i].ppem;
        break;
      }
      if (cell > h) {
        found = i > 0 ? vd[i - 1].ppem : 0;
        break;
      }
    }
    if (found > 0) {
      return found;
    }
  }
  const cellUnits = font.winAscent + font.winDescent || font.hheaAscender - font.hheaDescender;
  let ppem = Math.max(1, Math.round(h * font.unitsPerEm / (cellUnits || font.unitsPerEm)));
  const upem = font.unitsPerEm;
  while (ppem > 1) {
    const e = vd?.find((v) => v.ppem === ppem);
    const cell = e ? e.yMax - e.yMin : Math.round(font.winAscent * ppem / upem) + Math.round(font.winDescent * ppem / upem);
    if (cell <= h) {
      break;
    }
    ppem--;
  }
  return ppem;
}
var CLEARTYPE_OVERSAMPLE = 6;
function rasterizeClearType(o) {
  const S = CLEARTYPE_OVERSAMPLE / 3;
  const r = rasterizeSamples(o, CLEARTYPE_OVERSAMPLE, 1, 1);
  if (!r) {
    return null;
  }
  const { box, hi } = r;
  const width = box.xMax - box.xMin;
  const height = box.yMax - box.yMin;
  const n = width * 3;
  const sub = new Float64Array(n);
  const data = new Uint8Array(n * height);
  for (let y = 0; y < height; y++) {
    sub.fill(0);
    const row = y * hi.width;
    for (let x = 0; x < hi.width; x++) {
      if (hi.data[row + x]) {
        sub[Math.floor(x / S)] += 1;
      }
    }
    for (let j = 0; j < n; j++) {
      const acc = (j > 0 ? sub[j - 1] : 0) + sub[j] + (j + 1 < n ? sub[j + 1] : 0);
      data[y * n + j] = Math.round(255 * acc / (3 * S));
    }
  }
  return { width, height, left: box.xMin, top: box.yMax, data, channels: 3 };
}

// src/emf-image-payload.ts
function sniffImageMime(bytes) {
  const b = bytes;
  if (b.length >= 8 && b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) {
    return "image/png";
  }
  if (b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255) {
    return "image/jpeg";
  }
  if (b.length >= 6 && b[0] === 71 && b[1] === 73 && b[2] === 70 && b[3] === 56) {
    return "image/gif";
  }
  if (b.length >= 12 && b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 && b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80) {
    return "image/webp";
  }
  return null;
}
function payloadSize(p) {
  if (p.kind === "rgba") {
    return { w: p.width, h: p.height };
  }
  if (p.kind !== "encoded") {
    return null;
  }
  const b = p.bytes;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (p.mime === "image/png" && b.length >= 24) {
      return { w: dv.getUint32(16), h: dv.getUint32(20) };
    }
    if (p.mime === "image/gif" && b.length >= 10) {
      return { w: dv.getUint16(6, true), h: dv.getUint16(8, true) };
    }
    if (p.mime === "image/jpeg") {
      for (let i = 2; i + 9 < b.length; ) {
        if (b[i] !== 255) {
          i++;
          continue;
        }
        const marker = b[i + 1];
        const len = dv.getUint16(i + 2);
        if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
          return { w: dv.getUint16(i + 7), h: dv.getUint16(i + 5) };
        }
        i += 2 + len;
      }
    }
    if (p.mime === "image/webp" && b.length >= 30) {
      const chunk2 = String.fromCharCode(b[12], b[13], b[14], b[15]);
      if (chunk2 === "VP8X") {
        return { w: 1 + (b[24] | b[25] << 8 | b[26] << 16), h: 1 + (b[27] | b[28] << 8 | b[29] << 16) };
      }
      if (chunk2 === "VP8 ") {
        return { w: dv.getUint16(26, true) & 16383, h: dv.getUint16(28, true) & 16383 };
      }
      if (chunk2 === "VP8L") {
        const bits = dv.getUint32(21, true);
        return { w: (bits & 16383) + 1, h: (bits >> 14 & 16383) + 1 };
      }
    }
  } catch {
  }
  return null;
}
function decodeBmpFile(bytes) {
  const view = new DataView(bytes);
  if (view.byteLength < 26 || view.getUint8(0) !== 66 || view.getUint8(1) !== 77) {
    return null;
  }
  const bitsOffset = view.getUint32(10, true);
  const image = decodeDibToImageData(view, 14, bitsOffset, view.byteLength - bitsOffset);
  return image ? { kind: "rgba", data: image.data, width: image.width, height: image.height } : null;
}

// src/emf-header-parser.ts
function parseEmfHeader(view) {
  emfLog("parseEmfHeader: byteLength =", view.byteLength);
  if (view.byteLength < 88) {
    return null;
  }
  const recordType = view.getUint32(0, true);
  if (recordType !== EMR_HEADER) {
    return null;
  }
  const boundsLeft = view.getInt32(8, true);
  const boundsTop = view.getInt32(12, true);
  const boundsRight = view.getInt32(16, true);
  const boundsBottom = view.getInt32(20, true);
  const frameLeft = view.getInt32(24, true);
  const frameTop = view.getInt32(28, true);
  const frameRight = view.getInt32(32, true);
  const frameBottom = view.getInt32(36, true);
  const frameW = frameRight - frameLeft;
  const frameH = frameBottom - frameTop;
  return {
    bounds: {
      left: boundsLeft,
      top: boundsTop,
      right: boundsRight,
      bottom: boundsBottom
    },
    frameW,
    frameH
  };
}
function getRenderableEmfBounds(header) {
  const boundsW = header.bounds.right - header.bounds.left;
  const boundsH = header.bounds.bottom - header.bounds.top;
  if (boundsW > 0 && boundsH > 0) {
    return header.bounds;
  }
  if (header.frameW > 0 && header.frameH > 0) {
    emfLog(
      `getRenderableEmfBounds: bounds invalid (${boundsW}\xD7${boundsH}), falling back to frame ${header.frameW}\xD7${header.frameH}`
    );
    return { left: 0, top: 0, right: header.frameW, bottom: header.frameH };
  }
  return null;
}
function parseWmfHeader(view) {
  if (view.byteLength < 22) {
    return null;
  }
  const magic = view.getUint32(0, true);
  let headerOffset = 0;
  let boundsLeft = 0;
  let boundsTop = 0;
  let boundsRight = 800;
  let boundsBottom = 600;
  let unitsPerInch = 96;
  if (magic === 2596720087) {
    boundsLeft = view.getInt16(6, true);
    boundsTop = view.getInt16(8, true);
    boundsRight = view.getInt16(10, true);
    boundsBottom = view.getInt16(12, true);
    unitsPerInch = view.getUint16(14, true) || 96;
    headerOffset = 22;
  }
  if (headerOffset + 18 > view.byteLength) {
    return null;
  }
  const fileType = view.getUint16(headerOffset, true);
  if (fileType !== 1 && fileType !== 2) {
    return null;
  }
  const headerSize = view.getUint16(headerOffset + 2, true) * 2;
  const maxRecordSize = view.getUint32(headerOffset + 8, true) * 2;
  return {
    headerSize: headerOffset + headerSize,
    maxRecordSize,
    boundsLeft,
    boundsTop,
    boundsRight,
    boundsBottom,
    unitsPerInch,
    placeable: headerOffset > 0
  };
}

// src/emf-plus-bitmap-decoder.ts
var PIXELFORMAT_24BPP_RGB = 137224;
var PIXELFORMAT_32BPP_RGB = 139273;
var PIXELFORMAT_32BPP_ARGB = 2498570;
var PIXELFORMAT_32BPP_PARGB = 925707;
function decodeEmfPlusBitmapPixels(view, pixelStart, width, height, stride, pixelFormat) {
  const absStride = Math.abs(stride);
  const topDown = stride > 0;
  const rowBytes = width * 4;
  const bmpRowStride = rowBytes + 3 & -4;
  const pixelDataSize = bmpRowStride * height;
  const bmpData = new Uint8Array(pixelDataSize);
  for (let y = 0; y < height; y++) {
    const srcRow = topDown ? y : height - 1 - y;
    const rowOff = pixelStart + srcRow * absStride;
    const dstRow = (height - 1 - y) * bmpRowStride;
    switch (pixelFormat) {
      case PIXELFORMAT_32BPP_ARGB:
      case PIXELFORMAT_32BPP_PARGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 4;
          if (off + 3 >= view.byteLength) {
            break;
          }
          let b = view.getUint8(off);
          let g = view.getUint8(off + 1);
          let r = view.getUint8(off + 2);
          const a = view.getUint8(off + 3);
          if (pixelFormat === PIXELFORMAT_32BPP_PARGB && a > 0 && a < 255) {
            r = Math.min(255, Math.round(r * 255 / a));
            g = Math.min(255, Math.round(g * 255 / a));
            b = Math.min(255, Math.round(b * 255 / a));
          }
          const di = dstRow + x * 4;
          bmpData[di] = b;
          bmpData[di + 1] = g;
          bmpData[di + 2] = r;
          bmpData[di + 3] = a;
        }
        break;
      }
      case PIXELFORMAT_32BPP_RGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 4;
          if (off + 3 >= view.byteLength) {
            break;
          }
          const di = dstRow + x * 4;
          bmpData[di] = view.getUint8(off);
          bmpData[di + 1] = view.getUint8(off + 1);
          bmpData[di + 2] = view.getUint8(off + 2);
          bmpData[di + 3] = 255;
        }
        break;
      }
      case PIXELFORMAT_24BPP_RGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 3;
          if (off + 2 >= view.byteLength) {
            break;
          }
          const di = dstRow + x * 4;
          bmpData[di] = view.getUint8(off);
          bmpData[di + 1] = view.getUint8(off + 1);
          bmpData[di + 2] = view.getUint8(off + 2);
          bmpData[di + 3] = 255;
        }
        break;
      }
      default:
        return null;
    }
  }
  return wrapBmpFile(bmpData, bmpRowStride, width, height, pixelDataSize);
}
function decodeEmfPlusBitmapPixelsToRgba(view, pixelStart, width, height, stride, pixelFormat) {
  const absStride = Math.abs(stride);
  const topDown = stride > 0;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = topDown ? y : height - 1 - y;
    const rowOff = pixelStart + srcRow * absStride;
    const dstRow = y * width * 4;
    switch (pixelFormat) {
      case PIXELFORMAT_32BPP_ARGB:
      case PIXELFORMAT_32BPP_PARGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 4;
          if (off + 3 >= view.byteLength) {
            break;
          }
          let b = view.getUint8(off);
          let g = view.getUint8(off + 1);
          let r = view.getUint8(off + 2);
          const a = view.getUint8(off + 3);
          if (pixelFormat === PIXELFORMAT_32BPP_PARGB && a > 0 && a < 255) {
            r = Math.min(255, Math.round(r * 255 / a));
            g = Math.min(255, Math.round(g * 255 / a));
            b = Math.min(255, Math.round(b * 255 / a));
          }
          const di = dstRow + x * 4;
          rgba[di] = r;
          rgba[di + 1] = g;
          rgba[di + 2] = b;
          rgba[di + 3] = a;
        }
        break;
      }
      case PIXELFORMAT_32BPP_RGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 4;
          if (off + 3 >= view.byteLength) {
            break;
          }
          const di = dstRow + x * 4;
          rgba[di] = view.getUint8(off + 2);
          rgba[di + 1] = view.getUint8(off + 1);
          rgba[di + 2] = view.getUint8(off);
          rgba[di + 3] = 255;
        }
        break;
      }
      case PIXELFORMAT_24BPP_RGB: {
        for (let x = 0; x < width; x++) {
          const off = rowOff + x * 3;
          if (off + 2 >= view.byteLength) {
            break;
          }
          const di = dstRow + x * 4;
          rgba[di] = view.getUint8(off + 2);
          rgba[di + 1] = view.getUint8(off + 1);
          rgba[di + 2] = view.getUint8(off);
          rgba[di + 3] = 255;
        }
        break;
      }
      default:
        return null;
    }
  }
  return rgba;
}
function wrapBmpFile(bmpData, bmpRowStride, width, height, pixelDataSize) {
  const fileHeaderSize = 14;
  const dibHeaderSize = 108;
  const fileSize = fileHeaderSize + dibHeaderSize + pixelDataSize;
  const bmpFile = new ArrayBuffer(fileSize);
  const bmpView = new DataView(bmpFile);
  const bmpBytes = new Uint8Array(bmpFile);
  bmpView.setUint8(0, 66);
  bmpView.setUint8(1, 77);
  bmpView.setUint32(2, fileSize, true);
  bmpView.setUint32(6, 0, true);
  bmpView.setUint32(10, fileHeaderSize + dibHeaderSize, true);
  bmpView.setUint32(14, dibHeaderSize, true);
  bmpView.setInt32(18, width, true);
  bmpView.setInt32(22, height, true);
  bmpView.setUint16(26, 1, true);
  bmpView.setUint16(28, 32, true);
  bmpView.setUint32(30, 3, true);
  bmpView.setUint32(34, pixelDataSize, true);
  bmpView.setInt32(38, 2835, true);
  bmpView.setInt32(42, 2835, true);
  bmpView.setUint32(46, 0, true);
  bmpView.setUint32(50, 0, true);
  bmpView.setUint32(54, 16711680, true);
  bmpView.setUint32(58, 65280, true);
  bmpView.setUint32(62, 255, true);
  bmpView.setUint32(66, 4278190080, true);
  bmpView.setUint32(70, 1934772034, true);
  bmpBytes.set(bmpData, fileHeaderSize + dibHeaderSize);
  return bmpFile;
}

// src/emf-clip-scanline.ts
var FLATTEN_TOLERANCE2 = 0.05;
var MAX_CURVE_SEGMENTS = 4096;
var MAX_SCANLINE_DIMENSION = 1 << 15;
var FINITE_LIMIT = 1 << 23;
function cubicSegments(x0, y0, x1, y1, x2, y2, x3, y3) {
  const d1 = Math.hypot(x0 - 2 * x1 + x2, y0 - 2 * y1 + y2);
  const d2 = Math.hypot(x1 - 2 * x2 + x3, y1 - 2 * y2 + y3);
  const n = Math.ceil(Math.sqrt(0.75 * Math.max(d1, d2) / FLATTEN_TOLERANCE2));
  return Math.min(MAX_CURVE_SEGMENTS, Math.max(1, n));
}
function arcSegments(radius, sweep) {
  if (!(radius > FLATTEN_TOLERANCE2)) {
    return 1;
  }
  const step = 2 * Math.acos(1 - FLATTEN_TOLERANCE2 / radius);
  const n = Math.ceil(Math.abs(sweep) / step);
  return Math.min(MAX_CURVE_SEGMENTS, Math.max(1, n));
}
function mod(a, m) {
  const r = a % m;
  return r < 0 ? r + m : r;
}
function flattenClipCmds(cmds) {
  const polys = [];
  let cur = [];
  let hasPoint = false;
  let cx = 0;
  let cy = 0;
  const flush = () => {
    if (cur.length >= 6) {
      polys.push(cur);
    }
    cur = [];
  };
  const moveTo = (x, y) => {
    flush();
    cur = [x, y];
    hasPoint = true;
    cx = x;
    cy = y;
  };
  const lineTo = (x, y) => {
    if (!hasPoint) {
      moveTo(x, y);
      return;
    }
    cur.push(x, y);
    cx = x;
    cy = y;
  };
  for (const c of cmds) {
    switch (c.op) {
      case "moveTo":
        moveTo(c.x, c.y);
        break;
      case "lineTo":
        lineTo(c.x, c.y);
        break;
      case "rect":
        moveTo(c.x, c.y);
        lineTo(c.x + c.w, c.y);
        lineTo(c.x + c.w, c.y + c.h);
        lineTo(c.x, c.y + c.h);
        moveTo(c.x, c.y);
        break;
      case "closePath":
        if (hasPoint) {
          const sx = cur[0];
          const sy = cur[1];
          moveTo(sx, sy);
        }
        break;
      case "bezierCurveTo": {
        if (!hasPoint) {
          moveTo(c.cp1x, c.cp1y);
        }
        const x0 = cx;
        const y0 = cy;
        const n = cubicSegments(x0, y0, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y);
        for (let i = 1; i < n; i++) {
          const t = i / n;
          const u = 1 - t;
          const a = u * u * u;
          const b = 3 * u * u * t;
          const d = 3 * u * t * t;
          const e = t * t * t;
          lineTo(
            a * x0 + b * c.cp1x + d * c.cp2x + e * c.x,
            a * y0 + b * c.cp1y + d * c.cp2y + e * c.y
          );
        }
        lineTo(c.x, c.y);
        break;
      }
      case "arcTo": {
        if (!hasPoint) {
          moveTo(c.x1, c.y1);
          break;
        }
        const x0 = cx;
        const y0 = cy;
        const v1x = x0 - c.x1;
        const v1y = y0 - c.y1;
        const v2x = c.x2 - c.x1;
        const v2y = c.y2 - c.y1;
        const l1 = Math.hypot(v1x, v1y);
        const l2 = Math.hypot(v2x, v2y);
        const cross = v1x * v2y - v1y * v2x;
        if (c.radius <= 0 || l1 === 0 || l2 === 0 || Math.abs(cross) < 1e-9 * l1 * l2) {
          lineTo(c.x1, c.y1);
          break;
        }
        const u1x = v1x / l1;
        const u1y = v1y / l1;
        const u2x = v2x / l2;
        const u2y = v2y / l2;
        const cosT = Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y));
        const half = Math.acos(cosT) / 2;
        const dist = c.radius / Math.tan(half);
        const t1x = c.x1 + u1x * dist;
        const t1y = c.y1 + u1y * dist;
        const t2x = c.x1 + u2x * dist;
        const t2y = c.y1 + u2y * dist;
        const bx = u1x + u2x;
        const by = u1y + u2y;
        const bl = Math.hypot(bx, by);
        const cd = c.radius / Math.sin(half);
        const ccx = c.x1 + bx / bl * cd;
        const ccy = c.y1 + by / bl * cd;
        const a0 = Math.atan2(t1y - ccy, t1x - ccx);
        let sweep = Math.atan2(t2y - ccy, t2x - ccx) - a0;
        if (sweep > Math.PI) {
          sweep -= 2 * Math.PI;
        } else if (sweep < -Math.PI) {
          sweep += 2 * Math.PI;
        }
        lineTo(t1x, t1y);
        const n = arcSegments(c.radius, sweep);
        for (let i = 1; i <= n; i++) {
          const a = a0 + sweep * i / n;
          lineTo(ccx + c.radius * Math.cos(a), ccy + c.radius * Math.sin(a));
        }
        break;
      }
      case "ellipse": {
        const tau = 2 * Math.PI;
        let sweep;
        if (!c.ccw) {
          const d = c.endAngle - c.startAngle;
          sweep = d >= tau ? tau : mod(d, tau);
        } else {
          const d = c.startAngle - c.endAngle;
          sweep = -(d >= tau ? tau : mod(d, tau));
        }
        const cosR = Math.cos(c.rotation);
        const sinR = Math.sin(c.rotation);
        const pt = (a) => {
          const ex = c.rx * Math.cos(a);
          const ey = c.ry * Math.sin(a);
          return [c.cx + ex * cosR - ey * sinR, c.cy + ex * sinR + ey * cosR];
        };
        const [sx, sy] = pt(c.startAngle);
        lineTo(sx, sy);
        const n = arcSegments(Math.max(Math.abs(c.rx), Math.abs(c.ry)), sweep);
        for (let i = 1; i <= n; i++) {
          const [px, py] = pt(c.startAngle + sweep * i / n);
          lineTo(px, py);
        }
        break;
      }
    }
  }
  flush();
  return polys;
}
function normalizeDomain(d) {
  const x0 = Math.floor(d.x);
  const y0 = Math.floor(d.y);
  const x1 = Math.max(x0, Math.min(x0 + MAX_SCANLINE_DIMENSION, Math.ceil(d.x + d.w)));
  const y1 = Math.max(y0, Math.min(y0 + MAX_SCANLINE_DIMENSION, Math.ceil(d.y + d.h)));
  return { x0, y0, x1, y1 };
}
function deriveClipDomain(...regions) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x2, y2) => {
    if (Math.abs(x2) < FINITE_LIMIT && Math.abs(y2) < FINITE_LIMIT) {
      minX = Math.min(minX, x2);
      minY = Math.min(minY, y2);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y2);
    }
  };
  for (const region of regions) {
    for (const shape of region ?? []) {
      for (const poly of flattenClipCmds(shape.cmds)) {
        for (let i = 0; i < poly.length; i += 2) {
          add(poly[i], poly[i + 1]);
        }
      }
    }
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, w: 0, h: 0 };
  }
  const x = Math.floor(minX);
  const y = Math.floor(minY);
  return { x, y, w: Math.ceil(maxX) - x, h: Math.ceil(maxY) - y };
}
function buildEdges(shape, y0, y1) {
  const edges = [];
  for (const poly of flattenClipCmds(shape.cmds)) {
    const n = poly.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = poly[2 * i];
      const ay = poly[2 * i + 1];
      const j = (i + 1) % n;
      const bx = poly[2 * j];
      const by = poly[2 * j + 1];
      if (ay === by || !Number.isFinite(ax + ay + bx + by)) {
        continue;
      }
      const dir = by > ay ? 1 : -1;
      const topX = dir > 0 ? ax : bx;
      const topY = dir > 0 ? ay : by;
      const botY = dir > 0 ? by : ay;
      const slope = (bx - ax) / (by - ay);
      const row0 = Math.max(y0, Math.ceil(topY - 0.5));
      const row1 = Math.min(y1, Math.ceil(botY - 0.5));
      if (row0 >= row1) {
        continue;
      }
      edges.push({ row0, row1, x: topX + (row0 + 0.5 - topY) * slope, slope, dir });
    }
  }
  edges.sort((a, b) => a.row0 - b.row0);
  return edges;
}
function shapeRowSpans(shape, dom) {
  const rows = [];
  const edges = buildEdges(shape, dom.y0, dom.y1);
  const evenOdd = shape.fillRule === "evenodd";
  let active = [];
  let next = 0;
  const xs = [];
  for (let row = dom.y0; row < dom.y1; row++) {
    while (next < edges.length && edges[next].row0 === row) {
      active.push(edges[next++]);
    }
    active = active.filter((e) => e.row1 > row);
    xs.length = 0;
    for (const e of active) {
      xs.push({ x: e.x + (row - e.row0) * e.slope, dir: e.dir });
    }
    xs.sort((a, b) => a.x - b.x);
    const spans = [];
    let winding = 0;
    let start = 0;
    for (const c of xs) {
      const wasInside = evenOdd ? (winding & 1) !== 0 : winding !== 0;
      winding += c.dir;
      const inside = evenOdd ? (winding & 1) !== 0 : winding !== 0;
      if (!wasInside && inside) {
        start = c.x;
      } else if (wasInside && !inside) {
        const a = Math.max(dom.x0, Math.ceil(start - 0.5));
        const b = Math.min(dom.x1, Math.ceil(c.x - 0.5));
        if (a < b) {
          if (spans.length > 0 && spans[spans.length - 1] >= a) {
            spans[spans.length - 1] = Math.max(spans[spans.length - 1], b);
          } else {
            spans.push(a, b);
          }
        }
      }
    }
    rows.push(spans);
  }
  return rows;
}
function mergeSpans(a, b, fn) {
  const out = [];
  let i = 0;
  let j = 0;
  let inA = false;
  let inB = false;
  let state = false;
  while (i < a.length || j < b.length) {
    const x = Math.min(i < a.length ? a[i] : Infinity, j < b.length ? b[j] : Infinity);
    while (i < a.length && a[i] === x) {
      inA = !inA;
      i++;
    }
    while (j < b.length && b[j] === x) {
      inB = !inB;
      j++;
    }
    const v = fn(inA, inB);
    if (v !== state) {
      out.push(x);
      state = v;
    }
  }
  return out;
}
function regionRowSpans(region, dom) {
  const full = dom.x1 > dom.x0 ? [dom.x0, dom.x1] : [];
  let rows = [];
  for (let r = dom.y0; r < dom.y1; r++) {
    rows.push(full);
  }
  for (const shape of region ?? []) {
    const s = shapeRowSpans(shape, dom);
    rows = rows.map((spans, i) => spans.length === 0 ? spans : mergeSpans(spans, s[i], and));
  }
  return rows;
}
var and = (p, q) => p && q;
var OP_FNS = {
  replace: (_p, q) => q,
  intersect: and,
  union: (p, q) => p || q,
  xor: (p, q) => p !== q,
  exclude: (p, q) => p && !q,
  complement: (p, q) => q && !p
};
function sameSpans(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function rowsToRects(rows, y0) {
  const rects = [];
  let bandStart = 0;
  for (let r = 1; r <= rows.length; r++) {
    if (r < rows.length && sameSpans(rows[r], rows[bandStart])) {
      continue;
    }
    const spans = rows[bandStart];
    for (let k = 0; k < spans.length; k += 2) {
      rects.push({ x: spans[k], y: y0 + bandStart, w: spans[k + 1] - spans[k], h: r - bandStart });
    }
    bandStart = r;
  }
  return rects;
}
function scanlineCombineRegions(current, incoming, op, domain) {
  const dom = normalizeDomain(domain);
  if (dom.x1 <= dom.x0 || dom.y1 <= dom.y0) {
    return [];
  }
  const a = regionRowSpans(current, dom);
  const b = regionRowSpans(incoming, dom);
  const fn = OP_FNS[op];
  const rows = a.map((spans, i) => mergeSpans(spans, b[i], fn));
  return rowsToRects(rows, dom.y0);
}
function isDomainTruncated(domain) {
  return domain.w > MAX_SCANLINE_DIMENSION || domain.h > MAX_SCANLINE_DIMENSION;
}

// src/emf-plus-path.ts
var PATH_FLAG_WINDING = 8192;
function parseEmfPlusPath(data, off, maxLen) {
  if (maxLen < 12) {
    return null;
  }
  data.getUint32(off, true);
  const pointCount = data.getUint32(off + 4, true);
  const pathFlags = data.getUint32(off + 8, true);
  if (pointCount === 0 || pointCount > 1e5) {
    return null;
  }
  const compressed = (pathFlags & 16384) !== 0;
  const pointSize = compressed ? 4 : 8;
  const pointsBytes = pointCount * pointSize;
  const typesBytes = pointCount;
  const neededAfterHeader = pointsBytes + typesBytes;
  if (12 + neededAfterHeader > maxLen) {
    return null;
  }
  const points = [];
  let pOff = off + 12;
  for (let i = 0; i < pointCount; i++) {
    if (compressed) {
      points.push({
        x: data.getInt16(pOff, true),
        y: data.getInt16(pOff + 2, true)
      });
      pOff += 4;
    } else {
      points.push({
        x: data.getFloat32(pOff, true),
        y: data.getFloat32(pOff + 4, true)
      });
      pOff += 8;
    }
  }
  const alignedPOff = pOff + 3 & -4;
  const types = new Uint8Array(data.buffer, data.byteOffset + alignedPOff, pointCount);
  return {
    kind: "plus-path",
    points,
    types: new Uint8Array(types),
    fillRule: pathFlags & PATH_FLAG_WINDING ? "nonzero" : "evenodd"
  };
}
function emfPlusPathToClipCmds(path, m) {
  const tx = (x, y) => m[0] * x + m[2] * y + m[4];
  const ty = (x, y) => m[1] * x + m[3] * y + m[5];
  const cmds = [];
  const pts = path.points;
  const types = path.types;
  let i = 0;
  while (i < pts.length) {
    const t = types[i] & 15;
    const close = (types[i] & 128) !== 0;
    if (t === 0) {
      cmds.push({ op: "moveTo", x: tx(pts[i].x, pts[i].y), y: ty(pts[i].x, pts[i].y) });
      i++;
    } else if (t === 3) {
      if (i + 2 < pts.length) {
        cmds.push({
          op: "bezierCurveTo",
          cp1x: tx(pts[i].x, pts[i].y),
          cp1y: ty(pts[i].x, pts[i].y),
          cp2x: tx(pts[i + 1].x, pts[i + 1].y),
          cp2y: ty(pts[i + 1].x, pts[i + 1].y),
          x: tx(pts[i + 2].x, pts[i + 2].y),
          y: ty(pts[i + 2].x, pts[i + 2].y)
        });
        if ((types[i + 2] & 128) !== 0) {
          cmds.push({ op: "closePath" });
        }
        i += 3;
        continue;
      }
      break;
    } else {
      cmds.push({ op: "lineTo", x: tx(pts[i].x, pts[i].y), y: ty(pts[i].x, pts[i].y) });
      i++;
    }
    if (close) {
      cmds.push({ op: "closePath" });
    }
  }
  return cmds;
}
var MAX_SIMPLE_CHECK_VERTICES = 512;
function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return d1 * d2 < 0 && d3 * d4 < 0;
}
function isSingleSimpleFigure(cmds) {
  const polys = flattenClipCmds(cmds);
  if (polys.length !== 1) {
    return false;
  }
  const poly = polys[0];
  const n = poly.length / 2;
  if (n < 3) {
    return true;
  }
  if (n > MAX_SIMPLE_CHECK_VERTICES) {
    return false;
  }
  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n;
    for (let j = i + 2; j < n; j++) {
      const j2 = (j + 1) % n;
      if (j2 === i) {
        continue;
      }
      if (segmentsCross(
        poly[2 * i],
        poly[2 * i + 1],
        poly[2 * i2],
        poly[2 * i2 + 1],
        poly[2 * j],
        poly[2 * j + 1],
        poly[2 * j2],
        poly[2 * j2 + 1]
      )) {
        return false;
      }
    }
  }
  return true;
}
function emfPlusPathClipShape(path, m) {
  const cmds = emfPlusPathToClipCmds(path, m);
  return { cmds, fillRule: path.fillRule ?? "nonzero", simple: isSingleSimpleFigure(cmds) };
}
function replayEmfPlusPath(ctx, path) {
  ctx.beginPath();
  const pts = path.points;
  const types = path.types;
  let i = 0;
  while (i < pts.length) {
    const t = types[i] & 15;
    const close = (types[i] & 128) !== 0;
    if (t === 0) {
      ctx.moveTo(pts[i].x, pts[i].y);
      i++;
    } else if (t === 1) {
      ctx.lineTo(pts[i].x, pts[i].y);
      i++;
    } else if (t === 3) {
      if (i + 2 < pts.length) {
        ctx.bezierCurveTo(
          pts[i].x,
          pts[i].y,
          pts[i + 1].x,
          pts[i + 1].y,
          pts[i + 2].x,
          pts[i + 2].y
        );
        if ((types[i + 2] & 128) !== 0) {
          ctx.closePath();
        }
        i += 3;
        continue;
      } else {
        break;
      }
    } else {
      ctx.lineTo(pts[i].x, pts[i].y);
      i++;
    }
    if (close) {
      ctx.closePath();
    }
  }
}

// src/emf-plus-brush-parser.ts
var BRUSH_DATA_PATH = 1;
var BRUSH_DATA_TRANSFORM = 2;
var BRUSH_DATA_PRESET_COLORS = 4;
var BRUSH_DATA_BLEND_FACTORS_H = 8;
var BRUSH_DATA_FOCUS_SCALES = 64;
var BRUSH_DATA_IS_GAMMA_CORRECTED = 128;
var MAX_GRADIENT_ELEMENTS = 4096;
function looksLikeGraphicsVersion(v) {
  return v >>> 12 === 900097;
}
function readTransform(view, off) {
  return [
    view.getFloat32(off, true),
    view.getFloat32(off + 4, true),
    view.getFloat32(off + 8, true),
    view.getFloat32(off + 12, true),
    view.getFloat32(off + 16, true),
    view.getFloat32(off + 20, true)
  ];
}
function applyMatrix(m, x, y) {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}
function clamp01(v) {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
}
function readWrapMode(raw) {
  switch (raw) {
    case 0:
      return "tile";
    case 1:
      return "tile-flip-x";
    case 2:
      return "tile-flip-y";
    case 3:
      return "tile-flip-xy";
    default:
      return "clamp";
  }
}
function normaliseStops(stops) {
  return stops.map((s) => ({ ...s, offset: clamp01(s.offset) })).sort((a, b) => a.offset - b.offset);
}
function readPresetColors(view, off, end) {
  if (off + 4 > end) {
    return null;
  }
  const count = view.getUint32(off, true);
  if (count === 0 || count > MAX_GRADIENT_ELEMENTS) {
    return null;
  }
  const posOff = off + 4;
  const colOff = posOff + count * 4;
  const next = colOff + count * 4;
  if (next > end) {
    return null;
  }
  const stops = [];
  for (let i = 0; i < count; i++) {
    const argb = view.getUint32(colOff + i * 4, true);
    stops.push({
      offset: view.getFloat32(posOff + i * 4, true),
      color: argbToRgba(argb),
      argb
    });
  }
  return { stops, next };
}
function readBlendFactors(view, off, end) {
  if (off + 4 > end) {
    return null;
  }
  const count = view.getUint32(off, true);
  if (count === 0 || count > MAX_GRADIENT_ELEMENTS) {
    return null;
  }
  const posOff = off + 4;
  const facOff = posOff + count * 4;
  const next = facOff + count * 4;
  if (next > end) {
    return null;
  }
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push({
      pos: view.getFloat32(posOff + i * 4, true),
      factor: view.getFloat32(facOff + i * 4, true)
    });
  }
  return { entries, next };
}
function parseLinearGradient(view, b, end) {
  if (b + 40 > end) {
    return null;
  }
  const flags = view.getUint32(b, true);
  const wrapMode = readWrapMode(view.getUint32(b + 4, true));
  const rx = view.getFloat32(b + 8, true);
  const ry = view.getFloat32(b + 12, true);
  const rw = view.getFloat32(b + 16, true);
  const rh = view.getFloat32(b + 20, true);
  const startArgb = view.getUint32(b + 24, true);
  const endArgb = view.getUint32(b + 28, true);
  let o = b + 40;
  let transform = null;
  if (flags & BRUSH_DATA_TRANSFORM && o + 24 <= end) {
    transform = readTransform(view, o);
    o += 24;
  }
  let stops = [
    { offset: 0, color: argbToRgba(startArgb), argb: startArgb },
    { offset: 1, color: argbToRgba(endArgb), argb: endArgb }
  ];
  const ramp = {
    startArgb,
    endArgb,
    preset: null,
    blend: null,
    gammaCorrected: (flags & BRUSH_DATA_IS_GAMMA_CORRECTED) !== 0
  };
  if (flags & BRUSH_DATA_PRESET_COLORS) {
    const preset = readPresetColors(view, o, end);
    if (preset) {
      stops = preset.stops;
      ramp.preset = {
        positions: preset.stops.map((s) => s.offset),
        argb: preset.stops.map((s) => s.argb ?? 0)
      };
    }
  } else if (flags & BRUSH_DATA_BLEND_FACTORS_H) {
    const blend = readBlendFactors(view, o, end);
    if (blend) {
      stops = blend.entries.map((e) => ({
        offset: e.pos,
        color: lerpArgbToRgba(startArgb, endArgb, e.factor),
        argb: lerpArgb(startArgb, endArgb, e.factor)
      }));
      ramp.blend = {
        positions: blend.entries.map((e) => e.pos),
        factors: blend.entries.map((e) => e.factor)
      };
    }
  }
  let p1 = { x: rx, y: ry + rh / 2 };
  let p2 = { x: rx + rw, y: ry + rh / 2 };
  if (transform) {
    p1 = applyMatrix(transform, p1.x, p1.y);
    p2 = applyMatrix(transform, p2.x, p2.y);
  }
  emfLog(
    `parseEmfPlusBrushObject: linear gradient (${p1.x.toFixed(1)},${p1.y.toFixed(1)})\u2192(${p2.x.toFixed(1)},${p2.y.toFixed(1)}), ${stops.length} stop(s)`
  );
  return {
    kind: "plus-brush",
    color: argbToRgba(startArgb),
    gradient: {
      type: "linear",
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
      stops: normaliseStops(stops),
      wrapMode,
      rect: { x: rx, y: ry, w: rw, h: rh },
      transform,
      ramp
    }
  };
}
function decodeTextureImage(view, off, end) {
  if (off + 28 > end) {
    return null;
  }
  const imageDataType = view.getUint32(off + 4, true);
  if (imageDataType !== 1) {
    return null;
  }
  const width = view.getInt32(off + 8, true);
  const height = view.getInt32(off + 12, true);
  const stride = view.getInt32(off + 16, true);
  const pixelFormat = view.getUint32(off + 20, true);
  const pixelStart = off + 28;
  const absStride = Math.abs(stride);
  if (width <= 0 || height <= 0 || width > 8192 || height > 8192 || pixelStart + absStride * height > end) {
    return null;
  }
  const rgba = decodeEmfPlusBitmapPixelsToRgba(view, pixelStart, width, height, stride, pixelFormat);
  return rgba ? { width, height, rgba } : null;
}
function findCompressedTextureImageBytes(view, off, end) {
  if (off + 28 > end) {
    return null;
  }
  if (view.getUint32(off + 4, true) !== 1) {
    return null;
  }
  if (decodeTextureImage(view, off, end)) {
    return null;
  }
  const start = off + 28;
  return start < end ? { start, end } : null;
}
function textureBrushImageOffset(view, b, end) {
  if (b + 8 > end) {
    return null;
  }
  const flags = view.getUint32(b, true);
  let o = b + 8;
  if (flags & BRUSH_DATA_TRANSFORM && o + 24 <= end) {
    o += 24;
  }
  return o;
}
function parseTextureBrush(view, b, end, predecoded) {
  if (b + 8 > end) {
    return null;
  }
  const flags = view.getUint32(b, true);
  const wrapMode = readWrapMode(view.getUint32(b + 4, true));
  let o = b + 8;
  let transform = null;
  if (flags & BRUSH_DATA_TRANSFORM && o + 24 <= end) {
    transform = readTransform(view, o);
    o += 24;
  }
  const image = decodeTextureImage(view, o, end) ?? predecoded ?? null;
  if (!image) {
    return null;
  }
  const texture = {
    width: image.width,
    height: image.height,
    rgba: image.rgba,
    wrapMode,
    transform
  };
  let r = 0;
  let g = 0;
  let bl = 0;
  const n = image.width * image.height;
  for (let i = 0; i < n; i++) {
    r += image.rgba[i * 4];
    g += image.rgba[i * 4 + 1];
    bl += image.rgba[i * 4 + 2];
  }
  const avg = n > 0 ? `rgba(${Math.round(r / n)},${Math.round(g / n)},${Math.round(bl / n)},1)` : "rgba(128,128,128,1)";
  emfLog(`parseEmfPlusBrushObject: texture fill ${image.width}x${image.height}, wrapMode=${wrapMode}`);
  return { kind: "plus-brush", color: avg, texture };
}
function parsePathGradient(view, b, end) {
  if (b + 24 > end) {
    return null;
  }
  const flags = view.getUint32(b, true);
  const wrapMode = readWrapMode(view.getUint32(b + 4, true));
  const centerArgb = view.getUint32(b + 8, true);
  let cx = view.getFloat32(b + 12, true);
  let cy = view.getFloat32(b + 16, true);
  const surroundCount = view.getUint32(b + 20, true);
  if (surroundCount > MAX_GRADIENT_ELEMENTS) {
    return { kind: "plus-brush", color: argbToRgba(centerArgb) };
  }
  const surround = [];
  let o = b + 24;
  for (let i = 0; i < surroundCount && o + 4 <= end; i++) {
    surround.push(view.getUint32(o, true));
    o += 4;
  }
  let boundaryPts = [];
  let boundaryArgb = [];
  const surroundAt = (k) => surround.length > 0 ? surround[Math.min(k, surround.length - 1)] : centerArgb;
  if (flags & BRUSH_DATA_PATH) {
    if (o + 4 <= end) {
      const pathSize = view.getInt32(o, true);
      o += 4;
      if (pathSize > 0 && o + pathSize <= end) {
        const path = parseEmfPlusPath(view, o, pathSize);
        if (path) {
          const flat = flattenFirstFigure(path.points, path.types, surroundAt);
          boundaryPts = flat.points;
          boundaryArgb = flat.argb;
        }
        o += pathSize;
      }
    }
  } else if (o + 4 <= end) {
    const ptCount = view.getUint32(o, true);
    o += 4;
    if (ptCount > 0 && ptCount <= MAX_GRADIENT_ELEMENTS && o + ptCount * 8 <= end) {
      for (let i = 0; i < ptCount; i++) {
        boundaryPts.push({
          x: view.getFloat32(o + i * 8, true),
          y: view.getFloat32(o + i * 8 + 4, true)
        });
        boundaryArgb.push(surroundAt(i));
      }
      o += ptCount * 8;
    }
  }
  let transform = null;
  if (flags & BRUSH_DATA_TRANSFORM && o + 24 <= end) {
    transform = readTransform(view, o);
    o += 24;
  }
  const center = { x: cx, y: cy };
  const m = transform;
  const worldBoundary = m ? boundaryPts.map((p) => applyMatrix(m, p.x, p.y)) : boundaryPts;
  if (m) {
    ({ x: cx, y: cy } = applyMatrix(m, cx, cy));
  }
  const surroundArgb = surround.length > 0 ? surround[0] : centerArgb;
  let stops = [
    { offset: 0, color: argbToRgba(centerArgb), argb: centerArgb },
    { offset: 1, color: argbToRgba(surroundArgb), argb: surroundArgb }
  ];
  let blend = null;
  let preset = null;
  if (flags & BRUSH_DATA_PRESET_COLORS) {
    const presetData = readPresetColors(view, o, end);
    if (presetData) {
      stops = presetData.stops.map((s) => ({ ...s, offset: 1 - s.offset }));
      preset = {
        positions: presetData.stops.map((s) => s.offset),
        argb: presetData.stops.map((s) => s.argb ?? 0)
      };
      o = presetData.next;
    }
  } else if (flags & BRUSH_DATA_BLEND_FACTORS_H) {
    const blendData = readBlendFactors(view, o, end);
    if (blendData) {
      stops = blendData.entries.map((e) => ({
        offset: 1 - e.pos,
        color: lerpArgbToRgba(surroundArgb, centerArgb, e.factor),
        argb: lerpArgb(surroundArgb, centerArgb, e.factor)
      }));
      blend = {
        positions: blendData.entries.map((e) => e.pos),
        factors: blendData.entries.map((e) => e.factor)
      };
      o = blendData.next;
    }
  }
  let focus = null;
  if (flags & BRUSH_DATA_FOCUS_SCALES && o + 12 <= end && view.getUint32(o, true) === 2) {
    focus = { x: view.getFloat32(o + 4, true), y: view.getFloat32(o + 8, true) };
  }
  let r = 0;
  for (const p of worldBoundary) {
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d > r) {
      r = d;
    }
  }
  if (!(r > 0)) {
    return { kind: "plus-brush", color: argbToRgba(centerArgb) };
  }
  emfLog(
    `parseEmfPlusBrushObject: path gradient centre=(${cx.toFixed(1)},${cy.toFixed(1)}), ${boundaryPts.length} boundary point(s)`
  );
  return {
    kind: "plus-brush",
    color: argbToRgba(centerArgb),
    gradient: {
      type: "radial",
      cx,
      cy,
      r,
      stops: normaliseStops(stops),
      wrapMode,
      shape: {
        center,
        centerArgb,
        boundary: boundaryPts,
        boundaryArgb,
        blend,
        preset,
        focus,
        transform
      }
    }
  };
}
function lerpArgb(a, b, t) {
  const tc = Math.min(1, Math.max(0, t));
  let out = 0;
  for (let shift = 24; shift >= 0; shift -= 8) {
    const ca = a >>> shift & 255;
    const cb = b >>> shift & 255;
    out = out * 256 + Math.round(ca + (cb - ca) * tc);
  }
  return out >>> 0;
}
var BEZIER_FLATNESS = 0.25;
var MAX_BEZIER_DEPTH = 10;
function distanceToLine(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-12) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}
function flattenCubic(p0, p1, p2, p3, out, t0 = 0, t1 = 1, depth = 0) {
  const flat = Math.max(distanceToLine(p1, p0, p3), distanceToLine(p2, p0, p3)) <= BEZIER_FLATNESS;
  if (flat || depth >= MAX_BEZIER_DEPTH) {
    out.push({ x: p3.x, y: p3.y, t: t1 });
    return;
  }
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const p01 = mid(p0, p1);
  const p12 = mid(p1, p2);
  const p23 = mid(p2, p3);
  const p012 = mid(p01, p12);
  const p123 = mid(p12, p23);
  const pm = mid(p012, p123);
  const tm = (t0 + t1) / 2;
  flattenCubic(p0, p01, p012, pm, out, t0, tm, depth + 1);
  flattenCubic(pm, p123, p23, p3, out, tm, t1, depth + 1);
}
function flattenFirstFigure(points, types, colorAt) {
  const outPts = [];
  const outArgb = [];
  for (let k = 0; k < points.length; k++) {
    const kind = types[k] & 7;
    if (k > 0 && kind === 0) {
      break;
    }
    if (kind === 3 && k > 0 && k + 2 < points.length) {
      const p0 = points[k - 1];
      const p1 = points[k];
      const p2 = points[k + 1];
      const p3 = points[k + 2];
      const c0 = colorAt(k - 1);
      const c3 = colorAt(k + 2);
      const flat = [];
      flattenCubic(p0, p1, p2, p3, flat);
      for (const v of flat) {
        outPts.push({ x: v.x, y: v.y });
        outArgb.push(lerpArgb(c0, c3, v.t));
      }
      k += 2;
      if (types[k] & 128) {
        break;
      }
      continue;
    }
    outPts.push(points[k]);
    outArgb.push(colorAt(k));
    if (types[k] & 128) {
      break;
    }
  }
  const n = outPts.length;
  if (n > 1 && outPts[0].x === outPts[n - 1].x && outPts[0].y === outPts[n - 1].y) {
    outPts.pop();
    outArgb.pop();
  }
  return { points: outPts, argb: outArgb };
}
function parseEmfPlusBrushObject(view, dataOff, recDataSize, textureCache, cacheKey = dataOff) {
  if (recDataSize < 8) {
    return null;
  }
  const end = dataOff + recDataSize;
  const hasVersion = looksLikeGraphicsVersion(view.getUint32(dataOff, true));
  const typeOff = dataOff + (hasVersion ? 4 : 0);
  if (typeOff + 8 > end) {
    return null;
  }
  const brushType = view.getUint32(typeOff, true);
  const b = typeOff + 4;
  switch (brushType) {
    case EMFPLUS_BRUSHTYPE_SOLID:
      return { kind: "plus-brush", color: argbToRgba(view.getUint32(b, true)) };
    case EMFPLUS_BRUSHTYPE_HATCHFILL:
      if (b + 12 <= end) {
        const fore = view.getUint32(b + 4, true);
        return {
          kind: "plus-brush",
          color: argbToRgba(fore),
          hatch: { style: view.getUint32(b, true), fore, back: view.getUint32(b + 8, true) }
        };
      }
      if (b + 8 <= end) {
        return { kind: "plus-brush", color: argbToRgba(view.getUint32(b + 4, true)) };
      }
      return { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    case EMFPLUS_BRUSHTYPE_TEXTUREFILL: {
      const predecoded = textureCache?.get(cacheKey);
      const brush = parseTextureBrush(view, b, end, predecoded);
      return brush ?? { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    }
    case EMFPLUS_BRUSHTYPE_LINEARGRADIENT: {
      const brush = parseLinearGradient(view, b, end);
      return brush ?? { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    }
    case EMFPLUS_BRUSHTYPE_PATHGRADIENT: {
      const brush = parsePathGradient(view, b, end);
      return brush ?? { kind: "plus-brush", color: "rgba(0,0,0,1)" };
    }
    default:
      return { kind: "plus-brush", color: "rgba(0,0,0,1)" };
  }
}

// src/emf-plus-flatten.ts
function invert(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return null;
  }
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}
function apply(m, p) {
  return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] };
}
function arcBeziers2(cx, cy, rx, ry, start, sweep) {
  const quarter = Math.PI / 2;
  const n = Math.max(1, Math.ceil(Math.abs(sweep) / quarter - 1e-9));
  const at = (a) => ({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  const tangent = (a) => ({ x: -rx * Math.sin(a), y: ry * Math.cos(a) });
  const out = [];
  for (let i = 0; i < n; i++) {
    const a0 = start + i * Math.sign(sweep) * quarter;
    const step = i === n - 1 ? start + sweep - a0 : Math.sign(sweep) * quarter;
    const k = 4 / 3 * Math.tan(step / 4);
    const a1 = a0 + step;
    const p0 = at(a0);
    const p3 = at(a1);
    const t0 = tangent(a0);
    const t1 = tangent(a1);
    out.push([p0, { x: p0.x + k * t0.x, y: p0.y + k * t0.y }, { x: p3.x - k * t1.x, y: p3.y - k * t1.y }, p3]);
  }
  return out;
}
function flatteningContext(target, device) {
  const inv2 = invert(device);
  if (!inv2) {
    return target;
  }
  let cur = null;
  let start = null;
  const moveToWorld = (p) => {
    target.moveTo(p.x, p.y);
    cur = p;
    start = p;
  };
  const lineToWorld = (p) => {
    target.lineTo(p.x, p.y);
    cur = p;
  };
  const bezier = (p0, p1, p2, p3) => {
    const flat = [];
    flattenCubic(apply(device, p0), apply(device, p1), apply(device, p2), apply(device, p3), flat);
    for (let i = 0; i < flat.length - 1; i++) {
      const w = apply(inv2, flat[i]);
      target.lineTo(w.x, w.y);
    }
    lineToWorld(p3);
  };
  const overrides = {
    beginPath() {
      target.beginPath();
      cur = null;
      start = null;
    },
    moveTo(x, y) {
      moveToWorld({ x, y });
    },
    lineTo(x, y) {
      if (!cur) {
        moveToWorld({ x, y });
        return;
      }
      lineToWorld({ x, y });
    },
    closePath() {
      target.closePath();
      cur = start;
    },
    rect(x, y, w, h) {
      moveToWorld({ x, y });
      lineToWorld({ x: x + w, y });
      lineToWorld({ x: x + w, y: y + h });
      lineToWorld({ x, y: y + h });
      target.closePath();
      cur = { x, y };
    },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      const p0 = cur ?? { x: c1x, y: c1y };
      if (!cur) {
        moveToWorld(p0);
      }
      bezier(p0, { x: c1x, y: c1y }, { x: c2x, y: c2y }, { x, y });
    },
    ellipse(cx, cy, rx, ry, rotation, a0, a1, ccw) {
      let sweep = a1 - a0;
      if (ccw) {
        sweep = sweep > 0 ? sweep - 2 * Math.PI * Math.ceil(sweep / (2 * Math.PI)) : sweep;
        if (sweep < -2 * Math.PI) {
          sweep = -2 * Math.PI;
        }
      } else {
        sweep = sweep < 0 ? sweep + 2 * Math.PI * Math.ceil(-sweep / (2 * Math.PI)) : sweep;
        if (sweep > 2 * Math.PI) {
          sweep = 2 * Math.PI;
        }
      }
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rot = (p) => rotation === 0 ? p : { x: cx + (p.x - cx) * cos - (p.y - cy) * sin, y: cy + (p.x - cx) * sin + (p.y - cy) * cos };
      const segs2 = arcBeziers2(cx, cy, rx, ry, a0, sweep).map((s) => s.map(rot));
      if (segs2.length === 0) {
        return;
      }
      const p0 = segs2[0][0];
      if (cur) {
        lineToWorld(p0);
      } else {
        moveToWorld(p0);
      }
      for (const [q0, q1, q2, q3] of segs2) {
        bezier(q0, q1, q2, q3);
      }
    }
  };
  return new Proxy(target, {
    get(t, prop) {
      if (typeof prop === "string" && prop in overrides) {
        return overrides[prop];
      }
      const v = t[prop];
      return typeof v === "function" ? v.bind(t) : v;
    },
    set(t, prop, value) {
      t[prop] = value;
      return true;
    }
  });
}

// src/emf-plus-nominal-line.ts
var f32 = Math.fround;
function gdiplusFix(v) {
  return Math.floor(f32(f32(v) * 256 + 0.5)) + 15 >> 4;
}
function flattenBezierGdiplus(p, out, cull) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < 8; i += 2) {
    minX = Math.min(minX, p[i]);
    maxX = Math.max(maxX, p[i]);
    minY = Math.min(minY, p[i + 1]);
    maxY = Math.max(maxY, p[i + 1]);
  }
  const left = minX - 16;
  const top = minY - 16;
  const X = [p[0] - left, p[2] - left, p[4] - left, p[6] - left];
  const Y = [p[1] - top, p[3] - top, p[5] - top, p[7] - top];
  const sar2 = (v, n) => Math.floor(v / 2 ** n);
  const ex = [X[0] * 1024, (X[3] - X[0]) * 1024, 3 * (X[1] - 2 * X[2] + X[3]) * 2048, 3 * (X[0] - 2 * X[1] + X[2]) * 2048];
  const ey = [Y[0] * 1024, (Y[3] - Y[0]) * 1024, 3 * (Y[1] - 2 * Y[2] + Y[3]) * 2048, 3 * (Y[0] - 2 * Y[1] + Y[2]) * 2048];
  let steps = 1;
  let shift = 0;
  const maxAbs = (a, b) => Math.abs(a) > Math.abs(b) ? Math.abs(a) : Math.abs(b);
  {
    for (let guard = 0; guard < 40; guard++) {
      const limit = 24576 * 2 ** shift;
      if (maxAbs(ex[2], ex[3]) <= limit && maxAbs(ey[2], ey[3]) <= limit) {
        break;
      }
      shift += 2;
      for (const e of [ex, ey]) {
        e[2] = sar2(e[2] + e[3], 1);
        e[1] = sar2(e[1] - sar2(e[2], shift), 1);
      }
      steps *= 2;
    }
  }
  for (const e of [ex, ey]) {
    e[0] *= 8;
    e[1] *= 8;
    const l = shift - 3;
    if (l >= 0) {
      e[2] = sar2(e[2], l);
      e[3] = sar2(e[3], l);
    } else {
      e[2] *= 2 ** -l;
      e[3] *= 2 ** -l;
    }
  }
  const step = (e) => {
    e[0] += e[1];
    const t = e[2];
    e[1] += t;
    e[2] = t + t - e[3];
    e[3] = t;
  };
  step(ex);
  step(ey);
  steps--;
  for (let guard = 0; guard < 1 << 22; guard++) {
    out.push(sar2(ex[0] + 4096, 13) + left, sar2(ey[0] + 4096, 13) + top);
    if (steps === 0) {
      return;
    }
    if (Math.max(maxAbs(ex[2], ex[3]), maxAbs(ey[2], ey[3])) > 196608) {
      for (const e of [ex, ey]) {
        e[2] = sar2(e[2] + e[3], 3);
        e[1] = sar2(e[1] - e[2], 1);
        e[3] = sar2(e[3], 2);
      }
      steps *= 2;
    }
    while (steps % 2 === 0 && maxAbs(ex[3], 2 * ex[2] - ex[3]) <= 49152 && maxAbs(ey[3], 2 * ey[2] - ey[3]) <= 49152) {
      for (const e of [ex, ey]) {
        e[3] *= 4;
        e[1] = e[2] + 2 * e[1];
        e[2] = e[2] * 8 - e[3];
      }
      steps /= 2;
    }
    steps--;
    step(ex);
    step(ey);
  }
}
function recordNominalFigures(buildPath, device, cull) {
  const m = device.map((v) => f32(v));
  const fx = (x, y) => gdiplusFix(f32(f32(f32(m[0] * f32(x)) + f32(m[2] * f32(y))) + m[4]));
  const fy = (x, y) => gdiplusFix(f32(f32(f32(m[1] * f32(x)) + f32(m[3] * f32(y))) + m[5]));
  const figures = [];
  let fig = null;
  let start = null;
  const moveTo = (x, y) => {
    fig = { pts: [fx(x, y), fy(x, y)], closed: false, curved: false };
    figures.push(fig);
    start = { x, y };
  };
  const lineTo = (x, y) => {
    if (!fig) {
      moveTo(x, y);
      return;
    }
    fig.pts.push(fx(x, y), fy(x, y));
  };
  const recorder = {
    beginPath() {
      fig = null;
      start = null;
    },
    moveTo,
    lineTo,
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      if (!fig) {
        moveTo(c1x, c1y);
      }
      const f = fig;
      f.curved = true;
      const n = f.pts.length;
      flattenBezierGdiplus(
        [f.pts[n - 2], f.pts[n - 1], fx(c1x, c1y), fy(c1x, c1y), fx(c2x, c2y), fy(c2x, c2y), fx(x, y), fy(x, y)],
        f.pts);
    },
    ellipse(cx, cy, rx, ry, rotation, a0, a1, ccw) {
      let sweep = a1 - a0;
      if (ccw) {
        sweep = sweep > 0 ? sweep - 2 * Math.PI * Math.ceil(sweep / (2 * Math.PI)) : sweep;
        sweep = Math.max(sweep, -2 * Math.PI);
      } else {
        sweep = sweep < 0 ? sweep + 2 * Math.PI * Math.ceil(-sweep / (2 * Math.PI)) : sweep;
        sweep = Math.min(sweep, 2 * Math.PI);
      }
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rot = (p) => rotation === 0 ? p : { x: cx + (p.x - cx) * cos - (p.y - cy) * sin, y: cy + (p.x - cx) * sin + (p.y - cy) * cos };
      const segs2 = arcBeziers2(cx, cy, rx, ry, a0, sweep);
      if (segs2.length === 0) {
        return;
      }
      const p0 = rot(segs2[0][0]);
      if (fig) {
        lineTo(p0.x, p0.y);
      } else {
        moveTo(p0.x, p0.y);
      }
      for (const seg of segs2) {
        const [, q1, q2, q3] = seg.map(rot);
        recorder.bezierCurveTo(q1.x, q1.y, q2.x, q2.y, q3.x, q3.y);
      }
    },
    rect(x, y, w, h) {
      moveTo(x, y);
      lineTo(x + w, y);
      lineTo(x + w, y + h);
      lineTo(x, y + h);
      recorder.closePath();
    },
    closePath() {
      if (fig && start) {
        fig.closed = true;
        const s = start;
        moveTo(s.x, s.y);
      }
    }
  };
  buildPath(recorder);
  return figures.filter((f) => f.pts.length >= 4);
}
function strokePoints(f) {
  const p = f.pts;
  if (!f.closed || p.length < 4) {
    return p;
  }
  return [...p, p[0], p[1]];
}
var ENUM_BATCH = 32;
function enumeratorBatches(pts) {
  const n = pts.length / 2;
  const out = [];
  for (let s = 0; s < n - 1; s += ENUM_BATCH - 1) {
    out.push(pts.slice(2 * s, 2 * Math.min(n, s + ENUM_BATCH)));
  }
  return out;
}
function ddaSegment(ax, ay, bx, by, last, plot, clip) {
  const fdx = f32(bx / 16 - ax / 16);
  const fdy = f32(by / 16 - ay / 16);
  if (fdx === 0 && fdy === 0) {
    return;
  }
  const adx = Math.abs(fdx);
  const ady = Math.abs(fdy);
  const xMajor = ady < adx;
  let reversed = false;
  let sign;
  if (xMajor) {
    sign = fdy >= 0 ? 1 : -1;
    if (fdx < 0) {
      reversed = true;
      [ax, ay, bx, by] = [bx, by, ax, ay];
      sign = -sign;
    }
  } else {
    sign = fdx >= 0 ? 1 : -1;
    if (fdy < 0) {
      reversed = true;
      [ax, ay, bx, by] = [bx, by, ax, ay];
      sign = -sign;
    }
  }
  let maj0 = xMajor ? ax : ay;
  let maj1 = xMajor ? bx : by;
  let min0 = xMajor ? ay : ax;
  let min1 = xMajor ? by : bx;
  const slope = xMajor ? f32(f32(sign * ady) / adx) : f32(f32(sign * adx) / ady);
  const dMaj = maj1 - maj0;
  const dMin = (min1 - min0) * sign;
  let frac0 = 0;
  let frac1 = 0;
  let e0 = 0;
  if (clip) {
    const inv2 = slope === 0 ? 0 : f32(1 / slope);
    const majLo = (xMajor ? clip.x : clip.y) * 16 - 8;
    const majHi = (xMajor ? clip.x + clip.w : clip.y + clip.h) * 16 - 8;
    const minLo = (xMajor ? clip.y : clip.x) * 16 - 8;
    const minHi = (xMajor ? clip.y + clip.h : clip.x + clip.w) * 16 - 8;
    if (maj0 < majLo || maj1 > majHi) {
      if (maj0 > majHi || maj1 < majLo) {
        return;
      }
      if (maj0 < majLo) {
        const v = f32(f32((majLo - maj0) * slope) + min0);
        const fl = Math.floor(v);
        min0 = fl;
        maj0 = majLo;
        frac0 = f32(v - fl);
      }
      if (maj1 > majHi) {
        const v = f32(f32((majHi - maj1) * slope) + min1);
        const fl = Math.floor(v);
        last = true;
        min1 = fl;
        maj1 = majHi;
        frac1 = f32(v - fl);
      }
    }
    const lowIsStart = sign === 1;
    const lo = lowIsStart ? min0 : min1;
    const hi = lowIsStart ? min1 : min0;
    if (lo < minLo || hi > minHi) {
      if (lo > minHi || hi < minLo) {
        return;
      }
      if (lo < minLo) {
        const t = Math.floor(f32(f32(minLo - f32(lo + (lowIsStart ? frac0 : frac1))) * inv2));
        if (lowIsStart) {
          maj0 += t;
          min0 = minLo;
        } else {
          maj1 += t;
          min1 = minLo;
        }
      }
      if (hi > minHi) {
        const t = Math.floor(f32(f32(minHi - f32(hi + (lowIsStart ? frac1 : frac0))) * inv2));
        if (lowIsStart) {
          maj1 += t;
          min1 = minHi;
        } else {
          maj0 += t;
          min0 = minHi;
        }
        last = true;
      }
    }
    if (frac1 !== 0 && (min1 & 15) === 8) {
      min1++;
    }
    if (frac0 !== 0) {
      e0 = Math.floor(f32(f32(2 * dMaj * sign) * frac0));
    }
  }
  const diag = xMajor && dMaj === dMin;
  const tieUp = diag && sign === 1;
  const k = tieUp ? 8 : 7;
  const inDiamond2 = (dj, dn) => {
    const d = Math.abs(dj) + Math.abs(dn);
    if (d < 8) {
      return true;
    }
    if (d !== 8) {
      return false;
    }
    if (dn === 0 && dj === (tieUp ? -8 : 8) || dj === 0 && dn === 8) {
      return true;
    }
    return diag && (tieUp ? dj < 0 : dj > 0) && dn > 0;
  };
  let mcS = maj0 + k & -16;
  let mcE = maj1 + k & -16;
  const startIn = inDiamond2(maj0 - mcS, min0 - (min0 + 7 & -16));
  const endIn = inDiamond2(maj1 - mcE, min1 - (min1 + 7 & -16));
  const n0 = maj0 & 15;
  const n1 = maj1 & 15;
  if (reversed && !last) {
    if (startIn || n0 <= 8) {
      mcS += 16;
    }
  } else if (n0 <= 8 && !startIn) {
    mcS += 16;
  }
  if (!reversed && !last) {
    if (n1 > 8 || endIn) {
      mcE -= 16;
    }
  } else if (!endIn && n1 > 8) {
    mcE -= 16;
  }
  const colS = mcS >> 4;
  const colE = mcE >> 4;
  if (colE < colS) {
    return;
  }
  const yS = Math.floor((mcS - maj0) * slope + min0 + frac0);
  const ycS = yS + 7 & -16;
  let y = ycS >> 4;
  let e = e0 - ((ycS - yS) * sign + 8) * 2 * dMaj >> 4;
  if (!clip) {
    for (let col = colS; col <= colE; col++) {
      if (xMajor) {
        plot(col, y);
      } else {
        plot(y, col);
      }
      e += 2 * dMin;
      if (e > 0) {
        y += sign;
        e -= 2 * dMaj;
      }
    }
    return;
  }
  const yE = Math.floor((mcE - maj1) * slope + min1 + frac1);
  const minorEnd = yE + 7 >> 4;
  const majLoPx = xMajor ? clip.x : clip.y;
  const majHiPx = (xMajor ? clip.x + clip.w : clip.y + clip.h) - 1;
  const minLoPx = xMajor ? clip.y : clip.x;
  const minHiPx = (xMajor ? clip.y + clip.h : clip.x + clip.w) - 1;
  let left = (minorEnd - y) * sign;
  for (let col = colS; col <= colE && left >= 0; col++) {
    if (col >= majLoPx && col <= majHiPx && y >= minLoPx && y <= minHiPx) {
      if (xMajor) {
        plot(col, y);
      } else {
        plot(y, col);
      }
    }
    e += 2 * dMin;
    if (e > 0) {
      y += sign;
      e -= 2 * dMaj;
      left--;
    }
  }
}
var DIAMOND = [0, -8, -8, 0, 0, 8, 8, 0];
function quadrant(dx, dy) {
  if (Math.abs(dy) > Math.abs(dx)) {
    return dy < 0 ? 1 : 3;
  }
  return dx < 0 ? 2 : 0;
}
function nominalOutline(pts) {
  const n = pts.length / 2;
  if (n < 2) {
    return [];
  }
  const fwd = [];
  const back = [];
  const px = (i) => pts[2 * i];
  const py = (i) => pts[2 * i + 1];
  let q = quadrant(px(1) - px(0), py(1) - py(0));
  const dxq = (qq) => DIAMOND[2 * (qq & 3)];
  const dyq = (qq) => DIAMOND[2 * (qq & 3) + 1];
  fwd.push(px(0) - dxq(q), py(0) - dyq(q), px(0) + dxq(q + 1), py(0) + dyq(q + 1));
  for (let i = 0; i + 1 < n; i++) {
    fwd.push(px(i) + dxq(q), py(i) + dyq(q), px(i + 1) + dxq(q), py(i + 1) + dyq(q));
    back.push(px(i) - dxq(q), py(i) - dyq(q), px(i + 1) - dxq(q), py(i + 1) - dyq(q));
    if (i + 2 >= n) {
      break;
    }
    const nq = quadrant(px(i + 2) - px(i + 1), py(i + 2) - py(i + 1));
    if (nq !== q) {
      const ax = px(i + 1) - px(i);
      const ay = py(i + 1) - py(i);
      const bx = px(i + 2) - px(i + 1);
      const by = py(i + 2) - py(i + 1);
      const x = px(i + 1);
      const y = py(i + 1);
      if (ax * by >= ay * bx) {
        const r = q - 1 & 3;
        if (r !== nq) {
          fwd.push(x + dxq(r), y + dyq(r));
        }
        back.push(x, y);
      } else {
        const r = q + 1 & 3;
        if (r !== nq) {
          back.push(x - dxq(r), y - dyq(r));
        }
        fwd.push(x, y);
      }
      q = nq;
    }
  }
  const ex = px(n - 1);
  const ey = py(n - 1);
  fwd.push(ex + dxq(q - 1), ey + dyq(q - 1), ex - dxq(q), ey - dyq(q));
  const poly = fwd.slice();
  for (let i = back.length - 2; i >= 0; i -= 2) {
    poly.push(back[i], back[i + 1]);
  }
  return poly;
}
function nominalLineCoverage(figures, mode, box) {
  if (!mode.antialias && mode.opaqueSolid && !figures.some((f) => f.curved)) {
    const shift = mode.half ? 8 : 0;
    const out = new Uint8ClampedArray(box.w * box.h);
    const plot = (x, y) => {
      const ix = x - box.x;
      const iy = y - box.y;
      if (ix >= 0 && iy >= 0 && ix < box.w && iy < box.h) {
        out[iy * box.w + ix] = 255;
      }
    };
    const clip = mode.clip && !pathInside(figures, mode.clip, shift) ? mode.clip : void 0;
    for (const f of figures) {
      const p = strokePoints(f);
      for (let i = 0; i + 3 < p.length; i += 2) {
        ddaSegment(p[i] - shift, p[i + 1] - shift, p[i + 2] - shift, p[i + 3] - shift, true, plot, clip);
      }
    }
    return out;
  }
  const polys = [];
  for (const f of figures) {
    for (const batch of enumeratorBatches(strokePoints(f))) {
      const outline = nominalOutline(batch);
      if (outline.length >= 6) {
        polys.push(outline);
      }
    }
  }
  return rasterizePlusFill(polys, false, mode.antialias, mode.half, box);
}
function pathInside(figures, clip, shift) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const f of figures) {
    for (let i = 0; i + 1 < f.pts.length; i += 2) {
      const x = (f.pts[i] - shift) / 16;
      const y = (f.pts[i + 1] - shift) / 16;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  return Math.floor(x0 - 0.5) - 1 >= clip.x && Math.floor(y0 - 0.5) - 1 >= clip.y && Math.ceil(x1 + 0.5) + 1 <= clip.x + clip.w - 1 && Math.ceil(y1 + 0.5) + 1 <= clip.y + clip.h - 1;
}

// src/emf-plus-raster.ts
var GDIPLUS_HFD_TOLERANCE = 3 / 8;
function toPlusFix(v) {
  return Math.ceil(Math.round(v * 256 - 1e-6) / 16);
}
function nearestFix(v) {
  return Math.floor(v * 16 + 0.5 - 1e-4);
}
function aliasedRectFix(raw) {
  let pts = raw.map(nearestFix);
  if (pts.length === 10 && pts[0] === pts[8] && pts[1] === pts[9]) {
    pts = pts.slice(0, 8);
  }
  if (pts.length !== 8) {
    return null;
  }
  const [x0, y0, x1, y1, x2, y2, x3, y3] = pts;
  const horizontalFirst = y0 === y1 && x1 === x2 && y2 === y3 && x3 === x0;
  const verticalFirst = x0 === x1 && y1 === y2 && x2 === x3 && y3 === y0;
  return horizontalFirst || verticalFirst ? pts : null;
}
function recordDeviceFigures(buildPath, device) {
  const figures = [];
  let fig = null;
  let start = null;
  const dx = (x, y) => device[0] * x + device[2] * y + device[4];
  const dy = (x, y) => device[1] * x + device[3] * y + device[5];
  const moveTo = (x, y) => {
    fig = { pts: [dx(x, y), dy(x, y)], closed: false, curved: false };
    figures.push(fig);
    start = { x, y };
  };
  const lineTo = (x, y) => {
    if (!fig) {
      moveTo(x, y);
      return;
    }
    fig.pts.push(dx(x, y), dy(x, y));
  };
  const bezierTo = (c1x, c1y, c2x, c2y, x, y) => {
    if (!fig) {
      moveTo(c1x, c1y);
    }
    const f = fig;
    f.curved = true;
    const n = f.pts.length;
    const fix = (v) => toPlusFix(v);
    const p0x = fix(f.pts[n - 2]);
    const p0y = fix(f.pts[n - 1]);
    f.pts[n - 2] = p0x / 16;
    f.pts[n - 1] = p0y / 16;
    const out = [];
    const ctrl = [p0x, p0y, fix(dx(c1x, c1y)), fix(dy(c1x, c1y)), fix(dx(c2x, c2y)), fix(dy(c2x, c2y)), fix(dx(x, y)), fix(dy(x, y))];
    flattenBezierGdiplus(ctrl, out);
    for (const v of out) {
      f.pts.push(v / 16);
    }
  };
  const closePath = () => {
    if (fig && start) {
      fig.closed = true;
      const s = start;
      moveTo(s.x, s.y);
    }
  };
  const recorder = {
    beginPath() {
      fig = null;
      start = null;
    },
    moveTo,
    lineTo,
    closePath,
    rect(x, y, w, h) {
      moveTo(x, y);
      lineTo(x + w, y);
      lineTo(x + w, y + h);
      lineTo(x, y + h);
      closePath();
    },
    bezierCurveTo: bezierTo,
    ellipse(cx, cy, rx, ry, rotation, a0, a1, ccw) {
      let sweep = a1 - a0;
      if (ccw) {
        sweep = sweep > 0 ? sweep - 2 * Math.PI * Math.ceil(sweep / (2 * Math.PI)) : sweep;
        sweep = Math.max(sweep, -2 * Math.PI);
      } else {
        sweep = sweep < 0 ? sweep + 2 * Math.PI * Math.ceil(-sweep / (2 * Math.PI)) : sweep;
        sweep = Math.min(sweep, 2 * Math.PI);
      }
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rot = (p) => rotation === 0 ? p : { x: cx + (p.x - cx) * cos - (p.y - cy) * sin, y: cy + (p.x - cx) * sin + (p.y - cy) * cos };
      const segs2 = arcBeziers2(cx, cy, rx, ry, a0, sweep);
      if (segs2.length === 0) {
        return;
      }
      const p0 = rot(segs2[0][0]);
      if (fig) {
        lineTo(p0.x, p0.y);
      } else {
        moveTo(p0.x, p0.y);
      }
      for (const seg of segs2) {
        const [, q1, q2, q3] = seg.map(rot);
        bezierTo(q1.x, q1.y, q2.x, q2.y, q3.x, q3.y);
      }
    }
  };
  buildPath(recorder);
  return figures.filter((f) => f.pts.length >= 4);
}
function recordPlusFigures(buildPath, device, aliased = false) {
  return recordDeviceFigures(buildPath, device).map((f) => (aliased && !f.curved ? aliasedRectFix(f.pts) : null) ?? f.pts.map(toPlusFix)).filter((f) => f.length >= 6);
}
function ceilDiv2(a, b) {
  let q = Math.floor(a / b);
  while (q * b > a) {
    q--;
  }
  while ((q + 1) * b <= a) {
    q++;
  }
  return q * b === a ? q : q + 1;
}
function figuresBox(figures, size) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const f of figures) {
    for (let i = 0; i < f.length; i += 2) {
      x0 = Math.min(x0, f[i]);
      x1 = Math.max(x1, f[i]);
      y0 = Math.min(y0, f[i + 1]);
      y1 = Math.max(y1, f[i + 1]);
    }
  }
  if (!Number.isFinite(x0)) {
    return null;
  }
  const l = Math.max(0, Math.floor(x0 / 16) - 1);
  const t = Math.max(0, Math.floor(y0 / 16) - 1);
  const r = Math.min(size.w, Math.ceil(x1 / 16) + 2);
  const b = Math.min(size.h, Math.ceil(y1 / 16) + 2);
  return r > l && b > t ? { x: l, y: t, w: r - l, h: b - t } : null;
}
function rasterizePlusFill(figures, evenOdd, antialias, half, box) {
  const sx = antialias ? 8 : 1;
  const sy = antialias ? 4 : 1;
  const stepX = 16 / sx;
  const stepY = 16 / sy;
  const o = half ? 8 : 0;
  const x0 = 16 * box.x + o - (antialias ? 8 : 0);
  const y0 = 16 * box.y + o - (antialias ? 8 : 0);
  const cols = box.w * sx;
  const edges = [];
  for (const f of figures) {
    const n = f.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = f[2 * i];
      const ay = f[2 * i + 1];
      const bx = f[2 * j];
      const by = f[2 * j + 1];
      if (ay === by) {
        continue;
      }
      edges.push({ ax, ay, bx, by, top: Math.min(ay, by), bottom: Math.max(ay, by), w: by > ay ? 1 : -1 });
    }
  }
  const coverage = new Uint8ClampedArray(box.w * box.h);
  const counts = new Int32Array(box.w);
  const diff = new Int32Array(cols + 1);
  const xs = [];
  for (let py = 0; py < box.h; py++) {
    counts.fill(0);
    for (let r = 0; r < sy; r++) {
      const y = y0 + stepY * (py * sy + r);
      xs.length = 0;
      for (const e of edges) {
        if (y < e.top || y >= e.bottom) {
          continue;
        }
        let D = e.by - e.ay;
        let N = e.ax * D + (e.bx - e.ax) * (y - e.ay);
        if (D < 0) {
          D = -D;
          N = -N;
        }
        const k = ceilDiv2(N - x0 * D, stepX * D);
        xs.push({ k: Math.min(Math.max(k, 0), cols), w: e.w });
      }
      if (xs.length < 2) {
        continue;
      }
      xs.sort((a, b) => a.k - b.k);
      diff.fill(0);
      let wind = 0;
      for (let i = 0; i + 1 < xs.length; i++) {
        wind += xs[i].w;
        const inside = evenOdd ? (wind & 1) !== 0 : wind !== 0;
        if (inside && xs[i + 1].k > xs[i].k) {
          diff[xs[i].k]++;
          diff[xs[i + 1].k]--;
        }
      }
      let run = 0;
      for (let k = 0; k < cols; k++) {
        run += diff[k];
        if (run > 0) {
          counts[k / sx | 0]++;
        }
      }
    }
    const total = sx * sy;
    for (let px = 0; px < box.w; px++) {
      const c = counts[px];
      coverage[py * box.w + px] = c === 0 ? 0 : c >= total ? 255 : Math.round(c * 255 / total);
    }
  }
  return coverage;
}
function clipPixelRects(shapes, box, half) {
  const identity = [1, 0, 0, 1, 0, 0];
  let inside = null;
  for (const shape of shapes) {
    let figs;
    try {
      figs = recordDeviceFigures(shape.build, identity).map((f) => f.pts.map(nearestFix));
    } catch {
      return null;
    }
    const cov = rasterizePlusFill(figs, shape.evenOdd, false, half, box);
    if (inside) {
      for (let i = 0; i < cov.length; i++) {
        inside[i] = inside[i] && cov[i];
      }
    } else {
      inside = cov;
    }
  }
  const rects = [];
  if (!inside) {
    return rects;
  }
  let open = /* @__PURE__ */ new Map();
  for (let y = 0; y < box.h; y++) {
    const next = /* @__PURE__ */ new Map();
    for (let x = 0; x < box.w; ) {
      if (!inside[y * box.w + x]) {
        x++;
        continue;
      }
      let e = x;
      while (e < box.w && inside[y * box.w + e]) {
        e++;
      }
      const key = x + "," + e;
      const prev = open.get(key);
      if (prev) {
        prev.h++;
        next.set(key, prev);
        open.delete(key);
      } else {
        const r = { x: box.x + x, y: box.y + y, w: e - x, h: 1 };
        rects.push(r);
        next.set(key, r);
      }
      x = e;
    }
    open = next;
  }
  return rects;
}

// src/emf-plus-image-resample.ts
var INTERPOLATION_KERNELS = {
  0: "bilinear",
  // Default
  1: "bilinear",
  // LowQuality
  2: "hq-bicubic",
  // HighQuality
  3: "bilinear",
  // Bilinear
  4: "bicubic",
  // Bicubic
  5: "nearest",
  // NearestNeighbor
  6: "hq-bilinear",
  // HighQualityBilinear
  7: "hq-bicubic"
  // HighQualityBicubic
};
var HALF_PIXEL_OFFSET_MODES = /* @__PURE__ */ new Set([2, 4]);
var MAX_RESAMPLE_PIXELS = 16 * 1024 * 1024;
function resampleKernelFor(interpolationMode) {
  return INTERPOLATION_KERNELS[interpolationMode] ?? "bilinear";
}
function isHalfPixelOffset(pixelOffsetMode) {
  return HALF_PIXEL_OFFSET_MODES.has(pixelOffsetMode);
}
function invert2(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return null;
  }
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}
var COVERAGE_NUDGE_X = 1e-6;
var COVERAGE_NUDGE_Y = 1e-9;
var SUBPIXEL_GRID = 16;
function snapToDeviceGrid(spec) {
  const m = spec.toDevice;
  const map = (u, v) => [
    Math.round((m[0] * u + m[2] * v + m[4]) * SUBPIXEL_GRID) / SUBPIXEL_GRID,
    Math.round((m[1] * u + m[3] * v + m[5]) * SUBPIXEL_GRID) / SUBPIXEL_GRID
  ];
  const [ox, oy] = map(spec.srcX, spec.srcY);
  const [a, b, c, d] = m;
  return [a, b, c, d, ox - a * spec.srcX - c * spec.srcY, oy - b * spec.srcX - d * spec.srcY];
}
function cubicKernel(t, a) {
  const x = Math.abs(t);
  if (x < 1) {
    return ((a + 2) * x - (a + 3)) * x * x + 1;
  }
  if (x < 2) {
    return a * (((x - 5) * x + 8) * x - 4);
  }
  return 0;
}
function tentIntegral(t) {
  const x = Math.min(1, Math.abs(t));
  return Math.sign(t) * (x - x * x / 2);
}
function cubicIntegral(t, a) {
  const x = Math.min(2, Math.abs(t));
  let v;
  if (x < 1) {
    v = (a + 2) * x ** 4 / 4 - (a + 3) * x ** 3 / 3 + x;
  } else {
    const p1 = (a + 2) / 4 - (a + 3) / 3 + 1;
    const p = (y) => a * (y ** 4 / 4 - 5 * y ** 3 / 3 + 4 * y * y - 4 * y);
    v = p1 + p(x) - p(1);
  }
  return Math.sign(t) * v;
}
var BICUBIC_A = -0.5;
var HQ_BICUBIC_A = -1;
function axisFilter(kernel, scale, copy) {
  switch (kernel) {
    case "bilinear":
      return { radius: 1, weight: (i, c) => Math.max(0, 1 - Math.abs(i - c)) };
    case "bicubic":
      return { radius: 2, weight: (i, c) => cubicKernel(i - c, BICUBIC_A) };
    case "hq-bilinear":
    case "hq-bicubic": {
      if (copy) {
        return { radius: 0.5, weight: (i, c) => Math.floor(c + 0.5) === i ? 1 : 0 };
      }
      const st = Math.min(1, Math.abs(scale));
      const hq = kernel === "hq-bicubic";
      const support = hq ? 2 : 1;
      const F = hq ? (t) => cubicIntegral(t, HQ_BICUBIC_A) : tentIntegral;
      return {
        radius: support / st + 0.5,
        weight: (i, c) => F(st * (i + 0.5 - c)) - F(st * (i - 0.5 - c))
      };
    }
    default:
      return { radius: 0.5, weight: (i, c) => Math.floor(c + 0.5) === i ? 1 : 0 };
  }
}
function blendSeparable(rgba, width, box, iu0, wu, iv0, wv, verticalFirst, edge = { wrap: void 0, clamp: null }) {
  const [outer0, outerW, inner0, innerW] = verticalFirst ? [iu0, wu, iv0, wv] : [iv0, wv, iu0, wu];
  const [oMin, oMax, iMin, iMax] = verticalFirst ? [box.x0, box.x1, box.y0, box.y1] : [box.y0, box.y1, box.x0, box.x1];
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (let k = 0; k < outerW.length; k++) {
    const wo = outerW[k];
    const to = outer0 + k;
    if (wo === 0) {
      continue;
    }
    const mo = wrapTap(to, oMin, oMax, verticalFirst ? edge.mirrorX : edge.mirrorY, edge);
    if (mo === OUTSIDE_TRANSPARENT) {
      continue;
    }
    let lr = 0;
    let lg = 0;
    let lb = 0;
    let la = 0;
    for (let q = 0; q < innerW.length; q++) {
      const wi = innerW[q];
      const ti = inner0 + q;
      if (wi === 0) {
        continue;
      }
      const mi = wrapTap(ti, iMin, iMax, verticalFirst ? edge.mirrorY : edge.mirrorX, edge);
      if (mi === OUTSIDE_TRANSPARENT) {
        continue;
      }
      let px;
      let s = 0;
      if (mi === OUTSIDE_CLAMP || mo === OUTSIDE_CLAMP) {
        px = edge.clamp ?? [0, 0, 0, 0];
      } else {
        px = rgba;
        s = (verticalFirst ? mi * width + mo : mo * width + mi) * 4;
      }
      const alpha = px[s + 3];
      const wa = wi * alpha / 255;
      lr += wa * px[s];
      lg += wa * px[s + 1];
      lb += wa * px[s + 2];
      la += wi * alpha;
    }
    la = Math.min(255, Math.max(0, la));
    r += wo * Math.min(la, Math.max(0, lr));
    g += wo * Math.min(la, Math.max(0, lg));
    b += wo * Math.min(la, Math.max(0, lb));
    a += wo * la;
  }
  return [r, g, b, a];
}
var OUTSIDE_TRANSPARENT = -1;
var OUTSIDE_CLAMP = -2;
function wrapTap(t, lo, hi, mirror2, edge) {
  if (t >= lo && t < hi) {
    return t;
  }
  if (!edge.wrap) {
    return OUTSIDE_TRANSPARENT;
  }
  if (edge.wrap === "clamp") {
    return OUTSIDE_CLAMP;
  }
  const n = hi - lo;
  if (!mirror2) {
    return lo + ((t - lo) % n + n) % n;
  }
  const q = ((t - lo) % (2 * n) + 2 * n) % (2 * n);
  return lo + (q < n ? q : 2 * n - 1 - q);
}
function mirroredOrigin(o) {
  const f = o - Math.floor(o);
  return f === 0 ? o : Math.floor(o) + 1 - f;
}
function resampleImage(rgba, width, height, spec, surface) {
  if (spec.kernel === "nearest" && !spec.wrap) {
    return resampleNearest(rgba, width, height, spec, surface);
  }
  let m = snapToDeviceGrid(spec);
  const kernel = spec.kernel;
  const hq = kernel === "hq-bilinear" || kernel === "hq-bicubic";
  const axisAligned = m[1] === 0 && m[2] === 0;
  if (hq && axisAligned) {
    const ox = m[0] * spec.srcX + m[4];
    const oy = m[3] * spec.srcY + m[5];
    m = [m[0], 0, 0, m[3], m[4] + mirroredOrigin(ox) - ox, m[5] + mirroredOrigin(oy) - oy];
  }
  const inv2 = invert2(m);
  if (!inv2) {
    return null;
  }
  const sx0 = Math.max(0, Math.floor(spec.srcX));
  const sy0 = Math.max(0, Math.floor(spec.srcY));
  const sx1 = Math.min(width, Math.ceil(spec.srcX + spec.srcW));
  const sy1 = Math.min(height, Math.ceil(spec.srcY + spec.srcH));
  if (sx1 <= sx0 || sy1 <= sy0) {
    return null;
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [u, v] of [
    [spec.srcX, spec.srcY],
    [spec.srcX + spec.srcW, spec.srcY],
    [spec.srcX, spec.srcY + spec.srcH],
    [spec.srcX + spec.srcW, spec.srcY + spec.srcH]
  ]) {
    const x = m[0] * u + m[2] * v + m[4];
    const y = m[1] * u + m[3] * v + m[5];
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const bx0 = Math.max(0, Math.floor(x0) - 1);
  const by0 = Math.max(0, Math.floor(y0) - 1);
  const bx1 = Math.min(surface.w, Math.ceil(x1) + 1);
  const by1 = Math.min(surface.h, Math.ceil(y1) + 1);
  const w = bx1 - bx0;
  const h = by1 - by0;
  if (!(w > 0 && h > 0) || w * h > MAX_RESAMPLE_PIXELS) {
    return null;
  }
  const scaleU = Math.hypot(m[0], m[1]);
  const scaleV = Math.hypot(m[2], m[3]);
  const integral = (v) => Math.abs(v - Math.round(v)) < 1e-9;
  const copyU = axisAligned && Math.abs(scaleU - 1) < 1e-9 && integral(m[4]);
  const copyV = axisAligned && Math.abs(scaleV - 1) < 1e-9 && integral(m[5]);
  const fu = axisFilter(kernel, scaleU, copyU);
  const fv = axisFilter(kernel, scaleV, copyV);
  const out = new Uint8ClampedArray(w * h * 4);
  const o = spec.halfPixelOffset ? 0.5 : 0;
  const uMax = spec.srcX + spec.srcW;
  const vMax = spec.srcY + spec.srcH;
  const wu = [];
  const wv = [];
  const c = spec.clampArgb ?? 0;
  const edge = {
    wrap: spec.wrap,
    clamp: [c >>> 16 & 255, c >>> 8 & 255, c & 255, c >>> 24 & 255],
    mirrorX: spec.wrap === "tile-flip-x" || spec.wrap === "tile-flip-xy",
    mirrorY: spec.wrap === "tile-flip-y" || spec.wrap === "tile-flip-xy"
  };
  for (let j = 0; j < h; j++) {
    const py = by0 + j + o;
    for (let i = 0; i < w; i++) {
      const px = bx0 + i + o;
      const u = inv2[0] * px + inv2[2] * py + inv2[4];
      const v = inv2[1] * px + inv2[3] * py + inv2[5];
      const cx = px + COVERAGE_NUDGE_X;
      const cy = py + COVERAGE_NUDGE_Y;
      const eu = inv2[0] * cx + inv2[2] * cy + inv2[4];
      const ev = inv2[1] * cx + inv2[3] * cy + inv2[5];
      if (eu < spec.srcX || ev < spec.srcY || eu >= uMax || ev >= vMax) {
        continue;
      }
      const cu = u;
      const cv = v;
      const iu0 = Math.ceil(cu - fu.radius);
      const iu1 = Math.floor(cu + fu.radius);
      const iv0 = Math.ceil(cv - fv.radius);
      const iv1 = Math.floor(cv + fv.radius);
      wu.length = 0;
      wv.length = 0;
      for (let t = iu0; t <= iu1; t++) {
        wu.push(fu.weight(t, cu));
      }
      for (let t = iv0; t <= iv1; t++) {
        wv.push(fv.weight(t, cv));
      }
      const [r, g, b, a] = blendSeparable(
        rgba,
        width,
        spec.wrap ? { x0: 0, y0: 0, x1: width, y1: height } : { x0: sx0, y0: sy0, x1: sx1, y1: sy1 },
        iu0,
        wu,
        iv0,
        wv,
        kernel === "bicubic",
        edge
      );
      if (a <= 0) {
        continue;
      }
      const alpha = Math.min(255, a);
      const dst = (j * w + i) * 4;
      out[dst] = Math.min(Math.max(0, r), alpha) * 255 / alpha;
      out[dst + 1] = Math.min(Math.max(0, g), alpha) * 255 / alpha;
      out[dst + 2] = Math.min(Math.max(0, b), alpha) * 255 / alpha;
      out[dst + 3] = alpha;
    }
  }
  return { x: bx0, y: by0, w, h, rgba: out };
}
var FIX16 = 65536;
function resampleNearest(rgba, width, height, spec, surface) {
  const m = spec.toDevice;
  const inv2 = invert2(m);
  if (!inv2) {
    return null;
  }
  const { srcX, srcY, srcW, srcH } = spec;
  const corners = [
    [srcX, srcY],
    [srcX + srcW, srcY],
    [srcX + srcW, srcY + srcH],
    [srcX, srcY + srcH]
  ].map(([u, v]) => [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]]);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of corners) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (![x0, y0, x1, y1].every(Number.isFinite)) {
    return null;
  }
  const bx0 = Math.max(0, Math.floor(x0) - 1);
  const by0 = Math.max(0, Math.floor(y0) - 1);
  const bx1 = Math.min(surface.w, Math.ceil(x1) + 2);
  const by1 = Math.min(surface.h, Math.ceil(y1) + 2);
  const w = bx1 - bx0;
  const h = by1 - by0;
  if (!(w > 0 && h > 0) || w * h > MAX_RESAMPLE_PIXELS) {
    return null;
  }
  const box = { x: bx0, y: by0, w, h };
  const coverage = rasterizePlusFill([corners.flatMap(([x, y]) => [toPlusFix(x), toPlusFix(y)])], false, false, spec.halfPixelOffset, box);
  const rowLo = Math.max(0, Math.floor(srcY));
  const rowHi = Math.min(height, Math.ceil(srcY + srcH));
  const o = spec.halfPixelOffset ? 0.5 : 0;
  const du = Math.round(inv2[0] * FIX16);
  const dv = Math.round(inv2[1] * FIX16);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++) {
    const py = by0 + j + o;
    let start = -1;
    let su = 0;
    let sv = 0;
    for (let i = 0; i < w; i++) {
      if (!coverage[j * w + i]) {
        continue;
      }
      if (start < 0) {
        const px = bx0 + i + o;
        start = i;
        su = Math.round((inv2[0] * px + inv2[2] * py + inv2[4]) * FIX16);
        sv = Math.round((inv2[1] * px + inv2[3] * py + inv2[5]) * FIX16);
      }
      const k = i - start;
      const tu = Math.floor((su + k * du + FIX16 / 2) / FIX16);
      const tv = Math.floor((sv + k * dv + FIX16 / 2) / FIX16);
      if (tu < 0 || tu >= width || tv < rowLo || tv >= rowHi) {
        continue;
      }
      const s = (tv * width + tu) * 4;
      const d = (j * w + i) * 4;
      out[d] = rgba[s];
      out[d + 1] = rgba[s + 1];
      out[d + 2] = rgba[s + 2];
      out[d + 3] = rgba[s + 3];
    }
  }
  return { x: bx0, y: by0, w, h, rgba: out };
}

// src/emf-plus-widen.ts
function arcPoints2(c, r, a0, sweep) {
  const out = [];
  if (!(r > 0) || sweep === 0) {
    return out;
  }
  for (const [p0, p1, p2, p3] of arcBeziers2(c.x, c.y, r, r, a0, sweep)) {
    const flat = [];
    flattenBezier(
      toPlusFix(p0.x),
      toPlusFix(p0.y),
      toPlusFix(p1.x),
      toPlusFix(p1.y),
      toPlusFix(p2.x),
      toPlusFix(p2.y),
      toPlusFix(p3.x),
      toPlusFix(p3.y),
      flat,
      GDIPLUS_HFD_TOLERANCE
    );
    for (let i = 0; i + 1 < flat.length; i += 2) {
      out.push({ x: flat[i] / 16, y: flat[i + 1] / 16 });
    }
  }
  return out;
}
function cleanPoints(pts, closed) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i += 2) {
    const p = { x: pts[i], y: pts[i + 1] };
    const last = out[out.length - 1];
    if (!last || Math.abs(last.x - p.x) > 1e-9 || Math.abs(last.y - p.y) > 1e-9) {
      out.push(p);
    }
  }
  if (closed && out.length > 1) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.abs(a.x - b.x) <= 1e-9 && Math.abs(a.y - b.y) <= 1e-9) {
      out.pop();
    }
  }
  return out;
}
function frame(a, b) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  return { ux, uy, nx: -uy, ny: ux };
}
function joinPoints(p, f1, f2, o, pen) {
  const a = { x: p.x + f1.nx * o, y: p.y + f1.ny * o };
  const b = { x: p.x + f2.nx * o, y: p.y + f2.ny * o };
  if (o === 0) {
    return [p];
  }
  const cross = f1.ux * f2.uy - f1.uy * f2.ux;
  if (Math.abs(cross) < 1e-12 && f1.ux * f2.ux + f1.uy * f2.uy > 0) {
    return [b];
  }
  const outer = cross * o < 0;
  if (!outer) {
    return [a, b];
  }
  if (pen.join === 2) {
    const a0 = Math.atan2(a.y - p.y, a.x - p.x);
    let sweep = Math.atan2(b.y - p.y, b.x - p.x) - a0;
    while (sweep > Math.PI) {
      sweep -= 2 * Math.PI;
    }
    while (sweep < -Math.PI) {
      sweep += 2 * Math.PI;
    }
    return [a, ...arcPoints2(p, Math.abs(o), a0, sweep), b];
  }
  if (pen.join === 1) {
    return [a, b];
  }
  const den = f1.ux * f2.uy - f1.uy * f2.ux;
  const t = ((b.x - a.x) * f2.uy - (b.y - a.y) * f2.ux) / den;
  const m = { x: a.x + f1.ux * t, y: a.y + f1.uy * t };
  const len = Math.hypot(m.x - p.x, m.y - p.y);
  const limit = pen.miterLimit * pen.half;
  if (len <= limit) {
    return [m];
  }
  if (pen.join === 3) {
    const dx = (m.x - p.x) / len;
    const dy = (m.y - p.y) / len;
    const along = (q, r) => {
      const dq = (q.x - p.x) * dx + (q.y - p.y) * dy;
      const dr = (r.x - p.x) * dx + (r.y - p.y) * dy;
      const s = dr === dq ? 0 : (limit - dq) / (dr - dq);
      return { x: q.x + (r.x - q.x) * s, y: q.y + (r.y - q.y) * s };
    };
    return [a, along(a, m), along(b, m), b];
  }
  return [a, b];
}
function capPoints(p, f, o1, o2, cap, half) {
  const at = (o, ext) => ({ x: p.x + f.nx * o + f.ux * ext, y: p.y + f.ny * o + f.uy * ext });
  const base = cap & 15;
  const kind = cap === 17 ? 1 : cap === 18 ? 2 : cap === 19 || cap === 20 ? 3 : cap >= 16 ? 0 : base;
  switch (kind) {
    case 1:
      return [at(o2, 0), at(o2, half), at(o1, half), at(o1, 0)];
    case 2: {
      if (Math.abs(o1 + o2) > 1e-9) {
        return [at(o2, 0), at(o1, 0)];
      }
      const a0 = Math.atan2(f.ny, f.nx) + (o2 < 0 ? Math.PI : 0);
      const sweep = o2 > 0 ? -Math.PI : Math.PI;
      return [at(o2, 0), ...arcPoints2(p, Math.abs(o2), a0, sweep), at(o1, 0)];
    }
    case 3:
      return [at(o2, 0), at((o1 + o2) / 2, half), at(o1, 0)];
    default:
      return [at(o2, 0), at(o1, 0)];
  }
}
function sidePoints(pts, closed, o, pen) {
  const n = pts.length;
  const out = [];
  const segs2 = closed ? n : n - 1;
  const frames = Array.from({ length: segs2 }, (_, i) => frame(pts[i], pts[(i + 1) % n]));
  for (let i = 0; i < n; i++) {
    const inIdx = i - 1 >= 0 ? i - 1 : closed ? segs2 - 1 : -1;
    const outIdx = i < segs2 ? i : -1;
    if (inIdx >= 0 && outIdx >= 0) {
      out.push(...joinPoints(pts[i], frames[inIdx], frames[outIdx], o, pen));
    } else {
      const f = frames[outIdx >= 0 ? outIdx : inIdx];
      out.push({ x: pts[i].x + f.nx * o, y: pts[i].y + f.ny * o });
    }
  }
  return out;
}
function dashFigure(pts, closed, pen) {
  const shorten = pen.dashCap !== 0 ? 2 * pen.half : 0;
  const dash = pen.dash.map((v, i, all) => {
    if (i % 2 === 0) {
      return Math.max(v - shorten, MIN_DASH);
    }
    const on2 = all[i - 1];
    return v + on2 - Math.max(on2 - shorten, MIN_DASH);
  });
  const total = dash.reduce((s, v) => s + v, 0);
  const out = [];
  if (!(total > 0)) {
    return out;
  }
  const path = closed ? [pts[pts.length - 1], ...pts] : pts;
  let phase = (pen.dashOffset % total + total) % total;
  let idx = 0;
  while (phase >= dash[idx]) {
    phase -= dash[idx];
    idx = (idx + 1) % dash.length;
  }
  let remaining = dash[idx] - phase;
  let on = idx % 2 === 0;
  let cur = on ? [path[0]] : null;
  let curFirst = on;
  for (let i = 0; i + 1 < path.length; i++) {
    const a = path[i];
    const b = path[i + 1];
    const m = pen.dashMetric;
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    let segLen = m ? Math.hypot(m[0] * vx + m[2] * vy, m[1] * vx + m[3] * vy) : Math.hypot(vx, vy);
    let t0 = 0;
    while (segLen - t0 > remaining + 1e-9) {
      t0 += remaining;
      const q = { x: a.x + (b.x - a.x) * t0 / segLen, y: a.y + (b.y - a.y) * t0 / segLen };
      if (on && cur) {
        cur.push(q);
        out.push({ pts: cur, first: curFirst, last: false });
        cur = null;
      } else {
        cur = [q];
        curFirst = false;
      }
      on = !on;
      idx = (idx + 1) % dash.length;
      remaining = dash[idx];
    }
    remaining -= segLen - t0;
    if (on && cur) {
      cur.push(b);
    }
    segLen = 0;
  }
  if (on && cur && cur.length > 1) {
    out.push({ pts: cur, first: curFirst, last: true });
  }
  return out.filter((d) => d.pts.length > 1);
}
var ARROW_ANCHOR = 20;
function arrowAnchor(pp, atEnd, half) {
  const w = 2 * half;
  const tip = atEnd ? pp[pp.length - 1] : pp[0];
  const next = atEnd ? pp[pp.length - 2] : pp[1];
  const len = Math.hypot(next.x - tip.x, next.y - tip.y);
  const ux = (next.x - tip.x) / len;
  const uy = (next.y - tip.y) / len;
  const depth = 2 * w;
  const across = 2 * w / Math.sqrt(3);
  const base = { x: tip.x + ux * depth, y: tip.y + uy * depth };
  if (len > depth) {
    if (atEnd) {
      pp[pp.length - 1] = base;
    } else {
      pp[0] = base;
    }
  }
  return [tip, { x: base.x - uy * across, y: base.y + ux * across }, { x: base.x + uy * across, y: base.y - ux * across }];
}
var MIN_DASH = 1 / 256;
function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}
function widenFigures(figures, pen) {
  const polys = [];
  const h = pen.half;
  for (const fig of figures) {
    const pts = cleanPoints(fig.pts, fig.closed);
    if (pts.length < 2) {
      continue;
    }
    const closed = fig.closed && pts.length > 2;
    let lo = -h;
    let hi = h;
    if (pen.inset && closed) {
      if (signedArea(pts) > 0) {
        lo = 0;
        hi = 2 * h;
      } else {
        lo = -2 * h;
        hi = 0;
      }
    }
    const bands = [];
    const c = pen.compound;
    if (c && c.length >= 2) {
      for (let i = 0; i + 1 < c.length; i += 2) {
        bands.push([lo + (hi - lo) * c[i], lo + (hi - lo) * c[i + 1]]);
      }
    } else {
      bands.push([lo, hi]);
    }
    const dashPen = pen.inset && closed ? { ...pen, dashOffset: pen.dashOffset * 2 } : pen;
    const pieces = pen.dash ? dashFigure(pts, closed, dashPen) : [{ pts, first: true, last: true }];
    const pieceClosed = !pen.dash && closed;
    for (const piece of pieces) {
      const pp = cleanPoints(
        piece.pts.flatMap((p) => [p.x, p.y]),
        false
      );
      if (pp.length < 2) {
        continue;
      }
      const arrows = [];
      let startCapOverride = null;
      let endCapOverride = null;
      if (!pieceClosed && !(pen.dash && closed)) {
        if (piece.first && pen.startCap === ARROW_ANCHOR) {
          arrows.push(arrowAnchor(pp, false, h));
          startCapOverride = 0;
        }
        if (piece.last && pen.endCap === ARROW_ANCHOR) {
          arrows.push(arrowAnchor(pp, true, h));
          endCapOverride = 0;
        }
      }
      for (const [o1, o2] of bands) {
        if (pieceClosed) {
          polys.push(sidePoints(pp, true, o2, pen));
          polys.push(sidePoints(pp, true, o1, pen).reverse());
          continue;
        }
        const left = sidePoints(pp, false, o2, pen);
        const right = sidePoints(pp, false, o1, pen).reverse();
        const fEnd = frame(pp[pp.length - 2], pp[pp.length - 1]);
        const f0 = frame(pp[1], pp[0]);
        const endCap = endCapOverride ?? (piece.last && !(pen.dash && closed) ? pen.endCap : pen.dashCap);
        const startCap = startCapOverride ?? (piece.first && !(pen.dash && closed) ? pen.startCap : pen.dashCap);
        const capEnd = capPoints(pp[pp.length - 1], fEnd, o1, o2, endCap, h);
        const capStart = capPoints(pp[0], f0, -o2, -o1, startCap, h);
        const poly = [...left.slice(0, -1), ...capEnd, ...right.slice(1, -1), ...capStart];
        polys.push(poly);
        const sign = Math.sign(signedArea(poly));
        for (const arrow of arrows) {
          polys.push(Math.sign(signedArea(arrow)) === sign ? arrow : arrow.slice().reverse());
        }
      }
    }
  }
  return polys;
}

// src/emf-plus-custom-cap.ts
var CAP_DATA_FILL_PATH = 1;
var CAP_DATA_LINE_PATH = 2;
var FLT_EPS = 11920928955078125e-23;
var f322 = Math.fround;
function capPathLength(points, types) {
  const n = points.length;
  if (n < 2) {
    return 0;
  }
  const closed = (types[n - 1] & 128) !== 0;
  let prev = closed ? points[n - 1] : points[0];
  let min = 0;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const dx = f322(prev.x - p.x);
    if (Math.abs(dx) >= FLT_EPS) {
      const t = f322(-p.x / dx);
      if (!(t < -FLT_EPS) && !(f322(t - 1) > FLT_EPS)) {
        const y = f322(f322(f322(prev.y - p.y) * t) + p.y);
        min = Math.min(min, y);
      }
    }
    prev = p;
  }
  return min < 0 ? -min : 0;
}
function arrowCapPath(width, height, middleInset, filled) {
  const h = f322(height);
  const w2 = f322(f322(width) * 0.5);
  const points = [
    { x: w2, y: -h },
    { x: 0, y: 0 },
    { x: -w2, y: -h }
  ];
  if (filled && middleInset !== 0) {
    points.push({ x: 0, y: f322(f322(middleInset) - h) });
  }
  const types = new Uint8Array(points.length);
  types.fill(1);
  types[0] = 0;
  if (filled) {
    types[points.length - 1] |= 128;
  }
  return { kind: "plus-path", points, types, fillRule: "nonzero" };
}
function parseCustomLineCap(view, off, size) {
  const end = off + size;
  if (size < 8 || end > view.byteLength) {
    return null;
  }
  const type = view.getInt32(off + 4, true);
  const d = off + 8;
  const f = (k) => view.getFloat32(d + k, true);
  const u = (k) => view.getUint32(d + k, true);
  if (type === 1) {
    if (d + 52 > end) {
      return null;
    }
    const width = f(0);
    const height = f(4);
    const middleInset = f(8);
    const filled = u(12) !== 0;
    const path = arrowCapPath(width, height, middleInset, filled);
    const length = capPathLength(path.points, path.types);
    return {
      kind: "plus-customlinecap",
      capType: 1,
      baseCap: 0,
      baseInset: width !== 0 ? f322(height / width) : 0,
      strokeStartCap: u(16),
      strokeEndCap: u(20),
      strokeJoin: u(24),
      strokeMiterLimit: f(28),
      widthScale: f(32),
      fillPath: filled ? path : null,
      linePath: filled ? null : path,
      fillLength: filled ? length : 0,
      strokeLength: filled ? 0 : length,
      arrow: { width, height, middleInset, filled }
    };
  }
  if (type !== 0 || d + 48 > end) {
    return null;
  }
  const flags = u(0);
  let o = d + 48;
  const readPath = () => {
    if (o + 4 > end) {
      return null;
    }
    const len = view.getInt32(o, true);
    o += 4;
    if (len <= 0 || o + len > end) {
      return null;
    }
    const path = parseEmfPlusPath(view, o, len);
    o += len;
    return path;
  };
  const fillPath = flags & CAP_DATA_FILL_PATH ? readPath() : null;
  const linePath = flags & CAP_DATA_LINE_PATH ? readPath() : null;
  return {
    kind: "plus-customlinecap",
    capType: 0,
    baseCap: u(4),
    baseInset: f(8),
    strokeStartCap: u(12),
    strokeEndCap: u(16),
    strokeJoin: u(20),
    strokeMiterLimit: f(24),
    widthScale: f(28),
    fillPath,
    linePath,
    fillLength: fillPath ? capPathLength(fillPath.points, fillPath.types) : 0,
    strokeLength: linePath ? capPathLength(linePath.points, linePath.types) : 0
  };
}
function intersectCircleLine(c, r2, a, b) {
  const vx = f322(b.x - a.x);
  const vy = f322(b.y - a.y);
  const len = Math.sqrt(f322(f322(vx * vx) + f322(vy * vy)));
  if (len < FLT_EPS) {
    return null;
  }
  const inv2 = f322(1 / len);
  const ux = f322(vx * inv2);
  const uy = f322(vy * inv2);
  const wx = f322(c.x - a.x);
  const wy = f322(c.y - a.y);
  const d2 = f322(f322(wy * wy) + f322(wx * wx));
  const proj = f322(f322(wy * uy) + f322(wx * ux));
  if (proj < FLT_EPS && d2 >= r2) {
    return null;
  }
  const disc = r2 - d2 + proj * proj;
  if (disc < FLT_EPS) {
    return null;
  }
  const s = Math.sqrt(disc);
  let t = null;
  if (d2 >= r2) {
    const t1 = proj - s;
    if (t1 > FLT_EPS && t1 >= 0) {
      t = t1;
    }
  }
  if (t === null) {
    const t2 = s + proj;
    if (t2 > FLT_EPS && t2 >= 0) {
      t = t2;
    }
  }
  if (t === null) {
    return null;
  }
  const tf = f322(t);
  return { x: f322(f322(tf * ux) + a.x), y: f322(f322(tf * uy) + a.y) };
}
function capGradient(pts, dropped, reverse, r2, t) {
  const n = pts.length;
  const at = (k2) => reverse ? n - 1 - k2 : k2;
  const p0 = { ...pts[at(0)] };
  let k = 0;
  let found = false;
  let wasDropped = false;
  let outside = at(0);
  while (k < n) {
    const q = pts[at(k)];
    outside = at(k);
    const dx = f322(q.x - p0.x);
    const dy = f322(q.y - p0.y);
    if (f322(f322(dx * dx) + f322(dy * dy)) > r2) {
      found = true;
      break;
    }
    wasDropped = dropped[at(k)];
    dropped[at(k)] = true;
    k++;
  }
  const cur = at(Math.max(0, k - 1));
  if (found && !wasDropped) {
    dropped[cur] = false;
  }
  const inner = pts[cur];
  const hit = intersectCircleLine(p0, r2, pts[outside], inner) ?? { x: inner.x, y: inner.y };
  let gx = f322(hit.x - p0.x);
  let gy = f322(hit.y - p0.y);
  const len = Math.sqrt(gx * gx + gy * gy);
  if (len > FLT_EPS) {
    gx = f322(gx / len);
    gy = f322(gy / len);
  } else {
    gx = 0;
    gy = 0;
  }
  const k1 = f322(1 - t);
  pts[cur] = {
    x: f322(f322(f322(p0.x - hit.x) * k1) + hit.x),
    y: f322(f322(f322(p0.y - hit.y) * k1) + hit.y)
  };
  return { x: gx, y: gy };
}
function placeCapPath(path, origin, d, s) {
  const ax = f322(d.y * s);
  const ay = f322(-d.x * s);
  const bx = f322(d.x * s);
  const by = f322(d.y * s);
  const points = path.points.map((p) => ({
    x: f322(f322(f322(ax * p.x) + f322(bx * p.y)) + origin.x),
    y: f322(f322(f322(ay * p.x) + f322(by * p.y)) + origin.y)
  }));
  return { ...path, points };
}
function capFigures(path, closeAll) {
  const figures = recordDeviceFigures((c) => {
    const pts = path.points;
    const types = path.types;
    let i = 0;
    while (i < pts.length) {
      const t = types[i] & 7;
      if (t === 0 || i === 0) {
        c.moveTo(pts[i].x, pts[i].y);
        i++;
      } else if (t === 3 && i + 2 < pts.length) {
        c.bezierCurveTo(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, pts[i + 2].x, pts[i + 2].y);
        i += 3;
        if (types[i - 1] & 128) {
          c.closePath();
        }
        continue;
      } else {
        c.lineTo(pts[i].x, pts[i].y);
        i++;
      }
      if (types[i - 1] & 128) {
        c.closePath();
      }
    }
  }, [1, 0, 0, 1, 0, 0]);
  return closeAll ? figures.map((f) => ({ ...f, closed: true })) : figures;
}
function customCapGeometry(figures, width, start, end, options = {}) {
  const out = [];
  const capped = [];
  const polygons = [];
  const minFill = options.minFillScale ?? 2;
  for (const fig of figures) {
    if (fig.closed || !start && !end) {
      out.push(fig);
      capped.push({ start: false, end: false });
      continue;
    }
    const pts = [];
    for (let i = 0; i + 1 < fig.pts.length; i += 2) {
      pts.push({ x: fig.pts[i], y: fig.pts[i + 1] });
    }
    if (pts.length < 2) {
      out.push(fig);
      capped.push({ start: false, end: false });
      continue;
    }
    const dropped = new Array(pts.length).fill(false);
    const first = { ...pts[0] };
    const last = { ...pts[pts.length - 1] };
    const apply2 = (cap, atEnd, fill) => {
      const path = fill ? cap.fillPath : cap.linePath;
      if (!path || path.points.length === 0) {
        return;
      }
      const ws = f322(cap.widthScale * width);
      let length;
      let scale;
      if (fill) {
        length = cap.fillLength;
        scale = Math.max(ws, 1);
      } else {
        length = Math.abs(cap.strokeLength) < FLT_EPS ? 1 : cap.strokeLength;
        scale = ws;
      }
      const t = fill && Math.abs(length) < FLT_EPS ? 0 : f322(cap.baseInset / length);
      const r = f322(length * scale);
      const g = capGradient(pts, dropped, atEnd, f322(r * r), t);
      const dir = { x: -g.x, y: -g.y };
      const origin = atEnd ? last : first;
      if (fill) {
        const placed = placeCapPath(path, origin, dir, Math.max(scale, minFill));
        for (const f of capFigures(placed, true)) {
          const poly = [];
          for (let i = 0; i + 1 < f.pts.length; i += 2) {
            poly.push({ x: f.pts[i], y: f.pts[i + 1] });
          }
          polygons.push(poly);
        }
      } else {
        const placed = placeCapPath(path, origin, dir, scale);
        const pen = {
          // GDI+'s widener never makes an outline thinner than one device pixel.
          half: Math.max(ws, 1) / 2,
          join: (options.widenJoin ?? ((j) => j))(cap.strokeJoin),
          miterLimit: 10,
          startCap: cap.strokeStartCap,
          endCap: cap.strokeEndCap,
          dashCap: 0,
          dash: null,
          dashOffset: 0,
          compound: null,
          inset: false
        };
        polygons.push(...(options.widen ?? widenFigures)(capFigures(placed, false), pen).map((q) => q.reverse()));
      }
    };
    if (start) {
      apply2(start, false, true);
    }
    if (end) {
      apply2(end, true, true);
    }
    if (start) {
      apply2(start, false, false);
    }
    if (end) {
      apply2(end, true, false);
    }
    const kept = [];
    pts.forEach((p, i) => {
      if (!dropped[i]) {
        kept.push(p.x, p.y);
      }
    });
    if (kept.length >= 4) {
      out.push({ pts: kept, closed: false, curved: fig.curved });
      capped.push({ start: !!start, end: !!end });
    }
  }
  return { figures: out, capped, polygons };
}

// src/emf-plus-object-complex.ts
var PEN_TRANSFORM = 1;
var PEN_START_CAP = 2;
var PEN_END_CAP = 4;
var PEN_JOIN = 8;
var PEN_MITER_LIMIT = 16;
var PEN_LINE_STYLE = 32;
var PEN_DASHED_LINE_CAP = 64;
var PEN_DASHED_LINE_OFFSET = 128;
var PEN_DASHED_LINE = 256;
var PEN_NON_CENTER = 512;
var PEN_COMPOUND_LINE = 1024;
var PEN_CUSTOM_START_CAP = 2048;
var PEN_CUSTOM_END_CAP = 4096;
var MAX_PEN_ARRAY = 1024;
function parseEmfPlusPenObject(view, dataOff, recDataSize, textureCache, cacheKey = dataOff) {
  if (recDataSize < 20) {
    return null;
  }
  const end = dataOff + recDataSize;
  const hasVersion = looksLikeGraphicsVersion(view.getUint32(dataOff, true));
  const penFlags = view.getUint32(dataOff + (hasVersion ? 8 : 4), true);
  const penWidth = view.getFloat32(dataOff + 16, true);
  let o = dataOff + 20;
  const u32 = () => {
    if (o + 4 > end) {
      return void 0;
    }
    const v = view.getUint32(o, true);
    o += 4;
    return v;
  };
  const f323 = () => {
    if (o + 4 > end) {
      return void 0;
    }
    const v = view.getFloat32(o, true);
    o += 4;
    return v;
  };
  const pen = { kind: "plus-pen", color: "rgba(0,0,0,1)", width: penWidth, dashStyle: 0 };
  if (penFlags & PEN_TRANSFORM) {
    if (o + 24 <= end) {
      pen.transform = [0, 4, 8, 12, 16, 20].map((k) => view.getFloat32(o + k, true));
    }
    o += 24;
  }
  if (penFlags & PEN_START_CAP) {
    pen.startCap = u32();
  }
  if (penFlags & PEN_END_CAP) {
    pen.endCap = u32();
  }
  if (penFlags & PEN_JOIN) {
    pen.lineJoin = u32();
  }
  if (penFlags & PEN_MITER_LIMIT) {
    pen.miterLimit = f323();
  }
  if (penFlags & PEN_LINE_STYLE) {
    pen.dashStyle = u32() ?? 0;
  }
  if (penFlags & PEN_DASHED_LINE_CAP) {
    pen.dashCap = u32();
  }
  if (penFlags & PEN_DASHED_LINE_OFFSET) {
    pen.dashOffset = f323();
  }
  if (penFlags & PEN_DASHED_LINE) {
    const n = u32() ?? 0;
    if (n > 0 && n <= MAX_PEN_ARRAY && o + n * 4 <= end) {
      pen.dashPattern = Array.from({ length: n }, (_, k) => view.getFloat32(o + k * 4, true));
      if (!(penFlags & PEN_LINE_STYLE)) {
        pen.dashStyle = 5;
      }
    }
    o += Math.min(n, MAX_PEN_ARRAY) * 4;
  }
  if (penFlags & PEN_NON_CENTER) {
    pen.alignment = u32();
  }
  if (penFlags & PEN_COMPOUND_LINE) {
    const n = u32() ?? 0;
    if (n >= 2 && n <= MAX_PEN_ARRAY && o + n * 4 <= end) {
      pen.compound = Array.from({ length: n }, (_, k) => view.getFloat32(o + k * 4, true));
    }
    o += Math.min(n, MAX_PEN_ARRAY) * 4;
  }
  for (const flag of [PEN_CUSTOM_START_CAP, PEN_CUSTOM_END_CAP]) {
    if (penFlags & flag) {
      const size = u32() ?? 0;
      const cap = o + size <= end ? parseCustomLineCap(view, o, size) : null;
      if (flag === PEN_CUSTOM_START_CAP) {
        pen.customStartCap = cap;
      } else {
        pen.customEndCap = cap;
      }
      o += size;
    }
  }
  if (o + 8 <= end) {
    const brush = parseEmfPlusBrushObject(view, o, end - o, textureCache, cacheKey);
    if (brush) {
      pen.color = brush.color;
      pen.brush = brush;
    }
  }
  return pen;
}
function penBrushOffset(view, dataOff, recDataSize) {
  if (recDataSize < 20) {
    return null;
  }
  const end = dataOff + recDataSize;
  const hasVersion = looksLikeGraphicsVersion(view.getUint32(dataOff, true));
  const penFlags = view.getUint32(dataOff + (hasVersion ? 8 : 4), true);
  let o = dataOff + 20;
  const skipArray = () => {
    const n = o + 4 <= end ? view.getUint32(o, true) : 0;
    o += 4 + Math.min(n, MAX_PEN_ARRAY) * 4;
  };
  if (penFlags & PEN_TRANSFORM) {
    o += 24;
  }
  for (const flag of [PEN_START_CAP, PEN_END_CAP, PEN_JOIN, PEN_MITER_LIMIT, PEN_LINE_STYLE, PEN_DASHED_LINE_CAP, PEN_DASHED_LINE_OFFSET]) {
    if (penFlags & flag) {
      o += 4;
    }
  }
  if (penFlags & PEN_DASHED_LINE) {
    skipArray();
  }
  if (penFlags & PEN_NON_CENTER) {
    o += 4;
  }
  if (penFlags & PEN_COMPOUND_LINE) {
    skipArray();
  }
  for (const flag of [PEN_CUSTOM_START_CAP, PEN_CUSTOM_END_CAP]) {
    if (penFlags & flag) {
      const size = o + 4 <= end ? view.getUint32(o, true) : 0;
      o += 4 + size;
    }
  }
  return o + 8 <= end ? o : null;
}
function parseEmfPlusImageObject(view, dataOff, recDataSize, objectId) {
  let imgData = null;
  const imgType = view.getUint32(dataOff + 4, true);
  if (imgType === 1 && recDataSize >= 28) {
    const bmpType = view.getUint32(dataOff + 24, true);
    if (bmpType === 0) {
      const bmpW = view.getInt32(dataOff + 8, true);
      const bmpH = view.getInt32(dataOff + 12, true);
      const bmpStride = view.getInt32(dataOff + 16, true);
      const pixelFormat = view.getUint32(dataOff + 20, true);
      emfLog(
        `  Bitmap(Pixel): ${bmpW}\xD7${bmpH}, stride=${bmpStride}, pixelFormat=0x${pixelFormat.toString(16).padStart(8, "0")}`
      );
      const pixelStart = dataOff + 28;
      const absStride = Math.abs(bmpStride);
      if (bmpW > 0 && bmpH > 0 && bmpW <= 8192 && bmpH <= 8192 && pixelStart + absStride * bmpH <= view.byteLength) {
        const decoded = decodeEmfPlusBitmapPixels(
          view,
          pixelStart,
          bmpW,
          bmpH,
          bmpStride,
          pixelFormat
        );
        if (decoded) {
          emfLog(`  Bitmap(Pixel): decoded successfully, size=${decoded.byteLength} bytes`);
          imgData = decoded;
        }
      }
    } else if (bmpType === 1) {
      const imgStart = dataOff + 28;
      const imgLen = recDataSize - 28;
      emfLog(`  Bitmap(Compressed): imgLen=${imgLen}, imgStart=0x${imgStart.toString(16)}`);
      if (imgLen > 0 && imgStart + imgLen <= view.byteLength) {
        imgData = view.buffer.slice(
          view.byteOffset + imgStart,
          view.byteOffset + imgStart + imgLen
        );
        if (imgData.byteLength >= 4) {
          const hdr = new Uint8Array(imgData, 0, 4);
          emfLog(
            `  Bitmap(Compressed): first 4 bytes = [${Array.from(hdr).map((b) => b.toString(16).padStart(2, "0")).join(" ")}]`
          );
        }
      }
    } else ;
  } else if (imgType === 2 && recDataSize >= 12) {
    view.getUint32(dataOff + 8, true);
    const mfDataSize = view.getUint32(dataOff + 12, true);
    const mfStart = dataOff + 16;
    if (mfDataSize > 0 && mfStart + mfDataSize <= view.byteLength) {
      imgData = view.buffer.slice(
        view.byteOffset + mfStart,
        view.byteOffset + mfStart + mfDataSize
      );
      if (imgData.byteLength >= 4) {
        const hdr = new DataView(imgData);
        hdr.getUint32(0, true);
      }
    } else {
      emfWarn(
        `  Metafile: out of bounds or empty (mfStart=0x${mfStart.toString(16)}, mfDataSize=${mfDataSize}, viewLen=${view.byteLength})`
      );
    }
  }
  return { data: imgData, type: imgType };
}
function parseEmfPlusFontObject(view, dataOff, recDataSize) {
  if (recDataSize < 28) {
    return null;
  }
  const emSize = view.getFloat32(dataOff + 4, true);
  const unit = view.getUint32(dataOff + 8, true);
  const styleFlags = view.getInt32(dataOff + 12, true);
  const nameLen = view.getUint32(dataOff + 20, true);
  let family = "sans-serif";
  if (nameLen > 0 && dataOff + 24 + nameLen * 2 <= dataOff + recDataSize) {
    family = readUtf16LE(view, dataOff + 24, nameLen) || "sans-serif";
  }
  return { kind: "plus-font", emSize: emSize || 12, flags: styleFlags, family, unit };
}

// src/emf-plus-continuation.ts
var MAX_CONTINUATION_BYTES = 64 * 1024 * 1024;
function createContinuationAccumulator() {
  return {
    continuationBuffer: null,
    continuationObjectId: -1,
    continuationObjectType: 0,
    continuationTotalSize: 0,
    continuationOffset: 0,
    continuationKey: void 0
  };
}
function reset(acc) {
  acc.continuationBuffer = null;
  acc.continuationObjectId = -1;
  acc.continuationObjectType = 0;
  acc.continuationTotalSize = 0;
  acc.continuationOffset = 0;
  acc.continuationKey = void 0;
}
function append(acc, view, dataOff, recDataSize) {
  const buffer = acc.continuationBuffer;
  if (!buffer) {
    return;
  }
  let start = dataOff;
  let size = recDataSize;
  if (size >= 4 && view.getUint32(dataOff, true) === acc.continuationTotalSize) {
    start += 4;
    size -= 4;
  }
  const n = Math.max(0, Math.min(size, acc.continuationTotalSize - acc.continuationOffset));
  buffer.set(new Uint8Array(view.buffer, view.byteOffset + start, n), acc.continuationOffset);
  acc.continuationOffset += n;
}
function finish(acc, objectId) {
  const buffer = acc.continuationBuffer;
  const out = buffer ? {
    view: new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    flags: acc.continuationObjectType << 8 | objectId,
    dataOff: 0,
    dataSize: acc.continuationTotalSize,
    cacheKey: acc.continuationKey ?? -1
  } : null;
  reset(acc);
  return out;
}
function feedEmfPlusObjectRecord(acc, view, recFlags, dataOff, recDataSize) {
  const isContinuation = (recFlags & 32768) !== 0;
  const objectId = recFlags & 255;
  const inRun = acc.continuationBuffer !== null && objectId === acc.continuationObjectId;
  if (!isContinuation && !inRun) {
    return { view, flags: recFlags, dataOff, dataSize: recDataSize, cacheKey: dataOff };
  }
  if (isContinuation && !inRun) {
    if (acc.continuationBuffer !== null) {
      emfWarn(`EMFPLUS_OBJECT continuation: object ${acc.continuationObjectId} never completed, dropping it`);
    }
    reset(acc);
    if (recDataSize < 4) {
      return null;
    }
    const totalSize = view.getUint32(dataOff, true);
    const remaining = view.byteLength - dataOff;
    if (totalSize <= 0 || totalSize > MAX_CONTINUATION_BYTES || totalSize > remaining) {
      return null;
    }
    acc.continuationBuffer = new Uint8Array(totalSize);
    acc.continuationObjectId = objectId;
    acc.continuationObjectType = recFlags >> 8 & 127;
    acc.continuationTotalSize = totalSize;
    acc.continuationOffset = 0;
    acc.continuationKey = dataOff;
  }
  append(acc, view, dataOff, recDataSize);
  if (!isContinuation || acc.continuationOffset >= acc.continuationTotalSize) {
    return finish(acc, objectId);
  }
  return null;
}

// src/emf-plus-texture-predecode.ts
function collectTextureCandidate(obj, out) {
  const objectType = obj.flags >> 8 & 127;
  if (objectType !== EMFPLUS_OBJECTTYPE_BRUSH && objectType !== EMFPLUS_OBJECTTYPE_PEN || obj.dataSize < 8) {
    return;
  }
  const { view } = obj;
  const recEnd = obj.dataOff + obj.dataSize;
  let dataOff = obj.dataOff;
  if (objectType === EMFPLUS_OBJECTTYPE_PEN) {
    const brushOff = penBrushOffset(view, obj.dataOff, obj.dataSize);
    if (brushOff === null) {
      return;
    }
    dataOff = brushOff;
  }
  const hasVersion = looksLikeGraphicsVersion(view.getUint32(dataOff, true));
  const typeOff = dataOff + (hasVersion ? 4 : 0);
  if (typeOff + 8 > recEnd || view.getUint32(typeOff, true) !== EMFPLUS_BRUSHTYPE_TEXTUREFILL) {
    return;
  }
  const imgOff = textureBrushImageOffset(view, typeOff + 4, recEnd);
  if (imgOff === null) {
    return;
  }
  const bytes = findCompressedTextureImageBytes(view, imgOff, recEnd);
  if (bytes) {
    out.push({ key: obj.cacheKey, view, byteStart: bytes.start, byteEnd: bytes.end });
  }
}
function scanEmfPlusStream(view, offset, length, acc, visit) {
  const end = offset + length;
  let off = offset;
  let recordCount = 0;
  const MAX_RECORDS = 5e5;
  while (off + 12 <= end && recordCount < MAX_RECORDS) {
    const recType = view.getUint16(off, true);
    const recFlags = view.getUint16(off + 2, true);
    const recSize = view.getUint32(off + 4, true);
    const recDataSize = view.getUint32(off + 8, true);
    if (recSize < 12 || off + recSize > end) {
      break;
    }
    recordCount++;
    if (recType === EMFPLUS_OBJECT) {
      const assembled = feedEmfPlusObjectRecord(acc, view, recFlags, off + 12, recDataSize);
      if (assembled) {
        visit(assembled);
      }
    }
    off += recSize;
  }
}
function walkEmfPlusObjects(view, visit) {
  const acc = createContinuationAccumulator();
  let offset = 0;
  const maxOffset = view.byteLength;
  let recordCount = 0;
  const MAX_RECORDS = 5e5;
  while (offset + 8 <= maxOffset && recordCount < MAX_RECORDS) {
    const recType = view.getUint32(offset, true);
    const recSize = view.getUint32(offset + 4, true);
    if (recSize < 8 || offset + recSize > maxOffset) {
      break;
    }
    recordCount++;
    if (recType === EMR_COMMENT && recSize >= 16) {
      const dataOff = offset + 8;
      const commentDataSize = view.getUint32(dataOff, true);
      const sig = view.getUint32(dataOff + 4, true);
      if (sig === EMFPLUS_SIGNATURE && commentDataSize > 4) {
        scanEmfPlusStream(view, dataOff + 8, commentDataSize - 4, acc, visit);
      }
    } else if (recType === EMR_EOF) {
      break;
    }
    offset += recSize;
  }
}
function scanEmfForTextureCandidates(view) {
  const candidates = [];
  walkEmfPlusObjects(view, (obj) => collectTextureCandidate(obj, candidates));
  return candidates;
}
async function decodeCompressedBytesToRgba(view, start, end) {
  const byteLength = end - start;
  if (byteLength <= 0) {
    return null;
  }
  const src = new Uint8Array(view.buffer, view.byteOffset + start, byteLength);
  const bytes = new ArrayBuffer(byteLength);
  new Uint8Array(bytes).set(src);
  try {
    const decoded = await decodeDeferredImageBytes(bytes);
    if (!decoded) {
      return null;
    }
    const { width, height } = decoded;
    if (width <= 0 || height <= 0 || width > 8192 || height > 8192) {
      decoded.close();
      return null;
    }
    const temp = createTempCanvas(width, height);
    if (!temp) {
      decoded.close();
      return null;
    }
    canvasDrawImage(temp.ctx, decoded.drawable, 0, 0, width, height);
    decoded.close();
    const pixels = canvasGetImageData(temp.ctx, 0, 0, width, height);
    return { width, height, rgba: new Uint8ClampedArray(pixels.data.buffer.slice(0)) };
  } catch (err) {
    emfWarn(
      "preDecodeEmfPlusTextures: failed to decode a compressed texture image:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
async function preDecodeEmfPlusTextures(view) {
  const cache = /* @__PURE__ */ new Map();
  let candidates;
  try {
    candidates = scanEmfForTextureCandidates(view);
  } catch (err) {
    emfWarn("preDecodeEmfPlusTextures: scan failed:", err instanceof Error ? err.message : err);
    return cache;
  }
  if (candidates.length === 0) {
    return cache;
  }
  emfLog(`preDecodeEmfPlusTextures: found ${candidates.length} compressed-texture candidate(s)`);
  for (const c of candidates) {
    const decoded = await decodeCompressedBytesToRgba(c.view, c.byteStart, c.byteEnd);
    if (decoded) {
      cache.set(c.key, decoded);
      emfLog(`preDecodeEmfPlusTextures: decoded texture for key=0x${c.key.toString(16)}: ${decoded.width}x${decoded.height}`);
    }
  }
  return cache;
}

// src/emf-plus-image-predecode.ts
var MAX_NESTED_METAFILE_DEPTH = 3;
async function preDecodeEmfPlusImages(view, depth = 0) {
  const cache = /* @__PURE__ */ new Map();
  const candidates = [];
  try {
    walkEmfPlusObjects(view, (obj) => {
      const objectType = obj.flags >> 8 & 127;
      if (objectType !== EMFPLUS_OBJECTTYPE_IMAGE || obj.dataSize < 8) {
        return;
      }
      const parsed = parseEmfPlusImageObject(obj.view, obj.dataOff, obj.dataSize, obj.flags & 255);
      if (parsed.data && parsed.data.byteLength > 0) {
        candidates.push({ key: obj.cacheKey, type: parsed.type, data: parsed.data });
      }
    });
  } catch (err) {
    emfWarn("preDecodeEmfPlusImages: scan failed:", err instanceof Error ? err.message : err);
    return cache;
  }
  for (const c of candidates) {
    const nestedView = new DataView(c.data, 0, c.data.byteLength);
    if (c.type === 2) {
      if (depth >= MAX_NESTED_METAFILE_DEPTH) {
        continue;
      }
      cache.set(c.key, { kind: "metafile", caches: await preDecodeMetafileCaches(nestedView, depth + 1) });
      continue;
    }
    const decoded = await decodeCompressedBytesToRgba(nestedView, 0, c.data.byteLength);
    if (decoded) {
      cache.set(c.key, { kind: "bitmap", ...decoded });
      emfLog(`preDecodeEmfPlusImages: decoded image key=0x${c.key.toString(16)}: ${decoded.width}x${decoded.height}`);
    }
  }
  return cache;
}
async function preDecodeMetafileCaches(view, depth = 0) {
  return {
    textures: await preDecodeEmfPlusTextures(view),
    images: await preDecodeEmfPlusImages(view, depth)
  };
}

// src/emf-gdi-palette.ts
var DEFAULT_PALETTE_ENTRIES = [
  0,
  8388608,
  32768,
  8421376,
  128,
  8388736,
  32896,
  12632256,
  12639424,
  10930928,
  16776176,
  10526884,
  8421504,
  16711680,
  65280,
  16776960,
  255,
  16711935,
  65535,
  16777215
];
function readRawColorRef(view, offset) {
  return view.getUint32(offset, true);
}
function isPaletteRelative(colorRef) {
  return colorRef >>> 24 !== 0;
}
function paletteEntries(state) {
  return state.palette?.entries ?? DEFAULT_PALETTE_ENTRIES;
}
function resolveColorRefRgb(colorRef, entries) {
  const flags = colorRef >>> 24;
  if (flags & 16) {
    return 0;
  }
  if (flags & 1) {
    const index = colorRef & 65535;
    return entries.length === 0 ? 0 : entries[index < entries.length ? index : 0];
  }
  return (colorRef & 255) << 16 | colorRef & 65280 | colorRef >>> 16 & 255;
}
function resolveColorRef(state, colorRef) {
  const rgb2 = resolveColorRefRgb(colorRef, paletteEntries(state));
  return colorRefToHex(rgb2 >> 16 & 255, rgb2 >> 8 & 255, rgb2 & 255);
}
function readStateColorRef(state, view, offset) {
  return resolveColorRef(state, readRawColorRef(view, offset));
}
function setColorRefSlot(state, slot, raw) {
  const next = { ...state.colorRefs };
  if (raw !== void 0 && isPaletteRelative(raw)) {
    next[slot] = raw;
  } else {
    delete next[slot];
  }
  state.colorRefs = next;
}
function refreshPaletteColors(state) {
  const refs = state.colorRefs;
  if (!refs) {
    return;
  }
  if (refs.pen !== void 0) {
    state.penColor = resolveColorRef(state, refs.pen);
  }
  if (refs.brush !== void 0) {
    state.brushColor = resolveColorRef(state, refs.brush);
  }
  if (refs.text !== void 0) {
    state.textColor = resolveColorRef(state, refs.text);
  }
  if (refs.bk !== void 0) {
    state.bkColor = resolveColorRef(state, refs.bk);
  }
}
function readEntries(view, offset, count) {
  const out = [];
  for (let i = 0; i < count && offset + i * 4 + 4 <= view.byteLength; i++) {
    const o = offset + i * 4;
    out.push(view.getUint8(o) << 16 | view.getUint8(o + 1) << 8 | view.getUint8(o + 2));
  }
  return out;
}
function paletteObject(rCtx, ihPal) {
  const obj = rCtx.objectTable.get(ihPal);
  return obj && obj.kind === "palette" ? obj : null;
}
function paletteEdited(rCtx, palette) {
  if (rCtx.state.palette === palette) {
    refreshPaletteColors(rCtx.state);
  }
}
function handleEmfPaletteRecord(rCtx, recType, dataOff, recSize) {
  const { view, state } = rCtx;
  switch (recType) {
    case EMR_CREATEPALETTE: {
      if (recSize >= 16) {
        const ihPal = view.getUint32(dataOff, true);
        const count = view.getUint16(dataOff + 6, true);
        rCtx.objectTable.set(ihPal, { kind: "palette", entries: readEntries(view, dataOff + 8, Math.min(count, (recSize - 16) / 4)) });
      }
      return true;
    }
    case EMR_SELECTPALETTE: {
      if (recSize >= 12) {
        const ihPal = view.getUint32(dataOff, true);
        if (ihPal === (STOCK_OBJECT_BASE | DEFAULT_PALETTE_STOCK_INDEX) >>> 0) {
          state.palette = null;
        } else {
          const palette = paletteObject(rCtx, ihPal);
          if (!palette) {
            return true;
          }
          state.palette = palette;
        }
        refreshPaletteColors(state);
      }
      return true;
    }
    case EMR_SETPALETTEENTRIES: {
      if (recSize >= 20) {
        const palette = paletteObject(rCtx, view.getUint32(dataOff, true));
        const start = view.getUint32(dataOff + 4, true);
        const count = view.getUint32(dataOff + 8, true);
        if (palette) {
          const entries = readEntries(view, dataOff + 12, Math.min(count, (recSize - 20) / 4));
          for (let i = 0; i < entries.length && start + i < palette.entries.length; i++) {
            palette.entries[start + i] = entries[i];
          }
          paletteEdited(rCtx, palette);
        }
      }
      return true;
    }
    case EMR_RESIZEPALETTE: {
      if (recSize >= 16) {
        const palette = paletteObject(rCtx, view.getUint32(dataOff, true));
        const count = Math.min(view.getUint32(dataOff + 4, true), 1024);
        if (palette) {
          palette.entries.length = Math.min(palette.entries.length, count);
          while (palette.entries.length < count) {
            palette.entries.push(0);
          }
          paletteEdited(rCtx, palette);
        }
      }
      return true;
    }
    case EMR_REALIZEPALETTE:
      return true;
    default:
      return false;
  }
}

// src/emf-gdi-coord.ts
function gmx(r, x) {
  const wt = r.state.worldTransform;
  const px = wt[0] * x + wt[4];
  if (r.useMappingMode) {
    const dx = (px - r.windowOrg.x) / (r.windowExt.cx || 1) * (r.viewportExt.cx || 1) + r.viewportOrg.x;
    return r.deviceToCanvas ? (dx - r.bounds.left) * r.sx : dx;
  }
  return (px - r.bounds.left) * r.sx;
}
function gmy(r, y) {
  const wt = r.state.worldTransform;
  const py = wt[3] * y + wt[5];
  if (r.useMappingMode) {
    const dy = (py - r.windowOrg.y) / (r.windowExt.cy || 1) * (r.viewportExt.cy || 1) + r.viewportOrg.y;
    return r.deviceToCanvas ? (dy - r.bounds.top) * r.sy : dy;
  }
  return (py - r.bounds.top) * r.sy;
}
function gmw(r, w) {
  const pw = r.state.worldTransform[0] * w;
  if (r.useMappingMode) {
    return pw / (r.windowExt.cx || 1) * (r.viewportExt.cx || 1) * (r.deviceToCanvas ? r.sx : 1);
  }
  return pw * r.sx;
}
function gmh(r, h) {
  const ph = r.state.worldTransform[3] * h;
  if (r.useMappingMode) {
    return ph / (r.windowExt.cy || 1) * (r.viewportExt.cy || 1) * (r.deviceToCanvas ? r.sy : 1);
  }
  return ph * r.sy;
}
function gdiDevicePixelX(r) {
  return !r.useMappingMode || r.deviceToCanvas ? r.sx : 1;
}
function gdiDevicePixelY(r) {
  return !r.useMappingMode || r.deviceToCanvas ? r.sy : 1;
}
function activateGdiMappingMode(r) {
  r.useMappingMode = true;
}
function hasWorldRotation(r) {
  const wt = r.state.worldTransform;
  return wt[1] !== 0 || wt[2] !== 0;
}
function gdiDeviceMatrix(r) {
  const wt = r.state.worldTransform;
  if (r.useMappingMode) {
    const kx = (r.viewportExt.cx || 1) / (r.windowExt.cx || 1);
    const ky = (r.viewportExt.cy || 1) / (r.windowExt.cy || 1);
    const [cx, cy, ox, oy] = r.deviceToCanvas ? [r.sx, r.sy, r.bounds.left, r.bounds.top] : [1, 1, 0, 0];
    return [
      wt[0] * kx * cx,
      wt[1] * ky * cy,
      wt[2] * kx * cx,
      wt[3] * ky * cy,
      ((wt[4] - r.windowOrg.x) * kx + r.viewportOrg.x - ox) * cx,
      ((wt[5] - r.windowOrg.y) * ky + r.viewportOrg.y - oy) * cy
    ];
  }
  const sx = r.sx || 1;
  const sy = r.sy || 1;
  return [wt[0] * sx, wt[1] * sy, wt[2] * sx, wt[3] * sy, (wt[4] - r.bounds.left) * sx, (wt[5] - r.bounds.top) * sy];
}
function gmapPoint(r, x, y) {
  const m = gdiDeviceMatrix(r);
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}
function gdiEllipseParams(r, cx0, cy0, rx0, ry0) {
  const m = gdiDeviceMatrix(r);
  const center = gmapPoint(r, cx0, cy0);
  const a11 = m[0] * rx0;
  const a12 = m[2] * ry0;
  const a21 = m[1] * rx0;
  const a22 = m[3] * ry0;
  const p = a11 * a11 + a12 * a12;
  const q = a11 * a21 + a12 * a22;
  const s = a21 * a21 + a22 * a22;
  const mid = (p + s) / 2;
  const spread = Math.sqrt(Math.max(0, ((p - s) / 2) ** 2 + q * q));
  const lambda1 = Math.max(0, mid + spread);
  const lambda2 = Math.max(0, mid - spread);
  const rotation = 0.5 * Math.atan2(2 * q, p - s);
  return {
    cx: center.x,
    cy: center.y,
    rx: Math.sqrt(lambda1),
    ry: Math.sqrt(lambda2),
    rotation
  };
}

// src/emf-gdi-path-record.ts
function replayGdiPathCmds(target, cmds) {
  for (const c of cmds) {
    switch (c.op) {
      case "moveTo":
        target.moveTo(c.x, c.y);
        break;
      case "lineTo":
        target.lineTo(c.x, c.y);
        break;
      case "rect":
        target.rect(c.x, c.y, c.w, c.h);
        break;
      case "bezierCurveTo":
        target.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y);
        break;
      case "arcTo":
        target.arcTo(c.x1, c.y1, c.x2, c.y2, c.radius);
        break;
      case "ellipse":
        target.ellipse(c.cx, c.cy, c.rx, c.ry, c.rotation, c.startAngle, c.endAngle, c.ccw);
        break;
      case "closePath":
        target.closePath();
        break;
    }
  }
}
function gdiPathRecorder(rCtx) {
  const { ctx, pathCmds } = rCtx;
  return new Proxy(ctx, {
    get(target, prop, receiver) {
      switch (prop) {
        case "moveTo":
          return (x, y) => {
            pathCmds.push({ op: "moveTo", x, y });
            return target.moveTo(x, y);
          };
        case "lineTo":
          return (x, y) => {
            pathCmds.push({ op: "lineTo", x, y });
            return target.lineTo(x, y);
          };
        case "rect":
          return (x, y, w, h) => {
            pathCmds.push({ op: "rect", x, y, w, h });
            return target.rect(x, y, w, h);
          };
        case "bezierCurveTo":
          return (cp1x, cp1y, cp2x, cp2y, x, y) => {
            pathCmds.push({ op: "bezierCurveTo", cp1x, cp1y, cp2x, cp2y, x, y });
            return target.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
          };
        case "arcTo":
          return (x1, y1, x2, y2, radius) => {
            pathCmds.push({ op: "arcTo", x1, y1, x2, y2, radius });
            return target.arcTo(x1, y1, x2, y2, radius);
          };
        case "ellipse":
          return (cx, cy, rx, ry, rotation, startAngle, endAngle, ccw) => {
            pathCmds.push({ op: "ellipse", cx, cy, rx, ry, rotation, startAngle, endAngle, ccw: !!ccw });
            return target.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, ccw);
          };
        case "closePath":
          return () => {
            pathCmds.push({ op: "closePath" });
            return target.closePath();
          };
        default: {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        }
      }
    }
  });
}

// src/emf-rop3.ts
function rop3Index(rop) {
  return rop >>> 16 & 255;
}
function rop3Operands(index) {
  const t = index & 255;
  return {
    usesP: (t >> 4 & 15) !== (t & 15),
    usesS: (t >> 2 & 51) !== (t & 51),
    usesD: (t >> 1 & 85) !== (t & 85)
  };
}
function evalRop3(index, p, s, d, mask = 16777215) {
  let out = 0;
  const np = ~p;
  const ns = ~s;
  const nd = ~d;
  for (let i = 0; i < 8; i++) {
    if (index & 1 << i) {
      out |= (i & 4 ? p : np) & (i & 2 ? s : ns) & (i & 1 ? d : nd);
    }
  }
  return out & mask;
}
function classifyRop3(rop) {
  const index = rop3Index(rop);
  switch (index) {
    case 204:
      return { kind: "copy" };
    case 0:
      return { kind: "solid", color: "black" };
    case 255:
      return { kind: "solid", color: "white" };
    case 170:
      return { kind: "noop" };
    case 85:
      return { kind: "invert-dest" };
    default:
      return { kind: "ternary", index, operands: rop3Operands(index) };
  }
}
function applyRop3(dst, src, pattern, index, originX, originY) {
  const d = dst.data;
  const s = src ? src.data : null;
  const w = dst.width;
  const h = dst.height;
  const solidP = typeof pattern === "number" ? pattern : 0;
  const sampleP = typeof pattern === "function" ? pattern : null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const dv = d[i] << 16 | d[i + 1] << 8 | d[i + 2];
      const sv = s ? s[i] << 16 | s[i + 1] << 8 | s[i + 2] : 0;
      const pv = sampleP ? sampleP(originX + x, originY + y) : solidP;
      const r = evalRop3(index, pv, sv, dv);
      d[i] = r >> 16 & 255;
      d[i + 1] = r >> 8 & 255;
      d[i + 2] = r & 255;
      d[i + 3] = 255;
    }
  }
}
function clampPositiveRect(x, y, w, h, canvasW, canvasH) {
  let left = w < 0 ? x + w : x;
  let top = h < 0 ? y + h : y;
  let width = Math.abs(w);
  let height = Math.abs(h);
  left = Math.round(left);
  top = Math.round(top);
  width = Math.round(width);
  height = Math.round(height);
  const right = Math.min(left + width, Math.round(canvasW));
  const bottom = Math.min(top + height, Math.round(canvasH));
  left = Math.max(left, 0);
  top = Math.max(top, 0);
  width = right - left;
  height = bottom - top;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { x: left, y: top, w: width, h: height };
}

// src/svg-context.ts
var IDENTITY = [1, 0, 0, 1, 0, 0];
function mul(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5]
  ];
}
function inv(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!det || !Number.isFinite(det)) {
    return null;
  }
  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det
  ];
}
function isIdentity(m) {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}
function fmt(n) {
  if (!Number.isFinite(n)) {
    return "0";
  }
  const r = Math.round(n * 1e3) / 1e3;
  return Object.is(r, -0) ? "0" : String(r);
}
function matrixAttr(m) {
  return `matrix(${m.map(fmt).join(" ")})`;
}
function hex2(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}
function parseCssColor(input) {
  const s = input.trim();
  if (s === "transparent") {
    return { color: "#000000", alpha: 0 };
  }
  const m = /^rgba?\(([^)]*)\)$/i.exec(s);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const ch = (v) => v === void 0 ? 0 : v.endsWith("%") ? parseFloat(v) * 255 / 100 : parseFloat(v);
    const a = parts.length > 3 ? parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]) : 1;
    return {
      color: `#${hex2(ch(parts[0]))}${hex2(ch(parts[1]))}${hex2(ch(parts[2]))}`,
      alpha: Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : 1
    };
  }
  const h8 = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(s);
  if (h8) {
    return { color: `#${h8[1].toLowerCase()}`, alpha: parseInt(h8[2], 16) / 255 };
  }
  return { color: s.toLowerCase(), alpha: 1 };
}
function getWidthHeight(source) {
  const s = source;
  const w = typeof s.naturalWidth === "number" && s.naturalWidth > 0 ? s.naturalWidth : s.width;
  const h = typeof s.naturalHeight === "number" && s.naturalHeight > 0 ? s.naturalHeight : s.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}
function snapshotSource(source) {
  if (source instanceof SvgImageSource) {
    return source.payload;
  }
  if (source instanceof SoftwareRasterCanvas) {
    return { kind: "rgba", data: source.pixels, width: source.width, height: source.height };
  }
  const size = getWidthHeight(source);
  if (!size) {
    return null;
  }
  const holder = source;
  if (holder.data instanceof Uint8ClampedArray) {
    return { kind: "rgba", data: holder.data.slice(), width: size.w, height: size.h };
  }
  try {
    if (typeof holder.getContext === "function") {
      const ctx = holder.getContext("2d");
      if (ctx && typeof ctx.getImageData === "function") {
        const img = canvasGetImageData(ctx, 0, 0, size.w, size.h);
        return { kind: "rgba", data: img.data.slice(), width: size.w, height: size.h };
      }
    }
    const temp = createTempCanvas(size.w, size.h);
    if (temp && !isSoftwareRaster(temp.canvas)) {
      canvasDrawImage(temp.ctx, source, 0, 0, size.w, size.h);
      const img = canvasGetImageData(temp.ctx, 0, 0, size.w, size.h);
      return { kind: "rgba", data: img.data.slice(), width: size.w, height: size.h };
    }
  } catch {
  }
  return null;
}
function cropPayload(p, sx, sy, sw, sh) {
  if (p.kind !== "rgba") {
    return p;
  }
  const x0 = Math.max(0, Math.floor(Math.min(sx, sx + sw)));
  const y0 = Math.max(0, Math.floor(Math.min(sy, sy + sh)));
  const x1 = Math.min(p.width, Math.ceil(Math.max(sx, sx + sw)));
  const y1 = Math.min(p.height, Math.ceil(Math.max(sy, sy + sh)));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) {
    return null;
  }
  if (x0 === 0 && y0 === 0 && w === p.width && h === p.height) {
    return p;
  }
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    out.set(p.data.subarray(((y0 + y) * p.width + x0) * 4, ((y0 + y) * p.width + x0 + w) * 4), y * w * 4);
  }
  return { kind: "rgba", data: out, width: w, height: h };
}
var SvgImageSource = class {
  constructor(payload, width, height) {
    this.payload = payload;
    this.width = width;
    this.height = height;
  }
};
var paintUid = 0;
var SvgGradient = class {
  constructor(type, coords, real) {
    this.type = type;
    this.coords = coords;
    this.real = real;
    this.uid = ++paintUid;
    this.stops = [];
  }
  addColorStop(offset, color) {
    if (!(offset >= 0 && offset <= 1)) {
      throw new RangeError("Gradient stop offset out of range");
    }
    this.stops.push({ offset, color });
    this.real?.addColorStop(offset, color);
  }
};
var SvgPattern = class {
  constructor(payload, width, height, repetition, real, pixelated) {
    this.payload = payload;
    this.width = width;
    this.height = height;
    this.repetition = repetition;
    this.real = real;
    this.pixelated = pixelated;
    this.uid = ++paintUid;
    this.matrix = [...IDENTITY];
  }
  setTransform(m) {
    this.matrix = [m?.a ?? 1, m?.b ?? 0, m?.c ?? 0, m?.d ?? 1, m?.e ?? 0, m?.f ?? 0];
    try {
      this.real?.setTransform(m);
    } catch {
    }
  }
};
function pathData(segs2, m, decimals = 2) {
  const q = 10 ** decimals;
  let out = "";
  let lastCmd = "";
  let prevNum = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  const quant = (x, y) => {
    const px = m ? m[0] * x + m[2] * y + m[4] : x;
    const py = m ? m[1] * x + m[3] * y + m[5] : y;
    return [Math.round(px * q), Math.round(py * q)];
  };
  const num = (v) => {
    let t = (v / q).toFixed(decimals);
    if (t.includes(".")) {
      t = t.replace(/0+$/, "").replace(/\.$/, "");
    }
    t = t.replace(/^(-?)0\./, "$1.");
    if (t === "-0") {
      t = "0";
    }
    if (prevNum && !(t[0] === "-" || t[0] === "." && prevNum.includes("."))) {
      out += " ";
    }
    out += t;
    prevNum = t;
  };
  const cmd = (c) => {
    if (c !== lastCmd || c === "m") {
      out += c;
      lastCmd = c;
      prevNum = "";
    }
  };
  for (const s of segs2) {
    switch (s.t) {
      case "M": {
        const [x, y] = quant(s.x, s.y);
        if (out === "") {
          out += "M";
          prevNum = "";
          num(x);
          num(y);
          lastCmd = "M";
        } else {
          cmd("m");
          num(x - cx);
          num(y - cy);
          lastCmd = "l";
        }
        cx = sx = x;
        cy = sy = y;
        break;
      }
      case "L": {
        const [x, y] = quant(s.x, s.y);
        cmd("l");
        num(x - cx);
        num(y - cy);
        cx = x;
        cy = y;
        break;
      }
      case "C": {
        const [x1, y1] = quant(s.x1, s.y1);
        const [x2, y2] = quant(s.x2, s.y2);
        const [x, y] = quant(s.x, s.y);
        cmd("c");
        num(x1 - cx);
        num(y1 - cy);
        num(x2 - cx);
        num(y2 - cy);
        num(x - cx);
        num(y - cy);
        cx = x;
        cy = y;
        break;
      }
      case "Z":
        out += "z";
        lastCmd = "z";
        prevNum = "";
        cx = sx;
        cy = sy;
        break;
    }
  }
  return out;
}
function userSpaceDecimals(m) {
  const scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
  return Math.max(2, Math.min(8, Math.ceil(2 + Math.log10(scale))));
}
var BLEND_MODES = /* @__PURE__ */ new Set([
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity"
]);
var SvgContext = class {
  constructor(width, height, options = {}) {
    this.nextId = 0;
    this.stack = [];
    /** The current path, in DEVICE space (see `canvas-path.ts`). */
    this.pb = new PathBuilder();
    this.defs = [];
    this.defKeys = /* @__PURE__ */ new Map();
    this.body = [];
    this.group = null;
    this.images = [];
    this.canvas = { width, height, svgContext: this };
    this.shadow = options.shadow ?? null;
    this.imageResampling = options.imageResampling ?? "renderer";
    this.idPrefix = options.idPrefix ?? "emf-";
    this.state = {
      transform: [...IDENTITY],
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      lineDash: [],
      lineDashOffset: 0,
      lineCap: "butt",
      lineJoin: "miter",
      miterLimit: 10,
      globalAlpha: 1,
      gco: "source-over",
      font: "10px sans-serif",
      textAlign: "start",
      textBaseline: "alphabetic",
      imageSmoothingEnabled: true,
      clipId: null
    };
  }
  /** True when `getImageData` returns the real destination (a shadow canvas exists). */
  get canReadPixels() {
    return this.shadow !== null;
  }
  /** The shadow when it is the pure-JavaScript rasteriser (`software-raster.ts`). */
  get softShadow() {
    return this.shadow instanceof SoftwareRasterContext ? this.shadow : null;
  }
  /** True when the shadow can draw (or make a pattern from) `image` directly. */
  shadowAccepts(image) {
    if (image instanceof SvgImageSource) {
      return false;
    }
    return this.softShadow !== null || !isSoftwareRaster(image);
  }
  /**
   * Flags (1 = unknown) for the device rectangle's pixels whose true value
   * the shadow does not know, or `null` when it knows them all. Only the
   * pure-JavaScript shadow has unknown pixels: it cannot rasterise glyphs,
   * so text (and deferred EMF+ images) leave their area unknown until
   * something opaque is painted over it (see `software-raster.ts`).
   */
  unknownPixels(x, y, w, h) {
    const soft = this.softShadow;
    return soft ? soft.canvas.unknownIn(x, y, w, h) : null;
  }
  /**
   * Composites a device-space RGBA patch (straight alpha, `w` x `h` at
   * `x`, `y`, identity transform) with a blend mode, as an `<image>` with
   * `mix-blend-mode`, so the SVG renderer blends it with whatever is
   * really underneath (glyphs included). The active clip is applied to the
   * patch's own pixels, from the shadow's clip coverage, and the patch is
   * emitted OUTSIDE any clip group: a `clip-path` group may be rendered as
   * an isolated layer, which would blend the patch with nothing. The
   * shadow receives the same draw.
   */
  blendPatch(rgba, x, y, w, h, mode) {
    const soft = this.softShadow;
    const data = rgba.slice();
    if (soft) {
      const cov = soft.clipCoverage(x, y, w, h);
      if (cov) {
        for (let i = 0; i < w * h; i++) {
          data[i * 4 + 3] = data[i * 4 + 3] * cov[i] / 255;
        }
      }
      soft.save();
      soft.setTransform(1, 0, 0, 1, 0, 0);
      soft.globalAlpha = 1;
      soft.globalCompositeOperation = mode;
      soft.imageSmoothingEnabled = false;
      soft.drawImage({ data: rgba, width: w, height: h }, x, y);
      soft.restore();
    }
    const node = this.imageNode({ kind: "rgba", data, width: w, height: h }, x, y, w, h, true);
    if (BLEND_MODES.has(mode)) {
      node.attrs.style = `${node.attrs.style};mix-blend-mode:${mode}`;
    }
    this.body.push(node);
    this.group = null;
  }
  id(kind) {
    return `${this.idPrefix}${kind}${this.nextId++}`;
  }
  // ---- state properties --------------------------------------------------
  get fillStyle() {
    return this.state.fillStyle;
  }
  set fillStyle(v) {
    if (typeof v === "string" || v instanceof SvgGradient || v instanceof SvgPattern) {
      this.state.fillStyle = v;
      this.forwardPaint("fillStyle", v);
    }
  }
  get strokeStyle() {
    return this.state.strokeStyle;
  }
  set strokeStyle(v) {
    if (typeof v === "string" || v instanceof SvgGradient || v instanceof SvgPattern) {
      this.state.strokeStyle = v;
      this.forwardPaint("strokeStyle", v);
    }
  }
  forwardPaint(key, v) {
    if (!this.shadow) {
      return;
    }
    const real = typeof v === "string" ? v : v.real;
    if (real) {
      this.shadow[key] = real;
    }
  }
  get lineWidth() {
    return this.state.lineWidth;
  }
  set lineWidth(v) {
    if (Number.isFinite(v) && v > 0) {
      this.state.lineWidth = v;
      if (this.shadow) {
        this.shadow.lineWidth = v;
      }
    }
  }
  get lineCap() {
    return this.state.lineCap;
  }
  set lineCap(v) {
    this.state.lineCap = v;
    if (this.shadow) {
      this.shadow.lineCap = v;
    }
  }
  get lineJoin() {
    return this.state.lineJoin;
  }
  set lineJoin(v) {
    this.state.lineJoin = v;
    if (this.shadow) {
      this.shadow.lineJoin = v;
    }
  }
  get miterLimit() {
    return this.state.miterLimit;
  }
  set miterLimit(v) {
    if (Number.isFinite(v) && v > 0) {
      this.state.miterLimit = v;
      if (this.shadow) {
        this.shadow.miterLimit = v;
      }
    }
  }
  get lineDashOffset() {
    return this.state.lineDashOffset;
  }
  set lineDashOffset(v) {
    if (Number.isFinite(v)) {
      this.state.lineDashOffset = v;
      if (this.shadow) {
        this.shadow.lineDashOffset = v;
      }
    }
  }
  get globalAlpha() {
    return this.state.globalAlpha;
  }
  set globalAlpha(v) {
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      this.state.globalAlpha = v;
      if (this.shadow) {
        this.shadow.globalAlpha = v;
      }
    }
  }
  get globalCompositeOperation() {
    return this.state.gco;
  }
  set globalCompositeOperation(v) {
    this.state.gco = v;
    if (this.shadow) {
      this.shadow.globalCompositeOperation = v;
    }
  }
  get font() {
    return this.state.font;
  }
  set font(v) {
    this.state.font = v;
    if (this.shadow) {
      this.shadow.font = v;
    }
  }
  get textAlign() {
    return this.state.textAlign;
  }
  set textAlign(v) {
    this.state.textAlign = v;
    if (this.shadow) {
      this.shadow.textAlign = v;
    }
  }
  get textBaseline() {
    return this.state.textBaseline;
  }
  set textBaseline(v) {
    this.state.textBaseline = v;
    if (this.shadow) {
      this.shadow.textBaseline = v;
    }
  }
  get imageSmoothingEnabled() {
    return this.state.imageSmoothingEnabled;
  }
  set imageSmoothingEnabled(v) {
    this.state.imageSmoothingEnabled = v;
    if (this.shadow) {
      this.shadow.imageSmoothingEnabled = v;
    }
  }
  setLineDash(segments) {
    if (!Array.isArray(segments) || segments.some((s) => !Number.isFinite(s) || s < 0)) {
      return;
    }
    this.state.lineDash = segments.length % 2 ? [...segments, ...segments] : [...segments];
    this.shadow?.setLineDash(segments);
  }
  getLineDash() {
    return [...this.state.lineDash];
  }
  // ---- state stack & transforms -----------------------------------------
  save() {
    this.stack.push({
      ...this.state,
      transform: [...this.state.transform],
      lineDash: [...this.state.lineDash]
    });
    this.shadow?.save();
  }
  restore() {
    const s = this.stack.pop();
    if (s) {
      this.state = s;
    }
    this.shadow?.restore();
  }
  getTransform() {
    const [a, b, c, d, e, f] = this.state.transform;
    return { a, b, c, d, e, f };
  }
  setTransform(a, b, c, d, e, f) {
    if ([a, b, c, d, e, f].every(Number.isFinite)) {
      this.state.transform = [a, b, c, d, e, f];
    }
    this.shadow?.setTransform(a, b, c, d, e, f);
  }
  resetTransform() {
    this.setTransform(1, 0, 0, 1, 0, 0);
  }
  transform(a, b, c, d, e, f) {
    if ([a, b, c, d, e, f].every(Number.isFinite)) {
      this.state.transform = mul(this.state.transform, [a, b, c, d, e, f]);
    }
    this.shadow?.transform(a, b, c, d, e, f);
  }
  translate(x, y) {
    this.transform(1, 0, 0, 1, x, y);
  }
  scale(x, y) {
    this.transform(x, 0, 0, y, 0, 0);
  }
  rotate(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    this.transform(c, s, -s, c, 0, 0);
  }
  // ---- path construction -----------------------------------------------
  get path() {
    return this.pb.segs;
  }
  map(x, y) {
    const m = this.state.transform;
    return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
  }
  beginPath() {
    this.pb.reset();
    this.shadow?.beginPath();
  }
  moveTo(x, y) {
    this.pb.moveTo(this.state.transform, x, y);
    this.shadow?.moveTo(x, y);
  }
  lineTo(x, y) {
    this.pb.lineTo(this.state.transform, x, y);
    this.shadow?.lineTo(x, y);
  }
  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this.pb.bezierCurveTo(this.state.transform, x1, y1, x2, y2, x, y);
    this.shadow?.bezierCurveTo(x1, y1, x2, y2, x, y);
  }
  quadraticCurveTo(cx, cy, x, y) {
    this.pb.quadraticCurveTo(this.state.transform, cx, cy, x, y);
    this.shadow?.quadraticCurveTo(cx, cy, x, y);
  }
  closePath() {
    this.pb.closePath();
    this.shadow?.closePath();
  }
  rect(x, y, w, h) {
    this.pb.rect(this.state.transform, x, y, w, h);
    this.shadow?.rect(x, y, w, h);
  }
  ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise = false) {
    this.pb.ellipse(this.state.transform, x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise);
    this.shadow?.ellipse(x, y, rx, ry, rotation, startAngle, endAngle, counterclockwise);
  }
  arc(x, y, r, startAngle, endAngle, counterclockwise = false) {
    this.pb.arc(this.state.transform, x, y, r, startAngle, endAngle, counterclockwise);
    this.shadow?.arc(x, y, r, startAngle, endAngle, counterclockwise);
  }
  arcTo(x1, y1, x2, y2, r) {
    this.shadow?.arcTo(x1, y1, x2, y2, r);
    this.pb.arcTo(this.state.transform, x1, y1, x2, y2, r);
  }
  isPointInPath(x, y, fillRule = "nonzero") {
    if (this.shadow && typeof this.shadow.isPointInPath === "function") {
      return this.shadow.isPointInPath(x, y, fillRule);
    }
    return pointInPolylines(flattenPath(this.path, 0.05), x, y, fillRule);
  }
  // ---- emission --------------------------------------------------------
  /** Appends a drawn element to the body, inside a group for the active clip. */
  emit(node) {
    const clipId = this.state.clipId;
    if (!clipId) {
      this.body.push(node);
      this.group = null;
      return;
    }
    if (!this.group || this.group.clipId !== clipId || this.body[this.body.length - 1] !== this.group.node) {
      this.group = { node: { tag: "g", attrs: { "clip-path": `url(#${clipId})` }, children: [] }, clipId };
      this.body.push(this.group.node);
    }
    this.group.node.children.push(node);
  }
  blendStyle(attrs) {
    if (BLEND_MODES.has(this.state.gco)) {
      attrs.style = `mix-blend-mode:${this.state.gco}`;
    }
  }
  define(key, kind, build) {
    const existing = this.defKeys.get(key);
    if (existing) {
      return existing;
    }
    const id = this.id(kind);
    this.defKeys.set(key, id);
    this.defs.push(build(id));
    return id;
  }
  /** Resolves a paint to an SVG paint + opacity, in the user space `space`. */
  resolvePaint(paint, space) {
    const alpha = this.state.globalAlpha;
    if (typeof paint === "string") {
      const c = parseCssColor(paint);
      const opacity = c.alpha * alpha;
      return opacity <= 0 ? null : { value: c.color, opacity };
    }
    if (alpha <= 0) {
      return null;
    }
    if (paint instanceof SvgGradient) {
      if (paint.stops.length === 0) {
        return null;
      }
      const key2 = `g${paint.uid}:${paint.stops.length}:${space.join(",")}`;
      const id2 = this.define(key2, "g", (gid) => this.gradientNode(paint, gid, space));
      return { value: `url(#${id2})`, opacity: alpha };
    }
    const key = `p${paint.uid}:${paint.matrix.join(",")}:${space.join(",")}`;
    const id = this.define(key, "p", (pid) => this.patternNode(paint, pid, space));
    return { value: `url(#${id})`, opacity: alpha };
  }
  gradientNode(g, id, space) {
    const c = g.coords;
    const attrs = g.type === "linear" ? { id, gradientUnits: "userSpaceOnUse", x1: fmt(c[0]), y1: fmt(c[1]), x2: fmt(c[2]), y2: fmt(c[3]) } : {
      id,
      gradientUnits: "userSpaceOnUse",
      fx: fmt(c[0]),
      fy: fmt(c[1]),
      fr: fmt(c[2]),
      cx: fmt(c[3]),
      cy: fmt(c[4]),
      r: fmt(c[5])
    };
    if (!isIdentity(space)) {
      attrs.gradientTransform = matrixAttr(space);
    }
    const sorted = [...g.stops].map((s, i) => ({ ...s, i })).sort((a, b) => a.offset - b.offset || a.i - b.i);
    const offsets = sorted.map((s) => s.offset);
    if (g.type === "linear") {
      const dx = space[0] * (c[2] - c[0]) + space[2] * (c[3] - c[1]);
      const dy = space[1] * (c[2] - c[0]) + space[3] * (c[3] - c[1]);
      const x0 = space[0] * c[0] + space[2] * c[1] + space[4];
      const y0 = space[1] * c[0] + space[3] * c[1] + space[5];
      const lengthPx = Math.hypot(dx, dy);
      const horizontal = lengthPx > 0 && Math.abs(dy) < 1e-9 * lengthPx;
      const vertical = lengthPx > 0 && Math.abs(dx) < 1e-9 * lengthPx;
      if (horizontal || vertical) {
        const start = horizontal ? x0 : y0;
        const span = horizontal ? dx : dy;
        for (let k = 1; k < sorted.length; k++) {
          const at = sorted[k].offset;
          if (Math.abs(at - sorted[k - 1].offset) > 1e-9 || at <= 0 || at >= 1) {
            continue;
          }
          const seam = start + at * span;
          const centre = Math.round(seam - 0.5) + 0.5;
          const d = seam - centre;
          if (Math.abs(d) >= 0.1) {
            continue;
          }
          const centreBefore = span > 0 ? d >= 0 : d < 0;
          const moved = (centre + (centreBefore === span > 0 ? 0.25 : -0.25) - start) / span;
          const prev = k >= 2 ? offsets[k - 2] : 0;
          const next = k + 1 < sorted.length ? sorted[k + 1].offset : 1;
          const clamped = Math.min(Math.max(moved, prev), next);
          offsets[k - 1] = clamped;
          offsets[k] = clamped;
        }
      }
    }
    const stops = sorted.map((s, k) => {
      const col = parseCssColor(s.color);
      const sa = { offset: String(Math.round(offsets[k] * 1e6) / 1e6), "stop-color": col.color };
      if (col.alpha < 1) {
        sa["stop-opacity"] = fmt(col.alpha);
      }
      return { tag: "stop", attrs: sa };
    });
    return { tag: g.type === "linear" ? "linearGradient" : "radialGradient", attrs, children: stops };
  }
  patternNode(p, id, space) {
    const m = mul(space, p.matrix);
    let spanU = p.width;
    let spanV = p.height;
    const im = inv(m);
    if (im) {
      const { width: cw, height: ch } = this.canvas;
      for (const [x, y] of [
        [0, 0],
        [cw, 0],
        [0, ch],
        [cw, ch]
      ]) {
        spanU = Math.max(spanU, Math.abs(im[0] * x + im[2] * y + im[4]));
        spanV = Math.max(spanV, Math.abs(im[1] * x + im[3] * y + im[5]));
      }
    }
    const tw = p.repetition === "repeat" || p.repetition === "repeat-x" ? p.width : Math.ceil(2 * (spanU + p.width) + 1);
    const th = p.repetition === "repeat" || p.repetition === "repeat-y" ? p.height : Math.ceil(2 * (spanV + p.height) + 1);
    const attrs = {
      id,
      patternUnits: "userSpaceOnUse",
      width: fmt(tw),
      height: fmt(th)
    };
    if (!isIdentity(m)) {
      attrs.patternTransform = matrixAttr(m);
    }
    const image = this.imageNode(p.payload, 0, 0, p.width, p.height, p.pixelated);
    return { tag: "pattern", attrs, children: [image] };
  }
  imageNode(payload, x, y, w, h, pixelated) {
    const attrs = {
      x: fmt(x),
      y: fmt(y),
      width: fmt(w),
      height: fmt(h),
      preserveAspectRatio: "none"
    };
    if (pixelated) {
      attrs["image-rendering"] = "optimizeSpeed";
      attrs.style = "image-rendering:pixelated";
    }
    const node = { tag: "image", attrs };
    this.images.push({ node, payload });
    return node;
  }
  fillPath(segs2, fillRule) {
    if (segs2.length === 0) {
      return;
    }
    const paint = this.resolvePaint(this.state.fillStyle, this.state.transform);
    if (!paint) {
      return;
    }
    const attrs = { d: pathData(segs2, null), fill: paint.value };
    if (paint.opacity < 1) {
      attrs["fill-opacity"] = fmt(paint.opacity);
    }
    if (fillRule === "evenodd") {
      attrs["fill-rule"] = "evenodd";
    }
    this.blendStyle(attrs);
    this.emit({ tag: "path", attrs });
  }
  strokePath(segs2) {
    if (segs2.length === 0) {
      return;
    }
    const m = this.state.transform;
    const i = inv(m);
    if (!i) {
      return;
    }
    const paint = this.resolvePaint(this.state.strokeStyle, IDENTITY);
    if (!paint) {
      return;
    }
    const s = this.state;
    const attrs = {
      d: pathData(segs2, isIdentity(m) ? null : i, isIdentity(m) ? 2 : userSpaceDecimals(m)),
      fill: "none",
      stroke: paint.value
    };
    if (paint.opacity < 1) {
      attrs["stroke-opacity"] = fmt(paint.opacity);
    }
    if (s.lineWidth !== 1) {
      attrs["stroke-width"] = fmt(s.lineWidth);
    }
    if (s.lineCap !== "butt") {
      attrs["stroke-linecap"] = s.lineCap;
    }
    if (s.lineJoin !== "miter") {
      attrs["stroke-linejoin"] = s.lineJoin;
    } else {
      attrs["stroke-miterlimit"] = fmt(s.miterLimit);
    }
    if (s.lineDash.length) {
      attrs["stroke-dasharray"] = s.lineDash.map(fmt).join(" ");
      if (s.lineDashOffset) {
        attrs["stroke-dashoffset"] = fmt(s.lineDashOffset);
      }
    }
    if (!isIdentity(m)) {
      attrs.transform = matrixAttr(m);
    }
    this.blendStyle(attrs);
    this.emit({ tag: "path", attrs });
  }
  fill(fillRule = "nonzero") {
    this.fillPath(this.path, fillRule);
    this.shadow?.fill(fillRule);
  }
  stroke() {
    this.strokePath(this.path);
    this.shadow?.stroke();
  }
  rectSegs(x, y, w, h) {
    const p = [this.map(x, y), this.map(x + w, y), this.map(x + w, y + h), this.map(x, y + h)];
    return [
      { t: "M", x: p[0].x, y: p[0].y },
      { t: "L", x: p[1].x, y: p[1].y },
      { t: "L", x: p[2].x, y: p[2].y },
      { t: "L", x: p[3].x, y: p[3].y },
      { t: "Z" }
    ];
  }
  fillRect(x, y, w, h) {
    if ([x, y, w, h].every(Number.isFinite) && w !== 0 && h !== 0) {
      this.fillPath(this.rectSegs(x, y, w, h), "nonzero");
    }
    this.shadow?.fillRect(x, y, w, h);
  }
  strokeRect(x, y, w, h) {
    if ([x, y, w, h].every(Number.isFinite)) {
      this.strokePath(this.rectSegs(x, y, w, h));
    }
    this.shadow?.strokeRect(x, y, w, h);
  }
  clearRect(x, y, w, h) {
    this.shadow?.clearRect(x, y, w, h);
  }
  clip(fillRule = "nonzero") {
    const parent = this.state.clipId;
    const id = this.id("c");
    const attrs = { id };
    if (parent) {
      attrs["clip-path"] = `url(#${parent})`;
    }
    const pathAttrs = { d: pathData(this.path, null) || "M0 0" };
    if (fillRule === "evenodd") {
      pathAttrs["clip-rule"] = "evenodd";
    }
    this.defs.push({ tag: "clipPath", attrs, children: [{ tag: "path", attrs: pathAttrs }] });
    this.state.clipId = id;
    this.shadow?.clip(fillRule);
  }
  // ---- gradients & patterns -------------------------------------------
  createLinearGradient(x0, y0, x1, y1) {
    const real = this.shadow ? this.shadow.createLinearGradient(x0, y0, x1, y1) : null;
    return new SvgGradient("linear", [x0, y0, x1, y1], real);
  }
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    const real = this.shadow ? this.shadow.createRadialGradient(x0, y0, r0, x1, y1, r1) : null;
    return new SvgGradient("radial", [x0, y0, r0, x1, y1, r1], real);
  }
  createPattern(image, repetition) {
    const payload = snapshotSource(image);
    const size = getWidthHeight(image);
    if (!payload || !size) {
      return null;
    }
    let real = null;
    if (this.shadow && this.shadowAccepts(image)) {
      try {
        real = this.shadow.createPattern.call(
          this.shadow,
          image,
          repetition ?? "repeat"
        );
      } catch {
        real = null;
      }
    }
    return new SvgPattern(payload, size.w, size.h, repetition || "repeat", real, !this.state.imageSmoothingEnabled);
  }
  /**
   * Fills the current path with a repeating tile whose texel (0,0) sits at
   * device (`originX`, `originY`) and each texel spans `cellW`×`cellH`
   * device pixels, rendered without filtering. This is how a GDI hatch/
   * mono/DIB pattern brush fill is expressed natively in SVG (where the
   * raster path instead writes every covered pixel).
   */
  fillWithTile(tile, originX, originY, cellW, cellH, fillRule) {
    const pattern = new SvgPattern(
      { kind: "rgba", data: tile.rgba, width: tile.width, height: tile.height },
      tile.width,
      tile.height,
      "repeat",
      null,
      true
    );
    pattern.matrix = [cellW, 0, 0, cellH, originX, originY];
    const saved = this.state.fillStyle;
    const savedT = this.state.transform;
    this.state.fillStyle = pattern;
    this.state.transform = [...IDENTITY];
    this.fillPath(this.path, fillRule);
    this.state.fillStyle = saved;
    this.state.transform = savedT;
    if (this.softShadow) {
      const temp = new SoftwareRasterCanvas(tile.width, tile.height);
      temp.ctx.putImageData({ data: tile.rgba, width: tile.width, height: tile.height }, 0, 0);
      const real = this.softShadow.createPattern(temp, "repeat");
      if (real) {
        real.setTransform({ a: cellW, b: 0, c: 0, d: cellH, e: originX, f: originY });
        const s = this.softShadow;
        s.save();
        s.setTransform(1, 0, 0, 1, 0, 0);
        s.imageSmoothingEnabled = false;
        s.fillStyle = real;
        s.fill(fillRule);
        s.restore();
      }
    } else if (this.shadow) {
      const temp = createTempCanvas(tile.width, tile.height);
      if (temp && !isSoftwareRaster(temp.canvas)) {
        canvasPutImageData(temp.ctx, createImageDataCompat(tile.rgba, tile.width, tile.height), 0, 0);
        const real = this.shadow.createPattern.call(
          this.shadow,
          temp.canvas,
          "repeat"
        );
        if (real) {
          real.setTransform({ a: cellW, b: 0, c: 0, d: cellH, e: originX, f: originY });
          this.shadow.save();
          this.shadow.setTransform(1, 0, 0, 1, 0, 0);
          this.shadow.fillStyle = real;
          this.shadow.fill(fillRule);
          this.shadow.restore();
        }
      }
    }
  }
  // ---- text ---------------------------------------------------------------
  measureText(text) {
    const size = parseFont(this.state.font).size;
    return { width: estimateTextWidth(text, size) };
  }
  fillText(text, x, y, maxWidth) {
    this.shadow?.fillText(text, x, y, maxWidth);
    if (!text || ![x, y].every(Number.isFinite)) {
      return;
    }
    const paint = this.resolvePaint(this.state.fillStyle, IDENTITY);
    if (!paint) {
      return;
    }
    const font = parseFont(this.state.font);
    const attrs = { x: fmt(x), y: fmt(y) };
    const m = this.state.transform;
    if (!isIdentity(m)) {
      attrs.transform = matrixAttr(m);
    }
    attrs["font-family"] = font.family;
    attrs["font-size"] = fmt(font.size);
    if (font.weight) {
      attrs["font-weight"] = font.weight;
    }
    if (font.style) {
      attrs["font-style"] = font.style;
    }
    const anchor = { center: "middle", right: "end", end: "end" }[this.state.textAlign];
    if (anchor) {
      attrs["text-anchor"] = anchor;
    }
    const baseline = {
      top: "text-before-edge",
      hanging: "hanging",
      middle: "central",
      bottom: "text-after-edge",
      ideographic: "ideographic"
    }[this.state.textBaseline];
    if (baseline) {
      attrs["dominant-baseline"] = baseline;
    }
    attrs.fill = paint.value;
    if (paint.opacity < 1) {
      attrs["fill-opacity"] = fmt(paint.opacity);
    }
    if (maxWidth !== void 0 && Number.isFinite(maxWidth) && maxWidth > 0) {
      const w = this.measureText(text).width;
      if (w > maxWidth) {
        attrs.textLength = fmt(maxWidth);
        attrs.lengthAdjust = "spacingAndGlyphs";
      }
    }
    if (/^\s|\s$|\s\s/.test(text)) {
      attrs["xml:space"] = "preserve";
    }
    this.blendStyle(attrs);
    this.emit({ tag: "text", attrs, text });
  }
  /**
   * Emits one GDI text run as a single `<text>` whose glyphs sit at the
   * exact per-glyph positions GDI would use (`x`/`y` lists, one entry per
   * UTF-16 code unit), in device space or, for a rotated run, in the run's
   * own frame under `matrix`. `fontSize` is the realised em height in
   * pixels; `scaleX` stretches it horizontally (LOGFONT `lfWidth`).
   * `aliased` asks the viewer for non-antialiased text rendering
   * (`text-rendering="optimizeSpeed"`), the closest SVG has to GDI's
   * NONANTIALIASED_QUALITY. Does not touch the shadow canvas (the caller
   * paints its exact raster there).
   */
  fillGlyphRun(run) {
    if (!run.text || run.xs.length === 0) {
      return;
    }
    const paint = this.resolvePaint(run.fill, IDENTITY);
    if (!paint) {
      return;
    }
    const attrs = {
      x: run.xs.map(fmt).join(" "),
      y: run.ys.every((v) => v === run.ys[0]) ? fmt(run.ys[0]) : run.ys.map(fmt).join(" ")
    };
    let m = run.matrix ? [...run.matrix] : null;
    if (run.scaleX && run.scaleX !== 1) {
      const s = [run.scaleX, 0, 0, 1, 0, 0];
      m = m ? mul(m, s) : s;
      attrs.x = run.xs.map((v) => fmt(v / run.scaleX)).join(" ");
    }
    if (m && !isIdentity(m)) {
      attrs.transform = matrixAttr(m);
    }
    attrs["font-family"] = run.fontFamily;
    attrs["font-size"] = fmt(run.fontSize);
    if (run.fontWeight && run.fontWeight !== 400) {
      attrs["font-weight"] = String(run.fontWeight);
    }
    if (run.italic) {
      attrs["font-style"] = "italic";
    }
    if (run.aliased) {
      attrs["text-rendering"] = "optimizeSpeed";
    }
    attrs.fill = paint.value;
    if (paint.opacity < 1) {
      attrs["fill-opacity"] = fmt(paint.opacity);
    }
    attrs["xml:space"] = "preserve";
    this.blendStyle(attrs);
    this.emit({ tag: "text", attrs, text: run.text });
  }
  // ---- images & pixels -------------------------------------------------
  drawImage(image, ...args) {
    if (this.softShadow) {
      const source = image instanceof SvgImageSource ? image.payload.kind === "rgba" ? { data: image.payload.data, width: image.payload.width, height: image.payload.height } : null : image;
      if (source) {
        this.softShadow.drawImage(source, ...args);
      }
    } else if (this.shadow && this.shadowAccepts(image)) {
      try {
        this.shadow.drawImage.call(this.shadow, image, ...args);
      } catch {
      }
    } else if (this.shadow && isSoftwareRaster(image)) {
      this.mirrorSoftwareDraw(image, args);
    }
    const size = getWidthHeight(image);
    if (!size) {
      return;
    }
    let payload;
    let dx;
    let dy;
    let dw;
    let dh;
    if (args.length >= 8) {
      const [sx, sy, sw, sh] = args;
      [, , , , dx, dy, dw, dh] = args;
      if (image instanceof SoftwareRasterCanvas) {
        const x0 = Math.max(0, Math.floor(Math.min(sx, sx + sw)));
        const y0 = Math.max(0, Math.floor(Math.min(sy, sy + sh)));
        const x1 = Math.min(image.width, Math.ceil(Math.max(sx, sx + sw)));
        const y1 = Math.min(image.height, Math.ceil(Math.max(sy, sy + sh)));
        payload = x1 > x0 && y1 > y0 ? { kind: "rgba", data: image.readRgba(x0, y0, x1 - x0, y1 - y0), width: x1 - x0, height: y1 - y0 } : null;
      } else {
        const full = snapshotSource(image);
        payload = full && cropPayload(full, sx, sy, sw, sh);
      }
      if (!payload) {
        return;
      }
    } else {
      payload = snapshotSource(image);
      if (!payload) {
        return;
      }
      if (args.length >= 4) {
        [dx, dy, dw, dh] = args;
      } else {
        [dx, dy] = args;
        dw = size.w;
        dh = size.h;
      }
    }
    if (![dx, dy, dw, dh].every(Number.isFinite) || dw === 0 || dh === 0 || this.state.globalAlpha <= 0) {
      return;
    }
    const node = this.imageNode(payload, dx, dy, dw, dh, !this.state.imageSmoothingEnabled);
    const m = this.state.transform;
    if (!isIdentity(m)) {
      node.attrs.transform = matrixAttr(m);
    }
    if (this.state.globalAlpha < 1) {
      node.attrs.opacity = fmt(this.state.globalAlpha);
    }
    if (BLEND_MODES.has(this.state.gco)) {
      node.attrs.style = `${node.attrs.style ? `${node.attrs.style};` : ""}mix-blend-mode:${this.state.gco}`;
    }
    this.emit(node);
  }
  /** Copies a software-raster draw onto the shadow through a real scratch canvas. */
  mirrorSoftwareDraw(image, args) {
    const temp = createTempCanvas(image.width, image.height);
    if (!temp || isSoftwareRaster(temp.canvas) || !this.shadow) {
      return;
    }
    canvasPutImageData(temp.ctx, createImageDataCompat(image.pixels.slice(), image.width, image.height), 0, 0);
    this.shadow.drawImage.call(this.shadow, temp.canvas, ...args);
  }
  getImageData(x, y, w, h) {
    if (this.shadow) {
      return canvasGetImageData(this.shadow, x, y, w, h);
    }
    return createImageDataCompat(new Uint8ClampedArray(Math.max(0, w * h * 4)), w, h);
  }
  /**
   * Writes pixels (ignoring transform, clip and compositing, like Canvas),
   * emitting only the pixels that differ from what is already there.
   */
  putImageData(image, x, y) {
    const dx = Math.round(x);
    const dy = Math.round(y);
    const { width: w, height: h, data } = image;
    const before = this.shadow ? canvasGetImageData(this.shadow, dx, dy, w, h).data : null;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;
    const changed = new Uint8Array(w * h);
    for (let py = 0; py < h; py++) {
      const ty = dy + py;
      if (ty < 0 || ty >= this.canvas.height) {
        continue;
      }
      for (let px = 0; px < w; px++) {
        const tx = dx + px;
        if (tx < 0 || tx >= this.canvas.width) {
          continue;
        }
        const i = (py * w + px) * 4;
        const differs = before ? data[i] !== before[i] || data[i + 1] !== before[i + 1] || data[i + 2] !== before[i + 2] || data[i + 3] !== before[i + 3] : data[i + 3] !== 0;
        if (differs) {
          changed[py * w + px] = 1;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
      }
    }
    if (this.shadow) {
      canvasPutImageData(this.shadow, image, dx, dy);
    }
    if (maxX < 0) {
      return;
    }
    const pw = maxX - minX + 1;
    const ph = maxY - minY + 1;
    const patch = new Uint8ClampedArray(pw * ph * 4);
    for (let py = 0; py < ph; py++) {
      for (let px = 0; px < pw; px++) {
        const si = (minY + py) * w + (minX + px);
        if (!changed[si]) {
          continue;
        }
        const o = (py * pw + px) * 4;
        patch[o] = data[si * 4];
        patch[o + 1] = data[si * 4 + 1];
        patch[o + 2] = data[si * 4 + 2];
        patch[o + 3] = data[si * 4 + 3];
      }
    }
    const node = this.imageNode(
      { kind: "rgba", data: patch, width: pw, height: ph },
      dx + minX,
      dy + minY,
      pw,
      ph,
      true
    );
    this.body.push(node);
    this.group = null;
  }
  /**
   * Reserves a placeholder at the current paint position (and clip), for
   * an image whose content is only available after async decoding. Keeps
   * the image in its true z-order instead of painting it on top of
   * everything recorded after it. `deviceQuad` (flat `x, y` corners in
   * device space), when given, is where the image will land; the pure-
   * JavaScript shadow marks that area unknown.
   */
  reserveSlot(deviceQuad2) {
    const soft = this.softShadow;
    if (soft && deviceQuad2 && deviceQuad2.length >= 6) {
      soft.canvas.markUnknown(deviceQuad2, null);
    }
    const slot = { tag: "g", attrs: {}, children: [] };
    this.emit(slot);
    return slot;
  }
  /** Fills a slot from {@link reserveSlot} with an image under `transform`. */
  fillSlot(slot, payload, transform, dx, dy, dw, dh) {
    const node = this.imageNode(payload, dx, dy, dw, dh, false);
    if (!isIdentity(transform)) {
      node.attrs.transform = matrixAttr(transform);
    }
    slot.children.push(node);
  }
  /**
   * Fills a slot with the source rectangle (`sx`,`sy`,`sw`,`sh`, in image
   * pixels) of an image whose pixel coordinates `toDevice` maps to the
   * device: the image is laid out at its natural size in pixel space and
   * clipped to the source rectangle, so crops, rotation and shear are all
   * carried by one exact affine transform.
   */
  fillSlotCropped(slot, payload, toDevice, natural, sx, sy, sw, sh) {
    const image = this.imageNode(payload, 0, 0, natural.w, natural.h, false);
    const fullImage = sx <= 0 && sy <= 0 && sx + sw >= natural.w && sy + sh >= natural.h;
    const group = { tag: "g", attrs: {}, children: [image] };
    if (!isIdentity(toDevice)) {
      group.attrs.transform = matrixAttr(toDevice);
    }
    if (!fullImage) {
      const id = this.id("c");
      this.defs.push({
        tag: "clipPath",
        attrs: { id },
        children: [{ tag: "rect", attrs: { x: fmt(sx), y: fmt(sy), width: fmt(sw), height: fmt(sh) } }]
      });
      image.attrs["clip-path"] = `url(#${id})`;
    }
    slot.children.push(group);
  }
  // ---- finalisation ------------------------------------------------------
  /**
   * Encodes every pending raster payload and returns the finished `<svg>`
   * tree. Call once, after replay (and deferred images) are complete.
   */
  async toTree(options = {}) {
    const cache = /* @__PURE__ */ new Map();
    for (const img of this.images) {
      let url = cache.get(img.payload);
      if (url === void 0) {
        url = await payloadToUrl(img.payload);
        cache.set(img.payload, url);
      }
      img.node.attrs.href = url;
    }
    const { width, height } = this.canvas;
    const attrs = { xmlns: "http://www.w3.org/2000/svg" };
    if (options.includeSize ?? true) {
      attrs.width = width;
      attrs.height = height;
    }
    attrs.viewBox = `0 0 ${width} ${height}`;
    attrs.style = "isolation:isolate";
    const children = [];
    if (this.defs.length) {
      children.push({ tag: "defs", attrs: {}, children: this.defs });
    }
    children.push(...pruneEmptySlots(this.body));
    return { tag: "svg", attrs, children };
  }
};
function pruneEmptySlots(nodes) {
  return nodes.filter((n) => {
    if (n.tag === "g" && n.children) {
      n.children = pruneEmptySlots(n.children);
      return n.children.length > 0;
    }
    return true;
  });
}
async function payloadToUrl(p) {
  switch (p.kind) {
    case "url":
      return p.url;
    case "encoded":
      return `data:${p.mime};base64,${bytesToBase64(p.bytes)}`;
    case "rgba":
      return `data:image/png;base64,${bytesToBase64(await encodePng(p.data, p.width, p.height))}`;
  }
}
function isSvgContext(ctx) {
  return ctx instanceof SvgContext;
}
function canReadBack(ctx) {
  return !(ctx instanceof SvgContext) || ctx.canReadPixels;
}

// src/emf-rop2-exact.ts
var ROP2_EXACT_INDEX = {
  [R2_MASKPEN]: 160,
  // P & D
  [R2_MERGEPEN]: 250,
  // P | D
  [R2_XORPEN]: 90,
  // P ^ D
  [R2_NOTXORPEN]: 165,
  // ~(P ^ D)
  [R2_MASKPENNOT]: 80,
  // P & ~D
  [R2_MERGEPENNOT]: 245,
  // P | ~D
  [R2_MASKNOTPEN]: 10,
  // ~P & D
  [R2_MERGENOTPEN]: 175,
  // ~P | D
  [R2_NOTMASKPEN]: 95,
  // ~(P & D)
  [R2_NOTMERGEPEN]: 5
  // ~(P | D)
};
function isExactRop2Bitwise(rop2) {
  return rop2 in ROP2_EXACT_INDEX;
}
function rop2Rop3Index(rop2) {
  if (!Number.isInteger(rop2) || rop2 < 1 || rop2 > 16) {
    return void 0;
  }
  const n = rop2 - 1;
  return (n >> 2) * 80 + (n & 3) * 5;
}
function packRgb(r, g, b) {
  return r << 16 | g << 8 | b;
}
function rop2TransformPacked(p, transform) {
  switch (transform) {
    case "invert":
      return ~p & 16777215;
    case "black":
      return 0;
    case "white":
      return 16777215;
    default:
      return p;
  }
}
function surfaceSize(ctx) {
  const canvas = ctx.canvas;
  const w = canvas?.width;
  const h = canvas?.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}
function measurePathBox(build, pad, surface) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let tx = 0;
  let ty = 0;
  let unknown = false;
  const add = (x, y, r = 0) => {
    minX = Math.min(minX, x + tx - r);
    minY = Math.min(minY, y + ty - r);
    maxX = Math.max(maxX, x + tx + r);
    maxY = Math.max(maxY, y + ty + r);
  };
  const opaque = () => {
    unknown = true;
  };
  const recorder = {
    moveTo: (x, y) => add(x, y),
    lineTo: (x, y) => add(x, y),
    rect: (x, y, w, h) => {
      add(x, y);
      add(x + w, y + h);
    },
    fillRect: (x, y, w, h) => {
      add(x, y);
      add(x + w, y + h);
    },
    strokeRect: (x, y, w, h) => {
      add(x, y);
      add(x + w, y + h);
    },
    bezierCurveTo: (ax, ay, bx, by, x, y) => {
      add(ax, ay);
      add(bx, by);
      add(x, y);
    },
    quadraticCurveTo: (ax, ay, x, y) => {
      add(ax, ay);
      add(x, y);
    },
    arcTo: (x12, y12, x2, y2) => {
      add(x12, y12);
      add(x2, y2);
    },
    arc: (x, y, r) => add(x, y, Math.abs(r)),
    ellipse: (x, y, rx, ry) => add(x, y, Math.max(Math.abs(rx), Math.abs(ry))),
    translate: (x, y) => {
      tx += x;
      ty += y;
    },
    setTransform: opaque,
    transform: opaque,
    scale: opaque,
    rotate: opaque
  };
  const noop = () => void 0;
  const stand = new Proxy(recorder, {
    get: (target, prop) => typeof prop === "string" && prop in target ? target[prop] : noop,
    set: () => true
  });
  build(stand);
  if (unknown) {
    return { x: 0, y: 0, w: surface.w, h: surface.h };
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }
  const x0 = Math.max(0, Math.floor(minX - pad));
  const y0 = Math.max(0, Math.floor(minY - pad));
  const x1 = Math.min(surface.w, Math.ceil(maxX + pad));
  const y1 = Math.min(surface.h, Math.ceil(maxY + pad));
  if (x1 <= x0 || y1 <= y0) {
    return null;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
var SCRATCH_CACHE_MAX_PIXELS = 1024 * 1024;
var cachedScratch = null;
function acquireScratch(w, h) {
  let scratch = cachedScratch && cachedScratch.w >= w && cachedScratch.h >= h ? cachedScratch : null;
  if (!scratch) {
    const cw = Math.max(w, cachedScratch?.w ?? 0);
    const ch = Math.max(h, cachedScratch?.h ?? 0);
    const cacheable = cw * ch <= SCRATCH_CACHE_MAX_PIXELS;
    const created = cacheable ? createTempCanvas(cw, ch) : createTempCanvas(w, h);
    if (!created) {
      return null;
    }
    scratch = { canvas: created.canvas, ctx: created.ctx, w: cacheable ? cw : w, h: cacheable ? ch : h };
    if (cacheable) {
      cachedScratch = scratch;
    }
  }
  const c = scratch.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  c.clearRect(0, 0, w, h);
  return scratch;
}
function compositeOverlay(ctx, box, scratch, pixels) {
  canvasPutImageData(scratch.ctx, pixels, 0, 0);
  const draw = ctx.drawImage;
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    draw.call(ctx, scratch.canvas, 0, 0, box.w, box.h, box.x, box.y, box.w, box.h);
  } finally {
    ctx.restore();
  }
}
function unknownDestination(ctx, box) {
  return isSvgContext(ctx) ? ctx.unknownPixels(box.x, box.y, box.w, box.h) : null;
}
function splitUnknownDestination(overlay, n, unknown, resultFor, approx) {
  let multiply = null;
  let difference = null;
  const others = /* @__PURE__ */ new Map();
  const put = (layer, i, c) => {
    layer[i * 4] = c >> 16 & 255;
    layer[i * 4 + 1] = c >> 8 & 255;
    layer[i * 4 + 2] = c & 255;
    layer[i * 4 + 3] = 255;
  };
  for (let i = 0; i < n; i++) {
    if (!unknown[i] || overlay[i * 4 + 3] === 0) {
      continue;
    }
    const r0 = resultFor(i, 0);
    const r1 = resultFor(i, 16777215);
    if (r0 === r1) {
      continue;
    }
    let m = 0;
    let x = 0;
    let expressible = true;
    for (let shift = 16; shift >= 0; shift -= 8) {
      const a2 = r0 >> shift & 255;
      const b = r1 >> shift & 255;
      if (a2 === b) {
        x |= a2 << shift;
      } else if (a2 === 0 && b === 255) {
        m |= 255 << shift;
      } else if (a2 === 255 && b === 0) {
        m |= 255 << shift;
        x |= 255 << shift;
      } else {
        expressible = false;
        break;
      }
    }
    if (expressible) {
      overlay[i * 4 + 3] = 0;
      if (m !== 16777215) {
        multiply ?? (multiply = new Uint8ClampedArray(n * 4));
        put(multiply, i, m);
      }
      if (x !== 0) {
        difference ?? (difference = new Uint8ClampedArray(n * 4));
        put(difference, i, x);
      }
      continue;
    }
    const a = approx?.(i);
    if (a) {
      overlay[i * 4 + 3] = 0;
      if (a.mode === "multiply") {
        multiply ?? (multiply = new Uint8ClampedArray(n * 4));
        put(multiply, i, a.color);
        continue;
      }
      if (a.mode === "difference") {
        difference ?? (difference = new Uint8ClampedArray(n * 4));
        put(difference, i, a.color);
        continue;
      }
      let layer = others.get(a.mode);
      if (!layer) {
        layer = new Uint8ClampedArray(n * 4);
        others.set(a.mode, layer);
      }
      put(layer, i, a.color);
    }
  }
  const layers = [];
  if (multiply) {
    layers.push({ mode: "multiply", data: multiply });
  }
  if (difference) {
    layers.push({ mode: "difference", data: difference });
  }
  for (const [mode, data] of others) {
    layers.push({ mode, data });
  }
  return layers;
}
function drawBlendLayers(ctx, box, layers) {
  if (!isSvgContext(ctx)) {
    return;
  }
  for (const layer of layers) {
    ctx.blendPatch(layer.data, box.x, box.y, box.w, box.h, layer.mode);
  }
}
function rewritePixels(ctx, box, op, approx) {
  try {
    const dest = canvasGetImageData(ctx, box.x, box.y, box.w, box.h);
    const dd = dest.data;
    const scratch = acquireScratch(box.w, box.h);
    const overlay = scratch ? canvasGetImageData(scratch.ctx, 0, 0, box.w, box.h) : dest;
    const od = overlay.data;
    for (let y = 0; y < box.h; y++) {
      for (let x = 0; x < box.w; x++) {
        const i = (y * box.w + x) * 4;
        const c = op(box.x + x, box.y + y, packRgb(dd[i], dd[i + 1], dd[i + 2]));
        if (c < 0) {
          continue;
        }
        od[i] = c >> 16 & 255;
        od[i + 1] = c >> 8 & 255;
        od[i + 2] = c & 255;
        od[i + 3] = 255;
      }
    }
    if (!scratch) {
      canvasPutImageData(ctx, dest, box.x, box.y);
      return true;
    }
    const unknown = unknownDestination(ctx, box);
    const layers = unknown ? splitUnknownDestination(
      od,
      box.w * box.h,
      unknown,
      (i, d) => op(box.x + i % box.w, box.y + Math.floor(i / box.w), d),
      approx && ((i) => approx(box.x + i % box.w, box.y + Math.floor(i / box.w)))
    ) : [];
    compositeOverlay(ctx, box, scratch, overlay);
    drawBlendLayers(ctx, box, layers);
    return true;
  } catch {
    return false;
  }
}
function paintWithRop2PerPixel(ctx, rop2, color, draw, pad = 2, fillRule) {
  const index = rop2Rop3Index(rop2);
  if (index === void 0 || !canReadBack(ctx)) {
    return false;
  }
  if (index === 170) {
    return true;
  }
  const size = surfaceSize(ctx);
  if (!size) {
    return false;
  }
  try {
    const box = measurePathBox(draw, pad, size);
    if (!box) {
      return true;
    }
    const scratch = acquireScratch(box.w, box.h);
    if (!scratch) {
      return false;
    }
    const sc = scratch.ctx;
    sc.save();
    try {
      sc.fillStyle = color;
      sc.strokeStyle = color;
      sc.translate(-box.x, -box.y);
      draw(sc);
    } finally {
      sc.restore();
    }
    const pointTest = fillRule !== void 0 && typeof sc.isPointInPath === "function";
    const hex5 = /^#([0-9a-f]{6})$/i.exec(color.trim());
    const fixedP = hex5 ? parseInt(hex5[1], 16) : -1;
    const paint = canvasGetImageData(sc, 0, 0, box.w, box.h);
    const pd = paint.data;
    const dd = index === 240 ? null : canvasGetImageData(ctx, box.x, box.y, box.w, box.h).data;
    const unknown = dd ? unknownDestination(ctx, box) : null;
    const rawP = unknown ? new Int32Array(box.w * box.h) : null;
    for (let i = 0; i < pd.length; i += 4) {
      const a = pd[i + 3];
      let covered;
      if (a === 0) {
        covered = false;
      } else if (a === 255) {
        covered = true;
      } else if (pointTest) {
        const px = (i >> 2) % box.w;
        const py = ((i >> 2) - px) / box.w;
        covered = sc.isPointInPath(px + 0.5, py + 0.5, fillRule);
      } else {
        covered = a >= 128;
      }
      if (!covered) {
        pd[i] = 0;
        pd[i + 1] = 0;
        pd[i + 2] = 0;
        pd[i + 3] = 0;
        continue;
      }
      const p = fixedP >= 0 ? fixedP : packRgb(pd[i], pd[i + 1], pd[i + 2]);
      if (rawP) {
        rawP[i >> 2] = p;
      }
      let c = p;
      if (dd) {
        const d = packRgb(dd[i], dd[i + 1], dd[i + 2]);
        c = evalRop3(index, p, d, d);
      }
      pd[i] = c >> 16 & 255;
      pd[i + 1] = c >> 8 & 255;
      pd[i + 2] = c & 255;
      pd[i + 3] = 255;
    }
    let layers = [];
    if (unknown && rawP) {
      const approx = rop2Paint(rop2);
      layers = splitUnknownDestination(
        pd,
        box.w * box.h,
        unknown,
        (i, d) => evalRop3(index, rawP[i], d, d),
        (i) => ({ color: rop2TransformPacked(rawP[i], approx.colorTransform), mode: approx.gco })
      );
    }
    compositeOverlay(ctx, box, scratch, paint);
    drawBlendLayers(ctx, box, layers);
    return true;
  } catch {
    return false;
  }
}

// src/emf-gdi-raster-layer.ts
var MAX_LAYER_PIXELS = 16 * 1024 * 1024;
function rasterLayerOf(rCtx) {
  if (rCtx.gdiAntialias !== false) {
    return null;
  }
  if (rCtx.rasterLayer !== void 0) {
    return rCtx.rasterLayer;
  }
  const size = surfaceSize(rCtx.ctx);
  if (!size || isSvgContext(rCtx.ctx) || size.w * size.h > MAX_LAYER_PIXELS) {
    rCtx.rasterLayer = null;
    return null;
  }
  rCtx.rasterLayer = {
    w: size.w,
    h: size.h,
    data: new Uint8ClampedArray(size.w * size.h * 4),
    x0: size.w,
    y0: size.h,
    x1: 0,
    y1: 0
  };
  return rCtx.rasterLayer;
}
function flushRasterLayer(rCtx) {
  const layer = rCtx.rasterLayer;
  if (!layer || layer.x1 <= layer.x0 || layer.y1 <= layer.y0) {
    return;
  }
  const box = { x: layer.x0, y: layer.y0, w: layer.x1 - layer.x0, h: layer.y1 - layer.y0 };
  const pixels = new Uint8ClampedArray(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    const from = ((box.y + y) * layer.w + box.x) * 4;
    pixels.set(layer.data.subarray(from, from + box.w * 4), y * box.w * 4);
    layer.data.fill(0, from, from + box.w * 4);
  }
  layer.x0 = layer.w;
  layer.y0 = layer.h;
  layer.x1 = 0;
  layer.y1 = 0;
  const scratch = acquireScratch(box.w, box.h);
  if (scratch) {
    compositeOverlay(rCtx.ctx, box, scratch, createImageDataCompat(pixels, box.w, box.h));
    return;
  }
  const dest = canvasGetImageData(rCtx.ctx, box.x, box.y, box.w, box.h);
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] !== 0) {
      dest.data[i] = pixels[i];
      dest.data[i + 1] = pixels[i + 1];
      dest.data[i + 2] = pixels[i + 2];
      dest.data[i + 3] = 255;
    }
  }
  canvasPutImageData(rCtx.ctx, dest, box.x, box.y);
}
var LAYER_SAFE_RECORDS = /* @__PURE__ */ new Set([
  // shapes, polys, paths (incl. AngleArc, PolyDraw, Flatten/Widen/AbortPath), regions
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  27,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  54,
  55,
  56,
  59,
  60,
  61,
  62,
  63,
  64,
  65,
  66,
  68,
  71,
  72,
  73,
  74,
  85,
  86,
  87,
  88,
  89,
  90,
  91,
  92,
  // objects
  37,
  38,
  39,
  40,
  82,
  93,
  94,
  95,
  // state and mapping
  9,
  10,
  11,
  12,
  13,
  17,
  18,
  19,
  20,
  21,
  22,
  24,
  25,
  31,
  32,
  33,
  35,
  36,
  57,
  58,
  // palettes, and state/informational records that draw nothing
  16,
  23,
  48,
  49,
  50,
  51,
  52,
  99,
  100,
  101,
  102,
  103,
  104,
  105,
  106,
  109,
  110,
  111,
  112,
  113,
  119,
  120,
  121,
  122
]);
function isLayerSafeRecord(recType) {
  return LAYER_SAFE_RECORDS.has(recType);
}

// src/emf-gdi-raster-paint.ts
function skipped(paint, x, y) {
  if (paint.kind !== "tile" || !paint.skip) {
    return false;
  }
  const [dx, dy] = paint.toDevice(x, y);
  const { width, height } = paint.tile;
  const tx = ((dx - paint.orgX) % width + width) % width;
  const ty = ((dy - paint.orgY) % height + height) % height;
  return paint.skip[ty * width + tx] === 1;
}
function hex(rgb2) {
  return `#${(rgb2 & 16777215).toString(16).padStart(6, "0")}`;
}
function usesDest(index) {
  for (const p of [0, 16777215]) {
    if (evalRop3(index, p, 0, 0) !== evalRop3(index, p, 0, 16777215)) {
      return true;
    }
  }
  return false;
}
function buildSpanPath(ctx, spans) {
  ctx.beginPath();
  for (const r of spanRects(spans)) {
    ctx.rect(r.x, r.y, r.w, r.h);
  }
}
function spanRects(spans) {
  const out = [];
  const n = spans.length;
  const d = spans.data;
  const order = new Array(n);
  for (let i2 = 0; i2 < n; i2++) {
    order[i2] = i2 * 3;
  }
  order.sort((a, b) => d[a + 1] - d[b + 1] || d[a + 2] - d[b + 2] || d[a] - d[b]);
  let i = 0;
  while (i < n) {
    const o = order[i];
    const x0 = d[o + 1];
    const x1 = d[o + 2];
    const y0 = d[o];
    let y1 = y0 + 1;
    let j = i + 1;
    while (j < n) {
      const q = order[j];
      if (d[q + 1] !== x0 || d[q + 2] !== x1 || d[q] > y1) {
        break;
      }
      if (d[q] === y1) {
        y1++;
      }
      j++;
    }
    out.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    i = j;
  }
  return out;
}
function fillSpanRects(ctx, spans, color, gco = "source-over") {
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = gco;
    ctx.fillStyle = color;
    buildSpanPath(ctx, spans);
    ctx.fill("nonzero");
  } finally {
    ctx.restore();
  }
}
function paintSpansDeferred(rCtx, spans, paint, rop2) {
  if (spans.length === 0) {
    return;
  }
  const index = rop2Rop3Index(rop2) ?? 240;
  if (index === 170) {
    return;
  }
  const layer = usesDest(index) ? null : rasterLayerOf(rCtx);
  if (!layer) {
    flushRasterLayer(rCtx);
    paintSpans(rCtx.ctx, spans, paint, rop2);
    return;
  }
  const { w, h, data } = layer;
  const d = spans.data;
  const solid = paint.kind === "solid" ? evalRop3(index, paint.rgb, 0, 0) : 0;
  for (let s = 0; s < spans.length * 3; s += 3) {
    const y = d[s];
    if (y < 0 || y >= h) {
      continue;
    }
    const sx0 = Math.max(0, d[s + 1]);
    const sx1 = Math.min(w, d[s + 2]);
    if (sx1 <= sx0) {
      continue;
    }
    if (sx0 < layer.x0) layer.x0 = sx0;
    if (sx1 > layer.x1) layer.x1 = sx1;
    if (y < layer.y0) layer.y0 = y;
    if (y + 1 > layer.y1) layer.y1 = y + 1;
    let i = (y * w + sx0) * 4;
    for (let x = sx0; x < sx1; x++, i += 4) {
      if (skipped(paint, x, y)) {
        continue;
      }
      let c = solid;
      if (paint.kind === "tile") {
        const [dx, dy] = paint.toDevice(x, y);
        c = evalRop3(index, sampleTile(paint.tile, dx, dy, paint.orgX, paint.orgY), 0, 0);
      }
      data[i] = c >> 16 & 255;
      data[i + 1] = c >> 8 & 255;
      data[i + 2] = c & 255;
      data[i + 3] = 255;
    }
  }
}
function paintSpans(ctx, spans, paint, rop2) {
  if (spans.length === 0) {
    return;
  }
  const index = rop2Rop3Index(rop2) ?? 240;
  if (index === 170) {
    return;
  }
  const needD = usesDest(index);
  if (paint.kind === "solid" && !needD) {
    fillSpanRects(ctx, spans, hex(evalRop3(index, paint.rgb, 0, 0)));
    return;
  }
  if (!canReadBack(ctx) || paint.kind === "tile" && isSvgContext(ctx) && index === 240) {
    if (paint.kind === "tile" && isSvgContext(ctx) && index === 240) {
      const { tile, orgX, orgY } = paint;
      const rgba = new Uint8ClampedArray(tile.width * tile.height * 4);
      for (let i = 0; i < tile.rgb.length; i++) {
        rgba[i * 4] = tile.rgb[i] >>> 16 & 255;
        rgba[i * 4 + 1] = tile.rgb[i] >>> 8 & 255;
        rgba[i * 4 + 2] = tile.rgb[i] & 255;
        rgba[i * 4 + 3] = paint.skip?.[i] === 1 ? 0 : 255;
      }
      const [ox, oy] = paint.toDevice(0, 0);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      buildSpanPath(ctx, spans);
      ctx.fillWithTile({ width: tile.width, height: tile.height, rgba }, orgX - ox, orgY - oy, 1, 1, "nonzero");
      ctx.restore();
      return;
    }
    const rgb2 = paint.kind === "solid" ? paint.rgb : paint.tile.rgb[0];
    const rp = rop2Paint(rop2);
    fillSpanRects(ctx, spans, rop2TransformColor(hex(rgb2), rp.colorTransform), rp.gco);
    return;
  }
  const b = spans.bounds();
  const size = surfaceSize(ctx);
  if (!b) {
    return;
  }
  const x0 = Math.max(0, b.x0);
  const y0 = Math.max(0, b.y0);
  const x1 = size ? Math.min(size.w, b.x1) : b.x1;
  const y1 = size ? Math.min(size.h, b.y1) : b.y1;
  if (x1 <= x0 || y1 <= y0) {
    return;
  }
  const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const scratch = acquireScratch(box.w, box.h);
  if (!scratch) {
    return;
  }
  const dest = canvasGetImageData(ctx, box.x, box.y, box.w, box.h).data;
  const overlay = canvasGetImageData(scratch.ctx, 0, 0, box.w, box.h);
  const od = overlay.data;
  const d = spans.data;
  for (let s = 0; s < spans.length * 3; s += 3) {
    const y = d[s];
    if (y < y0 || y >= y1) {
      continue;
    }
    const sx0 = Math.max(x0, d[s + 1]);
    const sx1 = Math.min(x1, d[s + 2]);
    for (let x = sx0; x < sx1; x++) {
      if (skipped(paint, x, y)) {
        continue;
      }
      const i = ((y - y0) * box.w + (x - x0)) * 4;
      let p;
      if (paint.kind === "solid") {
        p = paint.rgb;
      } else {
        const [dx, dy] = paint.toDevice(x, y);
        p = sampleTile(paint.tile, dx, dy, paint.orgX, paint.orgY);
      }
      let c = p;
      if (needD) {
        const dv = od[i + 3] === 255 ? od[i] << 16 | od[i + 1] << 8 | od[i + 2] : dest[i] << 16 | dest[i + 1] << 8 | dest[i + 2];
        c = evalRop3(index, p, dv, dv);
      } else {
        c = evalRop3(index, p, 0, 0);
      }
      od[i] = c >> 16 & 255;
      od[i + 1] = c >> 8 & 255;
      od[i + 2] = c & 255;
      od[i + 3] = 255;
    }
  }
  compositeOverlay(ctx, box, scratch, overlay);
}

// src/gdi-raster-widen.ts
var HOBBY = [
  [[0, -8], [-8, 0], [0, 8], [8, 0]],
  [[8, -16], [-8, -16], [-16, 0], [-8, 16], [8, 16], [16, 0]],
  [[8, -24], [-8, -24], [-24, -8], [-24, 8], [-8, 24], [8, 24], [24, 8], [24, -8]],
  [[8, -32], [-8, -32], [-24, -24], [-32, -8], [-32, 8], [-24, 24], [-8, 32], [8, 32], [24, 24], [32, 8], [32, -8], [24, -24]],
  [[8, -40], [-8, -40], [-24, -32], [-32, -24], [-40, -8], [-40, 8], [-32, 24], [-24, 32], [-8, 40], [8, 40], [24, 32], [32, 24], [40, 8], [40, -8], [32, -24], [24, -32]],
  [[8, -48], [-8, -48], [-24, -40], [-40, -24], [-48, -8], [-48, 8], [-40, 24], [-24, 40], [-8, 48], [8, 48], [24, 40], [40, 24], [48, 8], [48, -8], [40, -24], [24, -40]]
];
var HOBBY_LIMIT = 104;
var FLAT_VECTOR_OFFSET = { 7: [0, 0.5], 8: [0, 0.5], 9: [0.5, 0.5], 10: [0.5, 0] };
var penCache = /* @__PURE__ */ new Map();
function penPolygon(width) {
  const cached = penCache.get(width);
  if (cached) {
    return cached;
  }
  let pen;
  if (width < HOBBY_LIMIT) {
    const n = Math.min(6, Math.max(1, Math.floor(width / 16 + 0.5)));
    pen = HOBBY[n - 1];
  } else {
    const rx = Math.ceil(width / 2);
    const ry = 8 * Math.floor((width + 9) / 16);
    const f = flattenBezierPath(ellipseBeziers(-rx, -ry, rx, ry));
    const half = [];
    for (let i = 0; i + 1 < f.length; i += 2) {
      half.push([f[i], f[i + 1]]);
      if (i > 0 && f[i + 1] === 0) {
        break;
      }
    }
    half.pop();
    pen = [...half, ...half.map((p) => [0 - p[0] || 0, 0 - p[1] || 0])];
  }
  penCache.set(width, pen);
  return pen;
}
function drawVertices(pen, dx, dy) {
  const n = pen.length;
  const axisVertex = pen.some((q) => q[1] === 0);
  const steep = Math.abs(dy) > 2 * Math.abs(dx) || Math.abs(dy) === 2 * Math.abs(dx) && axisVertex;
  const s = (steep ? dy < 0 : dx < 0 || dx === 0 && dy < 0) ? -1 : 1;
  let best = 0;
  let bestH = -Infinity;
  let bestAlong = 0;
  for (let i = 0; i < n; i++) {
    const h = dy * pen[i][0] - dx * pen[i][1];
    const along = s * (dx * pen[i][0] + dy * pen[i][1]);
    if (h > bestH || h === bestH && along > bestAlong) {
      bestH = h;
      best = i;
      bestAlong = along;
    }
  }
  return [best, (best + n / 2) % n];
}
function halfPixel(v) {
  return Math.sign(v) * 8 * Math.floor((Math.abs(v) + 4) / 8);
}
function flatVector(width, dx0, dy0) {
  let dx = dx0;
  let dy = dy0;
  const flip = dx < 0 || dx === 0 && dy < 0;
  if (flip) {
    dx = -dx;
    dy = -dy;
  }
  const pen = penPolygon(width);
  const n = pen.length;
  const nx = -dy;
  const ny = dx;
  let best = 0;
  let bh = -Infinity;
  for (let i = 0; i < n; i++) {
    const h = nx * pen[i][0] + ny * pen[i][1];
    if (h > bh) {
      bh = h;
      best = i;
    }
  }
  const P = pen[(best + n - 1) % n];
  const N = pen[(best + 1) % n];
  const D = pen[best];
  const hP = nx * P[0] + ny * P[1];
  const hN = nx * N[0] + ny * N[1];
  const [B, hB, hS] = hP >= hN ? [P, hP, hN] : [N, hN, hP];
  const den = 2 * (bh - hB + (bh - hS));
  const w = den === 0 ? 0 : (hB - hS) / den;
  const off = width % 16 === 0 && width >= HOBBY_LIMIT ? FLAT_VECTOR_OFFSET[width / 16] : void 0;
  const sgn = best < n / 2 ? 1 : -1;
  const ox = off ? sgn * off[0] : 0;
  const oy = off ? sgn * off[1] : 0;
  const r = (v) => 8 * Math.floor((v + 4) / 8);
  const vx = r(D[0] + (B[0] - D[0]) * w + 0.5 * Math.sign(dy) + ox);
  const vy = r(D[1] + (B[1] - D[1]) * w + 0.5 * Math.sign(dx) + oy);
  return flip ? [-vx, -vy] : [vx, vy];
}
function squareExtension(width, dx, dy) {
  const len = Math.hypot(dx, dy);
  const r = width / 2;
  return [Math.floor(dx / len * r + 0.5), Math.floor(dy / len * r + 0.5)];
}
function turnSign(ax, ay, bx, by) {
  const c = ax * by - ay * bx;
  if (c !== 0) {
    return c;
  }
  if (ax * bx + ay * by >= 0) {
    return 0;
  }
  const sx = ax >= 0 ? 1 : -1;
  const sy = ay >= 0 ? 1 : -1;
  const swap = Math.abs(ay) > Math.abs(ax) || Math.abs(ay) === Math.abs(ax) && ay > 0;
  return sx * sy < 0 !== swap ? -1 : 1;
}
var Outliner = class {
  constructor(opts, out) {
    this.opts = opts;
    this.out = out;
    this.pts = [];
    this.pen = penPolygon(opts.width);
    this.n = this.pen.length;
    this.rr = opts.cap === "round" && opts.join === "round";
    this.roundJoinSides = opts.join === "round" && opts.cap !== "flat";
    this.maxX = Math.max(...this.pen.map((q) => Math.abs(q[0])));
  }
  /**
   * Segment `a`..`b`. `dir` (a dash's path segment) replaces its direction;
   * `drawDir` (a curve's end tangent) only picks the draw vertices, the
   * perpendicular following the chord (measured on Bezier ends).
   */
  seg(a, b, dir, drawDir) {
    const dx = dir ? dir[0] : b[0] - a[0];
    const dy = dir ? dir[1] : b[1] - a[1];
    const d = drawDir ?? [dx, dy];
    const [L, R] = drawVertices(this.pen, d[0], d[1]);
    return { dx, dy, L, R, v: flatVector(this.opts.width, dx, dy), e: squareExtension(this.opts.width, dx, dy) };
  }
  push(p, v) {
    this.pts.push([p[0] + v[0], p[1] + v[1]]);
  }
  /** Pen vertex `k` placed around `p` (pulled one unit inwards when `p` is on a pixel). */
  penAt(p, k) {
    const q = this.pen[k];
    if ((p[0] & 15) === 0 && (p[1] & 15) === 0) {
      this.push(p, [q[0] - Math.sign(q[0]), q[1] - Math.sign(q[1])]);
    } else {
      this.push(p, q);
    }
  }
  /** Pen vertices from index `a` to index `b` in pen order, ends included on request. */
  walk(p, a, b, inclA, inclB) {
    if (inclA) {
      this.penAt(p, a);
    }
    if (a === b) {
      return;
    }
    for (let k = (a + 1) % this.n; k !== b; k = (k + 1) % this.n) {
      this.penAt(p, k);
    }
    if (inclB) {
      this.penAt(p, b);
    }
  }
  /**
   * Pen vertices angularly inside the wedge from side offset `A` to side
   * offset `B` (pen order, decreasing screen angle), in that order. A
   * vertex exactly on `A`'s ray is included when `startIncl`, one on `B`'s
   * ray when `endIncl`.
   */
  wedge(p, A, B, startIncl, endIncl) {
    const TWO = Math.PI * 2;
    const aA = Math.atan2(A[1], A[0]);
    const angleOf = (Q) => {
      let v = (aA - Math.atan2(Q[1], Q[0])) % TWO;
      if (v < 0) {
        v += TWO;
      }
      return v;
    };
    const onRay = (R, Q) => R[0] * Q[1] - R[1] * Q[0] === 0 && R[0] * Q[0] + R[1] * Q[1] > 0;
    const W = onRay(A, B) ? TWO : angleOf(B);
    const list = [];
    for (let k = 0; k < this.n; k++) {
      const Q = this.pen[k];
      if (onRay(A, Q)) {
        if (startIncl) {
          list.push([0, k]);
        }
      } else if (onRay(B, Q)) {
        if (endIncl) {
          list.push([W, k]);
        }
      } else {
        const a = angleOf(Q);
        if (a < W) {
          list.push([a, k]);
        }
      }
    }
    list.sort((x, y) => x[0] - y[0]);
    for (const [, k] of list) {
      this.penAt(p, k);
    }
  }
  /** Side offset of segment `s` at a join. */
  joinSide(s, side) {
    if (this.roundJoinSides) {
      const q = this.pen[side === "L" ? s.L : s.R];
      return [halfPixel(q[0]), halfPixel(q[1])];
    }
    return side === "R" ? s.v : [-s.v[0], -s.v[1]];
  }
  /** Side offset of segment `s` at a cap. */
  capSide(s, side) {
    if (this.rr) {
      const q = this.pen[side === "L" ? s.L : s.R];
      return [halfPixel(q[0]), halfPixel(q[1])];
    }
    return side === "R" ? s.v : [-s.v[0], -s.v[1]];
  }
  /** A cap at `p` from the `from` side of `s` round to the other side (`start`: around the back). */
  cap(p, s, start) {
    const from = start ? "L" : "R";
    const to = start ? "R" : "L";
    const { cap } = this.opts;
    if (cap === "round") {
      this.push(p, this.capSide(s, from));
      if (this.rr) {
        this.walk(p, s[from], s[to], false, false);
      } else {
        const A = this.capSide(s, from);
        this.wedge(p, A, [-A[0], -A[1]], true, false);
      }
      this.push(p, this.capSide(s, to));
      return;
    }
    const sv = this.capSide(s, from);
    const ev = this.capSide(s, to);
    if (cap === "square") {
      const e = start ? [-s.e[0], -s.e[1]] : s.e;
      this.push(p, [sv[0] + e[0], sv[1] + e[1]]);
      this.push(p, [ev[0] + e[0], ev[1] + e[1]]);
    } else {
      this.push(p, sv);
      this.push(p, ev);
    }
  }
  /**
   * The join at `p` on `side`, coming along `a` and leaving along `b` in
   * outline order (for the left side, walked backwards, `a` is the later
   * segment).
   */
  join(p, a, b, side, outer) {
    const { join, cap, width, miterLimit } = this.opts;
    const sa = this.joinSide(a, side);
    const sb = this.joinSide(b, side);
    const Da = side === "R" ? a.R : a.L;
    const Db = side === "R" ? b.R : b.L;
    if (this.roundJoinSides && Da === Db) {
      this.push(p, sa);
      return;
    }
    this.push(p, sa);
    if (outer) {
      if (join === "round") {
        if (this.roundJoinSides) {
          const q = this.pen[Db];
          const steep = Math.abs(b.dy) > Math.abs(b.dx);
          const incl = side === "L" && steep && Math.abs(q[0]) === this.maxX && q[0] * q[1] <= 0;
          this.walk(p, Da, Db, false, incl);
        } else {
          const anti = sa[0] === -sb[0] && sa[1] === -sb[1];
          this.wedge(p, sa, sb, !anti, !anti);
        }
      } else if (join === "miter") {
        const m = miterPoint(sa, [a.dx, a.dy], sb, [b.dx, b.dy], width, miterLimit);
        if (m) {
          this.push(p, m);
        }
      }
    } else {
      this.pts.push([p[0], p[1]]);
      if (join === "round" && cap === "flat") {
        this.push(p, sb);
        this.wedge(p, sb, sa, false, false);
        this.push(p, sa);
        this.pts.push([p[0], p[1]]);
      }
    }
    this.push(p, sb);
  }
  /** Emits the current figure. */
  flush() {
    const out = [];
    let lx = NaN;
    let ly = NaN;
    for (const [x, y] of this.pts) {
      if (x !== lx || y !== ly) {
        out.push(x, y);
        lx = x;
        ly = y;
      }
    }
    while (out.length >= 4 && out[0] === out[out.length - 2] && out[1] === out[out.length - 1]) {
      out.length -= 2;
    }
    if (out.length >= 6) {
      this.out.push(out);
    }
    this.pts = [];
  }
  /**
   * Outlines an open polyline (distinct consecutive points). `dirs` (a
   * dash's segment directions) replaces each segment's own direction, and
   * lets a single point stand for a zero-length dash along `dirs[0]`;
   * `draws` (curve end tangents) picks draw vertices only.
   */
  open(P, dirs, draws) {
    if (P.length < 2 && !dirs?.[0]) {
      this.dot(P[0]);
      return;
    }
    const segs2 = [];
    for (let i = 0; i + 1 < P.length; i++) {
      segs2.push(this.seg(P[i], P[i + 1], dirs?.[i], draws?.[i]));
    }
    if (segs2.length === 0) {
      const s = this.seg(P[0], P[0], dirs?.[0], draws?.[0]);
      this.cap(P[0], s, true);
      this.cap(P[0], s, false);
      this.flush();
      return;
    }
    this.cap(P[0], segs2[0], true);
    for (let i = 0; i + 1 < segs2.length; i++) {
      const s = segs2[i];
      const t = segs2[i + 1];
      const tr = turnSign(s.dx, s.dy, t.dx, t.dy);
      if (tr === 0) {
        this.push(P[i + 1], this.joinSide(s, "R"));
      } else {
        this.join(P[i + 1], s, t, "R", tr < 0);
      }
    }
    this.cap(P[P.length - 1], segs2[segs2.length - 1], false);
    for (let i = segs2.length - 1; i > 0; i--) {
      const s = segs2[i];
      const t = segs2[i - 1];
      const tr = turnSign(t.dx, t.dy, s.dx, s.dy);
      if (tr === 0) {
        this.push(P[i], this.joinSide(s, "L"));
      } else {
        this.join(P[i], s, t, "L", tr > 0);
      }
    }
    this.flush();
  }
  /** Outlines a closed polygon (distinct consecutive points, not repeating the first). */
  closed(P, draws) {
    const m = P.length;
    const segs2 = [];
    for (let i = 0; i < m; i++) {
      segs2.push(this.seg(P[i], P[(i + 1) % m], void 0, draws?.[i]));
    }
    for (let j = 1; j <= m; j++) {
      const i = j % m;
      const s = segs2[(i + m - 1) % m];
      const t = segs2[i];
      const tr = turnSign(s.dx, s.dy, t.dx, t.dy);
      if (tr === 0) {
        this.push(P[i], this.joinSide(s, "R"));
      } else {
        this.join(P[i], s, t, "R", tr < 0);
      }
    }
    this.flush();
    for (let j = 0; j < m; j++) {
      const i = (m - j) % m;
      const s = segs2[i];
      const t = segs2[(i + m - 1) % m];
      const tr = turnSign(t.dx, t.dy, s.dx, s.dy);
      if (tr === 0) {
        this.push(P[i], this.joinSide(s, "L"));
      } else {
        this.join(P[i], s, t, "L", tr > 0);
      }
    }
    this.flush();
  }
  /** A zero-length figure: the whole pen for a round cap, nothing otherwise. */
  dot(p) {
    if (this.opts.cap !== "round") {
      return;
    }
    for (let k = 0; k < this.n; k++) {
      this.push(p, this.pen[k]);
    }
    this.flush();
  }
};
function dashPieces(P, tangents, pattern, shorten) {
  const out = [];
  const dashes = [];
  for (let i = 0; i < pattern.length; i += 2) {
    const on2 = pattern[i];
    const off = pattern[i + 1] ?? 0;
    const s = Math.min(on2, shorten);
    dashes.push(on2 - s, off + s);
  }
  if (dashes.reduce((a, b) => a + b, 0) <= 0) {
    return [];
  }
  let idx = 0;
  let left = dashes[0];
  let on = true;
  let cur = { pts: [P[0]], dirs: [], draws: [] };
  for (let i = 0; i + 1 < P.length; i++) {
    const [x0, y0] = P[i];
    const [x1, y1] = P[i + 1];
    const dir = [x1 - x0, y1 - y0];
    const len = Math.hypot(dir[0], dir[1]);
    let t = 0;
    while (len - t > left || left === 0 && on) {
      t += left;
      const q = [Math.floor(x0 + dir[0] * t / len + 0.5), Math.floor(y0 + dir[1] * t / len + 0.5)];
      if (on && cur) {
        cur.pts.push(q);
        cur.dirs.push(dir);
        cur.draws.push(tangents[i]);
        out.push(cur);
        cur = null;
      } else {
        cur = { pts: [q], dirs: [], draws: [] };
      }
      on = !on;
      idx = (idx + 1) % dashes.length;
      left = dashes[idx];
    }
    left -= len - t;
    if (on && cur) {
      cur.pts.push(P[i + 1]);
      cur.dirs.push(dir);
      cur.draws.push(tangents[i]);
    }
  }
  if (on && cur && cur.dirs.length > 0) {
    out.push(cur);
  }
  return out;
}
function widenPath(path, opts) {
  const out = [];
  const outliner = new Outliner(opts, out);
  const dashed = !!opts.dashes && opts.dashes.length > 0;
  for (const fig of path.figures) {
    let P = [];
    const dirs = [];
    for (let i = 0; i + 1 < fig.pts.length; i += 2) {
      const q = [fig.pts[i], fig.pts[i + 1]];
      const last = P[P.length - 1];
      if (last && last[0] === q[0] && last[1] === q[1]) {
        continue;
      }
      if (last) {
        dirs.push(fig.tangents?.get(i / 2 - 1));
      }
      P.push(q);
    }
    if (P.length === 0) {
      continue;
    }
    const closed = fig.closed && P.length >= 2;
    if (closed && P.length >= 2 && P[0][0] === P[P.length - 1][0] && P[0][1] === P[P.length - 1][1]) {
      P = P.slice(0, -1);
    }
    if (dashed) {
      const run = closed ? [...P, P[0]] : P;
      const shorten = opts.cap === "flat" || opts.shortenDashes === false ? 0 : opts.width;
      for (const piece of dashPieces(run, closed ? [...dirs, void 0] : dirs, opts.dashes, shorten)) {
        const pts = [piece.pts[0]];
        const pdirs = [];
        const pdraws = [];
        for (let i = 1; i < piece.pts.length; i++) {
          const q = piece.pts[i];
          const last = pts[pts.length - 1];
          if (q[0] !== last[0] || q[1] !== last[1]) {
            pts.push(q);
            pdirs.push(piece.dirs[i - 1]);
            pdraws.push(piece.draws[i - 1]);
          }
        }
        outliner.open(pts, pdirs.length > 0 ? pdirs : [piece.dirs[0]], pdirs.length > 0 ? pdraws : [piece.draws[0]]);
      }
    } else if (closed && P.length >= 3) {
      outliner.closed(P, dirs);
    } else if (closed && P.length === 2) {
      outliner.open([P[0], P[1], P[0]]);
    } else {
      outliner.open(P, void 0, dirs);
    }
  }
  return out;
}
function miterPoint(sa, da, sb, db, width, limit) {
  const den = da[0] * db[1] - da[1] * db[0];
  if (den === 0) {
    return null;
  }
  const wx = sb[0] - sa[0];
  const wy = sb[1] - sa[1];
  const t = (wx * db[1] - wy * db[0]) / den;
  const mx = sa[0] + da[0] * t;
  const my = sa[1] + da[1] * t;
  if (Math.hypot(mx, my) > limit * width / 2) {
    return null;
  }
  return [Math.floor(mx + 0.5), Math.floor(my + 0.5)];
}

// src/emf-gdi-raster-shapes.ts
function rgbOf(color) {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  return m ? parseInt(m[1], 16) : 0;
}
function fixPoint(rCtx, x, y) {
  const m = gdiDeviceMatrix(rCtx);
  const fx = Math.round((m[0] * x + m[2] * y) * 16) + Math.round(m[4] * 16);
  const fy = Math.round((m[1] * x + m[3] * y) * 16) + Math.round(m[5] * 16);
  const whole = rCtx.wholeDevicePixels;
  if (whole) {
    const ux = 16 * whole[0];
    const uy = 16 * whole[1];
    return [Math.round(Math.floor(fx / ux + 0.5) * ux), Math.round(Math.floor(fy / uy + 0.5) * uy)];
  }
  return [fx, fy];
}
function fixBox(rCtx, l, t, r, b) {
  const [ax, ay] = fixPoint(rCtx, l, t);
  const [bx, by] = fixPoint(rCtx, r, t);
  const [dx, dy] = fixPoint(rCtx, l, b);
  return { ax, ay, exx: bx - ax, exy: by - ay, eyx: dx - ax, eyy: dy - ay };
}
function isAxisBox(box) {
  return box.exy === 0 && box.eyx === 0;
}
function boxCorners(box) {
  const { ax, ay, exx, exy, eyx, eyy } = box;
  return [ax + exx, ay + exy, ax, ay, ax + eyx, ay + eyy, ax + exx + eyx, ay + exy + eyy];
}
function flipBox(box) {
  return { ax: box.ax + box.eyx, ay: box.ay + box.eyy, exx: box.exx, exy: box.exy, eyx: -box.eyx, eyy: -box.eyy };
}
function rectRasterPath(box, clockwise = false) {
  const c = boxCorners(clockwise ? flipBox(box) : box);
  const path = new GdiRasterPath();
  path.moveTo(c[0], c[1]);
  path.lineTo(c[2], c[3]);
  path.lineTo(c[4], c[5]);
  path.lineTo(c[6], c[7]);
  path.closeFigure();
  return path;
}
function ellipseRasterPath(box, clockwise = false) {
  const path = new GdiRasterPath();
  path.addBeziers(ellipseBeziersBox(box, clockwise), true);
  path.closeFigure();
  return path;
}
function frameMapper(box, l, t, w, h) {
  if (isAxisBox(box)) {
    return (x, y) => [x, y];
  }
  return (x, y) => {
    const u = w !== 0 ? (x - l) / w : 0;
    const v = h !== 0 ? (y - t) / h : 0;
    return [Math.round(box.ax + box.exx * u + box.eyx * v), Math.round(box.ay + box.exy * u + box.eyy * v)];
  };
}
function boxFrame(box) {
  if (isAxisBox(box)) {
    const x0 = box.ax;
    const x1 = box.ax + box.exx;
    const y0 = box.ay;
    const y1 = box.ay + box.eyy;
    return { l: Math.min(x0, x1), t: Math.min(y0, y1), r: Math.max(x0, x1), b: Math.max(y0, y1) };
  }
  const w = Math.round(Math.hypot(box.exx, box.exy));
  const h = Math.round(Math.hypot(box.eyx, box.eyy));
  return { l: 0, t: 0, r: w, b: h };
}
function roundRectRasterPath(box, cw, ch, clockwise = false, rectangle = false) {
  if (rectangle) {
    return rectRasterPath(box, clockwise);
  }
  const f = boxFrame(box);
  const q = roundRectCorners(f.l, f.t, f.r, f.b, cw, ch);
  const map = frameMapper(box, f.l, f.t, f.r - f.l, f.b - f.t);
  const pts = [];
  for (let i = 0; i < q.length; i += 2) {
    pts.push(...map(q[i], clockwise ? f.t + f.b - q[i + 1] : q[i + 1]));
  }
  const path = new GdiRasterPath();
  for (let c = 0; c < 4; c++) {
    const o = c * 8;
    path.addBeziers(pts.slice(o, o + 8), c === 0);
  }
  path.closeFigure();
  return path;
}
function arcRasterPath(box, s, e, clockwise, kind, from, path = new GdiRasterPath()) {
  const f = boxFrame(box);
  const map = frameMapper(box, f.l, f.t, f.r - f.l, f.b - f.t);
  let sx = s[0];
  let sy = s[1];
  let ex = e[0];
  let ey = e[1];
  let cw = clockwise;
  if (!isAxisBox(box)) {
    const det = box.exx * box.eyy - box.exy * box.eyx || 1;
    const toFrame = (px, py) => {
      const qx = px - box.ax;
      const qy = py - box.ay;
      const u = (qx * box.eyy - qy * box.eyx) / det;
      const v = (box.exx * qy - box.exy * qx) / det;
      return [f.l + u * (f.r - f.l), f.t + v * (f.b - f.t)];
    };
    [sx, sy] = toFrame(sx, sy);
    [ex, ey] = toFrame(ex, ey);
    if (det < 0) {
      cw = !cw;
    }
  } else {
    if (box.exx < 0 !== box.eyy < 0) {
      cw = !cw;
    }
  }
  const bz = arcBeziers(f.l, f.t, f.r, f.b, sx, sy, ex, ey, cw);
  const pts = [];
  for (let i = 0; i < bz.length; i += 2) {
    pts.push(...map(bz[i], bz[i + 1]));
  }
  if (kind === "arcto" && from) {
    path.continueAt(from[0], from[1]);
    path.addBeziers(pts, false);
  } else {
    path.addBeziers(pts, true);
  }
  if (kind === "pie") {
    const w = f.r - f.l;
    const h = f.b - f.t;
    const [cx, cy] = map(f.l + Math.ceil(w / 2), f.t + Math.ceil(h / 2));
    path.lineTo(cx, cy);
  }
  if (kind === "pie" || kind === "chord") {
    path.closeFigure();
  }
  return { path, end: [pts[pts.length - 2], pts[pts.length - 1]] };
}
var PS_NULL = 5;
var PS_GEOMETRIC = 65536;
function penDeviceWidth(rCtx) {
  const m = gdiDeviceMatrix(rCtx);
  const scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  const whole = rCtx.wholeDevicePixels;
  if (whole) {
    return Math.round(rCtx.state.penWidth * scale / whole[0]) * whole[0];
  }
  return rCtx.state.penWidth * scale;
}
function penIsCosmetic(rCtx) {
  const flags = rCtx.state.penFlags ?? rCtx.state.penStyle;
  if ((flags & PS_GEOMETRIC) === 0 && rCtx.state.penExtended) {
    return true;
  }
  return Math.round(penDeviceWidth(rCtx) / (rCtx.wholeDevicePixels?.[0] ?? 1)) <= 1;
}
function penIsWidened(rCtx) {
  return (rCtx.state.penStyle & 15) !== PS_NULL;
}
function penWidenOptions(rCtx, opts = {}) {
  const { state } = rCtx;
  const flags = state.penFlags ?? state.penStyle;
  const widthPx = penDeviceWidth(rCtx);
  const capBits = flags & 3840;
  const joinBits = flags & 61440;
  const dashes = state.penExtended ? geometricStyle(flags, widthPx, state.penUserStyle, widthPx / (state.penWidth || 1)) : null;
  return {
    width: Math.round(widthPx * 16),
    cap: opts.roundPen || !state.penExtended || capBits === 0 ? "round" : capBits === 256 ? "square" : "flat",
    join: opts.roundPen ? "round" : opts.rectangle && !state.penExtended ? "miter" : !state.penExtended || joinBits === 0 ? "round" : joinBits === 4096 ? "bevel" : "miter",
    miterLimit: state.miterLimit ?? 10,
    dashes: dashes ? dashes.map((v) => v * 16) : null,
    shortenDashes: (flags & 15) !== 7
  };
}
function hatchBackgroundMask(hatch) {
  const m = new Uint8Array(64);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      m[y * 8 + x] = hatchBit(hatch, x, y) ? 0 : 1;
    }
  }
  return m;
}
function brushPaint(rCtx) {
  const realized = realizeBrush(rCtx.state);
  if (realized.kind === "none") {
    return null;
  }
  if (realized.kind === "solid") {
    return { kind: "solid", rgb: realized.rgb };
  }
  const sx = rCtx.sx || 1;
  const sy = rCtx.sy || 1;
  const { bounds, state } = rCtx;
  return {
    kind: "tile",
    tile: realized,
    toDevice: (x, y) => [Math.floor(bounds.left + (x + 0.5) / sx), Math.floor(bounds.top + (y + 0.5) / sy)],
    orgX: state.brushOrgX,
    orgY: state.brushOrgY,
    ...state.bkMode === 1 && state.brushPattern?.kind === "hatch" ? { skip: hatchBackgroundMask(state.brushPattern.hatch) } : {}
  };
}
function paintRasterPath(rCtx, path, opts) {
  const { ctx, state } = rCtx;
  if (opts.fill) {
    const paint = brushPaint(rCtx);
    if (paint) {
      const spans = fillPathSpans(opts.fillPath ?? path, !!opts.winding);
      paintSpansDeferred(rCtx, spans, paint, state.rop2);
    }
  }
  if (!opts.stroke || state.penStyle === PS_NULL) {
    return true;
  }
  if (!penIsCosmetic(rCtx)) {
    if (!penIsWidened(rCtx)) {
      return false;
    }
    const polys = widenPath(path, penWidenOptions(rCtx, opts));
    paintSpansDeferred(rCtx, fillPolygonSpans(polys, true), { kind: "solid", rgb: rgbOf(state.penColor) }, state.rop2);
    return true;
  }
  const pattern = cosmeticStyle(state.penFlags ?? state.penStyle, state.penUserStyle);
  const on = new SpanList();
  const gapsBk = pattern !== null && state.bkMode === 2 && styleGapsUseBackground(state.penFlags ?? state.penStyle);
  const off = gapsBk ? new SpanList() : null;
  strokeCosmetic(path, on, off, pattern, opts.style ?? { pos: 0 });
  if (off) {
    paintSpansDeferred(rCtx, off, { kind: "solid", rgb: rgbOf(state.bkColor) }, state.rop2);
  }
  paintSpansDeferred(rCtx, on, { kind: "solid", rgb: rgbOf(state.penColor) }, state.rop2);
  return true;
}

// src/emf-gdi-shape-paint.ts
var GDI_FILL_SHIFT = 0.5 - 1 / 32;
function shifted(build, d) {
  if (d === 0) {
    return build;
  }
  return (c) => {
    c.save();
    c.translate(d, d);
    build(c);
    c.restore();
  };
}
function isAliased(rCtx) {
  return rCtx.gdiAntialias === false;
}
function fillCurrentPathWithGdiPattern(rCtx, fillRule, buildPath) {
  const { ctx, bounds, state } = rCtx;
  const realized = realizeBrush(state);
  if (realized.kind !== "tile") {
    return false;
  }
  const sx = rCtx.sx || 1;
  const sy = rCtx.sy || 1;
  const index = rop2Rop3Index(state.rop2) ?? 240;
  const hatch = state.bkMode === 1 && state.brushPattern?.kind === "hatch" ? state.brushPattern.hatch : -1;
  const hatchGap = (dx, dy) => hatch >= 0 && !hatchBit(hatch, ((dx - state.brushOrgX) % 8 + 8) % 8, ((dy - state.brushOrgY) % 8 + 8) % 8);
  if (isSvgContext(ctx) && (index === 240 || !ctx.canReadPixels)) {
    const rgba = new Uint8ClampedArray(realized.width * realized.height * 4);
    for (let i = 0; i < realized.rgb.length; i++) {
      const c = realized.rgb[i];
      rgba[i * 4] = c >>> 16 & 255;
      rgba[i * 4 + 1] = c >>> 8 & 255;
      rgba[i * 4 + 2] = c & 255;
      rgba[i * 4 + 3] = hatch >= 0 && !hatchBit(hatch, i % 8, Math.floor(i / 8)) ? 0 : 255;
    }
    ctx.fillWithTile(
      { width: realized.width, height: realized.height, rgba },
      (state.brushOrgX - bounds.left) * sx,
      (state.brushOrgY - bounds.top) * sy,
      sx,
      sy,
      fillRule
    );
    return true;
  }
  const size = surfaceSize(ctx);
  if (!size || typeof ctx.isPointInPath !== "function") {
    return false;
  }
  if (index === 170) {
    return true;
  }
  const box = buildPath ? measurePathBox(buildPath, 1, size) : { x: 0, y: 0, w: size.w, h: size.h };
  if (!box) {
    return true;
  }
  const probe = 0.5 - GDI_FILL_SHIFT;
  const patternAt = (x, y) => sampleTile(
    realized,
    Math.floor(bounds.left + (x + 0.5) / sx),
    Math.floor(bounds.top + (y + 0.5) / sy),
    state.brushOrgX,
    state.brushOrgY
  );
  const approx = rop2Paint(state.rop2);
  return rewritePixels(
    ctx,
    box,
    (x, y, d) => {
      if (!ctx.isPointInPath(x + probe, y + probe, fillRule)) {
        return -1;
      }
      if (hatch >= 0 && hatchGap(Math.floor(bounds.left + (x + 0.5) / sx), Math.floor(bounds.top + (y + 0.5) / sy))) {
        return -1;
      }
      const p = patternAt(x, y);
      return index === 240 ? p : evalRop3(index, p, d, d);
    },
    (x, y) => ({ color: rop2TransformPacked(patternAt(x, y), approx.colorTransform), mode: approx.gco })
  );
}
function fillShapeExactOrFast(rCtx, buildPath, fillRule = "nonzero", fillPath) {
  const { ctx, state } = rCtx;
  if (state.brushStyle === 1) {
    return;
  }
  const geometry = fillPath ?? buildPath;
  if (realizeBrush(state).kind === "tile") {
    if (fillPath) {
      fillPath(ctx);
    }
    const done = fillCurrentPathWithGdiPattern(rCtx, fillRule, geometry);
    if (fillPath) {
      buildPath(ctx);
    }
    if (done) {
      return;
    }
  } else {
    const paint = rop2Paint(state.rop2);
    if (isAliased(rCtx) || !paint.exact && isExactRop2Bitwise(state.rop2)) {
      const handled = paintWithRop2PerPixel(
        ctx,
        state.rop2,
        state.brushColor,
        (scratch) => {
          shifted(geometry, GDI_FILL_SHIFT)(scratch);
          scratch.fill(fillRule);
        },
        1,
        fillRule
      );
      if (handled) {
        return;
      }
    }
  }
  const shift = hasWorldRotation(rCtx) ? GDI_FILL_SHIFT : 0;
  const rebuild = shift !== 0 || fillPath !== void 0;
  if (rebuild) {
    shifted(geometry, shift)(ctx);
  }
  applyBrush(ctx, state);
  ctx.fill(fillRule);
  if (rebuild) {
    buildPath(ctx);
  }
}
var PS_NULL2 = 5;
function penLineWidth(state, scale = 1) {
  return Math.max(state.penWidth * scale, 1);
}
function penScale(rCtx) {
  const m = gdiDeviceMatrix(rCtx);
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
}
function gdiStrokeAlign(state, scale = 1) {
  if (state.penStyle === PS_NULL2) {
    return 0;
  }
  const w = penLineWidth(state, scale);
  return Number.isInteger(w) && w % 2 === 1 ? 0.5 : 0;
}
function applyGdiPenGeometry(ctx, rCtx) {
  const { state } = rCtx;
  const scale = penScale(rCtx);
  const width = penLineWidth(state, scale);
  const flags = state.penFlags ?? state.penStyle;
  ctx.lineWidth = width;
  const cosmetic = penIsCosmetic(rCtx);
  if (!cosmetic && state.penExtended) {
    const cap = flags & 3840;
    const join = flags & 61440;
    ctx.lineCap = cap === 256 ? "square" : cap === 512 ? "butt" : "round";
    ctx.lineJoin = join === 4096 ? "bevel" : join === 8192 ? "miter" : "round";
    ctx.miterLimit = state.miterLimit ?? 10;
    ctx.setLineDash(geometricStyle(flags, width, state.penUserStyle, scale) ?? []);
  } else if (!cosmetic) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
  } else {
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.miterLimit = 10;
    ctx.setLineDash([]);
  }
}
function cosmeticPattern(rCtx) {
  const { state } = rCtx;
  if (state.penStyle === PS_NULL2 || !penIsCosmetic(rCtx)) {
    return null;
  }
  return cosmeticStyle(state.penFlags ?? state.penStyle, state.penUserStyle);
}
function strokeStyledCosmetic(rCtx, path, pattern, style) {
  const { ctx, state } = rCtx;
  const flags = state.penFlags ?? state.penStyle;
  const period = pattern.reduce((a, b) => a + b, 0);
  const paint = rop2Paint(state.rop2);
  const bk = state.bkMode === 2 && styleGapsUseBackground(flags);
  const segs2 = [];
  path.figures.forEach((f, fi) => {
    if (fi > 0) {
      style.pos = 0;
    }
    const p = f.closed ? [...f.pts, f.pts[0], f.pts[1]] : f.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      let n = 0;
      cosmeticLine(p[i], p[i + 1], p[i + 2], p[i + 3], () => {
        n++;
      });
      if (n === 0) {
        continue;
      }
      segs2.push([p[i], p[i + 1], p[i + 2], p[i + 3], style.pos, n]);
      style.pos += n;
    }
  });
  const c = (v) => v / 16 + 0.5;
  ctx.save();
  try {
    ctx.globalCompositeOperation = paint.gco;
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    for (const pass of bk ? ["bk", "fg"] : ["fg"]) {
      ctx.strokeStyle = rop2TransformColor(pass === "bk" ? state.bkColor : state.penColor, paint.colorTransform);
      for (const [x0, y0, x1, y1, pos, n] of segs2) {
        const f = Math.hypot(x1 - x0, y1 - y0) / 16 / n;
        if (pass === "fg") {
          ctx.setLineDash(pattern.map((v) => v * f));
          ctx.lineDashOffset = pos % period * f;
        } else {
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.moveTo(c(x0), c(y0));
        ctx.lineTo(c(x1), c(y1));
        ctx.stroke();
      }
    }
  } finally {
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.restore();
  }
}
function strokeShapeExactOrFast(rCtx, buildPath) {
  const { ctx, state } = rCtx;
  const scale = penScale(rCtx);
  const align = gdiStrokeAlign(state, scale);
  const aligned = shifted(buildPath, align);
  const paint = rop2Paint(state.rop2);
  if (state.penStyle !== PS_NULL2 && (isAliased(rCtx) || !paint.exact && isExactRop2Bitwise(state.rop2))) {
    const handled = paintWithRop2PerPixel(
      ctx,
      state.rop2,
      state.penColor,
      (scratch) => {
        applyGdiPenGeometry(scratch, rCtx);
        aligned(scratch);
        scratch.stroke();
      },
      penLineWidth(state, scale) / 2 + 2
    );
    if (handled) {
      return;
    }
  }
  if (align !== 0) {
    aligned(ctx);
  }
  applyPen(ctx, state);
  if (state.penStyle !== PS_NULL2) {
    applyGdiPenGeometry(ctx, rCtx);
  }
  ctx.stroke();
}
function paintGdiShape(rCtx, shape) {
  const { ctx, state } = rCtx;
  const aliased = isAliased(rCtx);
  const bitwise = !rop2Paint(state.rop2).exact && isExactRop2Bitwise(state.rop2);
  const penNull = state.penStyle === PS_NULL2;
  const cosmetic = !penNull && penIsCosmetic(rCtx);
  let rasterPath = null;
  const getPath = () => {
    rasterPath ?? (rasterPath = shape.raster());
    return rasterPath;
  };
  let canvasBuilt = false;
  const ensureCanvas = () => {
    if (!canvasBuilt) {
      shape.build(ctx);
      canvasBuilt = true;
    }
  };
  const fillRule = shape.fillRule ?? "nonzero";
  if (shape.fill && state.brushStyle !== 1) {
    const tile = realizeBrush(state).kind === "tile";
    if (aliased || tile || bitwise) {
      const paint = brushPaint(rCtx);
      if (paint) {
        let spans = fillPathSpans(getPath(), fillRule === "nonzero");
        if (shape.axisRect && shape.stroke && cosmetic) {
          spans = withoutOutline(spans, getPath());
        }
        paintSpansDeferred(rCtx, spans, paint, state.rop2);
      }
    } else {
      ensureCanvas();
      const interior = shape.axisRect && shape.stroke && !penNull ? shape.axisRect.interior : void 0;
      fillShapeExactOrFast(rCtx, shape.build, fillRule, interior);
    }
  }
  if (!shape.stroke || penNull) {
    return;
  }
  if ((cosmetic || penIsWidened(rCtx)) && (aliased || bitwise)) {
    paintRasterPath(rCtx, getPath(), { fill: false, stroke: true, style: shape.style, rectangle: shape.rectangle, roundPen: shape.roundPen });
    return;
  }
  const pattern = cosmeticPattern(rCtx);
  if (pattern && !aliased && !bitwise) {
    strokeStyledCosmetic(rCtx, getPath(), pattern, shape.style ?? { pos: 0 });
    return;
  }
  flushRasterLayer(rCtx);
  ensureCanvas();
  strokeShapeExactOrFast(rCtx, shape.build);
}
function withoutOutline(spans, path) {
  const outline = new SpanList();
  strokeCosmetic(path, outline, null, null);
  const rows = /* @__PURE__ */ new Map();
  const od = outline.data;
  for (let i = 0; i < outline.length * 3; i += 3) {
    let r = rows.get(od[i]);
    if (!r) {
      r = [];
      rows.set(od[i], r);
    }
    r.push([od[i + 1], od[i + 2]]);
  }
  const out = new SpanList();
  const d = spans.data;
  for (let i = 0; i < spans.length * 3; i += 3) {
    const y = d[i];
    const cuts = (rows.get(y) ?? []).slice().sort((a, b) => a[0] - b[0]);
    let x = d[i + 1];
    const end = d[i + 2];
    for (const [c0, c1] of cuts) {
      if (c1 <= x || c0 >= end) {
        continue;
      }
      out.add(y, x, Math.min(c0, end));
      x = Math.max(x, c1);
    }
    out.add(y, x, end);
  }
  return out;
}

// src/emf-plus-linear-ramp.ts
var GAMMA = 2.2;
function linearRampIntervals(pointCount, rect) {
  if (pointCount <= 3) {
    return 16;
  }
  const size = Math.abs(rect.w) + Math.abs(rect.h);
  if (size > 512) {
    return 256;
  }
  return size > 128 ? 64 : 16;
}
function rampPointCount(ramp) {
  if (ramp.preset) {
    return ramp.preset.positions.length;
  }
  if (ramp.blend) {
    return ramp.blend.positions.length;
  }
  return 2;
}
function piecewise(xs, ys, x) {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) {
    return x;
  }
  if (x <= xs[0]) {
    return ys[0];
  }
  for (let i = 1; i < n; i++) {
    if (x <= xs[i]) {
      const span = xs[i] - xs[i - 1];
      const f = span > 0 ? (x - xs[i - 1]) / span : 1;
      return ys[i - 1] + (ys[i] - ys[i - 1]) * f;
    }
  }
  return ys[n - 1];
}
function premultiplied(argb, gamma) {
  const a = argb >>> 24 & 255;
  const k = a / 255;
  const ch = (shift) => {
    const v = argb >>> shift & 255;
    return (gamma ? 255 * Math.pow(v / 255, GAMMA) : v) * k * (a < 255 ? 1 - 2 ** -40 : 1);
  };
  return [ch(16), ch(8), ch(0), a];
}
function mix(c0, c1, f) {
  return [
    c0[0] + (c1[0] - c0[0]) * f,
    c0[1] + (c1[1] - c0[1]) * f,
    c0[2] + (c1[2] - c0[2]) * f,
    c0[3] + (c1[3] - c0[3]) * f
  ];
}
function mixBlend(c0, c1, f) {
  const g = Math.fround(1 - f);
  const ch = (a, b) => (Math.trunc(a * 256 * g) + Math.trunc(b * 256 * f)) / 256;
  return [ch(c0[0], c1[0]), ch(c0[1], c1[1]), ch(c0[2], c1[2]), ch(c0[3], c1[3])];
}
function rampColorAt(ramp, t) {
  const gamma = ramp.gammaCorrected;
  if (ramp.preset && ramp.preset.positions.length > 0) {
    const { positions, argb } = ramp.preset;
    const n = Math.min(positions.length, argb.length);
    if (t <= positions[0] || n === 1) {
      return premultiplied(argb[0], gamma);
    }
    for (let i = 1; i < n; i++) {
      if (t <= positions[i]) {
        const span = positions[i] - positions[i - 1];
        const f = span > 0 ? (t - positions[i - 1]) / span : 1;
        return mix(premultiplied(argb[i - 1], gamma), premultiplied(argb[i], gamma), f);
      }
    }
    return premultiplied(argb[n - 1], gamma);
  }
  const start = premultiplied(ramp.startArgb, gamma);
  const end = premultiplied(ramp.endArgb, gamma);
  if (ramp.blend && !gamma) {
    return mixBlend(start, end, piecewise(ramp.blend.positions, ramp.blend.factors, t));
  }
  return mix(start, end, ramp.blend ? piecewise(ramp.blend.positions, ramp.blend.factors, t) : t);
}
function encode(v, a) {
  if (a <= 0) {
    return 0;
  }
  const k = a / 255;
  const linear = Math.round(Math.min(1, Math.max(0, v / k / 255)) * 1023) / 1023;
  return 255 * Math.pow(linear, 1 / GAMMA) * k;
}
function buildLinearRampTable(ramp, rect) {
  const intervals = linearRampIntervals(rampPointCount(ramp), rect);
  const knots = new Uint8Array((intervals + 1) * 4);
  for (let k = 0; k <= intervals; k++) {
    const c = rampColorAt(ramp, k / intervals);
    const o = k * 4;
    for (let ch = 0; ch < 3; ch++) {
      const v = ramp.gammaCorrected ? encode(c[ch], c[3]) : c[ch];
      knots[o + ch] = Math.min(255, Math.max(0, Math.floor(v + 0.5)));
    }
    knots[o + 3] = Math.min(255, Math.max(0, Math.floor(c[3] + 0.5)));
  }
  return { intervals, knots };
}
function linearRampOf(grad) {
  if (grad.ramp) {
    return grad.ramp;
  }
  const s = grad.stops;
  if (s.length === 2 && s[0].offset === 0 && s[1].offset === 1 && s[0].argb !== void 0 && s[1].argb !== void 0) {
    return { startArgb: s[0].argb, endArgb: s[1].argb, preset: null, blend: null, gammaCorrected: false };
  }
  return null;
}
function knotArgb(table, k) {
  const o = k * 4;
  const a = table.knots[o + 3];
  if (a === 0) {
    return 0;
  }
  const un = (v) => Math.min(255, Math.round(v * 255 / a));
  return (a << 24 | un(table.knots[o]) << 16 | un(table.knots[o + 1]) << 8 | un(table.knots[o + 2])) >>> 0;
}
function linearRampStops(table) {
  const stops = [];
  for (let k = 0; k <= table.intervals; k++) {
    const argb = knotArgb(table, k);
    const a = (argb >>> 24 & 255) / 255;
    stops.push({
      offset: k / table.intervals,
      color: `rgba(${argb >>> 16 & 255},${argb >>> 8 & 255},${argb & 255},${Number(a.toFixed(4))})`,
      argb
    });
  }
  return stops;
}
var FIX_ONE = 65536;
function foldRampCoordinate(u, intervals, wrap) {
  const period = (wrap === "tile-flip-x" || wrap === "tile-flip-xy" ? 2 : 1) * intervals * FIX_ONE;
  return (u % period + period) % period;
}
function writeRampColor(table, u, out, o) {
  const n = table.intervals;
  const k = Math.floor(u / FIX_ONE);
  const f = Math.floor(u / 256) & 255;
  const j0 = k <= n ? k : 2 * n - k;
  const j1 = k + 1 <= n ? k + 1 : Math.max(0, 2 * n - k - 1);
  const kn = table.knots;
  const i0 = Math.min(n, j0) * 4;
  const i1 = Math.min(n, j1) * 4;
  const a = kn[i0 + 3] * (256 - f) + kn[i1 + 3] * f + 128 >> 8;
  if (a === 0) {
    return;
  }
  for (let ch = 0; ch < 3; ch++) {
    const p = kn[i0 + ch] * (256 - f) + kn[i1 + ch] * f + 128 >> 8;
    out[o + ch] = a === 255 ? p : Math.round(p * 255 / a);
  }
  out[o + 3] = a;
}
function linearRampSampler(grad, device, halfPixel2) {
  const rect = grad.rect;
  const ramp = linearRampOf(grad);
  if (!rect || !ramp || !(Math.abs(rect.w) > 1e-9)) {
    return null;
  }
  const b = grad.transform ?? [1, 0, 0, 1, 0, 0];
  const full = [
    device[0] * b[0] + device[2] * b[1],
    device[1] * b[0] + device[3] * b[1],
    device[0] * b[2] + device[2] * b[3],
    device[1] * b[2] + device[3] * b[3],
    device[0] * b[4] + device[2] * b[5] + device[4],
    device[1] * b[4] + device[3] * b[5] + device[5]
  ];
  const det = full[0] * full[3] - full[1] * full[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return null;
  }
  const ia = full[3] / det;
  const ic = -full[2] / det;
  const ie = -(ia * full[4] + ic * full[5]);
  const table = buildLinearRampTable(ramp, rect);
  const n = table.intervals;
  const scale = n / rect.w;
  const off = halfPixel2 ? 0.5 : 0;
  const du = Math.round(ia * scale * FIX_ONE);
  const dv = Math.round(ic * scale * FIX_ONE);
  const u00 = Math.round((ia * off + ic * off + ie - rect.x) * scale * FIX_ONE);
  return (x0, y0, w, h, out) => {
    for (let j = 0; j < h; j++) {
      let u = u00 + x0 * du + (y0 + j) * dv;
      for (let i = 0; i < w; i++, u += du) {
        writeRampColor(table, foldRampCoordinate(u, n, grad.wrapMode), out, (j * w + i) * 4);
      }
    }
  };
}

// src/emf-plus-brush-gradient.ts
var IDENTITY2 = [1, 0, 0, 1, 0, 0];
function mulMatrix(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5]
  ];
}
function invertLinear(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return null;
  }
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det];
}
function lerpArgb2(a, b, t) {
  const ch = (shift) => {
    const ca = a >>> shift & 255;
    const cb = b >>> shift & 255;
    return Math.round(ca + (cb - ca) * t);
  };
  return (ch(24) << 24 | ch(16) << 16 | ch(8) << 8 | ch(0)) >>> 0;
}
function piecewise2(xs, ys, x) {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) {
    return x;
  }
  if (x <= xs[0]) {
    return ys[0];
  }
  for (let i = 1; i < n; i++) {
    if (x <= xs[i]) {
      const span = xs[i] - xs[i - 1];
      const f = span > 0 ? (x - xs[i - 1]) / span : 1;
      return ys[i - 1] + (ys[i] - ys[i - 1]) * f;
    }
  }
  return ys[n - 1];
}
function stopColorAt(stops, t) {
  if (stops.length === 0 || stops.some((s) => s.argb === void 0)) {
    return null;
  }
  if (t <= stops[0].offset) {
    return stops[0].argb;
  }
  for (let i = 1; i < stops.length; i++) {
    const b = stops[i];
    if (t <= b.offset) {
      const a = stops[i - 1];
      const span = b.offset - a.offset;
      return lerpArgb2(a.argb, b.argb, span > 0 ? (t - a.offset) / span : 1);
    }
  }
  return stops[stops.length - 1].argb;
}
function pathGradientColorAt(shape, x, y) {
  const { center, boundary, boundaryArgb } = shape;
  const n = boundary.length;
  const px = x - center.x;
  const py = y - center.y;
  let found = -1;
  let bestS = 0;
  let bestU = 0;
  const eps = 1e-9;
  for (let i = 0; i < n; i++) {
    const v0 = boundary[i];
    const v1 = boundary[(i + 1) % n];
    const ax = v0.x - center.x;
    const ay = v0.y - center.y;
    const ex = v1.x - v0.x;
    const ey = v1.y - v0.y;
    const det = ax * ey - ay * ex;
    if (Math.abs(det) < 1e-12) {
      continue;
    }
    const alpha = (px * ey - py * ex) / det;
    const beta = (ax * py - ay * px) / det;
    if (alpha < -eps || beta < -eps || beta > alpha + eps || alpha > 1 + eps) {
      continue;
    }
    found = i;
    bestS = Math.max(0, alpha);
    bestU = alpha > 0 ? Math.min(1, Math.max(0, beta / alpha)) : 0;
  }
  if (found < 0) {
    return null;
  }
  let s = bestS;
  if (shape.focus) {
    const f = Math.min(0.999, Math.max(0, (shape.focus.x + shape.focus.y) / 2));
    s = s <= f ? 0 : (s - f) / (1 - f);
  }
  const pos = 1 - s;
  if (shape.preset && shape.preset.positions.length > 0) {
    const { positions, argb } = shape.preset;
    if (pos <= positions[0]) {
      return argb[0];
    }
    for (let k = 1; k < positions.length; k++) {
      if (pos <= positions[k]) {
        const span = positions[k] - positions[k - 1];
        return lerpArgb2(argb[k - 1], argb[k], span > 0 ? (pos - positions[k - 1]) / span : 1);
      }
    }
    return argb[positions.length - 1];
  }
  const c0 = boundaryArgb[found] ?? shape.centerArgb;
  const c1 = boundaryArgb[(found + 1) % n] ?? c0;
  const surround = lerpArgb2(c0, c1, bestU);
  const factor = shape.blend ? piecewise2(shape.blend.positions, shape.blend.factors, pos) : pos;
  return lerpArgb2(surround, shape.centerArgb, Math.min(1, Math.max(0, factor)));
}
var MAX_TILE = 2048;
function mirrorFlags(wrap) {
  return {
    x: wrap === "tile-flip-x" || wrap === "tile-flip-xy",
    y: wrap === "tile-flip-y" || wrap === "tile-flip-xy"
  };
}
function buildPattern(ctx, rect, tw, th, wrap, brush, delta, sampling, colorAt) {
  if (typeof ctx.createPattern !== "function") {
    return null;
  }
  const mirror2 = wrap === "clamp" ? { x: false, y: false } : mirrorFlags(wrap);
  const w = tw * (mirror2.x ? 2 : 1);
  const h = th * (mirror2.y ? 2 : 1);
  const temp = createTempCanvas(w, h);
  if (!temp) {
    return null;
  }
  const stepX = rect.w / tw;
  const stepY = rect.h / th;
  const offX = (i) => {
    const d = i % tw * stepX + (0.5 + sampling.phaseX) * stepX;
    return i < tw ? d : rect.w - sampling.lagX - (d - (0.5 + sampling.phaseX) * stepX) - 0.5 * stepX;
  };
  const offY = (j) => {
    const d = (j % th + 0.5) * stepY;
    return j < th ? d : rect.h - sampling.lagY - d;
  };
  const data = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++) {
    const by = rect.y + offY(j);
    for (let i = 0; i < w; i++) {
      const c = colorAt(rect.x + offX(i), by);
      if (c === null) {
        continue;
      }
      const o = (j * w + i) * 4;
      data[o] = c >>> 16 & 255;
      data[o + 1] = c >>> 8 & 255;
      data[o + 2] = c & 255;
      data[o + 3] = c >>> 24 & 255;
    }
  }
  canvasPutImageData(temp.ctx, createImageDataCompat(data, w, h), 0, 0);
  const pattern = canvasCreatePattern(ctx, temp.canvas, wrap === "clamp" ? "no-repeat" : "repeat");
  if (!pattern || typeof pattern.setTransform !== "function") {
    return null;
  }
  const place = [stepX, 0, 0, stepY, rect.x + sampling.phaseX * stepX, rect.y];
  const m = mulMatrix([1, 0, 0, 1, delta.x, delta.y], mulMatrix(brush, place));
  try {
    pattern.setTransform({ a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] });
  } catch {
    return null;
  }
  return pattern;
}
function halfPixelDelta(device) {
  const inv2 = invertLinear(device);
  if (!inv2) {
    return { x: 0, y: 0 };
  }
  return { x: inv2[0] * 0.5 + inv2[2] * 0.5, y: inv2[1] * 0.5 + inv2[3] * 0.5 };
}
var SUPERSAMPLE = 4;
function texelsFor(full, axis, length) {
  const scale = axis === "x" ? Math.hypot(full[0], full[1]) : Math.hypot(full[2], full[3]);
  return Math.max(2, Math.min(MAX_TILE, Math.ceil(Math.abs(length) * scale * SUPERSAMPLE)));
}
function linearGradientEndpoints(rect, transform) {
  const m = transform ?? IDENTITY2;
  const map = (x, y) => ({
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5]
  });
  const p1 = map(rect.x, rect.y + rect.h / 2);
  const pe = map(rect.x + rect.w, rect.y + rect.h / 2);
  const nx = m[3];
  const ny = -m[2];
  const nn = nx * nx + ny * ny;
  if (nn < 1e-12) {
    return { x1: p1.x, y1: p1.y, x2: pe.x, y2: pe.y };
  }
  const t = ((pe.x - p1.x) * nx + (pe.y - p1.y) * ny) / nn;
  return { x1: p1.x, y1: p1.y, x2: p1.x + nx * t, y2: p1.y + ny * t };
}
function plainLinear(ctx, grad) {
  if (typeof ctx.createLinearGradient !== "function") {
    return null;
  }
  const pts = grad.rect ? linearGradientEndpoints(grad.rect, grad.transform) : grad;
  if (pts.x1 === pts.x2 && pts.y1 === pts.y2) {
    return null;
  }
  const g = ctx.createLinearGradient(pts.x1, pts.y1, pts.x2, pts.y2);
  for (const stop of grad.stops) {
    g.addColorStop(stop.offset, stop.color);
  }
  return g;
}
var SEAM_BIAS = 1e-5;
var MAX_PERIODS = 2048;
function surfaceSize2(ctx) {
  const canvas = ctx.canvas;
  const w = canvas?.width;
  const h = canvas?.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}
function tiledLinear(ctx, grad, rect, device) {
  const size = surfaceSize2(ctx);
  const inv2 = invertLinear(device);
  if (!size || !inv2 || typeof ctx.createLinearGradient !== "function") {
    return null;
  }
  const e = linearGradientEndpoints(rect, grad.transform);
  const delta = halfPixelDelta(device);
  const dx = e.x2 - e.x1;
  const dy = e.y2 - e.y1;
  const x1 = e.x1 + delta.x + dx * SEAM_BIAS;
  const y1 = e.y1 + delta.y + dy * SEAM_BIAS;
  const len2 = dx * dx + dy * dy;
  if (!(len2 > 1e-12)) {
    return null;
  }
  let tMin = Infinity;
  let tMax = -Infinity;
  for (const [cx, cy] of [
    [0, 0],
    [size.w, 0],
    [0, size.h],
    [size.w, size.h]
  ]) {
    const px = cx - device[4];
    const py = cy - device[5];
    const wx = inv2[0] * px + inv2[2] * py;
    const wy = inv2[1] * px + inv2[3] * py;
    const t = ((wx - x1) * dx + (wy - y1) * dy) / len2;
    tMin = Math.min(tMin, t);
    tMax = Math.max(tMax, t);
  }
  const k0 = Math.floor(tMin);
  const k1 = Math.max(k0 + 1, Math.ceil(tMax));
  if (k1 - k0 > MAX_PERIODS) {
    return null;
  }
  const g = ctx.createLinearGradient(x1 + dx * k0, y1 + dy * k0, x1 + dx * k1, y1 + dy * k1);
  const span = k1 - k0;
  const mirrorX = mirrorFlags(grad.wrapMode).x;
  const reversed = [...grad.stops].reverse();
  for (let k = k0; k < k1; k++) {
    const mirrored = mirrorX && (k % 2 + 2) % 2 === 1;
    for (const stop of mirrored ? reversed : grad.stops) {
      const local = mirrored ? 1 - stop.offset : stop.offset;
      g.addColorStop(Math.min(1, Math.max(0, (k - k0 + local) / span)), stop.color);
    }
  }
  return g;
}
function effectiveLinearStops(grad) {
  const ramp = grad.rect ? linearRampOf(grad) : null;
  return ramp && grad.rect ? linearRampStops(buildLinearRampTable(ramp, grad.rect)) : grad.stops;
}
function linearPaint(ctx, recorded, device) {
  const grad = { ...recorded, stops: effectiveLinearStops(recorded) };
  const rect = grad.rect;
  if (grad.wrapMode !== "clamp" && rect && rect.w !== 0) {
    const unrolled = tiledLinear(ctx, grad, rect, device);
    if (unrolled) {
      return unrolled;
    }
    if (stopColorAt(grad.stops, 0) !== null) {
      const brush = grad.transform ?? IDENTITY2;
      const tw = texelsFor(mulMatrix(device, brush), "x", rect.w);
      const pattern = buildPattern(
        ctx,
        rect,
        tw,
        1,
        grad.wrapMode,
        brush,
        halfPixelDelta(device),
        { phaseX: 0.5, lagX: 0, lagY: 0 },
        (bx) => stopColorAt(grad.stops, (bx - rect.x) / rect.w)
      );
      if (pattern) {
        return pattern;
      }
    }
  }
  return plainLinear(ctx, grad);
}
function boundaryBox(points) {
  if (points.length < 3) {
    return null;
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}
function pathPaint(ctx, shape, wrap, device) {
  const box = boundaryBox(shape.boundary);
  if (!box) {
    return null;
  }
  const brush = shape.transform ?? IDENTITY2;
  const full = mulMatrix(device, brush);
  const pxX = Math.hypot(full[0], full[1]);
  const pxY = Math.hypot(full[2], full[3]);
  return buildPattern(
    ctx,
    box,
    texelsFor(full, "x", box.w),
    texelsFor(full, "y", box.h),
    wrap,
    brush,
    halfPixelDelta(device),
    { phaseX: 0, lagX: pxX > 0 ? 1 / pxX : 0, lagY: pxY > 0 ? 1 / pxY : 0 },
    (bx, by) => pathGradientColorAt(shape, bx, by)
  );
}
function radialFallback(ctx, grad) {
  if (!(grad.r > 0) || typeof ctx.createRadialGradient !== "function") {
    return null;
  }
  const g = ctx.createRadialGradient(grad.cx, grad.cy, 0, grad.cx, grad.cy, grad.r);
  for (const stop of grad.stops) {
    g.addColorStop(stop.offset, stop.color);
  }
  return g;
}
function createBrushGradient(ctx, grad, device = IDENTITY2) {
  try {
    if (grad.type === "linear") {
      return linearPaint(ctx, grad, device);
    }
    if (grad.shape) {
      const pattern = pathPaint(ctx, grad.shape, grad.wrapMode, device);
      if (pattern) {
        return pattern;
      }
      emfLog("createBrushGradient: path gradient pattern unavailable, using the radial approximation");
    }
    return radialFallback(ctx, grad);
  } catch {
    return null;
  }
}

// src/emf-plus-brush-hatch.ts
var HATCH_PATTERNS = [
  [255, 0, 0, 0, 0, 0, 0, 0],
  [128, 128, 128, 128, 128, 128, 128, 128],
  [128, 64, 32, 16, 8, 4, 2, 1],
  [1, 2, 4, 8, 16, 32, 64, 128],
  [255, 128, 128, 128, 128, 128, 128, 128],
  [129, 66, 36, 24, 24, 36, 66, 129],
  [128, 0, 0, 0, 8, 0, 0, 0],
  [128, 0, 8, 0, 128, 0, 8, 0],
  [136, 0, 34, 0, 136, 0, 34, 0],
  [136, 34, 136, 34, 136, 34, 136, 34],
  [170, 68, 170, 17, 170, 68, 170, 17],
  [170, 85, 170, 81, 170, 85, 170, 21],
  [170, 85, 170, 85, 170, 85, 170, 85],
  [238, 85, 187, 85, 238, 85, 187, 85],
  [119, 221, 119, 221, 119, 221, 119, 221],
  [119, 255, 221, 255, 119, 255, 221, 255],
  [239, 255, 254, 255, 239, 255, 254, 255],
  [255, 255, 255, 247, 255, 255, 255, 127],
  [136, 68, 34, 17, 136, 68, 34, 17],
  [17, 34, 68, 136, 17, 34, 68, 136],
  [204, 102, 51, 153, 204, 102, 51, 153],
  [51, 102, 204, 153, 51, 102, 204, 153],
  [193, 224, 112, 56, 28, 14, 7, 131],
  [131, 7, 14, 28, 56, 112, 224, 193],
  [136, 136, 136, 136, 136, 136, 136, 136],
  [255, 0, 0, 0, 255, 0, 0, 0],
  [85, 85, 85, 85, 85, 85, 85, 85],
  [255, 0, 255, 0, 255, 0, 255, 0],
  [204, 204, 204, 204, 204, 204, 204, 204],
  [255, 255, 0, 0, 255, 255, 0, 0],
  [0, 0, 136, 68, 34, 17, 0, 0],
  [0, 0, 17, 34, 68, 136, 0, 0],
  [240, 0, 0, 0, 15, 0, 0, 0],
  [128, 128, 128, 128, 8, 8, 8, 8],
  [128, 8, 64, 2, 16, 1, 32, 4],
  [177, 48, 3, 27, 216, 192, 12, 141],
  [129, 66, 36, 24, 129, 66, 36, 24],
  [0, 24, 37, 192, 0, 24, 37, 192],
  [1, 2, 4, 8, 24, 36, 66, 129],
  [255, 128, 128, 128, 255, 8, 8, 8],
  [136, 84, 34, 69, 136, 20, 34, 81],
  [170, 85, 170, 85, 240, 240, 240, 240],
  [0, 16, 8, 16, 0, 128, 1, 128],
  [170, 0, 128, 0, 128, 0, 128, 0],
  [128, 0, 34, 0, 8, 0, 34, 0],
  [3, 132, 72, 48, 12, 2, 1, 1],
  [255, 102, 255, 153, 255, 102, 255, 153],
  [119, 137, 143, 143, 119, 152, 248, 248],
  [255, 136, 136, 136, 255, 136, 136, 136],
  [153, 102, 102, 153, 153, 102, 102, 153],
  [240, 240, 240, 240, 15, 15, 15, 15],
  [130, 68, 40, 16, 40, 68, 130, 1],
  [16, 56, 124, 254, 124, 56, 16, 0]
];
var LINE_WEIGHT = 234;
var EDGE_WEIGHT = 64;
function hatchWeight(style, i, j) {
  const forward = () => {
    const d = ((i - j) % 8 + 8) % 8;
    return d === 0 ? LINE_WEIGHT : d === 1 || d === 7 ? EDGE_WEIGHT : 0;
  };
  const backward = () => {
    const d = ((i + j - 7) % 8 + 8) % 8;
    return d === 0 ? LINE_WEIGHT : d === 1 || d === 7 ? EDGE_WEIGHT : 0;
  };
  switch (style) {
    case 2:
      return forward();
    case 3:
      return backward();
    case 5:
      return Math.max(forward(), backward());
    default: {
      const rows = HATCH_PATTERNS[style];
      return rows && rows[j] & 128 >> i ? 256 : 0;
    }
  }
}
function hatchMix(fore, back, w) {
  if (w >= 256) {
    return fore >>> 0;
  }
  if (w <= 0) {
    return back >>> 0;
  }
  const fa = fore >>> 24 & 255;
  const ba = back >>> 24 & 255;
  const a = fa * w + ba * (256 - w) >> 8;
  if (a === 0) {
    return 0;
  }
  let out = a << 24;
  for (const shift of [16, 8, 0]) {
    const fp = Math.round((fore >>> shift & 255) * fa / 255);
    const bp = Math.round((back >>> shift & 255) * ba / 255);
    const p = fp * w + bp * (256 - w) >> 8;
    out |= Math.min(255, Math.round(p * 255 / a)) << shift;
  }
  return out >>> 0;
}
function hatchTile(hatch) {
  const out = new Uint8ClampedArray(8 * 8 * 4);
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      const c = hatchMix(hatch.fore, hatch.back, hatchWeight(hatch.style, i, j));
      const o = (j * 8 + i) * 4;
      out[o] = c >>> 16 & 255;
      out[o + 1] = c >>> 8 & 255;
      out[o + 2] = c & 255;
      out[o + 3] = c >>> 24 & 255;
    }
  }
  return out;
}
function hatchSampler(hatch, origin, canvasToDevice) {
  const tile = hatchTile(hatch);
  const m = canvasToDevice;
  return (x0, y0, w, h, out) => {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cx = x0 + i + 0.5;
        const cy = y0 + j + 0.5;
        const dx = Math.floor(m[0] * cx + m[2] * cy + m[4]);
        const dy = Math.floor(m[1] * cx + m[3] * cy + m[5]);
        const ti = ((dx - origin.x) % 8 + 8) % 8 + ((dy - origin.y) % 8 + 8) % 8 * 8;
        const o = (j * w + i) * 4;
        out[o] = tile[ti * 4];
        out[o + 1] = tile[ti * 4 + 1];
        out[o + 2] = tile[ti * 4 + 2];
        out[o + 3] = tile[ti * 4 + 3];
      }
    }
  };
}
function createHatchPattern(ctx, hatch, origin, user, deviceToCanvas) {
  if (typeof ctx.createPattern !== "function") {
    return null;
  }
  const temp = createTempCanvas(8, 8);
  if (!temp) {
    return null;
  }
  canvasPutImageData(temp.ctx, createImageDataCompat(hatchTile(hatch), 8, 8), 0, 0);
  const pattern = canvasCreatePattern(ctx, temp.canvas, "repeat");
  if (!pattern || typeof pattern.setTransform !== "function") {
    return pattern;
  }
  const det = user[0] * user[3] - user[1] * user[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return pattern;
  }
  const inv2 = [
    user[3] / det,
    -user[1] / det,
    -user[2] / det,
    user[0] / det,
    (user[2] * user[5] - user[3] * user[4]) / det,
    (user[1] * user[4] - user[0] * user[5]) / det
  ];
  const d = deviceToCanvas;
  const toCanvas = [d[0], d[1], d[2], d[3], d[0] * origin.x + d[2] * origin.y + d[4], d[1] * origin.x + d[3] * origin.y + d[5]];
  const m = [
    inv2[0] * toCanvas[0] + inv2[2] * toCanvas[1],
    inv2[1] * toCanvas[0] + inv2[3] * toCanvas[1],
    inv2[0] * toCanvas[2] + inv2[2] * toCanvas[3],
    inv2[1] * toCanvas[2] + inv2[3] * toCanvas[3],
    inv2[0] * toCanvas[4] + inv2[2] * toCanvas[5] + inv2[4],
    inv2[1] * toCanvas[4] + inv2[3] * toCanvas[5] + inv2[5]
  ];
  try {
    pattern.setTransform({ a: m[0], b: m[1], c: m[2], d: m[3], e: m[4], f: m[5] });
  } catch {
  }
  return pattern;
}

// src/emf-plus-brush-texture.ts
function wrapTexel(i, n, mirror2) {
  if (!mirror2) {
    return (i % n + n) % n;
  }
  const p = (i % (2 * n) + 2 * n) % (2 * n);
  return p < n ? p : 2 * n - 1 - p;
}
function writeTextureColor(inv2, width, height, rgba, wrap, halfPixel2, dx, dy, out, o) {
  const off = halfPixel2 ? 0.5 : 0;
  const px = dx + off;
  const py = dy + off;
  const cu = inv2[0] * px + inv2[2] * py + inv2[4] - off;
  const cv = inv2[1] * px + inv2[3] * py + inv2[5] - off;
  const iu = Math.floor(cu + 1e-9);
  const iv = Math.floor(cv + 1e-9);
  const fu = Math.max(0, cu - iu);
  const fv = Math.max(0, cv - iv);
  const clamp2 = wrap === "clamp";
  const mirrorX = wrap === "tile-flip-x" || wrap === "tile-flip-xy";
  const mirrorY = wrap === "tile-flip-y" || wrap === "tile-flip-xy";
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  for (let k = 0; k < 4; k++) {
    const tu = iu + (k & 1);
    const tv = iv + (k >> 1);
    const w = (k & 1 ? fu : 1 - fu) * (k >> 1 ? fv : 1 - fv);
    if (w <= 0) {
      continue;
    }
    let x;
    let y;
    if (clamp2) {
      if (tu < 0 || tv < 0 || tu >= width || tv >= height) {
        continue;
      }
      x = tu;
      y = tv;
    } else {
      x = wrapTexel(tu, width, mirrorX);
      y = wrapTexel(tv, height, mirrorY);
    }
    const s = (y * width + x) * 4;
    const wa = w * rgba[s + 3];
    r += wa * rgba[s];
    g += wa * rgba[s + 1];
    b += wa * rgba[s + 2];
    a += wa;
  }
  if (a <= 0) {
    return;
  }
  out[o] = r / a;
  out[o + 1] = g / a;
  out[o + 2] = b / a;
  out[o + 3] = a;
}
var IDENTITY3 = [1, 0, 0, 1, 0, 0];
function packArgb(rgba, i) {
  return (rgba[i + 3] << 24 | rgba[i] << 16 | rgba[i + 1] << 8 | rgba[i + 2]) >>> 0;
}
function createBrushTexture(ctx, texture, device = IDENTITY3) {
  const { width, height, rgba } = texture;
  if (width <= 0 || height <= 0) {
    return null;
  }
  try {
    const brush = texture.transform ?? IDENTITY3;
    const colorAt = (bx, by) => {
      const ix = Math.floor(bx);
      const iy = Math.floor(by);
      if (ix < 0 || iy < 0 || ix >= width || iy >= height) {
        return null;
      }
      return packArgb(rgba, (iy * width + ix) * 4);
    };
    return buildPattern(
      ctx,
      { x: 0, y: 0, w: width, h: height },
      width,
      height,
      texture.wrapMode,
      brush,
      halfPixelDelta(device),
      { phaseX: 0, lagX: 0, lagY: 0 },
      colorAt
    );
  } catch {
    return null;
  }
}

// src/emf-clip-region.ts
var CLIP_HUGE = 1 << 24;
function rectClipShape(x, y, w, h) {
  return { cmds: [{ op: "rect", x, y, w, h }], fillRule: "nonzero", simple: true };
}
function rectsClipShape(rects) {
  return {
    cmds: rects.map((r) => ({ op: "rect", x: r.x, y: r.y, w: r.w, h: r.h })),
    fillRule: "nonzero",
    simple: true
  };
}
function emptyClipShape() {
  return { cmds: [{ op: "rect", x: 0, y: 0, w: 0, h: 0 }], fillRule: "nonzero", simple: true };
}
function translateClipShape(shape, dx, dy) {
  return {
    ...shape,
    cmds: shape.cmds.map((c) => {
      switch (c.op) {
        case "rect":
          return { ...c, x: c.x + dx, y: c.y + dy };
        case "moveTo":
        case "lineTo":
          return { ...c, x: c.x + dx, y: c.y + dy };
        case "bezierCurveTo":
          return {
            ...c,
            cp1x: c.cp1x + dx,
            cp1y: c.cp1y + dy,
            cp2x: c.cp2x + dx,
            cp2y: c.cp2y + dy,
            x: c.x + dx,
            y: c.y + dy
          };
        case "arcTo":
          return { ...c, x1: c.x1 + dx, y1: c.y1 + dy, x2: c.x2 + dx, y2: c.y2 + dy };
        case "ellipse":
          return { ...c, cx: c.cx + dx, cy: c.cy + dy };
        case "closePath":
          return c;
      }
    })
  };
}
function translateClipRegion(region, dx, dy) {
  if (!region) {
    return null;
  }
  return region.map((s) => translateClipShape(s, dx, dy));
}
function isComposable(shape) {
  return shape.simple && shape.fillRule === "nonzero";
}
function isParity(shape) {
  return shape.fillRule === "evenodd" || isComposable(shape);
}
function figureOrientation(shape) {
  let o = 0;
  for (const poly of flattenClipCmds(shape.cmds)) {
    let area2 = 0;
    const n = poly.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area2 += poly[2 * i] * poly[2 * j + 1] - poly[2 * j] * poly[2 * i + 1];
    }
    const s = Math.abs(area2) < 1e-9 ? 0 : Math.sign(area2);
    if (s === 0) {
      continue;
    }
    if (o !== 0 && s !== o) {
      return NaN;
    }
    o = s;
  }
  return o;
}
function canConcatUnion(a, b) {
  if (!isComposable(a) || !isComposable(b)) {
    return false;
  }
  const oa = figureOrientation(a);
  const ob = figureOrientation(b);
  return !Number.isNaN(oa) && !Number.isNaN(ob) && (oa === 0 || ob === 0 || oa === ob);
}
function invertClipShape(shape) {
  return {
    cmds: [
      { op: "rect", x: -CLIP_HUGE, y: -CLIP_HUGE, w: 2 * CLIP_HUGE, h: 2 * CLIP_HUGE },
      ...shape.cmds
    ],
    fillRule: "evenodd",
    simple: false
  };
}
var FAR_PROBE = { x: 1 << 23, y: 1 << 23, w: 1, h: 1 };
function scanlineCombine(current, incoming, op, domain) {
  const dom = domain ?? deriveClipDomain(current, incoming);
  const rects = scanlineCombineRegions(current, incoming, op, dom);
  let exact = !isDomainTruncated(dom);
  if (!domain && scanlineCombineRegions(current, incoming, op, FAR_PROBE).length > 0) {
    exact = false;
  }
  return { region: [rects.length > 0 ? rectsClipShape(rects) : emptyClipShape()], exact };
}
function combineClip(current, shape, op, domain) {
  switch (op) {
    case "replace":
      return { region: [shape], exact: true };
    case "intersect":
      return { region: current ? [...current, shape] : [shape], exact: true };
    case "exclude": {
      if (isParity(shape)) {
        const inv2 = invertClipShape(shape);
        return { region: current ? [...current, inv2] : [inv2], exact: true };
      }
      return scanlineCombine(current, [shape], op, domain);
    }
    case "union": {
      if (!current) {
        return { region: null, exact: true };
      }
      if (current.length === 1 && canConcatUnion(current[0], shape)) {
        return {
          region: [
            { cmds: [...current[0].cmds, ...shape.cmds], fillRule: "nonzero", simple: false }
          ],
          exact: true
        };
      }
      return scanlineCombine(current, [shape], op, domain);
    }
    case "xor": {
      if (!current) {
        if (isParity(shape)) {
          return { region: [invertClipShape(shape)], exact: true };
        }
        return scanlineCombine(current, [shape], op, domain);
      }
      if (current.length === 1 && isParity(current[0]) && isParity(shape)) {
        return {
          region: [
            { cmds: [...current[0].cmds, ...shape.cmds], fillRule: "evenodd", simple: false }
          ],
          exact: true
        };
      }
      return scanlineCombine(current, [shape], op, domain);
    }
    case "complement": {
      if (!current) {
        return { region: [emptyClipShape()], exact: true };
      }
      if (current.length === 1 && isParity(current[0])) {
        return { region: [shape, invertClipShape(current[0])], exact: true };
      }
      return scanlineCombine(current, [shape], op, domain);
    }
  }
}
function combineClipRegions(current, incoming, op, domain) {
  if (op === "replace") {
    return { region: incoming, exact: true };
  }
  if (incoming && incoming.length === 1) {
    return combineClip(current, incoming[0], op, domain);
  }
  if (!incoming) {
    switch (op) {
      case "intersect":
        return { region: current, exact: true };
      case "union":
        return { region: null, exact: true };
      case "exclude":
        return { region: [emptyClipShape()], exact: true };
      case "xor":
      case "complement": {
        if (!current) {
          return { region: [emptyClipShape()], exact: true };
        }
        if (current.length === 1 && isParity(current[0])) {
          return { region: [invertClipShape(current[0])], exact: true };
        }
        return scanlineCombine(current, incoming, op, domain);
      }
    }
  }
  switch (op) {
    case "intersect":
      return { region: current ? [...current, ...incoming] : incoming, exact: true };
    case "union":
      if (!current) {
        return { region: null, exact: true };
      }
      return scanlineCombine(current, incoming, op, domain);
    case "complement": {
      if (!current) {
        return { region: [emptyClipShape()], exact: true };
      }
      if (current.length === 1 && isParity(current[0])) {
        return { region: [...incoming, invertClipShape(current[0])], exact: true };
      }
      return scanlineCombine(current, incoming, op, domain);
    }
    case "xor":
    case "exclude":
      return scanlineCombine(current, incoming, op, domain);
  }
}
function replayClipCmds(ctx, cmds) {
  for (const c of cmds) {
    switch (c.op) {
      case "rect":
        ctx.rect(c.x, c.y, c.w, c.h);
        break;
      case "moveTo":
        ctx.moveTo(c.x, c.y);
        break;
      case "lineTo":
        ctx.lineTo(c.x, c.y);
        break;
      case "bezierCurveTo":
        ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.x, c.y);
        break;
      case "arcTo":
        ctx.arcTo(c.x1, c.y1, c.x2, c.y2, c.radius);
        break;
      case "ellipse":
        ctx.ellipse(c.cx, c.cy, c.rx, c.ry, c.rotation, c.startAngle, c.endAngle, c.ccw);
        break;
      case "closePath":
        ctx.closePath();
        break;
    }
  }
}
function applyClipShapes(ctx, shapes) {
  for (const s of shapes) {
    ctx.beginPath();
    replayClipCmds(ctx, s.cmds);
    try {
      ctx.clip(s.fillRule);
    } catch {
    }
  }
}
function reapplyClipRegion(holder, region, identityTransform = false) {
  const { ctx } = holder;
  while (holder.clipSaveDepth > 0) {
    ctx.restore();
    holder.clipSaveDepth--;
  }
  if (region) {
    ctx.save();
    holder.clipSaveDepth = 1;
    if (identityTransform) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    applyClipShapes(ctx, region);
  }
}

// src/emf-plus-state-handlers.ts
function multiplyMatrix2(m1, m2) {
  return [
    m1[0] * m2[0] + m1[1] * m2[2],
    m1[0] * m2[1] + m1[1] * m2[3],
    m1[2] * m2[0] + m1[3] * m2[2],
    m1[2] * m2[1] + m1[3] * m2[3],
    m1[4] * m2[0] + m1[5] * m2[2] + m2[4],
    m1[4] * m2[1] + m1[5] * m2[3] + m2[5]
  ];
}
function resolveBrushPaint(rCtx, flags, brushIdOrColor) {
  if (flags & 32768) {
    return argbToRgba(brushIdOrColor);
  }
  const obj = rCtx.objectTable.get(brushIdOrColor & 255);
  if (obj && obj.kind === "plus-brush") {
    return brushPaint2(rCtx, obj);
  }
  return "rgba(0,0,0,1)";
}
function brushPaint2(rCtx, obj) {
  if (obj.gradient) {
    const g = createBrushGradient(rCtx.ctx, obj.gradient, plusWorldMatrix(rCtx));
    if (g) {
      return g;
    }
  }
  if (obj.texture) {
    const p = createBrushTexture(rCtx.ctx, obj.texture, plusWorldMatrix(rCtx));
    if (p) {
      return p;
    }
  }
  if (obj.hatch) {
    const p = createHatchPattern(
      rCtx.ctx,
      obj.hatch,
      rCtx.ext?.renderingOrigin ?? { x: 0, y: 0 },
      plusWorldMatrix(rCtx),
      deviceToCanvasMatrix(rCtx)
    );
    if (p) {
      return p;
    }
  }
  return obj.color;
}
function getPageUnitMultiplier(pageUnit, pageScale) {
  const DPI = 96;
  let unitToPixel;
  switch (pageUnit) {
    case 3:
      unitToPixel = DPI / 72;
      break;
    // Point
    case 4:
      unitToPixel = DPI;
      break;
    // Inch
    case 5:
      unitToPixel = DPI / 300;
      break;
    // Document
    case 6:
      unitToPixel = DPI / 25.4;
      break;
    // Millimeter
    default:
      unitToPixel = 1;
      break;
  }
  return unitToPixel * pageScale;
}
function plusWorldMatrix(rCtx) {
  const pre = plusPageToDeviceMatrix(rCtx);
  const s = rCtx.dpiScale;
  const m = [pre[0] * s, pre[1] * s, pre[2] * s, pre[3] * s, pre[4] * s, pre[5] * s];
  const b = rCtx.baseTransform;
  if (!b) {
    return m;
  }
  return [
    b[0] * m[0] + b[2] * m[1],
    b[1] * m[0] + b[3] * m[1],
    b[0] * m[2] + b[2] * m[3],
    b[1] * m[2] + b[3] * m[3],
    b[0] * m[4] + b[2] * m[5] + b[4],
    b[1] * m[4] + b[3] * m[5] + b[5]
  ];
}
function plusExt(rCtx) {
  if (!rCtx.ext) {
    rCtx.ext = {};
  }
  return rCtx.ext;
}
function plusPageToDeviceMatrix(rCtx) {
  const ext = rCtx.ext;
  if (ext?.tsDevice) {
    return ext.tsDevice;
  }
  const wt = rCtx.worldTransform;
  const k = getPageUnitMultiplier(rCtx.pageUnit, rCtx.pageScale);
  const m = [wt[0] * k, wt[1] * k, wt[2] * k, wt[3] * k, wt[4] * k, wt[5] * k];
  return ext?.containerTransform ? multiplyMatrix2(m, ext.containerTransform) : m;
}
function deviceToCanvasMatrix(rCtx) {
  const s = rCtx.dpiScale;
  const m = [s, 0, 0, s, 0, 0];
  return rCtx.baseTransform ? multiplyMatrix2(m, rCtx.baseTransform) : m;
}
function applyPlusWorldTransform(rCtx, geometry = true) {
  const m = plusWorldMatrix(rCtx);
  const d = geometry ? plusCanvasShift(rCtx) : 0;
  rCtx.ctx.setTransform(m[0], m[1], m[2], m[3], m[4] + d, m[5] + d);
}
function plusCanvasShift(rCtx) {
  if (isSvgContext(rCtx.ctx)) {
    return 0;
  }
  return rCtx.antiAlias && !isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0) ? 0.5 : 0;
}
function pushState(rCtx, stackId) {
  const ext = plusExt(rCtx);
  rCtx.saveStack.push({
    transform: [...rCtx.worldTransform],
    snapshot: {
      clipRegion: rCtx.clipRegion ?? null,
      antiAlias: rCtx.antiAlias,
      interpolationMode: rCtx.interpolationMode,
      pixelOffsetMode: rCtx.pixelOffsetMode,
      textRenderingHint: rCtx.textRenderingHint,
      pageUnit: rCtx.pageUnit,
      pageScale: rCtx.pageScale,
      ext: { ...ext, multiFormatSkip: void 0, pendingEffect: void 0 }
    }
  });
  rCtx.saveIdMap.set(stackId, rCtx.saveStack.length - 1);
}
function popState(rCtx, stackId) {
  const idx = rCtx.saveIdMap.get(stackId);
  if (idx !== void 0 && idx < rCtx.saveStack.length) {
    const saved = rCtx.saveStack[idx];
    rCtx.worldTransform = [...saved.transform];
    const snap = saved.snapshot;
    if (snap) {
      rCtx.clipRegion = snap.clipRegion;
      rCtx.antiAlias = snap.antiAlias;
      rCtx.interpolationMode = snap.interpolationMode;
      rCtx.pixelOffsetMode = snap.pixelOffsetMode;
      rCtx.textRenderingHint = snap.textRenderingHint;
      rCtx.pageUnit = snap.pageUnit;
      rCtx.pageScale = snap.pageScale;
      const ext = plusExt(rCtx);
      const { multiFormatSkip, pendingEffect } = ext;
      for (const key of Object.keys(ext)) {
        delete ext[key];
      }
      Object.assign(ext, snap.ext, { multiFormatSkip, pendingEffect });
    }
    rCtx.saveStack.length = idx;
    const newMap = /* @__PURE__ */ new Map();
    for (const [k, v] of rCtx.saveIdMap) {
      if (v < idx) {
        newMap.set(k, v);
      }
    }
    rCtx.saveIdMap = newMap;
    if (snap) {
      reapplyPlusClip(rCtx);
    }
  }
}
function beginContainer(rCtx, stackId, rectTransform) {
  const outer = plusPageToDeviceMatrix(rCtx);
  const outerClip = concatClip(rCtx.ext?.containerClip, rCtx.clipRegion);
  pushState(rCtx, stackId);
  const ext = plusExt(rCtx);
  ext.containerTransform = rectTransform ? multiplyMatrix2(rectTransform, outer) : outer;
  ext.tsDevice = null;
  ext.containerClip = outerClip;
  ext.compositingMode = void 0;
  ext.compositingQuality = void 0;
  ext.textContrast = void 0;
  rCtx.clipRegion = null;
  rCtx.worldTransform = [1, 0, 0, 1, 0, 0];
  rCtx.pageUnit = 2;
  rCtx.pageScale = 1;
  rCtx.antiAlias = false;
  rCtx.interpolationMode = void 0;
  rCtx.pixelOffsetMode = void 0;
  rCtx.textRenderingHint = void 0;
  reapplyPlusClip(rCtx);
}
function containerRectTransform(dst, src, unit) {
  const u = getPageUnitMultiplier(unit, 1);
  const sw = src.w * u;
  const sh = src.h * u;
  if (!(Math.abs(sw) > 0 && Math.abs(sh) > 0) || ![dst.x, dst.y, dst.w, dst.h, sw, sh].every(Number.isFinite)) {
    return null;
  }
  const a = dst.w / sw;
  const d = dst.h / sh;
  return [a, 0, 0, d, dst.x - src.x * u * a, dst.y - src.y * u * d];
}
function concatClip(a, b) {
  const parts = [...a ?? [], ...b ?? []];
  return a || b ? parts : null;
}
function plusDeviceMatrix(rCtx) {
  return plusWorldMatrix(rCtx);
}
function transformedRectShape(x, y, w, h, m) {
  const tx = (px, py) => m[0] * px + m[2] * py + m[4];
  const ty = (px, py) => m[1] * px + m[3] * py + m[5];
  const cmds = [
    { op: "moveTo", x: tx(x, y), y: ty(x, y) },
    { op: "lineTo", x: tx(x + w, y), y: ty(x + w, y) },
    { op: "lineTo", x: tx(x + w, y + h), y: ty(x + w, y + h) },
    { op: "lineTo", x: tx(x, y + h), y: ty(x, y + h) },
    { op: "closePath" }
  ];
  return { cmds, fillRule: "nonzero", simple: true };
}
function pathClipShape(path, m) {
  return emfPlusPathClipShape(path.path, m);
}
var REGION_NODE_OPS = {
  0: "intersect",
  // legacy/lenient: treat 0 as And
  1: "intersect",
  // RegionNodeDataTypeAnd
  2: "union",
  // RegionNodeDataTypeOr
  3: "xor",
  // RegionNodeDataTypeXor
  4: "exclude",
  // RegionNodeDataTypeExclude
  5: "complement"
  // RegionNodeDataTypeComplement
};
var MAX_REGION_FLATTEN_DEPTH = 64;
function flattenRegionNode(node, m, depth = 0, domain) {
  if (depth > MAX_REGION_FLATTEN_DEPTH) {
    return { region: [emptyClipShape()], exact: false };
  }
  switch (node.type) {
    case "rect":
      return { region: [transformedRectShape(node.x, node.y, node.width, node.height, m)], exact: true };
    case "path":
      return { region: [pathClipShape(node, m)], exact: true };
    case "infinite":
      return { region: null, exact: true };
    case "empty":
      return { region: [emptyClipShape()], exact: true };
    case "combine": {
      const left = flattenRegionNode(node.left, m, depth + 1, domain);
      const right = flattenRegionNode(node.right, m, depth + 1, domain);
      const op = REGION_NODE_OPS[node.combineMode] ?? "intersect";
      const combined = combineClipRegions(left.region, right.region, op, domain);
      return { region: combined.region, exact: combined.exact && left.exact && right.exact };
    }
  }
}
var PLUS_COMBINE_OPS = {
  0: "replace",
  1: "intersect",
  2: "union",
  3: "xor",
  4: "exclude",
  5: "complement"
};
function plusClipDomain(rCtx) {
  if (rCtx.canvasW === void 0 || rCtx.canvasH === void 0) {
    return void 0;
  }
  return { x: 0, y: 0, w: rCtx.canvasW, h: rCtx.canvasH };
}
function effectivePlusClip(rCtx) {
  const ext = rCtx.ext;
  return concatClip(concatClip(ext?.containerClip, rCtx.clipRegion ?? void 0) ?? void 0, ext?.tsClip ?? void 0);
}
function reapplyPlusClip(rCtx) {
  reapplyClipRegion(rCtx, effectivePlusClip(rCtx), true);
}
function pixelSnapPlusClip(rCtx, incoming) {
  const domain = plusClipDomain(rCtx);
  if (rCtx.gdiAntialias === true || !incoming || !domain || isSvgContext(rCtx.ctx)) {
    return incoming;
  }
  const half = isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0);
  const exact = clipPixelRects(
    incoming.map((shape) => ({ build: (c) => replayClipCmds(c, shape.cmds), evenOdd: shape.fillRule === "evenodd" })),
    domain,
    half
  );
  if (exact) {
    return [rectsClipShape(exact)];
  }
  const shift = (half ? 0 : 0.5) - 1 / 32;
  const shifted2 = translateClipRegion(incoming, shift, shift);
  return [rectsClipShape(scanlineCombineRegions(shifted2, null, "intersect", domain))];
}
function applyPlusClipRegion(rCtx, rawIncoming, combineMode, opName) {
  const incoming = pixelSnapPlusClip(rCtx, rawIncoming);
  const op = PLUS_COMBINE_OPS[combineMode];
  const res = combineClipRegions(
    rCtx.clipRegion ?? null,
    incoming,
    op ?? "intersect",
    plusClipDomain(rCtx)
  );
  if (!res.exact) ;
  rCtx.clipRegion = res.region;
  reapplyPlusClip(rCtx);
}
function applyPlusClipShape(rCtx, shape, combineMode, opName) {
  applyPlusClipRegion(rCtx, [shape], combineMode);
}
function dropTsDevice(rCtx) {
  if (rCtx.ext?.tsDevice) {
    rCtx.ext.tsDevice = null;
  }
}
function setTsGraphics(rCtx, dataOff, dataSize) {
  const { view } = rCtx;
  if (dataSize < 40) {
    return;
  }
  const flags = view.getUint32(dataOff, true);
  if (flags & 1 && dataSize < 296) {
    return;
  }
  const smoothing = view.getUint8(dataOff + 4);
  rCtx.antiAlias = smoothing === 2 || smoothing === 4 || smoothing === 5;
  rCtx.textRenderingHint = view.getUint8(dataOff + 5);
  const ext = plusExt(rCtx);
  ext.compositingMode = view.getUint8(dataOff + 6);
  ext.compositingQuality = view.getUint8(dataOff + 7);
  ext.renderingOrigin = { x: view.getInt16(dataOff + 8, true), y: view.getInt16(dataOff + 10, true) };
  ext.textContrast = view.getUint16(dataOff + 12, true);
  rCtx.interpolationMode = view.getUint8(dataOff + 14);
  const m = [0, 4, 8, 12, 16, 20].map((k) => view.getFloat32(dataOff + 16 + k, true));
  if (m.every(Number.isFinite)) {
    ext.tsDevice = m;
  }
}
function decodeTsClipRects(view, dataOff, dataSize, flags) {
  const count = flags & 32767;
  const end = dataOff + dataSize;
  const rects = [];
  if (!(flags & 32768)) {
    if (dataOff + count * 16 > end) {
      return null;
    }
    for (let i = 0; i < count; i++) {
      const o2 = dataOff + i * 16;
      rects.push({ l: view.getInt32(o2, true), t: view.getInt32(o2 + 4, true), r: view.getInt32(o2 + 8, true), b: view.getInt32(o2 + 12, true) });
    }
    return rects;
  }
  let o = dataOff;
  const next = () => {
    if (o >= end) {
      return null;
    }
    const b0 = view.getUint8(o);
    if (b0 & 128) {
      o += 1;
      const v2 = b0 & 127;
      return v2 & 64 ? v2 - 128 : v2;
    }
    if (o + 2 > end) {
      return null;
    }
    const v = b0 << 8 | view.getUint8(o + 1);
    o += 2;
    return v & 16384 ? v - 32768 : v;
  };
  let prev = { l: 0, r: 0, b: 0 };
  for (let i = 0; i < count; i++) {
    const dl = next();
    const dt = next();
    const dr = next();
    const dh = next();
    if (dl === null || dt === null || dr === null || dh === null) {
      return null;
    }
    const t = prev.b + dt;
    const rect = { l: prev.l + dl, t, r: prev.r + dr, b: t + dh };
    rects.push(rect);
    prev = rect;
  }
  return rects;
}
function setTsClip(rCtx, flags, dataOff, dataSize) {
  const rects = decodeTsClipRects(rCtx.view, dataOff, dataSize, flags);
  if (!rects) {
    return;
  }
  const m = deviceToCanvasMatrix(rCtx);
  const tx = (x, y) => m[0] * x + m[2] * y + m[4];
  const ty = (x, y) => m[1] * x + m[3] * y + m[5];
  const cmds = [];
  for (const r of rects) {
    if (r.r <= r.l || r.b <= r.t) {
      continue;
    }
    cmds.push(
      { op: "moveTo", x: tx(r.l, r.t), y: ty(r.l, r.t) },
      { op: "lineTo", x: tx(r.r, r.t), y: ty(r.r, r.t) },
      { op: "lineTo", x: tx(r.r, r.b), y: ty(r.r, r.b) },
      { op: "lineTo", x: tx(r.l, r.b), y: ty(r.l, r.b) },
      { op: "closePath" }
    );
  }
  const shape = cmds.length > 0 ? { cmds, fillRule: "nonzero", simple: rects.length === 1 } : emptyClipShape();
  const ext = plusExt(rCtx);
  ext.tsClip = concatClip(effectivePlusClip(rCtx) ?? void 0, pixelSnapPlusClip(rCtx, [shape]) ?? void 0);
  reapplyPlusClip(rCtx);
}
function handleEmfPlusStateRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { view } = rCtx;
  switch (recType) {
    // ---- transforms ----
    case EMFPLUS_SETWORLDTRANSFORM: {
      dropTsDevice(rCtx);
      if (recDataSize >= 24) {
        rCtx.worldTransform = [
          view.getFloat32(dataOff, true),
          view.getFloat32(dataOff + 4, true),
          view.getFloat32(dataOff + 8, true),
          view.getFloat32(dataOff + 12, true),
          view.getFloat32(dataOff + 16, true),
          view.getFloat32(dataOff + 20, true)
        ];
      }
      return true;
    }
    case EMFPLUS_RESETWORLDTRANSFORM: {
      dropTsDevice(rCtx);
      rCtx.worldTransform = [1, 0, 0, 1, 0, 0];
      return true;
    }
    case EMFPLUS_MULTIPLYWORLDTRANSFORM: {
      dropTsDevice(rCtx);
      if (recDataSize >= 24) {
        const xf = [
          view.getFloat32(dataOff, true),
          view.getFloat32(dataOff + 4, true),
          view.getFloat32(dataOff + 8, true),
          view.getFloat32(dataOff + 12, true),
          view.getFloat32(dataOff + 16, true),
          view.getFloat32(dataOff + 20, true)
        ];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix2(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix2(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    case EMFPLUS_TRANSLATEWORLDTRANSFORM: {
      dropTsDevice(rCtx);
      if (recDataSize >= 8) {
        const dx = view.getFloat32(dataOff, true);
        const dy = view.getFloat32(dataOff + 4, true);
        const xf = [1, 0, 0, 1, dx, dy];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix2(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix2(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    case EMFPLUS_SCALEWORLDTRANSFORM: {
      dropTsDevice(rCtx);
      if (recDataSize >= 8) {
        const sx = view.getFloat32(dataOff, true);
        const sy = view.getFloat32(dataOff + 4, true);
        const xf = [sx, 0, 0, sy, 0, 0];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix2(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix2(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    case EMFPLUS_ROTATEWORLDTRANSFORM: {
      dropTsDevice(rCtx);
      if (recDataSize >= 4) {
        const angle = view.getFloat32(dataOff, true) * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const xf = [cos, sin, -sin, cos, 0, 0];
        if (recFlags & 8192) {
          rCtx.worldTransform = multiplyMatrix2(rCtx.worldTransform, xf);
        } else {
          rCtx.worldTransform = multiplyMatrix2(xf, rCtx.worldTransform);
        }
      }
      return true;
    }
    // ---- save / restore ----
    case EMFPLUS_SAVE: {
      if (recDataSize >= 4) {
        pushState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    case EMFPLUS_RESTORE: {
      if (recDataSize >= 4) {
        popState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    // ---- clipping ----
    case EMFPLUS_SETCLIPRECT: {
      if (recDataSize >= 16) {
        const combineMode = recFlags >> 8 & 15;
        const cx = view.getFloat32(dataOff, true);
        const cy = view.getFloat32(dataOff + 4, true);
        const cw = view.getFloat32(dataOff + 8, true);
        const ch = view.getFloat32(dataOff + 12, true);
        const shape = transformedRectShape(cx, cy, cw, ch, plusDeviceMatrix(rCtx));
        applyPlusClipShape(rCtx, shape, combineMode);
      }
      return true;
    }
    case EMFPLUS_RESETCLIP: {
      rCtx.clipRegion = null;
      reapplyPlusClip(rCtx);
      return true;
    }
    case EMFPLUS_SETCLIPREGION: {
      const regionId = recFlags & 255;
      const combineMode = recFlags >> 8 & 15;
      const regionObj = rCtx.objectTable.get(regionId);
      if (regionObj && regionObj.kind === "plus-region" && regionObj.nodes.length > 0) {
        const flattened = flattenRegionNode(
          regionObj.nodes[0],
          plusDeviceMatrix(rCtx),
          0,
          plusClipDomain(rCtx)
        );
        if (!flattened.exact) ;
        applyPlusClipRegion(rCtx, flattened.region, combineMode);
      }
      return true;
    }
    case EMFPLUS_SETCLIPPATH: {
      const pathId = recFlags & 255;
      const combineMode = recFlags >> 8 & 15;
      const pathObj = rCtx.objectTable.get(pathId);
      if (pathObj && pathObj.kind === "plus-path") {
        const shape = emfPlusPathClipShape(pathObj, plusDeviceMatrix(rCtx));
        applyPlusClipShape(rCtx, shape, combineMode);
      }
      return true;
    }
    case EMFPLUS_OFFSETCLIP: {
      if (recDataSize >= 8) {
        const dx = view.getFloat32(dataOff, true);
        const dy = view.getFloat32(dataOff + 4, true);
        if (rCtx.clipRegion) {
          const m = plusDeviceMatrix(rCtx);
          const ddx = m[0] * dx + m[2] * dy;
          const ddy = m[1] * dx + m[3] * dy;
          rCtx.clipRegion = translateClipRegion(rCtx.clipRegion, ddx, ddy);
          reapplyPlusClip(rCtx);
        }
      }
      return true;
    }
    // ---- containers ----
    case EMFPLUS_BEGINCONTAINERNOPARAMS: {
      if (recDataSize >= 4) {
        beginContainer(rCtx, view.getUint32(dataOff, true), null);
      }
      return true;
    }
    case EMFPLUS_BEGINCONTAINER: {
      if (recDataSize >= 36) {
        const f = (k) => view.getFloat32(dataOff + k, true);
        const t = containerRectTransform(
          { x: f(0), y: f(4), w: f(8), h: f(12) },
          { x: f(16), y: f(20), w: f(24), h: f(28) },
          recFlags & 255
        );
        beginContainer(rCtx, view.getUint32(dataOff + 32, true), t ?? [1, 0, 0, 1, 0, 0]);
      }
      return true;
    }
    case EMFPLUS_ENDCONTAINER: {
      if (recDataSize >= 4) {
        popState(rCtx, view.getUint32(dataOff, true));
      }
      return true;
    }
    // ---- page transform ----
    case EMFPLUS_SETPAGETRANSFORM: {
      dropTsDevice(rCtx);
      const pageUnit = recFlags & 255;
      const pageScale = recDataSize >= 4 ? view.getFloat32(dataOff, true) : 1;
      rCtx.pageUnit = pageUnit;
      rCtx.pageScale = pageScale;
      return true;
    }
    // ---- image resampling hints (see emf-plus-image-resample.ts) ----
    case EMFPLUS_SETINTERPOLATIONMODE:
      rCtx.interpolationMode = recFlags & 255;
      return true;
    case EMFPLUS_SETPIXELOFFSETMODE:
      rCtx.pixelOffsetMode = recFlags & 255;
      return true;
    case EMFPLUS_SETTEXTRENDERINGHINT:
      rCtx.textRenderingHint = recFlags & 255;
      return true;
    // ---- antialiasing (honoured for fills and strokes unless gdiAntialias: true) ----
    case EMFPLUS_SETANTIALIASMODE:
      rCtx.antiAlias = (recFlags & 1) !== 0;
      return true;
    // ---- compositing, rendering origin, text contrast ----
    case EMFPLUS_SETCOMPOSITINGQUALITY:
      plusExt(rCtx).compositingQuality = recFlags & 255;
      return true;
    case EMFPLUS_SETCOMPOSITINGMODE:
      plusExt(rCtx).compositingMode = recFlags & 255;
      return true;
    case EMFPLUS_SETRENDERINGORIGIN:
      if (recDataSize >= 8) {
        plusExt(rCtx).renderingOrigin = { x: view.getInt32(dataOff, true), y: view.getInt32(dataOff + 4, true) };
      }
      return true;
    case EMFPLUS_SETTEXTCONTRAST:
      plusExt(rCtx).textContrast = recFlags & 4095;
      return true;
    // ---- terminal-server state ----
    case EMFPLUS_SETTSGRAPHICS:
      setTsGraphics(rCtx, dataOff, recDataSize);
      return true;
    case EMFPLUS_SETTSCLIP:
      setTsClip(rCtx, recFlags, dataOff, recDataSize);
      return true;
    default:
      return false;
  }
}

// src/emf-plus-exact-fill.ts
var IDENTITY4 = [1, 0, 0, 1, 0, 0];
var MAX_EXACT_PIXELS = 16 * 1024 * 1024;
var CLAMP_EDGE_BIAS = 1e-4;
function invertAffine(m) {
  const det = m[0] * m[3] - m[1] * m[2];
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    return null;
  }
  const a = m[3] / det;
  const b = -m[1] / det;
  const c = -m[2] / det;
  const d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}
function surfaceSize3(ctx) {
  const canvas = ctx.canvas;
  const w = canvas?.width;
  const h = canvas?.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}
function textureSampler(texture, device, halfPixel2 = false) {
  const { width, height, rgba, wrapMode } = texture;
  if (width <= 0 || height <= 0) {
    return null;
  }
  const inv2 = invertAffine(mulMatrix(device, texture.transform ?? IDENTITY4));
  if (!inv2) {
    return null;
  }
  return (x0, y0, w, h, out) => {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        writeTextureColor(inv2, width, height, rgba, wrapMode, halfPixel2, x0 + i, y0 + j, out, (j * w + i) * 4);
      }
    }
  };
}
function boundaryBox2(points) {
  if (points.length < 3) {
    return null;
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}
function foldIntoTile(v, origin, size, mirror2, lag) {
  const rel = v - origin;
  const k = Math.floor(rel / size);
  const local = rel - k * size;
  if (mirror2 && (k % 2 + 2) % 2 === 1) {
    return origin + size - lag - local;
  }
  return origin + local;
}
function pathGradientSampler(shape, wrap, device) {
  const box = boundaryBox2(shape.boundary);
  const full = mulMatrix(device, shape.transform ?? IDENTITY4);
  const inv2 = invertAffine(full);
  if (!box || !inv2) {
    return null;
  }
  const pxX = Math.hypot(full[0], full[1]);
  const pxY = Math.hypot(full[2], full[3]);
  const lagX = pxX > 0 ? 1 / pxX : 0;
  const lagY = pxY > 0 ? 1 / pxY : 0;
  const mirrorX = wrap === "tile-flip-x" || wrap === "tile-flip-xy";
  const mirrorY = wrap === "tile-flip-y" || wrap === "tile-flip-xy";
  const bias = wrap === "clamp" ? CLAMP_EDGE_BIAS : 0;
  return (x0, y0, w, h, out) => {
    for (let j = 0; j < h; j++) {
      const dy = y0 + j + bias;
      for (let i = 0; i < w; i++) {
        const dx = x0 + i + bias;
        let bx = inv2[0] * dx + inv2[2] * dy + inv2[4];
        let by = inv2[1] * dx + inv2[3] * dy + inv2[5];
        if (wrap !== "clamp") {
          bx = foldIntoTile(bx, box.x, box.w, mirrorX, lagX);
          by = foldIntoTile(by, box.y, box.h, mirrorY, lagY);
        }
        const c = pathGradientColorAt(shape, bx, by);
        if (c === null) {
          continue;
        }
        const o = (j * w + i) * 4;
        out[o] = c >>> 16 & 255;
        out[o + 1] = c >>> 8 & 255;
        out[o + 2] = c & 255;
        out[o + 3] = c >>> 24 & 255;
      }
    }
  };
}
function deviceBrushSampler(rCtx, flags, brushIdOrColor) {
  if (flags & 32768) {
    return null;
  }
  const obj = rCtx.objectTable.get(brushIdOrColor & 255);
  if (!obj || obj.kind !== "plus-brush") {
    return null;
  }
  return brushSampler(rCtx, obj);
}
function brushSampler(rCtx, obj) {
  const device = plusWorldMatrix(rCtx);
  if (obj.hatch && !isSvgContext(rCtx.ctx)) {
    const inv2 = invertAffine(deviceToCanvasMatrix(rCtx));
    if (inv2) {
      return hatchSampler(obj.hatch, rCtx.ext?.renderingOrigin ?? { x: 0, y: 0 }, inv2);
    }
  }
  if (obj.texture) {
    return textureSampler(obj.texture, device, isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0));
  }
  if (obj.gradient && obj.gradient.type === "radial" && obj.gradient.shape) {
    return pathGradientSampler(obj.gradient.shape, obj.gradient.wrapMode, device);
  }
  if (obj.gradient && obj.gradient.type === "linear" && !isSvgContext(rCtx.ctx)) {
    return linearRampSampler(obj.gradient, device, isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0));
  }
  return null;
}
function deviceBounds(points, device, size, margin = 0) {
  if (!points || points.length === 0) {
    return { x: 0, y: 0, w: size.w, h: size.h };
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    const x = device[0] * p.x + device[2] * p.y + device[4];
    const y = device[1] * p.x + device[3] * p.y + device[5];
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (!Number.isFinite(x0 + y0 + x1 + y1)) {
    return { x: 0, y: 0, w: size.w, h: size.h };
  }
  const m = Math.ceil(Math.max(0, margin)) + 1;
  const bx0 = Math.max(0, Math.floor(x0) - m);
  const by0 = Math.max(0, Math.floor(y0) - m);
  const bx1 = Math.min(size.w, Math.ceil(x1) + m);
  const by1 = Math.min(size.h, Math.ceil(y1) + m);
  return bx1 > bx0 && by1 > by0 ? { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 } : null;
}
function tryFillPlusShapeExact(rCtx, flags, brushIdOrColor, buildPath, points, fillRule = "nonzero") {
  const { ctx } = rCtx;
  const size = surfaceSize3(ctx);
  if (!size || typeof ctx.clip !== "function" || typeof ctx.drawImage !== "function") {
    return false;
  }
  const mode = plusRasterMode(rCtx);
  if (mode !== "canvas") {
    const any = anyBrushSampler(rCtx, flags, brushIdOrColor);
    if (any && fillPlusShapeGdiplus(rCtx, any, buildPath, points, fillRule, size, mode)) {
      return true;
    }
  }
  const sampler = deviceBrushSampler(rCtx, flags, brushIdOrColor);
  if (!sampler) {
    return false;
  }
  const box = deviceBounds(points, plusWorldMatrix(rCtx), size);
  if (!box) {
    return true;
  }
  if (box.w * box.h > MAX_EXACT_PIXELS) {
    return false;
  }
  const temp = createTempCanvas(box.w, box.h);
  if (!temp) {
    return false;
  }
  const data = new Uint8ClampedArray(box.w * box.h * 4);
  sampler(box.x, box.y, box.w, box.h, data);
  canvasPutImageData(temp.ctx, createImageDataCompat(data, box.w, box.h), 0, 0);
  ctx.save();
  try {
    applyPlusWorldTransform(rCtx);
    ctx.beginPath();
    buildPath(ctx);
    ctx.clip(fillRule);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage.call(ctx, temp.canvas, box.x, box.y);
  } finally {
    ctx.restore();
  }
  return true;
}
function paintBrushThroughMask(rCtx, sampler, box, drawCoverage, mode = "canvas", hitTest, geometry = true) {
  const rasterMode = mode === true ? "aliased" : mode === false ? "canvas" : mode;
  const aliased = rasterMode === "aliased";
  const gdiplusAa = rasterMode === "gdiplus-aa";
  const { ctx } = rCtx;
  if (typeof ctx.drawImage !== "function" || box.w * box.h > MAX_EXACT_PIXELS) {
    return false;
  }
  const mask = createTempCanvas(box.w, box.h);
  const out = createTempCanvas(box.w, box.h);
  if (!mask || !out || typeof mask.ctx.getImageData !== "function") {
    return false;
  }
  const device = plusWorldMatrix(rCtx);
  const m = mask.ctx;
  const shift = aliased ? aliasedSampleShift(rCtx) : geometry ? plusCanvasShift(rCtx) : 0;
  m.setTransform(device[0], device[1], device[2], device[3], device[4] - box.x + shift, device[5] - box.y + shift);
  m.fillStyle = "#000";
  m.strokeStyle = "#000";
  drawCoverage(rasterMode !== "canvas" ? flatteningContext(m, device) : m);
  const coverage = canvasGetImageData(m, 0, 0, box.w, box.h).data;
  if (gdiplusAa && hitTest && typeof m.isPointInPath === "function") {
    for (let i = 3; i < coverage.length; i += 4) {
      const cv = coverage[i];
      if (cv === 0 || cv === 255) {
        continue;
      }
      const p = (i - 3) / 4;
      const px = p % box.w;
      const py = Math.floor(p / box.w);
      let k = 0;
      for (let sj = 0; sj < 4; sj++) {
        for (let si = 0; si < 8; si++) {
          if (hitTest(m, px + si / 8 + AA_SAMPLE_NUDGE, py + sj / 4 + AA_SAMPLE_NUDGE)) {
            k++;
          }
        }
      }
      coverage[i] = Math.round(k * 255 / 32);
    }
  }
  if (aliased) {
    const probe = hitTest && typeof m.isPointInPath === "function" ? hitTest : null;
    for (let i = 3; i < coverage.length; i += 4) {
      const cv = coverage[i];
      if (cv === 0 || cv === 255) {
        continue;
      }
      if (probe) {
        const p = (i - 3) / 4;
        const px = p % box.w + 0.5;
        const py = Math.floor(p / box.w) + 0.5;
        coverage[i] = probe(m, px, py) ? 255 : 0;
      } else {
        coverage[i] = cv >= 128 ? 255 : 0;
      }
    }
  }
  const data = new Uint8ClampedArray(box.w * box.h * 4);
  sampler(box.x, box.y, box.w, box.h, data);
  for (let i = 3; i < data.length; i += 4) {
    data[i] = (data[i] * coverage[i] + 127) / 255;
  }
  canvasPutImageData(out.ctx, createImageDataCompat(data, box.w, box.h), 0, 0);
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage.call(ctx, out.canvas, box.x, box.y);
  } finally {
    ctx.restore();
  }
  return true;
}
function aliasedSampleShift(rCtx) {
  return (isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0) ? 0 : 0.5) - 1 / 32;
}
var AA_SAMPLE_NUDGE = 1 / 1024;
function plusRasterMode(rCtx) {
  if (rCtx.gdiAntialias === true || isSvgContext(rCtx.ctx)) {
    return "canvas";
  }
  return rCtx.antiAlias ? "gdiplus-aa" : "aliased";
}
function solidSampler(argb) {
  const a = argb >>> 24 & 255;
  const r = argb >>> 16 & 255;
  const g = argb >>> 8 & 255;
  const b = argb & 255;
  return (_x0, _y0, w, h, out) => {
    for (let i = 0; i < w * h * 4; i += 4) {
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = a;
    }
  };
}
function cssColorToArgb(color) {
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(color);
  if (m) {
    const a = m[4] === void 0 ? 1 : Number(m[4]);
    const ch = (v) => Math.min(255, Math.max(0, Math.round(Number(v))));
    return (Math.round(Math.min(1, Math.max(0, a)) * 255) << 24 | ch(m[1]) << 16 | ch(m[2]) << 8 | ch(m[3])) >>> 0;
  }
  const h = /^#([0-9a-f]{6})$/i.exec(color);
  return h ? (4278190080 | parseInt(h[1], 16)) >>> 0 : null;
}
function anyBrushSampler(rCtx, flags, brushIdOrColor) {
  if (flags & 32768) {
    return solidSampler(brushIdOrColor >>> 0);
  }
  const exact = deviceBrushSampler(rCtx, flags, brushIdOrColor);
  if (exact) {
    return exact;
  }
  const obj = rCtx.objectTable.get(brushIdOrColor & 255);
  const argb = obj && obj.kind === "plus-brush" ? cssColorToArgb(obj.color) : null;
  return argb === null ? null : solidSampler(argb);
}
function fillPlusShapeGdiplus(rCtx, sampler, buildPath, points, fillRule, size, mode) {
  const device = plusWorldMatrix(rCtx);
  let figures = null;
  try {
    figures = recordPlusFigures(buildPath, device, mode === "aliased");
  } catch {
    figures = null;
  }
  if (figures) {
    const fbox = figuresBox(figures, size);
    if (!fbox) {
      return true;
    }
    if (fbox.w * fbox.h <= MAX_EXACT_PIXELS) {
      const half = isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0);
      const coverage = rasterizePlusFill(figures, fillRule === "evenodd", mode === "gdiplus-aa", half, fbox);
      return compositeBrushCoverage(rCtx, sampler, fbox, coverage, 1, true);
    }
  }
  const box = deviceBounds(points, device, size);
  if (!box) {
    return true;
  }
  return paintBrushThroughMask(
    rCtx,
    sampler,
    box,
    (c) => {
      c.beginPath();
      buildPath(c);
      c.fill(fillRule);
    },
    mode,
    (c, x, y) => c.isPointInPath(x, y, fillRule)
  );
}
function gdiplusBlendPixels(data, dst, coverage) {
  for (let p = 0; p < coverage.length; p++) {
    const o = p * 4;
    const cv = coverage[p];
    const a = data[o + 3];
    if (cv === 0 || a === 0) {
      data[o + 3] = 0;
      continue;
    }
    if (dst[o + 3] !== 255) {
      return false;
    }
    const k = cv === 255 ? 32 : Math.round(cv * 32 / 255);
    const A = Math.round(a * k / 32);
    for (let c = 0; c < 3; c++) {
      const pre = Math.round(data[o + c] * a / 255);
      data[o + c] = Math.min(255, Math.round(pre * k / 32) + Math.round(dst[o + c] * (255 - A) / 255));
    }
    data[o + 3] = 255;
  }
  return true;
}
function sourceCopyPixels(data, dst, coverage) {
  for (let p = 0; p < coverage.length; p++) {
    const o = p * 4;
    const cv = coverage[p];
    if (cv === 0) {
      data[o + 3] = 0;
    } else if (cv !== 255) {
      const k = Math.round(cv * 32 / 255);
      data[o + 3] = Math.round(data[o + 3] * k / 32);
    }
  }
  return data;
}
function sourceCopyComposite(rCtx, box, rgba, coverage) {
  const { ctx } = rCtx;
  const mask = createTempCanvas(box.w, box.h);
  const out = createTempCanvas(box.w, box.h);
  if (!mask || !out) {
    return false;
  }
  const m = new Uint8ClampedArray(box.w * box.h * 4);
  for (let p = 0; p < coverage.length; p++) {
    m[p * 4 + 3] = coverage[p] ? 255 : 0;
  }
  canvasPutImageData(mask.ctx, createImageDataCompat(m, box.w, box.h), 0, 0);
  canvasPutImageData(out.ctx, createImageDataCompat(rgba, box.w, box.h), 0, 0);
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const draw = ctx.drawImage;
    ctx.globalCompositeOperation = "destination-out";
    draw.call(ctx, mask.canvas, box.x, box.y);
    ctx.globalCompositeOperation = "source-over";
    draw.call(ctx, out.canvas, box.x, box.y);
  } finally {
    ctx.restore();
  }
  return true;
}
function compositeBrushCoverage(rCtx, sampler, box, coverage, channels = 1, gdiplusBlend = false, gamma = 1) {
  const { ctx } = rCtx;
  const out = createTempCanvas(box.w, box.h);
  if (typeof ctx.drawImage !== "function" || !out) {
    return false;
  }
  const data = new Uint8ClampedArray(box.w * box.h * 4);
  sampler(box.x, box.y, box.w, box.h, data);
  if (channels === 1 && rCtx.ext?.compositingMode === 1 && typeof ctx.getImageData === "function") {
    const dst = canvasGetImageData(ctx, box.x, box.y, box.w, box.h).data;
    return sourceCopyComposite(rCtx, box, sourceCopyPixels(data, dst, coverage), coverage);
  }
  if (channels === 1 && gdiplusBlend && typeof ctx.getImageData === "function") {
    const dst = canvasGetImageData(ctx, box.x, box.y, box.w, box.h).data;
    if (gdiplusBlendPixels(data, dst, coverage)) {
      canvasPutImageData(out.ctx, createImageDataCompat(data, box.w, box.h), 0, 0);
      ctx.save();
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage.call(ctx, out.canvas, box.x, box.y);
      } finally {
        ctx.restore();
      }
      return true;
    }
    sampler(box.x, box.y, box.w, box.h, data);
  }
  if (channels === 3) {
    if (typeof ctx.getImageData !== "function") {
      return false;
    }
    const dst = canvasGetImageData(ctx, box.x, box.y, box.w, box.h).data;
    for (let p = 0; p < box.w * box.h; p++) {
      const o = p * 4;
      const a = data[o + 3] / 255;
      let any = false;
      for (let c = 0; c < 3; c++) {
        const k = coverage[p * 3 + c] / 255 * a;
        if (k > 0) {
          any = true;
        }
        if (gamma === 1) {
          data[o + c] = dst[o + c] + (data[o + c] - dst[o + c]) * k;
        } else {
          const d = Math.pow(dst[o + c] / 255, gamma);
          const f = Math.pow(data[o + c] / 255, gamma);
          data[o + c] = 255 * Math.pow(d + (f - d) * k, 1 / gamma);
        }
      }
      data[o + 3] = any ? 255 : 0;
    }
  } else {
    for (let i = 3; i < data.length; i += 4) {
      data[i] = (data[i] * coverage[(i - 3) / 4] + 127) / 255;
    }
  }
  canvasPutImageData(out.ctx, createImageDataCompat(data, box.w, box.h), 0, 0);
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage.call(ctx, out.canvas, box.x, box.y);
  } finally {
    ctx.restore();
  }
  return true;
}

// src/emf-gdi-draw-shapes.ts
function needsPathBasedRectangle(rCtx) {
  const { state } = rCtx;
  const paint = rop2Paint(state.rop2);
  const ropExact = !paint.exact && isExactRop2Bitwise(state.rop2);
  const penPlain = state.penStyle === 5 || (state.penStyle === 0 || state.penStyle === 6) && penIsCosmetic(rCtx);
  return ropExact || rCtx.gdiAntialias === false || realizeBrush(state).kind === "tile" || !penPlain;
}
function rasterPathOf(rCtx) {
  rCtx.rasterPath ?? (rCtx.rasterPath = new GdiRasterPath());
  return rCtx.rasterPath;
}
function continueFigure(rCtx) {
  const path = rasterPathOf(rCtx);
  const [x, y] = currentFix(rCtx);
  const before = path.figures.length;
  path.continueAt(x, y);
  if (path.figures.length !== before) {
    gdiPathRecorder(rCtx).moveTo(x / 16, y / 16);
  }
}
function lineStyleOf(rCtx) {
  rCtx.lineStyle ?? (rCtx.lineStyle = { pos: 0 });
  return rCtx.lineStyle;
}
function resetLineStyle(rCtx) {
  rCtx.lineStyle = { pos: 0 };
}
function currentFix(rCtx) {
  const c = rCtx.curFix;
  const { state } = rCtx;
  if (c && c.lx === state.curX && c.ly === state.curY) {
    return [c.x, c.y];
  }
  return fixPoint(rCtx, state.curX, state.curY);
}
function uprightFixBox(rCtx, l, t, r, b) {
  return fixBox(rCtx, Math.min(l, r), Math.min(t, b), Math.max(l, r), Math.max(t, b));
}
function fixExtent(rCtx, v, axis) {
  const m = gdiDeviceMatrix(rCtx);
  const k = axis === 0 ? Math.hypot(m[0], m[1]) : Math.hypot(m[2], m[3]);
  return Math.round(Math.abs(v) * k * 16);
}
function handleSetPixelV(rCtx, dataOff, recSize) {
  const { ctx, view } = rCtx;
  if (recSize >= 20) {
    const x = view.getInt32(dataOff, true);
    const y = view.getInt32(dataOff + 4, true);
    const color = readStateColorRef(rCtx.state, view, dataOff + 8);
    const p = hasWorldRotation(rCtx) ? gmapPoint(rCtx, x, y) : { x: gmx(rCtx, x), y: gmy(rCtx, y) };
    ctx.fillStyle = color;
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  return true;
}
function handleMoveToEx(rCtx, dataOff, recSize) {
  const { view, state, inPath } = rCtx;
  if (recSize >= 16) {
    state.curX = view.getInt32(dataOff, true);
    state.curY = view.getInt32(dataOff + 4, true);
    resetLineStyle(rCtx);
    rCtx.curFix = void 0;
    if (inPath) {
      const p = hasWorldRotation(rCtx) ? gmapPoint(rCtx, state.curX, state.curY) : { x: gmx(rCtx, state.curX), y: gmy(rCtx, state.curY) };
      gdiPathRecorder(rCtx).moveTo(p.x, p.y);
      const f = fixPoint(rCtx, state.curX, state.curY);
      rasterPathOf(rCtx).moveTo(f[0], f[1]);
    }
  }
  return true;
}
function handleLineTo(rCtx, dataOff, recSize) {
  const { view, state, inPath } = rCtx;
  if (recSize >= 16) {
    const lx = view.getInt32(dataOff, true);
    const ly = view.getInt32(dataOff + 4, true);
    const rotated = hasWorldRotation(rCtx);
    const to = rotated ? gmapPoint(rCtx, lx, ly) : { x: gmx(rCtx, lx), y: gmy(rCtx, ly) };
    const fixTo = fixPoint(rCtx, lx, ly);
    if (inPath) {
      continueFigure(rCtx);
      gdiPathRecorder(rCtx).lineTo(to.x, to.y);
      rasterPathOf(rCtx).lineTo(fixTo[0], fixTo[1]);
    } else {
      const from = rotated ? gmapPoint(rCtx, state.curX, state.curY) : { x: gmx(rCtx, state.curX), y: gmy(rCtx, state.curY) };
      const fixFrom = currentFix(rCtx);
      paintGdiShape(rCtx, {
        build: (c) => {
          c.beginPath();
          c.moveTo(from.x, from.y);
          c.lineTo(to.x, to.y);
        },
        raster: () => {
          const path = new GdiRasterPath();
          path.moveTo(fixFrom[0], fixFrom[1]);
          path.lineTo(fixTo[0], fixTo[1]);
          return path;
        },
        fill: false,
        stroke: true,
        style: lineStyleOf(rCtx)
      });
    }
    state.curX = lx;
    state.curY = ly;
  }
  return true;
}
function handleRectangle(rCtx, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 24) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const box = uprightFixBox(rCtx, l, t, r, b);
    const clockwise = rCtx.state.arcDirection === 2;
    if (!inPath) {
      resetLineStyle(rCtx);
    }
    const rotated = hasWorldRotation(rCtx);
    if (rotated) {
      const p1 = gmapPoint(rCtx, l, t);
      const p2 = gmapPoint(rCtx, r, t);
      const p3 = gmapPoint(rCtx, r, b);
      const p4 = gmapPoint(rCtx, l, b);
      const appendRect = (c) => {
        c.moveTo(p1.x, p1.y);
        c.lineTo(p2.x, p2.y);
        c.lineTo(p3.x, p3.y);
        c.lineTo(p4.x, p4.y);
        c.closePath();
      };
      if (inPath) {
        appendRect(gdiPathRecorder(rCtx));
        rasterPathOf(rCtx).append(rectRasterPath(box, clockwise));
      } else {
        paintGdiShape(rCtx, {
          build: (c) => {
            c.beginPath();
            appendRect(c);
          },
          raster: () => rectRasterPath(box, clockwise),
          rectangle: true,
          fill: true,
          stroke: true,
          axisRect: isAxisBox(box) ? {} : void 0
        });
      }
      return true;
    }
    const x = gmx(rCtx, l);
    const y = gmy(rCtx, t);
    const w = gmw(rCtx, r - l);
    const h = gmh(rCtx, b - t);
    if (inPath) {
      gdiPathRecorder(rCtx).rect(x, y, w, h);
      rasterPathOf(rCtx).append(rectRasterPath(box, clockwise));
    } else if (needsPathBasedRectangle(rCtx)) {
      paintGdiShape(rCtx, {
        build: (c) => {
          c.beginPath();
          c.rect(x, y, w, h);
        },
        raster: () => rectRasterPath(box, clockwise),
        rectangle: true,
        fill: true,
        stroke: true,
        axisRect: { interior: rectangleInterior(state, x, y, w, h, penScale(rCtx)) }
      });
    } else {
      applyBrush(ctx, state);
      ctx.fillRect(x, y, w, h);
      applyPen(ctx, state);
      ctx.lineWidth = 1;
      const align = gdiStrokeAlign(state, penScale(rCtx));
      ctx.strokeRect(x + align, y + align, w, h);
    }
  }
  return true;
}
function rectangleInterior(state, x, y, w, h, scale = 1) {
  if (gdiStrokeAlign(state, scale) === 0 || penLineWidth(state, scale) !== 1) {
    return void 0;
  }
  const x0 = Math.min(x, x + w);
  const y0 = Math.min(y, y + h);
  const iw = Math.abs(w) - 1;
  const ih = Math.abs(h) - 1;
  if (iw <= 0 || ih <= 0) {
    return void 0;
  }
  return (c) => {
    c.beginPath();
    c.rect(x0 + 1, y0 + 1, iw, ih);
  };
}
var KAPPA2 = 0.5522847498307936;
function appendRoundRectPath(c, x0, y0, x1, y1, rx, ry, map) {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  const ex = Math.min(Math.abs(rx), (right - left) / 2);
  const ey = Math.min(Math.abs(ry), (bottom - top) / 2);
  if (!map) {
    if (ex <= 0 || ey <= 0) {
      c.rect(left, top, right - left, bottom - top);
      return;
    }
    const q = Math.PI / 2;
    c.moveTo(left + ex, top);
    c.lineTo(right - ex, top);
    c.ellipse(right - ex, top + ey, ex, ey, 0, -q, 0);
    c.lineTo(right, bottom - ey);
    c.ellipse(right - ex, bottom - ey, ex, ey, 0, 0, q);
    c.lineTo(left + ex, bottom);
    c.ellipse(left + ex, bottom - ey, ex, ey, 0, q, 2 * q);
    c.lineTo(left, top + ey);
    c.ellipse(left + ex, top + ey, ex, ey, 0, 2 * q, 3 * q);
    c.closePath();
    return;
  }
  const move = (x, y) => {
    const p = map(x, y);
    c.moveTo(p.x, p.y);
  };
  const line = (x, y) => {
    const p = map(x, y);
    c.lineTo(p.x, p.y);
  };
  const curve = (ax, ay, bx, by, x, y) => {
    const p1 = map(ax, ay);
    const p2 = map(bx, by);
    const p3 = map(x, y);
    c.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  };
  if (ex <= 0 || ey <= 0) {
    move(left, top);
    line(right, top);
    line(right, bottom);
    line(left, bottom);
    c.closePath();
    return;
  }
  const kx = ex * KAPPA2;
  const ky = ey * KAPPA2;
  move(left + ex, top);
  line(right - ex, top);
  curve(right - ex + kx, top, right, top + ey - ky, right, top + ey);
  line(right, bottom - ey);
  curve(right, bottom - ey + ky, right - ex + kx, bottom, right - ex, bottom);
  line(left + ex, bottom);
  curve(left + ex - kx, bottom, left, bottom - ey + ky, left, bottom - ey);
  line(left, top + ey);
  curve(left, top + ey - ky, left + ex - kx, top, left + ex, top);
  c.closePath();
}
function handleRoundRect(rCtx, dataOff, recSize) {
  const { view, inPath } = rCtx;
  if (recSize >= 32) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const cornerW = view.getInt32(dataOff + 16, true);
    const cornerH = view.getInt32(dataOff + 20, true);
    const drawRoundRect = hasWorldRotation(rCtx) ? (c) => appendRoundRectPath(c, l, t, r, b, cornerW / 2, cornerH / 2, (x, y) => gmapPoint(rCtx, x, y)) : (c) => appendRoundRectPath(
      c,
      gmx(rCtx, l),
      gmy(rCtx, t),
      gmx(rCtx, r),
      gmy(rCtx, b),
      gmw(rCtx, cornerW) / 2,
      gmh(rCtx, cornerH) / 2,
      null
    );
    const clockwise = rCtx.state.arcDirection === 2;
    const raster = (box = uprightFixBox(rCtx, l, t, r, b)) => roundRectRasterPath(box, fixExtent(rCtx, cornerW, 0), fixExtent(rCtx, cornerH, 1), clockwise, cornerW === 0 || cornerH === 0);
    if (inPath) {
      drawRoundRect(gdiPathRecorder(rCtx));
      rasterPathOf(rCtx).append(raster());
    } else {
      resetLineStyle(rCtx);
      paintGdiShape(rCtx, {
        build: (c) => {
          c.beginPath();
          drawRoundRect(c);
        },
        raster: () => raster(curvedFixBox(rCtx, l, t, r, b, true)),
        roundPen: true,
        fill: true,
        stroke: true
      });
    }
  }
  return true;
}
function curvedFixBox(rCtx, l, t, r, b, upright = false) {
  const box = upright ? uprightFixBox(rCtx, l, t, r, b) : fixBox(rCtx, l, t, r, b);
  if (rCtx.state.penStyle !== 5) {
    return box;
  }
  const m = gdiDeviceMatrix(rCtx);
  if (Math.abs(m[0]) !== 1 || Math.abs(m[3]) !== 1 || m[1] !== 0 || m[2] !== 0) {
    return box;
  }
  const sx = box.exx < 0 ? -1 : 1;
  const sy = box.eyy < 0 ? -1 : 1;
  return {
    ax: box.ax - 4 * sx,
    ay: box.ay - 4 * sy,
    exx: box.exx + 8 * sx,
    exy: 0,
    eyx: 0,
    eyy: box.eyy + 8 * sy
  };
}
function handleEllipse(rCtx, dataOff, recSize) {
  const { view, inPath } = rCtx;
  if (recSize >= 24) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const clockwise = rCtx.state.arcDirection === 2;
    const params = hasWorldRotation(rCtx) ? gdiEllipseParams(rCtx, (l + r) / 2, (t + b) / 2, Math.abs(r - l) / 2, Math.abs(b - t) / 2) : {
      cx: gmx(rCtx, (l + r) / 2),
      cy: gmy(rCtx, (t + b) / 2),
      rx: Math.abs(gmw(rCtx, r - l)) / 2,
      ry: Math.abs(gmh(rCtx, b - t)) / 2,
      rotation: 0
    };
    if (inPath) {
      gdiPathRecorder(rCtx).ellipse(params.cx, params.cy, params.rx, params.ry, params.rotation, 0, Math.PI * 2);
      rasterPathOf(rCtx).append(ellipseRasterPath(uprightFixBox(rCtx, l, t, r, b), clockwise));
    } else {
      resetLineStyle(rCtx);
      paintGdiShape(rCtx, {
        build: (c) => {
          c.beginPath();
          c.ellipse(params.cx, params.cy, params.rx, params.ry, params.rotation, 0, Math.PI * 2);
        },
        raster: () => ellipseRasterPath(curvedFixBox(rCtx, l, t, r, b, true), clockwise),
        roundPen: true,
        fill: true,
        stroke: true
      });
    }
  }
  return true;
}
function handleArcFamily(rCtx, recType, dataOff, recSize) {
  const { ctx, view, state, inPath } = rCtx;
  if (recSize >= 40) {
    const l = view.getInt32(dataOff, true);
    const t = view.getInt32(dataOff + 4, true);
    const r = view.getInt32(dataOff + 8, true);
    const b = view.getInt32(dataOff + 12, true);
    const startX = view.getInt32(dataOff + 16, true);
    const startY = view.getInt32(dataOff + 20, true);
    const endX = view.getInt32(dataOff + 24, true);
    const endY = view.getInt32(dataOff + 28, true);
    const cxA = (l + r) / 2;
    const cyA = (t + b) / 2;
    const rx = Math.abs(r - l) / 2;
    const ry = Math.abs(b - t) / 2;
    const startAngle = Math.atan2((startY - cyA) / (ry || 1), (startX - cxA) / (rx || 1));
    const endAngle = Math.atan2((endY - cyA) / (ry || 1), (endX - cxA) / (rx || 1));
    const rotated = hasWorldRotation(rCtx);
    const params = rotated ? gdiEllipseParams(rCtx, cxA, cyA, rx, ry) : {
      cx: gmx(rCtx, cxA),
      cy: gmy(rCtx, cyA),
      rx: Math.abs(gmw(rCtx, rx)),
      ry: Math.abs(gmh(rCtx, ry)),
      rotation: 0
    };
    const isArcTo = recType === EMR_ARCTO;
    const needsFill = recType === EMR_PIE || recType === EMR_CHORD;
    const clockwise = state.arcDirection === 2;
    const startPoint = rotated ? gmapPoint(rCtx, cxA + rx * Math.cos(startAngle), cyA + ry * Math.sin(startAngle)) : { x: params.cx + params.rx * Math.cos(startAngle), y: params.cy + params.ry * Math.sin(startAngle) };
    const build = (c) => {
      if (recType === EMR_PIE) {
        c.moveTo(params.cx, params.cy);
      }
      if (isArcTo) {
        c.lineTo(startPoint.x, startPoint.y);
      }
      c.ellipse(params.cx, params.cy, params.rx, params.ry, params.rotation, startAngle, endAngle, !clockwise);
      if (needsFill) {
        c.closePath();
      }
    };
    const kind = isArcTo ? "arcto" : recType === EMR_PIE ? "pie" : recType === EMR_CHORD ? "chord" : "arc";
    const rasterArgs = (immediate = false) => ({
      box: immediate && needsFill ? curvedFixBox(rCtx, l, t, r, b) : fixBox(rCtx, l, t, r, b),
      s: fixPoint(rCtx, startX, startY),
      e: fixPoint(rCtx, endX, endY),
      from: currentFix(rCtx)
    });
    if (inPath) {
      if (isArcTo) {
        continueFigure(rCtx);
      }
      build(gdiPathRecorder(rCtx));
      const a = rasterArgs();
      arcRasterPath(a.box, a.s, a.e, clockwise, kind, a.from, rasterPathOf(rCtx));
      if (needsFill) {
        rasterPathOf(rCtx).closeFigure();
      }
    } else {
      resetLineStyle(rCtx);
      ctx.beginPath();
      paintGdiShape(rCtx, {
        build: (c) => {
          c.beginPath();
          build(c);
        },
        raster: () => {
          const a = rasterArgs(true);
          return arcRasterPath(a.box, a.s, a.e, clockwise, kind, a.from).path;
        },
        fill: needsFill,
        stroke: true
      });
    }
    if (isArcTo) {
      const a = rasterArgs();
      const end = arcRasterPath(a.box, a.s, a.e, clockwise, "arc").end;
      const dx = Math.floor(end[0] / 16);
      const dy = Math.floor(end[1] / 16);
      const inv2 = invertAffine(gdiDeviceMatrix(rCtx));
      if (inv2) {
        state.curX = Math.round(inv2[0] * dx + inv2[2] * dy + inv2[4]);
        state.curY = Math.round(inv2[1] * dx + inv2[3] * dy + inv2[5]);
      } else {
        state.curX = Math.round(cxA + rx * Math.cos(endAngle));
        state.curY = Math.round(cyA + ry * Math.sin(endAngle));
      }
      rCtx.curFix = inPath ? { x: end[0], y: end[1], lx: state.curX, ly: state.curY } : { x: dx * 16, y: dy * 16, lx: state.curX, ly: state.curY };
    }
  }
  return true;
}
function handleAngleArc(rCtx, dataOff, recSize) {
  const { view, state, inPath } = rCtx;
  if (recSize < 28) {
    return true;
  }
  const cx = view.getInt32(dataOff, true);
  const cy = view.getInt32(dataOff + 4, true);
  const radius = view.getUint32(dataOff + 8, true);
  const startDeg = view.getFloat32(dataOff + 12, true);
  const sweepDeg = view.getFloat32(dataOff + 16, true);
  if (!Number.isFinite(startDeg) || !Number.isFinite(sweepDeg) || radius > 2147483647) {
    return true;
  }
  const a0 = startDeg * Math.PI / 180;
  const a1 = (startDeg + sweepDeg) * Math.PI / 180;
  const sx = cx + radius * Math.cos(a0);
  const sy = cy - radius * Math.sin(a0);
  const ex = cx + radius * Math.cos(a1);
  const ey = cy - radius * Math.sin(a1);
  const clockwise = sweepDeg < 0;
  const turns = Math.min(8, Math.trunc(Math.abs(sweepDeg) / 360));
  const circleBox = fixBox(rCtx, cx - radius, cy - radius, cx + radius, cy + radius);
  let fixPts;
  if (isAxisBox(circleBox)) {
    fixPts = angleArcFix(circleBox, startDeg, sweepDeg);
  } else {
    fixPts = [...fixPoint(rCtx, cx + radius * Math.cos(a0), cy - radius * Math.sin(a0))];
    for (const p of angleArcPieces(startDeg, sweepDeg)) {
      const bz = circularArcBezier(cx, cy, radius, radius, p.from, p.to);
      for (let i = 0; i < 6; i += 2) {
        fixPts.push(...fixPoint(rCtx, bz[i], bz[i + 1]));
      }
    }
  }
  const e = [fixPts[fixPts.length - 2], fixPts[fixPts.length - 1]];
  const buildRaster = (path, from) => {
    path.continueAt(from[0], from[1]);
    path.addBeziers(fixPts, false);
  };
  const params = gdiEllipseParams(rCtx, cx, cy, radius, radius);
  const startPx = gmapPoint(rCtx, sx, sy);
  const buildCanvas = (c) => {
    c.lineTo(startPx.x, startPx.y);
    if (radius === 0) {
      return;
    }
    const span = Math.min(Math.abs(a1 - a0), Math.PI * 2 * (turns + 1));
    c.ellipse(params.cx, params.cy, params.rx, params.ry, params.rotation, -a0, clockwise ? -a0 + span : -a0 - span, !clockwise);
  };
  if (inPath) {
    continueFigure(rCtx);
    buildCanvas(gdiPathRecorder(rCtx));
    buildRaster(rasterPathOf(rCtx), currentFix(rCtx));
  } else {
    resetLineStyle(rCtx);
    const from = currentFix(rCtx);
    const fromPx = gmapPoint(rCtx, state.curX, state.curY);
    paintGdiShape(rCtx, {
      build: (c) => {
        c.beginPath();
        c.moveTo(fromPx.x, fromPx.y);
        buildCanvas(c);
      },
      raster: () => {
        const path = new GdiRasterPath();
        buildRaster(path, from);
        return path;
      },
      fill: false,
      stroke: true
    });
  }
  const dx = Math.floor(e[0] / 16);
  const dy = Math.floor(e[1] / 16);
  const inv2 = invertAffine(gdiDeviceMatrix(rCtx));
  state.curX = inv2 ? Math.round(inv2[0] * dx + inv2[2] * dy + inv2[4]) : Math.round(ex);
  state.curY = inv2 ? Math.round(inv2[1] * dx + inv2[3] * dy + inv2[5]) : Math.round(ey);
  rCtx.curFix = inPath ? { x: e[0], y: e[1], lx: state.curX, ly: state.curY } : { x: dx * 16, y: dy * 16, lx: state.curX, ly: state.curY };
  return true;
}
function handleEmfGdiShapeRecord(rCtx, recType, dataOff, recSize) {
  switch (recType) {
    case EMR_SETPIXELV:
      return handleSetPixelV(rCtx, dataOff, recSize);
    case EMR_MOVETOEX:
      return handleMoveToEx(rCtx, dataOff, recSize);
    case EMR_LINETO:
      return handleLineTo(rCtx, dataOff, recSize);
    case EMR_RECTANGLE:
      return handleRectangle(rCtx, dataOff, recSize);
    case EMR_ROUNDRECT:
      return handleRoundRect(rCtx, dataOff, recSize);
    case EMR_ELLIPSE:
      return handleEllipse(rCtx, dataOff, recSize);
    case EMR_ANGLEARC:
      return handleAngleArc(rCtx, dataOff, recSize);
    case EMR_ARC:
    case EMR_ARCTO:
    case EMR_CHORD:
    case EMR_PIE:
      return handleArcFamily(rCtx, recType, dataOff, recSize);
    default:
      return false;
  }
}

// src/emf-gdi-color-adjust.ts
var CA_NEGATIVE = 1;
var CA_LOG_FILTER = 2;
var COLOR_ADJUSTMENT_SIZE = 24;
function readColorAdjustment(view, off) {
  const ca = {
    flags: view.getUint16(off + 2, true),
    illuminant: view.getUint16(off + 4, true),
    redGamma: view.getUint16(off + 6, true),
    greenGamma: view.getUint16(off + 8, true),
    blueGamma: view.getUint16(off + 10, true),
    referenceBlack: view.getUint16(off + 12, true),
    referenceWhite: view.getUint16(off + 14, true),
    contrast: view.getInt16(off + 16, true),
    brightness: view.getInt16(off + 18, true),
    colorfulness: view.getInt16(off + 20, true),
    redGreenTint: view.getInt16(off + 22, true)
  };
  const within = (v, lo, hi) => v >= lo && v <= hi;
  const valid = (ca.flags & -4) === 0 && within(ca.illuminant, 0, 8) && within(ca.redGamma, 2500, 65e3) && within(ca.greenGamma, 2500, 65e3) && within(ca.blueGamma, 2500, 65e3) && within(ca.referenceBlack, 0, 4e3) && within(ca.referenceWhite, 6e3, 1e4) && within(ca.contrast, -100, 100) && within(ca.brightness, -100, 100) && within(ca.colorfulness, -100, 100) && within(ca.redGreenTint, -100, 100);
  return valid ? ca : null;
}
function isIdentityColorAdjustment(ca) {
  return !ca || ca.flags === 0 && ca.redGamma === 1e4 && ca.greenGamma === 1e4 && ca.blueGamma === 1e4 && ca.referenceBlack === 0 && ca.referenceWhite === 1e4 && ca.contrast === 0 && ca.brightness === 0 && ca.colorfulness === 0 && ca.redGreenTint === 0;
}
var CONTRAST_GAIN = 1.88;
var BRIGHTNESS_GAIN = 78.5;
var COLORFULNESS_GAIN = 1.335;
var TINT_RADIANS = -1.135;
var RGB_TO_XYZ = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505]
];
var XYZ_TO_RGB = invert3(RGB_TO_XYZ);
var WHITE = RGB_TO_XYZ.map((row) => row[0] + row[1] + row[2]);
var WHITE_D = WHITE[0] + 15 * WHITE[1] + 3 * WHITE[2];
var WHITE_U = 4 * WHITE[0] / WHITE_D;
var WHITE_V = 9 * WHITE[1] / WHITE_D;
function invert3(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, (c * h - b * i) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, (c * d - a * f) / det],
    [C / det, (b * g - a * h) / det, (a * e - b * d) / det]
  ];
}
function lightness(t) {
  return t > 8856e-6 ? 116 * Math.cbrt(t) - 16 : 903.3 * t;
}
function fromLightness(l) {
  return l > 8 ? ((l + 16) / 116) ** 3 : l / 903.3;
}
var clamp012 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
function colorAdjustmentMapper(ca) {
  const black = ca.referenceBlack / 1e4;
  const span = Math.max(1e-6, ca.referenceWhite / 1e4 - black);
  const gammas = [ca.redGamma / 1e4, ca.greenGamma / 1e4, ca.blueGamma / 1e4];
  const negative = (ca.flags & CA_NEGATIVE) !== 0;
  const linear = gammas.map((gamma) => {
    const table = new Float64Array(256);
    for (let i = 0; i < 256; i++) {
      const v = negative ? 1 - i / 255 : i / 255;
      table[i] = clamp012((v - black) / span) ** gamma;
    }
    return table;
  });
  const chroma = ca.colorfulness < 0 ? 1 + ca.colorfulness / 100 : 1 + COLORFULNESS_GAIN * ca.colorfulness / 100;
  const angle = TINT_RADIANS * ca.redGreenTint / 100;
  const cos = Math.cos(angle) * chroma;
  const sin = Math.sin(angle) * chroma;
  const slope = Math.exp(CONTRAST_GAIN * ca.contrast / 100);
  const offset = 50 - 50 * slope + BRIGHTNESS_GAIN * ca.brightness / 100;
  const log = (ca.flags & CA_LOG_FILTER) !== 0;
  const colour = ca.colorfulness !== 0 || ca.redGreenTint !== 0;
  const out = (v, c) => {
    v = clamp012(fromLightness(slope * lightness(clamp012(v)) + offset)) ** (1 / gammas[c]);
    if (log) {
      v = Math.log10(1 + 9 * v);
    }
    return Math.round(v * 255);
  };
  return (rgb2) => {
    let r = linear[0][rgb2 >> 16 & 255];
    let g = linear[1][rgb2 >> 8 & 255];
    let b = linear[2][rgb2 & 255];
    if (colour) {
      const x = RGB_TO_XYZ[0][0] * r + RGB_TO_XYZ[0][1] * g + RGB_TO_XYZ[0][2] * b;
      const y = RGB_TO_XYZ[1][0] * r + RGB_TO_XYZ[1][1] * g + RGB_TO_XYZ[1][2] * b;
      const z = RGB_TO_XYZ[2][0] * r + RGB_TO_XYZ[2][1] * g + RGB_TO_XYZ[2][2] * b;
      const d = x + 15 * y + 3 * z;
      if (d > 1e-12 && y > 1e-12) {
        const du = 4 * x / d - WHITE_U;
        const dv = 9 * y / d - WHITE_V;
        const u = WHITE_U + du * cos - dv * sin;
        const v = Math.max(1e-6, WHITE_V + du * sin + dv * cos);
        const x2 = y * 9 * u / (4 * v);
        const z2 = y * (12 - 3 * u - 20 * v) / (4 * v);
        r = XYZ_TO_RGB[0][0] * x2 + XYZ_TO_RGB[0][1] * y + XYZ_TO_RGB[0][2] * z2;
        g = XYZ_TO_RGB[1][0] * x2 + XYZ_TO_RGB[1][1] * y + XYZ_TO_RGB[1][2] * z2;
        b = XYZ_TO_RGB[2][0] * x2 + XYZ_TO_RGB[2][1] * y + XYZ_TO_RGB[2][2] * z2;
      }
    }
    return out(r, 0) << 16 | out(g, 1) << 8 | out(b, 2);
  };
}
function colorAdjustRgb(rgbs, ca) {
  if (!ca || isIdentityColorAdjustment(ca)) {
    return;
  }
  const map = colorAdjustmentMapper(ca);
  const cache = /* @__PURE__ */ new Map();
  for (let i = 0; i + 2 < rgbs.length; i += 3) {
    const rgb2 = rgbs[i] << 16 | rgbs[i + 1] << 8 | rgbs[i + 2];
    let v = cache.get(rgb2);
    if (v === void 0) {
      v = map(rgb2);
      if (cache.size < 65536) {
        cache.set(rgb2, v);
      }
    }
    rgbs[i] = v >> 16 & 255;
    rgbs[i + 1] = v >> 8 & 255;
    rgbs[i + 2] = v & 255;
  }
}
function applyColorAdjustment(pixels, ca) {
  if (!ca || isIdentityColorAdjustment(ca)) {
    return;
  }
  const map = colorAdjustmentMapper(ca);
  const d = pixels.data;
  const cache = /* @__PURE__ */ new Map();
  for (let i = 0; i + 3 < d.length; i += 4) {
    const rgb2 = d[i] << 16 | d[i + 1] << 8 | d[i + 2];
    let v = cache.get(rgb2);
    if (v === void 0) {
      v = map(rgb2);
      if (cache.size < 65536) {
        cache.set(rgb2, v);
      }
    }
    d[i] = v >> 16 & 255;
    d[i + 1] = v >> 8 & 255;
    d[i + 2] = v & 255;
  }
}

// src/emf-gdi-stretch.ts
var BLACKONWHITE = 1;
var WHITEONBLACK = 2;
var HALFTONE = 4;
function gdiNearest(i, srcLen, dstLen) {
  const k = Math.floor((2 * i + 1) * srcLen / (2 * dstLen));
  return Math.max(0, Math.min(srcLen - 1, k));
}
function axisSamples(srcStart, srcLen, dstLen, reverse, combine) {
  const out = [];
  const at = (k) => reverse ? srcStart + srcLen - 1 - k : srcStart + k;
  if (dstLen <= 0 || srcLen <= 0) {
    return out;
  }
  let prev = -1;
  for (let i = 0; i < dstLen; i++) {
    const c = gdiNearest(i, srcLen, dstLen);
    const run = [];
    const from = combine && dstLen < srcLen ? prev + 1 : c;
    for (let k = from; k <= c; k++) {
      run.push(at(k));
    }
    out.push(run);
    prev = c;
  }
  return out;
}
function stretchGdi(src, sx, sy, sw, sh, dw, dh, mode) {
  const W = Math.max(0, Math.round(Math.abs(dw)));
  const H = Math.max(0, Math.round(Math.abs(dh)));
  const flipX = dw < 0 !== sw < 0;
  const flipY = dh < 0 !== sh < 0;
  const combine = mode === BLACKONWHITE || mode === WHITEONBLACK;
  const cols = axisSamples(Math.round(Math.min(sx, sx + sw)), Math.round(Math.abs(sw)), W, flipX, combine);
  const rows = axisSamples(Math.round(Math.min(sy, sy + sh)), Math.round(Math.abs(sh)), H, flipY, combine);
  const data = new Uint8ClampedArray(W * H * 4);
  const s = src.data;
  const read = (x, y) => {
    if (x < 0 || y < 0 || x >= src.width || y >= src.height) {
      return 0;
    }
    const i = (y * src.width + x) * 4;
    return s[i] << 16 | s[i + 1] << 8 | s[i + 2];
  };
  for (let y = 0; y < H; y++) {
    const ys = rows[y] ?? [];
    for (let x = 0; x < W; x++) {
      const xs = cols[x] ?? [];
      let v = mode === BLACKONWHITE ? 16777215 : 0;
      let first = true;
      for (const yy of ys) {
        for (const xx of xs) {
          const p = read(xx, yy);
          if (mode === BLACKONWHITE) {
            v &= p;
          } else if (mode === WHITEONBLACK) {
            v |= p;
          } else if (first) {
            v = p;
          }
          first = false;
        }
      }
      const o = (y * W + x) * 4;
      data[o] = v >> 16 & 255;
      data[o + 1] = v >> 8 & 255;
      data[o + 2] = v & 255;
      data[o + 3] = 255;
    }
  }
  return { width: W, height: H, data };
}
var FIX = 65536;
function halftoneNearest(i, srcLen, dstLen) {
  const num = (2 * i + 1) * srcLen;
  const den = 2 * dstLen;
  let k = Math.floor(num / den);
  if (k * den === num) {
    k--;
  }
  return Math.max(0, Math.min(srcLen - 1, k));
}
function halftoneAxis(start, srcLen, dstLen, reverse) {
  const taps = [];
  if (dstLen <= 0 || srcLen <= 0) {
    return taps;
  }
  const at = (k) => reverse ? start + srcLen - 1 - k : start + k;
  if (dstLen >= srcLen) {
    for (let i = 0; i < dstLen; i++) {
      taps.push([[at(halftoneNearest(i, srcLen, dstLen)), 1]]);
    }
    return taps;
  }
  const step = Math.ceil(srcLen * FIX / dstLen);
  for (let i = 0; i < dstLen; i++) {
    const a = i * step;
    const b = (i + 1) * step;
    const run = [];
    for (let k = Math.floor(a / FIX); k * FIX < b && k < srcLen; k++) {
      const overlap = Math.min(b, (k + 1) * FIX) - Math.max(a, k * FIX);
      if (overlap > 0) {
        run.push([at(k), overlap]);
      }
    }
    taps.push(run);
  }
  return taps;
}
var SPECKLE_OVERSHOOT = 4;
function halftoneDespeckle(px, w, h) {
  const src = px.slice();
  const at = (x, y, c) => src[(y * w + x) * 3 + c];
  const over = (v) => v < -SPECKLE_OVERSHOOT * 4 || v > (255 + SPECKLE_OVERSHOOT) * 4;
  for (let y = 0; y < h; y++) {
    const up = y > 0 ? y - 1 : Math.min(h - 1, y + 1);
    const down = y < h - 1 ? y + 1 : Math.max(0, y - 1);
    for (let x = 0; x < w; x++) {
      const left = x > 0 ? x - 1 : Math.min(w - 1, x + 1);
      const right = x < w - 1 ? x + 1 : Math.max(0, x - 1);
      let hClip = 0;
      let vClip = 0;
      for (let c = 0; c < 3; c++) {
        const v = at(x, y, c);
        if (over(6 * v - at(left, y, c) - at(right, y, c))) {
          hClip++;
        }
        if (over(6 * v - at(x, up, c) - at(x, down, c))) {
          vClip++;
        }
      }
      if (hClip < 2 || vClip < 2) {
        continue;
      }
      for (let c = 0; c < 3; c++) {
        px[(y * w + x) * 3 + c] = at(left, y, c) + 2 * at(x, y, c) + at(right, y, c) + 2 >> 2;
      }
    }
  }
}
function halftoneSharpen(px, w, h) {
  const src = px.slice();
  const at = (x, y, c) => src[(Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))) * 3 + c];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        const v = at(x, y, c);
        const sum = at(x - 1, y, c) + at(x + 1, y, c) + at(x, y - 1, c) + at(x, y + 1, c);
        const out = v + Math.floor((4 * v - sum) / 8);
        px[(y * w + x) * 3 + c] = out < 0 ? 0 : out > 255 ? 255 : out;
      }
    }
  }
}
function stretchHalftone(src, sx, sy, sw, sh, dw, dh, adjust) {
  const W = Math.max(0, Math.round(Math.abs(dw)));
  const H = Math.max(0, Math.round(Math.abs(dh)));
  const SW = Math.round(Math.abs(sw));
  const SH = Math.round(Math.abs(sh));
  const x0 = Math.round(Math.min(sx, sx + sw));
  const y0 = Math.round(Math.min(sy, sy + sh));
  const flipX = dw < 0 !== sw < 0;
  const flipY = dh < 0 !== sh < 0;
  const data = new Uint8ClampedArray(W * H * 4);
  if (W === 0 || H === 0 || SW === 0 || SH === 0) {
    return { width: W, height: H, data };
  }
  const rect = new Int32Array(SW * SH * 3);
  for (let y = 0; y < SH; y++) {
    const yy = y0 + y;
    for (let x = 0; x < SW; x++) {
      const xx = x0 + x;
      if (yy < 0 || yy >= src.height || xx < 0 || xx >= src.width) {
        continue;
      }
      const i = (yy * src.width + xx) * 4;
      const o = (y * SW + x) * 3;
      rect[o] = src.data[i];
      rect[o + 1] = src.data[i + 1];
      rect[o + 2] = src.data[i + 2];
    }
  }
  const enlarging = W >= SW && H >= SH && (W > SW || H > SH);
  const reducing = W < SW && H < SH;
  if (enlarging) {
    halftoneDespeckle(rect, SW, SH);
  }
  if (adjust) {
    adjust(rect);
  }
  const cols = halftoneAxis(0, SW, W, flipX);
  const rows = halftoneAxis(0, SH, H, flipY);
  const out = new Int32Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    const ys = rows[y];
    for (let x = 0; x < W; x++) {
      const xs = cols[x];
      let r = 0;
      let g = 0;
      let b = 0;
      let total = 0;
      for (const [yy, wy] of ys) {
        for (const [xx, wx] of xs) {
          const w = wx * wy;
          total += w;
          const i = (yy * SW + xx) * 3;
          r += rect[i] * w;
          g += rect[i + 1] * w;
          b += rect[i + 2] * w;
        }
      }
      const o = (y * W + x) * 3;
      out[o] = Math.floor((2 * r + total) / (2 * total));
      out[o + 1] = Math.floor((2 * g + total) / (2 * total));
      out[o + 2] = Math.floor((2 * b + total) / (2 * total));
    }
  }
  if (reducing) {
    halftoneSharpen(out, W, H);
  }
  for (let i = 0, o = 0; i < W * H; i++, o += 3) {
    data[i * 4] = out[o];
    data[i * 4 + 1] = out[o + 1];
    data[i * 4 + 2] = out[o + 2];
    data[i * 4 + 3] = 255;
  }
  return { width: W, height: H, data };
}

// src/emf-gdi-draw-bitmap.ts
function patternOperand(rCtx, brush) {
  if (brush.kind === "solid") {
    return brush.rgb;
  }
  if (brush.kind === "none") {
    return 0;
  }
  const { state, bounds } = rCtx;
  const sx = rCtx.sx || 1;
  const sy = rCtx.sy || 1;
  return (x, y) => sampleTile(
    brush,
    Math.floor(bounds.left + (x + 0.5) / sx),
    Math.floor(bounds.top + (y + 0.5) / sy),
    state.brushOrgX,
    state.brushOrgY
  );
}
function drawSourceMapped(target, decoded, req, offsetX, offsetY, mode) {
  const dLeft = Math.min(req.dx, req.dx + req.dw) - offsetX;
  const dTop = Math.min(req.dy, req.dy + req.dh) - offsetY;
  const px = mode === HALFTONE ? stretchHalftone(decoded.pixels, req.sx, req.sy, req.sw, req.sh, req.dw, req.dh, decoded.adjust) : stretchGdi(decoded.pixels, req.sx, req.sy, req.sw, req.sh, req.dw, req.dh, mode);
  if (px.width === 0 || px.height === 0) {
    return;
  }
  const tile = createTempCanvas(px.width, px.height);
  if (!tile) {
    return;
  }
  canvasPutImageData(tile.ctx, createImageDataCompat(px.data, px.width, px.height), 0, 0);
  target.save();
  target.globalCompositeOperation = "source-over";
  canvasDrawImage(target, tile.canvas, Math.round(dLeft), Math.round(dTop), px.width, px.height);
  target.restore();
}
function decodeSource(rCtx, req) {
  if (!req.source) {
    return null;
  }
  const image = decodeDibToImageData(
    rCtx.view,
    req.source.bmi,
    req.source.bits,
    req.source.cbBits,
    req.source.palColors ? paletteEntries(rCtx.state) : null
  );
  if (!image) {
    return null;
  }
  const ca = rCtx.state.colorAdjustment;
  const adjust = req.stretch && rCtx.state.stretchBltMode === HALFTONE && ca ? (rgb2) => colorAdjustRgb(rgb2, ca) : void 0;
  let { sy } = req;
  if (req.dibOrigin === "bottom-left" && rCtx.view.getInt32(req.source.bmi + 8, true) > 0) {
    sy = image.height - sy - req.sh;
  }
  return {
    decoded: { pixels: image, adjust },
    req: { ...req, sy }
  };
}
function fillRectWith(ctx, style, gco, req) {
  const prevGco = ctx.globalCompositeOperation;
  const prevFill = ctx.fillStyle;
  ctx.globalCompositeOperation = gco;
  ctx.fillStyle = style;
  ctx.fillRect(req.dx, req.dy, req.dw, req.dh);
  ctx.globalCompositeOperation = prevGco;
  ctx.fillStyle = prevFill;
}
var ROP3_BLEND_APPROX = {
  136: [204, "multiply"],
  // SRCAND: S & D
  34: [51, "multiply"],
  // ~S & D
  238: [204, "screen"],
  // SRCPAINT: S | D
  187: [51, "screen"],
  // MERGEPAINT: ~S | D
  102: [204, "difference"],
  // SRCINVERT: S ^ D
  153: [51, "difference"],
  // ~(S ^ D)
  160: [240, "multiply"],
  // P & D
  10: [15, "multiply"],
  // ~P & D
  250: [240, "screen"],
  // P | D
  175: [15, "screen"],
  // ~P | D
  90: [240, "difference"],
  // PATINVERT: P ^ D
  165: [15, "difference"]
  // ~(P ^ D)
};
function runTernary(rCtx, req, index, usesP, usesS) {
  const { ctx } = rCtx;
  const rect = clampPositiveRect(req.dx, req.dy, req.dw, req.dh, rCtx.canvasW, rCtx.canvasH);
  if (!rect) {
    return;
  }
  if (typeof ctx.getImageData !== "function") {
    return;
  }
  let blend = "source-over";
  if (!canReadBack(ctx) && rop3Operands(index).usesD) {
    const approx = ROP3_BLEND_APPROX[index];
    if (!approx) {
      emfWarn(`runTernary: ROP3 0x${index.toString(16)} needs the destination, which SVG output without a raster mirror cannot read; skipped`);
      return;
    }
    [index, blend] = approx;
    usesP = rop3Operands(index).usesP;
    usesS = rop3Operands(index).usesS;
  }
  const brush = realizeBrush(rCtx.state);
  if (usesP && brush.kind === "none") {
    return;
  }
  const layer = createTempCanvas(rect.w, rect.h);
  if (!layer) {
    return;
  }
  let src = null;
  if (usesS) {
    const decoded = decodeSource(rCtx, req);
    if (!decoded) {
      return;
    }
    drawSourceMapped(layer.ctx, decoded.decoded, decoded.req, rect.x, rect.y, rCtx.state.stretchBltMode);
    src = canvasGetImageData(layer.ctx, 0, 0, rect.w, rect.h);
  }
  const dst = canvasGetImageData(ctx, rect.x, rect.y, rect.w, rect.h);
  const pattern = patternOperand(rCtx, brush);
  applyRop3(dst, src, pattern, index, rect.x, rect.y);
  const unknown = blend === "source-over" && rop3Operands(index).usesD ? unknownDestination(ctx, rect) : null;
  let layers = [];
  if (unknown) {
    const sd = src ? src.data : null;
    const pAt = (i) => typeof pattern === "number" ? pattern : pattern(rect.x + i % rect.w, rect.y + Math.floor(i / rect.w));
    const sAt = (i) => sd ? sd[i * 4] << 16 | sd[i * 4 + 1] << 8 | sd[i * 4 + 2] : 0;
    const approx = ROP3_BLEND_APPROX[index];
    layers = splitUnknownDestination(
      dst.data,
      rect.w * rect.h,
      unknown,
      (i, d) => evalRop3(index, pAt(i), sAt(i), d),
      approx ? (i) => ({ color: evalRop3(approx[0], pAt(i), sAt(i), 0), mode: approx[1] }) : void 0
    );
  }
  canvasPutImageData(layer.ctx, dst, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = blend;
  ctx.globalAlpha = 1;
  canvasDrawImage(ctx, layer.canvas, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  drawBlendLayers(ctx, rect, layers);
}
function nudgedSign(v, dx, dy) {
  return v !== 0 ? Math.sign(v) : dx !== 0 ? Math.sign(dx) : Math.sign(dy);
}
function inHalfOpen(n, den, dx, dy) {
  return nudgedSign(n, dx, dy) >= 0 && nudgedSign(n - den, dx, dy) < 0;
}
function nudgedFloor(num, den, dx, dy) {
  const q = Math.floor(num / den);
  return num === q * den && nudgedSign(0, dx, dy) < 0 ? q - 1 : q;
}
function executeRotatedBlit(rCtx, logDx, logDy, logDw, logDh, rop, source, sx, sy, sw, sh, dibOrigin, stretch) {
  const { ctx } = rCtx;
  const index = rop3Index(rop);
  if (index === 170) {
    return;
  }
  const operands = rop3Operands(index);
  if (!canReadBack(ctx) && operands.usesD) {
    return;
  }
  if (typeof ctx.getImageData !== "function") {
    return;
  }
  if (logDw === 0 || logDh === 0) {
    return;
  }
  const brush = realizeBrush(rCtx.state);
  if (operands.usesP && brush.kind === "none") {
    return;
  }
  const pattern = patternOperand(rCtx, brush);
  let src = null;
  let srcX = sx;
  let srcY = sy;
  if (operands.usesS) {
    const decoded = decodeSource(rCtx, {
      plan: { kind: "ternary", index, operands },
      dx: 0,
      dy: 0,
      dw: logDw,
      dh: logDh,
      source,
      sx,
      sy,
      sw,
      sh,
      dibOrigin,
      stretch
    });
    if (!decoded) {
      return;
    }
    src = decoded.decoded.pixels;
    if (decoded.decoded.adjust) {
      applyColorAdjustment(src, rCtx.state.colorAdjustment);
    }
    srcX = decoded.req.sx;
    srcY = decoded.req.sy;
  }
  const texel = (ix, iy) => {
    if (!src) {
      return 0;
    }
    let tx = sw < 0 ? srcX - 1 - ix : srcX + ix;
    let ty = sh < 0 ? srcY - 1 - iy : srcY + iy;
    tx = Math.max(0, Math.min(src.width - 1, tx));
    ty = Math.max(0, Math.min(src.height - 1, ty));
    const i = (ty * src.width + tx) * 4;
    return src.data[i] << 16 | src.data[i + 1] << 8 | src.data[i + 2];
  };
  paintParallelogram(
    rCtx,
    fixPoint(rCtx, logDx, logDy),
    fixPoint(rCtx, logDx + logDw, logDy),
    fixPoint(rCtx, logDx, logDy + logDh),
    sw,
    sh,
    (ix, iy, x, y, d) => {
      const s = operands.usesS ? texel(ix, iy) : 0;
      const p = typeof pattern === "function" ? pattern(x, y) : pattern;
      return evalRop3(index, p, s, d);
    }
  );
}
function paintParallelogram(rCtx, a, b, q, sw, sh, pixel) {
  const [ax, ay] = a;
  const exx = b[0] - ax;
  const exy = b[1] - ay;
  const eyx = q[0] - ax;
  const eyy = q[1] - ay;
  let det = exx * eyy - exy * eyx;
  if (det === 0) {
    return;
  }
  const sign = det < 0 ? -1 : 1;
  det *= sign;
  const xs = [ax, b[0], q[0], b[0] + eyx];
  const ys = [ay, b[1], q[1], b[1] + eyy];
  const x0 = Math.max(0, Math.floor(Math.min(...xs) / 16) - 1);
  const y0 = Math.max(0, Math.floor(Math.min(...ys) / 16) - 1);
  const x1 = Math.min(rCtx.canvasW, Math.ceil(Math.max(...xs) / 16) + 2);
  const y1 = Math.min(rCtx.canvasH, Math.ceil(Math.max(...ys) / 16) + 2);
  if (x1 <= x0 || y1 <= y0) {
    return;
  }
  const asw = Math.abs(sw) || 1;
  const ash = Math.abs(sh) || 1;
  const dux = sign * eyy;
  const duy = -sign * eyx;
  const dvx = -sign * exy;
  const dvy = sign * exx;
  rewritePixels(rCtx.ctx, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (x, y, d) => {
    const px = x * 16 - ax;
    const py = y * 16 - ay;
    const un = sign * (px * eyy - py * eyx);
    const vn = sign * (exx * py - exy * px);
    if (!inHalfOpen(un, det, dux, duy) || !inHalfOpen(vn, det, dvx, dvy)) {
      return -1;
    }
    const ix = Math.min(asw - 1, nudgedFloor(un * asw, det, dux, duy));
    const iy = Math.min(ash - 1, nudgedFloor(vn * ash, det, dvx, dvy));
    return pixel(ix, iy, x, y, d);
  });
}
function alignMirroredDest(rCtx, req) {
  const pxX = gdiDevicePixelX(rCtx);
  const pxY = gdiDevicePixelY(rCtx);
  return {
    ...req,
    dx: req.dw < 0 ? req.dx + pxX : req.dx,
    dy: req.dh < 0 ? req.dy + pxY : req.dy
  };
}
function executeBlit(rCtx, request) {
  const { ctx } = rCtx;
  const req = alignMirroredDest(rCtx, request);
  const plan = req.plan;
  switch (plan.kind) {
    case "noop":
      return;
    case "solid":
      fillRectWith(ctx, plan.color === "black" ? "#000000" : "#ffffff", "source-over", req);
      return;
    case "invert-dest":
      fillRectWith(ctx, "#ffffff", "difference", req);
      return;
    case "copy": {
      const decoded = decodeSource(rCtx, req);
      if (decoded) {
        drawSourceMapped(ctx, decoded.decoded, decoded.req, 0, 0, rCtx.state.stretchBltMode);
      }
      return;
    }
    case "ternary": {
      const brush = realizeBrush(rCtx.state);
      if (plan.index === 240 && brush.kind !== "tile") {
        if (brush.kind === "solid") {
          fillRectWith(ctx, rCtx.state.brushColor, "source-over", req);
        }
        return;
      }
      runTernary(rCtx, req, plan.index, plan.operands.usesP, plan.operands.usesS);
    }
  }
}
function sourceOf(offset, offBmi, cbBmi, offBits, cbBits, usage = 0) {
  return offBmi > 0 && cbBmi > 0 && offBits > 0 && cbBits > 0 ? { bmi: offset + offBmi, bits: offset + offBits, cbBits, ...usage === 1 ? { palColors: true } : {} } : null;
}
function handleBlt(rCtx, offset, dataOff, recSize, stretch) {
  const { view } = rCtx;
  if (recSize < (stretch ? 108 : 96)) {
    return true;
  }
  const xDest = view.getInt32(dataOff + 16, true);
  const yDest = view.getInt32(dataOff + 20, true);
  const cxDest = view.getInt32(dataOff + 24, true);
  const cyDest = view.getInt32(dataOff + 28, true);
  const rop = view.getUint32(dataOff + 32, true);
  const xSrc = view.getInt32(dataOff + 36, true);
  const ySrc = view.getInt32(dataOff + 40, true);
  const m11 = view.getFloat32(dataOff + 44, true);
  const m12 = view.getFloat32(dataOff + 48, true);
  const m21 = view.getFloat32(dataOff + 52, true);
  const m22 = view.getFloat32(dataOff + 56, true);
  const mdx = view.getFloat32(dataOff + 60, true);
  const mdy = view.getFloat32(dataOff + 64, true);
  const cxSrc = stretch ? view.getInt32(dataOff + 92, true) : cxDest;
  const cySrc = stretch ? view.getInt32(dataOff + 96, true) : cyDest;
  const source = recSize >= 100 ? sourceOf(
    offset,
    view.getUint32(dataOff + 76, true),
    view.getUint32(dataOff + 80, true),
    view.getUint32(dataOff + 84, true),
    view.getUint32(dataOff + 88, true),
    view.getUint32(dataOff + 72, true)
  ) : null;
  const identity = m11 === 0 && m22 === 0 && m12 === 0 && m21 === 0;
  const a = identity ? 1 : m11;
  const d = identity ? 1 : m22;
  const srcRect = {
    sx: a * xSrc + (identity ? 0 : m21 * ySrc + mdx),
    sy: d * ySrc + (identity ? 0 : m12 * xSrc + mdy),
    sw: a * cxSrc,
    sh: d * cySrc
  };
  if (hasWorldRotation(rCtx)) {
    executeRotatedBlit(
      rCtx,
      xDest,
      yDest,
      cxDest,
      cyDest,
      rop,
      source,
      srcRect.sx,
      srcRect.sy,
      srcRect.sw,
      srcRect.sh,
      "top-left",
      stretch
    );
    return true;
  }
  executeBlit(rCtx, {
    plan: classifyRop3(rop),
    dx: gmx(rCtx, xDest),
    dy: gmy(rCtx, yDest),
    dw: gmw(rCtx, cxDest),
    dh: gmh(rCtx, cyDest),
    source,
    ...srcRect,
    dibOrigin: "top-left",
    stretch
  });
  return true;
}
function handleStretchDibits(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 80) {
    return true;
  }
  const xDest = view.getInt32(dataOff + 16, true);
  const yDest = view.getInt32(dataOff + 20, true);
  const cxDest = view.getInt32(dataOff + 64, true);
  const cyDest = view.getInt32(dataOff + 68, true);
  const rop = view.getUint32(dataOff + 60, true);
  const source = sourceOf(
    offset,
    view.getUint32(dataOff + 40, true),
    view.getUint32(dataOff + 44, true),
    view.getUint32(dataOff + 48, true),
    view.getUint32(dataOff + 52, true),
    view.getUint32(dataOff + 56, true)
  );
  const sx = view.getInt32(dataOff + 24, true);
  const sy = view.getInt32(dataOff + 28, true);
  const sw = view.getInt32(dataOff + 32, true);
  const sh = view.getInt32(dataOff + 36, true);
  if (hasWorldRotation(rCtx)) {
    executeRotatedBlit(rCtx, xDest, yDest, cxDest, cyDest, rop, source, sx, sy, sw, sh, "bottom-left", true);
    return true;
  }
  executeBlit(rCtx, {
    plan: classifyRop3(rop),
    dx: gmx(rCtx, xDest),
    dy: gmy(rCtx, yDest),
    dw: gmw(rCtx, cxDest),
    dh: gmh(rCtx, cyDest),
    source,
    sx,
    sy,
    sw,
    sh,
    dibOrigin: "bottom-left",
    stretch: true
  });
  return true;
}
function handleEmfGdiBitmapRecord(rCtx, recType, offset, dataOff, recSize) {
  switch (recType) {
    case EMR_BITBLT:
      return handleBlt(rCtx, offset, dataOff, recSize, false);
    case EMR_STRETCHBLT:
      return handleBlt(rCtx, offset, dataOff, recSize, true);
    case EMR_STRETCHDIBITS:
      return handleStretchDibits(rCtx, offset, dataOff, recSize);
    default:
      return false;
  }
}

// src/emf-gdi-blend-blits.ts
function readSource(rCtx, offset, offBmi, cbBmi, offBits, cbBits, usage, rawAlpha = false) {
  if (!offBmi || !cbBmi || !offBits || !cbBits) {
    return null;
  }
  return decodeDibToImageData(
    rCtx.view,
    offset + offBmi,
    offset + offBits,
    cbBits,
    usage === 1 ? paletteEntries(rCtx.state) : null,
    rawAlpha
  );
}
function readMask(rCtx, offset, offBmi, cbBmi, offBits, cbBits) {
  const { view } = rCtx;
  if (!offBmi || !cbBmi || !offBits || !cbBits) {
    return null;
  }
  const bmi = offset + offBmi;
  if (bmi + 16 > view.byteLength) {
    return null;
  }
  const width = view.getInt32(bmi + 4, true);
  const heightRaw = view.getInt32(bmi + 8, true);
  const height = Math.abs(heightRaw);
  if (view.getUint16(bmi + 14, true) !== 1 || width <= 0 || height === 0 || width > 16384 || height > 16384) {
    return null;
  }
  const stride = (width + 31 >> 5) * 4;
  const bits = offset + offBits;
  if (bits + stride * height > view.byteLength) {
    return null;
  }
  const out = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    const y = heightRaw > 0 ? height - 1 - row : row;
    const rowOff = bits + row * stride;
    for (let x = 0; x < width; x++) {
      out[y * width + x] = view.getUint8(rowOff + (x >> 3)) >> 7 - (x & 7) & 1;
    }
  }
  return { width, height, bits: out };
}
function mappedSourceRect(view, xformOff, xSrc, ySrc, cx, cy) {
  const m11 = view.getFloat32(xformOff, true);
  const m12 = view.getFloat32(xformOff + 4, true);
  const m21 = view.getFloat32(xformOff + 8, true);
  const m22 = view.getFloat32(xformOff + 12, true);
  const mdx = view.getFloat32(xformOff + 16, true);
  const mdy = view.getFloat32(xformOff + 20, true);
  const identity = m11 === 0 && m22 === 0 && m12 === 0 && m21 === 0;
  const a = identity ? 1 : m11;
  const d = identity ? 1 : m22;
  return {
    sx: Math.round(a * xSrc + (identity ? 0 : m21 * ySrc + mdx)),
    sy: Math.round(d * ySrc + (identity ? 0 : m12 * xSrc + mdy)),
    sw: Math.round(a * cx),
    sh: Math.round(d * cy)
  };
}
function texelAt(src, x, y) {
  const tx = x < 0 ? 0 : x >= src.width ? src.width - 1 : x;
  const ty = y < 0 ? 0 : y >= src.height ? src.height - 1 : y;
  const i = (ty * src.width + tx) * 4;
  return (src.data[i + 3] << 24 | src.data[i] << 16 | src.data[i + 1] << 8 | src.data[i + 2]) >>> 0;
}
function axisMap(rCtx, xDest, yDest, cxDest, cyDest, sx, sy, sw, sh) {
  let dx = gmx(rCtx, xDest);
  let dy = gmy(rCtx, yDest);
  const dw = gmw(rCtx, cxDest);
  const dh = gmh(rCtx, cyDest);
  if (dw < 0) {
    dx += gdiDevicePixelX(rCtx);
  }
  if (dh < 0) {
    dy += gdiDevicePixelY(rCtx);
  }
  const W = Math.round(Math.abs(dw));
  const H = Math.round(Math.abs(dh));
  const aw = Math.abs(sw);
  const ah = Math.abs(sh);
  if (W === 0 || H === 0 || aw === 0 || ah === 0) {
    return null;
  }
  const left = Math.round(Math.min(dx, dx + dw));
  const top = Math.round(Math.min(dy, dy + dh));
  const x0 = Math.max(0, left);
  const y0 = Math.max(0, top);
  const x1 = Math.min(rCtx.canvasW, left + W);
  const y1 = Math.min(rCtx.canvasH, top + H);
  if (x1 <= x0 || y1 <= y0) {
    return null;
  }
  const baseX = Math.min(sx, sx + sw);
  const baseY = Math.min(sy, sy + sh);
  const col = new Int32Array(x1 - x0);
  const row = new Int32Array(y1 - y0);
  const mirrored = dw < 0 || dh < 0;
  const pick = (i, len, n) => mirrored ? Math.min(len - 1, Math.floor(i * len / n)) : gdiNearest(i, len, n);
  for (let x = x0; x < x1; x++) {
    const k = pick(x - left, aw, W);
    col[x - x0] = sw < 0 !== dw < 0 ? baseX + aw - 1 - k : baseX + k;
  }
  for (let y = y0; y < y1; y++) {
    const k = pick(y - top, ah, H);
    row[y - y0] = sh < 0 !== dh < 0 ? baseY + ah - 1 - k : baseY + k;
  }
  return { box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, col, row };
}
function writePixels(rCtx, box, op) {
  const { ctx } = rCtx;
  if (canReadBack(ctx) && typeof ctx.getImageData === "function" && rewritePixels(ctx, box, op)) {
    return;
  }
  const scratch = acquireScratch(box.w, box.h);
  if (!scratch) {
    return;
  }
  const data = new Uint8ClampedArray(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const c = op(box.x + x, box.y + y, 0);
      if (c < 0) {
        continue;
      }
      const i = (y * box.w + x) * 4;
      data[i] = c >> 16 & 255;
      data[i + 1] = c >> 8 & 255;
      data[i + 2] = c & 255;
      data[i + 3] = 255;
    }
  }
  compositeOverlay(ctx, box, scratch, createImageDataCompat(data, box.w, box.h));
}
function div255(v) {
  return Math.round(v / 255);
}
function alphaBlendPixel(s, d, sca, srcAlpha) {
  const a = s >>> 24;
  if (sca === 0) {
    return -1;
  }
  const sr = s >> 16 & 255;
  const sg = s >> 8 & 255;
  const sb = s & 255;
  const dr = d >> 16 & 255;
  const dg = d >> 8 & 255;
  const db = d & 255;
  if (!srcAlpha || a === 255 && sca !== 255) {
    return dr + Math.round((sr - dr) * sca / 255) << 16 | dg + Math.round((sg - dg) * sca / 255) << 8 | db + Math.round((sb - db) * sca / 255);
  }
  if (a === 0) {
    return -1;
  }
  let pr = sr;
  let pg = sg;
  let pb = sb;
  let pa = a;
  if (sca !== 255) {
    pr = div255(sr * sca);
    pg = div255(sg * sca);
    pb = div255(sb * sca);
    pa = div255(a * sca);
  }
  const k = 255 - pa;
  const b = pb + div255(db * k);
  const g = pg + div255(dg * k) + (b >> 8);
  const r = pr + div255(dr * k) + (g >> 8);
  return (r & 255) << 16 | (g & 255) << 8 | b & 255;
}
function handleAlphaBlend(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 108) {
    return;
  }
  const blend = view.getUint32(dataOff + 32, true);
  const sca = blend >>> 16 & 255;
  const srcAlpha = (blend >>> 24 & 1) !== 0;
  const src = readSource(
    rCtx,
    offset,
    view.getUint32(dataOff + 76, true),
    view.getUint32(dataOff + 80, true),
    view.getUint32(dataOff + 84, true),
    view.getUint32(dataOff + 88, true),
    view.getUint32(dataOff + 72, true),
    true
  );
  if (!src || sca === 0) {
    return;
  }
  const r = mappedSourceRect(view, dataOff + 44, view.getInt32(dataOff + 36, true), view.getInt32(dataOff + 40, true), view.getInt32(dataOff + 92, true), view.getInt32(dataOff + 96, true));
  const map = axisMap(rCtx, view.getInt32(dataOff + 16, true), view.getInt32(dataOff + 20, true), view.getInt32(dataOff + 24, true), view.getInt32(dataOff + 28, true), r.sx, r.sy, r.sw, r.sh);
  if (!map) {
    return;
  }
  const { box, col, row } = map;
  if (!canReadBack(rCtx.ctx)) {
    drawAlphaOverlay(rCtx, map, src, sca, srcAlpha);
    return;
  }
  writePixels(rCtx, box, (x, y, d) => alphaBlendPixel(texelAt(src, col[x - box.x], row[y - box.y]), d, sca, srcAlpha));
}
function drawAlphaOverlay(rCtx, map, src, sca, srcAlpha) {
  const { box, col, row } = map;
  const scratch = acquireScratch(box.w, box.h);
  if (!scratch) {
    return;
  }
  const data = new Uint8ClampedArray(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const s = texelAt(src, col[x], row[y]);
      const a = srcAlpha ? (s >>> 24) * sca / 255 : sca;
      const i = (y * box.w + x) * 4;
      const k = srcAlpha && s >>> 24 > 0 ? 255 / (s >>> 24) : 1;
      data[i] = (s >> 16 & 255) * k;
      data[i + 1] = (s >> 8 & 255) * k;
      data[i + 2] = (s & 255) * k;
      data[i + 3] = a;
    }
  }
  compositeOverlay(rCtx.ctx, box, scratch, createImageDataCompat(data, box.w, box.h));
}
function handleTransparentBlt(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 108) {
    return;
  }
  const key = resolveColorRefRgb(view.getUint32(dataOff + 32, true), paletteEntries(rCtx.state));
  const src = readSource(
    rCtx,
    offset,
    view.getUint32(dataOff + 76, true),
    view.getUint32(dataOff + 80, true),
    view.getUint32(dataOff + 84, true),
    view.getUint32(dataOff + 88, true),
    view.getUint32(dataOff + 72, true)
  );
  if (!src) {
    return;
  }
  const r = mappedSourceRect(view, dataOff + 44, view.getInt32(dataOff + 36, true), view.getInt32(dataOff + 40, true), view.getInt32(dataOff + 92, true), view.getInt32(dataOff + 96, true));
  const map = axisMap(rCtx, view.getInt32(dataOff + 16, true), view.getInt32(dataOff + 20, true), view.getInt32(dataOff + 24, true), view.getInt32(dataOff + 28, true), r.sx, r.sy, r.sw, r.sh);
  if (!map) {
    return;
  }
  const { box, col, row } = map;
  writePixels(rCtx, box, (x, y) => {
    const s = texelAt(src, col[x - box.x], row[y - box.y]) & 16777215;
    return s === key ? -1 : s;
  });
}
function handleMaskBlt(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 128) {
    return;
  }
  const rop = view.getUint32(dataOff + 32, true);
  const fore = rop >>> 16 & 255;
  const back = rop >>> 24 & 255;
  const cx = view.getInt32(dataOff + 24, true);
  const cy = view.getInt32(dataOff + 28, true);
  const src = readSource(
    rCtx,
    offset,
    view.getUint32(dataOff + 76, true),
    view.getUint32(dataOff + 80, true),
    view.getUint32(dataOff + 84, true),
    view.getUint32(dataOff + 88, true),
    view.getUint32(dataOff + 72, true)
  );
  const mask = readMask(rCtx, offset, view.getUint32(dataOff + 104, true), view.getUint32(dataOff + 108, true), view.getUint32(dataOff + 112, true), view.getUint32(dataOff + 116, true));
  const xMask = view.getInt32(dataOff + 92, true);
  const yMask = view.getInt32(dataOff + 96, true);
  const r = mappedSourceRect(view, dataOff + 44, view.getInt32(dataOff + 36, true), view.getInt32(dataOff + 40, true), cx, cy);
  const map = axisMap(rCtx, view.getInt32(dataOff + 16, true), view.getInt32(dataOff + 20, true), cx, cy, r.sx, r.sy, r.sw, r.sh);
  if (!map) {
    return;
  }
  const { box, col, row } = map;
  const needsDest = rop3Operands(fore).usesD || mask !== null && rop3Operands(back).usesD;
  if (needsDest && !canReadBack(rCtx.ctx)) {
    return;
  }
  const pattern = patternOperand(rCtx, realizeBrush(rCtx.state));
  const mx0 = Math.min(r.sx, r.sx + r.sw);
  const my0 = Math.min(r.sy, r.sy + r.sh);
  writePixels(rCtx, box, (x, y, d) => {
    const sxp = col[x - box.x];
    const syp = row[y - box.y];
    let index = fore;
    if (mask) {
      const mx = xMask + sxp - mx0;
      const my = yMask + syp - my0;
      const bit = mx >= 0 && my >= 0 && mx < mask.width && my < mask.height ? mask.bits[my * mask.width + mx] : 0;
      index = bit ? fore : back;
    }
    const s = src ? texelAt(src, sxp, syp) & 16777215 : 0;
    const p = typeof pattern === "function" ? pattern(x, y) : pattern;
    return evalRop3(index, p, s, d);
  });
}
function handlePlgBlt(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 140) {
    return;
  }
  const pts = [0, 1, 2].map((i) => fixPoint(rCtx, view.getInt32(dataOff + 16 + i * 8, true), view.getInt32(dataOff + 20 + i * 8, true)));
  const cx = view.getInt32(dataOff + 48, true);
  const cy = view.getInt32(dataOff + 52, true);
  const src = readSource(
    rCtx,
    offset,
    view.getUint32(dataOff + 88, true),
    view.getUint32(dataOff + 92, true),
    view.getUint32(dataOff + 96, true),
    view.getUint32(dataOff + 100, true),
    view.getUint32(dataOff + 84, true)
  );
  if (!src) {
    return;
  }
  const mask = readMask(rCtx, offset, view.getUint32(dataOff + 116, true), view.getUint32(dataOff + 120, true), view.getUint32(dataOff + 124, true), view.getUint32(dataOff + 128, true));
  const xMask = view.getInt32(dataOff + 104, true);
  const yMask = view.getInt32(dataOff + 108, true);
  const r = mappedSourceRect(view, dataOff + 56, view.getInt32(dataOff + 40, true), view.getInt32(dataOff + 44, true), cx, cy);
  const texel = (ix, iy, mix2 = ix, miy = iy) => {
    if (mask) {
      const mx = xMask + mix2;
      const my = yMask + miy;
      if (mx < 0 || my < 0 || mx >= mask.width || my >= mask.height || !mask.bits[my * mask.width + mx]) {
        return -1;
      }
    }
    const tx = r.sw < 0 ? r.sx - 1 - ix : r.sx + ix;
    const ty = r.sh < 0 ? r.sy - 1 - iy : r.sy + iy;
    return texelAt(src, tx, ty) & 16777215;
  };
  const [a, b, q] = pts;
  if (b[1] === a[1] && q[0] === a[0]) {
    const W = Math.round(Math.abs(b[0] - a[0]) / 16);
    const H = Math.round(Math.abs(q[1] - a[1]) / 16);
    const left = Math.round(a[0] / 16) + (b[0] < a[0] ? 1 - W : 0);
    const top = Math.round(a[1] / 16) + (q[1] < a[1] ? 1 - H : 0);
    const aw = Math.abs(r.sw);
    const ah = Math.abs(r.sh);
    const x0 = Math.max(0, left);
    const y0 = Math.max(0, top);
    const x1 = Math.min(rCtx.canvasW, left + W);
    const y1 = Math.min(rCtx.canvasH, top + H);
    if (x1 <= x0 || y1 <= y0 || aw === 0 || ah === 0) {
      return;
    }
    const flipX = b[0] < a[0];
    const flipY = q[1] < a[1];
    writePixels(rCtx, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, (x, y) => {
      const kx = gdiNearest(x - left, aw, W);
      const ky = gdiNearest(y - top, ah, H);
      return texel(flipX ? aw - 1 - kx : kx, flipY ? ah - 1 - ky : ky, kx, ky);
    });
    return;
  }
  paintParallelogram(rCtx, a, b, q, r.sw, r.sh, (ix, iy) => texel(ix, iy));
}
function readBand(rCtx, offset, offBmi, cbBmi, offBits, cbBits, usage, scans) {
  const { view } = rCtx;
  if (!offBmi || !cbBmi || !offBits || !cbBits || offset + offBmi + cbBmi > view.byteLength || offset + offBits + cbBits > view.byteLength) {
    return null;
  }
  const bytes = new Uint8Array(cbBmi + cbBits);
  bytes.set(new Uint8Array(view.buffer, view.byteOffset + offset + offBmi, cbBmi), 0);
  bytes.set(new Uint8Array(view.buffer, view.byteOffset + offset + offBits, cbBits), cbBmi);
  const band = new DataView(bytes.buffer);
  const height = band.getInt32(8, true);
  band.setInt32(8, height < 0 ? -scans : scans, true);
  return decodeDibToImageData(band, 0, cbBmi, cbBits, usage === 1 ? paletteEntries(rCtx.state) : null);
}
function handleSetDibitsToDevice(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 76) {
    return;
  }
  const xSrc = view.getInt32(dataOff + 24, true);
  const ySrc = view.getInt32(dataOff + 28, true);
  const cx = view.getInt32(dataOff + 32, true);
  const cy = view.getInt32(dataOff + 36, true);
  const offBmi = view.getUint32(dataOff + 40, true);
  const cbBmi = view.getUint32(dataOff + 44, true);
  const startScan = view.getUint32(dataOff + 60, true);
  const scans = view.getUint32(dataOff + 64, true);
  if (scans === 0 || !offBmi || offset + offBmi + 12 > view.byteLength) {
    return;
  }
  const fullHeight = view.getInt32(offset + offBmi + 8, true);
  const topDown = fullHeight < 0;
  const fullRows = Math.abs(fullHeight);
  const band = readBand(rCtx, offset, offBmi, cbBmi, view.getUint32(dataOff + 48, true), view.getUint32(dataOff + 52, true), view.getUint32(dataOff + 56, true), scans);
  if (!band) {
    return;
  }
  const map = axisMap(rCtx, view.getInt32(dataOff + 16, true), view.getInt32(dataOff + 20, true), cx, cy, 0, 0, cx, cy);
  if (!map) {
    return;
  }
  const { box, col, row } = map;
  writePixels(rCtx, box, (x, y) => {
    const i = col[x - box.x];
    const j = row[y - box.y];
    const fromBottom = ySrc + cy - 1 - j;
    const bandRow = topDown ? fullRows - 1 - fromBottom - startScan : scans - 1 - (fromBottom - startScan);
    if (bandRow < 0 || bandRow >= band.height) {
      return -1;
    }
    const sxp = xSrc + i;
    if (sxp < 0 || sxp >= band.width) {
      return -1;
    }
    return texelAt(band, sxp, bandRow) & 16777215;
  });
}
function handleEmfGdiBlendBlitRecord(rCtx, recType, offset, dataOff, recSize) {
  switch (recType) {
    case EMR_ALPHABLEND:
      handleAlphaBlend(rCtx, offset, dataOff, recSize);
      return true;
    case EMR_TRANSPARENTBLT:
      handleTransparentBlt(rCtx, offset, dataOff, recSize);
      return true;
    case EMR_MASKBLT:
      handleMaskBlt(rCtx, offset, dataOff, recSize);
      return true;
    case EMR_PLGBLT:
      handlePlgBlt(rCtx, offset, dataOff, recSize);
      return true;
    case EMR_SETDIBITSTODEVICE:
      handleSetDibitsToDevice(rCtx, offset, dataOff, recSize);
      return true;
    default:
      return false;
  }
}

// src/emf-ansi.ts
var CP1252_HIGH2 = [
  8364,
  129,
  8218,
  402,
  8222,
  8230,
  8224,
  8225,
  710,
  8240,
  352,
  8249,
  338,
  141,
  381,
  143,
  144,
  8216,
  8217,
  8220,
  8221,
  8226,
  8211,
  8212,
  732,
  8482,
  353,
  8250,
  339,
  157,
  382,
  376
];
function ansiToCode(b, charSet) {
  return charSet === 2 ? b : b >= 128 && b <= 159 ? CP1252_HIGH2[b - 128] : b;
}
var CHARSET_ENCODING = {
  0: "windows-1252",
  1: "windows-1252",
  128: "shift_jis",
  129: "euc-kr",
  130: "johab",
  134: "gbk",
  136: "big5",
  161: "windows-1253",
  162: "windows-1254",
  163: "windows-1258",
  177: "windows-1255",
  178: "windows-1256",
  186: "windows-1257",
  204: "windows-1251",
  222: "windows-874",
  238: "windows-1250",
  255: "ibm437"
};
function decodeAnsiRecord(bytes, charSet) {
  if (charSet === 2) {
    return { codes: [...bytes], byteLengths: bytes.map(() => 1) };
  }
  const label = CHARSET_ENCODING[charSet] ?? "windows-1252";
  try {
    const decoder = new TextDecoder(label, { fatal: true });
    const replacementDecoder = new TextDecoder(label);
    const source = new Uint8Array(bytes);
    const codes = [];
    const byteLengths = [];
    let i = 0;
    while (i < bytes.length) {
      let decoded = null;
      let consumed = 1;
      for (let n = 1; n <= Math.min(4, bytes.length - i); n++) {
        try {
          const candidate = decoder.decode(source.subarray(i, i + n));
          if (candidate.length > 0) {
            decoded = candidate;
            consumed = n;
            break;
          }
        } catch {
        }
      }
      if (decoded === null) {
        decoded = replacementDecoder.decode(source.subarray(i, i + 1));
      }
      for (let j = 0; j < decoded.length; j++) {
        codes.push(decoded.charCodeAt(j));
        byteLengths.push(j === decoded.length - 1 ? consumed : 0);
      }
      i += consumed;
    }
    return { codes, byteLengths };
  } catch {
    return { codes: bytes.map((b) => ansiToCode(b, charSet)), byteLengths: bytes.map(() => 1) };
  }
}

// src/gdi-text-render.ts
var ETO_OPAQUE = 2;
var ETO_CLIPPED = 4;
var ETO_GLYPH_INDEX = 16;
var ETO_IGNORELANGUAGE = 4096;
var ETO_PDY = 8192;
var GRAY_INV_GAMMA = 0.43;
var GRAY_BLACK_ON_WHITE = [255, 255, 240, 233, 225, 217, 208, 199, 189, 178, 167, 154, 140, 124, 104, 77, 0];
function parseHex(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) {
    return [0, 0, 0];
  }
  const n = parseInt(m[1], 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function blendOverUnknown(out, o, rgb2, blend) {
  const onWhite = [0, 0, 0];
  let a = 0;
  let minWhite = 255;
  for (let c = 0; c < 3; c++) {
    onWhite[c] = blend(rgb2[c], 255, c);
    a += 1 - (onWhite[c] - blend(rgb2[c], 0, c)) / 255;
    minWhite = Math.min(minWhite, onWhite[c]);
  }
  a = Math.min(1, Math.max(a / 3, 1 - minWhite / 255));
  if (a <= 0) {
    return;
  }
  for (let c = 0; c < 3; c++) {
    out[o + c] = Math.round((onWhite[c] - 255 * (1 - a)) / a);
  }
  out[o + 3] = Math.round(a * 255);
}
function blendGray(s, d, k) {
  if (k <= 1) {
    return d;
  }
  if (k >= 16) {
    return s;
  }
  const a = k / 16;
  const g = 1 / GRAY_INV_GAMMA;
  const v = a * Math.pow(s / 255, g) + (1 - a) * Math.pow(d / 255, g);
  return Math.floor(255 * Math.pow(v, GRAY_INV_GAMMA) + 1e-9);
}
function fillDeviceRect(ctx, r, color, clip) {
  let { left, top, right, bottom } = r;
  if (clip) {
    left = Math.max(left, clip.left);
    top = Math.max(top, clip.top);
    right = Math.min(right, clip.right);
    bottom = Math.min(bottom, clip.bottom);
  }
  if (right <= left || bottom <= top) {
    return;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.fillRect(left, top, right - left, bottom - top);
  ctx.restore();
}
function fillDeviceQuad(ctx, pts, color, clip) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  if (clip) {
    ctx.beginPath();
    ctx.rect(clip.left, clip.top, clip.right - clip.left, clip.bottom - clip.top);
    ctx.clip();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function isC1Control(code) {
  return code >= 128 && code <= 159;
}
function suppressC1Glyph(run, index) {
  return !run.glyphIndices && !(run.options & ETO_IGNORELANGUAGE) && isC1Control(run.codes[index]);
}
function layoutGdiRun(font, run) {
  const n = run.codes.length;
  const glyphs = run.codes.map((c) => run.glyphIndices ? c : font.glyphIndex(c));
  let adv = [];
  for (let i = 0; i < n; i++) {
    adv.push(
      suppressC1Glyph(run, i) && !run.dx ? 0 : run.dx && i < run.dx.length ? run.dx[i] : run.matrix ? font.rotatedAdvance(glyphs[i]) : font.advance(glyphs[i])
    );
  }
  if (!run.dx && run.textJustification && !run.glyphIndices) {
    adv = applyTextJustification(adv, run.codes, run.textJustification.extra, run.textJustification.count);
  }
  const advY = [];
  for (let i = 0; i < n; i++) {
    advY.push(run.dy && i < run.dy.length ? run.dy[i] : 0);
  }
  let total = 0;
  let totalY = 0;
  for (let i = 0; i < n; i++) {
    total += adv[i];
    totalY += advY[i];
  }
  const m = run.matrix;
  const ux = m ? m[0] : 1;
  const uy = m ? m[1] : 0;
  const vx = m ? m[2] : 0;
  const vy = m ? m[3] : 1;
  const at = (along2, down2) => ({
    x: run.x + ux * along2 + vx * down2,
    y: run.y + uy * along2 + vy * down2
  });
  const hAlign = run.textAlign & 6;
  let startAlong = 0;
  if (hAlign === 6) {
    startAlong = -Math.ceil(total / 2);
  } else if (hAlign === 2) {
    startAlong = -total;
  }
  const vAlign = run.textAlign & 24;
  const skew = !!m && Math.abs(m[0]) > 1e-9 && Math.abs(m[1]) > 1e-9;
  const ascent = skew ? font.rotatedAscent ?? font.ascent : font.ascent;
  const descent = skew ? font.rotatedDescent ?? font.descent : font.descent;
  const baseDown = vAlign === 24 ? 0 : vAlign === 8 ? -descent : ascent;
  const placed = [];
  const origins = [];
  const gm = m ? [m[0], m[1], m[2], m[3]] : void 0;
  let along = startAlong;
  let down = baseDown;
  for (let i = 0; i < n; i++) {
    const origin = at(along, down);
    const ox = font.gridFit ? Math.round(origin.x) : Math.floor(origin.x);
    const subX = font.gridFit ? 0 : Math.round((origin.x - ox) * 64);
    const oy = Math.round(origin.y);
    origins.push({ x: ox + subX / 64, y: oy, along, down });
    if (!suppressC1Glyph(run, i)) {
      const g = font.glyph(glyphs[i], gm, subX);
      if (g.bitmap) {
        placed.push({ x: ox + g.bitmap.left, y: oy - g.bitmap.top, bitmap: g.bitmap });
      }
    }
    along += adv[i];
    down += advY[i];
  }
  return { glyphs, total, totalY, startAlong, baseDown, hAlign, at, placed, origins };
}
function paintGdiTextRun(ctx, font, run, fontFamilyMap) {
  const { glyphs, total, totalY, startAlong, baseDown, at, placed, origins, hAlign } = layoutGdiRun(font, run);
  const m = run.matrix;
  const ux = m ? m[0] : 1;
  const uy = m ? m[1] : 0;
  const vx = m ? m[2] : 0;
  const vy = m ? m[3] : 1;
  const clip = run.options & ETO_CLIPPED && run.rect ? run.rect : null;
  if (run.options & ETO_OPAQUE && run.rect) {
    fillDeviceRect(ctx, run.rect, run.bkColor, null);
  }
  if (run.bkMode === 2 && total !== 0) {
    if (!m) {
      const x0 = Math.round(run.x + startAlong);
      const base = Math.round(run.y + baseDown);
      const l = Math.min(x0, x0 + Math.round(total));
      const r = Math.max(x0, x0 + Math.round(total));
      fillDeviceRect(ctx, { left: l, top: base - font.ascent, right: r, bottom: base + font.descent }, run.bkColor, clip);
    } else {
      const quad = [
        at(startAlong, baseDown - font.ascent),
        at(startAlong + total, baseDown - font.ascent),
        at(startAlong + total, baseDown + font.descent),
        at(startAlong, baseDown + font.descent)
      ];
      fillDeviceQuad(ctx, quad, run.bkColor, clip);
    }
  }
  if (isSvgContext(ctx)) {
    if (clip) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.rect(clip.left, clip.top, clip.right - clip.left, clip.bottom - clip.top);
      ctx.clip();
    }
    emitSvgRun(ctx, font, run, glyphs, origins, fontFamilyMap);
    if (clip) {
      ctx.restore();
    }
    if (ctx.shadow) {
      compositeGlyphs(ctx.shadow, placed, run.textColor, font.mode !== "mono", clip);
    }
  } else {
    compositeGlyphs(ctx, placed, run.textColor, font.mode !== "mono", clip);
  }
  if ((run.underline || run.strikeOut) && total !== 0) {
    const bars = [];
    if (run.underline) {
      bars.push([font.underlinePosition, Math.max(1, font.underlineThickness)]);
    }
    if (run.strikeOut) {
      bars.push([font.strikeoutPosition, Math.max(1, font.strikeoutThickness)]);
    }
    for (const [pos, thick] of bars) {
      if (!m) {
        const x0 = Math.round(run.x + startAlong);
        const top = Math.round(run.y + baseDown) - pos;
        const l = Math.min(x0, x0 + Math.round(total));
        const r = Math.max(x0, x0 + Math.round(total));
        fillDeviceRect(ctx, { left: l, top, right: r, bottom: top + thick }, run.textColor, clip);
      } else {
        const quad = [
          at(startAlong, baseDown - pos),
          at(startAlong + total, baseDown - pos),
          at(startAlong + total, baseDown - pos + thick),
          at(startAlong, baseDown - pos + thick)
        ];
        fillDeviceQuad(ctx, quad, run.textColor, clip);
      }
    }
  }
  const cpAlong = hAlign === 6 ? 0 : hAlign === 2 ? -total : total;
  const cpDown = hAlign === 6 ? 0 : totalY;
  return { dx: ux * cpAlong + vx * cpDown, dy: uy * cpAlong + vy * cpDown };
}
function emitSvgRun(ctx, font, run, glyphs, origins, fontFamilyMap) {
  let text = "";
  const visibleOrigins = [];
  for (let i = 0; i < origins.length; i++) {
    const code = run.glyphIndices ? font.charForGlyph(glyphs[i]) : run.codes[i];
    if (!run.glyphIndices && !(run.options & ETO_IGNORELANGUAGE) && isC1Control(code)) continue;
    text += String.fromCharCode(code);
    visibleOrigins.push(origins[i]);
  }
  if (text.length === 0) return;
  const m = run.matrix;
  const ttf = font.ttf;
  const bold = font.syntheticBold || ttf.weightClass >= 600;
  const italic = font.syntheticItalic || (ttf.fsSelection & 1) !== 0 || (ttf.macStyle & 2) !== 0;
  const first = visibleOrigins[0];
  ctx.fillGlyphRun({
    text,
    // Upright runs: device positions. Rotated runs: offsets along/across
    // the baseline from the first glyph, under the frame matrix.
    xs: visibleOrigins.map((o) => m ? o.along - first.along : o.x),
    ys: visibleOrigins.map((o) => m ? o.down - first.down : o.y),
    matrix: m ? [m[0], m[1], m[2], m[3], first.x, first.y] : null,
    scaleX: font.ppemX !== font.ppem ? font.ppemX / font.ppem : 1,
    fontFamily: mapFontFamily(ttf.family, fontFamilyMap),
    fontSize: font.ppem,
    fontWeight: bold ? 700 : 400,
    italic,
    aliased: font.mode === "mono",
    fill: run.textColor
  });
}
function compositeGlyphs(ctx, placed, color, gray, clip) {
  if (placed.length === 0) {
    return;
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of placed) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + p.bitmap.width);
    y1 = Math.max(y1, p.y + p.bitmap.height);
  }
  const canvas = ctx.canvas;
  if (typeof canvas?.width === "number" && typeof canvas?.height === "number") {
    x0 = Math.max(x0, 0);
    y0 = Math.max(y0, 0);
    x1 = Math.min(x1, canvas.width);
    y1 = Math.min(y1, canvas.height);
  }
  if (clip) {
    x0 = Math.max(x0, clip.left);
    y0 = Math.max(y0, clip.top);
    x1 = Math.min(x1, clip.right);
    y1 = Math.min(y1, clip.bottom);
  }
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0 || w * h > 64 * 1024 * 1024) {
    return;
  }
  if (placed.some((p) => p.bitmap.channels === 3)) {
    compositeClearType(ctx, placed, color, x0, y0, w, h);
    return;
  }
  const cov = new Uint8Array(w * h);
  const full = gray ? 16 : 1;
  for (const p of placed) {
    const b2 = p.bitmap;
    for (let y = 0; y < b2.height; y++) {
      const dy = p.y + y - y0;
      if (dy < 0 || dy >= h) continue;
      for (let x = 0; x < b2.width; x++) {
        const v = b2.data[y * b2.width + x];
        if (!v) continue;
        const dx = p.x + x - x0;
        if (dx < 0 || dx >= w) continue;
        const i = dy * w + dx;
        if (v > cov[i]) cov[i] = v;
      }
    }
  }
  const layer = createTempCanvas(w, h);
  if (!layer) {
    return;
  }
  const [r, g, b] = parseHex(color);
  const rgba = new Uint8ClampedArray(w * h * 4);
  let dst = null;
  if (gray && typeof ctx.getImageData === "function") {
    try {
      dst = canvasGetImageData(ctx, x0, y0, w, h).data;
    } catch {
      dst = null;
    }
  }
  for (let i = 0; i < w * h; i++) {
    const k = cov[i];
    if (k <= (gray ? 1 : 0)) continue;
    const o = i * 4;
    if (!gray || k >= full) {
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    } else if (dst && dst[o + 3] === 255) {
      rgba[o] = blendGray(r, dst[o], k);
      rgba[o + 1] = blendGray(g, dst[o + 1], k);
      rgba[o + 2] = blendGray(b, dst[o + 2], k);
      rgba[o + 3] = 255;
    } else if (dst) {
      blendOverUnknown(rgba, o, [r, g, b], (s, d) => blendGray(s, d, k));
    } else {
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255 - GRAY_BLACK_ON_WHITE[k];
    }
  }
  canvasPutImageData(layer.ctx, createImageDataCompat(rgba, w, h), 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  canvasDrawImage(ctx, layer.canvas, x0, y0, w, h);
  ctx.restore();
}
var DEG_TO_RAD2 = Math.PI / 180;
function deviceLogFont(state, heightScale, widthScale) {
  const d = state.fontDetails;
  const h = state.fontHeight * heightScale;
  return {
    face: state.fontFamily,
    height: h < 0 ? -Math.round(-h) : Math.round(h),
    width: d && d.width ? Math.round(Math.abs(d.width * widthScale)) : 0,
    weight: state.fontWeight,
    italic: state.fontItalic,
    charSet: d ? d.charSet : 1,
    pitchAndFamily: d ? d.pitchAndFamily : 0,
    quality: d ? d.quality : 0
  };
}
function drawGdiTextCall(ctx, fonts, state, call) {
  const [a, b, c, d, e, f] = call.matrix;
  const advanceScale = Math.hypot(a, b);
  const fontScale = Math.hypot(c, d);
  if (!(advanceScale > 0) || !(fontScale > 0) || call.codes.length === 0) {
    return null;
  }
  const font = fonts.realize(deviceLogFont(state, fontScale, advanceScale), state.fontFamilyMap);
  if (!font) {
    return null;
  }
  const rotated = b !== 0 || c !== 0;
  let frame2 = rotated ? [a / advanceScale, b / advanceScale, c / fontScale, d / fontScale] : null;
  const esc = state.fontEscapementTenthDeg % 3600;
  if (esc !== 0) {
    const t = esc / 10 * DEG_TO_RAD2;
    const r = [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)];
    frame2 = frame2 ? [
      frame2[0] * r[0] + frame2[2] * r[1],
      frame2[1] * r[0] + frame2[3] * r[1],
      frame2[0] * r[2] + frame2[2] * r[3],
      frame2[1] * r[2] + frame2[3] * r[3]
    ] : r;
  }
  const updateCp = (state.textAlign & 1) !== 0;
  const lx = updateCp ? state.curX : call.x;
  const ly = updateCp ? state.curY : call.y;
  const map = (x, y) => ({ x: a * x + c * y + e, y: b * x + d * y + f });
  const ref = map(lx, ly);
  let rect = null;
  if (call.rect && call.options & (ETO_OPAQUE | ETO_CLIPPED)) {
    const p = map(call.rect.left, call.rect.top);
    const q = map(call.rect.right, call.rect.bottom);
    rect = {
      left: Math.round(Math.min(p.x, q.x)),
      top: Math.round(Math.min(p.y, q.y)),
      right: Math.round(Math.max(p.x, q.x)),
      bottom: Math.round(Math.max(p.y, q.y))
    };
  }
  const run = {
    codes: call.codes,
    glyphIndices: call.glyphIndices,
    x: ref.x,
    y: ref.y,
    dx: call.dx ? call.dx.map((v) => v * advanceScale) : null,
    dy: call.dy ? call.dy.map((v) => -v * fontScale) : null,
    textJustification: call.textJustification ? { ...call.textJustification, extra: call.textJustification.extra * advanceScale } : void 0,
    textAlign: state.textAlign,
    textColor: state.textColor,
    bkColor: state.bkColor,
    bkMode: state.bkMode,
    options: call.options,
    rect,
    matrix: frame2,
    underline: state.fontUnderline,
    strikeOut: state.fontStrikeOut
  };
  const adv = paintGdiTextRun(ctx, font, run, state.fontFamilyMap);
  const det = a * d - b * c;
  if (det === 0) {
    return { dx: 0, dy: 0 };
  }
  return { dx: (d * adv.dx - c * adv.dy) / det, dy: (-b * adv.dx + a * adv.dy) / det };
}
var CLEARTYPE_GAMMA = 1.2;
function blendCt(s, d, a) {
  if (a <= 0) {
    return d;
  }
  if (a >= 1) {
    return s;
  }
  const g = CLEARTYPE_GAMMA;
  const v = a * Math.pow(s / 255, g) + (1 - a) * Math.pow(d / 255, g);
  return Math.round(255 * Math.pow(v, 1 / g));
}
function compositeClearType(ctx, placed, color, x0, y0, w, h) {
  const alpha = new Uint8Array(w * h * 3);
  for (const p of placed) {
    const b = p.bitmap;
    const ch = b.channels === 3 ? 3 : 1;
    for (let y = 0; y < b.height; y++) {
      const dy = p.y + y - y0;
      if (dy < 0 || dy >= h) continue;
      for (let x = 0; x < b.width; x++) {
        const dx = p.x + x - x0;
        if (dx < 0 || dx >= w) continue;
        for (let c = 0; c < 3; c++) {
          const v = ch === 3 ? b.data[(y * b.width + x) * 3 + c] : b.data[y * b.width + x] * 255;
          const i = (dy * w + dx) * 3 + c;
          if (v > alpha[i]) alpha[i] = v;
        }
      }
    }
  }
  const layer = createTempCanvas(w, h);
  if (!layer) {
    return;
  }
  let dst;
  try {
    dst = canvasGetImageData(ctx, x0, y0, w, h).data;
  } catch {
    return;
  }
  const rgb2 = parseHex(color);
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a0 = alpha[i * 3];
    const a1 = alpha[i * 3 + 1];
    const a2 = alpha[i * 3 + 2];
    if (!a0 && !a1 && !a2) continue;
    const o = i * 4;
    if (dst[o + 3] !== 255) {
      const cov = [a0 / 255, a1 / 255, a2 / 255];
      blendOverUnknown(rgba, o, rgb2, (s, d, c) => blendCt(s, d, cov[c]));
      continue;
    }
    rgba[o] = blendCt(rgb2[0], dst[o], a0 / 255);
    rgba[o + 1] = blendCt(rgb2[1], dst[o + 1], a1 / 255);
    rgba[o + 2] = blendCt(rgb2[2], dst[o + 2], a2 / 255);
    rgba[o + 3] = 255;
  }
  canvasPutImageData(layer.ctx, createImageDataCompat(rgba, w, h), 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  canvasDrawImage(ctx, layer.canvas, x0, y0, w, h);
  ctx.restore();
}
function gdiTextCoverage(font, run) {
  const { placed } = layoutGdiRun(font, run);
  if (placed.length === 0) {
    return null;
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of placed) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + p.bitmap.width);
    y1 = Math.max(y1, p.y + p.bitmap.height);
  }
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0 || w * h > 64 * 1024 * 1024) {
    return null;
  }
  const channels = placed.some((p) => p.bitmap.channels === 3) ? 3 : 1;
  const data = new Uint8ClampedArray(w * h * channels);
  const full = font.mode === "mono" ? 1 : 16;
  for (const p of placed) {
    const b = p.bitmap;
    const bc = b.channels === 3 ? 3 : 1;
    for (let y = 0; y < b.height; y++) {
      for (let x = 0; x < b.width; x++) {
        for (let c = 0; c < channels; c++) {
          const v = bc === 3 ? b.data[(y * b.width + x) * 3 + c] : Math.round(b.data[y * b.width + x] * 255 / full);
          const i = ((p.y + y - y0) * w + (p.x + x - x0)) * channels + c;
          if (v > data[i]) data[i] = v;
        }
      }
    }
  }
  return { x: x0, y: y0, width: w, height: h, channels, data };
}

// src/emf-gdi-draw-text.ts
function readDxArray(view, offset, dataOff, nChars, viewEnd) {
  const offDx = view.getUint32(dataOff + 64, true);
  if (offDx === 0) {
    return null;
  }
  const start = offset + offDx;
  const end = start + nChars * 4;
  if (start < 0 || end > viewEnd) {
    return null;
  }
  const dx = [];
  for (let i = 0; i < nChars; i++) {
    dx.push(view.getInt32(start + i * 4, true));
  }
  return dx;
}
function drawWithFontEngine(rCtx, offset, dataOff, nChars, offString, viewEnd) {
  const { ctx, view, state } = rCtx;
  const fonts = rCtx.fonts;
  if (!fonts) {
    return false;
  }
  const options = view.getUint32(dataOff + 44, true);
  const codes = [];
  for (let i = 0; i < nChars; i++) {
    codes.push(view.getUint16(offset + offString + i * 2, true));
  }
  const pdy = (options & ETO_PDY) !== 0;
  const raw = readDxArray(view, offset, dataOff, pdy ? nChars * 2 : nChars, viewEnd);
  let dx = raw;
  let dy = null;
  if (raw && pdy) {
    dx = [];
    dy = [];
    for (let i = 0; i < nChars; i++) {
      dx.push(raw[i * 2] | 0);
      dy.push(raw[i * 2 + 1] | 0);
    }
  }
  const adv = drawGdiTextCall(ctx, fonts, state, {
    codes,
    glyphIndices: (options & ETO_GLYPH_INDEX) !== 0,
    x: view.getInt32(dataOff + 28, true),
    y: view.getInt32(dataOff + 32, true),
    options,
    rect: {
      left: view.getInt32(dataOff + 48, true),
      top: view.getInt32(dataOff + 52, true),
      right: view.getInt32(dataOff + 56, true),
      bottom: view.getInt32(dataOff + 60, true)
    },
    dx,
    dy,
    matrix: gdiDeviceMatrix(rCtx),
    textJustification: state.textJustification
  });
  if (!adv) {
    return false;
  }
  if (state.textAlign & 1) {
    state.curX += adv.dx;
    state.curY += adv.dy;
  }
  return true;
}
function horizontalAlign(textAlign) {
  if ((textAlign & 6) === 6) {
    return "center";
  }
  if (textAlign & 2) {
    return "right";
  }
  return "left";
}
function verticalBaseline(textAlign) {
  const vAlign = textAlign & 24;
  return vAlign === 24 ? "alphabetic" : vAlign === 8 ? "bottom" : "top";
}
function paintRun(ctx, state, text, dxDevice, startX, y, align, fontScale) {
  const totalWidth = dxDevice ? totalGlyphAdvance(dxDevice) : ctx.measureText(text).width;
  const runStartX = dxDevice ? startX + alignmentStartOffset(totalWidth, align) : startX;
  if (state.bkMode === 2) {
    const bgH = fontSizePx(state, fontScale);
    const prevFill = ctx.fillStyle;
    ctx.fillStyle = state.bkColor;
    ctx.fillRect(runStartX, y - bgH, totalWidth, bgH);
    ctx.fillStyle = prevFill;
  }
  ctx.fillStyle = state.textColor;
  if (dxDevice) {
    const offsets = cumulativeGlyphOffsets(dxDevice);
    const prevAlign = ctx.textAlign;
    ctx.textAlign = "left";
    for (let i = 0; i < text.length && i < offsets.length; i++) {
      ctx.fillText(text[i], runStartX + offsets[i], y);
    }
    ctx.textAlign = prevAlign;
  } else {
    ctx.fillText(text, startX, y);
  }
  if (state.fontUnderline || state.fontStrikeOut) {
    drawTextDecorations(ctx, state, runStartX, y, totalWidth, fontScale);
  }
}
function handleExtTextOutW(rCtx, offset, dataOff, recSize) {
  const { ctx, view, state } = rCtx;
  if (recSize < 76) {
    return true;
  }
  const refX = view.getInt32(dataOff + 28, true);
  const refY = view.getInt32(dataOff + 32, true);
  const nChars = view.getUint32(dataOff + 36, true);
  const offString = view.getUint32(dataOff + 40, true);
  const viewEnd = Math.min(view.byteLength, offset + recSize);
  if (nChars === 0 || offString === 0 || nChars > Math.floor((viewEnd - offset - offString) / 2)) {
    return true;
  }
  if (drawWithFontEngine(rCtx, offset, dataOff, nChars, offString, viewEnd)) {
    return true;
  }
  const text = readUtf16LE(view, offset + offString, nChars);
  if (text.length === 0) {
    return true;
  }
  const rotated = hasWorldRotation(rCtx);
  const m = rotated ? gdiDeviceMatrix(rCtx) : null;
  const fontScale = m ? Math.hypot(m[2], m[3]) : Math.abs(gmh(rCtx, 1));
  const advanceScale = m ? Math.hypot(m[0], m[1]) : null;
  applyFont(ctx, state, fontScale);
  const align = horizontalAlign(state.textAlign);
  ctx.textBaseline = verticalBaseline(state.textAlign);
  ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  const pdy = (view.getUint32(dataOff + 44, true) & ETO_PDY) !== 0;
  const dxRaw = readDxArray(view, offset, dataOff, pdy ? nChars * 2 : nChars, viewEnd);
  const dxLogical = dxRaw && pdy ? dxRaw.filter((_, i) => i % 2 === 0) : dxRaw;
  let dxDevice = dxLogical ? dxLogical.map((v) => advanceScale !== null ? v * advanceScale : gmw(rCtx, v)) : null;
  if (!dxDevice && state.textJustification && !pdy) {
    const units = text.split("");
    const natural = units.map((ch) => ctx.measureText(ch).width);
    const scale = advanceScale ?? gmw(rCtx, 1);
    dxDevice = applyTextJustification(natural, units.map((ch) => ch.charCodeAt(0)), state.textJustification.extra * scale, state.textJustification.count);
  }
  if (dxDevice) {
    ctx.textAlign = "left";
  }
  const basePoint = m ? gmapPoint(rCtx, refX, refY) : { x: gmx(rCtx, refX), y: gmy(rCtx, refY) };
  const escapement = escapementToCanvasRadians(state.fontEscapementTenthDeg);
  if (m && fontScale > 0 && advanceScale) {
    ctx.save();
    ctx.translate(basePoint.x, basePoint.y);
    ctx.transform(
      m[0] / advanceScale,
      m[1] / advanceScale,
      m[2] / fontScale,
      m[3] / fontScale,
      0,
      0
    );
    if (escapement !== 0) {
      ctx.rotate(escapement);
    }
    paintRun(ctx, state, text, dxDevice, 0, 0, align, fontScale);
    ctx.restore();
  } else if (escapement !== 0) {
    ctx.save();
    ctx.translate(basePoint.x, basePoint.y);
    ctx.rotate(escapement);
    paintRun(ctx, state, text, dxDevice, 0, 0, align, fontScale);
    ctx.restore();
  } else {
    paintRun(ctx, state, text, dxDevice, basePoint.x, basePoint.y, align, fontScale);
  }
  return true;
}
function drawTextCall(rCtx, x, y, codes, options, rect, dx) {
  const n = codes.length;
  const offString = 76;
  const offDx = offString + n * 2 + 3 & -4;
  const dxCount = dx ? dx.length : 0;
  const size = offDx + dxCount * 4;
  const view = new DataView(new ArrayBuffer(size));
  view.setUint32(44, n, true);
  view.setUint32(48, offString, true);
  view.setUint32(52, options, true);
  view.setInt32(36, x, true);
  view.setInt32(40, y, true);
  view.setInt32(56, rect[0], true);
  view.setInt32(60, rect[1], true);
  view.setInt32(64, rect[2], true);
  view.setInt32(68, rect[3], true);
  view.setUint32(72, dx ? offDx : 0, true);
  for (let i = 0; i < n; i++) view.setUint16(offString + i * 2, codes[i], true);
  if (dx) for (let i = 0; i < dxCount; i++) view.setInt32(offDx + i * 4, dx[i], true);
  const child = { ...rCtx, view };
  handleExtTextOutW(child, 0, 8, size);
}
function readAnsiRecord(view, start, count, charSet) {
  return decodeAnsiRecord(Array.from({ length: count }, (_, i) => view.getUint8(start + i)), charSet);
}
function collapseAnsiDx(dx, byteLengths, pdy) {
  if (!dx) return null;
  const result = [];
  let at = 0;
  for (const bytes of byteLengths) {
    let x = 0, y = 0;
    for (let i = 0; i < bytes; i++) {
      x += dx[at + i * (pdy ? 2 : 1)] ?? 0;
      if (pdy) y += dx[at + i * 2 + 1] ?? 0;
    }
    result.push(x);
    if (pdy) result.push(y);
    at += bytes * (pdy ? 2 : 1);
  }
  return result;
}
function handlePolyText(rCtx, offset, dataOff, recSize, wide) {
  const { view, state } = rCtx;
  const end = Math.min(view.byteLength, offset + recSize);
  if (recSize < 40) return true;
  const count = view.getUint32(dataOff + 28, true);
  const arrayStart = dataOff + 32;
  if (count > Math.floor((end - arrayStart) / 40)) return true;
  const charSet = state.fontDetails?.charSet ?? 1;
  for (let i = 0; i < count; i++) {
    const e = arrayStart + i * 40;
    const x = view.getInt32(e, true), y = view.getInt32(e + 4, true);
    const n = view.getUint32(e + 8, true), offString = view.getUint32(e + 12, true);
    const options = view.getUint32(e + 16, true);
    const rect = [view.getInt32(e + 20, true), view.getInt32(e + 24, true), view.getInt32(e + 28, true), view.getInt32(e + 32, true)];
    const offDx = view.getUint32(e + 36, true);
    const unit = wide ? 2 : 1;
    if (!offString || offString > end - offset || n > Math.floor((end - (offset + offString)) / unit)) continue;
    const ansi = wide ? null : readAnsiRecord(view, offset + offString, n, charSet);
    const codes = wide ? Array.from({ length: n }, (_, j) => view.getUint16(offset + offString + j * 2, true)) : ansi.codes;
    let dx = null;
    const pdy = (options & ETO_PDY) !== 0;
    const dxCount = n * (pdy ? 2 : 1);
    if (offDx && offDx <= end - offset && dxCount <= Math.floor((end - (offset + offDx)) / 4)) {
      dx = Array.from({ length: dxCount }, (_, j) => view.getInt32(offset + offDx + j * 4, true));
      if (!wide) dx = collapseAnsiDx(dx, ansi.byteLengths, pdy);
    }
    drawTextCall(rCtx, x, y, codes, options, rect, dx);
  }
  return true;
}
function handleSmallTextOut(rCtx, offset, dataOff, recSize) {
  const { view } = rCtx;
  const end = Math.min(view.byteLength, offset + recSize);
  if (recSize < 36) return true;
  const x = view.getInt32(dataOff, true), y = view.getInt32(dataOff + 4, true);
  const n = view.getUint32(dataOff + 8, true), options = view.getUint32(dataOff + 12, true);
  const small = (options & 512) !== 0, noRect = (options & 256) !== 0;
  const base = dataOff + 28 + (noRect ? 0 : 16);
  if (base > end || n > Math.floor((end - base) / (small ? 1 : 2))) return true;
  const rect = noRect ? [0, 0, 0, 0] : [view.getInt32(dataOff + 28, true), view.getInt32(dataOff + 32, true), view.getInt32(dataOff + 36, true), view.getInt32(dataOff + 40, true)];
  const codes = small ? Array.from({ length: n }, (_, i) => view.getUint8(base + i)) : Array.from({ length: n }, (_, i) => view.getUint16(base + i * 2, true));
  drawTextCall(rCtx, x, y, codes, options, rect, null);
  return true;
}
function handleEmfGdiDrawTextRecord(rCtx, recType, offset, dataOff, recSize) {
  if (recType === EMR_EXTTEXTOUTW) {
    return handleExtTextOutW(rCtx, offset, dataOff, recSize);
  }
  if (recType === EMR_EXTTEXTOUTA || recType === EMR_POLYTEXTOUTA || recType === EMR_POLYTEXTOUTW || recType === EMR_SMALLTEXTOUT) {
    if (recType === EMR_POLYTEXTOUTA || recType === EMR_POLYTEXTOUTW) return handlePolyText(rCtx, offset, dataOff, recSize, recType === EMR_POLYTEXTOUTW);
    if (recType === EMR_SMALLTEXTOUT) return handleSmallTextOut(rCtx, offset, dataOff, recSize);
    const { view, state } = rCtx;
    const end = Math.min(view.byteLength, offset + recSize);
    if (recSize < 76) return true;
    const x = view.getInt32(dataOff + 28, true), y = view.getInt32(dataOff + 32, true);
    const n = view.getUint32(dataOff + 36, true), strOff = view.getUint32(dataOff + 40, true), options = view.getUint32(dataOff + 44, true);
    if (!strOff || strOff > end - offset) return true;
    if (n > end - (offset + strOff)) return true;
    const ansi = readAnsiRecord(view, offset + strOff, n, state.fontDetails?.charSet ?? 1);
    const rect = [view.getInt32(dataOff + 48, true), view.getInt32(dataOff + 52, true), view.getInt32(dataOff + 56, true), view.getInt32(dataOff + 60, true)];
    const offDx = view.getUint32(dataOff + 64, true);
    let dx = null;
    const pdy = (options & ETO_PDY) !== 0;
    const dxCount = n * (pdy ? 2 : 1);
    if (offDx && offDx <= end - offset && dxCount <= Math.floor((end - (offset + offDx)) / 4)) {
      dx = Array.from({ length: dxCount }, (_, i) => view.getInt32(offset + offDx + i * 4, true));
      dx = collapseAnsiDx(dx, ansi.byteLengths, pdy);
    }
    drawTextCall(rCtx, x, y, ansi.codes, options, rect, dx);
    return true;
  }
  return false;
}

// src/emf-gdi-clip-records.ts
function gdiCombineClip(rCtx, shape, op) {
  const res = combineClip(op === "replace" ? null : rCtx.clipRegion ?? null, shape, op, {
    x: 0,
    y: 0,
    w: rCtx.canvasW,
    h: rCtx.canvasH
  });
  if (!res.exact) ;
  rCtx.clipRegion = res.region;
  reapplyClipRegion(rCtx, res.region);
}
function readClipRectShape(rCtx, dataOff) {
  const { view } = rCtx;
  const left = view.getInt32(dataOff, true);
  const top = view.getInt32(dataOff + 4, true);
  const right = view.getInt32(dataOff + 8, true);
  const bottom = view.getInt32(dataOff + 12, true);
  return rectClipShape(
    gmx(rCtx, left),
    gmy(rCtx, top),
    gmw(rCtx, right - left),
    gmh(rCtx, bottom - top)
  );
}
function handleIntersectClipRect(rCtx, dataOff, recSize) {
  if (recSize >= 24) {
    gdiCombineClip(rCtx, readClipRectShape(rCtx, dataOff), "intersect");
  }
  return true;
}
function handleExcludeClipRect(rCtx, dataOff, recSize) {
  if (recSize >= 24) {
    gdiCombineClip(rCtx, readClipRectShape(rCtx, dataOff), "exclude");
  }
  return true;
}
var RGN_MODE_OPS = {
  1: "intersect",
  // RGN_AND
  2: "union",
  // RGN_OR
  3: "xor",
  // RGN_XOR
  4: "exclude",
  // RGN_DIFF
  5: "replace"
  // RGN_COPY
};
function handleExtSelectClipRgn(rCtx, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 16) {
    return true;
  }
  const cbRgnData = view.getUint32(dataOff, true);
  const iMode = view.getUint32(dataOff + 4, true);
  const op = RGN_MODE_OPS[iMode];
  if (!op) {
    return true;
  }
  if (cbRgnData === 0) {
    if (op === "replace") {
      rCtx.clipRegion = null;
      reapplyClipRegion(rCtx, null);
    }
    return true;
  }
  const rgnStart = dataOff + 8;
  if (cbRgnData < 32) {
    return true;
  }
  const nCount = view.getUint32(rgnStart + 8, true);
  if (nCount === 0) {
    return true;
  }
  const rects = [];
  const rectsStart = rgnStart + 32;
  for (let i = 0; i < nCount; i++) {
    const rOff = rectsStart + i * 16;
    if (rOff + 16 > dataOff + 8 + cbRgnData) {
      break;
    }
    const left = view.getInt32(rOff, true);
    const top = view.getInt32(rOff + 4, true);
    const right = view.getInt32(rOff + 8, true);
    const bottom = view.getInt32(rOff + 12, true);
    rects.push({
      x: gmx(rCtx, left),
      y: gmy(rCtx, top),
      w: gmw(rCtx, right - left),
      h: gmh(rCtx, bottom - top)
    });
  }
  if (rects.length === 0) {
    return true;
  }
  gdiCombineClip(rCtx, rectsClipShape(rects), op);
  emfLog(`EMR_EXTSELECTCLIPRGN: mode=${iMode} (${op}) with ${rects.length} rect(s)`);
  return true;
}
function handleOffsetClipRgn(rCtx, dataOff, recSize) {
  if (recSize >= 16) {
    const dx = rCtx.view.getInt32(dataOff, true);
    const dy = rCtx.view.getInt32(dataOff + 4, true);
    if (rCtx.clipRegion) {
      rCtx.clipRegion = translateClipRegion(rCtx.clipRegion, gmw(rCtx, dx), gmh(rCtx, dy));
      reapplyClipRegion(rCtx, rCtx.clipRegion);
    }
  }
  return true;
}
function handleEmfGdiClipRecord(rCtx, recType, dataOff, recSize) {
  switch (recType) {
    case EMR_INTERSECTCLIPRECT:
      return handleIntersectClipRect(rCtx, dataOff, recSize);
    case EMR_EXTSELECTCLIPRGN:
      return handleExtSelectClipRgn(rCtx, dataOff, recSize);
    case EMR_EXCLUDECLIPRECT:
      return handleExcludeClipRect(rCtx, dataOff, recSize);
    case EMR_OFFSETCLIPRGN:
      return handleOffsetClipRgn(rCtx, dataOff, recSize);
    default:
      return false;
  }
}

// src/emf-gdi-floodfill.ts
var FLOODFILLSURFACE = 1;
function clipMask(rCtx, w, h) {
  const mask = new Uint8Array(w * h);
  if (!rCtx.clipRegion) {
    mask.fill(1);
    return mask;
  }
  for (const r of scanlineCombineRegions(rCtx.clipRegion, null, "intersect", { x: 0, y: 0, w, h })) {
    for (let y = Math.max(0, r.y); y < Math.min(h, r.y + r.h); y++) {
      mask.fill(1, y * w + Math.max(0, r.x), y * w + Math.min(w, r.x + r.w));
    }
  }
  return mask;
}
function floodSpans(data, w, h, sx, sy, inside, allowed) {
  const spans = new SpanList();
  const ok = (x, y) => {
    const i = y * w + x;
    return allowed[i] === 1 && inside(data[i * 4] << 16 | data[i * 4 + 1] << 8 | data[i * 4 + 2]);
  };
  if (sx < 0 || sy < 0 || sx >= w || sy >= h || !ok(sx, sy)) {
    return spans;
  }
  const seen = new Uint8Array(w * h);
  const stack = [sx, sy];
  const rows = [];
  while (stack.length > 0) {
    const y = stack.pop();
    const x = stack.pop();
    if (seen[y * w + x] || !ok(x, y)) {
      continue;
    }
    let x0 = x;
    while (x0 > 0 && !seen[y * w + x0 - 1] && ok(x0 - 1, y)) {
      x0--;
    }
    let x1 = x + 1;
    while (x1 < w && !seen[y * w + x1] && ok(x1, y)) {
      x1++;
    }
    seen.fill(1, y * w + x0, y * w + x1);
    rows.push([y, x0, x1]);
    for (const ny of [y - 1, y + 1]) {
      if (ny < 0 || ny >= h) {
        continue;
      }
      let inRun = false;
      for (let nx = x0; nx < x1; nx++) {
        const can = !seen[ny * w + nx] && ok(nx, ny);
        if (can && !inRun) {
          stack.push(nx, ny);
        }
        inRun = can;
      }
    }
  }
  rows.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [y, x0, x1] of rows) {
    spans.add(y, x0, x1);
  }
  return spans;
}
function handleEmfGdiFloodFillRecord(rCtx, recType, dataOff, recSize) {
  if (recType !== EMR_EXTFLOODFILL) {
    return false;
  }
  if (recSize < 24) {
    return true;
  }
  const { ctx, view, state } = rCtx;
  if (!canReadBack(ctx) || typeof ctx.getImageData !== "function") {
    return true;
  }
  const paint = brushPaint(rCtx);
  if (!paint) {
    return true;
  }
  const w = rCtx.canvasW;
  const h = rCtx.canvasH;
  const [fx, fy] = fixPoint(rCtx, view.getInt32(dataOff, true), view.getInt32(dataOff + 4, true));
  const color = resolveColorRefRgb(view.getUint32(dataOff + 8, true), paletteEntries(state));
  const surface = view.getUint32(dataOff + 12, true) === FLOODFILLSURFACE;
  let data;
  try {
    data = canvasGetImageData(ctx, 0, 0, w, h).data;
  } catch {
    return true;
  }
  const spans = floodSpans(
    data,
    w,
    h,
    Math.round(fx / 16),
    Math.round(fy / 16),
    surface ? (rgb2) => rgb2 === color : (rgb2) => rgb2 !== color,
    clipMask(rCtx, w, h)
  );
  paintSpansDeferred(rCtx, spans, paint, state.rop2);
  return true;
}

// src/emf-gdi-gradient-fill.ts
var GRADIENT_FILL_RECT_H = 0;
var GRADIENT_FILL_RECT_V = 1;
var GRADIENT_FILL_TRIANGLE = 2;
function rectGradientLevel(c0, c1, i, n) {
  const step = Math.floor((c1 - c0) * 65536 / n);
  return Math.floor((c0 * 65536 + step * i) / 65536) >> 8;
}
function paintTriangle(v, patch) {
  const spans = fillPolygonSpans([v.flatMap((p) => [p.x, p.y])], false);
  if (spans.length === 0) {
    return;
  }
  const [a, b, c] = v.map((p) => ({ x: p.x / 16, y: p.y / 16, c: p.c.map((ch) => Math.min(ch, 65280)) }));
  const det = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  if (det === 0) {
    return;
  }
  const dx = [0, 1, 2].map((k) => ((b.c[k] - a.c[k]) * (c.y - a.y) - (c.c[k] - a.c[k]) * (b.y - a.y)) / det);
  const dy = [0, 1, 2].map((k) => ((c.c[k] - a.c[k]) * (b.x - a.x) - (b.c[k] - a.c[k]) * (c.x - a.x)) / det);
  const stepX = dx.map((d2) => Math.floor(d2 * 65536));
  const d = spans.data;
  const top = d[0];
  for (let s = 0; s < spans.length * 3; s += 3) {
    const y = d[s];
    const xs = d[s + 1];
    const xe = d[s + 2];
    if (y < patch.y || y >= patch.y + patch.h) {
      continue;
    }
    const start = [0, 1, 2].map((k) => a.c[k] + dx[k] * (xs - a.x) + dy[k] * (y - a.y) + (y === top ? 0 : 0.5));
    for (let x = Math.max(xs, patch.x); x < Math.min(xe, patch.x + patch.w); x++) {
      let rgb2 = 0;
      for (let k = 0; k < 3; k++) {
        const level = Math.floor(start[k] + stepX[k] * (x - xs) / 65536 + 1e-9) >> 8;
        rgb2 = rgb2 << 8 | Math.max(0, Math.min(255, level));
      }
      patch.rgb[(y - patch.y) * patch.w + (x - patch.x)] = rgb2;
    }
  }
}
function readRecord(rCtx, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 36) {
    return null;
  }
  const nVer = view.getUint32(dataOff + 16, true);
  const nTri = view.getUint32(dataOff + 20, true);
  const mode = view.getUint32(dataOff + 24, true);
  const per = mode === GRADIENT_FILL_TRIANGLE ? 3 : 2;
  const vOff = dataOff + 28;
  const mOff = vOff + nVer * 16;
  if (nVer > 1e6 || nTri > 1e6 || mOff + nTri * per * 4 > dataOff - 8 + recSize) {
    return null;
  }
  const vertices = [];
  for (let i = 0; i < nVer; i++) {
    const o = vOff + i * 16;
    const [x, y] = fixPoint(rCtx, view.getInt32(o, true), view.getInt32(o + 4, true));
    vertices.push({ x, y, c: [view.getUint16(o + 8, true), view.getUint16(o + 10, true), view.getUint16(o + 12, true)] });
  }
  const mesh = [];
  for (let i = 0; i < nTri; i++) {
    const idx = [];
    for (let k = 0; k < per; k++) {
      idx.push(view.getUint32(mOff + (i * per + k) * 4, true));
    }
    if (idx.every((j) => j < nVer)) {
      mesh.push(idx);
    }
  }
  return { mode, vertices, mesh };
}
function drawPatch(rCtx, patch) {
  const x0 = Math.max(0, patch.x);
  const y0 = Math.max(0, patch.y);
  const x1 = Math.min(rCtx.canvasW, patch.x + patch.w);
  const y1 = Math.min(rCtx.canvasH, patch.y + patch.h);
  if (x1 <= x0 || y1 <= y0) {
    return;
  }
  const w = x1 - x0;
  const h = y1 - y0;
  const data = new Uint8ClampedArray(w * h * 4);
  let any = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = patch.rgb[(y + y0 - patch.y) * patch.w + (x + x0 - patch.x)];
      if (c < 0) {
        continue;
      }
      const i = (y * w + x) * 4;
      data[i] = c >> 16 & 255;
      data[i + 1] = c >> 8 & 255;
      data[i + 2] = c & 255;
      data[i + 3] = 255;
      any = true;
    }
  }
  const scratch = any ? acquireScratch(w, h) : null;
  if (scratch) {
    compositeOverlay(rCtx.ctx, { x: x0, y: y0, w, h }, scratch, createImageDataCompat(data, w, h));
  }
}
function hex3(c) {
  return `#${c.map((v) => (v >> 8).toString(16).padStart(2, "0")).join("")}`;
}
function rectOf(u, v, vertical) {
  const ux = Math.round(u.x / 16);
  const uy = Math.round(u.y / 16);
  const vx = Math.round(v.x / 16);
  const vy = Math.round(v.y / 16);
  const first = (vertical ? uy <= vy : ux <= vx) ? u : v;
  return { l: Math.min(ux, vx), t: Math.min(uy, vy), r: Math.max(ux, vx), b: Math.max(uy, vy), first, second: first === u ? v : u };
}
function handleEmfGdiGradientFillRecord(rCtx, recType, dataOff, recSize) {
  if (recType !== EMR_GRADIENTFILL) {
    return false;
  }
  const rec = readRecord(rCtx, dataOff, recSize);
  if (!rec) {
    return true;
  }
  const { ctx } = rCtx;
  if (rec.mode === GRADIENT_FILL_RECT_H || rec.mode === GRADIENT_FILL_RECT_V) {
    const vertical = rec.mode === GRADIENT_FILL_RECT_V;
    const vector = isSvgContext(ctx) && rCtx.gdiAntialias !== false;
    for (const [i, j] of rec.mesh) {
      const r = rectOf(rec.vertices[i], rec.vertices[j], vertical);
      const w = r.r - r.l;
      const h = r.b - r.t;
      if (w <= 0 || h <= 0) {
        continue;
      }
      if (vector) {
        const n2 = vertical ? h : w;
        const g = vertical ? ctx.createLinearGradient(0, r.t, 0, r.t + n2) : ctx.createLinearGradient(r.l, 0, r.l + n2, 0);
        g.addColorStop(0, hex3(r.first.c));
        g.addColorStop(1, hex3(r.second.c));
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = g;
        ctx.fillRect(r.l, r.t, w, h);
        ctx.restore();
        continue;
      }
      const px0 = Math.max(r.l, 0);
      const py0 = Math.max(r.t, 0);
      const px1 = Math.min(r.r, rCtx.canvasW);
      const py1 = Math.min(r.b, rCtx.canvasH);
      if (px1 <= px0 || py1 <= py0) {
        continue;
      }
      const patch = { x: px0, y: py0, w: px1 - px0, h: py1 - py0, rgb: new Int32Array((px1 - px0) * (py1 - py0)) };
      const n = vertical ? h : w;
      const along = [];
      for (let pos = vertical ? py0 - r.t : px0 - r.l; pos < (vertical ? py1 - r.t : px1 - r.l); pos++) {
        let rgb2 = 0;
        for (let k = 0; k < 3; k++) {
          rgb2 = rgb2 << 8 | Math.max(0, Math.min(255, rectGradientLevel(r.first.c[k], r.second.c[k], pos, n)));
        }
        along.push(rgb2);
      }
      for (let y = 0; y < patch.h; y++) {
        for (let x = 0; x < patch.w; x++) {
          patch.rgb[y * patch.w + x] = along[vertical ? y : x];
        }
      }
      drawPatch(rCtx, patch);
    }
    return true;
  }
  if (rec.mode === GRADIENT_FILL_TRIANGLE) {
    for (const idx of rec.mesh) {
      const tri = idx.map((i) => rec.vertices[i]);
      const xs = tri.map((p) => p.x / 16);
      const ys = tri.map((p) => p.y / 16);
      const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 1);
      const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 1);
      const x1 = Math.min(rCtx.canvasW, Math.ceil(Math.max(...xs)) + 1);
      const y1 = Math.min(rCtx.canvasH, Math.ceil(Math.max(...ys)) + 1);
      if (x1 <= x0 || y1 <= y0) {
        continue;
      }
      const patch = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, rgb: new Int32Array((x1 - x0) * (y1 - y0)).fill(-1) };
      paintTriangle(tri, patch);
      drawPatch(rCtx, patch);
    }
  }
  return true;
}

// src/emf-gdi-region-records.ts
var R2_NOT2 = 6;
function readRegionRects(view, rgnOff, cbRgnData) {
  const rects = [];
  if (cbRgnData < 32 || rgnOff + 32 > view.byteLength) {
    return rects;
  }
  const count = view.getUint32(rgnOff + 8, true);
  const end = Math.min(view.byteLength, rgnOff + cbRgnData);
  for (let i = 0; i < count; i++) {
    const o = rgnOff + 32 + i * 16;
    if (o + 16 > end) {
      break;
    }
    rects.push([view.getInt32(o, true), view.getInt32(o + 4, true), view.getInt32(o + 8, true), view.getInt32(o + 12, true)]);
  }
  return rects;
}
function regionSpans(rCtx, rects) {
  const spans = new SpanList();
  if (hasWorldRotation(rCtx)) {
    const polys = rects.map(([l, t, r, b]) => [...fixPoint(rCtx, l, t), ...fixPoint(rCtx, r, t), ...fixPoint(rCtx, r, b), ...fixPoint(rCtx, l, b)]);
    return fillPolygonSpans(polys, true, spans);
  }
  for (const [l, t, r, b] of rects) {
    const x0 = Math.round(gmx(rCtx, l));
    const x1 = Math.round(gmx(rCtx, r));
    const y0 = Math.round(gmy(rCtx, t));
    const y1 = Math.round(gmy(rCtx, b));
    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    for (let y = Math.min(y0, y1); y < Math.max(y0, y1); y++) {
      spans.add(y, left, right);
    }
  }
  return spans;
}
function frameSpans(spans, w, h) {
  const out = new SpanList();
  const b = spans.bounds();
  if (!b) {
    return out;
  }
  const W = b.x1 - b.x0;
  const H = b.y1 - b.y0;
  const mask = new Uint8Array(W * H);
  const d = spans.data;
  for (let i = 0; i < spans.length * 3; i += 3) {
    mask.fill(1, (d[i] - b.y0) * W + d[i + 1] - b.x0, (d[i] - b.y0) * W + d[i + 2] - b.x0);
  }
  const horiz = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let all = 1;
      for (let k = -w; k <= w && all; k++) {
        const xx = x + k;
        all = xx >= 0 && xx < W ? mask[y * W + xx] : 0;
      }
      horiz[y * W + x] = all;
    }
  }
  const kept = (x, y) => {
    for (let k = -h; k <= h; k++) {
      const yy = y + k;
      if (yy < 0 || yy >= H || !horiz[yy * W + x]) {
        return false;
      }
    }
    return true;
  };
  for (let y = 0; y < H; y++) {
    let run = -1;
    for (let x = 0; x <= W; x++) {
      const edge = x < W && mask[y * W + x] === 1 && !kept(x, y);
      if (edge && run < 0) {
        run = x;
      } else if (!edge && run >= 0) {
        out.add(y + b.y0, run + b.x0, x + b.x0);
        run = -1;
      }
    }
  }
  return out;
}
function brushObject(rCtx, ihBrush) {
  const obj = ihBrush >= STOCK_OBJECT_BASE ? getStockObject(ihBrush - STOCK_OBJECT_BASE) : rCtx.objectTable.get(ihBrush) ?? null;
  return obj && obj.kind === "brush" ? obj : null;
}
function paintWithBrush(rCtx, spans, brush) {
  const { state } = rCtx;
  const saved = { style: state.brushStyle, color: state.brushColor, pattern: state.brushPattern };
  if (brush) {
    state.brushStyle = brush.style;
    state.brushColor = brush.colorRef !== void 0 ? resolveColorRef(state, brush.colorRef) : brush.color;
    state.brushPattern = brush.pattern ?? null;
  }
  try {
    const paint = brushPaint(rCtx);
    if (paint) {
      paintSpansDeferred(rCtx, spans, paint, state.rop2);
    }
  } finally {
    state.brushStyle = saved.style;
    state.brushColor = saved.color;
    state.brushPattern = saved.pattern;
  }
}
function handleEmfGdiRegionRecord(rCtx, recType, dataOff, recSize) {
  const { view } = rCtx;
  switch (recType) {
    case EMR_FILLRGN: {
      if (recSize >= 32) {
        const cb = view.getUint32(dataOff + 16, true);
        const brush = brushObject(rCtx, view.getUint32(dataOff + 20, true));
        if (brush) {
          paintWithBrush(rCtx, regionSpans(rCtx, readRegionRects(view, dataOff + 24, cb)), brush);
        }
      }
      return true;
    }
    case EMR_FRAMERGN: {
      if (recSize >= 40) {
        const cb = view.getUint32(dataOff + 16, true);
        const brush = brushObject(rCtx, view.getUint32(dataOff + 20, true));
        const w = Math.round(Math.abs(gmw(rCtx, view.getInt32(dataOff + 24, true))));
        const h = Math.round(Math.abs(gmh(rCtx, view.getInt32(dataOff + 28, true))));
        if (brush) {
          const spans = regionSpans(rCtx, readRegionRects(view, dataOff + 32, cb));
          paintWithBrush(rCtx, frameSpans(spans, w, h), brush);
        }
      }
      return true;
    }
    case EMR_INVERTRGN:
    case EMR_PAINTRGN: {
      if (recSize >= 24) {
        const cb = view.getUint32(dataOff + 16, true);
        const spans = regionSpans(rCtx, readRegionRects(view, dataOff + 20, cb));
        if (recType === EMR_INVERTRGN) {
          paintSpansDeferred(rCtx, spans, { kind: "solid", rgb: 0 }, R2_NOT2);
        } else {
          paintWithBrush(rCtx, spans, null);
        }
      }
      return true;
    }
    default:
      return false;
  }
}

// src/emf-gdi-draw-text-bitmap.ts
function handleEmfGdiTextBitmapRecord(rCtx, recType, offset, dataOff, recSize) {
  return handleEmfGdiDrawTextRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiBitmapRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiBlendBlitRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiClipRecord(rCtx, recType, dataOff, recSize) || handleEmfGdiRegionRecord(rCtx, recType, dataOff, recSize) || handleEmfGdiFloodFillRecord(rCtx, recType, dataOff, recSize) || handleEmfGdiGradientFillRecord(rCtx, recType, dataOff, recSize);
}

// src/emf-gdi-draw-handlers.ts
function handleEmfGdiDrawRecord(rCtx, recType, offset, dataOff, recSize) {
  return handleEmfGdiShapeRecord(rCtx, recType, dataOff, recSize) || handleEmfGdiTextBitmapRecord(rCtx, recType, offset, dataOff, recSize);
}

// src/emf-gdi-polypolygon-helpers.ts
function buildPolyPolygonPath(target, rCtx, readPoint, countsOff, numPolys, totalPoints, close) {
  const { view } = rCtx;
  let pIdx = 0;
  for (let p = 0; p < numPolys; p++) {
    const count = view.getUint32(countsOff + p * 4, true);
    for (let i = 0; i < count && pIdx < totalPoints; i++) {
      const pt = readPoint(pIdx);
      if (i === 0) {
        target.moveTo(pt.x, pt.y);
      } else {
        target.lineTo(pt.x, pt.y);
      }
      pIdx++;
    }
    if (close) {
      target.closePath();
    }
  }
}
function buildPolyPolygonRaster(path, rCtx, readLogical, countsOff, numPolys, totalPoints, close) {
  const { view } = rCtx;
  let pIdx = 0;
  for (let p = 0; p < numPolys; p++) {
    const count = view.getUint32(countsOff + p * 4, true);
    for (let i = 0; i < count && pIdx < totalPoints; i++) {
      const [lx, ly] = readLogical(pIdx);
      const [x, y] = fixPoint(rCtx, lx, ly);
      if (i === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
      pIdx++;
    }
    if (close && count > 0) {
      path.closeFigure();
    }
  }
}
function handlePolyPoly(rCtx, offset, dataOff, recSize, pointSize, close) {
  const { view, state, inPath } = rCtx;
  const numPolys = view.getUint32(dataOff + 16, true);
  const totalPoints = view.getUint32(dataOff + 20, true);
  if (numPolys === 0 || numPolys >= 1e4 || totalPoints >= 1e5) {
    return;
  }
  const countsOff = dataOff + 24;
  const ptOff = countsOff + numPolys * 4;
  if (ptOff + totalPoints * pointSize > offset + recSize) {
    return;
  }
  const readLogical = (pIdx) => pointSize === 8 ? [view.getInt32(ptOff + pIdx * 8, true), view.getInt32(ptOff + pIdx * 8 + 4, true)] : [view.getInt16(ptOff + pIdx * 4, true), view.getInt16(ptOff + pIdx * 4 + 2, true)];
  const readPoint = (pIdx) => {
    const [x, y] = readLogical(pIdx);
    return gmapPoint(rCtx, x, y);
  };
  const build = (target) => {
    buildPolyPolygonPath(target, rCtx, readPoint, countsOff, numPolys, totalPoints, close);
  };
  if (inPath) {
    build(gdiPathRecorder(rCtx));
    rCtx.rasterPath ?? (rCtx.rasterPath = new GdiRasterPath());
    buildPolyPolygonRaster(rCtx.rasterPath, rCtx, readLogical, countsOff, numPolys, totalPoints, close);
    return;
  }
  rCtx.lineStyle = { pos: 0 };
  paintGdiShape(rCtx, {
    build: (target) => {
      target.beginPath();
      build(target);
    },
    raster: () => {
      const path = new GdiRasterPath();
      buildPolyPolygonRaster(path, rCtx, readLogical, countsOff, numPolys, totalPoints, close);
      return path;
    },
    fill: close,
    stroke: true,
    fillRule: state.polyFillMode === 2 ? "nonzero" : "evenodd"
  });
}
function handlePolyPolygon32(rCtx, offset, dataOff, recSize) {
  handlePolyPoly(rCtx, offset, dataOff, recSize, 8, true);
}
function handlePolyPolyline32(rCtx, offset, dataOff, recSize) {
  handlePolyPoly(rCtx, offset, dataOff, recSize, 8, false);
}
function handlePolyPolyline16(rCtx, offset, dataOff, recSize) {
  handlePolyPoly(rCtx, offset, dataOff, recSize, 4, false);
}
function handlePolyPolygon16(rCtx, offset, dataOff, recSize) {
  handlePolyPoly(rCtx, offset, dataOff, recSize, 4, true);
}

// src/emf-gdi-poly-path-handlers.ts
function handlePoly(rCtx, recType, count, readPt, kinds) {
  const { state, inPath } = rCtx;
  const { polygon: isPolygon, bezier: isBezier, to: isTo } = kinds;
  const pt = (i) => {
    const [x, y] = readPt(i);
    return gmapPoint(rCtx, x, y);
  };
  const build = (target) => {
    if (!isTo) {
      const p0 = pt(0);
      target.moveTo(p0.x, p0.y);
    }
    let i = isTo ? 0 : 1;
    if (isBezier) {
      while (i + 2 < count) {
        const p1 = pt(i);
        const p2 = pt(i + 1);
        const p3 = pt(i + 2);
        target.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        i += 3;
      }
    } else {
      for (; i < count; i++) {
        const p = pt(i);
        target.lineTo(p.x, p.y);
      }
    }
    if (isPolygon) {
      target.closePath();
    }
  };
  const fx = (i) => {
    const [x, y] = readPt(i);
    return fixPoint(rCtx, x, y);
  };
  const buildRaster = (path, from) => {
    let i = 0;
    if (isTo) {
      if (from) {
        path.moveTo(from[0], from[1]);
      }
    } else {
      const p0 = fx(0);
      path.moveTo(p0[0], p0[1]);
      i = 1;
    }
    if (isBezier) {
      for (; i + 2 < count; i += 3) {
        const a = fx(i);
        const b = fx(i + 1);
        const c = fx(i + 2);
        path.bezierTo(a[0], a[1], b[0], b[1], c[0], c[1]);
      }
    } else {
      for (; i < count; i++) {
        const p = fx(i);
        path.lineTo(p[0], p[1]);
      }
    }
    if (isPolygon) {
      path.closeFigure();
    }
  };
  if (inPath) {
    if (isTo) {
      continueFigure(rCtx);
    }
    build(gdiPathRecorder(rCtx));
    rCtx.rasterPath ?? (rCtx.rasterPath = new GdiRasterPath());
    buildRaster(rCtx.rasterPath, null);
  } else {
    const from = isTo ? currentFix(rCtx) : null;
    const start = isTo ? gmapPoint(rCtx, state.curX, state.curY) : null;
    rCtx.lineStyle = { pos: 0 };
    paintGdiShape(rCtx, {
      build: (target) => {
        target.beginPath();
        if (start) {
          target.moveTo(start.x, start.y);
        }
        build(target);
      },
      raster: () => {
        const path = new GdiRasterPath();
        buildRaster(path, from);
        return path;
      },
      fill: isPolygon,
      stroke: true,
      fillRule: state.polyFillMode === 2 ? "nonzero" : "evenodd"
    });
  }
  if (isTo && count > 0) {
    const [x, y] = readPt(count - 1);
    state.curX = x;
    state.curY = y;
    rCtx.curFix = void 0;
  }
}
function handlePoly32(rCtx, recType, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 28) {
    return true;
  }
  const count = view.getUint32(dataOff + 16, true);
  const ptOff = dataOff + 20;
  if (count === 0 || ptOff + count * 8 > offset + recSize) {
    return true;
  }
  handlePoly(rCtx, recType, count, (i) => [view.getInt32(ptOff + i * 8, true), view.getInt32(ptOff + i * 8 + 4, true)], {
    polygon: recType === EMR_POLYGON,
    bezier: recType === EMR_POLYBEZIER || recType === EMR_POLYBEZIERTO,
    to: recType === EMR_POLYBEZIERTO || recType === EMR_POLYLINETO
  });
  return true;
}
function handlePoly16(rCtx, recType, offset, dataOff, recSize) {
  const { view } = rCtx;
  if (recSize < 28) {
    return true;
  }
  const count = view.getUint32(dataOff + 16, true);
  const ptOff = dataOff + 20;
  if (count === 0 || ptOff + count * 4 > offset + recSize) {
    return true;
  }
  handlePoly(rCtx, recType, count, (i) => [view.getInt16(ptOff + i * 4, true), view.getInt16(ptOff + i * 4 + 2, true)], {
    polygon: recType === EMR_POLYGON16,
    bezier: recType === EMR_POLYBEZIER16 || recType === EMR_POLYBEZIERTO16,
    to: recType === EMR_POLYBEZIERTO16 || recType === EMR_POLYLINETO16
  });
  return true;
}
var PT_CLOSEFIGURE = 1;
var PT_LINETO = 2;
var PT_BEZIERTO = 4;
var PT_MOVETO = 6;
function handlePolyDraw(rCtx, offset, dataOff, recSize, pointSize) {
  const { view, state, inPath } = rCtx;
  if (recSize < 28) {
    return;
  }
  const count = view.getUint32(dataOff + 16, true);
  const ptOff = dataOff + 20;
  const typeOff = ptOff + count * pointSize;
  if (count === 0 || count > 1e6 || typeOff + count > offset + recSize) {
    return;
  }
  const readPt = (i) => pointSize === 8 ? [view.getInt32(ptOff + i * 8, true), view.getInt32(ptOff + i * 8 + 4, true)] : [view.getInt16(ptOff + i * 4, true), view.getInt16(ptOff + i * 4 + 2, true)];
  const typeAt = (i) => view.getUint8(typeOff + i);
  const walk2 = (canvas, raster, from, fromPx) => {
    let open = false;
    const ensureOpen = () => {
      if (!open) {
        if (fromPx) {
          canvas?.moveTo(fromPx.x, fromPx.y);
        }
        if (from) {
          raster?.moveTo(from[0], from[1]);
        }
        open = true;
      }
    };
    for (let i = 0; i < count; i++) {
      const t = typeAt(i);
      const kind = t & ~PT_CLOSEFIGURE;
      if (kind === PT_MOVETO) {
        const [x, y] = readPt(i);
        const p = gmapPoint(rCtx, x, y);
        const f = fixPoint(rCtx, x, y);
        canvas?.moveTo(p.x, p.y);
        raster?.moveTo(f[0], f[1]);
        open = true;
        continue;
      }
      if (kind === PT_LINETO) {
        ensureOpen();
        const [x, y] = readPt(i);
        const p = gmapPoint(rCtx, x, y);
        const f = fixPoint(rCtx, x, y);
        canvas?.lineTo(p.x, p.y);
        raster?.lineTo(f[0], f[1]);
      } else if (kind === PT_BEZIERTO && i + 2 < count) {
        ensureOpen();
        const pts = [0, 1, 2].map((k) => readPt(i + k));
        const dev = pts.map(([x, y]) => gmapPoint(rCtx, x, y));
        const fix = pts.map(([x, y]) => fixPoint(rCtx, x, y));
        canvas?.bezierCurveTo(dev[0].x, dev[0].y, dev[1].x, dev[1].y, dev[2].x, dev[2].y);
        raster?.bezierTo(fix[0][0], fix[0][1], fix[1][0], fix[1][1], fix[2][0], fix[2][1]);
        i += 2;
      } else {
        continue;
      }
      if (typeAt(i) & PT_CLOSEFIGURE) {
        canvas?.closePath();
        raster?.closeFigure();
      }
    }
  };
  const startsWithMove = (typeAt(0) & ~PT_CLOSEFIGURE) === PT_MOVETO;
  if (inPath) {
    if (!startsWithMove) {
      continueFigure(rCtx);
    }
    rCtx.rasterPath ?? (rCtx.rasterPath = new GdiRasterPath());
    walk2(gdiPathRecorder(rCtx), rCtx.rasterPath, null, null);
  } else {
    const from = startsWithMove ? null : currentFix(rCtx);
    const fromPx = startsWithMove ? null : gmapPoint(rCtx, state.curX, state.curY);
    rCtx.lineStyle = { pos: 0 };
    paintGdiShape(rCtx, {
      build: (target) => {
        target.beginPath();
        walk2(target, null, null, fromPx);
      },
      raster: () => {
        const path = new GdiRasterPath();
        walk2(null, path, from, null);
        return path;
      },
      fill: false,
      stroke: true
    });
  }
  const [lx, ly] = readPt(count - 1);
  state.curX = lx;
  state.curY = ly;
  rCtx.curFix = void 0;
}
function closeAllFigures(cmds) {
  const out = [];
  for (const c of cmds) {
    if (c.op === "moveTo" && out.length > 0) {
      out.push({ op: "closePath" });
    }
    out.push(c);
  }
  if (out.length > 0) {
    out.push({ op: "closePath" });
  }
  return out;
}
function paintBracketPath(rCtx, fill, stroke) {
  const { state } = rCtx;
  const close = fill && stroke;
  const cmds = close ? closeAllFigures(rCtx.pathCmds) : rCtx.pathCmds;
  const buildPath = (target) => {
    target.beginPath();
    replayGdiPathCmds(target, cmds);
  };
  let raster = rCtx.rasterPath ?? new GdiRasterPath();
  if (close) {
    const closed = new GdiRasterPath();
    closed.append(raster);
    for (const f of closed.figures) {
      f.closed = true;
    }
    raster = closed;
  }
  paintGdiShape(rCtx, {
    build: buildPath,
    raster: () => raster,
    fill,
    stroke,
    fillRule: state.polyFillMode === 2 ? "nonzero" : "evenodd"
  });
}
function discardPath(rCtx) {
  rCtx.pathCmds = [];
  rCtx.rasterPath = new GdiRasterPath();
}
function syncPathCmds(rCtx) {
  const cmds = [];
  for (const f of rCtx.rasterPath?.figures ?? []) {
    for (let i = 0; i + 1 < f.pts.length; i += 2) {
      cmds.push({ op: i === 0 ? "moveTo" : "lineTo", x: f.pts[i] / 16, y: f.pts[i + 1] / 16 });
    }
    if (f.closed) {
      cmds.push({ op: "closePath" });
    }
  }
  rCtx.pathCmds = cmds;
}
function flattenBracketPath(rCtx) {
  if (rCtx.inPath || !rCtx.rasterPath) {
    return;
  }
  for (const f of rCtx.rasterPath.figures) {
    delete f.tangents;
  }
  syncPathCmds(rCtx);
}
function widenBracketPath(rCtx) {
  const { state } = rCtx;
  if (rCtx.inPath || !rCtx.rasterPath || (state.penStyle & 15) === 5) {
    return;
  }
  const options = penIsCosmetic(rCtx) ? { width: 16, cap: "round", join: "round", miterLimit: state.miterLimit ?? 10 } : penWidenOptions(rCtx);
  const polys = widenPath(rCtx.rasterPath, options);
  const path = new GdiRasterPath();
  for (const poly of polys) {
    if (poly.length < 4) {
      continue;
    }
    path.moveTo(poly[0], poly[1]);
    for (let i = 2; i + 1 < poly.length; i += 2) {
      path.lineTo(poly[i], poly[i + 1]);
    }
    path.closeFigure();
  }
  rCtx.rasterPath = path;
  syncPathCmds(rCtx);
}
function handleEmfGdiPolyPathRecord(rCtx, recType, offset, dataOff, recSize) {
  const { ctx, state } = rCtx;
  switch (recType) {
    // ---- 32-bit polys ----
    case EMR_POLYLINE:
    case EMR_POLYGON:
    case EMR_POLYBEZIER:
    case EMR_POLYBEZIERTO:
    case EMR_POLYLINETO:
      return handlePoly32(rCtx, recType, offset, dataOff, recSize);
    // ---- 16-bit polys ----
    case EMR_POLYLINE16:
    case EMR_POLYGON16:
    case EMR_POLYBEZIER16:
    case EMR_POLYBEZIERTO16:
    case EMR_POLYLINETO16:
      return handlePoly16(rCtx, recType, offset, dataOff, recSize);
    // ---- polypolyline / polypolygon ----
    case EMR_POLYPOLYLINE:
      if (recSize >= 28) {
        handlePolyPolyline32(rCtx, offset, dataOff, recSize);
      }
      return true;
    case EMR_POLYPOLYGON:
      if (recSize >= 28) {
        handlePolyPolygon32(rCtx, offset, dataOff, recSize);
      }
      return true;
    case EMR_POLYPOLYGON16:
      if (recSize >= 28) {
        handlePolyPolygon16(rCtx, offset, dataOff, recSize);
      }
      return true;
    case EMR_POLYDRAW:
      handlePolyDraw(rCtx, offset, dataOff, recSize, 8);
      return true;
    case EMR_POLYDRAW16:
      handlePolyDraw(rCtx, offset, dataOff, recSize, 4);
      return true;
    case EMR_POLYPOLYLINE16:
      if (recSize >= 28) {
        handlePolyPolyline16(rCtx, offset, dataOff, recSize);
      }
      return true;
    // ---- path operations ----
    case EMR_BEGINPATH:
      rCtx.inPath = true;
      rCtx.pathCmds = [];
      rCtx.rasterPath = new GdiRasterPath();
      ctx.beginPath();
      return true;
    case EMR_ENDPATH:
      rCtx.inPath = false;
      return true;
    case EMR_CLOSEFIGURE:
      ctx.closePath();
      if (rCtx.inPath) {
        rCtx.pathCmds.push({ op: "closePath" });
        rCtx.rasterPath?.closeFigure();
      }
      return true;
    case EMR_FILLPATH:
      paintBracketPath(rCtx, true, false);
      discardPath(rCtx);
      return true;
    case EMR_STROKEANDFILLPATH:
      paintBracketPath(rCtx, true, true);
      discardPath(rCtx);
      return true;
    case EMR_STROKEPATH:
      paintBracketPath(rCtx, false, true);
      discardPath(rCtx);
      return true;
    case EMR_FLATTENPATH:
      flattenBracketPath(rCtx);
      return true;
    case EMR_WIDENPATH:
      widenBracketPath(rCtx);
      return true;
    case EMR_ABORTPATH:
      rCtx.inPath = false;
      discardPath(rCtx);
      ctx.beginPath();
      return true;
    case EMR_SELECTCLIPPATH: {
      const clipMode = recSize >= 12 ? rCtx.view.getUint32(dataOff, true) : 5;
      const op = RGN_MODE_OPS[clipMode];
      if (rCtx.inPath || !rCtx.rasterPath || rCtx.rasterPath.figures.length === 0) {
        return true;
      }
      if (!op) {
        return true;
      }
      const rects = spanRects(fillPathSpans(rCtx.rasterPath, state.polyFillMode === 2));
      const shape = rects.length > 0 ? rectsClipShape(rects) : emptyClipShape();
      gdiCombineClip(rCtx, shape, op);
      discardPath(rCtx);
      return true;
    }
    default:
      return false;
  }
}

// src/emf-gdi-misc-records.ts
var EMF_NO_EFFECT_RECORDS = /* @__PURE__ */ new Set([
  EMR_SETMAPPERFLAGS,
  EMR_CREATECOLORSPACE,
  EMR_SETCOLORSPACE,
  EMR_DELETECOLORSPACE,
  EMR_GLSRECORD,
  EMR_GLSBOUNDEDRECORD,
  EMR_PIXELFORMAT,
  EMR_DRAWESCAPE,
  EMR_EXTESCAPE,
  EMR_FORCEUFIMAPPING,
  EMR_NAMEDESCAPE,
  EMR_COLORCORRECTPALETTE,
  EMR_SETICMPROFILEA,
  EMR_SETICMPROFILEW,
  EMR_SETLINKEDUFIS,
  EMR_COLORMATCHTOTARGETW,
  EMR_CREATECOLORSPACEW
]);
function handleEmfGdiMiscRecord(rCtx, recType, dataOff, recSize) {
  const { view, state } = rCtx;
  switch (recType) {
    case EMR_SETTEXTJUSTIFICATION: {
      if (recSize >= 16) {
        const extra = view.getInt32(dataOff, true);
        const count = view.getInt32(dataOff + 4, true);
        state.textJustification = extra !== 0 && count > 0 ? { extra, count } : void 0;
      }
      return true;
    }
    case EMR_SETCOLORADJUSTMENT: {
      const ca = recSize >= 8 + COLOR_ADJUSTMENT_SIZE ? readColorAdjustment(view, dataOff) : null;
      if (ca) {
        state.colorAdjustment = ca;
      }
      return true;
    }
    default:
      if (EMF_NO_EFFECT_RECORDS.has(recType)) {
        return true;
      }
      return false;
  }
}

// src/emf-gdi-object-handlers.ts
function handleEmfObjectRecord(rCtx, recType, dataOff, recSize) {
  const { view, state } = rCtx;
  switch (recType) {
    case EMR_CREATEPEN: {
      if (recSize >= 28) {
        const ihPen = view.getUint32(dataOff, true);
        const penStyle = view.getUint32(dataOff + 4, true);
        const widthX = view.getInt32(dataOff + 8, true);
        const colorRef = readRawColorRef(view, dataOff + 16);
        const color = resolveColorRef(state, colorRef);
        rCtx.objectTable.set(ihPen, {
          kind: "pen",
          style: penStyle & 255,
          widthX,
          color,
          flags: penStyle,
          ...isPaletteRelative(colorRef) ? { colorRef } : {}
        });
      }
      return true;
    }
    case EMR_EXTCREATEPEN: {
      if (recSize >= 52) {
        const ihPen = view.getUint32(dataOff, true);
        const penStyle = view.getUint32(dataOff + 20, true);
        const widthX = view.getInt32(dataOff + 24, true);
        const colorRef = readRawColorRef(view, dataOff + 32);
        const color = resolveColorRef(state, colorRef);
        const numEntries = view.getUint32(dataOff + 40, true);
        const userStyle = [];
        if ((penStyle & 15) === 7) {
          for (let i = 0; i < numEntries && i < 16 && 8 + 44 + i * 4 + 4 <= recSize; i++) {
            userStyle.push(view.getUint32(dataOff + 44 + i * 4, true));
          }
        }
        rCtx.objectTable.set(ihPen, {
          kind: "pen",
          style: penStyle & 15,
          widthX,
          color,
          flags: penStyle,
          extended: true,
          ...isPaletteRelative(colorRef) ? { colorRef } : {},
          ...userStyle.length > 0 ? { userStyle } : {}
        });
      }
      return true;
    }
    case EMR_CREATEBRUSHINDIRECT: {
      if (recSize >= 24) {
        const ihBrush = view.getUint32(dataOff, true);
        const brushStyle = view.getUint32(dataOff + 4, true);
        const colorRef = readRawColorRef(view, dataOff + 8);
        const color = resolveColorRef(state, colorRef);
        const hatch = view.getUint32(dataOff + 12, true);
        rCtx.objectTable.set(ihBrush, {
          kind: "brush",
          style: brushStyle,
          color,
          ...isPaletteRelative(colorRef) ? { colorRef } : {},
          ...brushStyle === 2 && hatch <= 5 ? { pattern: { kind: "hatch", hatch } } : {}
        });
      }
      return true;
    }
    case EMR_CREATEMONOBRUSH:
    case EMR_CREATEDIBPATTERNBRUSHPT: {
      if (recSize >= 32) {
        const ihBrush = view.getUint32(dataOff, true);
        const mono = recType === EMR_CREATEMONOBRUSH;
        const usage = view.getUint32(dataOff + 4, true);
        const pattern = parsePatternBrush(view, dataOff - 8, dataOff, mono, usage === 1 ? paletteEntries(state) : null);
        rCtx.objectTable.set(ihBrush, {
          kind: "brush",
          style: pattern ? mono ? 3 : 6 : 0,
          // Flat stand-in for fills that do not realise the pattern.
          color: "#808080",
          ...pattern ? { pattern } : {}
        });
      }
      return true;
    }
    case EMR_EXTCREATEFONTINDIRECTW: {
      if (recSize >= 332) {
        const ihFont = view.getUint32(dataOff, true);
        const height = view.getInt32(dataOff + 4, true);
        const width = view.getInt32(dataOff + 8, true);
        const escapementTenthDeg = view.getInt32(dataOff + 12, true);
        const orientationTenthDeg = view.getInt32(dataOff + 16, true);
        const weight = view.getInt32(dataOff + 20, true);
        const italic = view.getUint8(dataOff + 24);
        const underline = view.getUint8(dataOff + 25);
        const strikeOut = view.getUint8(dataOff + 26);
        const charSet = view.getUint8(dataOff + 27);
        const quality = view.getUint8(dataOff + 30);
        const pitchAndFamily = view.getUint8(dataOff + 31);
        const family = readUtf16LE(view, dataOff + 32, 32) || "sans-serif";
        rCtx.objectTable.set(ihFont, {
          kind: "font",
          // Sign kept (not Math.abs'd): resolveFontPixelHeight() needs it
          // to distinguish GDI's cell-height vs character-height convention.
          height,
          weight,
          italic: italic !== 0,
          underline: underline !== 0,
          strikeOut: strikeOut !== 0,
          family,
          escapementTenthDeg,
          details: { width, orientationTenthDeg, charSet, quality, pitchAndFamily }
        });
      }
      return true;
    }
    case EMR_SELECTOBJECT: {
      if (recSize >= 12) {
        const ihObject = view.getUint32(dataOff, true);
        const obj = ihObject >= STOCK_OBJECT_BASE ? getStockObject(ihObject - STOCK_OBJECT_BASE) : rCtx.objectTable.get(ihObject) ?? null;
        if (obj) {
          switch (obj.kind) {
            case "pen":
              state.penStyle = obj.style;
              state.penWidth = obj.widthX;
              state.penColor = obj.colorRef !== void 0 ? resolveColorRef(state, obj.colorRef) : obj.color;
              setColorRefSlot(state, "pen", obj.colorRef);
              state.penFlags = obj.flags ?? obj.style;
              state.penUserStyle = obj.userStyle;
              state.penExtended = obj.extended === true;
              break;
            case "brush":
              state.brushStyle = obj.style;
              state.brushColor = obj.colorRef !== void 0 ? resolveColorRef(state, obj.colorRef) : obj.color;
              setColorRefSlot(state, "brush", obj.colorRef);
              state.brushPattern = obj.pattern ?? null;
              break;
            case "font":
              state.fontHeight = obj.height;
              state.fontWeight = obj.weight;
              state.fontItalic = obj.italic;
              state.fontUnderline = obj.underline;
              state.fontStrikeOut = obj.strikeOut;
              state.fontFamily = obj.family;
              state.fontEscapementTenthDeg = obj.escapementTenthDeg ?? 0;
              state.fontDetails = obj.details;
              break;
          }
        }
      }
      return true;
    }
    case EMR_DELETEOBJECT: {
      if (recSize >= 12) {
        rCtx.objectTable.delete(view.getUint32(dataOff, true));
      }
      return true;
    }
    default:
      return false;
  }
}

// src/emf-gdi-transform-handlers.ts
function handleCoordinateRecord(rCtx, recType, dataOff, recSize) {
  const { view } = rCtx;
  switch (recType) {
    case EMR_SETWINDOWEXTEX: {
      if (recSize >= 16) {
        rCtx.windowExt.cx = view.getInt32(dataOff, true);
        rCtx.windowExt.cy = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETWINDOWORGEX: {
      if (recSize >= 16) {
        rCtx.windowOrg.x = view.getInt32(dataOff, true);
        rCtx.windowOrg.y = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETVIEWPORTEXTEX: {
      if (recSize >= 16) {
        rCtx.viewportExt.cx = view.getInt32(dataOff, true);
        rCtx.viewportExt.cy = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETVIEWPORTORGEX: {
      if (recSize >= 16) {
        rCtx.viewportOrg.x = view.getInt32(dataOff, true);
        rCtx.viewportOrg.y = view.getInt32(dataOff + 4, true);
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SETMAPMODE: {
      if (recSize >= 12) {
        const mode = view.getUint32(dataOff, true);
        if (mode === 8 || mode === 7) {
          activateGdiMappingMode(rCtx);
        }
      }
      return true;
    }
    case EMR_SCALEVIEWPORTEXTEX: {
      if (recSize >= 24) {
        const xNum = view.getInt32(dataOff, true);
        const xDenom = view.getInt32(dataOff + 4, true);
        const yNum = view.getInt32(dataOff + 8, true);
        const yDenom = view.getInt32(dataOff + 12, true);
        if (xDenom !== 0) {
          rCtx.viewportExt.cx = Math.round(rCtx.viewportExt.cx * xNum / xDenom);
        }
        if (yDenom !== 0) {
          rCtx.viewportExt.cy = Math.round(rCtx.viewportExt.cy * yNum / yDenom);
        }
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    case EMR_SCALEWINDOWEXTEX: {
      if (recSize >= 24) {
        const xNum = view.getInt32(dataOff, true);
        const xDenom = view.getInt32(dataOff + 4, true);
        const yNum = view.getInt32(dataOff + 8, true);
        const yDenom = view.getInt32(dataOff + 12, true);
        if (xDenom !== 0) {
          rCtx.windowExt.cx = Math.round(rCtx.windowExt.cx * xNum / xDenom);
        }
        if (yDenom !== 0) {
          rCtx.windowExt.cy = Math.round(rCtx.windowExt.cy * yNum / yDenom);
        }
        activateGdiMappingMode(rCtx);
      }
      return true;
    }
    default:
      return false;
  }
}
function handleWorldTransformRecord(rCtx, recType, dataOff, recSize) {
  const { view, state } = rCtx;
  switch (recType) {
    case EMR_SETWORLDTRANSFORM: {
      if (recSize >= 32) {
        state.worldTransform = [
          view.getFloat32(dataOff, true),
          view.getFloat32(dataOff + 4, true),
          view.getFloat32(dataOff + 8, true),
          view.getFloat32(dataOff + 12, true),
          view.getFloat32(dataOff + 16, true),
          view.getFloat32(dataOff + 20, true)
        ];
      }
      return true;
    }
    case EMR_MODIFYWORLDTRANSFORM: {
      if (recSize >= 36) {
        const mode = view.getUint32(dataOff + 24, true);
        if (mode === 1) {
          state.worldTransform = [1, 0, 0, 1, 0, 0];
        } else if (mode === 2 || mode === 3) {
          const xf = [
            view.getFloat32(dataOff, true),
            view.getFloat32(dataOff + 4, true),
            view.getFloat32(dataOff + 8, true),
            view.getFloat32(dataOff + 12, true),
            view.getFloat32(dataOff + 16, true),
            view.getFloat32(dataOff + 20, true)
          ];
          const [a1, b1, c1, d1, e1, f1] = state.worldTransform;
          if (mode === 2) {
            state.worldTransform = [
              xf[0] * a1 + xf[1] * c1,
              xf[0] * b1 + xf[1] * d1,
              xf[2] * a1 + xf[3] * c1,
              xf[2] * b1 + xf[3] * d1,
              xf[4] * a1 + xf[5] * c1 + e1,
              xf[4] * b1 + xf[5] * d1 + f1
            ];
          } else {
            state.worldTransform = [
              a1 * xf[0] + b1 * xf[2],
              a1 * xf[1] + b1 * xf[3],
              c1 * xf[0] + d1 * xf[2],
              c1 * xf[1] + d1 * xf[3],
              e1 * xf[0] + f1 * xf[2] + xf[4],
              e1 * xf[1] + f1 * xf[3] + xf[5]
            ];
          }
        }
      }
      return true;
    }
    default:
      return false;
  }
}
function handleEmfTransformRecord(rCtx, recType, dataOff, recSize) {
  return handleCoordinateRecord(rCtx, recType, dataOff, recSize) || handleWorldTransformRecord(rCtx, recType, dataOff, recSize);
}

// src/emf-types.ts
function defaultState() {
  return {
    penColor: "#000000",
    penWidth: 1,
    penStyle: 0,
    brushColor: "#ffffff",
    brushStyle: 0,
    brushPattern: null,
    brushOrgX: 0,
    brushOrgY: 0,
    stretchBltMode: 1,
    textColor: "#000000",
    bkColor: "#ffffff",
    bkMode: 2,
    // Negative (character-height convention) so the no-font-selected default
    // resolves to exactly 12px, matching this library's historical fallback.
    fontHeight: -12,
    fontWeight: 400,
    fontItalic: false,
    fontFamily: "sans-serif",
    fontUnderline: false,
    fontStrikeOut: false,
    fontEscapementTenthDeg: 0,
    rop2: 13,
    curX: 0,
    curY: 0,
    polyFillMode: 1,
    textAlign: 0,
    worldTransform: [1, 0, 0, 1, 0, 0]
  };
}
function cloneState(s) {
  return {
    ...s,
    worldTransform: [...s.worldTransform]
  };
}
function createEmfPlusState() {
  return {
    objectTable: /* @__PURE__ */ new Map(),
    worldTransform: [1, 0, 0, 1, 0, 0],
    saveStack: [],
    saveIdMap: /* @__PURE__ */ new Map(),
    clipRegion: null,
    clipSaveDepth: 0
  };
}

// src/emf-gdi-state-handlers.ts
function handleEmfGdiStateRecord(rCtx, recType, _offset, dataOff, recSize) {
  if (handleEmfTransformRecord(rCtx, recType, dataOff, recSize)) {
    return true;
  }
  if (handleEmfObjectRecord(rCtx, recType, dataOff, recSize)) {
    return true;
  }
  if (handleEmfPaletteRecord(rCtx, recType, dataOff, recSize) || handleEmfGdiMiscRecord(rCtx, recType, dataOff, recSize)) {
    return true;
  }
  const { ctx, view, state } = rCtx;
  switch (recType) {
    // ---- save / restore ----
    case EMR_SAVEDC: {
      while (rCtx.clipSaveDepth > 0) {
        ctx.restore();
        rCtx.clipSaveDepth--;
      }
      rCtx.clipStack ?? (rCtx.clipStack = []);
      rCtx.clipStack.push({ region: rCtx.clipRegion ?? null });
      rCtx.stateStack.push(cloneState(state));
      ctx.save();
      if (rCtx.clipRegion) {
        reapplyClipRegion(rCtx, rCtx.clipRegion);
      }
      return true;
    }
    case EMR_RESTOREDC: {
      if (recSize >= 12) {
        while (rCtx.clipSaveDepth > 0) {
          ctx.restore();
          rCtx.clipSaveDepth--;
        }
        let rel = view.getInt32(dataOff, true);
        if (rel < 0) {
          rel = rCtx.stateStack.length + rel + 1;
        }
        while (rCtx.stateStack.length > rel && rCtx.stateStack.length > 0) {
          rCtx.stateStack.pop();
          rCtx.clipStack?.pop();
          ctx.restore();
        }
        const restored = rCtx.stateStack.pop();
        if (restored) {
          const clipSnapshot = rCtx.clipStack?.pop();
          Object.assign(state, restored);
          ctx.restore();
          rCtx.clipRegion = clipSnapshot?.region ?? null;
          if (rCtx.clipRegion) {
            reapplyClipRegion(rCtx, rCtx.clipRegion);
          }
        }
      }
      return true;
    }
    // ---- drawing mode / color settings ----
    case EMR_SETTEXTCOLOR: {
      if (recSize >= 12) {
        const raw = readRawColorRef(view, dataOff);
        state.textColor = resolveColorRef(state, raw);
        setColorRefSlot(state, "text", raw);
      }
      return true;
    }
    case EMR_SETBKCOLOR: {
      if (recSize >= 12) {
        const raw = readRawColorRef(view, dataOff);
        state.bkColor = resolveColorRef(state, raw);
        setColorRefSlot(state, "bk", raw);
      }
      return true;
    }
    case EMR_SETBKMODE: {
      if (recSize >= 12) {
        state.bkMode = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETPOLYFILLMODE: {
      if (recSize >= 12) {
        state.polyFillMode = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETROP2: {
      if (recSize >= 12) {
        state.rop2 = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETSTRETCHBLTMODE: {
      if (recSize >= 12) {
        state.stretchBltMode = view.getUint32(dataOff, true);
      }
      return true;
    }
    case EMR_SETBRUSHORGEX: {
      if (recSize >= 16) {
        state.brushOrgX = view.getInt32(dataOff, true);
        state.brushOrgY = view.getInt32(dataOff + 4, true);
      }
      return true;
    }
    case EMR_SETMITERLIMIT: {
      if (recSize >= 12) {
        const limit = view.getFloat32(dataOff, true);
        state.miterLimit = Number.isFinite(limit) && limit >= 1 ? limit : Math.max(1, view.getUint32(dataOff, true));
      }
      return true;
    }
    case EMR_SETARCDIRECTION: {
      if (recSize >= 12) {
        state.arcDirection = view.getUint32(dataOff, true) === 2 ? 2 : 1;
      }
      return true;
    }
    case EMR_SETTEXTALIGN: {
      if (recSize >= 12) {
        state.textAlign = view.getUint32(dataOff, true);
      }
      return true;
    }
    default:
      return false;
  }
}

// src/emf-plus-image-effects.ts
var EFFECT_GUIDS = {
  "633C80A4-1843-482B-9EF2-BE2834C5FDD4": "blur",
  "D3A1DBE1-8EC4-4C17-9F4C-EA97AD1C343D": "brightnessContrast",
  "537E597D-251E-48DA-9664-29CA496B70F8": "colorBalance",
  "DD6A0022-58E4-4A67-9D9B-D48EB881A53D": "colorCurve",
  "A7CE72A9-0F7F-40D7-B3CC-D0C02D5C3212": "colorLookupTable",
  "718F2615-7933-40E3-A511-5F68FE14DD74": "colorMatrix",
  "8B2DD6C3-EB07-4D87-A5F0-7108E26A9C5F": "hueSaturationLightness",
  "99C354EC-2A31-4F3A-8C34-17A803B33A25": "levels",
  "74D29D05-69A4-4266-9549-3CC52836B632": "redEyeCorrection",
  "63CBF3EE-C526-402C-8F71-62C540BF5142": "sharpen",
  "1077AF00-2848-4441-9489-44AD4C2D7A2C": "tint"
};
var DRAWIMAGE_EFFECT_FLAG = 8192;
var CurveAdjustment = {
  Exposure: 0,
  Density: 1,
  Contrast: 2,
  Highlight: 3,
  Shadow: 4,
  Midtone: 5,
  WhiteSaturation: 6,
  BlackSaturation: 7
};
var CurveChannel = { All: 0, Red: 1, Green: 2, Blue: 3 };
var hex4 = (v, digits) => v.toString(16).toUpperCase().padStart(digits, "0");
function readGuid(view, off) {
  const tail = [];
  for (let i = 0; i < 8; i++) {
    tail.push(hex4(view.getUint8(off + 8 + i), 2));
  }
  return [
    hex4(view.getUint32(off, true), 8),
    hex4(view.getUint16(off + 4, true), 4),
    hex4(view.getUint16(off + 6, true), 4),
    tail.slice(0, 2).join(""),
    tail.slice(2).join("")
  ].join("-");
}
var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
var COLOR_CURVE_PARAMS_SIZE = 12;
function parseSerializableObject(view, dataOff, dataSize) {
  if (dataSize < 20) {
    return null;
  }
  const kind = EFFECT_GUIDS[readGuid(view, dataOff)];
  const size = view.getUint32(dataOff + 16, true);
  if (!kind || 20 + size > dataSize) {
    return null;
  }
  const p = dataOff + 20;
  const i32 = (k, lo, hi) => clamp(view.getInt32(p + 4 * k, true), lo, hi);
  const f323 = (k, lo, hi) => {
    const v = view.getFloat32(p + 4 * k, true);
    return Number.isFinite(v) ? clamp(v, lo, hi) : 0;
  };
  const need = (n) => size >= n;
  switch (kind) {
    case "blur":
      return need(8) ? { kind, radius: f323(0, 0, 255), expandEdge: view.getUint32(p + 4, true) !== 0 } : null;
    case "brightnessContrast":
      return need(8) ? { kind, brightness: i32(0, -255, 255), contrast: i32(1, -100, 100) } : null;
    case "colorBalance":
      return need(12) ? { kind, cyanRed: i32(0, -100, 100), magentaGreen: i32(1, -100, 100), yellowBlue: i32(2, -100, 100) } : null;
    case "colorCurve":
      return need(COLOR_CURVE_PARAMS_SIZE) ? {
        kind,
        adjustment: view.getInt32(p, true),
        channel: view.getInt32(p + 4, true),
        intensity: i32(2, -255, 255)
      } : null;
    case "colorLookupTable": {
      if (!need(1024)) {
        return null;
      }
      const lut = (k) => new Uint8Array(view.buffer.slice(view.byteOffset + p + 256 * k, view.byteOffset + p + 256 * (k + 1)));
      return { kind, b: lut(0), g: lut(1), r: lut(2), a: lut(3) };
    }
    case "colorMatrix": {
      if (!need(100)) {
        return null;
      }
      const matrix = [];
      for (let k = 0; k < 25; k++) {
        const v = view.getFloat32(p + 4 * k, true);
        matrix.push(Number.isFinite(v) ? v : 0);
      }
      return { kind, matrix };
    }
    case "hueSaturationLightness":
      return need(12) ? { kind, hue: i32(0, -180, 180), saturation: i32(1, -100, 100), lightness: i32(2, -100, 100) } : null;
    case "levels":
      return need(12) ? { kind, highlight: i32(0, 0, 100), midtone: i32(1, -100, 100), shadow: i32(2, 0, 100) } : null;
    case "redEyeCorrection": {
      if (!need(4)) {
        return null;
      }
      const count = view.getInt32(p, true);
      if (count < 0 || 4 + 16 * count > size) {
        return null;
      }
      const areas = [];
      for (let k = 0; k < count; k++) {
        const o = p + 4 + 16 * k;
        areas.push({
          left: view.getInt32(o, true),
          top: view.getInt32(o + 4, true),
          right: view.getInt32(o + 8, true),
          bottom: view.getInt32(o + 12, true)
        });
      }
      return { kind, areas };
    }
    case "sharpen":
      return need(8) ? { kind, radius: f323(0, 0, 255), amount: f323(1, 0, 100) } : null;
    case "tint":
      return need(8) ? { kind, hue: i32(0, -180, 180), amount: i32(1, -100, 100) } : null;
  }
}
var roundHalfDown = (v) => Math.ceil(v - 0.5);
function buildLut(f, round = Math.round) {
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    lut[v] = clamp(round(f(v)), 0, 255);
  }
  return lut;
}
function midtoneGamma(t) {
  return t >= 0 ? 1 / (1 + t / 50) : 1 - t / 50;
}
function brightnessContrastLut(brightness, contrast) {
  const gain = contrast >= 100 ? 1e6 : contrast >= 0 ? 100 / (100 - contrast) : (100 + contrast) / 100;
  const half = brightness / 2;
  return buildLut((v) => (v + half - 127.5) * gain + 127.5 + half);
}
function balanceLut(t) {
  return buildLut((v) => v * (1 + t / 100));
}
function splineLut(ys) {
  const n = ys.length;
  const h = 255 / (n - 1);
  const m = new Float64Array(n);
  const c = new Float64Array(n);
  const d = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) {
    const rhs = 6 * (ys[i + 1] - 2 * ys[i] + ys[i - 1]) / (h * h);
    const den = 4 - c[i - 1];
    c[i] = 1 / den;
    d[i] = (rhs - d[i - 1]) / den;
  }
  for (let i = n - 2; i >= 1; i--) {
    m[i] = d[i] - c[i] * m[i + 1];
  }
  return buildLut((v) => {
    const i = Math.min(n - 2, Math.floor(v / h));
    const b = (v - i * h) / h;
    const a = 1 - b;
    return a * ys[i] + b * ys[i + 1] + ((a * a * a - a) * m[i] + (b * b * b - b) * m[i + 1]) * h * h / 6;
  });
}
var CURVE_POINTS = 23;
var CURVE_X = Array.from({ length: CURVE_POINTS }, (_, k) => k * 255 / (CURVE_POINTS - 1));
var CURVE_TABLES = {
  "contrast+": [0, 3.8, 8, 12.2, 17.4, 23.5, 31.1, 40.2, 53, 70.2, 94.5, 127.5, 160.5, 184.8, 202, 214.8, 223.9, 231.5, 237.6, 242.8, 247, 251.2, 255],
  "contrast-": [0, 33.1, 57.2, 74.7, 87.2, 96.6, 103.9, 109.8, 115.3, 119.6, 123.7, 127.5, 131.3, 135.4, 139.7, 145.2, 151.1, 158.4, 167.8, 180.3, 197.8, 221.9, 255],
  "highlight+": [0, 11.6, 23.2, 34.8, 46.4, 58, 69.6, 81.1, 92.7, 104.3, 116, 127.6, 142.3, 160.6, 186.4, 208, 220.6, 229.4, 236.2, 242, 246.6, 251, 255],
  "highlight-": [0, 11.6, 23.2, 34.8, 46.4, 58, 69.5, 81.1, 92.7, 104.4, 115.9, 127.5, 136.7, 144.9, 151.4, 157.1, 161.8, 167.2, 174.3, 185.3, 200.9, 223.7, 255],
  "shadow+": [0, 31.3, 54, 70, 82.5, 92.3, 99.5, 104.8, 109.5, 115, 121.3, 127.7, 139.2, 150.6, 162.3, 173.8, 185.5, 197, 208.6, 220.2, 231.8, 243.4, 255],
  "shadow-": [0, 4, 8.4, 13, 18.7, 25.7, 34.4, 45, 58.4, 80, 105.8, 127.5, 139.2, 150.7, 162.3, 173.9, 185.4, 197, 208.6, 220.2, 231.8, 243.4, 255]
};
function curveAdjustmentLut(adjustment, intensity) {
  const t = intensity;
  let ys;
  switch (adjustment) {
    case CurveAdjustment.Exposure:
      ys = CURVE_X.map((x) => roundHalfDown(x) + t);
      break;
    case CurveAdjustment.Density:
      ys = CURVE_X.map((x) => x + t);
      break;
    case CurveAdjustment.Contrast:
    case CurveAdjustment.Highlight:
    case CurveAdjustment.Shadow: {
      const c = clamp(t, -100, 100);
      const name = ["contrast", "highlight", "shadow"][adjustment - CurveAdjustment.Contrast] + (c >= 0 ? "+" : "-");
      const table = CURVE_TABLES[name];
      ys = CURVE_X.map((x, k) => x + Math.abs(c) / 50 * (table[k] - x));
      break;
    }
    case CurveAdjustment.Midtone: {
      const g = midtoneGamma(clamp(t, -100, 100));
      ys = CURVE_X.map((x) => 255 * (x / 255) ** g);
      break;
    }
    case CurveAdjustment.WhiteSaturation: {
      const w = Math.max(1, clamp(t, 0, 255));
      ys = CURVE_X.map((x) => x * 255 / w);
      break;
    }
    case CurveAdjustment.BlackSaturation: {
      const b = Math.min(254, clamp(t, 0, 255));
      ys = CURVE_X.map((x) => (x - b) * 255 / (255 - b));
      break;
    }
    default:
      return null;
  }
  return splineLut(ys.map((y) => clamp(y, 0, 255)));
}
function levelsLut(highlight, midtone, shadow) {
  const black = shadow / 100 * 255;
  const white = Math.max(black + 1, highlight / 100 * 255);
  const gamma = midtoneGamma(midtone);
  return buildLut((v) => 255 * clamp((v - black) / (white - black), 0, 1) ** gamma, roundHalfDown);
}
function applyLuts(src, r, g, b, a = null) {
  const out = new Uint8ClampedArray(src);
  for (let i = 0; i < out.length; i += 4) {
    if (r) out[i] = r[src[i]];
    if (g) out[i + 1] = g[src[i + 1]];
    if (b) out[i + 2] = b[src[i + 2]];
    if (a) out[i + 3] = a[src[i + 3]];
  }
  return out;
}
function applyColorMatrix(src, m) {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i] / 255;
    const g = src[i + 1] / 255;
    const b = src[i + 2] / 255;
    const a = src[i + 3] / 255;
    for (let j = 0; j < 4; j++) {
      const v = r * m[j] + g * m[5 + j] + b * m[10 + j] + a * m[15 + j] + m[20 + j];
      out[i + j] = Math.round(clamp(v, 0, 1) * 255);
    }
  }
  return out;
}
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360 + 360) % 360 / 60;
  const x = c * (1 - Math.abs(hp % 2 - 1));
  const m = l - c / 2;
  const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m];
}
var HUE_SEXTANT = 43;
var HUE_CIRCLE = 6 * HUE_SEXTANT;
function gdipHue(r, g, b) {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const f = (x) => Math.floor(x * HUE_SEXTANT / d);
  if (max === r && g >= b) {
    return f(g - b);
  }
  if (max === g) {
    return b >= r ? 87 + f(b - r) : 86 - f(r - b);
  }
  if (max === b && b !== r) {
    return r >= g ? 172 + f(r - g) : 171 - f(g - r);
  }
  const t = f(b - g);
  return (256 - t - (t >= 40 ? 1 : 0)) % 256;
}
function applyHueSaturationLightness(src, hue, saturation, lightness2) {
  const out = new Uint8ClampedArray(src);
  const shift = Math.round(hue * HUE_CIRCLE / 360);
  const sMul = 1 + saturation / 100;
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = clamp(Math.round(((max + min >> 1) * 100 + 255 * lightness2) / 100), 0, 255);
    if (max === min) {
      out[i] = out[i + 1] = out[i + 2] = l;
      continue;
    }
    const sum = max + min;
    const s = clamp((max - min) / (sum <= 255 ? sum : 510 - sum) * sMul, 0, 1);
    const hi = l <= 127 ? l * (1 + s) : l + s * (255 - l);
    const m1 = l <= 127 ? 2 * l - Math.trunc(hi) : Math.round(2 * l - hi);
    const m2 = 2 * l - m1;
    const q = ((gdipHue(r, g, b) + shift) % HUE_CIRCLE + HUE_CIRCLE) % HUE_CIRCLE;
    const sextant = Math.min(5, Math.floor(q / HUE_SEXTANT));
    const f = (q - sextant * HUE_SEXTANT) / HUE_SEXTANT;
    const up = Math.trunc(m1 + (m2 - m1) * f);
    const down = Math.trunc(m1 + (m2 - m1) * (1 - f));
    const [nr, ng, nb] = [
      [m2, up, m1],
      [down, m2, m1],
      [m1, m2, up],
      [m1, down, m2],
      [up, m1, m2],
      [m2, m1, down]
    ][sextant];
    out[i] = nr;
    out[i + 1] = ng;
    out[i + 2] = nb;
  }
  return out;
}
var LUMA_709 = [0.2126, 0.7152, 0.0722];
var TINT_CHROMA_SCALE = 0.985;
function applyTint(src, hue, amount) {
  const tint = hslToRgb(hue, 1, 0.5);
  const ty = tint[0] * LUMA_709[0] + tint[1] * LUMA_709[1] + tint[2] * LUMA_709[2];
  const chroma = tint.map((c) => (c - ty) * TINT_CHROMA_SCALE);
  const a = amount / 100;
  const out = new Uint8ClampedArray(src);
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const y = r * LUMA_709[0] + g * LUMA_709[1] + b * LUMA_709[2];
    const v = Math.max(r, g, b);
    out[i] = Math.round((1 - a) * r + a * (y + v * chroma[0]));
    out[i + 1] = Math.round((1 - a) * g + a * (y + v * chroma[1]));
    out[i + 2] = Math.round((1 - a) * b + a * (y + v * chroma[2]));
  }
  return out;
}
function applyRedEyeCorrection(src, width, height, areas) {
  const out = new Uint8ClampedArray(src);
  for (const a of areas) {
    const x0 = clamp(a.left, 0, width);
    const x1 = clamp(a.right, 0, width);
    const y0 = clamp(a.top, 0, height);
    const y1 = clamp(a.bottom, 0, height);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * width + x) * 4;
        const r = out[i];
        const g = out[i + 1];
        const b = out[i + 2];
        if (r >= 2 * g && r >= 2 * b && r > 64) {
          out[i] = Math.round((g + b) / 2);
        }
      }
    }
  }
  return out;
}
function blurKernel(radius) {
  const taps = Math.ceil(radius);
  const k = new Float64Array(2 * taps + 1);
  if (taps === 0) {
    k[0] = 1;
    return k;
  }
  const sigma = radius / 1.98;
  let sum = 0;
  for (let i = -taps; i <= taps; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + taps] = w;
    sum += w;
  }
  for (let i = 0; i < k.length; i++) {
    k[i] /= sum;
  }
  return k;
}
function mirror(p, n) {
  if (n === 1) {
    return 0;
  }
  while (p < 0 || p >= n) {
    p = p < 0 ? -p : 2 * (n - 1) - p;
  }
  return p;
}
function gdipBlur(src, w, h, radius, vRow = 0, vZeroAbove = false) {
  const k = blurKernel(radius);
  const taps = (k.length - 1) / 2;
  const out = new Float64Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      let s3 = 0;
      for (let j = -taps; j <= taps; j++) {
        const p = row + mirror(x + j, w) * 4;
        const kw = k[j + taps];
        s0 += kw * src[p];
        s1 += kw * src[p + 1];
        s2 += kw * src[p + 2];
        s3 += kw * src[p + 3];
      }
      const o = row + x * 4;
      out[o] = s0;
      out[o + 1] = s1;
      out[o + 2] = s2;
      out[o + 3] = s3;
    }
  }
  if (taps > 0 && vRow >= 0 && vRow < h) {
    const col = new Float64Array(w * 4);
    for (let j = -taps; j <= taps; j++) {
      const yy = vRow + j;
      if (vZeroAbove && yy < vRow) {
        continue;
      }
      const base = mirror(yy, h) * w * 4;
      for (let i = 0; i < w * 4; i++) {
        col[i] += k[j + taps] * out[base + i];
      }
    }
    out.set(col, vRow * w * 4);
  }
  return out;
}
function applyBlur(src, w, h, radius) {
  return Uint8ClampedArray.from(gdipBlur(src, w, h, radius), Math.round);
}
var SHARPEN_FALLOFF = Math.log2(96 / 25);
function sharpenGain(radius, amount) {
  const x = amount / 100;
  if (radius <= 3) {
    return x * 2 * radius / 3;
  }
  return x * 2 * (3 / radius) ** SHARPEN_FALLOFF;
}
function applySharpen(src, w, h, radius, amount) {
  const blurred = gdipBlur(src, w, h, radius);
  const gain = sharpenGain(radius, amount);
  const out = new Uint8ClampedArray(src);
  for (let i = 0; i < src.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      out[i + c] = Math.round(src[i + c] + gain * (src[i + c] - Math.round(blurred[i + c])));
    }
    out[i + 3] = Math.max(src[i + 3], out[i], out[i + 1], out[i + 2]);
  }
  return out;
}
function applyImageEffect(rgba, width, height, effect) {
  if (width <= 0 || height <= 0 || rgba.length !== width * height * 4) {
    return null;
  }
  switch (effect.kind) {
    case "blur":
      return applyBlur(rgba, width, height, effect.radius);
    case "sharpen":
      return applySharpen(rgba, width, height, effect.radius, effect.amount);
    case "brightnessContrast": {
      const lut = brightnessContrastLut(effect.brightness, effect.contrast);
      return applyLuts(rgba, lut, lut, lut);
    }
    case "colorBalance":
      return applyLuts(
        rgba,
        balanceLut(effect.cyanRed),
        balanceLut(effect.magentaGreen),
        balanceLut(effect.yellowBlue)
      );
    case "colorCurve": {
      const lut = curveAdjustmentLut(effect.adjustment, effect.intensity);
      const ch = effect.channel;
      if (!lut || ch < CurveChannel.All || ch > CurveChannel.Blue) {
        return null;
      }
      const pick = (c) => ch === CurveChannel.All || ch === c ? lut : null;
      return applyLuts(rgba, pick(CurveChannel.Red), pick(CurveChannel.Green), pick(CurveChannel.Blue));
    }
    case "colorLookupTable":
      return applyLuts(rgba, effect.r, effect.g, effect.b, effect.a);
    case "colorMatrix":
      return applyColorMatrix(rgba, effect.matrix);
    case "hueSaturationLightness":
      return applyHueSaturationLightness(rgba, effect.hue, effect.saturation, effect.lightness);
    case "levels": {
      const lut = levelsLut(effect.highlight, effect.midtone, effect.shadow);
      return applyLuts(rgba, lut, lut, lut);
    }
    case "redEyeCorrection":
      return applyRedEyeCorrection(rgba, width, height, effect.areas);
    case "tint":
      return applyTint(rgba, effect.hue, effect.amount);
  }
}
function copyBlock(src, width, sx, sy, w, h, dst, bw, dx, dy) {
  for (let y = 0; y < h; y++) {
    const from = ((sy + y) * width + sx) * 4;
    dst.set(src.subarray(from, from + w * 4), ((dy + y) * bw + dx) * 4);
  }
}
function expandedBlur(rgba, width, height, radius, x0, y0, x1, y1) {
  const r = Math.ceil(radius);
  const bw = x1 - x0 + 2 * r;
  const bh = y1 - y0 + 2 * r;
  const buf = new Uint8ClampedArray(bw * bh * 4);
  const inside = x0 - r >= 0 && y0 - r >= 0 && x1 + r <= width && y1 + r <= height;
  if (inside) {
    copyBlock(rgba, width, x0, y0, x1 - x0, y1 - y0, buf, bw, r, r);
  } else {
    const gx0 = Math.max(0, x0 - r);
    const gy0 = Math.max(0, y0 - r);
    const gx1 = Math.min(width, x1 + r);
    const gy1 = Math.min(height, y1 + r);
    copyBlock(rgba, width, gx0, gy0, gx1 - gx0, gy1 - gy0, buf, bw, gx0 - (x0 - r), gy0 - (y0 - r));
  }
  const blurred = gdipBlur(buf, bw, bh, radius, inside ? r : 0, inside);
  const w = x1 - x0;
  const out = new Uint8ClampedArray(w * (y1 - y0) * 4);
  for (let y = 0; y < y1 - y0; y++) {
    const from = ((y + r) * bw + r) * 4;
    for (let i = 0; i < w * 4; i++) {
      out[y * w * 4 + i] = Math.round(blurred[from + i]);
    }
  }
  return out;
}
function applyImageEffectToRect(rgba, width, height, effect, src) {
  if (width <= 0 || height <= 0 || rgba.length !== width * height * 4) {
    return null;
  }
  let x0 = 0;
  let y0 = 0;
  let x1 = width;
  let y1 = height;
  if (src) {
    x0 = clamp(Math.floor(src.x), 0, width);
    y0 = clamp(Math.floor(src.y), 0, height);
    x1 = clamp(Math.ceil(src.x + src.w) + 1, 0, width);
    y1 = clamp(Math.ceil(src.y + src.h) + 1, 0, height);
    if (x1 <= x0 || y1 <= y0 || src.x + src.w <= x0 || src.y + src.h <= y0) {
      return null;
    }
  }
  const w = x1 - x0;
  const h = y1 - y0;
  const shownWidth = src ? Math.min(w, Math.ceil(src.x + src.w) - x0) : w;
  const shownHeight = src ? Math.min(h, Math.ceil(src.y + src.h) - y0) : h;
  const result = (out2) => {
    if (shownWidth === w && shownHeight === h) {
      return { rgba: out2, x: x0, y: y0, width: w, height: h };
    }
    const shown = new Uint8ClampedArray(shownWidth * shownHeight * 4);
    copyBlock(out2, w, 0, 0, shownWidth, shownHeight, shown, shownWidth, 0, 0);
    return { rgba: shown, x: x0, y: y0, width: shownWidth, height: shownHeight };
  };
  if (src && effect.kind === "blur" && effect.expandEdge) {
    return result(expandedBlur(rgba, width, height, effect.radius, x0, y0, x1, y1));
  }
  let region = rgba;
  if (w !== width || h !== height) {
    region = new Uint8ClampedArray(w * h * 4);
    copyBlock(rgba, width, x0, y0, w, h, region, w, 0, 0);
  }
  const local = effect.kind === "redEyeCorrection" ? {
    kind: effect.kind,
    areas: effect.areas.map((a) => ({
      left: a.left - x0,
      top: a.top - y0,
      right: a.right - x0,
      bottom: a.bottom - y0
    }))
  } : effect;
  const out = applyImageEffect(region, w, h, local);
  return out ? result(out) : null;
}

// src/emf-plus-draw-image.ts
function surfaceSize4(ctx) {
  const canvas = ctx.canvas;
  const w = canvas?.width;
  const h = canvas?.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}
function pixelsCanvas(rgba, w, h) {
  const temp = createTempCanvas(w, h);
  if (!temp) {
    return null;
  }
  canvasPutImageData(temp.ctx, createImageDataCompat(rgba, w, h), 0, 0);
  return temp;
}
function paintBitmapRaster(ctx, bitmap, draw) {
  const size = surfaceSize4(ctx);
  if (draw.resample && size) {
    const block = resampleImage(bitmap.rgba, bitmap.width, bitmap.height, draw.resample, size);
    if (block) {
      const out = pixelsCanvas(block.rgba, block.w, block.h);
      if (!out) {
        return false;
      }
      ctx.save();
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.imageSmoothingEnabled = false;
        canvasDrawImage(ctx, out.canvas, block.x, block.y, block.w, block.h);
      } finally {
        ctx.restore();
      }
      return true;
    }
  }
  const src = pixelsCanvas(bitmap.rgba, bitmap.width, bitmap.height);
  if (!src) {
    return false;
  }
  ctx.save();
  try {
    ctx.setTransform(...draw.transform);
    canvasDrawImage(ctx, src.canvas, draw.dx, draw.dy, draw.dw, draw.dh);
  } finally {
    ctx.restore();
  }
  return true;
}
function svgImagePayload(img, bitmap) {
  if (!img.data) {
    return null;
  }
  const bytes = new Uint8Array(img.data.slice(0));
  const mime = sniffImageMime(bytes);
  if (mime) {
    return { kind: "encoded", bytes, mime };
  }
  if (bitmap) {
    return { kind: "rgba", data: bitmap.rgba, width: bitmap.width, height: bitmap.height };
  }
  return decodeBmpFile(bytes.buffer);
}
function paintBitmapSvg(svg, img, bitmap, draw, pixelsOnly = false) {
  const payload = pixelsOnly && bitmap ? { kind: "rgba", data: bitmap.rgba, width: bitmap.width, height: bitmap.height } : svgImagePayload(img, bitmap);
  if (!payload) {
    return false;
  }
  const slot = svg.reserveSlot();
  const block = svg.imageResampling === "exact" && bitmap && draw.resample ? resampleImage(bitmap.rgba, bitmap.width, bitmap.height, draw.resample, {
    w: svg.canvas.width,
    h: svg.canvas.height
  }) : null;
  const natural = draw.resample ? payloadSize(payload) : null;
  if (block) {
    const pixels = { kind: "rgba", data: block.rgba, width: block.w, height: block.h };
    svg.fillSlot(slot, pixels, [1, 0, 0, 1, 0, 0], block.x, block.y, block.w, block.h);
  } else if (draw.resample && natural) {
    const r = draw.resample;
    svg.fillSlotCropped(slot, payload, r.toDevice, natural, r.srcX, r.srcY, r.srcW, r.srcH);
  } else {
    svg.fillSlot(slot, payload, draw.transform, draw.dx, draw.dy, draw.dw, draw.dh);
  }
  if (svg.shadow && bitmap) {
    paintBitmapRaster(svg.shadow, bitmap, draw);
  }
  return true;
}
var UNIT_PIXEL = 2;
var nestedReplayer = null;
function registerNestedMetafileReplayer(fn) {
  nestedReplayer = fn;
}
function drawNestedMetafile(rCtx, img, cached, source) {
  const depth = rCtx.nestingDepth ?? 0;
  if (!nestedReplayer || !source || !img.data || source.unit !== UNIT_PIXEL || depth >= MAX_NESTED_METAFILE_DEPTH) {
    return false;
  }
  const { srcX, srcY, srcW, srcH } = source;
  if (!(srcW > 0 && srcH > 0) || ![srcX, srcY, srcW, srcH].every(Number.isFinite)) {
    return false;
  }
  const size = surfaceSize4(rCtx.ctx);
  if (!size) {
    return false;
  }
  const toCanvas = mulMatrix(
    [1, 0, 0, 1, -0.5, -0.5],
    mulMatrix(mulMatrix(plusWorldMatrix(rCtx), source.toWorld(srcX, srcY, srcW, srcH)), [1, 0, 0, 1, 0.5, 0.5])
  );
  const bytes = img.data.slice(0);
  const caches = cached && cached.kind === "metafile" ? cached.caches : void 0;
  const { ctx } = rCtx;
  ctx.save();
  let deferred = null;
  try {
    ctx.setTransform(toCanvas[0], toCanvas[1], toCanvas[2], toCanvas[3], toCanvas[4], toCanvas[5]);
    ctx.beginPath();
    ctx.rect(srcX, srcY, srcW, srcH);
    ctx.clip();
    deferred = nestedReplayer(bytes, ctx, size.w, size.h, toCanvas, {
      textureCache: caches?.textures,
      imageCache: caches?.images,
      fontFamilyMap: rCtx.fontFamilyMap,
      gdiAntialias: rCtx.gdiAntialias,
      nestingDepth: depth + 1
    });
  } finally {
    ctx.restore();
  }
  if (!deferred) {
    return false;
  }
  rCtx.deferredImages.push(...deferred);
  return true;
}
function effectedDraw(img, bitmap, effect, draw, source) {
  let src = bitmap;
  if (!src && img.data) {
    const bmp = decodeBmpFile(img.data.slice(0));
    if (bmp && bmp.kind === "rgba") {
      src = { rgba: bmp.data, width: bmp.width, height: bmp.height };
    }
  }
  if (!src) {
    return null;
  }
  const rect = source && source.unit === UNIT_PIXEL && source.srcW > 0 && source.srcH > 0 && [source.srcX, source.srcY, source.srcW, source.srcH].every(Number.isFinite) ? source : null;
  const region = applyImageEffectToRect(
    src.rgba,
    src.width,
    src.height,
    effect,
    rect && { x: rect.srcX, y: rect.srcY, w: rect.srcW, h: rect.srcH }
  );
  if (!region) {
    return null;
  }
  const out = { kind: "bitmap", width: region.width, height: region.height, rgba: region.rgba };
  if (!rect) {
    return { bitmap: out, draw };
  }
  const srcX = rect.srcX - region.x;
  const srcY = rect.srcY - region.y;
  const srcW = rect.srcW;
  const srcH = rect.srcH;
  const shift = [1, 0, 0, 1, region.x, region.y];
  const toWorld = mulMatrix(rect.toWorld(rect.srcX, rect.srcY, rect.srcW, rect.srcH), shift);
  return {
    bitmap: out,
    draw: {
      ...draw,
      // The Canvas fallback scales the whole effected bitmap.
      transform: mulMatrix(draw.transform, toWorld),
      dx: 0,
      dy: 0,
      dw: region.width,
      dh: region.height,
      resample: draw.resample && {
        ...draw.resample,
        srcX,
        srcY,
        srcW,
        srcH,
        toDevice: mulMatrix(draw.resample.toDevice, shift)
      }
    }
  };
}
function drawEmfPlusImageNow(rCtx, img, draw, source, effect = null) {
  const cached = img.cacheKey !== void 0 ? rCtx.imageCache?.get(img.cacheKey) : void 0;
  if (img.type === 2) {
    return drawNestedMetafile(rCtx, img, cached, source);
  }
  const bitmap = cached && cached.kind === "bitmap" ? cached : null;
  const effected = effect ? effectedDraw(img, bitmap, effect, draw, source) : null;
  if (effected) {
    return isSvgContext(rCtx.ctx) ? paintBitmapSvg(rCtx.ctx, img, effected.bitmap, effected.draw, true) : paintBitmapRaster(rCtx.ctx, effected.bitmap, effected.draw);
  }
  if (isSvgContext(rCtx.ctx)) {
    return paintBitmapSvg(rCtx.ctx, img, bitmap, draw);
  }
  return bitmap ? paintBitmapRaster(rCtx.ctx, bitmap, draw) : false;
}

// src/emf-plus-read-helpers.ts
function readRectFromView(view, offset, compressed) {
  if (compressed) {
    return {
      x: view.getInt16(offset, true),
      y: view.getInt16(offset + 2, true),
      w: view.getInt16(offset + 4, true),
      h: view.getInt16(offset + 6, true)
    };
  }
  return {
    x: view.getFloat32(offset, true),
    y: view.getFloat32(offset + 4, true),
    w: view.getFloat32(offset + 8, true),
    h: view.getFloat32(offset + 12, true)
  };
}
function readPointFromView(view, offset, compressed) {
  if (compressed) {
    return {
      x: view.getInt16(offset, true),
      y: view.getInt16(offset + 2, true)
    };
  }
  return {
    x: view.getFloat32(offset, true),
    y: view.getFloat32(offset + 4, true)
  };
}
var PLUS_FLAG_COMPRESSED = 16384;
var PLUS_FLAG_RELATIVE = 2048;
function readPointRCoord(view, offset, end) {
  if (offset >= end) {
    return null;
  }
  const b0 = view.getUint8(offset);
  if (b0 & 128) {
    const v2 = b0 & 127;
    return { value: v2 & 64 ? v2 - 128 : v2, size: 1 };
  }
  if (offset + 2 > end) {
    return null;
  }
  const v = b0 << 8 | view.getUint8(offset + 1);
  return { value: v & 16384 ? v - 32768 : v, size: 2 };
}
function readPlusPoints(view, offset, end, count, flags) {
  if (!(count >= 0) || count > 1e6) {
    return null;
  }
  const pts = [];
  if (flags & PLUS_FLAG_RELATIVE) {
    let o = offset;
    let x = 0;
    let y = 0;
    for (let i = 0; i < count; i++) {
      const dx = readPointRCoord(view, o, end);
      if (!dx) {
        return null;
      }
      o += dx.size;
      const dy = readPointRCoord(view, o, end);
      if (!dy) {
        return null;
      }
      o += dy.size;
      x += dx.value;
      y += dy.value;
      pts.push({ x, y });
    }
    return pts;
  }
  const compressed = (flags & PLUS_FLAG_COMPRESSED) !== 0;
  const size = compressed ? 4 : 8;
  if (offset + count * size > end) {
    return null;
  }
  for (let i = 0; i < count; i++) {
    pts.push(readPointFromView(view, offset + i * size, compressed));
  }
  return pts;
}

// src/emf-plus-region-mask.ts
var MAX_DEPTH = 64;
function nearestFix2(v) {
  return Math.floor(v * 16 + 0.5 - 1e-4);
}
function leafMask(build, m, evenOdd, box, half) {
  let figures;
  try {
    figures = recordDeviceFigures(build, m).map((f) => f.pts.map(nearestFix2));
  } catch {
    return null;
  }
  const coverage = rasterizePlusFill(
    figures.filter((f) => f.length >= 6),
    evenOdd,
    false,
    half,
    box
  );
  const out = new Uint8Array(box.w * box.h);
  for (let i = 0; i < out.length; i++) {
    out[i] = coverage[i] ? 1 : 0;
  }
  return out;
}
function regionPixelMask(node, m, box, half, depth = 0) {
  if (depth > MAX_DEPTH) {
    return null;
  }
  switch (node.type) {
    case "infinite":
      return new Uint8Array(box.w * box.h).fill(1);
    case "empty":
      return new Uint8Array(box.w * box.h);
    case "rect": {
      const { x, y, width, height } = node;
      return leafMask((c) => c.rect(x, y, width, height), m, false, box, half);
    }
    case "path": {
      const path = node.path;
      return leafMask((c) => replayEmfPlusPath(c, path), m, path.fillRule === "evenodd", box, half);
    }
    case "combine": {
      const a = regionPixelMask(node.left, m, box, half, depth + 1);
      const b = a ? regionPixelMask(node.right, m, box, half, depth + 1) : null;
      if (!a || !b) {
        return null;
      }
      const op = node.combineMode;
      for (let i = 0; i < a.length; i++) {
        const l = a[i];
        const r = b[i];
        a[i] = op === 2 ? l | r : op === 3 ? l ^ r : op === 4 ? l & (r ^ 1) : op === 5 ? r & (l ^ 1) : l & r;
      }
      return a;
    }
  }
}
function maskBounds(mask, box) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      if (mask[y * box.w + x]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  }
  return x1 < 0 ? null : { x: box.x + x0, y: box.y + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// src/emf-plus-spline.ts
function cardinalSplineBeziers(pts, tension, closed, offset = 0, segments) {
  const n = pts.length;
  if (n < (closed ? 3 : 2)) {
    return [];
  }
  const k = (Number.isFinite(tension) ? tension : 0) / 3;
  const tangent = (i) => {
    let a;
    let b;
    if (closed) {
      a = pts[(i - 1 + n) % n];
      b = pts[(i + 1) % n];
    } else {
      a = pts[Math.max(0, i - 1)];
      b = pts[Math.min(n - 1, i + 1)];
    }
    return { x: k * (b.x - a.x), y: k * (b.y - a.y) };
  };
  const total = closed ? n : n - 1;
  const first = closed ? 0 : Math.max(0, Math.floor(offset));
  const count = closed ? total : Math.min(total - first, segments === void 0 ? total : Math.floor(segments));
  if (!(count > 0)) {
    return [];
  }
  const out = [{ x: pts[first].x, y: pts[first].y }];
  for (let s = first; s < first + count; s++) {
    const p = pts[s];
    const q = pts[(s + 1) % n];
    const tp = tangent(s);
    const tq = tangent((s + 1) % n);
    out.push({ x: p.x + tp.x, y: p.y + tp.y }, { x: q.x - tq.x, y: q.y - tq.y }, { x: q.x, y: q.y });
  }
  return out;
}

// src/emf-plus-stroke.ts
var NOMINAL_PEN_MAX = 1.5;
var DASH_PATTERNS = {
  1: [3, 1],
  2: [1, 1],
  3: [3, 1, 1, 1],
  4: [3, 1, 1, 1, 1, 1]
};
function canvasLineCap(cap) {
  switch (cap) {
    case 1:
    // Square
    case 17:
      return "square";
    case 2:
    // Round
    case 18:
    // RoundAnchor
    case 3:
    // Triangle
    case 19:
      return "round";
    default:
      return "butt";
  }
}
function canvasLineJoin(join) {
  if (join === 1) {
    return "bevel";
  }
  return join === 2 ? "round" : "miter";
}
function penDashArray(pen) {
  const w = pen.width || 1;
  const pattern = pen.dashStyle === 5 ? pen.dashPattern : DASH_PATTERNS[pen.dashStyle];
  if (!pattern || pattern.length === 0 || pattern.some((v) => !(v >= 0))) {
    return [];
  }
  return pattern.map((v) => v * w);
}
function applyPlusPenStyle(ctx, pen, widthScale = 1) {
  ctx.lineWidth = (pen.width || 1) * widthScale;
  const dashes = penDashArray(pen);
  ctx.lineCap = canvasLineCap(dashes.length > 0 ? pen.dashCap ?? 0 : pen.startCap ?? pen.endCap);
  ctx.lineJoin = canvasLineJoin(pen.lineJoin);
  ctx.miterLimit = pen.miterLimit && pen.miterLimit >= 1 ? pen.miterLimit : 10;
  if (typeof ctx.setLineDash === "function") {
    ctx.setLineDash(dashes);
  }
  ctx.lineDashOffset = dashes.length > 0 ? (pen.dashOffset ?? 0) * (pen.width || 1) : 0;
}
function strokePlusGeometry(rCtx, pen, buildPath, points, closedFigure = false) {
  const { ctx } = rCtx;
  const resolved = resolvePenTransform(pen);
  pen = resolved.pen;
  const nib = resolved.nib;
  const inset = !!pen && pen.alignment === 1 && closedFigure;
  const widthScale = inset ? 2 : 1;
  const stroke = (c) => {
    if (inset || nib) {
      c.save();
    }
    if (inset) {
      c.beginPath();
      buildPath(c);
      c.clip();
    }
    c.beginPath();
    buildPath(c);
    if (nib) {
      c.transform(nib[0], nib[1], nib[2], nib[3], 0, 0);
    }
    c.stroke();
    if (inset || nib) {
      c.restore();
    }
  };
  if (pen) {
    const nibDashed = !!nib && penDashArray(pen).length > 0;
    applyPlusPenStyle(ctx, pen, widthScale);
    const mode = plusRasterMode(rCtx);
    let sampler = pen.brush && !isSvgContext(ctx) ? brushSampler(rCtx, pen.brush) : null;
    if (!sampler && mode !== "canvas") {
      const argb = cssColorToArgb(pen.color);
      sampler = argb === null ? null : solidSampler(argb);
    }
    if (sampler) {
      const size = surfaceSize5(ctx);
      const device = plusWorldMatrix(rCtx);
      const scale = maxStretch(nib ? mulMatrix(device, nib) : device);
      if (mode !== "canvas" && size && strokeGdiplus(rCtx, pen, nib, sampler, buildPath, device, size, mode, closedFigure)) {
        return;
      }
      const outline = hasCustomCap(pen) || nibDashed ? penOutlineWorld(rCtx, pen, nib, buildPath, closedFigure) : null;
      let box = null;
      if (size && outline) {
        box = deviceBounds(outline.flat(), device, size, 2);
      } else if (size) {
        const miter = Math.max(1, ctx.miterLimit || 10);
        const margin = pen.width * scale * miter / 2 + 2;
        box = deviceBounds(points, device, size, margin);
      }
      if (size && !box) {
        return;
      }
      const drawMask = outline ? (c) => {
        traceOutline(c, outline);
        c.fill("nonzero");
      } : (c) => {
        applyPlusPenStyle(c, pen, widthScale);
        stroke(c);
        c.beginPath();
        buildPath(c);
        if (nib) {
          c.transform(nib[0], nib[1], nib[2], nib[3], 0, 0);
        }
      };
      const hitTest = outline ? (c, x, y) => c.isPointInPath(x, y, "nonzero") : (c, x, y) => c.isPointInStroke(x, y) && (!inset || c.isPointInPath(x, y));
      if (box && paintBrushThroughMask(rCtx, sampler, box, drawMask, mode, hitTest)) {
        return;
      }
    }
    const paint = pen.brush ? brushPaint2(rCtx, pen.brush) : pen.color;
    if ((hasCustomCap(pen) || nibDashed || nib && typeof paint !== "string") && fillPenOutline(rCtx, pen, nib, paint, buildPath, closedFigure)) {
      return;
    }
    ctx.strokeStyle = paint;
  }
  applyPlusWorldTransform(rCtx);
  stroke(ctx);
}
function resolvePenTransform(pen) {
  if (!pen?.transform) {
    return { pen, nib: null };
  }
  const [a, b, c, d] = pen.transform;
  const sx = Math.hypot(a, b);
  const sy = Math.hypot(c, d);
  const dot = a * c + b * d;
  const det = a * d - b * c;
  const plain = { ...pen, transform: null };
  if (pen.width === 0 || isIdentity2(pen.transform) || !Number.isFinite(sx + sy + dot + det) || Math.abs(det) < 1e-12) {
    return { pen: { ...plain, width: pen.width === 0 ? 1 : pen.width }, nib: null };
  }
  if (Math.abs(sx - sy) <= 1e-6 * sx && Math.abs(dot) <= 1e-6 * sx * sy) {
    const pattern = pen.dashStyle === 5 ? pen.dashPattern : DASH_PATTERNS[pen.dashStyle];
    const dashed = pattern && pattern.length > 0 ? { dashStyle: 5, dashPattern: pattern.map((v) => v / sx), dashOffset: (pen.dashOffset ?? 0) / sx } : {};
    return { pen: { ...plain, ...dashed, width: pen.width * sx }, nib: null };
  }
  return { pen: plain, nib: [a, b, c, d, 0, 0] };
}
function maxStretch(m) {
  const s = m[0] * m[0] + m[1] * m[1] + m[2] * m[2] + m[3] * m[3];
  const det = m[0] * m[3] - m[1] * m[2];
  return Math.sqrt((s + Math.sqrt(Math.max(0, s * s - 4 * det * det))) / 2);
}
function penFrame(device, nib) {
  if (!nib) {
    return { record: device, unit: Math.hypot(device[0], device[1]), toDevice: IDENTITY5 };
  }
  const full = mulMatrix(device, nib);
  const unit = maxStretch(full);
  const inv2 = invertAffine(nib);
  if (!inv2 || !(unit > 0) || !Number.isFinite(unit)) {
    return null;
  }
  return {
    record: [inv2[0] * unit, inv2[1] * unit, inv2[2] * unit, inv2[3] * unit, 0, 0],
    unit,
    toDevice: mulMatrix(full, [1 / unit, 0, 0, 1 / unit, 0, 0])
  };
}
function framePen(pen, unit, nib = null) {
  const dash = penDashArray(pen).map((v) => v * unit);
  return {
    half: (pen.width || 1) * unit / 2,
    join: pen.lineJoin ?? 0,
    miterLimit: pen.miterLimit && pen.miterLimit >= 1 ? pen.miterLimit : 10,
    startCap: pen.startCap ?? 0,
    endCap: pen.endCap ?? 0,
    dashCap: pen.dashCap ?? 0,
    dash: dash.length > 0 ? dash : null,
    dashOffset: (pen.dashOffset ?? 0) * (pen.width || 1) * unit,
    dashMetric: nib ? [nib[0], nib[1], nib[2], nib[3]] : void 0,
    compound: pen.compound ?? null,
    inset: pen.alignment === 1
  };
}
function strokeGdiplus(rCtx, pen, nib, sampler, buildPath, device, size, mode, closedFigure) {
  if (!nib) {
    const sx = Math.hypot(device[0], device[1]);
    const sy = Math.hypot(device[2], device[3]);
    const dot = device[0] * device[2] + device[1] * device[3];
    if (!(sx > 0) || Math.abs(sx - sy) > 1e-6 * sx || Math.abs(dot) > 1e-6 * sx * sy) {
      return false;
    }
  }
  const frame2 = penFrame(device, nib);
  if (!frame2) {
    return false;
  }
  let figures;
  try {
    figures = recordDeviceFigures(buildPath, frame2.record);
  } catch {
    return false;
  }
  if (closedFigure) {
    figures = figures.map((f) => ({ ...f, closed: true }));
  }
  const width = (pen.width || 1) * frame2.unit;
  const devicePen = framePen(pen, frame2.unit, nib);
  const antialias = mode === "gdiplus-aa";
  const toFix = (poly) => {
    const m = frame2.toDevice;
    return poly.flatMap((p) => [toPlusFix(m[0] * p.x + m[2] * p.y + m[4]), toPlusFix(m[1] * p.x + m[3] * p.y + m[5])]);
  };
  let fix;
  if (hasCustomCap(pen)) {
    fix = customCapOutline(figures, width, devicePen, pen).map(toFix);
  } else if (width <= NOMINAL_PEN_MAX && !devicePen.dash && !(((pen.startCap ?? 0) | (pen.endCap ?? 0) | (pen.dashCap ?? 0)) & 240)) {
    return strokeNominal(rCtx, pen, sampler, buildPath, device, size, antialias, closedFigure);
  } else {
    fix = widenFigures(figures, devicePen).map(toFix);
  }
  const box = figuresBox(fix, size);
  if (!box) {
    return true;
  }
  if (box.w * box.h > 16e6) {
    return false;
  }
  const coverage = rasterizePlusFill(fix, false, antialias, isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0), box);
  return compositeBrushCoverage(rCtx, sampler, box, coverage, 1, true);
}
function strokeNominal(rCtx, pen, sampler, buildPath, device, size, antialias, closedFigure) {
  let figures;
  try {
    figures = recordNominalFigures(buildPath, device);
  } catch {
    return false;
  }
  if (closedFigure) {
    figures = figures.map((f) => ({ ...f, closed: true }));
  }
  const box = figuresBox(
    figures.map((f) => f.pts),
    size
  );
  if (!box) {
    return true;
  }
  if (box.w * box.h > 16e6) {
    return false;
  }
  const argb = cssColorToArgb(pen.color);
  const plainBrush = !pen.brush || !pen.brush.gradient && !pen.brush.texture && !pen.brush.hatch;
  const opaqueSolid = plainBrush && argb !== null && argb >>> 24 === 255 && rCtx.ext?.compositingMode !== 1;
  const coverage = nominalLineCoverage(
    figures,
    { antialias, half: isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0), opaqueSolid, clip: { x: 0, y: 0, w: size.w, h: size.h } },
    box
  );
  return compositeBrushCoverage(rCtx, sampler, box, coverage, 1, true);
}
function hasCustomCap(pen) {
  return !!(pen.customStartCap || pen.customEndCap);
}
function customCapOutline(figures, width, devicePen, pen) {
  const geo = customCapGeometry(figures, width, pen.customStartCap ?? null, pen.customEndCap ?? null);
  const outline = [];
  geo.figures.forEach((fig, i) => {
    const capped = geo.capped[i];
    const figPen = {
      ...devicePen,
      half: Math.max(width, 1) / 2,
      startCap: capped.start ? 0 : devicePen.startCap,
      endCap: capped.end ? 0 : devicePen.endCap
    };
    for (const poly of widenFigures([fig], figPen)) {
      outline.push(poly.slice().reverse());
    }
  });
  outline.push(...geo.polygons);
  return outline;
}
function penOutlineWorld(rCtx, pen, nib, buildPath, closedFigure) {
  const device = plusWorldMatrix(rCtx);
  const frame2 = penFrame(device, nib);
  const deviceInv = invertAffine(device);
  if (!frame2 || !deviceInv || !(frame2.unit > 0)) {
    return null;
  }
  let figures;
  try {
    figures = recordDeviceFigures(buildPath, frame2.record);
  } catch {
    return null;
  }
  if (closedFigure) {
    figures = figures.map((f) => ({ ...f, closed: true }));
  }
  const width = (pen.width || 1) * frame2.unit;
  const devicePen = framePen(pen, frame2.unit, nib);
  const outline = hasCustomCap(pen) ? customCapOutline(figures, width, devicePen, pen) : widenFigures(figures, devicePen);
  const m = mulMatrix(deviceInv, frame2.toDevice);
  return outline.map((poly) => poly.map((p) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] })));
}
function traceOutline(c, outline) {
  c.beginPath();
  for (const poly of outline) {
    poly.forEach((p, i) => {
      if (i === 0) {
        c.moveTo(p.x, p.y);
      } else {
        c.lineTo(p.x, p.y);
      }
    });
    c.closePath();
  }
}
function fillPenOutline(rCtx, pen, nib, paint, buildPath, closedFigure) {
  const outline = penOutlineWorld(rCtx, pen, nib, buildPath, closedFigure);
  if (!outline) {
    return false;
  }
  const { ctx } = rCtx;
  ctx.save();
  try {
    ctx.fillStyle = paint;
    applyPlusWorldTransform(rCtx);
    traceOutline(ctx, outline);
    ctx.fill("nonzero");
  } finally {
    ctx.restore();
  }
  return true;
}
var IDENTITY5 = [1, 0, 0, 1, 0, 0];
function isIdentity2(m) {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
}
function surfaceSize5(ctx) {
  const canvas = ctx.canvas;
  const w = canvas?.width;
  const h = canvas?.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}

// src/emf-plus-text-image-handlers.ts
function imageAttributesWrap(rCtx, attributesId) {
  const obj = attributesId <= 255 ? rCtx.objectTable.get(attributesId) : void 0;
  if (!obj || obj.kind !== "plus-imageattributes" || !obj.wrapMode) {
    return {};
  }
  return { wrap: obj.wrapMode, clampArgb: obj.clampArgb };
}
var UNIT_PIXEL2 = 2;
function deviceQuad(wt, s, pts) {
  const out = [];
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i];
    const y = pts[i + 1];
    out.push((wt[0] * x + wt[2] * y + wt[4]) * s, (wt[1] * x + wt[3] * y + wt[5]) * s);
  }
  return out;
}
function imageResampleSpec(rCtx, dataOff, isMetafile, toWorld) {
  const { view } = rCtx;
  const kernel = resampleKernelFor(rCtx.interpolationMode ?? 0);
  if (isMetafile || view.getUint32(dataOff + 4, true) !== UNIT_PIXEL2) {
    return void 0;
  }
  const srcX = view.getFloat32(dataOff + 8, true);
  const srcY = view.getFloat32(dataOff + 12, true);
  const srcW = view.getFloat32(dataOff + 16, true);
  const srcH = view.getFloat32(dataOff + 20, true);
  if (!(srcW > 0 && srcH > 0) || !Number.isFinite(srcX + srcY + srcW + srcH)) {
    return void 0;
  }
  return {
    srcX,
    srcY,
    srcW,
    srcH,
    toDevice: mulMatrix(plusWorldMatrix(rCtx), toWorld(srcX, srcY, srcW, srcH)),
    kernel,
    halfPixelOffset: isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0),
    ...imageAttributesWrap(rCtx, view.getUint32(dataOff, true))
  };
}
function drawOrDeferImage(rCtx, imgObj, dataOff, dx, dy, dw, dh, toWorld, effect = null) {
  if (!imgObj.data) {
    return;
  }
  const isMetafile = imgObj.type === 2;
  const draw = {
    imageData: imgObj.data,
    dx,
    dy,
    dw,
    dh,
    transform: plusWorldMatrix(rCtx),
    isMetafile,
    resample: imageResampleSpec(rCtx, dataOff, isMetafile, toWorld)
  };
  const { view } = rCtx;
  const source = {
    unit: view.getUint32(dataOff + 4, true),
    srcX: view.getFloat32(dataOff + 8, true),
    srcY: view.getFloat32(dataOff + 12, true),
    srcW: view.getFloat32(dataOff + 16, true),
    srcH: view.getFloat32(dataOff + 20, true),
    toWorld
  };
  if (drawEmfPlusImageNow(rCtx, imgObj, draw, source, effect)) {
    return;
  }
  if (isSvgContext(rCtx.ctx)) {
    const m = toWorld(source.srcX, source.srcY, source.srcW, source.srcH);
    const corners = [
      source.srcX,
      source.srcY,
      source.srcX + source.srcW,
      source.srcY,
      source.srcX + source.srcW,
      source.srcY + source.srcH,
      source.srcX,
      source.srcY + source.srcH
    ];
    const world = [];
    for (let i = 0; i < corners.length; i += 2) {
      world.push(m[0] * corners[i] + m[2] * corners[i + 1] + m[4], m[1] * corners[i] + m[3] * corners[i + 1] + m[5]);
    }
    draw.svgSlot = rCtx.ctx.reserveSlot(deviceQuad(plusWorldMatrix(rCtx), 1, world));
  }
  rCtx.deferredImages.push(draw);
  emfLog(`DrawImage: queued deferred image (total=${rCtx.deferredImages.length})`);
}
function fillPlusPath(rCtx, flags, brush, pathObj) {
  const { ctx } = rCtx;
  const rule = pathObj.fillRule ?? "nonzero";
  const exact = tryFillPlusShapeExact(rCtx, flags, brush, (c) => replayEmfPlusPath(c, pathObj), pathObj.points, rule);
  if (!exact) {
    ctx.fillStyle = resolveBrushPaint(rCtx, flags, brush);
    applyPlusWorldTransform(rCtx);
    replayEmfPlusPath(ctx, pathObj);
    ctx.fill(rule);
  }
}
function strokePlusPath(rCtx, pen, pathObj) {
  strokePlusGeometry(rCtx, pen, (c) => replayEmfPlusPath(c, pathObj), pathObj.points, isClosedPath(pathObj.types));
}
function textGamma(contrast) {
  const k = contrast === void 0 || !Number.isFinite(contrast) ? 4 : Math.min(12, Math.max(0, contrast));
  return 1 + k / 10;
}
function applyTextContrast(data, gamma) {
  if (gamma === 1) {
    return;
  }
  const e = 1 / gamma;
  for (let i = 0; i < data.length; i++) {
    const a = data[i] / 255;
    data[i] = Math.round((1 - Math.pow(1 - a, e)) * 255);
  }
}
function isClosedPath(types) {
  if (types.length === 0) {
    return false;
  }
  for (let i = 1; i <= types.length; i++) {
    if ((i === types.length || (types[i] & 15) === 0) && !(types[i - 1] & 128)) {
      return false;
    }
  }
  return true;
}
function fillPlusText(rCtx, recFlags, brushVal, text, x, y, emSize) {
  const { ctx } = rCtx;
  const sampler = isSvgContext(ctx) ? null : deviceBrushSampler(rCtx, recFlags, brushVal);
  const size = ctx.canvas;
  if (sampler && size && typeof size.width === "number" && typeof size.height === "number") {
    const width = typeof ctx.measureText === "function" ? ctx.measureText(text).width : text.length * emSize;
    const em = Math.abs(emSize) || 1;
    const pts = [
      { x: x - width - em, y: y - 2 * em },
      { x: x + width + em, y: y - 2 * em },
      { x: x - width - em, y: y + 2 * em },
      { x: x + width + em, y: y + 2 * em }
    ];
    const box = deviceBounds(pts, plusWorldMatrix(rCtx), { w: size.width, h: size.height });
    if (!box) {
      return;
    }
    const { font, textAlign, textBaseline } = ctx;
    if (paintBrushThroughMask(
      rCtx,
      sampler,
      box,
      (c) => {
        c.font = font;
        c.textAlign = textAlign;
        c.textBaseline = textBaseline;
        c.fillText(text, x, y);
      },
      "canvas",
      void 0,
      false
    )) {
      return;
    }
  }
  ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
  applyPlusWorldTransform(rCtx, false);
  ctx.fillText(text, x, y);
}
var HINT_QUALITY = [NONANTIALIASED_QUALITY, NONANTIALIASED_QUALITY, NONANTIALIASED_QUALITY, ANTIALIASED_QUALITY, ANTIALIASED_QUALITY, CLEARTYPE_NATURAL_QUALITY];
var PLUS_LEADING_EM = 1 / 6;
var PLUS_DEFAULT_TRACKING = 1.03;
function rgbaToHex(c) {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c.trim());
  if (m) {
    if (m[4] !== void 0 && Number(m[4]) < 1) {
      return null;
    }
    return "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
  }
  return /^#[0-9a-f]{6}$/i.test(c) ? c : null;
}
function drawPlusStringWithEngine(rCtx, font, text, layoutX, layoutY, paint, alignment, format, brushSampler2 = null) {
  const fonts = rCtx.fonts;
  const color = typeof paint === "string" ? rgbaToHex(paint) : null;
  const hintNow = rCtx.textRenderingHint ?? 0;
  const graySmooth = hintNow === 3 || hintNow === 4 || hintNow === 5;
  const solidViaCoverage = !!color && graySmooth && !isSvgContext(rCtx.ctx);
  const sampler = isSvgContext(rCtx.ctx) ? null : solidViaCoverage ? solidSampler(cssColorToArgb(paint) ?? 4278190080) : color ? null : brushSampler2;
  const unit = font.unit ?? 0;
  if (!fonts || !color && !sampler || alignment !== 0 || unit !== 0 && unit !== 2) {
    return false;
  }
  const m = plusWorldMatrix(rCtx);
  if (m[1] !== 0 || m[2] !== 0 || m[0] <= 0 || m[3] <= 0) {
    return false;
  }
  const emPx = font.emSize * m[3];
  const hint = rCtx.textRenderingHint ?? 0;
  const quality = HINT_QUALITY[hint] ?? NONANTIALIASED_QUALITY;
  const spec = {
    face: font.family,
    height: -Math.round(emPx),
    width: 0,
    weight: font.flags & 1 ? 700 : 400,
    italic: (font.flags & 2) !== 0,
    charSet: 1,
    pitchAndFamily: 0,
    quality,
    unhinted: hint === 2 || hint === 4,
    // AntiAlias ignores the font's gasp table (measured: Arial 16 px is
    // grayscale there, but single-bit under AntiAliasGridFit, as in GDI).
    ignoreGasp: hint === 4
  };
  const realized = fonts.realize(spec, rCtx.fontFamilyMap);
  if (!realized) {
    return false;
  }
  const ttf = realized.ttf;
  const unhinted = spec.unhinted === true;
  const exactAscent = emPx * ttf.winAscent / ttf.unitsPerEm;
  const ascent = unhinted ? exactAscent : Math.ceil(exactAscent);
  const x = m[0] * layoutX + m[4] + emPx * (format?.leadingMargin ?? PLUS_LEADING_EM);
  const y = m[3] * layoutY + m[5] + ascent;
  const codes = [];
  for (let i = 0; i < text.length; i++) {
    codes.push(text.charCodeAt(i));
  }
  const tracking = format?.tracking ?? PLUS_DEFAULT_TRACKING;
  const dx = unhinted ? codes.map((c) => realized.advance(realized.glyphIndex(c)) * tracking) : null;
  if ((!color || solidViaCoverage) && sampler) {
    const cov = gdiTextCoverage(realized, {
      codes,
      glyphIndices: false,
      x,
      y,
      dx,
      dy: null,
      textAlign: 24,
      options: 0,
      matrix: null});
    if (!cov) {
      return true;
    }
    const gamma = textGamma(rCtx.ext?.textContrast);
    if (cov.channels === 1) {
      applyTextContrast(cov.data, gamma);
    }
    return compositeBrushCoverage(
      rCtx,
      sampler,
      { x: cov.x, y: cov.y, w: cov.width, h: cov.height },
      cov.data,
      cov.channels,
      false,
      cov.channels === 3 ? gamma : 1
    );
  }
  paintGdiTextRun(rCtx.ctx, realized, {
    codes,
    glyphIndices: false,
    x,
    y,
    dx,
    dy: null,
    textAlign: 24,
    textColor: color,
    bkColor: "#ffffff",
    bkMode: 1,
    options: 0,
    rect: null,
    matrix: null,
    underline: (font.flags & 4) !== 0,
    strikeOut: (font.flags & 8) !== 0
  }, rCtx.fontFamilyMap);
  return true;
}
function handleEmfPlusTextImageRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { ctx, view, objectTable } = rCtx;
  switch (recType) {
    // ---- path-based drawing ----
    case EMFPLUS_FILLPATH: {
      if (recDataSize >= 4) {
        const pathObj = objectTable.get(recFlags & 255);
        if (pathObj && pathObj.kind === "plus-path") {
          fillPlusPath(rCtx, recFlags, view.getUint32(dataOff, true), pathObj);
        }
      }
      return true;
    }
    case EMFPLUS_DRAWPATH: {
      if (recDataSize >= 4) {
        const pathObj = objectTable.get(recFlags & 255);
        const pen = objectTable.get(view.getUint32(dataOff, true) & 255);
        if (pathObj && pathObj.kind === "plus-path") {
          strokePlusPath(rCtx, pen && pen.kind === "plus-pen" ? pen : null, pathObj);
        }
      }
      return true;
    }
    // ---- text ----
    case EMFPLUS_DRAWSTRING: {
      if (recDataSize >= 28) {
        const brushVal = view.getUint32(dataOff, true);
        const formatId = view.getUint32(dataOff + 4, true);
        const strLen = view.getUint32(dataOff + 8, true);
        const layoutX = view.getFloat32(dataOff + 12, true);
        const layoutY = view.getFloat32(dataOff + 16, true);
        view.getFloat32(dataOff + 20, true);
        view.getFloat32(dataOff + 24, true);
        const fontId = recFlags & 255;
        const font = objectTable.get(fontId);
        if (strLen > 0 && dataOff + 28 + strLen * 2 <= dataOff + recDataSize) {
          const text = readUtf16LE(view, dataOff + 28, strLen);
          if (text.length > 0 && font && font.kind === "plus-font") {
            const sf = objectTable.get(formatId);
            const paint = resolveBrushPaint(rCtx, recFlags, brushVal);
            const alignment = sf && sf.kind === "plus-stringformat" ? sf.alignment : 0;
            const format = sf && sf.kind === "plus-stringformat" ? sf : void 0;
            if (drawPlusStringWithEngine(
              rCtx,
              font,
              text,
              layoutX,
              layoutY,
              paint,
              alignment,
              format,
              rCtx.fonts ? deviceBrushSampler(rCtx, recFlags, brushVal) : null
            )) {
              return true;
            }
            const bold = font.flags & 1 ? "bold " : "";
            const italic = font.flags & 2 ? "italic " : "";
            const family = mapFontFamily(font.family, rCtx.fontFamilyMap);
            ctx.font = `${italic}${bold}${font.emSize}px ${family}`;
            ctx.textBaseline = "top";
            if (sf && sf.kind === "plus-stringformat") {
              switch (sf.alignment) {
                case 1:
                  ctx.textAlign = "center";
                  break;
                case 2:
                  ctx.textAlign = "right";
                  break;
                default:
                  ctx.textAlign = "left";
              }
            } else {
              ctx.textAlign = "left";
            }
            fillPlusText(rCtx, recFlags, brushVal, text, layoutX, layoutY, font.emSize);
          }
        }
      }
      return true;
    }
    case EMFPLUS_DRAWDRIVERSTRING: {
      if (recDataSize >= 16) {
        const brushVal = view.getUint32(dataOff, true);
        const glyphCount = view.getUint32(dataOff + 12, true);
        const fontId = recFlags & 255;
        const font = objectTable.get(fontId);
        const glyphsOff = dataOff + 16;
        const posOff = glyphsOff + glyphCount * 2;
        const alignedPosOff = posOff + 3 & -4;
        if (glyphCount > 0 && glyphCount < 1e5 && alignedPosOff + glyphCount * 8 <= dataOff + recDataSize && font && font.kind === "plus-font") {
          const text = readUtf16LE(view, glyphsOff, glyphCount);
          if (text.length > 0) {
            const bold = font.flags & 1 ? "bold " : "";
            const italic = font.flags & 2 ? "italic " : "";
            const family = mapFontFamily(font.family, rCtx.fontFamilyMap);
            ctx.font = `${italic}${bold}${font.emSize}px ${family}`;
            ctx.textBaseline = "alphabetic";
            ctx.textAlign = "left";
            const gx = view.getFloat32(alignedPosOff, true);
            const gy = view.getFloat32(alignedPosOff + 4, true);
            fillPlusText(rCtx, recFlags, brushVal, text, gx, gy, font.emSize);
          }
        }
      }
      return true;
    }
    // ---- images ----
    case EMFPLUS_DRAWIMAGE: {
      if (recDataSize >= 24) {
        const imgId = recFlags & 255;
        const imgObj = objectTable.get(imgId);
        const compressed = (recFlags & 16384) !== 0;
        const rectOff = dataOff + 24;
        let dx, dy, dw, dh;
        if (compressed && rectOff + 8 <= dataOff + recDataSize) {
          dx = view.getInt16(rectOff, true);
          dy = view.getInt16(rectOff + 2, true);
          dw = view.getInt16(rectOff + 4, true);
          dh = view.getInt16(rectOff + 6, true);
        } else if (!compressed && rectOff + 16 <= dataOff + recDataSize) {
          dx = view.getFloat32(rectOff, true);
          dy = view.getFloat32(rectOff + 4, true);
          dw = view.getFloat32(rectOff + 8, true);
          dh = view.getFloat32(rectOff + 12, true);
        } else {
          return true;
        }
        rCtx.totalDrawImageCalls++;
        const hasData = imgObj && imgObj.kind === "plus-image" && imgObj.data;
        emfLog(
          `DrawImage: imgId=${imgId}, dest=(${dx},${dy},${dw},${dh}), compressed=${compressed}, hasObj=${Boolean(imgObj)}, objKind=${imgObj?.kind}, hasData=${Boolean(hasData)}, dataLen=${hasData ? imgObj.data.byteLength : 0}, isMetafile=${imgObj?.kind === "plus-image" ? imgObj.type === 2 : "N/A"}`
        );
        emfLog(
          `DrawImage: worldTransform=[${rCtx.worldTransform.map((v) => v.toFixed(3)).join(", ")}]`
        );
        if (imgObj && imgObj.kind === "plus-image" && imgObj.data) {
          drawOrDeferImage(rCtx, imgObj, dataOff, dx, dy, dw, dh, (sx, sy, sw, sh) => [
            dw / sw,
            0,
            0,
            dh / sh,
            dx - sx * dw / sw,
            dy - sy * dh / sh
          ]);
        }
      }
      return true;
    }
    case EMFPLUS_DRAWIMAGEPOINTS: {
      if (recDataSize >= 28) {
        const imgId = recFlags & 255;
        const imgObj = objectTable.get(imgId);
        const count = view.getUint32(dataOff + 24, true);
        const ptOff = dataOff + 28;
        const effect = (recFlags & DRAWIMAGE_EFFECT_FLAG) !== 0 ? rCtx.ext?.pendingEffect ?? null : null;
        if (rCtx.ext) {
          rCtx.ext.pendingEffect = null;
        }
        if (count >= 3 && imgObj && imgObj.kind === "plus-image" && imgObj.data) {
          const pts = readPlusPoints(view, ptOff, dataOff + recDataSize, 3, recFlags);
          if (!pts) {
            return true;
          }
          const [{ x: p1x, y: p1y }, { x: p2x, y: p2y }, { x: p3x, y: p3y }] = pts;
          const dx = p1x;
          const dy = p1y;
          const dw = Math.sqrt((p2x - p1x) ** 2 + (p2y - p1y) ** 2);
          const dh = Math.sqrt((p3x - p1x) ** 2 + (p3y - p1y) ** 2);
          rCtx.totalDrawImageCalls++;
          emfLog(
            `DrawImagePoints: imgId=${imgId}, points=[(${p1x},${p1y}),(${p2x},${p2y}),(${p3x},${p3y})], dest=(${dx.toFixed(1)},${dy.toFixed(1)},${dw.toFixed(1)},${dh.toFixed(1)})`
          );
          emfLog(
            `DrawImagePoints: worldTransform=[${rCtx.worldTransform.map((v) => v.toFixed(3)).join(", ")}]`
          );
          drawOrDeferImage(rCtx, imgObj, dataOff, dx, dy, dw, dh, (sx, sy, sw, sh) => {
            const a = (p2x - p1x) / sw;
            const b = (p2y - p1y) / sw;
            const c = (p3x - p1x) / sh;
            const d = (p3y - p1y) / sh;
            return [a, b, c, d, p1x - a * sx - c * sy, p1y - b * sx - d * sy];
          }, effect);
        } else {
          imgObj && imgObj.kind === "plus-image" && imgObj.data;
        }
      }
      return true;
    }
    default:
      return false;
  }
}

// src/emf-plus-curve-handlers.ts
var FLAG_WINDING = 8192;
function penOf(rCtx, flags) {
  const pen = rCtx.objectTable.get(flags & 255);
  return pen && pen.kind === "plus-pen" ? pen : null;
}
function bezierPath(pts, closed) {
  return (c) => {
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i + 2 < pts.length; i += 3) {
      c.bezierCurveTo(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, pts[i + 2].x, pts[i + 2].y);
    }
    if (closed) {
      c.closePath();
    }
  };
}
function handleEmfPlusCurveRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { view } = rCtx;
  const end = dataOff + recDataSize;
  switch (recType) {
    case EMFPLUS_DRAWBEZIERS: {
      if (recDataSize < 4) {
        return true;
      }
      const count = view.getUint32(dataOff, true);
      const pts = readPlusPoints(view, dataOff + 4, end, count, recFlags);
      if (!pts || pts.length < 4 || (pts.length - 1) % 3 !== 0) {
        return true;
      }
      strokePlusGeometry(rCtx, penOf(rCtx, recFlags), bezierPath(pts, false), pts, false);
      return true;
    }
    case EMFPLUS_DRAWCURVE: {
      if (recDataSize < 16) {
        return true;
      }
      const tension = view.getFloat32(dataOff, true);
      const offset = view.getUint32(dataOff + 4, true);
      const segments = view.getUint32(dataOff + 8, true);
      const count = view.getUint32(dataOff + 12, true);
      const pts = readPlusPoints(view, dataOff + 16, end, count, recFlags & 16384);
      if (!pts) {
        return true;
      }
      const bez = cardinalSplineBeziers(pts, tension, false, offset, segments);
      if (bez.length >= 4) {
        strokePlusGeometry(rCtx, penOf(rCtx, recFlags), bezierPath(bez, false), bez, false);
      }
      return true;
    }
    case EMFPLUS_DRAWCLOSEDCURVE: {
      if (recDataSize < 8) {
        return true;
      }
      const tension = view.getFloat32(dataOff, true);
      const count = view.getUint32(dataOff + 4, true);
      const pts = readPlusPoints(view, dataOff + 8, end, count, recFlags);
      const bez = pts ? cardinalSplineBeziers(pts, tension, true) : [];
      if (bez.length >= 4) {
        strokePlusGeometry(rCtx, penOf(rCtx, recFlags), bezierPath(bez, true), bez, true);
      }
      return true;
    }
    case EMFPLUS_FILLCLOSEDCURVE: {
      if (recDataSize < 12) {
        return true;
      }
      const brush = view.getUint32(dataOff, true);
      const tension = view.getFloat32(dataOff + 4, true);
      const count = view.getUint32(dataOff + 8, true);
      const pts = readPlusPoints(view, dataOff + 12, end, count, recFlags);
      const bez = pts ? cardinalSplineBeziers(pts, tension, true) : [];
      if (bez.length < 4) {
        return true;
      }
      const rule = recFlags & FLAG_WINDING ? "nonzero" : "evenodd";
      const build = bezierPath(bez, true);
      if (!tryFillPlusShapeExact(rCtx, recFlags, brush, build, bez, rule)) {
        const { ctx } = rCtx;
        ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brush);
        applyPlusWorldTransform(rCtx);
        ctx.beginPath();
        build(ctx);
        ctx.fill(rule);
      }
      return true;
    }
    case EMFPLUS_STROKEFILLPATH: {
      strokeFillPath(rCtx, recFlags, dataOff, recDataSize);
      return true;
    }
    case EMFPLUS_FILLREGION: {
      if (recDataSize < 4) {
        return true;
      }
      fillRegion(rCtx, recFlags, view.getUint32(dataOff, true));
      return true;
    }
    default:
      return false;
  }
}
function strokeFillPath(rCtx, flags, dataOff, dataSize) {
  if (dataSize < 12) {
    return;
  }
  const { view, objectTable } = rCtx;
  const path = objectTable.get(flags & 255);
  const penId = view.getUint32(dataOff, true);
  const brushId = view.getUint32(dataOff + 4, true);
  if (rCtx.ext) {
    rCtx.ext.pendingEffect = null;
  }
  if (!path || path.kind !== "plus-path") {
    return;
  }
  const brush = brushId <= 255 ? objectTable.get(brushId) : void 0;
  if (brush && brush.kind === "plus-brush") {
    fillPlusPath(rCtx, 0, brushId, path);
  }
  const pen = penId <= 255 ? objectTable.get(penId) : void 0;
  if (pen && pen.kind === "plus-pen") {
    strokePlusPath(rCtx, pen, path);
  }
}
function surfaceSize6(ctx) {
  const canvas = ctx.canvas;
  const w = canvas?.width;
  const h = canvas?.height;
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : null;
}
function fillRegion(rCtx, flags, brush) {
  const region = rCtx.objectTable.get(flags & 255);
  if (!region || region.kind !== "plus-region" || region.nodes.length === 0) {
    return;
  }
  const node = region.nodes[0];
  const device = plusWorldMatrix(rCtx);
  const { ctx } = rCtx;
  const size = surfaceSize6(ctx);
  if (plusRasterMode(rCtx) !== "canvas" && size) {
    const domain = { x: 0, y: 0, w: size.w, h: size.h };
    const mask = regionPixelMask(node, device, domain, isHalfPixelOffset(rCtx.pixelOffsetMode ?? 0));
    const sampler = mask ? anyBrushSampler(rCtx, flags, brush) : null;
    if (mask && sampler) {
      const box = maskBounds(mask, domain);
      if (!box) {
        return;
      }
      const coverage = new Uint8ClampedArray(box.w * box.h);
      for (let y = 0; y < box.h; y++) {
        for (let x = 0; x < box.w; x++) {
          coverage[y * box.w + x] = mask[(box.y + y) * domain.w + box.x + x] ? 255 : 0;
        }
      }
      if (compositeBrushCoverage(rCtx, sampler, box, coverage, 1, true)) {
        return;
      }
    }
  }
  const flat = flattenRegionNode(node, device, 0, size ? { x: 0, y: 0, w: size.w, h: size.h } : void 0);
  if (!flat.exact) ;
  const shapes = flat.region;
  const inv2 = invertAffine(device);
  if (shapes && shapes.length === 0 || !inv2) {
    return;
  }
  const extent = size ?? { w: 1e6, h: 1e6 };
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const shape of shapes ?? []) {
      ctx.beginPath();
      replayClipCmds(ctx, shape.cmds);
      ctx.clip(shape.fillRule);
    }
    ctx.fillStyle = resolveBrushPaint(rCtx, flags, brush);
    applyPlusWorldTransform(rCtx);
    const corners = [
      [0, 0],
      [extent.w, 0],
      [extent.w, extent.h],
      [0, extent.h]
    ].map(([x, y]) => ({ x: inv2[0] * x + inv2[2] * y + inv2[4], y: inv2[1] * x + inv2[3] * y + inv2[5] }));
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();
  } finally {
    ctx.restore();
  }
}

// src/emf-plus-draw-handlers.ts
function ellipseArcAngles(startDeg, sweepDeg, rx, ry) {
  const param = (deg) => {
    const a = deg * Math.PI / 180;
    return rx > 0 && ry > 0 ? Math.atan2(rx * Math.sin(a), ry * Math.cos(a)) : a;
  };
  const sweepClamped = Math.max(-360, Math.min(360, sweepDeg));
  const start = param(startDeg);
  if (Math.abs(sweepClamped) >= 360) {
    return { start, sweep: Math.sign(sweepClamped) * 2 * Math.PI };
  }
  let sweep = param(startDeg + sweepClamped) - start;
  if (sweepClamped > 0 && sweep < 0) {
    sweep += 2 * Math.PI;
  } else if (sweepClamped < 0 && sweep > 0) {
    sweep -= 2 * Math.PI;
  } else if (sweepClamped === 0) {
    sweep = 0;
  }
  return { start, sweep };
}
function readRecordPoints(view, offset, end, count, flags) {
  if (flags & PLUS_FLAG_RELATIVE) {
    return readPlusPoints(view, offset, end, count, flags);
  }
  const compressed = (flags & 16384) !== 0;
  const ptSize = compressed ? 4 : 8;
  const pts = [];
  for (let i = 0, o = offset; i < count && o + ptSize <= end; i++, o += ptSize) {
    pts.push(readPointFromView(view, o, compressed));
  }
  return pts;
}
function penOf2(rCtx, penId) {
  const pen = rCtx.objectTable.get(penId & 255);
  return pen && pen.kind === "plus-pen" ? pen : null;
}
function handleEmfPlusDrawRecord(rCtx, recType, recFlags, dataOff, recDataSize) {
  const { ctx, view, objectTable } = rCtx;
  switch (recType) {
    case EMFPLUS_FILLRECTS: {
      if (recDataSize >= 8) {
        const brushVal = view.getUint32(dataOff, true);
        const count = view.getUint32(dataOff + 4, true);
        const compressed = (recFlags & 16384) !== 0;
        const rectSize = compressed ? 8 : 16;
        const rects = [];
        let rOff = dataOff + 8;
        for (let i = 0; i < count && rOff + rectSize <= dataOff + recDataSize; i++) {
          rects.push(readRectFromView(view, rOff, compressed));
          rOff += rectSize;
        }
        const exact = tryFillPlusShapeExact(
          rCtx,
          recFlags,
          brushVal,
          (c) => {
            for (const r of rects) {
              c.rect(r.x, r.y, r.w, r.h);
            }
          },
          rects.flatMap((r) => [
            { x: r.x, y: r.y },
            { x: r.x + r.w, y: r.y },
            { x: r.x, y: r.y + r.h },
            { x: r.x + r.w, y: r.y + r.h }
          ])
        );
        if (!exact) {
          ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
          applyPlusWorldTransform(rCtx);
          for (const r of rects) {
            ctx.fillRect(r.x, r.y, r.w, r.h);
          }
        }
      }
      return true;
    }
    case EMFPLUS_DRAWRECTS: {
      if (recDataSize >= 4) {
        const count = view.getUint32(dataOff, true);
        const compressed = (recFlags & 16384) !== 0;
        const rectSize = compressed ? 8 : 16;
        const rects = [];
        let rOff = dataOff + 4;
        for (let i = 0; i < count && rOff + rectSize <= dataOff + recDataSize; i++) {
          rects.push(readRectFromView(view, rOff, compressed));
          rOff += rectSize;
        }
        strokePlusGeometry(
          rCtx,
          penOf2(rCtx, recFlags),
          (c) => {
            for (const r of rects) {
              c.rect(r.x, r.y, r.w, r.h);
            }
          },
          rects.flatMap((r) => [
            { x: r.x, y: r.y },
            { x: r.x + r.w, y: r.y + r.h }
          ]),
          true
        );
      }
      return true;
    }
    case EMFPLUS_FILLELLIPSE: {
      if (recDataSize >= 12) {
        const brushVal = view.getUint32(dataOff, true);
        const compressed = (recFlags & 16384) !== 0;
        let x, y, w, h;
        if (compressed) {
          x = view.getInt16(dataOff + 4, true);
          y = view.getInt16(dataOff + 6, true);
          w = view.getInt16(dataOff + 8, true);
          h = view.getInt16(dataOff + 10, true);
        } else {
          if (recDataSize < 20) {
            return true;
          }
          x = view.getFloat32(dataOff + 4, true);
          y = view.getFloat32(dataOff + 8, true);
          w = view.getFloat32(dataOff + 12, true);
          h = view.getFloat32(dataOff + 16, true);
        }
        const ellipse = (c) => {
          c.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2);
        };
        const corners = [
          { x, y },
          { x: x + w, y },
          { x, y: y + h },
          { x: x + w, y: y + h }
        ];
        if (!tryFillPlusShapeExact(rCtx, recFlags, brushVal, ellipse, corners)) {
          ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
          applyPlusWorldTransform(rCtx);
          ctx.beginPath();
          ellipse(ctx);
          ctx.fill();
        }
      }
      return true;
    }
    case EMFPLUS_DRAWELLIPSE: {
      const penId = recFlags & 255;
      const pen = objectTable.get(penId);
      const compressed = (recFlags & 16384) !== 0;
      let x, y, w, h;
      if (compressed && recDataSize >= 8) {
        x = view.getInt16(dataOff, true);
        y = view.getInt16(dataOff + 2, true);
        w = view.getInt16(dataOff + 4, true);
        h = view.getInt16(dataOff + 6, true);
      } else if (!compressed && recDataSize >= 16) {
        x = view.getFloat32(dataOff, true);
        y = view.getFloat32(dataOff + 4, true);
        w = view.getFloat32(dataOff + 8, true);
        h = view.getFloat32(dataOff + 12, true);
      } else {
        return true;
      }
      strokePlusGeometry(
        rCtx,
        pen && pen.kind === "plus-pen" ? pen : null,
        (c) => c.ellipse(x + w / 2, y + h / 2, Math.abs(w) / 2, Math.abs(h) / 2, 0, 0, Math.PI * 2),
        [
          { x, y },
          { x: x + w, y: y + h }
        ],
        true
      );
      return true;
    }
    case EMFPLUS_FILLPIE:
    case EMFPLUS_DRAWPIE:
    case EMFPLUS_DRAWARC: {
      const isFill = recType === EMFPLUS_FILLPIE;
      const minSize = isFill ? 12 : 8;
      if (recDataSize < minSize) {
        return true;
      }
      let aOff = dataOff;
      const brushVal = isFill ? view.getUint32(aOff, true) : 0;
      if (isFill) {
        aOff += 4;
      }
      const startDeg = view.getFloat32(aOff, true);
      const sweepDeg = view.getFloat32(aOff + 4, true);
      aOff += 8;
      const compressed = (recFlags & 16384) !== 0;
      let x, y, w, h;
      if (compressed && aOff + 8 <= dataOff + recDataSize) {
        x = view.getInt16(aOff, true);
        y = view.getInt16(aOff + 2, true);
        w = view.getInt16(aOff + 4, true);
        h = view.getInt16(aOff + 6, true);
      } else if (!compressed && aOff + 16 <= dataOff + recDataSize) {
        x = view.getFloat32(aOff, true);
        y = view.getFloat32(aOff + 4, true);
        w = view.getFloat32(aOff + 8, true);
        h = view.getFloat32(aOff + 12, true);
      } else {
        return true;
      }
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = Math.abs(w) / 2;
      const ry = Math.abs(h) / 2;
      const { start: startAngle, sweep: sweepAngle } = ellipseArcAngles(startDeg, sweepDeg, rx, ry);
      if (isFill) {
        const pie = (c) => {
          c.moveTo(cx, cy);
          c.ellipse(cx, cy, rx, ry, 0, startAngle, startAngle + sweepAngle, sweepAngle < 0);
          c.closePath();
        };
        const corners = [
          { x, y },
          { x: x + w, y },
          { x, y: y + h },
          { x: x + w, y: y + h }
        ];
        if (!tryFillPlusShapeExact(rCtx, recFlags, brushVal, pie, corners)) {
          ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
          applyPlusWorldTransform(rCtx);
          ctx.beginPath();
          pie(ctx);
          ctx.fill();
        }
        return true;
      }
      const isPie = recType === EMFPLUS_DRAWPIE;
      strokePlusGeometry(
        rCtx,
        penOf2(rCtx, recFlags),
        (c) => {
          if (isPie) {
            c.moveTo(cx, cy);
          }
          c.ellipse(cx, cy, rx, ry, 0, startAngle, startAngle + sweepAngle, sweepAngle < 0);
          if (isPie) {
            c.closePath();
          }
        },
        [
          { x, y },
          { x: x + w, y: y + h }
        ],
        isPie
      );
      return true;
    }
    case EMFPLUS_DRAWLINES: {
      if (recDataSize >= 4) {
        const count = view.getUint32(dataOff, true);
        const pts = readRecordPoints(view, dataOff + 4, dataOff + recDataSize, count, recFlags);
        if (!pts) {
          return true;
        }
        const closed = (recFlags & 8192) !== 0;
        strokePlusGeometry(
          rCtx,
          penOf2(rCtx, recFlags),
          (c) => {
            pts.forEach((pt, i) => i === 0 ? c.moveTo(pt.x, pt.y) : c.lineTo(pt.x, pt.y));
            if (closed) {
              c.closePath();
            }
          },
          pts,
          closed
        );
      }
      return true;
    }
    case EMFPLUS_FILLPOLYGON: {
      if (recDataSize >= 8) {
        const brushVal = view.getUint32(dataOff, true);
        const count = view.getUint32(dataOff + 4, true);
        const pts = readRecordPoints(view, dataOff + 8, dataOff + recDataSize, count, recFlags);
        if (!pts) {
          return true;
        }
        const polygon = (c) => {
          pts.forEach((pt, i) => i === 0 ? c.moveTo(pt.x, pt.y) : c.lineTo(pt.x, pt.y));
          c.closePath();
        };
        if (!tryFillPlusShapeExact(rCtx, recFlags, brushVal, polygon, pts)) {
          ctx.fillStyle = resolveBrushPaint(rCtx, recFlags, brushVal);
          applyPlusWorldTransform(rCtx);
          ctx.beginPath();
          polygon(ctx);
          ctx.fill();
        }
      }
      return true;
    }
    default:
      return false;
  }
}

// src/emf-plus-object-parser.ts
function handleEmfPlusObjectRecord(rCtx, recFlags, dataOff, recDataSize, cacheKey = dataOff) {
  const { view, objectTable } = rCtx;
  const objectId = recFlags & 255;
  const objectType = recFlags >> 8 & 127;
  switch (objectType) {
    // ---------------------------------------------------------------
    // Brush
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_BRUSH: {
      const brush = parseEmfPlusBrushObject(view, dataOff, recDataSize, rCtx.textureCache, cacheKey);
      if (brush) {
        objectTable.set(objectId, brush);
      }
      break;
    }
    // ---------------------------------------------------------------
    // Pen
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_PEN: {
      const pen = parseEmfPlusPenObject(view, dataOff, recDataSize, rCtx.textureCache, cacheKey);
      if (pen) {
        objectTable.set(objectId, pen);
      }
      break;
    }
    // ---------------------------------------------------------------
    // Path
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_PATH: {
      const path = parseEmfPlusPath(view, dataOff, recDataSize);
      if (path) {
        objectTable.set(objectId, path);
      }
      break;
    }
    // ---------------------------------------------------------------
    // Font
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_FONT: {
      const font = parseEmfPlusFontObject(view, dataOff, recDataSize);
      if (font) {
        objectTable.set(objectId, font);
      }
      break;
    }
    // ---------------------------------------------------------------
    // StringFormat
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_STRINGFORMAT: {
      if (recDataSize >= 16) {
        const sfFlags = view.getUint32(dataOff + 4, true);
        const alignment = view.getUint32(dataOff + 12, true);
        const lineAlignment = view.getUint32(dataOff + 16, true);
        const hasSpacing = recDataSize >= 48;
        objectTable.set(objectId, {
          kind: "plus-stringformat",
          flags: sfFlags,
          alignment: alignment ?? 0,
          lineAlignment: lineAlignment ?? 0,
          leadingMargin: hasSpacing ? view.getFloat32(dataOff + 36, true) : void 0,
          trailingMargin: hasSpacing ? view.getFloat32(dataOff + 40, true) : void 0,
          tracking: hasSpacing ? view.getFloat32(dataOff + 44, true) : void 0
        });
      }
      break;
    }
    // ---------------------------------------------------------------
    // Image
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_IMAGE: {
      if (recDataSize < 8) {
        break;
      }
      const parsed = parseEmfPlusImageObject(view, dataOff, recDataSize);
      objectTable.set(objectId, {
        kind: "plus-image",
        data: parsed.data,
        type: parsed.type,
        cacheKey
      });
      rCtx.totalImageObjects++;
      break;
    }
    // ---------------------------------------------------------------
    // ImageAttributes
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_IMAGEATTRIBUTES: {
      if (recDataSize >= 16) {
        const wrap = view.getUint32(dataOff + 8, true);
        const names = ["tile", "tile-flip-x", "tile-flip-y", "tile-flip-xy", "clamp"];
        objectTable.set(objectId, {
          kind: "plus-imageattributes",
          wrapMode: names[wrap] ?? "clamp",
          clampArgb: view.getUint32(dataOff + 12, true)
        });
      } else {
        objectTable.set(objectId, { kind: "plus-imageattributes" });
      }
      break;
    }
    // ---------------------------------------------------------------
    // Region
    // ---------------------------------------------------------------
    case EMFPLUS_OBJECTTYPE_REGION: {
      const region = parseEmfPlusRegionObject(view, dataOff, recDataSize);
      if (region) {
        objectTable.set(objectId, region);
      }
      break;
    }
  }
}
var MAX_REGION_NODE_DEPTH = 64;
function parseRegionNode(view, off, endOff, depth = 0) {
  if (off + 4 > endOff) {
    return null;
  }
  if (depth > MAX_REGION_NODE_DEPTH) {
    return null;
  }
  const nodeType = view.getUint32(off, true);
  let cursor = off + 4;
  if (nodeType <= 5) {
    const leftResult = parseRegionNode(view, cursor, endOff, depth + 1);
    if (!leftResult) {
      return null;
    }
    cursor += leftResult.bytesRead;
    const rightResult = parseRegionNode(view, cursor, endOff, depth + 1);
    if (!rightResult) {
      return null;
    }
    cursor += rightResult.bytesRead;
    return {
      node: {
        type: "combine",
        combineMode: nodeType,
        left: leftResult.node,
        right: rightResult.node
      },
      bytesRead: cursor - off
    };
  }
  if (nodeType === 268435456) {
    if (cursor + 16 > endOff) {
      return null;
    }
    const x = view.getFloat32(cursor, true);
    const y = view.getFloat32(cursor + 4, true);
    const w = view.getFloat32(cursor + 8, true);
    const h = view.getFloat32(cursor + 12, true);
    return {
      node: { type: "rect", x, y, width: w, height: h },
      bytesRead: cursor + 16 - off
    };
  }
  if (nodeType === 268435457) {
    if (cursor + 4 > endOff) {
      return null;
    }
    const pathDataSize = view.getInt32(cursor, true);
    cursor += 4;
    if (pathDataSize <= 0 || cursor + pathDataSize > endOff) {
      return null;
    }
    const path = parseEmfPlusPath(view, cursor, pathDataSize);
    return {
      node: path ? { type: "path", path } : { type: "empty" },
      bytesRead: cursor + pathDataSize - off
    };
  }
  if (nodeType === 268435458) {
    return { node: { type: "empty" }, bytesRead: 4 };
  }
  if (nodeType === 268435459) {
    return { node: { type: "infinite" }, bytesRead: 4 };
  }
  emfWarn(`parseRegionNode: unknown node type 0x${nodeType.toString(16)}`);
  return { node: { type: "empty" }, bytesRead: 4 };
}
function parseEmfPlusRegionObject(view, off, maxLen) {
  if (maxLen < 8) {
    return null;
  }
  view.getUint32(off, true);
  const regionNodeCount = view.getUint32(off + 4, true);
  if (regionNodeCount === 0 || regionNodeCount > 1e5) {
    return null;
  }
  const endOff = off + maxLen;
  const result = parseRegionNode(view, off + 8, endOff);
  if (!result) {
    return null;
  }
  return {
    kind: "plus-region",
    nodes: [result.node]
  };
}

// src/emf-plus-replay.ts
var EMFPLUS_REC_NAMES = {
  16385: "Header",
  16389: "MultiFormatStart",
  16390: "MultiFormatSection",
  16391: "MultiFormatEnd",
  16386: "EndOfFile",
  16388: "GetDC",
  16392: "Object",
  16393: "Clear",
  16394: "FillRects",
  16395: "DrawRects",
  16396: "FillPolygon",
  16397: "DrawLines",
  16398: "FillEllipse",
  16399: "DrawEllipse",
  16400: "FillPie",
  16401: "DrawPie",
  16402: "DrawArc",
  16403: "FillRegion",
  16406: "FillClosedCurve",
  16407: "DrawClosedCurve",
  16408: "DrawCurve",
  16409: "DrawBeziers",
  16404: "FillPath",
  16405: "DrawPath",
  16410: "DrawImage",
  16411: "DrawImagePoints",
  16412: "DrawString",
  16438: "DrawDriverString",
  16413: "SetRenderingOrigin",
  16414: "SetAntiAliasMode",
  16415: "SetTextRenderingHint",
  16416: "SetTextContrast",
  16417: "SetInterpolationMode",
  16418: "SetPixelOffsetMode",
  16419: "SetCompositingMode",
  16420: "SetCompositingQuality",
  16423: "BeginContainer",
  16429: "TranslateWorldTransform",
  16430: "ScaleWorldTransform",
  16431: "RotateWorldTransform",
  16439: "StrokeFillPath",
  16440: "SerializableObject",
  16441: "SetTSGraphics",
  16442: "SetTSClip",
  16426: "SetWorldTransform",
  16427: "ResetWorldTransform",
  16428: "MultiplyWorldTransform",
  16432: "SetPageTransform",
  16433: "ResetClip",
  16434: "SetClipRect",
  16435: "SetClipPath",
  16436: "SetClipRegion",
  16437: "OffsetClip",
  16421: "Save",
  16422: "Restore",
  16424: "BeginContainerNoParams",
  16425: "EndContainer"
};
function handleMultiFormatStart(rCtx, dataOff, dataSize) {
  if (dataSize < 8) {
    return;
  }
  const count = rCtx.view.getUint32(dataOff, true);
  if (dataSize < 4 + 4 * count) {
    return;
  }
  (rCtx.ext ?? (rCtx.ext = {})).multiFormatSkip = true;
}
function replayEmfPlusRecords(view, offset, length, ctx, canvasW, canvasH, state, dpiScale = 1, maxRecords = MAX_RECORDS_EMFPLUS_DEFAULT, fontFamilyMap, textureCache, fonts) {
  const s = state ?? createEmfPlusState();
  const rCtx = {
    ctx,
    view,
    objectTable: s.objectTable,
    worldTransform: s.worldTransform,
    deferredImages: [],
    saveStack: s.saveStack,
    saveIdMap: s.saveIdMap,
    totalImageObjects: 0,
    totalDrawImageCalls: 0,
    clipSaveDepth: s.clipSaveDepth,
    clipRegion: s.clipRegion,
    pageUnit: s.pageUnit ?? 2,
    pageScale: s.pageScale ?? 1,
    ...s.continuation ?? createContinuationAccumulator(),
    dpiScale,
    canvasW,
    canvasH,
    fontFamilyMap,
    textureCache,
    interpolationMode: s.interpolationMode,
    pixelOffsetMode: s.pixelOffsetMode,
    textRenderingHint: s.textRenderingHint,
    fonts,
    baseTransform: s.baseTransform,
    imageCache: s.imageCache,
    nestingDepth: s.nestingDepth,
    gdiAntialias: s.gdiAntialias,
    antiAlias: s.antiAlias,
    ext: s.ext ?? (s.ext = {})
  };
  const end = offset + length;
  let recordCount = 0;
  const emfPlusRecordTypes = /* @__PURE__ */ new Map();
  emfLog(`replayEmfPlusRecords: offset=0x${offset.toString(16)}, length=${length}`);
  while (offset + 12 <= end && recordCount < maxRecords) {
    const recType = view.getUint16(offset, true);
    const recFlags = view.getUint16(offset + 2, true);
    const recSize = view.getUint32(offset + 4, true);
    const recDataSize = view.getUint32(offset + 8, true);
    if (recSize < 12 || offset + recSize > end) {
      break;
    }
    recordCount++;
    emfPlusRecordTypes.set(recType, (emfPlusRecordTypes.get(recType) ?? 0) + 1);
    const dataOff = offset + 12;
    s.gdiPassthrough = recType === EMFPLUS_GETDC;
    if (rCtx.ext?.multiFormatSkip && recType !== EMFPLUS_ENDOFFILE) {
      offset += recSize;
      continue;
    }
    switch (recType) {
      case EMFPLUS_HEADER: {
        s.dualMode = (recFlags & 1) !== 0;
        if (recDataSize >= 16) {
          view.getFloat32(dataOff + 8, true);
          view.getFloat32(dataOff + 12, true);
        }
        break;
      }
      case EMFPLUS_ENDOFFILE:
        offset = end;
        continue;
      case EMFPLUS_GETDC:
        break;
      case EMFPLUS_MULTIFORMATSTART:
        handleMultiFormatStart(rCtx, dataOff, recDataSize);
        break;
      // Without a preceding MultiFormatStart these do nothing in GDI+.
      case EMFPLUS_MULTIFORMATSECTION:
      case EMFPLUS_MULTIFORMATEND:
        break;
      // An image effect for the next DrawImagePoints with flag E
      // (`emf-plus-image-effects.ts`); an unknown or malformed effect
      // replaces any earlier one with none.
      case EMFPLUS_SERIALIZABLEOBJECT:
        (rCtx.ext ?? (rCtx.ext = {})).pendingEffect = parseSerializableObject(view, dataOff, recDataSize);
        break;
      case EMFPLUS_CLEAR: {
        if (recDataSize >= 4) {
          const argb = view.getUint32(dataOff, true);
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
          if (argb >>> 24 !== 255) {
            ctx.clearRect(0, 0, canvasW, canvasH);
          }
          ctx.fillStyle = argbToRgba(argb);
          ctx.fillRect(0, 0, canvasW, canvasH);
          ctx.restore();
        }
        break;
      }
      case EMFPLUS_OBJECT: {
        const assembled = feedEmfPlusObjectRecord(rCtx, view, recFlags, dataOff, recDataSize);
        if (assembled) {
          handleEmfPlusObjectRecord(
            assembled.view === view ? rCtx : { ...rCtx, view: assembled.view },
            assembled.flags,
            assembled.dataOff,
            assembled.dataSize,
            assembled.cacheKey
          );
        }
        break;
      }
      default: {
        const handled = handleEmfPlusDrawRecord(rCtx, recType, recFlags, dataOff, recDataSize) || handleEmfPlusCurveRecord(rCtx, recType, recFlags, dataOff, recDataSize) || handleEmfPlusTextImageRecord(rCtx, recType, recFlags, dataOff, recDataSize) || handleEmfPlusStateRecord(rCtx, recType, recFlags, dataOff, recDataSize);
        if (!handled) {
          console.warn(`[emf-converter] Unhandled EMF+ record type: 0x${recType.toString(16)}`);
        }
        break;
      }
    }
    offset += recSize;
  }
  if (recordCount >= maxRecords) {
    console.warn(
      `[emf-converter] EMF+ record limit reached (${maxRecords}). Output may be incomplete.`
    );
  }
  const summary = [];
  for (const [type, cnt] of emfPlusRecordTypes) {
    summary.push(`${EMFPLUS_REC_NAMES[type] ?? `0x${type.toString(16)}`}:${cnt}`);
  }
  emfLog(
    `replayEmfPlusRecords: totalImageObjects=${rCtx.totalImageObjects}, totalDrawImageCalls=${rCtx.totalDrawImageCalls}, deferredImages=${rCtx.deferredImages.length}`
  );
  emfLog(
    `replayEmfPlusRecords: object table has ${rCtx.objectTable.size} entries: [${Array.from(
      rCtx.objectTable.entries()
    ).map(([id, obj]) => `${id}:${obj.kind}`).join(", ")}]`
  );
  if (state) {
    state.worldTransform = rCtx.worldTransform;
    state.saveIdMap = rCtx.saveIdMap;
    state.clipRegion = rCtx.clipRegion ?? null;
    state.clipSaveDepth = rCtx.clipSaveDepth;
    state.continuation = {
      continuationBuffer: rCtx.continuationBuffer,
      continuationObjectId: rCtx.continuationObjectId,
      continuationObjectType: rCtx.continuationObjectType,
      continuationTotalSize: rCtx.continuationTotalSize,
      continuationOffset: rCtx.continuationOffset,
      continuationKey: rCtx.continuationKey
    };
    state.interpolationMode = rCtx.interpolationMode;
    state.pixelOffsetMode = rCtx.pixelOffsetMode;
    state.textRenderingHint = rCtx.textRenderingHint;
    state.pageUnit = rCtx.pageUnit;
    state.pageScale = rCtx.pageScale;
    state.antiAlias = rCtx.antiAlias;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return rCtx.deferredImages;
}

// src/emf-record-replay.ts
var GDI_NAMES = {
  1: "EMR_HEADER",
  2: "EMR_POLYBEZIER",
  3: "EMR_POLYGON",
  4: "EMR_POLYLINE",
  5: "EMR_POLYBEZIERTO",
  6: "EMR_POLYLINETO",
  14: "EMR_EOF",
  27: "EMR_MOVETOEX",
  37: "EMR_SELECTOBJECT",
  38: "EMR_CREATEPEN",
  39: "EMR_CREATEBRUSHINDIRECT",
  40: "EMR_DELETEOBJECT",
  42: "EMR_ELLIPSE",
  43: "EMR_RECTANGLE",
  54: "EMR_LINETO",
  59: "EMR_BEGINPATH",
  60: "EMR_ENDPATH",
  62: "EMR_FILLPATH",
  63: "EMR_STROKEANDFILLPATH",
  64: "EMR_STROKEPATH",
  70: "EMR_COMMENT",
  76: "EMR_BITBLT",
  81: "EMR_STRETCHDIBITS",
  84: "EMR_EXTTEXTOUTW",
  85: "EMR_POLYBEZIER16",
  86: "EMR_POLYGON16",
  87: "EMR_POLYLINE16",
  88: "EMR_POLYBEZIERTO16",
  91: "EMR_POLYPOLYGON16"
};
function replayEmfRecords(view, ctx, bounds, canvasW, canvasH, dpiScale = 1, replayOptions = {}) {
  emfLog(
    `replayEmfRecords: bounds=(${bounds.left},${bounds.top})\u2192(${bounds.right},${bounds.bottom}), canvas=${canvasW}\xD7${canvasH}`
  );
  const allDeferredImages = [];
  const emfPlusState = createEmfPlusState();
  const maxRecords = replayOptions.maxRecords ?? MAX_RECORDS_DEFAULT;
  const maxRecordsEmfPlus = replayOptions.maxRecordsEmfPlus ?? MAX_RECORDS_EMFPLUS_DEFAULT;
  const logicalW = bounds.right - bounds.left || 1;
  const logicalH = bounds.bottom - bounds.top || 1;
  const sx = canvasW / logicalW;
  const sy = canvasH / logicalH;
  const plusScale = dpiScale > 0 ? dpiScale : 1;
  emfPlusState.imageCache = replayOptions.imageCache;
  emfPlusState.gdiAntialias = replayOptions.gdiAntialias;
  emfPlusState.baseTransform = replayOptions.plusBaseTransform ?? [
    sx / plusScale,
    0,
    0,
    sy / plusScale,
    -bounds.left * sx,
    -bounds.top * sy
  ];
  emfPlusState.nestingDepth = replayOptions.nestingDepth;
  emfLog(
    `replayEmfRecords: logical=${logicalW}\xD7${logicalH}, scale=(${sx.toFixed(4)},${sy.toFixed(4)})`
  );
  const rCtx = {
    ctx,
    view,
    objectTable: /* @__PURE__ */ new Map(),
    state: { ...defaultState(), fontFamilyMap: replayOptions.fontFamilyMap },
    stateStack: [],
    inPath: false,
    // GDI's defaults: both origins at 0 and a 1:1 window/viewport ratio.
    // The window/viewport mapping yields device units, placed on the
    // canvas like every other device coordinate (bounds' top-left to the
    // canvas origin, scaled by sx/sy); see `deviceToCanvas`.
    windowOrg: { x: 0, y: 0 },
    windowExt: { cx: logicalW, cy: logicalH },
    viewportOrg: { x: 0, y: 0 },
    viewportExt: { cx: logicalW, cy: logicalH },
    useMappingMode: false,
    deviceToCanvas: true,
    clipSaveDepth: 0,
    bounds,
    canvasW,
    canvasH,
    sx,
    sy,
    pathCmds: [],
    gdiAntialias: replayOptions.gdiAntialias,
    fonts: replayOptions.fonts
  };
  let offset = 0;
  const maxOffset = view.byteLength;
  let recordCount = 0;
  let emfPlusCommentCount = 0;
  const gdiRecordTypes = /* @__PURE__ */ new Map();
  while (offset + 8 <= maxOffset && recordCount < maxRecords) {
    const recType = view.getUint32(offset, true);
    const recSize = view.getUint32(offset + 4, true);
    if (recSize < 8 || offset + recSize > maxOffset) {
      break;
    }
    recordCount++;
    const dataOff = offset + 8;
    gdiRecordTypes.set(recType, (gdiRecordTypes.get(recType) ?? 0) + 1);
    if (recType === EMR_COMMENT) {
      if (recSize >= 16) {
        const commentDataSize = view.getUint32(dataOff, true);
        const sig = view.getUint32(dataOff + 4, true);
        if (sig === EMFPLUS_SIGNATURE && commentDataSize > 4) {
          flushRasterLayer(rCtx);
          emfPlusCommentCount++;
          emfLog(
            `replayEmfRecords: EMF+ comment #${emfPlusCommentCount} at offset 0x${offset.toString(16)}, dataSize=${commentDataSize}`
          );
          const deferred = replayEmfPlusRecords(
            view,
            dataOff + 8,
            commentDataSize - 4,
            ctx,
            canvasW,
            canvasH,
            emfPlusState,
            dpiScale,
            maxRecordsEmfPlus,
            replayOptions.fontFamilyMap,
            replayOptions.textureCache,
            replayOptions.fonts
          );
          emfLog(
            `replayEmfRecords: EMF+ comment #${emfPlusCommentCount} returned ${deferred.length} deferred images`
          );
          allDeferredImages.push(...deferred);
        } else if (sig === EMR_COMMENT_PUBLIC_SIGNATURE) {
          emfLog(
            `replayEmfRecords: EMR_COMMENT_PUBLIC at offset 0x${offset.toString(16)}, size=${commentDataSize}`
          );
        } else {
          emfLog(
            `replayEmfRecords: EMR_COMMENT (sig=0x${sig.toString(16).padStart(8, "0")}) at offset 0x${offset.toString(16)}, size=${commentDataSize}`
          );
        }
      }
      offset += recSize;
      continue;
    }
    if (recType === EMR_EOF) {
      const summary = [];
      for (const [type, count] of gdiRecordTypes) {
        summary.push(`${GDI_NAMES[type] ?? `0x${type.toString(16)}`}:${count}`);
      }
      emfLog(
        `replayEmfRecords: total deferred images = ${allDeferredImages.length}, EMF+ object table size = ${emfPlusState.objectTable.size}`
      );
      break;
    }
    if (recType === EMR_SETMETARGN || recType === EMR_SETICMMODE || recType === EMR_SETLAYOUT || recType === EMR_HEADER) {
      offset += recSize;
      continue;
    }
    if (!isLayerSafeRecord(recType)) {
      flushRasterLayer(rCtx);
    }
    if (replayOptions.gdiDrawing === false) {
      offset += recSize;
      continue;
    }
    if (emfPlusState.dualMode && !emfPlusState.gdiPassthrough) {
      if (recType !== EMR_SAVEDC && recType !== EMR_RESTOREDC) {
        handleEmfGdiStateRecord(rCtx, recType, offset, dataOff, recSize);
      }
      offset += recSize;
      continue;
    }
    const handled = handleEmfGdiStateRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiDrawRecord(rCtx, recType, offset, dataOff, recSize) || handleEmfGdiPolyPathRecord(rCtx, recType, offset, dataOff, recSize);
    if (!handled) {
      console.warn(`[emf-converter] Unhandled EMR record type: ${recType}`);
    }
    offset += recSize;
  }
  flushRasterLayer(rCtx);
  if (recordCount >= maxRecords) {
    console.warn(
      `[emf-converter] EMF record limit reached (${maxRecords}). Output may be incomplete.`
    );
  }
  if (replayOptions.nestingDepth) {
    let open = emfPlusState.clipSaveDepth + rCtx.clipSaveDepth + rCtx.stateStack.length;
    while (open-- > 0) {
      ctx.restore();
    }
  }
  return allDeferredImages;
}
function replayNestedEmf(bytes, ctx, canvasW, canvasH, toCanvas, options) {
  const view = new DataView(bytes);
  const header = parseEmfHeader(view);
  if (!header) {
    return null;
  }
  const [a, b, c, d, e, f] = toCanvas;
  if (b === 0 && c === 0 && a > 0 && d > 0) {
    const left = -e / a;
    const top = -f / d;
    const bounds2 = { left, top, right: left + canvasW / a, bottom: top + canvasH / d };
    return replayEmfRecords(view, ctx, bounds2, canvasW, canvasH, 1, options);
  }
  const bounds = { left: 0, top: 0, right: canvasW, bottom: canvasH };
  return replayEmfRecords(view, ctx, bounds, canvasW, canvasH, 1, {
    ...options,
    plusBaseTransform: toCanvas,
    gdiDrawing: false
  });
}
registerNestedMetafileReplayer(replayNestedEmf);

// src/wmf-embedded-emf.ts
var MFCOMMENT = 15;
var WMFC = 1128680791;
function extractEmbeddedEmf(view, start) {
  let off = start;
  let out = null;
  let written = 0;
  let total = 0;
  let expectedChunks = 0;
  let chunks = 0;
  let guard = 0;
  while (off + 6 <= view.byteLength && guard++ < 1e6) {
    const size = view.getUint32(off, true) * 2;
    const type = view.getUint16(off + 4, true);
    if (size < 6 || off + size > view.byteLength || type === 0) {
      break;
    }
    if (type === META_ESCAPE && size >= 6 + 4 + 34) {
      const d = off + 6;
      const fn = view.getUint16(d, true);
      const byteCount = view.getUint16(d + 2, true);
      const c = d + 4;
      if (fn === MFCOMMENT && byteCount >= 34 && view.getUint32(c, true) === WMFC && view.getUint32(c + 4, true) === 1) {
        const count = view.getUint32(c + 18, true);
        const chunkSize = view.getUint32(c + 22, true);
        const remaining = view.getUint32(c + 26, true);
        const emfSize = view.getUint32(c + 30, true);
        const data = c + 34;
        if (chunkSize > byteCount - 34 || data + chunkSize > off + size) {
          return null;
        }
        if (!out) {
          if (emfSize === 0 || emfSize > 256 * 1024 * 1024) {
            return null;
          }
          out = new Uint8Array(emfSize);
          total = emfSize;
          expectedChunks = count;
        }
        if (emfSize !== total || written + chunkSize > total || remaining !== total - written - chunkSize) {
          return null;
        }
        out.set(new Uint8Array(view.buffer, view.byteOffset + data, chunkSize), written);
        written += chunkSize;
        chunks++;
      }
    }
    off += size;
  }
  if (!out || written !== total || chunks !== expectedChunks) {
    return null;
  }
  const emf = new DataView(out.buffer);
  if (total < 88 || emf.getUint32(0, true) !== EMR_HEADER) {
    return null;
  }
  return out.buffer;
}

// src/wmf-mapping.ts
var MM_TEXT = 1;
var MM_LOMETRIC = 2;
var MM_HIMETRIC = 3;
var MM_LOENGLISH = 4;
var MM_HIENGLISH = 5;
var MM_TWIPS = 6;
var MM_ISOTROPIC = 7;
var MM_ANISOTROPIC = 8;
var DEVICE_DPI = 96;
function cloneMapping(m) {
  return {
    mode: m.mode,
    winOrg: { ...m.winOrg },
    winExt: { ...m.winExt },
    vpOrg: { ...m.vpOrg },
    vpExt: { ...m.vpExt }
  };
}
var METRIC_UNITS_PER_INCH = {
  [MM_LOMETRIC]: 254,
  [MM_HIMETRIC]: 2540,
  [MM_LOENGLISH]: 100,
  [MM_HIENGLISH]: 1e3,
  [MM_TWIPS]: 1440
};
function fixIsotropic(m) {
  if (m.mode !== MM_ISOTROPIC || !m.winExt.cx || !m.winExt.cy) {
    return;
  }
  const xdim = Math.abs(m.vpExt.cx / m.winExt.cx);
  const ydim = Math.abs(m.vpExt.cy / m.winExt.cy);
  if (xdim > ydim) {
    const min = m.vpExt.cx >= 0 ? 1 : -1;
    m.vpExt.cx = Math.floor(m.vpExt.cx * ydim / xdim + 0.5) || min;
  } else if (ydim > xdim) {
    const min = m.vpExt.cy >= 0 ? 1 : -1;
    m.vpExt.cy = Math.floor(m.vpExt.cy * xdim / ydim + 0.5) || min;
  }
}
function setMapMode(m, mode) {
  if (mode < MM_TEXT || mode > MM_ANISOTROPIC) {
    return;
  }
  const units = METRIC_UNITS_PER_INCH[mode === MM_ISOTROPIC ? MM_LOMETRIC : mode];
  if (mode === MM_TEXT) {
    m.winExt = { cx: 1, cy: 1 };
    m.vpExt = { cx: 1, cy: 1 };
  } else if (units !== void 0 && (mode !== MM_ISOTROPIC || m.mode !== MM_ISOTROPIC)) {
    m.winExt = { cx: units, cy: units };
    m.vpExt = { cx: DEVICE_DPI, cy: -DEVICE_DPI };
  }
  m.mode = mode;
}
function extentsSettable(m) {
  return m.mode === MM_ISOTROPIC || m.mode === MM_ANISOTROPIC;
}
function setWindowExt(m, cx, cy) {
  if (!extentsSettable(m) || cx === 0 || cy === 0) {
    return;
  }
  m.winExt = { cx, cy };
  fixIsotropic(m);
}
function setViewportExt(m, cx, cy) {
  if (!extentsSettable(m) || cx === 0 || cy === 0) {
    return;
  }
  m.vpExt = { cx, cy };
  fixIsotropic(m);
}
function scaled(v, num, den) {
  return Math.trunc(v * num / den);
}
function scaleWindowExt(m, xNum, xDen, yNum, yDen) {
  if (!extentsSettable(m) || !xDen || !yDen) {
    return;
  }
  const cx = scaled(m.winExt.cx, xNum, xDen);
  const cy = scaled(m.winExt.cy, yNum, yDen);
  if (cx === 0 || cy === 0) {
    return;
  }
  m.winExt = { cx, cy };
  fixIsotropic(m);
}
function scaleViewportExt(m, xNum, xDen, yNum, yDen) {
  if (!extentsSettable(m) || !xDen || !yDen) {
    return;
  }
  const cx = scaled(m.vpExt.cx, xNum, xDen);
  const cy = scaled(m.vpExt.cy, yNum, yDen);
  if (cx === 0 || cy === 0) {
    return;
  }
  m.vpExt = { cx, cy };
  fixIsotropic(m);
}
function applyWmfMapping(rCtx, m, kx, ky, mirrorWidth = 0) {
  rCtx.useMappingMode = true;
  rCtx.windowOrg = { x: m.winOrg.x, y: m.winOrg.y };
  rCtx.windowExt = { cx: m.winExt.cx || 1, cy: m.winExt.cy || 1 };
  rCtx.viewportOrg = { x: m.vpOrg.x * kx, y: m.vpOrg.y * ky };
  rCtx.viewportExt = { cx: (m.vpExt.cx || 1) * kx, cy: (m.vpExt.cy || 1) * ky };
  if (mirrorWidth > 0) {
    rCtx.viewportOrg.x = mirrorWidth * kx - rCtx.viewportOrg.x;
    rCtx.viewportExt.cx = -rCtx.viewportExt.cx;
  }
}
function scanMappingRecords(view, start) {
  const out = {
    mode: null,
    winExt: null,
    vpExt: null
  };
  let off = start;
  let guard = 0;
  while (off + 6 <= view.byteLength && guard++ < 1e6) {
    const size = view.getUint32(off, true) * 2;
    const type = view.getUint16(off + 4, true);
    if (size < 6 || off + size > view.byteLength || type === 0) {
      break;
    }
    const d = off + 6;
    if (type === 259 && size >= 8 && out.mode === null) {
      out.mode = view.getUint16(d, true);
    } else if (type === 524 && size >= 10 && !out.winExt) {
      out.winExt = { cy: view.getInt16(d, true), cx: view.getInt16(d + 2, true) };
    } else if (type === 526 && size >= 10 && !out.vpExt) {
      out.vpExt = { cy: view.getInt16(d, true), cx: view.getInt16(d + 2, true) };
    }
    off += size;
  }
  return out;
}
function wmfPlayback(view, header) {
  const bw = header.boundsRight - header.boundsLeft;
  const bh = header.boundsBottom - header.boundsTop;
  if (header.placeable !== false) {
    const inch = header.unitsPerInch > 0 ? header.unitsPerInch : DEVICE_DPI;
    const width2 = Math.max(1, Math.round(Math.abs(bw) * DEVICE_DPI / inch));
    const height2 = Math.max(1, Math.round(Math.abs(bh) * DEVICE_DPI / inch));
    return {
      width: width2,
      height: height2,
      mapping: {
        mode: MM_ANISOTROPIC,
        winOrg: { x: header.boundsLeft, y: header.boundsTop },
        winExt: { cx: bw || 1, cy: bh || 1 },
        vpOrg: { x: 0, y: 0 },
        vpExt: { cx: width2, cy: height2 }
      }
    };
  }
  const scan = scanMappingRecords(view, header.headerSize);
  const scalable = scan.mode === MM_ISOTROPIC || scan.mode === MM_ANISOTROPIC;
  const ext = scalable && scan.vpExt ? scan.vpExt : scan.winExt;
  const width = ext ? Math.abs(ext.cx) : Math.abs(bw);
  const height = ext ? Math.abs(ext.cy) : Math.abs(bh);
  const w = Math.max(1, width || 1);
  const h = Math.max(1, height || 1);
  return {
    width: w,
    height: h,
    mapping: {
      mode: MM_ANISOTROPIC,
      winOrg: { x: 0, y: 0 },
      winExt: { cx: w, cy: h },
      vpOrg: { x: 0, y: 0 },
      vpExt: { cx: w, cy: h }
    }
  };
}

// src/wmf-emf-bridge.ts
var EmfRecordWriter = class {
  constructor(type, capacity = 64) {
    this.type = type;
    this.len = 8;
    this.bytes = new Uint8Array(Math.max(16, capacity));
    this.view = new DataView(this.bytes.buffer);
  }
  ensure(n) {
    if (this.len + n <= this.bytes.length) {
      return;
    }
    const next = new Uint8Array(Math.max(this.bytes.length * 2, this.len + n));
    next.set(this.bytes);
    this.bytes = next;
    this.view = new DataView(next.buffer);
  }
  /** Current length in bytes (the offset the next field is written at). */
  get offset() {
    return this.len;
  }
  i32(v) {
    this.ensure(4);
    this.view.setInt32(this.len, v | 0, true);
    this.len += 4;
    return this;
  }
  u32(v) {
    this.ensure(4);
    this.view.setUint32(this.len, v >>> 0, true);
    this.len += 4;
    return this;
  }
  i16(v) {
    this.ensure(2);
    this.view.setInt16(this.len, v, true);
    this.len += 2;
    return this;
  }
  u16(v) {
    this.ensure(2);
    this.view.setUint16(this.len, v & 65535, true);
    this.len += 2;
    return this;
  }
  f32(v) {
    this.ensure(4);
    this.view.setFloat32(this.len, v, true);
    this.len += 4;
    return this;
  }
  /** Appends raw bytes. */
  raw(src) {
    this.ensure(src.length);
    this.bytes.set(src, this.len);
    this.len += src.length;
    return this;
  }
  /** Pads to a multiple of four bytes. */
  align() {
    while (this.len % 4 !== 0) {
      this.ensure(1);
      this.bytes[this.len++] = 0;
    }
    return this;
  }
  /** Overwrites the u32 at byte `at` (for offsets known only later). */
  patchU32(at, v) {
    this.view.setUint32(at, v >>> 0, true);
    return this;
  }
  /** The finished record. */
  finish() {
    this.align();
    this.view.setUint32(0, this.type, true);
    this.view.setUint32(4, this.len, true);
    return new DataView(this.bytes.buffer, 0, this.len);
  }
};
function playEmfRecord(rCtx, record) {
  const type = record.getUint32(0, true);
  const size = record.getUint32(4, true);
  if (!isLayerSafeRecord(type)) {
    flushRasterLayer(rCtx);
  }
  const saved = rCtx.view;
  rCtx.view = record;
  try {
    if (!handleEmfGdiStateRecord(rCtx, type, 0, 8, size) && !handleEmfGdiDrawRecord(rCtx, type, 0, 8, size)) {
      handleEmfGdiPolyPathRecord(rCtx, type, 0, 8, size);
    }
  } finally {
    rCtx.view = saved;
  }
}

// src/wmf-objects.ts
var DEFAULT_PALETTE = [
  0,
  8388608,
  32768,
  8421376,
  128,
  8388736,
  32896,
  12632256,
  12639424,
  10930928,
  16776176,
  10526884,
  8421504,
  16711680,
  65280,
  16776960,
  255,
  16711935,
  65535,
  16777215
];
function defaultPen() {
  return { kind: "pen", style: 0, width: 0, color: 0 };
}
function defaultBrush() {
  return { kind: "brush", style: 0, color: 16777215, hatch: 0 };
}
function rgb(r, g, b) {
  return r << 16 | g << 8 | b;
}
function resolveColorRef2(ref, pal) {
  const r = ref & 255;
  const g = ref >>> 8 & 255;
  const b = ref >>> 16 & 255;
  if (ref >>> 24 === 1) {
    const index = ref & 65535;
    if (pal) {
      const e = pal.entries[index < pal.entries.length ? index : 0];
      return e === void 0 ? 0 : rgb(e & 255, e >>> 8 & 255, e >>> 16 & 255);
    }
    return DEFAULT_PALETTE[index < DEFAULT_PALETTE.length ? index : 0];
  }
  return rgb(r, g, b);
}
function colorCss(p, ref) {
  const c = resolveColorRef2(ref, p.palette);
  return colorRefToHex(c >> 16 & 255, c >> 8 & 255, c & 255);
}
function readColorRefRaw(view, off) {
  return view.getUint32(off, true);
}
function selectPen(p, pen) {
  p.pen = pen;
  const s = p.rCtx.state;
  s.penStyle = pen.style & 15;
  s.penFlags = pen.style & 15;
  s.penWidth = pen.width;
  s.penColor = colorCss(p, pen.color);
  s.penUserStyle = void 0;
  s.penExtended = false;
}
function selectBrush(p, brush) {
  p.brush = brush;
  const s = p.rCtx.state;
  s.brushStyle = brush.pattern ? brush.pattern.kind === "mono" ? 3 : 6 : brush.style;
  s.brushColor = colorCss(p, brush.color);
  s.brushPattern = brush.pattern ?? (brush.style === 2 && brush.hatch >= 0 && brush.hatch <= 5 ? { kind: "hatch", hatch: brush.hatch } : null);
}
function refreshColors(p) {
  selectPen(p, p.pen);
  selectBrush(p, p.brush);
  p.rCtx.state.textColor = colorCss(p, p.textColor);
  p.rCtx.state.bkColor = colorCss(p, p.bkColor);
}
function addObject(p, obj) {
  let slot = 0;
  while (p.objects[slot] !== void 0) {
    slot++;
  }
  p.objects[slot] = obj;
}
function createPen(p, dataOff, recSize) {
  const { view } = p;
  if (recSize < 16) {
    addObject(p, { kind: "other" });
    return;
  }
  addObject(p, {
    kind: "pen",
    style: view.getUint16(dataOff, true),
    width: view.getInt16(dataOff + 2, true),
    color: readColorRefRaw(view, dataOff + 6)
  });
}
function createBrush(p, dataOff, recSize) {
  const { view } = p;
  if (recSize < 14) {
    addObject(p, { kind: "other" });
    return;
  }
  addObject(p, {
    kind: "brush",
    style: view.getUint16(dataOff, true),
    color: readColorRefRaw(view, dataOff + 2),
    hatch: view.getUint16(dataOff + 6, true)
  });
}
function createFont(p, dataOff, recSize, recEnd) {
  const { view } = p;
  if (recSize < 24) {
    addObject(p, { kind: "other" });
    return;
  }
  let family = "";
  for (let i = 0; i < 32 && dataOff + 18 + i < recEnd; i++) {
    const ch = view.getUint8(dataOff + 18 + i);
    if (ch === 0) {
      break;
    }
    family += String.fromCharCode(ch);
  }
  const font = {
    kind: "font",
    // Sign kept: resolveFontPixelHeight() tells cell from character height by it.
    height: view.getInt16(dataOff, true),
    weight: view.getInt16(dataOff + 8, true),
    italic: view.getUint8(dataOff + 10) !== 0,
    underline: view.getUint8(dataOff + 11) !== 0,
    strikeOut: view.getUint8(dataOff + 12) !== 0,
    family: family || "sans-serif",
    escapementTenthDeg: view.getInt16(dataOff + 4, true),
    details: {
      width: view.getInt16(dataOff + 2, true),
      orientationTenthDeg: view.getInt16(dataOff + 6, true),
      charSet: view.getUint8(dataOff + 13),
      quality: view.getUint8(dataOff + 16),
      pitchAndFamily: view.getUint8(dataOff + 17)
    }
  };
  addObject(p, { kind: "font", font });
}
function palColorsToRgb(p, view, bmi, end) {
  if (bmi + 40 > end) {
    return null;
  }
  const hdrSize = view.getUint32(bmi, true);
  const bitCount = view.getUint16(bmi + 14, true);
  const clrUsed = view.getUint32(bmi + 32, true);
  if (hdrSize < 40 || bitCount > 8) {
    return null;
  }
  const n = clrUsed || 1 << bitCount;
  const tableEnd = bmi + hdrSize + n * 2;
  if (tableEnd > end) {
    return null;
  }
  const bitsLen = end - tableEnd;
  const out = new Uint8Array(hdrSize + n * 4 + bitsLen);
  const src = new Uint8Array(view.buffer, view.byteOffset + bmi, end - bmi);
  out.set(src.subarray(0, hdrSize), 0);
  for (let i = 0; i < n; i++) {
    const c = resolveColorRef2(16777216 | view.getUint16(bmi + hdrSize + i * 2, true), p.palette);
    out[hdrSize + i * 4] = c & 255;
    out[hdrSize + i * 4 + 1] = c >> 8 & 255;
    out[hdrSize + i * 4 + 2] = c >> 16 & 255;
    out[hdrSize + i * 4 + 3] = 0;
  }
  out.set(src.subarray(tableEnd - bmi), hdrSize + n * 4);
  return out;
}
function dibHeaderAndTableSize(view, bmi, usage) {
  const hdrSize = view.getUint32(bmi, true);
  const bitCount = view.getUint16(bmi + 14, true);
  const compression = view.getUint32(bmi + 16, true);
  const clrUsed = view.getUint32(bmi + 32, true);
  let n = clrUsed;
  if (n === 0 && bitCount <= 8) {
    n = 1 << bitCount;
  }
  const entry = 4;
  let size = hdrSize + n * entry;
  if (compression === 3 && hdrSize === 40) {
    size += 12;
  }
  return size;
}
function dibPattern(p, bmi, end, usage, monoAsText) {
  let view = p.view;
  let at = bmi;
  let stop = end;
  if (usage === 1) {
    const rgb2 = palColorsToRgb(p, p.view, bmi, end);
    if (!rgb2) {
      return null;
    }
    view = new DataView(rgb2.buffer);
    at = 0;
    stop = rgb2.length;
  }
  if (at + 40 > stop) {
    return null;
  }
  const bits = at + dibHeaderAndTableSize(view, at);
  if (monoAsText && view.getUint16(at + 14, true) === 1) {
    const mono = decodeMonoBits(view, at, bits);
    if (mono) {
      return { kind: "mono", ...mono };
    }
  }
  const image = decodeDibToImageData(view, at, bits, Math.max(0, stop - bits));
  if (!image) {
    return null;
  }
  const px = new Uint32Array(image.width * image.height);
  for (let i = 0; i < px.length; i++) {
    px[i] = image.data[i * 4] << 16 | image.data[i * 4 + 1] << 8 | image.data[i * 4 + 2];
  }
  return { kind: "bitmap", width: image.width, height: image.height, rgb: px };
}
function createDibPatternBrush(p, dataOff, recEnd) {
  const { view } = p;
  if (dataOff + 4 + 40 > recEnd) {
    addObject(p, { kind: "other" });
    return;
  }
  const style = view.getUint16(dataOff, true);
  const usage = view.getUint16(dataOff + 2, true);
  const pattern = dibPattern(p, dataOff + 4, recEnd, usage, style === 3);
  addObject(p, { kind: "brush", style: pattern ? 6 : 0, color: 8421504, hatch: 0, ...pattern ? { pattern } : {} });
}
function readPaletteEntries(view, off, end) {
  const start = view.getUint16(off, true);
  const count = view.getUint16(off + 2, true);
  const entries = [];
  for (let i = 0; i < count && off + 4 + i * 4 + 4 <= end; i++) {
    entries.push(view.getUint32(off + 4 + i * 4, true));
  }
  return { start, entries };
}
function createPalette(p, dataOff, recEnd) {
  if (dataOff + 4 > recEnd) {
    addObject(p, { kind: "other" });
    return;
  }
  addObject(p, { kind: "palette", entries: readPaletteEntries(p.view, dataOff, recEnd).entries });
}
function setPaletteEntries(p, dataOff, recEnd, animate) {
  const pal = p.palette;
  if (!pal || dataOff + 4 > recEnd) {
    return;
  }
  const { start, entries } = readPaletteEntries(p.view, dataOff, recEnd);
  for (let i = 0; i < entries.length && start + i < pal.entries.length; i++) {
    if (animate && (pal.entries[start + i] >>> 24 & 1) === 0) {
      continue;
    }
    pal.entries[start + i] = entries[i];
  }
  refreshColors(p);
}
function resizePalette(p, count) {
  const pal = p.palette;
  if (!pal) {
    return;
  }
  if (count < pal.entries.length) {
    pal.entries.length = count;
  } else {
    while (pal.entries.length < count) {
      pal.entries.push(0);
    }
  }
  refreshColors(p);
}
function selectPalette(p, slot) {
  const obj = p.objects[slot];
  if (obj?.kind === "palette") {
    p.palette = obj;
    refreshColors(p);
  }
}
function createRegion(p, dataOff, recEnd) {
  const { view } = p;
  const region = { kind: "region", rects: [] };
  if (dataOff + 22 <= recEnd) {
    const scanCount = view.getUint16(dataOff + 10, true);
    let off = dataOff + 22;
    for (let s = 0; s < scanCount && off + 6 <= recEnd; s++) {
      const count = view.getUint16(off, true);
      const top = view.getInt16(off + 2, true);
      const bottom = view.getInt16(off + 4, true);
      let q = off + 6;
      for (let i = 0; i + 1 < count && q + 4 <= recEnd; i += 2, q += 4) {
        const left = view.getInt16(q, true);
        const right = view.getInt16(q + 2, true);
        if (right > left && bottom > top) {
          region.rects.push([left, top, right, bottom]);
        }
      }
      off = q + 2;
    }
    if (scanCount === 0) {
      const l = view.getInt16(dataOff + 14, true);
      const t = view.getInt16(dataOff + 16, true);
      const r = view.getInt16(dataOff + 18, true);
      const b = view.getInt16(dataOff + 20, true);
      if (r > l && b > t) {
        region.rects.push([l, t, r, b]);
      }
    }
  }
  addObject(p, region);
}
function selectObject(p, slot) {
  const obj = p.objects[slot];
  if (!obj) {
    return void 0;
  }
  const s = p.rCtx.state;
  switch (obj.kind) {
    case "pen":
      selectPen(p, obj);
      break;
    case "brush":
      selectBrush(p, obj);
      break;
    case "font": {
      const f = obj.font;
      s.fontHeight = f.height;
      s.fontWeight = f.weight;
      s.fontItalic = f.italic;
      s.fontUnderline = f.underline;
      s.fontStrikeOut = f.strikeOut;
      s.fontFamily = f.family;
      s.fontEscapementTenthDeg = f.escapementTenthDeg ?? 0;
      s.fontDetails = f.details;
      break;
    }
  }
  return obj;
}
function deleteObject(p, slot) {
  if (slot >= 0 && slot < p.objects.length) {
    p.objects[slot] = void 0;
  }
}

// src/wmf-bitmap.ts
function deviceDest(p, x, y, w, h) {
  const m = gdiDeviceMatrix(p.rCtx);
  const dev = (lx, ly) => [
    Math.floor((m[0] * lx + m[2] * ly + m[4]) / p.kx + 0.5),
    Math.floor((m[1] * lx + m[3] * ly + m[5]) / p.ky + 0.5)
  ];
  const a = dev(x, y);
  const b = dev(x + w, y + h);
  return [a[0], a[1], b[0] - a[0], b[1] - a[1]];
}
function onDevicePixels(p, play) {
  const { rCtx } = p;
  const saved = {
    windowOrg: rCtx.windowOrg,
    windowExt: rCtx.windowExt,
    viewportOrg: rCtx.viewportOrg,
    viewportExt: rCtx.viewportExt
  };
  rCtx.windowOrg = { x: 0, y: 0 };
  rCtx.windowExt = { cx: 1, cy: 1 };
  rCtx.viewportOrg = { x: 0, y: 0 };
  rCtx.viewportExt = { cx: p.kx, cy: p.ky };
  try {
    play();
  } finally {
    Object.assign(rCtx, saved);
  }
}
function monoAsDeviceColors(p, dib) {
  if (!dib || dib.bmi.length < 48) {
    return dib;
  }
  const v = new DataView(dib.bmi.buffer, dib.bmi.byteOffset, dib.bmi.byteLength);
  if (v.getUint16(14, true) !== 1) {
    return dib;
  }
  const bmi = dib.bmi.slice();
  const head = v.getUint32(0, true);
  const put = (i, c) => {
    bmi[head + i * 4] = c & 255;
    bmi[head + i * 4 + 1] = c >> 8 & 255;
    bmi[head + i * 4 + 2] = c >> 16 & 255;
    bmi[head + i * 4 + 3] = 0;
  };
  put(0, resolveColorRef2(p.textColor, p.palette));
  put(1, resolveColorRef2(p.bkColor, p.palette));
  return { bmi, bits: dib.bits };
}
function readDib(p, off, end, usage) {
  const { view } = p;
  if (off + 40 > end) {
    return null;
  }
  let src = new Uint8Array(view.buffer, view.byteOffset + off, end - off);
  let v = new DataView(src.buffer, src.byteOffset, src.byteLength);
  if (usage === 1) {
    const rgb2 = palColorsToRgb(p, view, off, end);
    if (!rgb2) {
      return null;
    }
    src = rgb2;
    v = new DataView(rgb2.buffer);
  }
  if (v.getUint32(0, true) < 40) {
    return null;
  }
  const head = dibHeaderAndTableSize(v, 0);
  if (head > src.length) {
    return null;
  }
  return { bmi: src.subarray(0, head), bits: src.subarray(head) };
}
function playBlt(p, stretch, rop, dx, dy, dw, dh, sx, sy, sw, sh, dib) {
  [dx, dy, dw, dh] = deviceDest(p, dx, dy, dw, dh);
  const fixed = stretch ? 108 : 100;
  const w = new EmfRecordWriter(stretch ? EMR_STRETCHBLT : EMR_BITBLT, fixed + (dib ? dib.bmi.length + dib.bits.length + 8 : 0));
  w.i32(0).i32(0).i32(-1).i32(-1);
  w.i32(dx).i32(dy).i32(dw).i32(dh);
  w.u32(rop);
  w.i32(sx).i32(sy);
  w.f32(1).f32(0).f32(0).f32(1).f32(0).f32(0);
  w.u32(0);
  w.u32(0);
  const offBmiAt = w.offset;
  w.u32(0).u32(0).u32(0).u32(0);
  if (stretch) {
    w.i32(sw).i32(sh);
  }
  if (dib) {
    const bmiAt = w.offset;
    w.raw(dib.bmi).align();
    const bitsAt = w.offset;
    w.raw(dib.bits);
    w.patchU32(offBmiAt, bmiAt).patchU32(offBmiAt + 4, dib.bmi.length).patchU32(offBmiAt + 8, bitsAt).patchU32(offBmiAt + 12, dib.bits.length);
  }
  const record = w.finish();
  onDevicePixels(p, () => playEmfRecord(p.rCtx, record));
}
function playStretchDibits(p, rop, dx, dy, dw, dh, sx, sy, sw, sh, dib, onDevice = false) {
  if (!onDevice) {
    [dx, dy, dw, dh] = deviceDest(p, dx, dy, dw, dh);
  }
  const w = new EmfRecordWriter(EMR_STRETCHDIBITS, 80 + dib.bmi.length + dib.bits.length + 8);
  w.i32(0).i32(0).i32(-1).i32(-1);
  w.i32(dx).i32(dy);
  w.i32(sx).i32(sy).i32(sw).i32(sh);
  const offBmiAt = w.offset;
  w.u32(0).u32(0).u32(0).u32(0);
  w.u32(0);
  w.u32(rop);
  w.i32(dw).i32(dh);
  const bmiAt = w.offset;
  w.raw(dib.bmi).align();
  const bitsAt = w.offset;
  w.raw(dib.bits);
  w.patchU32(offBmiAt, bmiAt).patchU32(offBmiAt + 4, dib.bmi.length).patchU32(offBmiAt + 8, bitsAt).patchU32(offBmiAt + 12, dib.bits.length);
  const record = w.finish();
  onDevicePixels(p, () => playEmfRecord(p.rCtx, record));
}
function wmfPatBlt(p, d, end) {
  const { view } = p;
  if (d + 12 > end) {
    return;
  }
  const rop = view.getUint32(d, true);
  const h = view.getInt16(d + 4, true);
  const wd = view.getInt16(d + 6, true);
  const y = view.getInt16(d + 8, true);
  const x = view.getInt16(d + 10, true);
  playBlt(p, false, rop, x, y, wd, h, 0, 0, wd, h, null);
}
function withoutBitmap(recType, recSize) {
  return recSize / 2 === (recType >> 8) + 3;
}
function wmfBitBlt(p, stretch, offset, recSize) {
  const { view } = p;
  const recType = view.getUint16(offset + 4, true);
  if (!withoutBitmap(recType, recSize)) {
    return;
  }
  const d = offset + 6;
  const k = d + 4 + (stretch ? 4 : 0) + 6;
  if (k + 8 > offset + recSize) {
    return;
  }
  const rop = view.getUint32(d, true);
  const dh = view.getInt16(k, true);
  const dw = view.getInt16(k + 2, true);
  const dy = view.getInt16(k + 4, true);
  const dx = view.getInt16(k + 6, true);
  playBlt(p, false, rop, dx, dy, dw, dh, 0, 0, dw, dh, null);
}
function wmfDibBitBlt(p, stretch, offset, recSize) {
  const { view } = p;
  const recType = view.getUint16(offset + 4, true);
  const d = offset + 6;
  const end = offset + recSize;
  const none = withoutBitmap(recType, recSize);
  let k = d + 4;
  const rd = () => {
    const v = view.getInt16(k, true);
    k += 2;
    return v;
  };
  if (d + 4 + (stretch ? 16 : 12) > end) {
    return;
  }
  const rop = view.getUint32(d, true);
  const sh = stretch ? rd() : 0;
  const sw = stretch ? rd() : 0;
  const sy = rd();
  const sx = rd();
  if (none) {
    k += 2;
  }
  const dh = rd();
  const dw = rd();
  const dy = rd();
  const dx = rd();
  const dib = none ? null : monoAsDeviceColors(p, readDib(p, k, end, 0));
  playBlt(p, stretch, rop, dx, dy, dw, dh, sx, sy, stretch ? sw : dw, stretch ? sh : dh, dib);
}
function wmfStretchDib(p, d, end) {
  const { view } = p;
  if (d + 22 > end) {
    return;
  }
  const rop = view.getUint32(d, true);
  const usage = view.getUint16(d + 4, true);
  const sh = view.getInt16(d + 6, true);
  const sw = view.getInt16(d + 8, true);
  const sy = view.getInt16(d + 10, true);
  const sx = view.getInt16(d + 12, true);
  const dh = view.getInt16(d + 14, true);
  const dw = view.getInt16(d + 16, true);
  const dy = view.getInt16(d + 18, true);
  const dx = view.getInt16(d + 20, true);
  const dib = readDib(p, d + 22, end, usage);
  if (dib) {
    playStretchDibits(p, rop, dx, dy, dw, dh, sx, sy, sw, sh, dib);
  }
}
function wmfSetDibToDev(p, d, end) {
  const { view } = p;
  if (d + 18 > end) {
    return;
  }
  const usage = view.getUint16(d, true);
  const scanCount = view.getUint16(d + 2, true);
  const startScan = view.getUint16(d + 4, true);
  const sy = view.getInt16(d + 6, true);
  const sx = view.getInt16(d + 8, true);
  const h = view.getInt16(d + 10, true);
  const w = view.getInt16(d + 12, true);
  const dy = view.getInt16(d + 14, true);
  const dx = view.getInt16(d + 16, true);
  const dib = readDib(p, d + 18, end, usage);
  if (!dib || scanCount === 0) {
    return;
  }
  const dibRows = Math.abs(new DataView(dib.bmi.buffer, dib.bmi.byteOffset, dib.bmi.byteLength).getInt32(8, true));
  if (startScan !== 0 || scanCount < dibRows) {
    return;
  }
  const lo = Math.max(sy, startScan);
  const hi = Math.min(sy + h, startScan + scanCount);
  if (hi <= lo || w <= 0) {
    return;
  }
  const bmi = dib.bmi.slice();
  const hv = new DataView(bmi.buffer);
  const fullH = hv.getInt32(8, true);
  hv.setInt32(8, fullH < 0 ? -scanCount : scanCount, true);
  const [mx, oy] = deviceDest(p, dx, dy, 0, 0);
  const ox = p.layout & 1 ? mx - w : mx;
  playStretchDibits(p, 13369376, ox, oy + (sy + h - hi), w, hi - lo, sx, lo - startScan, w, hi - lo, { bmi, bits: dib.bits }, true);
}

// src/wmf-region.ts
function devicePoint(p, x, y) {
  const m = gdiDeviceMatrix(p.rCtx);
  const fx = Math.round((m[0] * x + m[2] * y) * 16) + Math.round(m[4] * 16);
  const fy = Math.round((m[1] * x + m[3] * y) * 16) + Math.round(m[5] * 16);
  return [Math.floor((fx / p.kx + 8) / 16), Math.floor((fy / p.ky + 8) / 16)];
}
function deviceRect(p, l, t, r, b) {
  const a = devicePoint(p, l, t);
  const c = devicePoint(p, r, b);
  return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])];
}
function canvasRects(p, rects) {
  return rects.map(([l, t, r, b]) => ({ x: l * p.kx, y: t * p.ky, w: (r - l) * p.kx, h: (b - t) * p.ky }));
}
function combineDeviceRects(p, rects, op) {
  flushRasterLayer(p.rCtx);
  const shape = rects.length > 0 ? rectsClipShape(canvasRects(p, rects)) : emptyClipShape();
  gdiCombineClip(p.rCtx, shape, op);
}
function wmfIntersectClipRect(p, l, t, r, b) {
  combineDeviceRects(p, [deviceRect(p, l, t, r, b)], "intersect");
}
function wmfExcludeClipRect(p, l, t, r, b) {
  combineDeviceRects(p, [deviceRect(p, l, t, r, b)], "exclude");
}
function wmfOffsetClipRgn(p, x, y) {
  const { rCtx } = p;
  if (!rCtx.clipRegion) {
    return;
  }
  flushRasterLayer(rCtx);
  const m = gdiDeviceMatrix(rCtx);
  const dx = Math.round(m[0] * x / p.kx) * p.kx;
  const dy = Math.round(m[3] * y / p.ky) * p.ky;
  rCtx.clipRegion = translateClipRegion(rCtx.clipRegion, dx, dy);
  reapplyClipRegion(rCtx, rCtx.clipRegion);
}
function wmfSelectClipRegion(p, slot) {
  const obj = p.objects[slot];
  if (obj?.kind !== "region") {
    flushRasterLayer(p.rCtx);
    p.rCtx.clipRegion = null;
    reapplyClipRegion(p.rCtx, null);
    return;
  }
  combineDeviceRects(p, obj.rects, "replace");
}
function mappedRects(p, region) {
  return region.rects.map(([l, t, r, b]) => deviceRect(p, l, t, r, b)).filter(([l, t, r, b]) => r > l && b > t);
}
function spansOf(p, rects) {
  const spans = new SpanList();
  const rows = /* @__PURE__ */ new Map();
  for (const [l, t, r, b] of rects) {
    const x0 = Math.round(l * p.kx);
    const x1 = Math.round(r * p.kx);
    for (let y = Math.round(t * p.ky); y < Math.round(b * p.ky); y++) {
      let row = rows.get(y);
      if (!row) {
        row = [];
        rows.set(y, row);
      }
      row.push([x0, x1]);
    }
  }
  for (const y of [...rows.keys()].sort((a, b) => a - b)) {
    const row = rows.get(y).sort((a, b) => a[0] - b[0]);
    let [s0, s1] = row[0];
    for (let i = 1; i < row.length; i++) {
      if (row[i][0] <= s1) {
        s1 = Math.max(s1, row[i][1]);
      } else {
        spans.add(y, s0, s1);
        [s0, s1] = row[i];
      }
    }
    spans.add(y, s0, s1);
  }
  return spans;
}
function paintRects(p, rects, brushSlot) {
  const saved = p.brush;
  if (brushSlot !== null) {
    const b = p.objects[brushSlot];
    if (b?.kind !== "brush") {
      return;
    }
    selectBrush(p, b);
  }
  const paint = brushPaint(p.rCtx);
  if (paint) {
    paintSpansDeferred(p.rCtx, spansOf(p, rects), paint, p.rCtx.state.rop2);
  }
  if (brushSlot !== null) {
    selectBrush(p, saved);
  }
}
function regionAt(p, slot) {
  const obj = p.objects[slot];
  return obj?.kind === "region" ? obj : null;
}
function wmfFillRegion(p, regionSlot, brushSlot) {
  const region = regionAt(p, regionSlot);
  if (region) {
    paintRects(p, mappedRects(p, region), brushSlot);
  }
}
function wmfPaintRegion(p, regionSlot) {
  const region = regionAt(p, regionSlot);
  if (region) {
    paintRects(p, mappedRects(p, region), null);
  }
}
function wmfInvertRegion(p, regionSlot) {
  const region = regionAt(p, regionSlot);
  if (region) {
    paintSpansDeferred(p.rCtx, spansOf(p, mappedRects(p, region)), { kind: "solid", rgb: 0 }, 6);
  }
}
function maskOf(rects) {
  if (rects.length === 0) {
    return null;
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [l, t, r, b] of rects) {
    x0 = Math.min(x0, l);
    y0 = Math.min(y0, t);
    x1 = Math.max(x1, r);
    y1 = Math.max(y1, b);
  }
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0 || w * h > 64 * 1024 * 1024) {
    return null;
  }
  const m = new Uint8Array(w * h);
  for (const [l, t, r, b] of rects) {
    for (let y = t; y < b; y++) {
      m.fill(1, (y - y0) * w + (l - x0), (y - y0) * w + (r - x0));
    }
  }
  return { x0, y0, w, h, m };
}
function wmfFrameRegion(p, regionSlot, brushSlot, fh, fw) {
  const region = regionAt(p, regionSlot);
  if (!region) {
    return;
  }
  const m = gdiDeviceMatrix(p.rCtx);
  const dw = Math.abs(Math.round(m[0] * fw / p.kx));
  const dh = Math.abs(Math.round(m[3] * fh / p.ky));
  const mask = maskOf(mappedRects(p, region));
  if (!mask) {
    return;
  }
  const { x0, y0, w, h } = mask;
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? mask.m[y * w + x] : 0;
  const frame2 = [];
  for (let y = 0; y < h; y++) {
    let run = -1;
    for (let x = 0; x <= w; x++) {
      const inside = x < w && at(x, y) === 1;
      const inner = inside && at(x - dw, y) === 1 && at(x + dw, y) === 1 && at(x, y - dh) === 1 && at(x, y + dh) === 1 && at(x - dw, y - dh) === 1 && at(x + dw, y - dh) === 1 && at(x - dw, y + dh) === 1 && at(x + dw, y + dh) === 1;
      const onFrame = inside && !inner;
      if (onFrame && run < 0) {
        run = x;
      } else if (!onFrame && run >= 0) {
        frame2.push([x0 + run, y0 + y, x0 + x, y0 + y + 1]);
        run = -1;
      }
    }
  }
  paintRects(p, frame2, brushSlot);
}

// src/wmf-pixel.ts
function devicePixelSpans(p, x, y) {
  const spans = new SpanList();
  const x0 = Math.round(x * p.kx);
  const x1 = Math.max(x0 + 1, Math.round((x + 1) * p.kx));
  const y0 = Math.round(y * p.ky);
  const y1 = Math.max(y0 + 1, Math.round((y + 1) * p.ky));
  for (let row = y0; row < y1; row++) {
    spans.add(row, x0, x1);
  }
  return spans;
}
function wmfSetPixel(p, x, y, colorRef) {
  const [dx, dy] = deviceRect(p, x, y, x, y);
  paintSpansDeferred(p.rCtx, devicePixelSpans(p, dx, dy), { kind: "solid", rgb: resolveColorRef2(colorRef, p.palette) }, 13);
}
function wmfExtFloodFill(p, x, y, colorRef, type) {
  const { rCtx } = p;
  const { ctx } = rCtx;
  const size = surfaceSize(ctx);
  if (!size || !canReadBack(ctx) || typeof ctx.getImageData !== "function") {
    return;
  }
  const paint = brushPaint(rCtx);
  if (!paint) {
    return;
  }
  flushRasterLayer(rCtx);
  const [dx, dy] = deviceRect(p, x, y, x, y);
  const sx = Math.floor((dx + 0.5) * p.kx);
  const sy = Math.floor((dy + 0.5) * p.ky);
  const { w, h } = size;
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) {
    return;
  }
  const data = canvasGetImageData(ctx, 0, 0, w, h).data;
  const target = resolveColorRef2(colorRef, p.palette);
  const at = (i) => {
    if (data[i * 4 + 3] === 0) {
      return 16777215;
    }
    return data[i * 4] << 16 | data[i * 4 + 1] << 8 | data[i * 4 + 2];
  };
  const surface = type === 1;
  const fillable = (i) => surface ? at(i) === target : at(i) !== target;
  const start = sy * w + sx;
  if (!fillable(start)) {
    return;
  }
  const seen = new Uint8Array(w * h);
  const stack = [start];
  seen[start] = 1;
  while (stack.length > 0) {
    const i = stack.pop();
    const px = i % w;
    const py = (i - px) / w;
    const visit = (j) => {
      if (!seen[j] && fillable(j)) {
        seen[j] = 1;
        stack.push(j);
      }
    };
    if (px > 0) visit(i - 1);
    if (px + 1 < w) visit(i + 1);
    if (py > 0) visit(i - w);
    if (py + 1 < h) visit(i + w);
  }
  const spans = new SpanList();
  for (let row = 0; row < h; row++) {
    let run = -1;
    for (let col = 0; col <= w; col++) {
      const on = col < w && seen[row * w + col] === 1;
      if (on && run < 0) {
        run = col;
      } else if (!on && run >= 0) {
        spans.add(row, run, col);
        run = -1;
      }
    }
  }
  paintSpansDeferred(rCtx, spans, paint, rCtx.state.rop2);
}

// src/wmf-shapes.ts
var PS_NULL3 = 5;
var PS_INSIDEFRAME = 6;
function compatBox(p, l, t, r, b, opts = {}) {
  const exclusive = opts.exclusive !== false;
  const a = fixPoint(p.rCtx, l, t);
  const c = fixPoint(p.rCtx, r, b);
  const ux = 16 * p.kx;
  const uy = 16 * p.ky;
  const box = {
    x0: Math.min(a[0], c[0]),
    y0: Math.min(a[1], c[1]),
    x1: Math.max(a[0], c[0]) - (exclusive ? Math.round(ux) : 0),
    y1: Math.max(a[1], c[1]) - (exclusive ? Math.round(uy) : 0)
  };
  if (!exclusive) {
    return box;
  }
  if (opts.curved && penIsNull(p)) {
    box.x0 -= Math.round(ux / 4);
    box.y0 -= Math.round(uy / 4);
    box.x1 -= Math.round(ux * 3 / 4);
    box.y1 -= Math.round(uy * 3 / 4);
  }
  if ((p.rCtx.state.penStyle & 15) === PS_INSIDEFRAME) {
    const w = Math.round(penDeviceWidth(p.rCtx) / p.kx);
    if (w > 1) {
      box.x0 += Math.round(Math.floor(w / 2) * ux);
      box.y0 += Math.round(Math.floor(w / 2) * uy);
      box.x1 -= Math.round(Math.floor((w - 1) / 2) * ux);
      box.y1 -= Math.round(Math.floor((w - 1) / 2) * uy);
    }
  }
  return box;
}
function fixBoxOf(box) {
  return axisBox(box.x0, box.y0, Math.max(box.x0, box.x1), Math.max(box.y0, box.y1));
}
function canvasRect(box) {
  return { x: box.x0 / 16, y: box.y0 / 16, w: Math.max(0, box.x1 - box.x0) / 16, h: Math.max(0, box.y1 - box.y0) / 16 };
}
function rectInterior(p, box) {
  const { state } = p.rCtx;
  const scale = penScale(p.rCtx);
  if (gdiStrokeAlign(state, scale) === 0 || penLineWidth(state, scale) !== 1) {
    return void 0;
  }
  const r = canvasRect(box);
  if (r.w <= 1 || r.h <= 1) {
    return void 0;
  }
  return (c) => {
    c.beginPath();
    c.rect(r.x + 1, r.y + 1, r.w - 1, r.h - 1);
  };
}
function wmfRectangle(p, l, t, r, b) {
  const box = compatBox(p, l, t, r, b);
  if (box.x1 < box.x0 || box.y1 < box.y0) {
    return;
  }
  const cr = canvasRect(box);
  const { rCtx } = p;
  const { state } = rCtx;
  const penPlain = state.penStyle === PS_NULL3 || (state.penStyle === 0 || state.penStyle === 6) && penIsCosmetic(rCtx);
  if (rCtx.gdiAntialias !== false && penPlain && realizeBrush(state).kind !== "tile" && (rop2Paint(state.rop2).exact || !isExactRop2Bitwise(state.rop2))) {
    const { ctx } = rCtx;
    flushRasterLayer(rCtx);
    applyBrush(ctx, state);
    ctx.fillRect(cr.x, cr.y, cr.w, cr.h);
    applyPen(ctx, state);
    ctx.lineWidth = 1;
    const align = gdiStrokeAlign(state, penScale(rCtx));
    ctx.strokeRect(cr.x + align, cr.y + align, cr.w, cr.h);
    return;
  }
  paintGdiShape(p.rCtx, {
    build: (c) => {
      c.beginPath();
      c.rect(cr.x, cr.y, cr.w, cr.h);
    },
    raster: () => rectRasterPath(fixBoxOf(box), clockwiseOf(p)),
    rectangle: true,
    fill: true,
    stroke: true,
    axisRect: { interior: rectInterior(p, box) }
  });
}
function compatCorner(p, w, h) {
  const m = gdiDeviceMatrix(p.rCtx);
  const cw = Math.round(Math.abs(w * m[0]) * 16);
  const ch = Math.round(Math.abs(h * m[3]) * 16);
  const ux = 16 * p.kx;
  const uy = 16 * p.ky;
  if (!penIsNull(p) && !penIsCosmetic(p.rCtx)) {
    return [Math.round(Math.floor(cw / (2 * ux)) * 2 * ux), Math.round(Math.floor(ch / (2 * uy)) * 2 * uy)];
  }
  return [Math.round(Math.floor(Math.round(cw / ux) / 2) * 2 * ux), Math.round(Math.floor(Math.round(ch / uy) / 2) * 2 * uy)];
}
function wmfRoundRect(p, l, t, r, b, w, h) {
  const box = compatBox(p, l, t, r, b, { curved: true });
  if (box.x1 < box.x0 || box.y1 < box.y0) {
    return;
  }
  const [cw, ch] = compatCorner(p, w, h);
  const cr = canvasRect(box);
  paintGdiShape(p.rCtx, {
    build: (c) => {
      c.beginPath();
      const ex = Math.min(cw / 32, cr.w / 2);
      const ey = Math.min(ch / 32, cr.h / 2);
      if (ex <= 0 || ey <= 0) {
        c.rect(cr.x, cr.y, cr.w, cr.h);
        return;
      }
      const q = Math.PI / 2;
      const right = cr.x + cr.w;
      const bottom = cr.y + cr.h;
      c.moveTo(cr.x + ex, cr.y);
      c.lineTo(right - ex, cr.y);
      c.ellipse(right - ex, cr.y + ey, ex, ey, 0, -q, 0);
      c.lineTo(right, bottom - ey);
      c.ellipse(right - ex, bottom - ey, ex, ey, 0, 0, q);
      c.lineTo(cr.x + ex, bottom);
      c.ellipse(cr.x + ex, bottom - ey, ex, ey, 0, q, 2 * q);
      c.lineTo(cr.x, cr.y + ey);
      c.ellipse(cr.x + ex, cr.y + ey, ex, ey, 0, 2 * q, 3 * q);
      c.closePath();
    },
    raster: () => roundRectRasterPath(fixBoxOf(box), cw, ch, clockwiseOf(p), w === 0 || h === 0),
    roundPen: true,
    fill: true,
    stroke: true
  });
}
function wmfEllipse(p, l, t, r, b) {
  const box = compatBox(p, l, t, r, b, { curved: true });
  if (box.x1 < box.x0 || box.y1 < box.y0) {
    return;
  }
  const cr = canvasRect(box);
  paintGdiShape(p.rCtx, {
    build: (c) => {
      c.beginPath();
      c.ellipse(cr.x + cr.w / 2, cr.y + cr.h / 2, cr.w / 2, cr.h / 2, 0, 0, Math.PI * 2);
    },
    raster: () => ellipseRasterPath(fixBoxOf(box), clockwiseOf(p)),
    roundPen: true,
    fill: true,
    stroke: true
  });
}
function compatArc(p, kind, l, t, r, b, xs, ys, xe, ye) {
  const box = compatBox(p, l, t, r, b, { curved: kind === "chord" || kind === "pie" });
  if (box.x1 < box.x0 || box.y1 < box.y0) {
    return null;
  }
  const raw = compatBox(p, l, t, r, b, { exclusive: false });
  const onBox = (v, r0, r1, b0, b1) => (b0 + b1) / 2 + (r1 !== r0 ? (v - (r0 + r1) / 2) * (b1 - b0) / (r1 - r0) : v - (r0 + r1) / 2);
  const radial = (x, y) => {
    const [fx, fy] = fixPoint(p.rCtx, x, y);
    return [onBox(fx, raw.x0, raw.x1, box.x0, box.x1), onBox(fy, raw.y0, raw.y1, box.y0, box.y1)];
  };
  return { box, s: radial(xs, ys), e: radial(xe, ye) };
}
function wmfArcFamily(p, kind, l, t, r, b, xs, ys, xe, ye) {
  const geom = compatArc(p, kind, l, t, r, b, xs, ys, xe, ye);
  if (!geom) {
    return;
  }
  const { box, s, e } = geom;
  const clockwise = p.rCtx.state.arcDirection === 2;
  const cr = canvasRect(box);
  const cx = cr.x + cr.w / 2;
  const cy = cr.y + cr.h / 2;
  const rx = cr.w / 2 || 1;
  const ry = cr.h / 2 || 1;
  const a0 = Math.atan2((s[1] / 16 - cy) / ry, (s[0] / 16 - cx) / rx);
  const a1 = Math.atan2((e[1] / 16 - cy) / ry, (e[0] / 16 - cx) / rx);
  const fill = kind === "chord" || kind === "pie";
  paintGdiShape(p.rCtx, {
    build: (c) => {
      c.beginPath();
      if (kind === "pie") {
        c.moveTo(cx, cy);
      }
      c.ellipse(cx, cy, cr.w / 2, cr.h / 2, 0, a0, a1, !clockwise);
      if (fill) {
        c.closePath();
      }
    },
    raster: () => arcRasterPath(fixBoxOf(box), s, e, clockwise, kind).path,
    fill,
    stroke: true
  });
}
function clockwiseOf(p) {
  return p.rCtx.state.arcDirection === 2;
}
function penIsNull(p) {
  return (p.rCtx.state.penStyle & 15) === PS_NULL3;
}

// src/wmf-text.ts
function fontAdvances(p, codes) {
  const fonts = p.rCtx.fonts;
  if (!fonts) {
    return null;
  }
  const m = gdiDeviceMatrix(p.rCtx);
  const font = fonts.realize(deviceLogFont(p.rCtx.state, Math.hypot(m[2], m[3]), Math.hypot(m[0], m[1])), p.rCtx.state.fontFamilyMap);
  return font ? codes.map((c) => font.advance(font.glyphIndex(c))) : null;
}
function spacedDx(p, codes) {
  if (p.charExtra === 0 && (p.justifyExtra === 0 || p.justifyCount === 0)) {
    return null;
  }
  const adv = fontAdvances(p, codes);
  if (!adv) {
    return null;
  }
  const m = gdiDeviceMatrix(p.rCtx);
  const kx = Math.hypot(m[0], m[1]) || 1;
  const extraDev = Math.round(p.charExtra * kx);
  const breakChar = 32;
  const count = p.justifyCount;
  const justify = count > 0 ? Math.round(p.justifyExtra * kx) : 0;
  const share = (i) => Math.round((i + 1) * justify / count) - Math.round(i * justify / count);
  let seen = 0;
  return adv.map((a, i) => {
    let d = a + extraDev;
    if (codes[i] === breakChar && count > 0) {
      d += share(seen++);
    }
    return d / kx;
  });
}
function drawWithFontEngine2(p, call, codes, dx) {
  const { rCtx } = p;
  if (!rCtx.fonts) {
    return false;
  }
  flushRasterLayer(rCtx);
  const r = call.rect;
  const adv = drawGdiTextCall(rCtx.ctx, rCtx.fonts, rCtx.state, {
    codes,
    glyphIndices: false,
    x: call.x,
    y: call.y,
    options: call.options,
    rect: r ? { left: r[0], top: r[1], right: r[2], bottom: r[3] } : null,
    dx,
    dy: null,
    matrix: gdiDeviceMatrix(rCtx)
  });
  if (!adv) {
    return false;
  }
  if (rCtx.state.textAlign & 1) {
    rCtx.state.curX += adv.dx;
    rCtx.state.curY += adv.dy;
  }
  return true;
}
function playText(p, call) {
  const charSet = p.rCtx.state.fontDetails?.charSet ?? 1;
  const codes = call.bytes.map((b) => ansiToCode(b, charSet));
  const n = codes.length;
  if (n === 0) {
    return;
  }
  const dx = call.dx ?? spacedDx(p, codes);
  if (drawWithFontEngine2(p, call, codes, dx)) {
    return;
  }
  const w = new EmfRecordWriter(EMR_EXTTEXTOUTW, 76 + n * 6 + 8);
  w.i32(0).i32(0).i32(-1).i32(-1);
  w.u32(1);
  w.f32(1).f32(1);
  w.i32(call.x).i32(call.y);
  w.u32(n);
  const offStringAt = w.offset;
  w.u32(0);
  w.u32(call.options);
  const r = call.rect ?? [0, 0, 0, 0];
  w.i32(r[0]).i32(r[1]).i32(r[2]).i32(r[3]);
  const offDxAt = w.offset;
  w.u32(0);
  w.patchU32(offStringAt, w.offset);
  for (const c of codes) {
    w.u16(c);
  }
  w.align();
  if (dx) {
    w.patchU32(offDxAt, w.offset);
    for (const v of dx) {
      w.u32(Math.round(v) >>> 0);
    }
  }
  playEmfRecord(p.rCtx, w.finish());
}
function wmfTextOut(p, dataOff, recEnd) {
  const { view } = p;
  if (dataOff + 2 > recEnd) {
    return;
  }
  const n = view.getInt16(dataOff, true);
  const strOff = dataOff + 2;
  const posOff = strOff + n + (n & 1);
  if (n <= 0 || posOff + 4 > recEnd) {
    return;
  }
  const bytes = [];
  for (let i = 0; i < n; i++) {
    bytes.push(view.getUint8(strOff + i));
  }
  playText(p, {
    y: view.getInt16(posOff, true),
    x: view.getInt16(posOff + 2, true),
    bytes,
    options: 0,
    rect: null,
    dx: null
  });
}
function wmfExtTextOut(p, dataOff, recEnd) {
  const { view } = p;
  if (dataOff + 8 > recEnd) {
    return;
  }
  const y = view.getInt16(dataOff, true);
  const x = view.getInt16(dataOff + 2, true);
  const n = view.getInt16(dataOff + 4, true);
  const options = view.getUint16(dataOff + 6, true);
  const hasRect = (options & (ETO_OPAQUE | ETO_CLIPPED)) !== 0;
  const strOff = dataOff + 8 + (hasRect ? 8 : 0);
  const rect = hasRect && dataOff + 16 <= recEnd ? [view.getInt16(dataOff + 8, true), view.getInt16(dataOff + 10, true), view.getInt16(dataOff + 12, true), view.getInt16(dataOff + 14, true)] : null;
  const count = Math.max(0, n);
  if (strOff + count > recEnd) {
    return;
  }
  const bytes = [];
  for (let i = 0; i < count; i++) {
    bytes.push(view.getUint8(strOff + i));
  }
  const dxOff = strOff + count + (count & 1);
  let dx = null;
  if (count > 0 && dxOff + count * 2 <= recEnd) {
    dx = [];
    for (let i = 0; i < count; i++) {
      dx.push(view.getInt16(dxOff + i * 2, true));
    }
  }
  if (count === 0) {
    if (rect && options & ETO_OPAQUE) {
      playText(p, { x, y, bytes: [32], options, rect, dx: [0] });
    }
    return;
  }
  playText(p, { x, y, bytes, options, rect, dx });
}

// src/wmf-replay.ts
function createWmfPlayer(view, ctx, header, canvasW, canvasH, replayOptions = {}) {
  const playback = wmfPlayback(view, header);
  const kx = canvasW / playback.width;
  const ky = canvasH / playback.height;
  const state = { ...defaultState(), fontFamilyMap: replayOptions.fontFamilyMap };
  const rCtx = {
    ctx,
    view,
    objectTable: /* @__PURE__ */ new Map(),
    state,
    stateStack: [],
    inPath: false,
    windowOrg: { x: 0, y: 0 },
    windowExt: { cx: 1, cy: 1 },
    viewportOrg: { x: 0, y: 0 },
    viewportExt: { cx: 1, cy: 1 },
    useMappingMode: true,
    clipSaveDepth: 0,
    bounds: { left: 0, top: 0, right: playback.width, bottom: playback.height },
    canvasW,
    canvasH,
    sx: kx,
    sy: ky,
    pathCmds: [],
    gdiAntialias: replayOptions.gdiAntialias,
    fonts: replayOptions.fonts,
    wholeDevicePixels: [kx, ky]
  };
  const p = {
    rCtx,
    view,
    kx,
    ky,
    devW: playback.width,
    devH: playback.height,
    objects: [],
    stack: [],
    mapping: playback.mapping,
    pen: defaultPen(),
    brush: defaultBrush(),
    palette: null,
    textColor: 0,
    bkColor: 16777215,
    charExtra: 0,
    justifyExtra: 0,
    justifyCount: 0,
    layout: 0
  };
  applyWmfMapping(rCtx, p.mapping, kx, ky);
  refreshColors(p);
  return p;
}
function remap(p) {
  applyWmfMapping(p.rCtx, p.mapping, p.kx, p.ky, p.layout & 1 ? p.devW : 0);
}
function saveState(p) {
  return {
    mapping: cloneMapping(p.mapping),
    pen: p.pen,
    brush: p.brush,
    palette: p.palette,
    textColor: p.textColor,
    bkColor: p.bkColor,
    charExtra: p.charExtra,
    justifyExtra: p.justifyExtra,
    justifyCount: p.justifyCount,
    layout: p.layout
  };
}
function playEmfValue(p, type, value) {
  playEmfRecord(p.rCtx, new EmfRecordWriter(type, 16).u32(value).finish());
}
function playPoly16(p, type, count, ptOff) {
  const w = new EmfRecordWriter(type, 28 + count * 4);
  w.i32(0).i32(0).i32(-1).i32(-1).u32(count);
  for (let i = 0; i < count; i++) {
    w.i16(p.view.getInt16(ptOff + i * 4, true)).i16(p.view.getInt16(ptOff + i * 4 + 2, true));
  }
  playEmfRecord(p.rCtx, w.finish());
}
function playWmfRecord(p, recType, offset, recSize) {
  const { view, rCtx } = p;
  const d = offset + 6;
  const end = offset + recSize;
  const has = (bytes) => d + bytes <= end;
  const i16 = (k) => view.getInt16(d + k * 2, true);
  const u16 = (k) => view.getUint16(d + k * 2, true);
  switch (recType) {
    // ---- mapping ----
    case META_SETMAPMODE:
      if (has(2)) {
        setMapMode(p.mapping, u16(0));
        remap(p);
      }
      return;
    case META_SETWINDOWORG:
      if (has(4)) {
        p.mapping.winOrg = { y: i16(0), x: i16(1) };
        remap(p);
      }
      return;
    case META_SETWINDOWEXT:
      if (has(4)) {
        setWindowExt(p.mapping, i16(1), i16(0));
        remap(p);
      }
      return;
    case META_SETVIEWPORTORG:
      if (has(4)) {
        p.mapping.vpOrg = { y: i16(0), x: i16(1) };
        remap(p);
      }
      return;
    case META_SETVIEWPORTEXT:
      if (has(4)) {
        setViewportExt(p.mapping, i16(1), i16(0));
        remap(p);
      }
      return;
    case META_OFFSETWINDOWORG:
      if (has(4)) {
        p.mapping.winOrg = { x: p.mapping.winOrg.x + i16(1), y: p.mapping.winOrg.y + i16(0) };
        remap(p);
      }
      return;
    case META_OFFSETVIEWPORTORG:
      if (has(4)) {
        p.mapping.vpOrg = { x: p.mapping.vpOrg.x + i16(1), y: p.mapping.vpOrg.y + i16(0) };
        remap(p);
      }
      return;
    case META_SCALEWINDOWEXT:
      if (has(8)) {
        scaleWindowExt(p.mapping, i16(3), i16(2), i16(1), i16(0));
        remap(p);
      }
      return;
    case META_SCALEVIEWPORTEXT:
      if (has(8)) {
        scaleViewportExt(p.mapping, i16(3), i16(2), i16(1), i16(0));
        remap(p);
      }
      return;
    // ---- DC state ----
    case META_SAVEDC:
      p.stack.push(saveState(p));
      playEmfRecord(rCtx, new EmfRecordWriter(EMR_SAVEDC, 8).finish());
      return;
    case META_RESTOREDC: {
      let rel = has(2) ? i16(0) : -1;
      const depth = p.stack.length;
      if (rel < 0) {
        rel = depth + rel + 1;
      }
      if (rel < 1 || rel > depth) {
        return;
      }
      const saved = p.stack[rel - 1];
      p.stack.length = rel - 1;
      playEmfRecord(rCtx, new EmfRecordWriter(EMR_RESTOREDC, 12).i32(rel).finish());
      Object.assign(p, { ...saved, mapping: cloneMapping(saved.mapping) });
      remap(p);
      refreshColors(p);
      return;
    }
    case META_SETTEXTCOLOR:
      if (has(4)) {
        p.textColor = readColorRefRaw(view, d);
        rCtx.state.textColor = colorCss(p, p.textColor);
      }
      return;
    case META_SETBKCOLOR:
      if (has(4)) {
        p.bkColor = readColorRefRaw(view, d);
        rCtx.state.bkColor = colorCss(p, p.bkColor);
      }
      return;
    case META_SETBKMODE:
      if (has(2)) {
        playEmfValue(p, EMR_SETBKMODE, u16(0));
      }
      return;
    case META_SETROP2:
      if (has(2)) {
        playEmfValue(p, EMR_SETROP2, u16(0));
      }
      return;
    case META_SETPOLYFILLMODE:
      if (has(2)) {
        playEmfValue(p, EMR_SETPOLYFILLMODE, u16(0));
      }
      return;
    case META_SETSTRETCHBLTMODE:
      if (has(2)) {
        playEmfValue(p, EMR_SETSTRETCHBLTMODE, u16(0));
      }
      return;
    case META_SETTEXTALIGN:
      if (has(2)) {
        playEmfValue(p, EMR_SETTEXTALIGN, u16(0));
      }
      return;
    case META_SETTEXTCHAREXTRA:
      if (has(2)) {
        p.charExtra = i16(0);
      }
      return;
    case META_SETTEXTJUSTIFICATION:
      if (has(4)) {
        p.justifyCount = i16(0);
        p.justifyExtra = i16(1);
      }
      return;
    case META_SETLAYOUT:
      if (has(4)) {
        p.layout = view.getUint32(d, true);
        remap(p);
      }
      return;
    case META_SETRELABS:
    case META_SETMAPPERFLAGS:
    case META_ESCAPE:
    case META_REALIZEPALETTE:
      return;
    // ---- objects ----
    case META_CREATEPENINDIRECT:
      createPen(p, d, recSize);
      return;
    case META_CREATEBRUSHINDIRECT:
      createBrush(p, d, recSize);
      return;
    case META_CREATEFONTINDIRECT:
      createFont(p, d, recSize, end);
      return;
    case META_DIBCREATEPATTERNBRUSH:
      createDibPatternBrush(p, d, end);
      return;
    case META_CREATEPATTERNBRUSH:
      return;
    case META_CREATEPALETTE:
      createPalette(p, d, end);
      return;
    case META_CREATEREGION:
      createRegion(p, d, end);
      return;
    case META_CREATEBRUSH:
    case META_CREATEBITMAP:
    case META_CREATEBITMAPINDIRECT:
      addObject(p, { kind: "other" });
      return;
    case META_SELECTOBJECT:
      if (has(2)) {
        const obj = p.objects[u16(0)];
        if (obj?.kind === "region") {
          wmfSelectClipRegion(p, u16(0));
        } else {
          selectObject(p, u16(0));
        }
      }
      return;
    case META_SELECTPALETTE:
      if (has(2)) {
        selectPalette(p, u16(0));
      }
      return;
    case META_SETPALENTRIES:
      setPaletteEntries(p, d, end, false);
      return;
    case META_ANIMATEPALETTE:
      setPaletteEntries(p, d, end, true);
      return;
    case META_RESIZEPALETTE:
      if (has(2)) {
        resizePalette(p, u16(0));
      }
      return;
    case META_DELETEOBJECT:
      if (has(2)) {
        deleteObject(p, u16(0));
      }
      return;
    // ---- lines and shapes ----
    case META_MOVETO:
      if (has(4)) {
        playEmfRecord(rCtx, new EmfRecordWriter(EMR_MOVETOEX, 16).i32(i16(1)).i32(i16(0)).finish());
      }
      return;
    case META_LINETO:
      if (has(4)) {
        playEmfRecord(rCtx, new EmfRecordWriter(EMR_LINETO, 16).i32(i16(1)).i32(i16(0)).finish());
      }
      return;
    case META_RECTANGLE:
      if (has(8)) {
        wmfRectangle(p, i16(3), i16(2), i16(1), i16(0));
      }
      return;
    case META_ROUNDRECT:
      if (has(12)) {
        wmfRoundRect(p, i16(5), i16(4), i16(3), i16(2), i16(1), i16(0));
      }
      return;
    case META_ELLIPSE:
      if (has(8)) {
        wmfEllipse(p, i16(3), i16(2), i16(1), i16(0));
      }
      return;
    case META_ARC:
    case META_CHORD:
    case META_PIE:
      if (has(16)) {
        const kind = recType === META_ARC ? "arc" : recType === META_CHORD ? "chord" : "pie";
        wmfArcFamily(p, kind, i16(7), i16(6), i16(5), i16(4), i16(3), i16(2), i16(1), i16(0));
      }
      return;
    case META_POLYGON:
    case META_POLYLINE:
      if (has(2)) {
        const count = i16(0);
        if (count > 0 && has(2 + count * 4)) {
          playPoly16(p, recType === META_POLYGON ? EMR_POLYGON16 : EMR_POLYLINE16, count, d + 2);
        }
      }
      return;
    case META_POLYPOLYGON:
      if (has(2)) {
        const n = u16(0);
        if (n === 0 || !has(2 + n * 2)) {
          return;
        }
        const counts = [];
        let total = 0;
        for (let i = 0; i < n; i++) {
          const c = view.getUint16(d + 2 + i * 2, true);
          counts.push(c);
          total += c;
        }
        const ptOff = d + 2 + n * 2;
        if (!has(2 + n * 2 + total * 4)) {
          return;
        }
        const w = new EmfRecordWriter(EMR_POLYPOLYGON16, 32 + n * 4 + total * 4);
        w.i32(0).i32(0).i32(-1).i32(-1).u32(n).u32(total);
        for (const c of counts) {
          w.u32(c);
        }
        for (let i = 0; i < total; i++) {
          w.i16(view.getInt16(ptOff + i * 4, true)).i16(view.getInt16(ptOff + i * 4 + 2, true));
        }
        playEmfRecord(rCtx, w.finish());
      }
      return;
    // ---- text ----
    case META_TEXTOUT:
      wmfTextOut(p, d, end);
      return;
    case META_EXTTEXTOUT:
      wmfExtTextOut(p, d, end);
      return;
    // ---- bitmaps ----
    case META_PATBLT:
      wmfPatBlt(p, d, end);
      return;
    case META_BITBLT:
    case META_STRETCHBLT:
      wmfBitBlt(p, recType === META_STRETCHBLT, offset, recSize);
      return;
    case META_DIBBITBLT:
    case META_DIBSTRETCHBLT:
      wmfDibBitBlt(p, recType === META_DIBSTRETCHBLT, offset, recSize);
      return;
    case META_STRETCHDIB:
      wmfStretchDib(p, d, end);
      return;
    case META_SETDIBTODEV:
      wmfSetDibToDev(p, d, end);
      return;
    // ---- clipping and regions ----
    case META_INTERSECTCLIPRECT:
      if (has(8)) {
        wmfIntersectClipRect(p, i16(3), i16(2), i16(1), i16(0));
      }
      return;
    case META_EXCLUDECLIPRECT:
      if (has(8)) {
        wmfExcludeClipRect(p, i16(3), i16(2), i16(1), i16(0));
      }
      return;
    case META_OFFSETCLIPRGN:
      if (has(4)) {
        wmfOffsetClipRgn(p, i16(1), i16(0));
      }
      return;
    case META_SELECTCLIPREGION:
      if (has(2)) {
        wmfSelectClipRegion(p, u16(0));
      }
      return;
    case META_FILLREGION:
      if (has(4)) {
        wmfFillRegion(p, u16(0), u16(1));
      }
      return;
    case META_PAINTREGION:
      if (has(2)) {
        wmfPaintRegion(p, u16(0));
      }
      return;
    case META_INVERTREGION:
      if (has(2)) {
        wmfInvertRegion(p, u16(0));
      }
      return;
    case META_FRAMEREGION:
      if (has(8)) {
        wmfFrameRegion(p, u16(0), u16(1), i16(2), i16(3));
      }
      return;
    // ---- pixels ----
    case META_SETPIXEL:
      if (has(8)) {
        wmfSetPixel(p, i16(3), i16(2), readColorRefRaw(view, d));
      }
      return;
    case META_FLOODFILL:
      if (has(8)) {
        wmfExtFloodFill(p, i16(3), i16(2), readColorRefRaw(view, d), 0);
      }
      return;
    case META_EXTFLOODFILL:
      if (has(10)) {
        wmfExtFloodFill(p, i16(4), i16(3), readColorRefRaw(view, d + 2), u16(0));
      }
      return;
    default:
      return;
  }
}
function replayWmfRecords(view, ctx, header, canvasW, canvasH, replayOptions = {}) {
  const p = createWmfPlayer(view, ctx, header, canvasW, canvasH, replayOptions);
  let offset = header.headerSize;
  const maxOffset = view.byteLength;
  const maxRecords = replayOptions.maxRecords ?? MAX_RECORDS_DEFAULT;
  let recordCount = 0;
  while (offset + 6 <= maxOffset && recordCount < maxRecords) {
    const recSize = view.getUint32(offset, true) * 2;
    const recType = view.getUint16(offset + 4, true);
    if (recSize < 6 || offset + recSize > maxOffset || recType === META_EOF) {
      break;
    }
    recordCount++;
    playWmfRecord(p, recType, offset, recSize);
    offset += recSize;
  }
  flushRasterLayer(p.rCtx);
  let open = p.rCtx.clipSaveDepth + p.rCtx.stateStack.length;
  while (open-- > 0) {
    ctx.restore();
  }
  if (recordCount >= maxRecords) {
    console.warn(`[emf-converter] WMF record limit reached (${maxRecords}). Output may be incomplete.`);
  }
}

// src/emf-converter.ts
var MAX_METAFILE_RECURSION = 3;
async function replayMetafile(buffer, options, createSurface) {
  emfLog(`replayMetafile: input buffer ${buffer.byteLength} bytes`);
  if (buffer.byteLength >= 16) {
    const hdrBytes = new Uint8Array(buffer, 0, 16);
    emfLog(
      `replayMetafile: first 16 bytes: [${Array.from(hdrBytes).map((b) => b.toString(16).padStart(2, "0")).join(" ")}]`
    );
  }
  const opts = options ?? {};
  const dpiScale = opts.dpiScale ?? DEFAULT_DPI_SCALE;
  let view = new DataView(buffer);
  let emfHeader = null;
  try {
    emfHeader = parseEmfHeader(view);
  } catch (err) {
    emfWarn("replayMetafile: parseEmfHeader threw during detection:", err instanceof Error ? err.message : err);
  }
  if (!emfHeader) {
    try {
      const wmfHeader = parseWmfHeader(view);
      const embedded = wmfHeader ? extractEmbeddedEmf(view, wmfHeader.headerSize) : null;
      if (embedded) {
        const embeddedView = new DataView(embedded);
        emfHeader = parseEmfHeader(embeddedView);
        if (emfHeader) {
          emfLog("replayMetafile: WMF carries an embedded EMF; playing the EMF");
          view = embeddedView;
        }
      }
    } catch (err) {
      emfWarn("replayMetafile: embedded-EMF probe threw:", err instanceof Error ? err.message : err);
    }
  }
  if (emfHeader) {
    try {
      const textureCache = await preDecodeEmfPlusTextures(view);
      const imageCache = await preDecodeEmfPlusImages(view);
      const renderBounds = getRenderableEmfBounds(emfHeader);
      if (!renderBounds) {
        emfLog("replayMetafile: getRenderableEmfBounds returned null");
        return null;
      }
      const surface = createSurface(
        renderBounds.right - renderBounds.left,
        renderBounds.bottom - renderBounds.top
      );
      if (!surface) {
        emfLog("replayMetafile: surface creation failed");
        return null;
      }
      surface.ctx.save();
      const deferredImages = replayEmfRecords(
        view,
        surface.ctx,
        renderBounds,
        surface.width,
        surface.height,
        dpiScale,
        {
          maxRecords: opts.maxRecords,
          maxRecordsEmfPlus: opts.maxRecords,
          fontFamilyMap: opts.fontFamilyMap,
          textureCache,
          imageCache,
          gdiAntialias: opts.gdiAntialias,
          fonts: fontCollection(opts)
        }
      );
      surface.ctx.restore();
      emfLog(`replayMetafile: EMF replay done, ${deferredImages.length} deferred images`);
      return { surface, deferredImages };
    } catch (err) {
      emfWarn("replayMetafile: EMF EXCEPTION:", err instanceof Error ? err.message : err);
      console.warn("[emf-converter] EMF conversion failed:", err instanceof Error ? err.message : err);
      return null;
    }
  }
  try {
    const header = parseWmfHeader(view);
    if (!header) {
      emfLog("replayMetafile: parseWmfHeader returned null");
      return null;
    }
    if (header.boundsRight - header.boundsLeft <= 0 || header.boundsBottom - header.boundsTop <= 0) {
      emfLog("replayMetafile: invalid WMF dimensions");
      return null;
    }
    const playback = wmfPlayback(view, header);
    const surface = createSurface(playback.width, playback.height);
    if (!surface) {
      return null;
    }
    surface.ctx.save();
    replayWmfRecords(view, surface.ctx, header, surface.width, surface.height, {
      maxRecords: opts.maxRecords,
      fontFamilyMap: opts.fontFamilyMap,
      gdiAntialias: opts.gdiAntialias,
      fonts: fontCollection(opts)
    });
    surface.ctx.restore();
    return { surface, deferredImages: [] };
  } catch (err) {
    emfWarn("replayMetafile: WMF EXCEPTION:", err instanceof Error ? err.message : err);
    console.warn("[emf-converter] WMF conversion failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
function fontCollection(opts) {
  if (!opts.fonts || opts.fonts.length === 0) {
    return void 0;
  }
  const collection = GdiFontCollection.for(opts.fonts, opts.fontSmoothing ?? "cleartype");
  return collection.size > 0 ? collection : void 0;
}
function toPlainBuffer(data) {
  const plain = new ArrayBuffer(data.byteLength);
  new Uint8Array(plain).set(new Uint8Array(data));
  return plain;
}
function drawResampledImage(ctx, decoded, spec) {
  const canvas = ctx.canvas;
  const surfaceW = canvas?.width;
  const surfaceH = canvas?.height;
  if (typeof surfaceW !== "number" || typeof surfaceH !== "number") {
    return false;
  }
  const { width, height } = decoded;
  const source = createTempCanvas(width, height);
  if (!source) {
    return false;
  }
  canvasDrawImage(source.ctx, decoded.drawable, 0, 0, width, height);
  const pixels = canvasGetImageData(source.ctx, 0, 0, width, height);
  const block = resampleImage(pixels.data, width, height, spec, { w: surfaceW, h: surfaceH });
  if (!block) {
    return false;
  }
  const out = createTempCanvas(block.w, block.h);
  if (!out) {
    return false;
  }
  canvasPutImageData(out.ctx, createImageDataCompat(block.rgba, block.w, block.h), 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  canvasDrawImage(ctx, out.canvas, block.x, block.y, block.w, block.h);
  ctx.restore();
  return true;
}
async function processDeferredImages(ctx, deferredImages, recursionDepth) {
  emfLog(`processDeferredImages: ${deferredImages.length} deferred images (recursionDepth=${recursionDepth})`);
  let complete = true;
  for (let idx = 0; idx < deferredImages.length; idx++) {
    const img = deferredImages[idx];
    try {
      const plainBuffer = toPlainBuffer(img.imageData);
      ctx.setTransform(...img.transform);
      let bytes = plainBuffer;
      let mime;
      if (img.isMetafile) {
        if (recursionDepth >= MAX_METAFILE_RECURSION) {
          emfWarn(`  Deferred image [${idx}]: skipping embedded metafile, recursion depth ${recursionDepth}`);
          continue;
        }
        const metafileDataUrl = await convertMetafileToDataUrl(plainBuffer, void 0, recursionDepth + 1);
        if (!metafileDataUrl) {
          emfWarn(`  Deferred image [${idx}]: metafile conversion returned null`);
          complete = false;
          continue;
        }
        const byteString = atob(metafileDataUrl.split(",")[1]);
        mime = metafileDataUrl.match(/data:([^;]+)/)?.[1] ?? "image/png";
        bytes = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(bytes);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
      }
      const decoded = await decodeDeferredImageBytes(bytes, mime);
      if (decoded) {
        if (!(img.resample && drawResampledImage(ctx, decoded, img.resample))) {
          canvasDrawImage(ctx, decoded.drawable, img.dx, img.dy, img.dw, img.dh);
        }
        decoded.close();
      } else {
        emfWarn(`  Deferred image [${idx}]: no image decoder available`);
        complete = false;
      }
    } catch (imgErr) {
      complete = false;
      const errMsg = imgErr instanceof Error ? imgErr.message : String(imgErr);
      console.warn(
        "[emf-converter] Deferred image draw failed:",
        errMsg,
        `(isMetafile=${img.isMetafile}, dataLen=${img.imageData.byteLength})`
      );
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return complete;
}
async function convertMetafileToDataUrl(buffer, options, recursionDepth = 0) {
  await ensureNodeCanvasModule();
  if (recursionDepth > MAX_METAFILE_RECURSION) {
    return null;
  }
  const opts = { ...options, gdiAntialias: options?.gdiAntialias ?? false };
  let canvas = null;
  const result = await replayMetafile(buffer, opts, (w, h) => {
    const setup = createCanvas(
      w,
      h,
      opts.maxWidth,
      opts.maxHeight,
      opts.dpiScale ?? DEFAULT_DPI_SCALE,
      opts.maxCanvasDimension
    );
    if (!setup) {
      return null;
    }
    canvas = setup.canvas;
    return { ctx: setup.ctx, width: setup.canvas.width, height: setup.canvas.height };
  });
  if (!result || !canvas) {
    return null;
  }
  try {
    const complete = await processDeferredImages(result.surface.ctx, result.deferredImages, recursionDepth);
    const soft = canvas instanceof SoftwareRasterCanvas ? canvas : null;
    if (soft && (soft.textDraws > 0 || !complete)) {
      emfWarn(
        `convertMetafileToDataUrl: no canvas backend and the drawing ${soft.textDraws > 0 ? `contains text (${soft.textDraws} runs)` : "contains an image only a canvas can decode"}; install @napi-rs/canvas for PNG output, or use SVG output`
      );
      return null;
    }
    const url = await exportCanvasToPngDataUrl(canvas);
    if (!url) {
      emfWarn("convertMetafileToDataUrl: exportCanvasToPngDataUrl returned null");
    }
    return url;
  } catch (err) {
    emfWarn("convertMetafileToDataUrl: EXCEPTION:", err instanceof Error ? err.message : err);
    console.warn("[emf-converter] Conversion failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
var svgDocumentCounter = 0;
async function decodeToRgba(bytes) {
  const builtIn = await decodeImageBytesBuiltIn(new Uint8Array(bytes));
  if (builtIn || usingSoftwareCanvas()) {
    return builtIn;
  }
  const decoded = await decodeDeferredImageBytes(bytes);
  if (!decoded) {
    return null;
  }
  try {
    const temp = createTempCanvas(decoded.width, decoded.height);
    if (!temp) {
      return null;
    }
    canvasDrawImage(temp.ctx, decoded.drawable, 0, 0, decoded.width, decoded.height);
    const px = canvasGetImageData(temp.ctx, 0, 0, decoded.width, decoded.height);
    return { data: px.data, width: decoded.width, height: decoded.height };
  } finally {
    decoded.close();
  }
}
async function resampleExact(bytes, spec, surface) {
  const pixels = await decodeToRgba(bytes);
  if (!pixels) {
    return null;
  }
  return resampleImage(pixels.data, pixels.width, pixels.height, spec, { w: surface.width, h: surface.height });
}
async function processDeferredImagesSvg(svg, deferredImages, options, recursionDepth) {
  for (let idx = 0; idx < deferredImages.length; idx++) {
    const img = deferredImages[idx];
    try {
      const bytes = toPlainBuffer(img.imageData);
      let payload = null;
      if (img.isMetafile) {
        if (recursionDepth >= MAX_METAFILE_RECURSION) {
          emfWarn(`  Deferred image [${idx}]: skipping embedded metafile, recursion depth ${recursionDepth}`);
          continue;
        }
        const nested = await convertMetafileToSvgTree(
          bytes,
          { ...options, includeSize: true, idPrefix: void 0 },
          recursionDepth + 1
        );
        if (nested) {
          payload = { kind: "url", url: svgTreeToDataUrl(nested) };
        }
      } else {
        const u8 = new Uint8Array(bytes);
        const mime = sniffImageMime(u8);
        if (mime) {
          payload = { kind: "encoded", bytes: u8, mime };
        } else {
          payload = decodeBmpFile(bytes);
          if (!payload) {
            const decoded = await decodeDeferredImageBytes(bytes);
            if (decoded) {
              const temp = createCanvas(decoded.width, decoded.height, void 0, void 0, 1);
              if (temp) {
                canvasDrawImage(temp.ctx, decoded.drawable, 0, 0, decoded.width, decoded.height);
                const px = temp.ctx.getImageData(0, 0, decoded.width, decoded.height);
                payload = {
                  kind: "rgba",
                  data: px.data,
                  width: decoded.width,
                  height: decoded.height
                };
              }
              decoded.close();
            }
          }
        }
      }
      if (!payload) {
        emfWarn(`  Deferred image [${idx}]: unsupported image data for SVG output`);
        continue;
      }
      const slot = img.svgSlot ?? svg.reserveSlot();
      if (img.resample && options.imageResampling === "exact" && !img.isMetafile) {
        const block = await resampleExact(bytes, img.resample, svg.canvas);
        if (block) {
          svg.fillSlot(slot, { kind: "rgba", data: block.rgba, width: block.w, height: block.h }, [1, 0, 0, 1, 0, 0], block.x, block.y, block.w, block.h);
          continue;
        }
        emfWarn(`  Deferred image [${idx}]: exact resampling unavailable (image not decodable here); renderer scaling used`);
      }
      const natural = img.resample ? payloadSize(payload) : null;
      if (img.resample && natural) {
        const r = img.resample;
        svg.fillSlotCropped(slot, payload, r.toDevice, natural, r.srcX, r.srcY, r.srcW, r.srcH);
      } else {
        svg.fillSlot(slot, payload, img.transform, img.dx, img.dy, img.dw, img.dh);
      }
    } catch (err) {
      emfWarn(`  Deferred image [${idx}]: SVG embed failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
async function convertMetafileToSvgTree(buffer, options, recursionDepth = 0) {
  const svg = await replayToSvgContext(buffer, options, recursionDepth);
  return svg ? svg.toTree({ includeSize: options?.includeSize }) : null;
}
async function replayToSvgContext(buffer, options, recursionDepth = 0) {
  await ensureNodeCanvasModule();
  if (recursionDepth > MAX_METAFILE_RECURSION) {
    return null;
  }
  const opts = options ?? {};
  const dpiScale = opts.dpiScale ?? DEFAULT_DPI_SCALE;
  const idPrefix = opts.idPrefix ?? `emf${++svgDocumentCounter}-`;
  let svg = null;
  const result = await replayMetafile(buffer, opts, (lw, lh) => {
    const size = computeSurfaceSize(lw, lh, opts.maxWidth, opts.maxHeight, dpiScale, opts.maxCanvasDimension);
    const shadow = opts.exactRasterOps === false ? null : createCanvas(lw, lh, opts.maxWidth, opts.maxHeight, dpiScale, opts.maxCanvasDimension)?.ctx ?? null;
    svg = new SvgContext(size.w, size.h, { shadow, idPrefix, imageResampling: opts.imageResampling });
    return { ctx: svg, width: size.w, height: size.h };
  });
  if (!result || !svg) {
    return null;
  }
  const target = svg;
  await processDeferredImagesSvg(target, result.deferredImages, opts, recursionDepth);
  return target;
}
async function convertMetafileToSvg(buffer, options) {
  const tree = await convertMetafileToSvgTree(buffer, options);
  return tree ? svgTreeToString(tree) : null;
}
async function convertMetafileToSvgDataUrl(buffer, options) {
  const markup = await convertMetafileToSvg(buffer, options);
  return markup ? svgMarkupToDataUrl(markup) : null;
}

// src/load-system-fonts.ts
var FONT_FILE = /\.(ttf|ttc|fon|fnt)$/i;
async function loadSystemFonts(options = {}) {
  if (typeof process === "undefined" || !process.versions?.node) {
    return [];
  }
  let fs;
  let path;
  let os;
  try {
    fs = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      'fs/promises'
    );
    path = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      'path'
    );
    os = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      'os'
    );
  } catch {
    return [];
  }
  const dirs = options.dirs ?? defaultFontDirs(path, os);
  const maxDepth = options.maxDepth ?? 4;
  const files = [];
  const seen = /* @__PURE__ */ new Set();
  const walk2 = async (dir, depth) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (depth < maxDepth) {
          await walk2(full, depth + 1);
        }
      } else if (FONT_FILE.test(e.name)) {
        const key = full.toLowerCase();
        if (!seen.has(key) && (!options.filter || options.filter(full, e.name.toLowerCase()))) {
          seen.add(key);
          files.push(full);
        }
      }
    }
  };
  for (const d of dirs) {
    await walk2(d, 0);
  }
  const out = [];
  for (const f of files) {
    try {
      out.push(new Uint8Array(await fs.readFile(f)));
    } catch {
    }
  }
  return out;
}
function defaultFontDirs(path, os) {
  const home = os.homedir();
  if (process.platform === "win32") {
    const win = process.env.WINDIR ?? process.env.SystemRoot ?? "C:\\Windows";
    const dirs = [path.join(win, "Fonts")];
    if (process.env.LOCALAPPDATA) {
      dirs.push(path.join(process.env.LOCALAPPDATA, "Microsoft", "Windows", "Fonts"));
    }
    return dirs;
  }
  if (process.platform === "darwin") {
    return ["/Library/Fonts", "/System/Library/Fonts", path.join(home, "Library", "Fonts")];
  }
  return ["/usr/share/fonts", "/usr/local/share/fonts", path.join(home, ".fonts"), path.join(home, ".local", "share", "fonts")];
}

export { DEFAULT_DPI_SCALE, convertMetafileToDataUrl, convertMetafileToSvg, convertMetafileToSvgDataUrl, convertMetafileToSvgTree, loadSystemFonts, svgTreeToDataUrl, svgTreeToJsx, svgTreeToReact, svgTreeToString };
