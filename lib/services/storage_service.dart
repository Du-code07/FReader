import 'package:flutter/widgets.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class BookmarkItem {
  final String id;
  final String label;
  final String position;
  final String createdAt;

  /// 가로 모드 2페이지 보기에서 저장한 북마크 (누르면 그 보기로 돌아가서 보여 줌)
  final bool spread;

  BookmarkItem({
    required this.id,
    required this.label,
    required this.position,
    required this.createdAt,
    this.spread = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'position': position,
        'createdAt': createdAt,
        if (spread) 'spread': true,
      };

  factory BookmarkItem.fromJson(Map<String, dynamic> json) => BookmarkItem(
        id: json['id'] ?? '',
        label: json['label'] ?? '',
        position: json['position'] ?? '',
        createdAt: json['createdAt'] ?? '',
        spread: json['spread'] == true,
      );
}

class MemoStroke {
  final List<double> dxList;
  final List<double> dyList;
  final int colorValue;
  final double strokeWidth;

  MemoStroke({
    required this.dxList,
    required this.dyList,
    required this.colorValue,
    required this.strokeWidth,
  });

  Map<String, dynamic> toJson() => {
        'x': dxList,
        'y': dyList,
        'c': colorValue,
        'w': strokeWidth,
      };

  factory MemoStroke.fromJson(Map<String, dynamic> json) => MemoStroke(
        dxList: (json['x'] as List).map((e) => (e as num).toDouble()).toList(),
        dyList: (json['y'] as List).map((e) => (e as num).toDouble()).toList(),
        colorValue: (json['c'] as num?)?.toInt() ?? 0xFFFFC107,
        strokeWidth: (json['w'] as num?)?.toDouble() ?? 2.0,
      );
}


class AppI18n {
  static String t(
    String lang, {
    required String ko,
    required String en,
    required String zh,
    required String ja,
  }) {
    switch (lang) {
      case 'en':
        return en;
      case 'zh':
        return zh;
      case 'ja':
        return ja;
      default:
        return ko;
    }
  }
}

class StorageService {
  static final ValueNotifier<String> appLangNotifier = ValueNotifier<String>('ko');
  static final ValueNotifier<bool?> desiredLandscapeNotifier = ValueNotifier<bool?>(null);
  static Future<void> saveLastPosition(String bookPath, String pos) async {
    final prefs = await SharedPreferences.getInstance();
    final oldPos = prefs.getString('pos_$bookPath');
    if (oldPos != null && oldPos != pos) {
      await prefs.setString('prev_pos_$bookPath', oldPos);
    }
    await prefs.setString('pos_$bookPath', pos);
  }

  static Future<String?> getLastPosition(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('pos_$bookPath');
  }

  static Future<void> saveProgress(String bookPath, double progress) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('prog_$bookPath', progress);
  }

  static Future<double> getProgress(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getDouble('prog_$bookPath') ?? 0.0;
  }

  // 마지막으로 읽은 쪽 '지금/전체' (예: 6/983) — 파일 목록에 표시
  static Future<void> savePageLabel(String bookPath, String label) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pagelbl_$bookPath', label);
  }

  static Future<String?> getPageLabel(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('pagelbl_$bookPath');
  }

  // 앱 테마: 'system'(기본 시스템, 휴대폰 설정 따라감) / 'light' / 'dark'
  // (예전 버전의 다크 모드 켜기/끄기 값이 있으면 그대로 이어서 쓴다)
  static Future<void> setAppThemeMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_theme_mode', mode);
  }

  static Future<String> getAppThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    final mode = prefs.getString('app_theme_mode');
    if (mode != null) return mode;
    final oldDark = prefs.getBool('dark_mode');
    if (oldDark != null) return oldDark ? 'dark' : 'light';
    return 'system';
  }

  /// 앱 테마 설정값 → 지금 실제로 어두운 화면인지
  static bool isDarkFor(String mode) => mode == 'dark' ||
      (mode == 'system' && WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark);


  // 6. 앱 언어 설정 ('system': 기본 시스템, 'ko': 한국어, 'en': 영어, 'zh': 중국어, 'ja': 일본어)
  // 저장값은 'system'일 수 있고, 실제 화면 문구에 쓰는 언어(appLangNotifier)는 항상 ko/en/zh/ja 중 하나다.
  static const List<String> supportedAppLanguages = ['ko', 'en', 'zh', 'ja'];

  /// 사용자가 고른 언어 설정값 ('system' 포함). 아직 고른 적 없으면 null.
  static String? appLangSetting;

  /// 휴대폰(시스템) 언어 → 앱이 지원하는 언어. 지원하지 않는 언어면 영어.
  static String resolveSystemLanguage() {
    for (final locale in WidgetsBinding.instance.platformDispatcher.locales) {
      final code = locale.languageCode.toLowerCase();
      if (supportedAppLanguages.contains(code)) return code;
    }
    return 'en';
  }

  /// 설정값('system' 포함) → 실제로 쓸 언어 코드
  static String resolveAppLanguage(String setting) => setting == 'system' ? resolveSystemLanguage() : setting;

  static Future<void> setAppLanguage(String setting) async {
    appLangSetting = setting;
    appLangNotifier.value = resolveAppLanguage(setting);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_language_code', setting);
  }

  /// 아직 언어를 고른 적이 없는지 (앱 처음 시작 시 언어 선택 화면 표시용)
  static Future<bool> needsLanguageSelection() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('app_language_code') == null;
  }

  /// 실제로 쓸 언어 코드 (ko/en/zh/ja). 고른 적이 없으면 시스템 언어를 따른다.
  static Future<String> getAppLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final setting = prefs.getString('app_language_code') ?? 'system';
    appLangSetting = prefs.getString('app_language_code');
    final code = resolveAppLanguage(setting);
    appLangNotifier.value = code;
    return code;
  }

  // 15. 파일 이름 뒤에 형식(.pdf, .epub 등) 숨기기 설정
  // 3. 파일 표시 방식 기본값을 목록형('list')으로 변경
  static Future<void> setBookshelfViewMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bookshelf_view_mode_v27', mode);
  }

  static Future<String> getBookshelfViewMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('bookshelf_view_mode_v27') ?? 'list';
  }

  static Future<void> setHideFileExtension(bool hide) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hide_file_extension', hide);
  }

  static Future<bool> getHideFileExtension() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('hide_file_extension') ?? false;
  }

  /// 표지형에서 표지 그림 끄기 (켜면 아이콘만)
  static Future<void> setHideThumbnails(bool hide) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hide_thumbnails', hide);
  }

  static Future<bool> getHideThumbnails() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('hide_thumbnails') ?? false;
  }

  /// 사용자가 고른 표지 그림: 파일 경로 → 표지 그림 경로
  static Future<Map<String, String>> getCustomCovers() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final m = jsonDecode(prefs.getString('custom_covers') ?? '{}') as Map<String, dynamic>;
      return m.map((k, v) => MapEntry(k, '$v'));
    } catch (_) {
      return {};
    }
  }

  static Future<void> setCustomCover(String bookPath, String? coverPath) async {
    final prefs = await SharedPreferences.getInstance();
    final m = await getCustomCovers();
    if (coverPath == null) {
      m.remove(bookPath);
    } else {
      m[bookPath] = coverPath;
    }
    await prefs.setString('custom_covers', jsonEncode(m));
  }

  /// 파일 목록에서 [그룹 이름] 숨기기
  static Future<void> setHideGroupName(bool hide) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hide_group_name', hide);
  }

  static Future<bool> getHideGroupName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('hide_group_name') ?? false;
  }

  // 2. 즐겨찾기(별표) 도서 관리
  static Future<Set<String>> getFavoriteBooks() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList('favorite_book_paths') ?? [];
    return list.toSet();
  }

  static Future<bool> toggleFavoriteBook(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    final favs = (prefs.getStringList('favorite_book_paths') ?? []).toSet();
    final bool isNowFav;
    if (favs.contains(bookPath)) {
      favs.remove(bookPath);
      isNowFav = false;
    } else {
      favs.add(bookPath);
      isNowFav = true;
    }
    await prefs.setStringList('favorite_book_paths', favs.toList());
    return isNowFav;
  }

  // 2. 흔들어서 끄기 기본값에서 비활성(false)으로 설정
  static Future<void> setUseShakeLock(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_shake_lock_v27', enabled);
  }

  static Future<bool> getUseShakeLock() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_shake_lock_v27') ?? false;
  }

  static Future<void> setUseVolumeComboLock(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_volume_combo_lock', enabled);
  }

  static Future<bool> getUseVolumeComboLock() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_volume_combo_lock') ?? true;
  }

  static Future<void> setEpubBgTheme(String theme) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('epub_bg_theme', theme);
  }

  static Future<String> getEpubBgTheme() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('epub_bg_theme') ?? 'white';
  }

  // 2. 가로 모드 2페이지 보기는 꺼짐(false)을 기본값으로 설정
  static Future<void> setTwoPageLandscape(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('two_page_landscape_v30', enabled);
  }

  static Future<bool> getTwoPageLandscape() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('two_page_landscape_v30') ?? false;
  }

  static String _normalizeBookKey(String bookPath) {
    return bookPath.replaceAll(
      RegExp(r'(_v25_converted|\.v2\.converted|\.converted)\.epub$', caseSensitive: false),
      '',
    );
  }

  // 12. 파일마다 읽기 방향 기억하기 (처음 여는 파일은 좌->우(false)가 기본값)
  static Future<void> setBookReadingDirectionRtl(String bookPath, bool isRtl) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _normalizeBookKey(bookPath);
    await prefs.setBool('reading_dir_rtl_v26_$key', isRtl);
  }

  static Future<bool> getBookReadingDirectionRtl(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _normalizeBookKey(bookPath);
    return prefs.getBool('reading_dir_rtl_v26_$key') ?? false;
  }

  static Future<void> setUseVolumeTurn(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_volume_turn', enabled);
  }

  static Future<bool> getUseVolumeTurn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_volume_turn') ?? true;
  }

  static Future<void> setUseQuickNavTurn(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_quick_nav_turn', enabled);
  }

  static Future<bool> getUseQuickNavTurn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_quick_nav_turn') ?? false;
  }

  static Future<void> setUseSpenTurn(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_spen_turn', enabled);
  }

  static Future<void> setUseSwipeTurn(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_swipe_turn', enabled);
  }

  static Future<bool> getUseSwipeTurn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_swipe_turn') ?? true;
  }

  // 위로 밀어서 다음 페이지 / 아래로 밀어서 이전 페이지 (기본값: 켜짐)
  static Future<void> setUseSwipeUpTurn(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_swipe_up_turn', enabled);
  }

  static Future<bool> getUseSwipeUpTurn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_swipe_up_turn') ?? false; // 위로 밀기는 기본값에서 뺌
  }

  // 메모 지우개 종류: 'area'(닿은 부분만) / 'stroke'(닿은 획 전체)
  static Future<void> setMemoEraserType(String type) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('memo_eraser_type', type);
  }

  static Future<String> getMemoEraserType() async {
    final prefs = await SharedPreferences.getInstance();
    final v = prefs.getString('memo_eraser_type');
    return (v == 'stroke' || v == 'area') ? v! : 'area';
  }

  static Future<bool> getUseSpenTurn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('use_spen_turn') ?? false;
  }

  static Future<void> setFooterInfoMode(String mode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('footer_info_mode', mode);
  }

  static Future<String> getFooterInfoMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('footer_info_mode') ?? 'none';
  }

  // 9. 진행바 UI 하단('bottom')을 기본값으로 설정
  static Future<void> setProgressBarPosition(String pos) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('progress_bar_pos_v26', pos);
  }

  static Future<String> getProgressBarPosition() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('progress_bar_pos_v26') ?? 'bottom';
  }

  // 메모 도구모음 위치: 'bottom'(기본) / 'top' / 'left' / 'right'
  static Future<void> setMemoToolbarPosition(String pos) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('memo_toolbar_pos', pos);
  }

  static Future<String> getMemoToolbarPosition() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('memo_toolbar_pos') ?? 'bottom';
  }

  // 도구 모음(활 모양 메뉴) 위치: 'right'(기본) / 'left'
  static Future<void> setQuickMenuSide(String side) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('quick_menu_side', side);
  }

  static Future<String> getQuickMenuSide() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('quick_menu_side') ?? 'right';
  }

  static Future<void> savePageMemoStrokes(
      String bookKey, int pageIndex, List<MemoStroke> strokes) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'memo_strokes_${bookKey}_$pageIndex',
      jsonEncode(strokes.map((e) => e.toJson()).toList()),
    );
  }

  static Future<List<MemoStroke>> getPageMemoStrokes(
      String bookKey, int pageIndex) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('memo_strokes_${bookKey}_$pageIndex');
    if (raw == null) return [];
    final List decoded = jsonDecode(raw);
    return decoded.map((e) => MemoStroke.fromJson(e)).toList();
  }

  static Future<void> savePageMemoNote(String bookKey, int pageIndex, String note) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('memo_note_${bookKey}_$pageIndex', note);
  }

  static Future<String> getPageMemoNote(String bookKey, int pageIndex) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('memo_note_${bookKey}_$pageIndex') ?? '';
  }

  static Future<void> saveEpubLocationStrokes(
      String bookKey, String locationKey, List<MemoStroke> strokes) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      'epub_strokes_${bookKey}_$locationKey',
      jsonEncode(strokes.map((e) => e.toJson()).toList()),
    );
  }

  static Future<List<MemoStroke>> getEpubLocationStrokes(
      String bookKey, String locationKey) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('epub_strokes_${bookKey}_$locationKey');
    if (raw == null) return [];
    final List decoded = jsonDecode(raw);
    return decoded.map((e) => MemoStroke.fromJson(e)).toList();
  }

  static Future<List<BookmarkItem>> getBookmarks(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    final rawList = prefs.getStringList('bm_$bookPath') ?? [];
    return rawList.map((e) => BookmarkItem.fromJson(jsonDecode(e))).toList();
  }

  static Future<void> addBookmark(String bookPath, BookmarkItem item) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getBookmarks(bookPath);
    list.add(item);
    await prefs.setStringList(
      'bm_$bookPath',
      list.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }

  static Future<void> removeBookmark(String bookPath, String id) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getBookmarks(bookPath);
    list.removeWhere((e) => e.id == id);
    await prefs.setStringList(
      'bm_$bookPath',
      list.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }

  static Future<List<String>> getGroups() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList('book_groups_v2') ?? ['전체', 'PDF/문서'];
  }

  static Future<void> addGroup(String groupName) async {
    final prefs = await SharedPreferences.getInstance();
    final groups = await getGroups();
    if (!groups.contains(groupName)) {
      groups.add(groupName);
      await prefs.setStringList('book_groups_v2', groups);
    }
  }

  /// 그룹 순서 저장 ([전체]는 항상 맨 앞)
  static Future<void> setGroupOrder(List<String> groups) async {
    final prefs = await SharedPreferences.getInstance();
    final ordered = ['전체', ...groups.where((g) => g != '전체')];
    await prefs.setStringList('book_groups_v2', ordered);
  }

  static Future<void> removeGroup(String groupName) async {
    if (groupName == '전체') return;
    final prefs = await SharedPreferences.getInstance();
    final groups = await getGroups();
    groups.remove(groupName);
    await prefs.setStringList('book_groups_v2', groups);
    for (final key in prefs.getKeys().toList()) {
      if (key.startsWith('grp_') && prefs.getString(key) == groupName) {
        await prefs.setString(key, '미분류');
      }
    }
  }

  static Future<void> setBookGroup(String bookPath, String groupName) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('grp_$bookPath', groupName);
  }

  static Future<String> getBookGroup(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('grp_$bookPath') ?? '미분류';
  }

  static Future<void> migrateBookMetadata(String oldPath, String newPath) async {
    if (oldPath == newPath) return;
    final prefs = await SharedPreferences.getInstance();
    final oldNorm = _normalizeBookKey(oldPath);
    final newNorm = _normalizeBookKey(newPath);
    final oldRtl = prefs.getBool('reading_dir_rtl_v26_$oldNorm');
    if (oldRtl != null) {
      await prefs.setBool('reading_dir_rtl_v26_$newNorm', oldRtl);
      await prefs.remove('reading_dir_rtl_v26_$oldNorm');
    }
    for (final prefix in ['pos_', 'prev_pos_', 'prog_', 'pagelbl_', 'grp_']) {
      final val = prefs.get('$prefix$oldPath');
      if (val != null) {
        if (val is String) await prefs.setString('$prefix$newPath', val);
        if (val is double) await prefs.setDouble('$prefix$newPath', val);
        await prefs.remove('$prefix$oldPath');
      }
    }
    final covers = await getCustomCovers();
    final cover = covers.remove(oldPath);
    if (cover != null) {
      covers[newPath] = cover;
      await prefs.setString('custom_covers', jsonEncode(covers));
    }
    final bms = prefs.getStringList('bm_$oldPath');
    if (bms != null) {
      await prefs.setStringList('bm_$newPath', bms);
      await prefs.remove('bm_$oldPath');
    }
    final favs = (prefs.getStringList('favorite_book_paths') ?? []).toSet();
    if (favs.contains(oldPath)) {
      favs.remove(oldPath);
      favs.add(newPath);
      await prefs.setStringList('favorite_book_paths', favs.toList());
    }
    for (final key in prefs.getKeys().toList()) {
      for (final prefix in [
        'bubbles_v5_',
        'memo_strokes_',
        'memo_note_',
        'epub_strokes_',
      ]) {
        final matchPrefix = '$prefix${oldPath}_';
        if (key.startsWith(matchPrefix)) {
          final suffix = key.substring(matchPrefix.length);
          final strVal = prefs.getString(key);
          if (strVal != null) {
            await prefs.setString('$prefix${newPath}_$suffix', strVal);
          }
          await prefs.remove(key);
        }
      }
    }
  }

  static Future<void> removeBookMetadata(String bookPath) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('reading_dir_rtl_v26_${_normalizeBookKey(bookPath)}');
    await prefs.remove('pos_$bookPath');
    await prefs.remove('prev_pos_$bookPath');
    await prefs.remove('prog_$bookPath');
    await prefs.remove('pagelbl_$bookPath');
    await prefs.remove('bm_$bookPath');
    await prefs.remove('grp_$bookPath');
    final favs = (prefs.getStringList('favorite_book_paths') ?? []).toSet();
    if (favs.remove(bookPath)) {
      await prefs.setStringList('favorite_book_paths', favs.toList());
    }
    for (final key in prefs.getKeys().toList()) {
      if (key.startsWith('bubbles_v5_${bookPath}_') ||
          key.startsWith('bubbles_v4_${bookPath}_') ||
          key.startsWith('bubbles_v3_${bookPath}_') ||
          key.startsWith('bubbles_v2_${bookPath}_') ||
          key.startsWith('bubbles_${bookPath}_') ||
          key.startsWith('memo_strokes_${bookPath}_') ||
          key.startsWith('memo_note_${bookPath}_') ||
          key.startsWith('epub_strokes_${bookPath}_')) {
        await prefs.remove(key);
      }
    }
  }

}
