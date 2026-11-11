import 'package:flutter/material.dart';

import '../services/storage_service.dart';
import '../widgets/choice_sheet.dart';
import 'language_select_screen.dart';

/// 앱 설정 화면: 항목을 누르면 아래에서 고르기 창이 올라온다.
class AppSettingsScreen extends StatefulWidget {
  const AppSettingsScreen({
    super.key,
    required this.appLang,
    required this.themeMode,
    required this.onChangeThemeMode,
    required this.viewMode,
    required this.hideExtension,
    this.hideGroupName = false,
    this.onChangeHideGroupName,
    this.hideThumbnails = false,
    this.onChangeHideThumbnails,
    required this.onChangeLanguage,
    required this.onChangeViewMode,
    required this.onChangeHideExtension,
    required this.onOpenManual,
    this.scrollController,
    this.scrollPhysics,
    this.asSheet = false,
  });

  /// 지금 화면 문구에 쓰는 언어 (ko/en/zh/ja)
  final String appLang;
  final String themeMode; // 'system' | 'light' | 'dark'
  final Future<void> Function(String mode) onChangeThemeMode;
  final String viewMode; // 'grid' | 'list'
  final bool hideExtension;
  final bool hideGroupName;
  final Future<void> Function(bool hide)? onChangeHideGroupName;
  final bool hideThumbnails;
  final Future<void> Function(bool hide)? onChangeHideThumbnails;
  final ValueChanged<String> onChangeLanguage; // 'system' | ko/en/zh/ja
  final Future<void> Function(String mode) onChangeViewMode;
  final Future<void> Function(bool hide) onChangeHideExtension;
  final void Function(String lang) onOpenManual;

  /// 아래에서 올라오는 창으로 띄울 때(위에서 아래로 끌어 닫기) 쓰는 스크롤 연결
  final ScrollController? scrollController;
  final ScrollPhysics? scrollPhysics;

  /// 창으로 띄웠는지: 맨 위 손잡이 줄과 '내리기' 버튼 표시
  final bool asSheet;

  @override
  State<AppSettingsScreen> createState() => _AppSettingsScreenState();
}

class _AppSettingsScreenState extends State<AppSettingsScreen> {
  late String _lang = widget.appLang;
  late String _langSetting = StorageService.appLangSetting ?? 'system';
  late String _themeMode = widget.themeMode;
  late String _viewMode = widget.viewMode;
  late bool _hideExt = widget.hideExtension;
  late bool _hideGroup = widget.hideGroupName;
  late bool _hideThumbs = widget.hideThumbnails;

  String _t(String ko, String en, String zh, String ja) => AppI18n.t(_lang, ko: ko, en: en, zh: zh, ja: ja);

  String _viewModeLabel(String mode) => mode == 'grid'
      ? _t('표지형 (썸네일)', 'Cover View (Thumbnail)', '封面视图 (缩略图)', '表紙表示 (サムネイル)')
      : _t('목록형 (리스트)', 'List View', '列表视图', 'リスト表示');

  String _themeLabel(String mode) => mode == 'dark'
      ? _t('다크 모드', 'Dark mode', '深色模式', 'ダークモード')
      : mode == 'light'
          ? _t('라이트 모드', 'Light mode', '浅色模式', 'ライトモード')
          : _t('기본 시스템', 'System default', '跟随系统', 'システムのデフォルト');

  Future<void> _pickTheme() async {
    final v = await showChoiceSheet<String>(
      context: context,
      title: _t('앱 테마', 'App Theme', '应用主题', 'アプリのテーマ'),
      options: [
        ChoiceOption('system', _themeLabel('system'), icon: Icons.brightness_auto_outlined),
        ChoiceOption('light', _themeLabel('light'), icon: Icons.light_mode_outlined),
        ChoiceOption('dark', _themeLabel('dark'), icon: Icons.dark_mode_outlined),
      ],
      current: _themeMode,
    );
    if (v == null || !mounted) return;
    setState(() => _themeMode = v);
    await widget.onChangeThemeMode(v);
  }

  Future<void> _pickLanguage() async {
    final v = await showChoiceSheet<String>(
      context: context,
      title: _t('언어', 'Language', '语言', '言語'),
      options: [for (final code in LanguageSelectScreen.options) ChoiceOption(code, languageOptionLabel(code))],
      current: _langSetting,
    );
    if (v == null || !mounted) return;
    widget.onChangeLanguage(v);
    setState(() {
      _langSetting = v;
      _lang = StorageService.resolveAppLanguage(v);
    });
  }

  /// 파일 표시 방식(표지형/목록형) + 파일 이름 뒤 형식 숨기기 + 그룹 이름 숨기기 — 누르면 바로 적용
  Future<void> _pickViewMode() async {
    await showChoiceSheetWithToggle<String>(
      context: context,
      title: _t('파일 표시 방식', 'Bookshelf View Mode', '文件显示样式', 'ファイル表示形式'),
      options: [
        ChoiceOption('list', _viewModeLabel('list'), icon: Icons.view_list_rounded),
        ChoiceOption('grid', _viewModeLabel('grid'), icon: Icons.grid_view_rounded),
      ],
      current: _viewMode,
      toggleIcon: Icons.visibility_off_outlined,
      toggleLabel: _t('파일 이름 뒤 형식 숨기기', 'Hide file extension', '隐藏文件扩展名', 'ファイル名の形式を隠す'),
      toggleSubtitle: _t('.pdf, .epub 등', '.pdf, .epub, etc.', '.pdf、.epub 等', '.pdf、.epub など'),
      toggleValue: _hideExt,
      onChanged: (r) async {
        final (mode, hide) = r;
        if (!mounted) return;
        final bool modeChanged = mode != _viewMode, hideChanged = hide != _hideExt;
        setState(() {
          _viewMode = mode;
          _hideExt = hide;
        });
        if (modeChanged) await widget.onChangeViewMode(mode);
        if (hideChanged) await widget.onChangeHideExtension(hide);
      },
      moreToggles: [
        // 표지형을 골랐을 때만: 표지 그림 끄기 (TXT처럼 가운데 아이콘만)
        SheetToggle(
          icon: Icons.hide_image_outlined,
          label: _t('표지 그림 끄기', 'Hide covers', '隐藏封面', '表紙を隠す'),
          subtitle: _t('표지 대신 파일 아이콘만', 'Show file icons only', '只显示文件图标', 'ファイルアイコンのみ'),
          value: _hideThumbs,
          onlyFor: 'grid',
          onChanged: (v) async {
            if (!mounted) return;
            setState(() => _hideThumbs = v);
            await widget.onChangeHideThumbnails?.call(v);
          },
        ),
        SheetToggle(
          icon: Icons.label_off_outlined,
          label: _t('그룹 이름 숨기기', 'Hide group name', '隐藏分组名称', 'グループ名を隠す'),
          subtitle: _t('파일 아래 [그룹 이름]', '[Group] under each file', '文件下方的 [分组]', 'ファイルの下の [グループ]'),
          value: _hideGroup,
          onChanged: (v) async {
            if (!mounted) return;
            setState(() => _hideGroup = v);
            await widget.onChangeHideGroupName?.call(v);
          },
        ),
      ],
    );
  }

  Widget _section(String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 6),
      child: Text(
        text,
        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant),
      ),
    );
  }

  Widget _item({
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Icon(icon, size: 26, color: cs.onSurface),
      title: Text(title, style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w600)),
      subtitle: subtitle == null ? null : Text(subtitle, style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
      trailing: trailing ?? Icon(Icons.chevron_right, color: cs.onSurfaceVariant),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: !widget.asSheet,
        // 창으로 띄울 때: 위 손잡이 줄과 겹치지 않게 제목·화살표를 살짝 내림
        toolbarHeight: widget.asSheet ? kToolbarHeight + 8 : null,
        leading: widget.asSheet
            ? Padding(
                padding: const EdgeInsets.only(top: 8),
                child: IconButton(
                  icon: const Icon(Icons.keyboard_arrow_down),
                  tooltip: _t('닫기', 'Close', '关闭', '閉じる'),
                  onPressed: () => Navigator.maybePop(context),
                ),
              )
            : null,
        title: Padding(
          padding: EdgeInsets.only(top: widget.asSheet ? 8 : 0),
          child: Text(_t('앱 설정', 'App Settings', '应用设置', 'アプリ設定')),
        ),
        // 위에서 아래로 끌어 닫을 수 있다는 손잡이 줄
        flexibleSpace: widget.asSheet
            ? Align(
                alignment: Alignment.topCenter,
                child: Container(
                  margin: const EdgeInsets.only(top: 6),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(color: cs.onSurfaceVariant.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(2)),
                ),
              )
            : null,
      ),
      body: SafeArea(
        top: !widget.asSheet,
        child: ListView(
          controller: widget.scrollController,
          physics: widget.scrollPhysics,
          padding: const EdgeInsets.only(bottom: 16),
          children: [
            _section(_t('일반', 'General', '通用', '一般')),
            _item(
              icon: Icons.dark_mode_outlined,
              title: _t('앱 테마', 'App Theme', '应用主题', 'アプリのテーマ'),
              subtitle: _themeLabel(_themeMode),
              onTap: _pickTheme,
            ),
            _item(
              icon: Icons.language,
              title: _t('언어', 'Language', '语言', '言語'),
              subtitle: languageOptionLabel(_langSetting),
              onTap: _pickLanguage,
            ),
            _item(
              icon: _viewMode == 'grid' ? Icons.grid_view_rounded : Icons.view_list_rounded,
              title: _t('파일 표시 방식', 'Bookshelf View Mode', '文件显示样式', 'ファイル表示形式'),
              // 지금 방식 + 형식 숨김 여부
              subtitle: [
                _viewModeLabel(_viewMode),
                if (_hideExt) _t('형식 숨김', 'extensions hidden', '隐藏扩展名', '形式を隠す'),
                if (_hideGroup) _t('그룹 숨김', 'groups hidden', '隐藏分组', 'グループを隠す'),
              ].join(' · '),
              onTap: _pickViewMode,
            ),
            _section(_t('도움말', 'Help', '帮助', 'ヘルプ')),
            _item(
              icon: Icons.menu_book_outlined,
              title: _t('사용 설명서', 'User Manual', '使用说明书', '取扱説明書'),
              onTap: () => widget.onOpenManual(_lang),
            ),
          ],
        ),
      ),
    );
  }
}
