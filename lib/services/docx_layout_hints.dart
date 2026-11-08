import 'dart:convert';
import 'dart:io';
import 'package:archive/archive.dart';
import 'package:xml/xml.dart';

/// Supplement the engine's paragraph breaks with Word's inline page breaks.
/// Only layout hints are read; the original document bytes are never changed.
class DocxLayoutHints {
  static List<Map<String, Object>> read(String path) {
    try {
      final bytes = File(path).readAsBytesSync();
      // Encrypted Office files are compound files; the engine decrypts them.
      if (bytes.length < 4 || bytes[0] != 0x50 || bytes[1] != 0x4b) return [];
      final archive = ZipDecoder().decodeBytes(bytes);
      final entry = archive.findFile('word/document.xml');
      if (entry == null || entry.size > 16 * 1024 * 1024) return [];
      final xml = XmlDocument.parse(utf8.decode(entry.content as List<int>));
      return _readXml(xml);
    } catch (_) {
      // Hints are optional. Format/password errors are reported by the engine.
      return [];
    }
  }

  static List<Map<String, Object>> _readXml(XmlDocument xml) {
    const word = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    final paragraphs = xml.findAllElements('p', namespace: word);
    final result = <Map<String, Object>>[];
    var index = 0;
    for (final paragraph in paragraphs) {
      final text = StringBuffer();
      final offsets = <int>[];
      for (final node in paragraph.descendants.whereType<XmlElement>()) {
        if (node.name.namespaceUri != word) continue;
        if (node.name.local == 't') text.write(node.innerText);
        if (node.name.local == 'br' &&
            node.getAttribute('type', namespace: word) == 'page') {
          offsets.add(text.length);
        }
      }
      if (offsets.isNotEmpty) {
        result.add({
          'index': index,
          'text': text.toString(),
          'offsets': offsets,
        });
      }
      index++;
    }
    return result;
  }
}
