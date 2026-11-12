import 'package:flutter/material.dart';

/// 서재에서 파일 이름 앞에 보이는 형식 아이콘.
/// 워드·엑셀·파워포인트·PDF·한글은 종이 모양 안에 글자(W·X·P·P·ㅎ)를 넣고 형식별 색으로 보여 준다.
class FileTypeIcon extends StatelessWidget {
  const FileTypeIcon({super.key, required this.ext, this.size = 24, this.fallbackColor = Colors.indigo, this.epubColor, this.color});

  /// 정해진 형식 색 대신 쓸 색 (설정 화면의 한 가지 색 아이콘 등)
  final Color? color;

  final String ext;
  final double size;
  final Color fallbackColor;

  /// EPUB 책 색 (없으면 기본 갈색)
  final Color? epubColor;

  /// 글자 아이콘을 쓰는 형식: (글자, 색)
  static (String, Color)? lettered(String ext) {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return ('P', const Color(0xFFE53935)); // 빨강
      case 'doc':
      case 'docx':
        return ('W', const Color(0xFF1E6FD9)); // 파랑
      case 'xls':
      case 'xlsx':
      case 'xlsm':
        return ('X', const Color(0xFF1E8E3E)); // 초록
      case 'ppt':
      case 'pptx':
        return ('P', const Color(0xFFF57C00)); // 주황
      case 'hwp':
      case 'hwpx':
        return ('ㅎ', const Color(0xFF29B6F6)); // 한글: 하늘색
      case 'cbz':
        return ('C', const Color(0xFFFBC02D)); // 만화(CBZ): 노랑
    }
    return null;
  }

  static const Color imageGreen = Color(0xFF2E9E4F);
  static const Color epubBrown = Color(0xFF795548); // EPUB: 갈색

  @override
  Widget build(BuildContext context) {
    final mark = lettered(ext);
    if (mark == null) {
      switch (ext.toLowerCase()) {
        case 'epub':
          return _EpubIcon(size: size, color: this.color ?? epubColor ?? epubBrown, bookmarkColor: this.color);
        case 'txt':
          // 다른 형식처럼 끝이 접힌 종이 + 안에 줄 2개, 검은색 (어두운 화면에서는 밝게)
          return _TxtIcon(size: size, color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87);
      }
      // 이미지: 테두리와 안의 산 모양을 초록색으로
      return Icon(Icons.image_outlined, size: size, color: imageGreen);
    }
    final (letter, typeColor) = mark;
    final Color color = this.color ?? typeColor;
    // 한글 자모(ㅎ)는 글자 상자 안에서 작게 그려지므로 조금 크게
    final bool jamo = letter == 'ㅎ';
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.insert_drive_file_outlined, size: size, color: color),
          // 종이 모양 안쪽(접힌 귀 아래) 가운데에 글자
          Positioned(
            left: 0,
            right: 0,
            top: size * (jamo ? 0.27 : 0.33),
            child: Text(
              letter,
              textAlign: TextAlign.center,
              textScaler: TextScaler.noScaling,
              style: TextStyle(
                color: color,
                fontSize: size * (jamo ? 0.56 : 0.42),
                height: 1.0,
                fontWeight: FontWeight.w900,
                letterSpacing: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// TXT: 접힌 종이 안에 가로줄 2개
class _TxtIcon extends StatelessWidget {
  const _TxtIcon({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final double line = (size * 0.075).clamp(1.2, 3.0).toDouble();
    Widget bar(double width) => Container(width: size * width, height: line, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(line)));
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.insert_drive_file_outlined, size: size, color: color),
          Positioned(
            top: size * 0.48,
            left: size * 0.30,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                bar(0.40),
                SizedBox(height: size * 0.09),
                bar(0.30),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// EPUB: 갈색 직사각형(책) 안에 줄 3개 + 오른쪽 끝에 노란 책갈피
class _EpubIcon extends StatelessWidget {
  const _EpubIcon({required this.size, required this.color, this.bookmarkColor});

  final double size;
  final Color color;

  /// 책갈피 색 (없으면 노랑). 한 가지 색 아이콘(설정 화면 등)은 아이콘 색과 같게
  final Color? bookmarkColor;

  @override
  Widget build(BuildContext context) =>
      SizedBox.square(dimension: size, child: CustomPaint(painter: _EpubIconPainter(color, bookmarkColor ?? const Color(0xFFFFC107))));
}

class _EpubIconPainter extends CustomPainter {
  _EpubIconPainter(this.color, this.bookmarkColor);

  final Color color;
  final Color bookmarkColor;

  @override
  void paint(Canvas canvas, Size size) {
    final double u = size.width / 24.0;
    canvas.save();
    canvas.scale(u);
    // 직사각형 (다른 파일 아이콘의 종이와 같은 크기)
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTRB(5.0, 3.0, 19.0, 21.0), const Radius.circular(1.6)),
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0,
    );
    // 안의 줄 3개 (첫 줄은 책갈피 왼쪽까지만)
    final bar = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.7
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(const Offset(8.2, 9.2), const Offset(11.6, 9.2), bar);
    canvas.drawLine(const Offset(8.2, 13.4), const Offset(15.8, 13.4), bar);
    canvas.drawLine(const Offset(8.2, 17.4), const Offset(15.8, 17.4), bar);
    canvas.restore();
    // 오른쪽 끝 노란 책갈피 (윗변에 걸려 아래로)
    canvas.save();
    canvas.translate(13.6 * u, 3.0 * u);
    _BookmarkPainter(bookmarkColor).paint(canvas, Size(3.6 * u, 8.0 * u));
    canvas.restore();
  }

  @override
  bool shouldRepaint(_EpubIconPainter old) => old.color != color || old.bookmarkColor != bookmarkColor;
}

class _BookmarkPainter extends CustomPainter {
  _BookmarkPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width, h = size.height;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(w, 0)
      ..lineTo(w, h)
      ..lineTo(w / 2, h - w * 0.55)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_BookmarkPainter old) => old.color != color;
}


/// 한글(ㅎ)과 워드(W) 아이콘을 겹친 모양 (설정의 '한글·워드 글꼴')
class DocPairIcon extends StatelessWidget {
  const DocPairIcon({super.key, this.size = 24, this.color});
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurface;
    final double s = size * 0.78;
    return SizedBox.square(
      dimension: size,
      child: Stack(
        children: [
          Positioned(left: 0, top: 0, child: FileTypeIcon(ext: 'hwp', size: s, color: c)),
          // 앞 장(W)은 뒤 장이 비쳐 보이지 않게 바탕색으로 채움
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(s * 0.12)),
              child: FileTypeIcon(ext: 'docx', size: s, color: c),
            ),
          ),
        ],
      ),
    );
  }
}

/// 언어 아이콘: 한글 'ㄱ'과 영문 'A'를 겹쳐 한 글자처럼
class LanguageGlyphIcon extends StatelessWidget {
  const LanguageGlyphIcon({super.key, this.size = 24, this.color});
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurface;
    TextStyle st(double f) => TextStyle(color: c, fontSize: f, height: 1.0, fontWeight: FontWeight.w800, letterSpacing: 0);
    return SizedBox.square(
      dimension: size,
      child: Stack(
        children: [
          Positioned(left: size * 0.02, top: size * 0.02, child: Text('ㄱ', textScaler: TextScaler.noScaling, style: st(size * 0.62))),
          Positioned(right: size * 0.0, bottom: size * 0.0, child: Text('A', textScaler: TextScaler.noScaling, style: st(size * 0.60))),
        ],
      ),
    );
  }
}
