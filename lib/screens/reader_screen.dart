import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/rendering.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:archive/archive_io.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:path_provider/path_provider.dart';
import '../services/storage_service.dart';
import '../services/system_bars.dart';
import '../services/txt_page_document.dart';
import '../services/toc_page_parser.dart';
import '../services/heading_rules.dart';
import '../services/outline_cache.dart';
import '../widgets/outline_progress.dart';
import '../widgets/text_copy_sheet.dart';
import '../services/page_snapshot_service.dart';
import '../services/doc_scroll_prep.dart';
import '../services/user_fonts.dart';
import '../services/epub_validation.dart';
import '../widgets/hwp_viewer.dart';
import '../widgets/spreadsheet_tab_bar.dart';
import '../widgets/txt_paged_viewer.dart';
import '../services/volume_key_service.dart';
import '../widgets/quick_arc_menu.dart';
import '../widgets/viewer_dialogs.dart';
import '../widgets/word_selection_layer.dart';
import '../widgets/ui_scale.dart';
import '../widgets/sheet_pull_to_close.dart';
import '../services/pdf_export_service.dart';
import '../widgets/memo_tools.dart';
import '../widgets/vertical_page_swipe.dart';
import '../widgets/after_route_transition.dart';
import '../widgets/direction_arrow_icon.dart';
import '../widgets/find_in_file_bar.dart';
import 'pdf_and_image_viewer.dart';

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

class _ReaderScreenState extends State<ReaderScreen> with WidgetsBindingObserver, TickerProviderStateMixin {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final EpubController _epubController = EpubController();

  // ── TXT / 워드(DOC·DOCX) / 한글(HWP·HWPX): EPUB과 같은 화면·메모·북마크를 쓰고 본문만 각자의 뷰어로 표시 ──
  final HwpReaderController _hwpController = HwpReaderController(); // DOC·DOCX·HWP·HWPX (WebView)
  final TxtPageController _txtController = TxtPageController(); // TXT (종이 쪽 단위)
  final GlobalKey _txtCaptureKey = GlobalKey(); // TXT 화면 캡처(PDF 내보내기)용
  bool get _isTxt => widget.filePath.toLowerCase().endsWith('.txt');
  bool get _isEpub => !_isOfflineDocument;
  bool get _isPaperTheme => _isEpub && _epubBgTheme == 'sepia';
  bool get _isOfflineDocument => RegExp(r'\.(hwp|hwpx|docx|doc|txt|pptx|ppt|xlsx|xlsm|xls)$', caseSensitive: false).hasMatch(widget.filePath);
  bool get _isPresentation => RegExp(r'\.pptx?$', caseSensitive: false).hasMatch(widget.filePath);
  bool get _isSpreadsheet => RegExp(r'\.xls[xm]?$', caseSensitive: false).hasMatch(widget.filePath);
  bool get _isHwpFile => RegExp(r'\.hwpx?$', caseSensitive: false).hasMatch(widget.filePath);
  String get _documentPositionPrefix {
    final lower = widget.filePath.toLowerCase();
    if (_isTxt) return 'txt';
    if (_isSpreadsheet) return lower.split('.').last;
    if (lower.endsWith('.pptx')) return 'pptx';
    if (lower.endsWith('.ppt')) return 'ppt';
    if (lower.endsWith('.docx')) return 'docx';
    if (lower.endsWith('.doc')) return 'doc';
    return 'hwp';
  }

  int _docPage = 0; // 문서의 현재 쪽 (0부터)
  int _docPageCount = 0; // 문서 전체 쪽 수
  int _docRelocation = 0;
  double _initialProgress = 0.0;
  final VolumeKeyService _volumeKeyService = VolumeKeyService();

  late String _activeFilePath;

  String? _initialCfi;
  String? _currentCfi;
  String? _selectedCfiRange;
  String _selectedText = '';
  bool _isLoading = true;
  String _epubBgTheme = 'white'; // 'white', 'sepia', 'dark'
  // 페이지 표시: 'one' / 'two' / 'auto'(화면이 넓으면 두 페이지)
  String _pageDisplay = 'one';
  // 도구 모음 형태: 'arc'(반원) / 'bar'(아래 가로 바)
  String _toolbarStyle = 'arc';
  // 사용자가 고른 EPUB 본문 글꼴 (없으면 책의 글꼴)
  UserFontEntry? _epubFont;
  // 페이지 모드: 탭(누른 자리로 넘김) / 스크롤(세로로 이어 보기) / 슬라이드(= _useSwipeTurn)
  bool _pageModeTap = true;
  bool _pageModeScroll = false;
  final ContinuousPageController _scrollCtrl = ContinuousPageController();

  /// 두 쪽을 나란히 보여 줄 때인가 (스크롤 모드는 쪽이 바뀌지 않음)
  bool _spreadFor(bool isLandscape) =>
      !_isSpreadsheet && !_pageModeScroll && !_slideShow && (_pageDisplay == 'two' || (_pageDisplay == 'auto' && isLandscape));
  bool _isMangaRtlMode = false;
  int _fontSize = 18;
  List<EpubChapter> _chapters = [];
  List<int> _chapterLevels = const []; // 워드·한글·PPT 목차 항목의 단계 (들여쓰기용, 비어 있으면 단계 없음)

  // ── 본문 로딩 감시: 책이 끝내 그려지지 않아 흰 화면만 남는 상황을 복구 ──
  Timer? _epubLoadWatchdog;
  String? _epubWatchKey;
  bool _epubDisplayed = false;
  bool _epubReadySignalResent = false;
  int _epubViewerGeneration = 0;
  bool _epubRetriedWithoutCfi = false;
  bool _epubLoadFailureShown = false;

  // WebView가 epubView.js 준비 신호(readyToLoad)를 Flutter 쪽 핸들러 등록 전에 보내 버리면
  // 책 로딩이 영원히 시작되지 않는다. 아직 한 번도 로딩되지 않았을 때만 신호를 다시 보낸다.
  static const String _epubReadyRecoveryJs =
      "(function(){try{if(typeof loadBook==='function'&&typeof currentLoadToken!=='undefined'&&"
      "currentLoadToken===0&&window.flutter_inappwebview&&"
      "typeof window.flutter_inappwebview.callHandler==='function'){"
      "window.flutter_inappwebview.callHandler('readyToLoad');}}catch(e){}})()";

  void _startEpubLoadWatchdog(String key) {
    if (_epubWatchKey == key) return;
    _epubWatchKey = key;
    if (mounted) {
      setState(() => _epubDisplayed = false);
    } else {
      _epubDisplayed = false;
    }
    _epubReadySignalResent = false;
    _epubLoadWatchdog?.cancel();
    final started = DateTime.now();
    _epubLoadWatchdog = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (!mounted || _epubDisplayed || _epubWatchKey != key) {
        timer.cancel();
        return;
      }
      final int secs = DateTime.now().difference(started).inSeconds;
      if (secs >= 5 && !_epubReadySignalResent) {
        _epubReadySignalResent = true;
        _epubController.webViewController
            ?.callMethod('eval', [_epubReadyRecoveryJs])
            .catchError((_) => null);
      }
      if (secs >= 16 && secs < 18 && _epubViewerGeneration == 0) {
        // 책 로딩이 아예 시작되지 않은 채 WebView가 멈춘 경우에만 뷰어를 한 번 새로 만들어 다시 시도
        // (큰 책을 정상적으로 읽어 들이는 중이면 그대로 기다림)
        _epubController.webViewController
            ?.callMethod('eval', [
              "(function(){return (typeof currentLoadToken==='undefined')?-1:currentLoadToken;})()"
            ])
            .then((value) {
              final int token = (value is num) ? value.toInt() : -1;
              if (!mounted || _epubDisplayed || _epubWatchKey != key) return;
              if (token <= 0) {
                timer.cancel();
                setState(() => _epubViewerGeneration++);
              }
            })
            .catchError((_) => null);
        return;
      }
      if (secs >= 90) {
        timer.cancel();
        _handleEpubLoadError(_tr(
          '본문 표시 시간이 초과되었습니다.',
          'Timed out while displaying the document.',
          '显示正文超时。',
          '本文の表示がタイムアウトしました。',
        ));
      }
    });
  }

  void _handleEpubLoadError(String message) {
    if (!mounted) return;
    _epubLoadWatchdog?.cancel();
    // 예전에 저장된 읽던 위치(CFI)가 지금 파일과 맞지 않으면 열기에 실패할 수 있으므로
    // 메모·책갈피는 그대로 두고 처음부터 한 번 다시 연다.
    if (!_isOfflineDocument && !_epubRetriedWithoutCfi && (_initialCfi?.isNotEmpty ?? false)) {
      setState(() {
        _epubRetriedWithoutCfi = true;
        _initialCfi = null;
        _hasRestoredInitialPosition = true;
        _epubViewerGeneration++;
      });
      return;
    }
    if (_epubLoadFailureShown) return;
    _epubLoadFailureShown = true;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${_tr('문서를 표시하지 못했습니다', 'Could not display the document', '无法显示文档', '文書を表示できませんでした')}: $message'),
        duration: const Duration(seconds: 8),
      ),
    );
  }

  bool _showControls = false;
  bool _isTouchLocked = false;
  bool _useShakeLock = false;
  bool _useVolumeComboLock = true;
  bool _useSwipeTurn = true;
  bool _useSwipeUpTurn = false; // 기본값: 꺼짐
  bool _useVolumeTurn = true;
  bool _useQuickNavTurn = false;
  bool _useSpenTurn = false;
  Offset? _lastEraserPos;
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
  Color _penColor = kMemoPenColors.first; // 기본: 빨강
  double _penWidth = 2.0;

  // 메모: 되돌리기/다시 실행 기록(페이지 위치별), 지우개 종류, 지우개 드래그 시작 시점의 필기
  final MemoHistory _memoHistory = MemoHistory();
  String _eraserType = 'area';
  List<MemoStroke>? _eraseStartStrokes;

  String _footerInfoMode = 'none';
  String _progressBarPosSetting = 'bottom';
  /// 실제 진행바 위치: 1쪽짜리 문서는 설정과 상관없이 숨김 (다른 버튼 배치도 숨김 기준으로)
  // 쪽 수를 알기 전(문서는 다 읽기 전, EPUB은 첫 위치 알림 전)에도 숨겨 두어 1쪽짜리에서 잠깐 보였다 사라지지 않게
  String get _progressBarPos => ((_isOfflineDocument && _docPageCount <= 1) || (!_isOfflineDocument && (!_epubLocated || _epubSinglePage)))
      ? 'hidden'
      : _progressBarPosSetting;
  bool _epubLocated = false; // EPUB 첫 위치 알림을 받았는지
  bool _epubAtStart = false; // EPUB 책의 첫 화면인지
  bool _epubAtEnd = false; // EPUB 책의 마지막 화면인지
  int _pptStepsLeft = 0; // PPT 지금 슬라이드에 남은 애니메이션 단계 수
  bool _epubSinglePage = false; // EPUB 전체가 한 화면(장 1개, 화면 1쪽)
  String _memoToolbarPos = 'bottom'; // 메모 도구모음 위치
  String _quickMenuSide = 'right'; // 도구 모음(활 메뉴) 위치
  int _rotateTapCount = 0; // 화면 회전 아이콘 흔들림 애니메이션용
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

  double _progress = 0.0;
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
    SystemBars.enterViewer(); // 파일 열람 중에는 상태표시줄·내비게이션 바를 모두 숨김
    _activeFilePath = widget.filePath;
    WidgetsBinding.instance.addObserver(this);
    DocScrollPrep.changed.addListener(_onScrollPrepChanged);
    _startOutlineCacheRead(); // 저장해 둔 목차를 문서가 열리는 동안 미리 읽어 둠
    _initReader();
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
          // PPT는 스크롤 보기 없음 (슬라이드 단위로 넘김)
          if (!_isPresentation)
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
    if (!mounted || mode == _pageDisplay) return;
    setState(() {
      _initialCfi = _currentCfi;
      _pageDisplay = mode;
    });
  }

  /// 페이지 모드가 바뀌었을 때: 보던 자리에서 다시 보여 줌 (EPUB은 넘김/스크롤 방식이 바뀌어 다시 염)
  void _onPageModeChanged() {
    if (!mounted) return;
    setState(() {
      _initialCfi = _currentCfi;
      _docScrollReady = false;
    });
    DocScrollPrep.urgent = _pageModeScroll;
    if (_pageModeScroll && _isOfflineDocument && !_isTxt && !_isSpreadsheet) {
      if (_usesBackgroundScroll) {
        _requestScrollPrep();
      } else {
        unawaited(_prepareDocScroll());
      }
    }
    // 스크롤을 끄면 스크롤에서 보던 쪽을 그대로 이어서
    if (!_pageModeScroll && _isOfflineDocument && !_isTxt && !_isSpreadsheet && _docPageCount > 0) {
      _docScrollGen++;
      unawaited(_hwpController.display('$_documentPositionPrefix:$_docPage'));
    }
    if (!_isOfflineDocument) {
      try {
        _epubController.setSwipeEnabled(_useSwipeTurn && !_pageModeScroll);
      } catch (_) {}
    }
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

    if (const ['epub', 'txt', 'docx', 'doc', 'hwpx', 'hwp', 'pptx', 'ppt', 'xlsx', 'xlsm', 'xls'].contains(nextExt)) {
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

  Future<void> _initReader() async {
    if (!_isOfflineDocument) {
      // 깨진 EPUB은 화면을 띄우기 전에 알기 쉬운 오류로 알려 준다
      try {
        await EpubValidation.validate(File(_activeFilePath));
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          _handleEpubLoadError(e.toString());
        }
        return;
      }
    }
    final savedCfi = await StorageService.getLastPosition(widget.filePath);
    // 페이지 기억하기를 끄면 처음부터
    final savedProg = StorageService.rememberPage ? await StorageService.getProgress(widget.filePath) : 0.0;
    final pageDisplay = await StorageService.getPageDisplay();
    final toolbarStyle = await StorageService.getToolbarStyle();
    UserFontEntry? epubFont;
    try {
      epubFont = await UserFonts.epubFont();
    } catch (_) {}
    final pageModeTap = await StorageService.getPageModeTap();
    final pageModeScroll = await StorageService.getPageModeScroll();
    // 읽기 방향: 직접 정한 적이 없으면, 오른쪽→왼쪽으로 넘기는 EPUB(세로쓰기 일본 소설 등)은 우→좌로 시작
    final bool isRtl = await StorageService.getBookReadingDirectionRtlOrNull(widget.filePath) ??
        (_isEpub && await _epubProgressionRtl(_activeFilePath));
    final savedBg = await StorageService.getEpubBgTheme();
    final footerMode = await StorageService.getFooterInfoMode();
    final barPos = await StorageService.getProgressBarPosition();
    final memoBarPos = await StorageService.getMemoToolbarPosition();
    final quickSide = await StorageService.getQuickMenuSide();
    final shakeLock = await StorageService.getUseShakeLock();
    final volComboLock = await StorageService.getUseVolumeComboLock();
    final volTurn = await StorageService.getUseVolumeTurn();
    final quickTurn = await StorageService.getUseQuickNavTurn();
    final swipeTurn = await StorageService.getUseSwipeTurn();
    final swipeUpTurn = await StorageService.getUseSwipeUpTurn();
    final eraserType = await StorageService.getMemoEraserType();
    final spenTurn = await StorageService.getUseSpenTurn();

    // 문서(TXT·워드·한글)는 저장된 위치(예: txt:12) 자체가 그 쪽의 메모 열쇠
    final initLocKey = (_isOfflineDocument && savedCfi != null && savedCfi.isNotEmpty)
        ? savedCfi
        : _computeLocationKey(savedCfi, savedProg);
    final strokes = await StorageService.getEpubLocationStrokes(widget.filePath, initLocKey);
    final loadedBookmarks = await StorageService.getBookmarks(widget.filePath);

    _bindHardwareButtons();

    if (!mounted) return;
    setState(() {
      _initialCfi = savedCfi;
      _currentCfi = savedCfi;
      _progress = savedProg.clamp(0.0, 1.0).toDouble();
      _initialProgress = _progress;
      _currentPageLocationKey = initLocKey;
      _pageDisplay = pageDisplay;
      _toolbarStyle = toolbarStyle;
      _epubFont = epubFont;
      _pageModeScroll = pageModeScroll && !_isSpreadsheet && !_isPresentation; // 엑셀은 뷰어 설정 없이 끌어서 이동, PPT는 스크롤 없음
      // 스크롤은 탭과 함께 쓰지 않음 (PPT는 스크롤 대신 탭으로)
      _pageModeTap = (pageModeTap || (_isPresentation && pageModeScroll)) && !_pageModeScroll;
      _isMangaRtlMode = isRtl && !_isTxt; // TXT는 읽기 방향 전환 없음
      // 기본값은 라이트. 종이색은 EPUB에서만 쓰므로 다른 문서에서는 라이트로 보여 준다.
      _epubBgTheme = savedBg.isEmpty || (savedBg == 'sepia' && !_isEpub) || _isPresentation || _isSpreadsheet ? 'white' : savedBg; // PPT는 배경 색상을 적용하지 않음
      _footerInfoMode = footerMode;
      _progressBarPosSetting = barPos;
      _memoToolbarPos = memoBarPos;
      _quickMenuSide = quickSide;
      _useShakeLock = shakeLock;
      _useVolumeComboLock = volComboLock;
      _useVolumeTurn = volTurn;
      _useQuickNavTurn = quickTurn;
      _useSwipeTurn = swipeTurn && !_pageModeScroll;
      _useSwipeUpTurn = swipeUpTurn;
      _eraserType = eraserType;
      _useSpenTurn = spenTurn;
      _epubStrokes = strokes;
      _bookmarks = loadedBookmarks;
      _isLoading = false;
    });
    unawaited(_snapInit());
    // 스크롤 보기로 열면: 미리 만들어 둔 쪽 그림이 있으면 파일을 다 읽기 전에 바로 보여 줌
    if (_pageModeScroll && _usesBackgroundScroll) {
      DocScrollPrep.urgent = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => unawaited(_refreshScrollSet()));
    }
  }

  // ── 페이지 이동: EPUB이면 EPUB 뷰어, TXT·워드·한글이면 각 문서 뷰어로 보낸다 ──
  /// 스크롤 모드의 한글·워드·PPT·TXT: 쪽 그림 목록을 한 화면씩 움직임
  bool get _docScrollActive => _pageModeScroll && _isOfflineDocument && !_isSpreadsheet && (_isTxt || _docScrollReadyNow);
  bool get _docScrollReadyNow => _usesBackgroundScroll
      ? (_scrollSet != null && (_docPageCount == 0 || _scrollSet!.files.length == _docPageCount))
      : _docScrollReady;

  void _readerNext() {
    if (_docScrollActive) {
      _scrollCtrl.scrollByScreen(1);
      return;
    }
    if (_isTxt) {
      _txtController.next();
    } else if (_isOfflineDocument) {
      _snapShow(_docPage + _snapStep);
      _hwpController.next();
    } else {
      _epubController.next();
    }
  }

  void _readerPrevious() {
    if (_docScrollActive) {
      _scrollCtrl.scrollByScreen(-1);
      return;
    }
    if (_isTxt) {
      _txtController.previous();
    } else if (_isOfflineDocument) {
      _snapShow(_docPage - _snapStep);
      _hwpController.previous();
    } else {
      _epubController.prev();
    }
  }

  void _readerProgress(double value) {
    if (_isTxt) {
      _txtController.toProgress(value);
    } else if (_isOfflineDocument) {
      _hwpController.toProgress(value);
    } else {
      _epubController.toProgressPercentage(value);
    }
  }

  void _readerDisplay(String position) {
    if (_docScrollActive) {
      final m = RegExp(r':(\d+)$').firstMatch(position);
      if (m != null) {
        _scrollCtrl.jumpToPage(int.parse(m.group(1)!));
        return;
      }
    }
    if (_isTxt) {
      _txtController.display(position);
    } else if (_isOfflineDocument) {
      final m = RegExp(r':(\d+)$').firstMatch(position);
      if (m != null) _snapShow(int.parse(m.group(1)!));
      _hwpController.display(position);
    } else {
      _epubController.display(cfi: position);
    }
  }

  // ── 목차 (워드·한글·PPT) ──
  // 1) 파일 안에 '목차'(Contents) 쪽이 있으면 그 항목만
  // 2) 없으면 번호(Ⅰ. / 1. / 1) / (1))로 시작하는 굵은 글씨 줄만 (같은 제목은 한 번)
  // 3) 그래도 없으면 쪽 목록
  // 글자가 그림으로만 된 PPT는 그림 속 글자를 읽어(OCR, 기기 안에서) 같은 규칙을 쓴다.
  // 만든 목차는 파일마다 저장해 두어 다음에 열 때는 다시 분석하지 않고 바로 보여 준다.
  Future<Map<int, List<Map<String, Object?>>>>? _outlineCacheFuture;
  Map<int, List<Map<String, Object?>>>? _cachedOutlines;

  void _startOutlineCacheRead() {
    if (_isTxt || _isSpreadsheet || !_isOfflineDocument || _outlineCacheFuture != null) return;
    _outlineCacheFuture = OutlineCache.read(widget.filePath).then((all) => _cachedOutlines = all);
  }

  /// 목차를 만드는 중이면 진행률(0~1), 아니면 null — 목차 칸에 '목차 만드는 중… n%'로 보임
  double? _outlineProgress;

  void _setOutlineProgress(double? p) {
    if (!mounted) return;
    if (p != null && _outlineProgress != null && (p - _outlineProgress!).abs() < 0.01 && p < 1) return;
    setState(() => _outlineProgress = p);
  }

  Future<void> _loadDocumentOutline(int pageCount) async {
    if (!mounted || _isTxt || _isSpreadsheet) return;
    final cached = (await (_outlineCacheFuture ?? Future.value(const <int, List<Map<String, Object?>>>{})))[pageCount];
    if (!mounted || _docPageCount != pageCount) return;
    if (cached != null) {
      _applyDocumentOutline(cached, pageCount);
      return;
    }
    _setOutlineProgress(0);
    try {
      final items = await _buildDocumentOutline(pageCount);
      if (items == null || !mounted || _docPageCount != pageCount) return; // 중간에 닫힘: 다음에 이어서
      final cleaned = [for (final e in items) {...e, 'title': (e['title'] ?? '').toString().replaceAll(RegExp(r'\s+'), ' ').trim()}];
      await OutlineCache.write(widget.filePath, pageCount, cleaned);
      (_cachedOutlines ??= {})[pageCount] = cleaned;
      _setOutlineProgress(null);
      _applyDocumentOutline(cleaned, pageCount);
    } finally {
      if (mounted && _outlineProgress != null) _setOutlineProgress(null);
    }
  }

  /// 목차 만들기. 1) 파일 안 목차 쪽 → 2) 한글·워드: 번호 줄 → 굵은 글씨 줄 / PPT: 슬라이드 제목·부제목
  Future<List<Map<String, Object?>>?> _buildDocumentOutline(int pageCount) async {
    bool alive() => mounted && _docPageCount == pageCount;
    // 첫 화면을 그리는 데 방해되지 않도록 잠시 뒤에 분석
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (!alive()) return null;
    final int scan = math.min(pageCount, 400); // 아주 긴 문서는 앞 400쪽까지만
    final head = await _hwpController.pageText(0, math.min(pageCount, TocPageParser.searchPages));
    if (!alive()) return null;
    _setOutlineProgress(0.05);
    // 글을 [from, to) 조각으로 나눠 읽으며 진행률 표시
    Future<List<T>> chunked<T>(Future<List<T>> Function(int from, int to) read, int total, double p0, double p1, {int step = 20}) async {
      final out = <T>[];
      for (int from = 0; from < total; from += step) {
        out.addAll(await read(from, math.min(total, from + step)));
        if (!alive()) return out;
        _setOutlineProgress(p0 + (p1 - p0) * math.min(1, (from + step) / total));
      }
      return out;
    }

    // 1) 목차 쪽
    if (TocPageParser.parse(head, pageCount) != null) {
      final all = await chunked<String>((f, t) => _hwpController.pageText(f, t), scan, 0.05, 0.95);
      if (!alive()) return null;
      return TocPageParser.parse(all.length < head.length ? head : all, pageCount) ?? const [];
    }
    if (_isPresentation) {
      final letters = head.fold<int>(0, (n, t) => n + RegExp(r'[가-힣A-Za-z]').allMatches(t).length);
      // 글자가 거의 없는 PPT(슬라이드가 그림으로만 된 경우): 그림 속 글자를 읽음
      if (head.isNotEmpty && letters < head.length * 15) return _ocrOutline(pageCount);
      final lines = await chunked<List<Map<String, Object?>>>((f, t) => _hwpController.slideLineData(f, t), pageCount, 0.05, 0.95, step: 10);
      if (!alive()) return null;
      return HeadingRules.slides(lines);
    }
    // 번호·굵은 글씨 줄은 문서 끝까지 찾음 (약전처럼 아주 긴 문서도 뒤쪽 항목까지)
    final int all = math.min(pageCount, 5000);
    final cands = _isHwpFile
        ? await chunked<Map<String, Object?>>((f, t) => _hwpController.headingCandidates(f, t), all, 0.05, 0.95)
        : await _hwpController.headingCandidates(0, all);
    if (!alive()) return null;
    return HeadingRules.build(cands);
  }

  /// 슬라이드 그림 속 글자를 읽어 목차를 만든다. 슬라이드마다 읽은 결과는 바로바로 저장 (중간에 닫으면 null)
  Future<List<Map<String, Object?>>?> _ocrOutline(int pageCount) async {
    final path = widget.filePath;
    final slides = await OutlineCache.readOcr(path);
    final tmp = Directory('${(await getTemporaryDirectory()).path}/ppt_ocr');
    await tmp.create(recursive: true);
    int fresh = 0;
    // 슬라이드 하나를 [width] 너비로 그려 글자를 읽음
    Future<List<Map<String, Object?>>> readSlide(int page, int width) async {
      final lines = <Map<String, Object?>>[];
      final b64 = await _hwpController.slideImage(page, width: width);
      if (b64 == null) return lines;
      final img = File('${tmp.path}/slide_$page.jpg');
      try {
        await img.writeAsBytes(base64Decode(b64), flush: true);
        final raw = await _pdfChannel.invokeMethod<List<Object?>>('ocrLines', {'path': img.path}) ?? const [];
        for (final e in raw) {
          if (e is! Map) continue;
          final t = (e['t'] ?? '').toString().trim();
          if (t.isEmpty) continue;
          lines.add({'t': t, 'y': e['y'], 'h': e['h']});
        }
      } catch (_) {
      } finally {
        try {
          await img.delete();
        } catch (_) {}
      }
      return lines;
    }

    for (int page = 0; page < pageCount; page++) {
      if (slides.containsKey(page)) continue;
      if (!mounted || _docPageCount != pageCount) {
        if (fresh > 0) await OutlineCache.writeOcr(path, slides);
        return null;
      }
      slides[page] = await readSlide(page, 1800);
      _setOutlineProgress(0.05 + 0.9 * (page + 1) / pageCount);
      if (++fresh % 5 == 0) await OutlineCache.writeOcr(path, slides);
      // 읽는 화면이 버벅이지 않게 슬라이드 사이에 잠깐 쉼
      await Future<void>.delayed(const Duration(milliseconds: 120));
    }
    if (!mounted || _docPageCount != pageCount) return null;
    List<String> textsOf() => [for (int p = 0; p < pageCount; p++) [for (final l in slides[p] ?? const <Map<String, Object?>>[]) l['t']].join('\n')];
    // 목차 슬라이드가 있으면 그것만, 없으면 슬라이드마다 제목(가장 큰 글자)과 그 바로 아래 부제목
    var toc = TocPageParser.parse(textsOf(), pageCount);
    if (toc != null) {
      // 목차 슬라이드는 글자가 작아 잘못 읽기 쉬움: 크기를 바꿔 여러 번 읽고, 같은 항목끼리 비교해 고름
      final tocPage = TocPageParser.tocPageOf(textsOf(), toc);
      final variants = <List<Map<String, Object>>>[];
      if (tocPage != null && mounted) {
        final original = slides[tocPage] ?? const <Map<String, Object?>>[];
        for (final w in const [2400, 3200, 1400]) {
          if (!mounted) break;
          final again = await readSlide(tocPage, w);
          if (again.isEmpty) continue;
          slides[tocPage] = again;
          final v = TocPageParser.parse(textsOf(), pageCount);
          if (v != null) variants.add(v);
        }
        slides[tocPage] = original;
      }
      final base = toc;
      toc = [
        for (final e in base)
          {
            ...e,
            'title': TocPageParser.chooseTitle(
              '${e['title']}',
              [
                for (final v in variants)
                  for (final x in v)
                    if (x['page'] == e['page'] && (x['level'] == e['level']) && _sameTocEntry('${x['title']}', '${e['title']}')) '${x['title']}',
              ],
              // 연결된 슬라이드(와 바로 다음 슬라이드)의 제목·부제목: 큰 글씨라 더 정확히 읽힘
              [
                for (final p in [e['page'] as int, (e['page'] as int) + 1])
                  if (p < pageCount)
                    for (final l in slides[p] ?? const <Map<String, Object?>>[]) '${l['t']}',
              ],
            ),
          },
      ];
    }
    final List<Map<String, Object?>> items = toc ??
        HeadingRules.slides([for (int p = 0; p < pageCount; p++) slides[p] ?? const <Map<String, Object?>>[]], ocr: true);
    await OutlineCache.clearOcr(path);
    return items;
  }

  /// 다른 크기로 다시 읽은 목차 항목이 같은 항목인가 (번호가 같거나 글이 꽤 비슷)
  static bool _sameTocEntry(String a, String b) {
    final na = RegExp(r'^\(?(\d{1,3}(?:[.\-]\d{1,3})?)').firstMatch(a.trim())?.group(1);
    final nb = RegExp(r'^\(?(\d{1,3}(?:[.\-]\d{1,3})?)').firstMatch(b.trim())?.group(1);
    if (na != null && nb != null) return na == nb;
    final x = a.replaceAll(RegExp(r'\s+'), ''), y = b.replaceAll(RegExp(r'\s+'), '');
    if (x.isEmpty || y.isEmpty) return false;
    int same = 0;
    for (final ch in x.split('')) {
      if (y.contains(ch)) same++;
    }
    return same >= x.length * 0.6;
  }

  void _applyDocumentOutline(List<Map<String, Object?>> items, int pageCount) {
    if (!mounted || items.isEmpty || _docPageCount != pageCount) return;
    final chapters = <EpubChapter>[];
    final levels = <int>[];
    for (final item in items) {
      final int page = (item['page'] as int).clamp(0, math.max(0, pageCount - 1)).toInt();
      final String title = (item['title'] as String).trim();
      if (title.isEmpty) continue;
      chapters.add(EpubChapter(
        title: title,
        href: '$_documentPositionPrefix:$page',
        id: '$_documentPositionPrefix:$page#${chapters.length}',
        subitems: const [],
      ));
      levels.add((item['level'] as int).clamp(1, 6).toInt());
    }
    if (chapters.isEmpty) return;
    setState(() {
      _chapters = chapters;
      _chapterLevels = levels;
    });
  }

  /// 쪽 목록 목차 (목차가 없을 때)
  List<EpubChapter> _pageListChapters(int pageCount) => List.generate(
        pageCount,
        (index) => EpubChapter(
          title: _tr('${index + 1}쪽', 'Page ${index + 1}', '第${index + 1}页', '${index + 1}ページ'),
          href: '$_documentPositionPrefix:$index',
          id: '$_documentPositionPrefix:$index',
          subitems: const [],
        ),
      );

  /// 문서를 다 읽어 들였을 때: 저장해 둔 목차가 있으면 바로 그것을, 없으면 쪽 목록을 먼저 보여 주고 분석한다
  void _onDocumentLoaded(int pageCount) {
    if (!mounted) return;
    setState(() {
      _chapterLevels = const [];
      _docPageCount = pageCount;
      _chapters = _isSpreadsheet ? const [] : _pageListChapters(pageCount);
    });
    if (_usesBackgroundScroll) {
      // 쪽 넘김으로 열었어도 스크롤 보기를 뒤에서 미리 준비 (스크롤 모드면 바로)
      Future<void>.delayed(Duration(milliseconds: _pageModeScroll ? 0 : 1500), () {
        if (mounted) _requestScrollPrep();
      });
    } else if (_pageModeScroll && !_isTxt && !_isSpreadsheet) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _prepareDocScroll());
    }
    if (_isTxt || _isSpreadsheet) return;
    final cached = _cachedOutlines?[pageCount];
    if (cached != null && cached.isNotEmpty) {
      _applyDocumentOutline(cached, pageCount); // 같은 프레임에 바로 바뀜 (쪽 목록이 보였다 바뀌지 않음)
      return;
    }
    if (cached != null) return; // 목차 없음으로 저장된 문서
    _loadDocumentOutline(pageCount);
  }

  double _sheetZoom = 1;

  void _onSheetNames(List<String> names) {
    if (!mounted || !_isSpreadsheet) return;
    setState(() {
      _chapterLevels = const [];
      _chapters = [
        for (int i = 0; i < names.length; i++)
          EpubChapter(title: names[i], href: '$_documentPositionPrefix:$i',
              id: '$_documentPositionPrefix:$i', subitems: const []),
      ];
    });
  }

  /// 문서의 쪽이 바뀌었을 때: 위치 저장 + 그 쪽의 필기 불러오기
  Future<void> _onDocumentLocation(int page, int pageCount, String position, double progress) async {
    if (!mounted) return;
    final waiter = _relocateWaiter;
    if (waiter != null && !waiter.isCompleted) waiter.complete();
    // 스크롤 보기를 준비하느라 쪽을 넘기는 중에는 읽던 자리로 저장하지 않음
    if (_docScrollPreparing) return;
    final relocation = ++_docRelocation;
    if (page != _docPage) _lastReadyPage = -1;
    if (_snapShownPage != null && _snapShownPage != page) _snapShow(page);
    setState(() {
      _docPage = page;
      _docPageCount = pageCount;
      if (_isSpreadsheet) {
        final parts = position.split(':');
        _sheetZoom = parts.length == 5 ? double.tryParse(parts.last) ?? 1 : 1;
      }
      _currentCfi = position;
      _currentPageLocationKey = position;
      _progress = progress.clamp(0.0, 1.0).toDouble();
      _hasRestoredInitialPosition = true;
      _activeStrokePoints.clear();
      _epubStrokes = [];
    });
    await StorageService.saveLastPosition(widget.filePath, position);
    await StorageService.saveProgress(widget.filePath, progress);
    await StorageService.savePageLabel(widget.filePath, _progressPageLabel());
    if (_isSpreadsheet) return; // No page-anchored drawing layer over the live grid.
    final strokes = await StorageService.getEpubLocationStrokes(widget.filePath, position);
    if (mounted && relocation == _docRelocation) setState(() => _epubStrokes = strokes);
  }

  Widget _buildDocumentViewer(bool isLandscape) {
    if (_isTxt) {
      return RepaintBoundary(
        key: _txtCaptureKey,
        child: TxtPagedViewer(
          key: ValueKey('text:${widget.filePath}'),
          filePath: widget.filePath,
          controller: _txtController,
          initialPosition: _currentCfi ?? _initialCfi,
          initialProgress: _initialProgress,
          theme: _epubBgTheme,
          spread: _spreadFor(isLandscape),
          rtl: _isMangaRtlMode,
          scroll: _pageModeScroll,
          scrollController: _scrollCtrl,
          onLoaded: _onDocumentLoaded,
          onLocation: _onDocumentLocation,
          onError: _handleEpubLoadError,
        ),
      );
    }
    final shown = _snapShown;
    return Stack(
      fit: StackFit.expand,
      children: [
        // 스크롤 보기 그림이 다 덮고 있거나 목차를 여닫는 동안: 문서 화면(WebView)을 잠시 숨겨 움직임이 끊기지 않게
        Offstage(
          offstage: _tocFreeze != null || (_pageModeScroll && _usesBackgroundScroll && _docScrollReadyNow && !_isExporting),
          child: HwpViewer(
          key: ValueKey('document:${widget.filePath}'),
          filePath: widget.filePath,
          controller: _hwpController,
          initialPosition: _currentCfi ?? _initialCfi,
          initialProgress: _initialProgress,
          theme: _epubBgTheme,
          spread: _spreadFor(isLandscape),
          rtl: _isMangaRtlMode,
          onLoaded: _onDocumentLoaded,
          onLocation: _onDocumentLocation,
          onPageReady: _onDocumentPageReady,
          onStepsLeft: (n) => _pptStepsLeft = n,
          onSheetNames: _onSheetNames,
          onError: _handleEpubLoadError,
          onCancelled: () {
            if (mounted) Navigator.of(context).pop();
          },
        ),
        ),
        if (_tocFreeze != null && !_pageModeScroll)
          Positioned.fill(child: IgnorePointer(child: Image.memory(_tocFreeze!, fit: BoxFit.fill, gaplessPlayback: true))),
        // 한 번 본 쪽: 실제 쪽(특히 사진)이 다 준비될 때까지 저장해 둔 화면을 먼저 보여 줌
        if (shown != null && !_pageModeScroll)
          Positioned.fill(
            child: IgnorePointer(
              child: Image.file(shown, fit: BoxFit.fill, gaplessPlayback: true, filterQuality: FilterQuality.medium),
            ),
          ),
        // 스크롤 모드: 쪽마다 한 번 그림으로 만들어 두고(다음부터는 바로), 간격 없이 세로로 이어 보여 줌
        if (_pageModeScroll && !_isSpreadsheet) Positioned.fill(child: _buildDocScroll()),
      ],
    );
  }

  // ── 스크롤 모드 (한글·워드·PPT) ──
  bool _docScrollReady = false;
  double _docScrollProgress = 0;
  List<File> _docScrollFiles = const [];
  List<double> _docScrollAspects = const [];
  int _docScrollGen = 0;
  bool _docScrollPreparing = false;
  Completer<int>? _pageReadyWaiter;

  // ── 스크롤 보기 (한글·워드): 화면 밖 문서 화면에서 미리 그려 둔 쪽 그림 ──
  /// 한글·워드는 뒤에서 미리 준비 (PPT·TXT는 따로)
  bool get _usesBackgroundScroll => _isOfflineDocument && !_isTxt && !_isSpreadsheet && !_isPresentation && !_legacyScroll;
  bool _legacyScroll = false; // 미리 준비가 안 되는 문서(암호 등): 보던 화면으로 쪽을 넘기며 준비
  ScrollPageSet? _scrollSet;
  int _scrollSetSerial = 0;

  /// 스크롤 그림 너비 (논리 크기, px)
  ({double lw, int px}) _scrollRenderSize() {
    final double real = MediaQuery.sizeOf(context).width * UiScale.of(context);
    final double lw = DocScrollPrep.renderWidth(real);
    return (lw: lw, px: (lw * MediaQuery.devicePixelRatioOf(context)).round());
  }

  String get _scrollTheme => _epubBgTheme == 'dark' ? 'dark' : 'white';

  void _requestScrollPrep() {
    if (!mounted || !_usesBackgroundScroll || _docPageCount <= 0) return;
    final sz = _scrollRenderSize();
    DocScrollPrep.request(path: widget.filePath, theme: _scrollTheme, widthPx: sz.px, logicalWidth: sz.lw, pageCount: _docPageCount);
    unawaited(_refreshScrollSet());
  }

  /// 지금 배경색의 그림이 다 있으면 그것을, 없으면 다른 배경색 그림을 색만 바꿔 바로 보여 줌
  Future<void> _refreshScrollSet() async {
    if (!mounted || !_usesBackgroundScroll) return;
    final int serial = ++_scrollSetSerial;
    final px = _scrollRenderSize().px;
    final theme = _scrollTheme;
    final n = _docPageCount;
    ScrollPageSet? set = await DocScrollPrep.load(widget.filePath, theme, px, n);
    if (set == null) {
      final cur = _scrollSet;
      if (cur != null && (n == 0 || cur.files.length == n) && cur.files.isNotEmpty && cur.files.first.path.contains('/scroll6_${px}_')) {
        set = cur; // 다른 배경색 그림으로 임시 표시 중
      } else {
        set = await DocScrollPrep.load(widget.filePath, theme == 'dark' ? 'white' : 'dark', px, n);
      }
    }
    if (!mounted || serial != _scrollSetSerial) return;
    if (!identical(set, _scrollSet)) setState(() => _scrollSet = set);
  }

  void _onScrollPrepChanged() {
    if (!mounted || !_isOfflineDocument || _isTxt || _isSpreadsheet || _docPageCount <= 0) return;
    if (_legacyScroll) return;
    final px = _scrollRenderSize().px;
    if (DocScrollPrep.failed(widget.filePath, _scrollTheme, px)) {
      // 화면 밖에서 그리지 못하는 문서: 스크롤 모드일 때 예전 방식(보던 화면으로 쪽을 넘기며)으로
      if (_scrollSet == null) {
        setState(() => _legacyScroll = true);
        if (_pageModeScroll) unawaited(_prepareDocScroll());
      }
      return;
    }
    final p = DocScrollPrep.progressOf(widget.filePath, _scrollTheme, px);
    if (p != null && p >= 1 && _scrollSet?.theme != _scrollTheme) unawaited(_refreshScrollSet());
    if (_pageModeScroll && !_docScrollReadyNow) setState(() {});
  }

  /// 다크 ↔ 라이트 그림을 바로 바꿔 보여 줄 때의 색 바꾸기 (문서 화면의 어두운 배경 효과와 같은 계산)
  static const List<double> _toDarkMatrix = [
    0.43624, -1.0868, -0.10944, 0, 224.4,
    -0.32376, -0.3268, -0.10944, 0, 224.4,
    -0.32376, -1.0868, 0.65056, 0, 224.4,
    0, 0, 0, 1, 0,
  ];
  static const List<double> _toLightMatrix = [
    0.75526, -1.88158, -0.18947, 0, 295.26,
    -0.56053, -0.56579, -0.18947, 0, 295.26,
    -0.56053, -1.88158, 1.12632, 0, 295.26,
    0, 0, 0, 1, 0,
  ];

  Widget _scrollLoading(double progress) {
    final bg = _getBgColor();
    // 파일을 아직 읽는 중이면 '파일 여는 중', 그 뒤에 쪽 그림을 만드는 동안만 '스크롤 보기 준비 중'
    final bool opening = _docPageCount <= 0;
    return ColoredBox(
      color: bg,
      // 설정 창이 아래 절반을 덮어도 보이도록 화면 위쪽에
      child: Align(
        alignment: const Alignment(0, -0.45),
        child: FileLoadingView(
          label: opening
              ? _tr('파일 여는 중', 'Opening file', '正在打开文件', 'ファイルを開いています')
              : _tr('스크롤 보기 준비 중', 'Preparing scroll view', '正在准备滚动视图', 'スクロール表示を準備中'),
          progress: opening ? null : progress,
          sublabel: opening ? null : _tr('한 번 준비하면 다음부터는 빠르게 열려요', 'Opens faster next time', '准备一次后下次会更快打开', '次回からは速く開きます'),
          background: bg,
        ),
      ),
    );
  }

  Widget _buildDocScroll() {
    final double dpr = MediaQuery.devicePixelRatioOf(context);
    final double w = MediaQuery.sizeOf(context).width * UiScale.of(context);
    if (_usesBackgroundScroll) {
      final sz = _scrollRenderSize();
      final set = _scrollSet;
      if (set == null || (_docPageCount > 0 && set.files.length != _docPageCount) || !set.files.first.path.contains('/scroll6_${sz.px}_')) {
        // 화면 너비가 바뀌었으면(회전) 그 너비로 다시 준비
        if (_docPageCount > 0 && (set == null || !set.files.first.path.contains('/scroll6_${sz.px}_'))) {
          WidgetsBinding.instance.addPostFrameCallback((_) => _requestScrollPrep());
        }
        return _scrollLoading(DocScrollPrep.progressOf(widget.filePath, _scrollTheme, sz.px) ?? 0);
      }
      final List<double>? matrix = set.theme == _scrollTheme ? null : (_scrollTheme == 'dark' ? _toDarkMatrix : _toLightMatrix);
      return ContinuousPageList(
        key: ValueKey('docscroll:${set.theme}:${sz.px}'),
        controller: _scrollCtrl,
        count: set.files.length,
        aspectOf: (i) => set.aspects[i],
        initialPage: _docPage.clamp(0, set.files.length - 1).toInt(),
        background: _getBgColor(),
        gap: 10,
        onPageChanged: (p) {
          final n = set.files.length;
          _onDocumentLocation(p, n, '$_documentPositionPrefix:$p', n <= 1 ? 1 : p / (n - 1));
        },
        pageBuilder: (ctx, i) {
          final img = Image.file(
            set.files[i],
            fit: BoxFit.fill,
            cacheWidth: math.min(4096, (w * dpr).round()),
            gaplessPlayback: true,
            filterQuality: FilterQuality.medium,
          );
          final Widget pic = matrix == null ? img : ColorFiltered(colorFilter: ColorFilter.matrix(matrix), child: img);
          // EPUB처럼 글을 길게 눌러 골라 복사 (쪽 그림 위 낱말 자리)
          final wordsFile = File(set.files[i].path.replaceFirst(RegExp(r'\.jpg$'), '.words.json'));
          return WordSelectionLayer(
            highlight: _findOpen ? _findQuery : '',
            tr: _tr,
            onCopy: (text) => showTextCopySheet(context, text: text, tr: _tr),
            loadWords: () async {
              if (!await wordsFile.exists()) return const [];
              final raw = jsonDecode(await wordsFile.readAsString());
              return [for (final m in raw is List ? raw : const []) ?SelectableWord.fromJson(m)];
            },
            child: pic,
          );
        },
      );
    }
    if (!_docScrollReady || _docScrollFiles.isEmpty) return _scrollLoading(_docScrollProgress);
    return ContinuousPageList(
      controller: _scrollCtrl,
      count: _docScrollFiles.length,
      aspectOf: (i) => _docScrollAspects[i],
      initialPage: _docPage.clamp(0, _docScrollFiles.length - 1).toInt(),
      background: _getBgColor(),
      onPageChanged: (p) {
        final n = _docScrollFiles.length;
        _onDocumentLocation(p, n, '$_documentPositionPrefix:$p', n <= 1 ? 1 : p / (n - 1));
      },
      pageBuilder: (ctx, i) => Image.file(
        _docScrollFiles[i],
        fit: BoxFit.fill,
        cacheWidth: math.min(4096, (w * dpr).round()),
        gaplessPlayback: true,
        filterQuality: FilterQuality.medium,
      ),
    );
  }

  /// 쪽을 하나씩 화면에 그려 그림으로 저장 (다음부터는 저장한 그림을 바로 씀)
  Future<void> _prepareDocScroll() async {
    final int gen = ++_docScrollGen;
    final int n = _docPageCount;
    if (!mounted || n <= 0 || !_pageModeScroll || _isSpreadsheet) return;
    final dir = await PageSnapshotService.documentDir(widget.filePath);
    if (!mounted || dir == null || gen != _docScrollGen) return;
    final size = MediaQuery.sizeOf(context);
    final double dpr = MediaQuery.devicePixelRatioOf(context);
    final sub = Directory('${dir.path}/scroll_${size.width.round()}x${size.height.round()}_$_epubBgTheme');
    if (!sub.existsSync()) sub.createSync(recursive: true);
    final metaFile = File('${sub.path}/meta.json');
    Map<String, dynamic> meta = {};
    try {
      if (metaFile.existsSync()) meta = jsonDecode(metaFile.readAsStringSync()) as Map<String, dynamic>;
    } catch (_) {}
    final files = <File>[];
    final aspects = <double>[];
    final int startPage = _docPage;
    bool moved = false;
    setState(() => _docScrollProgress = 0);
    _docScrollPreparing = true;
    try {
    for (int i = 0; i < n; i++) {
      if (!mounted || gen != _docScrollGen || !_pageModeScroll) return;
      final f = File('${sub.path}/p$i.jpg');
      final known = meta['$i'];
      if (known is num && f.existsSync()) {
        files.add(f);
        aspects.add(known.toDouble());
        continue;
      }
      Uint8List? bytes;
      try {
        if (_isPresentation) {
          final b64 = await _hwpController.slideImage(i, width: (size.width * dpr).round().clamp(900, 2400).toInt());
          if (b64 != null) bytes = base64Decode(b64);
        } else {
          moved = true;
          final waiter = Completer<int>();
          _pageReadyWaiter = waiter;
          await _hwpController.display('$_documentPositionPrefix:$i');
          await waiter.future.timeout(const Duration(seconds: 6), onTimeout: () => i);
          await Future<void>.delayed(const Duration(milliseconds: 160));
          if (!mounted || gen != _docScrollGen) return;
          final r = await _hwpController.pageRect();
          bytes = await _pdfChannel.invokeMethod<Uint8List>('snapshotWebView', {
            'background': _getBgColor().toARGB32(),
            'scale': 1.0,
            if (r != null) 'crop': [r.left, r.top, r.width, r.height],
          });
        }
      } catch (_) {}
      if (bytes != null && bytes.length > 512) {
        await f.writeAsBytes(bytes, flush: true);
        final sz = readImageSizeSync(f.path);
        final double aspect = sz == null ? 1.414 : (sz.height / sz.width).clamp(0.2, 8.0).toDouble();
        meta['$i'] = aspect;
        files.add(f);
        aspects.add(aspect);
      } else {
        // 그리지 못한 쪽은 빈 쪽으로
        files.add(f);
        aspects.add(aspects.isNotEmpty ? aspects.last : 1.414);
      }
      if (mounted) setState(() => _docScrollProgress = (i + 1) / n);
      if (i % 5 == 4) {
        try {
          metaFile.writeAsStringSync(jsonEncode(meta));
        } catch (_) {}
      }
    }
    } finally {
      _docScrollPreparing = false;
    }
    try {
      metaFile.writeAsStringSync(jsonEncode(meta));
    } catch (_) {}
    if (!mounted || gen != _docScrollGen) return;
    // 그리느라 넘긴 쪽을 원래 보던 쪽으로 (스크롤을 끄면 그 자리에서 이어 봄)
    if (moved) {
      _docScrollPreparing = true;
      await _runAndWaitRelocate(() => _hwpController.display('$_documentPositionPrefix:$startPage'), const Duration(seconds: 3));
      _docScrollPreparing = false;
      if (!mounted || gen != _docScrollGen) return;
    }
    setState(() {
      _docScrollFiles = files;
      _docScrollAspects = aspects;
      _docScrollReady = true;
      _docPage = startPage;
    });
  }

  // ── 쪽 화면 저장·미리 띄우기 (워드·한글) ──
  bool get _snapEligible => _isOfflineDocument && !_isTxt && !_isPresentation && !_isSpreadsheet;
  Directory? _snapDir;
  File? _snapShown;
  int? _snapShownPage;
  Timer? _snapHideTimer;
  bool get _snapSpread {
    final size = MediaQuery.sizeOf(context);
    return _spreadFor(size.width > size.height);
  }
  int _snapCaptureSerial = 0;
  int get _snapStep => _snapSpread ? 2 : 1;

  Future<void> _snapInit() async {
    if (!_snapEligible) return;
    final dir = await PageSnapshotService.documentDir(widget.filePath);
    if (!mounted || dir == null) return;
    _snapDir = dir;
    // 처음 열 때: 마지막으로 보던 쪽(없으면 첫 쪽)을 먼저 보여 준다
    if (_docPageCount == 0) {
      final m = RegExp(r':(\d+)$').firstMatch(_currentCfi ?? _initialCfi ?? '');
      WidgetsBinding.instance.addPostFrameCallback((_) => _snapShow(m != null ? int.parse(m.group(1)!) : 0));
    }
  }

  File? _snapFile(int page) {
    final dir = _snapDir;
    final box = _epubViewRectKey.currentContext?.size;
    if (dir == null || box == null || box.isEmpty) return null;
    final name = PageSnapshotService.fileName(
      page: page,
      width: box.width.round(),
      height: box.height.round(),
      spread: _snapSpread,
      rtl: _isMangaRtlMode,
      theme: _epubBgTheme,
    );
    return File('${dir.path}/$name');
  }

  void _snapShow(int page) {
    if (!_snapEligible || !mounted) return;
    if (page < 0 || (_docPageCount > 0 && page >= _docPageCount) || _epubZoomScale > 1.03) {
      _snapHide();
      return;
    }
    final file = _snapFile(page);
    if (file == null || !file.existsSync()) {
      _snapHide();
      return;
    }
    _snapHideTimer?.cancel();
    _snapHideTimer = Timer(const Duration(seconds: 8), _snapHide); // 혹시 준비 알림이 안 와도 가린 채 두지 않음
    setState(() {
      _snapShown = file;
      _snapShownPage = page;
    });
  }

  void _snapHide() {
    _snapHideTimer?.cancel();
    if (_snapShown == null || !mounted) return;
    setState(() {
      _snapShown = null;
      _snapShownPage = null;
    });
  }

  /// 쪽 안 그림까지 다 그려졌을 때: 미리 띄운 화면을 걷어 내고, 저장된 화면이 없으면 지금 화면을 저장
  int _lastReadyPage = -1; // 사진까지 다 그려진 마지막 쪽 (내보내기에서 기다림)

  void _onDocumentPageReady(int page) {
    _lastReadyPage = page;
    final readyWaiter = _pageReadyWaiter;
    if (readyWaiter != null && !readyWaiter.isCompleted) {
      _pageReadyWaiter = null;
      readyWaiter.complete(page);
    }
    if (_docScrollPreparing) return;
    if (!mounted || !_snapEligible) return;
    if (page != _docPage) return;
    if (_snapShownPage == page) {
      // 실제 쪽이 화면에 그려질 시간을 한 프레임 준 뒤 걷어 냄
      WidgetsBinding.instance.addPostFrameCallback((_) => _snapHide());
    }
    // 다음 쪽 저장 화면을 미리 풀어 두면 넘기는 순간 바로 보인다
    final ahead = _snapFile(page + _snapStep);
    if (ahead != null && ahead.existsSync()) unawaited(precacheImage(FileImage(ahead), context).catchError((_) {}));
    final file = _snapFile(page);
    if (file == null || file.existsSync()) return;
    final serial = ++_snapCaptureSerial;
    Future<void>.delayed(const Duration(milliseconds: 400), () async {
      if (!mounted || serial != _snapCaptureSerial || page != _docPage) return;
      // 넘기는 중·확대 중·필기 중·다른 화면이 덮고 있을 때는 저장하지 않음
      if (_vPeekActive || _vPageSwipe.isAnimating || _vPageSwipe.isVerticalGesture || _snapShown != null) return;
      if (_epubZoomScale > 1.03 || _isStylusDown || _activeStrokePoints.isNotEmpty || _slideShow || _isExporting || _findOpen) return;
      try {
        final bytes = await _pdfChannel.invokeMethod<Uint8List>(
          'snapshotWebView',
          {'background': _getBgColor().toARGB32(), 'scale': 1.0},
        );
        if (bytes == null || bytes.length < 1024 || !mounted || page != _docPage) return;
        final again = _snapFile(page); // 저장하는 사이 화면 크기가 바뀌었을 수 있음
        if (again == null || again.path != file.path) return;
        final tmp = File('${file.path}.tmp');
        await tmp.writeAsBytes(bytes, flush: true);
        await tmp.rename(file.path);
      } catch (_) {}
    });
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
        _progress = 0.0;
        _activeStrokePoints.clear();
      });
    }
    _readerProgress(0.0);
  }

  void _jumpToLastPage() {
    if (_currentCfi != null) {
      setState(() {
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

  // ── 메모 되돌리기 / 다시 실행 (현재 보고 있는 페이지 위치 기준) ──
  Future<void> _applyEpubStrokes(String locKey, List<MemoStroke> strokes) async {
    if (locKey == _currentPageLocationKey) {
      setState(() => _epubStrokes = List<MemoStroke>.of(strokes));
    }
    await StorageService.saveEpubLocationStrokes(widget.filePath, locKey, strokes);
  }

  Future<void> _undoMemo() async {
    final r = _memoHistory.undo([_currentPageLocationKey], (_) => _epubStrokes);
    if (r != null) await _applyEpubStrokes(r.$1 as String, r.$2);
  }

  Future<void> _redoMemo() async {
    final r = _memoHistory.redo([_currentPageLocationKey], (_) => _epubStrokes);
    if (r != null) await _applyEpubStrokes(r.$1 as String, r.$2);
  }

  /// 지우개로 문지르기를 끝냈을 때, 실제로 지워진 게 있으면 되돌리기 기록에 남김
  void _finishEraseHistory() {
    final start = _eraseStartStrokes;
    _eraseStartStrokes = null;
    if (start == null) return;
    if (!identical(_epubStrokes, start)) {
      setState(() => _memoHistory.record(_currentPageLocationKey, start));
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
        enabled: _memoHistory.canUndo([_currentPageLocationKey]),
        onTap: _undoMemo,
      ),
      MemoToolButton(
        icon: Icons.redo,
        label: _tr('다시 실행', 'Redo', '重做', 'やり直し'),
        enabled: _memoHistory.canRedo([_currentPageLocationKey]),
        onTap: _redoMemo,
      ),
      MemoToolButton(
        icon: Icons.delete_sweep_outlined,
        color: Colors.redAccent,
        label: _tr('필기 전체 지우기', 'Clear All Strokes', '清空全部手写', '手書きを全消去'),
        onTap: () async {
          final locKey = _currentPageLocationKey;
          if (_epubStrokes.isNotEmpty) _memoHistory.record(locKey, _epubStrokes);
          setState(() => _epubStrokes = []);
          await StorageService.saveEpubLocationStrokes(widget.filePath, locKey, []);
        },
      ),
      MemoDoneButton(
        label: _tr('완료', 'Done', '完成', '完了'),
        onTap: () => setState(() {
          _isMemoMode = false;
          _isEraserMode = false;
          _allowFingerDrawing = false;
          _isStylusDown = false;
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

  /// EPUB·TXT 본문이 시작하는 높이: 상단바(위 여백 + 버튼 줄 48) 아래로 살짝 띄움
  double get _readerTextTop {
    final double barBottom = MediaQuery.paddingOf(context).top + 48.0;
    // TXT는 화면 안쪽에 자체 여백(32)이 있어 그만큼 덜 내린다
    return _isTxt ? math.max(12.0, barBottom + 10.0 - TxtPageDocument.margin) : barBottom + 10.0;
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

  /// 페이지를 바꾸는 동작을 하고, 새 페이지로 옮겨졌다는 알림을 기다린다 (없으면 [timeout] 후 진행)
  Future<void> _runAndWaitRelocate(VoidCallback action, Duration timeout) async {
    final waiter = Completer<void>();
    _relocateWaiter = waiter;
    action();
    await waiter.future.timeout(timeout, onTimeout: () {});
    if (identical(_relocateWaiter, waiter)) _relocateWaiter = null;
  }

  /// 지금 보이는 본문을 그림 파일로 저장: EPUB·워드·한글은 WebView 캡처, TXT는 Flutter 화면 캡처
  Future<void> _captureReaderView(String path, double dpr) async {
    if (_isTxt) {
      final boundary = _txtCaptureKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) throw Exception('TXT view not ready');
      final image = await boundary.toImage(pixelRatio: dpr);
      final png = await image.toByteData(format: ui.ImageByteFormat.png);
      image.dispose();
      if (png == null) throw Exception('PNG encode failed');
      await File(path).writeAsBytes(png.buffer.asUint8List(), flush: true);
      return;
    }
    await _pdfChannel.invokeMethod('captureWebView', {'path': path});
  }

  /// 본문 그림(WebView 캡처) + 그 페이지 필기를 합쳐 한 장의 그림으로 저장
  Future<void> _composeEpubExportPage({
    required String shotPath,
    required String outPath,
    required Size bodySize,
    required Rect viewRect,
    required double dpr,
    required List<MemoStroke> strokes,
  }) async {
    final codec = await ui.instantiateImageCodec(await File(shotPath).readAsBytes());
    final shot = (await codec.getNextFrame()).image;
    final int w = (bodySize.width * dpr).round();
    final int h = (bodySize.height * dpr).round();
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    canvas.drawRect(Rect.fromLTWH(0, 0, w.toDouble(), h.toDouble()), Paint()..color = _getBgColor());
    canvas.drawImageRect(
      shot,
      Rect.fromLTWH(0, 0, shot.width.toDouble(), shot.height.toDouble()),
      Rect.fromLTWH(viewRect.left * dpr, viewRect.top * dpr, viewRect.width * dpr, viewRect.height * dpr),
      Paint()..filterQuality = FilterQuality.high,
    );
    // 화면의 필기 표시와 같은 방식 (본문 전체 영역 기준 비율 좌표)
    for (final st in strokes) {
      if (st.dxList.isEmpty) continue;
      final paint = Paint()
        ..color = Color(st.colorValue)
        ..strokeWidth = st.strokeWidth * dpr
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;
      final path = Path()..moveTo(st.dxList.first * w, st.dyList.first * h);
      for (int i = 1; i < st.dxList.length; i++) {
        path.lineTo(st.dxList[i] * w, st.dyList[i] * h);
      }
      if (st.dxList.length == 1) path.lineTo(st.dxList.first * w + 0.01, st.dyList.first * h);
      canvas.drawPath(path, paint);
    }
    final picture = recorder.endRecording();
    final image = await picture.toImage(w, h);
    final png = await image.toByteData(format: ui.ImageByteFormat.png);
    shot.dispose();
    image.dispose();
    picture.dispose();
    if (png == null) throw Exception('PNG encode failed');
    await File(outPath).writeAsBytes(png.buffer.asUint8List(), flush: true);
  }

  /// 파일 내보내기: 처음부터 끝까지 지금 보이는 모양(글자 크기·배경) 그대로 한 페이지씩 담고,
  /// 각 페이지에 직접 쓴 필기를 겹쳐서 PDF 한 파일로 저장 (다운로드/FReader 폴더).
  /// 끝나면 원래 읽던 위치로 돌아간다.
  /// 파일 내보내기는 워드·한글 문서만 (EPUB·TXT는 제외)
  bool get _canExport => _isOfflineDocument && !_isTxt && !_isSpreadsheet && !_isPresentation; // 워드·한글만 (PPT는 내보내기 없음)

  Future<void> _exportToPdf() async {
    if (!_canExport) return;
    if (_isExporting) return;
    final bodyBox = _epubBodyKey.currentContext?.findRenderObject() as RenderBox?;
    final viewBox = _epubViewRectKey.currentContext?.findRenderObject() as RenderBox?;
    if (bodyBox == null || viewBox == null || !bodyBox.hasSize || !viewBox.hasSize) return;
    final double dpr = MediaQuery.devicePixelRatioOf(context);
    final Size bodySize = bodyBox.size;
    final Rect viewRect = viewBox.localToGlobal(Offset.zero, ancestor: bodyBox) & viewBox.size;
    final String? savedCfi = _currentCfi;
    final double savedProgress = _progress;

    setState(() {
      _isExporting = true;
      _activeStrokePoints.clear();
    });
    final progress = showExportProgress(context, _tr, cancelable: true);
    progress.update(_tr('처음 페이지로 이동 중…', 'Going to the first page…', '正在跳转到第一页…', '最初のページへ移動中…'), null);

    final tmpDir = Directory('${(await getTemporaryDirectory()).path}/epub_export_${DateTime.now().millisecondsSinceEpoch}');
    Object? error;
    String? saved;
    try {
      await tmpDir.create(recursive: true);
      await _runAndWaitRelocate(() => _readerProgress(0.0), const Duration(milliseconds: 2500));

      final pages = <Map<String, Object?>>[];
      final exportDocPages = <int>[]; // 내보낸 각 쪽이 문서의 몇 쪽인지 (목차 연결용)
      String? lastCfi;
      for (int i = 0; i < 5000; i++) {
        if (progress.cancelled || !mounted) break;
        // PPT: 슬라이드마다 애니메이션이 모두 끝난 모습으로 (다음 버튼은 애니메이션 단계를 넘기므로 쪽 번호로 이동)
        if (_isPresentation) {
          if (i >= _docPageCount) break;
          _lastReadyPage = -1;
          await _runAndWaitRelocate(() => _hwpController.display('$_documentPositionPrefix:$i:9999'), const Duration(milliseconds: 2500));
          for (int w = 0; w < 120 && _lastReadyPage != i && mounted; w++) {
            await Future<void>.delayed(const Duration(milliseconds: 50));
          }
        }
        // 새 페이지가 다 그려지고 필기 정보가 바뀔 때까지 잠깐 기다림
        await Future<void>.delayed(const Duration(milliseconds: 350));
        // 워드·한글: 쪽 안 사진까지 다 채워질 때까지 기다림 (사진은 글자보다 늦게 채워짐)
        if (_snapEligible) {
          for (int w = 0; w < 120 && _lastReadyPage != _docPage && mounted; w++) {
            await Future<void>.delayed(const Duration(milliseconds: 50));
          }
        }
        final String? cfi = _currentCfi;
        if (!_isPresentation && i > 0 && cfi == lastCfi) break; // 더 이상 넘어가지 않음 = 마지막 페이지
        lastCfi = cfi;

        final shotPath = '${tmpDir.path}/shot_$i.png';
        await _captureReaderView(shotPath, dpr);
        final strokes = await StorageService.getEpubLocationStrokes(widget.filePath, _currentPageLocationKey);
        final pagePath = '${tmpDir.path}/page_${i.toString().padLeft(5, '0')}.png';
        await _composeEpubExportPage(
          shotPath: shotPath,
          outPath: pagePath,
          bodySize: bodySize,
          viewRect: viewRect,
          dpr: dpr,
          strokes: strokes,
        );
        try {
          await File(shotPath).delete();
        } catch (_) {}
        // 보이지 않는 글자 층 (내보낸 PDF에서도 글 찾기가 되게)
        // 글 위치는 문서 화면(WebView) 기준이라, 내보낸 쪽 그림(본문 전체 영역) 기준으로 바꿔야 형광펜 자리가 맞음
        List<Map<String, Object?>> boxes = const [];
        try {
          boxes = await _hwpController.visibleTextBoxes();
        } catch (_) {}
        final texts = [
          for (final t in boxes)
            {
              ...t,
              'x': (viewRect.left + ((t['x'] as num?) ?? 0) * viewRect.width) / bodySize.width,
              'y': (viewRect.top + ((t['y'] as num?) ?? 0) * viewRect.height) / bodySize.height,
              'w': ((t['w'] as num?) ?? 0) * viewRect.width / bodySize.width,
              'h': ((t['h'] as num?) ?? 0) * viewRect.height / bodySize.height,
            },
        ];
        exportDocPages.add(_docPage);
        pages.add({'image': pagePath, 'texts': texts});
        progress.update(
          _tr('페이지 담는 중… ${i + 1}쪽 (${(_progress * 100).toStringAsFixed(0)}%)', 'Capturing pages… ${i + 1} (${(_progress * 100).toStringAsFixed(0)}%)',
              '正在截取页面… 第${i + 1}页 (${(_progress * 100).toStringAsFixed(0)}%)', 'ページ取得中… ${i + 1}ページ (${(_progress * 100).toStringAsFixed(0)}%)'),
          _progress.clamp(0.0, 1.0).toDouble(),
        );
        if (!_isPresentation) await _runAndWaitRelocate(() => _readerNext(), const Duration(milliseconds: 1500));
      }

      if (!progress.cancelled && pages.isNotEmpty) {
        progress.update(_tr('PDF 만드는 중…', 'Building PDF…', '正在生成 PDF…', 'PDF作成中…'), null);
        // 목차(책갈피): 지금 목차 항목의 쪽 → 내보낸 PDF의 쪽
        final outline = <Map<String, Object>>[];
        if (_chapterLevels.isNotEmpty && exportDocPages.isNotEmpty) {
          for (int k = 0; k < _chapters.length; k++) {
            final int docPage = int.tryParse(_chapters[k].href.split(':').last) ?? 0;
            int at = 0;
            for (int e = 0; e < exportDocPages.length; e++) {
              if (exportDocPages[e] <= docPage) at = e;
            }
            outline.add({'title': _chapters[k].title.trim(), 'level': k < _chapterLevels.length ? _chapterLevels[k] : 1, 'page': at});
          }
        }
        saved = await PdfExportService.buildPdf(
          pages: pages,
          outline: outline,
          fileName: PdfExportService.exportFileName(widget.bookTitle, _tr),
          onProgress: (cur, total) => progress.update(
            _tr('PDF 만드는 중… $cur / $total', 'Building PDF… $cur / $total', '正在生成 PDF… $cur / $total', 'PDF作成中… $cur / $total'),
            total > 0 ? cur / total : null,
          ),
        );
      }
    } catch (e) {
      error = e;
    } finally {
      // 원래 읽던 위치로 돌아가기
      if (savedCfi != null && savedCfi.isNotEmpty) {
        _readerDisplay(savedCfi);
      } else {
        _readerProgress(savedProgress);
      }
      progress.close();
      if (mounted) setState(() => _isExporting = false);
      try {
        await tmpDir.delete(recursive: true);
      } catch (_) {}
    }
    if (saved != null || error != null) _showExportResult(saved, error);
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
      setState(() => _epubStrokes = nextStrokes);
    }
  }

  /// 뷰어 표시 설정 (JPG 뷰어와 100% 동일한 UI + EPUB 글자 크기 및 다크 모드 설정 포함)
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
    String? pendingBg; // 배경 색상: 창을 닫을 때 적용
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
                if (!_isOfflineDocument)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _settingsHeader(Icons.format_size, _tr('글자 크기', 'Font Size', '字体大小', '文字サイズ')),
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
                // PPT는 배경 색상을 적용하지 않으므로 항목도 숨김
                if (!_isPresentation) ...[
                const SizedBox(height: 8),
                _settingsHeader(Icons.palette_outlined, _tr('배경 색상', 'Background Color', '背景颜色', '背景色')),
                const SizedBox(height: 8),
                SettingGroup(
                  children: [
                    SettingOption(
                      label: Text(_tr('라이트', 'Light', '浅色', 'ライト')),
                      selected: (pendingBg ?? _epubBgTheme) == 'white',
                      // 고르기만 하고, 설정 창을 닫을 때 다시 그리며 바뀜
                      onSelected: (_) => setModalState(() => pendingBg = 'white'),
                    ),
                    SettingOption(
                      label: Text(_tr('다크', 'Dark', '深色', 'ダーク')),
                      selected: (pendingBg ?? _epubBgTheme) == 'dark',
                      // 고르기만 하고, 설정 창을 닫을 때 다시 그리며 바뀜
                      onSelected: (_) => setModalState(() => pendingBg = 'dark'),
                    ),
                    // 종이색(종이 질감)은 EPUB에서만
                    if (_isEpub)
                      SettingOption(
                        label: Text(_tr('종이색', 'Paper', '纸张色', '紙色')),
                        selected: (pendingBg ?? _epubBgTheme) == 'sepia',
                      // 고르기만 하고, 설정 창을 닫을 때 다시 그리며 바뀜
                      onSelected: (_) => setModalState(() => pendingBg = 'sepia'),
                      ),
                  ],
                ),
                ],
                const SizedBox(height: 26),
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
    if (pendingBg != null && pendingBg != _epubBgTheme && mounted) await _setEpubThemeMode(pendingBg!);
    disposeSheetControllerWhenDone(sheetCtrl);
  }

  // EPUB 스크롤 보기: 지금 장의 처음/끝에 닿았는지
  bool _chAtStart = false, _chAtEnd = false, _chFirst = true, _chLast = false;

  /// 장 이동 버튼 높이: 아래 진행바·도구 모음 바·필기 도구 막대가 있으면 그 위에
  double _chapterButtonsBottom(double bottomPadding) {
    double b = math.max<double>(bottomPadding + 16.0, 20.0) + 8.0;
    if ((_showControls && _progressBarPos == 'bottom') || _useQuickNavTurn) b += 44.0;
    if (_isMemoMode && _memoToolbarPos == 'bottom') b += 60.0;
    if (_showControls && _toolbarStyle == 'bar') b += 62.0;
    return b;
  }

  Widget _buildChapterButtons() {
    final bool dark = _getBgColor().computeLuminance() < 0.4;
    final Color bg = dark ? const Color(0xFF111111) : const Color(0xFFF1F1F4);
    final Color fg = dark ? Colors.white : const Color(0xFF222222);
    final Color border = dark ? Colors.white24 : Colors.black12;
    Widget button(String label, IconData icon, bool enabled, int dir) => Opacity(
          opacity: enabled ? 1 : 0.35,
          child: Material(
            color: bg,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: border)),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: enabled
                  ? () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _chAtStart = false;
                        _chAtEnd = false;
                      });
                      _epubController.goChapter(dir);
                    }
                  : null,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(icon, size: 20, color: fg),
                  const SizedBox(width: 8),
                  Text(label, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: fg)),
                ]),
              ),
            ),
          ),
        );
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        button(_tr('이전 챕터', 'Prev chapter', '上一章', '前の章'), Icons.keyboard_arrow_up_rounded, !_chFirst, -1),
        const SizedBox(width: 12),
        button(_tr('다음 챕터', 'Next chapter', '下一章', '次の章'), Icons.keyboard_arrow_down_rounded, !_chLast, 1),
      ],
    );
  }

  /// 목차 열기: 책 화면을 그림으로 잠시 바꿔 두고 열어 움직임이 끊기지 않게
  Uint8List? _tocFreeze;
  Future<void> _openToc() async {
    final bool docScroll = _pageModeScroll && _isOfflineDocument;
    if (!docScroll && _tocFreeze == null) {
      try {
        final bytes = await _pdfChannel.invokeMethod<Uint8List>('snapshotWebView', {
          'background': _getBgColor().toARGB32(),
          'scale': 1.0,
        }).timeout(const Duration(milliseconds: 600));
        if (mounted && bytes != null && bytes.length > 512) {
          setState(() => _tocFreeze = bytes);
          await WidgetsBinding.instance.endOfFrame;
        }
      } catch (_) {}
    }
    if (!mounted) return;
    _scaffoldKey.currentState?.openDrawer();
  }

  /// 지금 가로 모드 2페이지로 보고 있는가
  bool get _bookmarkSpreadNow {
    final size = MediaQuery.sizeOf(context);
    return _spreadFor(size.width > size.height) && (!_isOfflineDocument || _docPageCount > 1);
  }

  /// 북마크 이름: 쪽 번호 ('12페이지', 2페이지 보기면 '12, 13페이지')
  String _bookmarkPageLabel(bool spread) {
    final int total = _isOfflineDocument ? math.max(1, _docPageCount) : (_chapters.isNotEmpty ? _chapters.length * 10 : 100);
    final int page = _isOfflineDocument ? (_docPage + 1).clamp(1, total).toInt() : ((_progress * total).round()).clamp(1, total).toInt();
    if (spread && page + 1 <= total) return '$page, ${page + 1}페이지';
    return '$page페이지';
  }

  /// 예전 북마크('진행률 …% 지점')도 문서는 쪽 번호로 보여 줌
  String _bookmarkTitle(BookmarkItem bm) {
    final m = RegExp(r'^[a-z]+:(\d+)$').firstMatch(bm.position);
    if (m != null) {
      final int page = int.parse(m.group(1)!) + 1;
      return bm.spread && (page + 1 <= _docPageCount || _docPageCount == 0) ? '$page, ${page + 1}페이지' : '$page페이지';
    }
    return bm.label;
  }

  /// 북마크로 이동: 2페이지 보기에서 저장했으면 가로 모드 2페이지 보기로 바꾼 뒤 그 자리를 보여 줌
  Future<void> _openBookmark(BookmarkItem bm) async {
    if (bm.spread && !_pageModeScroll && !_bookmarkSpreadNow) {
      if (_pageDisplay == 'one') {
        await StorageService.setPageDisplay('auto');
        if (!mounted) return;
        setState(() => _pageDisplay = 'auto');
      }
      final size = MediaQuery.sizeOf(context);
      setState(() => _initialCfi = bm.position);
      if (size.height >= size.width && _pageDisplay == 'auto') await _applyRotation('landscape');
      // 화면이 돌고 다시 그려진 뒤 그 자리로
      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
    }
    _readerDisplay(bm.position);
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
                icon: const Icon(Icons.bookmark_add, size: 16),
                label: Text(_tr('현재 페이지 북마크', 'Bookmark This Page', '添加当前页书签', '現在ページをブックマーク')),
                onPressed: () async {
                  if (_currentCfi == null) return;
                  final now = DateTime.now();
                  final bool spread = _bookmarkSpreadNow;
                  await StorageService.addBookmark(
                    widget.filePath,
                    BookmarkItem(
                      id: now.millisecondsSinceEpoch.toString(),
                      label: _bookmarkPageLabel(spread),
                      position: _currentCfi!,
                      createdAt: '${now.month}/${now.day} ${now.hour}:${now.minute.toString().padLeft(2, '0')}',
                      spread: spread,
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
                      leading: Icon(bm.spread ? Icons.menu_book : Icons.bookmark, color: Colors.amber),
                      title: Text(_bookmarkTitle(bm)),
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
                        _openBookmark(bm);
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

  // ── 파일 내 단어 검색 (한글·워드) ──
  bool _findOpen = false;

  // 파일 내 단어 찾기 (한글·워드): 스크롤 보기에서도 그 쪽으로 옮기고 쪽 그림 위에 형광펜
  String _findQuery = '';
  Future<int> _docFindSearch(String q) async {
    final n = await _hwpController.search(q);
    if (mounted) setState(() => _findQuery = n > 0 ? q : '');
    return n;
  }

  Future<void> _docFindGoto(int index) async {
    if (_pageModeScroll && _usesBackgroundScroll && _docScrollReadyNow) {
      final pages = _hwpController.lastSearchPages;
      if (index >= 0 && index < pages.length) _scrollCtrl.jumpToPage(pages[index]);
      return;
    }
    await _hwpController.showSearchResult(index);
  }

  void _closeFind() {
    if (_findQuery.isNotEmpty) setState(() => _findQuery = '');
    if (_isTxt) {
      _txtController.clearSearch();
    } else {
      unawaited(_hwpController.clearSearch());
    }
    setState(() => _findOpen = false);
  }

  // ── PPT 슬라이드 쇼: 가로 전체 화면, 검은 바탕, 화면을 누르거나 밀어서 넘김 ──
  bool _slideShow = false;
  bool _slideShowExitVisible = false;
  Timer? _slideShowExitTimer;
  double _slideShowDragDx = 0;

  Future<void> _startSlideShow() async {
    // 슬라이드 쇼는 항상 첫 슬라이드부터 시작한다
    final first = '$_documentPositionPrefix:0';
    setState(() {
      _slideShow = true;
      _showControls = false;
      _isMemoMode = false;
      _initialCfi = first;
    });
    _readerDisplay(first);
    _showSlideShowExit();
    try {
      await _pdfChannel.invokeMethod('setScreenOrientation', {'mode': 'landscape'});
    } catch (_) {}
  }

  Future<void> _endSlideShow() async {
    _slideShowExitTimer?.cancel();
    setState(() {
      _slideShow = false;
      _slideShowExitVisible = false;
      _initialCfi = _currentCfi;
    });
    final bool? want = StorageService.desiredLandscapeNotifier.value;
    try {
      await _pdfChannel.invokeMethod('setScreenOrientation', {
        'mode': want == null ? 'unspecified' : (want ? 'landscape' : 'portrait'),
      });
    } catch (_) {}
  }

  void _showSlideShowExit() {
    _slideShowExitTimer?.cancel();
    setState(() => _slideShowExitVisible = true);
    _slideShowExitTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _slideShowExitVisible = false);
    });
  }

  /// 슬라이드 쇼 화면 맨 위: 누르거나 밀어 넘기기, 위쪽을 누르면 끝내기 버튼
  Widget _buildSlideShowLayer() {
    return Positioned.fill(
      child: LayoutBuilder(
        builder: (context, box) => GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapUp: (d) {
            if (d.localPosition.dy < box.maxHeight * 0.15) {
              _showSlideShowExit();
            } else if (d.localPosition.dx < box.maxWidth * 0.3) {
              _readerPrevious();
            } else {
              _readerNext();
            }
          },
          onHorizontalDragStart: (_) => _slideShowDragDx = 0,
          onHorizontalDragUpdate: (d) => _slideShowDragDx += d.delta.dx,
          onHorizontalDragEnd: (d) {
            final v = d.primaryVelocity ?? 0;
            if (_slideShowDragDx < -40 || v < -400) _readerNext();
            if (_slideShowDragDx > 40 || v > 400) _readerPrevious();
          },
          child: Align(
            alignment: Alignment.topRight,
            child: AnimatedOpacity(
              opacity: _slideShowExitVisible ? 1 : 0,
              duration: const Duration(milliseconds: 200),
              child: IgnorePointer(
                ignoring: !_slideShowExitVisible,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Material(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: _endSlideShow,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.close, color: Colors.white, size: 16),
                              const SizedBox(width: 6),
                              Text(_tr('슬라이드 쇼 끝내기', 'End Slide Show', '结束幻灯片放映', 'スライドショー終了'),
                                  style: const TextStyle(color: Colors.white, fontSize: 13)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── 위/아래로 밀기: 손가락을 따라 페이지가 위·아래로 움직이며 넘어감 ──
  // (epub.js는 세로 스와이프로 페이지를 넘기지 않으므로 가로 스와이프와 겹치지 않음)
  late final VerticalPageSwipe _vPageSwipe = VerticalPageSwipe(vsync: this);
  Completer<void>? _relocateWaiter;

  // PDF 내보내기용: 본문 전체 영역과 WebView 영역 위치
  final GlobalKey _epubBodyKey = GlobalKey();
  final GlobalKey _epubViewRectKey = GlobalKey();
  bool _isExporting = false;

  bool _vSwipeEnabled(PointerEvent e) =>
      !_isSpreadsheet && _useSwipeUpTurn && !_pageModeScroll &&
      !_isTouchLocked &&
      _epubZoomScale <= 1.03 &&
      !_hasTextSelection &&
      !(_isMemoMode && isStylusPointer(e));

  // ── 위/아래로 밀 때 다음(이전) 장 미리 보기 ──
  // 손가락이 닿는 순간 지금 화면을 그림으로 붙잡아 두고(밀기 중에 붙잡으면 화면이 버벅임),
  // 세로 밀기로 정해지면 그 그림이 손가락을 따라 움직이는 동안 실제 화면은 다음(이전) 장으로 넘겨
  // 그림 바로 뒤에 따라 보이게 한다. 손을 떼어 넘기면 이미 넘어가 있으므로 그대로, 취소하면 원래 장으로.
  ui.Image? _vSnap; // 붙잡아 둔 지금 화면
  List<MemoStroke> _vSnapStrokes = const [];
  Future<ui.Image?>? _vPreSnap; // 손가락이 닿을 때 미리 찍어 둔 화면
  int _vTurned = 0; // 실제 화면을 미리 넘겨 둔 방향 (0: 안 넘김)
  bool _vPeekReady = false; // 넘긴 화면이 다 그려져 보여도 되는지
  int _vPeekWanted = 0;
  bool _vPeekActive = false; // 미리 보기 작업이 끝나지 않음 (손을 뗀 뒤 정리까지)
  int _vBasePage = 0; // 밀기 시작할 때의 쪽 (문서)
  bool _vBaseAtStart = false, _vBaseAtEnd = false; // 밀기 시작할 때 EPUB 첫/마지막 화면이었는지
  int _vBaseStepsLeft = 0; // 밀기 시작할 때 PPT 슬라이드에 남은 애니메이션 단계 수
  String? _vBasePos; // 밀기 시작할 때의 위치
  Future<void> _vPeekChain = Future<void>.value();
  // 동작(손가락을 대고 뗄 때까지)마다 번호를 붙인다. 앞 동작의 넘김·정리가 끝나기 전에 다음 동작이
  // 시작되면 앞 동작의 '시작 쪽'을 물려받아 이전 쪽으로 되돌리는 문제가 있어, 미리 보기는 한 동작만 맡는다.
  int _vGestureSeq = 0;
  int? _vPeekOwner; // 지금 미리 보기를 맡은 동작 번호
  int? _vPreSnapOwner;
  int _vPeekPending = 0; // 아직 끝나지 않은 미리 보기 작업 수

  void _vPeekQueue(Future<void> Function() job) {
    _vPeekPending++;
    _vPeekChain = _vPeekChain.then((_) => job()).catchError((_) {}).whenComplete(() => _vPeekPending--);
  }

  /// 넘길 수 있는지: 미리 넘겨 둔 동안에도 밀기 시작한 쪽을 기준으로 판단한다
  bool _canTurnSwipe(int dir) {
    if (_isOfflineDocument && _docPageCount > 0) {
      final bool mine = _vPeekActive && _vPeekOwner == _vGestureSeq; // 이 동작이 미리 보기를 맡은 경우만 시작 쪽 기준
      final int page = mine ? _vBasePage : _docPage;
      // 파워포인트는 마지막 슬라이드에도 애니메이션 단계가 남아 있을 수 있다 (남은 단계가 없으면 더 넘길 곳 없음)
      if (_isPresentation) {
        return dir > 0
            ? page < _docPageCount - 1 || (mine ? _vBaseStepsLeft : _pptStepsLeft) > 0
            : page > 0 || _posOrder(mine ? _vBasePos : _currentCfi) % 100000 > 0;
      }
      return dir > 0 ? page < _docPageCount - 1 : page > 0;
    }
    if (!_isOfflineDocument) {
      // EPUB: 책의 마지막(첫) 화면에서는 더 넘길 곳이 없다
      final bool mine = _vPeekActive && _vPeekOwner == _vGestureSeq;
      return dir > 0 ? !(mine ? _vBaseAtEnd : _epubAtEnd) : !(mine ? _vBaseAtStart : _epubAtStart);
    }
    return true;
  }

  /// 손가락이 닿았을 때: 세로 밀기가 될 수 있으면 지금 화면을 미리 찍어 둔다
  void _vPeekOnDown(PointerDownEvent event) {
    _vGestureSeq++;
    if (_vPeekActive || _vPeekPending > 0 || _vPageSwipe.isAnimating || !_vSwipeEnabled(event)) return;
    if (_vPreSnap != null) return;
    _vBasePage = _docPage;
    _vBasePos = _currentCfi;
    _vBaseAtStart = _epubAtStart;
    _vBaseAtEnd = _epubAtEnd;
    _vBaseStepsLeft = _pptStepsLeft;
    _vPreSnap = _vCaptureCurrent();
    _vPreSnapOwner = _vGestureSeq;
  }

  /// 세로 밀기 중 방향이 정해지거나 바뀌었을 때
  void _vPeekOnMove() {
    if (!_vPageSwipe.isVerticalGesture || _vPageSwipe.isAnimating) return;
    final double off = _vPageSwipe.offset;
    if (off.abs() < 1.0) return;
    final int dir = off < 0 ? 1 : -1;
    if (_vPeekOwner != null && _vPeekOwner != _vGestureSeq) return; // 앞 동작이 아직 정리 중: 이번엔 미리 보기 없이
    if (dir == _vPeekWanted) return;
    if (!_vPeekActive) {
      if (_vPeekPending > 0) return; // 앞 동작의 넘김이 아직 진행 중
      if (_vPreSnap == null || _vPreSnapOwner != _vGestureSeq) {
        _vBasePage = _docPage;
        _vBasePos = _currentCfi;
        _vBaseAtStart = _epubAtStart;
        _vBaseAtEnd = _epubAtEnd;
        _vBaseStepsLeft = _pptStepsLeft;
      }
      _vPeekActive = true;
      _vPeekOwner = _vGestureSeq;
    }
    if (!_canTurnSwipe(dir)) return;
    _vPeekWanted = dir;
    _vPeekQueue(() => _vPeekPrepare(dir));
  }

  /// 쪽 위치 알림을 기다린다. 문서는 쪽 번호가 [until]을 만족할 때까지(다른 알림은 건너뜀).
  Future<bool> _vWaitRelocate(void Function() action, bool Function() until) async {
    final deadline = DateTime.now().add(const Duration(milliseconds: 1500));
    action();
    while (true) {
      if (_isOfflineDocument && until()) return true;
      final left = deadline.difference(DateTime.now());
      if (left <= Duration.zero) return _isOfflineDocument && until();
      final waiter = Completer<void>();
      _relocateWaiter = waiter;
      bool got = true;
      await waiter.future.timeout(left, onTimeout: () => got = false);
      if (identical(_relocateWaiter, waiter)) _relocateWaiter = null;
      if (!_isOfflineDocument) return got;
      if (!got) return until();
    }
  }

  Future<bool> _vTurnAndWait(int dir) {
    // 쪽 번호가 같아도 위치가 바뀌면 넘어간 것 (파워포인트 애니메이션 단계)
    final String? before = _currentCfi;
    final int beforePage = _docPage;
    return _vWaitRelocate(dir > 0 ? _readerNext : _readerPrevious, () => _docPage != beforePage || _currentCfi != before);
  }

  /// 문서 위치('docx:3', 'pptx:3:2' 등)를 앞뒤 비교용 숫자로 (쪽×100000 + 단계)
  int _posOrder(String? pos) {
    final m = RegExp(r'^[a-z]+:(\d+)(?::(\d+))?$').firstMatch(pos ?? '');
    if (m == null) return _docPage * 100000;
    return int.parse(m.group(1)!) * 100000 + int.parse(m.group(2) ?? '0');
  }

  /// 실제 화면을 밀기 시작한 쪽으로 되돌린다
  Future<void> _vRestoreBase() async {
    if (_isOfflineDocument) {
      final pos = _vBasePos;
      final bool atBase = pos != null ? _currentCfi == pos : _docPage == _vBasePage;
      if (!atBase) await _vWaitRelocate(() {
        if (pos != null) {
          _readerDisplay(pos);
        } else {
          (_docPage > _vBasePage ? _readerPrevious : _readerNext)();
        }
      }, () => pos != null ? _currentCfi == pos : _docPage == _vBasePage);
    } else if (_vTurned != 0) {
      final pos = _vBasePos;
      if (pos != null) {
        await _vWaitRelocate(() => _readerDisplay(pos), () => true);
      } else {
        await _vTurnAndWait(-_vTurned);
      }
    }
    _vTurned = 0;
  }

  /// 실제 화면이 밀기 시작한 쪽에서 어느 방향으로 넘어가 있는지
  int _vActualTurn() {
    if (_isOfflineDocument) {
      final base = _vBasePos;
      if (base != null && _currentCfi != null) return (_posOrder(_currentCfi) - _posOrder(base)).sign;
      return (_docPage - _vBasePage).sign;
    }
    return _vTurned;
  }

  Future<ui.Image?> _vCaptureCurrent() async {
    try {
      if (_isTxt) {
        final boundary = _txtCaptureKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
        if (boundary == null) return null;
        return await boundary.toImage(pixelRatio: MediaQuery.devicePixelRatioOf(context) * 0.75);
      }
      final bytes = await _pdfChannel.invokeMethod<Uint8List>(
        'snapshotWebView',
        {'background': _isPaperTheme ? 0 : _getBgColor().toARGB32(), 'scale': 0.75},
      );
      if (bytes == null) return null;
      final codec = await ui.instantiateImageCodec(bytes);
      return (await codec.getNextFrame()).image;
    } catch (_) {
      return null;
    }
  }

  Future<void> _vPeekPrepare(int dir) async {
    if (!mounted || _vPeekWanted != dir || !_vPeekActive) return;
    if (_vSnap == null) {
      // 이 동작에서 손가락이 닿을 때 찍어 둔 화면만 쓴다
      final pre = _vPreSnapOwner == _vPeekOwner ? _vPreSnap : null;
      if (pre != null) {
        _vPreSnap = null;
        _vPreSnapOwner = null;
      }
      final image = await (pre ?? _vCaptureCurrent());
      if (image == null || !mounted || !_vPeekActive) {
        image?.dispose();
        return;
      }
      setState(() {
        _vSnap = image;
        _vSnapStrokes = _epubStrokes;
        _vPeekReady = false;
      });
      await WidgetsBinding.instance.endOfFrame;
    }
    if (!mounted || _vPeekWanted != dir) return;
    if (_vActualTurn() == dir && _vTurned == dir) return;
    setState(() => _vPeekReady = false);
    if (_vActualTurn() != 0 || _vTurned != 0) {
      // 반대 방향으로 바꿔 민 경우: 먼저 원래 장으로
      await _vRestoreBase();
      if (_vActualTurn() != 0) return;
    }
    if (!mounted || _vPeekWanted != dir) return;
    if (await _vTurnAndWait(dir)) {
      _vTurned = dir;
      await Future<void>.delayed(const Duration(milliseconds: 60)); // 새 장이 그려질 시간
      if (mounted && _vTurned == dir && _vSnap != null) setState(() => _vPeekReady = true);
    }
  }

  /// 넘기기로 정해졌을 때 (지금 화면 그림은 이미 화면 밖으로 밀려남)
  Future<void> _vPeekCommit(int dir, int gesture) async {
    final done = Completer<void>();
    if (_vPeekOwner != gesture) {
      // 이 동작은 미리 보기 없이 진행됨: 앞 작업이 끝난 뒤 그냥 한 장 넘긴다
      _vPeekQueue(() async {
        try {
          await _turnEpubInstant(dir);
        } finally {
          done.complete();
        }
      });
      await done.future;
      _hasTextSelection = false;
      return;
    }
    _vPeekQueue(() async {
      try {
        final int actual = _vActualTurn();
        if (actual == dir) {
          // 이미 넘어가 있음
        } else {
          if (actual != 0 || _vTurned != 0) await _vRestoreBase();
          if (_vSnap == null) {
            await _turnEpubInstant(dir);
          } else {
            await _vTurnAndWait(dir);
          }
        }
      } finally {
        done.complete();
      }
    });
    await done.future;
    _hasTextSelection = false;
    _vPeekClear();
  }

  /// 손을 뗀 뒤 정리: 취소된 경우 미리 넘겨 둔 장을 원래대로
  void _vPeekFinish(int gesture) {
    _vPeekQueue(() async {
      if (_vPeekOwner == gesture) {
        if (_vPeekActive && (_vActualTurn() != 0 || _vTurned != 0)) {
          if (mounted) setState(() => _vPeekReady = false);
          await _vRestoreBase();
          await Future<void>.delayed(const Duration(milliseconds: 60));
        }
        if (_vSnap != null || _vPeekActive) _vPeekClear();
      }
      if (_vPreSnapOwner == gesture) {
        final pre = _vPreSnap;
        _vPreSnap = null;
        _vPreSnapOwner = null;
        if (pre != null) unawaited(pre.then((img) => img?.dispose()));
      }
    });
  }

  void _vPeekClear() {
    final old = _vSnap;
    _vPeekWanted = 0;
    _vPeekActive = false;
    _vPeekOwner = null;
    _vTurned = 0;
    if (mounted) {
      setState(() {
        _vSnap = null;
        _vSnapStrokes = const [];
        _vPeekReady = false;
      });
    }
    if (old != null) WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
  }

  /// 세로 밀기 중 실제 화면(WebView/TXT)의 위치: 미리 넘겨 둔 장은 그림 바로 뒤(아래/위)에 붙는다
  double _vWebOffset(double screenHeight) {
    final double off = _vPageSwipe.offset;
    if (_vSnap == null) return off;
    if (_vTurned == 0 || !_vPeekReady) return screenHeight * 3; // 준비될 때까지 화면 밖에
    if (_vPageSwipe.offset * _vTurned > 0) return screenHeight * 3; // 반대쪽으로 되돌려 미는 중
    return off + _vTurned * screenHeight;
  }

  Widget _vSwipeStage(Widget content, double screenHeight) {
    final snap = _vSnap;
    return Stack(
      fit: StackFit.expand,
      clipBehavior: Clip.none,
      children: [
        Transform.translate(offset: Offset(0, _vWebOffset(screenHeight)), child: content),
        if (snap != null)
          Transform.translate(
            offset: Offset(0, _vPageSwipe.offset),
            child: IgnorePointer(child: RawImage(image: snap, fit: BoxFit.fill)),
          ),
      ],
    );
  }

  /// 페이지가 화면 밖에 있는 동안 페이지를 바꾸고, 새 페이지가 그려질 때까지 기다림
  Future<void> _turnEpubInstant(int dir) async {
    _hasTextSelection = false;
    setState(() => _activeStrokePoints.clear());
    final waiter = Completer<void>();
    _relocateWaiter = waiter;
    if (dir > 0) {
      _readerNext();
    } else {
      _readerPrevious();
    }
    await waiter.future.timeout(const Duration(milliseconds: 550), onTimeout: () {});
    if (identical(_relocateWaiter, waiter)) _relocateWaiter = null;
    await Future<void>.delayed(const Duration(milliseconds: 40));
  }

  // ── 스와이프 페이지 넘김 보강 ──
  // WebView(epub.js)의 스와이프 인식은 (1) 빠른 튕김은 위쪽 확대 제스처에 빼앗기고,
  // (2) 손가락이 세로로 50px 이상 흔들리면 무시된다. 이 두 경우만 Flutter가 직접 넘겨
  // 한 번의 스와이프에 한 페이지만 넘어가도록 한다.
  int _swipeActivePointers = 0;
  bool _swipeMultiTouch = false;
  bool _swipeHandledByDrag = false;
  bool _swipeScaleStarted = false;
  Offset? _swipeStartPos;
  DateTime? _swipeStartTime;
  DateTime? _swipeFirstMoveTime;
  double _flickDx = 0.0;
  bool _hasTextSelection = false;

  bool get _swipeFlutterOwned =>
      !_isSpreadsheet && _useSwipeTurn && !_isTouchLocked && _epubZoomScale <= 1.03;

  bool _isStylusEvent(PointerEvent e) =>
      e.kind == PointerDeviceKind.stylus || e.kind == PointerDeviceKind.invertedStylus;

  void _swipeTrackDown(PointerDownEvent e) {
    if (_isSpreadsheet) return;
    if (_isMemoMode && _isStylusEvent(e)) return;
    _swipeActivePointers++;
    if (_swipeActivePointers == 1) {
      _swipeMultiTouch = false;
      _swipeHandledByDrag = false;
      _swipeScaleStarted = false;
      _swipeStartPos = e.position;
      _swipeStartTime = DateTime.now();
      _swipeFirstMoveTime = null;
    } else {
      _swipeMultiTouch = true;
    }
  }

  void _swipeTrackMove(PointerMoveEvent e) {
    final start = _swipeStartPos;
    if (start == null || _swipeFirstMoveTime != null) return;
    if ((e.position - start).distance > 12.0) {
      _swipeFirstMoveTime = DateTime.now();
    }
  }

  void _swipeTrackUp(PointerEvent e, {bool cancelled = false}) {
    if (_isSpreadsheet) return;
    if (_isMemoMode && _isStylusEvent(e)) return;
    if (_swipeActivePointers > 0) _swipeActivePointers--;
    if (_swipeActivePointers > 0) return;

    final start = _swipeStartPos;
    final startTime = _swipeStartTime;
    _swipeStartPos = null;
    _swipeStartTime = null;
    if (cancelled || start == null || startTime == null) return;
    if (_swipeMultiTouch || _swipeHandledByDrag) return;
    if (_isTouchLocked || _epubZoomScale > 1.03 || _hasTextSelection) return;

    // 길게 누른 뒤 끄는 동작(문장 선택 등)은 스와이프로 보지 않음
    final int holdMs = (_swipeFirstMoveTime ?? DateTime.now()).difference(startTime).inMilliseconds;
    if (holdMs > 400) return;

    final Offset d = e.position - start;
    final double adx = d.dx.abs();
    final double ady = d.dy.abs();

    if (!_useSwipeTurn) return;
    final bool isSwipe = adx >= 40.0 && adx > ady * 1.2;
    if (!isSwipe) return;

    if (_isOfflineDocument) {
      // TXT·워드·한글 화면은 스스로 스와이프를 처리하지 않으므로 항상 여기서 넘긴다
      _turnBySwipeDirection(d.dx);
      return;
    }
    if (_swipeScaleStarted) {
      // 확대 제스처가 터치를 가져가 WebView가 못 받은 스와이프
      _turnBySwipeDirection(d.dx);
      return;
    }
    // WebView가 받은 스와이프: epub.js 기준(가로 50px 초과 & 세로 흔들림 50px 미만)을 통과하면
    // epub.js가 넘기므로 건드리지 않고, 기준에 걸려 무시되는 경우만 대신 넘긴다. 경계값 근처는 중복 방지를 위해 보류.
    final bool jsWouldTurn = adx > 55.0 && ady < 45.0;
    final bool nearJsBoundary = (adx > 45.0 && adx <= 55.0) || (ady >= 45.0 && ady < 55.0 && adx > 55.0);
    if (!jsWouldTurn && !nearJsBoundary) {
      _turnBySwipeDirection(d.dx);
    }
  }

  /// EPUB에서 길게 눌러 고른 글의 선택 표시를 지움
  void _clearEpubSelection() {
    _hasTextSelection = false;
    _selectedText = '';
    try {
      if (!_isOfflineDocument) _epubController.clearSelection();
    } catch (_) {}
  }

  // 왼쪽으로 밀면 다음, 오른쪽으로 밀면 이전. 읽기 방향이 우→좌(세로쓰기 책·만화)면 반대로
  void _turnBySwipeDirection(double dx) {
    _hasTextSelection = false;
    setState(() => _activeStrokePoints.clear());
    if ((dx < 0) != _isMangaRtlMode) {
      _readerNext();
    } else {
      _readerPrevious();
    }
  }

  /// EPUB 책 정보(content.opf)에 쪽 넘김 방향이 오른쪽→왼쪽(page-progression-direction="rtl")으로 적혀 있는지
  static Future<bool> _epubProgressionRtl(String path) async {
    InputFileStream? input;
    try {
      input = InputFileStream(path);
      final zip = ZipDecoder().decodeBuffer(input);
      String? opfPath;
      for (final f in zip.files) {
        if (f.name == 'META-INF/container.xml') {
          final xml = utf8.decode(f.content as List<int>, allowMalformed: true);
          opfPath = RegExp(r'full-path\s*=\s*"([^"]+)"').firstMatch(xml)?.group(1);
          break;
        }
      }
      for (final f in zip.files) {
        if (opfPath != null ? f.name == opfPath : f.name.toLowerCase().endsWith('.opf')) {
          final opf = utf8.decode(f.content as List<int>, allowMalformed: true);
          return RegExp(r'page-progression-direction\s*=\s*"rtl"').hasMatch(opf);
        }
      }
    } catch (_) {
    } finally {
      try {
        await input?.close();
      } catch (_) {}
    }
    return false;
  }

  void _onFlickStart(DragStartDetails details) {
    _swipeHandledByDrag = true;
    _flickDx = 0.0;
  }

  void _onFlickUpdate(DragUpdateDetails details) {
    _flickDx += details.primaryDelta ?? details.delta.dx;
  }

  void _onFlickEnd(DragEndDetails details) {
    if (_swipeMultiTouch || _hasTextSelection) return;
    final double vx = details.velocity.pixelsPerSecond.dx;
    if (vx.abs() >= 300.0) {
      _turnBySwipeDirection(vx);
    } else if (_flickDx.abs() >= 30.0) {
      _turnBySwipeDirection(_flickDx);
    }
  }

  void _handlePointerDown(PointerDownEvent event) {
    if (_isTouchLocked) return;
    if (_isMemoMode &&
        (event.kind == PointerDeviceKind.stylus ||
            event.kind == PointerDeviceKind.invertedStylus)) {
      if (!_isStylusDown) {
        setState(() => _isStylusDown = true);
      }
      return;
    }
    // 이미 다른 손가락이 닿아 있으면(두 손가락) 그 동작은 탭이 아님
    if (_pointerDownPosition != null && _pointerDownTime != null && _tapPointers > 0) {
      _swipeMultiTouch = true;
    }
    _tapPointers++;
    _pointerDownPosition = event.position;
    _pointerDownTime = DateTime.now();
  }
  int _tapPointers = 0;

  void _handlePointerUp(PointerUpEvent event, Size screenSize) {
    if (_tapPointers > 0) _tapPointers--;
    // 두 손가락 중 하나를 먼저 뗀 경우: 나머지를 뗄 때까지 기다림 (탭으로 처리하지 않음)
    if (_tapPointers > 0) return;
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

    // 그림 위에서 글을 골라 둔 상태: 탭은 메뉴를 열지 않고 고른 글만 지움 (복사 버튼은 먼저 처리됨)
    if (WordSelectionLayer.active.value) {
      if (distance < 24.0 && duration < 380 && !WordSelectionLayer.containsGlobal(event.position)) {
        WordSelectionLayer.clearAll();
      }
      _pointerDownPosition = null;
      _pointerDownTime = null;
      return;
    }
    // PPT: 길게 누르면 지금 쪽의 글을 고르고 복사하는 창 (한글·워드·EPUB·TXT는 글을 직접 길게 눌러 고름)
    if (distance < 18.0 && duration >= 550 && _isPresentation && !_isMemoMode && !_slideShow) {
      HapticFeedback.selectionClick();
      _openTextCopySheet();
      _pointerDownPosition = null;
      _pointerDownTime = null;
      return;
    }
    // 두 손가락(확대·축소)을 쓴 동작은 탭으로 보지 않음
    final bool multiTouch = _swipeMultiTouch || _tapPointers > 0;
    if (distance < 24.0 && duration < 380 && !multiTouch) {
      if (_hasTextSelection && !_isOfflineDocument) {
        // 글이 선택된 상태에서 화면을 누르면 선택 표시만 지움
        _clearEpubSelection();
      } else {
        _onReaderTap(event.position);
      }
    }
    _pointerDownPosition = null;
    _pointerDownTime = null;
  }

  /// 화면을 한 번 눌렀을 때: 탭 모드면 위쪽은 메뉴, 아래 왼쪽·오른쪽은 이전·다음 쪽
  /// (메뉴가 떠 있거나 필기 중이면 메뉴만 닫음. 읽기 방향 우→좌면 왼쪽이 다음, 스크롤 모드는 원래 순서)
  void _onReaderTap(Offset global) {
    if (!_pageModeTap || _showControls || _isMemoMode || _slideShow) {
      _toggleControls();
      return;
    }
    switch (tapZoneAt(uiScaledPosition(context, global), MediaQuery.sizeOf(context))) {
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
      // 스크롤 모드: 원래 순서대로 한 화면씩
      if (_isOfflineDocument) {
        _scrollCtrl.scrollByScreen(dir);
      } else if (dir > 0) {
        _readerNext();
      } else {
        _readerPrevious();
      }
      return;
    }
    if (dir > 0) {
      _turnNext();
    } else {
      _turnPrev();
    }
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
    // 종이색: 화면 뒤에 종이 질감 그림을 깔고 책 바탕은 투명하게
    final String cssBg = _epubBgTheme == 'dark'
        ? '#1E1E1E'
        : (_epubBgTheme == 'sepia' ? 'transparent' : '#FFFFFF');
    final String cssFg = _epubBgTheme == 'dark'
        ? '#D4D4D4'
        : (_epubBgTheme == 'sepia' ? '#3B2F2F' : '#000000');

    return EpubTheme.custom(
      backgroundDecoration: _isPaperTheme ? null : BoxDecoration(color: _getBgColor()),
      foregroundColor: _getFgColor(),
      customCss: {
        // 책 자체 CSS가 html에 여백을 주면 쪽(단) 경계가 어긋나 글이 두 쪽에 걸쳐 보인다 → 여백 제거
        'html': {
          'padding': '0 !important',
          'margin': '0 !important',
        },
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
          // 글자를 크게 해서 한 단어(띄어쓰기 없는 긴 글)가 쪽 너비보다 길어지면 그때만 줄을 바꿈 (옆 쪽으로 넘치지 않게)
          'overflow-wrap': 'break-word',
          'line-height': '1.75',
          'text-align': 'justify',
        },
        'pre, code': {
          'white-space': 'pre-wrap !important',
          'overflow-wrap': 'anywhere',
        },
        'img, svg, video, table': {
          'max-width': '100% !important',
        },
        '::selection': {
          'background': 'rgba(255, 215, 0, 0.35)',
        },
        // 사용자가 고른 EPUB 글꼴 (앱 저장소의 글꼴 파일을 같은 주소에서 읽음)
        if (_epubFont != null) ...{
          '@font-face': {
            'font-family': "'FReaderEpubFont'",
            'src': "url('https://appassets.androidplatform.net/userfonts/${_epubFont!.file}')",
          },
          'body, p, div, section, article, span, main, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, a, em, strong, b, i': {
            'font-family': "'FReaderEpubFont' !important",
          },
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
    // 스크롤 보기: 바로 새 배경색으로 (그림이 없으면 색만 바꿔 보여 주고 뒤에서 새로 그림)
    if (_usesBackgroundScroll) {
      _requestScrollPrep();
    } else if (_pageModeScroll && _isOfflineDocument && !_isTxt && !_isSpreadsheet && !_isPresentation) {
      setState(() => _docScrollReady = false);
      unawaited(_prepareDocScroll());
    }
    try {
      if (!_isOfflineDocument) _epubController.updateTheme(theme: _buildTheme());
    } catch (_) {}
  }

  void _changeFontSize(int delta) {
    setState(() => _fontSize = (_fontSize + delta).clamp(12, 32).toInt());
    if (!_isOfflineDocument) _epubController.setFontSize(fontSize: _fontSize.toDouble());
  }

  /// 1. 뷰어 표시에서 페이지 번호를 누르고 숫자를 입력하면 해당 페이지로 이동 (설정에서 페이지 번호가 활성화된 경우만 작동)
  Future<void> _showJumpToPageDialog({bool fromProgressBar = false}) async {
    final bool allowed = fromProgressBar
        ? (_footerInfoMode == 'page' || _footerInfoMode == 'both' || _footerInfoMode == 'none')
        : (_footerInfoMode == 'page' || _footerInfoMode == 'both');
    if (_isTouchLocked || !allowed) return;
    final int totalEstPages = _isOfflineDocument ? math.max(1, _docPageCount) : (_chapters.isNotEmpty ? _chapters.length * 10 : 100);
    final int curEstPage = _isOfflineDocument
        ? (_docPage + 1).clamp(1, totalEstPages).toInt()
        : ((_progress * totalEstPages).round()).clamp(1, totalEstPages).toInt();
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
          : _isOfflineDocument
              ? ((clamped - 1) / (totalEstPages - 1)).clamp(0.0, 1.0).toDouble() // 문서: 정확히 그 쪽으로
              : ((clamped - 1) / totalEstPages).clamp(0.0, 1.0).toDouble();
      setState(() {
        _progress = targetProg;
        _activeStrokePoints.clear();
      });
      _readerProgress(targetProg);
    }
  }

  /// 진행바에 표시할 '지금 쪽/전체 쪽' (페이지 이동 창·하단 정보 표시와 같은 계산)
  String _progressPageLabel([double? progress]) {
    final int totalEstPages = _isOfflineDocument ? math.max(1, _docPageCount) : (_chapters.isNotEmpty ? _chapters.length * 10 : 100);
    final int curEstPage = _isOfflineDocument
        ? (_docPage + 1).clamp(1, totalEstPages).toInt()
        : (((progress ?? _progress) * totalEstPages).round()).clamp(1, totalEstPages).toInt();
    return '$curEstPage/$totalEstPages';
  }

  String _formatEpubFooterText() {
    if (_footerInfoMode == 'none') return '';
    final int totalEstPages = _isOfflineDocument ? math.max(1, _docPageCount) : (_chapters.isNotEmpty ? _chapters.length * 10 : 100);
    final int curEstPage = _isOfflineDocument
        ? (_docPage + 1).clamp(1, totalEstPages).toInt()
        : ((_progress * totalEstPages).round()).clamp(1, totalEstPages).toInt();
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
    if (!_showControls || _isTouchLocked || _progressBarPos == 'hidden' || (!_isOfflineDocument && _chapters.length <= 1 && _progress <= 0.0)) {
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
        left: 14.0 + _safeSides.left + ((_memoBarBesideProgress && _memoToolbarPos == 'left') ? _memoBarSideInset : 0.0),
        // 페이지 이동 버튼(우측 12.0, 너비 약 88px -> 우측 100px 차지)과 겹치지 않도록 118px 여유 간격 확보
        right: (_useQuickNavTurn ? 118.0 : 14.0) + _safeSides.right + ((_memoBarBesideProgress && _memoToolbarPos == 'right') ? _memoBarSideInset : 0.0),
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
                  icon: const Icon(Icons.first_page, color: Colors.white, size: 16),
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
                      _progressPageLabel(),
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.last_page, color: Colors.white, size: 16),
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

    final double topInset = MediaQuery.paddingOf(context).top;
    final bool memoBarVisible = _isMemoMode && !_isTouchLocked;
    // 메모 도구모음이 상단/하단에 있으면 세로 진행바가 그만큼 비켜 준다
    final double safeTopOffset = topInset + (_showControls ? 64.0 : 16.0) + ((memoBarVisible && _memoToolbarPos == 'top') ? 52.0 : 0.0);
    final double safeBottomOffset = baseBottom + ((memoBarVisible && _memoToolbarPos == 'bottom') ? 96.0 : (_useQuickNavTurn && _progressBarPos == 'right' ? 48.0 : 8.0));
    return Positioned(
      key: ValueKey('epub_progress_bar_$_progressBarPos'),
      top: safeTopOffset,
      bottom: safeBottomOffset,
      left: _progressBarPos == 'left' ? 8.0 + _safeSides.left : null,
      right: _progressBarPos == 'right' ? 8.0 + _safeSides.right : null,
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
                icon: const Icon(Icons.vertical_align_top, color: Colors.white, size: 16),
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
                  // 세로 진행바는 폭이 좁아 긴 쪽 번호는 글자를 줄여서 표시
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      _progressPageLabel(),
                      style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.vertical_align_bottom, color: Colors.white, size: 16),
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
                onPressed: _turnPrev,
              ),
              Container(width: 1, height: 18, color: Colors.white24),
              IconButton(
                icon: const Icon(Icons.arrow_forward, color: Colors.amber, size: 17),
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
    DocScrollPrep.changed.removeListener(_onScrollPrepChanged);
    DocScrollPrep.urgent = false;
    SystemBars.leaveViewer();
    _snapHideTimer?.cancel();
    _slideShowExitTimer?.cancel();
    if (_slideShow) {
      // 슬라이드 쇼 중에 나가면 화면 방향을 원래대로
      final bool? want = StorageService.desiredLandscapeNotifier.value;
      _pdfChannel.invokeMethod('setScreenOrientation', {
        'mode': want == null ? 'unspecified' : (want ? 'landscape' : 'portrait'),
      }).catchError((_) => null);
    }
    _vPageSwipe.dispose();
    if (_shakeListeningSent == true) VolumeKeyService.setShakeListening(false);
    _epubLoadWatchdog?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _volumeKeyService.stopListening();
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
      // TXT는 읽기 방향 전환·북마크를 쓰지 않음
      if (!_isTxt)
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
          await StorageService.setBookReadingDirectionRtl(widget.filePath, nextRtl);
          setState(() => _isMangaRtlMode = nextRtl);
          if (!_isOfflineDocument) {
            try {
              _epubController.setSwipeReversed(nextRtl);
            } catch (_) {}
          }
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
          _isStylusDown = false;
          });
        },
        closeAfterTap: true,
      ),
      QuickArcMenuItem(
        icon: const Icon(Icons.copy_all_outlined, color: Colors.white, size: 17),
        tooltip: _tr('글자 복사', 'Copy Text', '复制文字', '文字をコピー'),
        onTap: _openTextCopySheet,
        closeAfterTap: true,
      ),
      if (!_isTxt)
      QuickArcMenuItem(
        icon: Icon(
          _isCurrentPageBookmarked ? Icons.bookmarks : Icons.bookmarks_outlined,
          color: _isCurrentPageBookmarked ? Colors.amber : Colors.white,
          size: 17,
        ),
        tooltip: _tr('북마크', 'Bookmarks', '书签', 'ブックマーク'),
        onTap: _openBookmarkSheet,
        closeAfterTap: true,
      ),
    ];
  }

  /// 지금 보고 있는 쪽(2페이지 보기면 두 쪽)의 글을 보여 주고 복사할 수 있게 함
  Future<void> _openTextCopySheet() async {
    String text = '';
    try {
      if (_isTxt) {
        text = _txtController.visibleText;
      } else if (_isOfflineDocument) {
        final n = _snapSpread ? 2 : 1;
        text = (await _hwpController.pageText(_docPage, math.min(_docPageCount, _docPage + n))).join('\n\n');
      } else {
        text = (await _epubController.extractCurrentPageText()).text ?? '';
      }
    } catch (_) {}
    if (!mounted) return;
    await showTextCopySheet(context, text: text, tr: _tr);
  }

  /// Excel has a two-dimensional viewport. Do not wrap it in the book reader's
  /// InteractiveViewer, page-swipe recognizers, tap zones or annotation layers.
  Widget _buildSpreadsheetReader(bool isLandscape) {
    return PopScope(
      canPop: !_findOpen,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _findOpen) _closeFind();
      },
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: _getBgColor(),
        body: SafeArea(
          top: false,
          child: Column(
            key: _epubBodyKey,
            children: [
              if (_findOpen)
                FindInFileBar(
                  onSearch: _hwpController.search,
                  onGoto: _hwpController.showSearchResult,
                  onClose: _closeFind,
                  tr: _tr,
                )
              else
                Material(
                  color: Colors.black87,
                  child: SafeArea(
                    bottom: false,
                    child: SizedBox(
                      height: 48,
                      child: Row(children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                          onPressed: () => Navigator.pop(context),
                        ),
                        Expanded(child: Text(widget.bookTitle,
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            overflow: TextOverflow.ellipsis, maxLines: 1)),
                        IconButton(
                          icon: const Icon(Icons.search, color: Colors.white, size: 21),
                          tooltip: _tr('파일 내 단어 검색', 'Find in File', '在文件中查找', 'ファイル内検索'),
                          onPressed: _docPageCount > 0 ? () => setState(() => _findOpen = true) : null,
                        ),
                        // 엑셀은 끌어서 움직이면 되므로 뷰어 설정 없음
                        const SizedBox(width: 4),
                      ]),
                    ),
                  ),
                ),
              Expanded(
                child: AfterRouteTransition(
                  builder: (_) => UiUnscale(child: _buildDocumentViewer(isLandscape)),
                ),
              ),
              // 아래 막대: 시트 목록(둥근 탭) + 확대·축소 (앱 테마 색)
              Material(
                color: Theme.of(context).colorScheme.surfaceContainer,
                child: Container(
                  decoration: BoxDecoration(border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant.withValues(alpha: .6)))),
                  child: Row(children: [
                    Expanded(
                      child: SpreadsheetTabBar(
                        names: [for (final chapter in _chapters) chapter.title],
                        selectedIndex: _docPage,
                        onSelected: (index) => _hwpController.selectSheet(index),
                        atBottom: true,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(right: 8, left: 4),
                      child: Container(
                        height: 34,
                        decoration: ShapeDecoration(
                          shape: StadiumBorder(side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant)),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.remove, size: 18),
                            tooltip: _tr('축소', 'Zoom out', '缩小', '縮小'),
                            onPressed: _docPageCount > 0 && _sheetZoom > .25 ? () => _hwpController.zoomSheet(1 / 1.25) : null,
                          ),
                          GestureDetector(
                            onTap: _docPageCount > 0 ? () => _hwpController.resetSheetZoom() : null,
                            child: SizedBox(
                              width: 44,
                              child: Text('${(_sheetZoom * 100).round()}%', textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ),
                          ),
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.add, size: 18),
                            tooltip: _tr('확대', 'Zoom in', '放大', '拡大'),
                            onPressed: _docPageCount > 0 && _sheetZoom < 4 ? () => _hwpController.zoomSheet(1.25) : null,
                          ),
                        ]),
                      ),
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    _syncShakeListening();
    if (_isLoading) {
      return Scaffold(body: FileLoadingView(label: _tr('파일 여는 중', 'Opening file', '正在打开文件', 'ファイルを開いています')));
    }

    // 키보드(페이지 이동 창 등)가 올라올 때 화면 전체가 매 프레임 다시 그려지지 않도록 필요한 값만 구독
    final screenSize = MediaQuery.sizeOf(context);
    final bottomPadding = MediaQuery.viewPaddingOf(context).bottom;
    final bool isLandscape = screenSize.width > screenSize.height;
    if (_isSpreadsheet) return _buildSpreadsheetReader(isLandscape);
    final EpubSpread spreadSetting =
        _spreadFor(isLandscape) ? EpubSpread.always : EpubSpread.none;

    final String epubViewerKey =
        '${_activeFilePath}_${spreadSetting}_${_epubBgTheme}_${_pageModeScroll ? 'scroll' : 'page'}_$_epubViewerGeneration';
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_isOfflineDocument) _startEpubLoadWatchdog(epubViewerKey);
    });

    final bgColor = _getBgColor();
    final footerTextColor = _epubBgTheme == 'dark' ? Colors.white54 : Colors.black54;
    final footerText = _formatEpubFooterText();

    return PopScope(
      canPop: !_slideShow && !_findOpen,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _findOpen) {
          _closeFind(); // 뒤로 가기: 검색만 닫음
          return;
        }
        if (!didPop && _slideShow) {
          _endSlideShow(); // 뒤로 가기: 슬라이드 쇼만 끝냄
          return;
        }
        if (_isTouchLocked) {
          _isTouchLocked = false;
        }
      },
      child: Scaffold(
      // 페이지 이동 창의 키보드가 올라와도 뒤의 책 화면은 줄이지 않는다 (줄어드는 동안 버벅임)
      resizeToAvoidBottomInset: false,
      key: _scaffoldKey,
      backgroundColor: _slideShow ? Colors.black : bgColor,
      onDrawerChanged: (open) {
        if (!open && _tocFreeze != null) {
          // 닫히는 움직임이 끝난 뒤 실제 화면으로
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _tocFreeze = null);
          });
        }
      },
      // TXT는 목차 없음
      drawer: _isTxt ? null : Drawer(
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
                child: _outlineProgress != null
                    ? OutlineProgressView(
                        progress: _outlineProgress!,
                        label: _tr('목차 만드는 중', 'Building contents', '正在生成目录', '目次を作成中'),
                        hint: _tr('처음 한 번만 만들고, 다음부터는 바로 보여요', 'Only the first time — next time it opens instantly', '仅首次生成，下次直接显示', '初回のみ作成し、次回からはすぐ表示されます'),
                      )
                    : ListView.builder(
                  itemCount: _chapters.length,
                  itemBuilder: (context, index) {
                    final chapter = _chapters[index];
                    final int level = index < _chapterLevels.length ? _chapterLevels[index] : 1;
                    return ListTile(
                      // 제목 단계만큼 들여쓰기, 큰 제목은 굵게
                      contentPadding: EdgeInsets.only(left: 16.0 + (level - 1).clamp(0, 4) * 18.0, right: 16),
                      title: Text(
                        chapter.title.trim(),
                        style: _chapterLevels.isEmpty
                            ? null
                            : TextStyle(
                                fontSize: level <= 1 ? 15.5 : 14,
                                fontWeight: level <= 1 ? FontWeight.w700 : FontWeight.w400,
                              ),
                      ),
                      // 목차 항목이 있는 쪽 번호
                      trailing: _chapterLevels.isEmpty
                          ? null
                          : Text(
                              '${(int.tryParse(chapter.href.split(':').last) ?? 0) + 1}',
                              style: TextStyle(fontSize: 12.5, color: Theme.of(context).colorScheme.onSurfaceVariant),
                            ),
                      onTap: () {
                        Navigator.pop(context);
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
          key: _epubBodyKey,
          fit: StackFit.expand,
          children: [
            // 종이색: 화면 전체에 종이 질감
            if (_isPaperTheme)
              const Positioned.fill(
                child: IgnorePointer(
                  child: Image(image: AssetImage('assets/textures/paper.jpg'), fit: BoxFit.cover, gaplessPlayback: true),
                ),
              ),
            // 1. EPUB 뷰어 본문 (Listener를 EpubViewer에만 감싸서 우측 하단 페이지 이동 버튼 클릭 시 상단/하단 UI가 뜨지 않도록 완벽 분리!)
            Positioned.fill(
              child: Padding(
                padding: _slideShow
                    ? EdgeInsets.zero
                    : EdgeInsets.only(
                        // EPUB·TXT: 글이 상단바에 가리지 않도록 상단바 높이보다 살짝 아래에서 시작
                        top: (_isEpub || _isTxt) ? _readerTextTop : 12.0,
                        bottom: (bottomPadding > 0 ? bottomPadding : 8.0) + 20.0,
                      ),
                child: IgnorePointer(
                  key: _epubViewRectKey,
                  ignoring: _isTouchLocked || (_isMemoMode && (_isStylusDown || _allowFingerDrawing)),
                  child: Listener(
                    behavior: HitTestBehavior.translucent,
                    onPointerDown: (event) {
                      DocScrollPrep.noteUserActivity();
                      _vPageSwipe.down(event);
                      _vPeekOnDown(event);
                      _swipeTrackDown(event);
                      _handlePointerDown(event);
                    },
                    onPointerMove: (event) {
                      _vPageSwipe.move(event, enabled: _vSwipeEnabled(event), canTurn: _canTurnSwipe);
                      _vPeekOnMove();
                      _swipeTrackMove(event);
                    },
                    onPointerUp: (event) {
                      _swipeTrackUp(event);
                      final gesture = _vGestureSeq;
                      _vPageSwipe.up(
                        event,
                        height: screenSize.height,
                        canTurn: _canTurnSwipe,
                        turnPage: (dir) => _vPeekCommit(dir, gesture),
                        seamless: true,
                      ).then((_) => _vPeekFinish(gesture));
                      _handlePointerUp(event, screenSize);
                    },
                    onPointerCancel: (event) {
                      if (_tapPointers > 0) _tapPointers--;
                      if (_tapPointers == 0) {
                        _pointerDownPosition = null;
                        _pointerDownTime = null;
                      }
                      final gesture = _vGestureSeq;
                      _vPageSwipe.up(
                        event,
                        height: screenSize.height,
                        canTurn: _canTurnSwipe,
                        turnPage: (dir) => _vPeekCommit(dir, gesture),
                        seamless: true,
                        cancelled: true,
                      ).then((_) => _vPeekFinish(gesture));
                      _swipeTrackUp(event, cancelled: true);
                      if (_isStylusDown) {
                        setState(() => _isStylusDown = false);
                      }
                    },
                    child: AnimatedBuilder(
                      animation: _vPageSwipe,
                      builder: (context, child) => _vSwipeStage(child!, screenSize.height),
                      child: InteractiveViewer(
                      transformationController: _epubZoomController,
                      // 문서 스크롤 보기는 목록이 직접 확대·이동을 맡음 (겹치면 확대가 잘 안 됨)
                      panEnabled: !_isSpreadsheet && !(_pageModeScroll && _isOfflineDocument) && !_isMemoMode && _epubZoomScale > 1.03,
                      scaleEnabled: !_isSpreadsheet && !(_pageModeScroll && _isOfflineDocument) && !_isTouchLocked && (!_isMemoMode || !_allowFingerDrawing),
                      minScale: 1.0,
                      maxScale: 4.5,
                      onInteractionStart: (_) {
                        // 확대/이동 제스처가 터치를 가져가면 WebView는 스와이프를 받지 못함
                        _swipeScaleStarted = true;
                      },
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
                      child: RawGestureDetector(
                        behavior: HitTestBehavior.translucent,
                        // 빠르게 튕기는 스와이프는 WebView보다 먼저 Flutter가 받아 직접 페이지를 넘긴다.
                        // 손가락 한 개일 때만 (두 손가락이면 확대·축소가 가져가게), 스크롤 모드에서는 쓰지 않음
                        gestures: {
                          if (_swipeFlutterOwned && !_pageModeScroll)
                            _OneFingerHorizontalDrag: GestureRecognizerFactoryWithHandlers<_OneFingerHorizontalDrag>(
                              () => _OneFingerHorizontalDrag(),
                              (r) => r
                                ..onStart = _onFlickStart
                                ..onUpdate = _onFlickUpdate
                                ..onEnd = _onFlickEnd,
                            ),
                        },
                        child: AfterRouteTransition(builder: (_) => UiUnscale(child: _isOfflineDocument ? _buildDocumentViewer(isLandscape) : Stack(fit: StackFit.expand, children: [
// 목차를 여닫는 동안에는 책 화면(WebView)을 잠시 그림으로 바꿔 끊김 없이
Offstage(offstage: _tocFreeze != null, child: EpubViewer(
                          key: ValueKey(epubViewerKey),
                          epubController: _epubController,
                    epubSource: EpubSource.fromFile(File(_activeFilePath)),
                    // 프로젝트에 포함한 EPUB 뷰어(vendor)는 안드로이드에서 같은 출처의 https 주소로
                    // 장(chapter)을 필요할 때마다 파일에서 읽어 보여 준다 (책 전체를 한 번에 넘기지 않음)
                    useLocalServer: true,
                    initialCfi: _initialCfi,
                    onEpubLoaded: () {
                      if (mounted && !_epubDisplayed) setState(() => _epubDisplayed = true);
                      _epubDisplayed = true;
                      _epubController.setSwipeReversed(_isMangaRtlMode);
                      _epubController.setSwipeEnabled(_useSwipeTurn && !_pageModeScroll);
                      _epubLoadWatchdog?.cancel();
                    },
                    onLoadError: (error) => _handleEpubLoadError(error.message),
                    displaySettings: EpubDisplaySettings(
                      // 스크롤 모드: 장을 이어 붙여 세로로 / 그 외: 쪽 넘김
                      flow: _pageModeScroll ? EpubFlow.scrolled : EpubFlow.paginated,
                      snap: !_pageModeScroll,
                      spread: spreadSetting,
                      fontSize: _fontSize,
                      theme: _buildTheme(),
                    ),
                    // 글을 길게 눌러 고르면: 형광펜 칠하기 / 글자 복사(다른 파일과 같은 복사 창). 누른 뒤에는 선택 표시를 지움
                    selectionContextMenu: EpubContextMenu(
                      hideDefaultSystemItems: true,
                      items: [
                        EpubContextMenuItem(
                          id: 1,
                          title: _tr('형광펜 칠하기', 'Highlight', '荧光笔', 'マーカー'),
                          action: () {
                            if (_selectedCfiRange != null) {
                              _epubController.addHighlight(
                                cfi: _selectedCfiRange!,
                                color: Colors.amber,
                              );
                            }
                            _clearEpubSelection();
                          },
                        ),
                        EpubContextMenuItem(
                          id: 2,
                          title: _tr('글자 복사', 'Copy Text', '复制文字', '文字をコピー'),
                          action: () {
                            final text = _selectedText;
                            _clearEpubSelection();
                            if (mounted && text.trim().isNotEmpty) showTextCopySheet(context, text: text, tr: _tr);
                          },
                        ),
                      ],
                    ),
                    onChaptersLoaded: (chapters) {
                      setState(() => _chapters = chapters);
                      if (!_hasRestoredInitialPosition) {
                        _hasRestoredInitialPosition = true;
                        if (_initialCfi != null && _initialCfi!.isNotEmpty) {
                          Future.delayed(const Duration(milliseconds: 150), () {
                            _epubController.display(cfi: _initialCfi!);
                          });
                        } else if (_progress > 0.01) {
                          Future.delayed(const Duration(milliseconds: 150), () {
                            _readerProgress(_progress);
                          });
                        }
                      }
                    },
                    onTextSelected: (epubTextSelection) {
                      _selectedCfiRange = epubTextSelection.selectionCfi;
                      _selectedText = epubTextSelection.selectedText;
                      _hasTextSelection = true;
                    },
                    onDeselection: () {
                      _hasTextSelection = false;
                    },
                    onChapterEdge: (atStart, atEnd, first, last) {
                      if (!mounted) return;
                      if (atStart != _chAtStart || atEnd != _chAtEnd || first != _chFirst || last != _chLast) {
                        setState(() {
                          _chAtStart = atStart;
                          _chAtEnd = atEnd;
                          _chFirst = first;
                          _chLast = last;
                        });
                      }
                    },
                    onRelocated: (value) async {
                      if (!_epubDisplayed && mounted) setState(() => _epubDisplayed = true);
                      _hasTextSelection = false;
                      final waiter = _relocateWaiter;
                      if (waiter != null && !waiter.isCompleted) waiter.complete();
                      if (!_hasRestoredInitialPosition &&
                          _initialCfi != null &&
                          value.progress < 0.01 &&
                          _progress > 0.05) {
                        return;
                      }
                      _hasRestoredInitialPosition = true;
                      _currentCfi = value.startCfi;
                      _epubAtStart = value.atStart;
                      _epubAtEnd = value.atEnd;
                      final double clampedProg = value.progress.clamp(0.0, 1.0).toDouble();
                      final String newLocKey = _computeLocationKey(value.startCfi, clampedProg);

                      StorageService.saveLastPosition(widget.filePath, value.startCfi);
                      StorageService.saveProgress(widget.filePath, clampedProg);
                      StorageService.savePageLabel(widget.filePath, _progressPageLabel(clampedProg));

                      // 3. 페이지 이동 시 해당 페이지(CFI)에 저장된 필기만 불러와서 표시!
                      final pageStrokes = await StorageService.getEpubLocationStrokes(
                        widget.filePath,
                        newLocKey,
                      );
                      if (mounted) {
                        setState(() {
                          _epubSinglePage = _chapters.length <= 1 && value.chapterTotalPages == 1;
                          _epubLocated = true;
                          _progress = clampedProg;
                          _currentPageLocationKey = newLocKey;
                          _epubStrokes = pageStrokes;
                          _activeStrokePoints.clear();
                        });
                      }
                    },
                    )),
                          if (_tocFreeze != null)
                            Positioned.fill(child: IgnorePointer(child: Image.memory(_tocFreeze!, fit: BoxFit.fill, gaplessPlayback: true))),
                          // 처음 열 때: 돌아가는 원 + '파일 여는 중'
                          if (!_epubDisplayed)
                            Positioned.fill(
                              child: IgnorePointer(
                                child: ColoredBox(
                                  color: _getBgColor(),
                                  child: FileLoadingView(label: _tr('파일 여는 중', 'Opening file', '正在打开文件', 'ファイルを開いています'), background: _getBgColor()),
                                ),
                              ),
                            ),
                        ]))),
                      ),
                    ),
                    ),
                  ),
                ),
              ),
            ),

            // 2. S펜 전용 페이지별 필기/지우개 오버레이 (EagerStylusPanGestureRecognizer로 S펜 이동 시 화면 움직임 100% 차단 + 손가락은 페이지 스와이프)
            // 붙잡아 둔 지금 화면의 필기 (화면 그림과 함께 움직임)
            if (_vSnap != null && _vSnapStrokes.isNotEmpty)
              Positioned.fill(
                child: IgnorePointer(
                  child: AnimatedBuilder(
                    animation: _vPageSwipe,
                    builder: (context, child) => Transform.translate(offset: Offset(0, _vPageSwipe.offset), child: child),
                    child: CustomPaint(
                      painter: _EpubMemoPainter(
                        strokes: _vSnapStrokes,
                        currentPoints: const [],
                        currentColor: _penColor,
                        currentWidth: _penWidth,
                      ),
                    ),
                  ),
                ),
              ),
            if (_epubStrokes.isNotEmpty || _isMemoMode)
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: _vPageSwipe,
                  builder: (context, child) => Transform.translate(offset: Offset(0, _vWebOffset(screenSize.height)), child: child),
                  child: LayoutBuilder(
                  builder: (context, constraints) {
                    final double drawWidth = constraints.maxWidth;
                    final double drawHeight = constraints.maxHeight;
                    return StylusOnlyDrawingLayer(
                      enabled: _isMemoMode,
                      allowTouch: _allowFingerDrawing,
                      passThroughTouch: true,
                      onStylusDown: (event) {
                        if (!_isStylusDown) {
                          setState(() => _isStylusDown = true);
                        }
                        final bool useEraser =
                            _isEraserMode || event.kind == PointerDeviceKind.invertedStylus;
                        if (useEraser) {
                          _eraseStartStrokes = _epubStrokes;
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
                          _finishEraseHistory();
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
                            colorValue: _penColor.toARGB32(),
                            strokeWidth: _penWidth,
                          );
                          _memoHistory.record(locKey, _epubStrokes);
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
                        _lastEraserPos = null;
                        _finishEraseHistory();
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
              ),

            if (footerText.isNotEmpty && !_slideShow)
              Positioned(
                left: 20 + _safeSides.left,
                right: 20 + _safeSides.right,
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
            if (_isMemoMode && !_isTouchLocked) _buildMemoToolbar(bottomPadding),

            // 파일 내 단어 검색 막대
            if (_findOpen && !_isTouchLocked)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: FindInFileBar(
                  onSearch: _isTxt ? _txtController.search : _docFindSearch,
                  onGoto: _isTxt ? _txtController.showSearchResult : _docFindGoto,
                  onClose: _closeFind,
                  tr: _tr,
                ),
              ),
            // 상단 컨트롤 바
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
                            // TXT는 목차 없음
                            if (!_isTxt)
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: btnPadding,
                              constraints: btnConstraints,
                              icon: const Icon(Icons.list, color: Colors.white, size: 17),
                              tooltip: _tr('목차', 'Contents', '目录', '目次'),
                              onPressed: _openToc,
                            ),
                            // 파일 내 단어 검색 (한글·워드·PPT·TXT)
                            if (_snapEligible || _isPresentation || _isTxt)
                              IconButton(
                                visualDensity: VisualDensity.compact,
                                padding: btnPadding,
                                constraints: btnConstraints,
                                icon: const Icon(Icons.search, color: Colors.white, size: 18),
                                tooltip: _tr('파일 내 단어 검색', 'Find in File', '在文件中查找', 'ファイル内検索'),
                                onPressed: () => setState(() {
                                  _findOpen = true;
                                  _showControls = false;
                                }),
                              ),
                            // PPT에서만: 슬라이드 쇼
                            if (_isPresentation)
                              IconButton(
                                visualDensity: VisualDensity.compact,
                                padding: btnPadding,
                                constraints: btnConstraints,
                                icon: const Icon(Icons.slideshow, color: Colors.white, size: 17),
                                tooltip: _tr('슬라이드 쇼', 'Slide Show', '幻灯片放映', 'スライドショー'),
                                onPressed: _startSlideShow,
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
                                    widget.bookTitle,
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

            _buildEpubProgressBar(bottomPadding),

            if (_useQuickNavTurn && !_isTouchLocked && !_slideShow)
              _buildQuickNavButtons(bottomPadding),

            // EPUB 스크롤 보기: 장의 끝(또는 처음)에 닿으면 '이전 챕터 / 다음 챕터'
            if (_isEpub && _pageModeScroll && !_slideShow && !_isTouchLocked && (_chAtEnd || (_chAtStart && !_chFirst)))
              Positioned(
                left: 16.0 + _safeSides.left,
                right: 16.0 + _safeSides.right,
                bottom: _chapterButtonsBottom(bottomPadding),
                child: _buildChapterButtons(),
              ),

            // 도구 모음 버튼 + 활 모양 메뉴 (상단바/진행바와 함께 보였다 사라짐)
            // 평소엔 진행바 바로 위에 붙어 있고, 열리면 호가 진행바에 닿지 않을 만큼 올라간다
            // 도구 모음 '바' 형태: 화면 아래 가로 막대 (뷰어 설정 → 도구 모음 형태)
            if (_showControls && !_isTouchLocked && _toolbarStyle == 'bar')
              Positioned(
                left: 12.0 + _safeSides.left,
                right: 12.0 + _safeSides.right,
                bottom: math.max<double>(bottomPadding + 16.0, 20.0) + 8.0 +
                    ((_progressBarPos == 'bottom' || _useQuickNavTurn) ? 44.0 : 0.0) +
                    ((_isMemoMode && _memoToolbarPos == 'bottom') ? 56.0 : 0.0),
                child: Center(child: QuickToolBar(items: _buildQuickMenuItems())),
              ),
            if (_showControls && !_isTouchLocked && _toolbarStyle == 'arc')
              Positioned(
                right: _quickMenuSide == 'left' ? null : ((_progressBarPos == 'right' ? 56.0 : 12.0) + _safeSides.right + (_quickMenuBesideMemoBar ? 56.0 : 0.0)),
                left: _quickMenuSide == 'left' ? ((_progressBarPos == 'left' ? 56.0 : 12.0) + _safeSides.left + (_quickMenuBesideMemoBar ? 56.0 : 0.0)) : null,
                bottom: math.max<double>(bottomPadding + 24.0, 28.0) +
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
            // PPT 슬라이드 쇼: 맨 위에서 모든 터치를 받는다
            if (_slideShow) _buildSlideShowLayer(),
          ],
        ),
      ),
    );
  }
}

/// 손가락 한 개로 가로로 미는 동작만 받는 인식기 (두 번째 손가락이 닿으면 물러나 확대·축소가 이기게)
class _OneFingerHorizontalDrag extends HorizontalDragGestureRecognizer {
  int _down = 0;

  @override
  void addAllowedPointer(PointerDownEvent event) {
    _down++;
    if (_down > 1) {
      resolve(GestureDisposition.rejected);
      return;
    }
    super.addAllowedPointer(event);
  }

  @override
  void didStopTrackingLastPointer(int pointer) {
    _down = 0;
    super.didStopTrackingLastPointer(pointer);
  }

  @override
  void rejectGesture(int pointer) {
    _down = 0;
    super.rejectGesture(pointer);
  }
}
