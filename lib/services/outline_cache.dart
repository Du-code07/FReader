import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// 문서마다 만든 목차를 저장해 두어, 다음에 열 때는 다시 분석하지 않고 바로 보여 준다.
/// 파일 크기·수정 시각이 바뀌면 다시 만든다. 그림 속 글자 읽기(OCR) 결과도 슬라이드마다 저장해
/// 중간에 닫아도 다음에 이어서 읽는다.
class OutlineCache {
  /// 목차 만드는 규칙이 바뀌면 올린다 (예전 결과는 버림)
  static const int version = 7;

  static Future<Directory> _dir() async {
    final d = Directory('${(await getApplicationSupportDirectory()).path}/outline_cache');
    if (!await d.exists()) await d.create(recursive: true);
    return d;
  }

  static String _key(String path) {
    // FNV-1a 64비트
    int h = 0xcbf29ce484222325;
    for (final c in utf8.encode(path)) {
      h ^= c;
      h = h * 0x100000001b3; // 64비트에서 넘치는 부분은 버려짐
    }
    return h.toUnsigned(64).toRadixString(16);
  }

  static Future<String> _stamp(String path) async {
    try {
      final st = await File(path).stat();
      return '${st.size}_${st.modified.millisecondsSinceEpoch}';
    } catch (_) {
      return '';
    }
  }

  static Future<Map<String, dynamic>?> _readJson(String path, String suffix) async {
    try {
      final f = File('${(await _dir()).path}/${_key(path)}$suffix');
      if (!await f.exists()) return null;
      final m = jsonDecode(await f.readAsString()) as Map<String, dynamic>;
      if (m['v'] != version || m['stamp'] != await _stamp(path)) return null;
      return m;
    } catch (_) {
      return null;
    }
  }

  static Future<void> _writeJson(String path, String suffix, Map<String, Object?> data) async {
    try {
      final f = File('${(await _dir()).path}/${_key(path)}$suffix');
      final tmp = File('${f.path}.tmp');
      await tmp.writeAsString(jsonEncode({'v': version, 'stamp': await _stamp(path), ...data}), flush: true);
      await tmp.rename(f.path);
    } catch (_) {}
  }

  /// 저장된 목차들: 쪽 수 → 목차 {title, level, page} (빈 목록 = 목차 없음).
  /// 워드 문서는 화면 크기·글자 설정에 따라 쪽 수가 달라지므로 쪽 수마다 따로 저장한다
  static Future<Map<int, List<Map<String, Object?>>>> read(String path) async {
    final m = await _readJson(path, '.json');
    final out = <int, List<Map<String, Object?>>>{};
    final by = m?['byPages'];
    if (by is! Map) return out;
    by.forEach((k, items) {
      final n = int.tryParse('$k');
      if (n == null || items is! List) return;
      out[n] = [
        for (final e in items)
          if (e is Map && e['page'] is num)
            {'title': (e['title'] ?? '').toString(), 'level': (e['level'] as num?)?.toInt() ?? 1, 'page': (e['page'] as num).toInt()},
      ];
    });
    return out;
  }

  static Future<void> write(String path, int pageCount, List<Map<String, Object?>> items) async {
    final all = await read(path);
    all[pageCount] = items;
    // 너무 많이 쌓이지 않게 최근 6가지 쪽 수만
    final keys = all.keys.toList();
    while (keys.length > 6) {
      all.remove(keys.removeAt(0));
    }
    await _writeJson(path, '.json', {'byPages': {for (final e in all.entries) '${e.key}': e.value}});
  }

  /// 슬라이드마다 읽은 줄들 {t, y, h, sw}
  static Future<Map<int, List<Map<String, Object?>>>> readOcr(String path) async {
    final m = await _readJson(path, '.ocr.json');
    final out = <int, List<Map<String, Object?>>>{};
    final slides = m?['slides'];
    if (slides is Map) {
      slides.forEach((k, v) {
        final i = int.tryParse('$k');
        if (i != null && v is List) out[i] = [for (final l in v) if (l is Map) l.cast<String, Object?>()];
      });
    }
    return out;
  }

  static Future<void> writeOcr(String path, Map<int, List<Map<String, Object?>>> slides) =>
      _writeJson(path, '.ocr.json', {'slides': {for (final e in slides.entries) '${e.key}': e.value}});

  /// 다 끝난 뒤 OCR 중간 결과는 지움 (목차만 남김)
  static Future<void> clearOcr(String path) async {
    try {
      final f = File('${(await _dir()).path}/${_key(path)}.ocr.json');
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }
}
