import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:archive/archive.dart';
import 'package:xml/xml.dart';
import 'txt_reader_service.dart';
import 'epub_validation.dart';

class _DocStyleInfo {
  double fontSizePt;
  bool bold;
  bool italic;
  bool underline;
  bool serif;
  String align;
  int textColor;
  double leftIndentPt;

  _DocStyleInfo({
    this.fontSizePt = 10.5,
    this.bold = false,
    this.italic = false,
    this.underline = false,
    this.serif = false,
    this.align = 'left',
    this.textColor = 0xFF141414,
    this.leftIndentPt = 0.0,
  });

  _DocStyleInfo copy() => _DocStyleInfo(
        fontSizePt: fontSizePt,
        bold: bold,
        italic: italic,
        underline: underline,
        serif: serif,
        align: align,
        textColor: textColor,
        leftIndentPt: leftIndentPt,
      );
}

class TxtToEpubConverter {
  static Future<File> convertTxtToEpub(File txtFile) async {
    return convertDocumentToEpub(txtFile);
  }

  static bool _isSerifFontName(String name) {
    final lower = name.toLowerCase();
    return lower.contains('바탕') ||
        lower.contains('명조') ||
        lower.contains('궁서') ||
        lower.contains('신명조') ||
        lower.contains('batang') ||
        lower.contains('myeongjo') ||
        lower.contains('gungsuh') ||
        lower.contains('serif') ||
        lower.contains('times') ||
        lower.contains('ming') ||
        lower.contains('song') ||
        lower.contains('mincho');
  }

  static int? _parseHexColor(String? hexStr) {
    if (hexStr == null) return null;
    final clean = hexStr.trim().replaceAll('#', '');
    if (clean.isEmpty || clean.toLowerCase() == 'auto' || clean.toLowerCase() == 'none') {
      return null;
    }
    if (clean.length == 6) {
      final v = int.tryParse(clean, radix: 16);
      if (v != null) return 0xFF000000 | v;
    } else if (clean.length == 8) {
      final v = int.tryParse(clean, radix: 16);
      if (v != null) return v;
    }
    return null;
  }

  // =========================================================================
  // XML 태그 밸런스 파서 (Self-closing 태그 및 중첩 표/단락 100% 정확 분리)
  // =========================================================================
  static bool _isExactTagMatch(String xml, int pos, String tag) {
    if (!xml.startsWith(tag, pos)) return false;
    final afterIdx = pos + tag.length;
    if (afterIdx >= xml.length) return false;
    final ch = xml[afterIdx];
    return ch == '>' || ch == ' ' || ch == '/' || ch == '\t' || ch == '\r' || ch == '\n';
  }

  static int _findBalancedXmlTagEnd(String xml, int startIdx, String tagName) {
    final firstGt = xml.indexOf('>', startIdx);
    if (firstGt == -1) return -1;
    if (xml[firstGt - 1] == '/') {
      return firstGt + 1;
    }

    final openPattern = '<$tagName';
    final closePattern = '</$tagName>';
    int depth = 1;
    int i = firstGt + 1;

    while (i < xml.length) {
      final nextOpen = xml.indexOf(openPattern, i);
      final nextClose = xml.indexOf(closePattern, i);
      if (nextClose == -1) return -1;

      if (nextOpen != -1 && nextOpen < nextClose) {
        if (_isExactTagMatch(xml, nextOpen, openPattern)) {
          final gt = xml.indexOf('>', nextOpen);
          if (gt == -1) return -1;
          if (xml[gt - 1] != '/') {
            depth++;
          }
          i = gt + 1;
          continue;
        }
        i = nextOpen + openPattern.length;
        continue;
      } else {
        depth--;
        if (depth == 0) {
          return nextClose + closePattern.length;
        }
        i = nextClose + closePattern.length;
      }
    }
    return -1;
  }

  static List<String> _findDirectXmlTagBlocks(String xml, String tagName) {
    final List<String> results = [];
    final openPattern = '<$tagName';
    int i = 0;
    while (i < xml.length) {
      final nextIdx = xml.indexOf(openPattern, i);
      if (nextIdx == -1) break;
      if (!_isExactTagMatch(xml, nextIdx, openPattern)) {
        i = nextIdx + openPattern.length;
        continue;
      }
      final endIdx = _findBalancedXmlTagEnd(xml, nextIdx, tagName);
      if (endIdx == -1) break;
      results.add(xml.substring(nextIdx, endIdx));
      i = endIdx;
    }
    return results;
  }

  // =========================================================================
  // 1. 워드(.docx) 고정밀 파서 (word/styles.xml + 단락 서식 + 표 병합/너비/배경 + 이미지)
  // =========================================================================
  static List<Map<String, dynamic>> _extractDocxStructuredBlocks(List<int> bytes) {
    final List<Map<String, dynamic>> blocks = [];
    final archive = ZipDecoder().decodeBytes(bytes);

    final Map<String, Uint8List> mediaByTarget = {};
    for (final file in archive) {
      if (!file.isFile) continue;
      final lower = file.name.toLowerCase();
      if (lower.startsWith('word/media/') &&
          (lower.endsWith('.png') ||
              lower.endsWith('.jpg') ||
              lower.endsWith('.jpeg') ||
              lower.endsWith('.bmp') ||
              lower.endsWith('.gif') ||
              lower.endsWith('.webp'))) {
        final raw = file.content as List<int>;
        final data = Uint8List.fromList(raw);
        final relKey = file.name.substring('word/'.length);
        mediaByTarget[relKey] = data;
        mediaByTarget[file.name] = data;
        mediaByTarget[file.name.split('/').last] = data;
      }
    }

    final Map<String, Uint8List> rIdToImage = {};
    for (final file in archive) {
      if (file.isFile && file.name == 'word/_rels/document.xml.rels') {
        final relXml = utf8.decode(file.content as List<int>, allowMalformed: true);
        for (final m in RegExp(r'<Relationship\b[^>]*>', dotAll: true).allMatches(relXml)) {
          final tag = m.group(0) ?? '';
          final idMatch = RegExp(r'\bId="([^"]+)"').firstMatch(tag);
          final targetMatch = RegExp(r'\bTarget="([^"]+)"').firstMatch(tag);
          if (idMatch != null && targetMatch != null) {
            final rId = idMatch.group(1)!;
            String target = targetMatch.group(1)!;
            if (target.startsWith('/word/')) {
              target = target.substring('/word/'.length);
            } else if (target.startsWith('word/')) {
              target = target.substring('word/'.length);
            }
            final img = mediaByTarget[target] ?? mediaByTarget[target.split('/').last];
            if (img != null) {
              rIdToImage[rId] = img;
            }
          }
        }
      }
    }

    // word/styles.xml 파싱 (기본 글꼴 및 스타일별 글자 크기/정렬/굵기)
    final Map<String, _DocStyleInfo> styleMap = {};
    final defaultStyle = _DocStyleInfo(fontSizePt: 10.5, serif: false);
    for (final file in archive) {
      if (file.isFile && file.name == 'word/styles.xml') {
        final stylesXml = utf8.decode(file.content as List<int>, allowMalformed: true);
        final docDefaultsM = RegExp(r'<w:docDefaults>(.*?)</w:docDefaults>', dotAll: true).firstMatch(stylesXml);
        if (docDefaultsM != null) {
          _applyDocxPropsToStyle(docDefaultsM.group(1) ?? '', defaultStyle);
        }
        for (final sBlock in _findDirectXmlTagBlocks(stylesXml, 'w:style')) {
          final idM = RegExp(r'\bw:styleId="([^"]+)"').firstMatch(sBlock);
          if (idM != null) {
            final st = defaultStyle.copy();
            _applyDocxPropsToStyle(sBlock, st);
            styleMap[idM.group(1)!] = st;
          }
        }
      }
    }

    final Set<Uint8List> emittedImages = {};

    for (final file in archive) {
      if (file.isFile && file.name == 'word/document.xml') {
        String xml = utf8.decode(file.content as List<int>, allowMalformed: true);
        // Word <mc:AlternateContent> 내부의 중복 <mc:Fallback> 제거
        xml = xml.replaceAll(RegExp(r'<mc:Fallback\b[^>]*>.*?</mc:Fallback>', dotAll: true), '');
        final bodyStart = xml.indexOf('<w:body');
        final bodyXml = bodyStart != -1 ? xml.substring(bodyStart) : xml;

        int pos = 0;
        while (pos < bodyXml.length) {
          final nextTbl = _findNextExactTag(bodyXml, pos, '<w:tbl');
          final nextP = _findNextExactTag(bodyXml, pos, '<w:p');

          if (nextTbl == -1 && nextP == -1) break;

          if (nextTbl != -1 && (nextP == -1 || nextTbl < nextP)) {
            final endTbl = _findBalancedXmlTagEnd(bodyXml, nextTbl, 'w:tbl');
            if (endTbl == -1) break;
            final tblXml = bodyXml.substring(nextTbl, endTbl);
            final tableBlock = _parseDocxRichTable(
              tblXml,
              defaultStyle,
              styleMap,
              rIdToImage,
              emittedImages,
            );
            if (tableBlock != null) {
              blocks.add(tableBlock);
            }
            pos = endTbl;
          } else {
            final endP = _findBalancedXmlTagEnd(bodyXml, nextP, 'w:p');
            if (endP == -1) break;
            final pXml = bodyXml.substring(nextP, endP);
            // 만약 문단(<w:p>) 내부의 글상자(<w:txbxContent>) 등에 표(<w:tbl>)가 들어 있다면 표를 분리하여 렌더링!
            final innerTbls = _findDirectXmlTagBlocks(pXml, 'w:tbl');
            String pWithoutTbls = pXml;
            for (final itb in innerTbls) {
              pWithoutTbls = pWithoutTbls.replaceFirst(itb, '');
            }
            final pBlock = _parseDocxRichParagraph(pWithoutTbls, defaultStyle, styleMap);
            if (pBlock != null) {
              blocks.add(pBlock);
            }
            for (final itb in innerTbls) {
              final tbBlock = _parseDocxRichTable(
                itb,
                defaultStyle,
                styleMap,
                rIdToImage,
                emittedImages,
              );
              if (tbBlock != null) {
                blocks.add(tbBlock);
              }
            }
            for (final rm in RegExp(r'r:(?:embed|id)="(rId[^"]+)"').allMatches(pXml)) {
              final rid = rm.group(1)!;
              final img = rIdToImage[rid];
              if (img != null && !emittedImages.contains(img)) {
                emittedImages.add(img);
                blocks.add({'type': 'image', 'bytes': img});
              }
            }
            pos = endP;
          }
        }
      }
    }

    for (final img in mediaByTarget.values.toSet()) {
      if (!emittedImages.contains(img)) {
        emittedImages.add(img);
        blocks.add({'type': 'image', 'bytes': img});
      }
    }

    return blocks;
  }

  static int _findNextExactTag(String xml, int startPos, String openTag) {
    int p = startPos;
    while (p < xml.length) {
      final idx = xml.indexOf(openTag, p);
      if (idx == -1) return -1;
      if (_isExactTagMatch(xml, idx, openTag)) return idx;
      p = idx + openTag.length;
    }
    return -1;
  }

  static void _applyDocxPropsToStyle(String xmlFragment, _DocStyleInfo style) {
    final jcM = RegExp(r'<w:jc\s+w:val="([^"]+)"').firstMatch(xmlFragment);
    if (jcM != null) {
      final v = jcM.group(1)!.toLowerCase();
      if (v == 'center') {
        style.align = 'center';
      } else if (v == 'right' || v == 'end') {
        style.align = 'right';
      } else if (v == 'both' || v == 'distribute') {
        style.align = 'justify';
      } else {
        style.align = 'left';
      }
    }

    final szM = RegExp(r'<w:sz\s+w:val="(\d+)"').firstMatch(xmlFragment);
    if (szM != null) {
      final halfPts = int.tryParse(szM.group(1)!) ?? 21;
      style.fontSizePt = (halfPts / 2.0).clamp(7.5, 36.0);
    }

    if (RegExp(r'<w:b(?:\s*/>|\s+w:val="(?:true|1)"\s*/>|>)', dotAll: true).hasMatch(xmlFragment)) {
      style.bold = true;
    }
    if (RegExp(r'<w:i(?:\s*/>|\s+w:val="(?:true|1)"\s*/>|>)', dotAll: true).hasMatch(xmlFragment)) {
      style.italic = true;
    }
    if (RegExp(r'<w:u\s+w:val="(?!none)[^"]+"').hasMatch(xmlFragment)) {
      style.underline = true;
    }

    final colorM = RegExp(r'<w:color\s+w:val="([0-9A-Fa-f]{6})"').firstMatch(xmlFragment);
    if (colorM != null) {
      final c = _parseHexColor(colorM.group(1));
      if (c != null) style.textColor = c;
    }

    final fontM = RegExp(r'<w:rFonts\b[^>]*>').firstMatch(xmlFragment);
    if (fontM != null) {
      final tag = fontM.group(0) ?? '';
      if (_isSerifFontName(tag)) {
        style.serif = true;
      }
    }

    final indM = RegExp(r'<w:ind\b[^>]*w:left="(\d+)"').firstMatch(xmlFragment);
    if (indM != null) {
      final twips = int.tryParse(indM.group(1)!) ?? 0;
      style.leftIndentPt = (twips / 20.0).clamp(0.0, 120.0);
    }
  }

  static Map<String, dynamic>? _parseDocxRichParagraph(
    String pXml,
    _DocStyleInfo defaultStyle,
    Map<String, _DocStyleInfo> styleMap,
  ) {
    final st = defaultStyle.copy();
    final pStyleM = RegExp(r'<w:pStyle\s+w:val="([^"]+)"').firstMatch(pXml);
    if (pStyleM != null) {
      final base = styleMap[pStyleM.group(1)!];
      if (base != null) {
        st.fontSizePt = base.fontSizePt;
        st.bold = base.bold;
        st.italic = base.italic;
        st.underline = base.underline;
        st.serif = base.serif;
        st.align = base.align;
        st.textColor = base.textColor;
      }
    }
    _applyDocxPropsToStyle(pXml, st);

    final text = _extractDocxParagraphText(pXml);
    if (text.isEmpty) {
      return null;
    }
    return {
      'type': 'paragraph',
      'text': text,
      'fontSizePt': st.fontSizePt,
      'bold': st.bold,
      'italic': st.italic,
      'underline': st.underline,
      'serif': st.serif,
      'align': st.align,
      'textColor': st.textColor,
      'leftIndentPt': st.leftIndentPt,
    };
  }

  static Map<String, dynamic>? _parseDocxRichTable(
    String tblXml,
    _DocStyleInfo defaultStyle,
    Map<String, _DocStyleInfo> styleMap,
    Map<String, Uint8List> rIdToImage,
    Set<Uint8List> emittedImages,
  ) {
    final List<double> gridColWidths = [];
    final tblGridM = RegExp(r'<w:tblGrid>(.*?)</w:tblGrid>', dotAll: true).firstMatch(tblXml);
    if (tblGridM != null) {
      for (final colM in RegExp(r'<w:gridCol\b[^>]*w:w="(\d+)"').allMatches(tblGridM.group(1) ?? '')) {
        final w = double.tryParse(colM.group(1)!) ?? 1000.0;
        gridColWidths.add(math.max(100.0, w));
      }
    }

    final trBlocks = _findDirectXmlTagBlocks(tblXml, 'w:tr');
    if (trBlocks.isEmpty) return null;

    final int numRows = trBlocks.length;
    int maxCols = gridColWidths.length;

    // 1차 스캔: 총 열 개수(maxCols) 파악
    for (final trXml in trBlocks) {
      final tcBlocks = _findDirectXmlTagBlocks(trXml, 'w:tc');
      int colsInRow = 0;
      for (final tcXml in tcBlocks) {
        final spanM = RegExp(r'<w:gridSpan\s+w:val="(\d+)"').firstMatch(tcXml);
        final span = spanM != null ? (int.tryParse(spanM.group(1)!) ?? 1) : 1;
        colsInRow += math.max(1, span);
      }
      if (colsInRow > maxCols) maxCols = colsInRow;
    }
    if (maxCols <= 0) return null;

    final List<double> colWidths = List<double>.filled(maxCols, 1.0);
    if (gridColWidths.length == maxCols) {
      for (int i = 0; i < maxCols; i++) {
        colWidths[i] = gridColWidths[i];
      }
    }

    // 2D 점유 및 vMerge(수직 병합) 추적
    final List<List<Map<String, dynamic>?>> activeVMergeMasterByCol =
        List.generate(maxCols, (_) => List.filled(numRows, null));
    final List<Map<String, dynamic>> cells = [];

    for (int r = 0; r < numRows; r++) {
      final trXml = trBlocks[r];
      double rowMinHeightPt = 20.0;
      final trHeightM = RegExp(r'<w:trHeight\b[^>]*w:val="(\d+)"').firstMatch(trXml);
      if (trHeightM != null) {
        final twips = int.tryParse(trHeightM.group(1)!) ?? 400;
        rowMinHeightPt = (twips / 20.0).clamp(16.0, 260.0);
      }

      final tcBlocks = _findDirectXmlTagBlocks(trXml, 'w:tc');
      int curCol = 0;

      for (final tcXml in tcBlocks) {
        if (curCol >= maxCols) break;
        final tcPrM = RegExp(r'<w:tcPr>(.*?)</w:tcPr>', dotAll: true).firstMatch(tcXml);
        final tcPrXml = tcPrM?.group(1) ?? '';

        final spanM = RegExp(r'<w:gridSpan\s+w:val="(\d+)"').firstMatch(tcPrXml);
        final int colSpan = (spanM != null ? (int.tryParse(spanM.group(1)!) ?? 1) : 1)
            .clamp(1, maxCols - curCol);

        // tcW 열 너비 보정 (tblGrid가 없을 때)
        if (gridColWidths.length != maxCols && colSpan == 1) {
          final tcWM = RegExp(r'<w:tcW\b[^>]*w:w="(\d+)"').firstMatch(tcPrXml);
          if (tcWM != null) {
            final wVal = double.tryParse(tcWM.group(1)!) ?? 0.0;
            if (wVal > 50.0) colWidths[curCol] = wVal;
          }
        }

        // 수직 병합(<w:vMerge/>) 확인
        final bool hasVMergeTag = RegExp(r'<w:vMerge\b').hasMatch(tcPrXml);
        final bool isVMergeRestart = RegExp(r'<w:vMerge\s+w:val="restart"').hasMatch(tcPrXml);
        final bool isVMergeContinue = hasVMergeTag && !isVMergeRestart;

        if (isVMergeContinue && r > 0 && activeVMergeMasterByCol[curCol][r - 1] != null) {
          final masterCell = activeVMergeMasterByCol[curCol][r - 1]!;
          masterCell['rowSpan'] = (masterCell['rowSpan'] as int) + 1;
          final extraText = _extractDocxCellText(tcXml);
          if (extraText.isNotEmpty) {
            final prev = masterCell['text'] as String;
            masterCell['text'] = prev.isEmpty ? extraText : '$prev\n$extraText';
          }
          for (int c = curCol; c < curCol + colSpan && c < maxCols; c++) {
            activeVMergeMasterByCol[c][r] = masterCell;
          }
          curCol += colSpan;
          continue;
        }

        int? bgColor;
        final shdM = RegExp(r'<w:shd\b[^>]*w:fill="([0-9A-Fa-f]{6})"').firstMatch(tcPrXml);
        if (shdM != null) {
          final hex = shdM.group(1)!.toUpperCase();
          if (hex != 'FFFFFF' && hex != '000000') {
            bgColor = _parseHexColor(hex);
          }
        }

        String vAlign = 'middle';
        final vAlignM = RegExp(r'<w:vAlign\s+w:val="([^"]+)"').firstMatch(tcPrXml);
        if (vAlignM != null) {
          final v = vAlignM.group(1)!.toLowerCase();
          if (v == 'top') vAlign = 'top';
          if (v == 'bottom') vAlign = 'bottom';
        }

        final cellStyle = defaultStyle.copy()..fontSizePt = 9.5;
        _applyDocxPropsToStyle(tcXml, cellStyle);

        final cellText = _extractDocxCellText(tcXml);
        final cellImages = <Uint8List>[];
        for (final rm in RegExp(r'r:(?:embed|id)="(rId[^"]+)"').allMatches(tcXml)) {
          final rid = rm.group(1)!;
          final img = rIdToImage[rid];
          if (img != null) {
            emittedImages.add(img);
            cellImages.add(img);
          }
        }

        final cellMap = <String, dynamic>{
          'row': r,
          'col': curCol,
          'rowSpan': 1,
          'colSpan': colSpan,
          'text': cellText,
          'align': cellStyle.align,
          'vAlign': vAlign,
          'bold': cellStyle.bold,
          'serif': cellStyle.serif,
          'fontSizePt': cellStyle.fontSizePt.clamp(7.5, 22.0),
          'textColor': cellStyle.textColor,
          'bgColor': bgColor,
          'minHeightPt': rowMinHeightPt,
          if (cellImages.isNotEmpty) 'images': cellImages,
        };

        cells.add(cellMap);
        for (int c = curCol; c < curCol + colSpan && c < maxCols; c++) {
          activeVMergeMasterByCol[c][r] = cellMap;
        }
        curCol += colSpan;
      }
    }

    if (cells.isEmpty) return null;
    return {
      'type': 'table',
      'numRows': numRows,
      'numCols': maxCols,
      'colWidths': colWidths,
      'cells': cells,
    };
  }

  static String _extractDocxCellText(String tcXml) {
    final pBlocks = _findDirectXmlTagBlocks(tcXml, 'w:p');
    if (pBlocks.isEmpty) {
      return _extractDocxParagraphText(tcXml);
    }
    final lines = <String>[];
    for (final p in pBlocks) {
      final t = _extractDocxParagraphText(p);
      if (t.isNotEmpty) lines.add(t);
    }
    return lines.join('\n');
  }

  static String _extractDocxParagraphText(String pXml) {
    // Tabs and breaks are siblings of w:t, not inside it. Preserve their order.
    final buf = StringBuffer();
    final xml = XmlDocument.parse(pXml);
    for (final node in xml.descendants.whereType<XmlElement>()) {
      switch (node.name.qualified) {
        case 'w:t':
          buf.write(node.innerText);
          break;
        case 'w:tab':
          buf.write('\t');
          break;
        case 'w:br':
        case 'w:cr':
          buf.write('\n');
          break;
      }
    }
    return buf.toString().trimRight();
  }

  // =========================================================================
  // 2. 한글 HWPX(.hwpx) 고정밀 파서 (Contents/header.xml + 표 병합/너비/배경 + 이미지)
  // =========================================================================
  static List<Map<String, dynamic>> _extractHwpxStructuredBlocks(List<int> bytes) {
    final List<Map<String, dynamic>> blocks = [];
    final archive = ZipDecoder().decodeBytes(bytes);

    final Map<String, Uint8List> binDataMap = {};
    final List<Uint8List> allImagesInOrder = [];

    final sortedFiles = archive.files.where((f) => f.isFile).toList()
      ..sort((a, b) => _compareSectionNames(a.name, b.name));

    for (final file in sortedFiles) {
      final lower = file.name.toLowerCase();
      if (lower.startsWith('bindata/') &&
          (lower.endsWith('.png') ||
              lower.endsWith('.jpg') ||
              lower.endsWith('.jpeg') ||
              lower.endsWith('.bmp') ||
              lower.endsWith('.gif') ||
              lower.endsWith('.webp'))) {
        final data = Uint8List.fromList(file.content as List<int>);
        final base = file.name.split('/').last;
        final noExt = base.replaceAll(RegExp(r'\.[^.]+$'), '');
        binDataMap[file.name] = data;
        binDataMap[base] = data;
        binDataMap[noExt] = data;
        binDataMap[noExt.toLowerCase()] = data;
        allImagesInOrder.add(data);
      }
    }

    for (final file in sortedFiles) {
      if (file.name.toLowerCase().endsWith('content.hpf')) {
        final hpfXml = utf8.decode(file.content as List<int>, allowMalformed: true);
        for (final m in RegExp(r'<opf:item\b[^>]*>', dotAll: true).allMatches(hpfXml)) {
          final tag = m.group(0) ?? '';
          final idM = RegExp(r'\bid="([^"]+)"').firstMatch(tag);
          final hrefM = RegExp(r'\bhref="([^"]+)"').firstMatch(tag);
          if (idM != null && hrefM != null) {
            final id = idM.group(1)!;
            final href = hrefM.group(1)!;
            final img = binDataMap[href] ?? binDataMap[href.split('/').last];
            if (img != null) {
              binDataMap[id] = img;
              binDataMap[id.toLowerCase()] = img;
            }
          }
        }
      }
    }

    // Contents/header.xml 파싱 (charPr, paraPr, borderFill)
    final Map<String, _DocStyleInfo> charPrMap = {};
    final Map<String, String> paraAlignMap = {};
    final Map<String, int> borderFillBgMap = {};
    final Map<String, bool> fontIdSerifMap = {};

    for (final file in sortedFiles) {
      if (file.name.toLowerCase().endsWith('header.xml')) {
        final hXml = utf8.decode(file.content as List<int>, allowMalformed: true);
        for (final fM in RegExp(r'<hh:font\b[^>]*id="(\d+)"[^>]*face="([^"]+)"').allMatches(hXml)) {
          fontIdSerifMap[fM.group(1)!] = _isSerifFontName(fM.group(2)!);
        }
        for (final cpBlock in _findDirectXmlTagBlocks(hXml, 'hh:charPr')) {
          final idM = RegExp(r'\bid="(\d+)"').firstMatch(cpBlock);
          if (idM != null) {
            final st = _DocStyleInfo();
            final hM = RegExp(r'\bheight="(\d+)"').firstMatch(cpBlock);
            if (hM != null) {
              st.fontSizePt = ((int.tryParse(hM.group(1)!) ?? 1000) / 100.0).clamp(7.5, 36.0);
            }
            final tcM = RegExp(r'\btextColor="#?([0-9A-Fa-f]{6})"').firstMatch(cpBlock);
            if (tcM != null) {
              st.textColor = _parseHexColor(tcM.group(1)) ?? 0xFF141414;
            }
            if (cpBlock.contains('<hh:bold') || cpBlock.contains('bold="1"') || cpBlock.contains('bold="true"')) {
              st.bold = true;
            }
            if (cpBlock.contains('<hh:italic') || cpBlock.contains('italic="1"')) {
              st.italic = true;
            }
            if (cpBlock.contains('<hh:underline') && !cpBlock.contains('type="NONE"')) {
              st.underline = true;
            }
            final fRefM = RegExp(r'<hh:fontRef\b[^>]*hangul="(\d+)"').firstMatch(cpBlock);
            if (fRefM != null && fontIdSerifMap[fRefM.group(1)!] == true) {
              st.serif = true;
            }
            charPrMap[idM.group(1)!] = st;
          }
        }
        for (final ppBlock in _findDirectXmlTagBlocks(hXml, 'hh:paraPr')) {
          final idM = RegExp(r'\bid="(\d+)"').firstMatch(ppBlock);
          if (idM != null) {
            final alM = RegExp(r'<hh:align\b[^>]*horizontal="([^"]+)"').firstMatch(ppBlock);
            if (alM != null) {
              final h = alM.group(1)!.toUpperCase();
              if (h == 'CENTER') {
                paraAlignMap[idM.group(1)!] = 'center';
              } else if (h == 'RIGHT') {
                paraAlignMap[idM.group(1)!] = 'right';
              } else {
                paraAlignMap[idM.group(1)!] = 'left';
              }
            }
          }
        }
        for (final bfBlock in _findDirectXmlTagBlocks(hXml, 'hh:borderFill')) {
          final idM = RegExp(r'\bid="(\d+)"').firstMatch(bfBlock);
          if (idM != null) {
            final fcM = RegExp(r'faceColor="#?([0-9A-Fa-f]{6})"').firstMatch(bfBlock);
            if (fcM != null) {
              final hex = fcM.group(1)!.toUpperCase();
              if (hex != 'FFFFFF' && hex != 'NONE') {
                final c = _parseHexColor(hex);
                if (c != null) borderFillBgMap[idM.group(1)!] = c;
              }
            }
          }
        }
      }
    }

    final Set<Uint8List> emittedImages = {};
    final sectionFiles = sortedFiles
        .where((f) => RegExp(r'^Contents/section\d+\.xml$', caseSensitive: false).hasMatch(f.name))
        .toList();

    for (final secFile in sectionFiles) {
      final xml = utf8.decode(secFile.content as List<int>, allowMalformed: true);
      for (final pBlock in _findDirectXmlTagBlocks(xml, 'hp:p')) {
        final tblBlocks = _findDirectXmlTagBlocks(pBlock, 'hp:tbl');
        String pWithoutTables = pBlock;
        for (final tb in tblBlocks) {
          pWithoutTables = pWithoutTables.replaceFirst(tb, '');
        }

        final pStyle = _resolveHwpxStyle(pWithoutTables, charPrMap, paraAlignMap);
        final pText = _extractHwpxText(pWithoutTables);
        if (pText.isNotEmpty) {
          blocks.add({
            'type': 'paragraph',
            'text': pText,
            'fontSizePt': pStyle.fontSizePt,
            'bold': pStyle.bold,
            'italic': pStyle.italic,
            'underline': pStyle.underline,
            'serif': pStyle.serif,
            'align': pStyle.align,
            'textColor': pStyle.textColor,
          });
        }

        for (final tblXml in tblBlocks) {
          final tableBlock = _parseHwpxRichTable(
            tblXml,
            charPrMap,
            paraAlignMap,
            borderFillBgMap,
            binDataMap,
            emittedImages,
          );
          if (tableBlock != null) {
            blocks.add(tableBlock);
          }
        }

        for (final imgM in RegExp(r'(?:binaryItemIDRef|binItemIDRef|binData)="([^"]+)"').allMatches(pWithoutTables)) {
          final refId = imgM.group(1)!;
          final img = binDataMap[refId] ?? binDataMap[refId.toLowerCase()];
          if (img != null && !emittedImages.contains(img)) {
            emittedImages.add(img);
            blocks.add({'type': 'image', 'bytes': img});
          }
        }
      }
    }

    for (final img in allImagesInOrder) {
      if (!emittedImages.contains(img)) {
        emittedImages.add(img);
        blocks.add({'type': 'image', 'bytes': img});
      }
    }

    return blocks;
  }

  static _DocStyleInfo _resolveHwpxStyle(
    String xmlFragment,
    Map<String, _DocStyleInfo> charPrMap,
    Map<String, String> paraAlignMap,
  ) {
    final st = _DocStyleInfo(fontSizePt: 10.0);
    final ppM = RegExp(r'\bparaPrIDRef="(\d+)"').firstMatch(xmlFragment);
    if (ppM != null && paraAlignMap.containsKey(ppM.group(1)!)) {
      st.align = paraAlignMap[ppM.group(1)!]!;
    }
    final cpM = RegExp(r'\bcharPrIDRef="(\d+)"').firstMatch(xmlFragment);
    if (cpM != null && charPrMap.containsKey(cpM.group(1)!)) {
      final c = charPrMap[cpM.group(1)!]!;
      st.fontSizePt = c.fontSizePt;
      st.bold = c.bold;
      st.italic = c.italic;
      st.underline = c.underline;
      st.serif = c.serif;
      st.textColor = c.textColor;
    }
    return st;
  }

  static Map<String, dynamic>? _parseHwpxRichTable(
    String tblXml,
    Map<String, _DocStyleInfo> charPrMap,
    Map<String, String> paraAlignMap,
    Map<String, int> borderFillBgMap,
    Map<String, Uint8List> binDataMap,
    Set<Uint8List> emittedImages,
  ) {
    final firstGt = tblXml.indexOf('>');
    final tblTag = firstGt != -1 ? tblXml.substring(0, firstGt) : tblXml;
    int numRows = int.tryParse(RegExp(r'\browCnt="(\d+)"').firstMatch(tblTag)?.group(1) ?? '') ?? 0;
    int numCols = int.tryParse(RegExp(r'\bcolCnt="(\d+)"').firstMatch(tblTag)?.group(1) ?? '') ?? 0;

    final tcBlocks = _findDirectXmlTagBlocks(tblXml, 'hp:tc');
    if (tcBlocks.isEmpty) return null;

    for (final tcXml in tcBlocks) {
      final addrM = RegExp(r'<hp:cellAddr\b[^>]*colAddr="(\d+)"[^>]*rowAddr="(\d+)"').firstMatch(tcXml);
      final spanM = RegExp(r'<hp:cellSpan\b[^>]*colSpan="(\d+)"[^>]*rowSpan="(\d+)"').firstMatch(tcXml);
      if (addrM != null) {
        final c = int.tryParse(addrM.group(1)!) ?? 0;
        final r = int.tryParse(addrM.group(2)!) ?? 0;
        final cs = int.tryParse(spanM?.group(1) ?? '1') ?? 1;
        final rs = int.tryParse(spanM?.group(2) ?? '1') ?? 1;
        if (c + cs > numCols) numCols = c + cs;
        if (r + rs > numRows) numRows = r + rs;
      }
    }
    if (numRows <= 0 || numCols <= 0) return null;

    final List<double> colWidths = List<double>.filled(numCols, 0.0);
    final List<Map<String, dynamic>> cells = [];

    int fallbackRow = 0;
    int fallbackCol = 0;

    for (final tcXml in tcBlocks) {
      final addrM = RegExp(r'<hp:cellAddr\b[^>]*colAddr="(\d+)"[^>]*rowAddr="(\d+)"').firstMatch(tcXml);
      final spanM = RegExp(r'<hp:cellSpan\b[^>]*colSpan="(\d+)"[^>]*rowSpan="(\d+)"').firstMatch(tcXml);
      final szM = RegExp(r'<hp:cellSz\b[^>]*width="(\d+)"[^>]*height="(\d+)"').firstMatch(tcXml);
      final bfM = RegExp(r'\bborderFillIDRef="(\d+)"').firstMatch(tcXml);

      final int col = (addrM != null ? (int.tryParse(addrM.group(1)!) ?? fallbackCol) : fallbackCol)
          .clamp(0, numCols - 1);
      final int row = (addrM != null ? (int.tryParse(addrM.group(2)!) ?? fallbackRow) : fallbackRow)
          .clamp(0, numRows - 1);
      final int colSpan = (spanM != null ? (int.tryParse(spanM.group(1)!) ?? 1) : 1)
          .clamp(1, numCols - col);
      final int rowSpan = (spanM != null ? (int.tryParse(spanM.group(2)!) ?? 1) : 1)
          .clamp(1, numRows - row);

      double minHeightPt = 20.0;
      if (szM != null) {
        final wHwp = double.tryParse(szM.group(1)!) ?? 0.0;
        final hHwp = double.tryParse(szM.group(2)!) ?? 0.0;
        if (wHwp > 0) {
          final perColW = wHwp / colSpan;
          for (int c = col; c < col + colSpan && c < numCols; c++) {
            if (colWidths[c] <= 0.0 || colSpan == 1) {
              colWidths[c] = perColW;
            }
          }
        }
        if (hHwp > 0) {
          minHeightPt = (hHwp / 100.0).clamp(16.0, 260.0);
        }
      }

      int? bgColor;
      if (bfM != null) {
        bgColor = borderFillBgMap[bfM.group(1)!];
      }

      final cellStyle = _resolveHwpxStyle(tcXml, charPrMap, paraAlignMap);
      final cellParas = _findDirectXmlTagBlocks(tcXml, 'hp:p');
      final cellLines = <String>[];
      for (final cp in cellParas) {
        final ct = _extractHwpxText(cp);
        if (ct.isNotEmpty) cellLines.add(ct);
      }

      final cellImages = <Uint8List>[];
      for (final imgM in RegExp(r'(?:binaryItemIDRef|binItemIDRef|binData)="([^"]+)"').allMatches(tcXml)) {
        final refId = imgM.group(1)!;
        final img = binDataMap[refId] ?? binDataMap[refId.toLowerCase()];
        if (img != null) {
          emittedImages.add(img);
          cellImages.add(img);
        }
      }

      cells.add({
        'row': row,
        'col': col,
        'rowSpan': rowSpan,
        'colSpan': colSpan,
        'text': cellLines.join('\n'),
        'align': cellStyle.align,
        'vAlign': 'middle',
        'bold': cellStyle.bold,
        'serif': cellStyle.serif,
        'fontSizePt': cellStyle.fontSizePt.clamp(7.5, 22.0),
        'textColor': cellStyle.textColor,
        'bgColor': bgColor,
        'minHeightPt': minHeightPt,
        if (cellImages.isNotEmpty) 'images': cellImages,
      });

      fallbackCol = col + colSpan;
      if (fallbackCol >= numCols) {
        fallbackCol = 0;
        fallbackRow = row + 1;
      }
    }

    for (int i = 0; i < numCols; i++) {
      if (colWidths[i] <= 0.0) colWidths[i] = 1000.0;
    }

    return {
      'type': 'table',
      'numRows': numRows,
      'numCols': numCols,
      'colWidths': colWidths,
      'cells': cells,
    };
  }

  // =========================================================================
  // 3. 한글 HWP 5.0(.hwp) 바이너리 고정밀 파서
  //    - DocInfo: 글꼴(HWPTAG_FACE_NAME), 글자모양(HWPTAG_CHAR_SHAPE),
  //               문단모양(HWPTAG_PARA_SHAPE), 테두리/배경(HWPTAG_BORDER_FILL)
  //    - BodyText/Section*: 문단 서식 + 표(HWPTAG_TABLE + 셀 HWPTAG_LIST_HEADER 병합/너비/배경) + 그림(BinData)
  // =========================================================================
  static List<Map<String, dynamic>> _extractHwp5StructuredBlocks(Uint8List bytes) {
    final List<Map<String, dynamic>> blocks = [];
    if (bytes.length >= 2 && bytes[0] == 0x50 && bytes[1] == 0x4B) {
      return _extractHwpxStructuredBlocks(bytes);
    }
    const signature = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
    if (bytes.length < 512 ||
        List.generate(8, (i) => bytes[i] == signature[i]).contains(false)) {
      throw const FormatException('HWP 5 문서가 아니거나 파일이 손상되었습니다.');
    }

    final bd = ByteData.sublistView(bytes);
    final sectorShift = bd.getUint16(30, Endian.little);
    final miniSectorShift = bd.getUint16(32, Endian.little);
    if ((sectorShift != 9 && sectorShift != 12) || miniSectorShift != 6) {
      throw const FormatException('HWP 저장 구조가 올바르지 않습니다.');
    }
    final sectorSize = 1 << sectorShift;
    final miniSectorSize = 1 << miniSectorShift;

    final numFatSectors = bd.getUint32(44, Endian.little);
    final firstDirSector = bd.getUint32(48, Endian.little);
    final miniCutoff = bd.getUint32(56, Endian.little);
    final firstMiniFatSector = bd.getUint32(60, Endian.little);
    final numMiniFatSectors = bd.getUint32(64, Endian.little);
    final firstDifatSector = bd.getUint32(68, Endian.little);
    final numDifatSectors = bd.getUint32(72, Endian.little);

    final List<int> fatSectorIds = [];
    for (int i = 0; i < 109 && fatSectorIds.length < numFatSectors; i++) {
      final sid = bd.getUint32(76 + i * 4, Endian.little);
      if (sid < 0xFFFFFFFE) fatSectorIds.add(sid);
    }

    int difatSec = firstDifatSector;
    for (int d = 0; d < numDifatSectors && difatSec < 0xFFFFFFFE; d++) {
      final offset = (difatSec + 1) * sectorSize;
      if (offset + sectorSize > bytes.length) break;
      final entriesPerSec = (sectorSize ~/ 4) - 1;
      for (int i = 0; i < entriesPerSec && fatSectorIds.length < numFatSectors; i++) {
        final sid = bd.getUint32(offset + i * 4, Endian.little);
        if (sid < 0xFFFFFFFE) fatSectorIds.add(sid);
      }
      difatSec = bd.getUint32(offset + entriesPerSec * 4, Endian.little);
    }

    final List<int> fat = [];
    for (final fatSec in fatSectorIds) {
      final offset = (fatSec + 1) * sectorSize;
      if (offset + sectorSize > bytes.length) continue;
      for (int i = 0; i < sectorSize ~/ 4; i++) {
        fat.add(bd.getUint32(offset + i * 4, Endian.little));
      }
    }

    Uint8List readChain(int startSector, [int? exactSize]) {
      final builder = BytesBuilder(copy: false);
      int cur = startSector;
      final visited = <int>{};
      while (cur < 0xFFFFFFFA && cur < fat.length) {
        if (!visited.add(cur)) throw const FormatException('HWP FAT 순환 오류');
        final pos = (cur + 1) * sectorSize;
        if (pos + sectorSize <= bytes.length) {
          builder.add(Uint8List.sublistView(bytes, pos, pos + sectorSize));
        } else {
          break;
        }
        cur = fat[cur];
      }
      final raw = builder.takeBytes();
      if (exactSize != null && exactSize < raw.length) {
        return Uint8List.sublistView(raw, 0, exactSize);
      }
      return raw;
    }

    final dirBytes = readChain(firstDirSector);
    final dirBd = ByteData.sublistView(dirBytes);
    final int entryCount = dirBytes.length ~/ 128;

    int rootStartSector = 0xFFFFFFFE;
    int rootSize = 0;
    final Map<String, (int, int)> sectionStreams = {};
    final Map<String, (int, int)> binDataStreams = {};

    for (int i = 0; i < entryCount; i++) {
      final base = i * 128;
      final nameByteLen = dirBd.getUint16(base + 64, Endian.little);
      final objType = dirBd.getUint8(base + 66);
      if (nameByteLen < 2 || nameByteLen > 64 || objType == 0) continue;

      final codeUnits = <int>[];
      for (int k = 0; k < (nameByteLen - 2) ~/ 2; k++) {
        codeUnits.add(dirBd.getUint16(base + k * 2, Endian.little));
      }
      final name = String.fromCharCodes(codeUnits);
      final startSec = dirBd.getUint32(base + 116, Endian.little);
      final streamSize = dirBd.getUint32(base + 120, Endian.little);

      if (objType == 5) {
        rootStartSector = startSec;
        rootSize = streamSize;
      } else if (objType == 2) {
        if (name == 'FileHeader' && streamSize >= 36) {
          sectionStreams['__FileHeader__'] = (startSec, streamSize);
        } else if (name == 'DocInfo') {
          sectionStreams['__DocInfo__'] = (startSec, streamSize);
        } else if (name == 'PrvText') {
          sectionStreams['__PrvText__'] = (startSec, streamSize);
        } else if (name.startsWith('Section')) {
          sectionStreams[name] = (startSec, streamSize);
        } else if (name.toUpperCase().startsWith('BIN')) {
          binDataStreams[name] = (startSec, streamSize);
        }
      }
    }

    final List<int> miniFat = [];
    if (firstMiniFatSector < 0xFFFFFFFE && numMiniFatSectors > 0) {
      final miniFatBytes = readChain(firstMiniFatSector);
      final mfBd = ByteData.sublistView(miniFatBytes);
      for (int i = 0; i < miniFatBytes.length ~/ 4; i++) {
        miniFat.add(mfBd.getUint32(i * 4, Endian.little));
      }
    }
    final Uint8List miniStream =
        (rootStartSector < 0xFFFFFFFE && rootSize > 0) ? readChain(rootStartSector, rootSize) : Uint8List(0);

    Uint8List readEntryStream(int startSec, int size) {
      if (size == 0) return Uint8List(0);
      if (size >= miniCutoff || miniStream.isEmpty) {
        return readChain(startSec, size);
      }
      final builder = BytesBuilder(copy: false);
      int cur = startSec;
      final visited = <int>{};
      while (cur < 0xFFFFFFFA && cur < miniFat.length) {
        if (!visited.add(cur)) throw const FormatException('HWP MiniFAT 순환 오류');
        final pos = cur * miniSectorSize;
        if (pos + miniSectorSize <= miniStream.length) {
          builder.add(Uint8List.sublistView(miniStream, pos, pos + miniSectorSize));
        } else {
          break;
        }
        cur = miniFat[cur];
      }
      final raw = builder.takeBytes();
      if (size < raw.length) {
        return Uint8List.sublistView(raw, 0, size);
      }
      return raw;
    }

    bool isCompressed = true;
    if (!sectionStreams.containsKey('__FileHeader__')) {
      throw const FormatException('HWP FileHeader를 찾지 못했습니다.');
    }
    if (sectionStreams.containsKey('__FileHeader__')) {
      final (fhSec, fhSize) = sectionStreams['__FileHeader__']!;
      final fileHeaderData = readEntryStream(fhSec, fhSize);
      if (fileHeaderData.length < 40 ||
          ascii.decode(fileHeaderData.take(17).toList(), allowInvalid: true) != 'HWP Document File') {
        throw const FormatException('유효한 HWP 5 FileHeader가 아닙니다.');
      }
      if (fileHeaderData.length >= 40) {
        final flags = ByteData.sublistView(fileHeaderData).getUint32(36, Endian.little);
        if ((flags & 0x02) != 0) {
          throw const FormatException('암호로 보호된 HWP입니다. 암호를 해제한 문서를 열어 주세요.');
        }
        if ((flags & 0x04) != 0) {
          throw const FormatException('배포용 HWP는 현재 지원하지 않습니다. 일반 HWP 또는 PDF로 저장해 주세요.');
        }
        isCompressed = (flags & 0x01) != 0;
      }
    }

    // DocInfo 파싱 (글꼴, 글자모양, 문단모양, 셀 배경색)
    final List<bool> fontIsSerifList = [];
    final List<_DocStyleInfo> charShapes = [];
    final List<(String, double)> paraShapes = []; // (align, leftIndentPt)
    final List<int?> borderFillBgColors = [null]; // 1-based indexing

    if (sectionStreams.containsKey('__DocInfo__')) {
      final (diSec, diSize) = sectionStreams['__DocInfo__']!;
      Uint8List diBytes = readEntryStream(diSec, diSize);
      if (diBytes.isNotEmpty && isCompressed) {
        try {
          diBytes = Uint8List.fromList(ZLibCodec(raw: true).decoder.convert(diBytes));
        } catch (_) {
          try {
            diBytes = Uint8List.fromList(ZLibCodec(raw: false).decoder.convert(diBytes));
          } catch (_) {}
        }
      }
      _parseHwpDocInfo(
        diBytes,
        fontIsSerifList,
        charShapes,
        paraShapes,
        borderFillBgColors,
      );
    }

    // BinData 내장 이미지 복원
    final List<Uint8List> extractedBinImages = [];
    final sortedBinNames = binDataStreams.keys.toList()..sort();
    for (final binName in sortedBinNames) {
      final lower = binName.toLowerCase();
      if (!lower.endsWith('.jpg') &&
          !lower.endsWith('.jpeg') &&
          !lower.endsWith('.png') &&
          !lower.endsWith('.bmp') &&
          !lower.endsWith('.gif') &&
          !lower.endsWith('.webp')) {
        continue;
      }
      final (bSec, bSize) = binDataStreams[binName]!;
      Uint8List rawBin = readEntryStream(bSec, bSize);
      if (rawBin.isEmpty) continue;

      if (isCompressed && !_looksLikeImageHeader(rawBin)) {
        try {
          rawBin = Uint8List.fromList(ZLibCodec(raw: true).decoder.convert(rawBin));
        } catch (_) {
          try {
            rawBin = Uint8List.fromList(ZLibCodec(raw: false).decoder.convert(rawBin));
          } catch (_) {}
        }
      }
      if (_looksLikeImageHeader(rawBin)) {
        extractedBinImages.add(rawBin);
      }
    }

    final Set<int> usedBinImageIndices = {};
    final sortedSectionNames = sectionStreams.keys.where((k) => RegExp(r'^Section\d+$').hasMatch(k)).toList()..sort(_compareSectionNames);

    for (final secName in sortedSectionNames) {
      final (startSec, size) = sectionStreams[secName]!;
      Uint8List secBytes = readEntryStream(startSec, size);
      if (secBytes.isEmpty) continue;

      if (isCompressed) {
        try {
          secBytes = Uint8List.fromList(ZLibCodec(raw: true).decoder.convert(secBytes));
        } catch (_) {
          throw FormatException('HWP 본문 $secName 압축을 해제하지 못했습니다.');
        }
      }

      blocks.addAll(
        _parseHwpSectionStructuredRecords(
          secBytes,
          charShapes,
          paraShapes,
          borderFillBgColors,
          extractedBinImages,
          usedBinImageIndices,
        ),
      );
    }

    for (int i = 0; i < extractedBinImages.length; i++) {
      if (!usedBinImageIndices.contains(i)) {
        usedBinImageIndices.add(i);
        blocks.add({'type': 'image', 'bytes': extractedBinImages[i]});
      }
    }

    if (sortedSectionNames.isEmpty) {
      throw const FormatException('HWP 본문 스트림이 없습니다. 미리보기만으로는 전체 문서를 열 수 없습니다.');
    }

    return blocks;
  }

  static void _parseHwpDocInfo(
    Uint8List data,
    List<bool> fontIsSerifList,
    List<_DocStyleInfo> charShapes,
    List<(String, double)> paraShapes,
    List<int?> borderFillBgColors,
  ) {
    final bd = ByteData.sublistView(data);
    int offset = 0;

    while (offset + 4 <= data.length) {
      final header = bd.getUint32(offset, Endian.little);
      offset += 4;
      final int tagId = header & 0x3FF;
      int recSize = (header >> 20) & 0xFFF;
      if (recSize == 0xFFF) {
        if (offset + 4 > data.length) break;
        recSize = bd.getUint32(offset, Endian.little);
        offset += 4;
      }
      if (offset + recSize > data.length) break;

      // HWPTAG_FACE_NAME == 19
      if (tagId == 19 && recSize >= 3) {
        final nameLen = bd.getUint16(offset + 1, Endian.little);
        if (offset + 3 + nameLen * 2 <= data.length) {
          final units = <int>[];
          for (int i = 0; i < nameLen; i++) {
            units.add(bd.getUint16(offset + 3 + i * 2, Endian.little));
          }
          final fontName = String.fromCharCodes(units);
          fontIsSerifList.add(_isSerifFontName(fontName));
        } else {
          fontIsSerifList.add(false);
        }
      }
      // HWPTAG_BORDER_FILL == 20
      else if (tagId == 20 && recSize >= 28) {
        int? bg;
        // 테두리 정보 뒤에 위치한 WinBrush 채움 색상 스캔 (type == 1 인 경우 다음 4바이트가 COLORREF 0x00BBGGRR)
        for (int pos = offset + 18; pos + 8 <= offset + recSize; pos += 2) {
          final fillType = bd.getUint32(pos, Endian.little);
          if (fillType == 1 && pos + 8 <= offset + recSize) {
            final colorRef = bd.getUint32(pos + 4, Endian.little);
            final r = colorRef & 0xFF;
            final g = (colorRef >> 8) & 0xFF;
            final b = (colorRef >> 16) & 0xFF;
            if (!(r == 255 && g == 255 && b == 255) && !(r == 0 && g == 0 && b == 0)) {
              bg = 0xFF000000 | (r << 16) | (g << 8) | b;
              break;
            }
          }
        }
        borderFillBgColors.add(bg);
      }
      // HWPTAG_CHAR_SHAPE == 21
      else if (tagId == 21 && recSize >= 56) {
        final hangulFontId = bd.getUint16(offset, Endian.little);
        final baseSize = bd.getInt32(offset + 42, Endian.little);
        final attr = bd.getUint32(offset + 46, Endian.little);
        final colorRef = bd.getUint32(offset + 52, Endian.little);
        final r = colorRef & 0xFF;
        final g = (colorRef >> 8) & 0xFF;
        final b = (colorRef >> 16) & 0xFF;
        final int argb = (r == 255 && g == 255 && b == 255)
            ? 0xFF141414
            : (0xFF000000 | (r << 16) | (g << 8) | b);

        final bool isSerif = (hangulFontId < fontIsSerifList.length)
            ? fontIsSerifList[hangulFontId]
            : false;

        charShapes.add(
          _DocStyleInfo(
            fontSizePt: (baseSize / 100.0).clamp(7.5, 36.0),
            italic: (attr & 0x01) != 0,
            bold: (attr & 0x02) != 0,
            underline: ((attr >> 2) & 0x03) != 0,
            serif: isSerif,
            textColor: argb,
          ),
        );
      }
      // HWPTAG_PARA_SHAPE == 25
      else if (tagId == 25 && recSize >= 8) {
        final prop1 = bd.getUint32(offset, Endian.little);
        final alignCode = (prop1 >> 2) & 0x07;
        String align = 'left';
        if (alignCode == 3) {
          align = 'center';
        } else if (alignCode == 2) {
          align = 'right';
        } else if (alignCode == 0) {
          align = 'justify';
        }
        final leftMargin = bd.getInt32(offset + 4, Endian.little);
        final indentPt = (leftMargin / 200.0).clamp(0.0, 100.0);
        paraShapes.add((align, indentPt));
      }

      offset += recSize;
    }
  }

  static bool _looksLikeImageHeader(Uint8List data) {
    if (data.length < 4) return false;
    if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) return true;
    if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) return true;
    if (data[0] == 0x42 && data[1] == 0x4D) return true;
    if (data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46) return true;
    return false;
  }

  /// HWP 5.0 Section 레코드 스트림에서 단락 서식, 표(셀 병합/열 너비/배경색/셀 이미지), 그림을 정밀 복원
  static List<Map<String, dynamic>> _parseHwpSectionStructuredRecords(
    Uint8List data,
    List<_DocStyleInfo> charShapes,
    List<(String, double)> paraShapes,
    List<int?> borderFillBgColors,
    List<Uint8List> binImages,
    Set<int> usedBinImageIndices,
  ) {
    final List<Map<String, dynamic>> blocks = [];
    final bd = ByteData.sublistView(data);
    int offset = 0;

    int? activeTableCtrlLevel;
    int tableRows = 0;
    int tableCols = 0;
    int expectedTotalCells = 0;
    int parsedCellsCount = 0;
    int? detectedCellAttrOffset;
    List<double> tableColWidths = [];
    List<Map<String, dynamic>> tableCells = [];
    Map<String, dynamic>? currentCellMap;

    int currentParaShapeId = 0;
    int currentCharShapeId = 0;

    void flushActiveTable() {
      if (tableCells.isNotEmpty && tableRows > 0 && tableCols > 0) {
        for (int c = 0; c < tableCols; c++) {
          if (tableColWidths[c] <= 0.0) tableColWidths[c] = 1000.0;
        }
        blocks.add({
          'type': 'table',
          'numRows': tableRows,
          'numCols': tableCols,
          'colWidths': List<double>.from(tableColWidths),
          'cells': List<Map<String, dynamic>>.from(tableCells),
        });
      }
      activeTableCtrlLevel = null;
      tableRows = 0;
      tableCols = 0;
      expectedTotalCells = 0;
      parsedCellsCount = 0;
      detectedCellAttrOffset = null;
      tableColWidths = [];
      tableCells = [];
      currentCellMap = null;
    }

    while (offset + 4 <= data.length) {
      final header = bd.getUint32(offset, Endian.little);
      offset += 4;

      final int tagId = header & 0x3FF;
      final int level = (header >> 10) & 0x3FF;
      int recSize = (header >> 20) & 0xFFF;
      if (recSize == 0xFFF) {
        if (offset + 4 > data.length) break;
        recSize = bd.getUint32(offset, Endian.little);
        offset += 4;
      }

      if (offset + recSize > data.length) break;

      // 표 종료 조건:
      // 1) level이 표 컨트롤 레벨(activeTableCtrlLevel, 보통 1)보다 작아진 경우(예: level 0의 본문 문단 시작)
      // 2) 또는 expectedTotalCells를 모두 채운 뒤 셀 내부 레벨보다 상위 문단이 시작된 경우
      if (activeTableCtrlLevel != null) {
        if (level < activeTableCtrlLevel!) {
          flushActiveTable();
        } else if (tagId == 66 &&
            level == activeTableCtrlLevel! &&
            expectedTotalCells > 0 &&
            parsedCellsCount >= expectedTotalCells) {
          flushActiveTable();
        }
      }

      // HWPTAG_PARA_HEADER == 66 (0x42)
      if (tagId == 66 && recSize >= 10) {
        currentParaShapeId = bd.getUint16(offset + 8, Endian.little);
      }
      // HWPTAG_PARA_CHAR_SHAPE == 68 (0x44)
      else if (tagId == 68 && recSize >= 8) {
        currentCharShapeId = bd.getUint32(offset + 4, Endian.little);
      }
      // HWPTAG_TABLE == 77 (0x4D)
      else if (tagId == 77 && recSize >= 18) {
        flushActiveTable();
        final rCount = bd.getUint16(offset + 4, Endian.little);
        final cCount = bd.getUint16(offset + 6, Endian.little);
        if (rCount > 0 && rCount <= 500 && cCount > 0 && cCount <= 60) {
          // 핵심: HWPTAG_TABLE의 부모인 HWPTAG_CTRL_HEADER('tbl ')는 level - 1 (보통 1)에 위치!
          activeTableCtrlLevel = math.max(1, level - 1);
          tableRows = rCount;
          tableCols = cCount;
          tableColWidths = List<double>.filled(tableCols, 0.0);
          tableCells = [];
          currentCellMap = null;
          parsedCellsCount = 0;
          detectedCellAttrOffset = null;

          int sumCells = 0;
          if (recSize >= 18 + rCount * 2) {
            for (int r = 0; r < rCount; r++) {
              sumCells += bd.getUint16(offset + 18 + r * 2, Endian.little);
            }
          }
          expectedTotalCells = sumCells;
        }
      }
      // HWPTAG_LIST_HEADER == 72 (0x48): 표 셀(Cell) 시작
      else if (tagId == 72 && activeTableCtrlLevel != null && recSize >= 22) {
        // 첫 번째 셀에서 오프셋 6 vs 오프셋 8 중 (col=0, row=0, colSpan>=1, rowSpan>=1) 위치를 자동 감지
        if (detectedCellAttrOffset == null) {
          for (final cand in [6, 8]) {
            if (cand + 16 <= recSize) {
              final c = bd.getUint16(offset + cand, Endian.little);
              final r = bd.getUint16(offset + cand + 2, Endian.little);
              final cs = bd.getUint16(offset + cand + 4, Endian.little);
              final rs = bd.getUint16(offset + cand + 6, Endian.little);
              if (c == 0 && r == 0 && cs >= 1 && cs <= tableCols && rs >= 1 && rs <= tableRows) {
                detectedCellAttrOffset = cand;
                break;
              }
            }
          }
          detectedCellAttrOffset ??= 6;
        }

        final int baseOff = detectedCellAttrOffset!;
        int cIdx = 0;
        int rIdx = 0;
        int cSpan = 1;
        int rSpan = 1;
        double cellW = 0.0;
        double cellH = 20.0;
        int? cellBgColor;

        if (baseOff + 16 <= recSize) {
          cIdx = bd.getUint16(offset + baseOff, Endian.little);
          rIdx = bd.getUint16(offset + baseOff + 2, Endian.little);
          cSpan = bd.getUint16(offset + baseOff + 4, Endian.little);
          rSpan = bd.getUint16(offset + baseOff + 6, Endian.little);
          final wUnit = bd.getUint32(offset + baseOff + 8, Endian.little);
          final hUnit = bd.getUint32(offset + baseOff + 12, Endian.little);
          cellW = wUnit.toDouble();
          cellH = (hUnit / 100.0).clamp(16.0, 260.0);
        }
        if (baseOff + 32 <= recSize) {
          final bfId = bd.getUint16(offset + baseOff + 30, Endian.little);
          if (bfId > 0 && bfId < borderFillBgColors.length) {
            cellBgColor = borderFillBgColors[bfId];
          }
        }

        rIdx = rIdx.clamp(0, tableRows - 1);
        cIdx = cIdx.clamp(0, tableCols - 1);
        cSpan = cSpan.clamp(1, tableCols - cIdx);
        rSpan = rSpan.clamp(1, tableRows - rIdx);

        if (cellW > 0) {
          final perCol = cellW / cSpan;
          for (int c = cIdx; c < cIdx + cSpan && c < tableCols; c++) {
            if (tableColWidths[c] <= 0.0 || cSpan == 1) {
              tableColWidths[c] = perCol;
            }
          }
        }

        final cellMap = <String, dynamic>{
          'row': rIdx,
          'col': cIdx,
          'rowSpan': rSpan,
          'colSpan': cSpan,
          'text': '',
          'align': 'left',
          'vAlign': 'middle',
          'bold': false,
          'serif': false,
          'fontSizePt': 9.5,
          'textColor': 0xFF141414,
          'bgColor': cellBgColor,
          'minHeightPt': cellH,
          '_styleInitialized': false,
        };
        tableCells.add(cellMap);
        currentCellMap = cellMap;
        parsedCellsCount++;
      }
      // HWPTAG_SHAPE_COMPONENT_PICTURE == 85 (0x55)
      else if (tagId == 85 && binImages.isNotEmpty) {
        int? matchedIdx;
        for (int i = 0; i < binImages.length; i++) {
          if (!usedBinImageIndices.contains(i)) {
            matchedIdx = i;
            break;
          }
        }
        if (matchedIdx != null) {
          usedBinImageIndices.add(matchedIdx);
          if (activeTableCtrlLevel != null && currentCellMap != null) {
            (currentCellMap!.putIfAbsent('images', () => <Uint8List>[]) as List<Uint8List>).add(binImages[matchedIdx]);
          } else {
            blocks.add({'type': 'image', 'bytes': binImages[matchedIdx]});
          }
        }
      }
      // HWPTAG_PARA_TEXT == 67 (0x43)
      else if (tagId == 67 && recSize >= 2) {
        final decodedLines = _decodeHwpParaText(bd, offset, recSize);
        final _DocStyleInfo cStyle = (currentCharShapeId >= 0 && currentCharShapeId < charShapes.length)
            ? charShapes[currentCharShapeId]
            : _DocStyleInfo(fontSizePt: 10.0);
        final (String pAlign, double pIndent) = (currentParaShapeId >= 0 && currentParaShapeId < paraShapes.length)
            ? paraShapes[currentParaShapeId]
            : ('left', 0.0);

        if (decodedLines.isNotEmpty) {
          if (activeTableCtrlLevel != null && currentCellMap != null) {
            final joined = decodedLines.join('\n').trim();
            if (joined.isNotEmpty) {
              final prev = currentCellMap!['text'] as String;
              currentCellMap!['text'] = prev.isEmpty ? joined : '$prev\n$joined';
              if (currentCellMap!['_styleInitialized'] != true) {
                currentCellMap!['_styleInitialized'] = true;
                currentCellMap!['align'] = pAlign;
                currentCellMap!['bold'] = cStyle.bold;
                currentCellMap!['serif'] = cStyle.serif;
                currentCellMap!['fontSizePt'] = cStyle.fontSizePt.clamp(7.5, 22.0);
                currentCellMap!['textColor'] = cStyle.textColor;
              }
            }
          } else {
            for (final line in decodedLines) {
              blocks.add({
                'type': 'paragraph',
                'text': line,
                'fontSizePt': cStyle.fontSizePt,
                'bold': cStyle.bold,
                'italic': cStyle.italic,
                'underline': cStyle.underline,
                'serif': cStyle.serif,
                'align': pAlign,
                'textColor': cStyle.textColor,
                'leftIndentPt': pIndent,
              });
            }
          }
        }
      }

      offset += recSize;
    }

    flushActiveTable();
    return blocks;
  }

  static List<String> _decodeHwpParaText(ByteData bd, int offset, int recSize) {
    final List<String> lines = [];
    final buf = StringBuffer();
    int pos = offset;
    final int end = offset + recSize;

    while (pos + 1 < end) {
      final int ch = bd.getUint16(pos, Endian.little);
      pos += 2;

      if (ch == 0) {
        break;
      } else if (ch == 1 ||
          ch == 2 ||
          ch == 3 ||
          ch == 11 ||
          ch == 12 ||
          ch == 14 ||
          ch == 15 ||
          ch == 16 ||
          ch == 17 ||
          ch == 18 ||
          ch == 21 ||
          ch == 22 ||
          ch == 23) {
        pos += 14;
      } else if (ch == 4 ||
          ch == 5 ||
          ch == 6 ||
          ch == 7 ||
          ch == 8 ||
          ch == 9 ||
          ch == 19 ||
          ch == 20) {
        if (ch == 9) buf.write('    ');
        pos += 14;
      } else if (ch == 10 || ch == 13) {
        buf.write('\n');
      } else if (ch == 24) {
        buf.write('-');
      } else if (ch == 30 || ch == 31) {
        buf.write(' ');
      } else if (ch >= 32) {
        buf.writeCharCode(ch);
      }
    }

    final text = buf.toString().trimRight();
    if (text.isNotEmpty) {
      for (final sub in text.split('\n')) {
        final t = sub.trimRight();
        if (t.trim().isNotEmpty) lines.add(t);
      }
    }
    return lines;
  }

  static int _compareSectionNames(String a, String b) {
    final pattern = RegExp(r'section(\d+)', caseSensitive: false);
    final an = int.tryParse(pattern.firstMatch(a)?.group(1) ?? '');
    final bn = int.tryParse(pattern.firstMatch(b)?.group(1) ?? '');
    return an != null && bn != null ? an.compareTo(bn) : a.compareTo(b);
  }

  /// Read the package/spine before mounting a WebView. Do not treat ZIP files,
  /// damaged exports or missing chapters as successfully loaded blank books.
  static Future<void> validateEpub(File file) => EpubValidation.validate(file);

  static Future<File> convertDocumentToEpub(File inputFile) async {
    final ext = inputFile.path.split('.').last.toLowerCase();
    if (!['txt', 'docx', 'hwpx', 'hwp', 'doc'].contains(ext)) {
      throw const FormatException('지원하지 않는 문서 형식입니다.');
    }
    if (ext == 'txt') return TxtReaderService.convert(inputFile);
    final bytes = await inputFile.readAsBytes();
    if (bytes.isEmpty) throw const FormatException('파일이 비어 있습니다.');
    final title = inputFile.uri.pathSegments.last.replaceAll(RegExp(r'\.[^.]+$'), '');
    List<Map<String, dynamic>> blocks;
    switch (ext) {
      case 'docx':
        blocks = _extractDocxStructuredBlocks(bytes);
        break;
      case 'hwpx':
        blocks = _extractHwpxStructuredBlocks(bytes);
        break;
      case 'hwp':
        blocks = _extractHwp5StructuredBlocks(bytes);
        break;
      default:
        throw const FormatException('구형 DOC는 DOCX 또는 PDF로 저장한 뒤 열어 주세요.');
    }
    if (blocks.isEmpty || !blocks.any((b) =>
        b['type'] == 'image' || b['type'] == 'table' ||
        (b['text'] as String? ?? '').trim().isNotEmpty)) {
      throw const FormatException('문서에서 읽을 수 있는 본문이나 그림을 찾지 못했습니다.');
    }
    // Keep the existing cache name so bookmarks and memo keys remain compatible.
    final outFile = File(inputFile.path.replaceFirst(
      RegExp(r'\.(txt|docx|doc|hwpx|hwp)$', caseSensitive: false),
      '_v25_converted.epub',
    ));
    return _buildEpubArchive(outFile, title, blocks);
  }

  static String _blockStyle(Map<String, dynamic> block) {
    final styles = <String>['white-space:pre-wrap', 'overflow-wrap:anywhere'];
    final align = block['align'];
    if (['left', 'center', 'right', 'justify'].contains(align)) {
      styles.add('text-align:$align');
    }
    if (block['bold'] == true) styles.add('font-weight:bold');
    if (block['italic'] == true) styles.add('font-style:italic');
    if (block['underline'] == true) styles.add('text-decoration:underline');
    if (block['serif'] == true) styles.add('font-family:serif');
    final size = (block['fontSizePt'] as num?)?.toDouble();
    if (size != null) styles.add('font-size:${(size / 10.5).clamp(0.7, 3.5)}em');
    final indent = (block['leftIndentPt'] as num?)?.toDouble() ?? 0;
    if (indent > 0) styles.add('margin-left:${indent.clamp(0, 120)}pt');
    return styles.join(';');
  }

  static Future<File> _buildEpubArchive(
    File outFile, String title, List<Map<String, dynamic>> blocks,
  ) async {
    final archive = Archive();
    void addText(String path, String text) {
      final data = utf8.encode(text);
      archive.addFile(ArchiveFile(path, data.length, data));
    }
    final mimetype = utf8.encode('application/epub+zip');
    archive.addFile(ArchiveFile('mimetype', mimetype.length, mimetype)..compress = false);
    addText('META-INF/container.xml', '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>''');

    final mediaManifest = StringBuffer();
    final imagePaths = <String, String>{};
    String imageHtml(dynamic raw) {
      if (raw is! List<int> || raw.isEmpty) return '';
      final key = base64Encode(raw);
      var path = imagePaths[key];
      if (path == null) {
        final (String ext, String mime) = raw.length >= 4 && raw[0] == 0x89 && raw[1] == 0x50
            ? ('png', 'image/png')
            : raw.length >= 3 && raw[0] == 0xFF && raw[1] == 0xD8
                ? ('jpg', 'image/jpeg')
                : raw.length >= 3 && raw[0] == 0x47 && raw[1] == 0x49
                    ? ('gif', 'image/gif')
                    : raw.length >= 12 && raw[0] == 0x52 && raw[8] == 0x57
                        ? ('webp', 'image/webp') : ('bmp', 'image/bmp');
        final id = 'image${imagePaths.length + 1}';
        path = 'images/$id.$ext';
        imagePaths[key] = path;
        archive.addFile(ArchiveFile('OEBPS/$path', raw.length, raw));
        mediaManifest.writeln('<item id="$id" href="$path" media-type="$mime"/>');
      }
      return '<img src="$path" alt="" style="max-width:100%;height:auto;object-fit:contain;"/>';
    }
    String blockHtml(Map<String, dynamic> block) {
      if (block['type'] == 'image') return '<div>${imageHtml(block['bytes'])}</div>';
      if (block['type'] != 'table') {
        final text = block['text'] as String? ?? '';
        return '<p style="${_blockStyle(block)}">${text.isEmpty ? '&#160;' : _escapeXml(text)}</p>';
      }
      final rows = ((block['numRows'] as num?)?.toInt() ?? 1).clamp(1, 500);
      final cols = ((block['numCols'] as num?)?.toInt() ?? 1).clamp(1, 100);
      final cells = (block['cells'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
      final occupied = <String>{};
      final byPosition = {for (final c in cells) '${c['row']}:${c['col']}': c};
      final html = StringBuffer('<table style="border-collapse:collapse;width:100%;table-layout:fixed;"><tbody>');
      for (var r = 0; r < rows; r++) {
        html.write('<tr>');
        for (var c = 0; c < cols; c++) {
          if (occupied.contains('$r:$c')) continue;
          final cell = byPosition['$r:$c'];
          if (cell == null) { html.write('<td></td>'); continue; }
          final rs = ((cell['rowSpan'] as num?)?.toInt() ?? 1).clamp(1, rows - r);
          final cs = ((cell['colSpan'] as num?)?.toInt() ?? 1).clamp(1, cols - c);
          for (var rr = r; rr < r + rs; rr++) {
            for (var cc = c; cc < c + cs; cc++) { occupied.add('$rr:$cc'); }
          }
          final valign = ['top', 'middle', 'bottom'].contains(cell['vAlign']) ? cell['vAlign'] : 'middle';
          html.write('<td rowspan="$rs" colspan="$cs" style="border:1px solid currentColor;padding:0.4em;vertical-align:$valign;${_blockStyle(cell)}">');
          html.write(_escapeXml(cell['text'] as String? ?? ''));
          for (final image in (cell['images'] as List<dynamic>? ?? [])) {
            html.write(imageHtml(image));
          }
          html.write('</td>');
        }
        html.write('</tr>');
      }
      html.write('</tbody></table>');
      return html.toString();
    }

    // Bound chapter size so large TXT files do not become one enormous WebView
    // layout. Do not split tables or images between chapters.
    final chapters = <String>[];
    var body = StringBuffer();
    for (final block in blocks) {
      body.writeln(blockHtml(block));
      if (body.length >= 48000) { chapters.add(body.toString()); body = StringBuffer(); }
    }
    if (body.isNotEmpty) chapters.add(body.toString());
    final manifest = StringBuffer();
    final spine = StringBuffer();
    final nav = StringBuffer();
    final uid = 'urn:freader:${DateTime.now().microsecondsSinceEpoch}';
    for (var i = 0; i < chapters.length; i++) {
      final id = 'chap${i + 1}';
      final name = 'chapter${i + 1}.xhtml';
      addText('OEBPS/$name', '''<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko"><head><title>${_escapeXml(title)}</title>
<style type="text/css">html,body{font-family:sans-serif;line-height:1.75;word-break:keep-all;}body{padding:4%;}p{margin:0.45em 0;}img{max-width:100%;max-height:90vh;}td{overflow-wrap:anywhere;}</style>
</head><body>${i == 0 ? '<h2>${_escapeXml(title)}</h2>' : ''}${chapters[i]}</body></html>''');
      manifest.writeln('<item id="$id" href="$name" media-type="application/xhtml+xml"/>');
      spine.writeln('<itemref idref="$id"/>');
      nav.writeln('<navPoint id="$id" playOrder="${i + 1}"><navLabel><text>${_escapeXml(title)}${chapters.length > 1 ? ' (${i + 1})' : ''}</text></navLabel><content src="$name"/></navPoint>');
    }
    addText('OEBPS/content.opf', '''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${_escapeXml(title)}</dc:title><dc:language>ko</dc:language><dc:identifier id="BookId">$uid</dc:identifier></metadata>
<manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>$manifest$mediaManifest</manifest><spine toc="ncx">$spine</spine></package>''');
    addText('OEBPS/toc.ncx', '''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="$uid"/></head><docTitle><text>${_escapeXml(title)}</text></docTitle><navMap>$nav</navMap></ncx>''');
    final zipBytes = ZipEncoder().encode(archive)!;
    final temp = File('${outFile.path}.tmp');
    try {
      await temp.writeAsBytes(zipBytes, flush: true);
      await temp.rename(outFile.path);
    } finally {
      if (await temp.exists()) await temp.delete();
    }
    return outFile;
  }

  static String _escapeXml(String s) {
    // XML 1.0 forbids NUL/control characters; one such character used to make
    // the whole XHTML chapter fail to parse and appear blank.
    final clean = String.fromCharCodes(s.runes.where((r) =>
        r == 9 || r == 10 || r == 13 ||
        (r >= 0x20 && r <= 0xD7FF) || (r >= 0xE000 && r <= 0xFFFD) ||
        (r >= 0x10000 && r <= 0x10FFFF)));
    return const HtmlEscape(HtmlEscapeMode.element).convert(clean)
        .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
  }

  static String _extractHwpxText(String fragment) {
    final doc = XmlDocument.parse(fragment);
    String textOf(XmlNode node) {
      if (node is XmlText || node is XmlCDATA) return node.value ?? '';
      if (node is XmlElement) {
        if (node.name.local == 'tab') return '\t';
        if (node.name.local == 'lineBreak') return '\n';
      }
      return node.children.map(textOf).join();
    }
    return doc.descendants.whereType<XmlElement>()
        .where((e) => e.name.qualified == 'hp:t').map(textOf).join().trimRight();
  }
}
