import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

/// Flutter 기본 바텀시트 애니메이션 곡선 (showModalBottomSheet 기본값과 동일)
const Curve _kSheetCurve = Easing.legacyDecelerate;

/// 아래에서 올라오는 설정 창을 손가락으로 아래로 끌어 닫을 수 있게 해 주는 감싸개.
///
/// - 내용이 맨 위까지 올라가 있을 때 아래로 끌면 창 전체가 손가락을 따라 내려온다.
/// - 충분히 내리거나(창 높이의 25%) 빠르게 내리면 닫히고, 아니면 제자리로 돌아간다.
/// - 창을 끌어내리는 동안에는 안쪽 내용이 스크롤되지 않는다.
///
/// 사용법: showModalBottomSheet에 [controller]를 transitionAnimationController로 넘기고
/// enableDrag는 false로 둔다 (창 자체의 끌기와 겹치지 않도록).
class SheetPullToClose extends StatefulWidget {
  const SheetPullToClose({super.key, required this.controller, required this.builder});

  final AnimationController controller;
  final Widget Function(BuildContext context, ScrollController scrollController, ScrollPhysics physics) builder;

  @override
  State<SheetPullToClose> createState() => _SheetPullToCloseState();
}

class _SheetPullToCloseState extends State<SheetPullToClose> {
  final ScrollController _scroll = ScrollController();
  late final ScrollPhysics _physics = _PullAwareScrollPhysics(this, parent: const AlwaysScrollableScrollPhysics());

  int? _pointer;
  bool _pulling = false;
  double _pending = 0.0; // 끌기 시작 전 누적 이동 (손가락 떨림 무시용)
  double _pull = 0.0; // 창을 내린 거리
  VelocityTracker? _velocity;

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  double get _sheetHeight {
    final box = context.findRenderObject() as RenderBox?;
    final h = (box != null && box.hasSize) ? box.size.height : 0.0;
    return h > 1 ? h : 400.0;
  }

  bool get _atTop => !_scroll.hasClients || _scroll.position.pixels <= _scroll.position.minScrollExtent + 0.5;

  void _onDown(PointerDownEvent e) {
    if (_pointer != null) return;
    _pointer = e.pointer;
    _pulling = false;
    _pending = 0.0;
    _pull = 0.0;
    _velocity = VelocityTracker.withKind(e.kind)..addPosition(e.timeStamp, e.position);
  }

  void _onMove(PointerMoveEvent e) {
    if (e.pointer != _pointer) return;
    _velocity?.addPosition(e.timeStamp, e.position);
    final double dy = e.delta.dy;
    if (!_pulling) {
      if (dy > 0 && _atTop) {
        _pending += dy;
        if (_pending > kTouchSlop) {
          _pulling = true;
          _pull = _pending - kTouchSlop;
        }
      } else if (dy < 0) {
        _pending = 0.0;
      }
    } else {
      _pull = math.max(0.0, _pull + dy);
      if (_pull <= 0.0) {
        // 다시 끝까지 올렸으면 평소처럼 내용 스크롤로 돌아간다
        _pulling = false;
        _pending = 0.0;
        widget.controller.value = 1.0;
        return;
      }
    }
    if (_pulling) {
      widget.controller.value = _controllerValueFor((1.0 - _pull / _sheetHeight).clamp(0.0, 1.0).toDouble());
    }
  }

  /// 창 위치(보이는 비율)가 [shown]이 되도록 하는 컨트롤러 값.
  /// 창은 컨트롤러 값을 [_kSheetCurve]로 변환한 위치에 그려지므로 그 역함수를 구한다.
  /// (그래야 창이 손가락과 정확히 같은 거리만큼 움직인다)
  static double _controllerValueFor(double shown) {
    double lo = 0.0, hi = 1.0;
    for (int i = 0; i < 22; i++) {
      final double mid = (lo + hi) / 2;
      if (_kSheetCurve.transform(mid) < shown) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return (lo + hi) / 2;
  }

  void _onUp(PointerEvent e) {
    if (e.pointer != _pointer) return;
    _pointer = null;
    final bool wasPulling = _pulling;
    _pulling = false;
    _pending = 0.0;
    if (!wasPulling && _pull <= 0.0) return;
    final double vy = (e is PointerUpEvent) ? (_velocity?.getVelocity().pixelsPerSecond.dy ?? 0.0) : 0.0;
    final bool close = e is PointerUpEvent && (_pull > _sheetHeight * 0.25 || vy > 700.0);
    _pull = 0.0;
    if (close) {
      Navigator.of(context).maybePop();
    } else {
      widget.controller.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: _onDown,
      onPointerMove: _onMove,
      onPointerUp: _onUp,
      onPointerCancel: _onUp,
      child: widget.builder(context, _scroll, _physics),
    );
  }
}

/// 창을 끌어내리는 동안에는 내용 스크롤을 멈추는 스크롤 동작
class _PullAwareScrollPhysics extends ScrollPhysics {
  const _PullAwareScrollPhysics(this._owner, {super.parent});

  final _SheetPullToCloseState _owner;

  @override
  _PullAwareScrollPhysics applyTo(ScrollPhysics? ancestor) => _PullAwareScrollPhysics(_owner, parent: buildParent(ancestor));

  @override
  double applyPhysicsToUserOffset(ScrollMetrics position, double offset) {
    if (_owner._pulling) return 0.0;
    return super.applyPhysicsToUserOffset(position, offset);
  }
}

/// 설정 창이 닫히는 애니메이션이 끝난 뒤 컨트롤러를 정리한다.
void disposeSheetControllerWhenDone(AnimationController c) {
  if (c.isDismissed) {
    c.dispose();
    return;
  }
  late final AnimationStatusListener listener;
  listener = (status) {
    if (status == AnimationStatus.dismissed) {
      c.removeStatusListener(listener);
      c.dispose();
    }
  };
  c.addStatusListener(listener);
}
