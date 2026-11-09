import 'dart:convert';
import 'dart:io';

import 'package:flutter/painting.dart';

import 'txt_reader_service.dart';

/// Fixed paper pages drawn with Flutter's text engine, not HTML/EPUB.
/// Only page byte offsets live in memory; page text stays in a private cache.
class TxtPageDocument {
  static const paperSize = Size(595, 842);
  static const margin = 32.0;
  static const contentWidth = 531.0;
  static const contentHeight = 778.0;
  static const textStyle = TextStyle(
    fontFamily: 'monospace',
    fontFamilyFallback: ['sans-serif'],
    fontSize: 14,
    height: 1.45,
    color: Color(0xff000000),
  );

  final Directory directory;
  final File _pages;
  final List<int> _offsets;
  int get pageCount => _offsets.length - 1;

  TxtPageDocument._(this.directory, this._pages, this._offsets);

  static TextPainter painter(String text, {Color? color}) => TextPainter(
    text: TextSpan(
      text: text,
      style: color == null ? textStyle : textStyle.copyWith(color: color),
    ),
    textDirection: TextDirection.ltr,
    textAlign: TextAlign.left,
    textWidthBasis: TextWidthBasis.parent,
    textScaler: TextScaler.noScaling,
  )..layout(maxWidth: contentWidth);

  static Future<TxtPageDocument> open(
    File source,
    Directory cache, {
    bool Function()? cancelled,
  }) async {
    final directory = await cache.createTemp('freader-txt-pages-');
    try {
      final plain = await TxtReaderService.preparePlainText(source, directory);
      final pages = File('${directory.path}/pages.bin');
      final output = await pages.open(mode: FileMode.write);
      final offsets = <int>[0];
      var pending = '';
      void checkCancelled() {
        if (cancelled?.call() ?? false) throw const TxtPaginationCancelled();
      }

      Future<void> append(String text) async {
        if (text.isEmpty) return;
        checkCancelled();
        final bytes = utf8.encode(text);
        await output.writeFrom(bytes);
        offsets.add(offsets.last + bytes.length);
      }

      Future<void> paginate({required bool last}) async {
        while (pending.isNotEmpty) {
          checkCancelled();
          var windowLength = pending.length.clamp(0, 8192).toInt();
          int? cut;
          while (true) {
            // Do not hand the shaper half of a supplementary Unicode character.
            if (windowLength < pending.length &&
                windowLength > 0 &&
                pending.codeUnitAt(windowLength - 1) >= 0xd800 &&
                pending.codeUnitAt(windowLength - 1) <= 0xdbff)
              windowLength--;
            final window = pending.substring(0, windowLength);
            final layout = painter(window);
            try {
              for (final line in layout.computeLineMetrics()) {
                if (line.baseline + line.descent <= contentHeight + .01)
                  continue;
                final position = layout.getPositionForOffset(
                  Offset(
                    line.left + line.width / 2,
                    line.baseline - line.ascent / 2,
                  ),
                );
                final boundary = layout.getLineBoundary(position);
                // A trailing LF adds a synthetic empty line; it has no source
                // characters and must not create an extra blank paper page.
                if (boundary.start >= window.length) break;
                cut = boundary.start;
                break;
              }
            } finally {
              layout.dispose();
            }
            if (cut != null || windowLength == pending.length) break;
            windowLength = (windowLength * 2).clamp(0, pending.length).toInt();
          }
          if (cut == null) {
            if (last) {
              await append(pending);
              pending = '';
            }
            break;
          }
          if (cut <= 0) throw const FormatException('TXT 글자가 한 페이지 높이를 초과합니다.');
          await append(pending.substring(0, cut));
          pending = pending.substring(cut);
          // Layout every new page from its own start: a page beginning inside
          // a long line must be remeasured, since its leading spaces now count.
          await Future<void>.delayed(Duration.zero);
        }
      }

      try {
        await for (final chunk in plain.openRead().transform(utf8.decoder)) {
          pending += chunk;
          await paginate(last: false);
          if (pending.length > 1024 * 1024) {
            throw const FormatException('하나의 TXT 글자 조합이 너무 길어 표시할 수 없습니다.');
          }
        }
        await paginate(last: true);
      } finally {
        await output.close();
      }
      checkCancelled();
      if (offsets.length < 2)
        throw const FormatException('TXT 파일에 표시할 글이 없습니다.');
      await plain.delete();
      return TxtPageDocument._(directory, pages, offsets);
    } catch (_) {
      if (await directory.exists()) await directory.delete(recursive: true);
      rethrow;
    }
  }

  Future<String> readPage(int page) async {
    RangeError.checkValidIndex(page, _offsets, 'page', pageCount);
    final input = await _pages.open();
    try {
      await input.setPosition(_offsets[page]);
      return utf8.decode(await input.read(_offsets[page + 1] - _offsets[page]));
    } finally {
      await input.close();
    }
  }

  Future<void> dispose() async {
    if (await directory.exists()) await directory.delete(recursive: true);
  }
}

class TxtPaginationCancelled implements Exception {
  const TxtPaginationCancelled();
}
