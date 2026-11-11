import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

/// PDF 파일 안의 목차(책갈피, Outlines)를 읽는다. 각 항목 {title, level, page(0부터)}.
/// 암호가 걸렸거나 목차가 없거나 읽지 못하면 빈 목록.
class PdfOutlineService {
  static Future<List<Map<String, Object>>> read(String path) async {
    try {
      final file = File(path);
      if (!await file.exists()) return const [];
      if (await file.length() > 300 * 1024 * 1024) return const [];
      return await Isolate.run(() => _PdfOutlineReader(File(path).readAsBytesSync()).outline());
    } catch (_) {
      return const [];
    }
  }

  /// [path] PDF 끝에 목차(책갈피)를 덧붙인다 (기존 내용은 그대로 두는 '덧붙여 고치기' 방식).
  /// [items]: {title, level(1~), page(0부터)}. 실패하면 false (파일은 그대로)
  static Future<bool> appendOutline(String path, List<Map<String, Object>> items) async {
    if (items.isEmpty) return false;
    try {
      final bytes = await File(path).readAsBytes();
      final tail = await Isolate.run(() => _PdfOutlineReader(bytes).buildOutlineUpdate(items));
      if (tail == null) return false;
      final raf = await File(path).open(mode: FileMode.append);
      try {
        await raf.writeFrom(tail);
      } finally {
        await raf.close();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /// 테스트용: 같은 일을 지금 스레드에서
  static List<Map<String, Object>> readBytes(Uint8List bytes) {
    try {
      return _PdfOutlineReader(bytes).outline();
    } catch (_) {
      return const [];
    }
  }
}

class _Ref {
  const _Ref(this.num, this.gen);
  final int num;
  final int gen;
  @override
  bool operator ==(Object other) => other is _Ref && other.num == num && other.gen == gen;
  @override
  int get hashCode => num * 31 + gen;
}

class _Name {
  const _Name(this.value);
  final String value;
}

class _Str {
  const _Str(this.bytes);
  final List<int> bytes;

  String decode() {
    final b = bytes;
    if (b.length >= 2 && b[0] == 0xFE && b[1] == 0xFF) {
      final units = <int>[for (int i = 2; i + 1 < b.length; i += 2) (b[i] << 8) | b[i + 1]];
      return String.fromCharCodes(units);
    }
    if (b.length >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF) {
      return utf8.decode(b.sublist(3), allowMalformed: true);
    }
    // PDFDocEncoding ≈ Latin-1 (UTF-8로 저장한 파일도 있어 먼저 시도)
    try {
      return utf8.decode(b);
    } catch (_) {
      return latin1.decode(b);
    }
  }
}

class _Stream {
  _Stream(this.dict, this.raw);
  final Map<String, Object?> dict;
  final Uint8List raw;
}

class _Lexer {
  _Lexer(this.b, this.pos);
  final Uint8List b;
  int pos;

  static bool _ws(int c) => c == 0x20 || c == 0x0A || c == 0x0D || c == 0x09 || c == 0x0C || c == 0x00;
  static bool _delim(int c) => c == 0x28 || c == 0x29 || c == 0x3C || c == 0x3E || c == 0x5B || c == 0x5D || c == 0x7B || c == 0x7D || c == 0x2F || c == 0x25;

  void skipWs() {
    while (pos < b.length) {
      final c = b[pos];
      if (_ws(c)) {
        pos++;
      } else if (c == 0x25) {
        while (pos < b.length && b[pos] != 0x0A && b[pos] != 0x0D) {
          pos++;
        }
      } else {
        break;
      }
    }
  }

  String _word() {
    final start = pos;
    while (pos < b.length && !_ws(b[pos]) && !_delim(b[pos])) {
      pos++;
    }
    return latin1.decode(b.sublist(start, pos));
  }

  bool startsWith(String s) {
    if (pos + s.length > b.length) return false;
    for (int i = 0; i < s.length; i++) {
      if (b[pos + i] != s.codeUnitAt(i)) return false;
    }
    return true;
  }

  Object? value() {
    skipWs();
    if (pos >= b.length) return null;
    final c = b[pos];
    if (c == 0x2F) {
      pos++;
      final raw = _word();
      return _Name(raw.contains('#') ? raw.replaceAllMapped(RegExp(r'#([0-9A-Fa-f]{2})'), (m) => String.fromCharCode(int.parse(m[1]!, radix: 16))) : raw);
    }
    if (c == 0x3C && pos + 1 < b.length && b[pos + 1] == 0x3C) {
      pos += 2;
      final map = <String, Object?>{};
      while (true) {
        skipWs();
        if (pos >= b.length) break;
        if (b[pos] == 0x3E && pos + 1 < b.length && b[pos + 1] == 0x3E) {
          pos += 2;
          break;
        }
        final key = value();
        if (key is! _Name) break;
        map[key.value] = value();
      }
      return map;
    }
    if (c == 0x3C) {
      pos++;
      final hex = StringBuffer();
      while (pos < b.length && b[pos] != 0x3E) {
        final ch = b[pos++];
        if (!_ws(ch)) hex.writeCharCode(ch);
      }
      pos++;
      var h = hex.toString();
      if (h.length.isOdd) h += '0';
      return _Str([for (int i = 0; i + 1 < h.length; i += 2) int.tryParse(h.substring(i, i + 2), radix: 16) ?? 0]);
    }
    if (c == 0x28) {
      pos++;
      final out = <int>[];
      int depth = 1;
      while (pos < b.length) {
        int ch = b[pos++];
        if (ch == 0x5C && pos < b.length) {
          final e = b[pos++];
          switch (e) {
            case 0x6E: out.add(0x0A);
            case 0x72: out.add(0x0D);
            case 0x74: out.add(0x09);
            case 0x62: out.add(0x08);
            case 0x66: out.add(0x0C);
            case 0x0D:
              if (pos < b.length && b[pos] == 0x0A) pos++;
            case 0x0A:
              break;
            default:
              if (e >= 0x30 && e <= 0x37) {
                int v = e - 0x30;
                for (int k = 0; k < 2 && pos < b.length && b[pos] >= 0x30 && b[pos] <= 0x37; k++) {
                  v = v * 8 + (b[pos++] - 0x30);
                }
                out.add(v & 0xFF);
              } else {
                out.add(e);
              }
          }
          continue;
        }
        if (ch == 0x28) depth++;
        if (ch == 0x29 && --depth == 0) break;
        out.add(ch);
      }
      return _Str(out);
    }
    if (c == 0x5B) {
      pos++;
      final list = <Object?>[];
      while (true) {
        skipWs();
        if (pos >= b.length) break;
        if (b[pos] == 0x5D) {
          pos++;
          break;
        }
        list.add(value());
      }
      return list;
    }
    final w = _word();
    if (w.isEmpty) {
      pos++;
      return null;
    }
    final n = num.tryParse(w);
    if (n != null) {
      // "숫자 숫자 R" = 다른 개체를 가리키는 참조
      final save = pos;
      skipWs();
      final w2 = _word();
      final g = int.tryParse(w2);
      if (g != null && n is int) {
        skipWs();
        if (pos < b.length && b[pos] == 0x52 && (pos + 1 >= b.length || _ws(b[pos + 1]) || _delim(b[pos + 1]))) {
          pos++;
          return _Ref(n, g);
        }
      }
      pos = save;
      return n;
    }
    if (w == 'true') return true;
    if (w == 'false') return false;
    return null;
  }
}

class _PdfOutlineReader {
  _PdfOutlineReader(this.b);
  final Uint8List b;

  final Map<int, int> _offsets = {}; // 개체 번호 → 파일 위치
  final Map<int, (int, int)> _inStream = {}; // 개체 번호 → (개체 묶음 번호, 순서)
  final Map<int, Object?> _cache = {};
  final Map<int, List<Object?>> _objStreams = {};
  Map<String, Object?> _trailer = {};
  int _size = 0;
  int _startXref = -1;

  List<Map<String, Object>> outline() {
    _readXref();
    if (_trailer['Encrypt'] != null) return const [];
    final root = _dict(_trailer['Root']);
    if (root == null) return const [];
    final pages = <int>[];
    _collectPages(root['Pages'], pages, <int>{}, 0);
    if (pages.isEmpty) return const [];
    final pageIndex = <int, int>{for (int i = 0; i < pages.length; i++) pages[i]: i};
    final outlines = _dict(root['Outlines']);
    if (outlines == null) return const [];
    final out = <Map<String, Object>>[];
    _walk(outlines['First'], 1, out, root, pageIndex, pages.length, <int>{});
    return out;
  }

  // ── 목차 덧붙이기 ──
  Uint8List? buildOutlineUpdate(List<Map<String, Object>> items) {
    _readXref();
    if (_trailer['Encrypt'] != null || _startXref < 0) return null;
    final rootRef = _trailer['Root'];
    if (rootRef is! _Ref) return null;
    final catalog = _dict(rootRef);
    if (catalog == null) return null;
    final pages = <int>[];
    _collectPages(catalog['Pages'], pages, <int>{}, 0);
    if (pages.isEmpty) return null;
    final pageGen = <int, int>{};
    // 쪽 개체의 세대 번호 (보통 0)
    int nextNum = _size;
    for (final n in [..._offsets.keys, ..._inStream.keys]) {
      if (n + 1 > nextNum) nextNum = n + 1;
    }

    // 단계로 나무 모양 만들기
    final root = _OutlineNode('', 0, 0);
    final stack = <_OutlineNode>[];
    for (final it in items) {
      final title = (it['title'] ?? '').toString().trim();
      final level = (it['level'] as int?) ?? 1;
      final page = ((it['page'] as int?) ?? 0).clamp(0, pages.length - 1);
      if (title.isEmpty) continue;
      final node = _OutlineNode(title, level, page);
      while (stack.isNotEmpty && stack.last.level >= level) {
        stack.removeLast();
      }
      (stack.isEmpty ? root : stack.last).children.add(node);
      stack.add(node);
    }
    if (root.children.isEmpty) return null;
    root.num = nextNum++;
    void number(_OutlineNode n) {
      for (final c in n.children) {
        c.num = nextNum++;
        number(c);
      }
    }
    number(root);
    int total(_OutlineNode n) => n.children.fold(0, (sum, c) => sum + 1 + total(c));

    final base = b.length;
    final out = BytesBuilder();
    final offsets = <int, int>{};
    void write(String text) => out.add(latin1.encode(text));
    void obj(int num, Map<String, Object?> dict) {
      offsets[num] = base + out.length;
      write('$num 0 obj\n${_ser(dict)}\nendobj\n');
    }

    write('\n');
    obj(root.num, {'Type': const _Name('Outlines'), 'First': _Ref(root.children.first.num, 0), 'Last': _Ref(root.children.last.num, 0), 'Count': total(root)});
    void emit(_OutlineNode parent) {
      for (int i = 0; i < parent.children.length; i++) {
        final c = parent.children[i];
        obj(c.num, {
          'Title': _Str(_utf16be(c.title)),
          'Parent': _Ref(parent.num, 0),
          if (i > 0) 'Prev': _Ref(parent.children[i - 1].num, 0),
          if (i + 1 < parent.children.length) 'Next': _Ref(parent.children[i + 1].num, 0),
          if (c.children.isNotEmpty) 'First': _Ref(c.children.first.num, 0),
          if (c.children.isNotEmpty) 'Last': _Ref(c.children.last.num, 0),
          if (c.children.isNotEmpty) 'Count': total(c),
          'Dest': [_Ref(pages[c.page], pageGen[pages[c.page]] ?? 0), const _Name('XYZ'), null, null, null],
        });
        emit(c);
      }
    }
    emit(root);
    // 문서 목록(Catalog)을 새로 써서 목차를 연결 (같은 번호로 덮어씀)
    obj(rootRef.num, {...catalog, 'Outlines': _Ref(root.num, 0)});
    final xrefAt = base + out.length;
    final nums = offsets.keys.toList()..sort();
    final sb = StringBuffer('xref\n');
    int i = 0;
    while (i < nums.length) {
      int j = i;
      while (j + 1 < nums.length && nums[j + 1] == nums[j] + 1) {
        j++;
      }
      sb.write('${nums[i]} ${j - i + 1}\n');
      for (int k = i; k <= j; k++) {
        sb.write('${offsets[nums[k]]!.toString().padLeft(10, '0')} ${(nums[k] == rootRef.num ? rootRef.gen : 0).toString().padLeft(5, '0')} n \n');
      }
      i = j + 1;
    }
    write(sb.toString());
    final trailer = <String, Object?>{'Size': nextNum, 'Root': rootRef, if (_trailer['Info'] != null) 'Info': _trailer['Info'], 'Prev': _startXref};
    write('trailer\n${_ser(trailer)}\nstartxref\n$xrefAt\n%%EOF\n');
    return out.toBytes();
  }

  static List<int> _utf16be(String s) {
    final out = <int>[0xFE, 0xFF];
    for (final u in s.codeUnits) {
      out..add(u >> 8)..add(u & 0xFF);
    }
    return out;
  }

  static String _ser(Object? v) {
    if (v == null) return 'null';
    if (v is bool) return v ? 'true' : 'false';
    if (v is int) return '$v';
    if (v is double) return v.toStringAsFixed(4).replaceFirst(RegExp(r'\.?0+$'), '');
    if (v is _Name) {
      final sb = StringBuffer('/');
      for (final c in latin1.encode(v.value)) {
        final ok = c > 0x20 && c < 0x7F && !'()<>[]{}/%#'.codeUnits.contains(c);
        sb.write(ok ? String.fromCharCode(c) : '#${c.toRadixString(16).padLeft(2, '0')}');
      }
      return sb.toString();
    }
    if (v is _Ref) return '${v.num} ${v.gen} R';
    if (v is _Str) return '<${v.bytes.map((c) => c.toRadixString(16).padLeft(2, '0')).join()}>';
    if (v is List) return '[${v.map(_ser).join(' ')}]';
    if (v is Map) return '<<${v.entries.map((e) => '${_ser(_Name(e.key as String))} ${_ser(e.value)}').join(' ')}>>';
    if (v is _Stream) return _ser(v.dict);
    return 'null';
  }

  // ── 상호 참조표(xref) ──
  void _readXref() {
    final tail = b.length > 2048 ? b.length - 2048 : 0;
    final tailText = latin1.decode(b.sublist(tail));
    final at = tailText.lastIndexOf('startxref');
    final visited = <int>{};
    if (at >= 0) {
      final m = RegExp(r'startxref\s+(\d+)').firstMatch(tailText.substring(at));
      int? offset = m == null ? null : int.tryParse(m[1]!);
      _startXref = offset ?? -1;
      while (offset != null && offset >= 0 && offset < b.length && visited.add(offset)) {
        offset = _readXrefSection(offset);
      }
    }
    if (_trailer['Root'] == null || (_offsets.isEmpty && _inStream.isEmpty)) _scanObjects();
  }

  /// 한 구역을 읽고 이전(/Prev) 구역 위치를 돌려줌
  int? _readXrefSection(int offset) {
    final lx = _Lexer(b, offset);
    lx.skipWs();
    if (lx.startsWith('xref')) {
      lx.pos += 4;
      while (true) {
        lx.skipWs();
        if (lx.startsWith('trailer')) {
          lx.pos += 7;
          final t = lx.value();
          if (t is Map<String, Object?>) {
            _mergeTrailer(t);
            final stm = t['XRefStm'];
            if (stm is int) _readXrefSection(stm);
            final prev = t['Prev'];
            return prev is int ? prev : null;
          }
          return null;
        }
        final start = lx.value(), count = lx.value();
        if (start is! int || count is! int) return null;
        lx.skipWs();
        for (int i = 0; i < count; i++) {
          if (lx.pos + 18 > b.length) return null;
          final line = latin1.decode(b.sublist(lx.pos, lx.pos + 18));
          final off = int.tryParse(line.substring(0, 10).trim());
          final kind = line.substring(17, 18);
          if (off != null && kind == 'n') _offsets.putIfAbsent(start + i, () => off);
          lx.pos += 18;
          while (lx.pos < b.length && (b[lx.pos] == 0x0A || b[lx.pos] == 0x0D || b[lx.pos] == 0x20)) {
            lx.pos++;
          }
        }
      }
    }
    // 상호 참조 묶음(xref stream)
    final obj = _parseIndirectAt(offset);
    if (obj is! _Stream) return null;
    final d = obj.dict;
    _mergeTrailer(d);
    final data = _decode(obj);
    if (data == null) return null;
    final w = (d['W'] as List?)?.whereType<int>().toList();
    if (w == null || w.length < 3) return null;
    final size = d['Size'] is int ? d['Size'] as int : 0;
    final index = (d['Index'] as List?)?.whereType<int>().toList() ?? [0, size];
    final rowLen = w[0] + w[1] + w[2];
    int p = 0;
    int field(int len, int def) {
      if (len == 0) return def;
      int v = 0;
      for (int i = 0; i < len; i++) {
        v = (v << 8) | (p < data.length ? data[p] : 0);
        p++;
      }
      return v;
    }
    for (int s = 0; s + 1 < index.length; s += 2) {
      for (int i = 0; i < index[s + 1]; i++) {
        if (p + rowLen > data.length) break;
        final type = field(w[0], 1), f2 = field(w[1], 0), f3 = field(w[2], 0);
        final num = index[s] + i;
        if (type == 1) _offsets.putIfAbsent(num, () => f2);
        if (type == 2) _inStream.putIfAbsent(num, () => (f2, f3));
      }
    }
    final prev = d['Prev'];
    return prev is int ? prev : null;
  }

  void _mergeTrailer(Map<String, Object?> t) {
    final size = t['Size'];
    if (size is int && size > _size) _size = size;
    for (final k in ['Root', 'Encrypt', 'Info']) {
      if (_trailer[k] == null && t[k] != null) _trailer[k] = t[k];
    }
    _trailer = {..._trailer};
  }

  /// 상호 참조표가 망가진 파일: "n g obj"를 직접 찾음
  void _scanObjects() {
    final text = latin1.decode(b);
    for (final m in RegExp(r'(?:^|[\r\n\s])(\d+)\s+(\d+)\s+obj\b').allMatches(text)) {
      final num = int.parse(m[1]!);
      _offsets[num] = m.start + (m[0]!.length - m[0]!.trimLeft().length);
    }
    for (final m in RegExp(r'trailer\s*<<').allMatches(text)) {
      final t = _Lexer(b, m.start + 7).value();
      if (t is Map<String, Object?>) _mergeTrailer(t);
    }
    if (_trailer['Root'] == null) {
      // /Type /Catalog 개체를 찾음
      for (final entry in _offsets.entries) {
        final o = _resolveNum(entry.key);
        if (o is Map && o['Type'] is _Name && (o['Type'] as _Name).value == 'Catalog') {
          _trailer['Root'] = _Ref(entry.key, 0);
          break;
        }
      }
    }
  }

  Object? _parseIndirectAt(int offset) {
    final lx = _Lexer(b, offset);
    lx.value(); // 번호
    lx.value(); // 세대
    lx.skipWs();
    if (!lx.startsWith('obj')) return null;
    lx.pos += 3;
    final v = lx.value();
    lx.skipWs();
    if (v is Map<String, Object?> && lx.startsWith('stream')) {
      lx.pos += 6;
      if (lx.pos < b.length && b[lx.pos] == 0x0D) lx.pos++;
      if (lx.pos < b.length && b[lx.pos] == 0x0A) lx.pos++;
      final start = lx.pos;
      int? len = v['Length'] is int ? v['Length'] as int : null;
      if (v['Length'] is _Ref) {
        final r = _resolve(v['Length']);
        if (r is int) len = r;
      }
      int end;
      if (len != null && start + len <= b.length) {
        end = start + len;
      } else {
        end = _indexOf('endstream', start);
        if (end < 0) end = b.length;
      }
      return _Stream(v, Uint8List.sublistView(b, start, end));
    }
    return v;
  }

  int _indexOf(String s, int from) {
    final first = s.codeUnitAt(0);
    outer:
    for (int i = from; i + s.length <= b.length; i++) {
      if (b[i] != first) continue;
      for (int k = 1; k < s.length; k++) {
        if (b[i + k] != s.codeUnitAt(k)) continue outer;
      }
      return i;
    }
    return -1;
  }

  Uint8List? _decode(_Stream s) {
    final filter = s.dict['Filter'];
    final names = filter is _Name ? [filter.value] : filter is List ? filter.whereType<_Name>().map((n) => n.value).toList() : <String>[];
    Uint8List data = s.raw;
    for (final f in names) {
      if (f != 'FlateDecode') return null;
      try {
        data = Uint8List.fromList(ZLibCodec().decode(data));
      } catch (_) {
        try {
          data = Uint8List.fromList(ZLibDecoder(raw: true).convert(data.sublist(2)));
        } catch (_) {
          return null;
        }
      }
    }
    final parms = s.dict['DecodeParms'];
    final p = parms is Map ? parms : parms is List && parms.isNotEmpty && parms.first is Map ? parms.first as Map : null;
    final predictor = p?['Predictor'];
    if (predictor is int && predictor >= 10) {
      final cols = p?['Columns'] is int ? p!['Columns'] as int : 1;
      data = _pngUnpredict(data, cols);
    }
    return data;
  }

  Uint8List _pngUnpredict(Uint8List data, int cols) {
    final row = cols + 1;
    final out = Uint8List((data.length ~/ row) * cols);
    final prev = Uint8List(cols);
    for (int r = 0; r * row + row <= data.length; r++) {
      final type = data[r * row];
      for (int i = 0; i < cols; i++) {
        final raw = data[r * row + 1 + i];
        final left = i > 0 ? out[r * cols + i - 1] : 0;
        final up = prev[i];
        final upLeft = i > 0 ? (r > 0 ? out[(r - 1) * cols + i - 1] : 0) : 0;
        int v;
        switch (type) {
          case 1:
            v = raw + left;
          case 2:
            v = raw + up;
          case 3:
            v = raw + ((left + up) >> 1);
          case 4:
            final pa = (up - upLeft).abs(), pb = (left - upLeft).abs(), pc = (left + up - 2 * upLeft).abs();
            v = raw + (pa <= pb && pa <= pc ? left : (pb <= pc ? up : upLeft));
          default:
            v = raw;
        }
        out[r * cols + i] = v & 0xFF;
      }
      for (int i = 0; i < cols; i++) {
        prev[i] = out[r * cols + i];
      }
    }
    return out;
  }

  // ── 개체 찾기 ──
  Object? _resolve(Object? v, [int depth = 0]) {
    if (v is! _Ref || depth > 8) return v;
    return _resolve(_resolveNum(v.num), depth + 1);
  }

  Object? _resolveNum(int num) {
    if (_cache.containsKey(num)) return _cache[num];
    _cache[num] = null; // 순환 방지
    Object? v;
    final off = _offsets[num];
    if (off != null && off < b.length) {
      v = _parseIndirectAt(off);
    } else {
      final loc = _inStream[num];
      if (loc != null) {
        final objs = _objStreams[loc.$1] ??= _loadObjStream(loc.$1);
        if (loc.$2 < objs.length) v = objs[loc.$2];
      }
    }
    _cache[num] = v;
    return v;
  }

  List<Object?> _loadObjStream(int num) {
    final s = _resolveNum(num);
    if (s is! _Stream) return const [];
    final data = _decode(s);
    if (data == null) return const [];
    final n = s.dict['N'] is int ? s.dict['N'] as int : 0;
    final first = s.dict['First'] is int ? s.dict['First'] as int : 0;
    final lx = _Lexer(data, 0);
    final offsets = <int>[];
    for (int i = 0; i < n; i++) {
      lx.value();
      final o = lx.value();
      offsets.add(o is int ? o : 0);
    }
    return [for (final o in offsets) _Lexer(data, first + o).value()];
  }

  Map<String, Object?>? _dict(Object? v) {
    final r = _resolve(v);
    if (r is Map<String, Object?>) return r;
    if (r is _Stream) return r.dict;
    return null;
  }

  // ── 쪽 순서 ──
  void _collectPages(Object? node, List<int> out, Set<int> seen, int depth) {
    if (depth > 64 || out.length > 100000) return;
    if (node is _Ref && !seen.add(node.num)) return;
    final d = _dict(node);
    if (d == null) return;
    final kids = _resolve(d['Kids']);
    final type = d['Type'] is _Name ? (d['Type'] as _Name).value : '';
    if (kids is List && type != 'Page') {
      for (final k in kids) {
        _collectPages(k, out, seen, depth + 1);
      }
    } else if (node is _Ref) {
      out.add(node.num);
    }
  }

  // ── 목차 항목 ──
  void _walk(Object? node, int level, List<Map<String, Object>> out, Map<String, Object?> root, Map<int, int> pageIndex, int pageCount, Set<int> seen) {
    int guard = 0;
    while (node != null && out.length < 3000 && guard++ < 5000) {
      if (node is _Ref && !seen.add(node.num)) return;
      final item = _dict(node);
      if (item == null) return;
      final titleObj = _resolve(item['Title']);
      final title = titleObj is _Str ? titleObj.decode().replaceAll(RegExp(r'[\u0000-\u001F]+'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim() : '';
      final page = _destPage(item, root, pageIndex, pageCount);
      if (title.isNotEmpty && page != null) out.add({'title': title, 'level': level.clamp(1, 6), 'page': page});
      if (item['First'] != null && level < 12) _walk(item['First'], level + 1, out, root, pageIndex, pageCount, seen);
      node = item['Next'];
    }
  }

  int? _destPage(Map<String, Object?> item, Map<String, Object?> root, Map<int, int> pageIndex, int pageCount) {
    Object? dest = _resolve(item['Dest']);
    if (dest == null) {
      final a = _dict(item['A']);
      if (a != null) dest = _resolve(a['D']);
    }
    return _pageOfDest(dest, root, pageIndex, pageCount, 0);
  }

  int? _pageOfDest(Object? dest, Map<String, Object?> root, Map<int, int> pageIndex, int pageCount, int depth) {
    if (depth > 4) return null;
    dest = _resolve(dest);
    if (dest is Map<String, Object?>) return _pageOfDest(dest['D'], root, pageIndex, pageCount, depth + 1);
    if (dest is List && dest.isNotEmpty) {
      final target = dest.first;
      if (target is _Ref) return pageIndex[target.num];
      if (target is int) return target.clamp(0, pageCount - 1);
      return null;
    }
    if (dest is _Name || dest is _Str) {
      final key = dest is _Name ? dest.value : latin1.decode((dest as _Str).bytes, allowInvalid: true);
      final named = _lookupNamedDest(key, root);
      return named == null ? null : _pageOfDest(named, root, pageIndex, pageCount, depth + 1);
    }
    return null;
  }

  Object? _lookupNamedDest(String key, Map<String, Object?> root) {
    final dests = _dict(root['Dests']);
    if (dests != null && dests[key] != null) return dests[key];
    final names = _dict(root['Names']);
    final tree = names == null ? null : _dict(names['Dests']);
    return tree == null ? null : _searchNameTree(tree, key, 0);
  }

  Object? _searchNameTree(Map<String, Object?> node, String key, int depth) {
    if (depth > 32) return null;
    final names = _resolve(node['Names']);
    if (names is List) {
      for (int i = 0; i + 1 < names.length; i += 2) {
        final k = _resolve(names[i]);
        final ks = k is _Str ? latin1.decode(k.bytes, allowInvalid: true) : k is _Name ? k.value : null;
        if (ks == key) return names[i + 1];
      }
    }
    final kids = _resolve(node['Kids']);
    if (kids is List) {
      for (final kid in kids) {
        final kd = _dict(kid);
        if (kd == null) continue;
        final limits = _resolve(kd['Limits']);
        if (limits is List && limits.length == 2) {
          final lo = _resolve(limits[0]), hi = _resolve(limits[1]);
          final los = lo is _Str ? latin1.decode(lo.bytes, allowInvalid: true) : null;
          final his = hi is _Str ? latin1.decode(hi.bytes, allowInvalid: true) : null;
          if (los != null && his != null && (key.compareTo(los) < 0 || key.compareTo(his) > 0)) continue;
        }
        final r = _searchNameTree(kd, key, depth + 1);
        if (r != null) return r;
      }
    }
    return null;
  }
}

class _OutlineNode {
  _OutlineNode(this.title, this.level, this.page);
  final String title;
  final int level;
  final int page;
  int num = 0;
  final List<_OutlineNode> children = [];
}
