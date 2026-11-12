import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 파일 왼쪽 위 끝에 걸쳐 있는 작은 책갈피 모양 즐겨찾기 표시.
/// 꺼져 있으면 빈 책갈피가 살짝 위로 올라가 있고, 켜지면 살짝 내려오면서 노랗게 바뀐다.
/// 누르거나, 아래로 잡아당기면(살짝 늘어남) 즐겨찾기가 켜지고/꺼진다.
/// 부모가 위쪽을 잘라(clip) 주면 책갈피가 위 테두리에 꽂혀 있는 것처럼 보인다.
class FavoriteRibbon extends StatefulWidget {
  const FavoriteRibbon({super.key, required this.active, this.onTap, this.width = 14, this.height = 22, this.onImage = false, this.isDark = false, this.extraHitArea = 0});

  final bool active;
  final VoidCallback? onTap;
  final double width;
  final double height;

  /// 표지(그림) 위에 놓일 때: 어떤 그림 위에서도 보이도록 흰 테두리 + 옅은 그림자
  final bool onImage;
  final bool isDark;

  /// 누르는 범위를 오른쪽·아래로 이만큼 더 넓힘 (책갈피 위치는 그대로)
  final double extraHitArea;

  /// 앱 설정 '책갈피 애니메이션 끄기': 잡아당기는 움직임 없이 누르면 바로 켜고 끔
  static final ValueNotifier<bool> animationOff = ValueNotifier<bool>(false);

  @override
  State<FavoriteRibbon> createState() => _FavoriteRibbonState();
}

class _FavoriteRibbonState extends State<FavoriteRibbon> with SingleTickerProviderStateMixin {
  @override
  void initState() {
    super.initState();
    FavoriteRibbon.animationOff.addListener(_onAnimSetting);
  }

  void _onAnimSetting() {
    if (mounted) setState(() {});
  }

  /// 잡아당겨 늘어난 길이 (손을 떼면 0으로 돌아감)
  late final AnimationController _pull = AnimationController(vsync: this, lowerBound: 0, upperBound: double.infinity, value: 0);
  bool _armed = false; // 충분히 당겨서 손을 떼면 켜고/끄는 상태

  /// 꺼져 있을 때 위로 올라가 있는 정도
  double get _lift => widget.height * 0.32;
  double get _maxPull => widget.height * 0.55;
  double get _trigger => widget.height * 0.3;

  @override
  void dispose() {
    FavoriteRibbon.animationOff.removeListener(_onAnimSetting);
    _pull.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails d) {
    // 당길수록 덜 늘어나는 느낌 (끝까지 당겨도 살짝만)
    final double raw = (_pull.value + d.delta.dy * 0.6).clamp(0.0, _maxPull * 1.6).toDouble();
    final double eased = raw <= _maxPull ? raw : _maxPull + (raw - _maxPull) * 0.25;
    _pull.value = eased;
    final bool armed = _pull.value >= _trigger;
    if (armed != _armed) {
      _armed = armed;
      if (armed) HapticFeedback.selectionClick();
    }
  }

  void _onDragEnd([DragEndDetails? _]) {
    if (_armed) widget.onTap?.call();
    _armed = false;
    _pull.animateTo(0, duration: const Duration(milliseconds: 260), curve: Curves.easeOutBack);
  }

  @override
  Widget build(BuildContext context) {
    final Color outline = widget.onImage ? Colors.white : (widget.isDark ? Colors.white60 : Colors.black45);
    final Color emptyFill = widget.onImage ? Colors.black26 : Colors.transparent;
    final bool still = FavoriteRibbon.animationOff.value;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onTap,
      onVerticalDragUpdate: still ? null : _onDragUpdate,
      onVerticalDragEnd: still ? null : _onDragEnd,
      onVerticalDragCancel: still ? null : _onDragEnd,
      // 위로 올라간 부분만 잘라서 파일 칸 위로 튀어나오지 않게 함 (아래로 늘어나는 부분은 보이게)
      // (Stack의 clip은 Transform으로 옮긴 그림을 자르지 못함)
      child: ClipRect(
        clipper: const _ClipAbove(),
        child: SizedBox(
          width: widget.width + 14 + widget.extraHitArea,
          height: widget.height + 8 + widget.extraHitArea,
          child: Padding(
            padding: const EdgeInsets.only(left: 7),
            child: Align(
              alignment: Alignment.topLeft,
              child: TweenAnimationBuilder<double>(
                tween: Tween<double>(end: widget.active ? 1.0 : 0.0),
                duration: still ? Duration.zero : const Duration(milliseconds: 280),
                curve: Curves.easeOutBack,
                builder: (context, t, _) {
                  final double c = t.clamp(0.0, 1.0).toDouble();
                  return AnimatedBuilder(
                    animation: _pull,
                    builder: (context, _) {
                      final double stretch = _pull.value;
                      return Transform.translate(
                        offset: Offset(0, -_lift * (1 - t)),
                        child: CustomPaint(
                          size: Size(widget.width, widget.height),
                          painter: _RibbonPainter(
                            fill: Color.lerp(emptyFill, Colors.amber, c)!,
                            stroke: Color.lerp(outline, const Color(0xFFE0A000), c)!,
                            shadow: widget.onImage,
                            stretch: stretch,
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// 위쪽만 자르고 옆·아래는 넉넉히 보이게 하는 자르기
class _ClipAbove extends CustomClipper<Rect> {
  const _ClipAbove();

  @override
  Rect getClip(Size size) => Rect.fromLTRB(-size.width, 0, size.width * 2, size.height * 3);

  @override
  bool shouldReclip(_ClipAbove oldClipper) => false;
}

class _RibbonPainter extends CustomPainter {
  _RibbonPainter({required this.fill, required this.stroke, required this.shadow, this.stretch = 0});

  final Color fill;
  final Color stroke;
  final bool shadow;

  /// 아래로 늘어난 길이
  final double stretch;

  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width, h = size.height + stretch;
    final double sw = (w * 0.13).clamp(1.2, 2.0).toDouble();
    // 위쪽은 테두리 밖으로 이어지도록 조금 더 위에서 시작
    final path = Path()
      ..moveTo(sw / 2, -sw)
      ..lineTo(w - sw / 2, -sw)
      ..lineTo(w - sw / 2, h - sw / 2)
      ..lineTo(w / 2, h - w * 0.42)
      ..lineTo(sw / 2, h - sw / 2)
      ..close();
    if (shadow) {
      canvas.drawShadow(path, Colors.black54, 1.5, false);
    }
    canvas.drawPath(path, Paint()..color = fill);
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = sw
        ..strokeJoin = StrokeJoin.round
        ..color = stroke,
    );
  }

  @override
  bool shouldRepaint(_RibbonPainter old) => old.fill != fill || old.stroke != stroke || old.shadow != shadow || old.stretch != stretch;
}
