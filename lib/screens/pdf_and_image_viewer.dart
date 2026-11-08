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
import '../services/volume_key_service.dart';
import '../services/txt_to_epub_converter.dart';
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

  const StylusOnlyDrawingLayer({
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
      child: child,
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

class _UniversalMediaReaderScreenState extends State<UniversalMediaReaderScreen> with WidgetsBindingObserver {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');
  PageController? _pageController;
  final VolumeKeyService _volumeKeyService = VolumeKeyService();

  List<File> _imagePages = [];
  final Map<int, Size> _pageImageSizes = {};
  bool _isPreparingPages = true;
  int _currentPage = 0;
  int _totalPages = 1;
  int? _previousJumpPage;
  bool _showControls = false;
  bool _isMangaRtlMode = false;
  bool _enableTwoPageInLandscape = false;
  bool _lastIsSpreadMode = false;

  bool _isTouchLocked = false;
  bool _useShakeLock = false;
  bool _useVolumeComboLock = true;

  bool _useSwipeTurn = true;
  bool _useVolumeTurn = true;
  bool _useQuickNavTurn = false;
  bool _useSpenTurn = false;
  bool? _forcedLandscape;
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
  Color _penColor = Colors.amber;
  double _penWidth = 2.0;

  String _footerInfoMode = 'both';
  String _progressBarPos = 'bottom';
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

  Future<void> _showPenWidthInputDialog() async {
    final ctrl = TextEditingController(text: _penWidth.toStringAsFixed(1));
    ctrl.selection = TextSelection(baseOffset: 0, extentOffset: ctrl.text.length);
    final val = await showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('선 굵기 입력 (0.5 ~ 20.0)', 'Stroke Width (0.5 - 20.0)', '输入线条粗细 (0.5 ~ 20.0)', '선의 太さ入力 (0.5 ~ 20.0)')),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            hintText: '0.5 ~ 20.0',
            border: OutlineInputBorder(),
          ),
          onSubmitted: (v) {
            Navigator.pop(ctx, double.tryParse(v.trim()));
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル')),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx, double.tryParse(ctrl.text.trim()));
            },
            child: Text(_tr('적용', 'Apply', '应用', '適用')),
          ),
        ],
      ),
    );
    if (val != null && mounted) {
      setState(() => _penWidth = val.clamp(0.5, 20.0).toDouble());
    }
  }


  String get _bookKey => widget.customBookKey ?? widget.files.first.path;

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(StorageService.appLangNotifier.value, ko: ko, en: en, zh: zh, ja: ja);

  @override
  void initState() {
    super.initState();
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

  Future<void> _toggleScreenOrientation() async {
    final Size currentSize = MediaQuery.of(context).size;
    final bool currentlyLandscape = currentSize.width > currentSize.height;
    final bool nextLandscape = !currentlyLandscape;
    _forcedLandscape = nextLandscape;
    StorageService.desiredLandscapeNotifier.value = nextLandscape;

    try {
      await _pdfChannel.invokeMethod('setScreenOrientation', {
        'mode': nextLandscape ? 'landscape' : 'portrait',
      });
    } catch (_) {}
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
      'docx', 'doc', 'hwpx', 'hwp'
    ];
    const imageExts = ['jpg', 'jpeg', 'png', 'webp'];
    const docConvertExts = ['txt', 'docx', 'doc'];

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

    if (nextExt == 'epub' || nextExt == 'hwp' || nextExt == 'hwpx') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ReaderScreen(filePath: targetFile!.path, bookTitle: nextName),
        ),
      );

    } else if (docConvertExts.contains(nextExt)) {
      final File epubFile;
      try {
        epubFile = await TxtToEpubConverter.convertDocumentToEpub(targetFile);
      } catch (error) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('문서를 열지 못했습니다: $error')),
        );
        return;
      }
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ReaderScreen(filePath: epubFile.path, bookTitle: nextName),
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
      _enableTwoPageInLandscape = await StorageService.getTwoPageLandscape();
      _isMangaRtlMode = await StorageService.getBookReadingDirectionRtl(_bookKey);
      _useShakeLock = await StorageService.getUseShakeLock();
      _useVolumeComboLock = await StorageService.getUseVolumeComboLock();
      _useVolumeTurn = await StorageService.getUseVolumeTurn();
      _useQuickNavTurn = await StorageService.getUseQuickNavTurn();
      _useSwipeTurn = await StorageService.getUseSwipeTurn();
      _useSpenTurn = await StorageService.getUseSpenTurn();
      _footerInfoMode = await StorageService.getFooterInfoMode();
      _progressBarPos = await StorageService.getProgressBarPosition();
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
    final size = MediaQuery.of(context).size;
    final bool isLandscapeNow = size.width > size.height;
    return _enableTwoPageInLandscape && isLandscapeNow && _totalPages > 1;
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
      recordHistory: false,
      smoothAnimation: true,
      animDurationMs: fastResponse ? 140 : 250,
    );
  }

  void _goToPage(
    int page, {
    bool recordHistory = true,
    bool smoothAnimation = true,
    int animDurationMs = 250,
  }) {
    if (page < 0 || page >= _totalPages) return;
    if (recordHistory && (page - _currentPage).abs() > 2) {
      _previousJumpPage = _currentPage;
    }
    setState(() => _currentPage = page);
    _ensurePageDimensionLoaded(page);
    if (page + 1 < _totalPages) _ensurePageDimensionLoaded(page + 1);

    StorageService.saveLastPosition(_bookKey, page.toString());
    if (_totalPages > 0) {
      StorageService.saveProgress(_bookKey, (page + 1) / _totalPages);
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

  void _toggleControls() {
    if (_isTouchLocked) return;
    setState(() => _showControls = !_showControls);
  }

  Widget _buildDualDirectionIcon() {
    final bool isRightActive = !_isMangaRtlMode;
    const Color activeColor = Colors.amber;
    const Color inactiveColor = Colors.white38;

    return SizedBox(
      width: 24,
      height: 22,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: 1,
            child: Icon(
              Icons.east,
              size: 14,
              color: isRightActive ? activeColor : inactiveColor,
            ),
          ),
          Positioned(
            bottom: 1,
            child: Icon(
              Icons.west,
              size: 14,
              color: !isRightActive ? activeColor : inactiveColor,
            ),
          ),
        ],
      ),
    );
  }

  double _distToEraserSegment(Offset p, Offset a, Offset b) {
    final ab = b - a;
    final lenSq = ab.dx * ab.dx + ab.dy * ab.dy;
    if (lenSq < 0.0001) return (p - a).distance;
    final t = (((p.dx - a.dx) * ab.dx + (p.dy - a.dy) * ab.dy) / lenSq).clamp(0.0, 1.0);
    final proj = Offset(a.dx + ab.dx * t, a.dy + ab.dy * t);
    return (p - proj).distance;
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

  Future<void> _showViewerSettingsSheet() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _tr('뷰어 표시 설정', 'Viewer Display Settings', '阅读器显示设置', '뷰어表示設定'),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text(
                  _tr('화면 잠금 끄기 설정 (동시 사용 가능)', 'Screen Unlock Settings (Multiple allowed)', '解除屏幕锁定设置 (可同时启用)', '画面ロック解除設定 (同時使用可)'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    FilterChip(
                      label: Text(_tr('흔들어서 끄기', 'Shake to Unlock', '摇晃关闭锁定', '振って解除')),
                      selected: _useShakeLock,
                      onSelected: (val) async {
                        await StorageService.setUseShakeLock(val);
                        setState(() => _useShakeLock = val);
                        setModalState(() {});
                      },
                    ),
                    FilterChip(
                      label: Text(_tr('음량 버튼 동시에 눌러서 끄기', 'Press Both Volume Keys to Unlock', '同时按音量键关闭锁定', '音量ボタン同時押しで解除')),
                      selected: _useVolumeComboLock,
                      onSelected: (val) async {
                        await StorageService.setUseVolumeComboLock(val);
                        setState(() => _useVolumeComboLock = val);
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const Divider(height: 20),
                Text(
                  _tr('페이지 전환 설정 (동시 사용 가능)', 'Page Turn Settings (Multiple allowed)', '翻页方式设置 (可同时启用)', 'ページめくり設定 (同時使用可)'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    FilterChip(
                      label: Text(_tr('옆으로 밀기', 'Swipe to Turn', '横向滑动翻页', '横にスワイプ')),
                      selected: _useSwipeTurn,
                      onSelected: (val) async {
                        await StorageService.setUseSwipeTurn(val);
                        setState(() => _useSwipeTurn = val);
                        setModalState(() {});
                      },
                    ),
                    FilterChip(
                      label: Text(_tr('음량 버튼', 'Volume Keys', '音量键', '音量ボタン')),
                      selected: _useVolumeTurn,
                      onSelected: (val) async {
                        await StorageService.setUseVolumeTurn(val);
                        setState(() => _useVolumeTurn = val);
                        setModalState(() {});
                      },
                    ),
                    FilterChip(
                      label: Text(_tr('페이지 이동 버튼', 'Page Nav Buttons', '翻页按钮', 'ページ移動ボタン')),
                      selected: _useQuickNavTurn,
                      onSelected: (val) async {
                        await StorageService.setUseQuickNavTurn(val);
                        setState(() => _useQuickNavTurn = val);
                        setModalState(() {});
                      },
                    ),
                    FilterChip(
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

                const Divider(height: 24),
                Text(
                  _tr('진행도 UI 위치', 'Progress Bar Position', '进度条位置', '進行度バーの位置'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    ChoiceChip(
                      label: Text(_tr('오른쪽', 'Right', '右侧', '右')),
                      selected: _progressBarPos == 'right',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('right');
                        setState(() => _progressBarPos = 'right');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('왼쪽', 'Left', '左侧', '左')),
                      selected: _progressBarPos == 'left',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('left');
                        setState(() => _progressBarPos = 'left');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('하단', 'Bottom', '底部', '下部')),
                      selected: _progressBarPos == 'bottom',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('bottom');
                        setState(() => _progressBarPos = 'bottom');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('숨김', 'Hidden', '隐藏', '非表示')),
                      selected: _progressBarPos == 'hidden',
                      onSelected: (_) async {
                        await StorageService.setProgressBarPosition('hidden');
                        setState(() => _progressBarPos = 'hidden');
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const Divider(height: 24),
                Text(
                  _tr('하단 정보 표시', 'Footer Info Display', '底部信息显示', '下部情報表示'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    ChoiceChip(
                      label: Text(_tr('진행률', 'Progress %', '进度百分比', '進行率')),
                      selected: _footerInfoMode == 'progress',
                      onSelected: (_) async {
                        await StorageService.setFooterInfoMode('progress');
                        setState(() => _footerInfoMode = 'progress');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('페이지 번호', 'Page Number', '页码', 'ページ番号')),
                      selected: _footerInfoMode == 'page',
                      onSelected: (_) async {
                        await StorageService.setFooterInfoMode('page');
                        setState(() => _footerInfoMode = 'page');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('진행률 및 페이지 번호', 'Both Progress & Page', '进度与页码', '進行率とページ番号')),
                      selected: _footerInfoMode == 'both',
                      onSelected: (_) async {
                        await StorageService.setFooterInfoMode('both');
                        setState(() => _footerInfoMode = 'both');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('정보 표시 없음', 'None', '不显示', '表示なし')),
                      selected: _footerInfoMode == 'none',
                      onSelected: (_) async {
                        await StorageService.setFooterInfoMode('none');
                        setState(() => _footerInfoMode = 'none');
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
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
                        colorValue: _penColor.value,
                        strokeWidth: _penWidth,
                      );
                      final list = List<MemoStroke>.from(_memoStrokesByPage[pageIndex] ?? [])
                        ..add(stroke);
                      setState(() {
                        _memoStrokesByPage[pageIndex] = list;
                        _activeStrokePoints.clear();
                      });
                      await StorageService.savePageMemoStrokes(_bookKey, pageIndex, list);
                    }
                  },
                  onStylusCancel: (_) async {
                    _lastEraserPos = null;
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
                      color: Colors.amber.shade200.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 4)],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.edit_note, size: 16, color: Colors.black87),
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
                icon: const Icon(Icons.bookmark_add, size: 18),
                label: Text(_tr('현재 페이지 북마크 추가', 'Bookmark This Page', '添加当前页书签', '現在ページをブックマーク')),
                onPressed: () async {
                  final now = DateTime.now();
                  await StorageService.addBookmark(
                    _bookKey,
                    BookmarkItem(
                      id: now.millisecondsSinceEpoch.toString(),
                      label: '${_currentPage + 1}페이지 북마크',
                      position: _currentPage.toString(),
                      createdAt: '${now.month}/${now.day} ${now.hour}:${now.minute.toString().padLeft(2, '0')}',
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
                    return ListTile(
                      leading: const Icon(Icons.bookmark, color: Colors.amber),
                      title: Text(bm.label),
                      subtitle: Text('저장 시각: ${bm.createdAt}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () async {
                          await StorageService.removeBookmark(_bookKey, bm.id);
                          if (ctx.mounted) Navigator.pop(ctx);
                          _showBookmarkSheet();
                        },
                      ),
                      onTap: () {
                        Navigator.pop(ctx);
                        final target = int.tryParse(bm.position) ?? 0;
                        _goToPage(target, recordHistory: true, smoothAnimation: false);
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
      _goToPage(clampedPage, recordHistory: true, smoothAnimation: false);
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
        left: 14.0,
        // 페이지 이동 버튼(우측 12.0, 너비 약 88px -> 우측 100px 차지)과 겹치지 않도록 118px 여유 간격 확보
        right: _useQuickNavTurn ? 118.0 : 14.0,
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
                  icon: const Icon(Icons.first_page, color: Colors.white, size: 18),
                  tooltip: '처음으로 이동',
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  onPressed: () => _goToPage(0, recordHistory: true, smoothAnimation: false),
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
                  icon: const Icon(Icons.last_page, color: Colors.white, size: 18),
                  tooltip: '마지막으로 이동',
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  onPressed: () => _goToPage(_totalPages - 1, recordHistory: true, smoothAnimation: false),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final double topInset = MediaQuery.of(context).padding.top;
    final double safeTopOffset = topInset + (_showControls ? 64.0 : 16.0);
    final double safeBottomOffset = baseBottom + (_isMemoMode ? 96.0 : (_useQuickNavTurn && _progressBarPos == 'right' ? 48.0 : 8.0));
    return Positioned(
      key: ValueKey('progress_bar_$_progressBarPos'),
      top: safeTopOffset,
      bottom: safeBottomOffset,
      left: _progressBarPos == 'left' ? 8.0 : null,
      right: _progressBarPos == 'right' ? 8.0 : null,
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
                icon: const Icon(Icons.vertical_align_top, color: Colors.white, size: 18),
                tooltip: '처음으로 이동',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                onPressed: () => _goToPage(0, recordHistory: true, smoothAnimation: false),
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
                icon: const Icon(Icons.vertical_align_bottom, color: Colors.white, size: 18),
                tooltip: '마지막으로 이동',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                onPressed: () => _goToPage(_totalPages - 1, recordHistory: true, smoothAnimation: false),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickNavButtons(double bottomInset) {
    return Positioned(
      right: 12.0,
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
                icon: const Icon(Icons.arrow_back, color: Colors.amber, size: 19),
                tooltip: '이전 페이지',
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                padding: EdgeInsets.zero,
                onPressed: () => _stepPage(-1),
              ),
              Container(width: 1, height: 18, color: Colors.white24),
              IconButton(
                icon: const Icon(Icons.arrow_forward, color: Colors.amber, size: 19),
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
    // 서재로 완전히 복귀할 때 방향이 초기화됨
    _zoomController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    _volumeKeyService.stopListening();
    _pageController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isPreparingPages || _pageController == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: Colors.amber),
        ),
      );
    }

    final mediaQuery = MediaQuery.of(context);
    final double bottomInset = mediaQuery.viewPadding.bottom;
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
      onPopInvokedWithResult: (didPop, _) {
        if (_isTouchLocked) {
          _isTouchLocked = false;
        }
      },
      child: Scaffold(
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
                  if (event.kind == PointerDeviceKind.touch) {
                    _activeTouchPointerIds.add(event.pointer);
                    if (_activeTouchPointerIds.length >= 2) {
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
                onPointerUp: (event) {
                  if (_activeTouchPointerIds.remove(event.pointer)) {
                    setState(() {});
                  }
                  if (_isStylusDown &&
                      (event.kind == PointerDeviceKind.stylus ||
                          event.kind == PointerDeviceKind.invertedStylus)) {
                    setState(() => _isStylusDown = false);
                  }
                },
                onPointerCancel: (event) {
                  if (_activeTouchPointerIds.remove(event.pointer)) {
                    setState(() {});
                  }
                  if (_isStylusDown) {
                    setState(() => _isStylusDown = false);
                  }
                },
                child: GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onTap: _toggleControls,
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
                  },
                  itemBuilder: (context, viewIdx) {
                    final Widget pageChild;
                    if (!isSpread) {
                      pageChild = _buildSinglePagePanel(viewIdx);
                    } else {
                      final int firstPage = viewIdx * 2;
                      final int secondPage = firstPage + 1;
                      final Widget leftPanel = _isMangaRtlMode
                          ? (secondPage < _totalPages ? _buildSinglePagePanel(secondPage, spreadSide: -1) : const SizedBox.expand())
                          : _buildSinglePagePanel(firstPage, spreadSide: -1);
                      final Widget rightPanel = _isMangaRtlMode
                          ? _buildSinglePagePanel(firstPage, spreadSide: 1)
                          : (secondPage < _totalPages ? _buildSinglePagePanel(secondPage, spreadSide: 1) : const SizedBox.expand());
                      pageChild = Row(
                        children: [
                          Expanded(child: leftPanel),
                          Expanded(child: rightPanel),
                        ],
                      );
                    }

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
                ),
              ),
            ),
          ),

          if (footerText.isNotEmpty)
            Positioned(
              left: 20,
              right: 20,
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

          if (_isMemoMode && !_isTouchLocked)
            Positioned(
              bottom: math.max<double>(bottomInset + 24.0, 28.0) +
                  (((_showControls && _progressBarPos == 'bottom') || _useQuickNavTurn) ? 46.0 : 0.0),
              left: 12,
              right: 12,
              child: Center(
                child: Material(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(24),
                  elevation: 6,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            constraints: const BoxConstraints(),
                            splashColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                            icon: Icon(
                              Icons.touch_app,
                              color: _allowFingerDrawing ? Colors.amber : Colors.white,
                              size: 20,
                            ),
                            tooltip: _tr('손으로 글씨 쓰기', 'Finger Writing', '手指书写', '指で手書き'),
                            onPressed: () => setState(() => _allowFingerDrawing = !_allowFingerDrawing),
                          ),
                          const SizedBox(width: 6),
                          ...[
                            Colors.amber,
                            Colors.redAccent,
                            Colors.lightBlueAccent,
                            Colors.greenAccent,
                            Colors.white,
                            Colors.black,
                          ].map((c) => GestureDetector(
                                onTap: () => setState(() {
                                  _penColor = c;
                                  _isEraserMode = false;
                                }),
                                child: Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 3),
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: c,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: (!_isEraserMode && _penColor == c)
                                          ? Colors.amberAccent
                                          : Colors.white54,
                                      width: (!_isEraserMode && _penColor == c) ? 2.2 : 1.0,
                                    ),
                                  ),
                                ),
                              )),
                          const SizedBox(width: 4),
                          IconButton(
                            icon: Icon(
                              Icons.cleaning_services_outlined,
                              color: _isEraserMode ? Colors.amber : Colors.white,
                              size: 18,
                            ),
                            tooltip: _tr('지우개', 'Eraser', '橡皮擦', '消しゴム'),
                            onPressed: () => setState(() => _isEraserMode = !_isEraserMode),
                          ),
                          const SizedBox(width: 2),
                          const Icon(Icons.line_weight, color: Colors.white70, size: 15),
                          SizedBox(
                            width: 82,
                            child: SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 2.2,
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5.5),
                                overlayShape: const RoundSliderOverlayShape(overlayRadius: 10.0),
                              ),
                              child: Slider(
                                value: _penWidth.clamp(0.5, 20.0).toDouble(),
                                min: 0.5,
                                max: 20.0,
                                activeColor: Colors.amber,
                                onChanged: (v) => setState(() => _penWidth = v),
                              ),
                            ),
                          ),
                          GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: _showPenWidthInputDialog,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.white38, width: 1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _penWidth.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: Colors.amber,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          IconButton(
                            icon: const Icon(Icons.note_alt_outlined, color: Colors.white, size: 18),
                            tooltip: _tr('텍스트 메모 입력', 'Text Memo', '输入文字笔记', 'テキストメモ入力'),
                            onPressed: _showMemoTextDialog,
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent, size: 18),
                            tooltip: _tr('필기 전체 지우기', 'Clear All Strokes', '清空全部手写', '手書きを全消去'),
                            onPressed: () async {
                              final bool isSpreadNow = _isSpreadActive(context);
                              final int firstPage = isSpreadNow ? ((_currentPage ~/ 2) * 2) : _currentPage;
                              final int secondPage = firstPage + 1;
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
                          TextButton(
                            onPressed: () => setState(() {
                              _isMemoMode = false;
                              _isEraserMode = false;
                              _allowFingerDrawing = false;
                            }),
                            child: Text(_tr('완료', 'Done', '完成', '完了'), style: const TextStyle(color: Colors.amber)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

          if (_showControls && !_isTouchLocked)
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
                        final bool isWide = barConstraints.maxWidth >= 680;
                        const btnConstraints = BoxConstraints(minWidth: 38, minHeight: 40);
                        const btnPadding = EdgeInsets.symmetric(horizontal: 6, vertical: 4);

                        final actionButtons = <Widget>[
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 22),
                            tooltip: _tr('이전 파일로 이동', 'Previous File', '上一个文件', '前のファイル'),
                            onPressed: () => _openAdjacentFileInSameGroup(-1),
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const Icon(Icons.skip_next_rounded, color: Colors.white, size: 22),
                            tooltip: _tr('다음 파일로 이동', 'Next File', '下一个文件', '次のファイル'),
                            onPressed: () => _openAdjacentFileInSameGroup(1),
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const Icon(Icons.lock_outline, color: Colors.white, size: 19),
                            tooltip: _tr('화면 잠금', 'Lock Screen', '锁定屏幕', '画面ロック'),
                            onPressed: () {
                              setState(() {
                                _isTouchLocked = true;
                                _showControls = false;
                                _volumeKeyService.ensureInterceptActive();
                                _isMemoMode = false;
                                _allowFingerDrawing = false;
                                _isStylusDown = false;
                              });
                              ScaffoldMessenger.of(context).clearSnackBars();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(_buildLockScreenMessage()),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                            },
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const Icon(Icons.screen_rotation, color: Colors.white, size: 19),
                            tooltip: _tr('화면 회전', 'Rotate Screen', '旋转屏幕', '画面回転'),
                            onPressed: _toggleScreenOrientation,
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: Icon(
                              Icons.draw_outlined,
                              color: _isMemoMode ? Colors.amber : Colors.white,
                              size: 20,
                            ),
                            tooltip: _tr('메모', 'Memo', '笔记', 'メモ'),
                            onPressed: () {
                              setState(() {
                                _isMemoMode = !_isMemoMode;
                                _isEraserMode = false;
                                if (!_isMemoMode) _allowFingerDrawing = false;
                              });
                            },
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: Icon(
                              _enableTwoPageInLandscape ? Icons.menu_book : Icons.stay_current_portrait,
                              color: _enableTwoPageInLandscape ? Colors.amber : Colors.white,
                              size: 20,
                            ),
                            tooltip: _tr('가로 모드 2페이지 보기', '2-Page Spread in Landscape', '横屏双页显示', '横画面2ページ表示'),
                            onPressed: () async {
                              final nextVal = !_enableTwoPageInLandscape;
                              await StorageService.setTwoPageLandscape(nextVal);
                              setState(() => _enableTwoPageInLandscape = nextVal);
                            },
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: _buildDualDirectionIcon(),
                            tooltip: _isMangaRtlMode
                                ? _tr('읽기 방향 전환 (우 → 좌)', 'Reading Direction (R → L)', '切换阅读方向 (右 → 左)', '読書方向切替 (右 → 左)')
                                : _tr('읽기 방향 전환 (좌 → 우)', 'Reading Direction (L → R)', '切换阅读方向 (左 → 右)', '読書方向切替 (左 → 右)'),
                            onPressed: () async {
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
                                        const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                                        Text(nextRtl ? _tr(' 좌)', ' L)', ' 左)', ' 左)') : _tr(' 우)', ' R)', ' 右)', ' 右)')),
                                      ],
                                    ),
                                    duration: const Duration(milliseconds: 900),
                                  ),
                                );
                              }
                            },
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: Icon(
                              _isCurrentPageBookmarked ? Icons.bookmarks : Icons.bookmarks_outlined,
                              color: _isCurrentPageBookmarked ? Colors.amber : Colors.white,
                              size: 20,
                            ),
                            tooltip: _tr('북마크', 'Bookmarks', '书签', 'ブックマーク'),
                            onPressed: _showBookmarkSheet,
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            padding: btnPadding,
                            constraints: btnConstraints,
                            icon: const Icon(Icons.tune, color: Colors.white, size: 20),
                            tooltip: _tr('뷰어 표시 설정', 'Viewer Settings', '阅读器显示设置', 'ビューア表示設定'),
                            onPressed: _showViewerSettingsSheet,
                          ),
                        ];

                        return Row(
                          children: [
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: btnPadding,
                              constraints: btnConstraints,
                              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                              onPressed: () => Navigator.pop(context),
                            ),
                            if (isWide)
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 6),
                                  child: Text(
                                    widget.title,
                                    style: const TextStyle(color: Colors.white, fontSize: 14),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            if (isWide)
                              ...actionButtons
                            else
                              Expanded(
                                child: SingleChildScrollView(
                                  scrollDirection: Axis.horizontal,
                                  physics: const BouncingScrollPhysics(),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: actionButtons,
                                  ),
                                ),
                              ),
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
        ],
      ),
      ),
    );
  }
}
