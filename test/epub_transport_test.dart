import 'package:flutter_test/flutter_test.dart';
import 'epub_transport_checks.dart' as regression;

void main() {
  test('Android local TXT/EPUB transport', regression.verifyEpubTransport);
}
