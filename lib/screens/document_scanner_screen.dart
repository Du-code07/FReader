import 'dart:async';
import 'dart:io';
import 'dart:math' as math;

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

class _ScanPageItem {
  _ScanPageItem({
    required this.id,
    required this.rawPath,
    this.mode = 'scan_bw',
    this.contrast = 0.55,
    this.rotation = 0,
    this.crop = const [0.0, 0.0, 1.0, 1.0],
  });

  final String id;
  final String rawPath;
  String mode; // 'scan_bw' | 'scan_color' | 'scan_gray' | 'original'
  double contrast; // 0.0 ~ 1.0
  int rotation; // 0, 90, 180, 270
  List<double> crop; // [left, top, right, bottom] in 0..1
  String? processedPath;
  bool isProcessing = false;

  bool get hasCustomCrop =>
      crop[0] > 0.005 || crop[1] > 0.005 || crop[2] < 0.995 || crop[3] < 0.995;
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

  final List<_ScanPageItem> _pages = [];
  bool _isEditPhase = false;
  bool _continuousShoot = true; // 카메라로 여러 장 연속 촬영
  bool _isLaunchingCamera = false;
  int _currentEditIndex = 0;
  bool _showOriginalCompare = false; // 원본 비교 토글
  bool _isCropping = false; // 현재 페이지 자르기 편집 모드
  List<double> _draftCrop = [0.0, 0.0, 1.0, 1.0];

  late final PageController _pageController = PageController();
  late final AnimationController _scanWaveCtrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
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

  @override
  void initState() {
    super.initState();
    // 화면 진입 시 바로 카메라를 띄워 첫 장 촬영 시작
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _captureFromCamera(autoContinue: _continuousShoot);
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _scanWaveCtrl.dispose();
    super.dispose();
  }

  Future<void> _captureFromCamera({bool autoContinue = false}) async {
    if (_isLaunchingCamera) return;
    setState(() => _isLaunchingCamera = true);
    try {
      while (mounted) {
        final String? capturedPath =
            await _pdfChannel.invokeMethod<String>('capturePhotoWithCamera');
        if (!mounted) return;
        if (capturedPath == null || capturedPath.isEmpty) {
          break;
        }
        final file = File(capturedPath);
        if (!await file.exists()) break;

        final item = _ScanPageItem(
          id: '${DateTime.now().microsecondsSinceEpoch}_${_pages.length}',
          rawPath: capturedPath,
        );
        setState(() {
          _pages.add(item);
        });

        // 편집 화면에서 추가 촬영한 경우에는 즉시 스캔본 변환 실행 및 해당 페이지로 이동
        if (_isEditPhase) {
          final newIdx = _pages.length - 1;
          setState(() => _currentEditIndex = newIdx);
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_pageController.hasClients) {
              _pageController.jumpToPage(newIdx);
            }
          });
          unawaited(_processPage(item));
          break;
        }

        if (!autoContinue || !_continuousShoot) {
          break;
        }
      }
    } on PlatformException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _tr(
                '카메라를 열지 못했습니다: ${e.message ?? e.code}',
                'Could not open camera: ${e.message ?? e.code}',
                '无法打开相机：${e.message ?? e.code}',
                'カメラを開けませんでした: ${e.message ?? e.code}',
              ),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLaunchingCamera = false);
      }
    }
  }

  Future<void> _pickPhotosFromGallery() async {
    final res = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: true,
    );
    if (res == null || res.files.isEmpty || !mounted) return;

    final added = <_ScanPageItem>[];
    for (final pf in res.files) {
      if (pf.path == null) continue;
      final f = File(pf.path!);
      if (!await f.exists()) continue;
      final item = _ScanPageItem(
        id: '${DateTime.now().microsecondsSinceEpoch}_${_pages.length + added.length}',
        rawPath: f.path,
      );
      added.add(item);
    }
    if (added.isEmpty) return;

    setState(() {
      _pages.addAll(added);
    });

    if (_isEditPhase) {
      for (final item in added) {
        unawaited(_processPage(item));
      }
    }
  }

  Future<void> _enterEditPhase() async {
    if (_pages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _tr(
              '먼저 스캔할 문서 사진을 1장 이상 찍거나 선택해 주세요.',
              'Please take or select at least 1 photo first.',
              '请先拍摄或选择至少 1 张照片。',
              '先にスキャンする写真を1枚以上撮影または選択してください。',
            ),
          ),
        ),
      );
      return;
    }

    setState(() {
      _isEditPhase = true;
      _currentEditIndex = 0;
      _showOriginalCompare = false;
      _isCropping = false;
    });

    // 처음 편집 창에 들어갈 때 스캔 레이저 애니메이션을 1회 재생하면서 모든 사진을 스캔본으로 변환
    _scanWaveCtrl.forward(from: 0.0);
    for (final page in _pages) {
      unawaited(_processPage(page));
    }
  }

  Future<void> _processPage(_ScanPageItem item, {int maxDim = 1650}) async {
    if (!mounted) return;
    setState(() {
      item.isProcessing = true;
    });

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
          'crop': item.crop,
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
    } catch (e) {
      if (mounted) {
        setState(() => item.isProcessing = false);
      }
    }
  }

  void _applyFilterToAllPages() {
    if (_pages.isEmpty) return;
    final cur = _pages[_currentEditIndex];
    final targetMode = cur.mode;
    final targetContrast = cur.contrast;

    for (final p in _pages) {
      p.mode = targetMode;
      p.contrast = targetContrast;
      unawaited(_processPage(p));
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(milliseconds: 1400),
        content: Text(
          _tr(
            '모든 페이지(${_pages.length}장)에 현재 스캔 필터와 진하기를 적용했습니다.',
            'Applied current scan filter and darkness to all ${_pages.length} pages.',
            '已将当前扫描滤镜和浓度应用到全部 ${_pages.length} 页。',
            '全ページ(${_pages.length}枚)に現在のスキャンフィルターと濃さを適用しました。',
          ),
        ),
      ),
    );
  }

  Future<void> _exportScannedPdf() async {
    if (_pages.isEmpty) return;

    final now = DateTime.now();
    final dateStr =
        '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
    final rand4 = (1000 + math.Random().nextInt(9000)).toString();
    final defaultTitle = '스캔문서_${dateStr}_$rand4';
    final titleCtrl = TextEditingController(text: defaultTitle);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_tr('스캔본 PDF 만들기', 'Create Scanned PDF', '生成扫描 PDF', 'スキャンPDFを作成')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _tr(
                '스캔 보정된 ${_pages.length}장의 사진을 묶어 하나의 PDF 파일로 만듭니다.',
                'Bundles ${_pages.length} scanned page(s) into a single PDF file.',
                '将 ${_pages.length} 张扫描页面合并为一个 PDF 文件。',
                'スキャン補正された${_pages.length}枚の写真を1つのPDFファイルにまとめます。',
              ),
              style: const TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: titleCtrl,
              autofocus: true,
              decoration: InputDecoration(
                labelText: _tr('PDF 파일 이름', 'PDF Filename', 'PDF 文件名称', 'PDFファイル名'),
                suffixText: '.pdf',
                border: const OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(_tr('취소', 'Cancel', '取消', 'キャンセル')),
          ),
          FilledButton.icon(
            icon: const Icon(Icons.picture_as_pdf, size: 18),
            onPressed: () => Navigator.pop(ctx, true),
            label: Text(_tr('PDF 생성', 'Create PDF', '生成 PDF', 'PDF作成')),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final rawTitle = titleCtrl.text.trim().isEmpty ? defaultTitle : titleCtrl.text.trim();
    final cleanTitle = rawTitle.replaceAll(RegExp(r'\.pdf$', caseSensitive: false), '');
    final safeTitle = cleanTitle.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');

    int currentStep = 0;
    final int totalSteps = _pages.length;
    String statusText = _tr('스캔 이미지 준비 중...', 'Preparing scanned pages...', '正在准备扫描页面...', 'スキャン画像を準備中...');
    StateSetter? dialogSetState;

    _pdfChannel.setMethodCallHandler((call) async {
      if (call.method == 'onScanPdfProgress') {
        final args = call.arguments as Map?;
        if (args != null) {
          final int cur = (args['current'] as num?)?.toInt() ?? 1;
          dialogSetState?.call(() {
            currentStep = cur;
            statusText = _tr(
              'PDF 페이지 묶는 중 ($cur / $totalSteps)',
              'Building PDF page ($cur / $totalSteps)',
              '正在生成 PDF 页面 ($cur / $totalSteps)',
              'PDFページ作成中 ($cur / $totalSteps)',
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
            title: Text(_tr('스캔 PDF 생성 중', 'Creating Scanned PDF', '正在生成扫描 PDF', 'スキャンPDF作成中')),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                LinearProgressIndicator(value: currentStep > 0 ? ratio : null),
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
      // 아직 처리 중이거나 처리되지 않은 페이지가 있으면 고해상도로 처리 보장
      final finalPaths = <String>[];
      for (int i = 0; i < _pages.length; i++) {
        final p = _pages[i];
        if (p.processedPath == null || !await File(p.processedPath!).exists()) {
          await _processPage(p, maxDim: 2200);
        }
        finalPaths.add(p.processedPath ?? p.rawPath);
      }

      final appDir = await getApplicationDocumentsDirectory();
      var outPath = '${appDir.path}/$safeTitle.pdf';
      int dup = 1;
      while (await File(outPath).exists()) {
        outPath = '${appDir.path}/$safeTitle ($dup).pdf';
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
      Navigator.pop(context); // 진행 다이얼로그 닫기

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

  // ── 1단계: 사진 여러 장 촬영 및 목록 확인 화면 ───────────────────────────────
  Widget _buildCapturePhaseUI(ColorScheme cs) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _tr(
            '문서 스캔 · 사진 촬영 (${_pages.length}장)',
            'Document Scan · Capture (${_pages.length})',
            '文档扫描 · 拍照 (${_pages.length}张)',
            '文書スキャン · 撮影 (${_pages.length}枚)',
          ),
        ),
        actions: [
          if (_pages.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilledButton.icon(
                onPressed: _enterEditPhase,
                icon: const Icon(Icons.check, size: 18),
                label: Text(_tr('확인', 'Next', '确认', '確認')),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // 연속 촬영 옵션 바
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
            child: Row(
              children: [
                const Icon(Icons.camera_enhance_outlined, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _tr(
                      '연속 촬영 모드 (카메라 확인 후 다음 장 자동 촬영)',
                      'Continuous shooting (auto-open camera for next page)',
                      '连续拍摄模式（拍照确认后自动拍摄下一张）',
                      '連続撮影モード（撮影後に自動で次のページを撮影）',
                    ),
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500),
                  ),
                ),
                Switch(
                  value: _continuousShoot,
                  onChanged: (v) => setState(() => _continuousShoot = v),
                ),
              ],
            ),
          ),
          Expanded(
            child: _pages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.document_scanner_outlined,
                            size: 68,
                            color: cs.primary.withValues(alpha: 0.75),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _tr(
                              '카메라로 문서나 책을 여러 장 촬영해 주세요.\n촬영이 끝나면 [확인]을 눌러 스캔본으로 변환하고 PDF로 묶을 수 있습니다.',
                              'Take one or more photos of your documents.\nTap [Next] to convert them into clean scans and bundle into a PDF.',
                              '请使用相机拍摄多张文档照片。\n完成后点击 [确认] 即可转换为扫描件并生成 PDF。',
                              'カメラで書類や本を複数枚撮影してください。\n撮影後に[確認]を押すとスキャン補正してPDFにまとめられます。',
                            ),
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              height: 1.5,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 24),
                          FilledButton.icon(
                            onPressed: () =>
                                _captureFromCamera(autoContinue: _continuousShoot),
                            icon: const Icon(Icons.camera_alt_outlined),
                            label: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                              child: Text(
                                _tr('카메라로 촬영 시작', 'Start Camera Capture', '开始拍照扫描', 'カメラで撮影開始'),
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          OutlinedButton.icon(
                            onPressed: _pickPhotosFromGallery,
                            icon: const Icon(Icons.photo_library_outlined, size: 18),
                            label: Text(
                              _tr('갤러리에서 사진 불러오기', 'Import from Gallery', '从相册选择照片', 'ギャラリーから写真を選択'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(14),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.74,
                    ),
                    itemCount: _pages.length,
                    itemBuilder: (ctx, idx) {
                      final item = _pages[idx];
                      return Card(
                        clipBehavior: Clip.antiAlias,
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.file(
                              File(item.rawPath),
                              fit: BoxFit.cover,
                            ),
                            // 상단 페이지 번호 배지 & 삭제 버튼
                            Positioned(
                              top: 6,
                              left: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black87,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '${idx + 1}쪽',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: IconButton.filledTonal(
                                visualDensity: VisualDensity.compact,
                                style: IconButton.styleFrom(
                                  backgroundColor: Colors.black54,
                                  foregroundColor: Colors.white,
                                ),
                                icon: const Icon(Icons.close, size: 18),
                                onPressed: () {
                                  setState(() {
                                    _pages.removeAt(idx);
                                  });
                                },
                              ),
                            ),
                            // 하단 순서 변경 바
                            Positioned(
                              bottom: 0,
                              left: 0,
                              right: 0,
                              child: Container(
                                color: Colors.black54,
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    IconButton(
                                      visualDensity: VisualDensity.compact,
                                      icon: const Icon(Icons.chevron_left, color: Colors.white, size: 20),
                                      onPressed: idx > 0
                                          ? () {
                                              setState(() {
                                                final tmp = _pages.removeAt(idx);
                                                _pages.insert(idx - 1, tmp);
                                              });
                                            }
                                          : null,
                                    ),
                                    Text(
                                      '${idx + 1} / ${_pages.length}',
                                      style: const TextStyle(color: Colors.white, fontSize: 11.5),
                                    ),
                                    IconButton(
                                      visualDensity: VisualDensity.compact,
                                      icon: const Icon(Icons.chevron_right, color: Colors.white, size: 20),
                                      onPressed: idx < _pages.length - 1
                                          ? () {
                                              setState(() {
                                                final tmp = _pages.removeAt(idx);
                                                _pages.insert(idx + 1, tmp);
                                              });
                                            }
                                          : null,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          // 하단 촬영 / 갤러리 / 확인 버튼 바
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              decoration: BoxDecoration(
                color: cs.surface,
                border: Border(
                  top: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
                ),
              ),
              child: Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _captureFromCamera(autoContinue: _continuousShoot),
                    icon: const Icon(Icons.add_a_photo_outlined, size: 18),
                    label: Text(_tr('추가 촬영', 'Take Photo', '继续拍照', '追加撮影')),
                  ),
                  const SizedBox(width: 8),
                  IconButton.outlined(
                    tooltip: _tr('갤러리에서 추가', 'Add from Gallery', '从相册添加', 'ギャラリーから追加'),
                    onPressed: _pickPhotosFromGallery,
                    icon: const Icon(Icons.photo_library_outlined, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _pages.isEmpty ? null : _enterEditPhase,
                      icon: const Icon(Icons.auto_fix_high, size: 18),
                      label: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        child: Text(
                          _tr(
                            '확인 · 스캔 변환 (${_pages.length}장)',
                            'Next · Scan Edit (${_pages.length})',
                            '确认 · 扫描编辑 (${_pages.length})',
                            '確認 · スキャン編集 (${_pages.length})',
                          ),
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
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

  // ── 2단계: 사진 편집 및 스캔본 변환 화면 ──────────────────────────────────────
  Widget _buildEditPhaseUI(ColorScheme cs) {
    if (_pages.isEmpty) {
      return _buildCapturePhaseUI(cs);
    }
    _currentEditIndex = _currentEditIndex.clamp(0, _pages.length - 1);
    final curItem = _pages[_currentEditIndex];

    return Scaffold(
      backgroundColor: const Color(0xFF14181F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E242E),
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: _tr('촬영 목록으로', 'Back to Capture List', '返回拍摄列表', '撮影一覧へ戻る'),
          onPressed: () {
            if (_isCropping) {
              setState(() => _isCropping = false);
              return;
            }
            setState(() => _isEditPhase = false);
          },
        ),
        title: Text(
          _tr(
            '스캔 편집 (${_currentEditIndex + 1} / ${_pages.length}쪽)',
            'Scan Editor (${_currentEditIndex + 1} / ${_pages.length})',
            '扫描编辑 (${_currentEditIndex + 1} / ${_pages.length})',
            'スキャン編集 (${_currentEditIndex + 1} / ${_pages.length})',
          ),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: [
          // 원본 vs 스캔본 즉시 비교 토글 버튼
          TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: _showOriginalCompare ? Colors.amber : Colors.white70,
            ),
            onPressed: () => setState(() => _showOriginalCompare = !_showOriginalCompare),
            icon: Icon(
              _showOriginalCompare ? Icons.visibility : Icons.compare_rounded,
              size: 18,
            ),
            label: Text(
              _showOriginalCompare
                  ? _tr('원본 보는 중', 'Showing Raw', '正在看原图', '元画像表示中')
                  : _tr('원본 비교', 'Compare Raw', '对比原图', '元画像と比較'),
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
          ),
          IconButton(
            tooltip: _tr('사진 추가 촬영', 'Add Photo', '添加拍照', '写真を追加撮影'),
            icon: const Icon(Icons.add_a_photo_outlined, size: 20),
            onPressed: () => _captureFromCamera(autoContinue: false),
          ),
          IconButton(
            tooltip: _tr('현재 페이지 삭제', 'Delete Page', '删除当前页', '現在のページを削除'),
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 21),
            onPressed: () {
              setState(() {
                _pages.removeAt(_currentEditIndex);
                if (_pages.isEmpty) {
                  _isEditPhase = false;
                } else if (_currentEditIndex >= _pages.length) {
                  _currentEditIndex = _pages.length - 1;
                }
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // 중앙 메인 미리보기 영역 (스캔본 변환 결과 또는 자르기 편집 창)
          Expanded(
            child: _isCropping
                ? _buildInteractiveCropView(curItem)
                : PageView.builder(
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
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // 문서 스캔 미리보기 이미지 (확대/축소 가능)
                            InteractiveViewer(
                              minScale: 1.0,
                              maxScale: 4.0,
                              child: AnimatedSwitcher(
                                duration: const Duration(milliseconds: 280),
                                child: Image.file(
                                  File(displayPath),
                                  key: ValueKey('$displayPath:${page.mode}:${page.contrast}'),
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                            // 스캔 레이저 효과 & 변환 중 표시
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
                                              height: 4,
                                              decoration: BoxDecoration(
                                                color: Colors.cyanAccent,
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.cyanAccent
                                                        .withValues(alpha: 0.7),
                                                    blurRadius: 16,
                                                    spreadRadius: 4,
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        if (page.isProcessing)
                                          Center(
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 16,
                                                vertical: 10,
                                              ),
                                              decoration: BoxDecoration(
                                                color: Colors.black87,
                                                borderRadius: BorderRadius.circular(24),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const SizedBox(
                                                    width: 18,
                                                    height: 18,
                                                    child: CircularProgressIndicator(
                                                      strokeWidth: 2.2,
                                                      color: Colors.amber,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 10),
                                                  Text(
                                                    _tr(
                                                      '스캔본으로 변환 중...',
                                                      'Converting to scan...',
                                                      '正在转换为扫描件...',
                                                      'スキャン画像に変換中...',
                                                    ),
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w600,
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
                            // 상태 배지 (스캔본 적용됨 vs 원본 사진)
                            Positioned(
                              top: 8,
                              left: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: showRaw
                                      ? Colors.orange.shade800.withValues(alpha: 0.9)
                                      : Colors.teal.shade700.withValues(alpha: 0.9),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      showRaw ? Icons.photo_outlined : Icons.auto_fix_high,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      showRaw
                                          ? _tr('원본 사진', 'Original Photo', '原始照片', '元の写真')
                                          : _modeLabel(page.mode),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // 페이지 썸네일 스트립 (2장 이상일 때)
          if (!_isCropping && _pages.length > 1)
            SizedBox(
              height: 68,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                scrollDirection: Axis.horizontal,
                itemCount: _pages.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (ctx, idx) {
                  final p = _pages[idx];
                  final selected = idx == _currentEditIndex;
                  final thumbPath = p.processedPath ?? p.rawPath;
                  return GestureDetector(
                    onTap: () {
                      setState(() => _currentEditIndex = idx);
                      _pageController.animateToPage(
                        idx,
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOutCubic,
                      );
                    },
                    child: Container(
                      width: 48,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: selected ? Colors.amber : Colors.white24,
                          width: selected ? 2.5 : 1.0,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.file(File(thumbPath), fit: BoxFit.cover),
                          Align(
                            alignment: Alignment.bottomCenter,
                            child: Container(
                              width: double.infinity,
                              color: Colors.black54,
                              padding: const EdgeInsets.symmetric(vertical: 1),
                              child: Text(
                                '${idx + 1}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
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

          // 하단 스캔 필터·진하기·회전·자르기·PDF 생성 컨트롤 패널
          if (!_isCropping)
            Container(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
              decoration: const BoxDecoration(
                color: Color(0xFF1E242E),
                borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // 1. 스캔 필터 4종 선택 칩 + 전체 페이지 적용 버튼
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          for (final opt in <(String, String, IconData)>[
                            (
                              'scan_bw',
                              _tr('스캔본 (선명)', 'Clean Scan (B&W)', '清晰扫描 (黑白)', '鮮明スキャン'),
                              Icons.document_scanner_outlined
                            ),
                            (
                              'scan_color',
                              _tr('컬러 스캔', 'Color Scan', '彩色扫描', 'カラースキャン'),
                              Icons.palette_outlined
                            ),
                            (
                              'scan_gray',
                              _tr('회색조 문서', 'Grayscale', '灰度文档', 'グレースケール'),
                              Icons.tonality_outlined
                            ),
                            (
                              'original',
                              _tr('원본 사진', 'Original', '原图', '元の写真'),
                              Icons.image_outlined
                            ),
                          ])
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                avatar: Icon(
                                  opt.$3,
                                  size: 16,
                                  color: curItem.mode == opt.$1
                                      ? Colors.black
                                      : Colors.white70,
                                ),
                                label: Text(opt.$2),
                                selected: curItem.mode == opt.$1,
                                selectedColor: Colors.amber,
                                backgroundColor: Colors.white10,
                                labelStyle: TextStyle(
                                  color: curItem.mode == opt.$1
                                      ? Colors.black
                                      : Colors.white,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                ),
                                showCheckmark: false,
                                onSelected: (_) {
                                  setState(() {
                                    curItem.mode = opt.$1;
                                    _showOriginalCompare = false;
                                  });
                                  _scanWaveCtrl.forward(from: 0.0);
                                  unawaited(_processPage(curItem));
                                },
                              ),
                            ),
                          if (_pages.length > 1)
                            ActionChip(
                              avatar: const Icon(Icons.done_all, size: 16, color: Colors.amber),
                              label: Text(
                                _tr('전체 적용', 'Apply All', '全部应用', '全ページ適用'),
                                style: const TextStyle(color: Colors.white, fontSize: 12),
                              ),
                              backgroundColor: Colors.white12,
                              onPressed: _applyFilterToAllPages,
                            ),
                        ],
                      ),
                    ),
                    // 2. 글자 진하기(선명도) 조절 슬라이더 (원본 모드가 아닐 때)
                    if (curItem.mode != 'original') ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.contrast, color: Colors.white70, size: 17),
                          const SizedBox(width: 6),
                          Text(
                            _tr('글자 진하기', 'Ink Darkness', '字迹浓度', '文字の濃さ'),
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                          Expanded(
                            child: SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                activeTrackColor: Colors.amber,
                                thumbColor: Colors.amber,
                                inactiveTrackColor: Colors.white24,
                              ),
                              child: Slider(
                                value: curItem.contrast,
                                min: 0.10,
                                max: 0.95,
                                onChanged: (v) {
                                  setState(() => curItem.contrast = v);
                                },
                                onChangeEnd: (_) {
                                  unawaited(_processPage(curItem));
                                },
                              ),
                            ),
                          ),
                          Text(
                            '${(curItem.contrast * 100).round()}%',
                            style: const TextStyle(
                              color: Colors.amber,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 6),
                    // 3. 회전 / 자르기 / PDF로 묶기 액션 바
                    Row(
                      children: [
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white24),
                          ),
                          onPressed: () {
                            setState(() {
                              curItem.rotation = (curItem.rotation + 90) % 360;
                            });
                            unawaited(_processPage(curItem));
                          },
                          icon: const Icon(Icons.rotate_right, size: 18),
                          label: Text(_tr('90° 회전', 'Rotate', '旋转', '回転')),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor:
                                curItem.hasCustomCrop ? Colors.amber : Colors.white,
                            side: BorderSide(
                              color: curItem.hasCustomCrop
                                  ? Colors.amber
                                  : Colors.white24,
                            ),
                          ),
                          onPressed: () {
                            setState(() {
                              _draftCrop = List<double>.from(curItem.crop);
                              _isCropping = true;
                            });
                          },
                          icon: const Icon(Icons.crop, size: 18),
                          label: Text(_tr('자르기', 'Crop', '裁剪', '切り抜き')),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.amber,
                              foregroundColor: Colors.black,
                            ),
                            onPressed: _exportScannedPdf,
                            icon: const Icon(Icons.picture_as_pdf, size: 19),
                            label: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              child: Text(
                                _tr(
                                  'PDF로 만들기 (${_pages.length}쪽)',
                                  'Save as PDF (${_pages.length}p)',
                                  '生成 PDF (${_pages.length}页)',
                                  'PDFを作成 (${_pages.length}p)',
                                ),
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── 자르기(Crop) 인터랙티브 편집 위젯 ──────────────────────────────────────
  Widget _buildInteractiveCropView(_ScanPageItem item) {
    return Column(
      children: [
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
                    ),
                    // 드래그 가능한 자르기 박스 오버레이
                    Positioned.fill(
                      child: CustomPaint(
                        painter: _CropBoxPainter(crop: _draftCrop),
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onPanUpdate: (details) {
                            final dx = details.delta.dx / math.max(1.0, maxW);
                            final dy = details.delta.dy / math.max(1.0, maxH);
                            final pos = details.localPosition;
                            final nx = (pos.dx / math.max(1.0, maxW)).clamp(0.0, 1.0);
                            final ny = (pos.dy / math.max(1.0, maxH)).clamp(0.0, 1.0);

                            final cx = (_draftCrop[0] + _draftCrop[2]) * 0.5;
                            final cy = (_draftCrop[1] + _draftCrop[3]) * 0.5;

                            setState(() {
                              if (nx < cx) {
                                _draftCrop[0] =
                                    (_draftCrop[0] + dx).clamp(0.0, _draftCrop[2] - 0.12);
                              } else {
                                _draftCrop[2] =
                                    (_draftCrop[2] + dx).clamp(_draftCrop[0] + 0.12, 1.0);
                              }
                              if (ny < cy) {
                                _draftCrop[1] =
                                    (_draftCrop[1] + dy).clamp(0.0, _draftCrop[3] - 0.12);
                              } else {
                                _draftCrop[3] =
                                    (_draftCrop[3] + dy).clamp(_draftCrop[1] + 0.12, 1.0);
                              }
                            });
                          },
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
          color: const Color(0xFF1E242E),
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                TextButton.icon(
                  style: TextButton.styleFrom(foregroundColor: Colors.white70),
                  onPressed: () {
                    setState(() => _draftCrop = [0.06, 0.06, 0.94, 0.94]);
                  },
                  icon: const Icon(Icons.filter_center_focus, size: 18),
                  label: Text(_tr('문서 여백 안쪽', 'Inset Margin', '内缩边距', '余白を内側へ')),
                ),
                TextButton.icon(
                  style: TextButton.styleFrom(foregroundColor: Colors.white70),
                  onPressed: () {
                    setState(() => _draftCrop = [0.0, 0.0, 1.0, 1.0]);
                  },
                  icon: const Icon(Icons.fullscreen, size: 18),
                  label: Text(_tr('전체 영역', 'Reset Full', '重置全图', '全体に戻す')),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () => setState(() => _isCropping = false),
                  child: Text(
                    _tr('취소', 'Cancel', '取消', 'キャンセル'),
                    style: const TextStyle(color: Colors.white70),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.amber,
                    foregroundColor: Colors.black,
                  ),
                  onPressed: () {
                    setState(() {
                      item.crop = List<double>.from(_draftCrop);
                      _isCropping = false;
                    });
                    unawaited(_processPage(item));
                  },
                  icon: const Icon(Icons.check, size: 18),
                  label: Text(
                    _tr('자르기 적용', 'Apply Crop', '应用裁剪', '切り抜き適用'),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _modeLabel(String mode) {
    switch (mode) {
      case 'scan_bw':
        return _tr('스캔본 (선명 문서)', 'Clean Scan (B&W)', '清晰扫描件', '鮮明スキャン');
      case 'scan_color':
        return _tr('컬러 스캔본', 'Color Scan', '彩色扫描件', 'カラースキャン');
      case 'scan_gray':
        return _tr('회색조 스캔본', 'Grayscale Scan', '灰度扫描件', 'グレースケール');
      default:
        return _tr('원본 사진', 'Original Photo', '原始照片', '元の写真');
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return _isEditPhase ? _buildEditPhaseUI(cs) : _buildCapturePhaseUI(cs);
  }
}

class _CropBoxPainter extends CustomPainter {
  _CropBoxPainter({required this.crop});
  final List<double> crop;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTRB(
      crop[0] * size.width,
      crop[1] * size.height,
      crop[2] * size.width,
      crop[3] * size.height,
    );

    final bgPaint = Paint()..color = Colors.black.withValues(alpha: 0.55);
    final full = Offset.zero & size;
    canvas.saveLayer(full, Paint());
    canvas.drawRect(full, bgPaint);
    canvas.drawRect(rect, Paint()..blendMode = BlendMode.clear);
    canvas.restore();

    final borderPaint = Paint()
      ..color = Colors.amber
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawRect(rect, borderPaint);

    // 3x3 가이드 그리드
    final gridPaint = Paint()
      ..color = Colors.amber.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (int i = 1; i <= 2; i++) {
      final dx = rect.left + rect.width * (i / 3.0);
      final dy = rect.top + rect.height * (i / 3.0);
      canvas.drawLine(Offset(dx, rect.top), Offset(dx, rect.bottom), gridPaint);
      canvas.drawLine(Offset(rect.left, dy), Offset(rect.right, dy), gridPaint);
    }

    // 네 모서리 핸들
    final handlePaint = Paint()
      ..color = Colors.amber
      ..style = PaintingStyle.fill;
    for (final pt in [
      rect.topLeft,
      rect.topRight,
      rect.bottomLeft,
      rect.bottomRight,
    ]) {
      canvas.drawCircle(pt, 8.0, handlePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _CropBoxPainter oldDelegate) => true;
}
