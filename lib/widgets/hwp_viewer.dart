import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'package:flutter/material.dart';
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
  });

  @override
  State<HwpViewer> createState() => _HwpViewerState();
}

class _HwpViewerState extends State<HwpViewer> {
  static const _origin = 'https://appassets.androidplatform.net';
  bool get _isDocx => widget.filePath.toLowerCase().endsWith('.docx');
  String get _format => _isDocx ? 'DOCX' : 'HWP';
  String get _entry =>
      '$_origin/assets/flutter_assets/assets/${_isDocx ? 'docx' : 'hwp'}/index.html';
  String get _jsObject => _isDocx ? 'freaderDocx' : 'freaderHwp';
  List<Map<String, Object>> _pageBreaks = [];
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
    if (_isDocx) 'pageBreaks': _pageBreaks,
  };

  @override
  void initState() {
    super.initState();
    widget.controller._invoke = _navigate;
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
      if (length < 1 || length > _maxBytes) {
        throw const FormatException('비어 있거나 256MB를 초과하는 문서입니다.');
      }
      if (_isDocx) {
        final path = widget.filePath;
        _pageBreaks = await Isolate.run(() => DocxLayoutHints.read(path));
      }
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
      case 'loaded':
        setState(() => _loaded = true);
        _timeout?.cancel();
        unawaited(_invoke('configure', [_options]));
        widget.onLoaded((event['pageCount'] as num).toInt());
        break;
      case 'location':
        if (!_loaded) return;
        widget.onLocation(
          (event['page'] as num).toInt(),
          (event['pageCount'] as num).toInt(),
          event['position'] as String,
          (event['progress'] as num).toDouble(),
        );
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
      widget.controller._invoke = _navigate;
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
    unawaited(_closeFile());
    // The platform view owns its controller and releases the WASM heap on close.
    _web = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(_entry)),
          initialSettings: InAppWebViewSettings(
            javaScriptEnabled: true,
            transparentBackground: true,
            supportZoom: false,
            disableHorizontalScroll: true,
            disableVerticalScroll: true,
            horizontalScrollBarEnabled: false,
            verticalScrollBarEnabled: false,
            allowFileAccess: false,
            allowContentAccess: false,
            javaScriptHandlersForMainFrameOnly: true,
            javaScriptHandlersOriginAllowList: {_origin},
            useShouldOverrideUrlLoading: true,
            webViewAssetLoader: WebViewAssetLoader(
              pathHandlers: [AssetsPathHandler(path: '/assets/')],
            ),
          ),
          contextMenu: ContextMenu(
            menuItems: [
              ContextMenuItem(
                id: 1,
                title: '형광펜 칠하기',
                action: () => _invoke('highlightSelection', []),
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
              _reportError('문서 표시 파일을 불러오지 못했습니다: ${error.description}');
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
        if (!_loaded) const Center(child: CircularProgressIndicator()),
      ],
    );
  }
}
