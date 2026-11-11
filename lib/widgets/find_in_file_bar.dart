import 'package:flutter/material.dart';

/// 파일 내 단어 검색 막대 (PC의 Ctrl+F처럼): 단어를 넣고 찾으면 몇 번째/전체를 보여 주고,
/// 위·아래 화살표로 이전/다음 결과로 옮겨 간다. 찾은 곳 표시는 각 화면이 맡는다.
class FindInFileBar extends StatefulWidget {
  const FindInFileBar({
    super.key,
    required this.onSearch,
    required this.onGoto,
    required this.onClose,
    required this.tr,
  });

  /// 단어를 찾아 결과 수를 돌려준다
  final Future<int> Function(String query) onSearch;

  /// [index]번째(0부터) 결과로 이동
  final Future<void> Function(int index) onGoto;
  final VoidCallback onClose;
  final String Function(String ko, String en, String zh, String ja) tr;

  @override
  State<FindInFileBar> createState() => _FindInFileBarState();
}

class _FindInFileBarState extends State<FindInFileBar> {
  final TextEditingController _input = TextEditingController();
  final FocusNode _focus = FocusNode();
  String _searched = '';
  int _count = 0;
  int _index = -1;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _input.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _run() async {
    final query = _input.text.trim();
    if (query.isEmpty || _busy) return;
    if (query == _searched && _count > 0) {
      await _step(1);
      return;
    }
    setState(() => _busy = true);
    final count = await widget.onSearch(query);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _searched = query;
      _count = count;
      _index = count > 0 ? 0 : -1;
    });
    if (count > 0) {
      _focus.unfocus(); // 키보드를 내려 찾은 곳이 가려지지 않게
      await widget.onGoto(0);
    }
  }

  Future<void> _step(int delta) async {
    if (_count == 0) return;
    final next = (_index + delta) % _count;
    setState(() => _index = next < 0 ? next + _count : next);
    await widget.onGoto(_index);
  }

  @override
  Widget build(BuildContext context) {
    final String status = _busy
        ? ''
        : _searched.isEmpty
            ? ''
            : _count == 0
                ? widget.tr('없음', 'None', '无结果', 'なし')
                : '${_index + 1}/$_count';
    return Material(
      color: Colors.black87,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          child: Row(
            children: [
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.close, color: Colors.white, size: 20),
                tooltip: widget.tr('검색 닫기', 'Close Search', '关闭搜索', '検索を閉じる'),
                onPressed: widget.onClose,
              ),
              Expanded(
                child: TextField(
                  controller: _input,
                  focusNode: _focus,
                  style: const TextStyle(color: Colors.white, fontSize: 15),
                  cursorColor: Colors.amber,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _run(),
                  onChanged: (_) {
                    if (_searched.isNotEmpty) setState(() => _searched = '');
                  },
                  decoration: InputDecoration(
                    isDense: true,
                    border: InputBorder.none,
                    hintText: widget.tr('파일 내 단어 검색', 'Find in file', '在文件中查找', 'ファイル内検索'),
                    hintStyle: const TextStyle(color: Colors.white54, fontSize: 15),
                    prefixIcon: const Icon(Icons.search, color: Colors.white70, size: 20),
                    prefixIconConstraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                ),
              ),
              if (_busy)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 10),
                  child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.amber)),
                )
              else if (status.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(status, style: const TextStyle(color: Colors.amber, fontSize: 13, fontWeight: FontWeight.w600)),
                ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.keyboard_arrow_up, color: Colors.white, size: 22),
                tooltip: widget.tr('이전 결과', 'Previous', '上一个', '前へ'),
                onPressed: _count > 0 ? () => _step(-1) : null,
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 22),
                tooltip: widget.tr('다음 결과', 'Next', '下一个', '次へ'),
                onPressed: _count > 0 ? () => _step(1) : _run,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
