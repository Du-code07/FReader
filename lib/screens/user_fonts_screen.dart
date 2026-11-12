import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../services/user_fonts.dart';

typedef FontsTr = String Function(String ko, String en, String zh, String ja);

/// 문서 글꼴: 한글·워드 문서에 쓰인 글꼴이 기기에 없을 때 대신 쓸 글꼴을 사용자가 직접 넣는 화면.
/// 앱은 글꼴을 함께 배포하지 않으며, 넣은 글꼴 파일은 이 기기 안에서만 쓰인다.
class UserFontsScreen extends StatefulWidget {
  const UserFontsScreen({super.key, required this.t, this.category = 'doc'});
  final FontsTr t;

  /// 'doc'(한글·워드·PDF 문서) / 'app'(앱 글꼴) / 'epub'(EPUB 글꼴)
  final String category;

  @override
  State<UserFontsScreen> createState() => _UserFontsScreenState();
}

class _UserFontsScreenState extends State<UserFontsScreen> {
  List<UserFontEntry> _fonts = const [];
  bool _busy = false;

  FontsTr get _t => widget.t;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    final all = await UserFonts.listOf(widget.category);
    all.sort((a, b) => a.label.toLowerCase().compareTo(b.label.toLowerCase()));
    if (mounted) setState(() => _fonts = all);
  }

  Future<void> _add() async {
    if (_busy) return;
    final res = await FilePicker.platform.pickFiles(allowMultiple: widget.category == 'doc', type: FileType.any);
    final paths = [
      for (final f in res?.files ?? const <PlatformFile>[])
        if (f.path != null && RegExp(r'\.(ttf|otf|ttc)$', caseSensitive: false).hasMatch(f.name)) f.path!,
    ];
    if (res != null && paths.isEmpty && mounted) {
      _snack(_t('글꼴 파일(.ttf, .otf, .ttc)을 골라 주세요.', 'Please choose font files (.ttf, .otf, .ttc).', '请选择字体文件（.ttf、.otf、.ttc）。', 'フォントファイル（.ttf・.otf・.ttc）を選んでください。'));
      return;
    }
    if (paths.isEmpty) return;
    setState(() => _busy = true);
    final n = await UserFonts.add(paths, category: widget.category);
    if (widget.category == 'app') await UserFonts.loadAppFont();
    if (!mounted) return;
    setState(() => _busy = false);
    await _reload();
    _snack(n > 0
        ? (widget.category == 'app'
            ? _t('앱 글꼴을 바꿨어요.', 'App font changed.', '已更换应用字体。', 'アプリのフォントを変更しました。')
            : widget.category == 'epub'
                ? _t('EPUB 글꼴을 바꿨어요. 책을 다시 열면 적용돼요.', 'EPUB font changed. Reopen books to apply.', '已更换EPUB字体，重新打开书籍后生效。', 'EPUBのフォントを変更しました。本を開き直すと反映されます。')
                : _t('글꼴 $n개를 넣었어요. 문서를 다시 열면 적용돼요.', 'Added $n font(s). Reopen documents to apply.', '已添加 $n 个字体。重新打开文档后生效。', '$n 個のフォントを追加しました。文書を開き直すと反映されます。'))
        : _t('글꼴을 읽지 못했어요.', 'Could not read the font.', '无法读取字体。', 'フォントを読み込めませんでした。'));
  }

  Future<void> _remove(UserFontEntry e) async {
    await UserFonts.remove(e);
    if (widget.category == 'app') await UserFonts.loadAppFont();
    await _reload();
  }

  void _snack(String text) {
    ScaffoldMessenger.of(context)
      ..clearSnackBars()
      ..showSnackBar(SnackBar(content: Text(text), duration: const Duration(milliseconds: 1800)));
  }

  String get _title => switch (widget.category) {
        'app' => _t('앱 글꼴', 'App Font', '应用字体', 'アプリのフォント'),
        'epub' => _t('EPUB 글꼴', 'EPUB Font', 'EPUB字体', 'EPUBフォント'),
        _ => _t('한글·워드 글꼴', 'HWP·Word Fonts', 'HWP·Word 字体', 'HWP・Wordフォント'),
      };

  String get _description => switch (widget.category) {
        'app' => _t('앱의 메뉴·목록·설정 화면에 쓸 글꼴 파일(.ttf, .otf)을 고르면 그 글꼴로 보여 줘요. 지우면 기본 글꼴로 돌아가요.',
            'Choose a font file (.ttf, .otf) to use for the app\'s menus, lists and settings. Delete it to return to the default font.',
            '选择字体文件（.ttf、.otf）用于应用菜单、列表和设置。删除后恢复默认字体。',
            'アプリのメニュー・一覧・設定に使うフォントファイル（.ttf・.otf）を選びます。削除すると既定のフォントに戻ります。'),
        'epub' => _t('EPUB 책 본문을 고른 글꼴로 보여 줘요. 지우면 책에 들어 있는 원래 글꼴로 보여 줘요.',
            'Shows EPUB book text in the chosen font. Delete it to use the book\'s own fonts.',
            '用所选字体显示EPUB正文。删除后使用书中自带的字体。',
            'EPUB本文を選んだフォントで表示します。削除すると本に含まれる元のフォントで表示します。'),
        _ => _t(
            '한글·워드 문서에 쓰인 글꼴(예: 맑은 고딕, 함초롬바탕)이 휴대폰에 없으면 다른 글꼴로 바뀌어 글과 사진 배치가 밀릴 수 있어요. '
                '가지고 있는 글꼴 파일을 넣으면 같은 이름의 글꼴 대신 그 파일로 보여 줘요. 넣은 글꼴은 이 기기 안에서만 쓰여요.\n'
                'Arial·Times New Roman·Courier New·Calibri·Cambria는 글자 폭이 같은 무료 글꼴로 자동으로 바꿔 보여 줘요.',
            'If a font used in a document (e.g. Malgun Gothic) is missing on this phone, another font is used and text or pictures may shift. '
                'Add font files you own and they will be used for fonts with the same name. Added fonts stay on this device.\n'
                'Arial, Times New Roman, Courier New, Calibri and Cambria are automatically replaced with free fonts of the same widths.',
            '如果文档中使用的字体（如 Malgun Gothic）在手机上没有，会换成其他字体，文字和图片位置可能偏移。添加您拥有的字体文件后，将用于同名字体。添加的字体只在本机使用。\n'
                'Arial、Times New Roman、Courier New、Calibri、Cambria 会自动换成字宽相同的免费字体。',
            '文書で使われたフォント（例: Malgun Gothic）が端末にないと別のフォントになり、文字や画像の配置がずれることがあります。お持ちのフォントファイルを追加すると、同じ名前のフォントの代わりに使います。追加したフォントはこの端末内だけで使われます。\n'
                'Arial・Times New Roman・Courier New・Calibri・Cambria は文字幅が同じ無料フォントに自動で置き換えます。'),
      };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _busy ? null : _add,
        icon: _busy
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.add),
        label: Text(widget.category == 'doc' ? _t('글꼴 추가', 'Add Font', '添加字体', 'フォント追加') : _t('글꼴 고르기', 'Choose Font', '选择字体', 'フォントを選ぶ')),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 96),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Text(
              _description,
              style: TextStyle(fontSize: 14, height: 1.45, color: cs.onSurfaceVariant),
            ),
          ),
          if (_fonts.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Text(_t('넣은 글꼴이 없어요', 'No fonts added', '尚未添加字体', '追加したフォントはありません'),
                    style: TextStyle(color: cs.onSurfaceVariant)),
              ),
            ),
          for (final e in _fonts)
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 2),
              leading: Icon(Icons.font_download_outlined, color: cs.onSurface),
              title: Text(e.label, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(
                [
                  e.names.join(', '),
                  if (e.weight >= 700) _t('굵게', 'Bold', '粗体', '太字'),
                  if (e.italic) _t('기울임', 'Italic', '斜体', '斜体'),
                ].join(' · '),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                tooltip: _t('삭제', 'Delete', '删除', '削除'),
                onPressed: () => _remove(e),
              ),
            ),
        ],
      ),
    );
  }
}
