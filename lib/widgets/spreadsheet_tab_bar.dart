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
  });

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
    return Material(
      color: colors.surface,
      child: SizedBox(
        height: 48,
        child: LayoutBuilder(builder: (context, constraints) {
          if (_width != constraints.maxWidth) {
            _width = constraints.maxWidth;
            _revealSelected();
          }
          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (int i = 0; i < widget.names.length; i++)
                Semantics(
                  key: _keys[i],
                  button: true,
                  selected: i == widget.selectedIndex,
                  child: InkWell(
                    onTap: () => widget.onSelected(i),
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      constraints: const BoxConstraints(minWidth: 80),
                      decoration: BoxDecoration(
                        color: i == widget.selectedIndex ? Colors.amber.withValues(alpha: .16) : null,
                        border: Border(
                          right: BorderSide(color: colors.outlineVariant),
                          bottom: BorderSide(
                            color: i == widget.selectedIndex ? Colors.amber : colors.outlineVariant,
                            width: i == widget.selectedIndex ? 3 : 1,
                          ),
                        ),
                      ),
                      child: Text(widget.names[i], maxLines: 1,
                          style: TextStyle(fontSize: 14,
                              fontWeight: i == widget.selectedIndex ? FontWeight.w700 : FontWeight.w400)),
                    ),
                  ),
                ),
            ]),
          );
        }),
      ),
    );
  }
}
