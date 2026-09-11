class FinancialSummary {
  const FinancialSummary({required this.totalOutstanding});

  const FinancialSummary.empty() : totalOutstanding = 0;

  factory FinancialSummary.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return FinancialSummary(
      totalOutstanding: _readNumber(payload['totalOutstanding']),
    );
  }

  final double totalOutstanding;

  static double _readNumber(Object? value) {
    return switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text.replaceAll(',', '.')) ?? 0,
      _ => 0,
    };
  }
}
