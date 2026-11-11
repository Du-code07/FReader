import 'package:flutter/material.dart';

/// [전체] 그룹 아이콘: 평소에는 작대기 3개가 나란히 있다가,
/// 그룹 목록을 펼치면([spread]) 한 칸씩 비켜 엇갈리게 바뀐다.
class GroupStackIcon extends StatelessWidget {
  const GroupStackIcon({super.key, this.size = 18, this.color, this.spread = false});

  final double size;
  final Color? color;
  final bool spread;

  @override
  Widget build(BuildContext context) {
    final Color c = color ?? IconTheme.of(context).color ?? Theme.of(context).colorScheme.onSurface;
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(end: spread ? 1.0 : 0.0),
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
      builder: (context, t, _) => SizedBox.square(dimension: size, child: CustomPaint(painter: _GroupStackPainter(c, t))),
    );
  }
}

class _GroupStackPainter extends CustomPainter {
  _GroupStackPainter(this.color, this.spread);

  final Color color;
  final double spread; // 0: 나란히, 1: 엇갈림

  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.shortestSide;
    final double barH = s * 0.17;
    final double barW = s * 0.66;
    final Paint fill = Paint()..color = color;
    for (int i = 0; i < 3; i++) {
      final double aligned = (1 - 0.66) / 2; // 가운데 맞춤
      final double staggered = 0.06 + i * 0.12; // 위에서부터 한 칸씩 오른쪽으로
      final double x = s * (aligned + (staggered - aligned) * spread);
      final double y = s * (0.17 + i * 0.25);
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x, y, barW, barH), Radius.circular(barH / 2)), fill);
    }
  }

  @override
  bool shouldRepaint(_GroupStackPainter old) => old.color != color || old.spread != spread;
}
