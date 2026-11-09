// Regression helper; executed by epub_transport_test.dart in Flutter.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_epub_viewer/src/server/epub_book_server.dart';
import 'package:flutter_epub_viewer/src/server/epub_zip.dart';

import '../lib/services/txt_reader_service.dart';

void expect(dynamic actual, dynamic expected) {
  final ok = expected is bool Function(dynamic)
      ? expected(actual)
      : actual == expected;
  if (!ok) throw StateError('Transport check failed: $actual / $expected');
}

bool Function(dynamic) startsWith(String value) =>
    (v) => v is String && v.startsWith(value);
bool Function(dynamic) contains(String value) =>
    (v) => v is String && v.contains(value);
bool Function(dynamic) greaterThan(num value) =>
    (v) => v is num && v > value;
bool Function(dynamic) lessThan(num value) =>
    (v) => v is num && v < value;
bool Function(dynamic) isNot(dynamic value) =>
    (v) => v != value;
bool isEmpty(dynamic value) => value.isEmpty == true;
bool isNull(dynamic value) => value == null;
Future<void> main() async {
  await verifyEpubTransport();
  print(
    'PASS Android EPUB routing: TXT first/last, same origin, bounded chapters, tokens, close, invalid paths',
  );
}

Future<void> verifyEpubTransport() async {
  final dir = await Directory.systemTemp.createTemp('freader-epub-');
  final server = EpubBookServer.instance;
  final urls = <Uri>[];
  EpubBookServer.debugUseInterception = true;
  server.debugRequestLog = [];
  try {
    final file = File('${dir.path}/한글 공백 #1.txt');
    final original = '시작 😀\n${List.filled(30000, '한글 <>& 긴 문장\n').join()}마지막';
    await file.writeAsString(original);
    final epub = await TxtReaderService.convert(file);
    final zip = await EpubZip.openFile(epub.path);
    final url = await server.register(zip);
    urls.add(url);
    expect(url.origin, 'https://appassets.androidplatform.net');
    expect(url.path, startsWith('/books/'));
    expect(server.debugRequestLog, isEmpty);
    final container = await server.intercept(
      url.resolve('META-INF/container.xml'),
    );
    expect(container!.statusCode, 200);
    expect(utf8.decode(container.body), contains('OEBPS/content.opf'));
    final package = await server.intercept(url.resolve('OEBPS/content.opf'));
    expect(package!.statusCode, 200);
    expect(package.contentType, 'application/oebps-package+xml');
    // Read actual ZIP entries via the same routing used by Android's callback.
    final chapters = zip.entries.values
        .where((e) => e.name.endsWith('.xhtml'))
        .toList();
    expect(chapters.length, greaterThan(1));
    final first = await server.intercept(url.resolve(chapters.first.name));
    final last = await server.intercept(url.resolve(chapters.last.name));
    expect(utf8.decode(first!.body), contains('시작 😀'));
    expect(utf8.decode(last!.body), contains('마지막'));
    expect(first.body.length, lessThan(100000));
    expect(server.debugRequestLog!.length, 4); // No whole-archive request.
    expect(await file.readAsString(), original);
    expect(
      await server.intercept(
        Uri.parse('${url.origin}/assets/flutter_assets/reader.html'),
      ),
      isNull,
    );
    expect(
      await server.intercept(Uri.parse('https://example.org/books/anything/')),
      isNull,
    );
    expect(
      (await server.intercept(url.resolve('missing.xhtml')))!.statusCode,
      404,
    );
    expect(
      (await server.intercept(
        Uri.parse('${url.origin}/books/wrong/OEBPS/content.opf'),
      ))!.statusCode,
      404,
    );
    // Concurrent readers use different tokens; closing one cannot close the other.
    final second = await server.register(zip);
    urls.add(second);
    expect(second, isNot(url));
    await server.unregister(url);
    expect(
      (await server.intercept(url.resolve('OEBPS/content.opf')))!.statusCode,
      404,
    );
    expect(
      (await server.intercept(second.resolve('OEBPS/content.opf')))!.statusCode,
      200,
    );
  } finally {
    for (final url in urls) {
      await server.unregister(url);
    }
    EpubBookServer.debugUseInterception = null;
    server.debugRequestLog = null;
    await dir.delete(recursive: true);
  }
  expect(server.bookCount, 0);
}
