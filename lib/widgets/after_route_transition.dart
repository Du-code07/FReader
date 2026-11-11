import 'package:flutter/material.dart';

/// 화면이 넘어오는 애니메이션이 끝난 뒤에 무거운 화면(WebView 등)을 만든다.
/// 넘어오는 동안 WebView를 만들고 문서를 읽기 시작하면 전환 애니메이션이 버벅이기 때문.
class AfterRouteTransition extends StatefulWidget {
  const AfterRouteTransition({super.key, required this.builder, this.placeholder});

  final WidgetBuilder builder;
  final Widget? placeholder;

  @override
  State<AfterRouteTransition> createState() => _AfterRouteTransitionState();
}

class _AfterRouteTransitionState extends State<AfterRouteTransition> {
  Animation<double>? _animation;
  bool _ready = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_ready) return;
    final animation = ModalRoute.of(context)?.animation;
    if (animation == null || animation.status == AnimationStatus.completed) {
      _ready = true;
      return;
    }
    if (!identical(animation, _animation)) {
      _animation?.removeStatusListener(_onStatus);
      _animation = animation..addStatusListener(_onStatus);
    }
  }

  void _onStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed && mounted && !_ready) {
      _animation?.removeStatusListener(_onStatus);
      setState(() => _ready = true);
    }
  }

  @override
  void dispose() {
    _animation?.removeStatusListener(_onStatus);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _ready ? widget.builder(context) : (widget.placeholder ?? const SizedBox.expand());
}
