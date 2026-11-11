import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

/// 위/아래로 밀어서 페이지 넘기기 (손가락을 따라 페이지가 위·아래로 움직임)
/// - 위로 밀면: 지금 페이지가 위로 올라가고 다음 페이지가 아래에서 올라옴
/// - 아래로 밀면: 지금 페이지가 아래로 내려가고 이전 페이지가 위에서 내려옴
/// - 조금만 밀고 놓으면 제자리로 돌아감
/// - [up]에 seamless: true를 주면, 밀리는 동안 화면 쪽에서 다음(이전) 페이지를 미리 그려 둔 것으로 보고
///   끝까지 민 뒤 페이지만 바꾼다 (가로로 넘길 때처럼 다음 장이 따라 들어옴)
///
/// 사용법: 뷰어의 Listener에서 [down]/[move]/[up]을 호출하고,
/// 페이지 영역을 Transform.translate(offset: Offset(0, swipe.offset))로 감싼다.
class VerticalPageSwipe extends ChangeNotifier {
  VerticalPageSwipe({required TickerProvider vsync})
      : _anim = AnimationController(vsync: vsync) {
    _anim.addListener(() {
      final double t = _curve.transform(_anim.value);
      offset = _from + (_to - _from) * t;
      notifyListeners();
    });
  }

  final AnimationController _anim;
  double _from = 0.0;
  double _to = 0.0;
  Curve _curve = Curves.easeOut;

  /// 페이지 영역에 적용할 세로 이동량
  double offset = 0.0;

  bool _busy = false; // 넘기는 애니메이션 진행 중
  int _pointers = 0;
  bool _multi = false;
  Offset? _start;
  Duration? _startTs;
  bool? _locked; // null: 아직 판단 전, true: 세로 밀기로 확정, false: 세로 밀기 아님
  double _velocity = 0.0; // px/s (아래쪽이 +)
  Offset? _lastPos;
  Duration? _lastTs;

  /// 이번 터치가 세로 밀기로 확정되었는지 (확정되면 탭/가로 스와이프 처리를 건너뛰는 데 사용)
  bool get isVerticalGesture => _locked == true;

  bool get isAnimating => _busy;

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  void down(PointerDownEvent e) {
    _pointers++;
    if (_pointers > 1) {
      _multi = true;
      if (_locked == true && !_busy) _animateTo(0.0, 160, Curves.easeOut);
      _locked = false;
      return;
    }
    _multi = false;
    _start = e.position;
    _startTs = e.timeStamp;
    _locked = null;
    _velocity = 0.0;
    _lastPos = e.position;
    _lastTs = e.timeStamp;
  }

  /// [enabled]: 지금 세로 밀기를 써도 되는 상황인지 (설정 켜짐, 확대 아님, 필기 중 아님 등)
  /// [canTurn]: 해당 방향(+1 다음, -1 이전)으로 넘길 페이지가 있는지 (없으면 움직이지 않음)
  void move(PointerMoveEvent e, {required bool enabled, required bool Function(int dir) canTurn}) {
    final start = _start;
    if (start == null || _multi || _busy) return;
    final Offset d = e.position - start;

    if (_locked == null && d.distance > 14.0) {
      // 실제 터치 시각으로 잰다 (화면이 잠깐 바빠 처리가 늦어도 길게 누른 것으로 오인하지 않도록)
      final int holdMs = (e.timeStamp - (_startTs ?? e.timeStamp)).inMilliseconds;
      // 길게 누른 뒤 끄는 동작(문장 선택 등)은 제외
      _locked = enabled && holdMs <= 450 && d.dy.abs() > d.dx.abs() * 1.2;
    }

    // 속도 계산
    final lastPos = _lastPos;
    final lastTs = _lastTs;
    if (lastPos != null && lastTs != null) {
      final double dt = (e.timeStamp - lastTs).inMicroseconds / 1e6;
      if (dt > 0) {
        final double v = (e.position.dy - lastPos.dy) / dt;
        _velocity = _velocity * 0.4 + v * 0.6;
      }
    }
    _lastPos = e.position;
    _lastTs = e.timeStamp;

    if (_locked != true) return;
    final int dir = d.dy < 0 ? 1 : -1;
    // 넘길 페이지가 없는 쪽(마지막 장에서 위로, 첫 장에서 아래로)은 페이지를 움직이지 않는다
    // (조금이라도 움직이면 아래의 빈 화면이 잠깐 드러남)
    offset = canTurn(dir) ? d.dy : 0.0;
    notifyListeners();
  }

  /// 손을 뗐을 때. [turnPage]는 페이지를 애니메이션 없이 바로 바꾸고, 다 바뀌면 끝나는 Future를 돌려줌.
  Future<void> up(
    PointerEvent e, {
    required double height,
    required bool Function(int dir) canTurn,
    required Future<void> Function(int dir) turnPage,
    bool cancelled = false,
    bool seamless = false,
  }) async {
    if (_pointers > 0) _pointers--;
    if (_pointers > 0) return;
    final start = _start;
    final bool wasVertical = _locked == true && !_multi;
    _start = null;
    _multi = false;
    if (!wasVertical || start == null || _busy) {
      _locked = null;
      if (offset != 0.0 && !_busy) await _animateTo(0.0, 160, Curves.easeOut);
      return;
    }

    final double dy = e.position.dy - start.dy;
    final int dir = dy < 0 ? 1 : -1;
    final bool fastFlick = dy.abs() > 30.0 && _velocity.abs() > 700.0 && (_velocity < 0) == (dy < 0);
    final bool farEnough = dy.abs() > (height * 0.15).clamp(60.0, 180.0);
    final bool commit = !cancelled && (fastFlick || farEnough) && canTurn(dir);

    _busy = true;
    try {
      if (!commit) {
        await _animateTo(0.0, 180, Curves.easeOut);
        return;
      }
      if (seamless) {
        // 다음(이전) 페이지가 이미 뒤따라 보이고 있으므로: 끝까지 밀어 올린 뒤 페이지만 바꾸고 제자리로
        await _animateTo(-dir * height, 230, Curves.easeOutCubic);
        await turnPage(dir);
        return;
      }
      // 1) 지금 페이지가 민 방향으로 화면 밖까지 이동
      await _animateTo(-dir * height, 140, Curves.easeIn);
      // 2) 페이지 바꾸기 (화면 밖에 있는 동안)
      await turnPage(dir);
      // 3) 새 페이지가 반대쪽에서 들어옴
      offset = dir * height;
      notifyListeners();
      await _animateTo(0.0, 190, Curves.easeOutCubic);
    } finally {
      _busy = false;
      _locked = null;
      if (offset != 0.0) {
        offset = 0.0;
        notifyListeners();
      }
    }
  }

  Future<void> _animateTo(double target, int ms, Curve curve) async {
    _from = offset;
    _to = target;
    _curve = curve;
    _anim.duration = Duration(milliseconds: ms);
    try {
      await _anim.forward(from: 0.0).orCancel;
    } on TickerCanceled {
      // 화면이 닫힌 경우 등
    }
    offset = target;
    notifyListeners();
  }
}

/// 손가락 종류가 S펜인지
bool isStylusPointer(PointerEvent e) =>
    e.kind == PointerDeviceKind.stylus || e.kind == PointerDeviceKind.invertedStylus;
