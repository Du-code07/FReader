import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../services/storage_service.dart';

typedef MemoTr = String Function(String ko, String en, String zh, String ja);

// ─────────────────────────────────────────────────────────────────────────────
// 되돌리기 / 다시 실행 기록
// 페이지(또는 EPUB 위치)별로 '바뀌기 전 필기'를 저장해 두고 순서대로 되돌린다.
class MemoHistory {
  static const int _maxDepth = 60;
  final Map<Object, List<_HistoryEntry>> _undo = {};
  final Map<Object, List<_HistoryEntry>> _redo = {};
  int _seq = 0;

  /// 필기가 바뀌기 직전의 상태를 기록 (새 동작이 생기면 다시 실행 기록은 사라짐)
  void record(Object key, List<MemoStroke> before) {
    final stack = _undo.putIfAbsent(key, () => []);
    stack.add(_HistoryEntry(++_seq, List<MemoStroke>.unmodifiable(before)));
    if (stack.length > _maxDepth) stack.removeAt(0);
    _redo.remove(key);
  }

  bool canUndo(Iterable<Object> keys) => keys.any((k) => _undo[k]?.isNotEmpty ?? false);
  bool canRedo(Iterable<Object> keys) => keys.any((k) => _redo[k]?.isNotEmpty ?? false);

  /// 보이는 페이지들 중 가장 최근에 바뀐 곳을 되돌린다. 반환: (페이지 키, 되돌린 필기)
  (Object, List<MemoStroke>)? undo(Iterable<Object> keys, List<MemoStroke> Function(Object key) current) {
    final key = _latest(_undo, keys);
    if (key == null) return null;
    final entry = _undo[key]!.removeLast();
    _redo.putIfAbsent(key, () => []).add(_HistoryEntry(++_seq, List<MemoStroke>.unmodifiable(current(key))));
    return (key, entry.strokes);
  }

  /// 가장 최근에 되돌린 것을 다시 실행한다.
  (Object, List<MemoStroke>)? redo(Iterable<Object> keys, List<MemoStroke> Function(Object key) current) {
    final key = _latest(_redo, keys);
    if (key == null) return null;
    final entry = _redo[key]!.removeLast();
    _undo.putIfAbsent(key, () => []).add(_HistoryEntry(++_seq, List<MemoStroke>.unmodifiable(current(key))));
    return (key, entry.strokes);
  }

  Object? _latest(Map<Object, List<_HistoryEntry>> map, Iterable<Object> keys) {
    Object? best;
    int bestSeq = -1;
    for (final k in keys) {
      final s = map[k];
      if (s == null || s.isEmpty) continue;
      if (s.last.seq > bestSeq) {
        bestSeq = s.last.seq;
        best = k;
      }
    }
    return best;
  }
}

class _HistoryEntry {
  _HistoryEntry(this.seq, this.strokes);
  final int seq;
  final List<MemoStroke> strokes;
}

// ─────────────────────────────────────────────────────────────────────────────
// 메모바 아이콘 버튼 (누르기 + 꾹 누르기)
/// 메모 도구모음의 모든 도구가 쓰는 같은 크기의 칸 (간격을 똑같이 맞추기 위함)
const double kMemoToolExtent = 40.0;

class MemoToolButton extends StatelessWidget {
  const MemoToolButton({
    super.key,
    this.icon,
    this.iconBuilder,
    required this.label,
    this.onTap,
    this.onReselect,
    this.active = false,
    this.enabled = true,
    this.dotColor,
    this.color,
  });

  final IconData? icon;

  /// 기본 아이콘에 없는 모양(예: 지우개)을 직접 그릴 때 사용
  final Widget Function(Color color)? iconBuilder;
  final String label;
  final VoidCallback? onTap;

  /// 이미 선택된(active) 상태에서 한 번 더 눌렀을 때 (버튼 위치를 기준으로 메뉴를 띄울 수 있도록 context 전달)
  final void Function(BuildContext buttonContext)? onReselect;
  final bool active;
  final bool enabled;

  /// 아이콘 왼쪽 작은 점 (현재 펜 색상 표시)
  final Color? dotColor;

  /// 기본(흰색) 대신 쓸 아이콘 색 (예: 필기 전체 지우기 = 빨강)
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final Color color = !enabled ? Colors.white30 : (active ? Colors.amber : (this.color ?? Colors.white));
    return Semantics(
      button: true,
      label: label,
      child: InkResponse(
        radius: 18, // 누를 때 퍼지는 효과가 칸(40) 안에 머물도록
        onTap: !enabled
            ? null
            : () {
                if (active && onReselect != null) {
                  onReselect!(context);
                } else {
                  onTap?.call();
                }
              },
        child: SizedBox(
          width: kMemoToolExtent,
          height: kMemoToolExtent,
          child: Stack(
            alignment: Alignment.center,
            children: [
              iconBuilder != null ? iconBuilder!(color) : Icon(icon, color: color, size: 18),
              // 펜 색: 펜 몸통 왼쪽에 살짝 띄워서
              if (dotColor != null)
                Positioned(
                  left: 3,
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: dotColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white70, width: 0.8),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 메모 도구모음의 '완료' 버튼. 아이콘 칸과 같은 높이·좌우 여백을 써서 간격을 맞춘다.
class MemoDoneButton extends StatelessWidget {
  const MemoDoneButton({super.key, required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: InkResponse(
        radius: 18,
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: kMemoToolExtent, minHeight: kMemoToolExtent),
          child: Padding(
            // 18px 아이콘이 40px 칸 안에서 갖는 좌우 여백(11px)과 같게
            padding: const EdgeInsets.symmetric(horizontal: 11),
            child: Center(
              widthFactor: 1,
              heightFactor: 1,
              child: Text(label, style: const TextStyle(color: Colors.amber, fontSize: 14, fontWeight: FontWeight.w600)),
            ),
          ),
        ),
      ),
    );
  }
}

/// 메모 도구모음 바탕. [vertical]이면 세로(왼쪽/오른쪽 배치), 아니면 가로(상단/하단 배치).
class MemoToolbar extends StatelessWidget {
  const MemoToolbar({super.key, required this.children, this.vertical = false});

  final List<Widget> children;
  final bool vertical;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black87,
      borderRadius: BorderRadius.circular(24),
      elevation: 6,
      // 아이콘을 누를 때 퍼지는 효과가 도구모음 밖으로 나가지 않게 자름
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: vertical ? const EdgeInsets.symmetric(horizontal: 4, vertical: 8) : const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: SingleChildScrollView(
          scrollDirection: vertical ? Axis.vertical : Axis.horizontal,
          child: Flex(
            direction: vertical ? Axis.vertical : Axis.horizontal,
            mainAxisSize: MainAxisSize.min,
            children: children,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 지우개 종류 선택 (지우개 아이콘을 꾹 눌렀을 때)
// 'area' = 닿은 부분만 지움, 'stroke' = 닿은 획 전체를 지움
// 메모바를 가리지 않도록 메모바 바로 위에, 지우개 아이콘 위치에 맞춰 띄운다.
Future<String?> showEraserTypeMenu(BuildContext buttonContext, String current, MemoTr tr, {String barPos = 'bottom'}) {
  final box = buttonContext.findRenderObject() as RenderBox;
  final overlay = Overlay.of(buttonContext).context.findRenderObject() as RenderBox;
  final Offset btnTopLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
  const double menuWidth = 220.0;
  const double gapAboveBar = 22.0; // 메모바 바깥 여백 (메모바 안쪽 여백 4 + 간격 18)
  const double gapBesideBar = 26.0; // 세로 메모바일 때 옆 여백 (안쪽 여백 8 + 간격 18)
  const double menuHeight = 2 * 48.0; // 메뉴 두 줄 높이(대략)
  final Size ov = overlay.size;
  final double centerX = btnTopLeft.dx + box.size.width / 2;
  final double centerY = btnTopLeft.dy + box.size.height / 2;
  final double hLeft = (centerX - menuWidth / 2).clamp(8.0, ov.width - menuWidth - 8.0).toDouble();
  final double vTop = (centerY - menuHeight / 2).clamp(8.0, math.max(8.0, ov.height - menuHeight - 8.0)).toDouble();
  // 메모바가 있는 쪽의 반대편(화면 안쪽)으로 메뉴를 띄운다
  double? left, right, top, bottom;
  switch (barPos) {
    case 'top':
      left = hLeft;
      top = btnTopLeft.dy + box.size.height + gapAboveBar;
      break;
    case 'left':
      left = btnTopLeft.dx + box.size.width + gapBesideBar;
      top = vTop;
      break;
    case 'right':
      right = ov.width - btnTopLeft.dx + gapBesideBar;
      top = vTop;
      break;
    default:
      left = hLeft;
      bottom = ov.height - btnTopLeft.dy + gapAboveBar;
  }

  Widget row(BuildContext ctx, String value, IconData icon, String text) => InkWell(
        onTap: () => Navigator.pop(ctx, value),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 20, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 15))),
              if (current == value) const Icon(Icons.check, size: 18, color: Colors.amber),
            ],
          ),
        ),
      );

  return showGeneralDialog<String>(
    context: buttonContext,
    barrierDismissible: true,
    barrierLabel: tr('닫기', 'Close', '关闭', '閉じる'),
    barrierColor: Colors.transparent,
    transitionDuration: const Duration(milliseconds: 120),
    transitionBuilder: (ctx, anim, _, child) => FadeTransition(opacity: anim, child: child),
    pageBuilder: (ctx, _, __) => Stack(
      children: [
        Positioned(
          left: left,
          right: right,
          top: top,
          bottom: bottom,
          width: menuWidth,
          child: Material(
            color: const Color(0xFF2B2B2E),
            elevation: 8,
            borderRadius: BorderRadius.circular(16),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                row(ctx, 'stroke', Icons.gesture, tr('획 지우개', 'Stroke Eraser', '笔画橡皮擦', 'ストローク消しゴム')),
                row(ctx, 'area', Icons.blur_on, tr('영역 지우개', 'Area Eraser', '区域橡皮擦', '部分消しゴム')),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 펜 설정 창 (펜 아이콘을 꾹 눌렀을 때): 선 굵기 + 색상
/// 맨 앞(빨강)이 기본 펜 색
const List<Color> kMemoPenColors = [
  Colors.redAccent,
  Colors.amber,
  Colors.lightBlueAccent,
  Colors.greenAccent,
  Colors.white,
  Colors.black,
];

const List<Color> kMemoPenMoreColors = [
  Color(0xFFD50000),
  Color(0xFFFF6D00),
  Color(0xFFFFD600),
  Color(0xFF64DD17),
  Color(0xFF00BFA5),
  Color(0xFF0091EA),
  Color(0xFF2962FF),
  Color(0xFF6200EA),
  Color(0xFFC51162),
  Color(0xFFFF80AB),
  Color(0xFF8D6E63),
  Color(0xFF9E9E9E),
  Color(0xFF455A64),
  Color(0xFF1B5E20),
  Color(0xFF0D47A1),
  Color(0xFF4A148C),
];

Future<void> showPenSettingsPanel({
  required BuildContext context,
  required Color color,
  required double width,
  required ValueChanged<Color> onColorChanged,
  required ValueChanged<double> onWidthChanged,
  required MemoTr tr,
}) {
  return showDialog<void>(
    context: context,
    barrierColor: Colors.black26,
    builder: (ctx) => _PenSettingsPanel(
      initialColor: color,
      initialWidth: width,
      onColorChanged: onColorChanged,
      onWidthChanged: onWidthChanged,
      tr: tr,
    ),
  );
}

class _PenSettingsPanel extends StatefulWidget {
  const _PenSettingsPanel({
    required this.initialColor,
    required this.initialWidth,
    required this.onColorChanged,
    required this.onWidthChanged,
    required this.tr,
  });

  final Color initialColor;
  final double initialWidth;
  final ValueChanged<Color> onColorChanged;
  final ValueChanged<double> onWidthChanged;
  final MemoTr tr;

  @override
  State<_PenSettingsPanel> createState() => _PenSettingsPanelState();
}

class _PenSettingsPanelState extends State<_PenSettingsPanel> {
  static const double _minW = 0.5;
  static const double _maxW = 20.0;
  static const double _stepW = 0.5;
  static const Color _panelColor = Color(0xFF2B2B2E);

  late Color _color = widget.initialColor;
  late double _width = widget.initialWidth.clamp(_minW, _maxW).toDouble();
  late bool _showMore = !kMemoPenColors.any((c) => c.toARGB32() == widget.initialColor.toARGB32());

  void _setWidth(double w) {
    final double v = ((w / _stepW).round() * _stepW).clamp(_minW, _maxW).toDouble();
    if (v == _width) return;
    setState(() => _width = v);
    widget.onWidthChanged(v);
  }

  void _setColor(Color c) {
    setState(() => _color = c);
    widget.onColorChanged(c);
  }

  String get _widthLabel => _width == _width.roundToDouble() ? _width.toStringAsFixed(0) : _width.toStringAsFixed(1);

  Widget _colorDot(Color c, {double size = 34}) {
    final bool selected = c.toARGB32() == _color.toARGB32();
    final bool light = c.computeLuminance() > 0.6;
    return GestureDetector(
      onTap: () => _setColor(c),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: c,
          shape: BoxShape.circle,
          border: Border.all(color: selected ? Colors.white : Colors.white24, width: selected ? 2.4 : 1.0),
        ),
        child: selected ? Icon(Icons.check, size: size * 0.55, color: light ? Colors.black : Colors.white) : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tr = widget.tr;
    return Dialog(
      backgroundColor: _panelColor,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 머리줄: 제목 + 닫기
              Row(
                children: [
                  const Icon(Icons.edit, color: Colors.white, size: 22),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      tr('펜 설정', 'Pen Settings', '笔设置', 'ペン設定'),
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                  Material(
                    color: Colors.white12,
                    shape: const CircleBorder(),
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 22),
                      tooltip: tr('닫기', 'Close', '关闭', '閉じる'),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // 미리보기 선
              Container(
                height: 56,
                decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(14)),
                child: CustomPaint(painter: _PenPreviewPainter(color: _color, width: _width)),
              ),
              const SizedBox(height: 18),
              // 선 굵기
              Text(tr('선 굵기', 'Thickness', '线条粗细', '線の太さ'),
                  style: const TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 6),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove, color: Colors.white),
                    tooltip: tr('가늘게', 'Thinner', '变细', '細く'),
                    onPressed: () => _setWidth(_width - _stepW),
                  ),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 22,
                        activeTrackColor: Colors.white24,
                        inactiveTrackColor: Colors.white12,
                        thumbColor: const Color(0xFF6E6E73),
                        overlayColor: Colors.white10,
                        thumbShape: _NumberThumbShape(label: _widthLabel),
                        trackShape: const RoundedRectSliderTrackShape(),
                      ),
                      child: Slider(
                        value: _width,
                        min: _minW,
                        max: _maxW,
                        divisions: ((_maxW - _minW) / _stepW).round(),
                        onChanged: _setWidth,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add, color: Colors.white),
                    tooltip: tr('굵게', 'Thicker', '变粗', '太く'),
                    onPressed: () => _setWidth(_width + _stepW),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              // 색상
              Text(tr('색상', 'Color', '颜色', '色'), style: const TextStyle(color: Colors.white70, fontSize: 13)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  ...kMemoPenColors.map(_colorDot),
                  // 더 많은 색상 펼치기
                  GestureDetector(
                    onTap: () => setState(() => _showMore = !_showMore),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: _showMore ? Colors.white : Colors.white38, width: 1.4),
                      ),
                      child: const _PaletteDots(),
                    ),
                  ),
                ],
              ),
              if (_showMore) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: kMemoPenMoreColors.map((c) => _colorDot(c, size: 30)).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _PaletteDots extends StatelessWidget {
  const _PaletteDots();

  @override
  Widget build(BuildContext context) {
    const colors = [Colors.red, Colors.orange, Colors.yellow, Colors.green, Colors.blue, Colors.purple];
    return Padding(
      padding: const EdgeInsets.all(7),
      child: Wrap(
        spacing: 2,
        runSpacing: 2,
        alignment: WrapAlignment.center,
        children: colors
            .map((c) => Container(width: 5.5, height: 5.5, decoration: BoxDecoration(color: c, shape: BoxShape.circle)))
            .toList(),
      ),
    );
  }
}

class _PenPreviewPainter extends CustomPainter {
  _PenPreviewPainter({required this.color, required this.width});
  final Color color;
  final double width;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = width
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final double w = size.width, h = size.height;
    final path = Path()
      ..moveTo(w * 0.12, h * 0.62)
      ..cubicTo(w * 0.30, h * 0.10, w * 0.45, h * 0.95, w * 0.62, h * 0.45)
      ..cubicTo(w * 0.72, h * 0.18, w * 0.80, h * 0.30, w * 0.88, h * 0.42);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _PenPreviewPainter old) => old.color != color || old.width != width;
}

/// 숫자가 들어간 둥근 손잡이 (사진 속 '5' 손잡이 모양)
class _NumberThumbShape extends SliderComponentShape {
  const _NumberThumbShape({required this.label});
  final String label;
  static const double _r = 19.0;

  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) => const Size.fromRadius(_r);

  @override
  void paint(
    PaintingContext context,
    Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    required bool isDiscrete,
    required TextPainter labelPainter,
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required TextDirection textDirection,
    required double value,
    required double textScaleFactor,
    required Size sizeWithOverflow,
  }) {
    final canvas = context.canvas;
    canvas.drawCircle(center, _r, Paint()..color = const Color(0xFF6E6E73));
    canvas.drawCircle(
      center,
      _r,
      Paint()
        ..color = Colors.white24
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );
    final tp = TextPainter(
      text: TextSpan(
        text: label,
        // 앱 글꼴을 그대로 쓰도록 슬라이더 테마의 글자 스타일을 기반으로 함
        style: (sliderTheme.valueIndicatorTextStyle ?? const TextStyle())
            .copyWith(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 지우개 모양 아이콘 (비스듬한 지우개 + 고무 부분 채움 + 바닥 선)
class EraserIcon extends StatelessWidget {
  const EraserIcon({super.key, required this.color, this.size = 18});
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) =>
      CustomPaint(size: Size.square(size), painter: _EraserIconPainter(color));
}

class _EraserIconPainter extends CustomPainter {
  _EraserIconPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width;
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = s * 0.085
      ..strokeJoin = StrokeJoin.round;
    final fill = Paint()..color = color;

    canvas.save();
    canvas.translate(s * 0.52, s * 0.44);
    canvas.rotate(-0.785398); // -45°
    final body = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset.zero, width: s * 0.86, height: s * 0.40),
      Radius.circular(s * 0.09),
    );
    // 고무(지우는 쪽) 부분 채우기: 왼쪽 약 40%
    canvas.save();
    canvas.clipRRect(body);
    canvas.drawRect(Rect.fromLTWH(-s * 0.43, -s * 0.20, s * 0.34, s * 0.40), fill);
    canvas.restore();
    canvas.drawRRect(body, stroke);
    canvas.restore();

    // 바닥 선
    canvas.drawLine(Offset(s * 0.36, s * 0.90), Offset(s * 0.92, s * 0.90), stroke..strokeCap = StrokeCap.round);
  }

  @override
  bool shouldRepaint(covariant _EraserIconPainter old) => old.color != color;
}

/// 깃펜 아이콘 (테두리 깃털 + 결)
/// - 메모 아이콘([ink] 없음): 펜촉 옆에 S 모양 잉크 자국 (테두리와 같은 색)
/// - 펜 설정 아이콘([ink] 있음): 왼쪽 위에 잉크병, 병 안 색 = 지금 펜 색
class QuillInkIcon extends StatelessWidget {
  const QuillInkIcon({super.key, required this.color, this.ink, this.size = 24});

  /// 테두리 색 (선택되면 노랑)
  final Color color;

  /// 잉크병 안 색 (펜 설정 아이콘). 없으면 메모 아이콘(S 모양 자국)
  final Color? ink;
  final double size;

  @override
  Widget build(BuildContext context) => SizedBox.square(dimension: size, child: CustomPaint(painter: _QuillInkPainter(color, ink)));
}

class _QuillInkPainter extends CustomPainter {
  _QuillInkPainter(this.color, this.ink);

  final Color color;
  final Color? ink;

  /// 깃털: 오른쪽 위 끝에서 왼쪽 아래 깃대로, 가장자리에 갈라진 홈 두 곳 (펜촉은 (3.2, 20.6))
  static final Path _feather = Path()
    ..moveTo(22.6, 1.4)
    ..cubicTo(17.0, 2.0, 12.6, 4.6, 10.4, 8.0) // 위쪽 가장자리
    ..lineTo(11.6, 8.6)
    ..cubicTo(9.6, 10.2, 8.2, 12.4, 7.4, 14.6)
    ..lineTo(8.8, 14.6)
    ..cubicTo(7.6, 16.0, 6.6, 17.4, 5.8, 18.6) // 아래 끝(깃대 쪽)
    ..cubicTo(9.0, 18.4, 12.0, 17.0, 13.8, 14.8) // 아래쪽 가장자리
    ..lineTo(12.4, 14.4)
    ..cubicTo(15.0, 13.0, 16.8, 11.0, 17.8, 8.8)
    ..lineTo(16.4, 8.8)
    ..cubicTo(19.6, 6.8, 21.6, 4.2, 22.6, 1.4)
    ..close();

  Paint _stroke(double width) => Paint()
    ..color = color
    ..style = PaintingStyle.stroke
    ..strokeWidth = width
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;

  /// 깃털 + 가운데 줄기(깃대·펜촉). [scale]만큼 줄여 그릴 때도 선 굵기는 그대로 보이게
  void _drawQuill(Canvas canvas, double scale) {
    final line = _stroke(1.6 / scale);
    canvas.drawPath(_feather, Paint()..color = color.withValues(alpha: 0.16));
    canvas.drawPath(_feather, line);
    canvas.drawLine(const Offset(20.4, 3.6), const Offset(3.2, 20.6), line);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final double u = size.width / 24.0;
    canvas.save();
    canvas.scale(u);
    final Color? bottleInk = ink;
    if (bottleInk == null) {
      // 메모 아이콘: 뒤집힌 S 글자를 다 쓴 끝(오른쪽 아래)에 펜촉이 있고, 글자는 깃펜 뒤(왼쪽 위)로 남음
      canvas.drawPath(
        Path()
          ..moveTo(1.0, 13.8)
          ..cubicTo(2.2, 12.0, 6.4, 12.2, 6.2, 14.9)
          ..cubicTo(6.0, 17.2, 1.0, 16.9, 1.2, 19.2)
          ..cubicTo(1.4, 21.4, 6.2, 21.6, 7.2, 19.8),
        _stroke(1.9),
      );
      const double s = 0.82;
      canvas.save();
      canvas.translate(7.2, 19.8); // 새 펜촉 자리 = S를 다 쓴 끝
      canvas.scale(s);
      canvas.translate(-3.2, -20.6); // 원래 펜촉 자리
      _drawQuill(canvas, s);
      canvas.restore();
    } else {
      _drawQuill(canvas, 1);
      // 펜 설정 아이콘: 왼쪽 위 잉크병 (깃털과 살짝 띄움), 병 안은 지금 펜 색
      final body = RRect.fromRectAndRadius(const Rect.fromLTWH(0.6, 4.4, 6.6, 5.4), const Radius.circular(1.8));
      canvas.drawRRect(body, Paint()..color = bottleInk);
      canvas.drawRRect(body, _stroke(1.4));
      canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(2.4, 1.6, 3.0, 2.8), const Radius.circular(0.8)), Paint()..color = color);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_QuillInkPainter old) => old.color != color || old.ink != ink;
}

/// 손으로 글씨 쓰기 아이콘: 손가락 끝에서 선이 그어지는 모양
class FingerDrawIcon extends StatelessWidget {
  const FingerDrawIcon({super.key, required this.color, this.size = 22});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // 손가락으로 그은 선 (손가락 끝에서 왼쪽 아래로 물결)
          Positioned.fill(child: CustomPaint(painter: _FingerLinePainter(color))),
          // 검지를 세운 손 (오른쪽 아래)
          Positioned(
            right: -size * 0.06,
            bottom: -size * 0.06,
            child: Icon(Icons.pan_tool_alt, size: size * 0.78, color: color),
          ),
        ],
      ),
    );
  }
}

class _FingerLinePainter extends CustomPainter {
  _FingerLinePainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final double u = size.width / 24.0;
    canvas.save();
    canvas.scale(u);
    final path = Path()
      ..moveTo(14.4, 7.6) // 손가락 끝
      ..cubicTo(12.0, 3.0, 7.2, 2.4, 5.8, 5.8)
      ..cubicTo(4.6, 9.0, 8.8, 10.2, 7.6, 13.4)
      ..cubicTo(6.8, 15.6, 3.8, 15.8, 1.6, 14.6);
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.8
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_FingerLinePainter old) => old.color != color;
}
