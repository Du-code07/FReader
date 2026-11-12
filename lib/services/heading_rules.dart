import 'dart:math' as math;
/// 목차 쪽이 없을 때의 목차 규칙.
///
/// 한글·워드·PDF ([build]):
///   1) 번호로 시작하는 줄 — 로마 숫자(Ⅰ. / I.)와 1. 제목만 (1.1 처럼 점으로 이어진 번호도 같은 갈래). 1) (1) 은 넣지 않음
///   2) 번호 줄이 하나도 없으면 굵은 글씨 줄 — 가운데 정렬이거나 줄 전체가 굵은 경우만
/// PPT ([slides]): 슬라이드마다 제목(가장 큰 글자)과 부제목만.
/// 어느 경우든 같은 제목은 한 번만 넣는다.
class HeadingRules {
  static final RegExp _letter = RegExp(r'[가-힣A-Za-z]');

  static final List<(String, RegExp)> _patterns = [
    ('roman', RegExp(r'^(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+\s*\.?|[IVX]{1,5}\s*\.)\s*')),
    ('multi', RegExp(r'^\d{1,3}(?:\.\d{1,3})+(?:\.\s*|\s+)')),
    ('dot', RegExp(r'^\d{1,3}\.(?!\d)\s*')),
  ];

  /// 번호 모양의 갈래 (번호로 시작하지 않으면 null). 이어진 번호(1.1, 2-1-3)는 깊이까지 나눈다
  static String? kindOf(String title) {
    final t = title.trim();
    for (final (kind, re) in _patterns) {
      final m = re.firstMatch(t);
      if (m == null) continue;
      final rest = t.substring(m.end).trim();
      if (_letter.allMatches(rest).length < 2) return null;
      if (kind == 'multi') {
        final depth = RegExp(r'\.\d').allMatches(m.group(0)!).length + 1;
        return 'multi$depth';
      }
      return kind;
    }
    return null;
  }

  static String norm(String s) => s.replaceAll(RegExp(r'\s+'), '').toLowerCase();
  static String _clean(Object? s) => (s ?? '').toString().replaceAll(RegExp(r'\s+'), ' ').trim();

  /// 문장(본문)으로 보이는 줄: "…했다.", "…해요." 처럼 끝나는 긴 줄
  static bool _sentence(String t) => t.length > 15 && RegExp(r'(다|요|니다)[.!?]?$').hasMatch(t);

  /// 번호 붙은 본문 항목(목록)으로 보이는 줄: 중간에 문장이 끝나거나(". "), "제목 : 설명" 꼴, 쉼표가 들어간 긴 줄.
  /// 문장 끝 뒤에 짧은 표시(예: '…무엇인가요? O')만 붙은 것은 목록으로 보지 않음.
  /// 줄 전체가 굵은 제목([bold])은 쉼표가 있어도 제목으로 봄 (질문 목록 등)
  static bool _listItem(String t, {bool bold = false}) {
    final m = RegExp(r'^\S+\s*').firstMatch(t);
    final core = m == null ? t : t.substring(m.end);
    if (RegExp(r'[.!?]\s+\S*[가-힣A-Za-z]{2,}').hasMatch(core)) return true;
    if (RegExp(r'\s:\s*\S').hasMatch(core)) return true;
    if (!bold && core.contains(',') && core.length > 20) return true;
    return false;
  }

  /// [candidates]: {title, page, bold(줄 전체 굵게), boldRatio, centered, fs, body(본문 글자 크기)} — 앞에서부터 차례로.
  /// 결과: {title, level, page}. 해당하는 줄이 없으면 빈 목록
  static List<Map<String, Object?>> build(List<Map<String, Object?>> candidates) {
    double nv(Object? v) => (v as num?)?.toDouble() ?? 0;
    // 본문 글자 크기: 알려 준 값(쪽 묶음마다)의 중간값, 없으면 후보들 중 가장 많은 크기
    final bodies = [for (final c in candidates) if (nv(c['body']) > 0) nv(c['body'])]..sort();
    double body = bodies.isEmpty ? 0 : bodies[bodies.length ~/ 2];
    if (body <= 0) {
      final count = <double, int>{};
      for (final c in candidates) {
        final f = nv(c['fs']);
        if (f > 0) count[f] = (count[f] ?? 0) + 1;
      }
      if (count.isNotEmpty) body = count.entries.reduce((a, b) => b.value > a.value ? b : a).key;
    }
    // 눈에 띄는 줄 = 굵거나, 가운데 정렬이거나, 본문보다 큰 글자 (글자 크기를 모르면 따지지 않음)
    bool prominent(Map<String, Object?> c) {
      final f = nv(c['fs']);
      if (f <= 0 || body <= 0) return true;
      return c['bold'] == true || c['centered'] == true || f >= body * 1.05;
    }

    // 1) 번호(Ⅰ. / 1.)로 시작하는 줄 — 본문 속 번호 목록(본문과 같은 모양의 문장)은 빼고
    final seen = <String>{};
    final order = <String>[];
    final numbered = <Map<String, Object?>>[];
    for (final c in candidates) {
      final title = _clean(c['title']);
      final bool wholeBold = c['bold'] == true;
      if (title.length > (wholeBold ? 100 : 40) || _sentence(title) || _listItem(title, bold: wholeBold) || !prominent(c)) continue;
      final kind = kindOf(title);
      if (kind == null || !seen.add(norm(title))) continue;
      if (!order.contains(kind)) order.add(kind);
      numbered.add({'title': title, 'page': c['page'], 'level': (order.indexOf(kind) + 1).clamp(1, 4)});
      if (numbered.length >= 1000) break;
    }
    if (numbered.isNotEmpty) return numbered;

    // 2) 굵은 글씨 (가운데 정렬이거나 줄 전체가 굵은 경우)
    final bolds = <({String title, Object? page, double fs})>[];
    seen.clear();
    Map<String, Object?>? prevPicked;
    for (final c in candidates) {
      final title = _clean(c['title']);
      final double ratio = (c['boldRatio'] as num?)?.toDouble() ?? (c['bold'] == true ? 1 : 0);
      final bool ok = c['bold'] == true || (c['centered'] == true && ratio >= 0.5);
      if (!ok || title.length > 60 || _letter.allMatches(title).length < 2 || _sentence(title)) continue;
      // 한글 제목 바로 다음 줄의 같은 모양 영어 이름(예: 가벡세이트메실산염 / Gabexate Mesilate)은 한 항목으로 봄
      final prev = prevPicked;
      prevPicked = c;
      if (prev != null &&
          prev['page'] == c['page'] &&
          (nv(prev['fs']) - nv(c['fs'])).abs() < 0.2 &&
          RegExp(r'[가-힣]').hasMatch(_clean(prev['title'])) &&
          !RegExp(r'[가-힣]').hasMatch(title)) {
        continue;
      }
      if (!seen.add(norm(title))) continue;
      bolds.add((title: title, page: c['page'], fs: nv(c['fs'])));
      if (bolds.length >= 3000) break;
    }
    // 본문보다 큰 굵은 제목들이 있으면, 본문 크기의 굵은 줄(예: '조작조건' 같은 작은 머리말)은 뺌
    if (body > 0 && bolds.where((b) => b.fs >= body * 1.05).length >= 3) bolds.removeWhere((b) => b.fs > 0 && b.fs < body * 1.05);
    // 단계: 글자 크기 순서. 한두 번만 나오는 큰 크기(표지 제목 등)는 따로 단계를 만들지 않고 1단계
    final freq = <double, int>{};
    for (final b in bolds) {
      final k = (b.fs * 2).round() / 2;
      freq[k] = (freq[k] ?? 0) + 1;
    }
    final sizes = [for (final e in freq.entries) if (e.value >= 3) e.key]..sort((a, b) => b.compareTo(a));
    return [
      for (final b in bolds)
        {
          'title': b.title,
          'page': b.page,
          'level': () {
            final i = sizes.indexWhere((v) => (b.fs * 2).round() / 2 >= v);
            return ((i < 0 ? sizes.length - 1 : i) + 1).clamp(1, 3);
          }(),
        },
    ];
  }

  static final RegExp _pageMark = RegExp(r'^\d+\s*(page|p|쪽|페이지)?$', caseSensitive: false);

  /// PPT: [slides][i] = 그 슬라이드의 줄들 {t, y, fs}. 그림 속 글자([ocr])는 fs 대신 줄 높이 h.
  /// 제목 = 가장 큰 글자 줄, 부제목 = 제목 바로 아래의 (글자로 읽은 경우) 가까운 줄 / (글자 파일) 본문보다 큰 줄
  static List<Map<String, Object?>> slides(List<List<Map<String, Object?>>> slides, {bool ocr = false}) {
    final seenTitle = <String>{}, seenSub = <String>{};
    final out = <Map<String, Object?>>[];
    for (int page = 0; page < slides.length; page++) {
      final lines = <({String t, double y, double size})>[];
      for (final l in slides[page]) {
        final t = _clean(l['t']);
        if (t.length > 80 || _letter.allMatches(t).length < 2 || _pageMark.hasMatch(t)) continue;
        final double size = ((ocr ? l['h'] : l['fs']) as num?)?.toDouble() ?? 0;
        lines.add((t: t, y: (l['y'] as num?)?.toDouble() ?? 0, size: size));
      }
      if (lines.isEmpty) continue;
      // 슬라이드 제목은 보통 위쪽에 있음: 위쪽 30% 안에 꽤 큰 줄이 있으면 그 안에서 고름 (그림 속 큰 글자가 제목이 되지 않게)
      final double maxSize = lines.map((l) => l.size).reduce(math.max);
      final top = lines.where((l) => l.y < 0.3).toList();
      final pool = top.isNotEmpty && top.map((l) => l.size).reduce(math.max) >= maxSize * 0.6 ? top : lines;
      var title = pool.first;
      for (final l in pool) {
        // 크기가 거의 같으면(5% 이내) 위쪽 줄을 제목으로 (글자 위치 읽기 오차로 아래 줄이 뽑히지 않게)
        if (l.size > title.size * 1.05 + 1e-6 || ((l.size - title.size).abs() <= title.size * 0.05 + 1e-6 && l.y < title.y)) title = l;
      }
      String sub = '';
      final below = lines.where((l) => !identical(l, title) && l.y > title.y && l.t != title.t).toList()
        ..sort((a, b) => a.y.compareTo(b.y));
      if (ocr) {
        // 제목 아래로 제목 높이의 2.5배 안에 있는 가장 가까운 짧은 줄
        for (final l in below) {
          if (l.y - (title.y + title.size) > title.size * 2.5) break;
          if (l.t.length <= 50) {
            sub = l.t;
            break;
          }
        }
      } else {
        // 본문(가장 많이 쓴 크기)보다 크고 제목보다 작은 줄 중 가장 위
        final count = <double, int>{};
        for (final l in lines) {
          count[l.size] = (count[l.size] ?? 0) + l.t.length;
        }
        final double body = count.entries.reduce((a, b) => b.value > a.value ? b : a).key;
        for (final l in below) {
          if (l.size < title.size * 0.98 && l.size > body * 1.05 && l.t.length <= 60) {
            sub = l.t;
            break;
          }
        }
      }
      if (title.t.length <= 60 && seenTitle.add(norm(title.t))) out.add({'title': title.t, 'level': 1, 'page': page});
      if (sub.isNotEmpty && seenSub.add(norm(sub)) && !seenTitle.contains(norm(sub))) out.add({'title': sub, 'level': 2, 'page': page});
    }
    return out;
  }
}
