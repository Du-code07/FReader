import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

import 'pdf_outline_service.dart';
import 'storage_service.dart';

typedef ExportTr = String Function(String ko, String en, String zh, String ja);

/// PDF 내보내기 (메모 포함) 공통 처리
class PdfExportService {
  static const MethodChannel _channel = MethodChannel('ebook_reader/pdf_renderer');

  /// 파일 이름: "원래 이름.pdf" (원래 확장자는 뺌. 같은 이름이 있으면 시스템이 (1) 등을 붙임)
  static String exportFileName(String title, ExportTr tr) {
    String base = title.trim();
    final dot = base.lastIndexOf('.');
    if (dot > 0 && base.length - dot <= 6) base = base.substring(0, dot);
    if (base.isEmpty) base = 'FReader';
    return '$base.pdf';
  }

  /// 페이지 그림 + 필기 + 텍스트 메모를 PDF로 만들어 다운로드/FReader 폴더에 저장.
  /// [pages] 각 항목: {'image': 그림 경로, 'strokes': [{x,y,c,w}], 'refWidth': 필기를 그린 화면 폭, 'note': 텍스트 메모}
  /// 돌려주는 값: 저장된 위치 (예: Download/FReader/xxx.pdf)
  /// [outline]: 목차(책갈피)로 넣을 항목 {title, level, page(내보낸 PDF의 쪽, 0부터)} — 비어 있으면 넣지 않음.
  /// 각 페이지에 'texts': [{t, x, y, w, h}] (그림 크기 대비 0~1)를 주면 보이지 않는 글자 층을 넣어 글 찾기가 된다.
  static Future<String> buildPdf({
    required List<Map<String, Object?>> pages,
    required String fileName,
    void Function(int current, int total)? onProgress,
    List<Map<String, Object>> outline = const [],
  }) async {
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onPdfExportProgress' && onProgress != null) {
        final args = Map<String, dynamic>.from(call.arguments as Map);
        onProgress((args['current'] as num).toInt(), (args['total'] as num).toInt());
      }
      return null;
    });
    try {
      final fallbackDir = (await getApplicationDocumentsDirectory()).path;
      if (outline.isEmpty) {
        final saved = await _channel.invokeMethod<String>('exportPdfWithMemos', {
          'pages': pages,
          'fileName': fileName,
          'fallbackDir': fallbackDir,
        });
        return saved ?? fileName;
      }
      // 목차를 넣을 때: 임시 파일로 만든 뒤 → 목차(책갈피) 덧붙이기 → 다운로드 폴더에 저장
      final tmp = await _channel.invokeMethod<String>('exportPdfWithMemos', {
        'pages': pages,
        'fileName': fileName,
        'fallbackDir': fallbackDir,
        'keepTemp': true,
      });
      if (tmp == null) return fileName;
      await PdfOutlineService.appendOutline(tmp, outline);
      final saved = await _channel.invokeMethod<String>('savePdfFile', {'path': tmp, 'fileName': fileName, 'fallbackDir': fallbackDir});
      return saved ?? fileName;
    } finally {
      _channel.setMethodCallHandler(null);
    }
  }

  static Map<String, Object?> strokeToMap(MemoStroke s) => {'x': s.dxList, 'y': s.dyList, 'c': s.colorValue, 'w': s.strokeWidth};
}

/// 내보내기 진행 상황 창
class ExportProgressController {
  final ValueNotifier<String> status = ValueNotifier<String>('');
  final ValueNotifier<double?> ratio = ValueNotifier<double?>(null);
  bool cancelled = false;
  BuildContext? _dialogContext;
  bool _closeRequested = false;
  bool _popScheduled = false;

  void update(String text, double? value) {
    status.value = text;
    ratio.value = value;
  }

  /// 창 닫기. 작업이 아주 빨리 끝나 창이 아직 화면에 안 그려졌으면, 그려지자마자 닫는다.
  void close() {
    _closeRequested = true;
    final ctx = _dialogContext;
    _dialogContext = null;
    if (ctx != null && ctx.mounted && !_popScheduled) {
      _popScheduled = true;
      Navigator.of(ctx).pop();
    }
  }

  void _onDialogBuilt(BuildContext ctx) {
    if (_closeRequested) {
      if (_popScheduled) return;
      _popScheduled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (ctx.mounted) Navigator.of(ctx).pop();
      });
    } else {
      _dialogContext = ctx;
    }
  }
}

/// 진행 창을 띄운다. [cancelable]이면 '취소' 버튼이 생긴다.
ExportProgressController showExportProgress(BuildContext context, ExportTr tr, {bool cancelable = false}) {
  final ctrl = ExportProgressController();
  showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (ctx) {
      ctrl._onDialogBuilt(ctx);
      return PopScope(
        canPop: false,
        child: StatefulBuilder(
          builder: (ctx, setLocal) => AlertDialog(
            title: Row(
              children: [
                ExportFileIcon(size: 24, color: Theme.of(ctx).colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(tr('PDF로 내보내는 중', 'Exporting to PDF', '正在导出为 PDF', 'PDFに書き出し中'))),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ValueListenableBuilder<double?>(
                  valueListenable: ctrl.ratio,
                  builder: (_, v, __) => LinearProgressIndicator(value: v),
                ),
                const SizedBox(height: 12),
                ValueListenableBuilder<String>(
                  valueListenable: ctrl.status,
                  builder: (_, v, __) => Text(v, style: const TextStyle(fontSize: 13)),
                ),
              ],
            ),
            actions: [
              if (cancelable)
                TextButton(
                  onPressed: ctrl.cancelled
                      ? null
                      : () => setLocal(() {
                            ctrl.cancelled = true;
                            ctrl.status.value = tr('취소하는 중…', 'Cancelling…', '正在取消…', 'キャンセル中…');
                          }),
                  child: Text(tr('취소', 'Cancel', '取消', 'キャンセル')),
                ),
            ],
          ),
        ),
      );
    },
  );
  return ctrl;
}

/// 내보내기 실패 이유를 알기 쉬운 문구로
String exportErrorText(Object error, ExportTr tr) {
  if (error is MissingPluginException) {
    return tr(
      '이 설치본에는 PDF 내보내기 기능(안드로이드 부분)이 없어요. 앱을 최신 버전으로 다시 빌드·설치해 주세요.',
      'This build does not include the PDF export feature (Android part). Please rebuild and reinstall the latest version.',
      '此安装包不含 PDF 导出功能（安卓部分）。请重新构建并安装最新版本。',
      'このビルドにはPDF書き出し機能（Android部分）がありません。最新版を再ビルドしてインストールしてください。',
    );
  }
  if (error is PlatformException) return error.message ?? error.code;
  return error.toString();
}

/// '파일 내보내기' 아이콘: 귀퉁이가 접힌 문서 + 오른쪽 화살표 (두 가지 톤)
/// 문서 몸통은 [color]를 옅게, 접힌 귀퉁이와 화살표는 [color] 그대로.
class ExportFileIcon extends StatelessWidget {
  const ExportFileIcon({super.key, this.size = 20, this.color = Colors.white});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(size: Size.square(size), painter: _ExportFileIconPainter(color));
  }
}

class _ExportFileIconPainter extends CustomPainter {
  const _ExportFileIconPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final double k = size.width / 24.0; // 24칸 기준 좌표
    Offset p(double x, double y) => Offset(x * k, y * k);
    const double l = 3.0, t = 3.0, r = 18.3, b = 21.3, rad = 2.6, foldX = 12.1, foldY = 9.2;

    // 문서 몸통 (오른쪽 위 귀퉁이가 비스듬히 잘린 둥근 사각형)
    final body = Path()
      ..moveTo(l * k + rad * k, t * k)
      ..lineTo(foldX * k, t * k)
      ..lineTo(r * k, foldY * k)
      ..lineTo(r * k, (b - rad) * k)
      ..arcToPoint(p(r - rad, b), radius: Radius.circular(rad * k))
      ..lineTo((l + rad) * k, b * k)
      ..arcToPoint(p(l, b - rad), radius: Radius.circular(rad * k))
      ..lineTo(l * k, (t + rad) * k)
      ..arcToPoint(p(l + rad, t), radius: Radius.circular(rad * k))
      ..close();
    canvas.drawPath(body, Paint()..color = color.withValues(alpha: 0.38)..isAntiAlias = true);

    // 접힌 귀퉁이
    final fold = Path()
      ..moveTo(foldX * k, t * k)
      ..lineTo(r * k, foldY * k)
      ..lineTo((foldX + 3.1) * k, foldY * k)
      ..arcToPoint(p(foldX, foldY - 3.1), radius: Radius.circular(3.1 * k))
      ..close();
    canvas.drawPath(fold, Paint()..color = color..isAntiAlias = true);

    // 오른쪽 화살표
    final arrow = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2 * k
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;
    canvas.drawLine(p(12.6, 16.2), p(22.2, 16.2), arrow);
    canvas.drawPath(
      Path()
        ..moveTo(19.2 * k, 13.2 * k)
        ..lineTo(22.2 * k, 16.2 * k)
        ..lineTo(19.2 * k, 19.2 * k),
      arrow,
    );
  }

  @override
  bool shouldRepaint(covariant _ExportFileIconPainter old) => old.color != color;
}
