import 'package:flutter/material.dart';

/// 서재에서 파일 이름 앞에 보이는 형식 아이콘.
/// 워드·엑셀·파워포인트·PDF·한글은 종이 모양 안에 글자(W·X·P·P·ㅎ)를 넣고 형식별 색으로 보여 준다.
class FileTypeIcon extends StatelessWidget {
  const FileTypeIcon({super.key, required this.ext, this.size = 24, this.fallbackColor = Colors.indigo, this.epubColor});

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
          return _EpubIcon(size: size, color: epubColor ?? epubBrown);
        case 'txt':
          // 다른 형식처럼 끝이 접힌 종이 + 안에 줄 2개, 검은색 (어두운 화면에서는 밝게)
          return _TxtIcon(size: size, color: Theme.of(context).brightness == Brightness.dark ? Colors.white70 : Colors.black87);
      }
      // 이미지: 테두리와 안의 산 모양을 초록색으로
      return Icon(Icons.image_outlined, size: size, color: imageGreen);
    }
    final (letter, color) = mark;
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
  const _EpubIcon({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => SizedBox.square(dimension: size, child: CustomPaint(painter: _EpubIconPainter(color)));
}

class _EpubIconPainter extends CustomPainter {
  _EpubIconPainter(this.color);

  final Color color;

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
    _BookmarkPainter().paint(canvas, Size(3.6 * u, 8.0 * u));
    canvas.restore();
  }

  @override
  bool shouldRepaint(_EpubIconPainter old) => old.color != color;
}

class _BookmarkPainter extends CustomPainter {
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
    canvas.drawPath(path, Paint()..color = const Color(0xFFFFC107));
  }

  @override
  bool shouldRepaint(_BookmarkPainter old) => false;
}
