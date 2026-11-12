import 'dart:math' as math;
/// 파일 안에 '목차'(차례, Contents)라고 적힌 쪽이 있으면 그 쪽의 항목들로 목차를 만든다.
///
/// 항목 한 줄은 "제목 ……… 쪽번호" 꼴이다. 쪽번호는 인쇄된 번호라 실제 쪽과 다를 수 있으므로,
/// 목차 쪽 뒤에서 같은 제목이 처음 나오는 쪽을 찾아 붙이고, 못 찾으면 찾은 항목들의 차이(인쇄 번호↔실제 쪽)로 맞춘다.
/// 쪽번호 없이 "01. 제목", "2-1. 제목"처럼 번호만 붙은 목차(발표 자료 등)도 읽는다: 이때는 제목이 나오는 쪽을 찾아 붙인다.
/// 그림 속 글자를 읽은(OCR) 글은 조금씩 틀릴 수 있어, 똑같지 않아도 거의 같은 줄이면 찾은 것으로 본다.
class TocPageParser {
  /// 목차 제목으로 보는 글 (띄어쓰기 없이, 소문자)
  static const _headings = {'목차', '차례', '목록', 'contents', 'tableofcontents', '목차contents', 'contents목차', 'index', 'agenda', 'outline'};

  /// 목차 쪽을 찾을 범위 (앞쪽 몇 쪽)
  static const int searchPages = 15;

  static String _norm(String s) => s.replaceAll(RegExp(r'\s+'), '').toLowerCase();

  static final RegExp _leaders = RegExp(r'[\s.·…‥・_\-–—─•∙⋯]+$');
  // "제목 ……… 12" / "제목  12" / "제목12"
  static final RegExp _entry = RegExp(r'^(.*?\S)[\s.·…‥・_\-–—─•∙⋯]*?(\d{1,4})$');
  static final RegExp _letter = RegExp(r'[가-힣A-Za-z]');

  /// 한 줄이 목차 항목이면 (제목, 인쇄 쪽번호)
  static (String, int)? _parseEntry(String raw) {
    final line = raw.replaceAll('\t', ' ').trim();
    if (line.length < 3 || line.length > 120) return null;
    final m = _entry.firstMatch(line);
    if (m == null) return null;
    final title = m.group(1)!.replaceAll(_leaders, '').trim();
    final page = int.parse(m.group(2)!);
    if (title.length < 2 || title.length > 90 || !_letter.hasMatch(title)) return null;
    if (_headings.contains(_norm(title))) return null;
    return (title, page);
  }

  /// 번호 모양의 종류 (없으면 null)
  static String? _kind(String title) {
    final t = title.trim();
    if (RegExp(r'^제\s*\d+\s*[편부]').hasMatch(t)) return 'part';
    if (RegExp(r'^제\s*\d+\s*장').hasMatch(t)) return 'chapter';
    if (RegExp(r'^제\s*\d+\s*절').hasMatch(t)) return 'section';
    if (RegExp(r'^([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+|[IVX]+\.)').hasMatch(t)) return 'roman';
    if (RegExp(r'^\d+[.\-]\d+[.\-]\d+').hasMatch(t)) return 'dec3';
    if (RegExp(r'^\d+[.\-]\d+').hasMatch(t)) return 'dec2';
    if (RegExp(r'^\d+\.').hasMatch(t)) return 'dec1';
    if (RegExp(r'^[가-하]\.').hasMatch(t)) return 'hangul';
    if (RegExp(r'^\(\d+\)').hasMatch(t)) return 'paren';
    if (RegExp(r'^\d+\)').hasMatch(t)) return 'halfparen';
    if (RegExp(r'^[가-하]\)').hasMatch(t)) return 'hangulparen';
    return null;
  }

  /// 단계: 번호 모양이 처음 나온 순서대로 깊어진다 (예: Ⅰ. → 1. → 가. → (1)). 번호 없는 제목은 1단계
  static List<int> _levels(List<String> titles) {
    final order = <String>[];
    return [
      for (final t in titles)
        () {
          final k = _kind(t);
          if (k == null) return 1;
          if (!order.contains(k)) order.add(k);
          return (order.indexOf(k) + 1).clamp(1, 4);
        }(),
    ];
  }

  /// 번호를 뗀 제목 (찾기용)
  static String _core(String title) => title
      .replaceFirst(RegExp(r'^(제\s*\d+\s*[장절편부]|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.?|[IVX]+\.|\d+([.\-]\d+)*\.?|\(\d+\)|\d+\)|[가-하][.)])\s*'), '')
      .trim();

  /// 목차 제목 줄인가 ("Contents", "목차", "목차 Contents" …)
  static bool _isHeading(String line) {
    final n = _norm(line);
    if (_headings.contains(n)) return true;
    return n.length <= 14 && _headings.any((h) => h.length >= 4 && n.startsWith(h));
  }

  /// 번호 붙은 목차 항목 ("01. 제목", "2-1. 제목", "Ⅱ. 제목" …). 한 줄에 여러 항목이 나란히 있으면 나눈다
  static final RegExp _numStart = RegExp(r'^(?:\d{1,3}(?:[.\-]\d{1,3})*[.)]?|\(\d{1,3}\)|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.?|[IVX]{1,5}[.)])\s*(?=[가-힣A-Za-z(\[])');
  static final RegExp _splitBefore = RegExp(r'\s+(?=(?:\d{1,3}(?:[.\-]\d{1,3})*[.)]|\(\d{1,3}\)|[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.)\s*[가-힣A-Za-z])');
  static List<String> _numberedEntries(String raw) {
    final line = raw.replaceAll('\t', ' ').trim();
    if (line.isEmpty || line.length > 160) return const [];
    final out = <String>[];
    for (final part in line.split(_splitBefore)) {
      final t = part.trim();
      final m = _numStart.firstMatch(t);
      if (m == null || _kind(t) == null) continue;
      final rest = t.substring(m.end).trim();
      if (RegExp(r'[가-힣A-Za-z]').allMatches(rest).length < 2 || t.length > 90) continue;
      out.add(t);
    }
    return out;
  }

  /// 번호 → 숫자 묶음 ("02." → [2], "2-1." → [2, 1]). 숫자 번호가 아니면 null
  static List<int>? _numbers(String title) {
    final m = RegExp(r'^\(?(\d{1,3}(?:[.\-]\d{1,3})*)').firstMatch(title.trim());
    if (m == null) return null;
    return [for (final p in m.group(1)!.split(RegExp(r'[.\-]'))) int.parse(p)];
  }

  /// 두 글이 얼마나 같은가 (두 글자씩 묶어 겹치는 비율, 0~1)
  static double _similar(String a, String b) {
    if (a.isEmpty || b.isEmpty) return 0;
    if (a == b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    final pa = <String, int>{};
    for (int i = 0; i < a.length - 1; i++) {
      final k = a.substring(i, i + 2);
      pa[k] = (pa[k] ?? 0) + 1;
    }
    int same = 0;
    for (int i = 0; i < b.length - 1; i++) {
      final k = b.substring(i, i + 2);
      final n = pa[k] ?? 0;
      if (n > 0) {
        same++;
        pa[k] = n - 1;
      }
    }
    return 2 * same / (a.length - 1 + b.length - 1);
  }

  /// 한 줄이 목차 제목과 얼마나 같은가 (0이면 다름, 같은 번호까지 붙어 있으면 1을 더함).
  /// 본문 문장 속에 낱말만 들어 있는 것은 같다고 보지 않는다
  static double _lineScore(String line, String title) {
    final core = _norm(_core(title)), lc = _norm(_core(line));
    if (core.length < 2 || lc.isEmpty) return 0;
    final sim = _similar(lc, core);
    final double text = lc == core
        ? 1
        : (lc.contains(core) && lc.length <= core.length * 1.6 + 2)
            ? 0.9
            : (sim >= 0.7 ? sim : 0);
    // 같은 번호(2-1처럼 이어진 번호)로 시작하면 글자가 조금 틀려도 같은 항목이고, 더 확실하다
    final nums = _numbers(title);
    if (nums != null && nums.length >= 2 && (text > 0 || sim >= 0.45)) {
      final ln = _numbers(line);
      if (ln != null && ln.join('.') == nums.join('.')) return 1 + (text > 0.75 ? text : 0.75);
    }
    return text;
  }

  /// 목차 항목들이 가장 많이 적혀 있는 앞쪽 (목차 쪽 번호)
  static int? tocPageOf(List<String> pageTexts, List<Map<String, Object>> entries) {
    int? best;
    int bestCount = 0;
    for (int p = 0; p < pageTexts.length && p < searchPages; p++) {
      final page = _norm(pageTexts[p]);
      final n = entries.where((e) => page.contains(_norm('${e['title']}'))).length;
      if (n > bestCount) {
        bestCount = n;
        best = p;
      }
    }
    return bestCount >= 3 ? best : null;
  }

  /// 그림 속 글자로 읽은 목차 제목을, 연결된 쪽의 거의 같은 줄 글자로 바꿈 (번호는 목차 것 그대로).
  /// 예: '02. 의약품 분해 메커L즘' + 쪽의 '의약품 분해 매커니즘' → '02. 의약품 분해 매커니즘'
  static String refineTitle(String title, List<String> lines) {
    final core = _core(title).trim();
    final nc = _norm(core);
    if (nc.length < 2) return title;
    final nums = _numbers(title);
    String? bestLine;
    double best = 0;
    bool byNumber = false;
    for (final line in lines) {
      final lc = _core(line).trim();
      double sim = _similar(_norm(lc), nc);
      bool numbered = false;
      // 같은 이어진 번호(2-3 등)로 시작하는 줄이면 글자가 많이 틀려도 같은 항목 (그림 글자 읽기에서 '이'를 '01'로 읽는 등)
      final ln = _numbers(line);
      if (nums != null && ln != null && ln.length >= 2 && nums.length >= ln.length &&
          List.generate(ln.length, (i) => nums[i] == ln[i]).every((x) => x) && sim >= 0.2) {
        sim = math.max(sim, 0.75);
        numbered = true;
      }
      if (sim > best) {
        best = sim;
        bestLine = numbered ? line.trim() : lc;
        byNumber = numbered;
      }
    }
    // 긴 제목은 조금 더 너그럽게 (글자 몇 개만 틀린 경우)
    final double need = nc.length >= 6 ? 0.5 : 0.6;
    if (bestLine == null || best < need || (best >= 0.999 && !byNumber)) return title;
    if (byNumber) return bestLine;
    // 길이가 너무 다르면(다른 말이 붙은 줄) 바꾸지 않음
    if (bestLine.length > core.length * 1.6 + 2 || bestLine.length < core.length * 0.5) return title;
    final i = title.indexOf(core);
    final prefix = i > 0 ? title.substring(0, i).trimRight() : '';
    return prefix.isEmpty ? bestLine : '$prefix $bestLine';
  }

  /// 그림 글자 읽기(OCR)에서 흔한 잘못 읽은 흔적 수: 한글 사이에 낀 영문자(메커L즘),
  /// 한글에 바로 붙은 숫자(01섬질체화) 등
  static int ocrSuspicion(String title) {
    final core = _core(title);
    int n = 0;
    n += RegExp(r'[가-힣][A-Za-z]|[A-Za-z][가-힣]').allMatches(core).length * 2;
    n += RegExp(r'[가-힣]\d|\d[가-힣]').allMatches(core).length * 2;
    if (RegExp(r'^\d').hasMatch(core)) n += 2;
    // 번호 끝에 한글이 띄어쓰기 없이 바로 붙은 '2-3.01섬질'
    if (RegExp(r'\d[.\-]\d+[가-힣]').hasMatch(title.trim())) n += 2;
    n += RegExp(r'[|¦\\~^`{}<>]').allMatches(core).length;
    return n;
  }

  /// 목차 항목 하나의 글자를 여러 번 읽은 결과 중에서 고름.
  /// [title]: 처음 읽은 목차 글자, [variants]: 다른 크기로 다시 읽은 같은 항목들,
  /// [slideLines]: 그 항목이 가리키는 슬라이드(제목·부제목은 글자가 커서 더 정확함)의 줄들.
  /// 여러 번 같게 읽힌 글자와, 잘못 읽은 흔적이 적은 글자를 고른다.
  static String chooseTitle(String title, List<String> variants, List<String> slideLines) {
    final cands = <String>[title];
    for (final v in variants) {
      if (v.trim().isNotEmpty) cands.add(v.trim());
    }
    // 자주 보이는 잘못 읽기를 고친 후보도 넣음: '01'→'이'(이성질체), 한글 사이 'L'→'니'(메커니즘)
    for (final c in List<String>.of(cands)) {
      final core = _core(c);
      if (core.isEmpty) continue;
      var fixed = core
          .replaceAllMapped(RegExp(r'(^|[\s.])[0O][1lI|](?=[가-힣])'), (m) => '${m[1]}이')
          .replaceAllMapped(RegExp(r'([가-힣])[0O][1lI|](?=[가-힣])'), (m) => '${m[1]}이')
          .replaceAllMapped(RegExp(r'([가-힣])L(?=[가-힣])'), (m) => '${m[1]}니');
      final i0 = c.indexOf(core);
      var pre = i0 > 0 ? c.substring(0, i0).trimRight() : '';
      // '2-3.01섬질'처럼 '01'이 번호에 붙어 읽힌 경우: 번호에서 떼어 냄
      final m = RegExp(r'^(.*?\d)\.0[1lI|]$').firstMatch(pre);
      if (m != null) {
        pre = '${m[1]}.';
        fixed = '이$fixed';
      }
      if (fixed != core) cands.add(pre.isEmpty ? fixed : '$pre $fixed');
    }
    final fromSlide = <String>{};
    for (final c in List<String>.of(cands)) {
      final r = refineTitle(c, slideLines);
      if (r != c) {
        cands.add(r);
        fromSlide.add(r);
      }
    }
    String best = title;
    double bestScore = -1e9;
    for (int i = 0; i < cands.length; i++) {
      final c = cands[i];
      final nc = _norm(_core(c));
      if (nc.isEmpty) continue;
      int agree = 0;
      for (int j = 0; j < cands.length; j++) {
        if (j != i && _similar(_norm(_core(cands[j])), nc) >= 0.75) agree++;
      }
      double score = agree * 1.0 - ocrSuspicion(c) * 1.5 + (fromSlide.contains(c) ? 1.2 : 0);
      if (i == 0) score += 0.1; // 똑같으면 처음 것
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    // 번호는 목차의 것을 유지 (다시 읽은 쪽 번호가 다를 수 있음)
    final i0 = title.indexOf(_core(title));
    final prefix = i0 > 0 ? title.substring(0, i0).trimRight() : '';
    final bc = _core(best);
    if (prefix.isNotEmpty && best != title && _numbers(best) == null) return '$prefix $bc';
    if (prefix.isNotEmpty && best != title && _numbers(best) != null && _numbers(title) != null) {
      final a = _numbers(best)!, b = _numbers(title)!;
      // 처음 읽은 번호가 '2-3.01'처럼 글자를 숫자로 잘못 읽어 길어진 경우는 다시 읽은 번호를 씀
      if (a.length <= b.length && List.generate(a.length, (k) => a[k] == b[k]).every((x) => x)) return best;
      return '$prefix $bc';
    }
    return best;
  }

  /// 쪽 [lines] 안에 제목이 있는가 (그대로, 번호 뗀 제목, 거의 같은 줄)
  static bool _pageHas(String normPage, List<String> lines, String title) {
    final full = _norm(title), core = _norm(_core(title));
    if (normPage.contains(full) || (core.length >= 3 && normPage.contains(core))) return true;
    return lines.any((l) => _lineScore(l, title) > 0);
  }


  /// [pageTexts]: 앞에서부터 쪽마다의 글 (줄은 \n). 전체 쪽 수보다 짧아도 된다.
  /// 목차 쪽이 없으면 null.
  static List<Map<String, Object>>? parse(List<String> pageTexts, int totalPages) {
    if (totalPages <= 0) return null;
    int tocStart = -1;
    for (int i = 0; i < pageTexts.length && i < searchPages; i++) {
      final lines = pageTexts[i].split('\n');
      final hasHeading = lines.any(_isHeading);
      if (!hasHeading) continue;
      if (lines.where((l) => _parseEntry(l) != null).length >= 3) {
        tocStart = i;
        break;
      }
      if (lines.expand(_numberedEntries).length >= 3) return _parseNumbered(pageTexts, totalPages, i);
    }
    if (tocStart < 0) {
      // '목차' 글자를 못 읽었어도(그림 속 글자 등) 앞 3쪽 중 번호 항목이 5개 이상이고
      // 그 대부분이 뒤쪽에 다시 나오면 목차 쪽으로 본다
      // 단, 쪽의 대부분이 짧은 항목이어야 함 (본문 속 1) 2) 목록이 목차로 잡히지 않게)
      for (int i = 0; i < pageTexts.length && i < 3; i++) {
        final lines = pageTexts[i].split('\n').where((l) => l.trim().isNotEmpty).toList();
        final entries = lines.expand(_numberedEntries).where((e) {
          final k = _kind(e);
          return e.length <= 40 && k != 'paren' && k != 'halfparen' && k != 'hangulparen';
        }).toList();
        if (entries.length < 5 || entries.length < lines.length * 0.5) continue;
        final r = _parseNumbered(pageTexts, totalPages, i, minFound: 0.6);
        if (r != null) return r;
      }
      return null;
    }

    // 목차가 여러 쪽에 이어질 수 있음 (항목이 대부분인 쪽까지)
    final entries = <(String, int)>[];
    int tocEnd = tocStart;
    for (int i = tocStart; i < pageTexts.length && i < tocStart + 4; i++) {
      final lines = pageTexts[i].split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
      final parsed = [for (final l in lines) _parseEntry(l)].whereType<(String, int)>().toList();
      if (i > tocStart && (parsed.length < 3 || parsed.length < lines.length * 0.5)) break;
      entries.addAll(parsed);
      tocEnd = i;
    }
    // 인쇄 쪽번호가 거꾸로 가는 항목(본문 속 숫자 등)은 뺀다
    final ordered = <(String, int)>[];
    for (final e in entries) {
      if (e.$2 > totalPages * 3 + 20) continue;
      if (ordered.isNotEmpty && e.$2 < ordered.last.$2) continue;
      ordered.add(e);
    }
    if (ordered.length < 2) return null;

    // 실제 쪽 찾기: 목차 쪽 뒤에서, 앞 항목을 찾은 쪽부터 차례로
    final normPages = [for (final t in pageTexts) _norm(t)];
    final found = <int?>[];
    int from = tocEnd + 1;
    for (final (title, _) in ordered) {
      final full = _norm(title), core = _norm(_core(title));
      int? hit;
      for (int p = from; p < normPages.length; p++) {
        if (normPages[p].contains(full) || (core.length >= 3 && normPages[p].contains(core))) {
          hit = p;
          break;
        }
      }
      found.add(hit);
      if (hit != null) from = hit;
    }
    // 인쇄 번호 ↔ 실제 쪽 차이 (찾은 항목들의 가운데 값)
    final diffs = <int>[for (int i = 0; i < ordered.length; i++) if (found[i] != null) found[i]! - (ordered[i].$2 - 1)]..sort();
    final int offset = diffs.isEmpty ? 0 : diffs[diffs.length ~/ 2];
    final levels = _levels([for (final e in ordered) e.$1]);
    final pageLines = [for (final t in pageTexts) t.split('\n')];
    // 그대로는 못 찾은 항목: 거의 같은 줄이 있는 쪽 (앞 항목을 찾은 쪽부터)
    int fuzzyFrom = tocEnd + 1;
    for (int i = 0; i < ordered.length; i++) {
      if (found[i] != null) {
        fuzzyFrom = found[i]!;
        continue;
      }
      for (int p = fuzzyFrom; p < pageTexts.length; p++) {
        if (_pageHas(normPages[p], pageLines[p], ordered[i].$1)) {
          found[i] = p;
          fuzzyFrom = p;
          break;
        }
      }
    }
    return [
      for (int i = 0; i < ordered.length; i++)
        {
          'title': ordered[i].$1,
          'level': levels[i],
          'page': (found[i] ?? (ordered[i].$2 - 1 + offset)).clamp(0, totalPages - 1),
        },
    ];
  }

  /// [cands][i]: i번째 항목이 있을 수 있는 (쪽, 맞는 정도)들. 쪽이 거꾸로 가지 않으면서
  /// 맞는 정도의 합이 가장 큰 쪽들 (못 맞추면 null)
  static List<int?> _bestChain(List<List<(int, double)>> cands) {
    final n = cands.length;
    // best[i][k]: i번째 항목을 cands[i][k] 쪽에 두었을 때 i까지의 합, prev: 바로 앞에 맞춘 (항목, 후보)
    final best = [for (final c in cands) List<double>.filled(c.length, 0)];
    final prev = [for (final c in cands) List<(int, int)?>.filled(c.length, null)];
    for (int i = 0; i < n; i++) {
      for (int k = 0; k < cands[i].length; k++) {
        final (q, w) = cands[i][k];
        double b = w;
        (int, int)? from;
        for (int j = 0; j < i; j++) {
          for (int m = 0; m < cands[j].length; m++) {
            if (cands[j][m].$1 <= q && best[j][m] + w > b + 1e-9) {
              b = best[j][m] + w;
              from = (j, m);
            }
          }
        }
        best[i][k] = b;
        prev[i][k] = from;
      }
    }
    (int, int)? at;
    double top = 0;
    for (int i = 0; i < n; i++) {
      for (int k = 0; k < cands[i].length; k++) {
        if (best[i][k] > top) {
          top = best[i][k];
          at = (i, k);
        }
      }
    }
    final out = List<int?>.filled(n, null);
    while (at != null) {
      out[at.$1] = cands[at.$1][at.$2].$1;
      at = prev[at.$1][at.$2];
    }
    return out;
  }

  /// 쪽번호 없이 번호만 붙은 목차 (예: 발표 자료의 Contents 슬라이드)
  static List<Map<String, Object>>? _parseNumbered(List<String> pageTexts, int totalPages, int tocPage, {double minFound = 0}) {
    var entries = pageTexts[tocPage].split('\n').expand(_numberedEntries).toList();
    // 칸이 나뉜 목차는 읽는 순서가 섞일 수 있어, 모두 숫자 번호면 번호 순서대로 다시 줄 세운다
    final nums = [for (final e in entries) _numbers(e)];
    if (nums.every((n) => n != null) && nums.map((n) => n!.join('.')).toSet().length == nums.length) {
      final idx = List.generate(entries.length, (i) => i)
        ..sort((a, b) {
          final x = nums[a]!, y = nums[b]!;
          for (int k = 0; k < x.length && k < y.length; k++) {
            if (x[k] != y[k]) return x[k].compareTo(y[k]);
          }
          return x.length.compareTo(y.length);
        });
      entries = [for (final i in idx) entries[i]];
    }
    final seen = <String>{};
    entries = [for (final e in entries) if (seen.add(_norm(e))) e];
    if (entries.length < 3) return null;
    // 항목마다 제목 줄이 있는 쪽들(앞에서 8곳까지), 그중 쪽 순서가 거꾸로 가지 않으면서 가장 많이 맞는 짝을 고른다
    final pageLines = [for (final t in pageTexts) t.split('\n')];
    final cands = <List<(int, double)>>[];
    for (final title in entries) {
      final c = <(int, double)>[];
      for (int p = tocPage + 1; p < pageTexts.length && c.length < 8; p++) {
        double best = 0;
        for (final l in pageLines[p]) {
          final sc = _lineScore(l, title);
          if (sc > best) best = sc;
        }
        if (best > 0) c.add((p, best));
      }
      cands.add(c);
    }
    final found = _bestChain(cands);
    if (found.every((f) => f == null)) return null;
    if (found.where((f) => f != null).length < entries.length * minFound) return null;
    // 못 찾은 항목: 바로 아래 항목을 찾았으면 그 쪽, 아니면 앞 항목의 쪽
    final allNumbers = [for (final e in entries) _numbers(e)];
    final levels = allNumbers.every((n) => n != null)
        ? [for (final n in allNumbers) n!.length.clamp(1, 4)]
        : _levels(entries);
    final out = <Map<String, Object>>[];
    int last = tocPage;
    for (int i = 0; i < entries.length; i++) {
      int? page = found[i];
      if (page == null && i + 1 < entries.length && levels[i + 1] > levels[i]) page = found[i + 1];
      page ??= last;
      last = page;
      out.add({'title': entries[i], 'level': levels[i], 'page': page.clamp(0, totalPages - 1)});
    }
    return out;
  }
}
