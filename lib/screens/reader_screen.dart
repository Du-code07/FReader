import 'dart:async';
import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:path_provider/path_provider.dart';
import '../services/txt_to_epub_converter.dart';
import '../services/storage_service.dart';
import '../services/volume_key_service.dart';
import 'pdf_and_image_viewer.dart';
import '../widgets/hwp_viewer.dart';
import '../widgets/txt_paged_viewer.dart';

class _EpubMemoPainter extends CustomPainter {
  final List<MemoStroke> strokes;
  final List<Offset> currentPoints;
  final Color currentColor;
  final double currentWidth;

  _EpubMemoPainter({
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
  bool shouldRepaint(covariant _EpubMemoPainter oldDelegate) => true;
}

class ReaderScreen extends StatefulWidget {
  final String filePath;
  final String bookTitle;

  const ReaderScreen({
    super.key,
    required this.filePath,
    required this.bookTitle,
  });

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> with WidgetsBindingObserver {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final EpubController _epubController = EpubController();
  final HwpReaderController _hwpController = HwpReaderController();
  final TxtPageController _txtController = TxtPageController();
  bool get _isTxt => widget.filePath.toLowerCase().endsWith('.txt');
  bool get _isOfflineDocument => RegExp(r'\.(hwp|hwpx|docx|doc|txt|ppt|pptx)$', caseSensitive: false).hasMatch(widget.filePath);
  bool get _isDocx => widget.filePath.toLowerCase().endsWith('.docx');
  bool get _isPresentation => RegExp(r'\.pptx?$', caseSensitive: false).hasMatch(widget.filePath);
  String get _documentPositionPrefix => _isPresentation
      ? (widget.filePath.toLowerCase().endsWith('.pptx') ? 'pptx' : 'ppt')
      : _isTxt ? 'txt' : _isDocx
      ? 'docx'
      : widget.filePath.toLowerCase().endsWith('.doc') ? 'doc' : 'hwp';
  int _hwpPage = 0;
  int _hwpPageCount = 0;
  int _hwpRelocation = 0;
  bool _hwpMultiTouch = false;
  final VolumeKeyService _volumeKeyService = VolumeKeyService();

  late String _activeFilePath;
  late EpubSource _epubSource;
  Timer? _loadWatchdog;
  String? _watchdogKey;
  int _readerAttempt = 0;
  bool _readerReady = false;
  bool _closingAfterError = false;
  bool _bridgeProbeRunning = false;

  void _watchReaderLoad(String key) {
    if (_watchdogKey == key) return;
    _watchdogKey = key;
    _readerReady = false;
    _loadWatchdog?.cancel();
    final started = DateTime.now();
    _loadWatchdog = Timer.periodic(const Duration(seconds: 2), (timer) async {
      if (!mounted || _readerReady || _watchdogKey != key) { timer.cancel(); return; }
      if (DateTime.now().difference(started).inSeconds >= 90) {
        timer.cancel();
        _handleReaderLoadError('본문 표시 시간이 초과되었습니다. 파일 손상 여부와 Android System WebView를 확인해 주세요.');
        return;
      }
      if (_bridgeProbeRunning) return;
      _bridgeProbeRunning = true;
      try {
        // Some WebViews emit PlatformReady before epubView.js attaches its
        // listener. Recover that missed event once, only before loadBook starts.
        await _epubController.webViewController?.callMethod('eval', [r"""
          (function () {
            if (typeof loadBook !== 'function' ||
                typeof currentLoadToken === 'undefined' || currentLoadToken !== 0 ||
                !window.flutter_inappwebview ||
                typeof window.flutter_inappwebview.callHandler !== 'function' ||
                window.__freaderReadyRecovered) return;
            window.__freaderReadyRecovered = true;
            window.flutter_inappwebview.callHandler('readyToLoad');
          })()
        """]).timeout(const Duration(seconds: 3));
      } catch (_) {
        // The platform view may still be attaching. The bounded timer retries.
      } finally {
        _bridgeProbeRunning = false;
      }
    });
  }

  void _handleReaderLoadError(Object error) {
    if (!mounted || _closingAfterError) return;
    _loadWatchdog?.cancel();
    // A saved CFI from an older conversion can point at a removed chapter.
    // Retry once from the beginning without deleting bookmarks or memos.
    if (!_isOfflineDocument && _readerAttempt == 0 && ((_currentCfi ?? _initialCfi)?.isNotEmpty ?? false)) {
      setState(() {
        _readerAttempt++;
        _initialCfi = null;
        _currentCfi = null;
        _hasRestoredInitialPosition = true;
        _restoreProgressPending = false;
      });
      return;
    }
    _closingAfterError = true;
    Future<void>.delayed(Duration.zero, () {
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(SnackBar(
        content: Text('문서를 열지 못했습니다: $error'),
        duration: const Duration(seconds: 8),
      ));
    });
  }


  String? _initialCfi;
  String? _currentCfi;
  String? _previousJumpCfi;
  String? _selectedCfiRange;
  bool _isLoading = true;
  String _epubBgTheme = 'white'; // 'white', 'sepia', 'dark'
  bool _enableTwoPageInLandscape = false;
  bool _isMangaRtlMode = false;
  int _fontSize = 18;
  List<EpubChapter> _chapters = [];

  bool _showControls = false;
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
  final TransformationController _epubZoomController = TransformationController();
  double _epubZoomScale = 1.0;

  // 1 & 3. S펜 전용 페이지별 필기 및 지우개 상태 (필기 모드에서 S펜이 닿으면 화면 이동 100% 차단 + 해당 페이지에서만 필기 표시)
  bool _isMemoMode = false;
  bool _isEraserMode = false;
  bool _allowFingerDrawing = false;
  bool _isStylusDown = false;
  String _currentPageLocationKey = 'page_0';
  List<MemoStroke> _epubStrokes = [];
  final List<Offset> _activeStrokePoints = [];
  Color _penColor = Colors.amber;
  double _penWidth = 2.0;
  String _bookMemoNote = '';

  String _footerInfoMode = 'both';
  String _progressBarPos = 'bottom';
  List<BookmarkItem> _bookmarks = [];

  bool get _isCurrentPageBookmarked {
    if (_bookmarks.isEmpty) return false;
    if (_currentCfi != null && _currentCfi!.isNotEmpty) {
      if (_bookmarks.any((bm) => bm.position == _currentCfi)) return true;
    }
    return false;
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
        title: Text(_tr('선 굵기 입력 (0.5 ~ 20.0)', 'Stroke Width (0.5 - 20.0)', '输入线条粗细 (0.5 ~ 20.0)', '線の太さ入力 (0.5 ~ 20.0)')),
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
  double _progress = 0.0;
  double _initialProgress = 0.0;
  bool _restoreProgressPending = false;
  bool _hasRestoredInitialPosition = false;

  Offset? _pointerDownPosition;
  DateTime? _pointerDownTime;

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(StorageService.appLangNotifier.value, ko: ko, en: en, zh: zh, ja: ja);

  String _computeLocationKey(String? cfi, double prog) {
    if (cfi != null && cfi.trim().isNotEmpty) {
      return cfi.trim();
    }
    return 'prog_${(prog * 1000).round()}';
  }

  @override
  void initState() {
    super.initState();
    _activeFilePath = widget.filePath;
    if (!_isOfflineDocument) _epubSource = EpubSource.fromFile(File(_activeFilePath));
    WidgetsBinding.instance.addObserver(this);
    _initReader().catchError((Object error) { _handleReaderLoadError(error); });
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
    final currentPath = widget.filePath.replaceAll(RegExp(r'(_v25_converted|\.v2\.converted|\.converted)\.epub$'), '');
    final currentGroup = await StorageService.getBookGroup(currentPath);
    final favs = await StorageService.getFavoriteBooks();
    final dir = await getApplicationDocumentsDirectory();
    const supportedExts = [
      'epub', 'txt', 'pdf', 'jpg', 'jpeg', 'png', 'webp', 'cbz',
      'docx', 'doc', 'hwpx', 'hwp', 'ppt', 'pptx'
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

    final curIdx = allFiles.indexWhere((f) => f.path == currentPath);
    if (curIdx == -1 || allFiles.length <= 1) {
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

    final nextFile = allFiles[(curIdx + step + allFiles.length * 10) % allFiles.length];
    if (!mounted) return;

    final nextName = nextFile.path.split(Platform.pathSeparator).last;
    final nextExt = nextName.split('.').last.toLowerCase();

    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(nextName),
        duration: const Duration(milliseconds: 900),
      ),
    );

    if (nextExt == 'txt' || nextExt == 'epub' || nextExt == 'hwp' || nextExt == 'hwpx' || nextExt == 'docx' || nextExt == 'doc' || nextExt == 'ppt' || nextExt == 'pptx') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ReaderScreen(filePath: nextFile.path, bookTitle: nextName),
        ),
      );

    } else if (nextExt == 'pdf') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => UniversalMediaReaderScreen(
            files: [nextFile],
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
            files: [nextFile],
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
            files: [nextFile],
            title: nextName,
            isPdf: false,
          ),
        ),
      );
    }
  }

  void _lockTouchScreen() {
    setState(() {
      _isTouchLocked = true;
      _showControls = false;
      _isMemoMode = false;
      _isStylusDown = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('화면 터치가 잠겼습니다. (음량 버튼 2개를 동시에 누르면 잠금 해제)'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _initReader() async {
    if (!_isOfflineDocument) await TxtToEpubConverter.validateEpub(File(_activeFilePath));
    final savedCfi = await StorageService.getLastPosition(widget.filePath);
    final prevCfi = await StorageService.getPreviousPosition(widget.filePath);
    var savedProg = await StorageService.getProgress(widget.filePath);
    if (_isOfflineDocument && !_isPresentation && savedCfi == null) {
      // Preserve approximate reading progress from the previous EPUB conversion.
      // Its CFI and annotations remain stored under the old file; never treat an
      // EPUB location as a HWP physical page or overwrite the old metadata.
      final legacyPath = widget.filePath.replaceFirst(
        RegExp(r'\.(hwp|hwpx|docx|doc|txt)$', caseSensitive: false), '_v25_converted.epub');
      savedProg = await StorageService.getProgress(legacyPath);
    }
    final twoPage = await StorageService.getTwoPageLandscape();
    final isRtl = await StorageService.getBookReadingDirectionRtl(widget.filePath);
    final isDark = await StorageService.getDarkMode();
    final savedBg = await StorageService.getEpubBgTheme();
    final footerMode = await StorageService.getFooterInfoMode();
    final barPos = await StorageService.getProgressBarPosition();
    final shakeLock = await StorageService.getUseShakeLock();
    final volComboLock = await StorageService.getUseVolumeComboLock();
    final volTurn = await StorageService.getUseVolumeTurn();
    final quickTurn = await StorageService.getUseQuickNavTurn();
    final swipeTurn = await StorageService.getUseSwipeTurn();
    final spenTurn = await StorageService.getUseSpenTurn();
    final memo = await StorageService.getPageMemoNote(widget.filePath, 0);

    final initLocKey = _computeLocationKey(savedCfi, savedProg);
    final strokes = await StorageService.getEpubLocationStrokes(widget.filePath, initLocKey);
    final loadedBookmarks = await StorageService.getBookmarks(widget.filePath);

    _bindHardwareButtons();

    if (!mounted) return;
    setState(() {
      _initialCfi = savedCfi;
      _currentCfi = savedCfi;
      _previousJumpCfi = prevCfi;
      _progress = savedProg.clamp(0.0, 1.0).toDouble();
      _initialProgress = _progress;
      _restoreProgressPending = (savedCfi == null || savedCfi.isEmpty) && _progress > 0.01;
      _currentPageLocationKey = initLocKey;
      _enableTwoPageInLandscape = twoPage;
      _isMangaRtlMode = isRtl;
      _epubBgTheme = savedBg.isNotEmpty ? savedBg : (isDark ? 'dark' : 'white');
      _footerInfoMode = footerMode;
      _progressBarPos = barPos;
      _useShakeLock = shakeLock;
      _useVolumeComboLock = volComboLock;
      _useVolumeTurn = volTurn;
      _useQuickNavTurn = quickTurn;
      _useSwipeTurn = swipeTurn;
      _useSpenTurn = spenTurn;
      _bookMemoNote = memo;
      _epubStrokes = strokes;
      _bookmarks = loadedBookmarks;
      _isLoading = false;
    });
  }

  void _readerNext() {
    if (_isTxt) { _txtController.next(); } else if (_isOfflineDocument) { _hwpController.next(); } else { _epubController.next(); }
  }

  void _readerPrevious() {
    if (_isTxt) { _txtController.previous(); } else if (_isOfflineDocument) { _hwpController.previous(); } else { _epubController.prev(); }
  }

  void _readerProgress(double value) {
    if (_isTxt) { _txtController.toProgress(value); } else if (_isOfflineDocument) { _hwpController.toProgress(value); } else { _epubController.toProgressPercentage(value); }
  }

  void _readerDisplay(String position) {
    if (_isTxt) { _txtController.display(position); } else if (_isOfflineDocument) { _hwpController.display(position); } else { _epubController.display(cfi: position); }
  }

  void _onDocumentLoaded(int pageCount) {
      if (!mounted) return;
      setState(() {
        _readerReady = true;
        _hwpPageCount = pageCount;
        _chapters = List.generate(pageCount, (index) => EpubChapter(
          title: _tr('${index + 1}쪽', 'Page ${index + 1}', '第${index + 1}页', '${index + 1}ページ'),
          href: '$_documentPositionPrefix:$index', id: '$_documentPositionPrefix:$index', subitems: const [],
        ));
      });
  }

  Future<void> _onDocumentLocation(int page, int pageCount, String position, double progress) async {
      if (!mounted) return;
      final relocation = ++_hwpRelocation;
      setState(() {
        _hwpPage = page;
        _hwpPageCount = pageCount;
        _currentCfi = position;
        _currentPageLocationKey = position;
        _progress = progress;
        _hasRestoredInitialPosition = true;
        _restoreProgressPending = false;
        _activeStrokePoints.clear();
        _epubStrokes = [];
      });
      await StorageService.saveLastPosition(widget.filePath, position);
      await StorageService.saveProgress(widget.filePath, progress);
      final strokes = await StorageService.getEpubLocationStrokes(widget.filePath, position);
      if (mounted && relocation == _hwpRelocation) setState(() => _epubStrokes = strokes);
  }

  Widget _buildHwpViewer(bool isLandscape) {
    if (_isTxt) {
      return TxtPagedViewer(
        key: ValueKey('text:${widget.filePath}'),
        filePath: widget.filePath,
        controller: _txtController,
        initialPosition: _currentCfi ?? _initialCfi,
        initialProgress: _initialProgress,
        theme: _epubBgTheme,
        spread: isLandscape && _enableTwoPageInLandscape,
        rtl: _isMangaRtlMode,
        onLoaded: _onDocumentLoaded,
        onLocation: _onDocumentLocation,
        onError: _handleReaderLoadError,
      );
    }
    return HwpViewer(
      key: ValueKey('document:${widget.filePath}'),
      filePath: widget.filePath,
      controller: _hwpController,
      initialPosition: _currentCfi ?? _initialCfi,
      initialProgress: _initialProgress,
      theme: _epubBgTheme,
      spread: isLandscape && _enableTwoPageInLandscape,
      rtl: _isMangaRtlMode,
      onLoaded: _onDocumentLoaded,
      onLocation: _onDocumentLocation,
      onError: _handleReaderLoadError,
      onCancelled: () { if (mounted) Navigator.of(context).pop(); },
    );
  }

  void _turnNext() {
    setState(() => _activeStrokePoints.clear());
    if (_isMangaRtlMode) {
      _readerPrevious();
    } else {
      _readerNext();
    }
  }

  void _turnPrev() {
    setState(() => _activeStrokePoints.clear());
    if (_isMangaRtlMode) {
      _readerNext();
    } else {
      _readerPrevious();
    }
  }

  void _jumpToFirstPage() {
    if (_currentCfi != null) {
      setState(() {
        _previousJumpCfi = _currentCfi;
        _progress = 0.0;
        _activeStrokePoints.clear();
      });
    }
    _readerProgress(0.0);
  }

  void _jumpToLastPage() {
    if (_currentCfi != null) {
      setState(() {
        _previousJumpCfi = _currentCfi;
        _progress = 1.0;
        _activeStrokePoints.clear();
      });
    }
    _readerProgress(1.0);
  }

  void _bindHardwareButtons() {
    _volumeKeyService.startListening(
      onVolumeUp: () {
        if (_useVolumeTurn) _turnPrev();
      },
      onVolumeDown: () {
        if (_useVolumeTurn) _turnNext();
      },
      onVolumeBothUnlock: () => _toggleTouchScreenLock(byVolume: true),
      onShakeToggle: () => _toggleTouchScreenLock(byVolume: false),
      onSpenSinglePress: () {
        if (_useSpenTurn) _turnNext();
      },
      onSpenDoublePress: () {
        if (_useSpenTurn) _turnPrev();
      },
      onSpenDoubleRevert: () {
        if (_useSpenTurn) {
          // 첫 번째 클릭에서 이미 1페이지 앞으로 이동했으므로 2페이지 뒤로 이동하여 '이전 페이지'로 즉시 전환!
          _turnPrev();
          Future.delayed(const Duration(milliseconds: 50), () {
            if (mounted) _turnPrev();
          });
        }
      },
    );
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

  /// 2 & 5. 삼성 노트 스타일 초고속 캡슐 지우개 (드래그 중 디스크 I/O 제거)
  void _eraseEpubStrokeAt(Offset localPos, double drawWidth, double drawHeight) {
    if (_epubStrokes.isEmpty || drawWidth <= 0 || drawHeight <= 0) {
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

    for (final s in _epubStrokes) {
      if (s.dxList.isEmpty) continue;

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
      setState(() => _epubStrokes = nextStrokes);
    }
  }

  Future<void> _showEpubMemoDialog() async {
    final ctrl = TextEditingController(text: _bookMemoNote);
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('S펜 간단 메모'),
        content: TextField(
          controller: ctrl,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'S펜이나 키보드로 메모를 남겨보세요.',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          if (_epubStrokes.isNotEmpty || _bookMemoNote.isNotEmpty)
            TextButton(
              onPressed: () async {
                final locKey = _currentPageLocationKey;
                await StorageService.saveEpubLocationStrokes(widget.filePath, locKey, []);
                await StorageService.savePageMemoNote(widget.filePath, 0, '');
                setState(() {
                  _epubStrokes = [];
                  _bookMemoNote = '';
                });
                if (ctx.mounted) Navigator.pop(ctx);
              },
              child: const Text('현재 페이지 필기/메모 지우기', style: TextStyle(color: Colors.redAccent)),
            ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル'))),
          ElevatedButton(
            onPressed: () async {
              final text = ctrl.text.trim();
              await StorageService.savePageMemoNote(widget.filePath, 0, text);
              setState(() => _bookMemoNote = text);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: Text(_tr('저장', 'Save', '保存', '保存')),
          ),
        ],
      ),
    );
  }

  /// 뷰어 표시 설정 (JPG 뷰어와 100% 동일한 UI + EPUB 글자 크기 및 다크 모드 설정 포함)
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _tr('글자 크기', 'Font Size', '字体大小', '文字サイズ'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.text_decrease),
                          onPressed: () {
                            _changeFontSize(-2);
                            setModalState(() {});
                          },
                        ),
                        Text('${_fontSize}pt', style: const TextStyle(fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.text_increase),
                          onPressed: () {
                            _changeFontSize(2);
                            setModalState(() {});
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _tr('배경 색상', 'Background Color', '背景颜色', '背景色'),
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    ChoiceChip(
                      label: Text(_tr('흰색', 'White', '白色', '白')),
                      selected: _epubBgTheme == 'white',
                      onSelected: (_) async {
                        await _setEpubThemeMode('white');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('종이색', 'Sepia', '羊皮纸色', 'セピア')),
                      selected: _epubBgTheme == 'sepia',
                      onSelected: (_) async {
                        await _setEpubThemeMode('sepia');
                        setModalState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: Text(_tr('다크', 'Dark', '深色', 'ダーク')),
                      selected: _epubBgTheme == 'dark',
                      onSelected: (_) async {
                        await _setEpubThemeMode('dark');
                        setModalState(() {});
                      },
                    ),
                  ],
                ),
                const Divider(height: 16),
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

  Future<void> _openBookmarkSheet() async {
    final bookmarks = await StorageService.getBookmarks(widget.filePath);
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
                label: Text(_tr('현재 페이지 북마크', 'Bookmark This Page', '添加当前页书签', '現在ページをブックマーク')),
                onPressed: () async {
                  if (_currentCfi == null) return;
                  final now = DateTime.now();
                  await StorageService.addBookmark(
                    widget.filePath,
                    BookmarkItem(
                      id: now.millisecondsSinceEpoch.toString(),
                      label: '진행률 ${(_progress * 100).toStringAsFixed(1)}% 지점',
                      position: _currentCfi!,
                      createdAt: '${now.month}/${now.day} ${now.hour}:${now.minute.toString().padLeft(2, '0')}',
                    ),
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  _openBookmarkSheet();
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
                          await StorageService.removeBookmark(widget.filePath, bm.id);
                          if (ctx.mounted) Navigator.pop(ctx);
                          _openBookmarkSheet();
                        },
                      ),
                      onTap: () {
                        Navigator.pop(ctx);
                        if (_currentCfi != null) {
                          setState(() => _previousJumpCfi = _currentCfi);
                        }
                        _readerDisplay(bm.position);
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

  void _toggleControls() {
    if (_isTouchLocked) return;
    setState(() => _showControls = !_showControls);
  }

  void _handlePointerDown(PointerDownEvent event) {
    if (_isTouchLocked) return;
    if (_isOfflineDocument) {
      _activeTouchPointerIds.add(event.pointer);
      if (_activeTouchPointerIds.length > 1) _hwpMultiTouch = true;
    }
    if (_isMemoMode &&
        (event.kind == PointerDeviceKind.stylus ||
            event.kind == PointerDeviceKind.invertedStylus)) {
      if (!_isStylusDown) {
        setState(() => _isStylusDown = true);
      }
      return;
    }
    _pointerDownPosition = event.position;
    _pointerDownTime = DateTime.now();
  }

  void _handlePointerUp(PointerUpEvent event, Size screenSize) {
    if (_isOfflineDocument) {
      _activeTouchPointerIds.remove(event.pointer);
      if (_hwpMultiTouch) {
        if (_activeTouchPointerIds.isEmpty) _hwpMultiTouch = false;
        _pointerDownPosition = null;
        _pointerDownTime = null;
        return;
      }
    }
    if (_isStylusDown &&
        (event.kind == PointerDeviceKind.stylus ||
            event.kind == PointerDeviceKind.invertedStylus)) {
      setState(() => _isStylusDown = false);
      return;
    }
    if (_isTouchLocked || _pointerDownPosition == null || _pointerDownTime == null) return;
    if (_isMemoMode &&
        (event.kind == PointerDeviceKind.stylus ||
            event.kind == PointerDeviceKind.invertedStylus)) {
      return;
    }
    final distance = (event.position - _pointerDownPosition!).distance;
    final duration = DateTime.now().difference(_pointerDownTime!).inMilliseconds;

    if (_isOfflineDocument && _useSwipeTurn && _epubZoomScale <= 1.03 && duration < 1200) {
      final delta = event.position - _pointerDownPosition!;
      if (delta.dx.abs() > 60 && delta.dx.abs() > delta.dy.abs() * 1.5) {
        if (delta.dx < 0) { _turnNext(); } else { _turnPrev(); }
        _pointerDownPosition = null;
        _pointerDownTime = null;
        return;
      }
    }

    if (distance < 24.0 && duration < 380) {
      _toggleControls();
    }
    _pointerDownPosition = null;
    _pointerDownTime = null;
  }

  Color _getBgColor() {
    if (_epubBgTheme == 'dark') return const Color(0xFF1E1E1E);
    if (_epubBgTheme == 'sepia') return const Color(0xFFFBF0D9);
    return const Color(0xFFFFFFFF);
  }

  Color _getFgColor() {
    if (_epubBgTheme == 'dark') return const Color(0xFFD4D4D4);
    if (_epubBgTheme == 'sepia') return const Color(0xFF3B2F2F);
    return const Color(0xFF000000);
  }

  EpubTheme _buildTheme() {
    final String cssBg = _epubBgTheme == 'dark'
        ? '#1E1E1E'
        : (_epubBgTheme == 'sepia' ? '#FBF0D9' : '#FFFFFF');
    final String cssFg = _epubBgTheme == 'dark'
        ? '#D4D4D4'
        : (_epubBgTheme == 'sepia' ? '#3B2F2F' : '#000000');

    return EpubTheme.custom(
      backgroundDecoration: BoxDecoration(
        color: _getBgColor(),
      ),
      foregroundColor: _getFgColor(),
      customCss: {
        ':root, html, body': {
          'color-scheme': _epubBgTheme == 'dark' ? 'dark !important' : 'light !important',
          'background': '$cssBg !important',
          'background-color': '$cssBg !important',
          'color': '$cssFg !important',
        },
        'p, div, section, article, span, main, h1, h2, h3, h4, h5, h6, li, td, th, blockquote': {
          'background-color': 'transparent !important',
          'color': '$cssFg !important',
          'word-break': 'keep-all',
          'line-height': '1.75',
          'text-align': 'justify',
        },
        '::selection': {
          'background': 'rgba(255, 215, 0, 0.35)',
        },
      },
    );
  }

  Future<void> _setEpubThemeMode(String mode) async {
    await StorageService.setEpubBgTheme(mode);
    setState(() {
      _initialCfi = _currentCfi;
      _epubBgTheme = mode;
    });
    try {
      if (!_isOfflineDocument) _epubController.updateTheme(theme: _buildTheme());
    } catch (_) {}
  }

  void _changeFontSize(int delta) {
    setState(() => _fontSize = (_fontSize + delta).clamp(12, 32).toInt());
    if (_isOfflineDocument) {
      // Fixed-layout document pages scale as a whole; changing paragraph font sizes
      // would destroy the original tables and pagination.
      final scale = (_fontSize / 18).clamp(1.0, 4.5).toDouble();
      _epubZoomController.value = Matrix4.identity()..scale(scale);
      setState(() => _epubZoomScale = scale);
    } else {
      _epubController.setFontSize(fontSize: _fontSize.toDouble());
    }
  }

  /// 1. 뷰어 표시에서 페이지 번호를 누르고 숫자를 입력하면 해당 페이지로 이동 (설정에서 페이지 번호가 활성화된 경우만 작동)
  Future<void> _showJumpToPageDialog({bool fromProgressBar = false}) async {
    final bool allowed = fromProgressBar
        ? (_footerInfoMode == 'page' || _footerInfoMode == 'both' || _footerInfoMode == 'none')
        : (_footerInfoMode == 'page' || _footerInfoMode == 'both');
    if (_isTouchLocked || !allowed) return;
    final int totalEstPages = _isOfflineDocument ? math.max(1, _hwpPageCount) : (_chapters.isNotEmpty ? _chapters.length * 10 : 100);
    final int curEstPage = _isOfflineDocument ? (_hwpPage + 1).clamp(1, totalEstPages).toInt() : ((_progress * totalEstPages).round()).clamp(1, totalEstPages).toInt();
    final ctrl = TextEditingController(text: '$curEstPage');
    ctrl.selection = TextSelection(baseOffset: 0, extentOffset: ctrl.text.length);

    final targetPageOneBased = await showDialog<int>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          _tr(
            '페이지 이동 (1 ~ $totalEstPages)',
            'Go to Page (1 - $totalEstPages)',
            '跳转到页码 (1 ~ $totalEstPages)',
            'ページ移動 (1 ~ $totalEstPages)',
          ),
        ),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: InputDecoration(
            hintText: '1 ~ $totalEstPages',
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
      final int clamped = targetPageOneBased.clamp(1, totalEstPages).toInt();
      final double targetProg = totalEstPages <= 1
          ? 0.0
          : ((clamped - 1) / (_isOfflineDocument ? totalEstPages - 1 : totalEstPages)).clamp(0.0, 1.0).toDouble();
      if (_currentCfi != null) {
        setState(() => _previousJumpCfi = _currentCfi);
      }
      setState(() {
        _progress = targetProg;
        _activeStrokePoints.clear();
      });
      _readerProgress(targetProg);
    }
  }

  String _formatEpubFooterText() {
    if (_footerInfoMode == 'none') return '';
    final int totalEstPages = _isOfflineDocument ? math.max(1, _hwpPageCount) : (_chapters.isNotEmpty ? _chapters.length * 10 : 100);
    final int curEstPage = _isOfflineDocument ? (_hwpPage + 1).clamp(1, totalEstPages).toInt() : ((_progress * totalEstPages).round()).clamp(1, totalEstPages).toInt();
    final String progStr = '${(_progress * 100).toStringAsFixed(1)}%';
    final String pageStr = '$curEstPage / $totalEstPages';

    if (_footerInfoMode == 'progress') {
      return progStr;
    } else if (_footerInfoMode == 'page') {
      return pageStr;
    } else {
      return '$progStr  |  $pageStr';
    }
  }

  /// 6. 진행도 UI의 화살표를 맨 처음(0.0)과 맨 마지막(1.0)으로 즉시 이동하는 용도로 변경!
  /// + 하단 배치 시 우측 하단 페이지 이동 버튼과 절대 겹치지 않도록 슬림/컴팩트 사이즈로 축소 및 여백 확보!
  Widget _buildEpubProgressBar(double bottomInset) {
    if (!_showControls || _isTouchLocked || _progressBarPos == 'hidden' || (_chapters.length <= 1 && _progress <= 0.0)) {
      return const Positioned(
        key: ValueKey('epub_progress_bar_hidden'),
        left: 0,
        bottom: 0,
        width: 0,
        height: 0,
        child: SizedBox.shrink(),
      );
    }

    final double val = _progress.clamp(0.0, 1.0).toDouble();
    final double baseBottom = math.max<double>(bottomInset + 24.0, 28.0);

    if (_progressBarPos == 'bottom') {
      return Positioned(
        key: const ValueKey('epub_progress_bar_bottom'),
        left: 14.0,
        // 페이지 이동 버튼(우측 12.0, 너비 약 88px -> 우측 100px 차지)과 겹치지 않도록 118px 여유 간격 확보
        right: _useQuickNavTurn ? 118.0 : 14.0,
        bottom: baseBottom,
        height: 38.0,
        child: Material(
          elevation: 5,
          color: Colors.black87,
          borderRadius: BorderRadius.circular(19),
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
                  onPressed: _jumpToFirstPage,
                ),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 2.8,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.0),
                      overlayShape: const RoundSliderOverlayShape(overlayRadius: 11.0),
                    ),
                    child: Slider(
                      value: val,
                      min: 0.0,
                      max: 1.0,
                      onChanged: (v) => setState(() => _progress = v),
                      onChangeEnd: (v) {
                        if (_currentCfi != null) {
                          setState(() => _previousJumpCfi = _currentCfi);
                        }
                        _readerProgress(v);
                      },
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
                      '${(_progress * 100).toStringAsFixed(0)}%',
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.last_page, color: Colors.white, size: 18),
                  tooltip: '마지막으로 이동',
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                  onPressed: _jumpToLastPage,
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
      key: ValueKey('epub_progress_bar_$_progressBarPos'),
      top: safeTopOffset,
      bottom: safeBottomOffset,
      left: _progressBarPos == 'left' ? 8.0 : null,
      right: _progressBarPos == 'right' ? 8.0 : null,
      width: 40.0,
      child: Material(
        elevation: 5,
        color: Colors.black87,
        borderRadius: BorderRadius.circular(20),
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
                onPressed: _jumpToFirstPage,
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
                      value: val,
                      min: 0.0,
                      max: 1.0,
                      onChanged: (v) => setState(() => _progress = v),
                      onChangeEnd: (v) {
                        if (_currentCfi != null) {
                          setState(() => _previousJumpCfi = _currentCfi);
                        }
                        _readerProgress(v);
                      },
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
                    '${(_progress * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.vertical_align_bottom, color: Colors.white, size: 18),
                tooltip: '마지막으로 이동',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                onPressed: _jumpToLastPage,
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
                onPressed: _turnPrev,
              ),
              Container(width: 1, height: 18, color: Colors.white24),
              IconButton(
                icon: const Icon(Icons.arrow_forward, color: Colors.amber, size: 19),
                tooltip: '다음 페이지',
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(minWidth: 34, minHeight: 34),
                padding: EdgeInsets.zero,
                onPressed: _turnNext,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _volumeKeyService.stopListening();
    _loadWatchdog?.cancel();
    _epubZoomController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final mediaQuery = MediaQuery.of(context);
    final screenSize = mediaQuery.size;
    final bottomPadding = mediaQuery.viewPadding.bottom;
    final bool isLandscape = screenSize.width > screenSize.height;
    final EpubSpread spreadSetting =
        (isLandscape && _enableTwoPageInLandscape) ? EpubSpread.always : EpubSpread.none;

    final viewerKey = '${_activeFilePath}_${spreadSetting}_${_epubBgTheme}_$_readerAttempt';
    if (!_isOfflineDocument) _watchReaderLoad(viewerKey);
    final bgColor = _getBgColor();
    final footerTextColor = _epubBgTheme == 'dark' ? Colors.white54 : Colors.black54;
    final footerText = _formatEpubFooterText();

    return PopScope(
      onPopInvokedWithResult: (didPop, _) {
        if (_isTouchLocked) {
          _isTouchLocked = false;
        }
      },
      child: Scaffold(
      key: _scaffoldKey,
      backgroundColor: bgColor,
      drawer: Drawer(
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
                child: ListView.builder(
                  itemCount: _chapters.length,
                  itemBuilder: (context, index) {
                    final chapter = _chapters[index];
                    return ListTile(
                      title: Text(chapter.title.trim()),
                      onTap: () {
                        Navigator.pop(context);
                        if (_currentCfi != null) {
                          setState(() => _previousJumpCfi = _currentCfi);
                        }
                        _readerDisplay(chapter.href);
                        if (_showControls) _toggleControls();
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      body: Stack(
          fit: StackFit.expand,
          children: [
            // 1. EPUB 뷰어 본문 (Listener를 EpubViewer에만 감싸서 우측 하단 페이지 이동 버튼 클릭 시 상단/하단 UI가 뜨지 않도록 완벽 분리!)
            Positioned.fill(
              child: Padding(
                padding: EdgeInsets.only(
                  top: 12.0,
                  bottom: (bottomPadding > 0 ? bottomPadding : 8.0) + 20.0,
                ),
                child: IgnorePointer(
                  ignoring: _isTouchLocked || (_isMemoMode && (_isStylusDown || _allowFingerDrawing)),
                  child: Listener(
                    behavior: HitTestBehavior.translucent,
                    onPointerDown: _handlePointerDown,
                    onPointerUp: (event) => _handlePointerUp(event, screenSize),
                    onPointerCancel: (event) {
                      if (_isOfflineDocument) {
                        _activeTouchPointerIds.remove(event.pointer);
                        if (_activeTouchPointerIds.isEmpty) _hwpMultiTouch = false;
                        _pointerDownPosition = null;
                        _pointerDownTime = null;
                      }
                      if (_isStylusDown) {
                        setState(() => _isStylusDown = false);
                      }
                    },
                    child: InteractiveViewer(
                      transformationController: _epubZoomController,
                      panEnabled: !_isMemoMode && _epubZoomScale > 1.03,
                      scaleEnabled: !_isTouchLocked && (!_isMemoMode || !_allowFingerDrawing),
                      minScale: 1.0,
                      maxScale: 4.5,
                      onInteractionUpdate: (_) {
                        final s = _epubZoomController.value.getMaxScaleOnAxis();
                        if ((s - _epubZoomScale).abs() > 0.02) {
                          setState(() => _epubZoomScale = s);
                        }
                      },
                      onInteractionEnd: (_) {
                        final s = _epubZoomController.value.getMaxScaleOnAxis();
                        if (s < 1.03) {
                          _epubZoomController.value = Matrix4.identity();
                          if (_epubZoomScale != 1.0) {
                            setState(() => _epubZoomScale = 1.0);
                          }
                        } else if ((s - _epubZoomScale).abs() > 0.01) {
                          setState(() => _epubZoomScale = s);
                        }
                      },
                      child: GestureDetector(
                        behavior: HitTestBehavior.translucent,
                        onHorizontalDragUpdate: !_useSwipeTurn ? (_) {} : null,
                        child: _isOfflineDocument ? _buildHwpViewer(isLandscape) : EpubViewer(
                          key: ValueKey(viewerKey),
                          epubController: _epubController,
                    epubSource: _epubSource,
                    // The patched reader serves Android assets and chapters
                    // from the same local HTTPS origin, without a whole-book
                    // base64 payload or file:// cross-origin requests.
                    useLocalServer: true,
                    initialCfi: _currentCfi ?? _initialCfi,
                    onEpubLoaded: () {
                      if (!mounted || _watchdogKey != viewerKey) return;
                      _readerReady = true;
                      _loadWatchdog?.cancel();
                    },
                    onLoadError: (error) {
                      if (_watchdogKey == viewerKey) _handleReaderLoadError(error);
                    },
                    displaySettings: EpubDisplaySettings(
                      flow: EpubFlow.paginated,
                      snap: true,
                      spread: spreadSetting,
                      fontSize: _fontSize,
                      theme: _buildTheme(),
                    ),
                    selectionContextMenu: EpubContextMenu(
                      hideDefaultSystemItems: false,
                      items: [
                        EpubContextMenuItem(
                          id: 1,
                          title: '형광펜 칠하기',
                          action: () {
                            if (_selectedCfiRange != null) {
                              _epubController.addHighlight(
                                cfi: _selectedCfiRange!,
                                color: Colors.amber,
                              );
                            }
                          },
                        ),
                      ],
                    ),
                    onChaptersLoaded: (chapters) {
                      if (!mounted || _watchdogKey != viewerKey) return;
                      setState(() => _chapters = chapters);
                    },
                    onInitialPositionLoaded: () {
                      if (mounted && _watchdogKey == viewerKey) {
                        _hasRestoredInitialPosition = true;
                      }
                    },
                    onLocationLoaded: () {
                      if (!mounted || _watchdogKey != viewerKey || !_restoreProgressPending) return;
                      // Percent navigation needs the generated locations. A fixed
                      // 150ms delay can run before these exist on a large book.
                      _restoreProgressPending = false;
                      _hasRestoredInitialPosition = true;
                      _readerProgress(_initialProgress);
                    },
                    onTextSelected: (epubTextSelection) {
                      _selectedCfiRange = epubTextSelection.selectionCfi;
                    },
                    onRelocated: (value) async {
                      if (!mounted || _watchdogKey != viewerKey || _restoreProgressPending) return;
                      if (!_hasRestoredInitialPosition &&
                          _initialCfi != null &&
                          value.progress < 0.01 &&
                          _progress > 0.05) {
                        return;
                      }
                      _hasRestoredInitialPosition = true;
                      _currentCfi = value.startCfi;
                      final double clampedProg = value.progress.clamp(0.0, 1.0).toDouble();
                      final String newLocKey = _computeLocationKey(value.startCfi, clampedProg);

                      StorageService.saveLastPosition(widget.filePath, value.startCfi);
                      StorageService.saveProgress(widget.filePath, clampedProg);

                      // 3. 페이지 이동 시 해당 페이지(CFI)에 저장된 필기만 불러와서 표시!
                      final pageStrokes = await StorageService.getEpubLocationStrokes(
                        widget.filePath,
                        newLocKey,
                      );
                      if (mounted) {
                        setState(() {
                          _progress = clampedProg;
                          _currentPageLocationKey = newLocKey;
                          _epubStrokes = pageStrokes;
                          _activeStrokePoints.clear();
                        });
                      }
                    },
                    ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // 2. S펜 전용 페이지별 필기/지우개 오버레이 (EagerStylusPanGestureRecognizer로 S펜 이동 시 화면 움직임 100% 차단 + 손가락은 페이지 스와이프)
            if (_epubStrokes.isNotEmpty || _isMemoMode)
              Positioned.fill(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final double drawWidth = constraints.maxWidth;
                    final double drawHeight = constraints.maxHeight;
                    return StylusOnlyDrawingLayer(
                      enabled: _isMemoMode,
                      allowTouch: _allowFingerDrawing,
                      onStylusDown: (event) {
                        if (!_isStylusDown) {
                          setState(() => _isStylusDown = true);
                        }
                        final bool useEraser =
                            _isEraserMode || event.kind == PointerDeviceKind.invertedStylus;
                        if (useEraser) {
                          _eraseEpubStrokeAt(event.localPosition, drawWidth, drawHeight);
                        } else {
                          setState(() {
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
                          _eraseEpubStrokeAt(event.localPosition, drawWidth, drawHeight);
                        } else {
                          setState(() {
                            _activeStrokePoints.add(event.localPosition);
                          });
                        }
                      },
                      onStylusUp: (event) async {
                        _lastEraserPos = null;
                        if (_isStylusDown) {
                          setState(() => _isStylusDown = false);
                        }
                        final bool useEraser =
                            _isEraserMode || event.kind == PointerDeviceKind.invertedStylus;
                        if (useEraser) {
                          final locKey = _currentPageLocationKey;
                          await StorageService.saveEpubLocationStrokes(widget.filePath, locKey, _epubStrokes);
                        } else if (_activeStrokePoints.isNotEmpty &&
                            drawWidth > 0 &&
                            drawHeight > 0) {
                          final locKey = _currentPageLocationKey;
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
                          final list = List<MemoStroke>.from(_epubStrokes)..add(stroke);
                          setState(() {
                            _epubStrokes = list;
                            _activeStrokePoints.clear();
                          });
                          await StorageService.saveEpubLocationStrokes(
                            widget.filePath,
                            locKey,
                            list,
                          );
                        }
                      },
                      onStylusCancel: (_) {
                        setState(() {
                          _isStylusDown = false;
                          _activeStrokePoints.clear();
                        });
                      },
                      child: CustomPaint(
                        painter: _EpubMemoPainter(
                          strokes: _epubStrokes,
                          currentPoints: _activeStrokePoints,
                          currentColor: _penColor,
                          currentWidth: _penWidth,
                        ),
                      ),
                    );
                  },
                ),
              ),

            if (footerText.isNotEmpty)
              Positioned(
                left: 20,
                right: 20,
                bottom: math.max<double>(bottomPadding + 4.0, 8.0),
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
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: footerTextColor,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // S펜 필기 모드 하단 미니 툴바 (진행바 UI 위에 위치 + 색상과 선 굵기 사이에 지우개 배치 + 선 굵기 숫자 터치 입력)
            if (_isMemoMode && !_isTouchLocked)
              Positioned(
                bottom: math.max<double>(bottomPadding + 24.0, 28.0) +
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
                              tooltip: '텍스트 메모 입력',
                              onPressed: _showEpubMemoDialog,
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent, size: 18),
                              tooltip: _tr('필기 전체 지우기', 'Clear All Strokes', '清空全部手写', '手書きを全消去'),
                              onPressed: () async {
                                final locKey = _currentPageLocationKey;
                                setState(() => _epubStrokes = []);
                                await StorageService.saveEpubLocationStrokes(widget.filePath, locKey, []);
                              },
                            ),
                            TextButton(
                              onPressed: () => setState(() {
                                _isMemoMode = false;
                                _isEraserMode = false;
                                _allowFingerDrawing = false;
                                _isStylusDown = false;
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

            // 상단 컨트롤 바
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
                              icon: const Icon(Icons.list, color: Colors.white, size: 20),
                              tooltip: _tr('목차', 'Contents', '目录', '目次'),
                              onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                            ),
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
                                  _isStylusDown = false;
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
                                setState(() {
                                  _initialCfi = _currentCfi;
                                  _enableTwoPageInLandscape = nextVal;
                                });
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
                                await StorageService.setBookReadingDirectionRtl(widget.filePath, nextRtl);
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
                              onPressed: _openBookmarkSheet,
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
                                      widget.bookTitle,
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

            _buildEpubProgressBar(bottomPadding),

            if (_useQuickNavTurn && !_isTouchLocked)
              _buildQuickNavButtons(bottomPadding),
          ],
        ),
      ),
    );
  }
}
