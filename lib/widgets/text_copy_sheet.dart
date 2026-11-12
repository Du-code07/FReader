import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// 지금 보고 있는 쪽의 글을 보여 주고, 골라서(길게 눌러) 또는 전체를 복사할 수 있게 하는 창
Future<void> showTextCopySheet(
  BuildContext context, {
  required String text,
  required String Function(String ko, String en, String zh, String ja) tr,
}) {
  final cleaned = text.replaceAll(RegExp(r'[ \t]+\n'), '\n').replaceAll(RegExp(r'\n{3,}'), '\n\n').trim();
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) {
      final cs = Theme.of(ctx).colorScheme;
      return SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.75),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 12, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(tr('글자 복사', 'Copy Text', '复制文字', '文字をコピー'),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                    if (cleaned.isNotEmpty)
                      FilledButton.tonalIcon(
                        icon: const Icon(Icons.copy_all_outlined, size: 16),
                        label: Text(tr('전체 복사', 'Copy All', '全部复制', 'すべてコピー')),
                        onPressed: () async {
                          await Clipboard.setData(ClipboardData(text: cleaned));
                          if (!ctx.mounted) return;
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(tr('복사했습니다.', 'Copied.', '已复制。', 'コピーしました。')), duration: const Duration(seconds: 1)),
                          );
                        },
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
                child: Text(
                  tr('필요한 부분만 복사하려면 글을 길게 눌러 고르세요.', 'Long-press the text to select a part.', '长按文字可选择部分内容。', '一部だけなら文字を長押しして選択してください。'),
                  style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant),
                ),
              ),
              const Divider(height: 1),
              Flexible(
                child: cleaned.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.all(28),
                        child: Text(
                          tr('이 쪽에서 읽을 수 있는 글자가 없습니다.', 'No text found on this page.', '此页没有可读取的文字。', 'このページに読み取れる文字がありません。'),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
                        child: SelectableText(cleaned, style: const TextStyle(fontSize: 15.5, height: 1.55)),
                      ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
