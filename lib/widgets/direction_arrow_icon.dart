import 'dart:math' as math;
import 'package:flutter/material.dart';

/// 읽기 방향 아이콘: 엇갈린 두 화살표(⇄). 위는 →(좌→우), 아래는 ←(우→좌).
/// 지금 읽는 방향의 화살표만 노란색.
class DirectionArrowIcon extends StatelessWidget {
  const DirectionArrowIcon({super.key, required this.rightToLeft, this.size = 22});

  final bool rightToLeft;
  final double size;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: size,
        height: size,
        child: CustomPaint(painter: _ArrowPainter(rightToLeft)),
      );
}

class _ArrowPainter extends CustomPainter {
  _ArrowPainter(this.rightToLeft);
  final bool rightToLeft;

  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width, h = size.height;
    final double stroke = math.max(1.6, w * 0.095);
    final double head = w * 0.2;
    const Color active = Colors.amber, idle = Colors.white;
    void arrow(double y, double from, double to, Color color) {
      final paint = Paint()
        ..color = color
        ..strokeWidth = stroke
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round;
      final double dir = (to - from).sign;
      canvas.drawLine(Offset(from, y), Offset(to, y), paint);
      canvas.drawPath(
        Path()
          ..moveTo(to - dir * head, y - head)
          ..lineTo(to, y)
          ..lineTo(to - dir * head, y + head),
        paint,
      );
    }
    // 위: 오른쪽을 가리킴 (오른쪽으로 치우침), 아래: 왼쪽을 가리킴 (왼쪽으로 치우침)
    arrow(h * 0.31, w * 0.30, w * 0.88, rightToLeft ? idle : active);
    arrow(h * 0.69, w * 0.70, w * 0.12, rightToLeft ? active : idle);
  }

  @override
  bool shouldRepaint(_ArrowPainter old) => old.rightToLeft != rightToLeft;
}
