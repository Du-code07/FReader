import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import 'app_messenger.dart';
import 'docx_layout_hints.dart';
import 'storage_service.dart';
import 'page_snapshot_service.dart';
import 'user_fonts.dart';

/// 스크롤 보기용 쪽 그림 묶음 (쪽마다 그림 파일 + 높이/너비)
class ScrollPageSet {
  ScrollPageSet(this.files, this.aspects, this.theme);
  final List<File> files;
  final List<double> aspects;
  final String theme;
}

/// 한글·워드 문서의 스크롤 보기 준비.
/// 화면에 보이지 않는 별도 문서 화면(WebView)에서 쪽을 하나씩 그려 그림으로 저장한다.
/// 보고 있는 화면(쪽 넘김 보기)은 건드리지 않으므로, 파일을 연 뒤 다른 쪽·다른 화면을 보는 동안에도
/// 뒤에서 계속 진행되고, 한 번 만든 그림은 다음부터 바로 쓴다.
class DocScrollPrep {
  static const MethodChannel _native = MethodChannel('ebook_reader/pdf_renderer');
  static const _origin = 'https://appassets.androidplatform.net';
  static const _chunkBytes = 192 * 1024;
  static const int _maxBytes = 128 * 1024 * 1024;

  /// 준비 상태가 바뀔 때마다 늘어남 (화면이 다시 그려 보도록)
  static final ValueNotifier<int> changed = ValueNotifier<int>(0);

  static final Map<String, double> _progress = {};
  static final Set<String> _failed = {};
  static final List<_Job> _queue = [];
  static final List<_Job> _running = [];
  static int _seq = 0;
  // 동시에 준비하는 파일 수 (그 이상은 줄 서서 기다림)
  static const int _maxParallel = 2;
  static bool _askedNotify = false;

  /// 그림 너비(px)를 정함: 화면 너비 기준, 너무 크면 줄임
  static double renderWidth(double logicalWidth) => math.min(logicalWidth, 900).toDouble();

  /// 사용자가 스크롤 보기를 기다리는 중이면 쉬지 않고, 아니면(쪽 넘김으로 읽는 중) 틈틈이 쉬어 가며
  static bool urgent = false;
  static DateTime _lastTouch = DateTime.fromMillisecondsSinceEpoch(0);

  /// 화면을 만지는 동안에는 잠시 멈춰 보던 화면이 버벅이지 않게
  static void noteUserActivity() => _lastTouch = DateTime.now();

  static Future<void> _breathe() async {
    if (urgent) {
      await Future<void>.delayed(const Duration(milliseconds: 30));
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 500));
    while (!urgent && DateTime.now().difference(_lastTouch).inMilliseconds < 1500) {
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
  }

  static String _key(String path, String theme, int widthPx) => '$path|$theme|$widthPx';

  /// 0~1 (아직 시작 전이면 0, 모르는 일이면 null)
  static double? progressOf(String path, String theme, int widthPx) => _progress[_key(path, theme, widthPx)];

  static bool failed(String path, String theme, int widthPx) => _failed.contains(_key(path, theme, widthPx));

  static Future<Directory?> _dir(String path, String theme, int widthPx) async {
    final base = await PageSnapshotService.documentDir(path);
    if (base == null) return null;
    final d = Directory('${base.path}/scroll6_${widthPx}_$theme');
    if (!d.existsSync()) d.createSync(recursive: true);
    return d;
  }

  static Map<String, dynamic> _readMeta(Directory d) {
    try {
      final f = File('${d.path}/meta.json');
      if (f.existsSync()) return jsonDecode(f.readAsStringSync()) as Map<String, dynamic>;
    } catch (_) {}
    return {};
  }

  /// 모든 쪽이 준비되어 있으면 그 묶음, 아니면 null.
  /// [pageCount]를 모르면(0) 저장해 둔 쪽 수로 (파일을 다 읽기 전에 스크롤 보기를 바로 띄울 때)
  static Future<ScrollPageSet?> load(String path, String theme, int widthPx, int pageCount) async {
    final d = await _dir(path, theme, widthPx);
    if (d == null) return null;
    final meta = _readMeta(d);
    if (pageCount <= 0) pageCount = (meta['n'] as num?)?.toInt() ?? 0;
    if (pageCount <= 0) return null;
    final files = <File>[];
    final aspects = <double>[];
    for (int i = 0; i < pageCount; i++) {
      final a = meta['$i'];
      final f = File('${d.path}/p$i.jpg');
      if (a is! num || !f.existsSync()) return null;
      files.add(f);
      aspects.add(a.toDouble());
    }
    return ScrollPageSet(files, aspects, theme);
  }

  /// 준비 요청 (이미 다 되어 있거나 진행 중이면 아무것도 안 함). 가장 최근 요청부터 처리
  static void request({
    required String path,
    required String theme,
    required int widthPx,
    required double logicalWidth,
    required int pageCount,
  }) {
    final key = _key(path, theme, widthPx);
    if (_running.any((j) => j.key == key) || _queue.any((j) => j.key == key)) return;
    _failed.remove(key);
    _progress[key] = _progress[key] ?? 0;
    _queue.insert(0, _Job(key, path, theme, widthPx, logicalWidth, pageCount));
    // 준비가 끝나면 상태 표시줄로 알려 주므로, 처음 한 번 알림 허용을 물음 (안드로이드 13 이상)
    if (!_askedNotify) {
      _askedNotify = true;
      _native.invokeMethod('requestNotificationPermission').catchError((_) => null);
    }
    // 같은 파일의 다른 너비(회전 전) 요청은 뒤로 미룸
    _pump();
  }

  static void _pump() {
    while (_running.length < _maxParallel && _queue.isNotEmpty) {
      _start(_queue.removeAt(0));
    }
  }

  static void _start(_Job job) {
    _running.add(job);
    job.tag = 'j${++_seq}x';
    () async {
      bool ok = false;
      try {
        ok = await _run(job);
      } catch (_) {
        ok = false;
      }
      if (!ok) _failed.add(job.key);
      // 뒤에서 새로 준비를 마쳤으면 알림 (이미 다 되어 있던 파일은 알리지 않음)
      if (ok && job.rendered > 0) {
        final name = job.path.split('/').last;
        final lang = StorageService.appLangNotifier.value;
        final title = AppI18n.t(lang, ko: '스크롤 보기 준비 완료', en: 'Scroll view ready', zh: '滚动视图已准备好', ja: 'スクロール表示の準備完了');
        // 휴대폰 상태 표시줄 알림. 알림을 쓸 수 없으면(허용 안 함 등) 앱 안 알림으로
        bool shown = false;
        try {
          shown = await _native.invokeMethod<bool>('showNotification', {
                'title': title,
                'text': name,
                'id': 7000 + (job.path.hashCode & 0x3FFF),
              }) ??
              false;
        } catch (_) {}
        if (!shown) showAppNotice('$title · $name');
      }
      _running.remove(job);
      changed.value++;
      _pump();
    }();
  }

  static Future<bool> _run(_Job job) async {
    final dir = await _dir(job.path, job.theme, job.widthPx);
    if (dir == null) return false;
    final meta = _readMeta(dir);
    final todo = [for (int i = 0; i < job.pageCount; i++) if (meta['$i'] is! num || !File('${dir.path}/p$i.jpg').existsSync()) i];
    void report(int done) {
      _progress[job.key] = job.pageCount <= 0 ? 1 : done / job.pageCount;
      changed.value++;
    }

    report(job.pageCount - todo.length);
    if (todo.isEmpty) return true;

    final lower = job.path.toLowerCase();
    final bool isDocx = lower.endsWith('.docx');
    final bool isDoc = lower.endsWith('.doc');
    final bool isWord = isDocx || isDoc;
    final bool isPpt = lower.endsWith('.pptx') || lower.endsWith('.ppt');
    final String prefix = isDocx ? 'docx' : isDoc ? 'doc' : isPpt ? (lower.endsWith('.ppt') ? 'ppt' : 'pptx') : 'hwp';
    // 주소 끝 표시로 앱(안드로이드)이 이 숨은 화면을 찾아 바로 그림으로 찍음
    final String folder = isWord ? 'docx' : isPpt ? 'ppt' : 'hwp';
    final String entry = '$_origin/assets/flutter_assets/assets/$folder/index.html?freaderScroll=1&freaderTag=${job.tag}';
    final String jsObject = isWord ? 'freaderDocx' : isPpt ? 'freaderPpt' : 'freaderHwp';

    final source = File(job.path);
    final int length = await source.length();
    if (length < 1 || length > _maxBytes) return false;
    Map<String, Object> docxLayout = {};
    if (isDocx) {
      try {
        final p = job.path;
        docxLayout = await Isolate.run(() => DocxLayoutHints.readLayout(p));
      } catch (_) {}
    }
    List<Map<String, Object>> userFonts = const [];
    try {
      userFonts = await UserFonts.forViewer();
    } catch (_) {}
    String? cacheKey;
    try {
      cacheKey = '${job.path.hashCode.toUnsigned(32)}-$length-${(await source.lastModified()).millisecondsSinceEpoch}';
    } catch (_) {}
    final options = <String, Object?>{
      'theme': job.theme,
      'spread': false,
      'rtl': false,
      'position': '$prefix:${todo.first}',
      'progress': 0.0,
      if (isWord) 'format': isDoc ? 'doc' : 'docx',
      if (isPpt) 'format': prefix,
      if (isDocx) 'docxLayout': docxLayout,
      if (cacheKey != null) 'cacheKey': cacheKey,
      if (userFonts.isNotEmpty) 'userFonts': userFonts,
    };

    InAppWebViewController? web;
    bool started = false;
    final loaded = Completer<int>();
    int lastReady = -1;
    Completer<void>? readyWaiter;

    Future<Object?> call(String method, List<Object?> args) async {
      final r = await web!.callAsyncJavaScript(
        functionBody: 'return await window[viewer][method](...args);',
        arguments: {'viewer': jsObject, 'method': method, 'args': args},
      );
      if (r?.error != null) throw StateError(r!.error!);
      return r?.value;
    }

    Future<void> transfer() async {
      if (started || web == null) return;
      started = true;
      try {
        await call('beginDocument', [length, options]);
        final raf = await source.open();
        try {
          var offset = 0;
          while (offset < length && !loaded.isCompleted) {
            final chunk = await raf.read(_chunkBytes);
            if (chunk.isEmpty) throw const FormatException('file changed');
            await call('appendChunk', [offset, base64Encode(chunk)]);
            offset += chunk.length;
          }
        } finally {
          await raf.close();
        }
        if (!loaded.isCompleted) await call('openDocument', [null]);
      } catch (_) {
        if (!loaded.isCompleted) loaded.complete(-1);
      }
    }

    final double w = job.logicalWidth;
    final headless = HeadlessInAppWebView(
      initialUrlRequest: URLRequest(url: WebUri(entry)),
      // 쪽이 너비에 꽉 차게 그려지도록 세로를 넉넉히 (A4 등)
      initialSize: Size(w, (w * 1.5).roundToDouble()),
      initialSettings: InAppWebViewSettings(
        javaScriptEnabled: true,
        transparentBackground: false,
        supportZoom: false,
        disableHorizontalScroll: true,
        disableVerticalScroll: true,
        allowFileAccess: false,
        allowContentAccess: false,
        javaScriptHandlersForMainFrameOnly: true,
        javaScriptHandlersOriginAllowList: {_origin},
        useShouldOverrideUrlLoading: true,
        webViewAssetLoader: WebViewAssetLoader(pathHandlers: [
          AssetsPathHandler(path: '/assets/'),
          if (UserFonts.cachedDirPath != null)
            InternalStoragePathHandler(path: UserFonts.urlPath, directory: UserFonts.cachedDirPath!),
        ]),
      ),
      onWebViewCreated: (controller) {
        web = controller;
        controller.addJavaScriptHandler(
          handlerName: jsObject,
          callback: (args) {
            if (args.isEmpty || args.first is! Map) return null;
            final event = Map<String, dynamic>.from(args.first as Map);
            switch (event['type']) {
              case 'ready':
                unawaited(transfer());
                break;
              case 'loaded':
                if (!loaded.isCompleted) loaded.complete((event['pageCount'] as num?)?.toInt() ?? 0);
                break;
              case 'pageReady':
                lastReady = (event['page'] as num?)?.toInt() ?? -1;
                final c = readyWaiter;
                if (c != null && !c.isCompleted) c.complete();
                break;
              case 'password':
              case 'error':
                if (!loaded.isCompleted) loaded.complete(-1);
                break;
            }
            return null;
          },
        );
      },
      onLoadStop: (controller, url) async {
        try {
          final ready = await controller.evaluateJavascript(source: 'window.$jsObject?.getState().ready === true');
          if (ready == true) unawaited(transfer());
        } catch (_) {}
      },
      shouldOverrideUrlLoading: (controller, action) async =>
          action.request.url?.toString() == entry ? NavigationActionPolicy.ALLOW : NavigationActionPolicy.CANCEL,
      onReceivedError: (controller, request, error) {
        if (request.isForMainFrame == true && !loaded.isCompleted) loaded.complete(-1);
      },
      onRenderProcessGone: (controller, detail) async {
        if (!loaded.isCompleted) loaded.complete(-1);
      },
    );

    final int paper = job.theme == 'dark' ? 0xFF1E1E1E : 0xFFFFFFFF;
    try {
      await headless.run();
      // 안드로이드: 숨김 WebView는 그리기를 멈추므로 투명·화면 밖 상태로 '보이게' 둠
      try {
        await _native.invokeMethod('wakeHiddenWebViews');
      } catch (_) {}
      final count = await loaded.future.timeout(const Duration(minutes: 3), onTimeout: () => -1);
      if (count != job.pageCount) return false;
      int done = job.pageCount - todo.length;
      meta['n'] = job.pageCount;
      for (final i in todo) {
        await _breathe();
        // PPT: 슬라이드를 바로 그림으로 그려 받음 (화면 찍기 없이)
        if (isPpt) {
          final b64 = await call('slideImage', [i, (w * 2.5).round().clamp(900, 2400)]);
          if (b64 is! String || b64.isEmpty) return false;
          final bytes = base64Decode(b64);
          final out = File('${dir.path}/p$i.jpg');
          await out.writeAsBytes(bytes, flush: true);
          final img = await decodeImageFromList(bytes);
          meta['$i'] = img.width <= 0 ? 0.5625 : img.height / img.width;
          img.dispose();
          try {
            File('${dir.path}/meta.json').writeAsStringSync(jsonEncode(meta));
          } catch (_) {}
          try {
            PaintingBinding.instance.imageCache.evict(FileImage(out));
          } catch (_) {}
          job.rendered++;
          report(++done);
          continue;
        }
        // 이 쪽을 그리고, 그림까지 다 채워지면 찍음
        if (lastReady != i) {
          readyWaiter = Completer<void>();
          await call('display', ['$prefix:$i']);
          if (lastReady != i) {
            await readyWaiter.future.timeout(const Duration(seconds: 6), onTimeout: () {});
          }
        }
        await Future<void>.delayed(const Duration(milliseconds: 120));
        Map? rect;
        try {
          final r = await call('pageRect', []);
          if (r is Map) rect = r;
        } catch (_) {}
        double v(Object? x) => (x as num?)?.toDouble() ?? 0;
        final out = File('${dir.path}/p$i.jpg');
        final args = {
          'output': out.path,
          if (rect != null && v(rect['w']) > 0.05 && v(rect['h']) > 0.05) 'crop': [v(rect['x']), v(rect['y']), v(rect['w']), v(rect['h'])],
          'paper': paper,
          'pad': 0.035,
          // 위 여백은 그대로 (쪽 넘김 보기와 같은 자리에서 글이 시작), 아래 빈 종이만 걷음
          'trimTop': false,
          'tag': job.tag,
        };
        List<Object?>? size;
        try {
          size = await _native.invokeMethod<List<Object?>>('captureScrollPage', args);
        } catch (_) {
          // 바로 찍기가 안 되는 기기: 화면 찍기 → 자르기
          final shot = await web?.takeScreenshot(
            screenshotConfiguration: ScreenshotConfiguration(compressFormat: CompressFormat.JPEG, quality: 95),
          );
          if (shot == null || shot.length < 64) return false;
          final tmp = File('${dir.path}/shot.tmp');
          await tmp.writeAsBytes(shot, flush: true);
          size = await _native.invokeMethod<List<Object?>>('cropTrimImage', {...args, 'input': tmp.path, 'trim': true});
          try {
            tmp.deleteSync();
          } catch (_) {}
        }
        if (size == null || size.length < 2) return false;
        final double ow = v(size[0]), oh = v(size[1]);
        // 쪽 그림 위에서 글을 길게 눌러 고를 수 있게 낱말 자리도 저장 (그림 크기 대비 0~1)
        try {
          final boxes = await call('visibleTextBoxes', []);
          final double rx = rect == null ? 0 : v(rect['x']), ry = rect == null ? 0 : v(rect['y']);
          final double rw = rect == null || v(rect['w']) <= 0 ? 1 : v(rect['w']);
          // 그림이 덮는 화면 세로 비율 (화면은 가로의 1.5배 높이, 아래 빈 곳은 잘림)
          final double hv = ow <= 0 ? 1 : oh * rw / (ow * 1.5);
          final words = <Map<String, Object>>[];
          if (boxes is List) {
            for (final b in boxes) {
              if (b is! Map) continue;
              final double y = (v(b['y']) - ry) / hv, h = v(b['h']) / hv;
              final double x = (v(b['x']) - rx) / rw, ww = v(b['w']) / rw;
              if (y + h < 0 || y > 1 || x + ww < 0 || x > 1) continue;
              words.add({'t': '${b['t'] ?? ''}', 'x': x, 'y': y, 'w': ww, 'h': h});
            }
          }
          File('${dir.path}/p$i.words.json').writeAsStringSync(jsonEncode(words));
        } catch (_) {}
        meta['$i'] = ow <= 0 ? 1.414 : (oh / ow).clamp(0.02, 8.0).toDouble();
        try {
          File('${dir.path}/meta.json').writeAsStringSync(jsonEncode(meta));
        } catch (_) {}
        // 같은 이름의 그림을 화면이 기억해 두지 않게
        try {
          PaintingBinding.instance.imageCache.evict(FileImage(out));
        } catch (_) {}
        job.rendered++;
        report(++done);
      }
      return true;
    } catch (_) {
      return false;
    } finally {
      try {
        await headless.dispose();
      } catch (_) {}
    }
  }
}

class _Job {
  _Job(this.key, this.path, this.theme, this.widthPx, this.logicalWidth, this.pageCount);
  final String key;
  final String path;
  final String theme;
  final int widthPx;
  final double logicalWidth;
  final int pageCount;
  int rendered = 0; // 이번에 새로 그린 쪽 수
  String tag = ''; // 숨은 화면을 앱(안드로이드)이 찾는 표시 (동시에 여러 개 준비할 때 구별)
}
