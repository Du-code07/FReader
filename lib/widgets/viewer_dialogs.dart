import 'dart:math' as math;
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart' show DeviceGestureSettings;
import 'package:flutter/scheduler.dart';

typedef ViewerTr = String Function(String ko, String en, String zh, String ja);

/// 탭 모드에서 누른 자리: 위쪽은 메뉴, 아래 왼쪽은 이전 쪽, 아래 오른쪽은 다음 쪽.
/// 세로·가로 모두 위 2/3가 메뉴 자리, 아래 1/3이 이전/다음 쪽.
enum TapZone { menu, left, right }

TapZone tapZoneAt(Offset local, Size size) {
  // 세로·가로 모두: 위 2/3는 메뉴, 아래 1/3은 왼쪽 반 = 이전 / 오른쪽 반 = 다음
  final double menuBottom = size.height * 2 / 3;
  if (local.dy < menuBottom) return TapZone.menu;
  return local.dx < size.width / 2 ? TapZone.left : TapZone.right;
}

/// 가운데에 뜨는 둥근 창 (페이지 표시·화면 회전 등 짧은 고르기)
Future<T?> _centerDialog<T>(BuildContext context, Widget Function(BuildContext) builder) {
  return showGeneralDialog<T>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'close',
    barrierColor: Colors.black54,
    transitionDuration: const Duration(milliseconds: 160),
    pageBuilder: (ctx, _, __) => SafeArea(child: Center(child: builder(ctx))),
    transitionBuilder: (ctx, anim, _, child) => FadeTransition(
      opacity: anim,
      child: ScaleTransition(scale: Tween<double>(begin: 0.96, end: 1).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)), child: child),
    ),
  );
}

Widget _dialogFrame(BuildContext context, {required Widget child}) {
  final cs = Theme.of(context).colorScheme;
  return Material(
    color: cs.surfaceContainerHigh,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26), side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5))),
    clipBehavior: Clip.antiAlias,
    child: ConstrainedBox(
      constraints: BoxConstraints(maxWidth: math.min(440, MediaQuery.sizeOf(context).width - 40)),
      child: child,
    ),
  );
}

/// 페이지 표시: 한 페이지 / 두 페이지 / 자동. 누르면 바로 적용 ([onChanged]), '닫기'로 닫음
Future<void> showPageDisplayDialog(
  BuildContext context, {
  required String current,
  required ViewerTr tr,
  required ValueChanged<String> onChanged,
  bool scrollMode = false,
}) {
  String selected = current;
  return _centerDialog<void>(context, (ctx) {
    final cs = Theme.of(ctx).colorScheme;
    return StatefulBuilder(
      builder: (ctx, setState) => _dialogFrame(
        ctx,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(26, 26, 18, 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(tr('페이지 표시', 'Page Display', '页面显示', 'ページ表示'), style: const TextStyle(fontSize: 21, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(
                  scrollMode
                      ? tr('스크롤 모드에서는 바뀌지 않아요. 탭·슬라이드 모드에서 적용돼요.', 'Not applied in scroll mode. Applies in tap/slide mode.', '滚动模式下不变，在点击/滑动模式下生效。', 'スクロールモードでは変わりません。タップ・スライドモードで適用されます。')
                      : tr('탭·슬라이드 모드에서 적용돼요. 스크롤 모드의 표시는 바뀌지 않아요.', 'Applies in tap/slide mode. Scroll mode is not affected.', '在点击/滑动模式下生效，滚动模式不受影响。', 'タップ・スライドモードで適用されます。スクロールモードは変わりません。'),
                  style: TextStyle(fontSize: 14, height: 1.4, color: cs.onSurfaceVariant),
                ),
              ),
              const SizedBox(height: 8),
              for (final (value, label, sub) in <(String, String, String?)>[
                ('one', tr('한 페이지', 'One Page', '单页', '1ページ'), null),
                ('two', tr('두 페이지', 'Two Pages', '双页', '2ページ'), null),
                ('auto', tr('자동', 'Auto', '自动', '自動'),
                    tr('화면이 넓으면 두 페이지, 좁으면 한 페이지로 표시해요.', 'Two pages on wide screens, one on narrow screens.', '屏幕宽时显示双页，窄时显示单页。', '画面が広いと2ページ、狭いと1ページで表示します。')),
              ])
                InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () {
                    setState(() => selected = value);
                    onChanged(value);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      crossAxisAlignment: sub == null ? CrossAxisAlignment.center : CrossAxisAlignment.start,
                      children: [
                        Icon(
                          selected == value ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          size: 23,
                          color: selected == value ? cs.onSurface : cs.outline,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                              if (sub != null) Text(sub, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  style: TextButton.styleFrom(foregroundColor: cs.onSurface),
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: Text(tr('닫기', 'Close', '关闭', '閉じる'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  });
}

/// 화면 회전: 자동 / 세로 고정 / 가로 고정 ('auto' / 'portrait' / 'landscape'). '확인'을 누르면 돌려줌
Future<String?> showRotationDialog(BuildContext context, {required String current, required ViewerTr tr}) {
  String selected = current;
  return _centerDialog<String>(context, (ctx) {
    final cs = Theme.of(ctx).colorScheme;
    return StatefulBuilder(
      builder: (ctx, setState) => _dialogFrame(
        ctx,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 24, 22, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 14),
                child: Text(tr('화면 회전', 'Screen Rotation', '屏幕旋转', '画面回転'), style: const TextStyle(fontSize: 21, fontWeight: FontWeight.bold)),
              ),
              for (final value in const ['auto', 'portrait', 'landscape'])
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Material(
                    color: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: selected == value ? cs.onSurface.withValues(alpha: 0.7) : cs.outlineVariant.withValues(alpha: 0.6),
                        width: selected == value ? 1.6 : 1,
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => setState(() => selected = value),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Column(
                          children: [
                            Icon(rotationIcon(value), size: 27, color: selected == value ? cs.onSurface : cs.onSurfaceVariant),
                            const SizedBox(height: 6),
                            Text(
                              rotationLabel(value, tr),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: selected == value ? FontWeight.w700 : FontWeight.w500,
                                color: selected == value ? cs.onSurface : cs.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 4),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: cs.onSurface,
                    foregroundColor: cs.surface,
                    padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () => Navigator.of(ctx).pop(selected),
                  child: Text(tr('확인', 'OK', '确定', 'OK'), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  });
}

IconData rotationIcon(String mode) => switch (mode) {
      'portrait' => Icons.stay_current_portrait,
      'landscape' => Icons.stay_current_landscape,
      _ => Icons.screen_rotation,
    };

String rotationLabel(String mode, ViewerTr tr) => switch (mode) {
      'portrait' => tr('세로 고정', 'Portrait Lock', '锁定竖屏', '縦に固定'),
      'landscape' => tr('가로 고정', 'Landscape Lock', '锁定横屏', '横に固定'),
      _ => tr('자동', 'Auto', '自动', '自動'),
    };

/// 페이지 표시 아이콘
IconData pageDisplayIcon(String mode) => switch (mode) {
      'two' => Icons.menu_book,
      'auto' => Icons.auto_stories_outlined,
      _ => Icons.crop_portrait,
    };

/// 스크롤 모드: 쪽들을 간격 없이 세로로 이어 붙여 보여 주는 목록
class ContinuousPageController {
  _ContinuousPageListState? _state;

  /// [page]가 화면 맨 위에 오게
  void jumpToPage(int page) => _state?._jumpTo(page);

  /// 한 화면만큼 아래(+1)/위(-1)로 부드럽게
  void scrollByScreen(int dir) => _state?._scrollByScreen(dir);
}

class ContinuousPageList extends StatefulWidget {
  const ContinuousPageList({
    super.key,
    required this.count,
    required this.aspectOf,
    required this.pageBuilder,
    required this.initialPage,
    required this.onPageChanged,
    this.controller,
    this.background = Colors.black,
    this.zoomable = true,
    this.gap = 0,
    this.onLongPressPage,
  });

  /// 길게 누른 쪽 번호 (글자 복사 창 등)
  final ValueChanged<int>? onLongPressPage;

  final int count;

  /// 쪽의 높이/너비
  final double Function(int index) aspectOf;
  final Widget Function(BuildContext context, int index) pageBuilder;
  final int initialPage;
  final ValueChanged<int> onPageChanged;
  final ContinuousPageController? controller;
  final Color background;
  final bool zoomable;

  /// 쪽과 쪽 사이 빈칸 (확대 1배 기준)
  final double gap;

  @override
  State<ContinuousPageList> createState() => _ContinuousPageListState();
}

class _ContinuousPageListState extends State<ContinuousPageList> with SingleTickerProviderStateMixin {
  // 쪽 위치(확대 1배, 너비 = 화면 너비 기준). _tops[i]는 i번째 쪽의 위쪽 끝
  double _width = 0;
  double _height = 0;
  List<double> _tops = const [];
  int _current = -1;

  // 지금 보이는 자리: 확대 배율과 왼쪽 위 좌표(확대된 좌표)
  double _scale = 1;
  double _ox = 0;
  double _oy = 0;
  bool _placed = false;

  // 손가락 두 개로 벌리고 오므리기 / 한 손가락으로 끌기 (둘 다 여기서 직접 처리)
  double _startScale = 1;
  Offset _startContent = Offset.zero;
  int _pointers = 0;

  // 손을 뗀 뒤 미끄러지기·부드러운 이동
  late final Ticker _ticker = createTicker(_tick);
  Simulation? _simX, _simY;
  Duration _simStart = Duration.zero;
  bool _simStarted = false;

  @override
  void initState() {
    super.initState();
    widget.controller?._state = this;
  }

  @override
  void didUpdateWidget(covariant ContinuousPageList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller?._state = null;
      widget.controller?._state = this;
    }
    if (oldWidget.count != widget.count) _tops = const [];
  }

  @override
  void dispose() {
    if (widget.controller?._state == this) widget.controller?._state = null;
    _ticker.dispose();
    super.dispose();
  }

  double get _maxScale => widget.zoomable ? 5 : 1;
  double get _contentHeight => (_tops.isEmpty ? 0 : _tops.last) * _scale;
  double get _maxX => math.max(0, _width * _scale - _width);
  double get _maxY => math.max(0, _contentHeight - _height);

  /// 쪽이 화면보다 짧으면(1쪽짜리 등) 위아래 가운데에 (슬라이드 보기처럼)
  double _padYFor(double scale) => math.max(0, (_height - (_tops.isEmpty ? 0 : _tops.last) * scale) / 2);

  void _clamp() {
    _ox = _ox.clamp(0.0, _maxX).toDouble();
    _oy = _oy.clamp(0.0, _maxY).toDouble();
  }

  void _layout(double width, double height) {
    final bool sameWidth = width == _width && _tops.length == widget.count + 1;
    _height = height;
    if (sameWidth) {
      _clamp();
      return;
    }
    // 화면 너비가 바뀌면(회전 등) 보던 쪽을 그대로
    final int page = _placed && _tops.length > 1 ? _pageAt(_oy) : widget.initialPage.clamp(0, math.max(0, widget.count - 1)).toInt();
    final double within = _placed && _tops.length > 1 ? ((_oy / _scale) - _tops[page]) / math.max(1, _tops[page + 1] - _tops[page]) : 0;
    _width = width;
    final tops = List<double>.filled(widget.count + 1, 0);
    for (int i = 0; i < widget.count; i++) {
      tops[i + 1] = tops[i] + width * widget.aspectOf(i) + (i < widget.count - 1 ? widget.gap : 0);
    }
    _tops = tops;
    if (widget.count > 0) {
      final double h = tops[page + 1] - tops[page];
      _oy = (tops[page] + within * h) * _scale;
    }
    _placed = true;
    _clamp();
    _current = page;
  }

  /// 화면 위쪽 1/3 지점에 걸친 쪽 (oy: 확대된 좌표)
  int _pageAt(double oy) {
    if (_tops.length < 2) return 0;
    final double y = (oy + _height / 3) / _scale;
    int lo = 0, hi = widget.count - 1;
    while (lo < hi) {
      final mid = (lo + hi + 1) >> 1;
      if (_tops[mid] <= y) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }

  void _moved() {
    _clamp();
    final p = _pageAt(_oy);
    if (p != _current && _tops.length > 1) {
      _current = p;
      widget.onPageChanged(p);
    }
    setState(() {});
  }

  void _stopSim() {
    if (_ticker.isActive) _ticker.stop();
    _simX = _simY = null;
  }

  void _tick(Duration elapsed) {
    if (!_simStarted) {
      _simStart = elapsed;
      _simStarted = true;
    }
    final double t = (elapsed - _simStart).inMicroseconds / 1e6;
    bool done = true;
    if (_simX != null) {
      _ox = _simX!.x(t);
      if (!_simX!.isDone(t)) done = false;
    }
    if (_simY != null) {
      _oy = _simY!.x(t);
      if (!_simY!.isDone(t)) done = false;
    }
    final double ox = _ox, oy = _oy;
    _moved();
    // 끝에 닿으면 멈춤
    if (_simX != null && (ox != _ox)) _simX = null;
    if (_simY != null && (oy != _oy)) _simY = null;
    if (done || (_simX == null && _simY == null)) _stopSim();
  }

  void _runSim({Simulation? x, Simulation? y}) {
    _stopSim();
    _simX = x;
    _simY = y;
    if (x == null && y == null) return;
    _simStarted = false;
    _ticker.start();
  }

  void _animateTo(double ox, double oy) {
    _runSim(
      x: (ox - _ox).abs() < 0.5 ? null : _EaseSimulation(_ox, ox, 0.26),
      y: (oy - _oy).abs() < 0.5 ? null : _EaseSimulation(_oy, oy, 0.26),
    );
  }

  void _jumpTo(int page) {
    if (_tops.length < 2) return;
    _stopSim();
    final p = page.clamp(0, widget.count - 1).toInt();
    _oy = _tops[p] * _scale;
    _moved();
  }

  void _scrollByScreen(int dir) {
    if (_tops.length < 2) return;
    final double target = (_oy + dir * _height * 0.9).clamp(0.0, _maxY).toDouble();
    _animateTo(_ox, target);
  }

  Offset? _downLocal; // 손가락이 처음 닿은 자리

  void _onScaleStart(ScaleStartDetails d) {
    _stopSim();
    _startScale = _scale;
    // 한 손가락 끌기: 손가락이 처음 닿은 자리를 기준으로 (움직이기 시작한 거리만큼 버리지 않고 그대로 따라오게)
    final Offset f = d.pointerCount <= 1 && _downLocal != null ? _downLocal! : d.localFocalPoint;
    _startContent = Offset((_ox + f.dx) / _scale, (_oy + f.dy - _padYFor(_scale)) / _scale);
    _pointers = d.pointerCount;
  }

  void _onScaleUpdate(ScaleUpdateDetails d) {
    // 손가락 수가 바뀌면 기준을 다시 잡아 튀지 않게
    if (d.pointerCount != _pointers) {
      _pointers = d.pointerCount;
      _startScale = _scale / (d.scale == 0 ? 1 : d.scale);
      _startContent = Offset((_ox + d.localFocalPoint.dx) / _scale, (_oy + d.localFocalPoint.dy - _padYFor(_scale)) / _scale);
    }
    final double ns = (_startScale * d.scale).clamp(1.0, _maxScale).toDouble();
    _scale = ns;
    _ox = _startContent.dx * ns - d.localFocalPoint.dx;
    _oy = _startContent.dy * ns - d.localFocalPoint.dy + _padYFor(ns);
    _moved();
  }

  void _onScaleEnd(ScaleEndDetails d) {
    final v = d.velocity.pixelsPerSecond;
    if (_scale < 1.03 && _scale != 1) {
      _scale = 1;
      _moved();
    }
    _runSim(
      x: v.dx.abs() > 60 && _maxX > 0 ? ClampingScrollSimulation(position: _ox, velocity: -v.dx) : null,
      y: v.dy.abs() > 60 ? ClampingScrollSimulation(position: _oy, velocity: -v.dy) : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: widget.background,
      child: LayoutBuilder(
        builder: (context, c) {
          _layout(c.maxWidth, c.maxHeight);
          final children = <Widget>[];
          if (_tops.length > 1) {
            final double s = _scale;
            final double padY = _padYFor(s);
            // 화면 앞뒤로 한 화면 반씩 더 그려 두어 움직일 때 비어 보이지 않게
            final double from = (_oy - _height * 1.5) / s, to = (_oy + _height * 2.5) / s;
            int i = _pageAt(math.max(0, _oy - _height * 1.5));
            while (i > 0 && _tops[i] > from) {
              i--;
            }
            for (; i < widget.count && _tops[i] < to; i++) {
              final double h = (_tops[i + 1] - _tops[i] - (i < widget.count - 1 ? widget.gap : 0)) * s;
              children.add(Positioned(
                key: ValueKey(i),
                left: -_ox,
                top: _tops[i] * s - _oy + padY,
                width: _width * s,
                height: h,
                child: RepaintBoundary(child: widget.pageBuilder(context, i)),
              ));
            }
          }
          final mq = MediaQuery.of(context);
          // 끌기가 빨리 시작되게 (기본은 손가락이 꽤 움직여야 시작돼 화면이 끈적하게 느껴짐). 쪽 안의 다른 동작은 원래 값 그대로
          return MediaQuery(
            data: mq.copyWith(gestureSettings: const DeviceGestureSettings(touchSlop: 6)),
            child: Listener(
            onPointerDown: (e) => _downLocal = e.localPosition,
            child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onScaleStart: _onScaleStart,
            onScaleUpdate: _onScaleUpdate,
            onScaleEnd: _onScaleEnd,
            onLongPressStart: widget.onLongPressPage == null
                ? null
                : (d) {
                    if (_tops.length < 2) return;
                    final double y = (_oy + d.localPosition.dy - _padYFor(_scale)) / _scale;
                    int p = 0;
                    while (p < widget.count - 1 && _tops[p + 1] <= y) {
                      p++;
                    }
                    widget.onLongPressPage!(p);
                  },
            child: MediaQuery(data: mq, child: ClipRect(child: Stack(clipBehavior: Clip.hardEdge, children: children))),
          ),
            ),
          );
        },
      ),
    );
  }
}

/// 정해진 시간 동안 부드럽게 a → b
class _EaseSimulation extends Simulation {
  _EaseSimulation(this.a, this.b, this.seconds);
  final double a, b, seconds;

  @override
  double x(double time) => a + (b - a) * Curves.easeOutCubic.transform((time / seconds).clamp(0.0, 1.0).toDouble());

  @override
  double dx(double time) => 0;

  @override
  bool isDone(double time) => time >= seconds;
}

/// 그림 파일의 크기를 머리 부분만 읽어 빠르게 알아냄 (PNG·JPEG·WebP). 모르면 null
Size? readImageSizeSync(String path) {
  RandomAccessFile? f;
  try {
    f = File(path).openSync();
    final b = f.readSync(256 * 1024);
    if (b.length < 24) return null;
    // PNG
    if (b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) {
      final w = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
      final h = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23];
      return w > 0 && h > 0 ? Size(w.toDouble(), h.toDouble()) : null;
    }
    // JPEG: SOFn 표지 찾기
    if (b[0] == 0xFF && b[1] == 0xD8) {
      int i = 2;
      while (i + 9 < b.length) {
        if (b[i] != 0xFF) {
          i++;
          continue;
        }
        final m = b[i + 1];
        if (m == 0xD8 || m == 0x01 || (m >= 0xD0 && m <= 0xD7) || m == 0xFF) {
          i += m == 0xFF ? 1 : 2;
          continue;
        }
        final len = (b[i + 2] << 8) | b[i + 3];
        if (m >= 0xC0 && m <= 0xCF && m != 0xC4 && m != 0xC8 && m != 0xCC) {
          final h = (b[i + 5] << 8) | b[i + 6];
          final w = (b[i + 7] << 8) | b[i + 8];
          return w > 0 && h > 0 ? Size(w.toDouble(), h.toDouble()) : null;
        }
        i += 2 + len;
      }
      return null;
    }
    // WebP
    if (b[0] == 0x52 && b[1] == 0x49 && b[8] == 0x57 && b[9] == 0x45 && b.length >= 30) {
      final chunk = String.fromCharCodes(b.sublist(12, 16));
      if (chunk == 'VP8X') {
        final w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
        final h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
        return Size(w.toDouble(), h.toDouble());
      }
      if (chunk == 'VP8 ') {
        final w = (b[26] | (b[27] << 8)) & 0x3FFF;
        final h = (b[28] | (b[29] << 8)) & 0x3FFF;
        return w > 0 && h > 0 ? Size(w.toDouble(), h.toDouble()) : null;
      }
      if (chunk == 'VP8L') {
        final bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
        return Size(((bits & 0x3FFF) + 1).toDouble(), (((bits >> 14) & 0x3FFF) + 1).toDouble());
      }
    }
    return null;
  } catch (_) {
    return null;
  } finally {
    try {
      f?.closeSync();
    } catch (_) {}
  }
}

// ── 설정 창 모양 (정렬 및 보기 창처럼): 고르기는 테두리 상자, 켜고 끄기는 스위치 줄 ──

/// 하나 고르기 상자 (ChoiceChip 자리). 고른 것은 굵은 테두리
class SettingOption extends StatelessWidget {
  const SettingOption({super.key, required this.label, required this.selected, this.onSelected});
  final Widget label;
  final bool selected;
  final ValueChanged<bool>? onSelected;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Material(
      color: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: selected ? cs.onSurface : cs.outlineVariant, width: selected ? 2.2 : 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onSelected == null ? null : () => onSelected!(!selected),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 46),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: DefaultTextStyle.merge(
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                  color: selected ? cs.onSurface : cs.onSurfaceVariant,
                ),
                child: label,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// 켜고 끄기 줄 (FilterChip 자리): 왼쪽 이름, 오른쪽 스위치
class SettingToggle extends StatelessWidget {
  const SettingToggle({super.key, required this.label, required this.selected, this.onSelected});
  final Widget label;
  final bool selected;
  final ValueChanged<bool>? onSelected;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onSelected == null ? null : () => onSelected!(!selected),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Expanded(child: DefaultTextStyle.merge(style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600), child: label)),
            Switch(value: selected, onChanged: onSelected),
          ],
        ),
      ),
    );
  }
}

/// 설정 묶음: 켜고 끄기 줄이면 세로로, 고르기 상자면 한 줄(3개까지) 또는 두 줄로 나란히
class SettingGroup extends StatelessWidget {
  const SettingGroup({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();
    if (children.every((c) => c is SettingToggle)) {
      return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children);
    }
    final int perRow = children.length == 4 ? 2 : math.min(3, children.length);
    final rows = <Widget>[];
    for (int i = 0; i < children.length; i += perRow) {
      final part = children.sublist(i, math.min(children.length, i + perRow));
      rows.add(Padding(
        padding: EdgeInsets.only(top: i == 0 ? 0 : 10),
        child: Row(
          children: [
            for (int k = 0; k < perRow; k++) ...[
              if (k > 0) const SizedBox(width: 10),
              Expanded(child: k < part.length ? part[k] : const SizedBox.shrink()),
            ],
          ],
        ),
      ));
    }
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: rows);
  }
}

/// 설정 창 맨 아래 '완료' 버튼
class SettingDoneButton extends StatelessWidget {
  const SettingDoneButton({super.key, required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 18, bottom: 6),
      child: SizedBox(
        width: double.infinity,
        height: 52,
        child: FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: cs.onSurface,
            foregroundColor: cs.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          onPressed: onPressed,
          child: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }
}

/// 파일을 처음 열 때 가운데에 뜨는 로딩: 돌아가는 원 + 문구 (+ 진행률)
class FileLoadingView extends StatelessWidget {
  const FileLoadingView({super.key, required this.label, this.progress, this.sublabel, this.dark = false, this.background});
  final String label;

  /// 0~1 (모르면 null: 문구에 %를 붙이지 않음)
  final double? progress;
  final String? sublabel;

  /// 어두운 바탕 위인가 (사진·PDF 화면)
  final bool dark;

  /// 뒤 바탕색 (알려 주면 앱 테마와 관계없이 바탕에 맞춰 잘 보이는 글자색)
  final Color? background;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final Color? bg = background;
    final bool onDark = bg != null ? bg.computeLuminance() < 0.4 : dark;
    final Color fg = bg != null ? (onDark ? Colors.white : Colors.black) : (dark ? Colors.white : cs.onSurface);
    final p = progress;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 46,
            height: 46,
            child: CircularProgressIndicator(
              strokeWidth: 4.5,
              strokeCap: StrokeCap.round,
              color: bg != null ? (onDark ? const Color(0xFF9FA8FF) : const Color(0xFF3F51B5)) : (dark ? Colors.amber : cs.primary),
              backgroundColor: fg.withValues(alpha: 0.12),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            p == null ? label : '$label ${(p.clamp(0.0, 1.0) * 100).round()}%',
            style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: fg.withValues(alpha: 0.85)),
          ),
          if (sublabel != null) ...[
            const SizedBox(height: 4),
            Text(sublabel!, style: TextStyle(fontSize: 12, color: fg.withValues(alpha: 0.55))),
          ],
        ],
      ),
    );
  }
}
