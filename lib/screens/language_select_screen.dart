import 'package:flutter/material.dart';

import '../services/storage_service.dart';

/// 언어 선택지 이름: 각 언어로 표시. '기본 시스템'은 휴대폰(시스템) 언어로 표시한다.
String languageOptionLabel(String code) {
  switch (code) {
    case 'system':
      return systemDefaultLabel(StorageService.resolveSystemLanguage());
    case 'en':
      return 'English';
    case 'ja':
      return '日本語';
    case 'zh':
      return '中文';
    case 'ko':
      return '한국어';
  }
  return code;
}

/// '기본 시스템' 문구 (주어진 언어로)
String systemDefaultLabel(String lang) =>
    AppI18n.t(lang, ko: '기본 시스템', en: 'System default', zh: '跟随系统', ja: 'システムのデフォルト');

/// 앱 처음 시작 시 보여 주는 언어 선택 화면.
/// 순서: 기본 시스템, 영어, 일본어, 중국어, 한국어. 아래 '확인'을 누르면 확정. 앱 테마(밝게/어둡게)를 따른다.
class LanguageSelectScreen extends StatefulWidget {
  const LanguageSelectScreen({super.key, required this.onConfirmed});

  /// 고른 설정값('system', 'en', 'ja', 'zh', 'ko')
  final ValueChanged<String> onConfirmed;

  static const List<String> options = ['system', 'en', 'ja', 'zh', 'ko'];

  @override
  State<LanguageSelectScreen> createState() => _LanguageSelectScreenState();
}

class _LanguageSelectScreenState extends State<LanguageSelectScreen> {
  String _selected = 'system';

  /// 목록 왼쪽 동그라미 안 글자
  static String _badge(String code) {
    switch (code) {
      case 'en':
        return 'EN';
      case 'ja':
        return 'あ';
      case 'zh':
        return '中';
      case 'ko':
        return '가';
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    // 화면 문구는 지금 고른 언어로 미리 보여 준다
    final String lang = StorageService.resolveAppLanguage(_selected);
    String t(String ko, String en, String zh, String ja) => AppI18n.t(lang, ko: ko, en: en, zh: zh, ja: ja);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text(t('언어', 'Language', '语言', '言語')),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: cs.primaryContainer,
                    child: Icon(Icons.translate, color: cs.onPrimaryContainer),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('앱에서 사용할 언어를 선택하세요', 'Choose the app language', '请选择应用语言', 'アプリの言語を選んでください'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          t('나중에 앱 설정에서 바꿀 수 있어요.', 'You can change it later in App Settings.', '之后可在应用设置中更改。', '後でアプリ設定から変更できます。'),
                          style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: [
                  for (final code in LanguageSelectScreen.options)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: ListTile(
                        selected: code == _selected,
                        selectedTileColor: cs.secondaryContainer,
                        selectedColor: cs.onSecondaryContainer,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        leading: CircleAvatar(
                          radius: 18,
                          backgroundColor: code == _selected ? cs.primary : cs.surfaceContainerHighest,
                          foregroundColor: code == _selected ? cs.onPrimary : cs.onSurfaceVariant,
                          child: code == 'system'
                              ? const Icon(Icons.phone_android, size: 19)
                              : Text(_badge(code), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                        title: Text(languageOptionLabel(code), style: const TextStyle(fontWeight: FontWeight.w600)),
                        // 기본 시스템: 지금 휴대폰 언어에 따라 어떤 언어로 보일지
                        subtitle: code == 'system' ? Text(languageOptionLabel(StorageService.resolveSystemLanguage())) : null,
                        trailing: Icon(
                          code == _selected ? Icons.check_circle : Icons.radio_button_unchecked,
                          color: code == _selected ? cs.primary : cs.outline,
                        ),
                        onTap: () => setState(() => _selected = code),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: FilledButton.icon(
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                icon: const Icon(Icons.check),
                label: Text(t('확인', 'Continue', '确定', '決定')),
                onPressed: () => widget.onConfirmed(_selected),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
