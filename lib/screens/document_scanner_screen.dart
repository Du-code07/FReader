import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

class _ScanPageItem {
  _ScanPageItem({
    required this.id,
    required this.rawPath,
    required this.quad,
    this.mode = 'magic',
    this.contrast = 0.50,
    this.rotation = 0,
  });

  final String id;
  String rawPath;
  // 4개 꼭짓점 [tlX, tlY, trX, trY, brX, brY, blX, blY] (0.0 ~ 1.0)
  List<double> quad;
  String mode; // 'magic'|'noshadow'|'brighten'|'scan_bw'|'invert'|'original'
  double contrast; // 0.0 ~ 1.0
  int rotation; // 0, 90, 180, 270
  String? processedPath;
  bool isProcessing = false;
  final Map<String, String> filterThumbPaths = {};

  bool get hasCustomQuad {
    if (quad.length != 8) return false;
    return (quad[0] - 0.0).abs() > 0.01 ||
        (quad[1] - 0.0).abs() > 0.01 ||
        (quad[2] - 1.0).abs() > 0.01 ||
        (quad[3] - 0.0).abs() > 0.01 ||
        (quad[4] - 1.0).abs() > 0.01 ||
        (quad[5] - 1.0).abs() > 0.01 ||
        (quad[6] - 0.0).abs() > 0.01 ||
        (quad[7] - 1.0).abs() > 0.01;
  }
}

class DocumentScannerScreen extends StatefulWidget {
  const DocumentScannerScreen({
    super.key,
    required this.appLang,
    required this.targetGroup,
  });

  final String appLang;
  final String targetGroup;

  @override
  State<DocumentScannerScreen> createState() => _DocumentScannerScreenState();
}

class _DocumentScannerScreenState extends State<DocumentScannerScreen>
    with SingleTickerProviderStateMixin {
  static const MethodChannel _pdfChannel = MethodChannel('ebook_reader/pdf_renderer');
  static const Color _teal = Color(0xFF68C628);
  static const Color _tealBright = Color(0xFF8CE63C);

  final List<_ScanPageItem> _pages = [];
  bool _colorEnhance = true;
  bool _eraseFingers = true;
  bool _flattenQuad = true;

  bool _isLaunchingCamera = false;
  int _currentEditIndex = 0;
  bool _showOriginalCompare = false;
  bool _showStrengthSlider = false;
  bool _isCropping = false;
  List<double> _draftQuad = [0.07, 0.08, 0.93, 0.08, 0.93, 0.92, 0.07, 0.92];
  late String _docTitle;

  late final PageController _pageController = PageController();
  late final AnimationController _scanWaveCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 950),
  );

  String _tr(String ko, String en, String zh, String ja) {
    switch (widget.appLang) {
      case 'en':
        return en;
      case 'zh':
        return zh;
      case 'ja':
        return ja;
      default:
        return ko;
    }
  }

  // 에코, 그레이스케일 제거 -> 6종 핵심 필터 구성
  List<(String, String)> get _filterDefs => [
        ('magic', _tr('강화', 'Enhance', '增强', '強調')),
        ('noshadow', _tr('음영 제거', 'No Shadow', '去阴影', '影除去')),
        ('scan_bw', _tr('흑백', 'B&W', '黑白', '白黒')),
        ('invert', _tr('반전', 'Invert', '反色', '反転')),
        ('original', _tr('원본', 'Original', '原图', '元の写真')),
      ];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final y = now.year;
    final m = now.month.toString().padLeft(2, '0');
    final d = now.day.toString().padLeft(2, '0');
    final hh = now.hour.toString().padLeft(2, '0');
    final mm = now.minute.toString().padLeft(2, '0');
    _docTitle = '스캔문서_$y$m${d}_$hh$mm';

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _openNativeCamera(batchMode: false, initialLaunch: true);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _scanWaveCtrl.dispose();
    super.dispose();
  }

  Future<void> _openNativeCamera({
    bool batchMode = false,
    bool initialLaunch = false,
    int? replaceIndex,
  }) async {
    if (_isLaunchingCamera) return;
    setState(() => _isLaunchingCamera = true);
    try {
      final Map<Object?, Object?>? res =
          await _pdfChannel.invokeMethod<Map<Object?, Object?>>(
        'openInAppDocumentCamera',
        {
          'batchMode': batchMode,
          'shutterSound': false, // 셔터음 항상 꺼짐(무음) 고정
          'colorEnhance': _colorEnhance,
          'eraseFingers': _eraseFingers,
          'flattenQuad': _flattenQuad,
        },
      );

      if (!mounted) return;
      if (res == null) {
        if (initialLaunch && _pages.isEmpty) {
          Navigator.pop(context);
        }
        return;
      }

      _colorEnhance = (res['colorEnhance'] as bool?) ?? _colorEnhance;
      _eraseFingers = (res['eraseFingers'] as bool?) ?? _eraseFingers;
      _flattenQuad = (res['flattenQuad'] as bool?) ?? _flattenQuad;
      final bool pickGallery = (res['pickGallery'] as bool?) ?? false;

      if (pickGallery) {
        await _pickPhotosFromGallery(initialLaunch: initialLaunch);
        return;
      }

      final rawPages = (res['pages'] as List?) ?? const [];
      if (rawPages.isEmpty) {
        if (initialLaunch && _pages.isEmpty && mounted) {
          Navigator.pop(context);
        }
        return;
      }

      final String defaultMode = _colorEnhance ? 'magic' : 'original';
      final added = <_ScanPageItem>[];

      for (final entry in rawPages) {
        if (entry is! Map) continue;
        final path = (entry['rawPath'] ?? '').toString();
        if (path.isEmpty || !await File(path).exists()) continue;
        final rawQuad = (entry['quad'] as List?)
                ?.map((e) => (e as num).toDouble())
                .toList() ??
            <double>[0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        final quad = rawQuad.length == 8
            ? rawQuad
            : <double>[0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];

        if (replaceIndex != null &&
            replaceIndex >= 0 &&
            replaceIndex < _pages.length) {
          final target = _pages[replaceIndex];
          target.rawPath = path;
          target.quad = quad;
          target.rotation = 0;
          target.filterThumbPaths.clear();
          added.add(target);
          break;
        } else {
          final item = _ScanPageItem(
            id: '${DateTime.now().microsecondsSinceEpoch}_${_pages.length + added.length}',
            rawPath: path,
            quad: quad,
            mode: defaultMode,
          );
          added.add(item);
        }
      }

      if (added.isEmpty) return;

      setState(() {
        if (replaceIndex == null) {
          final firstNewIdx = _pages.length;
          _pages.addAll(added);
          _currentEditIndex = firstNewIdx;
        }
        _showOriginalCompare = false;
      });

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_pageController.hasClients && _currentEditIndex < _pages.length) {
          _pageController.jumpToPage(_currentEditIndex);
        }
      });

      _scanWaveCtrl.forward(from: 0.0);
      for (final p in added) {
        unawaited(_processPage(p));
        unawaited(_generateFilterThumbnails(p));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('카메라 오류: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLaunchingCamera = false);
      }
    }
  }

  Future<void> _pickPhotosFromGallery({bool initialLaunch = false}) async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: true,
    );
    if (!mounted) return;
    if (res == null || res.files.isEmpty) {
      if (initialLaunch && _pages.isEmpty) {
        Navigator.pop(context);
      }
      return;
    }

    final defaultMode = _colorEnhance ? 'magic' : 'original';
    final added = <_ScanPageItem>[];
    for (final pf in res.files) {
      if (pf.path == null) continue;
      final f = File(pf.path!);
      if (!await f.exists()) continue;

      List<double> detectedQuad = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
      if (_flattenQuad) {
        try {
          final qRes = await _pdfChannel.invokeMethod<List<Object?>>(
            'detectDocumentQuad',
            {'imagePath': f.path},
          );
          if (qRes != null && qRes.length == 8) {
            detectedQuad = qRes.map((e) => (e as num).toDouble()).toList();
          }
        } catch (_) {}
      }

      final item = _ScanPageItem(
        id: '${DateTime.now().microsecondsSinceEpoch}_${_pages.length + added.length}',
        rawPath: f.path,
        quad: detectedQuad,
        mode: defaultMode,
      );
      added.add(item);
    }

    if (added.isEmpty) {
      if (initialLaunch && _pages.isEmpty && mounted) {
        Navigator.pop(context);
      }
      return;
    }

    final firstNewIdx = _pages.length;
    setState(() {
      _pages.addAll(added);
      _currentEditIndex = firstNewIdx;
      _showOriginalCompare = false;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_pageController.hasClients && _currentEditIndex < _pages.length) {
        _pageController.jumpToPage(_currentEditIndex);
      }
    });

    _scanWaveCtrl.forward(from: 0.0);
    for (final item in added) {
      unawaited(_processPage(item));
      unawaited(_generateFilterThumbnails(item));
    }
  }

  Future<void> _processPage(_ScanPageItem item, {int maxDim = 3200}) async {
    if (!mounted) return;
    setState(() => item.isProcessing = true);

    try {
      final tmpDir = await getTemporaryDirectory();
      final scanDir = Directory('${tmpDir.path}/scan_previews');
      if (!await scanDir.exists()) {
        await scanDir.create(recursive: true);
      }
      final outPath =
          '${scanDir.path}/proc_${item.id}_${DateTime.now().microsecondsSinceEpoch}.jpg';

      final String? saved = await _pdfChannel.invokeMethod<String>(
        'processScannedImage',
        {
          'inputPath': item.rawPath,
          'outputPath': outPath,
          'mode': item.mode,
          'contrast': item.contrast,
          'rotation': item.rotation,
          'quad': item.quad,
          'eraseFingers': _eraseFingers,
          'maxDim': maxDim,
        },
      );

      if (!mounted) return;
      if (saved != null && saved.isNotEmpty) {
        final prev = item.processedPath;
        setState(() {
          item.processedPath = saved;
          item.isProcessing = false;
        });
        if (prev != null && prev != saved && prev != item.rawPath) {
          try {
            final oldFile = File(prev);
            if (await oldFile.exists()) await oldFile.delete();
          } catch (_) {}
        }
      } else {
        setState(() => item.isProcessing = false);
      }
    } catch (_) {
      if (mounted) {
        setState(() => item.isProcessing = false);
      }
    }
  }

  Future<void> _generateFilterThumbnails(_ScanPageItem item) async {
    try {
      final tmpDir = await getTemporaryDirectory();
      final thumbDir = Directory('${tmpDir.path}/scan_filter_thumbs');
      if (!await thumbDir.exists()) {
        await thumbDir.create(recursive: true);
      }
      for (final (modeKey, _) in _filterDefs) {
        if (!mounted) return;
        final outPath = '${thumbDir.path}/thumb_${item.id}_$modeKey.jpg';
        final String? saved = await _pdfChannel.invokeMethod<String>(
          'processScannedImage',
          {
            'inputPath': item.rawPath,
            'outputPath': outPath,
            'mode': modeKey,
            'contrast': 0.50,
            'rotation': item.rotation,
            'quad': item.quad,
            'eraseFingers': _eraseFingers,
            'maxDim': 260,
          },
        );
        if (mounted && saved != null && saved.isNotEmpty) {
          setState(() {
            item.filterThumbPaths[modeKey] = saved;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _renameDocumentTitleDialog() async {
    final ctrl = TextEditingController(text: _docTitle);
    final res = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('스캔 문서 이름 변경', 'Rename Scanned Document', '重命名扫描文档', 'スキャン文書名を変更')),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          decoration: InputDecoration(
            labelText: _tr('파일 이름', 'Filename', '文件名称', 'ファイル名'),
            suffixText: '.pdf',
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
            child: Text(_tr('확인', 'OK', '确定', 'OK')),
          ),
        ],
      ),
    );
    if (res != null && res.isNotEmpty && mounted) {
      setState(() {
        _docTitle = res.replaceAll(RegExp(r'\.pdf$', caseSensitive: false), '');
      });
    }
  }

  void _applyFilterToAllPages() {
    if (_pages.isEmpty) return;
    final cur = _pages[_currentEditIndex];
    for (final p in _pages) {
      p.mode = cur.mode;
      p.contrast = cur.contrast;
      unawaited(_processPage(p));
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(milliseconds: 1300),
        content: Text(
          _tr(
            '전체 ${_pages.length}쪽에 [${_modeName(cur.mode)}] 필터를 적용했습니다.',
            'Applied [${_modeName(cur.mode)}] to all ${_pages.length} pages.',
            '已将 [${_modeName(cur.mode)}] 应用到全部 ${_pages.length} 页。',
            '全${_pages.length}ページに[${_modeName(cur.mode)}]を適用しました。',
          ),
        ),
      ),
    );
  }

  Future<void> _saveAndCreatePdf() async {
    if (_pages.isEmpty) return;

    final safeTitle = _docTitle
        .trim()
        .replaceAll(RegExp(r'\.pdf$', caseSensitive: false), '')
        .replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
    final finalTitle = safeTitle.isEmpty ? '스캔문서' : safeTitle;

    int currentStep = 0;
    final int totalSteps = _pages.length;
    String statusText = _tr(
      '고화질 스캔본 생성 중...',
      'Preparing high-res scans...',
      '正在准备高清扫描件...',
      '高画質スキャンを準備中...',
    );
    StateSetter? dialogSetState;

    _pdfChannel.setMethodCallHandler((call) async {
      if (call.method == 'onScanPdfProgress') {
        final args = call.arguments as Map?;
        if (args != null) {
          final int cur = (args['current'] as num?)?.toInt() ?? 1;
          dialogSetState?.call(() {
            currentStep = cur;
            statusText = _tr(
              'PDF 파일로 묶는 중 ($cur / $totalSteps)',
              'Bundling PDF page ($cur / $totalSteps)',
              '正在合并 PDF ($cur / $totalSteps)',
              'PDF作成中 ($cur / $totalSteps)',
            );
          });
        }
      }
      return null;
    });

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          dialogSetState = setModalState;
          final double ratio =
              totalSteps > 0 ? (currentStep / totalSteps).clamp(0.0, 1.0) : 0.0;
          return AlertDialog(
            title: Text(_tr('스캔 PDF 저장 중', 'Saving Scanned PDF', '正在保存扫描 PDF', 'スキャンPDF保存中')),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LinearProgressIndicator(
                  value: currentStep > 0 ? ratio : null,
                  color: _teal,
                ),
                const SizedBox(height: 12),
                Text(
                  '${(ratio * 100).toStringAsFixed(0)}% ($currentStep / $totalSteps)',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 6),
                Text(statusText, style: const TextStyle(fontSize: 12)),
              ],
            ),
          );
        },
      ),
    );

    try {
      final finalPaths = <String>[];
      for (int i = 0; i < _pages.length; i++) {
        final p = _pages[i];
        while (p.isProcessing) {
          await Future.delayed(const Duration(milliseconds: 60));
        }
        if (p.processedPath == null || !await File(p.processedPath!).exists()) {
          await _processPage(p, maxDim: 3400);
        }
        finalPaths.add(p.processedPath ?? p.rawPath);
      }

      final appDir = await getApplicationDocumentsDirectory();
      var outPath = '${appDir.path}/$finalTitle.pdf';
      int dup = 1;
      while (await File(outPath).exists()) {
        outPath = '${appDir.path}/$finalTitle ($dup).pdf';
        dup++;
      }

      final String? savedPdfPath = await _pdfChannel.invokeMethod<String>(
        'createScannedPdf',
        {
          'imagePaths': finalPaths,
          'outputPath': outPath,
        },
      );

      if (!mounted) return;
      Navigator.pop(context);

      if (savedPdfPath != null && savedPdfPath.isNotEmpty) {
        Navigator.pop(context, File(savedPdfPath));
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF 생성 오류: $e')),
        );
      }
    } finally {
      _pdfChannel.setMethodCallHandler(null);
    }
  }

  String _modeName(String mode) {
    for (final (k, label) in _filterDefs) {
      if (k == mode) return label;
    }
    return mode;
  }

  // ── 4점 연두색 사각형(종이 인식 틀) 인터랙티브 자르기 화면 (흰색 배경 + 검정 글씨) ──
  Widget _buildQuadCropEditor(_ScanPageItem item) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E2228),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Color(0xFF1E2228)),
          onPressed: () => setState(() => _isCropping = false),
        ),
        title: Text(
          _tr('종이 영역 맞춤', 'Adjust Document Frame', '调整文档边框', '用紙枠の調整'),
          style: const TextStyle(
            color: Color(0xFF1E2228),
            fontSize: 15.5,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          TextButton.icon(
            onPressed: () async {
              try {
                final qRes = await _pdfChannel.invokeMethod<List<Object?>>(
                  'detectDocumentQuad',
                  {'imagePath': item.rawPath},
                );
                if (qRes != null && qRes.length == 8 && mounted) {
                  setState(() {
                    _draftQuad = qRes.map((e) => (e as num).toDouble()).toList();
                  });
                }
              } catch (_) {}
            },
            icon: const Icon(Icons.auto_fix_high, color: Color(0xFF1E2228), size: 18),
            label: Text(
              _tr('자동 인식', 'Auto Detect', '自动识别', '自動認識'),
              style: const TextStyle(color: Color(0xFF1E2228), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final double maxW = constraints.maxWidth;
                  final double maxH = constraints.maxHeight;
                  return Stack(
                    alignment: Alignment.center,
                    children: [
                      Image.file(
                        File(item.rawPath),
                        width: maxW,
                        height: maxH,
                        fit: BoxFit.contain,
                        filterQuality: FilterQuality.high,
                      ),
                      Positioned.fill(
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onPanUpdate: (details) {
                            final pos = details.localPosition;
                            final dx = details.delta.dx / maxW.clamp(1.0, double.infinity);
                            final dy = details.delta.dy / maxH.clamp(1.0, double.infinity);
                            final nx = (pos.dx / maxW.clamp(1.0, double.infinity)).clamp(0.0, 1.0);
                            final ny = (pos.dy / maxH.clamp(1.0, double.infinity)).clamp(0.0, 1.0);

                            int bestCorner = 0;
                            double bestDist = double.infinity;
                            for (int c = 0; c < 4; c++) {
                              final cx = _draftQuad[c * 2];
                              final cy = _draftQuad[c * 2 + 1];
                              final dist = (nx - cx) * (nx - cx) + (ny - cy) * (ny - cy);
                              if (dist < bestDist) {
                                bestDist = dist;
                                bestCorner = c;
                              }
                            }
                            setState(() {
                              _draftQuad[bestCorner * 2] =
                                  (_draftQuad[bestCorner * 2] + dx).clamp(0.0, 1.0);
                              _draftQuad[bestCorner * 2 + 1] =
                                  (_draftQuad[bestCorner * 2 + 1] + dy).clamp(0.0, 1.0);
                            });
                          },
                          child: CustomPaint(
                            painter: _TealQuadPainter(quad: _draftQuad),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
          Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
            ),
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  TextButton.icon(
                    onPressed: () {
                      setState(() {
                        _draftQuad = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
                      });
                    },
                    icon: const Icon(Icons.crop_free, color: Color(0xFF1E2228), size: 18),
                    label: Text(
                      _tr('전체 영역', 'Full Page', '全图', '全体'),
                      style: const TextStyle(color: Color(0xFF1E2228), fontWeight: FontWeight.w600),
                    ),
                  ),
                  const Spacer(),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: _teal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                    ),
                    onPressed: () {
                      setState(() {
                        item.quad = List<double>.from(_draftQuad);
                        item.filterThumbPaths.clear();
                        _isCropping = false;
                      });
                      _scanWaveCtrl.forward(from: 0.0);
                      unawaited(_processPage(item));
                      unawaited(_generateFilterThumbnails(item));
                    },
                    icon: const Icon(Icons.check, size: 20),
                    label: Text(
                      _tr('완료', 'Apply', '完成', '完了'),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_pages.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1E2228),
          elevation: 0,
          title: Text(
            _tr('문서 스캔', 'Document Scan', '文档扫描', '文書スキャン'),
            style: const TextStyle(color: Color(0xFF1E2228), fontWeight: FontWeight.bold),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.document_scanner_outlined, size: 64, color: Color(0xFF1E2228)),
              const SizedBox(height: 16),
              Text(
                _tr(
                  '카메라로 문서를 촬영하여 스캔하세요.',
                  'Scan documents with the camera.',
                  '使用相机拍摄扫描文档。',
                  'カメラで書類を撮影してスキャンしてください。',
                ),
                style: const TextStyle(color: Color(0xFF4B5563), fontSize: 14),
              ),
              const SizedBox(height: 22),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: _teal,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                ),
                onPressed: () => _openNativeCamera(batchMode: false),
                icon: const Icon(Icons.camera_alt_outlined),
                label: Text(_tr('스캔 카메라 열기', 'Open Scan Camera', '打开扫描相机', 'スキャンカメラを開く')),
              ),
            ],
          ),
        ),
      );
    }

    _currentEditIndex = _currentEditIndex.clamp(0, _pages.length - 1);
    final curItem = _pages[_currentEditIndex];

    if (_isCropping) {
      return _buildQuadCropEditor(curItem);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E2228),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E2228)),
          onPressed: () => Navigator.pop(context),
        ),
        titleSpacing: 0,
        title: InkWell(
          onTap: _renameDocumentTitleDialog,
          borderRadius: BorderRadius.circular(6),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
            child: Row(
              children: [
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.only(bottom: 2),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Color(0xFF9CA3AF), width: 1.0),
                      ),
                    ),
                    child: Text(
                      _docTitle,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF1E2228),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF4B5563)),
              ],
            ),
          ),
        ),
        // 상단 우측 '추가' 버튼 삭제 완료
      ),
      body: Column(
        children: [
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          // 1. 중앙 스캔 문서 미리보기 카드 (흰색 배경 + 좌상단 원형 휴지통 아이콘 포함)
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              itemCount: _pages.length,
              onPageChanged: (idx) {
                setState(() {
                  _currentEditIndex = idx;
                  _showOriginalCompare = false;
                });
              },
              itemBuilder: (ctx, idx) {
                final page = _pages[idx];
                final bool showRaw =
                    _showOriginalCompare || page.processedPath == null;
                final String displayPath =
                    showRaw ? page.rawPath : page.processedPath!;

                return Padding(
                  padding: const EdgeInsets.fromLTRB(22, 14, 22, 6),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.10),
                              blurRadius: 12,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: InteractiveViewer(
                          minScale: 1.0,
                          maxScale: 5.0,
                          child: Image.file(
                            File(displayPath),
                            key: ValueKey('$displayPath:${page.mode}:${page.contrast}'),
                            fit: BoxFit.contain,
                            filterQuality: FilterQuality.high,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Material(
                          color: Colors.black54,
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () {
                              setState(() {
                                _pages.removeAt(idx);
                                if (_pages.isEmpty) {
                                  Navigator.pop(context);
                                  return;
                                }
                                if (_currentEditIndex >= _pages.length) {
                                  _currentEditIndex = _pages.length - 1;
                                }
                              });
                            },
                            child: const Padding(
                              padding: EdgeInsets.all(9),
                              child: Icon(
                                Icons.delete_outline,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ),
                      AnimatedBuilder(
                        animation: _scanWaveCtrl,
                        builder: (context, _) {
                          if (!_scanWaveCtrl.isAnimating && !page.isProcessing) {
                            return const SizedBox.shrink();
                          }
                          return Positioned.fill(
                            child: IgnorePointer(
                              child: Stack(
                                children: [
                                  if (_scanWaveCtrl.isAnimating)
                                    Align(
                                      alignment: Alignment(
                                        0,
                                        -1.0 + 2.0 * _scanWaveCtrl.value,
                                      ),
                                      child: Container(
                                        height: 3.5,
                                        decoration: BoxDecoration(
                                          color: _tealBright,
                                          boxShadow: [
                                            BoxShadow(
                                              color: _tealBright.withValues(alpha: 0.75),
                                              blurRadius: 14,
                                              spreadRadius: 3,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  if (page.isProcessing)
                                    Center(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 8,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.black87,
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Colors.white,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              _tr('글자 선명화 보정 중...', 'Sharpening text...', '正在清晰化文字...', '文字鮮明化補正中...'),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 12.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // 2. 페이지 이동 캡슐 [ ◀ 1/1 ▶ ] & 우측 [ ◫ 비교 ] 버튼
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2F5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      InkWell(
                        onTap: _currentEditIndex > 0
                            ? () {
                                _pageController.previousPage(
                                  duration: const Duration(milliseconds: 200),
                                  curve: Curves.easeOut,
                                );
                              }
                            : null,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          child: RotatedBox(
                            quarterTurns: 2,
                            child: Icon(
                              Icons.play_arrow_rounded,
                              size: 16,
                              color: _currentEditIndex > 0
                                  ? const Color(0xFF1E2228)
                                  : const Color(0xFFB0B7C3),
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          '${_currentEditIndex + 1}/${_pages.length}',
                          style: const TextStyle(
                            color: Color(0xFF1E2228),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      InkWell(
                        onTap: _currentEditIndex < _pages.length - 1
                            ? () {
                                _pageController.nextPage(
                                  duration: const Duration(milliseconds: 200),
                                  curve: Curves.easeOut,
                                );
                              }
                            : null,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          child: Icon(
                            Icons.play_arrow_rounded,
                            size: 16,
                            color: _currentEditIndex < _pages.length - 1
                                ? const Color(0xFF1E2228)
                                : const Color(0xFFB0B7C3),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: GestureDetector(
                    onTapDown: (_) => setState(() => _showOriginalCompare = true),
                    onTapUp: (_) => setState(() => _showOriginalCompare = false),
                    onTapCancel: () => setState(() => _showOriginalCompare = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                      decoration: BoxDecoration(
                        color: _showOriginalCompare
                            ? const Color(0xFFDDE3EA)
                            : const Color(0xFFF0F2F5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.compare_rounded, color: Color(0xFF1E2228), size: 16),
                          const SizedBox(width: 5),
                          Text(
                            _tr('비교', 'Compare', '对比', '比較'),
                            style: const TextStyle(
                              color: Color(0xFF1E2228),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 선택된 필터를 다시 탭했을 때 열리는 진하기(선명도) 슬라이더 + 전체 적용 바
          if (_showStrengthSlider && curItem.mode != 'original')
            Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F2F5),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.tune, color: Color(0xFF1E2228), size: 16),
                  const SizedBox(width: 6),
                  Text(
                    _tr('글자 진하기', 'Ink Darkness', '字迹浓度', '文字の濃さ'),
                    style: const TextStyle(color: Color(0xFF1E2228), fontSize: 12),
                  ),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: _teal,
                        thumbColor: _teal,
                        inactiveTrackColor: const Color(0xFFD0D5DD),
                      ),
                      child: Slider(
                        value: curItem.contrast,
                        min: 0.10,
                        max: 0.95,
                        onChanged: (v) => setState(() => curItem.contrast = v),
                        onChangeEnd: (_) => unawaited(_processPage(curItem)),
                      ),
                    ),
                  ),
                  if (_pages.length > 1)
                    TextButton(
                      onPressed: _applyFilterToAllPages,
                      child: Text(
                        _tr('전체 적용', 'Apply All', '全部应用', '全ページ適用'),
                        style: const TextStyle(
                          color: Color(0xFF1E2228),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),

          // 3. 하단 필터 썸네일 스트립 (강화 / 음영 제거 / 밝게하기 / 흑백 / 반전 / 원본)
          Container(
            height: 92,
            decoration: const BoxDecoration(
              color: Color(0xFFF7F8FA),
              border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
            ),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _filterDefs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (ctx, idx) {
                final (modeKey, label) = _filterDefs[idx];
                final bool selected = curItem.mode == modeKey;
                final String thumbPath = curItem.filterThumbPaths[modeKey] ??
                    (selected
                        ? (curItem.processedPath ?? curItem.rawPath)
                        : curItem.rawPath);

                return GestureDetector(
                  onTap: () {
                    if (selected) {
                      if (modeKey != 'original') {
                        setState(() => _showStrengthSlider = !_showStrengthSlider);
                      }
                      return;
                    }
                    setState(() {
                      curItem.mode = modeKey;
                      _showOriginalCompare = false;
                    });
                    _scanWaveCtrl.forward(from: 0.0);
                    unawaited(_processPage(curItem));
                  },
                  child: Container(
                    width: 68,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: selected ? _teal : const Color(0xFFD0D5DD),
                        width: selected ? 2.2 : 1.0,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.file(
                          File(thumbPath),
                          fit: BoxFit.cover,
                        ),
                        if (selected && modeKey != 'original')
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.linear_scale,
                                color: Colors.white,
                                size: 16,
                              ),
                            ),
                          ),
                        Align(
                          alignment: Alignment.bottomCenter,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            color: selected
                                ? _teal
                                : const Color(0xCC262B33),
                            child: Text(
                              label,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // 4. 하단 액션 바 (4개 기능 균등 배치: 추가 | 다시 찍기 | 회전 | 사진 자르기 + 우측 [ ✓ ])
          Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
            ),
            padding: const EdgeInsets.fromLTRB(8, 6, 14, 8),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildBottomToolItem(
                          icon: Icons.add_a_photo_outlined,
                          label: _tr('추가', 'Add', '添加', '追加'),
                          onTap: () => _openNativeCamera(batchMode: true),
                        ),
                        _buildBottomToolItem(
                          icon: Icons.cameraswitch_outlined,
                          label: _tr('다시 찍기', 'Retake', '重拍', '撮り直し'),
                          onTap: () => _openNativeCamera(
                            batchMode: false,
                            replaceIndex: _currentEditIndex,
                          ),
                        ),
                        _buildBottomToolItem(
                          icon: Icons.rotate_left_rounded,
                          label: _tr('회전', 'Rotate', '旋转', '回転'),
                          onTap: () {
                            setState(() {
                              curItem.rotation = (curItem.rotation + 270) % 360;
                              curItem.filterThumbPaths.clear();
                            });
                            unawaited(_processPage(curItem));
                            unawaited(_generateFilterThumbnails(curItem));
                          },
                        ),
                        _buildBottomToolItem(
                          icon: Icons.crop_rotate_rounded,
                          label: _tr('사진 자르기', 'Crop', '裁剪', '切り抜き'),
                          onTap: () {
                            setState(() {
                              _draftQuad = List<double>.from(curItem.quad);
                              _isCropping = true;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // 우측 연두색 [ ✓ ] 완료(PDF 생성) 버튼
                  SizedBox(
                    width: 64,
                    height: 44,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: _teal,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: _saveAndCreatePdf,
                      child: const Icon(Icons.check_rounded, size: 26),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomToolItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    const color = Color(0xFF1E2228);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 3),
            Text(
              label,
              style: const TextStyle(
                color: color,
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 갤럭시 카메라 스타일 4점 흰색 L자 브래킷(┌ ┐ ┘ └) 종이 영역 페인터
class _TealQuadPainter extends CustomPainter {
  _TealQuadPainter({required this.quad});
  final List<double> quad;

  @override
  void paint(Canvas canvas, Size size) {
    if (quad.length != 8) return;
    final pts = <Offset>[
      Offset(quad[0] * size.width, quad[1] * size.height),
      Offset(quad[2] * size.width, quad[3] * size.height),
      Offset(quad[4] * size.width, quad[5] * size.height),
      Offset(quad[6] * size.width, quad[7] * size.height),
    ];

    final polyPath = Path()
      ..moveTo(pts[0].dx, pts[0].dy)
      ..lineTo(pts[1].dx, pts[1].dy)
      ..lineTo(pts[2].dx, pts[2].dy)
      ..lineTo(pts[3].dx, pts[3].dy)
      ..close();

    // 바깥 영역만 살짝 어둡게 처리하여 종이 영역을 돋보이게 함
    final full = Offset.zero & size;
    canvas.saveLayer(full, Paint());
    canvas.drawRect(full, Paint()..color = Colors.black.withValues(alpha: 0.38));
    canvas.drawPath(polyPath, Paint()..blendMode = BlendMode.clear);
    canvas.restore();

    // 은은한 흰색 테두리 가이드선
    final thinBorder = Paint()
      ..color = Colors.white.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawPath(polyPath, thinBorder);

    // 4개 모서리에 갤럭시 스타일 굵은 흰색 L자 브래킷 (┌ ┐ ┘ └) 표시
    final bracketPath = Path();
    const double maxArm = 28.0;
    for (int i = 0; i < 4; i++) {
      final p = pts[i];
      final prev = pts[(i + 3) % 4];
      final next = pts[(i + 1) % 4];
      final v1 = prev - p;
      final v2 = next - p;
      final l1 = v1.distance.clamp(1.0, double.infinity);
      final l2 = v2.distance.clamp(1.0, double.infinity);
      final arm = (0.24 * (l1 < l2 ? l1 : l2)).clamp(10.0, maxArm);
      final a1 = p + (v1 / l1) * arm;
      final a2 = p + (v2 / l2) * arm;
      bracketPath.moveTo(a1.dx, a1.dy);
      bracketPath.lineTo(p.dx, p.dy);
      bracketPath.lineTo(a2.dx, a2.dy);
    }

    final shadowPaint = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(bracketPath, shadowPaint);

    final bracketPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(bracketPath, bracketPaint);
  }

  @override
  bool shouldRepaint(covariant _TealQuadPainter oldDelegate) => true;
}
