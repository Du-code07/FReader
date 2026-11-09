// Run after flutter pub get: dart run tool/verify_docx_layout.dart
import 'dart:convert';
import 'dart:io';
import 'package:archive/archive.dart';
import '../lib/services/docx_layout_hints.dart';

void check(bool condition, String message) {
  if (!condition) throw StateError(message);
}

void main() {
  final dir = Directory.systemTemp.createTempSync('freader-docx-test-');
  try {
    const w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    final parts = <String, String>{
      'word/document.xml': '''<w:document xmlns:w="$w"><w:body>
<w:p><w:pPr><w:pStyle w:val="child"/><w:ind w:hanging="360"/><w:tabs><w:tab w:val="center" w:pos="1440"/><w:tab w:val="right" w:pos="2880" w:leader="dot"/></w:tabs></w:pPr><w:r><w:rPr><w:spacing w:val="-20"/></w:rPr><w:t>한글😀</w:t><w:tab/><w:t>끝</w:t><w:lastRenderedPageBreak/><w:t>다음</w:t><w:br w:type="page"/><w:t>끝</w:t></w:r></w:p>
<w:tbl><w:tblPr><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="3000"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="360" w:hRule="atLeast"/></w:trPr><w:tc><w:tcPr><w:shd w:fill="E5E5E5"/><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>표</w:t></w:r></w:p></w:tc><w:tc><w:p/></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:vMerge/></w:tcPr><w:p/></w:tc><w:tc><w:p/></w:tc></w:tr></w:tbl>
<w:p><w:pPr><w:pStyle w:val="cycle"/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440"/></w:sectPr></w:pPr></w:p>
<w:p><w:r><w:t>가로 페이지</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="16838" w:h="11906"/></w:sectPr>
</w:body></w:document>''',
      'word/styles.xml':
          '''<w:styles xmlns:w="$w"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:styleId="base" w:type="paragraph" w:default="1"><w:pPr><w:ind w:left="720"/><w:keepNext/></w:pPr></w:style><w:style w:styleId="child"><w:basedOn w:val="base"/><w:pPr><w:ind w:right="240"/></w:pPr></w:style><w:style w:styleId="cycle"><w:basedOn w:val="cycle"/></w:style></w:styles>''',
      'word/theme/theme1.xml':
          '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:font script="Hang" typeface="맑은 고딕"/></a:minorFont></a:theme>',
      'word/settings.xml':
          '<w:settings xmlns:w="$w"><w:defaultTabStop w:val="800"/></w:settings>',
    };
    final archive = Archive();
    for (final e in parts.entries) {
      final bytes = utf8.encode(e.value);
      archive.addFile(ArchiveFile(e.key, bytes.length, bytes));
    }
    final f = File('${dir.path}/layout.docx')
      ..writeAsBytesSync(ZipEncoder().encode(archive)!);
    final original = f.readAsBytesSync();
    final h = DocxLayoutHints.readLayout(f.path),
        p = (h['paragraphs'] as List).first;
    check(p['text'] == '한글😀\t끝다음끝', 'Unicode/tab contents changed');
    check(
      p['cachedBreaks'].single == 6 && p['breaks'].single == 8,
      'UTF-16 page-break offsets',
    );
    check(
      p['props']['ind']['left'] == '720' &&
          p['props']['ind']['right'] == '240' &&
          p['props']['ind']['hanging'] == '360',
      'Inherited indents',
    );
    check(p['props']['tabs']['stops'].length == 2, 'Multiple tab stops lost');
    check(
      p['runs'].first['props']['spacing']['val'] == '-20',
      'Run spacing lost',
    );
    check(
      (h['theme'] as Map)['minor']['eastAsia'] == '맑은 고딕',
      'East Asian theme font',
    );
    check(h['defaultTab'] == 800, 'Document default tab stop');
    final table = (h['tables'] as List).single;
    check(table['grid'].join(',') == '2000.0,3000.0', 'Table grid');
    check(
      table['props']['tblCellMar']['children']['left']['w'] == '120',
      'Cell padding',
    );
    check(
      table['rows'][0]['cells'][0]['props']['shd']['fill'] == 'E5E5E5',
      'Cell shading',
    );
    check(
      table['rows'][1]['cells'][0]['continuation'] == true,
      'Merged-cell continuation',
    );
    check(
      (h['sections'] as List).length == 2 &&
          (h['sections'] as List).last['props']['pgSz']['w'] == '16838',
      'Section geometry',
    );
    check(
      base64Encode(f.readAsBytesSync()) == base64Encode(original),
      'Original document modified',
    );
    f.writeAsStringSync('not a ZIP');
    check(
      DocxLayoutHints.readLayout(f.path).isEmpty,
      'Invalid/encrypted fallback',
    );
    print(
      'PASS DOCX Unicode, styles, tabs, table layout, merges, sections, safe fallback',
    );
  } finally {
    dir.deleteSync(recursive: true);
  }
}
