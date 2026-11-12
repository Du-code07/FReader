import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:archive/archive.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import '../services/storage_service.dart';
import '../services/system_bars.dart';
import '../services/pdf_outline_service.dart';
import '../services/toc_page_parser.dart';
import '../services/heading_rules.dart';
import '../services/outline_cache.dart';
import '../widgets/outline_progress.dart';
import '../widgets/text_copy_sheet.dart';
import '../services/volume_key_service.dart';
import '../widgets/quick_arc_menu.dart';
import '../widgets/viewer_dialogs.dart';
import '../widgets/ui_scale.dart';
import '../widgets/sheet_pull_to_close.dart';
import '../services/pdf_export_service.dart';
import '../widgets/memo_tools.dart';
import '../widgets/vertical_page_swipe.dart';
import '../widgets/direction_arrow_icon.dart';
import '../widgets/find_in_file_bar.dart';
import 'reader_screen.dart';

/// 1. S펜 전용 즉시 승리 제스처 인식기 (Eager Stylus Gesture Recognizer):
/// S펜(stylus / invertedStylus)이 화면에 닿는 순간(PointerDown) 즉시 GestureArena에서 승리(accepted)를 선언하여
/// 하위 PageView나 InteractiveViewer, WebView가 S펜 움직임으로 화면을 흔들거나 페이지를 넘기는 것을 100% 원천 차단합니다!
/// 반면 일반 손가락 터치(PointerDeviceKind.touch)는 아예 거부(isPointerAllowed = false)하므로 손가락 스와이프로는 평소처럼 페이지가 부드럽게 넘어갑니다!
class EagerStylusPanGestureRecognizer extends OneSequenceGestureRecognizer {
  bool allowTouch = false;
  void Function(PointerDownEvent event)? onStylusDown;
  void Function(PointerMoveEvent event)? onStylusMove;
  void Function(PointerUpEvent event)? onStylusUp;
  void Function(PointerCancelEvent event)? onStylusCancel;

  @override
  bool isPointerAllowed(PointerDownEvent event) {
    if (allowTouch &&
        (event.kind == PointerDeviceKind.touch ||
            event.kind == PointerDeviceKind.mouse)) {
      return true;
    }
    return event.kind == PointerDeviceKind.stylus ||
        event.kind == PointerDeviceKind.invertedStylus;
  }

  @override
  void addAllowedPointer(PointerDownEvent event) {
    startTrackingPointer(event.pointer, event.transform);
    // 핵심: S펜이 닿자마자 제스처 아레나를 즉시 독점(accepted)하여 화면 이동/페이지 넘김을 0픽셀도 허용하지 않음!
    resolve(GestureDisposition.accepted);
    onStylusDown?.call(event);
  }

  @override
  void handleEvent(PointerEvent event) {
    if (event is PointerMoveEvent) {
      onStylusMove?.call(event);
    } else if (event is PointerUpEvent) {
      onStylusUp?.call(event);
      stopTrackingPointer(event.pointer);
    } else if (event is PointerCancelEvent) {
      onStylusCancel?.call(event);
      stopTrackingPointer(event.pointer);
    }
  }

  @override
  String get debugDescription => 'eager_stylus_pan';

  @override
  void didStopTrackingLastPointer(int pointer) {}
}

class StylusOnlyDrawingLayer extends StatelessWidget {
  final bool enabled;
  final bool allowTouch;
  final void Function(PointerDownEvent event) onStylusDown;
  final void Function(PointerMoveEvent event) onStylusMove;
  final void Function(PointerUpEvent event) onStylusUp;
  final void Function(PointerCancelEvent event) onStylusCancel;
  final Widget child;

  /// 손가락 필기를 쓰지 않을 때 손가락 터치를 아래(본문)로 그대로 넘김
  /// (본문 위에 덮인 필기 그림이 터치를 막아 화면 누르기·밀어서 넘기기가 안 되던 문제)
  final bool passThroughTouch;

  const StylusOnlyDrawingLayer({
    this.passThroughTouch = false,
    super.key,
    required this.enabled,
    this.allowTouch = false,
    required this.onStylusDown,
    required this.onStylusMove,
    required this.onStylusUp,
    required this.onStylusCancel,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    if (!enabled) {
      return IgnorePointer(child: child);
    }
    return RawGestureDetector(
      behavior: HitTestBehavior.translucent,
      gestures: <Type, GestureRecognizerFactory>{
        EagerStylusPanGestureRecognizer:
            GestureRecognizerFactoryWithHandlers<EagerStylusPanGestureRecognizer>(
          () => EagerStylusPanGestureRecognizer(),
          (EagerStylusPanGestureRecognizer instance) {
            instance
              ..allowTouch = allowTouch
              ..onStylusDown = onStylusDown
              ..onStylusMove = onStylusMove
              ..onStylusUp = onStylusUp
              ..onStylusCancel = onStylusCancel;
          },
        ),
      },
      child: (passThroughTouch && !allowTouch) ? IgnorePointer(child: child) : child,
    );
  }
}

class _MemoCanvasPainter extends CustomPainter {
  final List<MemoStroke> strokes;
  final List<Offset> currentPoints;
  final Color currentColor;
  final double currentWidth;

  _MemoCanvasPainter({
    required this.strokes,
    required this.currentPoints,
    required this.currentColor,
    required this.currentWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    for (final s in strokes) {
      if (s.dxList.isEmpty) continue;
      final paint = Paint()
        ..color = Color(s.colorValue)
        ..strokeWidth = s.strokeWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;

      final path = Path();
      path.moveTo(s.dxList.first * size.width, s.dyList.first * size.height);
      for (int i = 1; i < s.dxList.length; i++) {
        path.lineTo(s.dxList[i] * size.width, s.dyList[i] * size.height);
      }
      canvas.drawPath(path, paint);
    }

    if (currentPoints.isNotEmpty) {
      final paint = Paint()
        ..color = currentColor
        ..strokeWidth = currentWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;

      final path = Path();
      path.moveTo(currentPoints.first.dx, currentPoints.first.dy);
      for (int i = 1; i < currentPoints.length; i++) {
        path.lineTo(currentPoints[i].dx, currentPoints[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MemoCanvasPainter oldDelegate) => true;
}

class UniversalMediaReaderScreen extends StatefulWidget {
  final List<File> files;
  final String title;
  final bool isPdf;
  final String? customBookKey;

  const UniversalMediaReaderScreen({
    super.key,
    required this.files,
    required this.title,
    required this.isPdf,
    this.customBookKey,
  });

  @override
  State<UniversalMediaReaderScreen> createState() => _UniversalMediaReaderScreenState();
}

class _UniversalMediaReaderScreenState extends State<UniversalMediaReaderScreen>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');
  PageController? _pageController;
  final VolumeKeyService _volumeKeyService = VolumeKeyService();

  List<File> _imagePages = [];
  final Map<int, Size> _pageImageSizes = {};
  bool _isPreparingPages = true;
  int _currentPage = 0;
  int _totalPages = 1;
  bool _showControls = false;
  bool _isMangaRtlMode = false;
  // 페이지 표시: 'one' / 'two' / 'auto'(화면이 넓으면 두 페이지)
  String _pageDisplay = 'one';
  // 도구 모음 형태: 'arc'(반원) / 'bar'(아래 가로 바)
  String _toolbarStyle = 'arc';
  // 페이지 모드: 탭(누른 자리로 넘김) / 스크롤(쪽을 이어 붙여 세로로) / 슬라이드(= _useSwipeTurn)
  bool _pageModeTap = true;
  bool _pageModeScroll = false;
  final ContinuousPageController _scrollCtrl = ContinuousPageController();
  final Map<int, Size> _scrollSizes = {};
  bool _lastIsSpreadMode = false;

  bool _isTouchLocked = false;
  bool _useShakeLock = false;
  bool _useVolumeComboLock = true;

  bool _useSwipeTurn = true;
  bool _useSwipeUpTurn = false; // 기본값: 꺼짐

  // 위/아래로 밀기: 손가락을 따라 페이지가 위·아래로 움직이며 넘어감
  late final VerticalPageSwipe _vPageSwipe = VerticalPageSwipe(vsync: this);

  bool _vSwipeEnabled(PointerEvent e) =>
      _useSwipeUpTurn &&
      !_isTouchLocked &&
      _currentZoomScale <= 1.03 &&
      !(_isMemoMode && (_allowFingerDrawing || isStylusPointer(e)));

  int _stepTarget(int dir) {
    final int step = _lastIsSpreadMode ? 2 : 1;
    return (_currentPage + dir * step).clamp(0, _totalPages - 1).toInt();
  }

  bool _canStepPage(int dir) => _totalPages > 1 && _stepTarget(dir) != _currentPage;

  Future<void> _stepPageInstant(int dir) async {
    _goToPage(_stepTarget(dir), smoothAnimation: false);
    // 새 쪽이 실제로 그려진 뒤에 제자리로 돌려야 이전 쪽이 잠깐 비치지 않는다
    await WidgetsBinding.instance.endOfFrame;
    await WidgetsBinding.instance.endOfFrame;
  }
  bool _useVolumeTurn = true;
  bool _useQuickNavTurn = false;
  bool _useSpenTurn = false;
  Offset? _lastEraserPos;
  final Set<int> _activeTouchPointerIds = {};
  final TransformationController _zoomController = TransformationController();
  double _currentZoomScale = 1.0;

  bool _isMemoMode = false;
  bool _isEraserMode = false;
  bool _allowFingerDrawing = false;
  bool _isStylusDown = false;
  int _activeDrawingPageIndex = 0;
  final Map<int, List<MemoStroke>> _memoStrokesByPage = {};
  final Map<int, String> _memoNotesByPage = {};
  final List<Offset> _activeStrokePoints = [];
  Color _penColor = kMemoPenColors.first; // 기본: 빨강
  double _penWidth = 2.0;

  // 메모: 되돌리기/다시 실행 기록, 지우개 종류, 지우개 드래그 시작 시점의 필기
  final MemoHistory _memoHistory = MemoHistory();
  String _eraserType = 'area';
  List<MemoStroke>? _eraseStartStrokes;

  String _footerInfoMode = 'none';
  String _progressBarPosSetting = 'bottom';
  /// 실제 진행바 위치: 1쪽짜리 문서는 설정과 상관없이 숨김 (다른 버튼 배치도 숨김 기준으로)
  String get _progressBarPos => (_totalPages <= 1) ? 'hidden' : _progressBarPosSetting;
  String _memoToolbarPos = 'bottom'; // 메모 도구모음 위치
  String _quickMenuSide = 'right'; // 도구 모음(활 메뉴) 위치
  int _rotateTapCount = 0; // 화면 회전 아이콘 흔들림 애니메이션용
  List<BookmarkItem> _bookmarks = [];

  bool get _isCurrentPageBookmarked {
    if (_bookmarks.isEmpty) return false;
    final bool isSpreadNow = _isSpreadActive(context);
    final int firstPage = isSpreadNow ? ((_currentPage ~/ 2) * 2) : _currentPage;
    final int secondPage = firstPage + 1;
    return _bookmarks.any((bm) {
      final p = int.tryParse(bm.position);
      if (p == null) return false;
      if (p == _currentPage || p == firstPage) return true;
      if (isSpreadNow && secondPage < _totalPages && p == secondPage) return true;
      return false;
    });
  }

  String _buildLockScreenMessage() {
    if (_useShakeLock && _useVolumeComboLock) {
      return _tr(
        '화면 잠금 (흔들어서 끄기 또는 음량 버튼 동시에 눌러서 끄기)',
        'Screen Lock (Shake or press both volume keys to unlock)',
        '屏幕锁定 (摇晃或同时按音量键关闭)',
        '画面ロック (振るか音量ボタン同時押しで解除)',
      );
    } else if (_useShakeLock) {
      return _tr(
        '화면 잠금 (흔들어서 끄기)',
        'Screen Lock (Shake to unlock)',
        '屏幕锁定 (摇晃关闭)',
        '画面ロック (振って解除)',
      );
    } else if (_useVolumeComboLock) {
      return _tr(
        '화면 잠금 (음량 버튼 동시에 눌러서 끄기)',
        'Screen Lock (Press both volume keys to unlock)',
        '屏幕锁定 (同时按音量键关闭)',
        '画面ロック (音量ボタン同時押しで解除)',
      );
    } else {
      return _tr('화면 잠금', 'Screen Lock', '屏幕锁定', '画面ロック');
    }
  }

  String get _bookKey => widget.customBookKey ?? widget.files.first.path;

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(StorageService.appLangNotifier.value, ko: ko, en: en, zh: zh, ja: ja);

  @override
  void initState() {
    super.initState();
    SystemBars.enterViewer(); // 파일 열람 중에는 상태표시줄·내비게이션 바를 모두 숨김
    WidgetsBinding.instance.addObserver(this);
    _initMedia();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_isTouchLocked &&
        (state == AppLifecycleState.paused ||
            state == AppLifecycleState.inactive ||
            state == AppLifecycleState.detached ||
            state == AppLifecycleState.hidden)) {
      setState(() => _isTouchLocked = false);
    }
  }

  void _toggleTouchScreenLock({required bool byVolume}) {
    if (!mounted) return;
    // 4. 흔들어서 끄기 / 음량 버튼 동시에 눌러서 끄기: 잠금 상태일 때만 잠금을 해제하도록 변경!
    if (!_isTouchLocked) return;
    final bool neitherEnabled = !_useShakeLock && !_useVolumeComboLock;
    if (byVolume && !_useVolumeComboLock && !neitherEnabled) return;
    if (!byVolume && !_useShakeLock && !neitherEnabled) return;

    setState(() {
      _isTouchLocked = false;
    });
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_tr('화면 잠금 해제', 'Screen Unlocked', '屏幕锁定已解除', '画面ロック解除')),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  /// 뷰어 설정의 '페이지 모드'(탭·스크롤·슬라이드)와 '페이지 넘김 버튼'
  /// 스크롤은 탭·슬라이드와 함께 켤 수 없음 (스크롤을 켜면 둘 다 꺼짐). 탭과 슬라이드는 함께 사용 가능
  List<Widget> _pageModeSettings(StateSetter setModalState) {
    Future<void> apply(VoidCallback change) async {
      setState(change);
      setModalState(() {});
      await StorageService.setPageModeTap(_pageModeTap);
      await StorageService.setPageModeScroll(_pageModeScroll);
      await StorageService.setUseSwipeTurn(_useSwipeTurn);
      _onPageModeChanged();
    }

    return [
      _settingsHeader(Icons.swipe_outlined, _tr('페이지 모드', 'Page Mode', '翻页模式', 'ページモード')),
      const SizedBox(height: 4),
      Text(
        _tr('스크롤은 탭·슬라이드와 함께 쓸 수 없어요. 탭과 슬라이드는 함께 쓸 수 있어요.', 'Scroll cannot be combined with Tap or Slide. Tap and Slide can be used together.', '滚动不能与点击、滑动同时使用；点击和滑动可以同时使用。', 'スクロールはタップ・スライドと併用できません。タップとスライドは併用できます。'),
        style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
      ),
      const SizedBox(height: 6),
      SettingGroup(
        children: [
          SettingToggle(
            label: Text(_tr('탭', 'Tap', '点击', 'タップ')),
            selected: _pageModeTap,
            onSelected: (val) => apply(() {
              _pageModeTap = val;
              if (val) _pageModeScroll = false;
            }),
          ),
          SettingToggle(
            label: Text(_tr('스크롤', 'Scroll', '滚动', 'スクロール')),
            selected: _pageModeScroll,
            onSelected: (val) => apply(() {
              _pageModeScroll = val;
              if (val) {
                _useSwipeTurn = false;
                _pageModeTap = false;
              }
            }),
          ),
          SettingToggle(
            label: Text(_tr('슬라이드', 'Slide', '滑动', 'スライド')),
            selected: _useSwipeTurn,
            onSelected: (val) => apply(() {
              _useSwipeTurn = val;
              if (val) _pageModeScroll = false;
            }),
          ),
        ],
      ),
      const SizedBox(height: 26),
      _settingsHeader(Icons.smart_button_outlined, _tr('페이지 넘김 버튼 (동시 사용 가능)', 'Page Turn Buttons (Multiple allowed)', '翻页按钮 (可同时启用)', 'ページめくりボタン (同時使用可)')),
      const SizedBox(height: 6),
      SettingGroup(
        children: [
          SettingToggle(
            label: Text(_tr('음량 버튼', 'Volume Keys', '音量键', '音量ボタン')),
            selected: _useVolumeTurn,
            onSelected: (val) async {
              await StorageService.setUseVolumeTurn(val);
              setState(() => _useVolumeTurn = val);
              setModalState(() {});
            },
          ),
          SettingToggle(
            label: Text(_tr('S펜 버튼', 'S Pen Button', 'S Pen 按钮', 'Sペンボタン')),
            selected: _useSpenTurn,
            onSelected: (val) async {
              await StorageService.setUseSpenTurn(val);
              setState(() => _useSpenTurn = val);
              setModalState(() {});
            },
          ),
        ],
      ),
    ];
  }

  void _setPageDisplay(String mode) {
    if (!mounted) return;
    setState(() => _pageDisplay = mode);
  }

  /// 페이지 모드가 바뀌었을 때: 스크롤로 바꾸면 쪽 크기를 미리 다 알아 둠 (한 번에 이어 붙여 끊김 없이)
  void _onPageModeChanged() {
    if (!mounted) return;
    if (_pageModeScroll) _prepareScrollSizes();
    _zoomController.value = Matrix4.identity();
    setState(() => _currentZoomScale = 1.0);
    // 쪽 모드로 돌아오면 보던 쪽을 그대로
    if (!_pageModeScroll) WidgetsBinding.instance.addPostFrameCallback((_) => _syncControllerToCurrentPage(animate: false));
  }

  void _prepareScrollSizes() {
    for (int i = 0; i < _imagePages.length; i++) {
      if (_scrollSizes.containsKey(i)) continue;
      final known = _pageImageSizes[i];
      final sz = known ?? readImageSizeSync(_imagePages[i].path);
      if (sz != null && sz.width > 0 && sz.height > 0) _scrollSizes[i] = sz;
    }
  }

  /// 스크롤 모드에서 [i]쪽의 높이/너비 (모르면 첫 쪽과 같게)
  double _scrollAspect(int i) {
    final sz = _scrollSizes[i] ?? _scrollSizes[0] ?? const Size(1000, 1414);
    return (sz.height / sz.width).clamp(0.2, 8.0).toDouble();
  }

  /// 화면 회전 고르기 (자동 / 세로 고정 / 가로 고정)
  Future<void> _pickRotation() async {
    final bool? want = StorageService.desiredLandscapeNotifier.value;
    final current = want == null ? 'auto' : (want ? 'landscape' : 'portrait');
    final picked = await showRotationDialog(context, current: current, tr: _tr);
    if (picked == null || !mounted) return;
    await _applyRotation(picked);
  }

  Future<void> _applyRotation(String mode) async {
    StorageService.desiredLandscapeNotifier.value = mode == 'auto' ? null : mode == 'landscape';
    setState(() => _rotateTapCount++);
    try {
      await _pdfChannel.invokeMethod('setScreenOrientation', {'mode': mode == 'auto' ? 'unspecified' : mode});
    } catch (_) {}
    if (mounted) setState(() {});
  }

  /// 지금 화면 회전 설정 아이콘
  IconData get _rotationIconNow {
    final bool? want = StorageService.desiredLandscapeNotifier.value;
    return rotationIcon(want == null ? 'auto' : (want ? 'landscape' : 'portrait'));
  }

  /// 페이지 표시 고르기 (한 페이지 / 두 페이지 / 자동)
  Future<void> _pickPageDisplay() async {
    await showPageDisplayDialog(
      context,
      current: _pageDisplay,
      tr: _tr,
      scrollMode: _pageModeScroll,
      onChanged: (mode) {
        StorageService.setPageDisplay(mode);
        _setPageDisplay(mode);
      },
    );
  }


  Future<Size> _getImageDimension(File file) async {
    try {
      final bytes = await file.readAsBytes();
      final codec = await ui.instantiateImageCodec(bytes);
      final frame = await codec.getNextFrame();
      return Size(frame.image.width.toDouble(), frame.image.height.toDouble());
    } catch (_) {
      return const Size(1000, 1400);
    }
  }

  Future<void> _ensurePageDimensionLoaded(int index) async {
    if (_pageImageSizes.containsKey(index) || index < 0 || index >= _imagePages.length) return;
    final sz = await _getImageDimension(_imagePages[index]);
    if (mounted) {
      setState(() {
        _pageImageSizes[index] = sz;
      });
    }
  }

  int _naturalCompare(String a, String b) {
    final reg = RegExp(r'(\d+)|(\D+)');
    final matchesA = reg.allMatches(a.toLowerCase()).toList();
    final matchesB = reg.allMatches(b.toLowerCase()).toList();
    final len = matchesA.length < matchesB.length ? matchesA.length : matchesB.length;
    for (int i = 0; i < len; i++) {
      final partA = matchesA[i].group(0)!;
      final partB = matchesB[i].group(0)!;
      final numA = int.tryParse(partA);
      final numB = int.tryParse(partB);
      if (numA != null && numB != null) {
        final cmp = numA.compareTo(numB);
        if (cmp != 0) return cmp;
      } else {
        final cmp = partA.compareTo(partB);
        if (cmp != 0) return cmp;
      }
    }
    return matchesA.length.compareTo(matchesB.length);
  }

  /// 8. 같은 그룹 내의 이전(step: -1) 또는 다음(step: 1) 파일로 즉시 이동
  Future<void> _openAdjacentFileInSameGroup(int step) async {
    final currentPath = widget.files.first.path;
    final currentGroup = await StorageService.getBookGroup(currentPath);
    final favs = await StorageService.getFavoriteBooks();
    final dir = await getApplicationDocumentsDirectory();
    const supportedExts = [
      'epub', 'txt', 'pdf', 'jpg', 'jpeg', 'png', 'webp', 'cbz',
      'docx', 'doc', 'hwpx', 'hwp', 'pptx', 'ppt', 'xlsx', 'xlsm', 'xls',
    ];
    const imageExts = ['jpg', 'jpeg', 'png', 'webp'];

    final allFiles = <File>[];
    for (final e in dir.listSync()) {
      if (e is File) {
        final lower = e.path.toLowerCase();
        if (lower.endsWith('_translated.epub') || lower.endsWith('.converted.epub') || lower.endsWith('_converted.epub')) continue;
        final ext = lower.split('.').last;
        if (supportedExts.contains(ext)) {
          final grp = await StorageService.getBookGroup(e.path);
          if (grp == currentGroup) {
            allFiles.add(e);
          }
        }
      }
    }

    allFiles.sort((a, b) {
      final aFav = favs.contains(a.path);
      final bFav = favs.contains(b.path);
      if (aFav != bFav) return aFav ? -1 : 1;
      return _naturalCompare(
        a.path.split(Platform.pathSeparator).last,
        b.path.split(Platform.pathSeparator).last,
      );
    });

    final currentPathsSet = widget.files.map((f) => f.path).toSet();
    final curIdx = allFiles.indexWhere((f) => f.path == currentPath);
    if (curIdx == -1 || allFiles.length <= currentPathsSet.length) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('현재 그룹("$currentGroup")에 이동할 다른 파일이 없습니다.'),
            duration: const Duration(seconds: 1),
          ),
        );
      }
      return;
    }

    File? targetFile;
    for (int i = 1; i < allFiles.length; i++) {
      final idx = (curIdx + step * i + allFiles.length * 10) % allFiles.length;
      final candidate = allFiles[idx];
      if (!currentPathsSet.contains(candidate.path)) {
        targetFile = candidate;
        break;
      }
    }

    if (targetFile == null || !mounted) return;

    final nextName = targetFile.path.split(Platform.pathSeparator).last;
    final nextExt = nextName.split('.').last.toLowerCase();

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(nextName),
        duration: const Duration(milliseconds: 900),
      ),
    );

    if (const ['epub', 'txt', 'docx', 'doc', 'hwpx', 'hwp', 'pptx', 'ppt', 'xlsx', 'xlsm', 'xls'].contains(nextExt)) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ReaderScreen(filePath: targetFile!.path, bookTitle: nextName),
        ),
      );

    } else if (nextExt == 'pdf') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [targetFile!],
            title: nextName,
            isPdf: true,
          ),
        ),
      );
    } else if (imageExts.contains(nextExt)) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [targetFile!],
            title: nextName,
            isPdf: false,
          ),
        ),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [targetFile!],
            title: nextName,
            isPdf: false,
          ),
        ),
      );
    }
  }

  Future<void> _initMedia() async {
    try {
      _pageDisplay = await StorageService.getPageDisplay();
      _toolbarStyle = await StorageService.getToolbarStyle();
      _pageModeTap = await StorageService.getPageModeTap();
      _pageModeScroll = await StorageService.getPageModeScroll();
      if (_pageModeScroll) _pageModeTap = false; // 스크롤은 탭과 함께 쓰지 않음
      _isMangaRtlMode = await StorageService.getBookReadingDirectionRtl(_bookKey);
      _useShakeLock = await StorageService.getUseShakeLock();
      _useVolumeComboLock = await StorageService.getUseVolumeComboLock();
      _useVolumeTurn = await StorageService.getUseVolumeTurn();
      _useQuickNavTurn = await StorageService.getUseQuickNavTurn();
      _useSwipeTurn = await StorageService.getUseSwipeTurn() && !_pageModeScroll;
      _useSwipeUpTurn = await StorageService.getUseSwipeUpTurn();
      _eraserType = await StorageService.getMemoEraserType();
      _useSpenTurn = await StorageService.getUseSpenTurn();
      _footerInfoMode = await StorageService.getFooterInfoMode();
      _progressBarPosSetting = await StorageService.getProgressBarPosition();
      _memoToolbarPos = await StorageService.getMemoToolbarPosition();
      _quickMenuSide = await StorageService.getQuickMenuSide();
      _bookmarks = await StorageService.getBookmarks(_bookKey);

      final tempDir = await getTemporaryDirectory();
      final first = widget.files.first;
      final lower = first.path.toLowerCase();
      final int safeFileLen = await first.exists() ? await first.length() : 0;
      final String safeHashKey = '${first.path.hashCode.abs()}_$safeFileLen';

      if (widget.isPdf || lower.endsWith('.pdf')) {
        final outDir = Directory('${tempDir.path}/pdf_$safeHashKey');
        final List<dynamic>? renderedPaths = await _pdfChannel.invokeMethod('renderPdfToImages', {
          'pdfPath': first.path,
          'outDirPath': outDir.path,
        });
        if (renderedPaths != null) {
          _imagePages = renderedPaths.map((p) => File(p.toString())).toList();
        }
      } else if (lower.endsWith('.cbz')) {
        final bytes = await first.readAsBytes();
        final archive = ZipDecoder().decodeBytes(bytes);
        final extractDir = Directory('${tempDir.path}/cbz_$safeHashKey');
        await extractDir.create(recursive: true);
        final extracted = <File>[];
        int idx = 0;
        for (final f in archive.files) {
          final lowerName = f.name.toLowerCase();
          if (f.isFile &&
              !lowerName.contains('__macosx') &&
              !f.name.split('/').last.startsWith('._') &&
              (lowerName.endsWith('.jpg') ||
                  lowerName.endsWith('.jpeg') ||
                  lowerName.endsWith('.png') ||
                  lowerName.endsWith('.webp'))) {
            final ext = lowerName.split('.').last;
            final safeEntryName = 'img_${idx.toString().padLeft(4, '0')}_${f.name.split('/').last.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_')}.$ext';
            final outFile = File('${extractDir.path}/$safeEntryName');
            if (!await outFile.exists() || await outFile.length() == 0) {
              await outFile.writeAsBytes(f.content as List<int>);
            }
            extracted.add(outFile);
            idx++;
          }
        }
        extracted.sort((a, b) => _naturalCompare(
              a.path.split(Platform.pathSeparator).last,
              b.path.split(Platform.pathSeparator).last,
            ));
        _imagePages = extracted;
      } else {
        _imagePages = widget.files;
      }

      _totalPages = _imagePages.isNotEmpty ? _imagePages.length : 1;

      final savedPos = await StorageService.getLastPosition(_bookKey);
      if (savedPos != null) {
        final savedPage = int.tryParse(savedPos) ?? 0;
        _currentPage = savedPage.clamp(0, _totalPages - 1).toInt();
      }
      // 파일 목록에 보여 줄 '지금 쪽/전체 쪽' (열기만 하고 넘기지 않아도 남김)
      unawaited(StorageService.savePageLabel(_bookKey, '${_currentPage + 1}/$_totalPages'));
      // 목차: 첫 화면을 그린 뒤 잠시 있다가 분석
      if (_isPdfFile) Future<void>.delayed(const Duration(milliseconds: 600), _loadPdfOutline);

      _pageController = PageController(initialPage: _currentPage);

      if (_imagePages.isNotEmpty) {
        _pageImageSizes[_currentPage] = await _getImageDimension(_imagePages[_currentPage]);
        if (_currentPage + 1 < _imagePages.length) {
          _ensurePageDimensionLoaded(_currentPage + 1);
        }
      }

      _bindHardwareButtons();
    } catch (e) {
      _pageController ??= PageController(initialPage: 0);
    } finally {
      if (mounted) {
        setState(() => _isPreparingPages = false);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _syncControllerToCurrentPage(animate: false);
        });
      }
    }

    // 필기 및 메모 데이터 비동기 로드
    for (int i = 0; i < _imagePages.length; i++) {
      final strokes = await StorageService.getPageMemoStrokes(_bookKey, i);
      if (strokes.isNotEmpty) {
        _memoStrokesByPage[i] = strokes;
      }
      final note = await StorageService.getPageMemoNote(_bookKey, i);
      if (note.isNotEmpty) {
        _memoNotesByPage[i] = note;
      }
    }
    if (mounted && (_memoStrokesByPage.isNotEmpty || _memoNotesByPage.isNotEmpty)) {
      setState(() {});
    }
  }

  /// 2 & 5. S펜 버튼 1번 클릭(다음 페이지) / 2번 클릭(이전 페이지) 딜레이 0초 초고속 전환!
  void _bindHardwareButtons() {
    _volumeKeyService.startListening(
      onVolumeUp: () {
        if (_useVolumeTurn) _stepPage(-1);
      },
      onVolumeDown: () {
        if (_useVolumeTurn) _stepPage(1);
      },
      onVolumeBothUnlock: () => _toggleTouchScreenLock(byVolume: true),
      onShakeToggle: () => _toggleTouchScreenLock(byVolume: false),
      onSpenSinglePress: () {
        if (_useSpenTurn) _stepPage(1, fastResponse: true);
      },
      onSpenDoublePress: () {
        if (_useSpenTurn) _stepPage(-1, fastResponse: true);
      },
      onSpenDoubleRevert: () {
        // 1번 클릭으로 즉시 1페이지 앞으로 갔던 것을 취소하고 원래 페이지 기준 이전 페이지(-2)로 즉시 이동!
        if (_useSpenTurn) _stepPage(-2, fastResponse: true);
      },
    );
  }

  bool _isSpreadActive(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final bool isLandscapeNow = size.width > size.height;
    if (_pageModeScroll || _totalPages <= 1) return false; // 스크롤 모드는 쪽이 바뀌지 않음
    return _pageDisplay == 'two' || (_pageDisplay == 'auto' && isLandscapeNow);
  }

  void _syncControllerToCurrentPage({bool animate = true}) {
    final ctrl = _pageController;
    if (ctrl == null || !ctrl.hasClients) return;
    final int targetViewIdx = _lastIsSpreadMode ? (_currentPage ~/ 2) : _currentPage;
    final int currentViewIdx = (ctrl.page?.round() ?? targetViewIdx);
    if (currentViewIdx == targetViewIdx) return;

    if (animate && (targetViewIdx - currentViewIdx).abs() <= 2) {
      ctrl.animateToPage(
        targetViewIdx,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
      );
    } else {
      ctrl.jumpToPage(targetViewIdx);
    }
  }

  void _stepPage(int direction, {bool fastResponse = false}) {
    final int step = _lastIsSpreadMode ? 2 : 1;
    final int target = (_currentPage + direction * step).clamp(0, _totalPages - 1).toInt();
    _goToPage(
      target,
      smoothAnimation: true,
      animDurationMs: fastResponse ? 140 : 250,
    );
  }

  // ── 파일 내 단어 검색 (PDF만) ──
  // ── 목차 (PDF) ──
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  List<Map<String, Object>> _pdfToc = const [];

  /// 1) 파일 속 목차(책갈피) → 2) '목차'라고 적힌 쪽의 항목들 (기기가 PDF 글 읽기를 지원할 때) → 없으면 쪽 목록
  /// 목차를 만드는 중이면 진행률(0~1) — 목차 칸에 '목차 만드는 중… n%'
  double? _pdfTocProgress;

  void _setPdfTocProgress(double? p) {
    if (!mounted) return;
    if (p != null && _pdfTocProgress != null && (p - _pdfTocProgress!).abs() < 0.01) return;
    setState(() => _pdfTocProgress = p);
  }

  /// PDF 목차 (한글·워드와 같은 규칙): 1) 파일의 책갈피(목차) → 2) '목차' 쪽 → 3) Ⅰ. / 1. 로 시작하는 눈에 띄는 줄
  /// → 4) 굵은 글씨 줄(가운데 정렬이거나 줄 전체가 굵은 경우) → 없으면 쪽 목록.
  /// 발표 자료를 PDF로 만든 파일(가로로 긴 쪽)은 PPT처럼 슬라이드마다 제목·부제목.
  /// 만든 목차는 저장해 두어 다음에는 바로 보여 준다
  Future<void> _loadPdfOutline() async {
    if (!mounted || _totalPages <= 0) return;
    final path = widget.files.first.path;
    final int pages = _totalPages;
    var items = await PdfOutlineService.read(path);
    if (!mounted) return;
    // '슬라이드 1', 'Page 2'처럼 쪽 번호만 적힌 책갈피(발표 자료를 PDF로 저장할 때 생김)는 목차로 쓰지 않음
    if (items.isNotEmpty &&
        items.every((e) => RegExp(r'^\s*(슬라이드|slide|페이지|page|쪽)?\s*\d+\s*(쪽|페이지)?\s*$', caseSensitive: false).hasMatch('${e['title']}'))) {
      items = const [];
    }
    if (items.isEmpty) {
      final cached = (await OutlineCache.read(path))[pages];
      if (!mounted) return;
      if (cached != null) {
        if (cached.isNotEmpty) setState(() => _pdfToc = [for (final e in cached) e.cast<String, Object>()]);
        return;
      }
      _setPdfTocProgress(0);
      try {
        final int scan = math.min(pages, 3000);
        Future<List<_PdfPageLines>?> readLines(bool bold, double p0, double p1) async {
          final out = <_PdfPageLines>[];
          final int step = bold ? 10 : 20;
          for (int from = 0; from < scan; from += step) {
            out.addAll(await _pdfLines(path, from, math.min(scan, from + step), bold));
            if (!mounted) return null;
            _setPdfTocProgress(p0 + (p1 - p0) * math.min(1, (from + step) / scan));
          }
          return out;
        }

        // 줄마다 목차 후보 정보 (가운데 정렬, 글자 높이, 굵기)
        List<Map<String, Object?>> candidates(List<_PdfPageLines> all, {double median = 0}) {
          final cands = <Map<String, Object?>>[];
          for (int p = 0; p < all.length; p++) {
            final page = all[p].lines;
            if (page.isEmpty) continue;
            double left = 1, right = 0;
            for (final l in page) {
              left = math.min(left, (l['x0'] as num).toDouble());
              right = math.max(right, (l['x1'] as num).toDouble());
            }
            final double width = right - left;
            for (final l in page) {
              final double sw = (l['sw'] as num?)?.toDouble() ?? 0;
              final bool bold = median > 0 && sw >= median * 1.22;
              final double x0 = (l['x0'] as num).toDouble(), x1 = (l['x1'] as num).toDouble();
              final bool centered = width > 0 && x1 - x0 < width * 0.85 && ((x0 - left) - (right - x1)).abs() < width * 0.06 + 0.005;
              cands.add({'title': l['t'], 'page': p, 'bold': bold, 'boldRatio': bold ? 1.0 : 0.0, 'centered': centered, 'fs': l['h']});
            }
          }
          return cands;
        }

        final lines = await readLines(false, 0, 0.6);
        if (lines == null) return;
        final texts = [for (final page in lines) page.lines.map((l) => l['t']).join('\n')];
        List<Map<String, Object?>>? found = TocPageParser.parse(texts, pages);
        // 발표 자료로 만든 PDF: 쪽 대부분이 가로로 긴 모양
        final bool slides = lines.isNotEmpty && lines.where((p) => p.aspect > 1.15).length >= lines.length * 0.7;
        if (found == null && slides) {
          found = HeadingRules.slides([for (final p in lines) p.lines], ocr: true);
        }
        found ??= HeadingRules.build(candidates(lines));
        if (found.isEmpty && lines.any((page) => page.lines.isNotEmpty)) {
          // 번호 줄이 없으면: 쪽을 그려 글자 굵기를 가늠해 굵은 글씨 줄을 찾음
          final bolds = await readLines(true, 0.6, 0.97);
          if (bolds == null) return;
          final ratios = <double>[
            for (final page in bolds)
              for (final l in page.lines)
                if (((l['sw'] as num?) ?? 0) > 0) (l['sw'] as num).toDouble(),
          ]..sort();
          found = HeadingRules.build(candidates(bolds, median: ratios.isEmpty ? 0 : ratios[ratios.length ~/ 2]));
        }
        items = [for (final e in found) e.cast<String, Object>()];
        await OutlineCache.write(path, pages, found);
      } finally {
        _setPdfTocProgress(null);
      }
    }
    if (mounted && items.isNotEmpty) setState(() => _pdfToc = items);
  }

  /// 쪽마다 {aspect, 줄들 {t, x0, x1, y, h, (sw: 글자 획 굵기 비율)}} (지원하지 않는 기기에서는 빈 목록)
  Future<List<_PdfPageLines>> _pdfLines(String path, int from, int to, bool bold) async {
    try {
      final r = await _pdfChannel.invokeMethod<List<Object?>>('pdfLines', {'path': path, 'from': from, 'to': to, 'bold': bold});
      return [
        for (final page in r ?? const [])
          if (page is Map)
            _PdfPageLines(
              (page['aspect'] as num?)?.toDouble() ?? 1,
              [
                if (page['lines'] is List)
                  for (final l in page['lines'] as List)
                    if (l is Map && l['x0'] is num && l['x1'] is num) l.cast<String, Object?>(),
              ],
            ),
      ];
    } catch (_) {
      return const [];
    }
  }

  Widget _buildTocDrawer() {
    final cs = Theme.of(context).colorScheme;
    final bool outline = _pdfToc.isNotEmpty;
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(_tr('목차', 'Contents', '目录', '目次'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
            const Divider(height: 1),
            Expanded(
              child: _pdfTocProgress != null
                  ? OutlineProgressView(
                      progress: _pdfTocProgress!,
                      label: _tr('목차 만드는 중', 'Building contents', '正在生成目录', '目次を作成中'),
                      hint: _tr('처음 한 번만 만들고, 다음부터는 바로 보여요', 'Only the first time — next time it opens instantly', '仅首次生成，下次直接显示', '初回のみ作成し、次回からはすぐ表示されます'),
                    )
                  : ListView.builder(
                itemCount: outline ? _pdfToc.length : _totalPages,
                itemBuilder: (context, index) {
                  final item = outline ? _pdfToc[index] : null;
                  final int page = item == null ? index : (item['page'] as int);
                  final int level = item == null ? 1 : (item['level'] as int);
                  return ListTile(
                    contentPadding: EdgeInsets.only(left: 16.0 + (level - 1).clamp(0, 4) * 18.0, right: 16),
                    title: Text(
                      item == null ? _tr('${index + 1}쪽', 'Page ${index + 1}', '第${index + 1}页', '${index + 1}ページ') : (item['title'] as String),
                      style: outline ? TextStyle(fontSize: level <= 1 ? 15.5 : 14, fontWeight: level <= 1 ? FontWeight.w700 : FontWeight.w400) : null,
                    ),
                    trailing: outline ? Text('${page + 1}', style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant)) : null,
                    onTap: () {
                      Navigator.pop(context);
                      _goToPage(page, smoothAnimation: false);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool get _isPdfFile => widget.isPdf || widget.files.first.path.toLowerCase().endsWith('.pdf');
  bool _findOpen = false;
  List<({int page, List<Rect> rects})> _findHits = const [];
  int _findCurrent = -1;

  Future<void> _openFind() async {
    // 글자 정보가 없는 PDF(스캔본 등)나 검색을 못 하는 기기도 쪽 그림에서 글자를 읽어 찾음
    if (!mounted) return;
    setState(() {
      _findOpen = true;
      _showControls = false;
    });
  }

  void _closeFind() {
    setState(() {
      _findOpen = false;
      _findHits = const [];
      _findCurrent = -1;
    });
  }

  // 쪽 그림에서 읽은 글자 (스캔본 검색용, 한 번 읽은 쪽은 기억)
  final Map<int, List<Map>> _ocrCache = {};

  /// 띄어쓰기·대소문자를 무시하고 줄들에서 찾기: 줄 {t, x0, x1, y, h} (0~1)
  static List<Rect> _matchLines(List<Map> lines, String query) {
    final q = query.replaceAll(RegExp(r'\s+'), '').toLowerCase();
    final out = <Rect>[];
    if (q.isEmpty) return out;
    for (final l in lines) {
      final t = '${l['t'] ?? ''}';
      final x0 = (l['x0'] as num?)?.toDouble(), x1 = (l['x1'] as num?)?.toDouble();
      final y = (l['y'] as num?)?.toDouble(), h = (l['h'] as num?)?.toDouble();
      if (t.isEmpty || x0 == null || x1 == null || y == null || h == null) continue;
      // 공백을 뺀 글과 원래 글자 위치 대응
      final idx = <int>[];
      final buf = StringBuffer();
      for (int i = 0; i < t.length; i++) {
        if (t[i].trim().isEmpty) continue;
        idx.add(i);
        buf.write(t[i].toLowerCase());
      }
      final norm = buf.toString();
      for (int at = norm.indexOf(q); at >= 0; at = norm.indexOf(q, at + q.length)) {
        final a = idx[at] / t.length, b = (idx[at + q.length - 1] + 1) / t.length;
        out.add(Rect.fromLTRB(x0 + (x1 - x0) * a, y, x0 + (x1 - x0) * b, y + h));
      }
    }
    return out;
  }

  /// PDF 글자 정보로 못 찾으면: 줄 단위(띄어쓰기 무시) → 글자 정보가 없는 쪽은 쪽 그림에서 글자를 읽어 찾음
  Future<List<({int page, List<Rect> rects})>> _findFallback(String query) async {
    final hits = <({int page, List<Rect> rects})>[];
    final path = widget.files.first.path;
    final noText = <int>[];
    for (int from = 0; from < _totalPages; from += 20) {
      final to = math.min(_totalPages, from + 20);
      final pages = await _pdfLines(path, from, to, false);
      for (int i = from; i < to; i++) {
        final k = i - from;
        final lines = k < pages.length ? pages[k].lines : const <Map<String, Object?>>[];
        if (lines.isEmpty) {
          noText.add(i);
          continue;
        }
        for (final r in _matchLines(lines, query)) {
          hits.add((page: i, rects: [r]));
        }
      }
      if (!mounted || !_findOpen) return hits;
    }
    // 스캔본: 너무 오래 걸리지 않게 앞쪽 120쪽까지
    for (final i in noText.take(120)) {
      if (!mounted || !_findOpen || i >= _imagePages.length) break;
      var lines = _ocrCache[i];
      if (lines == null) {
        try {
          final raw = await _pdfChannel.invokeMethod<List<Object?>>('ocrLines', {'path': _imagePages[i].path}) ?? const [];
          lines = [
            for (final e in raw)
              if (e is Map && e['x'] is num && e['w'] is num)
                {'t': e['t'], 'x0': e['x'], 'x1': (e['x'] as num) + (e['w'] as num), 'y': e['y'], 'h': e['h']},
          ];
        } catch (_) {
          lines = const [];
        }
        _ocrCache[i] = lines;
      }
      for (final r in _matchLines(lines, query)) {
        hits.add((page: i, rects: [r]));
      }
    }
    return hits;
  }

  Future<int> _findSearch(String query) async {
    try {
      List<dynamic>? raw;
      try {
        raw = await _pdfChannel.invokeMethod<List<dynamic>>('pdfSearch', {'path': widget.files.first.path, 'query': query});
      } catch (_) {
        raw = null;
      }
      var hits = <({int page, List<Rect> rects})>[];
      for (final item in raw ?? const []) {
        if (item is! Map) continue;
        final page = (item['page'] as num?)?.toInt();
        final flat = (item['rects'] as List?)?.map((v) => (v as num).toDouble()).toList() ?? const <double>[];
        if (page == null || flat.length < 4) continue;
        final rects = <Rect>[for (int i = 0; i + 3 < flat.length; i += 4) Rect.fromLTRB(flat[i], flat[i + 1], flat[i + 2], flat[i + 3])];
        hits.add((page: page, rects: rects));
      }
      if (hits.isEmpty) hits = await _findFallback(query);
      if (mounted) {
        setState(() {
          _findHits = hits;
          _findCurrent = hits.isEmpty ? -1 : 0;
        });
      }
      return hits.length;
    } catch (_) {
      return 0;
    }
  }

  Future<void> _findGoto(int index) async {
    if (index < 0 || index >= _findHits.length) return;
    setState(() => _findCurrent = index);
    final page = _findHits[index].page;
    if (page != _currentPage && !(_lastIsSpreadMode && page ~/ 2 == _currentPage ~/ 2)) {
      _goToPage(page, smoothAnimation: false);
    }
  }

  /// 쪽 그림 위에 찾은 단어를 노란 형광펜으로
  Widget? _findMarks(int pageIndex, double left, double top, double width, double height) {
    if (_findHits.isEmpty) return null;
    final all = <Rect>[], current = <Rect>[];
    for (int i = 0; i < _findHits.length; i++) {
      final hit = _findHits[i];
      if (hit.page != pageIndex) continue;
      (i == _findCurrent ? current : all).addAll(hit.rects);
    }
    if (all.isEmpty && current.isEmpty) return null;
    return Positioned(
      left: left,
      top: top,
      width: width,
      height: height,
      child: IgnorePointer(child: CustomPaint(painter: _FindMarkPainter(all, current))),
    );
  }

  void _goToPage(
    int page, {
    bool smoothAnimation = true,
    int animDurationMs = 250,
  }) {
    if (page < 0 || page >= _totalPages) return;
    setState(() => _currentPage = page);
    // 스크롤 모드: 그 쪽이 화면 맨 위에 오게
    if (_pageModeScroll) _scrollCtrl.jumpToPage(page);
    _ensurePageDimensionLoaded(page);
    if (page + 1 < _totalPages) _ensurePageDimensionLoaded(page + 1);

    StorageService.saveLastPosition(_bookKey, page.toString());
    if (_totalPages > 0) {
      StorageService.saveProgress(_bookKey, (page + 1) / _totalPages);
      StorageService.savePageLabel(_bookKey, '${page + 1}/$_totalPages');
    }

    final ctrl = _pageController;
    if (ctrl != null && ctrl.hasClients) {
      final int targetViewIdx = _lastIsSpreadMode ? (page ~/ 2) : page;
      final int currentViewIdx = ctrl.page?.round() ?? targetViewIdx;
      if (smoothAnimation && (targetViewIdx - currentViewIdx).abs() <= 2) {
        ctrl.animateToPage(
          targetViewIdx,
          duration: Duration(milliseconds: animDurationMs),
          curve: Curves.easeOutCubic,
        );
      } else {
        ctrl.jumpToPage(targetViewIdx);
      }
    }
  }

  /// 화면을 한 번 눌렀을 때: 탭 모드면 위쪽은 메뉴, 아래 왼쪽·오른쪽은 이전·다음 쪽
  /// (메뉴가 떠 있거나 필기 중이면 메뉴만 닫음. 읽기 방향 우→좌면 왼쪽이 다음, 스크롤 모드는 원래 순서)
  // 두 손가락(확대·축소) 동작 중이었는지: 그 끝에 손가락을 떼는 것은 탭이 아님
  bool _pinchSeen = false;

  void _onViewerTap(Offset local) {
    if (_pinchSeen) return;
    if (!_pageModeTap || _showControls || _isMemoMode) {
      _toggleControls();
      return;
    }
    switch (tapZoneAt(local, MediaQuery.sizeOf(context))) {
      case TapZone.menu:
        _toggleControls();
      case TapZone.left:
        _tapTurn(-1);
      case TapZone.right:
        _tapTurn(1);
    }
  }

  void _tapTurn(int dir) {
    if (_pageModeScroll) {
      _scrollCtrl.scrollByScreen(dir);
      return;
    }
    _stepPage(_isMangaRtlMode ? -dir : dir);
  }

  /// 스크롤 모드: 모든 쪽을 간격 없이 세로로 이어 붙여 보여 줌 (쪽 그림은 이미 다 만들어 둔 것)
  Widget _buildScrollPages() {
    if (_scrollSizes.length < _imagePages.length) _prepareScrollSizes();
    final double dpr = MediaQuery.devicePixelRatioOf(context);
    final double w = MediaQuery.sizeOf(context).width;
    return ContinuousPageList(
      controller: _scrollCtrl,
      count: _imagePages.length,
      aspectOf: _scrollAspect,
      initialPage: _currentPage,
      onPageChanged: (p) {
        setState(() => _currentPage = p);
        StorageService.saveLastPosition(_bookKey, p.toString());
        StorageService.saveProgress(_bookKey, (p + 1) / _totalPages);
        StorageService.savePageLabel(_bookKey, '${p + 1}/$_totalPages');
      },
      pageBuilder: (ctx, i) {
        final img = Image.file(
          _imagePages[i],
          fit: BoxFit.fill,
          cacheWidth: math.min(4096, (w * dpr).round()),
          gaplessPlayback: true,
          filterQuality: FilterQuality.medium,
        );
        // 스크롤 보기에서도 찾은 단어를 형광펜으로
        final all = <Rect>[], current = <Rect>[];
        for (int k = 0; k < _findHits.length; k++) {
          if (_findHits[k].page == i) (k == _findCurrent ? current : all).addAll(_findHits[k].rects);
        }
        if (all.isEmpty && current.isEmpty) return img;
        return Stack(fit: StackFit.expand, children: [
          img,
          IgnorePointer(child: CustomPaint(painter: _FindMarkPainter(all, current))),
        ]);
      },
    );
  }

  void _toggleControls() {
    if (_isTouchLocked) return;
    setState(() => _showControls = !_showControls);
  }

  // 읽기 방향 아이콘: ↔ (지금 방향 쪽 화살촉만 노란색)
  Widget _buildDualDirectionIcon() => DirectionArrowIcon(rightToLeft: _isMangaRtlMode, size: 22);

  double _distToEraserSegment(Offset p, Offset a, Offset b) {
    final ab = b - a;
    final lenSq = ab.dx * ab.dx + ab.dy * ab.dy;
    if (lenSq < 0.0001) return (p - a).distance;
    final t = (((p.dx - a.dx) * ab.dx + (p.dy - a.dy) * ab.dy) / lenSq).clamp(0.0, 1.0);
    final proj = Offset(a.dx + ab.dx * t, a.dy + ab.dy * t);
    return (p - proj).distance;
  }

  // ── 메모 되돌리기 / 다시 실행 ──
  List<int> _visibleMemoPages() {
    final bool isSpreadNow = _isSpreadActive(context);
    if (!isSpreadNow) return [_currentPage];
    final int firstPage = (_currentPage ~/ 2) * 2;
    return [firstPage, if (firstPage + 1 < _totalPages) firstPage + 1];
  }

  Future<void> _applyMemoStrokes(int page, List<MemoStroke> strokes) async {
    setState(() {
      if (strokes.isEmpty) {
        _memoStrokesByPage.remove(page);
      } else {
        _memoStrokesByPage[page] = List<MemoStroke>.of(strokes);
      }
    });
    await StorageService.savePageMemoStrokes(_bookKey, page, strokes);
  }

  Future<void> _undoMemo() async {
    final r = _memoHistory.undo(_visibleMemoPages(), (k) => _memoStrokesByPage[k as int] ?? const []);
    if (r != null) await _applyMemoStrokes(r.$1 as int, r.$2);
  }

  Future<void> _redoMemo() async {
    final r = _memoHistory.redo(_visibleMemoPages(), (k) => _memoStrokesByPage[k as int] ?? const []);
    if (r != null) await _applyMemoStrokes(r.$1 as int, r.$2);
  }

  /// 지우개로 문지르기를 끝냈을 때, 실제로 지워진 게 있으면 되돌리기 기록에 남김
  void _finishEraseHistory(int pageIndex) {
    final start = _eraseStartStrokes;
    _eraseStartStrokes = null;
    if (start == null) return;
    final cur = _memoStrokesByPage[pageIndex] ?? const <MemoStroke>[];
    if (!identical(cur, start)) {
      setState(() => _memoHistory.record(pageIndex, start));
    }
  }

  /// 메모 도구모음 항목: 모두 같은 크기 칸(MemoToolButton)이라 간격이 똑같다
  List<Widget> _memoToolItems() {
    return [
      MemoToolButton(
        // 손가락 끝에서 선이 그어지는 모양 (펜 아이콘과 같은 높이)
        iconBuilder: (c) => FingerDrawIcon(color: c, size: 22),
        label: _tr('손으로 글씨 쓰기', 'Finger Writing', '手指书写', '指で手書き'),
        active: _allowFingerDrawing,
        onTap: () => setState(() => _allowFingerDrawing = !_allowFingerDrawing),
      ),
      // 펜: 누르면 펜 선택, 선택된 상태에서 한 번 더 누르면 선 굵기·색상 설정 창
      MemoToolButton(
        // 깃털 펜 + 잉크병 (잉크병 안 색 = 지금 펜 색)
        iconBuilder: (c) => QuillInkIcon(color: c, ink: _penColor, size: 22),
        label: _tr('펜 (한 번 더 누르면 굵기·색상)', 'Pen (tap again: size & color)', '笔 (再点一次: 粗细·颜色)', 'ペン (もう一度タップ: 太さ・色)'),
        active: !_isEraserMode,
        onTap: () => setState(() => _isEraserMode = false),
        onReselect: (_) => _openPenSettings(),
      ),
      // 지우개: 누르면 지우개 선택, 선택된 상태에서 한 번 더 누르면 획/영역 지우개 선택
      MemoToolButton(
        iconBuilder: (c) => EraserIcon(color: c),
        label: _eraserType == 'stroke'
            ? _tr('획 지우개 (한 번 더 누르면 종류 선택)', 'Stroke Eraser (tap again: type)', '笔画橡皮擦 (再点一次: 类型)', 'ストローク消しゴム (もう一度タップ: 種類)')
            : _tr('영역 지우개 (한 번 더 누르면 종류 선택)', 'Area Eraser (tap again: type)', '区域橡皮擦 (再点一次: 类型)', '部分消しゴム (もう一度タップ: 種類)'),
        active: _isEraserMode,
        onTap: () => setState(() => _isEraserMode = true),
        onReselect: _chooseEraserType,
      ),
      // 되돌리기 / 다시 실행
      MemoToolButton(
        icon: Icons.undo,
        label: _tr('되돌리기', 'Undo', '撤销', '元に戻す'),
        enabled: _memoHistory.canUndo(_visibleMemoPages()),
        onTap: _undoMemo,
      ),
      MemoToolButton(
        icon: Icons.redo,
        label: _tr('다시 실행', 'Redo', '重做', 'やり直し'),
        enabled: _memoHistory.canRedo(_visibleMemoPages()),
        onTap: _redoMemo,
      ),
      MemoToolButton(
        icon: Icons.delete_sweep_outlined,
        color: Colors.redAccent,
        label: _tr('필기 전체 지우기', 'Clear All Strokes', '清空全部手写', '手書きを全消去'),
        onTap: () async {
          final bool isSpreadNow = _isSpreadActive(context);
          final int firstPage = isSpreadNow ? ((_currentPage ~/ 2) * 2) : _currentPage;
          final int secondPage = firstPage + 1;
          for (final pg in {_currentPage, firstPage, if (isSpreadNow && secondPage < _totalPages) secondPage}) {
            final before = _memoStrokesByPage[pg];
            if (before != null && before.isNotEmpty) _memoHistory.record(pg, before);
          }
          setState(() {
            _memoStrokesByPage.remove(_currentPage);
            _memoStrokesByPage.remove(firstPage);
            if (isSpreadNow && secondPage < _totalPages) {
              _memoStrokesByPage.remove(secondPage);
            }
          });
          await StorageService.savePageMemoStrokes(_bookKey, _currentPage, []);
          if (firstPage != _currentPage) {
            await StorageService.savePageMemoStrokes(_bookKey, firstPage, []);
          }
          if (isSpreadNow && secondPage < _totalPages) {
            await StorageService.savePageMemoStrokes(_bookKey, secondPage, []);
          }
        },
      ),
      MemoDoneButton(
        label: _tr('완료', 'Done', '完成', '完了'),
        onTap: () => setState(() {
          _isMemoMode = false;
          _isEraserMode = false;
          _allowFingerDrawing = false;
        }),
      ),
    ];
  }

  /// 메모 도구모음 배치: 하단(기본) / 상단 / 왼쪽 / 오른쪽
  Widget _buildMemoToolbar(double bottomInset) {
    final List<Widget> items = _memoToolItems();
    final double topInset = MediaQuery.paddingOf(context).top;
    final double baseBottom = math.max<double>(bottomInset + 24.0, 28.0);
    final double bottomBarSpace = (((_showControls && _progressBarPos == 'bottom') || _useQuickNavTurn) ? 46.0 : 0.0);
    final double topOffset = topInset + (_showControls ? 64.0 : 16.0);
    switch (_memoToolbarPos) {
      case 'top':
        return Positioned(
          key: const ValueKey('memo_toolbar_top'),
          top: topOffset,
          left: 12 + _safeSides.left,
          right: 12 + _safeSides.right,
          child: Center(child: MemoToolbar(children: items)),
        );
      case 'left':
      case 'right':
        final bool isLeft = _memoToolbarPos == 'left';
        // 같은 쪽에 세로 진행바가 있으면 그 안쪽으로 비켜서 배치
        final double edge = ((_showControls && _progressBarPos == _memoToolbarPos) ? 56.0 : 12.0) + (isLeft ? _safeSides.left : _safeSides.right);
        // 아래쪽 진행바·도구 모음 버튼과 겹치지 않도록.
        // 도구 모음과 같은 쪽이면 활 메뉴가 펼쳐지는 영역까지 비켜 간다 ('완료' 버튼이 가려지지 않게)
        final bool sameSideAsQuickMenu = _showControls && (_quickMenuSide == 'left') == isLeft;
        final double quickMenuBottom =
            baseBottom + ((_progressBarPos == 'bottom' || (_useQuickNavTurn && _quickMenuSide != 'left')) ? 44.0 : 0.0);
        final double bottomLimit = _memoBarToFloorLandscape
            // 5. 가로 모드: 바닥까지 (오른쪽 아래 페이지 이동 버튼이 있으면 그 위까지)
            ? baseBottom + ((_useQuickNavTurn && _memoToolbarPos == 'right') ? 46.0 : 0.0)
            : sameSideAsQuickMenu
            ? math.max(baseBottom + bottomBarSpace, quickMenuBottom + QuickArcMenu.boxHeight + 4.0)
            : baseBottom + bottomBarSpace + (_showControls ? 52.0 : 8.0);
        return Positioned(
          key: ValueKey('memo_toolbar_$_memoToolbarPos'),
          top: topOffset,
          bottom: bottomLimit,
          left: isLeft ? edge : null,
          right: isLeft ? null : edge,
          child: Center(widthFactor: 1, child: MemoToolbar(vertical: true, children: items)),
        );
      default:
        return Positioned(
          key: const ValueKey('memo_toolbar_bottom'),
          bottom: baseBottom + bottomBarSpace,
          left: 12 + _safeSides.left,
          right: 12 + _safeSides.right,
          child: Center(child: MemoToolbar(children: items)),
        );
    }
  }

  /// 6. 카메라(디스플레이 컷아웃)·시스템 영역 여백. 떠 있는 UI가 카메라를 가리지 않도록 좌우에 더한다.
  EdgeInsets get _safeSides => MediaQuery.viewPaddingOf(context);

  bool get _isLandscapeNow {
    final Size sz = MediaQuery.sizeOf(context);
    return sz.width > sz.height;
  }

  /// 가로 모드에서 메모 도구모음이 왼쪽/오른쪽(세로)에 있을 때:
  /// 세로 공간이 좁으므로 메모 도구모음은 바닥까지 길게 내려온다.
  bool get _memoBarToFloorLandscape =>
      _isMemoMode &&
      !_isTouchLocked &&
      _showControls &&
      _isLandscapeNow &&
      (_memoToolbarPos == 'left' || _memoToolbarPos == 'right');

  /// 위 상황에서 도구 모음과 같은 쪽이면 도구 모음 버튼이 메모 도구모음 안쪽 옆으로 비켜 선다
  bool get _quickMenuBesideMemoBar => _memoBarToFloorLandscape && ((_quickMenuSide == 'left') == (_memoToolbarPos == 'left'));

  /// 5. 가로 모드 + 하단 진행바: 진행바를 메모 도구모음 쪽에서 줄인다
  /// (오른쪽 아래 페이지 이동 버튼이 있으면 그쪽은 이미 비어 있으므로 제외)
  bool get _memoBarBesideProgress =>
      _memoBarToFloorLandscape && _progressBarPos == 'bottom' && !(_useQuickNavTurn && _memoToolbarPos == 'right');

  /// 5. 위 상황에서 진행바가 메모 도구모음 쪽에서 비켜 주는 폭 (메모 도구모음 폭 48 + 간격 8)
  static const double _memoBarSideInset = 54.0;

  /// 파일 내보내기: 모든 페이지 + 직접 쓴 필기·텍스트 메모를 PDF 한 파일로 저장 (다운로드/FReader 폴더)
  /// 파일 내보내기는 CBZ·이미지만 (PDF는 제외)
  bool get _canExport => !(widget.isPdf || widget.files.first.path.toLowerCase().endsWith('.pdf'));

  Future<void> _exportToPdf() async {
    if (!_canExport) return;
    if (_imagePages.isEmpty) return;
    final Size view = MediaQuery.sizeOf(context);
    final progress = showExportProgress(context, _tr);
    progress.update(_tr('페이지 준비 중…', 'Preparing pages…', '正在准备页面…', 'ページを準備中…'), null);
    try {
      final pages = <Map<String, Object?>>[];
      // PDF: 원래 파일의 글과 위치를 읽어 내보낸 PDF에도 보이지 않는 글자 층으로 넣음 (지원 기기만)
      List<Object?> textPages = const [];
      if (_isPdfFile) {
        try {
          textPages = await _pdfChannel.invokeMethod<List<Object?>>('pdfTextBoxes', {'path': widget.files.first.path}) ?? const [];
        } catch (_) {}
      }
      for (int i = 0; i < _imagePages.length; i++) {
        final strokes = _memoStrokesByPage[i] ?? const <MemoStroke>[];
        // 필기 굵기는 화면에 그린 폭 기준이므로, 그때의 페이지 표시 폭을 함께 넘긴다
        double refWidth = 0;
        if (strokes.isNotEmpty) {
          final Size img = _pageImageSizes[i] ?? await _getImageDimension(_imagePages[i]);
          if (img.width > 0 && img.height > 0) {
            refWidth = applyBoxFit(BoxFit.contain, img, view).destination.width;
          }
        }
        pages.add({
          'image': _imagePages[i].path,
          'strokes': strokes.map(PdfExportService.strokeToMap).toList(),
          'refWidth': refWidth,
          'note': _memoNotesByPage[i] ?? '',
          if (i < textPages.length && textPages[i] is List) 'texts': textPages[i],
        });
      }
      final saved = await PdfExportService.buildPdf(
        pages: pages,
        // 목차(책갈피)도 그대로 넣음
        outline: _isPdfFile ? _pdfToc : const [],
        fileName: PdfExportService.exportFileName(widget.title, _tr),
        onProgress: (cur, total) => progress.update('$cur / $total', total > 0 ? cur / total : null),
      );
      progress.close();
      _showExportResult(saved, null);
    } catch (e) {
      progress.close();
      _showExportResult(null, e);
    }
  }

  void _showExportResult(String? savedPath, Object? error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 5),
        content: Text(
          error == null
              ? _tr('PDF로 내보냈습니다: $savedPath', 'Exported to PDF: $savedPath', '已导出为 PDF：$savedPath', 'PDFに書き出しました: $savedPath')
              : _tr('PDF 내보내기 실패: ', 'PDF export failed: ', 'PDF 导出失败：', 'PDF書き出し失敗: ') + exportErrorText(error, _tr),
        ),
      ),
    );
  }

  Future<void> _openPenSettings() {
    return showPenSettingsPanel(
      context: context,
      color: _penColor,
      width: _penWidth,
      onColorChanged: (c) => setState(() {
        _penColor = c;
        _isEraserMode = false;
      }),
      onWidthChanged: (w) => setState(() => _penWidth = w),
      tr: _tr,
    );
  }

  Future<void> _chooseEraserType(BuildContext buttonContext) async {
    final v = await showEraserTypeMenu(buttonContext, _eraserType, _tr, barPos: _memoToolbarPos);
    if (v == null || !mounted) return;
    setState(() {
      _eraserType = v;
      _isEraserMode = true;
    });
    await StorageService.setMemoEraserType(v);
  }

  /// 2 & 5. 삼성 노트 스타일 초고속 캡슐 지우개 (드래그 중 디스크 I/O 제거 + 이전 좌표~현재 좌표 연속 캡슐 판정으로 끊김 0%)
  void _eraseStrokeAt(int pageIndex, Offset localPos, double drawWidth, double drawHeight) {
    final strokes = _memoStrokesByPage[pageIndex];
    if (strokes == null || strokes.isEmpty || drawWidth <= 0 || drawHeight <= 0) {
      _lastEraserPos = localPos;
      return;
    }

    final Offset prevPos = _lastEraserPos ?? localPos;
    _lastEraserPos = localPos;

    final double hitRadius = math.max<double>(15.0, _penWidth * 3.2);
    final double minEraserX = math.min(prevPos.dx, localPos.dx) - hitRadius;
    final double maxEraserX = math.max(prevPos.dx, localPos.dx) + hitRadius;
    final double minEraserY = math.min(prevPos.dy, localPos.dy) - hitRadius;
    final double maxEraserY = math.max(prevPos.dy, localPos.dy) + hitRadius;

    bool modifiedAny = false;
    final nextStrokes = <MemoStroke>[];

    for (final s in strokes) {
      if (s.dxList.isEmpty) continue;

      // 바운딩 박스 고속 사전 필터링 (멀리 떨어진 선은 연산 생략)
      double sMinX = double.infinity, sMaxX = double.negativeInfinity;
      double sMinY = double.infinity, sMaxY = double.negativeInfinity;
      for (int i = 0; i < s.dxList.length; i++) {
        final px = s.dxList[i] * drawWidth;
        final py = s.dyList[i] * drawHeight;
        if (px < sMinX) sMinX = px;
        if (px > sMaxX) sMaxX = px;
        if (py < sMinY) sMinY = py;
        if (py > sMaxY) sMaxY = py;
      }
      if (sMaxX < minEraserX || sMinX > maxEraserX || sMaxY < minEraserY || sMinY > maxEraserY) {
        nextStrokes.add(s);
        continue;
      }

      final densePts = <Offset>[];
      for (int i = 0; i < s.dxList.length; i++) {
        final p0 = Offset(s.dxList[i] * drawWidth, s.dyList[i] * drawHeight);
        densePts.add(p0);
        if (i + 1 < s.dxList.length) {
          final p1 = Offset(s.dxList[i + 1] * drawWidth, s.dyList[i + 1] * drawHeight);
          final dist = (p1 - p0).distance;
          if (dist > 4.0) {
            final steps = (dist / 4.0).ceil();
            for (int k = 1; k < steps; k++) {
              final t = k / steps;
              densePts.add(Offset(p0.dx + (p1.dx - p0.dx) * t, p0.dy + (p1.dy - p0.dy) * t));
            }
          }
        }
      }

      bool anyHit = false;
      for (final pt in densePts) {
        if (_distToEraserSegment(pt, prevPos, localPos) <= hitRadius) {
          anyHit = true;
          break;
        }
      }

      if (!anyHit) {
        nextStrokes.add(s);
        continue;
      }

      modifiedAny = true;
      // 획 지우개: 닿은 획은 통째로 지움
      if (_eraserType == 'stroke') continue;
      List<Offset> currentRun = [];
      void flushRun() {
        if (currentRun.isEmpty) return;
        if (currentRun.length == 1) {
          currentRun.add(currentRun.first + const Offset(0.2, 0.2));
        }
        final compact = <Offset>[currentRun.first];
        for (int i = 1; i < currentRun.length - 1; i++) {
          if ((currentRun[i] - compact.last).distance >= 2.2) {
            compact.add(currentRun[i]);
          }
        }
        compact.add(currentRun.last);
        nextStrokes.add(
          MemoStroke(
            dxList: compact.map((p) => (p.dx / drawWidth).clamp(0.0, 1.0).toDouble()).toList(),
            dyList: compact.map((p) => (p.dy / drawHeight).clamp(0.0, 1.0).toDouble()).toList(),
            colorValue: s.colorValue,
            strokeWidth: s.strokeWidth,
          ),
        );
        currentRun = [];
      }

      for (final pt in densePts) {
        if (_distToEraserSegment(pt, prevPos, localPos) <= hitRadius) {
          flushRun();
        } else {
          currentRun.add(pt);
        }
      }
      flushRun();
    }

    if (modifiedAny) {
      setState(() {
        _memoStrokesByPage[pageIndex] = nextStrokes;
      });
    }
  }

  Future<void> _showMemoTextDialog() async {
    final currentNote = _memoNotesByPage[_currentPage] ?? '';
    final ctrl = TextEditingController(text: currentNote);

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${_currentPage + 1}페이지 메모'),
        content: TextField(
          controller: ctrl,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'S펜이나 키보드로 간단한 메모를 남겨보세요.',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          if ((_memoStrokesByPage[_currentPage]?.isNotEmpty ?? false) || currentNote.isNotEmpty)
            TextButton(
              onPressed: () async {
                await StorageService.savePageMemoStrokes(_bookKey, _currentPage, []);
                await StorageService.savePageMemoNote(_bookKey, _currentPage, '');
                setState(() {
                  _memoStrokesByPage.remove(_currentPage);
                  _memoNotesByPage.remove(_currentPage);
                });
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('메모/필기 모두 지우기', style: TextStyle(color: Colors.redAccent)),
            ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
          ElevatedButton(
            onPressed: () async {
              final text = ctrl.text.trim();
              await StorageService.savePageMemoNote(_bookKey, _currentPage, text);
              setState(() {
                if (text.isEmpty) {
                  _memoNotesByPage.remove(_currentPage);
                } else {
                  _memoNotesByPage[_currentPage] = text;
                }
              });
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: Text(_tr('저장', 'Save', '保存', '保存')),
          ),
        ],
      ),
    );
  }

  /// 뷰어 표시 설정 항목 제목: 관련 아이콘 + 문구 (줄바꿈돼도 아이콘이 문구 앞에 붙어 있음)
  Widget _settingsHeader(IconData icon, String text, {bool isTitle = false}) {
    if (isTitle) return Text(text, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800));
    // 구역 이름: 아이콘 + 굵은 글씨를 옅은 띠 위에 두어, 아래 설정이 어느 기능의 것인지 한눈에 보이게
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(color: cs.secondaryContainer.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Icon(icon, size: 18, color: cs.onSecondaryContainer),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: cs.onSecondaryContainer))),
        ],
      ),
    );
  }

  Future<void> _showViewerSettingsSheet() async {
    // 내용이 맨 위일 때 아래로 끌면 창이 따라 내려오고, 충분히 내리면 닫힘
    final sheetCtrl = BottomSheet.createAnimationController(this);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      // 화면의 2/3까지만 가림 (나머지는 스크롤)
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 2 / 3),
      enableDrag: false,
      transitionAnimationController: sheetCtrl,
      builder: (ctx) => SheetPullToClose(
        controller: sheetCtrl,
        builder: (ctx, sheetScroll, sheetPhysics) => StatefulBuilder(
        builder: (ctx, setModalState) => SafeArea(
          child: SingleChildScrollView(
            controller: sheetScroll,
            physics: sheetPhysics,
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 위쪽 가운데 회색 막대 (앱 설정 창처럼)
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                _settingsHeader(Icons.tune, _tr('뷰어 설정', 'Viewer Settings', '阅读器设置', 'ビューア設定'), isTitle: true),
                const SizedBox(height: 12),
                _settingsHeader(Icons.lock_open_outlined, _tr('화면 잠금 끄기 설정 (동시 사용 가능)', 'Screen Unlock Settings (Multiple allowed)', '解除屏幕锁定设置 (可同时启用)', '画面ロック解除設定 (同時使用可)')),
                const SizedBox(height: 8),
                SettingGroup(
                  children: [
                    SettingToggle(
                      label: Text(_tr('음량 버튼 동시에 눌러서 끄기', 'Press Both Volume Keys to Unlock', '同时按音量键关闭锁定', '音量ボタン同時押しで解除')),
                      selected: _useVolumeComboLock,
                      onSelected: (val) async {
                        await StorageService.setUseVolumeComboLock(val);
                        setState(() => _useVolumeComboLock = val);
                        setModalState(() {});
                      },
                    ),
                    SettingToggle(
                      label: Text(_tr('흔들어서 끄기', 'Shake to Unlock', '摇晃关闭锁定', '振って解除')),
                      selected: _useShakeLock,
                      onSelected: (val) async {
                        await StorageService.setUseShakeLock(val);
                        setState(() => _useShakeLock = val);
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 26),
                ..._pageModeSettings(setModalState),

                const SizedBox(height: 26),
                _settingsHeader(Icons.linear_scale, _tr('진행도 UI 위치', 'Progress Bar Position', '进度条位置', '進行度バーの位置')),
                const SizedBox(height: 8),
                SettingGroup(
                  children: [
                    SettingOption(
                      label: Text(_tr('하단', 'Bottom', '底部', '下部')),
                      selected: _progressBarPosSetting == 'bottom',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('bottom');
                        setState(() => _progressBarPosSetting = 'bottom');
                        setModalState(() {});
                      },
                    ),
                    SettingOption(
                      label: Text(_tr('오른쪽', 'Right', '右侧', '右')),
                      selected: _progressBarPosSetting == 'right',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('right');
                        setState(() => _progressBarPosSetting = 'right');
                        setModalState(() {});
                      },
                    ),
                    SettingOption(
                      label: Text(_tr('왼쪽', 'Left', '左侧', '左')),
                      selected: _progressBarPosSetting == 'left',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('left');
                        setState(() => _progressBarPosSetting = 'left');
                        setModalState(() {});
                      },
                    ),
                    SettingOption(
                      label: Text(_tr('숨김', 'Hidden', '隐藏', '非表示')),
                      selected: _progressBarPosSetting == 'hidden',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('hidden');
                        setState(() => _progressBarPosSetting = 'hidden');
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 26),
                _settingsHeader(Icons.draw_outlined, _tr('메모 도구 모음 위치', 'Memo Toolbar Position', '笔记工具栏位置', 'メモツールバーの位置')),
                const SizedBox(height: 8),
                SettingGroup(
                  children: [
                    for (final opt in <(String, String)>[
                      ('bottom', _tr('하단', 'Bottom', '底部', '下部')),
                      ('top', _tr('상단', 'Top', '顶部', '上部')),
                      ('left', _tr('왼쪽', 'Left', '左侧', '左')),
                      ('right', _tr('오른쪽', 'Right', '右侧', '右')),
                    ])
                      SettingOption(
                        label: Text(opt.$2),
                        selected: _memoToolbarPos == opt.$1,
                        onSelected: (_) async {
                          await StorageService.setMemoToolbarPosition(opt.$1);
                          setState(() => _memoToolbarPos = opt.$1);
                          setModalState(() {});
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 26),
                _settingsHeader(Icons.view_week_outlined, _tr('도구 모음 형태', 'Toolbox Style', '工具箱样式', 'ツールボックスの形')),
                const SizedBox(height: 8),
                SettingGroup(
                  children: [
                    for (final opt in <(String, String)>[
                      ('arc', _tr('반원', 'Arc', '半圆', '半円')),
                      ('bar', _tr('바', 'Bar', '横栏', 'バー')),
                    ])
                      SettingOption(
                        label: Text(opt.$2),
                        selected: _toolbarStyle == opt.$1,
                        onSelected: (_) async {
                          await StorageService.setToolbarStyle(opt.$1);
                          setState(() => _toolbarStyle = opt.$1);
                          setModalState(() {});
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 26),
                // 도구 모음 위치는 반원일 때만 (바로 바꾸면 숨김, 고른 위치는 기억)
                if (_toolbarStyle == 'arc') ...[
                  _settingsHeader(Icons.grid_view_rounded, _tr('도구 모음 위치', 'Toolbox Position', '工具箱位置', 'ツールボックスの位置')),
                  const SizedBox(height: 8),
                  SettingGroup(
                    children: [
                      for (final opt in <(String, String)>[
                        ('right', _tr('오른쪽', 'Right', '右侧', '右')),
                        ('left', _tr('왼쪽', 'Left', '左侧', '左')),
                      ])
                        SettingOption(
                          label: Text(opt.$2),
                          selected: _quickMenuSide == opt.$1,
                          onSelected: (_) async {
                            await StorageService.setQuickMenuSide(opt.$1);
                            setState(() => _quickMenuSide = opt.$1);
                            setModalState(() {});
                          },
                        ),
                    ],
                  ),
                  const SizedBox(height: 26),
                ],
                _settingsHeader(Icons.info_outline, _tr('하단 정보 표시', 'Footer Info Display', '底部信息显示', '下部情報表示')),
                const SizedBox(height: 8),
                SettingGroup(
                  children: [
                    SettingOption(
                      label: Text(_tr('정보 표시 없음', 'None', '不显示', '表示なし')),
                      selected: _footerInfoMode == 'none',
                      onSelected: (_) async {
                        await StorageService.setFooterInfoMode('none');
                        setState(() => _footerInfoMode = 'none');
                        setModalState(() {});
                      },
                    ),
                    SettingOption(
                      label: Text(_tr('페이지 번호', 'Page Number', '页码', 'ページ番号')),
                      selected: _footerInfoMode == 'page',
                      onSelected: (_) async {
                        await StorageService.setFooterInfoMode('page');
                        setState(() => _footerInfoMode = 'page');
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                SettingDoneButton(label: _tr('완료', 'Done', '完成', '完了'), onPressed: () => Navigator.of(ctx).pop()),
              ],
            ),
          ),
        ),
      ),
      ),
    );
    disposeSheetControllerWhenDone(sheetCtrl);
  }

  /// 한 화면(1쪽 또는 2쪽 펼침)에 들어갈 페이지 내용
  Widget _buildViewPageContent(int viewIdx, bool isSpread) {
    if (!isSpread) return _buildSinglePagePanel(viewIdx);
    final int firstPage = viewIdx * 2;
    final int secondPage = firstPage + 1;
    final Widget leftPanel = _isMangaRtlMode
        ? (secondPage < _totalPages ? _buildSinglePagePanel(secondPage, spreadSide: -1) : const SizedBox.expand())
        : _buildSinglePagePanel(firstPage, spreadSide: -1);
    final Widget rightPanel = _isMangaRtlMode
        ? _buildSinglePagePanel(firstPage, spreadSide: 1)
        : (secondPage < _totalPages ? _buildSinglePagePanel(secondPage, spreadSide: 1) : const SizedBox.expand());
    return Row(
      children: [
        Expanded(child: leftPanel),
        Expanded(child: rightPanel),
      ],
    );
  }

  /// 위/아래로 미는 동안 지금 화면이 움직이는 만큼, 비는 자리에 다음(이전) 화면을 미리 보여준다
  int? _vPreviewBaseView;

  Widget _buildVerticalSwipeStage(BuildContext context, Widget pages, bool isSpread, int viewItemCount) {
    final double off = _vPageSwipe.offset;
    if (off == 0.0) _vPreviewBaseView = null;
    final List<Widget> children = [Transform.translate(offset: Offset(0, off), child: pages)];
    if (off != 0.0) {
      final int base = _vPreviewBaseView ??= isSpread ? _currentPage ~/ 2 : _currentPage;
      final int dir = off < 0 ? 1 : -1;
      final int target = base + dir;
      if (target >= 0 && target < viewItemCount) {
        final double h = MediaQuery.sizeOf(context).height;
        children.add(
          Transform.translate(
            offset: Offset(0, off + (dir > 0 ? h : -h)),
            child: IgnorePointer(
              child: ColoredBox(color: Colors.black, child: _buildViewPageContent(target, isSpread)),
            ),
          ),
        );
      }
    }
    return Stack(fit: StackFit.expand, clipBehavior: Clip.hardEdge, children: children);
  }

  Widget _buildSinglePagePanel(int pageIndex, {int spreadSide = 0}) {
    if (pageIndex < 0 || pageIndex >= _imagePages.length) {
      return const SizedBox.expand();
    }

    final strokes = _memoStrokesByPage[pageIndex] ?? [];
    final memoNote = _memoNotesByPage[pageIndex] ?? '';
    final imgSize = _pageImageSizes[pageIndex];

    return LayoutBuilder(
      builder: (context, constraints) {
        double drawLeft = 0.0;
        double drawTop = 0.0;
        double drawWidth = constraints.maxWidth;
        double drawHeight = constraints.maxHeight;

        if (imgSize != null && imgSize.width > 0 && imgSize.height > 0) {
          final fitted = applyBoxFit(BoxFit.contain, imgSize, constraints.biggest);
          drawWidth = fitted.destination.width;
          drawHeight = fitted.destination.height;
          // 9. 2페이지 보기 모드에서 왼쪽 페이지는 중앙 쪽(우측)으로, 오른쪽 페이지는 중앙 쪽(좌측)으로 붙여 가운데 여백 최소화!
          if (spreadSide == -1) {
            drawLeft = (constraints.maxWidth - drawWidth - 2.0).clamp(0.0, constraints.maxWidth);
          } else if (spreadSide == 1) {
            drawLeft = 2.0.clamp(0.0, math.max<double>(0.0, constraints.maxWidth - drawWidth));
          } else {
            drawLeft = (constraints.maxWidth - drawWidth) / 2.0;
          }
          drawTop = (constraints.maxHeight - drawHeight) / 2.0;
        } else {
          _ensurePageDimensionLoaded(pageIndex);
        }

        final Alignment pageAlign = spreadSide == -1
            ? Alignment.centerRight
            : (spreadSide == 1 ? Alignment.centerLeft : Alignment.center);

        return Stack(
          fit: StackFit.expand,
          children: [
            RepaintBoundary(
              child: Padding(
                padding: EdgeInsets.only(
                  right: spreadSide == -1 ? 2.0 : 0.0,
                  left: spreadSide == 1 ? 2.0 : 0.0,
                ),
                child: Image.file(
                  _imagePages[pageIndex],
                  fit: BoxFit.contain,
                  alignment: pageAlign,
                  gaplessPlayback: true,
                  filterQuality: FilterQuality.medium,
                  width: constraints.maxWidth,
                  height: constraints.maxHeight,
                ),
              ),
            ),
            // 파일 내 단어 검색: 찾은 곳 형광펜
            ?_findMarks(pageIndex, drawLeft, drawTop, drawWidth, drawHeight),
            // 1. S펜 필기 레이어: EagerStylusPanGestureRecognizer를 통해 S펜이 닿는 즉시 제스처 아레나를 독점하여
            // S펜으로 필기할 때 화면이 같이 움직이거나 페이지가 넘어가는 현상을 100% 차단! (손가락 스와이프로는 페이지 이동 가능)
            if (_isMemoMode)
              Positioned.fill(
                child: StylusOnlyDrawingLayer(
                  enabled: _isMemoMode,
                  allowTouch: _allowFingerDrawing,
                  onStylusDown: (_) {},
                  onStylusMove: (_) {},
                  onStylusUp: (_) {},
                  onStylusCancel: (_) {},
                  child: const SizedBox.expand(),
                ),
              ),
            if (strokes.isNotEmpty || _isMemoMode)
              Positioned(
                left: drawLeft,
                top: drawTop,
                width: drawWidth,
                height: drawHeight,
                child: StylusOnlyDrawingLayer(
                  enabled: _isMemoMode,
                  allowTouch: _allowFingerDrawing,
                  onStylusDown: (event) {
                    final bool useEraser =
                        _isEraserMode || event.kind == PointerDeviceKind.invertedStylus;
                    if (useEraser) {
                      _lastEraserPos = event.localPosition;
                      _eraseStartStrokes = _memoStrokesByPage[pageIndex] ?? const <MemoStroke>[];
                      _eraseStrokeAt(pageIndex, event.localPosition, drawWidth, drawHeight);
                    } else {
                      setState(() {
                        _activeDrawingPageIndex = pageIndex;
                        _activeStrokePoints
                          ..clear()
                          ..add(event.localPosition);
                      });
                    }
                  },
                  onStylusMove: (event) {
                    final bool useEraser =
                        _isEraserMode || event.kind == PointerDeviceKind.invertedStylus;
                    if (useEraser) {
                      _eraseStrokeAt(pageIndex, event.localPosition, drawWidth, drawHeight);
                    } else {
                      setState(() {
                        _activeStrokePoints.add(event.localPosition);
                      });
                    }
                  },
                  onStylusUp: (event) async {
                    _lastEraserPos = null;
                    final bool useEraser =
                        _isEraserMode || event.kind == PointerDeviceKind.invertedStylus;
                    if (useEraser) {
                      _finishEraseHistory(pageIndex);
                      final list = _memoStrokesByPage[pageIndex] ?? [];
                      await StorageService.savePageMemoStrokes(_bookKey, pageIndex, list);
                    } else if (_activeStrokePoints.isNotEmpty &&
                        drawWidth > 0 &&
                        drawHeight > 0) {
                      final stroke = MemoStroke(
                        dxList: _activeStrokePoints
                            .map((p) => (p.dx / drawWidth).clamp(0.0, 1.0).toDouble())
                            .toList(),
                        dyList: _activeStrokePoints
                            .map((p) => (p.dy / drawHeight).clamp(0.0, 1.0).toDouble())
                            .toList(),
                        colorValue: _penColor.toARGB32(),
                        strokeWidth: _penWidth,
                      );
                      final before = _memoStrokesByPage[pageIndex] ?? const <MemoStroke>[];
                      final list = List<MemoStroke>.from(before)..add(stroke);
                      _memoHistory.record(pageIndex, before);
                      setState(() {
                        _memoStrokesByPage[pageIndex] = list;
                        _activeStrokePoints.clear();
                      });
                      await StorageService.savePageMemoStrokes(_bookKey, pageIndex, list);
                    }
                  },
                  onStylusCancel: (_) async {
                    _lastEraserPos = null;
                    _finishEraseHistory(pageIndex);
                    setState(() => _activeStrokePoints.clear());
                    final list = _memoStrokesByPage[pageIndex] ?? [];
                    await StorageService.savePageMemoStrokes(_bookKey, pageIndex, list);
                  },
                  child: RepaintBoundary(
                    child: CustomPaint(
                      painter: _MemoCanvasPainter(
                        strokes: strokes,
                        currentPoints: pageIndex == _activeDrawingPageIndex ? _activeStrokePoints : const [],
                        currentColor: _penColor,
                        currentWidth: _penWidth,
                      ),
                    ),
                  ),
                ),
              ),

            if (memoNote.isNotEmpty)
              Positioned(
                left: drawLeft + 12.0,
                top: drawTop + 12.0,
                child: GestureDetector(
                  onTap: _showMemoTextDialog,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 220),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade200.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 4)],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.edit_note, size: 14, color: Colors.black87),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            memoNote,
                            style: const TextStyle(color: Colors.black87, fontSize: 12),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Future<void> _showBookmarkSheet() async {
    final bookmarks = await StorageService.getBookmarks(_bookKey);
    if (mounted) {
      setState(() => _bookmarks = bookmarks);
    }
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(_tr('북마크 목록', 'Bookmarks', '书签列表', 'ブックマーク一覧'), style: const TextStyle(fontWeight: FontWeight.bold)),
              trailing: ElevatedButton.icon(
                icon: const Icon(Icons.bookmark_add, size: 16),
                label: Text(_tr('현재 페이지 북마크 추가', 'Bookmark This Page', '添加当前页书签', '現在ページをブックマーク')),
                onPressed: () async {
                  final now = DateTime.now();
                  final bool spread = _isSpreadActive(context);
                  final int first = spread ? (_currentPage ~/ 2) * 2 : _currentPage;
                  await StorageService.addBookmark(
                    _bookKey,
                    BookmarkItem(
                      id: now.millisecondsSinceEpoch.toString(),
                      label: spread && first + 1 < _totalPages ? '${first + 1}, ${first + 2}페이지' : '${first + 1}페이지',
                      position: first.toString(),
                      createdAt: '${now.month}/${now.day} ${now.hour}:${now.minute.toString().padLeft(2, '0')}',
                      spread: spread,
                    ),
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  _showBookmarkSheet();
                },
              ),
            ),
            const Divider(height: 1),
            if (bookmarks.isEmpty)
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text(_tr('저장된 북마크가 없습니다.', 'No saved bookmarks.', '暂无保存的书签。', '保存されたブックマークはありません。')),
              )
            else
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: bookmarks.length,
                  itemBuilder: (_, idx) {
                    final bm = bookmarks[idx];
                    final int bp = int.tryParse(bm.position) ?? 0;
                    return ListTile(
                      leading: Icon(bm.spread ? Icons.menu_book : Icons.bookmark, color: Colors.amber),
                      title: Text(bm.spread && bp + 1 < _totalPages ? '${bp + 1}, ${bp + 2}페이지' : '${bp + 1}페이지'),
                      subtitle: Text('저장 시각: ${bm.createdAt}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () async {
                          await StorageService.removeBookmark(_bookKey, bm.id);
                          if (ctx.mounted) Navigator.pop(ctx);
                          _showBookmarkSheet();
                        },
                      ),
                      onTap: () async {
                        Navigator.pop(ctx);
                        final target = int.tryParse(bm.position) ?? 0;
                        // 2페이지 보기에서 저장한 북마크: 가로 모드 2페이지 보기로 바꾼 뒤 그 쪽으로
                        if (bm.spread && !_pageModeScroll && !_isSpreadActive(context)) {
                          if (_pageDisplay == 'one') {
                            await StorageService.setPageDisplay('auto');
                            if (!mounted) return;
                            setState(() => _pageDisplay = 'auto');
                          }
                          final size = MediaQuery.sizeOf(context);
                          if (size.height >= size.width && _pageDisplay == 'auto') await _applyRotation('landscape');
                          await Future<void>.delayed(const Duration(milliseconds: 700));
                          if (!mounted) return;
                        }
                        _goToPage(target, smoothAnimation: false);
                      },
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// 1. 뷰어 표시에서 페이지 번호를 누르고 숫자를 입력하면 해당 페이지로 이동 (설정에서 페이지 번호가 활성화된 경우만 작동)
  Future<void> _showJumpToPageDialog({bool fromProgressBar = false}) async {
    final bool allowed = fromProgressBar
        ? (_footerInfoMode == 'page' || _footerInfoMode == 'both' || _footerInfoMode == 'none')
        : (_footerInfoMode == 'page' || _footerInfoMode == 'both');
    if (_isTouchLocked || !allowed) return;
    final ctrl = TextEditingController(text: '${_currentPage + 1}');
    ctrl.selection = TextSelection(baseOffset: 0, extentOffset: ctrl.text.length);

    final targetPageOneBased = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          _tr(
            '페이지 이동 (1 ~ $_totalPages)',
            'Go to Page (1 - $_totalPages)',
            '跳转到页码 (1 ~ $_totalPages)',
            'ページ移動 (1 ~ $_totalPages)',
          ),
        ),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            hintText: '1 ~ $_totalPages',
            border: const OutlineInputBorder(),
          ),
          onSubmitted: (val) {
            final parsed = int.tryParse(val.trim());
            Navigator.pop(ctx, parsed);
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル')),
          ),
          ElevatedButton(
            onPressed: () {
              final parsed = int.tryParse(ctrl.text.trim());
              Navigator.pop(ctx, parsed);
            },
            child: Text(_tr('이동', 'Go', '跳转', '移動')),
          ),
        ],
      ),
    );

    if (targetPageOneBased != null && mounted) {
      final clampedPage = (targetPageOneBased - 1).clamp(0, _totalPages - 1).toInt();
      _goToPage(clampedPage, smoothAnimation: false);
    }
  }

  String _formatFooterText(bool isSpread) {
    if (_footerInfoMode == 'none') return '';
    final int effectivePage = (isSpread && (_currentPage + 2 >= _totalPages)) ? _totalPages : (_currentPage + 1);
    final double progPercent = _totalPages > 0 ? (effectivePage / _totalPages * 100.0).clamp(0.0, 100.0).toDouble() : 0.0;
    final String progStr = '${progPercent.toStringAsFixed(1)}%';
    final String pageStr = isSpread && (_currentPage + 1 < _totalPages)
        ? '${_currentPage + 1}-${_currentPage + 2} / $_totalPages'
        : '${_currentPage + 1} / $_totalPages';

    if (_footerInfoMode == 'progress') {
      return progStr;
    } else if (_footerInfoMode == 'page') {
      return pageStr;
    } else {
      return '$progStr  |  $pageStr';
    }
  }

  /// 6. 진행도 UI의 화살표를 맨 처음(0페이지)과 맨 마지막(_totalPages - 1 페이지)으로 즉시 이동하는 용도로 변경!
  /// + 하단 배치 시 우측 하단 페이지 이동 버튼과 절대 겹치지 않도록 슬림/컴팩트 사이즈로 축소 및 여백 확보!
  Widget _buildProgressControlBar(double bottomInset) {
    if (!_showControls || _isTouchLocked || _totalPages <= 1 || _progressBarPos == 'hidden') {
      return const Positioned(
        key: ValueKey('progress_bar_hidden'),
        left: 0,
        bottom: 0,
        width: 0,
        height: 0,
        child: SizedBox.shrink(),
      );
    }

    final bool isSpreadNow = _isSpreadActive(context);
    final int displayedPageNum = (isSpreadNow && (_currentPage + 2 >= _totalPages))
        ? _totalPages
        : (_currentPage + 1).clamp(1, _totalPages).toInt();
    final double sliderMax = math.max<double>(1.0, (_totalPages - 1).toDouble());
    final double sliderVal = (displayedPageNum - 1).toDouble().clamp(0.0, sliderMax).toDouble();
    final double baseBottom = math.max<double>(bottomInset + 24.0, 28.0);

    if (_progressBarPos == 'bottom') {
      return Positioned(
        key: const ValueKey('progress_bar_bottom'),
        left: 14.0 + _safeSides.left + ((_memoBarBesideProgress && _memoToolbarPos == 'left') ? _memoBarSideInset : 0.0),
        // 페이지 이동 버튼(우측 12.0, 너비 약 88px -> 우측 100px 차지)과 겹치지 않도록 118px 여유 간격 확보
        right: (_useQuickNavTurn ? 118.0 : 14.0) + _safeSides.right + ((_memoBarBesideProgress && _memoToolbarPos == 'right') ? _memoBarSideInset : 0.0),
        bottom: baseBottom,
        height: 38.0,
        child: Material(
          color: Colors.black87,
          borderRadius: BorderRadius.circular(19),
          elevation: 5,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.first_page, color: Colors.white, size: 16),
                  tooltip: '처음으로 이동',
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  onPressed: () => _goToPage(0, smoothAnimation: false),
                ),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 2.8,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.0),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 11.0),
                    ),
                    child: Slider(
                      value: sliderVal,
                      min: 0.0,
                      max: sliderMax,
                      onChanged: (v) => _goToPage(v.round(), smoothAnimation: false),
                    ),
                  ),
                ),
                GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: (_footerInfoMode == 'page' || _footerInfoMode == 'both' || _footerInfoMode == 'none')
                      ? () => _showJumpToPageDialog(fromProgressBar: true)
                      : null,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                    child: Text(
                      '$displayedPageNum/$_totalPages',
                      style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.last_page, color: Colors.white, size: 16),
                  tooltip: '마지막으로 이동',
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  onPressed: () => _goToPage(_totalPages - 1, smoothAnimation: false),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final double topInset = MediaQuery.paddingOf(context).top;
    final bool memoBarVisible = _isMemoMode && !_isTouchLocked;
    // 메모 도구모음이 상단/하단에 있으면 세로 진행바가 그만큼 비켜 준다
    final double safeTopOffset = topInset + (_showControls ? 64.0 : 16.0) + ((memoBarVisible && _memoToolbarPos == 'top') ? 52.0 : 0.0);
    final double safeBottomOffset = baseBottom + ((memoBarVisible && _memoToolbarPos == 'bottom') ? 96.0 : (_useQuickNavTurn && _progressBarPos == 'right' ? 48.0 : 8.0));
    return Positioned(
      key: ValueKey('progress_bar_$_progressBarPos'),
      top: safeTopOffset,
      bottom: safeBottomOffset,
      left: _progressBarPos == 'left' ? 8.0 + _safeSides.left : null,
      right: _progressBarPos == 'right' ? 8.0 + _safeSides.right : null,
      width: 40.0,
      child: Material(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(20),
        elevation: 5,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            children: [
              IconButton(
                icon: const Icon(Icons.vertical_align_top, color: Colors.white, size: 16),
                tooltip: '처음으로 이동',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                onPressed: () => _goToPage(0, smoothAnimation: false),
              ),
              Expanded(
                child: RotatedBox(
                  quarterTurns: 1,
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 2.8,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.0),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 11.0),
                    ),
                    child: Slider(
                      value: sliderVal,
                      min: 0.0,
                      max: sliderMax,
                      onChanged: (v) => _goToPage(v.round(), smoothAnimation: false),
                    ),
                  ),
                ),
              ),
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: (_footerInfoMode == 'page' || _footerInfoMode == 'both' || _footerInfoMode == 'none')
                    ? () => _showJumpToPageDialog(fromProgressBar: true)
                    : null,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
                  child: Text(
                    '$displayedPageNum/$_totalPages',
                    style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.vertical_align_bottom, color: Colors.white, size: 16),
                tooltip: '마지막으로 이동',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                onPressed: () => _goToPage(_totalPages - 1, smoothAnimation: false),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickNavButtons(double bottomInset) {
    return Positioned(
      right: 12.0 + _safeSides.right,
      bottom: math.max<double>(bottomInset + 24.0, 28.0),
      height: 38.0,
      child: Material(
        color: Colors.black87,
        borderRadius: BorderRadius.circular(19),
        elevation: 5,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.amber, size: 17),
                tooltip: '이전 페이지',
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                padding: EdgeInsets.zero,
                onPressed: () => _stepPage(-1),
              ),
              Container(width: 1, height: 18, color: Colors.white24),
              IconButton(
                icon: const Icon(Icons.arrow_forward, color: Colors.amber, size: 17),
                tooltip: '다음 페이지',
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                padding: EdgeInsets.zero,
                onPressed: () => _stepPage(1),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    SystemBars.leaveViewer();
    _vPageSwipe.dispose();
    if (_shakeListeningSent == true) VolumeKeyService.setShakeListening(false);
    // 서재로 완전히 복귀할 때 방향이 초기화됨
    _zoomController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    _volumeKeyService.stopListening();
    _pageController?.dispose();
    super.dispose();
  }

  // 흔들기 센서는 화면 잠금 중(그리고 흔들기 해제가 허용될 때)에만 켠다
  bool? _shakeListeningSent;
  void _syncShakeListening() {
    final bool want = _isTouchLocked && (_useShakeLock || !_useVolumeComboLock);
    if (_shakeListeningSent == want) return;
    _shakeListeningSent = want;
    VolumeKeyService.setShakeListening(want);
  }

  // 오른쪽 아래 빠른 메뉴(호 모양)에 들어가는 기능들 (예전 상단바 버튼과 동작 동일)
  List<QuickArcMenuItem> _buildQuickMenuItems() {
    return [
      QuickArcMenuItem(
        icon: const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 19),
        tooltip: _tr('이전 파일로 이동', 'Previous File', '上一个文件', '前のファイル'),
        onTap: () => _openAdjacentFileInSameGroup(-1),
        closeAfterTap: true,
      ),
      QuickArcMenuItem(
        icon: const Icon(Icons.skip_next_rounded, color: Colors.white, size: 19),
        tooltip: _tr('다음 파일로 이동', 'Next File', '下一个文件', '次のファイル'),
        onTap: () => _openAdjacentFileInSameGroup(1),
        closeAfterTap: true,
      ),
      QuickArcMenuItem(
        icon: const Icon(Icons.lock_outline, color: Colors.white, size: 17),
        tooltip: _tr('화면 잠금', 'Lock Screen', '锁定屏幕', '画面ロック'),
        onTap: () {
          setState(() {
            _isTouchLocked = true;
            _showControls = false;
            _volumeKeyService.ensureInterceptActive();
            _isMemoMode = false;
            _allowFingerDrawing = false;
            _isStylusDown = false;
          });
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text(_buildLockScreenMessage()), duration: const Duration(seconds: 2)));
        },
        closeAfterTap: true,
      ),
      QuickArcMenuItem(
        // 누르면 살짝 흔들리고, 가로로 돌려 둔 상태면 노란색
        // 누르면 회전 설정 창 (자동 / 세로 고정 / 가로 고정). 아이콘은 고른 설정 모양, 고정이면 노란색
        icon: WiggleOnChange(
          trigger: _rotateTapCount,
          child: Icon(
            _rotationIconNow,
            color: StorageService.desiredLandscapeNotifier.value != null ? Colors.amber : Colors.white,
            size: 17,
          ),
        ),
        tooltip: _tr('화면 회전', 'Rotate Screen', '旋转屏幕', '画面回転'),
        onTap: _pickRotation,
        closeAfterTap: true,
      ),
      QuickArcMenuItem(
        // 페이지 표시 (한 페이지 / 두 페이지 / 자동)
        icon: Icon(
          pageDisplayIcon(_pageDisplay),
          color: _pageDisplay != 'one' ? Colors.amber : Colors.white,
          size: 17,
        ),
        tooltip: _tr('페이지 표시', 'Page Display', '页面显示', 'ページ表示'),
        onTap: _pickPageDisplay,
        closeAfterTap: true,
      ),
      QuickArcMenuItem(
        icon: _buildDualDirectionIcon(),
        tooltip: _isMangaRtlMode
            ? _tr('읽기 방향 전환 (우 → 좌)', 'Reading Direction (R → L)', '切换阅读方向 (右 → 左)', '読書方向切替 (右 → 左)')
            : _tr('읽기 방향 전환 (좌 → 우)', 'Reading Direction (L → R)', '切换阅读方向 (左 → 右)', '読書方向切替 (左 → 右)'),
        onTap: () async {
          // 스크롤 모드는 원본 순서 그대로라 읽기 방향을 바꾸지 않음
          if (_pageModeScroll) {
            ScaffoldMessenger.of(context)
              ..clearSnackBars()
              ..showSnackBar(SnackBar(
                content: Text(_tr('스크롤 모드에서는 읽기 방향이 바뀌지 않아요. 탭·슬라이드 모드에서 바꿀 수 있어요.',
                    'Reading direction does not change in scroll mode. Change it in tap/slide mode.',
                    '滚动模式下不能切换阅读方向，请在点击/滑动模式下切换。',
                    'スクロールモードでは読書方向は変わりません。タップ・スライドモードで変更できます。')),
                duration: const Duration(seconds: 2),
              ));
            return;
          }
          final nextRtl = !_isMangaRtlMode;
          await StorageService.setBookReadingDirectionRtl(_bookKey, nextRtl);
          setState(() => _isMangaRtlMode = nextRtl);
          if (mounted) {
            ScaffoldMessenger.of(context).clearSnackBars();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_tr('읽기 방향 전환 (', 'Reading Direction (', '切换阅读方向 (', '読書方向切替 (')),
                    Text(nextRtl ? _tr('우 ', 'R ', '右 ', '右 ') : _tr('좌 ', 'L ', '左 ', '左 ')),
                    const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                    Text(nextRtl ? _tr(' 좌)', ' L)', ' 左)', ' 左)') : _tr(' 우)', ' R)', ' 右)', ' 右)')),
                  ],
                ),
                duration: const Duration(milliseconds: 900),
              ),
            );
          }
        },
      ),
      QuickArcMenuItem(
        icon: QuillInkIcon(color: _isMemoMode ? Colors.amber : Colors.white, size: 22),
        tooltip: _tr('메모', 'Memo', '笔记', 'メモ'),
        onTap: () {
          setState(() {
            _isMemoMode = !_isMemoMode;
            _isEraserMode = false;
            if (!_isMemoMode) _allowFingerDrawing = false;
          });
        },
        closeAfterTap: true,
      ),
      if (_isPdfFile)
        QuickArcMenuItem(
          icon: const Icon(Icons.copy_all_outlined, color: Colors.white, size: 17),
          tooltip: _tr('글자 복사', 'Copy Text', '复制文字', '文字をコピー'),
          onTap: _openTextCopySheet,
          closeAfterTap: true,
        ),
      QuickArcMenuItem(
        icon: Icon(
          _isCurrentPageBookmarked ? Icons.bookmarks : Icons.bookmarks_outlined,
          color: _isCurrentPageBookmarked ? Colors.amber : Colors.white,
          size: 17,
        ),
        tooltip: _tr('북마크', 'Bookmarks', '书签', 'ブックマーク'),
        onTap: _showBookmarkSheet,
        closeAfterTap: true,
      ),
    ];
  }

  /// 지금 보고 있는 쪽(2페이지 보기면 두 쪽)의 글을 보여 주고 복사할 수 있게 함
  Future<void> _openTextCopySheet() async {
    final bool spread = _isSpreadActive(context);
    final int first = spread ? (_currentPage ~/ 2) * 2 : _currentPage;
    final pages = await _pdfLines(widget.files.first.path, first, math.min(_totalPages, first + (spread ? 2 : 1)), false);
    if (!mounted) return;
    var text = pages.map((p) => p.lines.map((l) => l['t']).join('\n')).join('\n\n');
    if (text.trim().isEmpty) {
      // 글자 정보가 없는 쪽(그림으로 된 쪽·스캔본): 쪽 그림에서 글자를 읽어 옴
      final parts = <String>[];
      for (int i = first; i < math.min(_totalPages, first + (spread ? 2 : 1)); i++) {
        if (i >= _imagePages.length) break;
        try {
          final raw = await _pdfChannel.invokeMethod<List<Object?>>('ocrLines', {'path': _imagePages[i].path}) ?? const [];
          final ls = [for (final e in raw) if (e is Map && '${e['t'] ?? ''}'.trim().isNotEmpty) e]
            ..sort((a, b) => ((a['y'] as num?) ?? 0).compareTo((b['y'] as num?) ?? 0));
          parts.add(ls.map((e) => '${e['t']}'.trim()).join('\n'));
        } catch (_) {}
      }
      text = parts.where((t) => t.isNotEmpty).join('\n\n');
    }
    if (!mounted) return;
    await showTextCopySheet(context, text: text, tr: _tr);
  }

  @override
  Widget build(BuildContext context) {
    _syncShakeListening();
    if (_isPreparingPages || _pageController == null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: FileLoadingView(label: _tr('파일 여는 중', 'Opening file', '正在打开文件', 'ファイルを開いています'), dark: true),
      );
    }

    // 키보드(페이지 이동 창 등)가 올라올 때 화면 전체가 매 프레임 다시 그려지지 않도록 필요한 값만 구독
    final double bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    final bool isSpread = _isSpreadActive(context);

    if (isSpread != _lastIsSpreadMode) {
      _lastIsSpreadMode = isSpread;
      final int targetViewIdx = isSpread ? (_currentPage ~/ 2) : _currentPage;
      _pageController?.dispose();
      _pageController = PageController(initialPage: targetViewIdx);
    }

    final int viewItemCount = isSpread ? ((_totalPages + 1) ~/ 2) : _totalPages;
    final String footerText = _formatFooterText(isSpread);

    return PopScope(
      canPop: !_findOpen,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _findOpen) {
          _closeFind(); // 뒤로 가기: 검색만 닫음
          return;
        }
        if (_isTouchLocked) {
          _isTouchLocked = false;
        }
      },
      child: Scaffold(
      key: _scaffoldKey,
      drawer: _isPdfFile ? _buildTocDrawer() : null,
      drawerEnableOpenDragGesture: false,
      // 페이지 이동 창의 키보드가 올라와도 뒤의 책 화면은 줄이지 않는다 (줄어드는 동안 버벅임)
      resizeToAvoidBottomInset: false,
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Positioned.fill(
            child: AbsorbPointer(
              absorbing: _isTouchLocked,
              child: Listener(
                behavior: HitTestBehavior.translucent,
                onPointerDown: (event) {
                  _vPageSwipe.down(event);
                  if (event.kind == PointerDeviceKind.touch) {
                    if (_activeTouchPointerIds.isEmpty) _pinchSeen = false;
                    _activeTouchPointerIds.add(event.pointer);
                    if (_activeTouchPointerIds.length >= 2) {
                      _pinchSeen = true;
                      setState(() {});
                    }
                  }
                  if (_isMemoMode &&
                      (event.kind == PointerDeviceKind.stylus ||
                          event.kind == PointerDeviceKind.invertedStylus)) {
                    if (!_isStylusDown) {
                      setState(() => _isStylusDown = true);
                    }
                  }
                },
                onPointerMove: (event) => _vPageSwipe.move(
                  event,
                  enabled: _vSwipeEnabled(event),
                  canTurn: _canStepPage,
                ),
                onPointerUp: (event) {
                  if (_activeTouchPointerIds.remove(event.pointer)) {
                    setState(() {});
                  }
                  _vPageSwipe.up(
                    event,
                    height: MediaQuery.sizeOf(context).height,
                    canTurn: _canStepPage,
                    turnPage: _stepPageInstant,
                    seamless: true,
                  );
                  if (_isStylusDown &&
                      (event.kind == PointerDeviceKind.stylus ||
                          event.kind == PointerDeviceKind.invertedStylus)) {
                    setState(() => _isStylusDown = false);
                  }
                },
                onPointerCancel: (event) {
                  _vPageSwipe.up(
                    event,
                    height: MediaQuery.sizeOf(context).height,
                    canTurn: _canStepPage,
                    turnPage: _stepPageInstant,
                    seamless: true,
                    cancelled: true,
                  );
                  if (_activeTouchPointerIds.remove(event.pointer)) {
                    setState(() {});
                  }
                  if (_isStylusDown) {
                    setState(() => _isStylusDown = false);
                  }
                },
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTapUp: (d) => _onViewerTap(d.localPosition),
                  // PDF: 길게 누르면 그 쪽의 글을 고르고 복사하는 창 (그림으로만 된 쪽은 그림 속 글자를 읽음)
                  onLongPress: _isPdfFile ? () {
                    if (_isMemoMode || _isTouchLocked || _activeTouchPointerIds.length >= 2 || _currentZoomScale > 1.03) return;
                    HapticFeedback.selectionClick();
                    _openTextCopySheet();
                  } : null,
                  // 위/아래로 밀 때 페이지 영역이 손가락을 따라 움직임
                  // 사진·PDF 쪽은 원래 크기·선명도 그대로 (앱 화면을 크게 보여 줄 때도)
                  child: UiUnscale(child: _pageModeScroll ? _buildScrollPages() : AnimatedBuilder(
                    animation: _vPageSwipe,
                    builder: (context, child) => _buildVerticalSwipeStage(context, child!, isSpread, viewItemCount),
                    child: PageView.builder(
                    key: ValueKey('pageview_spread_$isSpread'),
                    controller: _pageController,
                    reverse: _isMangaRtlMode,
                    physics: (_isTouchLocked ||
                            !_useSwipeTurn ||
                            _activeTouchPointerIds.length >= 2 ||
                            _currentZoomScale > 1.03 ||
                            (_isMemoMode && (_isStylusDown || _allowFingerDrawing)))
                        ? const NeverScrollableScrollPhysics()
                        : const BouncingScrollPhysics(),
                  itemCount: viewItemCount,
                  onPageChanged: (viewIdx) {
                    int actualPage = isSpread ? (viewIdx * 2) : viewIdx;
                    if (isSpread && viewIdx == viewItemCount - 1) {
                      actualPage = (_totalPages - 1).clamp(0, _totalPages - 1).toInt();
                    }
                    _zoomController.value = Matrix4.identity();
                    setState(() {
                      _currentZoomScale = 1.0;
                      _currentPage = actualPage;
                    });
                    _ensurePageDimensionLoaded(actualPage);
                    if (actualPage + 1 < _totalPages) _ensurePageDimensionLoaded(actualPage + 1);
                    StorageService.saveLastPosition(_bookKey, actualPage.toString());
                    StorageService.saveProgress(_bookKey, (actualPage + 1) / _totalPages);
                    StorageService.savePageLabel(_bookKey, '${actualPage + 1}/$_totalPages');
                  },
                  itemBuilder: (context, viewIdx) {
                    final Widget pageChild = _buildViewPageContent(viewIdx, isSpread);

                    return InteractiveViewer(
                      transformationController: _zoomController,
                      panEnabled: !_isMemoMode && (_currentZoomScale > 1.03 || _activeTouchPointerIds.length >= 2),
                      scaleEnabled: !_isTouchLocked && (!_isMemoMode || !_allowFingerDrawing),
                      minScale: 1.0,
                      maxScale: 5.0,
                      onInteractionUpdate: (_) {
                        final s = _zoomController.value.getMaxScaleOnAxis();
                        if ((s - _currentZoomScale).abs() > 0.02) {
                          setState(() => _currentZoomScale = s);
                        }
                      },
                      onInteractionEnd: (_) {
                        final s = _zoomController.value.getMaxScaleOnAxis();
                        if (s < 1.03) {
                          _zoomController.value = Matrix4.identity();
                          if (_currentZoomScale != 1.0) {
                            setState(() => _currentZoomScale = 1.0);
                          }
                        } else if ((s - _currentZoomScale).abs() > 0.01) {
                          setState(() => _currentZoomScale = s);
                        }
                      },
                      child: pageChild,
                    );
                  },
                  ),
                  )),
                ),
              ),
            ),
          ),

          if (footerText.isNotEmpty)
            Positioned(
              left: 20 + _safeSides.left,
              right: 20 + _safeSides.right,
              bottom: math.max<double>(bottomInset + 4.0, 8.0),
              child: IgnorePointer(
                ignoring: _isTouchLocked || !(_footerInfoMode == 'page' || _footerInfoMode == 'both'),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: (_footerInfoMode == 'page' || _footerInfoMode == 'both')
                        ? _showJumpToPageDialog
                        : null,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: Text(
                        footerText,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          shadows: [Shadow(color: Colors.black, blurRadius: 4)],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

          if (_isMemoMode && !_isTouchLocked) _buildMemoToolbar(bottomInset),

          if (_findOpen && !_isTouchLocked)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: FindInFileBar(onSearch: _findSearch, onGoto: _findGoto, onClose: _closeFind, tr: _tr),
            ),
          if (_showControls && !_isTouchLocked && !_findOpen)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Material(
                color: Colors.black87,
                child: SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                    child: LayoutBuilder(
                      builder: (context, barConstraints) {
                        const btnConstraints = BoxConstraints(minWidth: 38, minHeight: 40);
                        const btnPadding = EdgeInsets.symmetric(horizontal: 6, vertical: 4);

                        final actionButtons = <Widget>[
                          // 목차 (PDF만) — 검색 왼쪽
                          if (_isPdfFile)
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: btnPadding,
                              constraints: btnConstraints,
                              icon: const Icon(Icons.list, color: Colors.white, size: 17),
                              tooltip: _tr('목차', 'Contents', '目录', '目次'),
                              onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                            ),
                          // 파일 내 단어 검색 (PDF만)
                          if (_isPdfFile)
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: btnPadding,
                              constraints: btnConstraints,
                              icon: const Icon(Icons.search, color: Colors.white, size: 18),
                              tooltip: _tr('파일 내 단어 검색', 'Find in File', '在文件中查找', 'ファイル内検索'),
                              onPressed: _openFind,
                            ),
                          if (_canExport)
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const ExportFileIcon(size: 21),
                            tooltip: _tr('파일 내보내기', 'Export File', '导出文件', 'ファイルを書き出す'),
                            onPressed: _exportToPdf,
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const Icon(Icons.tune, color: Colors.white, size: 17),
                            tooltip: _tr('뷰어 설정', 'Viewer Settings', '阅读器设置', 'ビューア設定'),
                            onPressed: _showViewerSettingsSheet,
                          ),
                        ];

                        return Row(
                          children: [
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: btnPadding,
                              constraints: btnConstraints,
                              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 17),
                              onPressed: () => Navigator.pop(context),
                            ),
                            // 파일 이름은 화면 방향과 상관없이 항상 표시 (남는 공간을 모두 사용)
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 6),
                                child: Text(
                                  widget.title,
                                  style: const TextStyle(color: Colors.white, fontSize: 14),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                ),
                              ),
                            ),
                            ...actionButtons,
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),

          _buildProgressControlBar(bottomInset),

          if (_useQuickNavTurn && !_isTouchLocked && _totalPages > 1)
            _buildQuickNavButtons(bottomInset),

          // 도구 모음 버튼 + 활 모양 메뉴 (상단바/진행바와 함께 보였다 사라짐)
          // 평소엔 진행바 바로 위에 붙어 있고, 열리면 호가 진행바에 닿지 않을 만큼 올라간다
          // 도구 모음 '바' 형태: 화면 아래 가로 막대 (뷰어 설정 → 도구 모음 형태)
          if (_showControls && !_isTouchLocked && _toolbarStyle == 'bar')
            Positioned(
              left: 12.0 + _safeSides.left,
              right: 12.0 + _safeSides.right,
              bottom: math.max<double>(bottomInset + 16.0, 20.0) + 8.0 +
                  ((_progressBarPos == 'bottom' || _useQuickNavTurn) ? 44.0 : 0.0) +
                  ((_isMemoMode && _memoToolbarPos == 'bottom') ? 56.0 : 0.0),
              child: Center(child: QuickToolBar(items: _buildQuickMenuItems())),
            ),
          if (_showControls && !_isTouchLocked && _toolbarStyle == 'arc')
            Positioned(
              right: _quickMenuSide == 'left' ? null : ((_progressBarPos == 'right' ? 56.0 : 12.0) + _safeSides.right + (_quickMenuBesideMemoBar ? 56.0 : 0.0)),
              left: _quickMenuSide == 'left' ? ((_progressBarPos == 'left' ? 56.0 : 12.0) + _safeSides.left + (_quickMenuBesideMemoBar ? 56.0 : 0.0)) : null,
              bottom: math.max<double>(bottomInset + 24.0, 28.0) +
                  // 아래 진행바(또는 오른쪽 아래 페이지 이동 버튼)가 있을 때만 그 위에 붙는다
              ((_progressBarPos == 'bottom' || (_useQuickNavTurn && _quickMenuSide != 'left')) ? 44.0 : 0.0) +
                  ((_isMemoMode && _memoToolbarPos == 'bottom') ? 56.0 : 0.0),
              child: QuickArcMenu(
                key: ValueKey('quick_menu_$_quickMenuSide'),
                leftSide: _quickMenuSide == 'left',
                // 열면 '화면 회전'(4번째)부터 '북마크'까지 먼저 보이고, 호를 밀면 화면 잠금·다음/이전 파일
                initialFirstIndex: 3,
                items: _buildQuickMenuItems(),
              ),
            ),
        ],
      ),
      ),
    );
  }
}

/// 찾은 단어 형광펜 (쪽 크기 대비 0~1 좌표의 사각형)
class _FindMarkPainter extends CustomPainter {
  _FindMarkPainter(this.all, this.current);
  final List<Rect> all;
  final List<Rect> current;

  @override
  void paint(Canvas canvas, Size size) {
    void draw(List<Rect> rects, Color color) {
      final paint = Paint()
        ..color = color
        ..blendMode = BlendMode.multiply;
      for (final r in rects) {
        canvas.drawRect(Rect.fromLTRB(r.left * size.width, r.top * size.height, r.right * size.width, r.bottom * size.height), paint);
      }
    }
    draw(all, const Color(0x99FFEB3B));
    draw(current, const Color(0xE6FFC107));
  }

  @override
  bool shouldRepaint(_FindMarkPainter old) => old.all != all || old.current != current;
}

/// PDF 한 쪽의 모양(가로÷세로)과 줄들
class _PdfPageLines {
  const _PdfPageLines(this.aspect, this.lines);
  final double aspect;
  final List<Map<String, Object?>> lines;
}
