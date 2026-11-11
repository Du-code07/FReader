import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

import 'docx_layout_hints.dart';

/// 한글(HWP·HWPX)·워드(DOCX·DOC) 서재 표지(첫 페이지) 만들기.
///
/// 1) 파일 안에 이미 들어 있는 미리보기 그림을 쓴다 (빠르고 정확함)
///    - HWPX: Preview/PrvImage.png   - HWP: 'PrvImage' 스트림   - DOCX: docProps/thumbnail.*
/// 2) 없으면 문서 뷰어와 같은 엔진을 화면 밖 WebView에서 열어 첫 페이지를 찍는다.
class DocThumbnailService {
  static const List<String> supportedExts = ['hwp', 'hwpx', 'docx', 'doc', 'pptx', 'ppt'];
  static const MethodChannel _native = MethodChannel('ebook_reader/pdf_renderer');

  /// 표지 그림을 [outPath]에 저장. 성공하면 true.
  /// [allowRender]가 false면 파일 안의 미리보기 그림만 쓴다 (화면 밖 그리기는 무거우므로).
  static Future<bool> make(String path, String outPath, {bool allowRender = true}) async {
    Uint8List? embedded;
    try {
      embedded = await Isolate.run(() => extractEmbeddedPreview(path));
      if (embedded != null && embedded.length <= 64) embedded = null;
    } catch (_) {}
    final lowRes = File('$outPath.low');
    // 오래된 한글 파일의 미리보기 그림은 아주 작아서(예: 177×250) 서재 표지로 늘리면 흐리다 → 충분히 클 때만 그대로 쓴다
    if (embedded != null && (imageWidth(embedded) ?? 0) >= minSharpWidth) {
      await File(outPath).writeAsBytes(embedded, flush: true);
      if (lowRes.existsSync()) lowRes.deleteSync();
      return true;
    }
    if (allowRender && await _enqueueRender(path, outPath)) {
      if (lowRes.existsSync()) lowRes.deleteSync();
      return true;
    }
    if (embedded != null) {
      // 작은 미리보기라도 우선 보여주고, 표지형 보기에서 다시 선명하게 그리도록 표시해 둔다
      await File(outPath).writeAsBytes(embedded, flush: true);
      if (allowRender) {
        if (lowRes.existsSync()) lowRes.deleteSync();
      } else {
        lowRes.writeAsStringSync('');
      }
      return true;
    }
    return false;
  }

  /// 이보다 좁은 미리보기 그림은 흐리게 보이므로 첫 페이지를 직접 그린다
  static const int minSharpWidth = 360;

  /// 그림 바이트의 가로 픽셀 수 (PNG/GIF/BMP/JPEG). 알 수 없으면 null.
  static int? imageWidth(Uint8List b) {
    if (b.length < 26) return null;
    if (b[0] == 0x89 && b[1] == 0x50) return (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
    if (b[0] == 0x47 && b[1] == 0x49) return b[6] | (b[7] << 8);
    if (b[0] == 0x42 && b[1] == 0x4D) return (b[18] | (b[19] << 8) | (b[20] << 16) | (b[21] << 24)).abs();
    if (b[0] == 0xFF && b[1] == 0xD8) {
      var i = 2;
      while (i + 9 < b.length) {
        if (b[i] != 0xFF) {
          i++;
          continue;
        }
        final marker = b[i + 1];
        if (marker == 0xD8 || marker == 0x01 || (marker >= 0xD0 && marker <= 0xD7) || marker == 0xFF) {
          i += marker == 0xFF ? 1 : 2;
          continue;
        }
        final len = (b[i + 2] << 8) | b[i + 3];
        if (marker >= 0xC0 && marker <= 0xCF && marker != 0xC4 && marker != 0xC8 && marker != 0xCC) {
          return (b[i + 7] << 8) | b[i + 8];
        }
        i += 2 + len;
      }
    }
    return null;
  }

  // ───────────────────────── 1) 파일 안의 미리보기 그림 ─────────────────────────

  /// 파일 안에 들어 있는 미리보기 그림(PNG/JPEG/GIF/BMP) 바이트. 없으면 null.
  static Uint8List? extractEmbeddedPreview(String path) {
    final lower = path.toLowerCase();
    final file = File(path);
    if (!file.existsSync()) return null;
    if (lower.endsWith('.hwpx') || lower.endsWith('.docx') || lower.endsWith('.pptx')) {
      final bytes = file.readAsBytesSync();
      final archive = ZipDecoder().decodeBytes(bytes);
      for (final f in archive.files) {
        if (!f.isFile) continue;
        final name = f.name.toLowerCase();
        final hit = lower.endsWith('.hwpx')
            ? name.startsWith('preview/prvimage')
            : (name.startsWith('docprops/thumbnail.') && (name.endsWith('.jpeg') || name.endsWith('.jpg') || name.endsWith('.png')));
        if (hit) {
          final data = Uint8List.fromList(f.content as List<int>);
          if (_isImage(data)) return data;
        }
      }
      return null;
    }
    if (lower.endsWith('.hwp') || lower.endsWith('.doc')) {
      final data = CompoundFile.readStream(file.readAsBytesSync(), 'PrvImage');
      if (data != null && _isImage(data)) return data;
    }
    return null;
  }

  static bool _isImage(Uint8List b) {
    if (b.length < 8) return false;
    if (b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return true; // PNG
    if (b[0] == 0xFF && b[1] == 0xD8) return true; // JPEG
    if (b[0] == 0x47 && b[1] == 0x49 && b[2] == 0x46) return true; // GIF
    if (b[0] == 0x42 && b[1] == 0x4D) return true; // BMP
    return false;
  }

  // ───────────────────────── 2) 화면 밖에서 첫 페이지 그리기 ─────────────────────────

  static Future<void> _queue = Future<void>.value();

  /// 무거운 문서 엔진은 한 번에 하나씩만 돌린다
  static Future<bool> _enqueueRender(String path, String outPath) {
    final done = Completer<bool>();
    _queue = _queue.then((_) async {
      try {
        done.complete(await _renderFirstPage(path, outPath));
      } catch (_) {
        if (!done.isCompleted) done.complete(false);
      }
    });
    return done.future;
  }

  static const _origin = 'https://appassets.androidplatform.net';
  static const _chunkBytes = 192 * 1024;
  static const _maxBytes = 64 * 1024 * 1024; // 표지용으로는 너무 큰 문서는 건너뜀

  static Future<bool> _renderFirstPage(String path, String outPath) async {
    final lower = path.toLowerCase();
    final bool isDocx = lower.endsWith('.docx');
    final bool isDoc = lower.endsWith('.doc');
    final bool isWord = isDocx || isDoc;
    final bool isSlides = lower.endsWith('.pptx') || lower.endsWith('.ppt');
    final String entry = '$_origin/assets/flutter_assets/assets/${isSlides ? 'ppt' : isWord ? 'docx' : 'hwp'}/index.html';
    final String jsObject = isSlides ? 'freaderPpt' : isWord ? 'freaderDocx' : 'freaderHwp';

    final source = File(path);
    final int length = await source.length();
    if (length < 1 || length > _maxBytes) return false;
    Map<String, Object> docxLayout = {};
    if (isDocx) {
      try {
        docxLayout = await Isolate.run(() => DocxLayoutHints.readLayout(path));
      } catch (_) {}
    }
    final options = <String, Object?>{
      'theme': 'white',
      'spread': false,
      'rtl': false,
      'position': null,
      'progress': 0.0,
      if (isWord) 'format': isDoc ? 'doc' : 'docx',
      if (isSlides) 'format': lower.endsWith('.pptx') ? 'pptx' : 'ppt',
      if (isDocx) 'docxLayout': docxLayout,
    };

    final result = Completer<bool>();
    InAppWebViewController? web;
    bool started = false;

    Future<void> invoke(String method, List<Object?> args) async {
      final r = await web!.callAsyncJavaScript(
        functionBody: 'return await window[viewer][method](...args);',
        arguments: {'viewer': jsObject, 'method': method, 'args': args},
      );
      if (r?.error != null) throw StateError(r!.error!);
    }

    Future<void> transfer() async {
      if (started || web == null) return;
      started = true;
      try {
        await invoke('beginDocument', [length, options]);
        final raf = await source.open();
        try {
          var offset = 0;
          while (offset < length && !result.isCompleted) {
            final chunk = await raf.read(_chunkBytes);
            if (chunk.isEmpty) throw const FormatException('file changed');
            await invoke('appendChunk', [offset, base64Encode(chunk)]);
            offset += chunk.length;
          }
        } finally {
          await raf.close();
        }
        if (!result.isCompleted) await invoke('openDocument', [null]);
      } catch (_) {
        if (!result.isCompleted) result.complete(false);
      }
    }

    Timer? fallbackCapture;
    var capturing = false;
    Future<void> capture() async {
      if (capturing) return;
      capturing = true;
      fallbackCapture?.cancel();
      // 글꼴·그림이 다 그려질 시간을 조금 준다
      await Future<void>.delayed(Duration(milliseconds: isSlides ? 300 : 700));
      if (isSlides) {
        // 슬라이드는 캔버스에 그려지므로 화면 캡처 대신 캔버스 그림을 그대로 받는다 (캡처하면 흰 화면만 찍히는 기기가 있음)
        try {
          final r = await web?.callAsyncJavaScript(functionBody: 'return window.freaderPpt.thumbnail(800);');
          final data = r?.value;
          if (r?.error == null && data is String && data.isNotEmpty) {
            final bytes = base64Decode(data);
            if (bytes.length > 64) {
              await File(outPath).writeAsBytes(bytes, flush: true);
              if (!result.isCompleted) result.complete(true);
              return;
            }
          }
        } catch (_) {}
      }
      try {
        final shot = await web?.takeScreenshot(
          screenshotConfiguration: ScreenshotConfiguration(compressFormat: CompressFormat.JPEG, quality: 85),
        );
        if (shot != null && shot.length > 64) {
          await File(outPath).writeAsBytes(shot, flush: true);
          if (!result.isCompleted) result.complete(true);
          return;
        }
      } catch (_) {}
      if (!result.isCompleted) result.complete(false);
    }

    final headless = HeadlessInAppWebView(
      initialUrlRequest: URLRequest(url: WebUri(entry)),
      initialSize: isSlides ? const Size(800, 450) : const Size(600, 848), // 슬라이드는 16:9, 문서는 A4 비율
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
        webViewAssetLoader: WebViewAssetLoader(pathHandlers: [AssetsPathHandler(path: '/assets/')]),
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
                // 쪽(슬라이드) 안 그림까지 다 그려졌다는 알림(pageReady)을 기다린다 (늦으면 그냥 찍음)
                fallbackCapture ??= Timer(Duration(seconds: isSlides ? 4 : 8), () => unawaited(capture()));
                break;
              case 'pageReady':
                fallbackCapture?.cancel();
                unawaited(capture());
                break;
              case 'password':
              case 'error':
                if (!result.isCompleted) result.complete(false);
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
        if (request.isForMainFrame == true && !result.isCompleted) result.complete(false);
      },
      // 큰 문서로 표지를 만들다 화면 그리는 프로세스가 죽어도 앱이 꺼지지 않게 (표지만 포기)
      onRenderProcessGone: (controller, detail) async {
        if (!result.isCompleted) result.complete(false);
      },
    );

    try {
      await headless.run();
      // 안드로이드: 숨김 WebView는 그리기를 멈출 수 있어, 투명·화면 밖 상태로 '보이게' 둔다
      try {
        await _native.invokeMethod('wakeHiddenWebViews');
      } catch (_) {}
      return await result.future.timeout(const Duration(seconds: 45), onTimeout: () => false);
    } catch (_) {
      return false;
    } finally {
      try {
        await headless.dispose();
      } catch (_) {}
    }
  }
}

/// 한글(HWP 5.0)·워드(DOC)가 쓰는 MS 복합 문서(CFB) 형식에서 스트림 하나를 읽는다.
class CompoundFile {
  static const _signature = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
  static const _endOfChain = 0xFFFFFFFE;
  static const _freeSect = 0xFFFFFFFF;

  /// [name] 스트림 내용. 없거나 형식이 다르면 null.
  static Uint8List? readStream(Uint8List data, String name) {
    if (data.length < 512) return null;
    for (int i = 0; i < 8; i++) {
      if (data[i] != _signature[i]) return null;
    }
    final bd = ByteData.sublistView(data);
    final int sectorShift = bd.getUint16(30, Endian.little);
    final int miniShift = bd.getUint16(32, Endian.little);
    if (sectorShift < 7 || sectorShift > 16 || miniShift > sectorShift) return null;
    final int sectorSize = 1 << sectorShift;
    final int miniSize = 1 << miniShift;
    final int firstDir = bd.getUint32(48, Endian.little);
    final int miniCutoff = bd.getUint32(56, Endian.little);
    final int firstMiniFat = bd.getUint32(60, Endian.little);
    final int firstDifat = bd.getUint32(68, Endian.little);
    final int numDifat = bd.getUint32(72, Endian.little);

    int sectorOffset(int s) => (s + 1) * sectorSize;
    bool validSector(int s) => s < 0xFFFFFFFA && sectorOffset(s) + sectorSize <= data.length;

    // FAT 섹터 목록 (헤더의 109개 + 이어지는 DIFAT)
    final fatSectors = <int>[];
    for (int i = 0; i < 109; i++) {
      final s = bd.getUint32(76 + i * 4, Endian.little);
      if (s != _freeSect && s != _endOfChain) fatSectors.add(s);
    }
    int difat = firstDifat;
    for (int n = 0; n < numDifat && validSector(difat); n++) {
      final off = sectorOffset(difat);
      final per = sectorSize ~/ 4 - 1;
      for (int i = 0; i < per; i++) {
        final s = bd.getUint32(off + i * 4, Endian.little);
        if (s != _freeSect && s != _endOfChain) fatSectors.add(s);
      }
      difat = bd.getUint32(off + per * 4, Endian.little);
    }
    final fat = <int>[];
    for (final s in fatSectors) {
      if (!validSector(s)) return null;
      final off = sectorOffset(s);
      for (int i = 0; i < sectorSize ~/ 4; i++) {
        fat.add(bd.getUint32(off + i * 4, Endian.little));
      }
    }

    Uint8List? readChain(int start, {int? size}) {
      final out = BytesBuilder(copy: false);
      int s = start;
      int guard = 0;
      while (s != _endOfChain && s != _freeSect) {
        if (!validSector(s) || s >= fat.length || guard++ > fat.length) return null;
        out.add(Uint8List.sublistView(data, sectorOffset(s), sectorOffset(s) + sectorSize));
        s = fat[s];
      }
      final all = out.takeBytes();
      if (size != null) {
        if (size > all.length) return null;
        return Uint8List.sublistView(all, 0, size);
      }
      return all;
    }

    final dir = readChain(firstDir);
    if (dir == null) return null;
    final dbd = ByteData.sublistView(dir);
    int? rootStart;
    int rootSize = 0;
    for (int off = 0; off + 128 <= dir.length; off += 128) {
      final nameLen = dbd.getUint16(off + 64, Endian.little);
      final type = dir[off + 66];
      if (type == 5) {
        rootStart = dbd.getUint32(off + 116, Endian.little);
        rootSize = dbd.getUint32(off + 120, Endian.little);
      }
      if (type != 2 || nameLen < 2 || nameLen > 64) continue;
      final chars = <int>[];
      for (int i = 0; i < nameLen - 2; i += 2) {
        chars.add(dbd.getUint16(off + i, Endian.little));
      }
      if (String.fromCharCodes(chars) != name) continue;
      final start = dbd.getUint32(off + 116, Endian.little);
      final size = dbd.getUint32(off + 120, Endian.little);
      if (size == 0) return null;
      if (size >= miniCutoff) return readChain(start, size: size);
      // 작은 스트림: 루트의 미니 스트림 + 미니 FAT
      if (rootStart == null) {
        // 루트 항목은 보통 맨 앞에 있지만, 혹시 뒤에 있으면 찾아 둔다
        for (int o = 0; o + 128 <= dir.length; o += 128) {
          if (dir[o + 66] == 5) {
            rootStart = dbd.getUint32(o + 116, Endian.little);
            rootSize = dbd.getUint32(o + 120, Endian.little);
          }
        }
      }
      if (rootStart == null) return null;
      final ministream = readChain(rootStart, size: rootSize);
      final minifatBytes = readChain(firstMiniFat);
      if (ministream == null || minifatBytes == null) return null;
      final mbd = ByteData.sublistView(minifatBytes);
      final out = BytesBuilder(copy: false);
      int s = start;
      int guard = 0;
      final int miniCount = minifatBytes.length ~/ 4;
      while (s != _endOfChain && s != _freeSect) {
        if (s >= miniCount || guard++ > miniCount) return null;
        final o = s * miniSize;
        if (o + miniSize > ministream.length) return null;
        out.add(Uint8List.sublistView(ministream, o, o + miniSize));
        s = mbd.getUint32(s * 4, Endian.little);
      }
      final all = out.takeBytes();
      if (size > all.length) return null;
      return Uint8List.sublistView(all, 0, size);
    }
    return null;
  }
}
