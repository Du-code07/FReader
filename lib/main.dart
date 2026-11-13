import 'dart:async';
import 'dart:io';
import 'dart:isolate';
import 'dart:math' as math;
import 'package:archive/archive.dart';
import 'package:flutter/material.dart';
import 'services/app_messenger.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'screens/pdf_and_image_viewer.dart';
import 'screens/reader_screen.dart';
import 'screens/language_select_screen.dart';
import 'screens/app_settings_screen.dart';
import 'screens/document_scanner_screen.dart';
import 'widgets/sheet_pull_to_close.dart';
import 'widgets/file_type_icon.dart';
import 'widgets/memo_tools.dart';
import 'widgets/favorite_ribbon.dart';
import 'widgets/group_stack_icon.dart';
import 'widgets/group_jump_menu.dart';
import 'widgets/viewer_dialogs.dart';
import 'widgets/ui_scale.dart';
import 'services/storage_service.dart';
import 'services/user_fonts.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart' show EpubBookServer;
import 'services/doc_thumbnail_service.dart';

/// 상태표시줄 본래 높이(기기 픽셀). 태블릿에서 상단바를 이 높이에 맞춰 항상 내려 둔다
final ValueNotifier<int> statusBarHeightPx = ValueNotifier<int>(0);

Future<void> _readStatusBarHeight() async {
  try {
    final px = await const MethodChannel('ebook_reader/volume_control').invokeMethod<int>('statusBarHeight');
    if (px != null && px > 0) statusBarHeightPx.value = px;
  } catch (_) {}
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // 상태표시줄 본래 높이 (태블릿에서 상단바를 이만큼 항상 내려 둠)
  await _readStatusBarHeight();
  PaintingBinding.instance.imageCache.maximumSize = 3000;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 300 << 20;
  try {
    await UserFonts.dir(); // 사용자가 넣은 글꼴 폴더 (문서 화면이 바로 읽을 수 있게 미리 준비)
    EpubBookServer.userFontDir = UserFonts.cachedDirPath; // EPUB 글꼴도 같은 폴더에서
    await UserFonts.loadAppFont();
  } catch (_) {}
  await StorageService.loadRememberPage();
  final initialThemeMode = await StorageService.getAppThemeMode();
  final initialLang = await StorageService.getAppLanguage();
  // 앱 처음 시작 시(언어를 고른 적 없을 때) 언어 선택 화면부터 보여 준다
  final needsLanguage = await StorageService.needsLanguageSelection();
  runApp(MyEbookApp(initialThemeMode: initialThemeMode, initialLang: initialLang, needsLanguage: needsLanguage));
}

/// 문서 폴더·휴지통·표지 폴더의 파일 경로들 (다른 isolate에서 읽음)
Future<({List<String> files, List<String> trash, List<String> thumbs})> _listLibraryFolders(String docs, String trash, String thumbs) {
  return Isolate.run(() {
    List<String> filesIn(String path, {bool create = false}) {
      final d = Directory(path);
      try {
        if (!d.existsSync()) {
          if (create) d.createSync(recursive: true);
          return const [];
        }
        return [for (final e in d.listSync()) if (e is File) e.path];
      } catch (_) {
        return const [];
      }
    }

    return (files: filesIn(docs), trash: filesIn(trash), thumbs: filesIn(thumbs, create: true));
  });
}

class MyEbookApp extends StatefulWidget {
  final String initialThemeMode; // 'system' | 'light' | 'dark'
  final String initialLang;
  final bool needsLanguage;
  const MyEbookApp({
    super.key,
    required this.initialThemeMode,
    required this.initialLang,
    this.needsLanguage = false,
  });

  @override
  State<MyEbookApp> createState() => _MyEbookAppState();
}

class _MyEbookAppState extends State<MyEbookApp> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late String _themeMode;
  bool get _isDarkMode => StorageService.isDarkFor(_themeMode);
  late String _appLang;
  late bool _needsLanguage;
  late final AnimationController _rotationAnimController;
  late final Animation<double> _rotationFadeAnim;
  late final Animation<double> _rotationScaleAnim;
  @override
  void initState() {
    super.initState();
    // '완전 다크 모드'는 없앰: 예전에 고른 경우 다크 모드로
    _themeMode = widget.initialThemeMode == 'black' ? 'dark' : widget.initialThemeMode;
    _appLang = widget.initialLang;
    _needsLanguage = widget.needsLanguage;
    WidgetsBinding.instance.addObserver(this);
    _rotationAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 240),
      value: 1.0,
    );
    _rotationFadeAnim = Tween<double>(begin: 0.72, end: 1.0).animate(
      CurvedAnimation(parent: _rotationAnimController, curve: Curves.easeOutCubic),
    );
    _rotationScaleAnim = Tween<double>(begin: 0.96, end: 1.0).animate(
      CurvedAnimation(parent: _rotationAnimController, curve: Curves.easeOutCubic),
    );
    StorageService.desiredLandscapeNotifier.addListener(_onDesiredOrientationChanged);
    // 화면이 다 붙은 뒤에 실제 상태표시줄 높이를 한 번 더 읽음 (시작 직후에는 못 읽는 기기가 있음)
    WidgetsBinding.instance.addPostFrameCallback((_) => _readStatusBarHeight());
  }

  void _onDesiredOrientationChanged() {
    if (mounted) {
      _rotationAnimController.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    StorageService.desiredLandscapeNotifier.removeListener(_onDesiredOrientationChanged);
    WidgetsBinding.instance.removeObserver(this);
    _rotationAnimController.dispose();
    super.dispose();
  }


  /// 앱 테마 바꾸기 ('system' | 'light' | 'dark')
  Future<void> _changeThemeMode(String mode) async {
    setState(() => _themeMode = mode);
    await StorageService.setAppThemeMode(mode);
  }

  /// [setting]: 'system'(기본 시스템) 또는 'ko'/'en'/'zh'/'ja'
  void _changeAppLanguage(String setting) async {
    setState(() => _appLang = StorageService.resolveAppLanguage(setting));
    await StorageService.setAppLanguage(setting);
  }

  // '기본 시스템' 테마일 때 휴대폰의 밝게/어둡게가 바뀌면 다시 그린다
  @override
  void didChangePlatformBrightness() {
    if (_themeMode == 'system' && mounted) setState(() {});
  }

  // '기본 시스템'일 때 휴대폰 언어를 바꾸면 앱 문구도 따라 바뀐다
  @override
  void didChangeLocales(List<Locale>? locales) {
    final setting = StorageService.appLangSetting ?? 'system';
    if (setting != 'system') return;
    final code = StorageService.resolveSystemLanguage();
    StorageService.appLangNotifier.value = code;
    if (mounted && code != _appLang) setState(() => _appLang = code);
  }

  /// 앱 테마: 다크는 기본(남색 기운) / 완전 다크(검정) / 밝은 다크(회색) 세 가지
  /// 글씨·아이콘은 전체적으로 조금 작게 (아이콘 기본 21)
  ThemeData _appTheme(Brightness b, {String variant = 'dark'}) {
    final appFont = UserFonts.appFont.value;
    var scheme = ColorScheme.fromSeed(seedColor: Colors.indigo, brightness: b);
    if (b == Brightness.dark && variant == 'black') {
      scheme = scheme.copyWith(
        surface: Colors.black,
        surfaceContainerLowest: Colors.black,
        surfaceContainerLow: const Color(0xFF0B0B0D),
        surfaceContainer: const Color(0xFF121214),
        surfaceContainerHigh: const Color(0xFF18181B),
        surfaceContainerHighest: const Color(0xFF202024),
      );
    } else if (b == Brightness.dark && variant == 'dim') {
      scheme = scheme.copyWith(
        surface: const Color(0xFF2B2D31),
        surfaceContainerLowest: const Color(0xFF232428),
        surfaceContainerLow: const Color(0xFF2F3136),
        surfaceContainer: const Color(0xFF34363C),
        surfaceContainerHigh: const Color(0xFF3A3C42),
        surfaceContainerHighest: const Color(0xFF42444B),
      );
    }
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      fontFamily: appFont == null ? null : UserFonts.appFontFamily(appFont),
      iconTheme: IconThemeData(size: 21, color: scheme.onSurface),
      // 상단바 아이콘: 테마 글자색 (다크·밝은 다크에서도 보이게)
      appBarTheme: AppBarTheme(
        iconTheme: IconThemeData(size: 21, color: scheme.onSurface),
        actionsIconTheme: IconThemeData(size: 21, color: scheme.onSurfaceVariant),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<UserFontEntry?>(
      valueListenable: UserFonts.appFont,
      builder: (context, _, __) => _buildApp(context),
    );
  }

  Widget _buildApp(BuildContext context) {
    return MaterialApp(
      scaffoldMessengerKey: appMessengerKey,
      debugShowCheckedModeBanner: false,
      title: 'FReader',
      // 테마를 바꿀 때 색을 서서히 섞는 동안 화면 전체를 매번 다시 그려 느려짐 → 바로 바꿈
      themeAnimationDuration: Duration.zero,
      themeMode: (_themeMode == 'dark' || _themeMode == 'black' || _themeMode == 'dim')
          ? ThemeMode.dark
          : (_themeMode == 'light' ? ThemeMode.light : ThemeMode.system),
      theme: _appTheme(Brightness.light),
      darkTheme: _appTheme(Brightness.dark, variant: _themeMode),
      builder: (context, child) {
        // 상태표시줄을 내려 화면 위에 보이는 동안에는 그 높이만큼 위쪽 여백을 늘려
        // 상단바(SafeArea를 쓰는 곳 모두)가 함께 내려와 겹치지 않게 한다
        // 태블릿: 상태표시줄을 내려도 상단바 아이콘을 가리지 않도록 상단바를 상태표시줄 높이만큼 항상 내려 둔다
        // (앱 시작 화면·파일 열람 화면 모두. 휴대폰은 그대로)
        // 상단바 아이콘 위에는 원래 16dp 빈칸이 있으므로, 상태표시줄 높이보다 10dp 덜 내려
        // 상태표시줄 바로 아래(약 6dp 여유)에 아이콘이 오게 한다
        final content = ValueListenableBuilder<int>(
          valueListenable: statusBarHeightPx,
          builder: (context, px, _) {
            final mq = MediaQuery.of(context);
            final bool tablet = mq.size.shortestSide >= 600;
            final double dpr = mq.devicePixelRatio > 0 ? mq.devicePixelRatio : 1.0;
            final double top = px / dpr - 10;
            // 글씨를 전체적으로 약 3pt 작게 (16 → 13.6)
            final scaler = TextScaler.linear((mq.textScaler.scale(16) / 16) * 0.85);
            if (!tablet || top <= mq.padding.top + 0.5) {
              return MediaQuery(data: mq.copyWith(textScaler: scaler), child: child ?? const SizedBox.shrink());
            }
            return MediaQuery(
              data: mq.copyWith(
                textScaler: scaler,
                padding: mq.padding.copyWith(top: top),
                viewPadding: mq.viewPadding.copyWith(top: math.max(mq.viewPadding.top, top)),
              ),
              child: child ?? const SizedBox.shrink(),
            );
          },
        );
        return FadeTransition(
          opacity: _rotationFadeAnim,
          child: ScaleTransition(
            scale: _rotationScaleAnim,
            // 아이콘을 꾹 누르거나 S펜을 가까이 대면 뜨던 이름 말풍선을 모두 끔 (화면 낭독용 이름은 그대로)
            // 화면이 넓으면(태블릿 등) 기준 휴대폰과 같은 비율로 앱 화면 전체를 크게
            child: TooltipVisibility(visible: false, child: UiScaleBox(child: content)),
          ),
        );
      },
      home: _needsLanguage
          ? LanguageSelectScreen(
              onConfirmed: (setting) {
                _changeAppLanguage(setting);
                setState(() => _needsLanguage = false);
              },
            )
          : BookshelfScreen(
              isDarkMode: _isDarkMode,
              appLang: _appLang,
              themeMode: _themeMode,
              onChangeThemeMode: _changeThemeMode,
              onChangeLanguage: _changeAppLanguage,
            ),
    );
  }
}

/// 6. 실제 앱에 표시되는 아이콘 위젯들을 그대로 사용하여 위치를 시각적으로 보여주는 '사용 설명서' 화면
class UserManualScreen extends StatelessWidget {
  final String appLang;
  const UserManualScreen({super.key, required this.appLang});

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(appLang, ko: ko, en: en, zh: zh, ja: ja);

  Widget _buildDualDirectionSampleIcon() {
    return const SizedBox(
      width: 24,
      height: 22,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(top: 1, child: Icon(Icons.east, size: 14, color: Colors.amber)),
          Positioned(bottom: 1, child: Icon(Icons.west, size: 14, color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _buildIconGuideRow({
    required Widget iconWidget,
    required String title,
    required String desc,
    Color iconBg = const Color(0xFF1E293B),
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: iconWidget,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 3),
                Text(desc, style: const TextStyle(fontSize: 12.5, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_tr('사용 설명서', 'User Manual', '使用说明书', '取扱説明書')),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 1. 서재(MY) 화면 상단 및 파일 아이콘 안내
            Text(
              _tr('1. 서재(MY) 화면 아이콘 안내', '1. Bookshelf (MY) Screen Icons', '1. 书架 (MY) 界面图标说明', '1. 書斎(MY)画面のアイコン説明'),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            // 실제 서재 상단 바 미리보기
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'MY',
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      const Icon(Icons.dark_mode, color: Colors.white, size: 17),
                      const SizedBox(width: 14),
                      const Icon(Icons.picture_as_pdf_outlined, color: Colors.white, size: 17),
                      const SizedBox(width: 14),
                      const Icon(Icons.photo_library_outlined, color: Colors.white, size: 17),
                      const SizedBox(width: 14),
                      const Icon(Icons.delete_outline, color: Colors.white, size: 17),
                      const SizedBox(width: 14),
                      const Icon(Icons.settings_outlined, color: Colors.white, size: 17),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.indigo,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _tr('전체', 'All', '全部', 'すべて'),
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('PDF/문서', style: TextStyle(color: Colors.white, fontSize: 12)),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.amber),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.add, size: 14, color: Colors.amber),
                      ),
                      const Spacer(),
                      const Icon(Icons.more_horiz, color: Colors.white70, size: 17),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.dark_mode, color: Colors.white, size: 19),
              title: _tr('다크 모드 / 라이트 모드 전환', 'Toggle Dark / Light Mode', '切换深色 / 浅色模式', 'ダーク / ライトモード切替'),
              desc: _tr('앱 전체 화면 테마를 라이트 모드와 다크 모드로 전환합니다.', 'Switches the app theme between Light and Dark mode.', '在浅色模式和深色模式之间切换。', 'アプリ全体のテーマをライト/ダークに切り替えます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.picture_as_pdf_outlined, color: Colors.white, size: 19),
              title: _tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合'),
              desc: _tr('2개 이상의 PDF 파일을 고른 순서대로 또는 파일 이름 순서대로 합쳐 하나의 PDF로 만듭니다.', 'Merges 2 or more PDF files in selected order or filename order into a single PDF.', '按所选顺序或文件名顺序将多个 PDF 合并为一个 PDF。', '2つ以上のPDFを選択順または名前順に結合して1つのPDFにします。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.photo_library_outlined, color: Colors.white, size: 19),
              title: _tr('이미지 합치기', 'Merge Images', '合并图片', '画像結合'),
              desc: _tr('여러 장의 JPG/PNG 이미지를 고른 순서 또는 이름 순서대로 묶어 단권 파일(.cbz)로 만듭니다.', 'Bundles multiple JPG/PNG images in selected or filename order into a single .cbz book.', '将多张图片按选择顺序或名称顺序打包为单本文件(.cbz)。', '複数のJPG/PNG画像を選択順または名前順にまとめて1冊(.cbz)にします。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.document_scanner_outlined, color: Colors.white, size: 19),
              title: _tr('문서 스캔', 'Scan Document', '扫描文档', '文書スキャン'),
              desc: _tr('카메라로 문서를 여러 장 촬영한 뒤 스캔본처럼 선명하게 보정(스캔 필터·진하기·회전·자르기)하여 하나의 PDF 파일로 만듭니다.', 'Take multiple photos with the camera, enhance them into clean document scans, and bundle them into a single PDF.', '使用相机拍摄多张文档照片，转换为清晰扫描件并合并为单个 PDF 文件。', 'カメラで複数枚撮影し、スキャン補正して1つのPDFファイルにまとめます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.delete_outline, color: Colors.white, size: 19),
              title: _tr('휴지통', 'Trash Bin', '回收站', 'ゴミ箱'),
              desc: _tr('삭제된 파일을 확인하고 복원하거나 영구 삭제합니다.', 'Restore or permanently delete trashed files.', '查看、恢复或永久删除已删除的文件。', '削除したファイルの復元または完全削除を行います。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.settings_outlined, color: Colors.white, size: 19),
              title: _tr('앱 설정', 'App Settings', '应用设置', 'アプリ設定'),
              desc: _tr('앱 언어(한국어/영어/중국어/일본어) 변경, 파일 형식 숨기기, 사용 설명서를 확인합니다.', 'Change app language (KO/EN/ZH/JA), hide file extensions, and open the User Manual.', '更改应用语言、隐藏文件扩展名及查看使用说明书。', '言語(韓/英/中/日)変更、拡張子非表示、取扱説明書を確認します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.add, color: Colors.amber, size: 21),
              title: _tr('새 그룹 추가 (+ 버튼)', 'Add New Group (+)', '新建分组 (+)', '新規グループ追加 (+)'),
              desc: _tr('그룹 네모칸 맨 오른쪽의 [+] 아이콘을 눌러 새 그룹을 추가합니다. (기존 그룹 길게 누르기: 삭제)', 'Tap [+] at the right end of the group bar to add a group (long-press a group to delete).', '点击分组栏最右侧的 [+] 新建分组（长按分组可删除）。', 'グループバー右端の[+]で新規グループを追加します(長押しで削除)。'),
            ),
            _buildIconGuideRow(
              iconWidget: const SizedBox(
                width: 24,
                height: 24,
                child: FavoriteRibbon(active: true, width: 12, height: 18, isDark: true),
              ),
              title: _tr('북마크 (책갈피)', 'Bookmark', '书签', 'ブックマーク (しおり)'),
              desc: _tr('파일 왼쪽 위의 책갈피를 누르거나, 목록형에서 파일을 오른쪽으로 밀면 북마크되어 책갈피가 노랗게 내려오며 해당 그룹의 가장 상단에 위치합니다. 그룹 막대의 책갈피 아이콘을 누르면 북마크한 파일만 볼 수 있고, 한 번 더 누르거나 밀면 해제됩니다.', 'Tap the bookmark at the top-left of a file, or swipe a file right in list view: the bookmark drops down in yellow and the file is pinned to the top of its group. Tap or swipe again to remove.', '点击文件左上角的书签，或在列表视图中向右滑动文件：书签变黄落下并置顶于当前分组。再次点击或滑动即可取消。', 'ファイル左上のしおりをタップ、またはリスト表示でファイルを右へスワイプすると、しおりが黄色く下りてグループの最上部に固定されます。もう一度で解除します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.more_horiz, color: Colors.white, size: 19),
              title: _tr('이름 변경 (점 3개 메뉴)', 'Rename File (⋯ Menu)', '重命名文件 (⋯ 菜单)', 'ファイル名変更 (⋯ メニュー)'),
              desc: _tr('파일 오른쪽의 점 3개를 눌러 확장자를 유지한 채 파일 이름을 변경합니다.', 'Tap the ⋯ on the right of a file to rename it while preserving its extension.', '点击文件右侧的 ⋯，保持扩展名不变并修改文件名称。', 'ファイル右の ⋯ をタップし、拡張子を維持したままファイル名を変更します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.drive_file_move_outline, color: Colors.white, size: 19),
              title: _tr('그룹 이동 (개별 및 다중 선택)', 'Move to Group (Single & Batch)', '移动分组 (单个与批量)', 'グループ移動 (個別・一括)'),
              desc: _tr('점 3개 메뉴에서 파일을 다른 그룹으로 옮깁니다. 파일을 길게 눌러 다중 선택하면 하단 [그룹 이동] 버튼으로 한 번에 이동할 수 있습니다.', 'Moves the file to another group. Long-press files to batch move multiple files at once.', '将文件移至其他分组；长按多选后可通过底部按钮批量移动。', '別のグループへ移動します。長押しで複数選択すると一括移動できます。'),
            ),

            const Divider(height: 36),

            // 2. 파일 열람 시 나오는 상단 UI 아이콘 안내
            Text(
              _tr('2. 파일 열람 시 상단 UI 아이콘 안내', '2. Viewer Top Bar Icons', '2. 阅读界面顶部栏图标说明', '2. ファイル閲覧時の上部UIアイコン説明'),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            // 실제 뷰어 상단 바 미리보기
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(14),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    const Icon(Icons.arrow_back, color: Colors.white, size: 17),
                    const SizedBox(width: 12),
                    const Icon(Icons.list, color: Colors.white, size: 17),
                    const SizedBox(width: 12),
                    Text(
                      _tr('문서 제목', 'Document', '文档标题', '文書タイトル'),
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 18),
                    const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 19),
                    const SizedBox(width: 12),
                    const Icon(Icons.skip_next_rounded, color: Colors.white, size: 19),
                    const SizedBox(width: 12),
                    const Icon(Icons.lock_outline, color: Colors.white, size: 17),
                    const SizedBox(width: 12),
                    const Icon(Icons.screen_rotation, color: Colors.white, size: 17),
                    const SizedBox(width: 12),
                    const QuillInkIcon(color: Colors.amber, size: 21),
                    const SizedBox(width: 12),
                    const Icon(Icons.menu_book, color: Colors.amber, size: 17),
                    const SizedBox(width: 12),
                    _buildDualDirectionSampleIcon(),
                    const SizedBox(width: 12),
                    const Icon(Icons.bookmarks_outlined, color: Colors.white, size: 17),
                    const SizedBox(width: 12),
                    const Icon(Icons.tune, color: Colors.white, size: 17),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.arrow_back, color: Colors.white, size: 19),
              title: _tr('뒤로가기', 'Back to Bookshelf', '返回书架', '書斎へ戻る'),
              desc: _tr('서재 화면으로 돌아갑니다. (화면 잠금 상태였다면 자동으로 잠금이 해제되며, 백그라운드 번역은 계속 유지됩니다.)', 'Returns to the bookshelf (automatically unlocks screen if locked; background translation continues).', '返回书架（若处于锁定状态则自动解锁，后台翻译继续进行）。', '書斎に戻ります(画面ロック中は自動解除され、バックグラウンド翻訳は継続します)。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.list, color: Colors.white, size: 19),
              title: _tr('목차 열기 (문서/EPUB)', 'Table of Contents', '打开目录', '目次を開く'),
              desc: _tr('EPUB 문서의 장(Chapter) 목록 서랍을 엽니다.', 'Opens the chapter drawer for EPUB documents.', '打开 EPUB 文档章节目录侧边栏。', 'EPUB文書の目次を開きます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.skip_previous_rounded, color: Colors.white, size: 17),
                  Icon(Icons.skip_next_rounded, color: Colors.white, size: 17),
                ],
              ),
              title: _tr('이전 파일 / 다음 파일 이동 (같은 그룹)', 'Previous / Next File in Same Group', '同分组上一文件 / 下一文件', '同じグループ内の前 / 次のファイルへ移動'),
              desc: _tr('서재로 나가지 않고 현재 파일과 같은 그룹에 있는 이전 파일 또는 다음 파일로 즉시 이동합니다.', 'Jumps directly to the previous or next file within the same group without leaving the viewer.', '无需返回书架，直接切换到同一分组中的上一个或下一个文件。', '書斎に戻らずに同じグループ内の前/次のファイルを直接開きます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const QuillInkIcon(color: Colors.amber, size: 23),
              title: _tr('S펜 필기 모드 열기/닫기', 'S Pen Handwriting Mode', 'S Pen 手写模式', 'Sペン手書きモード'),
              desc: _tr('S펜 전용 필기 툴바를 엽니다. 필기 모드가 켜진 동안에는 S펜으로 화면을 움직여도 페이지가 흔들리거나 넘어가지 않으며, 손가락 스와이프로만 페이지가 이동합니다.', 'Opens the S Pen toolbar. While active, S Pen strokes never move or turn the page; finger swipes turn pages.', '打开 S Pen 工具栏。开启时 S Pen 书写不会移动页面，仅手指滑动可翻页。', 'Sペンツールバーを開きます。手書き中はSペンで画面が動かず、指のスワイプでのみページがめくれます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.menu_book, color: Colors.amber, size: 19),
              title: _tr('페이지 표시', 'Page Display', '页面显示', 'ページ表示'),
              desc: _tr('한 페이지 / 두 페이지 / 자동(넓으면 두 페이지) 중에서 고릅니다. 세로 화면에도 적용되며, 스크롤 모드에서는 바뀌지 않습니다.', 'Choose One Page / Two Pages / Auto. Works in portrait too; not applied in scroll mode.', '可选择单页 / 双页 / 自动。竖屏同样适用，滚动模式下不变。', '1ページ / 2ページ / 自動 から選びます。縦画面にも適用され、スクロールモードでは変わりません。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.screen_rotation, color: Colors.white, size: 19),
              title: _tr('화면 회전', 'Rotate Screen', '旋转屏幕', '画面回転'),
              desc: _tr('누르면 자동 / 세로 고정 / 가로 고정 중에서 고를 수 있고, 아이콘이 고른 설정 모양으로 바뀝니다.', 'Choose Auto / Portrait Lock / Landscape Lock; the icon shows the chosen setting.', '可选择自动 / 锁定竖屏 / 锁定横屏，图标会显示所选设置。', '自動 / 縦に固定 / 横に固定から選べ、アイコンが選んだ設定の形になります。'),
            ),
            _buildIconGuideRow(
              iconWidget: _buildDualDirectionSampleIcon(),
              title: _tr('읽기 방향 전환 (좌 → 우 / 우 → 좌)', 'Reading Direction (L → R / R → L)', '阅读方向切换 (左 → 右 / 右 → 左)', '読書方向切替 (左 → 右 / 右 → 左)'),
              desc: _tr('일반 도서 방향(좌 → 우, 기본값)과 만화 방향(우 → 좌)을 전환하며, 각 파일마다 설정한 읽기 방향을 개별적으로 기억합니다. 페이지 모드가 탭·슬라이드일 때만 적용되고, 스크롤은 원본 순서 그대로입니다.', 'Switches between L → R (default) and R → L reading direction and remembers it for each file individually.', '切换左 → 右（默认）与右 → 左方向，并为每个文件单独记忆。', '左 → 右(基本)と右 → 左を切り替え、ファイルごとに記憶します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.bookmarks_outlined, color: Colors.white, size: 19),
              title: _tr('북마크 추가 및 목록', 'Bookmarks', '书签管理', 'ブックマーク'),
              desc: _tr('현재 페이지를 북마크에 저장하거나 저장된 북마크 위치로 즉시 이동합니다.', 'Saves the current page as a bookmark or jumps to saved bookmarks.', '添加当前页书签或跳转到已保存的书签位置。', '現在のページをブックマーク登録、または登録済み位置へ移動します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.tune, color: Colors.white, size: 19),
              title: _tr('뷰어 설정', 'Viewer Settings', '阅读器设置', 'ビューア設定'),
              desc: _tr('글자 크기·배경색(라이트/다크/종이색 — 종이색은 EPUB만), 화면 잠금 방식(흔들기 / 음량 버튼 동시 입력), 페이지 모드(탭 / 스크롤 / 슬라이드), 페이지 넘김 버튼(음량 / 페이지 이동 / S펜), 진행도 UI 위치를 설정합니다.', 'Configure font size, background (light/dark/paper — paper for EPUB only), screen lock (shake / dual volume), page turn buttons, and progress bar position.', '设置字号、背景色（浅色/深色/纸张色）、屏幕锁定方式（摇晃/双音量键）、翻页按钮及进度条位置。', '文字サイズ・背景色(ライト/ダーク/紙色)、画面ロック方式(振る/音量同時押し)、ページ 전환、進行度バー位置を設定します。'),
            ),

            const Divider(height: 36),

            // 3. S펜 툴바 & 하단 진행도 UI & 페이지 이동 버튼 안내
            Text(
              _tr('3. S펜 필기 툴바 및 하단 이동 아이콘 안내', '3. S Pen Toolbar & Bottom Navigation Icons', '3. S Pen 工具栏与底部导航图标', '3. Sペンツールバーと下部移動アイコン'),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.touch_app, color: Colors.amber, size: 19),
              title: _tr('손으로 글씨 쓰기 (한 손가락 모양 아이콘)', 'Finger Writing (One-Finger Icon)', '手指书写（单指图标）', '指で手書き（指差しアイコン）'),
              desc: _tr('S펜 필기 바에서 색상 원 왼쪽의 한 손가락 아이콘을 누르면 아이콘에 색상(노란색)이 켜지며 손가락으로 글씨를 쓸 수 있습니다. 손으로 글씨를 쓰는 동안에는 손터치 페이지 넘김이 자동으로 잠깁니다.', 'Tap the one-finger icon to the left of the colors to light it up in color and write with your finger. Touch page turning is automatically locked while finger writing is active.', '点击颜色左侧的单指图标使其亮起颜色即可用手指书写，书写期间自动锁定触屏翻页。', '色の左にある指アイコンを押すと色が点灯し指で手書きできます。手書き中は指でのページめくりが自動ロックされます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.cleaning_services_outlined, color: Colors.amber, size: 19),
              title: _tr('지우개 / 색상(6색) / 필기 전체 지우기', 'Eraser, 6 Colors & Clear All Strokes', '橡皮擦、6种颜色与清空手写', '消しゴム・6色パレット・手書き全消去'),
              desc: _tr('노란·빨간·하늘·초록·흰색·검은색 펜 선택과 선 굵기 슬라이더(기본 2.0pt), 부드러운 부분 지우개(🧹), 텍스트 메모(📝), 필기 전체 지우기(🗑, 2페이지 보기 시 양쪽 페이지 모두 삭제)를 제공합니다.', 'Pick from 6 colors, adjust stroke width, smooth partial Eraser, text notes, or Clear All Strokes (clears both pages in 2-page mode).', '支持6种颜色、粗细滑块、平滑局部橡皮擦、文字备注及清空手写（双页模式下同时清空两页）。', '6色、太さスライダー、滑らかな消しゴム、テキストメモ、手書き全消去(2ページ表示時は両ページ消去)が使えます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.first_page, color: Colors.white, size: 17),
                  Icon(Icons.last_page, color: Colors.white, size: 17),
                ],
              ),
              title: _tr('진행도 바 맨 처음 / 맨 마지막 페이지 이동 화살표', 'Jump to First / Last Page Arrows', '跳转至第一页 / 最后一页箭头', '最初 / 最後のページへ移動する矢印'),
              desc: _tr('진행도 슬라이더 양끝의 화살표를 누르면 문서의 맨 처음(1페이지)과 맨 마지막(끝 페이지)으로 즉시 이동합니다.', 'Tap the arrows at both ends of the progress bar to jump straight to the first or last page.', '点击进度条两端的箭头可直接跳至第一页或最后一页。', '進行度バー両端の矢印で最初(1ページ)と最後のページへ即座に移動します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_back, color: Colors.amber, size: 16),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward, color: Colors.amber, size: 16),
                ],
              ),
              title: _tr('우측 하단 페이지 이동 버튼 (← / →)', 'Bottom-Right Page Nav Buttons (← / →)', '右下角翻页按钮 (← / →)', '右下ページ移動ボタン (← / →)'),
              desc: _tr('뷰어 설정에서 [페이지 이동 버튼]을 켜면 우측 하단에 나타나며, 상단 UI를 띄우지 않고 깔끔하게 이전(←)·다음(→) 페이지로 전환합니다.', 'When enabled in Viewer Settings, appears at the bottom-right to turn to the previous (←) or next (→) page without popping up the top bar.', '在阅读器设置中开启后显示在右下角，点击左(←)/右(→)箭头可直接翻页且不会弹出顶部菜单。', '뷰어設定でONにすると右下に表示され、上部UIを出さずに前(←)・次(→)のページへ移動します。'),
            ),
          ],
        ),
      ),
    );
  }
}

/// 그리드/리스트 스크롤 시 화면 밖으로 나간 카드 위젯과 디코딩된 썸네일 GPU 텍스처가 절대 파괴되지 않도록 유지하는 KeepAlive 래퍼
class _KeepAliveBookItem extends StatefulWidget {
  final Widget child;
  const _KeepAliveBookItem({super.key, required this.child});

  @override
  State<_KeepAliveBookItem> createState() => _KeepAliveBookItemState();
}

class _KeepAliveBookItemState extends State<_KeepAliveBookItem>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}

class BookshelfScreen extends StatefulWidget {
  final bool isDarkMode;
  final String appLang;
  final String themeMode;
  final Future<void> Function(String mode) onChangeThemeMode;
  final ValueChanged<String> onChangeLanguage;

  const BookshelfScreen({
    super.key,
    required this.isDarkMode,
    required this.appLang,
    required this.themeMode,
    required this.onChangeThemeMode,
    required this.onChangeLanguage,
  });

  @override
  State<BookshelfScreen> createState() => _BookshelfScreenState();
}

class _BookshelfScreenState extends State<BookshelfScreen> with TickerProviderStateMixin {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');

  List<File> _allBooks = [];
  List<File> _trashedBooks = [];
  List<String> _groups = ['전체', 'PDF/문서'];
  bool _groupEditMode = false; // 그룹을 꾹 눌러 순서 바꾸기·삭제하는 중
  Offset _groupDragGrab = Offset.zero; // 끄는 그룹 칩 안에서 손가락이 닿은 자리
  bool _groupMenuOpen = false; // [전체]에서 그룹 목록을 펼친 중 (아이콘 엇갈림)

  // ── 파일 검색 (상단 돋보기) ──
  bool _searchOpen = false;
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  late final AnimationController _searchAnim =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 300), reverseDuration: const Duration(milliseconds: 210));
  // 펼칠 때는 빠르게 나가다 천천히 멈추고, 돌아올 때도 빠르게 출발해 제자리에 부드럽게 내려앉음
  late final CurvedAnimation _searchCurve = CurvedAnimation(parent: _searchAnim, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);

  void _openSearch() {
    if (_searchOpen) return;
    setState(() {
      _searchOpen = true;
      _searchQuery = '';
      _groupEditMode = false;
    });
    _searchCtrl.clear();
    _searchAnim.forward();
    // 줄이 다 그어질 즈음 자판을 올림
    Future<void>.delayed(const Duration(milliseconds: 180), () {
      if (mounted && _searchOpen) _searchFocus.requestFocus();
    });
  }

  /// 처음 상태로: 검색어도 지움 (뒤로 가기, 파일 열기, 다른 아이콘을 누를 때)
  void _closeSearch() {
    if (!_searchOpen) return;
    _searchFocus.unfocus();
    _searchCtrl.clear();
    setState(() {
      _searchOpen = false;
      _searchQuery = '';
    });
    _searchAnim.reverse();
  }

  static const TextStyle _searchTextStyle = TextStyle(fontSize: 18, fontWeight: FontWeight.w600);

  /// 돋보기가 왼쪽으로 조금 가면서 그 뒤로 짧은 밑줄이 그어지고, 글자를 칠수록 밑줄이 왼쪽으로 늘어남
  /// ("MY" 글자 가까이 오면 더 늘지 않음). 닫으면 다시 오른쪽 돋보기로 말려 들어감
  Widget _buildSearchArea() {
    final Color lineColor = Theme.of(context).colorScheme.onSurface;
    return LayoutBuilder(
      builder: (context, c) {
        final double w = c.maxWidth;
        const double iconSize = 24;
        final double home = w + 28; // 닫혀 있을 때 돋보기 자리 (PDF 합치기 아이콘 왼쪽)
        // 밑줄 길이 = 친 글자 폭 + 여유 (처음에는 짧게), 돋보기가 왼쪽 끝(MY 옆)에 닿으면 멈춤
        final tp = TextPainter(text: TextSpan(text: _searchQuery, style: _searchTextStyle), textDirection: TextDirection.ltr, maxLines: 1)
          ..layout();
        // 화면이 좁은 휴대폰에서는 자리가 110보다 좁을 수 있음 (clamp 아래값이 위값보다 크면 오류 → 회색 상자가 뜨고 검색이 안 되던 문제)
        final double lineLen = (tp.width + 64).clamp(math.min(110.0, home), home).toDouble();
        final double target = home - lineLen;
        return TweenAnimationBuilder<double>(
          tween: Tween<double>(end: target),
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          builder: (context, openLeft, _) => AnimatedBuilder(
          animation: _searchCurve,
          builder: (context, _) {
            final double t = _searchCurve.value;
            if (_searchAnim.isDismissed) return const SizedBox(height: 40);
            // 돋보기 위치: 오른쪽(원래 돋보기 자리) → 글자 길이에 맞는 자리
            final double iconLeft = home + (openLeft - home) * t;
            final double textOpacity = ((t - 0.55) / 0.45).clamp(0.0, 1.0).toDouble();
            return SizedBox(
              height: 40,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // 밑줄: 돋보기가 지나간 자리부터 오른쪽 PDF 합치기 아이콘 바로 앞까지 (비워 둔 돋보기 자리까지 이어짐)
                  Positioned(
                    left: iconLeft + iconSize + 4,
                    right: -56,
                    bottom: 5,
                    child: Container(height: 2, decoration: BoxDecoration(color: lineColor, borderRadius: BorderRadius.circular(1))),
                  ),
                  Positioned(left: iconLeft, top: 8, child: Icon(Icons.search, size: iconSize, color: lineColor)),
                  Positioned(
                    left: iconLeft + iconSize + 8,
                    right: -56,
                    top: 0,
                    bottom: 10,
                    child: Opacity(
                      opacity: textOpacity,
                      child: TextField(
                        controller: _searchCtrl,
                        focusNode: _searchFocus,
                        textInputAction: TextInputAction.search,
                        style: _searchTextStyle,
                        // 깜빡이는 세로 막대가 밑줄에 닿지 않게 짧게
                        cursorHeight: 17,
                        decoration: const InputDecoration(border: InputBorder.none, isCollapsed: true, contentPadding: EdgeInsets.only(top: 6)),
                        // 한 글자 칠 때마다 결과가 바뀜
                        onChanged: (v) => setState(() => _searchQuery = v),
                        // 자판의 확인(검색)을 눌러도 검색 화면은 그대로 (자판만 내림)
                        onSubmitted: (_) => _searchFocus.unfocus(),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
          ),
        );
      },
    );
  }
  final GlobalKey _allGroupChipKey = GlobalKey();
  String _selectedGroup = '전체';
  Map<String, String> _bookGroupMap = {};
  Map<String, String> _bookPageLabelMap = {}; // 마지막으로 읽은 쪽 '지금/전체'
  Set<String> _favoritePaths = {};
  bool _hideFileExtension = false;
  bool _hideGroupName = false; // 파일 아래 [그룹 이름] 숨기기
  bool _hidePageCount = false; // 파일 아래 페이지 수 숨기기
  Map<String, int> _addedDates = {}; // 파일 추가 날짜 (밀리초)
  // 파일 정렬: 기준 'name'(이름) | 'date'(추가 날짜), 오름차순(이름 가→하 / 오래된 순)
  String _sortBy = 'name';
  bool _sortAsc = true;
  bool _sortRemember = false;
  bool _sortLoaded = false;

  /// 파일 정렬 창: 정렬 기준(이름 / 추가 날짜) · 순서 · 정렬 기억하기. 고르면 바로 적용
  Future<void> _showSortSheet() async {
    Future<void> apply() async {
      setState(() => _allBooks = List<File>.of(_allBooks)..sort((a, b) => _libCompare(a, b, _favoritePaths)));
      await StorageService.setLibrarySort(_sortBy, _sortAsc, _sortRemember);
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) {
          final cs = Theme.of(ctx).colorScheme;
          Widget label(String t) => Padding(
                padding: const EdgeInsets.only(top: 18, bottom: 6),
                child: Text(t, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, letterSpacing: 0.5, color: cs.onSurfaceVariant)),
              );
          Widget byRow(String value, String text) => InkWell(
                onTap: () {
                  setSheet(() => _sortBy = value);
                  apply();
                },
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  child: Row(
                    children: [
                      Expanded(child: Text(text, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600))),
                      Icon(_sortBy == value ? Icons.check_circle : Icons.circle_outlined, size: 26, color: _sortBy == value ? cs.onSurface : cs.outline),
                    ],
                  ),
                ),
              );
          final bool byName = _sortBy == 'name';
          return SafeArea(
            top: false,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(color: cs.onSurfaceVariant.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  Text(_tr('정렬', 'Sort', '排序', '並べ替え'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(_tr('파일을 보여 줄 순서를 골라 주세요.', 'Choose how files are ordered.', '选择文件显示顺序。', 'ファイルの並び順を選んでください。'),
                      style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
                  label(_tr('정렬 기준', 'Sort by', '排序依据', '並べ替えの基準')),
                  byRow('name', _tr('이름', 'Name', '名称', '名前')),
                  Divider(height: 1, color: cs.outlineVariant.withValues(alpha: 0.5)),
                  byRow('date', _tr('파일 추가 날짜', 'Date added', '添加日期', '追加日')),
                  label(_tr('순서', 'Order', '顺序', '順序')),
                  SettingGroup(children: [
                    SettingOption(
                      label: Text(byName ? _tr('오름차순', 'Ascending', '升序', '昇順') : _tr('최신순', 'Newest', '最新', '新しい順')),
                      selected: byName ? _sortAsc : !_sortAsc,
                      onSelected: (_) {
                        setSheet(() => _sortAsc = byName);
                        apply();
                      },
                    ),
                    SettingOption(
                      label: Text(byName ? _tr('내림차순', 'Descending', '降序', '降順') : _tr('오래된 순', 'Oldest', '最早', '古い順')),
                      selected: byName ? !_sortAsc : _sortAsc,
                      onSelected: (_) {
                        setSheet(() => _sortAsc = !byName);
                        apply();
                      },
                    ),
                  ]),
                  const SizedBox(height: 10),
                  SettingToggle(
                    label: Text(_tr('정렬 기억하기', 'Remember sort', '记住排序', '並べ替えを記憶')),
                    selected: _sortRemember,
                    onSelected: (v) {
                      setSheet(() => _sortRemember = v);
                      apply();
                    },
                  ),
                  Text(_tr('다시 열어도 이 정렬을 유지해요.', 'Keeps this order next time.', '下次打开时保持此排序。', '次回もこの並び順を保ちます。'),
                      style: TextStyle(fontSize: 13.5, color: cs.onSurfaceVariant)),
                  SettingDoneButton(label: _tr('완료', 'Done', '完成', '完了'), onPressed: () => Navigator.of(ctx).pop()),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// 북마크한 파일 먼저, 그다음 고른 정렬 (이름 / 추가 날짜)
  int _libCompare(File a, File b, Set<String> favs) {
    final aFav = favs.contains(a.path), bFav = favs.contains(b.path);
    if (aFav != bFav) return aFav ? -1 : 1;
    String nameOf(File f) => f.path.split(Platform.pathSeparator).last;
    int c;
    if (_sortBy == 'date') {
      c = (_addedDates[a.path] ?? 0).compareTo(_addedDates[b.path] ?? 0);
      if (c == 0) c = _naturalCompare(nameOf(a), nameOf(b));
    } else {
      c = _naturalCompare(nameOf(a), nameOf(b));
    }
    return _sortAsc ? c : -c;
  }

  /// 파일 아래 작은 글: [그룹] • 마지막으로 읽은 쪽(6/983)
  String _fileMetaText(String path, String grpDisplay, bool showGroup) {
    final parts = <String>[];
    if (showGroup) parts.add('[$grpDisplay]');
    if (!_hidePageCount) {
      final p = _pageLabelText(path);
      if (p.isNotEmpty) parts.add(p);
    }
    return parts.join('  •  ');
  }
  bool _hideThumbnails = false; // 표지형: 표지 그림 끄기 (아이콘만)
  Map<String, String> _customCovers = {}; // 사용자가 고른 표지
  String _bookshelfViewMode = 'list'; // 기본값: 'list' (목록형)
  static final Map<String, ImageProvider> _globalThumbMemoryCache = {};
  final Map<String, ValueNotifier<ImageProvider?>> _thumbNotifiers = {};
  final Set<String> _thumbnailGeneratingPaths = {};
  final Set<String> _noCoverPaths = {}; // 표지 그림이 없는 EPUB·CBZ (이번 실행 동안 다시 찾지 않음)

  bool _isSelectionMode = false;
  final Set<String> _selectedFilePaths = {};
  final ScrollController _bookshelfScrollController = ScrollController();
  final Map<String, GlobalKey> _fileRowKeys = {};
  bool _isDragSelecting = false;
  bool _dragTargetSelectState = true;
  String? _lastDragTouchedPath;
  final Map<int, Offset> _activeBookshelfPointers = {};
  Timer? _dragEdgeScrollTimer;
  Offset? _lastDragGlobalPos;

  // 메모장(.txt), 워드(.docx, .doc), 한글(.hwpx, .hwp), 파워포인트(.pptx, .ppt)도 열람 (모두 기기 안에서 처리)
  static const _supportedExts = [
    'epub', 'txt', 'pdf', 'jpg', 'jpeg', 'png', 'webp', 'cbz',
    'docx', 'doc', 'hwpx', 'hwp', 'pptx', 'ppt', 'xlsx', 'xlsm', 'xls',
  ];
  static const _imageExts = ['jpg', 'jpeg', 'png', 'webp'];

  /// 글 문서(리더 화면에서 여는 형식)
  static const _readerExts = ['epub', 'txt', 'docx', 'doc', 'hwpx', 'hwp', 'pptx', 'ppt', 'xlsx', 'xlsm', 'xls'];

  String? _findFileRowPathAtGlobalPos(Offset globalPos) {
    for (final entry in _fileRowKeys.entries) {
      final ctx = entry.value.currentContext;
      if (ctx == null) continue;
      final box = ctx.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize || !box.attached) continue;
      final topLeft = box.localToGlobal(Offset.zero);
      final rect = topLeft & box.size;
      if (rect.contains(globalPos)) {
        return entry.key;
      }
    }
    return null;
  }

  void _applyDragSelectionAtGlobalPos(Offset globalPos) {
    final hitPath = _findFileRowPathAtGlobalPos(globalPos);
    if (hitPath != null && hitPath != _lastDragTouchedPath) {
      _lastDragTouchedPath = hitPath;
      setState(() {
        if (_dragTargetSelectState) {
          _selectedFilePaths.add(hitPath);
        } else {
          _selectedFilePaths.remove(hitPath);
        }
      });
    }
    // 손가락이 화면 위/아래 가장자리에 머무는 동안 일정 속도로 부드럽게 자동 스크롤
    _lastDragGlobalPos = globalPos;
    _dragEdgeScrollTimer ??= Timer.periodic(const Duration(milliseconds: 16), (t) {
      final g = _lastDragGlobalPos;
      if (!mounted || !_isDragSelecting || g == null || !_bookshelfScrollController.hasClients) {
        t.cancel();
        _dragEdgeScrollTimer = null;
        return;
      }
      final screenH = MediaQuery.of(context).size.height;
      double step = 0.0;
      if (g.dy < 160) {
        step = -(2.0 + 18.0 * ((160 - g.dy) / 160).clamp(0.0, 1.0));
      } else if (g.dy > screenH - 120) {
        step = 2.0 + 18.0 * ((g.dy - (screenH - 120)) / 120).clamp(0.0, 1.0);
      }
      if (step == 0.0) return;
      final pos = _bookshelfScrollController.position;
      final double target = (pos.pixels + step).clamp(pos.minScrollExtent, pos.maxScrollExtent).toDouble();
      if (target != pos.pixels) {
        _bookshelfScrollController.jumpTo(target);
        final hitPath = _findFileRowPathAtGlobalPos(g);
        if (hitPath != null && hitPath != _lastDragTouchedPath) {
          _lastDragTouchedPath = hitPath;
          setState(() {
            if (_dragTargetSelectState) {
              _selectedFilePaths.add(hitPath);
            } else {
              _selectedFilePaths.remove(hitPath);
            }
          });
        }
      }
    });
  }

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(widget.appLang, ko: ko, en: en, zh: zh, ja: ja);

  String _localizeGroupName(String g) {
    if (g == '전체') return _tr('전체', 'All', '全部', 'すべて');
    if (g == '미분류') return _tr('미분류', 'Uncategorized', '未分类', '未分類');
    if (g == 'PDF/문서') return _tr('PDF/문서', 'PDF/Docs', 'PDF/文档', 'PDF/文書');
    return g;
  }

  String _formatDisplayFileName(String rawFileName) {
    if (!_hideFileExtension) return rawFileName;
    final dotIdx = rawFileName.lastIndexOf('.');
    if (dotIdx > 0) {
      return rawFileName.substring(0, dotIdx);
    }
    return rawFileName;
  }

  @override
  void initState() {
    super.initState();
    _loadLibrary();
  }

  ValueNotifier<ImageProvider?> _getThumbNotifier(String bookPath) {
    return _thumbNotifiers.putIfAbsent(
      bookPath,
      () => ValueNotifier<ImageProvider?>(_globalThumbMemoryCache[bookPath]),
    );
  }

  void _cacheThumbnailFromFileSync(String bookPath, String thumbPath, {bool isRawOriginalImage = false}) {
    if (_globalThumbMemoryCache.containsKey(bookPath)) {
      _getThumbNotifier(bookPath).value = _globalThumbMemoryCache[bookPath];
      return;
    }
    try {
      final f = File(thumbPath);
      if (!f.existsSync()) return;
      // 표지는 화면에 작게 보이므로 작은 크기로 풀어 둔다 (큰 그림을 통째로 풀면 목록·화면 전환이 버벅임).
      // 파일은 백그라운드에서 읽는다. 표지를 새로 만든 경우를 위해 예전 그림 캐시는 비운다.
      if (!isRawOriginalImage && f.lengthSync() < 64) return;
      final ImageProvider provider = ResizeImage(FileImage(f), width: isRawOriginalImage ? 360 : 420, allowUpscaling: false);
      provider.evict().catchError((_) => false);
      _globalThumbMemoryCache[bookPath] = provider;
      _getThumbNotifier(bookPath).value = provider;
      if (mounted) {
        precacheImage(provider, context).catchError((_) {});
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchCurve.dispose();
    _searchAnim.dispose();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    _dragEdgeScrollTimer?.cancel();
    for (final notifier in _thumbNotifiers.values) {
      notifier.dispose();
    }
    _bookshelfScrollController.dispose();
    super.dispose();
  }

  int _naturalCompare(String a, String b) {
    final reg = RegExp(r'(\d+)|(\D+)');
    final matchesA = reg.allMatches(a.toLowerCase()).toList();
    final matchesB = reg.allMatches(b.toLowerCase()).toList();
    final len = matchesA.length < matchesB.length ? matchesA.length : matchesB.length;
    for (int i = 0; i < len; i++) {
      final partA = matchesA[i].group(0)!;
      final partB = matchesB[i].group(0)!;
      final numA = int.tryParse(partA);
      final numB = int.tryParse(partB);
      if (numA != null && numB != null) {
        final cmp = numA.compareTo(numB);
        if (cmp != 0) return cmp;
      } else {
        final cmp = partA.compareTo(partB);
        if (cmp != 0) return cmp;
      }
    }
    return matchesA.length.compareTo(matchesB.length);
  }

  Future<Directory> _getTrashDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final trashDir = Directory('${appDir.path}/.trash_bin');
    if (!await trashDir.exists()) {
      await trashDir.create(recursive: true);
    }
    return trashDir;
  }

  Future<void> _loadLibrary() async {
    final dir = await getApplicationDocumentsDirectory();
    final trashDir = await _getTrashDirectory();
    // 폴더 목록 읽기는 따로(백그라운드)에서: 파일·표지가 많아도 화면 전환이 버벅이지 않게
    final listed = await _listLibraryFolders(dir.path, trashDir.path, '${dir.path}/.thumbnails');

    final entities = <FileSystemEntity>[for (final p in listed.files) File(p)];
    final files = <File>[];

    for (final e in entities) {
      if (e is File) {
        final lower = e.path.toLowerCase();
        if (lower.endsWith('_translated.epub') ||
            lower.endsWith('.converted.epub') ||
            lower.endsWith('_converted.epub')) continue;
        final ext = lower.split('.').last;
        if (_supportedExts.contains(ext)) {
          files.add(e);
        }
      }
    }

    final trashEntities = <FileSystemEntity>[for (final p in listed.trash) File(p)];
    final trashed = <File>[];
    for (final e in trashEntities) {
      if (e is File) {
        trashed.add(e);
      }
    }

    final favs = await StorageService.getFavoriteBooks();
    final hideExt = await StorageService.getHideFileExtension();
    final hideGroup = await StorageService.getHideGroupName();
    final hideThumbs = await StorageService.getHideThumbnails();
    FavoriteRibbon.animationOff.value = await StorageService.getRibbonAnimationOff();
    final covers = await StorageService.getCustomCovers();
    final viewMode = await StorageService.getBookshelfViewMode();
    final hidePages = await StorageService.getHidePageCount();
    // 파일 추가 날짜: 처음 보는 파일은 지금 파일 시각으로 정해 저장 (이후 그대로)
    final dates = await StorageService.getAddedDates();
    bool datesChanged = false;
    for (final f in files) {
      if (dates.containsKey(f.path)) continue;
      int ms;
      try {
        ms = f.statSync().modified.millisecondsSinceEpoch;
      } catch (_) {
        ms = DateTime.now().millisecondsSinceEpoch;
      }
      dates[f.path] = ms;
      datesChanged = true;
    }
    if (datesChanged) await StorageService.setAddedDates(dates);
    _addedDates = dates;
    if (!_sortLoaded) {
      final (by, asc, remember) = await StorageService.getLibrarySort();
      _sortBy = by;
      _sortAsc = asc;
      _sortRemember = remember;
      _sortLoaded = true;
    }

    files.sort((a, b) => _libCompare(a, b, favs));

    trashed.sort((a, b) => _naturalCompare(
          a.path.split(Platform.pathSeparator).last,
          b.path.split(Platform.pathSeparator).last,
        ));

    final groups = await StorageService.getGroups();
    final grpMap = <String, String>{};
    final pageMap = <String, String>{};

    for (final f in files) {
      grpMap[f.path] = await StorageService.getBookGroup(f.path);
      final lbl = await StorageService.getPageLabel(f.path);
      if (lbl != null) pageMap[f.path] = lbl;
    }

    // 디스크에 이미 생성되어 있는 썸네일 바이트(MemoryImage)를 setState 전에 동기식으로 즉시 메모리에 고정하여 스크롤 시 재로딩 원천 차단
    final thumbDir = Directory('${dir.path}/.thumbnails');
    final Map<String, String> existingThumbBySafeKey = {};
    final Map<String, String> existingDocThumbBySafeKey = {}; // 한글·워드 표지 (흐린 옛 표지와 구분)
    final Map<String, String> existingSlideThumbBySafeKey = {}; // 슬라이드 표지 (흰 화면으로 찍힌 옛 표지와 구분)
    final Map<String, String> existingEpubThumbBySafeKey = {}; // EPUB 표지 (책에 적힌 표지만, 옛 '첫 그림' 표지와 구분)
    for (final entity in <FileSystemEntity>[for (final p in listed.thumbs) File(p)]) {
      if (entity is File) {
        final name = entity.path.split(Platform.pathSeparator).last;
        if (name.startsWith('thumb_v36_') && name.endsWith('.jpg')) {
          final k = name.substring('thumb_v36_'.length, name.length - 4);
          existingThumbBySafeKey[k] = entity.path;
        } else if (name.startsWith('thumb_d2_') && name.endsWith('.jpg')) {
          final k = name.substring('thumb_d2_'.length, name.length - 4);
          existingDocThumbBySafeKey[k] = entity.path;
        } else if (name.startsWith('thumb_s3_') && name.endsWith('.jpg')) {
          final k = name.substring('thumb_s3_'.length, name.length - 4);
          existingSlideThumbBySafeKey[k] = entity.path;
        } else if (name.startsWith('thumb_e1_') && name.endsWith('.jpg')) {
          final k = name.substring('thumb_e1_'.length, name.length - 4);
          existingEpubThumbBySafeKey[k] = entity.path;
        } else if (name.startsWith('thumb_hq26_') && name.endsWith('.jpg')) {
          final parts = name.split('_');
          if (parts.length >= 3) {
            existingThumbBySafeKey.putIfAbsent(parts[2], () => entity.path);
          }
        }
      }
    }

    for (final f in files) {
      final path = f.path;
      if (_globalThumbMemoryCache.containsKey(path)) {
        _getThumbNotifier(path).value = _globalThumbMemoryCache[path];
        continue;
      }
      final ext = path.split('.').last.toLowerCase();
      if (_imageExts.contains(ext)) {
        _cacheThumbnailFromFileSync(path, path, isRawOriginalImage: true);
        continue;
      }
      // 사용자가 고른 표지가 있으면 그것
      final custom = covers[path];
      if (custom != null && File(custom).existsSync()) {
        _cacheThumbnailFromFileSync(path, custom, isRawOriginalImage: true);
        continue;
      }
      final safeKey = path.hashCode.toUnsigned(32).toString();
      final existingThumbPath = (ext == 'pptx' || ext == 'ppt')
          ? existingSlideThumbBySafeKey[safeKey]
          : ext == 'epub'
              ? existingEpubThumbBySafeKey[safeKey]
              : DocThumbnailService.supportedExts.contains(ext)
              ? existingDocThumbBySafeKey[safeKey]
              : existingThumbBySafeKey[safeKey];
      if (existingThumbPath != null) {
        _cacheThumbnailFromFileSync(path, existingThumbPath);
        if (DocThumbnailService.supportedExts.contains(ext)) _noteDocThumbQuality(path, existingThumbPath);
      }
    }

    if (mounted) {
      setState(() {
        _allBooks = files;
        _trashedBooks = trashed;
        _groups = groups;
        _favoritePaths = favs;
        _hideFileExtension = hideExt;
        _hideGroupName = hideGroup;
        _hidePageCount = hidePages;
        _hideThumbnails = hideThumbs;
        _customCovers = covers;
        _bookshelfViewMode = viewMode;
        if (!_groups.contains(_selectedGroup)) {
          _selectedGroup = '전체';
        }
        _bookGroupMap = grpMap;
        _bookPageLabelMap = pageMap;
        _selectedFilePaths.removeWhere((p) => !_allBooks.any((f) => f.path == p));
        if (_selectedFilePaths.isEmpty) {
          _isSelectionMode = false;
        }
      });
      for (final f in files) {
        if (!_globalThumbMemoryCache.containsKey(f.path) || _wantsSharpDocThumb(f.path)) {
          _ensureBookThumbnail(f, thumbDir.path);
        }
      }
    }
  }

  /// 한글·워드 표지를 화면 밖에서 그리다 실패한 파일 (앱을 다시 켤 때까지 다시 시도하지 않음)
  static final Set<String> _docThumbFailed = {};

  /// 파일 안의 작은 미리보기 그림으로 임시 표지를 쓴 한글·워드 (표지형 보기에서 첫 페이지를 다시 그림)
  static final Set<String> _docThumbLowRes = {};

  void _noteDocThumbQuality(String bookPath, String thumbPath) {
    if (File('$thumbPath.low').existsSync()) {
      _docThumbLowRes.add(bookPath);
    } else {
      _docThumbLowRes.remove(bookPath);
    }
  }

  bool _wantsSharpDocThumb(String bookPath) =>
      _bookshelfViewMode == 'grid' && _docThumbLowRes.contains(bookPath) && !_docThumbFailed.contains(bookPath);

  /// 13. 각 파일의 가장 첫 페이지를 초고속 네이티브 스레드 풀에서 썸네일 이미지로 생성 및 MemoryImage로 영구 고정
  Future<void> _ensureBookThumbnail(File file, [String? cachedThumbDirPath]) async {
    final path = file.path;
    if (_globalThumbMemoryCache.containsKey(path) && !_wantsSharpDocThumb(path)) return;
    if (_thumbnailGeneratingPaths.contains(path)) return;
    _thumbnailGeneratingPaths.add(path);

    try {
      final custom = _customCovers[path];
      if (custom != null && File(custom).existsSync()) {
        _cacheThumbnailFromFileSync(path, custom, isRawOriginalImage: true);
        return;
      }
      final ext = path.split('.').last.toLowerCase();
      if (_imageExts.contains(ext)) {
        _cacheThumbnailFromFileSync(path, path, isRawOriginalImage: true);
        return;
      }

      final String thumbDirPath = cachedThumbDirPath ??
          '${(await getApplicationDocumentsDirectory()).path}/.thumbnails';
      final safeKey = path.hashCode.toUnsigned(32).toString();
      final bool isDocType = DocThumbnailService.supportedExts.contains(ext);
      final bool isSlideType = ext == 'pptx' || ext == 'ppt';
      // 슬라이드 표지는 예전에 흰 화면으로 찍힌 것이 남아 있을 수 있어 새 이름(s3)으로 다시 만든다
      final thumbPath = isSlideType
          ? '$thumbDirPath/thumb_s3_$safeKey.jpg'
          : isDocType
              ? '$thumbDirPath/thumb_d2_$safeKey.jpg'
              : ext == 'epub'
                  ? '$thumbDirPath/thumb_e1_$safeKey.jpg'
                  : '$thumbDirPath/thumb_v36_$safeKey.jpg';
      final thumbFile = File(thumbPath);

      if (thumbFile.existsSync() && thumbFile.lengthSync() > 64) {
        _cacheThumbnailFromFileSync(path, thumbPath);
        // 작은 미리보기로 임시 표지를 쓴 한글·워드는 표지형 보기에서 첫 페이지를 다시 선명하게 그린다
        if (isDocType) _noteDocThumbQuality(path, thumbPath);
        if (!isDocType || !_wantsSharpDocThumb(path)) return;
      }
      if (isDocType) {
        // 예전 버전이 만든 (흐릴 수 있는) 표지는 지운다
        for (final old in [
          File('$thumbDirPath/thumb_v36_$safeKey.jpg'),
          if (isSlideType) File('$thumbDirPath/thumb_d2_$safeKey.jpg'),
          if (isSlideType) File('$thumbDirPath/thumb_d2_$safeKey.jpg.low'),
        ]) {
          if (old.existsSync()) {
            try {
              old.deleteSync();
            } catch (_) {}
          }
        }
      }

      if (ext == 'pdf') {
        final rendered = await _pdfChannel.invokeMethod<String>(
          'renderPdfFirstPageThumbnail',
          {
            'filePath': path,
            'outPath': thumbPath,
            'maxWidth': 420,
          },
        );
        if (rendered != null) {
          _cacheThumbnailFromFileSync(path, rendered);
          return;
        }
      } else if (DocThumbnailService.supportedExts.contains(ext)) {
        // 한글·워드: 파일 안의 미리보기 그림 → 없으면 (표지형 보기일 때만) 첫 페이지를 화면 밖에서 그림
        if (_docThumbFailed.contains(path)) return;
        final bool allowRender = _bookshelfViewMode == 'grid';
        final ok = await DocThumbnailService.make(path, thumbPath, allowRender: allowRender);
        if (ok) {
          _globalThumbMemoryCache.remove(path); // 임시(흐린) 표지를 새 표지로 바꾼다
          _cacheThumbnailFromFileSync(path, thumbPath);
          _noteDocThumbQuality(path, thumbPath);
          return;
        }
        if (allowRender) _docThumbFailed.add(path);
      } else if (ext == 'cbz' || ext == 'epub') {
        if (_noCoverPaths.contains(path)) return;
        if (ext == 'epub') {
          // 예전에 '첫 그림'으로 만든 표지는 지움 (표지가 아닐 수 있음)
          final old = File('$thumbDirPath/thumb_v36_$safeKey.jpg');
          if (old.existsSync()) {
            try {
              old.deleteSync();
            } catch (_) {}
          }
        }
        final rendered = await _pdfChannel.invokeMethod<String>(
          'extractArchiveFirstImageThumbnail',
          {
            'filePath': path,
            'outPath': thumbPath,
            'maxWidth': 420,
          },
        );
        if (rendered != null) {
          _cacheThumbnailFromFileSync(path, rendered);
          return;
        }
        _noCoverPaths.add(path); // 표지 없음: 파일 아이콘으로 보여 주고 다시 찾지 않음
      }
    } catch (_) {
    } finally {
      _thumbnailGeneratingPaths.remove(path);
    }
  }

  /// 파일 고르기: 고른 파일을 앱으로 가져오는 동안(파일이 많으면 오래 걸림) 안내 창을 띄운다
  Future<FilePickerResult?> _pickFilesWithNotice({
    FileType type = FileType.any,
    bool allowMultiple = false,
    List<String>? allowedExtensions,
  }) async {
    bool shown = false;
    void hide() {
      if (!shown || !mounted) return;
      shown = false;
      Navigator.of(context, rootNavigator: true).pop();
    }

    try {
      return await FilePicker.platform.pickFiles(
        type: type,
        allowMultiple: allowMultiple,
        allowedExtensions: allowedExtensions,
        onFileLoading: (status) {
          if (status == FilePickerStatus.picking && !shown && mounted) {
            shown = true;
            showDialog<void>(
              context: context,
              barrierDismissible: false,
              useRootNavigator: true,
              builder: (ctx) => PopScope(
                canPop: false,
                child: AlertDialog(
                  // 위아래 여백을 똑같이 → 문구가 네모칸 한가운데에
                  contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
                  content: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5)),
                      const SizedBox(width: 18),
                      Flexible(
                        child: Text(
                          _tr(
                            '파일을 불러오는 중...\n시간이 조금 걸릴 수 있어요.',
                            'Loading files...\nThis may take a moment.',
                            '正在读取文件...\n可能需要一点时间。',
                            'ファイルを読み込み中...\n少し時間がかかることがあります。',
                          ),
                          style: const TextStyle(fontSize: 14, height: 1.4, leadingDistribution: TextLeadingDistribution.even),
                          textHeightBehavior: const TextHeightBehavior(applyHeightToFirstAscent: false, applyHeightToLastDescent: false),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          } else if (status == FilePickerStatus.done) {
            hide();
          }
        },
      );
    } finally {
      hide();
    }
  }

  Future<void> _pickAndImportFiles() async {
    final result = await _pickFilesWithNotice(
      type: FileType.any,
      allowMultiple: true,
    );

    if (result == null || result.files.isEmpty) return;

    final validPicked = result.files.where((pf) {
      if (pf.path == null) return false;
      final ext = pf.name.split('.').last.toLowerCase();
      return _supportedExts.contains(ext);
    }).toList();

    if (validPicked.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _tr(
                '지원되는 파일 형식(EPUB, PDF, JPG, PNG, CBZ)을 선택해 주세요.',
                'Please select supported files (EPUB, PDF, JPG, PNG, CBZ).',
                '请选择受支持的文件格式 (EPUB, PDF, JPG, PNG, CBZ)。',
                '対応ファイル形式(EPUB, PDF, JPG, PNG, CBZ)を選択してください。',
              ),
            ),
          ),
        );
      }
      return;
    }

    final pdfPicked = validPicked.where((pf) {
      final ext = pf.name.split('.').last.toLowerCase();
      return ext == 'pdf';
    }).toList();

    if (pdfPicked.length >= 2 && pdfPicked.length == validPicked.length && mounted) {
      final action = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(_tr('PDF ${pdfPicked.length}개 추가 방식 선택', 'Import ${pdfPicked.length} PDFs', '选择导入 ${pdfPicked.length} 个 PDF 的方式', 'PDF ${pdfPicked.length}個の追加方法を選択')),
          content: Text(
            _tr(
              '선택한 PDF 파일들을 하나로 합쳐서 단일 PDF 파일로 추가할까요?',
              'Would you like to merge the selected PDFs into a single PDF file?',
              '是否将所选 PDF 合并为单个 PDF 文件添加？',
              '選択したPDFを1つのPDFファイルに結合して追加しますか？',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, 'separate'),
              child: Text(_tr('개별 파일로 추가', 'Add Separately', '单独添加', '個別に追加')),
            ),
            ElevatedButton.icon(
              icon: const Icon(Icons.picture_as_pdf, size: 16),
              onPressed: () => Navigator.pop(ctx, 'merge_pdf'),
              label: Text(_tr('하나의 PDF로 합치기', 'Merge into One PDF', '合并为一个 PDF', '1つのPDFに結合')),
            ),
          ],
        ),
      );

      if (action == 'merge_pdf') {
        final paths = pdfPicked.map((e) => File(e.path!)).toList();
        await _createMergedPdfFromFiles(paths, deleteSourceAfter: false);
        return;
      }
    }

    final imagePicked = validPicked.where((pf) {
      final ext = pf.name.split('.').last.toLowerCase();
      return _imageExts.contains(ext);
    }).toList();

    if (imagePicked.length >= 2 && imagePicked.length == validPicked.length && mounted) {
      final action = await showDialog<String>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(_tr('이미지 추가 방식 선택', 'Image Import Option', '选择图片导入方式', '画像の追加方法を選択')),
          content: Text(
            _tr(
              '선택한 이미지들을 하나로 묶어 통합 파일(.cbz)로 추가할까요?',
              'Would you like to bundle the selected images into a single .cbz book?',
              '是否将所选图片打包为单个 .cbz 文件添加？',
              '選択した画像を1つのファイル(.cbz)にまとめて追加しますか？',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, 'separate'),
              child: Text(_tr('개별 파일로 추가', 'Add Separately', '单独添加', '個別に追加')),
            ),
            ElevatedButton.icon(
              icon: const Icon(Icons.auto_stories, size: 16),
              onPressed: () => Navigator.pop(ctx, 'merge'),
              label: Text(_tr('이미지 합치기', 'Merge Images', '合并图片', '画像結合')),
            ),
          ],
        ),
      );

      if (action == 'merge') {
        final paths = imagePicked.map((e) => File(e.path!)).toList();
        await _createMangaBookFromImages(paths, deleteSourceAfter: false);
        return;
      }
    }

    final appDir = await getApplicationDocumentsDirectory();
    final importedFiles = <File>[];

    for (final pf in validPicked) {
      if (pf.path == null) continue;
      final targetGrp = _selectedGroup == '전체' ? '미분류' : _selectedGroup;
      final saved = await File(pf.path!).copy('${appDir.path}/${pf.name}');
      await StorageService.setBookGroup(saved.path, targetGrp);
      importedFiles.add(saved);
    }

    await _loadLibrary();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _tr(
              '${importedFiles.length}개의 파일이 서재에 추가되었습니다.',
              'Added ${importedFiles.length} file(s) to bookshelf.',
              '已添加 ${importedFiles.length} 个文件到书架。',
              '${importedFiles.length}個のファイルが追加されました。',
            ),
          ),
        ),
      );
    }
  }

  Future<void> _createMangaBookFromImages(List<File> sourceImages, {bool deleteSourceAfter = false}) async {
    final now = DateTime.now();
    final dateStr = '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
    final rand4 = (1000 + math.Random().nextInt(9000)).toString();
    final defaultFileName = '파일_${dateStr}_$rand4';

    final titleController = TextEditingController(text: defaultFileName);
    bool deleteOriginals = deleteSourceAfter;
    bool sortByName = true;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Text(_tr('이미지 합치기', 'Merge Images', '合并图片', '画像結合')),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: titleController,
                  decoration: InputDecoration(
                    labelText: _tr('파일 제목', 'File Title', '文件标题', 'ファイル名'),
                    suffixText: '.cbz',
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  _tr('합치는 순서 선택', 'Merge Order', '合并顺序', '結合順序の選択'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                RadioListTile<bool>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(_tr('파일 이름 순서대로 합치기', 'Sort by Filename', '按文件名顺序合并', 'ファイル名順に結合'), style: const TextStyle(fontSize: 13)),
                  value: true,
                  groupValue: sortByName,
                  onChanged: (v) => setModalState(() => sortByName = v ?? true),
                ),
                RadioListTile<bool>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(_tr('파일을 선택한 순서대로 합치기', 'Keep Selected Order', '按选择顺序合并', '選択した順番通りに結合'), style: const TextStyle(fontSize: 13)),
                  value: false,
                  groupValue: sortByName,
                  onChanged: (v) => setModalState(() => sortByName = v ?? false),
                ),
                if (deleteSourceAfter) ...[
                  const Divider(height: 12),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: deleteOriginals,
                    title: Text(
                      _tr('통합 후 기존 낱장 이미지 휴지통으로 이동', 'Move original images to Trash after merge', '合并后将原图移至回收站', '結合後に元の画像をゴミ箱へ移動'),
                      style: const TextStyle(fontSize: 13),
                    ),
                    onChanged: (v) => setModalState(() => deleteOriginals = v ?? false),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(_tr('확인', 'OK', '确定', 'OK')),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || !mounted) return;

    final bookTitle = titleController.text.trim().isEmpty ? defaultFileName : titleController.text.trim();
    final orderedImages = List<File>.from(sourceImages);
    if (sortByName) {
      orderedImages.sort((a, b) => _naturalCompare(
            a.path.split(Platform.pathSeparator).last,
            b.path.split(Platform.pathSeparator).last,
          ));
    }

    int currentStep = 0;
    final int totalSteps = orderedImages.length + 1;
    String progressStatus = _tr('이미지 준비 중...', 'Preparing images...', '正在准备图片...', '画像を準備中...');
    StateSetter? progressSetState;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          progressSetState = setDialogState;
          final double ratio = totalSteps > 0 ? (currentStep / totalSteps).clamp(0.0, 1.0).toDouble() : 0.0;
          return AlertDialog(
            title: Text(_tr('이미지 합치는 중', 'Merging Images', '正在合并图片', '画像結合中')),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LinearProgressIndicator(value: ratio),
                const SizedBox(height: 12),
                Text(
                  '${(ratio * 100).toStringAsFixed(0)}% ($currentStep / ${orderedImages.length})',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 6),
                Text(progressStatus, style: const TextStyle(fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );

    await Future.delayed(const Duration(milliseconds: 50));

    final archive = Archive();
    for (int i = 0; i < orderedImages.length; i++) {
      final img = orderedImages[i];
      final fileName = img.path.split(Platform.pathSeparator).last;
      final ext = img.path.split('.').last.toLowerCase();

      progressSetState?.call(() {
        currentStep = i + 1;
        progressStatus = fileName;
      });
      await Future.delayed(const Duration(milliseconds: 15));

      final bytes = await img.readAsBytes();
      final entryName = 'page_${i.toString().padLeft(4, '0')}.$ext';
      archive.addFile(ArchiveFile(entryName, bytes.length, bytes));
    }

    final appDir = await getApplicationDocumentsDirectory();
    final safeTitle = bookTitle.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
    final outFile = File('${appDir.path}/$safeTitle.cbz');
    final zipBytes = ZipEncoder().encode(archive);
    await outFile.writeAsBytes(zipBytes!);

    final targetGroup = _selectedGroup == '전체' ? '미분류' : _selectedGroup;
    await StorageService.setBookGroup(outFile.path, targetGroup);

    if (deleteOriginals) {
      for (final img in orderedImages) {
        if (await img.exists()) {
          await _moveFileToTrash(img, reloadAfter: false);
        }
      }
    }

    if (mounted) {
      Navigator.pop(context);
    }

    await _loadLibrary();
    if (mounted) {
      final grpDisplay = _localizeGroupName(targetGroup);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _tr(
              'cbz 파일이 [$grpDisplay]에 생성되었습니다. ($safeTitle.cbz)',
              'cbz file created in [$grpDisplay]. ($safeTitle.cbz)',
              'cbz 文件已创建于 [$grpDisplay]。($safeTitle.cbz)',
              'cbzファイルが [$grpDisplay] に作成されました。($safeTitle.cbz)',
            ),
          ),
        ),
      );
    }
  }

  Future<void> _showMergeExistingImagesDialog() async {
    final existingImages = _allBooks.where((f) {
      final ext = f.path.split('.').last.toLowerCase();
      return _imageExts.contains(ext);
    }).toList();

    if (existingImages.isEmpty) {
      final result = await _pickFilesWithNotice(
        type: FileType.image,
        allowMultiple: true,
      );
      if (result != null && result.files.length >= 2) {
        final files = result.files.where((f) => f.path != null).map((f) => File(f.path!)).toList();
        await _createMangaBookFromImages(files, deleteSourceAfter: false);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_tr('JPG/PNG 파일을 2개 이상 선택해 주세요.', 'Please select at least 2 JPG/PNG files.', '请选择至少 2 个 JPG/PNG 文件。', 'JPG/PNGファイルを2つ以上選択してください。'))),
        );
      }
      return;
    }

    final result = await showDialog<Object?>(
      context: context,
      builder: (ctx) => _FileMergeSelectDialog(
        files: existingImages,
        tr: _tr,
        displayName: (f) => _formatDisplayFileName(f.path.split(Platform.pathSeparator).last),
        title: _tr('이미지 합치기', 'Merge Images', '合并图片', '画像結合'),
        mergeLabel: _tr('선택한 이미지 합치기', 'Merge Selected', '合并所选图片', '選択した画像を結合'),
      ),
    );

    if (result == 'browse') {
      final picked = await _pickFilesWithNotice(
        type: FileType.image,
        allowMultiple: true,
      );
      if (picked != null && picked.files.length >= 2) {
        final files = picked.files.where((f) => f.path != null).map((f) => File(f.path!)).toList();
        await _createMangaBookFromImages(files, deleteSourceAfter: false);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_tr('JPG/PNG 파일을 2개 이상 선택해 주세요.', 'Please select at least 2 JPG/PNG files.', '请选择至少 2 个 JPG/PNG 文件。', 'JPG/PNGファイルを2つ以上選択してください。'))),
        );
      }
      return;
    }

    if (result is List<String> && result.length >= 2) {
      final fileByPath = {for (final f in existingImages) f.path: f};
      final chosen = result.map((p) => fileByPath[p]!).toList();
      await _createMangaBookFromImages(chosen, deleteSourceAfter: true);
    }
  }

  Future<void> _createMergedPdfFromFiles(List<File> sourcePdfs, {bool deleteSourceAfter = false}) async {
    final now = DateTime.now();
    final dateStr = '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
    final rand4 = (1000 + math.Random().nextInt(9000)).toString();
    final defaultFileName = '통합PDF_${dateStr}_$rand4';

    final titleController = TextEditingController(text: defaultFileName);
    bool deleteOriginals = deleteSourceAfter;
    bool sortByName = true;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Text(_tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合')),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: titleController,
                  decoration: InputDecoration(
                    labelText: _tr('PDF 파일 이름', 'PDF Filename', 'PDF 文件名称', 'PDFファイル名'),
                    suffixText: '.pdf',
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  _tr('합치는 순서 선택', 'Merge Order', '合并顺序', '結合順序の選択'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                RadioListTile<bool>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(_tr('파일 이름 순서대로 합치기', 'Sort by Filename', '按文件名顺序合并', 'ファイル名順に結合'), style: const TextStyle(fontSize: 13)),
                  value: true,
                  groupValue: sortByName,
                  onChanged: (v) => setModalState(() => sortByName = v ?? true),
                ),
                RadioListTile<bool>(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: Text(_tr('파일을 선택한 순서대로 합치기', 'Keep Selected Order', '按选择顺序合并', '選択した順番通りに結合'), style: const TextStyle(fontSize: 13)),
                  value: false,
                  groupValue: sortByName,
                  onChanged: (v) => setModalState(() => sortByName = v ?? false),
                ),
                if (deleteSourceAfter) ...[
                  const Divider(height: 12),
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: deleteOriginals,
                    title: Text(
                      _tr('기존 PDF 파일 휴지통으로 이동', 'Move original PDFs to Trash', '将原 PDF 移至回收站', '元のPDFをゴミ箱へ移動'),
                      style: const TextStyle(fontSize: 13),
                    ),
                    onChanged: (v) => setModalState(() => deleteOriginals = v ?? false),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(_tr('확인', 'OK', '确定', 'OK')),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || !mounted) return;

    final rawTitle = titleController.text.trim().isEmpty ? defaultFileName : titleController.text.trim();
    final cleanTitle = rawTitle.replaceAll(RegExp(r'\.pdf$', caseSensitive: false), '');
    final safeTitle = cleanTitle.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');

    final orderedPdfs = List<File>.from(sourcePdfs);
    if (sortByName) {
      orderedPdfs.sort((a, b) => _naturalCompare(
            a.path.split(Platform.pathSeparator).last,
            b.path.split(Platform.pathSeparator).last,
          ));
    }

    int currentStep = 0;
    final int totalSteps = orderedPdfs.length;
    String progressStatus = _tr('PDF 합칠 준비 중...', 'Preparing PDFs...', '正在准备 PDF...', 'PDFを準備中...');
    StateSetter? progressSetState;

    _pdfChannel.setMethodCallHandler((call) async {
      if (call.method == 'onPdfMergeProgress') {
        final args = call.arguments as Map?;
        if (args != null) {
          final int cur = (args['current'] as num?)?.toInt() ?? 1;
          final String fName = (args['fileName'] ?? '').toString();
          progressSetState?.call(() {
            currentStep = cur;
            progressStatus = fName;
          });
        }
      }
      return null;
    });

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          progressSetState = setDialogState;
          final double ratio = totalSteps > 0 ? (currentStep / totalSteps).clamp(0.0, 1.0).toDouble() : 0.0;
          return AlertDialog(
            title: Text(_tr('PDF 합치는 중', 'Merging PDFs', '正在合并 PDF', 'PDF結合中')),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LinearProgressIndicator(value: currentStep > 0 ? ratio : null),
                const SizedBox(height: 12),
                Text(
                  '${(ratio * 100).toStringAsFixed(0)}% ($currentStep / ${orderedPdfs.length})',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 6),
                Text(progressStatus, style: const TextStyle(fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );

    try {
      final appDir = await getApplicationDocumentsDirectory();
      final outPath = '${appDir.path}/$safeTitle.pdf';

      await _pdfChannel.invokeMethod('mergePdfs', {
        'inputPaths': orderedPdfs.map((f) => f.path).toList(),
        'outputPath': outPath,
      });

      final outFile = File(outPath);
      final targetGroup = _selectedGroup == '전체' ? '미분류' : _selectedGroup;
      await StorageService.setBookGroup(outFile.path, targetGroup);

      if (deleteOriginals) {
        for (final pdf in orderedPdfs) {
          if (pdf.path != outFile.path && await pdf.exists()) {
            await _moveFileToTrash(pdf, reloadAfter: false);
          }
        }
      }

      if (mounted) Navigator.pop(context);
      await _loadLibrary();

      if (mounted) {
        final grpDisplay = _localizeGroupName(targetGroup);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _tr(
                'PDF 파일이 [$grpDisplay]에 생성되었습니다. ($safeTitle.pdf)',
                'PDF file created in [$grpDisplay]. ($safeTitle.pdf)',
                'PDF 文件已创建于 [$grpDisplay]。($safeTitle.pdf)',
                'PDFファイルが [$grpDisplay] に作成されました。($safeTitle.pdf)',
              ),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF Merge Error: $e')),
        );
      }
    } finally {
      _pdfChannel.setMethodCallHandler(null);
    }
  }

  Future<void> _showMergeExistingPdfsDialog() async {
    final existingPdfs = _allBooks.where((f) {
      final ext = f.path.split('.').last.toLowerCase();
      return ext == 'pdf';
    }).toList();

    if (existingPdfs.isEmpty) {
      final result = await _pickFilesWithNotice(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: true,
      );
      if (result != null && result.files.length >= 2) {
        final files = result.files.where((f) => f.path != null).map((f) => File(f.path!)).toList();
        await _createMergedPdfFromFiles(files, deleteSourceAfter: false);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_tr('PDF 파일을 2개 이상 선택해 주세요.', 'Please select at least 2 PDF files.', '请选择至少 2 个 PDF 文件。', 'PDFファイルを2つ以上選択してください。'))),
        );
      }
      return;
    }

    final result = await showDialog<Object?>(
      context: context,
      builder: (ctx) => _FileMergeSelectDialog(
        files: existingPdfs,
        tr: _tr,
        displayName: (f) => _formatDisplayFileName(f.path.split(Platform.pathSeparator).last),
        title: _tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合'),
        mergeLabel: _tr('선택한 PDF 합치기', 'Merge Selected PDFs', '合并所选 PDF', '選択したPDFを結合'),
      ),
    );

    if (result == 'browse') {
      final picked = await _pickFilesWithNotice(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: true,
      );
      if (picked != null && picked.files.length >= 2) {
        final files = picked.files.where((f) => f.path != null).map((f) => File(f.path!)).toList();
        await _createMergedPdfFromFiles(files, deleteSourceAfter: false);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_tr('PDF 파일을 2개 이상 선택해 주세요.', 'Please select at least 2 PDF files.', '请选择至少 2 个 PDF 文件。', 'PDFファイルを2つ以上選択してください。'))),
        );
      }
      return;
    }

    if (result is List<String> && result.length >= 2) {
      final fileByPath = {for (final f in existingPdfs) f.path: f};
      final chosen = result.map((p) => fileByPath[p]!).toList();
      await _createMergedPdfFromFiles(chosen, deleteSourceAfter: true);
    }
  }

  Future<void> _renameFileDialog(File file) async {
    final fullName = file.path.split(Platform.pathSeparator).last;
    final dotIdx = fullName.lastIndexOf('.');
    final baseName = dotIdx > 0 ? fullName.substring(0, dotIdx) : fullName;
    final ext = dotIdx > 0 ? fullName.substring(dotIdx + 1) : '';

    final ctrl = TextEditingController(text: baseName);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('이름 변경', 'Rename File', '重命名文件', 'ファイル名変更')),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: InputDecoration(
            labelText: _tr('새 파일 이름', 'New Filename', '新文件名', '新しいファイル名'),
            suffixText: ext.isNotEmpty ? '.$ext' : null,
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル')),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(_tr('변경', 'Rename', '确定', '変更')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final rawNewBase = ctrl.text.trim();
    if (rawNewBase.isEmpty) return;

    final safeNewBase = rawNewBase.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
    final newFileName = ext.isNotEmpty ? '$safeNewBase.$ext' : safeNewBase;
    if (newFileName == fullName) return;

    final newPath = '${file.parent.path}/$newFileName';
    if (await File(newPath).exists()) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_tr('같은 이름의 파일이 이미 존재합니다.', 'A file with that name already exists.', '同名文件已存在。', '同じ名前のファイルが既に存在します。'))),
        );
      }
      return;
    }

    try {
      final oldPath = file.path;
      await file.rename(newPath);
      await StorageService.migrateBookMetadata(oldPath, newPath);
      await _loadLibrary();
    } catch (_) {}
  }

  Future<void> _openFile(File file) async {
    _closeSearch(); // 파일을 열면 검색은 처음 상태로
    final rawName = file.path.split(Platform.pathSeparator).last;
    final displayName = _formatDisplayFileName(rawName);
    final ext = rawName.split('.').last.toLowerCase();

    if (_readerExts.contains(ext)) {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ReaderScreen(filePath: file.path, bookTitle: displayName),
        ),
      );
    } else if (ext == 'pdf') {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [file],
            title: displayName,
            isPdf: true,
          ),
        ),
      );
    } else if (_imageExts.contains(ext)) {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [file],
            title: displayName,
            isPdf: false,
          ),
        ),
      );
    } else {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [file],
            title: displayName,
            isPdf: false,
          ),
        ),
      );
    }

    // 뷰어 종료 후 서재로 돌아올 때 화면 회전 상태 초기화
    if (StorageService.desiredLandscapeNotifier.value != null) {
      StorageService.desiredLandscapeNotifier.value = null;
    }
    try {
      await _pdfChannel.invokeMethod('setScreenOrientation', {'mode': 'unspecified'});
    } catch (_) {}
    SystemChrome.setPreferredOrientations([]);

    _loadLibrary();
  }

  Future<void> _createNewGroupDialog() async {
    final controller = TextEditingController();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('새 그룹 만들기', 'Create New Group', '新建分组', '新規グループ作成')),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: _tr('그룹 이름 입력', 'Enter group name', '输入分组名称', 'グループ名を入力'),
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
          ElevatedButton(
            onPressed: () async {
              final text = controller.text.trim();
              if (text.isNotEmpty) {
                await StorageService.addGroup(text);
                if (ctx.mounted) Navigator.pop(ctx);
                _loadLibrary();
              }
            },
            child: Text(_tr('추가', 'Add', '添加', '追加')),
          ),
        ],
      ),
    );
  }

  /// 그룹 막대: [전체](고정) + 순서를 바꿀 수 있는 그룹들 + 새 그룹 추가
  /// - 그룹을 꾹 누르면 편집 상태(우상단 빨간 - 버튼)가 되고, 그대로 끌어 순서를 바꿀 수 있다
  /// - 편집 상태에서는 바로 끌어 순서를 바꾸고, - 를 누르면 그룹 삭제
  bool _favoritesOnly = false; // 즐겨찾기만 보는 중

  /// 즐겨찾기만 볼 때 그룹 막대 대신 보이는 줄 (← 즐겨찾기 n)
  Widget _buildFavoritesHeader(int count) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        const SizedBox(width: 4),
        IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: _tr('돌아가기', 'Back', '返回', '戻る'),
          onPressed: () => setState(() => _favoritesOnly = false),
        ),
        const SizedBox(width: 24, height: 24, child: Center(child: Icon(Icons.bookmarks, color: Colors.amber, size: 21))),
        const SizedBox(width: 8),
        Text(_tr('북마크', 'Bookmarks', '书签', 'ブックマーク'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(width: 8),
        Text('$count', style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
      ],
    );
  }

  Future<void> _openDocumentScanner() async {
    final targetGroup = _selectedGroup == '전체' ? '미분류' : _selectedGroup;
    final File? createdPdf = await Navigator.push<File?>(
      context,
      MaterialPageRoute(
        builder: (_) => DocumentScannerScreen(
          appLang: widget.appLang,
          targetGroup: targetGroup,
        ),
      ),
    );
    if (createdPdf == null || !await createdPdf.exists() || !mounted) return;

    await StorageService.setBookGroup(createdPdf.path, targetGroup);
    await _loadLibrary();
    if (!mounted) return;

    final fileName = createdPdf.path.split(Platform.pathSeparator).last;
    final grpDisplay = _localizeGroupName(targetGroup);
    final messenger = ScaffoldMessenger.of(context);
    messenger.removeCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 3),
        content: Row(
          children: [
            Expanded(
              child: Text(
                _tr(
                  '스캔 PDF 파일이 [$grpDisplay]에 생성되었습니다. ($fileName)',
                  'Scanned PDF created in [$grpDisplay]. ($fileName)',
                  '扫描 PDF 已创建于 [$grpDisplay]。($fileName)',
                  'スキャンPDFが [$grpDisplay] に作成されました。($fileName)',
                ),
              ),
            ),
            TextButton(
              style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).colorScheme.onInverseSurface,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              onPressed: () {
                messenger.removeCurrentSnackBar();
                _openFile(createdPdf);
              },
              child: Text(
                _tr('열기', 'Open', '打开', '開く'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
    Timer(const Duration(seconds: 3), () {
      if (mounted) {
        ScaffoldMessenger.of(context).removeCurrentSnackBar();
      }
    });
  }

  bool _fabOpen = false; // 파일 추가 버튼을 눌러 세 가지 메뉴가 펼쳐진 상태

  /// 파일 추가 버튼: 누르면 위로 [파일 추가 / PDF 병합 / 이미지 병합] 세 버튼이 펼쳐짐
  Widget _buildAddFab() {
    final cs = Theme.of(context).colorScheme;
    Widget action(String tag, IconData icon, String label, VoidCallback onTap) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: FloatingActionButton.extended(
            heroTag: tag,
            elevation: 2,
            backgroundColor: cs.surfaceContainerHighest,
            foregroundColor: cs.onSurface,
            onPressed: () {
              setState(() => _fabOpen = false);
              _closeSearch();
              onTap();
            },
            icon: Icon(icon),
            label: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        );
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          alignment: Alignment.bottomRight,
          child: _fabOpen
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // 그룹 이동 아이콘(폴더)에서 화살표 대신 +
                    action('fab_add_plain', Icons.create_new_folder_outlined, _tr('파일 추가', 'Add Files', '添加文件', 'ファイル追加'), _pickAndImportFiles),
                    action('fab_scan_doc', Icons.document_scanner_outlined, _tr('문서 스캔', 'Scan Document', '扫描文档', '文書スキャン'), _openDocumentScanner),
                    action('fab_merge_pdf', Icons.picture_as_pdf_outlined, _tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合'), _showMergeExistingPdfsDialog),
                    action('fab_merge_img', Icons.photo_library_outlined, _tr('이미지 합치기', 'Merge Images', '合并图片', '画像結合'), _showMergeExistingImagesDialog),
                  ],
                )
              : const SizedBox(width: 0, height: 0),
        ),
        FloatingActionButton.extended(
          heroTag: 'fab_add_files',
          onPressed: () {
            _closeSearch();
            setState(() => _fabOpen = !_fabOpen);
          },
          icon: AnimatedRotation(
            turns: _fabOpen ? 0.125 : 0,
            duration: const Duration(milliseconds: 180),
            child: const Icon(Icons.add),
          ),
          label: Text(_fabOpen ? _tr('닫기', 'Close', '关闭', '閉じる') : _tr('파일 추가', 'Add Files', '添加文件', 'ファイル追加')),
        ),
      ],
    );
  }

  /// 그룹 이름이 파일 형식 이름이면 그 형식(아이콘용 확장자), 아니면 null
  static String? _groupFormatExt(String name) {
    final n = name.trim().toLowerCase().replaceAll(RegExp(r'^\.'), '');
    const map = {
      'pdf': 'pdf',
      'epub': 'epub', '이펍': 'epub', '전자책': 'epub',
      'txt': 'txt', '텍스트': 'txt', '메모장': 'txt',
      'doc': 'docx', 'docx': 'docx', 'word': 'docx', '워드': 'docx',
      'hwp': 'hwp', 'hwpx': 'hwp', '한글': 'hwp', '한글 문서': 'hwp', '한글문서': 'hwp',
      'ppt': 'pptx', 'pptx': 'pptx', 'powerpoint': 'pptx', '파워포인트': 'pptx', 'ppt 문서': 'pptx',
      'xls': 'xlsx', 'xlsx': 'xlsx', 'xlsm': 'xlsx', 'excel': 'xlsx', '엑셀': 'xlsx',
      'cbz': 'cbz', '만화': 'cbz', 'comic': 'cbz', 'comics': 'cbz',
      'jpg': 'jpg', 'jpeg': 'jpg', 'png': 'jpg', 'webp': 'jpg', '이미지': 'jpg', '사진': 'jpg', 'image': 'jpg', 'images': 'jpg',
    };
    return map[n];
  }

  Widget _buildGroupBar() {
    final movable = _groups.where((g) => g != '전체').toList();
    final allSelected = _selectedGroup == '전체';
    final allChip = GestureDetector(
      onLongPress: movable.isEmpty ? null : () => setState(() => _groupEditMode = true),
      child: ChoiceChip(
        key: _allGroupChipKey,
        avatar: GroupStackIcon(
          size: 17,
          spread: _groupMenuOpen,
          color: allSelected ? Theme.of(context).colorScheme.onSecondaryContainer : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        showCheckmark: false,
        label: Text(_localizeGroupName('전체')),
        selected: allSelected,
        onSelected: (_) {
          if (_searchOpen) {
            _closeSearch();
            return;
          }
          if (_groupEditMode) {
            setState(() => _groupEditMode = false);
            return;
          }
          // [전체]를 고른 상태에서 한 번 더 누르면 그룹 목록을 펼쳐 바로 이동
          if (allSelected) {
            _showGroupJumpMenu();
          } else {
            setState(() => _selectedGroup = '전체');
          }
        },
      ),
    );
    // 즐겨찾기만 보기 (실제 그룹은 아님): 누르면 그룹 막대가 사라지고 즐겨찾기 파일만, 뒤로 가기로 돌아옴
    // 북마크만 보기: 그룹 막대에는 책갈피 아이콘만
    final favChip = ChoiceChip(
      showCheckmark: false,
      tooltip: _tr('북마크', 'Bookmarks', '书签', 'ブックマーク'),
      labelPadding: const EdgeInsets.symmetric(horizontal: 4),
      // 도구 모음의 북마크 아이콘과 같은 모양, 칩 가운데에
      // 글자 줄 안에 아이콘을 넣어, 다른 그룹(글자) 칩과 높이가 똑같게
      label: const Text.rich(TextSpan(children: [
        WidgetSpan(alignment: PlaceholderAlignment.middle, child: Icon(Icons.bookmarks, color: Colors.amber, size: 16)),
      ])),
      selected: false,
      onSelected: (_) {
        _closeSearch();
        setState(() {
          _groupEditMode = false;
          _favoritesOnly = true;
        });
      },
    );
    return ReorderableListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      buildDefaultDragHandles: false,
      header: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Row(mainAxisSize: MainAxisSize.min, children: [allChip, const SizedBox(width: 8), favChip]),
      ),
      footer: ActionChip(
        label: Icon(
          Icons.add,
          size: 16,
          color: Theme.of(context).colorScheme.primary,
        ),
        labelPadding: const EdgeInsets.symmetric(horizontal: 2),
        tooltip: _tr('새 그룹 추가', 'Add Group', '新建分组', 'グループ追加'),
        onPressed: () {
          _closeSearch();
          if (_groupEditMode) setState(() => _groupEditMode = false);
          _createNewGroupDialog();
        },
      ),
      itemCount: movable.length,
      onReorderStart: (_) {
        HapticFeedback.selectionClick();
        if (!_groupEditMode) setState(() => _groupEditMode = true);
      },
      onReorder: (oldIndex, newIndex) {
        if (newIndex > oldIndex) newIndex -= 1;
        if (newIndex == oldIndex) return;
        final next = List<String>.of(movable);
        next.insert(newIndex, next.removeAt(oldIndex));
        setState(() => _groups = ['전체', ...next]);
        StorageService.setGroupOrder(next);
      },
      proxyDecorator: (child, index, animation) {
        final double uiScale = UiScale.of(context);
        return Material(
          type: MaterialType.transparency,
          // 태블릿(앱 전체를 크게)에서도 끄는 칩이 손가락 밑에 있게
          child: AnimatedBuilder(
            animation: animation,
            builder: (_, c) => UiScaleDragFix(
              scale: uiScale,
              grab: _groupDragGrab,
              dropT: animation.status == AnimationStatus.reverse ? animation.value : null,
              child: c!,
            ),
            child: ScaleTransition(scale: Tween<double>(begin: 1.0, end: 1.06).animate(animation), child: child),
          ),
        );
      },
      itemBuilder: (context, index) {
        final grp = movable[index];
        final formatExt = _groupFormatExt(grp);
        final chip = ChoiceChip(
          // 그룹 이름이 파일 형식이면(PDF, EPUB, 워드 등) 그 형식 아이콘을 앞에
          avatar: formatExt == null ? null : FileTypeIcon(ext: formatExt, size: 18),
          showCheckmark: formatExt == null,
          label: Text(_localizeGroupName(grp)),
          selected: grp == _selectedGroup,
          onSelected: (_) {
            _closeSearch();
            setState(() {
              _groupEditMode = false;
              _selectedGroup = grp;
            });
          },
        );
        final Widget item = _groupEditMode
            ? Stack(
                clipBehavior: Clip.none,
                children: [
                  chip,
                  // 우상단 끝 빨간 - 버튼 (누르는 범위는 칩 모서리 안쪽까지 넉넉하게)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => _confirmDeleteGroup(grp),
                      child: SizedBox(
                        width: 26,
                        height: 22,
                        child: Align(
                          alignment: Alignment.topRight,
                          child: Transform.translate(
                            offset: const Offset(6, -5),
                            child: Container(
                              width: 17,
                              height: 17,
                              decoration: BoxDecoration(
                                color: Colors.redAccent,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 1.4),
                              ),
                              child: const Icon(Icons.remove, size: 13, color: Colors.white),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              )
            : chip;
        return Padding(
          key: ValueKey('group:$grp'),
          padding: const EdgeInsets.only(right: 8),
          // 칩 안에서 손가락이 닿은 자리 (끄는 칩을 손가락 밑에 두는 데 씀)
          child: Builder(
            builder: (itemCtx) => Listener(
              onPointerDown: (e) {
                final box = itemCtx.findRenderObject();
                if (box is RenderBox && box.hasSize) _groupDragGrab = box.globalToLocal(e.position);
              },
              // 평소: 꾹 눌러 끌기 / 편집 중: 바로 끌기
              child: _groupEditMode
                  ? ReorderableDragStartListener(index: index, child: item)
                  : ReorderableDelayedDragStartListener(index: index, child: item),
            ),
          ),
        );
      },
    );
  }

  /// 파일의 점 3개 메뉴: 이름 변경 / 그룹 이동 (표지형은 휴지통 이동도)
  Future<void> _showFileMenu(BuildContext anchor, File file, {bool withTrash = false}) async {
    final action = await showScaleMenu<String>(anchor, [
      ('rename', _tr('이름 변경', 'Rename', '重命名', '名前変更'), Icons.edit_outlined, null),
      ('move_group', _tr('그룹 이동', 'Move Group', '移动分组', 'グループ移動'), Icons.drive_file_move_outline, null),
      if (_bookshelfViewMode == 'grid') ('cover', _tr('표지 변경', 'Change Cover', '更换封面', '表紙を変更'), Icons.image_outlined, null),
      if (_bookshelfViewMode == 'grid' && _customCovers.containsKey(file.path))
        ('cover_reset', _tr('원래 표지로', 'Original Cover', '恢复原封面', '元の表紙に戻す'), Icons.restore, null),
      if (withTrash) ('trash', _tr('휴지통 이동', 'Move to Trash', '移至回收站', 'ゴミ箱へ移動'), Icons.delete_outline, Colors.redAccent),
    ]);
    if (!mounted || action == null) return;
    if (action == 'rename') {
      _renameFileDialog(file);
    } else if (action == 'move_group') {
      _assignGroupDialog(file);
    } else if (action == 'trash') {
      _moveFileToTrash(file);
    } else if (action == 'cover') {
      _changeCover(file);
    } else if (action == 'cover_reset') {
      _resetCover(file);
    }
  }

  /// 표지 변경: 갖고 있는 그림을 골라 이 파일의 표지로 씀 (앱 안에 복사해 둠)
  Future<void> _changeCover(File file) async {
    final result = await _pickFilesWithNotice(type: FileType.image, allowMultiple: false);
    final picked = result?.files.firstOrNull?.path;
    if (picked == null || !mounted) return;
    try {
      final dir = Directory('${(await getApplicationDocumentsDirectory()).path}/.covers');
      await dir.create(recursive: true);
      final ext = picked.split('.').last.toLowerCase();
      final out = File('${dir.path}/${DateTime.now().millisecondsSinceEpoch}.${ext.length <= 4 ? ext : 'jpg'}');
      await File(picked).copy(out.path);
      final old = _customCovers[file.path];
      await StorageService.setCustomCover(file.path, out.path);
      if (old != null) {
        try {
          await File(old).delete();
        } catch (_) {}
      }
      _customCovers = await StorageService.getCustomCovers();
      _globalThumbMemoryCache.remove(file.path);
      _cacheThumbnailFromFileSync(file.path, out.path, isRawOriginalImage: true);
      if (mounted) setState(() {});
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_tr('표지를 바꾸지 못했습니다.', 'Could not change the cover.', '无法更换封面。', '表紙を変更できませんでした。'))),
      );
    }
  }

  /// 원래 표지로: 고른 표지를 지우고 파일에서 만든 표지를 다시 씀
  Future<void> _resetCover(File file) async {
    final old = _customCovers[file.path];
    await StorageService.setCustomCover(file.path, null);
    if (old != null) {
      try {
        await File(old).delete();
      } catch (_) {}
    }
    _customCovers = await StorageService.getCustomCovers();
    _globalThumbMemoryCache.remove(file.path);
    _getThumbNotifier(file.path).value = null;
    if (mounted) setState(() {});
    _ensureBookThumbnail(file);
  }

  /// [전체]를 한 번 더 눌렀을 때: 그룹 이름 목록을 펼쳐 누르면 그 그룹으로 이동
  Future<void> _showGroupJumpMenu() async {
    final groups = _groups.where((g) => g != '전체').toList();
    if (groups.isEmpty) return;
    final box = _allGroupChipKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;
    final Offset topLeft = box.localToGlobal(Offset.zero);
    setState(() => _groupMenuOpen = true);
    final picked = await Navigator.of(context).push<String>(
      GroupJumpMenuRoute<String>(
        anchor: topLeft & box.size,
        barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
        items: [for (final g in groups) (g, _localizeGroupName(g), Icons.folder_outlined, null)],
        // 그룹 이름이 파일 형식이면 그 형식 아이콘
        leadingFor: (g) {
          final ext = _groupFormatExt(g);
          return ext == null ? null : FileTypeIcon(ext: ext, size: 18);
        },
      ),
    );
    if (mounted) setState(() => _groupMenuOpen = false);
    if (picked != null && mounted) setState(() => _selectedGroup = picked);
  }

  Future<void> _confirmDeleteGroup(String groupName) async {
    if (groupName == '전체') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_tr('"전체" 기본 보기는 삭제할 수 없습니다.', '"All" group cannot be deleted.', '无法删除“全部”默认分组。', '「すべて」は削除できません。'))),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('"$groupName" 그룹 삭제', 'Delete "$groupName"', '删除 "$groupName"', '「$groupName」グループ削除')),
        content: Text(
          _tr(
            '"$groupName" 그룹을 삭제할까요?\n(그룹 안의 파일들은 유지됩니다)',
            'Delete group "$groupName"?\n(Files inside will be kept)',
            '确定删除 "$groupName" 分组吗？\n（组内文件将保留）',
            '「$groupName」を削除しますか？\n(中のファイルはそのまま残ります)',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(_tr('그룹 삭제', 'Delete', '删除分组', '削除')),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await StorageService.removeGroup(groupName);
      if (_selectedGroup == groupName) {
        _selectedGroup = '전체';
      }
      await _loadLibrary();
      if (mounted && _groups.where((g) => g != '전체').isEmpty) setState(() => _groupEditMode = false);
    }
  }

  Future<void> _moveFileToTrash(File file, {bool reloadAfter = true}) async {
    final fileName = file.path.split(Platform.pathSeparator).last;
    final trashDir = await _getTrashDirectory();
    final targetPath = '${trashDir.path}/$fileName';
    if (await file.exists()) {
      await file.copy(targetPath);
      await file.delete();
    }
    if (reloadAfter) {
      await _loadLibrary();
    }
  }

  Future<void> _moveSelectedFilesBatch() async {
    if (_selectedFilePaths.isEmpty) return;
    final candidateGroups = [
      ..._groups.where((g) => g != '전체'),
      if (!_groups.contains('미분류')) '미분류',
    ];

    final chosenGroup = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(
                  _tr(
                    '선택한 ${_selectedFilePaths.length}개 파일 그룹 이동',
                    'Move ${_selectedFilePaths.length} Selected File(s)',
                    '移动所选 ${_selectedFilePaths.length} 个文件',
                    '選択した${_selectedFilePaths.length}個のファイルを移動',
                  ),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const Divider(height: 1),
              ...candidateGroups.map((g) => ListTile(
                    leading: const Icon(Icons.folder_outlined),
                    title: Text(_localizeGroupName(g)),
                    onTap: () => Navigator.pop(ctx, g),
                  )),
            ],
          ),
        ),
      ),
    );

    if (chosenGroup == null) return;

    for (final path in _selectedFilePaths) {
      await StorageService.setBookGroup(path, chosenGroup);
    }

    setState(() {
      _selectedFilePaths.clear();
      _isSelectionMode = false;
    });

    await _loadLibrary();
  }

  Future<void> _deleteSelectedFilesBatch() async {
    if (_selectedFilePaths.isEmpty) return;
    final count = _selectedFilePaths.length;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('선택한 파일 삭제', 'Delete Selected Files', '删除所选文件', '選択したファイルを削除')),
        content: Text(
          _tr(
            '선택한 $count개의 파일을 휴지통으로 이동할까요?',
            'Move $count selected file(s) to Trash?',
            '是否将所选 $count 个文件移至回收站？',
            '選択した$count個のファイルをゴミ箱へ移動しますか？',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(_tr('삭제', 'Delete', '删除', '削除')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final targets = _allBooks.where((f) => _selectedFilePaths.contains(f.path)).toList();
    for (final f in targets) {
      await _moveFileToTrash(f, reloadAfter: false);
    }

    setState(() {
      _selectedFilePaths.clear();
      _isSelectionMode = false;
    });

    await _loadLibrary();
  }

  Future<void> _showTrashBinDialog() async {
    await _loadLibrary();
    if (!mounted) return;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => SafeArea(
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.65,
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.delete_outline),
                  title: Text(
                    '${_tr("휴지통", "Trash", "回收站", "ゴミ箱")} (${_trashedBooks.length})',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  trailing: _trashedBooks.isNotEmpty
                      ? TextButton.icon(
                          icon: const Icon(Icons.delete_forever, color: Colors.redAccent, size: 16),
                          label: Text(_tr('휴지통 비우기', 'Empty Trash', '清空回收站', 'ゴミ箱を空にする'), style: const TextStyle(color: Colors.redAccent)),
                          onPressed: () async {
                            final confirmEmpty = await showDialog<bool>(
                              context: ctx,
                              builder: (dCtx) => AlertDialog(
                                title: Text(_tr('휴지통 비우기', 'Empty Trash', '清空回收站', 'ゴミ箱を空にする')),
                                content: Text(_tr('휴지통의 모든 파일을 영구 삭제할까요?', 'Permanently delete all files in Trash?', '确定永久删除回收站中的所有文件吗？', 'ゴミ箱内のすべてのファイルを完全に削除しますか？')),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(dCtx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.redAccent,
                                      foregroundColor: Colors.white,
                                    ),
                                    onPressed: () => Navigator.pop(dCtx, true),
                                    child: Text(_tr('영구 삭제', 'Delete Forever', '永久删除', '完全削除')),
                                  ),
                                ],
                              ),
                            );
                            if (confirmEmpty == true) {
                              final appDir = await getApplicationDocumentsDirectory();
                              for (final tf in _trashedBooks) {
                                final fileName = tf.path.split(Platform.pathSeparator).last;
                                await StorageService.removeBookMetadata('${appDir.path}/$fileName');
                                if (await tf.exists()) await tf.delete();
                              }
                              await _loadLibrary();
                              setModalState(() {});
                            }
                          },
                        )
                      : null,
                ),
                const Divider(height: 1),
                Expanded(
                  child: _trashedBooks.isEmpty
                      ? Center(child: Text(_tr('휴지통이 비어 있습니다.', 'Trash is empty.', '回收站为空。', 'ゴミ箱は空です。')))
                      : ListView.separated(
                          itemCount: _trashedBooks.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (_, idx) {
                            final tf = _trashedBooks[idx];
                            final fileName = tf.path.split(Platform.pathSeparator).last;
                            return ListTile(
                              leading: const Icon(Icons.insert_drive_file_outlined),
                              title: Text(_formatDisplayFileName(fileName), maxLines: 1, overflow: TextOverflow.ellipsis),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  TextButton.icon(
                                    icon: const Icon(Icons.restore_from_trash, size: 16),
                                    label: Text(_tr('복원', 'Restore', '恢复', '復元')),
                                    onPressed: () async {
                                      final appDir = await getApplicationDocumentsDirectory();
                                      final restoredPath = '${appDir.path}/$fileName';
                                      if (await tf.exists()) {
                                        await tf.copy(restoredPath);
                                        await tf.delete();
                                      }
                                      await _loadLibrary();
                                      setModalState(() {});
                                    },
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_forever, color: Colors.redAccent),
                                    tooltip: _tr('영구 삭제', 'Delete Forever', '永久删除', '完全削除'),
                                    onPressed: () async {
                                      final confirmDelete = await showDialog<bool>(
                                        context: ctx,
                                        builder: (dCtx) => AlertDialog(
                                          title: Text(_tr('영구 삭제', 'Delete Forever', '永久删除', '完全削除')),
                                          content: Text(_tr('"$fileName" 파일을 영구 삭제할까요?', 'Permanently delete "$fileName"?', '确定永久删除 "$fileName" 吗？', '「$fileName」を完全に削除しますか？')),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(dCtx, false),
                                              child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル')),
                                            ),
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.redAccent,
                                                foregroundColor: Colors.white,
                                              ),
                                              onPressed: () => Navigator.pop(dCtx, true),
                                              child: Text(_tr('영구 삭제', 'Delete Forever', '永久删除', '完全削除')),
                                            ),
                                          ],
                                        ),
                                      );
                                      if (confirmDelete == true) {
                                        final appDir = await getApplicationDocumentsDirectory();
                                        await StorageService.removeBookMetadata('${appDir.path}/$fileName');
                                        if (await tf.exists()) {
                                          await tf.delete();
                                        }
                                        await _loadLibrary();
                                        setModalState(() {});
                                      }
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _assignGroupDialog(File file) async {
    final candidateGroups = [
      ..._groups.where((g) => g != '전체'),
      if (!_groups.contains('미분류')) '미분류',
    ];
    await showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(_tr('파일 그룹 이동', 'Move to Group', '移动分组', 'グループ移動'), style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
              const Divider(height: 1),
              ...candidateGroups.map((g) => ListTile(
                    leading: const Icon(Icons.folder_outlined),
                    title: Text(_localizeGroupName(g)),
                    onTap: () async {
                      await StorageService.setBookGroup(file.path, g);
                      if (ctx.mounted) Navigator.pop(ctx);
                      _loadLibrary();
                    },
                  )),
            ],
          ),
        ),
      ),
    );
  }

  /// 우측 상단 톱니바퀴 '앱 설정' 화면 (항목을 누르면 아래에서 고르기 창이 올라옴)
  /// 화면 전체 높이의 창으로 띄워서, 맨 위에서 아래로 끌면 내려가며 닫힌다.
  Future<void> _showGlobalSettingsDialog() async {
    if (!mounted) return;
    final sheetCtrl = BottomSheet.createAnimationController(this);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      enableDrag: false,
      clipBehavior: Clip.antiAlias,
      // 화면의 2/3까지만 가림
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 2 / 3),
      transitionAnimationController: sheetCtrl,
      builder: (sheetCtx) => SheetPullToClose(
        controller: sheetCtrl,
        builder: (ctx, scroll, physics) => AppSettingsScreen(
          asSheet: true,
          scrollController: scroll,
          scrollPhysics: physics,
          appLang: widget.appLang,
          themeMode: widget.themeMode,
          onChangeThemeMode: widget.onChangeThemeMode,
          viewMode: _bookshelfViewMode,
          hideExtension: _hideFileExtension,
          hideGroupName: _hideGroupName,
          hideThumbnails: _hideThumbnails,
          onChangeHideThumbnails: (hide) async {
            await StorageService.setHideThumbnails(hide);
            if (mounted) setState(() => _hideThumbnails = hide);
          },
          onChangeHideGroupName: (hide) async {
            await StorageService.setHideGroupName(hide);
            if (mounted) setState(() => _hideGroupName = hide);
          },
          hidePageCount: _hidePageCount,
          onChangeHidePageCount: (hide) async {
            await StorageService.setHidePageCount(hide);
            if (mounted) setState(() => _hidePageCount = hide);
          },
          onChangeLanguage: widget.onChangeLanguage,
          onChangeViewMode: (mode) async {
            await StorageService.setBookshelfViewMode(mode);
            if (mounted) setState(() => _bookshelfViewMode = mode);
            // 표지형으로 바꾸면 아직 표지가 없는 한글·워드 문서의 첫 페이지를 만든다
            if (mode == 'grid') {
              for (final f in _allBooks) {
                if (!_globalThumbMemoryCache.containsKey(f.path) || _wantsSharpDocThumb(f.path)) _ensureBookThumbnail(f);
              }
            }
          },
          onChangeHideExtension: (hide) async {
            await StorageService.setHideFileExtension(hide);
            if (mounted) setState(() => _hideFileExtension = hide);
          },
          onOpenManual: (lang) => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => UserManualScreen(appLang: lang)),
          ),
        ),
      ),
    );
    disposeSheetControllerWhenDone(sheetCtrl);
  }

  /// 즐겨찾기 켜기/끄기: 책갈피가 먼저 움직이고, 잠시 뒤 즐겨찾기 순서로 목록을 다시 정렬한다
  // 즐겨찾기로 자리가 바뀔 때: 가운데로 작아지며 사라졌다가, 새 자리에서 가운데부터 커지며 나타남
  final Set<String> _favShrinking = {};
  final Map<String, DateTime> _favGrowAt = {};

  Future<void> _toggleFavorite(File file) async {
    final path = file.path;
    setState(() {
      _favoritePaths = Set<String>.of(_favoritePaths);
      if (!_favoritePaths.remove(path)) _favoritePaths.add(path);
    });
    await StorageService.toggleFavoriteBook(path);
    // 지금 보이는 목록에서 자리가 그대로면 (예: 맨 위 파일을 즐겨찾기) 줄어들었다 커지는 움직임 없이 책갈피만 바꿈
    if (!_favoriteMovesFile(path)) {
      if (!mounted) return;
      await _loadLibrary();
      return;
    }
    // 책갈피가 움직이는 모습을 잠깐 보여 준 뒤
    await Future<void>.delayed(const Duration(milliseconds: 160));
    if (!mounted) return;
    setState(() => _favShrinking.add(path));
    await Future<void>.delayed(const Duration(milliseconds: 170));
    if (!mounted) return;
    await _loadLibrary();
    if (!mounted) return;
    setState(() {
      _favShrinking.remove(path);
      _favGrowAt[path] = DateTime.now();
    });
  }

  /// 목록형에서 오른쪽으로 밀어 즐겨찾기: 밀려 나간 줄은 바로 빠지고(같은 화면에서),
  /// 즐겨찾기 순서대로 다시 줄 세운 새 자리에 오른쪽에서 밀려 들어옴
  void _favoriteBySwipe(File file) {
    final path = file.path;
    final favs = Set<String>.of(_favoritePaths);
    if (!favs.remove(path)) favs.add(path);
    setState(() {
      _favoritePaths = favs;
      _allBooks = List<File>.of(_allBooks)
        ..sort((a, b) => _libCompare(a, b, favs));
      _favGrowAt[path] = DateTime.now();
    });
    unawaited(() async {
      await StorageService.toggleFavoriteBook(path);
      if (mounted) await _loadLibrary();
    }());
  }

  /// 즐겨찾기를 바꾼 뒤 지금 보이는 목록(그룹)에서 이 파일의 자리가 바뀌는가 (즐겨찾기 먼저, 그다음 이름 순)
  bool _favoriteMovesFile(String path) {
    if (_searchOpen) return false; // 검색 결과는 이름 순서라 자리가 바뀌지 않음
    final visible = _selectedGroup == '전체'
        ? List<File>.of(_allBooks)
        : _allBooks.where((f) => (_bookGroupMap[f.path] ?? '미분류') == _selectedGroup).toList();
    final before = visible.indexWhere((f) => f.path == path);
    if (before < 0) return false;
    final after = List<File>.of(visible)
      ..sort((a, b) => _libCompare(a, b, _favoritePaths));
    return after.indexWhere((f) => f.path == path) != before;
  }

  Widget _favPop(String path, Widget child, {bool slide = false}) =>
      _FavoritePop(shrinking: _favShrinking.contains(path), growAt: _favGrowAt[path], slide: slide, child: child);

  /// 파일 목록에 보여 줄 마지막으로 읽은 쪽 (예: (6/983)), 연 적 없으면 빈 문자열
  String _pageLabelText(String path) {
    final lbl = _bookPageLabelMap[path];
    return lbl == null ? '' : '($lbl)';
  }

  /// 1, 3, 10, 11, 13. 표지형(썸네일) 그리드 카드:
  /// - 고화질 첫 페이지 썸네일 (FilterQuality.high)
  /// - 휴대폰 한 화면에 9개(3×3) 들어가는 크기
  /// - 왼쪽 위 즐겨찾기 책갈피, 하단 점 3개(이름 변경 / 그룹 이동 / 휴지통 이동)
  /// - 진행바 및 진행률(%) 제거 (#11)
  /// - 그룹 이름은 [전체] 탭에서만 표시하고 개별 그룹 탭에서는 숨김 (#10), 그 오른쪽(또는 그 자리)에 마지막으로 읽은 쪽 (지금/전체)
  Widget _buildGridBookCard(File file) {
    final rowKey = _fileRowKeys.putIfAbsent(file.path, () => GlobalKey());
    final rawFileName = file.path.split(Platform.pathSeparator).last;
    final displayFileName = _formatDisplayFileName(rawFileName);
    final grp = _bookGroupMap[file.path] ?? '미분류';
    final grpDisplay = _localizeGroupName(grp);
    final bool showGroupLabel = _selectedGroup == '전체' && !_hideGroupName;
    final isSelected = _selectedFilePaths.contains(file.path);
    final isFavorite = _favoritePaths.contains(file.path);
    final lowerExt = rawFileName.split('.').last.toLowerCase();
    final thumbNotifier = _getThumbNotifier(file.path);


    return RepaintBoundary(
      child: Container(
        key: rowKey,
        child: GestureDetector(
          onLongPress: () {
            if (_activeBookshelfPointers.length >= 2) return;
            setState(() {
              final bool targetSelect = !_isSelectionMode ? true : !isSelected;
              _isSelectionMode = true;
              _isDragSelecting = true;
              _dragTargetSelectState = targetSelect;
              _lastDragTouchedPath = file.path;
              if (targetSelect) {
                _selectedFilePaths.add(file.path);
              } else {
                _selectedFilePaths.remove(file.path);
              }
            });
          },
          onTap: () {
            if (_activeBookshelfPointers.length >= 2) return;
            if (_isSelectionMode) {
              setState(() {
                if (isSelected) {
                  _selectedFilePaths.remove(file.path);
                  if (_selectedFilePaths.isEmpty) {
                    _isSelectionMode = false;
                  }
                } else {
                  _selectedFilePaths.add(file.path);
                }
              });
            } else {
              _openFile(file);
            }
          },
          child: Card(
            elevation: isSelected ? 4 : 2,
            margin: EdgeInsets.zero,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: isSelected
                  ? const BorderSide(color: Colors.amber, width: 2.2)
                  : BorderSide(
                      color: widget.isDarkMode ? Colors.white12 : Colors.black12,
                      width: 1.0,
                    ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 상단: 고화질 파일 첫 페이지 썸네일 영역 + 왼쪽 위 즐겨찾기 책갈피
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Container(
                        color: widget.isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        child: ValueListenableBuilder<ImageProvider?>(
                          valueListenable: thumbNotifier,
                          builder: (context, thumbProvider, _) {
                            // 표지 그림 끄기: 사용자가 고른 표지가 아니면 아이콘만
                            if (thumbProvider != null && (!_hideThumbnails || _customCovers.containsKey(file.path))) {
                              final bool slides = (lowerExt == 'pptx' || lowerExt == 'ppt') && !_customCovers.containsKey(file.path);
                              return Image(
                                image: thumbProvider,
                                // 슬라이드(가로)는 잘리지 않게 전체를 보여 준다
                                fit: slides ? BoxFit.contain : BoxFit.cover,
                                alignment: slides ? Alignment.center : Alignment.topCenter,
                                gaplessPlayback: true,
                                filterQuality: FilterQuality.low,
                                errorBuilder: (_, __, ___) => Center(
                                  child: FileTypeIcon(ext: lowerExt, size: 34),
                                ),
                              );
                            }
                            return Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  FileTypeIcon(ext: lowerExt, size: 32),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.indigo.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(5),
                                    ),
                                    child: Text(
                                      lowerExt.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.indigo,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      if (_isSelectionMode)
                        Positioned(
                          top: 4,
                          left: 4,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: Checkbox(
                                value: isSelected,
                                visualDensity: VisualDensity.compact,
                                side: const BorderSide(color: Colors.white, width: 1.5),
                                onChanged: (v) {
                                  setState(() {
                                    if (v == true) {
                                      _selectedFilePaths.add(file.path);
                                    } else {
                                      _selectedFilePaths.remove(file.path);
                                      if (_selectedFilePaths.isEmpty) {
                                        _isSelectionMode = false;
                                      }
                                    }
                                  });
                                },
                              ),
                            ),
                          ),
                        ),
                      // 왼쪽 위 끝에 걸친 즐겨찾기 책갈피
                      if (!_isSelectionMode)
                        Positioned(
                          top: 0,
                          left: 4, // 둥근 모서리를 피해 살짝 안쪽
                          child: FavoriteRibbon(
                            active: isFavorite,
                            onImage: true,
                            width: 18,
                            height: 27,
                            extraHitArea: 22, // 표지를 누르려다 파일이 열리지 않도록 누르는 범위를 넓게
                            onTap: () => _toggleFavorite(file),
                          ),
                        ),
                    ],
                  ),
                ),
                // 하단: 파일 제목 + 점 3개(이름 변경/그룹 이동) 아이콘 + ([전체] 탭일 때만 그룹 이름 표시)
                Container(
                  padding: const EdgeInsets.fromLTRB(7, 4, 2, 5),
                  color: widget.isDarkMode ? const Color(0xFF0F172A) : Colors.white,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          // 파일 이름 앞 형식 아이콘
                          FileTypeIcon(ext: lowerExt, size: 15),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              displayFileName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (!_isSelectionMode)
                            SizedBox(
                              width: 24,
                              height: 24,
                              // 세로 점 3개: 그룹 목록처럼 아이콘에서 커져 나오는 메뉴
                              child: Builder(
                                builder: (btnCtx) => IconButton(
                                  padding: EdgeInsets.zero,
                                  iconSize: 17,
                                  icon: const Icon(Icons.more_vert, size: 15),
                                  tooltip: _tr('메뉴', 'More', '更多', 'メニュー'),
                                  onPressed: () => _showFileMenu(btnCtx, file, withTrash: true),
                                ),
                              ),
                            ),
                        ],
                      ),
                      ...[
                        const SizedBox(height: 1),
                        Text(
                          // 그룹 이름 오른쪽에 마지막으로 읽은 쪽 (특정 그룹 탭에서는 쪽만)
                          _fileMetaText(file.path, grpDisplay, showGroupLabel),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10,
                            color: widget.isDarkMode ? Colors.white60 : Colors.black54,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String query = _searchQuery.trim().toLowerCase();
    String nameOf(File f) => f.path.split(Platform.pathSeparator).last;
    final List<File> filteredBooks = _searchOpen
        // 검색 중: 검색어가 없으면 파일을 보여 주지 않고, 있으면 이름에 들어간 파일을 이름 순서대로 (모든 그룹에서)
        ? (query.isEmpty
            ? <File>[]
            : (_allBooks.where((f) => nameOf(f).toLowerCase().contains(query)).toList()
              ..sort((a, b) => _naturalCompare(nameOf(a).toLowerCase(), nameOf(b).toLowerCase()))))
        : _favoritesOnly
            ? _allBooks.where((f) => _favoritePaths.contains(f.path)).toList()
            : _selectedGroup == '전체'
            ? _allBooks
            : _allBooks.where((f) => (_bookGroupMap[f.path] ?? '미분류') == _selectedGroup).toList();

    return PopScope(
      canPop: !_isSelectionMode && !_groupEditMode && !_searchOpen && !_favoritesOnly,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _searchOpen) {
          _closeSearch();
          return;
        }
        if (!didPop && _favoritesOnly && !_isSelectionMode) {
          setState(() => _favoritesOnly = false);
          return;
        }
        if (!didPop && _groupEditMode) {
          setState(() => _groupEditMode = false);
          return;
        }
        if (!didPop && _isSelectionMode) {
          setState(() {
            _isSelectionMode = false;
            _selectedFilePaths.clear();
            _isDragSelecting = false;
          });
        }
      },
      child: Scaffold(
      appBar: _isSelectionMode
          ? AppBar(
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _isSelectionMode = false;
                    _selectedFilePaths.clear();
                  });
                },
              ),
              title: Text(
                _tr(
                  '${_selectedFilePaths.length}개 선택됨',
                  '${_selectedFilePaths.length} Selected',
                  '已选择 ${_selectedFilePaths.length} 项',
                  '${_selectedFilePaths.length}個選択中',
                ),
              ),
              // 5. 파일 여러 개 선택 창 상단에서 전체 선택 옆의 '그룹이동', '쓰레기통' 아이콘 삭제! (하단 버튼만 유지)
              actions: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      if (_selectedFilePaths.length == filteredBooks.length) {
                        _selectedFilePaths.clear();
                      } else {
                        _selectedFilePaths.addAll(filteredBooks.map((f) => f.path));
                      }
                    });
                  },
                  child: Text(_tr('전체 선택', 'Select All', '全选', 'すべて選択')),
                ),
              ],
            )
          : AppBar(
              title: Row(
                children: [
                  const Text('MY'),
                  const SizedBox(width: 20),
                  Expanded(child: _buildSearchArea()),
                ],
              ),
              actions: [
                // 파일 검색: 누르면 이 돋보기가 검색 밑줄로 바뀜 (검색 중에는 자리만 남김)
                // 움직이는 돋보기와 겹쳐 잔상이 보이지 않게: 펼쳐지는 동안에는 바로 숨기고, 다 돌아온 순간에만 다시 보임
                // (누를 때 퍼지는 물결도 남지 않게 없앰)
                IgnorePointer(
                  ignoring: _searchOpen,
                  child: AnimatedBuilder(
                    animation: _searchAnim,
                    builder: (context, child) => Opacity(opacity: !_searchOpen && _searchAnim.isDismissed ? 1 : 0, child: child),
                    child: IconButton(
                      icon: const Icon(Icons.search),
                      tooltip: _tr('파일 검색', 'Search Files', '搜索文件', 'ファイル検索'),
                      style: IconButton.styleFrom(splashFactory: NoSplash.splashFactory, highlightColor: Colors.transparent),
                      onPressed: _openSearch,
                    ),
                  ),
                ),
                IconButton(
                  icon: Badge(
                    isLabelVisible: _trashedBooks.isNotEmpty,
                    label: Text('${_trashedBooks.length}'),
                    child: const Icon(Icons.delete_outline),
                  ),
                  tooltip: _tr('휴지통', 'Trash', '回收站', 'ゴミ箱'),
                  onPressed: () {
                    _closeSearch();
                    _showTrashBinDialog();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.sort_rounded),
                  tooltip: _tr('정렬', 'Sort', '排序', '並べ替え'),
                  onPressed: () {
                    _closeSearch();
                    _showSortSheet();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  tooltip: _tr('앱 설정', 'App Settings', '应用设置', 'アプリ設定'),
                  onPressed: () {
                    _closeSearch();
                    _showGlobalSettingsDialog();
                  },
                ),
              ],
            ),
      body: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (_) {
          ScaffoldMessenger.of(context).removeCurrentSnackBar();
        },
        child: SafeArea(
        child: Column(
          children: [
            SizedBox(
              height: 54,
              child: _favoritesOnly ? _buildFavoritesHeader(filteredBooks.length) : _buildGroupBar(),
            ),
            const Divider(height: 1),
            Expanded(
              // 검색 중 빈 곳(파일이 아닌 곳)을 누르면 검색을 닫음 (파일을 누르면 파일이 먼저 받음)
              child: GestureDetector(
                behavior: (_searchOpen || _fabOpen) ? HitTestBehavior.opaque : HitTestBehavior.deferToChild,
                onTap: _searchOpen ? _closeSearch : (_fabOpen ? () => setState(() => _fabOpen = false) : null),
                child: filteredBooks.isEmpty && _searchOpen
                  // 검색 중: 검색어가 없으면 아무것도, 찾은 파일이 없으면 짧게 알림
                  ? (query.isEmpty
                      // 가로 폭 전체를 차지해야 빈 곳을 눌렀을 때 검색이 닫힘 (크기 0이면 눌림을 못 받음)
                      ? const SizedBox.expand()
                      // 자판이 올라오고 내려가도 문구가 움직이지 않게: 위에서부터 같은 자리에 둠
                      : Align(
                          alignment: Alignment.topCenter,
                          child: Padding(
                            padding: const EdgeInsets.only(top: 96),
                            child: Text(
                              _tr('찾은 파일이 없습니다', 'No matching files', '没有找到文件', '該当するファイルがありません'),
                              style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                          ),
                        ))
                  : filteredBooks.isEmpty
                  // 빈 그룹(전체·북마크 포함): 합치기 버튼 없이 안내 글만
                  ? Center(
                      child: Text(
                        _favoritesOnly
                            ? _tr('북마크한 파일이 없어요', 'No bookmarked files', '没有书签文件', 'ブックマークしたファイルはありません')
                            : _tr('파일이 없어요', 'No files', '没有文件', 'ファイルがありません'),
                        style: TextStyle(fontSize: 15, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      ),
                    )
                  : Row(
                      children: [
                        Expanded(
                          child: Listener(
                              behavior: HitTestBehavior.translucent,
                      // 선택: 파일을 꾹 누른 채 드래그 / 그냥 드래그: 목록 스크롤
                      // (꾹 누름이 인식되면 목록 스크롤은 자동으로 멈추고 선택만 진행됨)
                      onPointerDown: (event) {
                        if (_groupEditMode) setState(() => _groupEditMode = false);
                        _activeBookshelfPointers[event.pointer] = event.position;
                        if (_activeBookshelfPointers.length >= 2 && _isDragSelecting) {
                          setState(() => _isDragSelecting = false);
                        }
                      },
                      onPointerMove: (event) {
                        _activeBookshelfPointers[event.pointer] = event.position;
                        if (_isSelectionMode && _isDragSelecting && _activeBookshelfPointers.length < 2) {
                          _applyDragSelectionAtGlobalPos(event.position);
                        }
                      },
                      onPointerUp: (event) {
                        _activeBookshelfPointers.remove(event.pointer);
                        if (_activeBookshelfPointers.isEmpty) {
                          if (_isDragSelecting) {
                            setState(() => _isDragSelecting = false);
                          }
                          _lastDragTouchedPath = null;
                        }
                      },
                      onPointerCancel: (event) {
                        _activeBookshelfPointers.remove(event.pointer);
                        if (_activeBookshelfPointers.isEmpty) {
                          if (_isDragSelecting) {
                            setState(() => _isDragSelecting = false);
                          }
                          _lastDragTouchedPath = null;
                        }
                      },
                      child: AbsorbPointer(
                        // 그룹 편집 중에 목록을 누르면 편집만 끝나고 파일은 열리지 않게
                        absorbing: _groupEditMode,
                        child: _bookshelfViewMode == 'grid'
                          ? LayoutBuilder(
                              builder: (context, constraints) {
                                // 3. 휴대폰 기준 한 페이지에 9개(가로 3개 × 세로 3개)가 들어갈 정도로 크기 자동 조절
                                const int crossCount = 3;
                                const double hPad = 10.0;
                                const double vPad = 8.0;
                                const double crossSpacing = 8.0;
                                const double mainSpacing = 8.0;
                                final double cellW = ((constraints.maxWidth - (hPad * 2) - (crossSpacing * (crossCount - 1))) / crossCount).clamp(80.0, 420.0);
                                final double targetCellH = ((constraints.maxHeight - (vPad * 2) - (mainSpacing * 2)) / 3.0).clamp(130.0, 290.0);
                                final double childAspect = (cellW / targetCellH).clamp(0.50, 0.98);

                                return GridView.builder(
                                  controller: _bookshelfScrollController,
                                  cacheExtent: 3000.0,
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  padding: const EdgeInsets.fromLTRB(hPad, vPad, hPad, 88),
                                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossCount,
                                    crossAxisSpacing: crossSpacing,
                                    mainAxisSpacing: mainSpacing,
                                    childAspectRatio: childAspect,
                                  ),
                                  itemCount: filteredBooks.length,
                                  itemBuilder: (context, index) {
                                    final bookFile = filteredBooks[index];
                                    return _KeepAliveBookItem(
                                      key: ValueKey(bookFile.path),
                                      child: _favPop(bookFile.path, _buildGridBookCard(bookFile)),
                                    );
                                  },
                                );
                              },
                            )
                          : ListView.separated(
                        controller: _bookshelfScrollController,
                        cacheExtent: 3000.0,
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.only(bottom: 88),
                        itemCount: filteredBooks.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final file = filteredBooks[index];
                          final rowKey = _fileRowKeys.putIfAbsent(file.path, () => GlobalKey());
                        final rawFileName = file.path.split(Platform.pathSeparator).last;
                        final displayFileName = _formatDisplayFileName(rawFileName);
                        final grp = _bookGroupMap[file.path] ?? '미분류';
                        final isSelected = _selectedFilePaths.contains(file.path);
                        final isFavorite = _favoritePaths.contains(file.path);
                        final lowerExt = rawFileName.split('.').last.toLowerCase();

                        return _favPop(file.path, Dismissible(
                          // 즐겨찾기가 바뀌면 다른 열쇠가 되어, 밀려 나간 줄은 사라지고 새 자리에 새 줄이 들어옴
                          key: ValueKey('${file.path}|$isFavorite'),
                          // 오른쪽으로 밀기: 즐겨찾기 켜기/끄기 (그대로 오른쪽으로 사라졌다가 새 자리에서 오른쪽부터 들어옴)
                          // 왼쪽으로 밀기: 휴지통
                          direction: _isSelectionMode ? DismissDirection.none : DismissDirection.horizontal,
                          resizeDuration: const Duration(milliseconds: 220),
                          background: Container(
                            color: Colors.amber.shade600,
                            alignment: Alignment.centerLeft,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              children: [
                                Icon(isFavorite ? Icons.bookmark_remove_outlined : Icons.bookmark_add_outlined, color: Colors.white),
                                const SizedBox(width: 6),
                                Text(
                                  isFavorite
                                      ? _tr('북마크 해제', 'Remove Bookmark', '取消书签', 'ブックマーク解除')
                                      : _tr('북마크', 'Bookmark', '书签', 'ブックマーク'),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          secondaryBackground: Container(
                            color: Colors.redAccent,
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                const Icon(Icons.delete_outline, color: Colors.white),
                                const SizedBox(width: 6),
                                Text(_tr('휴지통 이동', 'Move to Trash', '移至回收站', 'ゴミ箱へ移動'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          onDismissed: (direction) {
                            if (direction == DismissDirection.startToEnd) {
                              _favoriteBySwipe(file);
                            } else {
                              _moveFileToTrash(file);
                            }
                          },
                          child: Container(
                            key: rowKey,
                            child: Stack(
                            clipBehavior: Clip.hardEdge,
                            children: [
                            ListTile(
                            selected: isSelected,
                            leading: _isSelectionMode
                                ? Checkbox(
                                    value: isSelected,
                                    onChanged: (v) {
                                      setState(() {
                                        if (v == true) {
                                          _selectedFilePaths.add(file.path);
                                        } else {
                                          _selectedFilePaths.remove(file.path);
                                          if (_selectedFilePaths.isEmpty) {
                                            _isSelectionMode = false;
                                          }
                                        }
                                      });
                                    },
                                  )
                                : FileTypeIcon(ext: lowerExt),
                            title: Text(
                              displayFileName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Builder(
                              builder: (context) {
                                final grpDisplay = _localizeGroupName(grp);
                                // 10. [전체]에서만 그룹 이름 표시, 특정 그룹 선택 시 그룹 이름 표시 제거
                                // 그룹 이름 오른쪽: 마지막으로 읽은 쪽 (예: (6/983))
                                final subText = _fileMetaText(file.path, grpDisplay, _selectedGroup == '전체' && !_hideGroupName);
                                return Text(
                                  subText,
                                  style: const TextStyle(fontSize: 12),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                );
                              },
                            ),
                            trailing: _isSelectionMode
                                ? null
                                // 가로 점 3개: 이름 변경 / 그룹 이동 (표지형 세로 점 3개 메뉴와 같은 모양)
                                // 가로 점 3개: 그룹 목록처럼 아이콘에서 커져 나오는 메뉴
                                : Builder(
                                    builder: (btnCtx) => IconButton(
                                      icon: const Icon(Icons.more_horiz),
                                      tooltip: _tr('메뉴', 'More', '更多', 'メニュー'),
                                      onPressed: () => _showFileMenu(btnCtx, file),
                                    ),
                                  ),
                            onLongPress: () {
                              if (_activeBookshelfPointers.length >= 2) return;
                              setState(() {
                                final bool targetSelect = !_isSelectionMode ? true : !isSelected;
                                _isSelectionMode = true;
                                _isDragSelecting = true;
                                _dragTargetSelectState = targetSelect;
                                _lastDragTouchedPath = file.path;
                                if (targetSelect) {
                                  _selectedFilePaths.add(file.path);
                                } else {
                                  _selectedFilePaths.remove(file.path);
                                }
                              });
                            },
                            onTap: () {
                              if (_activeBookshelfPointers.length >= 2) return;
                              if (_isSelectionMode) {
                                setState(() {
                                  if (isSelected) {
                                    _selectedFilePaths.remove(file.path);
                                    if (_selectedFilePaths.isEmpty) {
                                      _isSelectionMode = false;
                                    }
                                  } else {
                                    _selectedFilePaths.add(file.path);
                                  }
                                });
                              } else {
                                _openFile(file);
                              }
                            },
                          ),
                            // 왼쪽 위 끝에 걸친 즐겨찾기 책갈피
                            if (!_isSelectionMode)
                              Positioned(
                                top: 0,
                                left: 0,
                                child: FavoriteRibbon(
                                  active: isFavorite,
                                  isDark: widget.isDarkMode,
                                  onTap: () => _toggleFavorite(file),
                                ),
                              ),
                            ],
                          ),
                          ),
                        ), slide: true);
                      },
                    )),
                          ),
                        ),
                      ],
                    ),
              ),
            ),
          ],
        ),
      ),
      ),
      floatingActionButton: _isSelectionMode
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  height: 42,
                  child: FloatingActionButton.extended(
                    heroTag: 'fab_batch_move_group',
                    backgroundColor: Colors.indigo,
                    foregroundColor: Colors.white,
                    extendedPadding: const EdgeInsets.symmetric(horizontal: 13),
                    extendedIconLabelSpacing: 6,
                    onPressed: _selectedFilePaths.isNotEmpty ? _moveSelectedFilesBatch : null,
                    icon: const Icon(Icons.drive_file_move_outline, size: 16),
                    label: Text(
                      '${_tr("그룹", "Group", "分组", "グループ")} (${_selectedFilePaths.length})',
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 42,
                  child: FloatingActionButton.extended(
                    heroTag: 'fab_batch_delete',
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    extendedPadding: const EdgeInsets.symmetric(horizontal: 13),
                    extendedIconLabelSpacing: 6,
                    onPressed: _selectedFilePaths.isNotEmpty ? _deleteSelectedFilesBatch : null,
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: Text(
                      '${_tr("삭제", "Delete", "删除", "削除")} (${_selectedFilePaths.length})',
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            )
          : _buildAddFab(),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 드래그 선택 중 손가락이 목록 위/아래 가장자리에 머무는 동안 계속 부드럽게 자동 스크롤할 속도(16ms당 px)
double _edgeAutoScrollStep(double localDy, double viewportHeight, double zone) {
  if (localDy < zone) {
    final double t = ((zone - localDy) / zone).clamp(0.0, 1.6).toDouble();
    return -(2.0 + 18.0 * t);
  }
  if (localDy > viewportHeight - zone) {
    final double t = ((localDy - (viewportHeight - zone)) / zone).clamp(0.0, 1.6).toDouble();
    return 2.0 + 18.0 * t;
  }
  return 0.0;
}

/// 합치기용 파일 선택 창 (이미지·PDF 공용)
/// - 그냥 드래그: 목록 스크롤
/// - 파일을 꾹 누른 채 드래그: 지나가는 파일 연속 선택(가장자리에서 자동 스크롤)
/// 반환값: 선택한 경로 목록(List<String>) 또는 'browse'(기기에서 선택)
class _FileMergeSelectDialog extends StatefulWidget {
  const _FileMergeSelectDialog({
    required this.files,
    required this.tr,
    required this.displayName,
    required this.title,
    required this.mergeLabel,
  });

  final List<File> files;
  final String Function(String ko, String en, String zh, String ja) tr;
  final String Function(File f) displayName;
  final String title;
  final String mergeLabel;
  // 행 배치: [순서번호][파일이름][체크칸]

  @override
  State<_FileMergeSelectDialog> createState() => _FileMergeSelectDialogState();
}

class _FileMergeSelectDialogState extends State<_FileMergeSelectDialog> {
  static const double _rowH = 48.0;
  final ScrollController _sc = ScrollController();
  final GlobalKey _listKey = GlobalKey();
  final List<String> _selected = [];

  bool _dragSelecting = false;
  bool _dragTarget = true;
  int? _lastIndex;
  Offset? _tapDownPos;
  DateTime? _tapDownAt;
  Offset? _lastDragGlobal;
  Timer? _edgeTimer;

  @override
  void dispose() {
    _edgeTimer?.cancel();
    _sc.dispose();
    super.dispose();
  }

  RenderBox? get _listBox {
    final box = _listKey.currentContext?.findRenderObject();
    return (box is RenderBox && box.hasSize) ? box : null;
  }

  int? _indexAt(Offset global, {bool clampToList = false}) {
    final box = _listBox;
    if (box == null || widget.files.isEmpty) return null;
    double y = box.globalToLocal(global).dy;
    if (y < 0 || y >= box.size.height) {
      if (!clampToList) return null;
      y = y.clamp(0.0, box.size.height - 1).toDouble();
    }
    final double off = _sc.hasClients ? _sc.position.pixels : 0.0;
    final int idx = ((y + off) / _rowH).floor();
    if (idx < 0 || idx >= widget.files.length) return null;
    return idx;
  }

  void _setSelected(int idx, bool select) {
    final path = widget.files[idx].path;
    if (select) {
      if (!_selected.contains(path)) _selected.add(path);
    } else {
      _selected.remove(path);
    }
  }

  void _applyDragAt(Offset global) {
    final idx = _indexAt(global, clampToList: true);
    if (idx == null) return;
    final int from = _lastIndex ?? idx;
    if (from == idx && _lastIndex != null) return;
    setState(() {
      final int step = idx >= from ? 1 : -1;
      for (int i = from; ; i += step) {
        _setSelected(i, _dragTarget);
        if (i == idx) break;
      }
    });
    _lastIndex = idx;
  }

  void _ensureEdgeTimer() {
    _edgeTimer ??= Timer.periodic(const Duration(milliseconds: 16), (t) {
      final box = _listBox;
      final g = _lastDragGlobal;
      if (!mounted || !_dragSelecting || box == null || g == null || !_sc.hasClients) {
        t.cancel();
        _edgeTimer = null;
        return;
      }
      final double localDy = box.globalToLocal(g).dy;
      final double step = _edgeAutoScrollStep(localDy, box.size.height, 44.0);
      if (step == 0.0) return;
      final pos = _sc.position;
      final double target = (pos.pixels + step).clamp(pos.minScrollExtent, pos.maxScrollExtent).toDouble();
      if (target != pos.pixels) {
        _sc.jumpTo(target);
        _applyDragAt(g);
      }
    });
  }

  void _onLongPressStart(LongPressStartDetails d) {
    final idx = _indexAt(d.globalPosition);
    if (idx == null) return;
    HapticFeedback.selectionClick();
    setState(() {
      _dragSelecting = true;
      _dragTarget = !_selected.contains(widget.files[idx].path);
      _setSelected(idx, _dragTarget);
    });
    _lastIndex = idx;
    _lastDragGlobal = d.globalPosition;
  }

  void _onLongPressMove(LongPressMoveUpdateDetails d) {
    if (!_dragSelecting) return;
    _lastDragGlobal = d.globalPosition;
    _applyDragAt(d.globalPosition);
    _ensureEdgeTimer();
  }

  void _onLongPressEnd() {
    _dragSelecting = false;
    _lastIndex = null;
    _lastDragGlobal = null;
  }

  Widget _orderBadge(int selIndex) => CircleAvatar(
        radius: 11,
        backgroundColor: Colors.indigo,
        child: Text(
          '${selIndex + 1}',
          style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final tr = widget.tr;
    final files = widget.files;
    return AlertDialog(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(widget.title, maxLines: 1, softWrap: false),
            ),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                if (_selected.length == files.length) {
                  _selected.clear();
                } else {
                  _selected
                    ..clear()
                    ..addAll(files.map((e) => e.path));
                }
              });
            },
            child: Text(tr('전체선택', 'Select All', '全选', 'すべて選択')),
          ),
        ],
      ),
      content: SizedBox(
        width: 420,
        height: 360,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${tr("선택됨", "Selected", "已选", "選択中")}: ${_selected.length}',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                TextButton.icon(
                  icon: const Icon(Icons.folder_open, size: 14),
                  label: Text(tr('기기에서 선택', 'Browse Device', '从设备选择', '端末から選択')),
                  onPressed: () => Navigator.pop(context, 'browse'),
                ),
              ],
            ),
            const Divider(height: 1),
            Expanded(
              child: GestureDetector(
                onLongPressStart: _onLongPressStart,
                onLongPressMoveUpdate: _onLongPressMove,
                onLongPressEnd: (_) => _onLongPressEnd(),
                onLongPressCancel: _onLongPressEnd,
                child: ListView.builder(
                  key: _listKey,
                  controller: _sc,
                  itemExtent: _rowH,
                  itemCount: files.length,
                  itemBuilder: (_, idx) {
                    final f = files[idx];
                    final selIndex = _selected.indexOf(f.path);
                    final checked = selIndex != -1;
                    final checkbox = IgnorePointer(child: Checkbox(value: checked, onChanged: (_) {}));
                    final name = Expanded(
                      child: Text(widget.displayName(f), maxLines: 1, overflow: TextOverflow.ellipsis),
                    );
                    // 한 번 누르면 바로 선택/해제 (화면 끌기·길게 누르기와 겨루지 않게 손을 뗄 때 직접 판단)
                    return Listener(
                      onPointerDown: (e) {
                        _tapDownPos = e.position;
                        _tapDownAt = DateTime.now();
                      },
                      onPointerUp: (e) {
                        final p0 = _tapDownPos, t0 = _tapDownAt;
                        _tapDownPos = null;
                        if (p0 == null || t0 == null || _dragSelecting) return;
                        if ((e.position - p0).distance > 14 || DateTime.now().difference(t0).inMilliseconds > 450) return;
                        setState(() => _setSelected(idx, !_selected.contains(f.path)));
                      },
                      child: InkWell(
                      onTap: () {},
                      child: Row(
                        children: [
                          SizedBox(
                            width: 40,
                            child: checked ? Center(child: _orderBadge(selIndex)) : null,
                          ),
                          name,
                          checkbox,
                        ],
                      ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(tr('취소', 'Cancel', '取消', 'キャンセル'))),
        ElevatedButton(
          onPressed: _selected.length >= 2 ? () => Navigator.pop(context, List<String>.of(_selected)) : null,
          child: Text(widget.mergeLabel),
        ),
      ],
    );
  }
}


/// 즐겨찾기로 자리가 바뀌는 파일: 사라졌다가([shrinking]) 새 자리에서 나타남([growAt] 직후).
/// 표지형은 가운데로 작아졌다 커지고, 목록형([slide])은 오른쪽으로 밀려 나갔다가 오른쪽에서 밀려 들어옴
class _FavoritePop extends StatefulWidget {
  const _FavoritePop({required this.shrinking, required this.growAt, required this.child, this.slide = false});

  final bool shrinking;
  final bool slide;
  final DateTime? growAt;
  final Widget child;

  @override
  State<_FavoritePop> createState() => _FavoritePopState();
}

class _FavoritePopState extends State<_FavoritePop> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, value: widget.shrinking ? 0 : 1);

  bool _recent(DateTime? t) => t != null && DateTime.now().difference(t) < const Duration(milliseconds: 400);

  @override
  void initState() {
    super.initState();
    // 목록이 다시 정렬되며 새로 만들어진 경우
    if (!widget.shrinking && _recent(widget.growAt)) _grow();
  }

  void _grow() {
    _c.value = 0;
    _c.animateTo(1, duration: Duration(milliseconds: widget.slide ? 260 : 220), curve: widget.slide ? Curves.easeOutCubic : Curves.easeOutBack);
  }

  @override
  void didUpdateWidget(_FavoritePop old) {
    super.didUpdateWidget(old);
    if (widget.shrinking && !old.shrinking) {
      _c.animateTo(0, duration: const Duration(milliseconds: 160), curve: Curves.easeInCubic);
    } else if (!widget.shrinking && widget.growAt != old.growAt && _recent(widget.growAt)) {
      _grow();
    } else if (!widget.shrinking && old.shrinking && _c.value < 1) {
      _c.value = 1;
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.slide) return ScaleTransition(scale: _c, child: widget.child);
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (context, child) => FractionalTranslation(translation: Offset(1 - _c.value, 0), child: child),
    );
  }
}
