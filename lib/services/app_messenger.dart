import 'package:flutter/material.dart';

/// 앱 어느 화면에서든 아래 알림(SnackBar)을 띄우기 위한 열쇠 (MaterialApp에 연결)
final GlobalKey<ScaffoldMessengerState> appMessengerKey = GlobalKey<ScaffoldMessengerState>();

void showAppNotice(String message, {IconData icon = Icons.check_circle_outline}) {
  final m = appMessengerKey.currentState;
  if (m == null) return;
  m
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 3),
      content: Row(children: [
        Icon(icon, color: Colors.amber, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(message, maxLines: 2, overflow: TextOverflow.ellipsis)),
      ]),
    ));
}
