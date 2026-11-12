import 'dart:math' as math;

import 'package:flutter/material.dart';

/// 빠른 메뉴 항목
class QuickArcMenuItem {
  const QuickArcMenuItem({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.closeAfterTap = false,
  });

  final Widget icon;
  final String tooltip;
  final VoidCallback onTap;

  /// 누른 뒤 메뉴를 닫을지 여부 (파일 이동·화면 잠금처럼 화면이 바뀌는 기능)
  final bool closeAfterTap;
}

/// 오른쪽 아래 흰 동그라미 버튼 + 그 주위로 호(활) 모양으로 펼쳐지는 아이콘 메뉴.
/// - 동그라미를 누르면 열림/닫힘
/// - 호 위를 손가락으로 밀면 아이콘이 호를 따라 돌아가며 나머지 아이콘이 나타남
///
/// - 닫혀 있을 때는 상자 맨 아래쪽(진행바 바로 위)에 붙어 있다가, 열리면 호가 진행바에
///   닿지 않을 만큼 위로 올라가며 펼쳐진다.
///
/// 이 위젯은 화면 아래 모서리에 Positioned(right 또는 left, bottom)로 배치하는 것을 전제로 한다.
/// [leftSide]가 true면 왼쪽 아래에 두는 것으로 보고 호를 좌우 반전해서 그린다.
class QuickArcMenu extends StatefulWidget {
  const QuickArcMenu({super.key, required this.items, this.leftSide = false, this.initialFirstIndex = 0});

  final List<QuickArcMenuItem> items;
  final bool leftSide;

  /// 메뉴를 열 때 호의 시작(아래쪽)에 먼저 보일 항목 번호. 앞 항목들은 호를 밀면 나타난다.
  final int initialFirstIndex;

  /// 메뉴 상자 높이 (열렸을 때 호가 차지하는 높이). 다른 UI가 이 영역을 비켜 가도록 할 때 사용.
  static double get boxHeight => _QuickArcMenuState._boxH;

  @override
  State<QuickArcMenu> createState() => _QuickArcMenuState();
}

class _QuickArcMenuState extends State<QuickArcMenu>
    with TickerProviderStateMixin {
  // ── 모양 (전체적으로 작게) ──
  static const double _toggleRadius = 22.0; // 도구 모음 버튼(사각형 4개 아이콘) 터치 영역 반지름
  static const double _arcRadius = 78.0; // 버튼 중심 ~ 아이콘 중심 거리
  static const double _itemRadius = 17.0; // 아이콘 버튼 반지름
  static const double _itemIconSize = 18.0; // 아이콘 그림 크기
  static const double _bandWidth = 40.0; // 호 띠 두께

  // 호가 보이는 각도 범위 (화면 좌표: 0°=오른쪽, 90°=아래, 180°=왼쪽, 270°=위)
  // 동그라미 왼쪽 약간 아래(170°)에서 시작해 동그라미 바로 위(270°)까지
  static const double _startDeg = 170.0;
  static const double _endDeg = 270.0;
  static const double _stepDeg = 25.0; // 아이콘 간격 → 한 번에 5개 보임

  // 띠가 그려지는 실제 각도 범위 (양 끝 둥근 부분 포함)
  static const double _bandStartDeg = _startDeg - _stepDeg * 0.5;
  static const double _bandEndDeg = _endDeg + _stepDeg * 0.4;

  // 상자 크기: 띠 전체(양 끝 포함)가 상자 안에 들어오도록 계산 → 아래/오른쪽이 잘리지 않음
  static final double _rightPad =
      math.max(_toggleRadius, _arcRadius * math.cos(_bandEndDeg * math.pi / 180.0) + _bandWidth / 2) + 4.0;
  static final double _bottomPad =
      math.max(_toggleRadius, _arcRadius * math.sin(_bandStartDeg * math.pi / 180.0) + _bandWidth / 2) + 4.0;
  static final double _boxW = _arcRadius + _bandWidth / 2 + 4.0 + _rightPad;
  static final double _boxH = _arcRadius + _bandWidth / 2 + 4.0 + _bottomPad;

  // 닫혔을 때 버튼 중심 ~ 상자 아래 끝 거리 (진행바에 살짝 붙어 있도록)
  static const double _closedBottomPad = _toggleRadius;

  late final AnimationController _openCtrl = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 200));
  late final AnimationController _snapCtrl = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 160));

  bool _open = false;
  double _scrollDeg = 0.0; // 호를 따라 밀어낸 각도
  double? _lastPanDeg;
  double _snapFrom = 0.0;
  double _snapTo = 0.0;

  // 열림 정도(t: 0=닫힘, 1=열림)에 따라 버튼 중심이 위로 올라간다
  Offset _centerAt(double t) {
    final double cx = widget.leftSide ? _rightPad : _boxW - _rightPad;
    final double cy = _boxH - (_closedBottomPad + (_bottomPad - _closedBottomPad) * t);
    return Offset(cx, cy);
  }

  Offset get _center => _centerAt(Curves.easeOutCubic.transform(_openCtrl.value));

  /// 내부 각도(오른쪽 배치 기준) <-> 화면 각도. 왼쪽 배치면 좌우 반전(180°-θ).
  double _toScreenDeg(double deg) {
    if (!widget.leftSide) return deg;
    double r = 180.0 - deg;
    if (r < 0) r += 360.0;
    return r;
  }

  double get _maxScrollDeg {
    final double needed =
        (widget.items.length - 1) * _stepDeg - (_endDeg - _startDeg);
    return math.max(0.0, needed);
  }

  /// 열 때 먼저 보일 위치로 스크롤 각도를 맞춘다
  void _resetScroll() {
    _snapCtrl.stop();
    _scrollDeg = (widget.initialFirstIndex * _stepDeg).clamp(0.0, _maxScrollDeg).toDouble();
  }

  @override
  void initState() {
    super.initState();
    _resetScroll();
    _snapCtrl.addListener(() {
      final t = Curves.easeOut.transform(_snapCtrl.value);
      setState(() => _scrollDeg = _snapFrom + (_snapTo - _snapFrom) * t);
    });
  }

  @override
  void dispose() {
    _openCtrl.dispose();
    _snapCtrl.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() {
      _open = !_open;
      if (_open) _resetScroll(); // 열 때마다 정해진 항목부터 보이게
    });
    if (_open) {
      _openCtrl.forward();
    } else {
      _openCtrl.reverse();
    }
  }

  void _close() {
    if (!_open) return;
    setState(() => _open = false);
    _openCtrl.reverse();
  }

  double _angleOf(Offset local) {
    final d = local - _center;
    double deg = math.atan2(d.dy, d.dx) * 180.0 / math.pi;
    if (deg < 0) deg += 360.0;
    return _toScreenDeg(deg); // 좌우 반전은 그 자체가 역변환
  }

  void _onPanStart(DragStartDetails d) {
    _snapCtrl.stop();
    _lastPanDeg = _angleOf(d.localPosition);
  }

  void _onPanUpdate(DragUpdateDetails d) {
    final double cur = _angleOf(d.localPosition);
    final double? last = _lastPanDeg;
    _lastPanDeg = cur;
    if (last == null) return;
    double delta = cur - last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    // 손가락을 따라 아이콘이 움직이도록: 손가락 각도가 커지면 아이콘 각도도 커짐(= 스크롤 각도 감소)
    setState(() =>
        _scrollDeg = (_scrollDeg - delta).clamp(0.0, _maxScrollDeg).toDouble());
  }

  void _onPanEnd(DragEndDetails d) {
    _lastPanDeg = null;
    // 아이콘이 칸에 딱 맞게 정렬되도록 가까운 위치로 살짝 이동
    final double target = ((_scrollDeg / _stepDeg).round() * _stepDeg)
        .clamp(0.0, _maxScrollDeg)
        .toDouble();
    if ((target - _scrollDeg).abs() < 0.5) return;
    _snapFrom = _scrollDeg;
    _snapTo = target;
    _snapCtrl.forward(from: 0.0);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _boxW,
      height: _boxH,
      // 띠·아이콘 어디서 밀어도 호를 따라 이동 (빈 공간은 본문으로 통과)
      child: GestureDetector(
        behavior: HitTestBehavior.deferToChild,
        onPanStart: _open ? _onPanStart : null,
        onPanUpdate: _open ? _onPanUpdate : null,
        onPanEnd: _open ? _onPanEnd : null,
        child: AnimatedBuilder(
          animation: _openCtrl,
          builder: (context, _) {
            final double t = Curves.easeOutCubic.transform(_openCtrl.value);
            final Offset center = _centerAt(t);
            final List<Widget> children = [];

            if (t > 0.0) {
              // 호 모양 배경 띠 (띠 위를 밀어서 아이콘 이동)
              children.add(Positioned.fill(
                child: CustomPaint(
                  painter: _ArcBandPainter(
                    center: center,
                    mirrored: widget.leftSide,
                    // 더 넘길 아이콘이 없는 끝에는 양옆과 같은 선으로 끝을 막아 준다
                    startCap: (1.0 - _scrollDeg / _stepDeg).clamp(0.0, 1.0).toDouble(),
                    endCap: (1.0 - (_maxScrollDeg - _scrollDeg) / _stepDeg).clamp(0.0, 1.0).toDouble(),
                    radius: _arcRadius * t,
                    bandWidth: _bandWidth,
                    startDeg: _bandStartDeg,
                    endDeg: _bandEndDeg,
                    opacity: t,
                  ),
                ),
              ));

              for (int i = 0; i < widget.items.length; i++) {
                final double deg = _startDeg + i * _stepDeg - _scrollDeg;
                // 보이는 범위 밖으로 나간 아이콘은 서서히 사라짐
                final double outside = deg < _startDeg
                    ? (_startDeg - deg)
                    : (deg > _endDeg ? deg - _endDeg : 0.0);
                final double fade = (1.0 - outside / (_stepDeg * 0.6))
                    .clamp(0.0, 1.0)
                    .toDouble();
                if (fade <= 0.01) continue;
                final double rad = _toScreenDeg(deg) * math.pi / 180.0;
                final Offset p = center +
                    Offset(math.cos(rad), math.sin(rad)) * (_arcRadius * t);
                final item = widget.items[i];
                children.add(Positioned(
                  key: ValueKey('arc_item_$i'),
                  left: p.dx - _itemRadius,
                  top: p.dy - _itemRadius,
                  width: _itemRadius * 2,
                  height: _itemRadius * 2,
                  child: Opacity(
                    opacity: (fade * t).clamp(0.0, 1.0).toDouble(),
                    child: IgnorePointer(
                      ignoring: !_open || fade < 0.6,
                      child: Tooltip(
                        message: item.tooltip,
                        child: Material(
                          color: Colors.transparent, // 아이콘 뒤 회색 동그라미 없음 (누를 때 물결 효과만 표시)
                          shape: const CircleBorder(),
                          clipBehavior: Clip.antiAlias,
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () {
                              item.onTap();
                              if (item.closeAfterTap) _close();
                            },
                            child: Center(
                              child: SizedBox.square(
                                dimension: _itemIconSize,
                                child: FittedBox(fit: BoxFit.contain, child: item.icon),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ));
              }
            }

            // 도구 모음 버튼 (둥근 사각형 4개 아이콘, 열리면 45° 회전 + 노란색, 닫히면 흰색)
            final Color toggleColor = Color.lerp(Colors.white, const Color(0xFFFFB300), t)!;
            children.add(Positioned(
              left: center.dx - _toggleRadius,
              top: center.dy - _toggleRadius,
              width: _toggleRadius * 2,
              height: _toggleRadius * 2,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: _toggle,
                child: Center(
                  child: Transform.rotate(
                    angle: (widget.leftSide ? -t : t) * math.pi / 4,
                    child: CustomPaint(size: const Size.square(30), painter: _GridIconPainter(toggleColor)),
                  ),
                ),
              ),
            ));

            return Stack(clipBehavior: Clip.none, children: children);
          },
        ),
      ),
    );
  }
}

class _ArcBandPainter extends CustomPainter {
  _ArcBandPainter({
    required this.center,
    required this.radius,
    required this.bandWidth,
    required this.startDeg,
    required this.endDeg,
    required this.opacity,
    this.mirrored = false,
    this.startCap = 0.0,
    this.endCap = 0.0,
  });

  final Offset center;
  final bool mirrored;

  /// 끝 막음 선의 진하기 (0~1). 내부 각도 기준 시작(아래쪽)/끝(위쪽)
  final double startCap;
  final double endCap;
  final double radius;
  final double bandWidth;
  final double startDeg;
  final double endDeg;
  final double opacity;

  @override
  void paint(Canvas canvas, Size size) {
    if (radius <= 1) return;
    final rect = Rect.fromCircle(center: center, radius: radius);
    // 좌우 반전이면 각도 범위가 (180-end) ~ (180-start)가 된다
    final double startScreen = mirrored ? 180.0 - endDeg : startDeg;
    final double start = startScreen * math.pi / 180.0;
    final double sweep = (endDeg - startDeg) * math.pi / 180.0;
    final band = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = bandWidth
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xFF3A3A3C).withValues(alpha: 0.94 * opacity); // 흰/검은 배경 모두 구분되는 짙은 회색
    canvas.drawArc(rect, start, sweep, false, band);
    final outline = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..color = Colors.white.withValues(alpha: 0.30 * opacity);
    canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius + bandWidth / 2),
        start,
        sweep,
        false,
        outline);
    canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - bandWidth / 2),
        start,
        sweep,
        false,
        outline);

    // 끝 막음 선: 띠의 둥근 끝을 따라 반원 모양으로 (양옆 선과 같은 색)
    void drawCap(double screenDeg, bool forward, double strength) {
      if (strength <= 0.01) return;
      final double rad = screenDeg * math.pi / 180.0;
      final Offset p = center + Offset(math.cos(rad), math.sin(rad)) * radius;
      final capPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0
        ..color = Colors.white.withValues(alpha: 0.30 * opacity * strength);
      canvas.drawArc(Rect.fromCircle(center: p, radius: bandWidth / 2), rad, forward ? math.pi : -math.pi, false, capPaint);
    }

    final double endScreen = startScreen + (endDeg - startDeg);
    // 좌우 반전이면 화면상 시작/끝과 내부 시작/끝이 서로 바뀐다
    drawCap(endScreen, true, mirrored ? startCap : endCap);
    drawCap(startScreen, false, mirrored ? endCap : startCap);
  }

  // 띠 영역에서만 터치를 받고, 나머지 빈 공간은 아래 화면(본문)으로 통과시킨다
  @override
  bool? hitTest(Offset position) {
    final d = position - center;
    final double dist = d.distance;
    if ((dist - radius).abs() > bandWidth / 2 + 4) return false;
    double deg = math.atan2(d.dy, d.dx) * 180.0 / math.pi;
    if (mirrored) deg = 180.0 - deg;
    while (deg < 0) {
      deg += 360.0;
    }
    while (deg >= 360.0) {
      deg -= 360.0;
    }
    return deg >= startDeg - 12 && deg <= endDeg + 12;
  }

  @override
  bool shouldRepaint(covariant _ArcBandPainter old) =>
      old.radius != radius ||
      old.opacity != opacity ||
      old.center != center ||
      old.mirrored != mirrored ||
      old.startCap != startCap ||
      old.endCap != endCap;
}

/// 도구 모음 버튼 아이콘: 둥근 사각형 4개 (2×2)
/// 닫힘 = 흰색, 열림 = 노란색. 흰 배경에서도 보이도록 어두운 테두리 + 옅은 그림자
class _GridIconPainter extends CustomPainter {
  const _GridIconPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width;
    final double gap = s * 0.10;
    final double cell = (s - gap) / 2;
    final radius = Radius.circular(cell * 0.38);
    final fill = Paint()..color = color;
    final outline = Paint()
      ..color = const Color(0xE6000000)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    final shadow = Paint()
      ..color = const Color(0x55000000)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2.0);
    for (int r = 0; r < 2; r++) {
      for (int c = 0; c < 2; c++) {
        final rect = RRect.fromRectAndRadius(Rect.fromLTWH(c * (cell + gap), r * (cell + gap), cell, cell), radius);
        canvas.drawRRect(rect.shift(const Offset(0, 1)), shadow);
        canvas.drawRRect(rect, fill);
        canvas.drawRRect(rect, outline);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _GridIconPainter oldDelegate) => oldDelegate.color != color;
}

/// [trigger] 값이 바뀔 때마다 아이콘을 살짝 흔든다 (눌렀다는 반응 표시)
class WiggleOnChange extends StatefulWidget {
  const WiggleOnChange({super.key, required this.trigger, required this.child});

  final int trigger;
  final Widget child;

  @override
  State<WiggleOnChange> createState() => _WiggleOnChangeState();
}

class _WiggleOnChangeState extends State<WiggleOnChange> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 520));

  @override
  void didUpdateWidget(WiggleOnChange oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.trigger != widget.trigger) _ctrl.forward(from: 0.0);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      child: widget.child,
      builder: (context, child) {
        final double t = _ctrl.value;
        // 회전 방향으로 한 번 크게(약 25°), 되돌아오며 점점 작게 흔들림
        final double angle = math.sin(t * math.pi * 3) * (1.0 - t) * 0.45;
        return Transform.rotate(angle: angle, child: child);
      },
    );
  }
}

/// 도구 모음 '바' 형태: 화면 아래에 둥근 가로 막대로 아이콘을 한 줄로 늘어놓음
/// (아이콘이 많으면 옆으로 밀어서 봄). 누르면 그 기능을 바로 실행
class QuickToolBar extends StatelessWidget {
  const QuickToolBar({super.key, required this.items, this.onClose});

  final List<QuickArcMenuItem> items;

  /// 누른 항목이 메뉴를 닫는 항목일 때 부름 (상단바·진행바도 함께 숨김)
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: const Color(0xEE1C1C1E),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
        boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 10, offset: Offset(0, 3))],
      ),
      child: LayoutBuilder(
        builder: (context, c) {
          // 아이콘 사이를 좁게 (한 칸 40), 화면보다 길면 옆으로 밀어서 봄
          const double slot = 40;
          final row = Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final it in items)
                SizedBox(
                  width: slot,
                  height: 52,
                  child: IconButton(
                    padding: EdgeInsets.zero,
                    icon: IconTheme.merge(data: const IconThemeData(color: Colors.white, size: 20), child: it.icon),
                    tooltip: it.tooltip,
                    onPressed: () {
                      it.onTap();
                      if (it.closeAfterTap) onClose?.call();
                    },
                  ),
                ),
            ],
          );
          return ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: row,
            ),
          );
        },
      ),
    );
  }
}
