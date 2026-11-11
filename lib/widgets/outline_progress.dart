import 'package:flutter/material.dart';

/// 목차 칸: 목차를 만드는 동안 보여 주는 안내 + 진행률
class OutlineProgressView extends StatelessWidget {
  const OutlineProgressView({super.key, required this.progress, required this.label, this.hint});

  /// 0~1
  final double progress;

  /// 예: '목차 만드는 중'
  final String label;

  /// 아래 작은 안내 (예: 처음 한 번만 만든다는 말)
  final String? hint;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final int pct = (progress * 100).clamp(0, 100).floor();
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 44,
              height: 44,
              child: CircularProgressIndicator(value: progress <= 0 ? null : progress.clamp(0.0, 1.0), strokeWidth: 3.5),
            ),
            const SizedBox(height: 18),
            Text('$label… $pct%', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            if (hint != null) ...[
              const SizedBox(height: 6),
              Text(hint!, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
            ],
          ],
        ),
      ),
    );
  }
}
