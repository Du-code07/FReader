import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:archive/archive_io.dart';
import 'package:cp949_codec/cp949_codec.dart';

/// Offline TXT adapter for the existing flutter_epub_viewer / Epub.js reader.
/// Decode and write bounded chapters off the UI isolate; no platform channel
/// carries the entire source or its decoded text.
class TxtReaderService {
  static const maxInputBytes = 256 * 1024 * 1024;
  static final Map<String, Future<File>> _pending = {};

  static Future<File> convert(File input) async {
    final path = input.absolute.path;
    final pending = _pending[path];
    if (pending != null) return pending;
    final task = Isolate.run(() => _convert(path)).then(File.new);
    _pending[path] = task;
    try {
      return await task;
    } finally {
      _pending.remove(path);
    }
  }

  static Future<String> _convert(String path) async {
    if (!path.toLowerCase().endsWith('.txt')) {
      throw const FormatException('TXT 파일이 아닙니다.');
    }
    final input = File(path);
    final before = await input.stat();
    if (before.size == 0) throw const FormatException('TXT 파일이 비어 있습니다.');
    if (before.size > maxInputBytes) {
      throw const FormatException('TXT 파일은 최대 256 MiB까지 열 수 있습니다.');
    }
    final handle = await input.open();
    late final Uint8List sample;
    try {
      sample = await handle.read(8192);
    } finally {
      await handle.close();
    }
    final (encoding, bomLength) = _detect(sample);
    // Retain the existing document identity used for saved CFIs and memos.
    final output = '${path.substring(0, path.length - 4)}_v25_converted.epub';
    final tempDir = await input.parent.createTemp('.freader-txt-');
    final temp = File('${tempDir.path}/book.epub');
    final title = input.uri.pathSegments.last.replaceFirst(
      RegExp(r'\.txt$', caseSensitive: false),
      '',
    );
    try {
      try {
        await _write(input, temp, title, encoding, bomLength);
      } on FormatException {
        // BOMs are authoritative. Only a BOM-less strict UTF-8 failure may
        // retry Korean Windows ANSI (CP949, a superset of EUC-KR).
        if (encoding != 'utf8' || bomLength != 0) rethrow;
        try {
          await _write(input, temp, title, 'cp949', 0);
        } on FormatException {
          throw const FormatException(
            'TXT 인코딩을 읽을 수 없습니다. UTF-8, CP949/EUC-KR 또는 '
            'BOM이 있는 UTF-16/UTF-32 파일인지 확인해 주세요.',
          );
        }
      }
      final after = await input.stat();
      if (after.size != before.size || after.modified != before.modified) {
        throw const FileSystemException('읽는 중 TXT 파일이 변경되었습니다. 다시 열어 주세요.');
      }
      await temp.rename(output);
      return output;
    } finally {
      if (await tempDir.exists()) await tempDir.delete(recursive: true);
    }
  }

  static (String, int) _detect(Uint8List b) {
    bool starts(List<int> prefix) =>
        b.length >= prefix.length &&
        List.generate(prefix.length, (i) => b[i] == prefix[i]).every((v) => v);
    if (starts([0xff, 0xfe, 0, 0])) return ('utf32le', 4);
    if (starts([0, 0, 0xfe, 0xff])) return ('utf32be', 4);
    if (starts([0xef, 0xbb, 0xbf])) return ('utf8', 3);
    if (starts([0xff, 0xfe])) return ('utf16le', 2);
    if (starts([0xfe, 0xff])) return ('utf16be', 2);
    // Conservative BOM-less detection: ASCII characters/newlines must provide
    // a clear zero-byte lane. Pure Hangul without a BOM can be ambiguous.
    if (b.length >= 8) {
      final zeros = List<int>.filled(4, 0);
      final groups = b.length ~/ 4;
      for (var i = 0; i < groups * 4; i++) {
        if (b[i] == 0) zeros[i % 4]++;
      }
      if (zeros[2] > groups * .8 &&
          zeros[3] > groups * .8 &&
          zeros[0] < groups * .2)
        return ('utf32le', 0);
      if (zeros[0] > groups * .8 &&
          zeros[1] > groups * .8 &&
          zeros[3] < groups * .2)
        return ('utf32be', 0);
      final even = zeros[0] + zeros[2];
      final odd = zeros[1] + zeros[3];
      if (odd >= 2 && odd > groups * .3 && even < odd * .2)
        return ('utf16le', 0);
      if (even >= 2 && even > groups * .3 && odd < even * .2)
        return ('utf16be', 0);
    }
    return ('utf8', 0);
  }

  static Future<void> _write(
    File input,
    File output,
    String title,
    String encoding,
    int skip,
  ) async {
    final stream = OutputFileStream(output.path);
    final zip = ZipEncoder()..startEncode(stream);
    final writer = _TxtEpubWriter(zip, title);
    try {
      writer.start();
      await for (final text in decodeChunks(input.openRead(skip), encoding)) {
        writer.add(text);
      }
      writer.finish();
      zip.endEncode();
    } finally {
      await stream.close();
    }
  }

  /// Strict streaming codecs. Keep incomplete byte sequences and UTF-16
  /// surrogate pairs across chunks, including single-byte stream chunks.
  static Stream<String> decodeChunks(
    Stream<List<int>> source,
    String encoding,
  ) async* {
    if (encoding == 'utf8') {
      yield* source.transform(utf8.decoder);
      return;
    }
    var pending = <int>[];
    int? highSurrogate;
    await for (final chunk in source) {
      final bytes = Uint8List(pending.length + chunk.length)
        ..setAll(0, pending)
        ..setAll(pending.length, chunk);
      var end = 0;
      if (encoding == 'cp949') {
        while (end < bytes.length) {
          if (bytes[end] < 0x80) {
            end++;
          } else {
            if (end + 1 >= bytes.length) break;
            end += 2;
          }
        }
        if (end > 0) yield cp949.decode(Uint8List.sublistView(bytes, 0, end));
      } else {
        final width = encoding.startsWith('utf32') ? 4 : 2;
        final endian = encoding.endsWith('le') ? Endian.little : Endian.big;
        final data = ByteData.sublistView(bytes);
        final text = StringBuffer();
        while (end + width <= bytes.length) {
          final value = width == 4
              ? data.getUint32(end, endian)
              : data.getUint16(end, endian);
          end += width;
          if (width == 4) {
            if (value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
              throw const FormatException('올바르지 않은 UTF-32 문자입니다.');
            }
            text.writeCharCode(value);
          } else if (highSurrogate != null) {
            if (value < 0xdc00 || value > 0xdfff) {
              throw const FormatException('올바르지 않은 UTF-16 문자입니다.');
            }
            text.writeCharCode(
              0x10000 + ((highSurrogate - 0xd800) << 10) + value - 0xdc00,
            );
            highSurrogate = null;
          } else if (value >= 0xd800 && value <= 0xdbff) {
            highSurrogate = value;
          } else if (value >= 0xdc00 && value <= 0xdfff) {
            throw const FormatException('올바르지 않은 UTF-16 문자입니다.');
          } else {
            text.writeCharCode(value);
          }
        }
        if (text.isNotEmpty) yield text.toString();
      }
      pending = bytes.sublist(end);
    }
    if (pending.isNotEmpty || highSurrogate != null) {
      throw const FormatException('TXT 파일 끝의 문자 데이터가 잘렸습니다.');
    }
  }
}

class _TxtEpubWriter {
  final ZipEncoder zip;
  final String title;
  final StringBuffer _manifest = StringBuffer();
  final StringBuffer _spine = StringBuffer();
  final StringBuffer _nav = StringBuffer();
  StringBuffer _body = StringBuffer();
  int _chapters = 0;
  bool _lastWasCr = false;
  final String _uid =
      'urn:freader:txt:${DateTime.now().microsecondsSinceEpoch}';
  static const _chapterLimit = 32000;

  _TxtEpubWriter(this.zip, this.title);

  void _file(String name, String text, {bool compress = true}) {
    final bytes = utf8.encode(text);
    zip.addFile(ArchiveFile(name, bytes.length, bytes)..compress = compress);
  }

  void start() {
    _file('mimetype', 'application/epub+zip', compress: false);
    _file(
      'META-INF/container.xml',
      '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>''',
    );
  }

  void add(String text) {
    // Bound even a single newline-free line. Rune iteration never splits emoji
    // surrogate pairs; CRLF split across input chunks still becomes one LF.
    for (var rune in text.runes) {
      if (_lastWasCr && rune == 10) {
        _lastWasCr = false;
        continue;
      }
      _lastWasCr = rune == 13;
      if (rune == 13) rune = 10;
      if (rune != 9 &&
          rune != 10 &&
          !(rune >= 0x20 && rune <= 0xd7ff) &&
          !(rune >= 0xe000 && rune <= 0xfffd) &&
          !(rune >= 0x10000 && rune <= 0x10ffff))
        continue;
      if (rune == 38) {
        _body.write('&amp;');
      } else if (rune == 60) {
        _body.write('&lt;');
      } else if (rune == 62) {
        _body.write('&gt;');
      } else {
        _body.writeCharCode(rune);
      }
      if (_body.length >= _chapterLimit ||
          (rune == 10 && _body.length >= _chapterLimit - 4000))
        _flush();
    }
  }

  void _flush() {
    if (_body.isEmpty) return;
    _chapters++;
    final id = 'chap$_chapters';
    final name = 'chapter$_chapters.xhtml';
    final escapedTitle = _xml(title);
    _file(
      'OEBPS/$name',
      '''<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko"><head><title>$escapedTitle</title>
<style type="text/css">html,body{font-family:sans-serif;line-height:1.75;}body{padding:4%;}.txt-content{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;tab-size:4;}</style>
</head><body>${_chapters == 1 ? '<h2>$escapedTitle</h2>' : ''}<div class="txt-content">$_body</div></body></html>''',
    );
    _manifest.writeln(
      '<item id="$id" href="$name" media-type="application/xhtml+xml"/>',
    );
    _spine.writeln('<itemref idref="$id"/>');
    _nav.writeln(
      '<navPoint id="$id" playOrder="$_chapters"><navLabel><text>$escapedTitle ($_chapters)</text></navLabel><content src="$name"/></navPoint>',
    );
    _body = StringBuffer();
  }

  void finish() {
    _flush();
    if (_chapters == 0) throw const FormatException('TXT 파일에 표시할 문자가 없습니다.');
    _file(
      'OEBPS/content.opf',
      '''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${_xml(title)}</dc:title><dc:language>ko</dc:language><dc:identifier id="BookId">$_uid</dc:identifier></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>$_manifest</manifest><spine toc="ncx">$_spine</spine></package>''',
    );
    _file(
      'OEBPS/toc.ncx',
      '''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="$_uid"/></head><docTitle><text>${_xml(title)}</text></docTitle><navMap>$_nav</navMap></ncx>''',
    );
  }

  static String _xml(String text) => const HtmlEscape(
    HtmlEscapeMode.element,
  ).convert(text).replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
