import 'dart:convert';
import 'package:archive/archive_io.dart';
import 'package:xml/xml.dart';

/// Read-only OOXML supplements for properties not exported by the HTML engine.
/// Images stay in the engine's lazy resource broker; only small XML parts load.
class DocxLayoutHints {
  static const _w =
      'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  static const _a = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  static const _wp =
      'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';

  static Map<String, Object> _drawing(XmlElement node, int index) {
    final anchor = node.findAllElements('anchor', namespace: _wp).firstOrNull;
    final inline = node.findAllElements('inline', namespace: _wp).firstOrNull;
    final shape = anchor ?? inline;
    if (shape == null) return {'index': index, 'kind': 'unsupported'};
    Map<String, Object> axis(String name) {
      final p = shape.getElement(name, namespace: _wp);
      return {
        if (p?.getAttribute('relativeFrom') != null)
          'relativeFrom': p!.getAttribute('relativeFrom')!,
        if (p?.getElement('posOffset', namespace: _wp) != null)
          'offset': p!.getElement('posOffset', namespace: _wp)!.innerText,
        if (p?.getElement('align', namespace: _wp) != null)
          'align': p!.getElement('align', namespace: _wp)!.innerText,
      };
    }
    final extent = shape.getElement('extent', namespace: _wp);
    return {
      'index': index,
      'kind': anchor == null ? 'inline' : 'anchor',
      'wrap': shape.children.whereType<XmlElement>()
          .where((e) => e.name.namespaceUri == _wp && e.name.local.startsWith('wrap'))
          .firstOrNull?.name.local ?? 'wrapNone',
      'horizontal': axis('positionH'),
      'vertical': axis('positionV'),
      'width': extent?.getAttribute('cx') ?? '0',
      'height': extent?.getAttribute('cy') ?? '0',
      'distanceTop': shape.getAttribute('distT') ?? '0',
      'distanceBottom': shape.getAttribute('distB') ?? '0',
      'simplePosition': shape.getAttribute('simplePos') ?? '0',
    };
  }
  static XmlElement? _child(XmlNode? n, String name) =>
      n?.getElement(name, namespace: _w);
  static String? _attr(XmlElement? n, String name) =>
      n?.getAttribute(name, namespace: _w);
  static String? _val(XmlNode? n, String name) => _attr(_child(n, name), 'val');
  static Map<String, Object> _props(XmlNode? n) => {
    for (final e in n?.children.whereType<XmlElement>() ?? <XmlElement>[])
      if (e.name.namespaceUri == _w)
        e.name.local: <String, Object>{
          for (final a in e.attributes)
            if (a.name.namespaceUri == _w) a.name.local: a.value,
          if (e.name.local == 'tabs')
            'stops': [
              for (final t in e.findElements('tab', namespace: _w))
                {
                  for (final a in t.attributes)
                    if (a.name.namespaceUri == _w) a.name.local: a.value,
                },
            ],
          if (e.children.whereType<XmlElement>().isNotEmpty)
            'children': _props(e),
        },
  };
  static Map<String, Object> _merge(
    Map<String, Object> a,
    Map<String, Object> b,
  ) {
    final out = Map<String, Object>.from(a);
    for (final e in b.entries) {
      out[e.key] = e.value is Map && out[e.key] is Map
          ? _merge(
              Map<String, Object>.from(out[e.key] as Map),
              Map<String, Object>.from(e.value as Map),
            )
          : e.value;
    }
    return out;
  }

  /// Compatibility with the original explicit-break adapter and its fixtures.
  static List<Map<String, Object>> read(String path) {
    final layout = readLayout(path);
    return [
      for (final p in (layout['paragraphs'] as List? ?? []))
        if ((p['breaks'] as List).isNotEmpty)
          {
            'index': p['index'],
            'text': (p['text'] as String).replaceAll('\t', ''),
            'offsets': p['breaks'],
          },
    ];
  }

  static Map<String, Object> readLayout(String path) {
    InputFileStream? input;
    try {
      input = InputFileStream(path);
      if (input.length < 4 ||
          input.readByte() != 0x50 ||
          input.readByte() != 0x4b)
        return {};
      input.position = 0;
      final archive = ZipDecoder().decodeBuffer(input);
      XmlDocument? part(String name) {
        final entry = archive.findFile(name);
        if (entry == null || entry.size > 16 * 1024 * 1024) return null;
        return XmlDocument.parse(utf8.decode(entry.content as List<int>));
      }

      final doc = part('word/document.xml');
      if (doc == null) return {};
      final styles = part('word/styles.xml');
      final theme = part('word/theme/theme1.xml');
      final settings = part('word/settings.xml');
      final numberingPart = part('word/numbering.xml');
      final abstractNumbers = <String, XmlElement>{
        for (final n in numberingPart?.findAllElements('abstractNum', namespace: _w) ?? <XmlElement>[])
          if (_attr(n, 'abstractNumId') != null) _attr(n, 'abstractNumId')!: n,
      };
      final numbers = <String, XmlElement>{
        for (final n in numberingPart?.findAllElements('num', namespace: _w) ?? <XmlElement>[])
          if (_attr(n, 'numId') != null) _attr(n, 'numId')!: n,
      };
      Map<String, Object> numbering(Map<String, Object> props) {
        final children = (props['numPr'] as Map?)?['children'] as Map?;
        final id = (children?['numId'] as Map?)?['val']?.toString();
        if (id == null || id == '0') return {};
        final level = (children?['ilvl'] as Map?)?['val']?.toString() ?? '0';
        final num = numbers[id];
        final abstract = abstractNumbers[_val(num, 'abstractNumId')];
        final base = abstract?.findElements('lvl', namespace: _w)
            .where((e) => _attr(e, 'ilvl') == level).firstOrNull;
        final override = num?.findElements('lvlOverride', namespace: _w)
            .where((e) => _attr(e, 'ilvl') == level).firstOrNull;
        final effective = _child(override, 'lvl') ?? base;
        if (effective == null) return {};
        return {
          'props': _merge(_props(_child(base, 'pPr')), _props(_child(effective, 'pPr'))),
          'run': _merge(_props(_child(base, 'rPr')), _props(_child(effective, 'rPr'))),
          'suffix': _val(effective, 'suff') ?? _val(base, 'suff') ?? 'tab',
          'alignment': _val(effective, 'lvlJc') ?? _val(base, 'lvlJc') ?? 'left',
        };
      }
      final styleMap = <String, XmlElement>{};
      String? normal;
      for (final s
          in styles?.findAllElements('style', namespace: _w) ??
              <XmlElement>[]) {
        final id = _attr(s, 'styleId');
        if (id != null) styleMap[id] = s;
        if (_attr(s, 'type') == 'paragraph' && _attr(s, 'default') == '1')
          normal = id;
      }
      final cache = <String, Map<String, Object>>{};
      Map<String, Object> style(String? id, String kind, [Set<String>? seen]) {
        if (id == null || !styleMap.containsKey(id)) return {};
        final key = '$id/$kind';
        if (cache.containsKey(key)) return cache[key]!;
        final visited = {...?seen};
        if (!visited.add(id) || visited.length > 32) return {};
        final s = styleMap[id]!;
        return cache[key] = _merge(
          style(_val(s, 'basedOn'), kind, visited),
          _props(_child(s, kind)),
        );
      }

      final defaults = styles
          ?.findAllElements('docDefaults', namespace: _w)
          .firstOrNull;
      final dp = _props(_child(_child(defaults, 'pPrDefault'), 'pPr'));
      final dr = _props(_child(_child(defaults, 'rPrDefault'), 'rPr'));
      final themeFonts = <String, Object>{};
      for (final kind in ['major', 'minor']) {
        final f = theme
            ?.findAllElements('${kind}Font', namespace: _a)
            .firstOrNull;
        if (f == null) continue;
        final latin =
            f.getElement('latin', namespace: _a)?.getAttribute('typeface') ??
            '';
        final ea =
            f.getElement('ea', namespace: _a)?.getAttribute('typeface') ?? '';
        final hang = f
            .findElements('font', namespace: _a)
            .where((e) => e.getAttribute('script') == 'Hang')
            .firstOrNull
            ?.getAttribute('typeface');
        themeFonts[kind] = {
          'latin': latin,
          'eastAsia': ea.isNotEmpty ? ea : hang ?? latin,
        };
      }
      final body = doc.findAllElements('body', namespace: _w).first;
      final paragraphs = <Map<String, Object>>[];
      final indices = <XmlElement, int>{};
      for (final p in body.findAllElements('p', namespace: _w)) {
        final index = paragraphs.length;
        indices[p] = index;
        final pp = _child(p, 'pPr');
        final sid = _val(pp, 'pStyle') ?? normal;
        final table = p.ancestors
            .whereType<XmlElement>()
            .where((e) => e.name.local == 'tbl' && e.name.namespaceUri == _w)
            .firstOrNull;
        final tableStyle = _val(_child(table, 'tblPr'), 'tblStyle');
        var props = _merge(
          _merge(_merge(dp, style(tableStyle, 'pPr')), style(sid, 'pPr')),
          _props(pp),
        );
        final list = numbering(props);
        // Numbering contributes hanging indents/tab stops. Paragraph styles and
        // direct properties still override the individual properties they set.
        if (list.isNotEmpty) props = _merge(
          Map<String, Object>.from(list['props'] as Map), props);
        // Paragraph-mark rPr affects empty paragraphs, not ordinary text runs.
        final baseRun = _merge(
          _merge(dr, style(tableStyle, 'rPr')),
          style(sid, 'rPr'),
        );
        final text = StringBuffer();
        final runs = <Map<String, Object>>[];
        final breaks = <int>[];
        final cached = <int>[];
        final drawingBreaks = <Map<String, Object>>[];
        final drawings = <Map<String, Object>>[];
        var drawingCount = 0;
        bool? pendingDrawingBreak;
        for (final run in p.findAllElements('r', namespace: _w)) {
          // Do not count nested text-box paragraphs a second time.
          if (run.ancestors
                  .whereType<XmlElement>()
                  .where(
                    (e) => e.name.local == 'p' && e.name.namespaceUri == _w,
                  )
                  .firstOrNull !=
              p)
            continue;
          final start = text.length;
          for (final n in run.children.whereType<XmlElement>()) {
            if (n.name.namespaceUri != _w) continue;
            switch (n.name.local) {
              case 't':
                text.write(n.innerText);
                if (n.innerText.isNotEmpty) pendingDrawingBreak = null;
              case 'tab':
                text.write('\t');
                pendingDrawingBreak = null;
              case 'br':
                if (_attr(n, 'type') == 'page') {
                  breaks.add(text.length);
                  pendingDrawingBreak = false;
                }
              case 'lastRenderedPageBreak':
                cached.add(text.length);
                pendingDrawingBreak ??= true;
              case 'drawing':
              case 'pict':
                drawings.add(_drawing(n, drawingCount));
                if (pendingDrawingBreak != null) {
                  drawingBreaks.add({
                    'index': drawingCount,
                    'cached': pendingDrawingBreak,
                  });
                }
                drawingCount++;
                pendingDrawingBreak = null;
            }
          }
          final rp = _child(run, 'rPr');
          if (text.length > start)
            runs.add({
              'start': start,
              'end': text.length,
              'props': _merge(
                _merge(baseRun, style(_val(rp, 'rStyle'), 'rPr')),
                _props(rp),
              ),
            });
        }
        paragraphs.add({
          'index': index,
          'text': text.toString(),
          'props': props,
          if (list.isNotEmpty) 'numbering': list,
          'mark': _merge(baseRun, _props(_child(pp, 'rPr'))),
          'runs': runs,
          'breaks': breaks,
          'cachedBreaks': cached,
          'drawingCount': drawingCount,
          'drawings': drawings,
          'drawingBreaks': drawingBreaks,
        });
      }
      final tables = <Map<String, Object>>[];
      for (final table in body.findAllElements('tbl', namespace: _w)) {
        final tp = _child(table, 'tblPr');
        final ts = _val(tp, 'tblStyle');
        final props = _merge(style(ts, 'tblPr'), _props(tp));
        final rows = <Map<String, Object>>[];
        for (final row in table.findElements('tr', namespace: _w)) {
          final cells = <Map<String, Object>>[];
          for (final cell in row.findElements('tc', namespace: _w)) {
            final cp = _child(cell, 'tcPr');
            final vm = _child(cp, 'vMerge');
            cells.add({
              'props': _merge(style(ts, 'tcPr'), _props(cp)),
              'continuation': vm != null && _attr(vm, 'val') != 'restart',
              'paragraphs': [
                for (final p in cell.findElements('p', namespace: _w))
                  if (indices.containsKey(p)) indices[p]!,
              ],
            });
          }
          rows.add({'props': _props(_child(row, 'trPr')), 'cells': cells});
        }
        tables.add({
          'props': props,
          'grid': [
            for (final c
                in _child(
                      table,
                      'tblGrid',
                    )?.findElements('gridCol', namespace: _w) ??
                    <XmlElement>[])
              double.tryParse(_attr(c, 'w') ?? '') ?? 0,
          ],
          'rows': rows,
        });
      }
      final sections = <Map<String, Object>>[];
      for (final s in body.findAllElements('sectPr', namespace: _w)) {
        final p = s.ancestors
            .whereType<XmlElement>()
            .where((e) => e.name.local == 'p' && e.name.namespaceUri == _w)
            .firstOrNull;
        sections.add({
          'end': p == null
              ? paragraphs.length - 1
              : indices[p] ?? paragraphs.length - 1,
          'props': _props(s),
        });
      }
      return {
        'version': 1,
        'paragraphs': paragraphs,
        'tables': tables,
        'sections': sections,
        'theme': themeFonts,
        'defaultTab':
            double.tryParse(
              settings
                      ?.findAllElements('defaultTabStop', namespace: _w)
                      .firstOrNull
                      ?.getAttribute('val', namespace: _w) ??
                  '',
            ) ??
            720,
      };
    } catch (_) {
      // Optional hints must not break the password flow or other file formats.
      return {};
    } finally {
      input?.closeSync();
    }
  }
}
