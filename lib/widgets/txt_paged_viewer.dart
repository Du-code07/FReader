import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'text_copy_sheet.dart';
import 'word_selection_layer.dart';
import 'package:path_provider/path_provider.dart';

import '../services/txt_page_document.dart';
import 'viewer_dialogs.dart';
import '../services/storage_service.dart';

class TxtPageController {
  Future<void> Function(String, Object?)? _invoke;
  Future<void> next() async => _invoke?.call('next', null);
  Future<void> previous() async => _invoke?.call('previous', null);
  Future<void> display(String position) async =>
      _invoke?.call('display', position);
  Future<void> toProgress(double progress) async =>
      _invoke?.call('progress', progress);

  String Function()? _visible;

  /// 지금 화면에 보이는 쪽의 글 (글자 복사용)
  String get visibleText => _visible?.call() ?? '';

  // 파일 내 단어 검색: 찾은 곳 수 / n번째로 이동 / 지우기
  Future<int> Function(String)? _search;
  Future<void> Function(int)? _showResult;
  VoidCallback? _clear;
  Future<int> search(String query) async => await _search?.call(query) ?? 0;
  Future<void> showSearchResult(int index) async => _showResult?.call(index);
  void clearSearch() => _clear?.call();
}

/// Keeps the existing ReaderScreen toolbar, gestures, bookmarks and memos.
/// TXT is still the document's identity; only its display uses fixed paper pages.
class TxtPagedViewer extends StatefulWidget {
  final String filePath;
  final TxtPageController controller;
  final String? initialPosition;
  final double initialProgress;
  final String theme;
  final bool spread;
  final bool rtl;

  /// 스크롤 모드: 쪽을 간격 없이 세로로 이어 보여 줌
  final bool scroll;
  final ContinuousPageController? scrollController;
  final ValueChanged<int> onLoaded;
  final void Function(int, int, String, double) onLocation;
  final ValueChanged<String> onError;

  const TxtPagedViewer({
    super.key,
    required this.filePath,
    required this.controller,
    this.initialPosition,
    this.initialProgress = 0,
    required this.theme,
    required this.spread,
    required this.rtl,
    this.scroll = false,
    this.scrollController,
    required this.onLoaded,
    required this.onLocation,
    required this.onError,
  });

  @override
  State<TxtPagedViewer> createState() => _TxtPagedViewerState();
}

class _TxtPagedViewerState extends State<TxtPagedViewer> {
  TxtPageDocument? _document;
  List<String> _visibleText = const [];
  int _page = 0;
  int _request = 0;
  final Map<int, Future<String>> _scrollCache = {};
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    widget.controller._invoke = _navigate;
    widget.controller._visible = () => _visibleText.join('\n\n');
    widget.controller._search = _search;
    widget.controller._showResult = _showSearchResult;
    widget.controller._clear = _clearSearch;
    unawaited(_load());
  }

  // ── 파일 내 단어 검색 ──
  String _query = '';
  List<(int, int)> _hits = const []; // (쪽, 쪽 안 글자 위치)
  int _current = -1;
  int _searchGen = 0;

  Future<int> _search(String query) async {
    final doc = _document;
    final q = query.trim();
    if (doc == null || q.isEmpty) return 0;
    final gen = ++_searchGen;
    final lower = q.toLowerCase();
    final hits = <(int, int)>[];
    for (int i = 0; i < doc.pageCount && hits.length < 10000; i++) {
      final text = (await doc.readPage(i)).toLowerCase();
      if (_disposed || gen != _searchGen) return 0;
      for (int at = text.indexOf(lower); at >= 0 && hits.length < 10000; at = text.indexOf(lower, at + lower.length)) {
        hits.add((i, at));
      }
      if (i % 40 == 39) await Future<void>.delayed(Duration.zero);
    }
    if (!mounted) return 0;
    setState(() {
      _query = q;
      _hits = hits;
      _current = -1;
    });
    return hits.length;
  }

  Future<void> _showSearchResult(int index) async {
    if (index < 0 || index >= _hits.length) return;
    setState(() => _current = index);
    final page = _hits[index].$1;
    if (widget.scroll) {
      widget.scrollController?.jumpToPage(page);
    } else {
      await _show(page);
    }
  }

  void _clearSearch() {
    _searchGen++;
    if (!mounted) return;
    setState(() {
      _query = '';
      _hits = const [];
      _current = -1;
    });
  }

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(StorageService.appLangNotifier.value, ko: ko, en: en, zh: zh, ja: ja);

  /// 종이 위 낱말 자리 (종이 크기 대비 0~1)
  static List<SelectableWord> _wordsOf(String text) {
    final layout = TxtPageDocument.painter(text);
    const size = TxtPageDocument.paperSize;
    final out = <SelectableWord>[];
    for (final m in RegExp(r'\S+').allMatches(text)) {
      final boxes = layout.getBoxesForSelection(TextSelection(baseOffset: m.start, extentOffset: m.end));
      // 줄이 바뀌며 나뉜 낱말은 줄마다 따로
      int from = m.start;
      for (final b in boxes) {
        final r = b.toRect().shift(const Offset(TxtPageDocument.margin, TxtPageDocument.margin));
        final part = boxes.length == 1 ? m.group(0)! : text.substring(from, (from + ((m.end - m.start) * (b.right - b.left) / boxes.fold<double>(0, (a, x) => a + x.right - x.left)).round()).clamp(from, m.end));
        from += part.length;
        out.add(SelectableWord(part, Rect.fromLTWH(r.left / size.width, r.top / size.height, r.width / size.width, r.height / size.height)));
      }
    }
    layout.dispose();
    return out;
  }

  /// 이 쪽에서 찾은 곳들 (글자 위치), 지금 고른 곳
  List<int> _hitsOn(int page) => [for (final h in _hits) if (h.$1 == page) h.$2];
  int? _currentOn(int page) => _current >= 0 && _current < _hits.length && _hits[_current].$1 == page ? _hits[_current].$2 : null;

  Future<void> _load() async {
    try {
      final cache = await getTemporaryDirectory();
      if (_disposed) return;
      final doc = await TxtPageDocument.open(
        File(widget.filePath),
        cache,
        cancelled: () => _disposed,
      );
      if (_disposed) {
        await doc.dispose();
        return;
      }
      _document = doc;
      final saved = RegExp(
        r'^txt:(\d+)$',
      ).firstMatch(widget.initialPosition ?? '');
      final page = saved != null
          ? int.parse(saved[1]!)
          : (widget.initialProgress.clamp(0.0, 1.0) * (doc.pageCount - 1))
                .round();
      widget.onLoaded(doc.pageCount);
      await _show(page);
    } on TxtPaginationCancelled {
      // Leaving the reader cancels preparation and removes its temporary files.
    } catch (error) {
      if (!_disposed && mounted) widget.onError(error.toString());
    }
  }

  Future<void> _show(int requested) async {
    final doc = _document;
    if (doc == null || _disposed) return;
    final request = ++_request;
    var page = requested.clamp(0, doc.pageCount - 1).toInt();
    if (widget.spread) page = page ~/ 2 * 2;
    _page = page; // Rapid hardware keys advance from the latest requested page.
    try {
      final text = [await doc.readPage(page)];
      if (widget.spread && page + 1 < doc.pageCount) {
        text.add(await doc.readPage(page + 1));
      }
      if (_disposed || !mounted || request != _request) return;
      setState(() => _visibleText = text);
      final lastVisible = widget.spread && page + 1 < doc.pageCount
          ? page + 1
          : page;
      widget.onLocation(
        page,
        doc.pageCount,
        'txt:$page',
        doc.pageCount <= 1 ? 0 : lastVisible / (doc.pageCount - 1),
      );
    } catch (error) {
      if (!_disposed && mounted && request == _request)
        widget.onError(error.toString());
    }
  }

  Future<void> _navigate(String method, Object? value) async {
    final doc = _document;
    if (doc == null) return;
    final step = widget.spread ? 2 : 1;
    switch (method) {
      case 'next':
        await _show(_page + step);
      case 'previous':
        await _show(_page - step);
      case 'display':
        final match = RegExp(r'^txt:(\d+)$').firstMatch(value.toString());
        if (match != null && widget.scroll) {
          widget.scrollController?.jumpToPage(int.parse(match[1]!));
          return;
        }
        if (match != null) await _show(int.parse(match[1]!));
      case 'progress':
        await _show(
          ((value as double).clamp(0.0, 1.0) * (doc.pageCount - 1)).round(),
        );
    }
  }

  @override
  void didUpdateWidget(covariant TxtPagedViewer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.spread != widget.spread || oldWidget.scroll != widget.scroll) unawaited(_show(_page));
  }

  @override
  void dispose() {
    _disposed = true;
    widget.controller._invoke = null;
    widget.controller._search = null;
    widget.controller._showResult = null;
    widget.controller._clear = null;
    final doc = _document;
    if (doc != null) unawaited(doc.dispose());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final background = widget.theme == 'dark'
        ? const Color(0xff1e1e1e)
        : widget.theme == 'sepia'
        ? const Color(0xfffbf0d9)
        : Colors.white;
    final foreground = widget.theme == 'dark'
        ? const Color(0xffd4d4d4)
        : widget.theme == 'sepia'
        ? const Color(0xff3b2f2f)
        : Colors.black;
    Widget paper(String text, int page) => FittedBox(
      fit: BoxFit.contain,
      alignment: Alignment.topCenter,
      child: SizedBox.fromSize(
        size: TxtPageDocument.paperSize,
        // EPUB처럼 글을 길게 눌러 골라 복사
        child: WordSelectionLayer(
          tr: _tr,
          onCopy: (t) => showTextCopySheet(context, text: t, tr: _tr),
          loadWords: () async => _wordsOf(text),
          child: CustomPaint(
            painter: _TxtPaperPainter(text, foreground,
                query: _query, hits: _query.isEmpty ? const [] : _hitsOn(page), current: _currentOn(page)),
          ),
        ),
      ),
    );
    if (widget.scroll && _document != null) return _buildScroll(background, foreground, paper);
    final children = [
      for (int i = 0; i < _visibleText.length; i++) Expanded(child: paper(_visibleText[i], _page + i)),
    ];
    if (widget.spread && children.length == 1)
      children.add(const Expanded(child: SizedBox()));
    return ColoredBox(
      color: background,
      child: _visibleText.isEmpty
          ? FileLoadingView(label: AppI18n.t(StorageService.appLangNotifier.value, ko: '파일 여는 중', en: 'Opening file', zh: '正在打开文件', ja: 'ファイルを開いています'), background: background)
          : Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: widget.rtl && widget.spread
                  ? children.reversed.toList()
                  : children,
            ),
    );
  }
}

extension on _TxtPagedViewerState {
  /// 스크롤 모드: 종이 쪽들을 세로로 이어 붙임 (보이는 쪽 근처만 그때그때 읽어 둠)
  Widget _buildScroll(Color background, Color foreground, Widget Function(String, int) paper) {
    final doc = _document!;
    final double aspect = TxtPageDocument.paperSize.height / TxtPageDocument.paperSize.width;
    return ContinuousPageList(
      controller: widget.scrollController,
      count: doc.pageCount,
      aspectOf: (_) => aspect,
      initialPage: _page,
      background: background,
      // 두 손가락으로 벌려 확대
      zoomable: true,
      onPageChanged: (p) {
        _page = p;
        widget.onLocation(p, doc.pageCount, 'txt:$p', doc.pageCount <= 1 ? 0 : p / (doc.pageCount - 1));
      },
      pageBuilder: (ctx, i) => ColoredBox(
        color: background,
        child: FutureBuilder<String>(
          future: _scrollText(i),
          builder: (ctx, snap) => snap.hasData ? paper(snap.data!, i) : const SizedBox.expand(),
        ),
      ),
    );
  }

  Future<String> _scrollText(int i) {
    final cache = _scrollCache;
    final hit = cache[i];
    if (hit != null) return hit;
    if (cache.length > 40) cache.remove(cache.keys.first);
    return cache[i] = _document!.readPage(i);
  }
}

class _TxtPaperPainter extends CustomPainter {
  final String text;
  final Color color;
  final String query;
  final List<int> hits;
  final int? current;
  _TxtPaperPainter(this.text, this.color, {this.query = '', this.hits = const [], this.current});

  @override
  void paint(Canvas canvas, Size size) {
    final layout = TxtPageDocument.painter(text, color: color);
    const origin = Offset(TxtPageDocument.margin, TxtPageDocument.margin);
    // 찾은 단어 칠하기 (지금 고른 곳은 더 진하게)
    if (query.isNotEmpty && hits.isNotEmpty) {
      final normal = Paint()..color = const Color(0x66FFC107);
      final strong = Paint()..color = const Color(0xCCFF9800);
      for (final at in hits) {
        final boxes = layout.getBoxesForSelection(TextSelection(baseOffset: at, extentOffset: at + query.length));
        for (final b in boxes) {
          canvas.drawRect(b.toRect().shift(origin).inflate(1), at == current ? strong : normal);
        }
      }
    }
    layout.paint(canvas, origin);
    layout.dispose();
  }

  @override
  bool shouldRepaint(covariant _TxtPaperPainter oldDelegate) =>
      text != oldDelegate.text || color != oldDelegate.color || query != oldDelegate.query ||
      current != oldDelegate.current || hits.length != oldDelegate.hits.length;
}
