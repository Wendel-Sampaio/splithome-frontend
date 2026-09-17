class Purchase {
  const Purchase({
    required this.id,
    required this.title,
    required this.category,
    required this.value,
    required this.payers,
    required this.remainingPayers,
    required this.paymentDate,
    required this.purchaseDate,
    this.purchaserId,
    this.purchaserName,
  });

  factory Purchase.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return Purchase(
      id: payload['id']?.toString() ?? '',
      title: payload['title']?.toString() ?? '',
      category: payload['category']?.toString() ?? '',
      value: _readNumber(payload['value']),
      payers: _readStringList(payload['payers']),
      remainingPayers: _readStringList(payload['remainingPayers']),
      paymentDate: payload['paymentDate']?.toString(),
      purchaseDate: payload['purchaseDate']?.toString(),
      purchaserId: payload['purchaserId']?.toString(),
      purchaserName: payload['purchaserName']?.toString(),
    );
  }

  final String id;
  final String title;
  final String category;
  final double value;
  final List<String> payers;
  final List<String> remainingPayers;
  final String? paymentDate;
  final String? purchaseDate;
  final String? purchaserId;
  final String? purchaserName;

  bool get isPaid => remainingPayers.isEmpty;

  double get valuePerPayer {
    if (payers.isEmpty) {
      return value;
    }

    return value / payers.length;
  }

  static double _readNumber(Object? value) {
    return switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text.replaceAll(',', '.')) ?? 0,
      _ => 0,
    };
  }

  static List<String> _readStringList(Object? value) {
    if (value is! List) {
      return const [];
    }

    return value.map((item) => item.toString()).toList();
  }
}
