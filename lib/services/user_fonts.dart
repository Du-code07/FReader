import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 사용자가 직접 넣은 글꼴 (한글·워드 문서에서 같은 이름의 글꼴 대신 씀).
/// 앱은 글꼴을 함께 배포하지 않고, 사용자가 가진 글꼴 파일을 기기 안에서만 사용한다.
class UserFontEntry {
  UserFontEntry({required this.file, required this.names, required this.weight, required this.italic, required this.label, this.category = 'doc'});

  /// 쓰는 곳: 'doc'(한글·워드 문서) / 'app'(앱 화면 글꼴) / 'epub'(EPUB 본문 글꼴)
  final String category;

  /// 앱 저장소(userfonts 폴더) 안의 파일 이름
  final String file;

  /// 이 글꼴을 가리키는 이름들 (한글 이름·영문 이름 등. 예: '맑은 고딕', 'Malgun Gothic')
  final List<String> names;
  final int weight;
  final bool italic;

  /// 목록에 보여 줄 이름
  final String label;

  Map<String, Object> toJson() => {'f': file, 'n': names, 'w': weight, 'i': italic, 'l': label, 'c': category};

  static UserFontEntry? fromJson(Object? v) {
    if (v is! Map) return null;
    final f = v['f'], n = v['n'];
    if (f is! String || n is! List) return null;
    return UserFontEntry(
      file: f,
      names: [for (final e in n) '$e'],
      weight: (v['w'] as num?)?.toInt() ?? 400,
      italic: v['i'] == true,
      label: '${v['l'] ?? (n.isNotEmpty ? n.first : f)}',
      category: '${v['c'] ?? 'doc'}',
    );
  }
}

class UserFonts {
  static const _key = 'user_fonts_v1';
  static const urlPath = '/userfonts/';

  static Directory? _dir;

  /// 앱 시작 때 [dir]을 한 번 불러 두면 바로 쓸 수 있는 폴더 경로
  static String? get cachedDirPath => _dir?.path;

  /// 글꼴 파일을 두는 폴더 (WebView가 /userfonts/ 주소로 읽음)
  static Future<Directory> dir() async {
    final d = _dir ??= Directory('${(await getApplicationSupportDirectory()).path}/userfonts');
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  /// [category]의 글꼴만
  static Future<List<UserFontEntry>> listOf(String category) async => [for (final e in await list()) if (e.category == category) e];

  /// 앱 화면에 쓸 글꼴이 바뀌면 알림 (null이면 기본 글꼴)
  static final ValueNotifier<UserFontEntry?> appFont = ValueNotifier<UserFontEntry?>(null);

  /// 앱 화면 글꼴 이름 (Flutter에 등록한 이름)
  static String appFontFamily(UserFontEntry e) => 'FReaderApp_${e.file.split('.').first}';

  /// 앱을 켤 때·앱 글꼴을 바꿀 때: 고른 글꼴을 Flutter에 등록
  static Future<void> loadAppFont() async {
    try {
      final all = await listOf('app');
      if (all.isEmpty) {
        appFont.value = null;
        return;
      }
      final e = all.first;
      final loader = FontLoader(appFontFamily(e));
      final f = File('${(await dir()).path}/${e.file}');
      loader.addFont(f.readAsBytes().then((b) => ByteData.sublistView(b)));
      await loader.load();
      appFont.value = e;
    } catch (_) {
      appFont.value = null;
    }
  }

  /// EPUB 본문 글꼴 (없으면 null)
  static Future<UserFontEntry?> epubFont() async {
    final all = await listOf('epub');
    return all.isEmpty ? null : all.first;
  }

  static Future<List<UserFontEntry>> list() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List).map(UserFontEntry.fromJson).whereType<UserFontEntry>().toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> _save(List<UserFontEntry> all) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode([for (final e in all) e.toJson()]));
  }

  /// 문서 화면(JS)에 넘길 목록
  static Future<List<Map<String, Object>>> forViewer() async => [for (final e in await listOf('doc')) e.toJson()];

  /// 글꼴 파일을 추가. 돌려주는 값: 추가된 글꼴 수 (글꼴이 아닌 파일은 건너뜀)
  static Future<int> add(List<String> paths, {String category = 'doc'}) async {
    final all = await list();
    // 앱·EPUB 글꼴은 하나만 (새로 고르면 바꿔 넣음)
    if (category != 'doc') {
      final d0 = await dir();
      for (final e in all.where((e) => e.category == category).toList()) {
        all.remove(e);
        try {
          await File('${d0.path}/${e.file}').delete();
        } catch (_) {}
      }
      if (paths.length > 1) paths = paths.take(1).toList();
    }
    final d = await dir();
    int added = 0;
    // 글꼴 모음(.ttc, 예: 굴림·돋움이 함께 든 gulim.ttc)은 글꼴마다 따로 떼어 모두 넣음
    final pieces = <(String, Uint8List)>[];
    for (final p in paths) {
      try {
        final bytes = await File(p).readAsBytes();
        final parts = FontNameReader.splitCollection(bytes);
        if (parts != null) {
          for (final part in parts) {
            pieces.add(('x.ttf', part));
          }
        } else {
          pieces.add((p, bytes));
        }
      } catch (_) {}
    }
    if (category != 'doc' && pieces.length > 1) pieces.removeRange(1, pieces.length);
    for (final (p, bytes) in pieces) {
      try {
        final info = FontNameReader.read(bytes);
        if (info == null || info.names.isEmpty) continue;
        final ext = p.toLowerCase().endsWith('.otf') ? 'otf' : 'ttf';
        final file = 'f${DateTime.now().microsecondsSinceEpoch}.$ext';
        await File('${d.path}/$file').writeAsBytes(bytes, flush: true);
        // 같은 이름·굵기·기울임이 이미 있으면 바꿔 넣음
        final dup = all.where((e) => e.category == category && e.weight == info.weight && e.italic == info.italic && e.names.any(info.names.contains)).toList();
        for (final e in dup) {
          all.remove(e);
          try {
            await File('${d.path}/${e.file}').delete();
          } catch (_) {}
        }
        all.add(UserFontEntry(file: file, names: info.names, weight: info.weight, italic: info.italic, label: info.label, category: category));
        added++;
      } catch (_) {}
    }
    await _save(all);
    return added;
  }

  static Future<void> remove(UserFontEntry entry) async {
    final all = await list();
    all.removeWhere((e) => e.file == entry.file);
    await _save(all);
    try {
      await File('${(await dir()).path}/${entry.file}').delete();
    } catch (_) {}
  }
}

/// 글꼴 파일(TTF·OTF·TTC 첫 글꼴)의 이름표(name)·굵기(OS/2)만 읽는 작은 해석기
class FontNameInfo {
  FontNameInfo(this.names, this.weight, this.italic, this.label);
  final List<String> names;
  final int weight;
  final bool italic;
  final String label;
}

class FontNameReader {
  /// 글꼴 모음(TTC)을 글꼴 하나짜리 파일(TTF/OTF)들로 나눔. 모음이 아니면 null
  static List<Uint8List>? splitCollection(Uint8List b) {
    if (b.length < 16 || !(b[0] == 0x74 && b[1] == 0x74 && b[2] == 0x63 && b[3] == 0x66)) return null;
    final bd = ByteData.sublistView(b);
    final int n = bd.getUint32(8);
    if (n <= 0 || n > 64 || 12 + n * 4 > b.length) return null;
    final out = <Uint8List>[];
    for (int f = 0; f < n; f++) {
      try {
        final int base = bd.getUint32(12 + f * 4);
        final int numTables = bd.getUint16(base + 4);
        final recs = <(int tag, int sum, int off, int len)>[];
        for (int i = 0; i < numTables; i++) {
          final r = base + 12 + i * 16;
          recs.add((bd.getUint32(r), bd.getUint32(r + 4), bd.getUint32(r + 8), bd.getUint32(r + 12)));
        }
        int size = 12 + numTables * 16;
        for (final t in recs) {
          size += (t.$4 + 3) & ~3;
        }
        final o = Uint8List(size);
        final od = ByteData.sublistView(o);
        o.setRange(0, 12, b.sublist(base, base + 12)); // sfnt 머리 (판 번호·표 수)
        int pos = 12 + numTables * 16;
        for (int i = 0; i < recs.length; i++) {
          final (tag, sum, off, len) = recs[i];
          final r = 12 + i * 16;
          od.setUint32(r, tag);
          od.setUint32(r + 4, sum);
          od.setUint32(r + 8, pos);
          od.setUint32(r + 12, len);
          o.setRange(pos, pos + len, b.sublist(off, off + len));
          pos += (len + 3) & ~3;
        }
        out.add(o);
      } catch (_) {}
    }
    return out.isEmpty ? null : out;
  }

  static FontNameInfo? read(Uint8List b) {
    if (b.length < 12) return null;
    final bd = ByteData.sublistView(b);
    int base = 0;
    if (b[0] == 0x74 && b[1] == 0x74 && b[2] == 0x63 && b[3] == 0x66) {
      // 'ttcf': 글꼴 모음 → 첫 글꼴
      if (b.length < 16) return null;
      base = bd.getUint32(12);
    }
    final tag = bd.getUint32(base);
    if (tag != 0x00010000 && tag != 0x4F54544F && tag != 0x74727565) return null; // TrueType / 'OTTO' / 'true'
    final numTables = bd.getUint16(base + 4);
    int nameOff = -1, os2Off = -1;
    for (int i = 0; i < numTables; i++) {
      final rec = base + 12 + i * 16;
      if (rec + 16 > b.length) return null;
      final t = String.fromCharCodes(b.sublist(rec, rec + 4));
      final off = bd.getUint32(rec + 8);
      if (t == 'name') nameOff = off;
      if (t == 'OS/2') os2Off = off;
    }
    if (nameOff < 0 || nameOff + 6 > b.length) return null;
    final count = bd.getUint16(nameOff + 2);
    final strOff = nameOff + bd.getUint16(nameOff + 4);
    final family = <String>[], typo = <String>[], full = <String>[];
    String sub = '';
    for (int i = 0; i < count; i++) {
      final r = nameOff + 6 + i * 12;
      if (r + 12 > b.length) break;
      final platform = bd.getUint16(r), encoding = bd.getUint16(r + 2);
      final nameId = bd.getUint16(r + 6), len = bd.getUint16(r + 8), off = bd.getUint16(r + 10);
      if (nameId != 1 && nameId != 2 && nameId != 4 && nameId != 16) continue;
      final s0 = strOff + off;
      if (s0 + len > b.length) continue;
      String s;
      if (platform == 3 || platform == 0) {
        final units = <int>[for (int k = 0; k + 1 < len; k += 2) (b[s0 + k] << 8) | b[s0 + k + 1]];
        s = String.fromCharCodes(units);
      } else if (platform == 1 && encoding == 0) {
        s = latin1.decode(b.sublist(s0, s0 + len), allowInvalid: true);
      } else {
        continue;
      }
      s = s.replaceAll('\u0000', '').trim();
      if (s.isEmpty) continue;
      if (nameId == 1 && !family.contains(s)) family.add(s);
      if (nameId == 16 && !typo.contains(s)) typo.add(s);
      if (nameId == 4 && !full.contains(s)) full.add(s);
      if (nameId == 2 && sub.isEmpty) sub = s;
    }
    final names = <String>[...family, ...typo.where((t) => !family.contains(t))];
    if (names.isEmpty) return null;
    int weight = 400;
    bool italic = false;
    if (os2Off >= 0 && os2Off + 64 <= b.length) {
      weight = bd.getUint16(os2Off + 4);
      final fsSel = bd.getUint16(os2Off + 62);
      italic = (fsSel & 0x01) != 0;
      if ((fsSel & 0x20) != 0 && weight < 600) weight = 700;
    } else if (RegExp('bold', caseSensitive: false).hasMatch(sub)) {
      weight = 700;
    }
    // 굵기는 보통(400)·굵게(700) 두 가지로
    weight = weight >= 600 ? 700 : 400;
    final label = full.isNotEmpty ? full.first : '${names.first}${sub.isNotEmpty && sub.toLowerCase() != 'regular' ? ' $sub' : ''}';
    return FontNameInfo(names, weight, italic, label);
  }
}
