// Preserve inline RTF pictures while OpenDocument.core parses the body text.
// Body text stays with the engine; CP949 byte runs are normalized to Unicode
// because this WASM build cannot decode the Korean multibyte encoding reliably.
// Binary payloads must be skipped by length: they can contain braces/backslashes.
const encoder = new TextEncoder();
const hiddenDestinations = new Set(('fonttbl filetbl colortbl stylesheet listtable listoverridetable revtbl rsidtbl info '
  + 'header headerl headerr headerf footer footerl footerr footerf footnote annotation atnauthor atndate atnid '
  + 'atnparent atnref atntime atnicn xe tc txe bkmkstart bkmkend fldinst nonshppict object objdata result do shptxt '
  + 'falt fname ffname panose keycode mmath factoidname datafield template private').split(' '));
const imageTypes = { pngblip: 'image/png', jpegblip: 'image/jpeg', emfblip: 'image/emf', wmetafile: 'image/wmf' };
const isLetter = n => n >= 65 && n <= 90 || n >= 97 && n <= 122;
const isDigit = n => n >= 48 && n <= 57;
const hexValue = n => n >= 48 && n <= 57 ? n - 48 : n >= 65 && n <= 70 ? n - 55 : n >= 97 && n <= 102 ? n - 87 : -1;
const koreanDecoder = new TextDecoder('euc-kr');
function koreanRun(bytes, start) {
  const run = [];
  let end = start;
  while (end < bytes.length) {
    const c = bytes[end];
    if (c === 92 && bytes[end + 1] === 39) {
      const a = hexValue(bytes[end + 2]), b = hexValue(bytes[end + 3]);
      if (a < 0 || b < 0) throw new Error('RTF 문자 데이터가 올바르지 않습니다.');
      run.push(a * 16 + b); end += 4;
    } else if ([123, 125, 92].includes(c)) break;
    else { if (c !== 10 && c !== 13) run.push(c); end++; }
  }
  if (!run.some(n => n >= 128)) return { end };
  const text = koreanDecoder.decode(new Uint8Array(run));
  let escaped = '{\\uc0 ';
  for (let n = 0; n < text.length; n++) {
    const unit = text.charCodeAt(n); escaped += '\\u' + (unit > 32767 ? unit - 65536 : unit) + ' ';
  }
  return { start, end, bytes: encoder.encode(escaped + '}') };
}

export function prepareRtfPictures(bytes) {
  const empty = { bytes, pictures: [], prefix: '' };
  if (bytes.length < 6 || String.fromCharCode(...bytes.subarray(0, 6)) !== '{\\rtf1') return empty;
  const stack = [], replacements = [], pictures = [];
  const prefix = 'FREADERPICT' + [...crypto.getRandomValues(new Uint32Array(4))].map(n => n.toString(16).padStart(8, '0')).join('') + 'X';
  let i = 0;
  while (i < bytes.length) {
    const offset = i, c = bytes[i++];
    if (c === 123) {
      if (stack.length >= 1024) throw new Error('RTF 문서 구조가 너무 깊습니다.');
      const parent = stack.at(-1);
      if (parent) parent.skip = 0;
      stack.push({ start: offset, parent, hidden: parent?.hidden || false, destination: null, tokens: [], image: null,
        codepage: parent?.codepage || 1252, uc: parent?.uc ?? 1, skip: 0 });
      continue;
    }
    const frame = stack.at(-1);
    if (c === 125) {
      if (!frame) throw new Error('RTF 문서의 괄호 구조가 올바르지 않습니다.');
      if (frame.image) {
        const image = frame.image;
        if (image.highNibble !== null) throw new Error('RTF 그림 데이터가 잘렸습니다.');
        const data = new Uint8Array(image.length);
        let cursor = 0;
        for (const chunk of image.chunks) { data.set(chunk, cursor); cursor += chunk.length; }
        const index = pictures.length, token = prefix + index + 'END';
        pictures.push({ token, path: 'freader-rtf/image-' + index, bytes: data, mimeType: image.mimeType, width: image.width, height: image.height, scaleX: image.scaleX, scaleY: image.scaleY });
        const target = frame.parent?.destination === 'shppict' ? frame.parent : frame;
        target.tokens.push(token);
      }
      if (frame.tokens.length) replacements.push({ start: frame.start, end: i, bytes: encoder.encode('{' + frame.tokens.join(' ') + '}') });
      stack.pop();
      if (frame.parent) frame.parent.skip = 0;
      continue;
    }
    if (c === 92) {
      if (i >= bytes.length) throw new Error('RTF 제어 문자가 잘렸습니다.');
      if (!isLetter(bytes[i])) {
        const symbol = bytes[i++];
        if (frame && !frame.hidden && !frame.image && frame.codepage === 949 && !frame.skip && symbol === 39) {
          const change = koreanRun(bytes, offset); i = change.end;
          if (change.bytes) replacements.push(change);
          continue;
        }
        if (symbol === 42 && frame) frame.hidden = true;
        if (symbol === 39) i += 2; // Escaped character, never a group delimiter.
        if (frame?.skip) frame.skip--;
        if (i > bytes.length) throw new Error('RTF 문자 데이터가 잘렸습니다.');
        continue;
      }
      const start = i;
      while (i < bytes.length && isLetter(bytes[i])) i++;
      if (i - start > 64) throw new Error('RTF 제어 문자가 너무 깁니다.');
      const word = String.fromCharCode(...bytes.subarray(start, i));
      let sign = 1, value = null;
      if (bytes[i] === 45) { sign = -1; i++; }
      if (isDigit(bytes[i])) {
        value = 0;
        while (i < bytes.length && isDigit(bytes[i])) { value = value * 10 + bytes[i++] - 48; }
        value *= sign;
        if (!Number.isSafeInteger(value)) throw new Error('RTF 숫자 값이 올바르지 않습니다.');
      }
      if (bytes[i] === 32) i++;
      const skipped = frame?.skip > 0;
      if (skipped) frame.skip--;
      else if (frame) {
        if (word === 'ansicpg') frame.codepage = value;
        if (word === 'uc') frame.uc = Math.max(0, value || 0);
        if (word === 'u') frame.skip = frame.uc;
      }
      if (frame && !frame.destination) {
        frame.destination = word;
        if (word === 'shppict') frame.hidden = frame.parent?.hidden || false;
      }
      if (frame && hiddenDestinations.has(word)) frame.hidden = true;
      if (word === 'pict' && frame && !frame.hidden) {
        frame.image = { chunks: [], length: 0, highNibble: null, mimeType: 'application/octet-stream', width: 0, height: 0, scaleX: 100, scaleY: 100 };
      }
      const image = frame?.image;
      if (image) {
        if (imageTypes[word]) image.mimeType = imageTypes[word];
        if (word === 'picwgoal') image.width = value;
        if (word === 'pichgoal') image.height = value;
        if (word === 'picscalex') image.scaleX = value;
        if (word === 'picscaley') image.scaleY = value;
      }
      if (word === 'bin') {
        if (value === null || value < 0 || value > bytes.length - i) throw new Error('RTF 그림의 바이너리 데이터가 잘렸습니다.');
        if (image) {
          if (image.highNibble !== null) throw new Error('RTF 그림 데이터가 올바르지 않습니다.');
          image.chunks.push(bytes.subarray(i, i + value)); image.length += value;
        }
        i += value;
      }
      continue;
    }
    // Hex picture bytes occur only in the pict group itself, not nested metadata.
    if (frame?.image) {
      const image = frame.image;
      const start = offset;
      while (i < bytes.length && ![123, 125, 92].includes(bytes[i])) i++;
      const decoded = new Uint8Array(Math.ceil((i - start) / 2));
      let count = 0;
      for (let p = start; p < i; p++) {
        if ([9, 10, 13, 32].includes(bytes[p])) continue;
        const nibble = hexValue(bytes[p]);
        if (nibble < 0) throw new Error('RTF 그림의 16진수 데이터가 올바르지 않습니다.');
        if (image.highNibble === null) image.highNibble = nibble;
        else { decoded[count++] = image.highNibble * 16 + nibble; image.highNibble = null; }
      }
      image.chunks.push(decoded.subarray(0, count)); image.length += count;
    } else if (frame?.skip) {
      if (c !== 10 && c !== 13) frame.skip--;
    } else if (frame && !frame.hidden && frame.codepage === 949) {
      const change = koreanRun(bytes, offset); i = change.end;
      if (change.bytes) replacements.push(change);
    }
  }
  if (stack.length) throw new Error('RTF 문서가 끝까지 저장되지 않았습니다.');
  if (!replacements.length) return empty;
  replacements.sort((a, b) => a.start - b.start);
  let length = bytes.length, previous = 0;
  for (const change of replacements) {
    if (change.start < previous) throw new Error('RTF 그림 구조가 겹칩니다.');
    previous = change.end; length += change.bytes.length - (change.end - change.start);
  }
  if (length > 256 * 1024 * 1024) throw new Error('RTF 문서의 본문 구조가 너무 큽니다.');
  const result = new Uint8Array(length);
  let source = 0, target = 0;
  for (const change of replacements) {
    result.set(bytes.subarray(source, change.start), target); target += change.start - source;
    result.set(change.bytes, target); target += change.bytes.length; source = change.end;
  }
  result.set(bytes.subarray(source), target);
  return { bytes: result, pictures, prefix };
}

export function restoreRtfPictures(html, prepared) {
  const resources = new Map();
  if (!prepared.prefix) return { html, resources };
  const size = (goal, scale) => Number.isFinite(goal) && goal > 0 && Number.isFinite(scale) && scale > 0
    ? Math.min(20000, goal / 15 * scale / 100) : 0;
  html = html.replace(new RegExp(prepared.prefix + '(\\d+)END', 'g'), (token, id) => {
    const picture = prepared.pictures[Number(id)];
    if (!picture || picture.token !== token) return token;
    resources.set(picture.path, picture);
    const width = size(picture.width, picture.scaleX), height = size(picture.height, picture.scaleY);
    const style = (width ? 'width:' + width + 'px;' : '') + (height ? 'height:' + height + 'px;' : '');
    return '<img src="' + picture.path + '" style="' + style + '" alt="" loading="lazy">';
  });
  return { html, resources };
}
