class HomeSummary {
  const HomeSummary({
    required this.categories,
    required this.months,
    required this.grandTotal,
  });

  factory HomeSummary.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return HomeSummary(
      categories: _readItems(
        payload,
        keys: const ['totalByCategory', 'totalsByCategory', 'categories'],
        labelKeys: const ['category', 'categoria', 'name', 'label'],
      ),
      months: _readItems(
        payload,
        keys: const ['totalByMonth', 'totalsByMonth', 'months'],
        labelKeys: const ['month', 'mes', 'label', 'period'],
      ),
      grandTotal: _readNumber(payload['grandTotal']),
    );
  }

  final List<SummaryItem> categories;
  final List<SummaryItem> months;
  final double grandTotal;

  SummaryItem? get topCategory {
    if (categories.isEmpty) {
      return null;
    }

    final sorted = [...categories]..sort((a, b) => b.total.compareTo(a.total));
    return sorted.first;
  }

  double get currentMonthTotal {
    final now = DateTime.now();
    final prefix = '${now.year}-${now.month.toString().padLeft(2, '0')}';
    return months
            .where((item) => item.label.startsWith(prefix))
            .firstOrNull
            ?.total ??
        0;
  }

  static List<SummaryItem> _readItems(
    Map<String, dynamic> payload, {
    required List<String> keys,
    required List<String> labelKeys,
  }) {
    final value = _readValue(payload, keys);

    if (value is List) {
      return value
          .map((item) => _readItem(item, labelKeys: labelKeys))
          .nonNulls
          .where((item) => item.total > 0)
          .toList();
    }

    if (value is Map) {
      return value.entries
          .map(
            (entry) => SummaryItem(
              label: entry.key.toString(),
              total: _readNumber(entry.value),
            ),
          )
          .where((item) => item.total > 0)
          .toList();
    }

    return const [];
  }

  static SummaryItem? _readItem(
    Object? value, {
    required List<String> labelKeys,
  }) {
    if (value is! Map) {
      return null;
    }

    final label = _readText(value, labelKeys);
    final total = _readNumber(
      _readValue(value, const ['total', 'value', 'amount']),
    );

    if (label == null) {
      return null;
    }

    return SummaryItem(label: label, total: total);
  }

  static Object? _readValue(Map payload, List<String> keys) {
    for (final key in keys) {
      if (payload.containsKey(key)) {
        return payload[key];
      }
    }

    return null;
  }

  static String? _readText(Map payload, List<String> keys) {
    final value = _readValue(payload, keys);
    return value?.toString();
  }

  static double _readNumber(Object? value) {
    return switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text.replaceAll(',', '.')) ?? 0,
      _ => 0,
    };
  }
}

class SummaryItem {
  const SummaryItem({required this.label, required this.total});

  final String label;
  final double total;
}
