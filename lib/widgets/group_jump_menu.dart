import 'dart:math' as math;

import 'package:flutter/material.dart';

/// 메뉴 한 줄: (값, 보이는 이름, 아이콘, 글자·아이콘 색(없으면 기본))
typedef ScaleMenuItem<T> = (T, String, IconData, Color?);

/// 누른 아이콘(칩)에서 빠져나오며 커지고, 닫힐 때는 다시 작아지며 그 안으로 들어가는 메뉴.
/// [전체] 그룹 목록, 파일의 점 3개 메뉴가 같이 쓴다.
class GroupJumpMenuRoute<T> extends PopupRoute<T> {
  GroupJumpMenuRoute({required this.anchor, required this.items, this.barrierLabel, this.leadingFor});

  /// 줄 앞 그림을 따로 줄 때 (예: 그룹 이름이 파일 형식이면 그 형식 아이콘). null이면 기본 아이콘
  final Widget? Function(T value)? leadingFor;

  /// 누른 아이콘(칩)의 화면 위치
  final Rect anchor;
  final List<ScaleMenuItem<T>> items;

  @override
  final String? barrierLabel;

  @override
  Color? get barrierColor => Colors.transparent;

  @override
  bool get barrierDismissible => true;

  @override
  Duration get transitionDuration => const Duration(milliseconds: 300);

  @override
  Duration get reverseTransitionDuration => const Duration(milliseconds: 200);

  @override
  Widget buildPage(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation) {
    final Size screen = MediaQuery.sizeOf(context);
    final EdgeInsets pad = MediaQuery.paddingOf(context);
    const double menuWidth = 220, rowHeight = 46;
    final double menuHeight = math.min(screen.height * 0.6, items.length * rowHeight + 12);
    // 화면 오른쪽에 있는 아이콘이면 메뉴 오른쪽 끝을 맞추고, 아래 공간이 모자라면 위로 펼침
    final bool alignRight = anchor.center.dx > screen.width / 2;
    final bool above = anchor.bottom + 6 + menuHeight > screen.height - pad.bottom - 8 && anchor.top - 6 - menuHeight > pad.top;
    final double edgeX = alignRight ? math.min(screen.width - 8, anchor.right) : math.max(8.0, anchor.left);
    // 위아래 어디로도 다 들어가지 않으면 화면 안에 들어오도록 올려서 펼침
    final double edgeY = above
        ? anchor.top - 6
        : math.max(pad.top + 8, math.min(anchor.bottom + 6, screen.height - pad.bottom - 8 - menuHeight));
    final Alignment corner = above ? (alignRight ? Alignment.bottomRight : Alignment.bottomLeft) : (alignRight ? Alignment.topRight : Alignment.topLeft);
    // 누른 아이콘 가운데에서 커져 나오도록 (메뉴 모서리 기준)
    final Offset origin = Offset(anchor.center.dx - edgeX, anchor.center.dy - edgeY);
    final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutBack, reverseCurve: Curves.easeInCubic);
    final fade = CurvedAnimation(parent: animation, curve: const Interval(0, 0.5), reverseCurve: const Interval(0.4, 1));
    final cs = Theme.of(context).colorScheme;
    final card = Material(
      color: cs.surfaceContainerHigh,
      elevation: 6,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: ConstrainedBox(
        constraints: BoxConstraints(minWidth: 150, maxWidth: menuWidth, maxHeight: screen.height * 0.6),
        child: IntrinsicWidth(
          // ListView는 내용 너비를 잴 수 없어 Column + 스크롤로
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (final (value, label, icon, color) in items)
                InkWell(
                  onTap: () => Navigator.of(context).pop(value),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        leadingFor?.call(value) ?? Icon(icon, size: 16, color: color ?? cs.onSurfaceVariant),
                        const SizedBox(width: 10),
                        Flexible(child: Text(label, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 15, color: color))),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          ),
        ),
      ),
    );
    return Stack(
      children: [
        Positioned(
          left: alignRight ? null : edgeX,
          right: alignRight ? screen.width - edgeX : null,
          top: above ? null : edgeY,
          bottom: above ? screen.height - edgeY : null,
          child: AnimatedBuilder(
            animation: animation,
            child: card,
            builder: (context, child) => Opacity(
              opacity: fade.value.clamp(0.0, 1.0),
              child: Transform.scale(
                scale: 0.12 + 0.88 * curved.value,
                alignment: corner,
                origin: origin,
                child: child,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// [anchorContext] 위치에서 커져 나오는 메뉴를 띄우고 고른 값을 돌려줌 (닫으면 null)
Future<T?> showScaleMenu<T>(BuildContext anchorContext, List<ScaleMenuItem<T>> items) {
  final box = anchorContext.findRenderObject() as RenderBox?;
  if (box == null || !box.hasSize) return Future.value(null);
  final Offset topLeft = box.localToGlobal(Offset.zero);
  return Navigator.of(anchorContext).push<T>(
    GroupJumpMenuRoute<T>(
      anchor: topLeft & box.size,
      barrierLabel: MaterialLocalizations.of(anchorContext).modalBarrierDismissLabel,
      items: items,
    ),
  );
}
