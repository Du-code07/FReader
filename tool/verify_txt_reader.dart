// Run after flutter pub get: dart run tool/verify_txt_reader.dart
// Regression checks use the production TXT service, without an Android device.
import 'dart:convert';
import 'dart:io';

import 'package:archive/archive.dart';
import 'package:xml/xml.dart';

import '../lib/services/txt_reader_service.dart';
import '../lib/services/txt_to_epub_converter.dart';

void check(bool ok, String message) {
  if (!ok) throw StateError(message);
}

Future<String> readBody(File epub) async {
  await TxtToEpubConverter.validateEpub(epub);
  final zip = ZipDecoder().decodeBytes(await epub.readAsBytes(), verify: true);
  check(
    zip.first.name == 'mimetype' && !zip.first.isCompressed,
    'EPUB mimetype',
  );
  final result = StringBuffer();
  for (final chapter in zip.files.where((f) => f.name.endsWith('.xhtml'))) {
    final source = utf8.decode(chapter.content as List<int>);
    check(source.length < 34000, 'Unbounded TXT chapter');
    final xml = XmlDocument.parse(source);
    check(xml.findAllElements('script').isEmpty, 'TXT interpreted as script');
    result.write(xml.findAllElements('div').single.innerText);
  }
  return result.toString();
}

Future<void> main() async {
  final dir = await Directory.systemTemp.createTemp('freader-txt-test-');
  try {
    const text = '한글 😀\r\n\r\n  들여쓰기\tA  B\r<script>&끝</script>\n';
    final expected = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    final fixtures = <String, List<int>>{
      'utf8': utf8.encode(text),
      'utf8-bom': [0xef, 0xbb, 0xbf, ...utf8.encode(text)],
      'utf16le': [
        0xff,
        0xfe,
        for (final c in text.codeUnits) ...[c & 255, c >> 8],
      ],
      'utf16be': [
        0xfe,
        0xff,
        for (final c in text.codeUnits) ...[c >> 8, c & 255],
      ],
      'utf32le': [
        0xff,
        0xfe,
        0,
        0,
        for (final c in text.runes) ...[
          c & 255,
          c >> 8 & 255,
          c >> 16 & 255,
          c >> 24,
        ],
      ],
      'utf32be': [
        0,
        0,
        0xfe,
        0xff,
        for (final c in text.runes) ...[
          c >> 24,
          c >> 16 & 255,
          c >> 8 & 255,
          c & 255,
        ],
      ],
    };
    for (final fixture in fixtures.entries) {
      final file = File('${dir.path}/${fixture.key}.txt');
      await file.writeAsBytes(fixture.value);
      check(
        await readBody(await TxtToEpubConverter.convertTxtToEpub(file)) ==
            expected,
        '${fixture.key}: changed/lost text',
      );
    }
    // Known CP949/EUC-KR bytes, independent of the package's encoder.
    final korean = File('${dir.path}/cp949.txt');
    const bytes = [
      0xc7,
      0xd1,
      0xb1,
      0xdb,
      13,
      10,
      0xbe,
      0xc6,
      0xb8,
      0xa7,
      0xb4,
      0xd9,
      0xbf,
      0xee,
    ];
    await korean.writeAsBytes(bytes);
    check(
      await readBody(await TxtReaderService.convert(korean)) == '한글\n아름다운',
      'CP949',
    );
    check(
      await TxtReaderService.decodeChunks(
            Stream.fromIterable(bytes.map((b) => [b])),
            'cp949',
          ).join() ==
          '한글\r\n아름다운',
      'CP949 chunk boundary',
    );
    print(
      'PASS TXT UTF-8/16/32, CP949/EUC-KR, emoji, whitespace and escaped HTML',
    );

    final long = File('${dir.path}/long.txt');
    final longText = 'BEGIN${List.filled(40000, '😀<>&한글').join()}END';
    await long.writeAsString(longText);
    final outputs = await Future.wait([
      TxtReaderService.convert(long),
      TxtReaderService.convert(long),
    ]);
    check(outputs[0].path == outputs[1].path, 'Concurrent conversion');
    check(
      await readBody(outputs.first) == longText,
      'Long single line truncated',
    );
    final good = base64Encode(await outputs.first.readAsBytes());
    await long.writeAsBytes([0xef, 0xbb, 0xbf, 0xff]);
    var failed = false;
    try {
      await TxtReaderService.convert(long);
    } on FormatException {
      failed = true;
    }
    check(failed, 'Malformed BOM-marked UTF-8 accepted');
    check(
      base64Encode(await outputs.first.readAsBytes()) == good,
      'Previous EPUB destroyed on error',
    );
    check(
      dir.listSync().whereType<Directory>().isEmpty,
      'Temporary conversion files leaked',
    );
    print(
      'PASS TXT bounded chapters, concurrent opens, invalid input and atomic output',
    );
  } finally {
    await dir.delete(recursive: true);
  }
}
