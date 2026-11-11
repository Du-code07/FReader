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
  static const _c = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
  static const _m = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
  static const _r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

  /// 글상자가 아닌 단순 도형(네모·둥근 네모·동그라미)만: 위치·크기·선·채우기
  static Map<String, Object>? _shape(XmlElement alternate) {
    final choice = alternate.children.whereType<XmlElement>().where((e) => e.name.local == 'Choice').firstOrNull;
    final drawing = choice?.findAllElements('drawing', namespace: _w).firstOrNull;
    final anchor = drawing?.findAllElements('anchor', namespace: _wp).firstOrNull;
    final wsp = anchor?.descendants.whereType<XmlElement>().where((e) => e.name.local == 'wsp').firstOrNull;
    if (anchor == null || wsp == null) return null;
    if (wsp.descendants.whereType<XmlElement>().any((e) => e.name.local == 'txbx')) return null;
    final spPr = wsp.children.whereType<XmlElement>().where((e) => e.name.local == 'spPr').firstOrNull;
    final geom = spPr?.getElement('prstGeom', namespace: _a)?.getAttribute('prst') ?? '';
    if (!const {'rect', 'roundRect', 'ellipse'}.contains(geom)) return null;
    String? color(XmlElement? holder) {
      final c = holder?.getElement('solidFill', namespace: _a)?.getElement('srgbClr', namespace: _a)?.getAttribute('val');
      return c == null ? null : '#$c';
    }
    final ln = spPr?.getElement('ln', namespace: _a);
    final style = wsp.children.whereType<XmlElement>().where((e) => e.name.local == 'style').firstOrNull;
    final String stroke = ln?.getElement('noFill', namespace: _a) != null
        ? 'none'
        : color(ln) ?? (style?.getElement('lnRef', namespace: _a) != null ? '#2F528F' : 'none');
    final String fill = spPr?.getElement('noFill', namespace: _a) != null
        ? 'none'
        : color(spPr) ?? (style?.getElement('fillRef', namespace: _a) != null ? '#4472C4' : 'none');
    Map<String, Object> axis(String name) {
      final p = anchor.getElement(name, namespace: _wp);
      return {
        if (p?.getAttribute('relativeFrom') != null) 'relativeFrom': p!.getAttribute('relativeFrom')!,
        if (p?.getElement('posOffset', namespace: _wp) != null) 'offset': p!.getElement('posOffset', namespace: _wp)!.innerText,
      };
    }
    final extent = anchor.getElement('extent', namespace: _wp);
    return {
      'geom': geom,
      'stroke': stroke,
      'strokeWidth': int.tryParse(ln?.getAttribute('w') ?? '') ?? 12700,
      'fill': fill,
      'behind': anchor.getAttribute('behindDoc') == '1',
      'horizontal': axis('positionH'),
      'vertical': axis('positionV'),
      'width': extent?.getAttribute('cx') ?? '0',
      'height': extent?.getAttribute('cy') ?? '0',
    };
  }

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
    // 사진 여부와 Word에서 자른 영역(a:srcRect, 1/100000 단위)
    final blip = node.findAllElements('blip', namespace: _a).firstOrNull;
    final bool picture = blip != null &&
        (blip.getAttribute('embed', namespace: _r) != null || blip.getAttribute('link', namespace: _r) != null);
    final srcRect = blip?.parentElement?.getElement('srcRect', namespace: _a);
    int? crop(String n) => int.tryParse(srcRect?.getAttribute(n) ?? '');
    final bool cropped = srcRect != null && [crop('l'), crop('t'), crop('r'), crop('b')].any((v) => v != null && v != 0);
    // 사진을 돌리거나 뒤집은 경우 (a:xfrm rot는 1/60000도)
    final xfrm = picture ? node.findAllElements('xfrm', namespace: _a).firstOrNull : null;
    final double rotation = ((int.tryParse(xfrm?.getAttribute('rot') ?? '') ?? 0) / 60000.0) % 360;
    final bool flipH = xfrm?.getAttribute('flipH') == '1' || xfrm?.getAttribute('flipH') == 'true';
    final bool flipV = xfrm?.getAttribute('flipV') == '1' || xfrm?.getAttribute('flipV') == 'true';
    return {
      'picture': picture,
      if (rotation.abs() > 0.01) 'rotation': rotation,
      if (flipH) 'flipH': true,
      if (flipV) 'flipV': true,
      if (cropped)
        'crop': {'l': crop('l') ?? 0, 't': crop('t') ?? 0, 'r': crop('r') ?? 0, 'b': crop('b') ?? 0},
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
      final chartParts = <String, String>{};
      for (final rel in part('word/_rels/document.xml.rels')?.rootElement.childElements ?? <XmlElement>[]) {
        if (rel.getAttribute('TargetMode') == 'External' ||
            !(rel.getAttribute('Type') ?? '').endsWith('/chart')) continue;
        final target = Uri.parse('word/document.xml').resolve(rel.getAttribute('Target') ?? '');
        if (target.hasScheme || target.hasAuthority) continue;
        final name = Uri.decodeComponent(target.path).replaceFirst(RegExp(r'^/'), '');
        final id = rel.getAttribute('Id');
        try {
          final chart = part(name);
          if (id != null && chart != null) chartParts[id] = chart.toXmlString();
        } catch (_) {
          // A damaged/unsupported chart must not disable the document's other
          // paragraph, table and image hints.
        }
      }
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
      final themeColors = <String, String>{};
      final scheme = theme?.findAllElements('clrScheme', namespace: _a).firstOrNull;
      for (final color in scheme?.childElements ?? <XmlElement>[]) {
        final rgb = color.getElement('srgbClr', namespace: _a)?.getAttribute('val') ??
            color.getElement('sysClr', namespace: _a)?.getAttribute('lastClr');
        if (rgb != null) themeColors[color.name.local] = rgb;
      }
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
      // 각주·미주 본문 (변환 엔진이 빠뜨리므로 따로 읽어 화면에 붙인다)
      final notes = <String, String>{};
      for (final kind in ['footnote', 'endnote']) {
        final notesPart = part('word/${kind}s.xml');
        for (final note in notesPart?.findAllElements(kind, namespace: _w) ?? <XmlElement>[]) {
          final type = _attr(note, 'type');
          if (type != null && type != 'normal') continue; // 구분선 등
          final id = _attr(note, 'id');
          if (id == null) continue;
          final lines = <String>[];
          for (final np in note.findAllElements('p', namespace: _w)) {
            final b = StringBuffer();
            for (final n in np.descendants.whereType<XmlElement>()) {
              if (n.name.namespaceUri != _w) continue;
              if (n.name.local == 't') b.write(n.innerText);
              if (n.name.local == 'tab') b.write(' ');
            }
            lines.add(b.toString());
          }
          notes['${kind == 'footnote' ? 'f' : 'e'}:$id'] = lines.join('\n').trim();
        }
      }
      var footnoteNumber = 0, endnoteNumber = 0;
      String roman(int n) {
        const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
        final out = StringBuffer();
        for (int i = 0; i < vals.length; i++) {
          while (n >= vals[i]) {
            out.write(syms[i]);
            n -= vals[i];
          }
        }
        return out.toString();
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
        final noteRefs = <Map<String, Object>>[];
        final shapes = <Map<String, Object>>[];
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
            // 사진 위에 그린 네모·동그라미 같은 도형 (Word는 mc:AlternateContent 안에 넣는다)
            if (n.name.local == 'AlternateContent') {
              final shape = _shape(n);
              if (shape != null) shapes.add(shape);
              continue;
            }
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
              case 'footnoteReference':
              case 'endnoteReference':
                // 각주 번호 위치: 탭·줄바꿈을 뺀 글자 수 기준 (화면 쪽 문단 맞추기와 같은 기준)
                final bool foot = n.name.local == 'footnoteReference';
                final id = _attr(n, 'id');
                if (id != null && _attr(n, 'customMarkFollows') != '1') {
                  final key = '${foot ? 'f' : 'e'}:$id';
                  noteRefs.add({
                    'offset': text.toString().replaceAll(RegExp(r'[\t\r\n\u200b]'), '').length,
                    'key': key,
                    'label': foot ? '${++footnoteNumber}' : roman(++endnoteNumber),
                  });
                }
              case 'lastRenderedPageBreak':
                cached.add(text.length);
                pendingDrawingBreak ??= true;
              case 'drawing':
              case 'pict':
                final drawing = _drawing(n, drawingCount);
                final chartId = n.findAllElements('chart', namespace: _c).firstOrNull
                    ?.getAttribute('id', namespace: _r);
                if (chartParts.containsKey(chartId)) drawing['chartXml'] = chartParts[chartId]!;
                drawings.add(drawing);
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
        // 수식(OMML): 글 몇 번째 글자 앞에 있는지 + 화면에 그릴 MathML
        final maths = <Map<String, Object>>[];
        var mathCount = 0;
        void walkMath(XmlElement e) {
          for (final c in e.children.whereType<XmlElement>()) {
            final ns = c.name.namespaceUri, local = c.name.local;
            if (ns == _m && local == 'oMathPara') {
              for (final om in c.findElements('oMath', namespace: _m)) {
                maths.add({'offset': mathCount, 'mathml': _mathml(om, block: true)});
              }
              continue;
            }
            if (ns == _m && local == 'oMath') {
              maths.add({'offset': mathCount, 'mathml': _mathml(c)});
              continue;
            }
            if (ns == _w && (local == 'p' || local == 'delText')) continue; // 글상자 안 문단, 지운 글
            if (local == 'AlternateContent') continue;
            if (ns == _w && local == 't') {
              mathCount += c.innerText.replaceAll(RegExp(r'[\t\r\n\u200b]'), '').length;
              continue;
            }
            walkMath(c);
          }
        }
        if (p.findAllElements('oMath', namespace: _m).isNotEmpty) walkMath(p);
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
          if (shapes.isNotEmpty) 'shapes': shapes,
          if (maths.isNotEmpty) 'math': maths,
          if (noteRefs.isNotEmpty) 'notes': noteRefs,
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
        if (notes.isNotEmpty) 'notes': notes,
        'tables': tables,
        'sections': sections,
        'theme': themeFonts,
        'themeColors': themeColors,
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

  // ── 수식: Word 수식(OMML) → 브라우저가 그리는 MathML ──
  static String _esc(String t) => t.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

  static String? _mval(XmlElement? e, String child) {
    final c = e?.findElements(child, namespace: _m).firstOrNull;
    return c?.getAttribute('val', namespace: _m) ?? c?.getAttribute('m:val');
  }

  static String _mathml(XmlElement oMath, {bool block = false}) =>
      '<math xmlns="http://www.w3.org/1998/Math/MathML"${block ? ' display="block"' : ''}><mrow>${_mChildren(oMath)}</mrow></math>';

  static String _mChildren(XmlElement? e) {
    if (e == null) return '';
    final out = StringBuffer();
    for (final c in e.children.whereType<XmlElement>()) {
      out.write(_mNode(c));
    }
    return out.toString();
  }

  static String _mArg(XmlElement e, String name) => '<mrow>${_mChildren(e.findElements(name, namespace: _m).firstOrNull)}</mrow>';

  static String _mText(String text, {bool plain = false}) {
    final out = StringBuffer();
    // 숫자 / 연산 기호 / 한글·낱말 / 그 밖의 글자(변수) 로 나눠 담음
    for (final m in RegExp(r'\d+(?:\.\d+)?|[+\-−=×÷±<>≤≥≠≈∙·*/(),\[\]{}|%!:;∑∫∏√∞→←↔]|[가-힣ㄱ-ㅎㅏ-ㅣ]+(?:\s+[가-힣ㄱ-ㅎㅏ-ㅣ]+)*|[A-Za-z]{2,}|\s+|.').allMatches(text)) {
      final t = m.group(0)!;
      if (t.trim().isEmpty) {
        out.write('<mspace width="0.25em"/>');
      } else if (RegExp(r'^\d').hasMatch(t)) {
        out.write('<mn>${_esc(t)}</mn>');
      } else if (RegExp(r'^[+\-−=×÷±<>≤≥≠≈∙·*/(),\[\]{}|%!:;∑∫∏√∞→←↔]$').hasMatch(t)) {
        out.write('<mo>${_esc(t == '-' ? '−' : t)}</mo>');
      } else if (plain || RegExp(r'[가-힣]').hasMatch(t) || t.length > 1) {
        out.write('<mtext>${_esc(t)}</mtext>');
      } else {
        out.write('<mi>${_esc(t)}</mi>');
      }
    }
    return out.toString();
  }

  static String _mNode(XmlElement e) {
    if (e.name.namespaceUri != _m) return '';
    switch (e.name.local) {
      case 'r':
        final text = e.findElements('t', namespace: _m).map((t) => t.innerText).join();
        final plain = e.findAllElements('nor', namespace: _m).isNotEmpty;
        return _mText(text, plain: plain);
      case 'f':
        final type = _mval(e.findElements('fPr', namespace: _m).firstOrNull, 'type');
        if (type == 'lin') return '<mrow>${_mArg(e, 'num')}<mo>/</mo>${_mArg(e, 'den')}</mrow>';
        return '<mfrac${type == 'noBar' ? ' linethickness="0"' : ''}>${_mArg(e, 'num')}${_mArg(e, 'den')}</mfrac>';
      case 'd':
        final pr = e.findElements('dPr', namespace: _m).firstOrNull;
        final beg = _mval(pr, 'begChr') ?? '(', end = _mval(pr, 'endChr') ?? ')', sep = _mval(pr, 'sepChr') ?? '|';
        final parts = e.findElements('e', namespace: _m).map((x) => '<mrow>${_mChildren(x)}</mrow>').join('<mo>${_esc(sep)}</mo>');
        return '<mrow>${beg.isEmpty ? '' : '<mo>${_esc(beg)}</mo>'}$parts${end.isEmpty ? '' : '<mo>${_esc(end)}</mo>'}</mrow>';
      case 'sSup':
        return '<msup>${_mArg(e, 'e')}${_mArg(e, 'sup')}</msup>';
      case 'sSub':
        return '<msub>${_mArg(e, 'e')}${_mArg(e, 'sub')}</msub>';
      case 'sSubSup':
        return '<msubsup>${_mArg(e, 'e')}${_mArg(e, 'sub')}${_mArg(e, 'sup')}</msubsup>';
      case 'sPre':
        return '<mrow><msubsup><mrow></mrow>${_mArg(e, 'sub')}${_mArg(e, 'sup')}</msubsup>${_mArg(e, 'e')}</mrow>';
      case 'rad':
        final hide = _mval(e.findElements('radPr', namespace: _m).firstOrNull, 'degHide');
        final deg = e.findElements('deg', namespace: _m).firstOrNull;
        if (hide == '1' || hide == 'on' || deg == null || _mChildren(deg).isEmpty) return '<msqrt>${_mChildren(e.findElements('e', namespace: _m).firstOrNull)}</msqrt>';
        return '<mroot>${_mArg(e, 'e')}${_mArg(e, 'deg')}</mroot>';
      case 'nary':
        final pr = e.findElements('naryPr', namespace: _m).firstOrNull;
        final chr = _mval(pr, 'chr') ?? '∫';
        final sub = _mChildren(e.findElements('sub', namespace: _m).firstOrNull), sup = _mChildren(e.findElements('sup', namespace: _m).firstOrNull);
        final big = '<mo largeop="true">${_esc(chr)}</mo>';
        final op = sub.isEmpty && sup.isEmpty
            ? big
            : chr == '∫' || chr == '∬' || chr == '∭' || chr == '∮'
                ? '<msubsup>$big<mrow>$sub</mrow><mrow>$sup</mrow></msubsup>'
                : '<munderover>$big<mrow>$sub</mrow><mrow>$sup</mrow></munderover>';
        return '<mrow>$op${_mArg(e, 'e')}</mrow>';
      case 'func':
        return '<mrow>${_mArg(e, 'fName')}<mo>&#x2061;</mo>${_mArg(e, 'e')}</mrow>';
      case 'acc':
        final chr = _mval(e.findElements('accPr', namespace: _m).firstOrNull, 'chr') ?? '̂';
        return '<mover accent="true">${_mArg(e, 'e')}<mo>${_esc(chr)}</mo></mover>';
      case 'bar':
        final pos = _mval(e.findElements('barPr', namespace: _m).firstOrNull, 'pos');
        return pos == 'top' ? '<mover>${_mArg(e, 'e')}<mo>‾</mo></mover>' : '<munder>${_mArg(e, 'e')}<mo>_</mo></munder>';
      case 'groupChr':
        final pr = e.findElements('groupChrPr', namespace: _m).firstOrNull;
        final chr = _mval(pr, 'chr') ?? '⏟', pos = _mval(pr, 'pos') ?? 'bot';
        return pos == 'top' ? '<mover>${_mArg(e, 'e')}<mo>${_esc(chr)}</mo></mover>' : '<munder>${_mArg(e, 'e')}<mo>${_esc(chr)}</mo></munder>';
      case 'limLow':
        return '<munder>${_mArg(e, 'e')}${_mArg(e, 'lim')}</munder>';
      case 'limUpp':
        return '<mover>${_mArg(e, 'e')}${_mArg(e, 'lim')}</mover>';
      case 'm':
        final rows = e.findElements('mr', namespace: _m)
            .map((r) => '<mtr>${r.findElements('e', namespace: _m).map((c) => '<mtd>${_mChildren(c)}</mtd>').join()}</mtr>')
            .join();
        return '<mtable>$rows</mtable>';
      case 'eqArr':
        return '<mtable>${e.findElements('e', namespace: _m).map((c) => '<mtr><mtd>${_mChildren(c)}</mtd></mtr>').join()}</mtable>';
      case 'oMath':
        return '<mrow>${_mChildren(e)}</mrow>';
      case 'e':
      case 'num':
      case 'den':
      case 'sub':
      case 'sup':
      case 'deg':
      case 'lim':
      case 'fName':
      case 'box':
      case 'borderBox':
      case 'phant':
        return '<mrow>${_mChildren(e)}</mrow>';
      default:
        // 속성(…Pr), 제어 정보는 그리지 않음
        if (e.name.local.endsWith('Pr')) return '';
        return _mChildren(e);
    }
  }
}
