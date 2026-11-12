import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import '../services/user_fonts.dart';
import '../services/storage_service.dart';
import 'viewer_dialogs.dart';
import 'text_copy_sheet.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import '../services/docx_layout_hints.dart';

/// Navigation adapter; the surrounding ReaderScreen owns the existing UI.
class HwpReaderController {
  Future<void> Function(String, List<Object?>)? _invoke;

  Future<void> display(String position) async =>
      _invoke?.call('display', [position]);
  Future<void> next() async => _invoke?.call('next', []);
  Future<void> previous() async => _invoke?.call('previous', []);
  Future<void> toProgress(double progress) async =>
      _invoke?.call('progress', [progress]);

  /// Excel navigation operates on the live worksheet, not document pages.
  Future<void> selectSheet(int index) async => _invoke?.call('selectSheet', [index]);
  Future<void> zoomSheet(double factor) async => _invoke?.call('zoomBy', [factor]);
  Future<void> resetSheetZoom() async => _invoke?.call('resetZoom', []);

  // ── 파일 내 단어 검색 ──
  Future<Object?> Function(String, List<Object?>)? _query;

  /// 찾은 곳 수 (못 찾거나 아직 열리지 않았으면 0)
  /// 마지막으로 찾은 곳들이 있는 쪽 (스크롤 보기에서 그 쪽으로 옮길 때)
  List<int> lastSearchPages = const [];

  Future<int> search(String text) async {
    final result = await _query?.call('search', [text]);
    if (result is Map) {
      final pages = result['pages'];
      lastSearchPages = pages is List ? [for (final p in pages) (p as num?)?.toInt() ?? 0] : const [];
      return (result['count'] as num?)?.toInt() ?? 0;
    }
    lastSearchPages = const [];
    return 0;
  }

  Future<void> showSearchResult(int index) async => _query?.call('showSearchResult', [index]);
  Future<void> clearSearch() async => _query?.call('clearSearch', []);

  /// PPT: 슬라이드 전체 그림(JPEG base64) — 글자가 그림으로만 된 슬라이드의 글자를 읽는 데 씀
  Future<String?> slideImage(int index, {int width = 1800}) async {
    final result = await _query?.call('slideImage', [index, width]);
    return result is String && result.isNotEmpty ? result : null;
  }

  /// 지금 보이는 쪽이 화면에서 차지하는 자리 (0~1 비율). 모르면 null
  Future<Rect?> pageRect() async {
    final r = await _query?.call('pageRect', []);
    if (r is! Map) return null;
    double v(Object? x) => (x as num?)?.toDouble() ?? 0;
    final rect = Rect.fromLTWH(v(r['x']), v(r['y']), v(r['w']), v(r['h']));
    return rect.width > 0.05 && rect.height > 0.05 ? rect : null;
  }

  /// 지금 화면에 보이는 글과 위치 [{t, x, y, w, h}] (화면 크기 대비 0~1) — 내보낸 PDF의 글자 층용
  Future<List<Map<String, Object?>>> visibleTextBoxes() async {
    final result = await _query?.call('visibleTextBoxes', []);
    if (result is! List) return const [];
    return [
      for (final b in result)
        if (b is Map) {'t': b['t'], 'x': b['x'], 'y': b['y'], 'w': b['w'], 'h': b['h']},
    ];
  }

  /// 쪽마다의 글 [from, to) — '목차' 쪽 찾기용 (지원하지 않으면 빈 목록)
  Future<List<String>> pageText(int from, int to) async {
    final result = await _query?.call('pageText', [from, to]);
    if (result is! List) return const [];
    return [for (final t in result) (t ?? '').toString()];
  }

  /// 목차 후보: 번호로 시작하거나 굵은 글씨가 있는 짧은 문단들 {title, page(0부터), bold, boldRatio, centered, fs}.
  /// 한글은 [from, to) 쪽만 (워드는 한 번에 전부)
  Future<List<Map<String, Object?>>> headingCandidates(int from, int to) async {
    final result = await _query?.call('headingCandidates', [from, to]);
    if (result is! List) return const [];
    return [
      for (final item in result)
        if (item is Map && item['page'] is num)
          {
            'title': (item['title'] ?? '').toString(),
            'page': (item['page'] as num).toInt(),
            'bold': item['bold'] == true,
            'boldRatio': (item['boldRatio'] as num?)?.toDouble() ?? 0,
            'centered': item['centered'] == true,
            'fs': (item['fs'] as num?)?.toDouble() ?? 0,
            'body': (item['body'] as num?)?.toDouble() ?? 0,
          },
    ];
  }

  /// PPT: [from, to) 슬라이드마다 줄들 {t, y, fs, bold}
  Future<List<List<Map<String, Object?>>>> slideLineData(int from, int to) async {
    final result = await _query?.call('slideLineData', [from, to]);
    if (result is! List) return const [];
    return [
      for (final slide in result)
        [
          if (slide is List)
            for (final l in slide)
              if (l is Map) {'t': (l['t'] ?? '').toString(), 'y': (l['y'] as num?)?.toDouble() ?? 0, 'fs': (l['fs'] as num?)?.toDouble() ?? 0, 'bold': l['bold'] == true},
        ],
    ];
  }
}

class HwpViewer extends StatefulWidget {
  final String filePath;
  final HwpReaderController controller;
  final String? initialPosition;
  final double initialProgress;
  final String theme;
  final bool spread;
  final bool rtl;
  final ValueChanged<int> onLoaded;
  final void Function(int page, int pageCount, String position, double progress)
  onLocation;
  final ValueChanged<String> onError;
  final VoidCallback onCancelled;
  /// 쪽 안의 그림까지 다 그려졌을 때 (워드·한글)
  final ValueChanged<int>? onPageReady;
  /// 파워포인트: 지금 슬라이드에서 남은 애니메이션 단계 수 (위치가 바뀔 때마다)
  final ValueChanged<int>? onStepsLeft;
  final ValueChanged<List<String>>? onSheetNames;

  const HwpViewer({
    super.key,
    required this.filePath,
    required this.controller,
    this.initialPosition,
    this.initialProgress = 0,
    required this.theme,
    required this.spread,
    required this.rtl,
    required this.onLoaded,
    required this.onLocation,
    required this.onError,
    required this.onCancelled,
    this.onPageReady,
    this.onStepsLeft,
    this.onSheetNames,
  });

  @override
  State<HwpViewer> createState() => _HwpViewerState();
}

class _HwpViewerState extends State<HwpViewer> {
  static const _origin = 'https://appassets.androidplatform.net';
  bool get _isDocx => widget.filePath.toLowerCase().endsWith('.docx');
  bool get _isDoc => widget.filePath.toLowerCase().endsWith('.doc');
  bool get _isWord => _isDocx || _isDoc;
  // 파워포인트(.ppt/.pptx)도 같은 문서 화면에서 연다
  bool get _isPresentation => RegExp(r'\.pptx?$', caseSensitive: false).hasMatch(widget.filePath);
  bool get _isSpreadsheet => RegExp(r'\.xls[xm]?$', caseSensitive: false).hasMatch(widget.filePath);
  String get _spreadsheetFormat => widget.filePath.split('.').last.toLowerCase();
  String get _presentationFormat => widget.filePath.toLowerCase().endsWith('.pptx') ? 'pptx' : 'ppt';
  String get _format => _isSpreadsheet ? _spreadsheetFormat.toUpperCase() : _isPresentation ? _presentationFormat.toUpperCase() : _isDocx
      ? 'DOCX'
      : _isDoc
      ? 'DOC'
      : 'HWP';
  String get _entry =>
      '$_origin/assets/flutter_assets/assets/${_isSpreadsheet ? 'xlsx' : _isPresentation ? 'ppt' : _isWord ? 'docx' : 'hwp'}/index.html';
  /// 표시 파일을 못 불러왔을 때: 앱 안에 그 파일이 아예 없으면(빌드에 빠짐) 무엇이 빠졌는지 알려 준다
  Future<void> _reportMissingAsset(String url, String description) async {
    // 없어도 되는 글꼴(같은 폭 무료 글꼴·사용자 글꼴)은 못 불러와도 기본 글꼴로 계속 보여 줌
    if (url.contains('/fonts/metric/') || url.contains('/fonts/free/') || url.contains('/userfonts/')) return;
    final marker = '$_origin/assets/flutter_assets/';
    if (url.startsWith(marker)) {
      final asset = Uri.decodeComponent(url.substring(marker.length).split('?').first);
      try {
        await rootBundle.load(asset);
      } catch (_) {
        final folder = asset.contains('/') ? asset.substring(0, asset.lastIndexOf('/')) : asset;
        _reportError('앱 안에 표시 파일($asset)이 없습니다. GitHub에 $folder 폴더가 올라가 있는지, '
            'pubspec.yaml이 새 버전인지 확인한 뒤 다시 빌드해 주세요.');
        return;
      }
    }
    _reportError('문서 표시 파일을 불러오지 못했습니다: $description');
  }

  String get _jsObject => _isSpreadsheet ? 'freaderXlsx' : _isPresentation ? 'freaderPpt' : _isWord ? 'freaderDocx' : 'freaderHwp';
  Map<String, Object> _docxLayout = {};
  static const _maxBytes = 256 * 1024 * 1024;
  static const _chunkBytes = 192 * 1024;
  InAppWebViewController? _web;
  RandomAccessFile? _file;
  Timer? _timeout;
  bool _started = false;
  bool _loaded = false;
  bool _failed = false;
  bool _passwordOpen = false;
  bool _disposed = false;
  int _generation = 0;

  Map<String, Object?> get _options => {
    'theme': widget.theme,
    'spread': widget.spread,
    'rtl': widget.rtl,
    'position': widget.initialPosition,
    'progress': widget.initialProgress,
    if (_isWord) 'format': _isDoc ? 'doc' : 'docx',
    if (_isPresentation) 'format': _presentationFormat,
    if (_isSpreadsheet) 'format': _spreadsheetFormat,
    if (_isDocx) 'docxLayout': _docxLayout,
    if (_cacheKey != null) 'cacheKey': _cacheKey,
    if (_userFonts.isNotEmpty) 'userFonts': _userFonts,
  };
  /// 사용자가 넣은 글꼴 (같은 이름의 글꼴 대신 씀)
  List<Map<String, Object>> _userFonts = const [];
  /// 처음 열 때 파일을 넘기는 진행률 (0~1)
  final ValueNotifier<double?> _loadProgress = ValueNotifier<double?>(0);
  /// 파일이 바뀌면 달라지는 열쇠 (변환된 그림 저장소 이름에 사용)
  String? _cacheKey;

  @override
  void initState() {
    super.initState();
    widget.controller._invoke = _navigate;
    widget.controller._query = _ask;
    _armTimeout();
  }

  void _armTimeout() {
    _timeout?.cancel();
    _timeout = Timer(const Duration(minutes: 5), () {
      _reportError(
        '$_format 문서 표시 시간이 초과되었습니다. Android System WebView와 파일 상태를 확인해 주세요.',
      );
    });
  }

  void _reportError(Object error) {
    if (_disposed || _failed || !mounted) return;
    _failed = true;
    _timeout?.cancel();
    unawaited(_closeFile());
    widget.onError(error.toString());
  }

  Future<void> _closeFile() async {
    final file = _file;
    _file = null;
    if (file != null) {
      try {
        await file.close();
      } catch (_) {
        /* A pending read can finish while closing. */
      }
    }
  }

  Future<void> _invoke(String method, List<Object?> args) async {
    if (_disposed || _failed || _web == null) return;
    try {
      final result = await _web!.callAsyncJavaScript(
        functionBody: 'return await window[viewer][method](...args);',
        arguments: {'viewer': _jsObject, 'method': method, 'args': args},
      );
      if (result?.error != null) throw StateError(result!.error!);
    } catch (error) {
      _reportError(error);
    }
  }

  /// 결과를 돌려받는 호출 (검색). 실패해도 문서 오류로 띄우지 않는다.
  Future<Object?> _ask(String method, List<Object?> args) async {
    if (_disposed || _failed || _web == null || !_loaded) return null;
    try {
      final result = await _web!.callAsyncJavaScript(
        functionBody: 'return await window[viewer][method](...args);',
        arguments: {'viewer': _jsObject, 'method': method, 'args': args},
      );
      return result?.error == null ? result?.value : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> _navigate(String method, List<Object?> args) async {
    // Hardware keys and the existing toolbar can be used during initialization.
    if (!_loaded) return;
    await _invoke(method, args);
  }

  Future<void> _transferDocument() async {
    if (_started || _disposed || _failed) return;
    _started = true;
    final generation = ++_generation;
    try {
      final source = File(widget.filePath);
      final length = await source.length();
      try {
        final modified = (await source.lastModified()).millisecondsSinceEpoch;
        _cacheKey = '${widget.filePath.hashCode.toUnsigned(32)}-$length-$modified';
      } catch (_) {}
      if (length < 1 || length > _maxBytes) {
        throw const FormatException('비어 있거나 256MB를 초과하는 문서입니다.');
      }
      if (_isDocx) {
        final path = widget.filePath;
        _docxLayout = await Isolate.run(() => DocxLayoutHints.readLayout(path));
      }
      try {
        _userFonts = await UserFonts.forViewer();
      } catch (_) {}
      if (_disposed || !mounted) return;
      await _invoke('beginDocument', [length, _options]);
      if (_failed || _disposed) return;
      final opened = await source.open();
      if (_disposed) {
        await opened.close();
        return;
      }
      _file = opened;
      var offset = 0;
      while (offset < length &&
          !_disposed &&
          !_failed &&
          generation == _generation) {
        final chunk = await opened.read(_chunkBytes);
        if (chunk.isEmpty)
          throw const FormatException('문서를 읽는 중 파일 크기가 변경되었습니다.');
        await _invoke('appendChunk', [offset, base64Encode(chunk)]);
        offset += chunk.length;
        _loadProgress.value = 0.9 * offset / length;
        _armTimeout();
      }
      await _closeFile();
      if (!_disposed && !_failed && generation == _generation)
        await _invoke('openDocument', [null]);
    } catch (error) {
      _reportError(error);
    } finally {
      await _closeFile();
    }
  }

  void _event(List<dynamic> args) {
    if (_disposed || _failed || !mounted || args.isEmpty || args.first is! Map)
      return;
    final event = Map<String, dynamic>.from(args.first as Map);
    switch (event['type']) {
      case 'ready':
        unawaited(_transferDocument());
        break;
      // 엑셀: 칸을 길게 눌러 고른 뒤 손을 떼면 그 글을 복사 창으로
      case 'haptic':
        HapticFeedback.selectionClick();
        break;
      case 'copyText':
        final text = (event['text'] ?? '').toString();
        if (text.trim().isNotEmpty) unawaited(showTextCopySheet(context, text: text, tr: _tr));
        break;
      case 'loaded':
        setState(() => _loaded = true);
        _timeout?.cancel();
        unawaited(_invoke('configure', [_options]));
        widget.onLoaded((event['pageCount'] as num).toInt());
        if (_isSpreadsheet && event['chapters'] is List) {
          widget.onSheetNames?.call([for (final name in event['chapters'] as List) name.toString()]);
        }
        break;
      case 'location':
        if (!_loaded) return;
        final stepCount = event['stepCount'], step = event['step'];
        if (stepCount is num) widget.onStepsLeft?.call((stepCount - (step is num ? step : 0)).toInt());
        widget.onLocation(
          (event['page'] as num).toInt(),
          (event['pageCount'] as num).toInt(),
          event['position'] as String,
          (event['progress'] as num).toDouble(),
        );
        break;
      case 'pageReady':
        if (_loaded) widget.onPageReady?.call((event['page'] as num?)?.toInt() ?? -1);
        break;
      case 'password':
        unawaited(_requestPassword(event['incorrect'] == true));
        break;
      case 'error':
        _reportError(event['message'] ?? '$_format 문서를 표시하지 못했습니다.');
        break;
    }
  }

  Future<void> _requestPassword(bool incorrect) async {
    if (_passwordOpen || _disposed || !mounted) return;
    _passwordOpen = true;
    _timeout?.cancel();
    final input = TextEditingController();
    final password = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('문서 비밀번호'),
        content: TextField(
          controller: input,
          obscureText: true,
          autofocus: true,
          autocorrect: false,
          enableSuggestions: false,
          decoration: InputDecoration(
            labelText: '비밀번호',
            errorText: incorrect ? '비밀번호가 일치하지 않습니다.' : null,
          ),
          onSubmitted: (value) => Navigator.pop(context, value),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, input.text),
            child: const Text('열기'),
          ),
        ],
      ),
    );
    // Allow the closing dialog animation to release its TextField first.
    Future<void>.delayed(const Duration(milliseconds: 350), input.dispose);
    _passwordOpen = false;
    if (_disposed || !mounted) return;
    if (password == null) {
      widget.onCancelled();
      return;
    }
    _armTimeout();
    await _invoke('openDocument', [password]);
  }

  @override
  void didUpdateWidget(covariant HwpViewer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller._invoke = null;
      oldWidget.controller._query = null;
      widget.controller._invoke = _navigate;
    widget.controller._query = _ask;
    }
    if (_loaded &&
        (oldWidget.theme != widget.theme ||
            oldWidget.spread != widget.spread ||
            oldWidget.rtl != widget.rtl)) {
      unawaited(_invoke('configure', [_options]));
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    _timeout?.cancel();
    widget.controller._invoke = null;
    widget.controller._query = null;
    unawaited(_closeFile());
    // The platform view owns its controller and releases the WASM heap on close.
    _web = null;
    super.dispose();
  }

  String _tr(String ko, String en, String zh, String ja) =>
      AppI18n.t(StorageService.appLangNotifier.value, ko: ko, en: en, zh: zh, ja: ja);

  Future<void> _clearSelection() async {
    try {
      await _web?.evaluateJavascript(source: 'try{window.getSelection().removeAllRanges()}catch(e){}');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        InAppWebView(
          // Excel owns two-dimensional pan and pinch; the outer reader still owns its toolbar.
          // 한글·워드: 글을 길게 누르면 문서 화면이 바로 받아 글을 고를 수 있게 (EPUB과 같은 방식)
          gestureRecognizers: _isSpreadsheet
              ? {Factory<OneSequenceGestureRecognizer>(() => EagerGestureRecognizer())}
              : {Factory<LongPressGestureRecognizer>(() => LongPressGestureRecognizer(duration: const Duration(milliseconds: 350)))},
          initialUrlRequest: URLRequest(url: WebUri(_entry)),
          initialSettings: InAppWebViewSettings(
            javaScriptEnabled: true,
            transparentBackground: true,
            supportZoom: false,
            // Android consumes ACTION_MOVE when both flags are true. That
            // prevents the canvas from receiving either drag or pinch events.
            // Excel controls its own viewport; CSS prevents page scrolling.
            disableHorizontalScroll: !_isSpreadsheet,
            disableVerticalScroll: !_isSpreadsheet,
            horizontalScrollBarEnabled: false,
            verticalScrollBarEnabled: false,
            allowFileAccess: false,
            allowContentAccess: false,
            javaScriptHandlersForMainFrameOnly: true,
            javaScriptHandlersOriginAllowList: {_origin},
            useShouldOverrideUrlLoading: true,
            webViewAssetLoader: WebViewAssetLoader(
              pathHandlers: [
                AssetsPathHandler(path: '/assets/'),
                if (UserFonts.cachedDirPath != null)
                  InternalStoragePathHandler(path: UserFonts.urlPath, directory: UserFonts.cachedDirPath!),
              ],
            ),
          ),
          // 글을 길게 눌러 고르면 EPUB과 같은 메뉴: 형광펜 칠하기 / 글자 복사(복사 창). 누른 뒤 선택 표시는 지움
          contextMenu: ContextMenu(
            settings: ContextMenuSettings(hideDefaultSystemContextMenuItems: true),
            menuItems: [
              ContextMenuItem(
                id: 1,
                title: _tr('형광펜 칠하기', 'Highlight', '荧光笔', 'マーカー'),
                action: () async {
                  await _invoke('highlightSelection', []);
                  await _clearSelection();
                },
              ),
              ContextMenuItem(
                id: 2,
                title: _tr('글자 복사', 'Copy Text', '复制文字', '文字をコピー'),
                action: () async {
                  String text = '';
                  try {
                    final r = await _web?.evaluateJavascript(source: 'String(window.getSelection ? window.getSelection().toString() : "")');
                    text = r is String ? r : '';
                  } catch (_) {}
                  await _clearSelection();
                  if (mounted && text.trim().isNotEmpty) await showTextCopySheet(context, text: text, tr: _tr);
                },
              ),
            ],
          ),
          onWebViewCreated: (controller) {
            _web = controller;
            controller.addJavaScriptHandler(
              handlerName: _jsObject,
              callback: (args) {
                _event(args);
                return null;
              },
            );
          },
          onLoadStop: (controller, url) async {
            // Recover a missed platform-ready event without re-opening a document.
            try {
              final ready = await controller.evaluateJavascript(
                source: 'window.$_jsObject?.getState().ready === true',
              );
              if (ready == true) unawaited(_transferDocument());
            } catch (error) {
              _reportError(error);
            }
          },
          shouldOverrideUrlLoading: (controller, action) async =>
              action.request.url?.toString() == _entry
              ? NavigationActionPolicy.ALLOW
              : NavigationActionPolicy.CANCEL,
          onReceivedError: (controller, request, error) {
            if (request.isForMainFrame == true ||
                request.url.toString().startsWith('$_origin/assets/')) {
              unawaited(_reportMissingAsset(request.url.toString(), error.description));
            }
          },
          onReceivedHttpError: (controller, request, response) {
            if ((response.statusCode ?? 0) >= 400)
              _reportError('문서 표시 파일 오류 (${response.statusCode})');
          },
          onRenderProcessGone: (controller, detail) async {
            _reportError('문서 표시 프로세스가 종료되었습니다. 문서를 다시 열어 주세요.');
          },
        ),
        // 처음 열 때: 돌아가는 원 + '파일 여는 중 n%' (파일을 넘기는 동안 진행률)
        if (!_loaded)
          ValueListenableBuilder<double?>(
            valueListenable: _loadProgress,
            builder: (context, p, _) => FileLoadingView(label: AppI18n.t(StorageService.appLangNotifier.value, ko: '파일 여는 중', en: 'Opening file', zh: '正在打开文件', ja: 'ファイルを開いています'), progress: p, background: widget.theme == 'dark' ? const Color(0xFF1E1E1E) : Colors.white),
          ),
      ],
    );
  }
}
