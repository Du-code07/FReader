import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'package:archive/archive.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'screens/pdf_and_image_viewer.dart';
import 'screens/reader_screen.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  PaintingBinding.instance.imageCache.maximumSize = 3000;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 300 << 20;
  final initialDark = await StorageService.getDarkMode();
  final initialLang = await StorageService.getAppLanguage();
  runApp(MyEbookApp(initialDark: initialDark, initialLang: initialLang));
}

class MyEbookApp extends StatefulWidget {
  final bool initialDark;
  final String initialLang;
  const MyEbookApp({
    super.key,
    required this.initialDark,
    required this.initialLang,
  });

  @override
  State<MyEbookApp> createState() => _MyEbookAppState();
}

class _MyEbookAppState extends State<MyEbookApp> with SingleTickerProviderStateMixin {
  late bool _isDarkMode;
  late String _appLang;
  late final AnimationController _rotationAnimController;
  late final Animation<double> _rotationFadeAnim;
  late final Animation<double> _rotationScaleAnim;
  @override
  void initState() {
    super.initState();
    _isDarkMode = widget.initialDark;
    _appLang = widget.initialLang;
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
  }

  void _onDesiredOrientationChanged() {
    if (mounted) {
      _rotationAnimController.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    StorageService.desiredLandscapeNotifier.removeListener(_onDesiredOrientationChanged);
    _rotationAnimController.dispose();
    super.dispose();
  }

  void _toggleDarkMode() async {
    final nextVal = !_isDarkMode;
    setState(() => _isDarkMode = nextVal);
    await StorageService.setDarkMode(nextVal);
  }

  void _changeAppLanguage(String newLang) async {
    setState(() => _appLang = newLang);
    await StorageService.setAppLanguage(newLang);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'FReader',
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        colorSchemeSeed: Colors.indigo,
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorSchemeSeed: Colors.indigo,
      ),
      builder: (context, child) {
        return FadeTransition(
          opacity: _rotationFadeAnim,
          child: ScaleTransition(
            scale: _rotationScaleAnim,
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
      home: BookshelfScreen(
        isDarkMode: _isDarkMode,
        appLang: _appLang,
        onToggleDarkMode: _toggleDarkMode,
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
                      const Icon(Icons.dark_mode, color: Colors.white, size: 20),
                      const SizedBox(width: 14),
                      const Icon(Icons.picture_as_pdf_outlined, color: Colors.white, size: 20),
                      const SizedBox(width: 14),
                      const Icon(Icons.auto_stories_outlined, color: Colors.white, size: 20),
                      const SizedBox(width: 14),
                      const Icon(Icons.delete_outline, color: Colors.white, size: 20),
                      const SizedBox(width: 14),
                      const Icon(Icons.settings_outlined, color: Colors.white, size: 20),
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
                        child: const Icon(Icons.add, size: 16, color: Colors.amber),
                      ),
                      const Spacer(),
                      const Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                      const SizedBox(width: 10),
                      const Icon(Icons.edit_outlined, color: Colors.white70, size: 19),
                      const SizedBox(width: 10),
                      const Icon(Icons.drive_file_move_outline, color: Colors.white70, size: 19),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.dark_mode, color: Colors.white, size: 22),
              title: _tr('다크 모드 / 라이트 모드 전환', 'Toggle Dark / Light Mode', '切换深色 / 浅色模式', 'ダーク / ライトモード切替'),
              desc: _tr('앱 전체 화면 테마를 라이트 모드와 다크 모드로 전환합니다.', 'Switches the app theme between Light and Dark mode.', '在浅色模式和深色模式之间切换。', 'アプリ全体のテーマをライト/ダークに切り替えます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.picture_as_pdf_outlined, color: Colors.white, size: 22),
              title: _tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合'),
              desc: _tr('2개 이상의 PDF 파일을 고른 순서대로 또는 파일 이름 순서대로 합쳐 하나의 PDF로 만듭니다.', 'Merges 2 or more PDF files in selected order or filename order into a single PDF.', '按所选顺序或文件名顺序将多个 PDF 合并为一个 PDF。', '2つ以上のPDFを選択順または名前順に結合して1つのPDFにします。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.auto_stories_outlined, color: Colors.white, size: 22),
              title: _tr('JPG 이미지 합치기', 'Merge JPG Images', '合并 JPG 图片', 'JPG画像結合'),
              desc: _tr('여러 장의 JPG/PNG 이미지를 고른 순서 또는 이름 순서대로 묶어 단권 파일(.cbz)로 만듭니다.', 'Bundles multiple JPG/PNG images in selected or filename order into a single .cbz book.', '将多张图片按选择顺序或名称顺序打包为单本文件(.cbz)。', '複数のJPG/PNG画像を選択順または名前順にまとめて1冊(.cbz)にします。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.delete_outline, color: Colors.white, size: 22),
              title: _tr('휴지통', 'Trash Bin', '回收站', 'ゴミ箱'),
              desc: _tr('삭제된 파일을 확인하고 복원하거나 영구 삭제합니다.', 'Restore or permanently delete trashed files.', '查看、恢复或永久删除已删除的文件。', '削除したファイルの復元または完全削除を行います。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.settings_outlined, color: Colors.white, size: 22),
              title: _tr('앱 설정', 'App Settings', '应用设置', 'アプリ設定'),
              desc: _tr('앱 언어(한국어/영어/중국어/일본어) 변경, 파일 이름 뒤 형식(확장자) 숨기기, 사용 설명서를 확인합니다.', 'Change app language (KO/EN/ZH/JA), hide file extensions, and open the User Manual.', '更改应用语言、隐藏文件扩展名及查看使用说明书。', '言語(韓/英/中/日)変更、拡張子非表示、取扱説明書を確認します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.add, color: Colors.amber, size: 24),
              title: _tr('새 그룹 추가 (+ 버튼)', 'Add New Group (+)', '新建分组 (+)', '新規グループ追加 (+)'),
              desc: _tr('그룹 네모칸 맨 오른쪽의 [+] 아이콘을 눌러 새 그룹을 추가합니다. (기존 그룹 길게 누르기: 삭제)', 'Tap [+] at the right end of the group bar to add a group (long-press a group to delete).', '点击分组栏最右侧的 [+] 新建分组（长按分组可删除）。', 'グループバー右端の[+]で新規グループを追加します(長押しで削除)。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.star_rounded, color: Colors.amber, size: 24),
              title: _tr('즐겨찾기 (별 아이콘)', 'Favorite (Star Icon)', '收藏 (星标)', 'お気に入り (星アイコン)'),
              desc: _tr('누르면 노란색 별(★)로 바뀌며 해당 그룹의 가장 상단에 위치합니다.', 'Turns yellow (★) and pins the file to the very top of its group.', '点击变为黄色星标(★)，并将文件置顶于当前分组最上方。', '黄色い星(★)になり、そのグループの最上部に固定されます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.edit_outlined, color: Colors.white, size: 22),
              title: _tr('이름 변경 (연필 아이콘)', 'Rename File (Pencil Icon)', '重命名文件 (铅笔图标)', 'ファイル名変更 (鉛筆アイコン)'),
              desc: _tr('확장자를 유지한 채 파일 이름을 변경합니다.', 'Renames the file while preserving its format extension.', '保持扩展名不变并修改文件名称。', '拡張子を維持したままファイル名を変更します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.drive_file_move_outline, color: Colors.white, size: 22),
              title: _tr('그룹 이동 (개별 및 다중 선택)', 'Move to Group (Single & Batch)', '移动分组 (单个与批量)', 'グループ移動 (個別・一括)'),
              desc: _tr('파일을 다른 그룹으로 옮깁니다. 파일을 길게 눌러 다중 선택하면 하단 [그룹 이동] 버튼으로 한 번에 이동할 수 있습니다.', 'Moves the file to another group. Long-press files to batch move multiple files at once.', '将文件移至其他分组；长按多选后可通过底部按钮批量移动。', '別のグループへ移動します。長押しで複数選択すると一括移動できます。'),
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
                    const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    const Icon(Icons.list, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    Text(
                      _tr('문서 제목', 'Document', '文档标题', '文書タイトル'),
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 18),
                    const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 22),
                    const SizedBox(width: 12),
                    const Icon(Icons.skip_next_rounded, color: Colors.white, size: 22),
                    const SizedBox(width: 12),
                    const Icon(Icons.lock_outline, color: Colors.white, size: 19),
                    const SizedBox(width: 12),
                    const Icon(Icons.screen_rotation, color: Colors.white, size: 19),
                    const SizedBox(width: 12),
                    const Icon(Icons.draw_outlined, color: Colors.amber, size: 20),
                    const SizedBox(width: 12),
                    const Icon(Icons.menu_book, color: Colors.amber, size: 20),
                    const SizedBox(width: 12),
                    _buildDualDirectionSampleIcon(),
                    const SizedBox(width: 12),
                    const Icon(Icons.bookmarks_outlined, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    const Icon(Icons.tune, color: Colors.white, size: 20),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
              title: _tr('뒤로가기', 'Back to Bookshelf', '返回书架', '書斎へ戻る'),
              desc: _tr('서재 화면으로 돌아갑니다. (화면 잠금 상태였다면 자동으로 잠금이 해제되며, 백그라운드 번역은 계속 유지됩니다.)', 'Returns to the bookshelf (automatically unlocks screen if locked; background translation continues).', '返回书架（若处于锁定状态则自动解锁，后台翻译继续进行）。', '書斎に戻ります(画面ロック中は自動解除され、バックグラウンド翻訳は継続します)。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.list, color: Colors.white, size: 22),
              title: _tr('목차 열기 (문서/EPUB)', 'Table of Contents', '打开目录', '目次を開く'),
              desc: _tr('EPUB·워드·한글·텍스트 문서의 장(Chapter) 목록 서랍을 엽니다.', 'Opens the chapter drawer for EPUB/Word/HWP/TXT documents.', '打开文档章节目录侧边栏。', 'EPUB・Word・HWP・TXT文書の目次を開きます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.skip_previous_rounded, color: Colors.white, size: 19),
                  Icon(Icons.skip_next_rounded, color: Colors.white, size: 19),
                ],
              ),
              title: _tr('이전 파일 / 다음 파일 이동 (같은 그룹)', 'Previous / Next File in Same Group', '同分组上一文件 / 下一文件', '同じグループ内の前 / 次のファイルへ移動'),
              desc: _tr('서재로 나가지 않고 현재 파일과 같은 그룹에 있는 이전 파일 또는 다음 파일로 즉시 이동합니다.', 'Jumps directly to the previous or next file within the same group without leaving the viewer.', '无需返回书架，直接切换到同一分组中的上一个或下一个文件。', '書斎に戻らずに同じグループ内の前/次のファイルを直接開きます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.draw_outlined, color: Colors.amber, size: 22),
              title: _tr('S펜 필기 모드 열기/닫기', 'S Pen Handwriting Mode', 'S Pen 手写模式', 'Sペン手書きモード'),
              desc: _tr('S펜 전용 필기 툴바를 엽니다. 필기 모드가 켜진 동안에는 S펜으로 화면을 움직여도 페이지가 흔들리거나 넘어가지 않으며, 손가락 스와이프로만 페이지가 이동합니다.', 'Opens the S Pen toolbar. While active, S Pen strokes never move or turn the page; finger swipes turn pages.', '打开 S Pen 工具栏。开启时 S Pen 书写不会移动页面，仅手指滑动可翻页。', 'Sペンツールバーを開きます。手書き中はSペンで画面が動かず、指のスワイプでのみページがめくれます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.menu_book, color: Colors.amber, size: 22),
              title: _tr('가로 모드 2페이지 양면 보기', 'Two-Page Spread in Landscape', '横屏双页显示', '横画面2ページ見開き表示'),
              desc: _tr('태블릿 가로 화면에서 한 화면에 2페이지씩 나란히 보여줄지 1페이지만 보여줄지 전환합니다.', 'Toggles between 2-page side-by-side spread and single-page view in landscape orientation.', '在横屏模式下切换双页并排显示或单页显示。', '横画面で2ページ見開き表示と1ページ表示を切り替えます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.screen_rotation, color: Colors.white, size: 22),
              title: _tr('화면 회전', 'Rotate Screen', '旋转屏幕', '画面回転'),
              desc: _tr('뷰어 화면을 가로 또는 세로 방향으로 부드럽게 회전합니다.', 'Smoothly rotates the viewer between landscape and portrait orientations.', '平滑切换横屏或竖屏阅读方向。', 'ビューア画面を縦向き・横向きに滑らかに回転します。'),
            ),
            _buildIconGuideRow(
              iconWidget: _buildDualDirectionSampleIcon(),
              title: _tr('읽기 방향 전환 (좌 → 우 / 우 → 좌)', 'Reading Direction (L → R / R → L)', '阅读方向切换 (左 → 右 / 右 → 左)', '読書方向切替 (左 → 右 / 右 → 左)'),
              desc: _tr('일반 도서 방향(좌 → 우, 기본값)과 만화 방향(우 → 좌)을 전환하며, 각 파일마다 설정한 읽기 방향을 개별적으로 기억합니다.', 'Switches between L → R (default) and R → L reading direction and remembers it for each file individually.', '切换左 → 右（默认）与右 → 左方向，并为每个文件单独记忆。', '左 → 右(基本)と右 → 左を切り替え、ファイルごとに記憶します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.bookmarks_outlined, color: Colors.white, size: 22),
              title: _tr('북마크 추가 및 목록', 'Bookmarks', '书签管理', 'ブックマーク'),
              desc: _tr('현재 페이지를 북마크에 저장하거나 저장된 북마크 위치로 즉시 이동합니다.', 'Saves the current page as a bookmark or jumps to saved bookmarks.', '添加当前页书签或跳转到已保存的书签位置。', '現在のページをブックマーク登録、または登録済み位置へ移動します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.tune, color: Colors.white, size: 22),
              title: _tr('뷰어 표시 설정', 'Viewer Display Settings', '阅读器显示设置', '뷰어表示設定'),
              desc: _tr('글자 크기·배경색(완전 흰색/종이색/다크), 화면 잠금 방식(흔들기 / 음량 버튼 동시 입력), 페이지 전환 버튼(음량 / 페이지 이동 / S펜), 진행도 UI 위치를 설정합니다.', 'Configure font size, background (pure white/sepia/dark), screen lock (shake / dual volume), page turn buttons, and progress bar position.', '设置字号、背景色、屏幕锁定方式（摇晃/双音量键）、翻页按钮及进度条位置。', '文字サイズ・背景色(純白/セピア/ダーク)、画面ロック方式(振る/音量同時押し)、ページ 전환、進行度バー位置を設定します。'),
            ),

            const Divider(height: 36),

            // 3. S펜 툴바 & 하단 진행도 UI & 페이지 이동 버튼 안내
            Text(
              _tr('3. S펜 필기 툴바 및 하단 이동 아이콘 안내', '3. S Pen Toolbar & Bottom Navigation Icons', '3. S Pen 工具栏与底部导航图标', '3. Sペンツールバーと下部移動アイコン'),
              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.touch_app, color: Colors.amber, size: 22),
              title: _tr('손으로 글씨 쓰기 (한 손가락 모양 아이콘)', 'Finger Writing (One-Finger Icon)', '手指书写（单指图标）', '指で手書き（指差しアイコン）'),
              desc: _tr('S펜 필기 바에서 색상 원 왼쪽의 한 손가락 아이콘을 누르면 아이콘에 색상(노란색)이 켜지며 손가락으로 글씨를 쓸 수 있습니다. 손으로 글씨를 쓰는 동안에는 손터치 페이지 넘김이 자동으로 잠깁니다.', 'Tap the one-finger icon to the left of the colors to light it up in color and write with your finger. Touch page turning is automatically locked while finger writing is active.', '点击颜色左侧的单指图标使其亮起颜色即可用手指书写，书写期间自动锁定触屏翻页。', '色の左にある指アイコンを押すと色が点灯し指で手書きできます。手書き中は指でのページめくりが自動ロックされます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Icon(Icons.cleaning_services_outlined, color: Colors.amber, size: 22),
              title: _tr('지우개 / 색상(6색) / 필기 전체 지우기', 'Eraser, 6 Colors & Clear All Strokes', '橡皮擦、6种颜色与清空手写', '消しゴム・6色パレット・手書き全消去'),
              desc: _tr('노란·빨간·하늘·초록·흰색·검은색 펜 선택과 선 굵기 슬라이더(기본 2.0pt), 부드러운 부분 지우개(🧹), 텍스트 메모(📝), 필기 전체 지우기(🗑, 2페이지 보기 시 양쪽 페이지 모두 삭제)를 제공합니다.', 'Pick from 6 colors, adjust stroke width, smooth partial Eraser, text notes, or Clear All Strokes (clears both pages in 2-page mode).', '支持6种颜色、粗细滑块、平滑局部橡皮擦、文字备注及清空手写（双页模式下同时清空两页）。', '6色、太さスライダー、滑らかな消しゴム、テキストメモ、手書き全消去(2ページ表示時は両ページ消去)が使えます。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.first_page, color: Colors.white, size: 19),
                  Icon(Icons.last_page, color: Colors.white, size: 19),
                ],
              ),
              title: _tr('진행도 바 맨 처음 / 맨 마지막 페이지 이동 화살표', 'Jump to First / Last Page Arrows', '跳转至第一页 / 最后一页箭头', '最初 / 最後のページへ移動する矢印'),
              desc: _tr('진행도 슬라이더 양끝의 화살표를 누르면 문서의 맨 처음(1페이지)과 맨 마지막(끝 페이지)으로 즉시 이동합니다.', 'Tap the arrows at both ends of the progress bar to jump straight to the first or last page.', '点击进度条两端的箭头可直接跳至第一页或最后一页。', '進行度バー両端の矢印で最初(1ページ)と最後のページへ即座に移動します。'),
            ),
            _buildIconGuideRow(
              iconWidget: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_back, color: Colors.amber, size: 18),
                  SizedBox(width: 2),
                  Icon(Icons.arrow_forward, color: Colors.amber, size: 18),
                ],
              ),
              title: _tr('우측 하단 페이지 이동 버튼 (← / →)', 'Bottom-Right Page Nav Buttons (← / →)', '右下角翻页按钮 (← / →)', '右下ページ移動ボタン (← / →)'),
              desc: _tr('뷰어 표시 설정에서 [페이지 이동 버튼]을 켜면 우측 하단에 나타나며, 상단 UI를 띄우지 않고 깔끔하게 이전(←)·다음(→) 페이지로 전환합니다.', 'When enabled in Viewer Settings, appears at the bottom-right to turn to the previous (←) or next (→) page without popping up the top bar.', '在阅读器设置中开启后显示在右下角，点击左(←)/右(→)箭头可直接翻页且不会弹出顶部菜单。', '뷰어設定でONにすると右下に表示され、上部UIを出さずに前(←)・次(→)のページへ移動します。'),
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
  final VoidCallback onToggleDarkMode;
  final ValueChanged<String> onChangeLanguage;

  const BookshelfScreen({
    super.key,
    required this.isDarkMode,
    required this.appLang,
    required this.onToggleDarkMode,
    required this.onChangeLanguage,
  });

  @override
  State<BookshelfScreen> createState() => _BookshelfScreenState();
}

class _BookshelfScreenState extends State<BookshelfScreen> {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');

  List<File> _allBooks = [];
  List<File> _trashedBooks = [];
  List<String> _groups = ['전체', 'PDF/문서'];
  String _selectedGroup = '전체';
  Map<String, String> _bookGroupMap = {};
  Map<String, double> _bookProgressMap = {};
  Set<String> _favoritePaths = {};
  bool _hideFileExtension = false;
  String _bookshelfViewMode = 'list'; // 기본값: 'list' (목록형)
  static final Map<String, ImageProvider> _globalThumbMemoryCache = {};
  final Map<String, ValueNotifier<ImageProvider?>> _thumbNotifiers = {};
  final Set<String> _thumbnailGeneratingPaths = {};

  bool _isSelectionMode = false;
  final Set<String> _selectedFilePaths = {};
  final ScrollController _bookshelfScrollController = ScrollController();
  bool _isDraggingScrollbar = false;
  double _scrollDragStartDy = 0.0;
  double _scrollDragStartOffset = 0.0;
  final Map<String, GlobalKey> _fileRowKeys = {};
  bool _isDragSelecting = false;
  bool _dragTargetSelectState = true;
  String? _lastDragTouchedPath;
  String? _pointerDownRowPath;
  Offset? _pointerDownGlobalPos;
  final Map<int, Offset> _activeBookshelfPointers = {};
  bool _isMultiTouchScrolling = false;
  double _lastTwoFingerAvgDy = 0.0;

  // 10, 11 & 13. 워드(.docx, .doc), 한글(.hwpx, .hwp), 메모장(.txt) 뷰어 열람 지원 (YML 제외)
  static const _supportedExts = [
    'epub', 'txt', 'pdf', 'jpg', 'jpeg', 'png', 'webp', 'cbz',
    'docx', 'doc', 'hwpx', 'hwp'
  ];
  static const _imageExts = ['jpg', 'jpeg', 'png', 'webp'];

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
    if (_bookshelfScrollController.hasClients) {
      final screenH = MediaQuery.of(context).size.height;
      final pos = _bookshelfScrollController.position;
      if (globalPos.dy < 160 && pos.pixels > pos.minScrollExtent) {
        _bookshelfScrollController.jumpTo(
          (pos.pixels - 12.0).clamp(pos.minScrollExtent, pos.maxScrollExtent),
        );
      } else if (globalPos.dy > screenH - 120 && pos.pixels < pos.maxScrollExtent) {
        _bookshelfScrollController.jumpTo(
          (pos.pixels + 12.0).clamp(pos.minScrollExtent, pos.maxScrollExtent),
        );
      }
    }
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
      final ImageProvider provider;
      if (isRawOriginalImage) {
        provider = ResizeImage(FileImage(f), width: 360, allowUpscaling: false);
      } else {
        final bytes = f.readAsBytesSync();
        if (bytes.length < 64) return;
        provider = MemoryImage(bytes);
      }
      _globalThumbMemoryCache[bookPath] = provider;
      _getThumbNotifier(bookPath).value = provider;
      if (mounted) {
        precacheImage(provider, context).catchError((_) {});
      }
    } catch (_) {}
  }

  @override
  void dispose() {
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

    final entities = dir.listSync();
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

    final trashEntities = trashDir.listSync();
    final trashed = <File>[];
    for (final e in trashEntities) {
      if (e is File) {
        trashed.add(e);
      }
    }

    final favs = await StorageService.getFavoriteBooks();
    final hideExt = await StorageService.getHideFileExtension();
    final viewMode = await StorageService.getBookshelfViewMode();

    files.sort((a, b) {
      final aFav = favs.contains(a.path);
      final bFav = favs.contains(b.path);
      if (aFav != bFav) return aFav ? -1 : 1;
      return _naturalCompare(
        a.path.split(Platform.pathSeparator).last,
        b.path.split(Platform.pathSeparator).last,
      );
    });

    trashed.sort((a, b) => _naturalCompare(
          a.path.split(Platform.pathSeparator).last,
          b.path.split(Platform.pathSeparator).last,
        ));

    final groups = await StorageService.getGroups();
    final grpMap = <String, String>{};
    final progMap = <String, double>{};

    for (final f in files) {
      grpMap[f.path] = await StorageService.getBookGroup(f.path);
      progMap[f.path] = await StorageService.getProgress(f.path);
    }

    // 디스크에 이미 생성되어 있는 썸네일 바이트(MemoryImage)를 setState 전에 동기식으로 즉시 메모리에 고정하여 스크롤 시 재로딩 원천 차단
    final thumbDir = Directory('${dir.path}/.thumbnails');
    if (!thumbDir.existsSync()) {
      thumbDir.createSync(recursive: true);
    }
    final Map<String, String> existingThumbBySafeKey = {};
    for (final entity in thumbDir.listSync()) {
      if (entity is File) {
        final name = entity.path.split(Platform.pathSeparator).last;
        if (name.startsWith('thumb_v36_') && name.endsWith('.jpg')) {
          final k = name.substring('thumb_v36_'.length, name.length - 4);
          existingThumbBySafeKey[k] = entity.path;
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
      final safeKey = path.hashCode.toUnsigned(32).toString();
      final existingThumbPath = existingThumbBySafeKey[safeKey];
      if (existingThumbPath != null) {
        _cacheThumbnailFromFileSync(path, existingThumbPath);
      }
    }

    if (mounted) {
      setState(() {
        _allBooks = files;
        _trashedBooks = trashed;
        _groups = groups;
        _favoritePaths = favs;
        _hideFileExtension = hideExt;
        _bookshelfViewMode = viewMode;
        if (!_groups.contains(_selectedGroup)) {
          _selectedGroup = '전체';
        }
        _bookGroupMap = grpMap;
        _bookProgressMap = progMap;
        _selectedFilePaths.removeWhere((p) => !_allBooks.any((f) => f.path == p));
        if (_selectedFilePaths.isEmpty) {
          _isSelectionMode = false;
        }
      });
      for (final f in files) {
        if (!_globalThumbMemoryCache.containsKey(f.path)) {
          _ensureBookThumbnail(f, thumbDir.path);
        }
      }
    }
  }

  /// 13. 각 파일의 가장 첫 페이지를 초고속 네이티브 스레드 풀에서 썸네일 이미지로 생성 및 MemoryImage로 영구 고정
  Future<void> _ensureBookThumbnail(File file, [String? cachedThumbDirPath]) async {
    final path = file.path;
    if (_globalThumbMemoryCache.containsKey(path)) return;
    if (_thumbnailGeneratingPaths.contains(path)) return;
    _thumbnailGeneratingPaths.add(path);

    try {
      final ext = path.split('.').last.toLowerCase();
      if (_imageExts.contains(ext)) {
        _cacheThumbnailFromFileSync(path, path, isRawOriginalImage: true);
        return;
      }

      final String thumbDirPath = cachedThumbDirPath ??
          '${(await getApplicationDocumentsDirectory()).path}/.thumbnails';
      final safeKey = path.hashCode.toUnsigned(32).toString();
      final thumbPath = '$thumbDirPath/thumb_v36_$safeKey.jpg';
      final thumbFile = File(thumbPath);

      if (thumbFile.existsSync() && thumbFile.lengthSync() > 64) {
        _cacheThumbnailFromFileSync(path, thumbPath);
        return;
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
      } else if (ext == 'cbz' || ext == 'epub') {
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
      }
    } catch (_) {
    } finally {
      _thumbnailGeneratingPaths.remove(path);
    }
  }

  Future<void> _pickAndImportFiles() async {
    final result = await FilePicker.platform.pickFiles(
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
                '지원되는 파일 형식(EPUB, PDF, JPG, PNG, TXT, CBZ, 워드, 한글)을 선택해 주세요.',
                'Please select supported files (EPUB, PDF, JPG, PNG, TXT, CBZ, Word, HWP).',
                '请选择受支持的文件格式 (EPUB, PDF, JPG, PNG, TXT, CBZ, Word, HWP)。',
                '対応ファイル形式(EPUB, PDF, JPG, PNG, TXT, CBZ, Word, HWP)を選択してください。',
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
              icon: const Icon(Icons.picture_as_pdf, size: 18),
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
              icon: const Icon(Icons.auto_stories, size: 18),
              onPressed: () => Navigator.pop(ctx, 'merge'),
              label: Text(_tr('JPG 이미지 합치기', 'Merge JPGs', '合并图片', 'JPG結合')),
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
          title: Text(_tr('cbz 파일 만들기', 'Create cbz File', '创建 cbz 文件', 'cbzファイル作成')),
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
              child: Text(_tr('만들기', 'Create', '创建', '作成')),
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
            title: Text(_tr('cbz 파일 생성 중', 'Creating cbz File', '正在生成 cbz 文件', 'cbzファイル作成中')),
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
      final result = await FilePicker.platform.pickFiles(
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

    final List<String> selectedPaths = [];

    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(_tr('JPG 이미지 합치기', 'Merge JPG Images', '合并 JPG 图片', 'JPG画像結合')),
              ),
              TextButton(
                onPressed: () {
                  setModalState(() {
                    if (selectedPaths.length == existingImages.length) {
                      selectedPaths.clear();
                    } else {
                      selectedPaths
                        ..clear()
                        ..addAll(existingImages.map((e) => e.path));
                    }
                  });
                },
                child: Text(_tr('전체선택', 'Select All', '全选', 'すべて選択')),
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
                    Text('${_tr("선택됨", "Selected", "已选", "選択中")}: ${selectedPaths.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    TextButton.icon(
                      icon: const Icon(Icons.folder_open, size: 16),
                      label: Text(_tr('기기에서 선택', 'Browse Device', '从设备选择', '端末から選択')),
                      onPressed: () async {
                        Navigator.pop(ctx, false);
                        final result = await FilePicker.platform.pickFiles(
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
                      },
                    ),
                  ],
                ),
                const Divider(height: 1),
                Expanded(
                  child: ListView.builder(
                    itemCount: existingImages.length,
                    itemBuilder: (_, idx) {
                      final f = existingImages[idx];
                      final name = _formatDisplayFileName(f.path.split(Platform.pathSeparator).last);
                      final selIndex = selectedPaths.indexOf(f.path);
                      final checked = selIndex != -1;
                      return CheckboxListTile(
                        dense: true,
                        value: checked,
                        secondary: checked
                            ? CircleAvatar(
                                radius: 11,
                                backgroundColor: Colors.indigo,
                                child: Text(
                                  '${selIndex + 1}',
                                  style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              )
                            : null,
                        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
                        onChanged: (v) {
                          setModalState(() {
                            if (v == true) {
                              if (!selectedPaths.contains(f.path)) {
                                selectedPaths.add(f.path);
                              }
                            } else {
                              selectedPaths.remove(f.path);
                            }
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
            ElevatedButton(
              onPressed: selectedPaths.length >= 2 ? () => Navigator.pop(ctx, true) : null,
              child: Text(_tr('선택한 이미지 합치기', 'Merge Selected', '合并所选图片', '選択した画像を結合')),
            ),
          ],
        ),
      ),
    );

    if (proceed == true && selectedPaths.length >= 2) {
      final fileByPath = {for (final f in existingImages) f.path: f};
      final chosen = selectedPaths.map((p) => fileByPath[p]!).toList();
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
            ElevatedButton.icon(
              icon: const Icon(Icons.picture_as_pdf, size: 18),
              onPressed: () => Navigator.pop(ctx, true),
              label: Text(_tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合')),
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
    final String firstFileName = orderedPdfs.first.path.split(Platform.pathSeparator).last;
    String progressStatus = firstFileName;
    StateSetter? progressSetState;

    _pdfChannel.setMethodCallHandler((call) async {
      if (call.method == 'onPdfMergeProgress') {
        final args = call.arguments as Map?;
        if (args != null) {
          final int cur = (args['current'] as num?)?.toInt() ?? 1;
          final int tot = (args['total'] as num?)?.toInt() ?? orderedPdfs.length;
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
            title: Text(_tr('PDF 병합 중', 'Merging PDFs', '正在合并 PDF', 'PDF結合中')),
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
      final result = await FilePicker.platform.pickFiles(
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

    final List<String> selectedPaths = [];

    final proceed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => AlertDialog(
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(_tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合')),
              ),
              TextButton(
                onPressed: () {
                  setModalState(() {
                    if (selectedPaths.length == existingPdfs.length) {
                      selectedPaths.clear();
                    } else {
                      selectedPaths
                        ..clear()
                        ..addAll(existingPdfs.map((e) => e.path));
                    }
                  });
                },
                child: Text(_tr('전체선택', 'Select All', '全选', 'すべて選択')),
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
                    Text('${_tr("선택됨", "Selected", "已选", "選択中")}: ${selectedPaths.length}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    TextButton.icon(
                      icon: const Icon(Icons.folder_open, size: 16),
                      label: Text(_tr('기기에서 선택', 'Browse Device', '从设备选择', '端末から選択')),
                      onPressed: () async {
                        Navigator.pop(ctx, false);
                        final result = await FilePicker.platform.pickFiles(
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
                      },
                    ),
                  ],
                ),
                const Divider(height: 1),
                Expanded(
                  child: ListView.builder(
                    itemCount: existingPdfs.length,
                    itemBuilder: (_, idx) {
                      final f = existingPdfs[idx];
                      final name = _formatDisplayFileName(f.path.split(Platform.pathSeparator).last);
                      final selIndex = selectedPaths.indexOf(f.path);
                      final checked = selIndex != -1;
                      return CheckboxListTile(
                        dense: true,
                        value: checked,
                        secondary: checked
                            ? CircleAvatar(
                                radius: 11,
                                backgroundColor: Colors.indigo,
                                child: Text(
                                  '${selIndex + 1}',
                                  style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                              )
                            : null,
                        title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
                        onChanged: (v) {
                          setModalState(() {
                            if (v == true) {
                              if (!selectedPaths.contains(f.path)) {
                                selectedPaths.add(f.path);
                              }
                            } else {
                              selectedPaths.remove(f.path);
                            }
                          });
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
            ElevatedButton(
              onPressed: selectedPaths.length >= 2 ? () => Navigator.pop(ctx, true) : null,
              child: Text(_tr('선택한 PDF 합치기', 'Merge Selected PDFs', '合并所选 PDF', '選択したPDFを結合')),
            ),
          ],
        ),
      ),
    );

    if (proceed == true && selectedPaths.length >= 2) {
      final fileByPath = {for (final f in existingPdfs) f.path: f};
      final chosen = selectedPaths.map((p) => fileByPath[p]!).toList();
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
    final rawName = file.path.split(Platform.pathSeparator).last;
    final displayName = _formatDisplayFileName(rawName);
    final ext = rawName.split('.').last.toLowerCase();

    if (ext == 'txt' || ext == 'epub' || ext == 'hwp' || ext == 'hwpx' || ext == 'docx' || ext == 'doc') {
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
            '"$groupName" 그룹을 삭제할까요?\n(그룹 안의 파일들은 삭제되지 않고 [미분류]로 유지됩니다)',
            'Delete group "$groupName"?\n(Files inside will remain as [Uncategorized])',
            '确定删除 "$groupName" 分组吗？\n（组内文件不会删除，将归为[未分类]）',
            '「$groupName」を削除しますか？\n(中のファイルは削除されず[未分類]になります)',
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
                          icon: const Icon(Icons.delete_forever, color: Colors.redAccent, size: 18),
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
                                    icon: const Icon(Icons.restore_from_trash, size: 18),
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

  /// 1, 2, 6, 11, 15. 우측 상단 톱니바퀴 '앱 설정' 다이얼로그:
  /// - 문구: '프로그램 설정' -> '앱 설정'으로 변경 (#11)
  /// - 화면 잠금 방식 설정 제거 (뷰어 표시 설정에서만 제공) (#2)
  /// - '각 아이콘 위치 및 기능 설명 가이드 열람' -> '사용 설명서'로 변경 (#6)
  /// - 선택된 언어에 따라 다이얼로그 및 앱 전체 문구 실시간 번역 (#1)
  Future<void> _showGlobalSettingsDialog() async {
    String currentLang = widget.appLang;
    bool hideExt = _hideFileExtension;
    String viewMode = _bookshelfViewMode;

    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          String tDialog(String ko, String en, String zh, String ja) =>
              AppI18n.t(currentLang, ko: ko, en: en, zh: zh, ja: ja);

          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.settings, size: 22),
                const SizedBox(width: 8),
                Text(tDialog('앱 설정', 'App Settings', '应用设置', 'アプリ設定')),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tDialog(
                      '1. 언어 설정',
                      '1. Language',
                      '1. 语言设置',
                      '1. 言語設定',
                    ),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      {'code': 'ko', 'label': '한국어'},
                      {'code': 'en', 'label': 'English'},
                      {'code': 'zh', 'label': '中文'},
                      {'code': 'ja', 'label': '日本語'},
                    ].map((item) {
                      final code = item['code']!;
                      return ChoiceChip(
                        label: Text(item['label']!),
                        selected: currentLang == code,
                        onSelected: (_) {
                          setModalState(() => currentLang = code);
                          widget.onChangeLanguage(code);
                        },
                      );
                    }).toList(),
                  ),
                  const Divider(height: 24),
                  Text(
                    tDialog('2. 파일 보여주는 형식', '2. Bookshelf View Mode', '2. 文件显示样式', '2. ファイル表示形式'),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      ChoiceChip(
                        avatar: Icon(
                          Icons.grid_view_rounded,
                          size: 16,
                          color: viewMode == 'grid' ? Colors.amber : null,
                        ),
                        label: Text(tDialog('표지형 (썸네일)', 'Cover View (Thumbnail)', '封面视图 (缩略图)', '表紙表示 (サムネイル)')),
                        selected: viewMode == 'grid',
                        onSelected: (_) async {
                          await StorageService.setBookshelfViewMode('grid');
                          setModalState(() => viewMode = 'grid');
                          setState(() => _bookshelfViewMode = 'grid');
                        },
                      ),
                      ChoiceChip(
                        avatar: Icon(
                          Icons.view_list_rounded,
                          size: 16,
                          color: viewMode == 'list' ? Colors.amber : null,
                        ),
                        label: Text(tDialog('목록형 (리스트)', 'List View', '列表视图', 'リスト表示')),
                        selected: viewMode == 'list',
                        onSelected: (_) async {
                          await StorageService.setBookshelfViewMode('list');
                          setModalState(() => viewMode = 'list');
                          setState(() => _bookshelfViewMode = 'list');
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(
                      tDialog(
                        '파일 이름 뒤에 형식(.pdf, .epub 등) 숨기기',
                        'Hide file extension (.pdf, .epub)',
                        '隐藏文件扩展名 (.pdf, .epub)',
                        'ファイル名の後ろの形式(.pdf等)を隠す',
                      ),
                      style: const TextStyle(fontSize: 13),
                    ),
                    value: hideExt,
                    onChanged: (val) async {
                      await StorageService.setHideFileExtension(val);
                      setModalState(() => hideExt = val);
                      setState(() => _hideFileExtension = val);
                    },
                  ),
                  const Divider(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.menu_book_outlined, size: 18),
                      label: Text(tDialog('사용 설명서', 'User Manual', '使用说明书', '取扱説明書')),
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => UserManualScreen(appLang: currentLang),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(tDialog('닫기', 'Close', '关闭', '閉じる')),
              ),
            ],
          );
        },
      ),
    );
  }

  /// 1, 3, 10, 11, 13. 표지형(썸네일) 그리드 카드:
  /// - 고화질 첫 페이지 썸네일 (FilterQuality.high)
  /// - 휴대폰 한 화면에 9개(3×3) 들어가는 크기
  /// - 우측 상단 즐겨찾기 별 아이콘, 하단 점 3개(이름 변경 / 그룹 이동 / 휴지통 이동)
  /// - 진행바 및 진행률(%) 제거 (#11)
  /// - 그룹 이름은 [전체] 탭에서만 표시하고 개별 그룹 탭에서는 숨김 (#10)
  Widget _buildGridBookCard(File file) {
    final rowKey = _fileRowKeys.putIfAbsent(file.path, () => GlobalKey());
    final rawFileName = file.path.split(Platform.pathSeparator).last;
    final displayFileName = _formatDisplayFileName(rawFileName);
    final grp = _bookGroupMap[file.path] ?? '미분류';
    final grpDisplay = _localizeGroupName(grp);
    final bool showGroupLabel = _selectedGroup == '전체';
    final isSelected = _selectedFilePaths.contains(file.path);
    final isFavorite = _favoritePaths.contains(file.path);
    final lowerExt = rawFileName.split('.').last.toLowerCase();
    final thumbNotifier = _getThumbNotifier(file.path);

    final IconData fallbackIcon = lowerExt == 'pdf'
        ? Icons.picture_as_pdf
        : (lowerExt == 'docx' || lowerExt == 'doc' || lowerExt == 'hwpx' || lowerExt == 'hwp')
            ? Icons.description_outlined
            : (lowerExt == 'epub' || lowerExt == 'txt')
                ? Icons.menu_book
                : lowerExt == 'cbz'
                    ? Icons.auto_stories
                    : Icons.image;

    return RepaintBoundary(
      child: Container(
        key: rowKey,
        child: GestureDetector(
          onLongPress: () {
            if (_isMultiTouchScrolling || _activeBookshelfPointers.length >= 2) return;
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
            if (_isMultiTouchScrolling || _activeBookshelfPointers.length >= 2) return;
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
                // 상단: 고화질 파일 첫 페이지 썸네일 영역 + 우측 상단 즐겨찾기 버튼
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Container(
                        color: widget.isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        child: ValueListenableBuilder<ImageProvider?>(
                          valueListenable: thumbNotifier,
                          builder: (context, thumbProvider, _) {
                            if (thumbProvider != null) {
                              return Image(
                                image: thumbProvider,
                                fit: BoxFit.cover,
                                alignment: Alignment.topCenter,
                                gaplessPlayback: true,
                                filterQuality: FilterQuality.low,
                                errorBuilder: (_, __, ___) => Center(
                                  child: Icon(fallbackIcon, size: 34, color: Colors.indigo),
                                ),
                              );
                            }
                            return Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(fallbackIcon, size: 32, color: Colors.indigo),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.indigo.withOpacity(0.12),
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
                      // 우측 상단 즐겨찾기 버튼
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Material(
                          color: Colors.black45,
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () async {
                              await StorageService.toggleFavoriteBook(file.path);
                              await _loadLibrary();
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(4.5),
                              child: Icon(
                                isFavorite ? Icons.star_rounded : Icons.star_border_rounded,
                                color: isFavorite ? Colors.amber : Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
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
                              child: PopupMenuButton<String>(
                                padding: EdgeInsets.zero,
                                iconSize: 17,
                                constraints: const BoxConstraints(minWidth: 125),
                                icon: const Icon(Icons.more_vert, size: 17),
                                tooltip: _tr('메뉴', 'More', '更多', 'メニュー'),
                                onSelected: (action) {
                                  if (action == 'rename') {
                                    _renameFileDialog(file);
                                  } else if (action == 'move_group') {
                                    _assignGroupDialog(file);
                                  } else if (action == 'trash') {
                                    _moveFileToTrash(file);
                                  }
                                },
                                itemBuilder: (ctx) => [
                                  PopupMenuItem<String>(
                                    value: 'rename',
                                    child: Row(
                                      children: [
                                        const Icon(Icons.edit_outlined, size: 18),
                                        const SizedBox(width: 8),
                                        Text(_tr('이름 변경', 'Rename', '重命名', '名前変更')),
                                      ],
                                    ),
                                  ),
                                  PopupMenuItem<String>(
                                    value: 'move_group',
                                    child: Row(
                                      children: [
                                        const Icon(Icons.drive_file_move_outline, size: 18),
                                        const SizedBox(width: 8),
                                        Text(_tr('그룹 이동', 'Move Group', '移动分组', 'グループ移動')),
                                      ],
                                    ),
                                  ),
                                  PopupMenuItem<String>(
                                    value: 'trash',
                                    child: Row(
                                      children: [
                                        const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                        const SizedBox(width: 8),
                                        Text(
                                          _tr('휴지통 이동', 'Move to Trash', '移至回收站', 'ゴミ箱へ移動'),
                                          style: const TextStyle(color: Colors.redAccent),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      if (showGroupLabel) ...[
                        const SizedBox(height: 1),
                        Text(
                          '[$grpDisplay]',
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

  Widget _buildPcStyleScrollbar(int itemCount) {
    // 선택 모드일 때만 표시
    if (!_isSelectionMode) {
      return const SizedBox.shrink();
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final double totalBarHeight = constraints.maxHeight;
        final double trackHeight = (totalBarHeight - 12.0).clamp(48.0, 4000.0);

        return AnimatedBuilder(
          animation: _bookshelfScrollController,
          builder: (context, _) {
            double realMaxExtent = 0.0;
            double viewport = totalBarHeight;
            double currentPixels = 0.0;
            bool hasDimensions = false;

            if (_bookshelfScrollController.hasClients &&
                _bookshelfScrollController.position.hasContentDimensions) {
              hasDimensions = true;
              realMaxExtent = _bookshelfScrollController.position.maxScrollExtent;
              viewport = _bookshelfScrollController.position.viewportDimension;
              currentPixels = _bookshelfScrollController.position.pixels.clamp(
                0.0,
                math.max<double>(0.0, realMaxExtent),
              );
            }

            final int estVisibleCount = _bookshelfViewMode == 'grid'
                ? 9
                : math.max<int>(4, (totalBarHeight / 68.0).floor());
            final bool overflowsByCount = itemCount > estVisibleCount;
            final bool overflowsByExtent = realMaxExtent > 2.0;

            if (!overflowsByCount && !overflowsByExtent) {
              return const SizedBox.shrink();
            }

            if (!hasDimensions && overflowsByCount) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) setState(() {});
              });
            }

            final double estMaxExtent = _bookshelfViewMode == 'grid'
                ? math.max<double>(100.0, (((itemCount + 2) ~/ 3) * (totalBarHeight / 3.0)) - totalBarHeight + 88.0)
                : math.max<double>(100.0, (itemCount * 68.0) - totalBarHeight + 88.0);
            final double maxExtent = realMaxExtent > 2.0 ? realMaxExtent : estMaxExtent;

            final double totalContent = viewport + maxExtent;
            final double thumbHeight = ((viewport / totalContent) * trackHeight)
                .clamp(40.0, math.max<double>(40.0, trackHeight * 0.65));
            final double movableTrack = math.max<double>(1.0, trackHeight - thumbHeight);
            final double scrollRatio = (currentPixels / maxExtent).clamp(0.0, 1.0);
            final double thumbTop = scrollRatio * movableTrack;

            void jumpToClamped(double targetOffset) {
              if (!_bookshelfScrollController.hasClients) return;
              final pos = _bookshelfScrollController.position;
              final limit = pos.hasContentDimensions && pos.maxScrollExtent > 0
                  ? pos.maxScrollExtent
                  : maxExtent;
              _bookshelfScrollController.jumpTo(targetOffset.clamp(0.0, limit));
            }

            final Color thumbColor = _isDraggingScrollbar
                ? (widget.isDarkMode ? Colors.white.withOpacity(0.88) : Colors.black.withOpacity(0.75))
                : (widget.isDarkMode ? Colors.white.withOpacity(0.55) : Colors.black.withOpacity(0.45));

            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapDown: (details) {
                final double localY = (details.localPosition.dy - 6.0).clamp(0.0, trackHeight);
                if (localY < thumbTop || localY > thumbTop + thumbHeight) {
                  final double targetRatio =
                      ((localY - thumbHeight / 2.0) / movableTrack).clamp(0.0, 1.0);
                  jumpToClamped(targetRatio * maxExtent);
                }
              },
              onVerticalDragStart: (details) {
                setState(() => _isDraggingScrollbar = true);
                final double localY = (details.localPosition.dy - 6.0).clamp(0.0, trackHeight);
                if (localY < thumbTop - 8.0 || localY > thumbTop + thumbHeight + 8.0) {
                  final double targetRatio =
                      ((localY - thumbHeight / 2.0) / movableTrack).clamp(0.0, 1.0);
                  jumpToClamped(targetRatio * maxExtent);
                }
                _scrollDragStartDy = details.globalPosition.dy;
                _scrollDragStartOffset = _bookshelfScrollController.hasClients
                    ? _bookshelfScrollController.position.pixels
                    : 0.0;
              },
              onVerticalDragUpdate: (details) {
                final double deltaY = details.globalPosition.dy - _scrollDragStartDy;
                final double scrollDelta = (deltaY / movableTrack) * maxExtent;
                jumpToClamped(_scrollDragStartOffset + scrollDelta);
              },
              onVerticalDragEnd: (_) {
                if (mounted) setState(() => _isDraggingScrollbar = false);
              },
              onVerticalDragCancel: () {
                if (mounted) setState(() => _isDraggingScrollbar = false);
              },
              child: SizedBox(
                width: 16,
                height: totalBarHeight,
                child: Stack(
                  children: [
                    Positioned(
                      top: 6.0 + thumbTop,
                      right: 3.0,
                      width: 5.5,
                      height: thumbHeight,
                      child: Container(
                        decoration: BoxDecoration(
                          color: thumbColor,
                          borderRadius: BorderRadius.circular(3.0),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredBooks = _selectedGroup == '전체'
        ? _allBooks
        : _allBooks.where((f) => (_bookGroupMap[f.path] ?? '미분류') == _selectedGroup).toList();

    return PopScope(
      canPop: !_isSelectionMode,
      onPopInvokedWithResult: (didPop, _) {
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
              title: const Text('MY'),
              actions: [
                IconButton(
                  icon: Icon(widget.isDarkMode ? Icons.light_mode : Icons.dark_mode),
                  tooltip: _tr('다크 모드 전환', 'Toggle Dark Mode', '切换深色模式', 'ダークモード切替'),
                  onPressed: widget.onToggleDarkMode,
                ),
                IconButton(
                  icon: const Icon(Icons.picture_as_pdf_outlined),
                  tooltip: _tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合'),
                  onPressed: _showMergeExistingPdfsDialog,
                ),
                IconButton(
                  icon: const Icon(Icons.auto_stories_outlined),
                  tooltip: _tr('JPG 이미지 합치기', 'Merge JPGs', '合并图片', 'JPG結合'),
                  onPressed: _showMergeExistingImagesDialog,
                ),
                IconButton(
                  icon: Badge(
                    isLabelVisible: _trashedBooks.isNotEmpty,
                    label: Text('${_trashedBooks.length}'),
                    child: const Icon(Icons.delete_outline),
                  ),
                  tooltip: _tr('휴지통', 'Trash', '回收站', 'ゴミ箱'),
                  onPressed: _showTrashBinDialog,
                ),
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  tooltip: _tr('앱 설정', 'App Settings', '应用设置', 'アプリ設定'),
                  onPressed: _showGlobalSettingsDialog,
                ),
              ],
            ),
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              height: 54,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                scrollDirection: Axis.horizontal,
                itemCount: _groups.length + 1,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  if (index == _groups.length) {
                    return ActionChip(
                      label: Icon(
                        Icons.add,
                        size: 18,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      labelPadding: const EdgeInsets.symmetric(horizontal: 2),
                      tooltip: _tr('새 그룹 추가', 'Add Group', '新建分组', 'グループ追加'),
                      onPressed: _createNewGroupDialog,
                    );
                  }
                  final grp = _groups[index];
                  final selected = grp == _selectedGroup;
                  return GestureDetector(
                    onLongPress: () => _confirmDeleteGroup(grp),
                    child: ChoiceChip(
                      label: Text(_localizeGroupName(grp)),
                      selected: selected,
                      onSelected: (_) => setState(() => _selectedGroup = grp),
                    ),
                  );
                },
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: filteredBooks.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 10,
                          alignment: WrapAlignment.center,
                          children: [
                            OutlinedButton.icon(
                              icon: const Icon(Icons.picture_as_pdf),
                              label: Text(_tr('PDF 합치기', 'Merge PDFs', '合并 PDF', 'PDF結合')),
                              onPressed: _showMergeExistingPdfsDialog,
                            ),
                            OutlinedButton.icon(
                              icon: const Icon(Icons.auto_stories),
                              label: Text(_tr('JPG 이미지 합치기', 'Merge JPGs', '合并图片', 'JPG結合')),
                              onPressed: _showMergeExistingImagesDialog,
                            ),
                          ],
                        ),
                      ),
                    )
                  : Row(
                      children: [
                        Expanded(
                          child: Listener(
                              behavior: HitTestBehavior.translucent,
                      onPointerDown: (event) {
                        _activeBookshelfPointers[event.pointer] = event.position;
                        if (_activeBookshelfPointers.length >= 2) {
                          _isMultiTouchScrolling = true;
                          if (_isDragSelecting) {
                            setState(() => _isDragSelecting = false);
                          }
                          _pointerDownGlobalPos = null;
                          _pointerDownRowPath = null;
                          _lastDragTouchedPath = null;
                          _lastTwoFingerAvgDy = _activeBookshelfPointers.values
                                  .map((p) => p.dy)
                                  .reduce((a, b) => a + b) /
                              _activeBookshelfPointers.length;
                          return;
                        }
                        if (_isSelectionMode && !_isMultiTouchScrolling) {
                          _pointerDownGlobalPos = event.position;
                          _pointerDownRowPath = _findFileRowPathAtGlobalPos(event.position);
                          _lastDragTouchedPath = null;
                        }
                      },
                      onPointerMove: (event) {
                        _activeBookshelfPointers[event.pointer] = event.position;
                        if (!_isSelectionMode) return;

                        // 1. 선택 모드에서 두 손가락 이상으로 드래그 시 파일 선택을 즉시 차단하고 화면 스크롤만 수행
                        if (_activeBookshelfPointers.length >= 2 || _isMultiTouchScrolling) {
                          if (_isDragSelecting) {
                            setState(() => _isDragSelecting = false);
                          }
                          if (_activeBookshelfPointers.length >= 2 &&
                              _bookshelfScrollController.hasClients &&
                              _bookshelfScrollController.position.hasContentDimensions) {
                            final double curAvgDy = _activeBookshelfPointers.values
                                    .map((p) => p.dy)
                                    .reduce((a, b) => a + b) /
                                _activeBookshelfPointers.length;
                            final double dyDelta = _lastTwoFingerAvgDy - curAvgDy;
                            _lastTwoFingerAvgDy = curAvgDy;
                            final pos = _bookshelfScrollController.position;
                            final double targetOffset = (pos.pixels + dyDelta)
                                .clamp(pos.minScrollExtent, pos.maxScrollExtent);
                            _bookshelfScrollController.jumpTo(targetOffset);
                          }
                          return;
                        }

                        if (!_isDragSelecting && _pointerDownGlobalPos != null) {
                          if ((event.position - _pointerDownGlobalPos!).distance > 10.0) {
                            setState(() {
                              _isDragSelecting = true;
                              if (_pointerDownRowPath != null) {
                                final alreadySelected = _selectedFilePaths.contains(_pointerDownRowPath!);
                                _dragTargetSelectState = !alreadySelected;
                                if (_dragTargetSelectState) {
                                  _selectedFilePaths.add(_pointerDownRowPath!);
                                } else {
                                  _selectedFilePaths.remove(_pointerDownRowPath!);
                                }
                                _lastDragTouchedPath = _pointerDownRowPath;
                              } else {
                                _dragTargetSelectState = true;
                              }
                            });
                          }
                        }
                        if (_isDragSelecting) {
                          _applyDragSelectionAtGlobalPos(event.position);
                        }
                      },
                      onPointerUp: (event) {
                        _activeBookshelfPointers.remove(event.pointer);
                        if (_activeBookshelfPointers.length >= 2) {
                          _lastTwoFingerAvgDy = _activeBookshelfPointers.values
                                  .map((p) => p.dy)
                                  .reduce((a, b) => a + b) /
                              _activeBookshelfPointers.length;
                        } else if (_activeBookshelfPointers.isEmpty) {
                          _isMultiTouchScrolling = false;
                          if (_isDragSelecting) {
                            setState(() => _isDragSelecting = false);
                          }
                          _pointerDownGlobalPos = null;
                          _pointerDownRowPath = null;
                          _lastDragTouchedPath = null;
                        }
                      },
                      onPointerCancel: (event) {
                        _activeBookshelfPointers.remove(event.pointer);
                        if (_activeBookshelfPointers.isEmpty) {
                          _isMultiTouchScrolling = false;
                          if (_isDragSelecting) {
                            setState(() => _isDragSelecting = false);
                          }
                          _pointerDownGlobalPos = null;
                          _pointerDownRowPath = null;
                          _lastDragTouchedPath = null;
                        }
                      },
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
                                  physics: _isSelectionMode
                                      ? const NeverScrollableScrollPhysics()
                                      : const AlwaysScrollableScrollPhysics(),
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
                                      child: _buildGridBookCard(bookFile),
                                    );
                                  },
                                );
                              },
                            )
                          : ListView.separated(
                        controller: _bookshelfScrollController,
                        cacheExtent: 3000.0,
                        physics: _isSelectionMode
                            ? const NeverScrollableScrollPhysics()
                            : const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.only(bottom: 88),
                        itemCount: filteredBooks.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final file = filteredBooks[index];
                          final rowKey = _fileRowKeys.putIfAbsent(file.path, () => GlobalKey());
                        final rawFileName = file.path.split(Platform.pathSeparator).last;
                        final displayFileName = _formatDisplayFileName(rawFileName);
                        final grp = _bookGroupMap[file.path] ?? '미분류';
                        final prog = (_bookProgressMap[file.path] ?? 0.0) * 100;
                        final isSelected = _selectedFilePaths.contains(file.path);
                        final isFavorite = _favoritePaths.contains(file.path);
                        final lowerExt = rawFileName.split('.').last.toLowerCase();

                        return Dismissible(
                          key: ValueKey(file.path),
                          direction: _isSelectionMode ? DismissDirection.none : DismissDirection.endToStart,
                          background: Container(
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
                          onDismissed: (_) => _moveFileToTrash(file),
                          child: Container(
                            key: rowKey,
                            child: ListTile(
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
                                : Icon(
                                    lowerExt == 'pdf'
                                        ? Icons.picture_as_pdf
                                        : (lowerExt == 'docx' || lowerExt == 'doc' || lowerExt == 'hwpx' || lowerExt == 'hwp')
                                            ? Icons.description_outlined
                                            : (lowerExt == 'epub' || lowerExt == 'txt')
                                                ? Icons.menu_book
                                                : lowerExt == 'cbz'
                                                    ? Icons.auto_stories
                                                    : Icons.image,
                                    color: Colors.indigo,
                                  ),
                            title: Text(
                              displayFileName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Builder(
                              builder: (context) {
                                final grpDisplay = _localizeGroupName(grp);
                                final progLabel = _tr('진행률', 'Progress', '进度', '進行率');
                                // 10. [전체]에서만 그룹 이름 표시, 특정 그룹 선택 시 그룹 이름 표시 제거
                                final subText = _selectedGroup == '전체'
                                    ? '[$grpDisplay]  •  $progLabel ${prog.toStringAsFixed(1)}%'
                                    : '$progLabel ${prog.toStringAsFixed(1)}%';
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
                                : Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(
                                        visualDensity: VisualDensity.compact,
                                        icon: Icon(
                                          isFavorite ? Icons.star_rounded : Icons.star_border_rounded,
                                          color: isFavorite ? Colors.amber : null,
                                        ),
                                        tooltip: _tr('즐겨찾기', 'Favorite', '收藏', 'お気に入り'),
                                        onPressed: () async {
                                          await StorageService.toggleFavoriteBook(file.path);
                                          await _loadLibrary();
                                        },
                                      ),
                                      IconButton(
                                        visualDensity: VisualDensity.compact,
                                        icon: const Icon(Icons.edit_outlined),
                                        tooltip: _tr('이름 변경', 'Rename', '重命名', '名前変更'),
                                        onPressed: () => _renameFileDialog(file),
                                      ),
                                      IconButton(
                                        visualDensity: VisualDensity.compact,
                                        icon: const Icon(Icons.drive_file_move_outline),
                                        tooltip: _tr('그룹 변경', 'Move Group', '移动分组', 'グループ移動'),
                                        onPressed: () => _assignGroupDialog(file),
                                      ),
                                    ],
                                  ),
                            onLongPress: () {
                              if (_isMultiTouchScrolling || _activeBookshelfPointers.length >= 2) return;
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
                              if (_isMultiTouchScrolling || _activeBookshelfPointers.length >= 2) return;
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
                          ),
                        );
                      },
                    ),
                          ),
                        ),
                        _buildPcStyleScrollbar(filteredBooks.length),
                      ],
                    ),
            ),
          ],
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
                    icon: const Icon(Icons.drive_file_move_outline, size: 18),
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
                    icon: const Icon(Icons.delete_outline, size: 18),
                    label: Text(
                      '${_tr("삭제", "Delete", "删除", "削除")} (${_selectedFilePaths.length})',
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            )
          : FloatingActionButton.extended(
              heroTag: 'fab_add_files',
              onPressed: _pickAndImportFiles,
              icon: const Icon(Icons.add),
              label: Text(_tr('파일 추가', 'Add Files', '添加文件', 'ファイル追加')),
            ),
      ),
    );
  }
}
