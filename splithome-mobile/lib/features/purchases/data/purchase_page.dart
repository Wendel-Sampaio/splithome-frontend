class PurchasePage<T> {
  const PurchasePage({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.page,
    required this.size,
    required this.isFirst,
    required this.isLast,
  });

  factory PurchasePage.fromJson(
    Object? json, {
    required T Function(Object? json) itemBuilder,
  }) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};
    final content = payload['content'] is List
        ? payload['content'] as List
        : [];

    return PurchasePage<T>(
      content: content.map(itemBuilder).toList(),
      totalElements: _readInt(payload['totalElements']),
      totalPages: _readInt(payload['totalPages']),
      page: _readInt(payload['number']),
      size: _readInt(payload['size']),
      isFirst: payload['first'] == true,
      isLast: payload['last'] == true,
    );
  }

  final List<T> content;
  final int totalElements;
  final int totalPages;
  final int page;
  final int size;
  final bool isFirst;
  final bool isLast;

  static int _readInt(Object? value) {
    return switch (value) {
      int number => number,
      num number => number.toInt(),
      String text => int.tryParse(text) ?? 0,
      _ => 0,
    };
  }
}
