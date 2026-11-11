import 'package:flutter/material.dart';

/// 고르기 창의 선택지
class ChoiceOption<T> {
  const ChoiceOption(this.value, this.label, {this.icon});

  final T value;
  final String label;
  final IconData? icon;
}

/// 아래에서 올라오는 '하나 고르기' 창.
/// 제목 + 선택지 목록(고른 줄은 강조, 오른쪽 동그라미) + 아래 '확인' 버튼.
/// '확인'을 눌러야 고른 값이 돌아오고, 그냥 닫으면 null.
Future<T?> showChoiceSheet<T>({
  required BuildContext context,
  required String title,
  required List<ChoiceOption<T>> options,
  required T current,
  String confirmLabel = '',
}) async {
  final r = await showModalBottomSheet<(T, bool)>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) => _ChoiceSheet<T>(title: title, options: options, current: current, confirmLabel: confirmLabel),
  );
  return r?.$1;
}

/// 하나 고르기 + 아래에 켜기/끄기 스위치 한 줄이 함께 있는 창.
/// '확인'을 누르면 (고른 값, 스위치 값)을 돌려준다. 그냥 닫으면 null.
/// 고르기 창 아래에 붙는 스위치 하나 (켜고 끌 때마다 [onChanged]가 바로 불림)
class SheetToggle {
  const SheetToggle({required this.label, this.subtitle, this.icon, required this.value, required this.onChanged, this.onlyFor});

  final String label;
  final String? subtitle;
  final IconData? icon;
  final bool value;
  final ValueChanged<bool> onChanged;

  /// 이 값이 골라져 있을 때만 보임 (예: '표지형'일 때만 '표지 그림 끄기')
  final Object? onlyFor;
}

Future<(T, bool)?> showChoiceSheetWithToggle<T>({
  required BuildContext context,
  required String title,
  required List<ChoiceOption<T>> options,
  required T current,
  required String toggleLabel,
  String? toggleSubtitle,
  IconData? toggleIcon,
  required bool toggleValue,
  String confirmLabel = '',
  /// 고르거나 스위치를 바꿀 때마다 바로 불림 (확인 버튼 없이 바로 적용)
  ValueChanged<(T, bool)>? onChanged,
  /// 첫 스위치 아래에 더 붙일 스위치들
  List<SheetToggle> moreToggles = const [],
}) {
  return showModalBottomSheet<(T, bool)>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (ctx) => _ChoiceSheet<T>(
      title: title,
      options: options,
      current: current,
      confirmLabel: confirmLabel,
      toggleLabel: toggleLabel,
      toggleSubtitle: toggleSubtitle,
      toggleIcon: toggleIcon,
      toggleValue: toggleValue,
      onChanged: onChanged,
      moreToggles: moreToggles,
    ),
  );
}

class _ChoiceSheet<T> extends StatefulWidget {
  const _ChoiceSheet({
    required this.title,
    required this.options,
    required this.current,
    required this.confirmLabel,
    this.toggleLabel,
    this.toggleSubtitle,
    this.toggleIcon,
    this.toggleValue = false,
    this.onChanged,
    this.moreToggles = const [],
  });

  final String title;
  final List<ChoiceOption<T>> options;
  final T current;
  final String confirmLabel;
  final String? toggleLabel;
  final String? toggleSubtitle;
  final IconData? toggleIcon;
  final bool toggleValue;
  final ValueChanged<(T, bool)>? onChanged;
  final List<SheetToggle> moreToggles;

  @override
  State<_ChoiceSheet<T>> createState() => _ChoiceSheetState<T>();
}

class _ChoiceSheetState<T> extends State<_ChoiceSheet<T>> {
  late T _selected = widget.current;
  late bool _toggle = widget.toggleValue;
  late final List<bool> _more = [for (final t in widget.moreToggles) t.value];

  Widget _toggleRow(ColorScheme cs, {IconData? icon, required String label, String? subtitle, required bool value, required ValueChanged<bool> onChanged}) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 16, 8),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 22, color: cs.onSurfaceVariant),
              const SizedBox(width: 14),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  if (subtitle != null) Text(subtitle, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                ],
              ),
            ),
            Switch(value: value, onChanged: onChanged),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 22, 24, 14),
            child: Text(widget.title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.bold)),
          ),
          Flexible(
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (final opt in widget.options)
                    Material(
                      color: opt.value == _selected ? cs.secondaryContainer.withValues(alpha: 0.55) : Colors.transparent,
                      child: InkWell(
                        // 누르면 바로 적용: 고르기만 있는 창은 바로 닫히고, 스위치가 함께 있는 창은 열린 채로 적용
                        onTap: () {
                          setState(() => _selected = opt.value);
                          widget.onChanged?.call((_selected, _toggle));
                          if (widget.toggleLabel == null) Navigator.pop(context, (_selected, _toggle));
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          child: Row(
                            children: [
                              if (opt.icon != null) ...[
                                Icon(opt.icon, size: 22, color: opt.value == _selected ? cs.primary : cs.onSurfaceVariant),
                                const SizedBox(width: 14),
                              ],
                              Expanded(
                                child: Text(
                                  opt.label,
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w600,
                                    color: opt.value == _selected ? cs.primary : cs.onSurface,
                                  ),
                                ),
                              ),
                              Icon(
                                opt.value == _selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                                size: 26,
                                color: opt.value == _selected ? cs.primary : cs.outline,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  if (widget.toggleLabel != null) ...[
                    const Divider(height: 16, indent: 24, endIndent: 24),
                    _toggleRow(
                      cs,
                      icon: widget.toggleIcon,
                      label: widget.toggleLabel!,
                      subtitle: widget.toggleSubtitle,
                      value: _toggle,
                      onChanged: (v) {
                        setState(() => _toggle = v);
                        widget.onChanged?.call((_selected, _toggle));
                      },
                    ),
                    for (int i = 0; i < widget.moreToggles.length; i++)
                      if (widget.moreToggles[i].onlyFor == null || widget.moreToggles[i].onlyFor == _selected)
                      _toggleRow(
                        cs,
                        icon: widget.moreToggles[i].icon,
                        label: widget.moreToggles[i].label,
                        subtitle: widget.moreToggles[i].subtitle,
                        value: _more[i],
                        onChanged: (v) {
                          setState(() => _more[i] = v);
                          widget.moreToggles[i].onChanged(v);
                        },
                      ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
