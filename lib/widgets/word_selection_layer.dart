import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 그림(쪽 그림·TXT 종이) 위의 낱말 한 개: 글자와 자리(0~1, 이 층 크기 대비)
class SelectableWord {
  const SelectableWord(this.text, this.rect);
  final String text;
  final Rect rect;

  static SelectableWord? fromJson(Object? m) {
    if (m is! Map) return null;
    double v(Object? x) => (x as num?)?.toDouble() ?? 0;
    final t = '${m['t'] ?? ''}';
    if (t.isEmpty) return null;
    return SelectableWord(t, Rect.fromLTWH(v(m['x']), v(m['y']), v(m['w']), v(m['h'])));
  }
}

/// EPUB처럼 글을 길게 눌러 고르기: 길게 누르면 그 낱말이 골라지고, 손을 떼지 않고 끌면 범위가 늘어남.
/// 양쪽 손잡이로 범위를 고치고, 위에 뜬 '글자 복사'를 누르면 복사 창으로.
/// (그림으로 보여 주는 스크롤 보기·TXT에서 씀)
class WordSelectionLayer extends StatefulWidget {
  const WordSelectionLayer({
    super.key,
    required this.loadWords,
    required this.onCopy,
    required this.tr,
    required this.child,
    this.highlight = '',
  });

  /// 파일 내 단어 찾기에서 찾은 낱말을 형광펜으로 (빈 글이면 없음)
  final String highlight;

  final Future<List<SelectableWord>> Function() loadWords;
  final void Function(String text) onCopy;
  final String Function(String ko, String en, String zh, String ja) tr;
  final Widget child;

  /// 어느 쪽에서든 글이 골라져 있는가 (보는 화면이 탭으로 메뉴를 열지 않게)
  static final ValueNotifier<bool> active = ValueNotifier<bool>(false);
  static final List<VoidCallback> _clearers = [];
  static BuildContext? _activeContext;

  /// 이 화면 자리가 글을 골라 둔 쪽 안인가 (밖을 누르면 고른 글을 지움)
  static bool containsGlobal(Offset global) {
    final box = _activeContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.attached) return false;
    final local = box.globalToLocal(global);
    return (Offset.zero & box.size).inflate(40).contains(local);
  }

  /// 골라 둔 글을 모두 지움
  static void clearAll() {
    for (final c in List<VoidCallback>.of(_clearers)) {
      c();
    }
  }

  @override
  State<WordSelectionLayer> createState() => _WordSelectionLayerState();
}

class _WordSelectionLayerState extends State<WordSelectionLayer> {
  List<SelectableWord>? _words;
  int? _a, _b; // 고른 범위 (낱말 번호)
  bool _menu = false;
  Size _size = Size.zero;

  @override
  void initState() {
    super.initState();
    WordSelectionLayer._clearers.add(_clear);
    _loadForHighlight();
  }

  @override
  void didUpdateWidget(covariant WordSelectionLayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.highlight != widget.highlight) {
      _hlFor = null;
      _loadForHighlight();
    }
  }

  void _loadForHighlight() {
    if (widget.highlight.trim().isEmpty || _words != null) return;
    _ensureWords().then((_) {
      if (mounted) setState(() {});
    });
  }

  // 찾은 낱말 자리 (찾는 말이 바뀔 때만 다시 계산)
  String? _hlFor;
  List<Rect> _hlRects = const [];
  List<Rect> _highlightRects() {
    final q = widget.highlight.replaceAll(RegExp(r'\s+'), '').toLowerCase();
    final words = _words;
    if (q.isEmpty || words == null || words.isEmpty) return const [];
    if (_hlFor == q) return _hlRects;
    final owner = <int>[];
    final buf = StringBuffer();
    for (int i = 0; i < words.length; i++) {
      final t = words[i].text.replaceAll(RegExp(r'\s+'), '').toLowerCase();
      buf.write(t);
      for (int k = 0; k < t.length; k++) {
        owner.add(i);
      }
    }
    final all = buf.toString();
    final out = <Rect>[];
    for (int at = all.indexOf(q); at >= 0; at = all.indexOf(q, at + q.length)) {
      final a = owner[at], b = owner[at + q.length - 1];
      for (int i = a; i <= b; i++) {
        final w = words[i];
        // 낱말의 일부만 맞으면 그 부분만 (글자 수 비율로)
        final t = w.text.replaceAll(RegExp(r'\s+'), '');
        final start = i == a ? at - owner.indexOf(i) : 0;
        final end = i == b ? (at + q.length - 1) - owner.indexOf(i) + 1 : t.length;
        final r = w.rect;
        final n = t.isEmpty ? 1 : t.length;
        out.add(Rect.fromLTWH(r.left + r.width * start / n, r.top, r.width * (end - start) / n, r.height));
      }
    }
    _hlFor = q;
    _hlRects = out;
    return out;
  }

  @override
  void dispose() {
    WordSelectionLayer._clearers.remove(_clear);
    if (_a != null) WordSelectionLayer.active.value = false;
    super.dispose();
  }

  void _clear() {
    if (_a == null) return;
    if (WordSelectionLayer._activeContext == context) WordSelectionLayer._activeContext = null;
    if (mounted) {
      setState(() {
        _a = _b = null;
        _menu = false;
      });
    }
    WordSelectionLayer.active.value = false;
  }

  Future<List<SelectableWord>> _ensureWords() async {
    final w = _words;
    if (w != null) return w;
    try {
      _words = await widget.loadWords();
    } catch (_) {
      _words = const [];
    }
    return _words!;
  }

  /// 손가락 자리에서 가장 가까운 낱말 (같은 줄을 우선)
  int? _wordAt(Offset local) {
    final words = _words;
    if (words == null || words.isEmpty || _size.isEmpty) return null;
    final p = Offset(local.dx / _size.width, local.dy / _size.height);
    int? best;
    double bestD = double.infinity;
    for (int i = 0; i < words.length; i++) {
      final r = words[i].rect;
      final dx = p.dx < r.left ? r.left - p.dx : (p.dx > r.right ? p.dx - r.right : 0.0);
      final dy = p.dy < r.top ? r.top - p.dy : (p.dy > r.bottom ? p.dy - r.bottom : 0.0);
      final d = dx * dx * 0.25 + dy * dy * 4; // 위아래로 떨어진 줄은 더 멀게
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  int get _lo => (_a! < _b! ? _a : _b)!;
  int get _hi => (_a! < _b! ? _b : _a)!;

  String _selectedText() {
    final words = _words;
    if (words == null || _a == null) return '';
    final buf = StringBuffer();
    for (int i = _lo; i <= _hi; i++) {
      final w = words[i];
      if (i > _lo) {
        final prev = words[i - 1].rect;
        final newLine = w.rect.top > prev.bottom - prev.height * 0.3 || w.rect.left < prev.left - prev.height;
        if (newLine) {
          buf.write('\n');
        } else if (w.rect.left - prev.right > prev.height * 0.15) {
          buf.write(' ');
        }
      }
      buf.write(w.text);
    }
    return buf.toString();
  }

  Future<void> _start(Offset local) async {
    WordSelectionLayer.clearAll();
    await _ensureWords();
    final i = _wordAt(local);
    if (i == null || !mounted) return;
    HapticFeedback.selectionClick();
    setState(() {
      _a = _b = i;
      _menu = false;
    });
    WordSelectionLayer.active.value = true;
    WordSelectionLayer._activeContext = context;
  }

  void _extend(Offset local, {bool start = false}) {
    if (_a == null) return;
    final i = _wordAt(local);
    if (i == null) return;
    setState(() {
      if (start) {
        // 앞쪽 손잡이를 움직임: 큰 쪽은 그대로
        final hi = _hi;
        _a = hi;
        _b = i;
      } else {
        final lo = _lo;
        _a = lo;
        _b = i;
      }
    });
  }

  Rect _px(Rect r) => Rect.fromLTWH(r.left * _size.width, r.top * _size.height, r.width * _size.width, r.height * _size.height);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      _size = Size(c.maxWidth, c.maxHeight);
      final children = <Widget>[
        Positioned.fill(child: widget.child),
      ];
      final words = _words;
      final hl = _highlightRects();
      if (hl.isNotEmpty) {
        children.add(Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _SelectionPainter([for (final r in hl) _px(r)], color: const Color(0x77FFC107))))));
      }
      if (_a != null && words != null && words.isNotEmpty) {
        final rects = [for (int i = _lo; i <= _hi; i++) _px(words[i].rect)];
        children.add(Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _SelectionPainter(rects)))));
        final first = rects.first, last = rects.last;
        const double knob = 22;
        Widget handle(Offset at, bool start) => Positioned(
              left: at.dx - knob / 2,
              top: at.dy,
              width: knob,
              height: knob + 8,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onPanStart: (_) => setState(() => _menu = false),
                onPanUpdate: (d) {
                  final box = context.findRenderObject() as RenderBox?;
                  if (box == null) return;
                  _extend(box.globalToLocal(d.globalPosition) - Offset(0, first.height / 2 + 6), start: start);
                },
                onPanEnd: (_) => setState(() => _menu = true),
                child: const Align(alignment: Alignment.topCenter, child: _Knob()),
              ),
            );
        children.add(handle(first.bottomLeft, true));
        children.add(handle(last.bottomRight, false));
        if (_menu) {
          final top = rects.map((r) => r.top).reduce((a, b) => a < b ? a : b);
          final bottom = rects.map((r) => r.bottom).reduce((a, b) => a > b ? a : b);
          final double y = top > 56 ? top - 50 : bottom + 34;
          children.add(Positioned(
            left: 0,
            right: 0,
            top: y.clamp(0, (_size.height - 44).clamp(0, double.infinity)).toDouble(),
            child: Center(child: _menuBar()),
          ));
        }
      }
      return GestureDetector(
        behavior: HitTestBehavior.translucent,
        onLongPressStart: (d) => _start(d.localPosition),
        onLongPressMoveUpdate: (d) => _extend(d.localPosition),
        onLongPressEnd: (_) {
          if (_a != null) setState(() => _menu = true);
        },
        onTap: _a == null ? null : _clear,
        child: Stack(clipBehavior: Clip.none, children: children),
      );
    });
  }

  Widget _menuBar() {
    final dark = Theme.of(context).brightness == Brightness.dark;
    Widget item(String label, VoidCallback onTap) => InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: dark ? Colors.white : Colors.black87)),
          ),
        );
    return Material(
      elevation: 6,
      color: dark ? const Color(0xFF2B2B2F) : Colors.white,
      borderRadius: BorderRadius.circular(10),
      clipBehavior: Clip.antiAlias,
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        item(widget.tr('글자 복사', 'Copy Text', '复制文字', '文字をコピー'), () {
          final text = _selectedText();
          _clear();
          if (text.trim().isNotEmpty) widget.onCopy(text);
        }),
        Container(width: 1, height: 22, color: dark ? Colors.white24 : Colors.black12),
        item(widget.tr('전체 선택', 'Select All', '全选', 'すべて選択'), () {
          final words = _words;
          if (words == null || words.isEmpty) return;
          setState(() {
            _a = 0;
            _b = words.length - 1;
          });
        }),
      ]),
    );
  }
}

class _Knob extends StatelessWidget {
  const _Knob();
  @override
  Widget build(BuildContext context) => Container(
        width: 16,
        height: 16,
        decoration: const BoxDecoration(
          color: Color(0xFFFFA000),
          shape: BoxShape.circle,
          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 3)],
        ),
      );
}

class _SelectionPainter extends CustomPainter {
  _SelectionPainter(this.rects, {this.color = const Color(0x55FFC107)});
  final List<Rect> rects;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = color;
    for (final r in rects) {
      canvas.drawRect(r.inflate(1), p);
    }
  }

  @override
  bool shouldRepaint(_SelectionPainter old) => old.rects.length != rects.length || (rects.isNotEmpty && old.rects.first != rects.first) || (rects.isNotEmpty && old.rects.last != rects.last);
}
