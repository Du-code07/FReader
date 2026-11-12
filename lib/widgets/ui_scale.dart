import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

/// 태블릿(짧은 변 600 이상)에서만 앱 화면 전체를 조금 크게 보여 준다:
/// 보통 글자(14pt)가 2pt 커지는 만큼(16/14배). 휴대폰은 그대로.
/// 책 본문(문서·사진 화면)은 [UiUnscale]로 감싸 원래 선명도·크기 그대로 둔다.
class UiScale extends InheritedWidget {
  const UiScale({super.key, required this.scale, required super.child});
  final double scale;

  static double of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<UiScale>()?.scale ?? 1.0;

  /// 태블릿으로 보는 짧은 변 (dp)
  static const double tabletShortestSide = 600;

  static double scaleFor(Size size) => size.shortestSide >= tabletShortestSide ? 16 / 14 : 1.0;

  @override
  bool updateShouldNotify(UiScale old) => old.scale != scale;
}

MediaQueryData _scaledMq(MediaQueryData mq, double f) => mq.copyWith(
      size: mq.size * f,
      padding: mq.padding * f,
      viewPadding: mq.viewPadding * f,
      viewInsets: mq.viewInsets * f,
      systemGestureInsets: mq.systemGestureInsets * f,
    );

Widget _scaleBox(BuildContext context, double f, Widget child, MediaQueryData data) {
  return LayoutBuilder(
    builder: (context, c) {
      final double w = c.maxWidth, h = c.maxHeight;
      if (!w.isFinite || !h.isFinite) return child;
      return Transform.scale(
        scale: f,
        alignment: Alignment.topLeft,
        child: OverflowBox(
          alignment: Alignment.topLeft,
          minWidth: w / f,
          maxWidth: w / f,
          minHeight: h / f,
          maxHeight: h / f,
          child: MediaQuery(data: data, child: child),
        ),
      );
    },
  );
}

/// 앱 전체를 크게 보이게 (MaterialApp.builder에서 감쌈)
class UiScaleBox extends StatelessWidget {
  const UiScaleBox({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final double s = UiScale.scaleFor(mq.size);
    if ((s - 1).abs() < 0.02) return UiScale(scale: 1, child: child);
    return UiScale(scale: s, child: _scaleBox(context, s, child, _scaledMq(mq, 1 / s)));
  }
}

/// 크게 보이게 한 화면 안에서 이 부분만 원래 크기로 (책 본문)
class UiUnscale extends StatelessWidget {
  const UiUnscale({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final double s = UiScale.of(context);
    if ((s - 1).abs() < 0.02) return child;
    final mq = MediaQuery.of(context);
    return UiScale(scale: 1, child: _scaleBox(context, 1 / s, child, _scaledMq(mq, s)));
  }
}

/// 화면 전체 좌표(실제 크기)를 크게 보이게 한 화면의 좌표로
Offset uiScaledPosition(BuildContext context, Offset global) {
  final s = UiScale.of(context);
  return s == 1 ? global : global / math.max(0.01, s);
}

/// 크게 보이게 한 화면에서 끌어 옮기는 항목(그룹 칩 등)이 손가락 밑에 그대로 있게 바로잡기.
/// 플러터의 순서 바꾸기 목록은 끄는 그림의 자리를 화면 전체 좌표로 계산해 오버레이에 그대로 넣기 때문에,
/// 앱 전체를 [scale]배로 키운 상태에서는 손가락에서 점점 벗어난다. 이 상자가 그 차이만큼 그림을 옮긴다.
/// [grab]: 항목 안에서 손가락이 닿은 자리(항목 기준, 확대 전 단위)
/// [dropT]: 놓은 뒤 제자리로 돌아가는 중이면 그 진행 값(1→0), 끄는 중이면 null
class UiScaleDragFix extends SingleChildRenderObjectWidget {
  const UiScaleDragFix({super.key, required this.scale, required this.grab, this.dropT, required super.child});
  final double scale;
  final Offset grab;
  final double? dropT;

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderUiScaleDragFix(scale, grab, dropT, Overlay.maybeOf(context)?.context.findRenderObject());

  @override
  void updateRenderObject(BuildContext context, _RenderUiScaleDragFix r) {
    r
      ..scale = scale
      ..grab = grab
      ..dropT = dropT
      ..overlay = Overlay.maybeOf(context)?.context.findRenderObject();
    r.markNeedsPaint();
  }
}

class _RenderUiScaleDragFix extends RenderProxyBox {
  _RenderUiScaleDragFix(this.scale, this.grab, this.dropT, this.overlay);
  double scale;
  Offset grab;
  double? dropT;
  RenderObject? overlay;

  Offset _fix() {
    final o = overlay;
    if ((scale - 1).abs() < 0.02 || o == null || !o.attached || !attached) return Offset.zero;
    // 오버레이 안에서 지금 놓인 자리
    final Offset at = MatrixUtils.transformPoint(getTransformTo(o), Offset.zero);
    final double k = dropT == null ? 1.0 : Curves.easeOut.transform(dropT!.clamp(0.0, 1.0));
    return (at + grab * k) * (1 / scale - 1);
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    if (child != null) context.paintChild(child!, offset + _fix());
  }

  @override
  void applyPaintTransform(RenderBox child, Matrix4 transform) {
    final f = _fix();
    transform.translateByDouble(f.dx, f.dy, 0, 1);
  }

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) => false;
}
