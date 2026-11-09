import 'dart:convert';
import 'dart:io';
import 'dart:isolate';

import 'package:archive/archive_io.dart';
import 'package:xml/xml.dart';

/// Validate metadata without reading/decompressing the entire illustrated book.
class EpubValidation {
  static Future<void> validate(File file) => Isolate.run(() => _validate(file.path));

  static void _validate(String path) {
    final input = InputFileStream(path);
    try {
      final archive = ZipDecoder().decodeBuffer(input);
      final lower = <String, ArchiveFile?>{};
      for (final entry in archive.files.where((e) => e.isFile)) {
        final key = entry.name.toLowerCase();
        lower[key] = lower.containsKey(key) ? null : entry;
      }
      ArchiveFile? find(String name) => archive.findFile(name) ?? lower[name.toLowerCase()];
      XmlDocument read(ArchiveFile? entry, String name) {
        if (entry == null || !entry.isFile) throw FormatException('EPUB 내부 파일이 없습니다: $name');
        if (entry.size > 16 * 1024 * 1024) throw FormatException('EPUB 메타데이터가 너무 큽니다: $name');
        final bytes = entry.content as List<int>;
        String source;
        if (bytes.length >= 2 && ((bytes[0] == 0xff && bytes[1] == 0xfe) || (bytes[0] == 0xfe && bytes[1] == 0xff))) {
          if (bytes.length.isOdd) throw FormatException('잘못된 EPUB XML 인코딩: $name');
          final little = bytes[0] == 0xff;
          source = String.fromCharCodes([
            for (var i = 2; i < bytes.length; i += 2)
              little ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1],
          ]);
        } else {
          source = utf8.decode(bytes);
        }
        return XmlDocument.parse(source);
      }
      final container = read(find('META-INF/container.xml'), 'META-INF/container.xml');
      final root = container.descendants.whereType<XmlElement>()
          .where((e) => e.name.local == 'rootfile').firstOrNull;
      final raw = root?.getAttribute('full-path');
      if (raw == null || raw.isEmpty) throw const FormatException('EPUB 패키지 경로가 없습니다.');
      final rootUri = Uri.parse(raw);
      if (rootUri.hasScheme || rootUri.hasAuthority) throw const FormatException('EPUB 패키지 경로가 올바르지 않습니다.');
      final opfPath = Uri.decodeComponent(rootUri.normalizePath().path).replaceFirst(RegExp(r'^/'), '');
      final entry = find(opfPath);
      final opf = read(entry, opfPath);
      final items = <String, String>{};
      for (final item in opf.descendants.whereType<XmlElement>().where((e) => e.name.local == 'item')) {
        final id = item.getAttribute('id'), href = item.getAttribute('href');
        if (id != null && href != null) items[id] = href;
      }
      final spine = opf.descendants.whereType<XmlElement>().where((e) => e.name.local == 'itemref').toList();
      if (spine.isEmpty) throw const FormatException('EPUB 본문 목록이 비어 있습니다.');
      final base = Uri(path: '/${entry!.name}');
      for (final ref in spine) {
        final href = items[ref.getAttribute('idref')];
        if (href == null) throw const FormatException('EPUB 본문 참조가 올바르지 않습니다.');
        final uri = base.resolve(href);
        final name = Uri.decodeComponent(uri.path).replaceFirst(RegExp(r'^/'), '');
        if (uri.hasScheme || uri.hasAuthority || find(name)?.isFile != true) {
          throw FormatException('EPUB 본문을 찾을 수 없습니다: $href');
        }
      }
    } finally {
      input.closeSync();
    }
  }
}
