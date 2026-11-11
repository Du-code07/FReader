import 'dart:io';
import 'dart:isolate';

import 'package:path_provider/path_provider.dart';

/// 한 번 다 그려진 쪽(워드·한글)의 화면을 저장해 두었다가, 다시 그 쪽을 열 때
/// 실제 쪽이 준비될 때까지 먼저 보여 주기 위한 저장소.
///
/// - 문서마다 폴더 하나 (파일 경로·크기·수정 시각으로 이름을 정해, 문서가 바뀌면 새 폴더)
/// - 같은 쪽이라도 화면 크기·2쪽 보기·읽기 방향·배경색이 다르면 따로 저장
/// - 전체가 [_maxBytes]를 넘으면 오래 안 연 문서부터 지운다
class PageSnapshotService {
  static const int _maxBytes = 150 * 1024 * 1024;
  static Directory? _root;
  static bool _pruned = false;

  static Future<Directory> _rootDir() async {
    final cached = _root;
    if (cached != null) return cached;
    final base = await getTemporaryDirectory();
    final dir = Directory('${base.path}/page_snaps');
    if (!dir.existsSync()) dir.createSync(recursive: true);
    return _root = dir;
  }

  /// 문서 폴더 (없으면 만든다). 열 때마다 수정 시각을 바꿔 '최근에 연 문서'로 표시.
  static Future<Directory?> documentDir(String filePath) async {
    try {
      final file = File(filePath);
      final stat = await file.stat();
      final key = '${filePath.hashCode.toUnsigned(32)}_${stat.size}_${stat.modified.millisecondsSinceEpoch}';
      final dir = Directory('${(await _rootDir()).path}/$key');
      if (!dir.existsSync()) dir.createSync(recursive: true);
      try {
        File('${dir.path}/.used').writeAsStringSync('');
      } catch (_) {}
      if (!_pruned) {
        _pruned = true;
        _prune(dir.path); // 앱을 켠 뒤 한 번만
      }
      return dir;
    } catch (_) {
      return null;
    }
  }

  /// 쪽 화면 파일 이름
  static String fileName({
    required int page,
    required int width,
    required int height,
    required bool spread,
    required bool rtl,
    required String theme,
  }) =>
      'p${page}_${width}x${height}_${spread ? 's' : '1'}${rtl ? 'r' : 'l'}_$theme.jpg';

  /// 오래 안 연 문서의 저장 화면부터 지움. 파일이 많을 수 있어 따로(백그라운드 isolate)에서 한다
  static Future<void> _prune(String keepPath) async {
    try {
      final rootPath = (await _rootDir()).path;
      await Isolate.run(() => _pruneSync(rootPath, keepPath, _maxBytes));
    } catch (_) {}
  }
}

void _pruneSync(String rootPath, String keepPath, int maxBytes) {
  try {
    final root = Directory(rootPath);
    final entries = <({Directory dir, DateTime used, int bytes})>[];
    var total = 0;
    for (final entity in root.listSync()) {
      if (entity is! Directory) continue;
      var bytes = 0;
      DateTime used = entity.statSync().modified;
      for (final f in entity.listSync()) {
        if (f is! File) continue;
        final st = f.statSync();
        if (f.path.endsWith('/.used')) {
          used = st.modified;
        } else {
          bytes += st.size;
        }
      }
      total += bytes;
      entries.add((dir: entity, used: used, bytes: bytes));
    }
    if (total <= maxBytes) return;
    entries.sort((a, b) => a.used.compareTo(b.used));
    for (final e in entries) {
      if (total <= maxBytes * 0.8) break;
      if (e.dir.path == keepPath) continue;
      try {
        e.dir.deleteSync(recursive: true);
        total -= e.bytes;
      } catch (_) {}
    }
  } catch (_) {}
}
