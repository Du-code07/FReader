import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Fixed above the worksheet: dragging these tabs never scrolls the grid.
/// Every sheet is present, including names wider than the available screen.
class SpreadsheetTabBar extends StatefulWidget {
  const SpreadsheetTabBar({
    super.key,
    required this.names,
    required this.selectedIndex,
    required this.onSelected,
    this.atBottom = false,
  });

  /// 화면 아래에 둘 때: 고른 시트 표시 줄을 위쪽에 (엑셀 앱처럼)
  final bool atBottom;

  final List<String> names;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  State<SpreadsheetTabBar> createState() => _SpreadsheetTabBarState();
}

class _SpreadsheetTabBarState extends State<SpreadsheetTabBar> {
  final List<GlobalKey> _keys = [];
  double? _width;

  void _revealSelected() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || widget.selectedIndex < 0 || widget.selectedIndex >= _keys.length) return;
      final tabContext = _keys[widget.selectedIndex].currentContext;
      if (tabContext != null) {
        Scrollable.ensureVisible(tabContext,
            alignment: .5, duration: const Duration(milliseconds: 180));
      }
    });
  }

  @override
  void didUpdateWidget(covariant SpreadsheetTabBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex || !listEquals(oldWidget.names, widget.names)) {
      _revealSelected();
    }
  }

  @override
  Widget build(BuildContext context) {
    while (_keys.length < widget.names.length) {
      _keys.add(GlobalKey());
    }
    final colors = Theme.of(context).colorScheme;
    // 앱의 그룹 칩과 같은 둥근 알약 모양 탭 (고른 시트는 채워서)
    return SizedBox(
      height: 52,
      child: LayoutBuilder(builder: (context, constraints) {
        if (_width != constraints.maxWidth) {
          _width = constraints.maxWidth;
          _revealSelected();
        }
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(children: [
            for (int i = 0; i < widget.names.length; i++)
              Padding(
                key: _keys[i],
                padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 9),
                child: Semantics(
                  button: true,
                  selected: i == widget.selectedIndex,
                  child: Material(
                    color: i == widget.selectedIndex ? colors.secondaryContainer : Colors.transparent,
                    shape: StadiumBorder(
                      side: BorderSide(color: i == widget.selectedIndex ? Colors.transparent : colors.outlineVariant),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => widget.onSelected(i),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.grid_on_rounded, size: 15,
                              color: i == widget.selectedIndex ? colors.onSecondaryContainer : colors.onSurfaceVariant),
                          const SizedBox(width: 6),
                          Text(widget.names[i], maxLines: 1,
                              style: TextStyle(
                                fontSize: 13.5,
                                color: i == widget.selectedIndex ? colors.onSecondaryContainer : colors.onSurface,
                                fontWeight: i == widget.selectedIndex ? FontWeight.w700 : FontWeight.w500,
                              )),
                        ]),
                      ),
                    ),
                  ),
                ),
              ),
          ]),
        );
      }),
    );
  }
}
