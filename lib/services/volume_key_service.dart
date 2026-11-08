import 'dart:async';
import 'package:flutter/services.dart';

class VolumeKeyService {
  static const MethodChannel _methodChannel = MethodChannel('ebook_reader/volume_control');
  static const EventChannel _eventChannel = EventChannel('ebook_reader/volume_events');

  static int _activeListenerCount = 0;
  StreamSubscription? _subscription;
  bool _isRegistered = false;

  Future<void> startListening({
    required VoidCallback onVolumeUp,
    required VoidCallback onVolumeDown,
    VoidCallback? onVolumeBothUnlock,
    VoidCallback? onShakeToggle,
    VoidCallback? onSpenSinglePress,
    VoidCallback? onSpenDoublePress,
    VoidCallback? onSpenDoubleRevert,
  }) async {
    if (!_isRegistered) {
      _isRegistered = true;
      _activeListenerCount++;
    }
    try {
      await _methodChannel.invokeMethod('setIntercept', {'enabled': true});
    } catch (_) {}

    await _subscription?.cancel();
    _subscription = _eventChannel.receiveBroadcastStream().listen((event) {
      if (event == 'UP') {
        onVolumeUp();
      } else if (event == 'DOWN') {
        onVolumeDown();
      } else if (event == 'VOL_BOTH_UNLOCK') {
        onVolumeBothUnlock?.call();
      } else if (event == 'SHAKE_TOGGLE' || event == 'SHAKE_LOCK_TOGGLE') {
        onShakeToggle?.call();
      } else if (event == 'SPEN_SINGLE') {
        onSpenSinglePress?.call();
      } else if (event == 'SPEN_DOUBLE') {
        onSpenDoublePress?.call();
      } else if (event == 'SPEN_DOUBLE_REVERT') {
        if (onSpenDoubleRevert != null) {
          onSpenDoubleRevert();
        } else {
          onSpenDoublePress?.call();
        }
      }
    });
  }

  /// 뷰어 내에서 화면 잠금 활성화 또는 다이얼로그/시트 닫힘 후 가로채기 상태를 재확인할 때 호출
  Future<void> ensureInterceptActive() async {
    if (_isRegistered) {
      try {
        await _methodChannel.invokeMethod('setIntercept', {'enabled': true});
      } catch (_) {}
    }
  }

  Future<void> stopListening() async {
    await _subscription?.cancel();
    _subscription = null;
    if (_isRegistered) {
      _isRegistered = false;
      _activeListenerCount = (_activeListenerCount - 1).clamp(0, 100);
    }
    try {
      if (_activeListenerCount == 0) {
        await _methodChannel.invokeMethod('setIntercept', {'enabled': false});
      } else {
        await _methodChannel.invokeMethod('setIntercept', {'enabled': true});
      }
    } catch (_) {}
  }
}
