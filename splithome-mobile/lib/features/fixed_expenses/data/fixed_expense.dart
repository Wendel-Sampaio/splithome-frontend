class FixedExpense {
  const FixedExpense({
    required this.id,
    required this.title,
    required this.category,
    required this.totalValue,
    required this.installmentsCount,
    required this.dueDay,
    required this.installments,
    this.startDate,
    this.paymentDate,
    this.responsibleId,
    this.creditCardId,
  });

  factory FixedExpense.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};
    final installments = payload['parcelas'] is List
        ? payload['parcelas'] as List
        : const [];

    return FixedExpense(
      id: payload['id']?.toString() ?? '',
      title: payload['title']?.toString() ?? '',
      category: payload['category']?.toString() ?? '',
      totalValue: _readNumber(payload['valorTotal']),
      installmentsCount: _readInt(payload['quantidadeParcelas']),
      dueDay: _readInt(payload['diaVencimento']),
      startDate: payload['dataInicio']?.toString(),
      paymentDate: payload['paymentDate']?.toString(),
      responsibleId: payload['responsibleId']?.toString(),
      creditCardId: payload['creditCardId']?.toString(),
      installments: installments.map(Installment.fromJson).toList(),
    );
  }

  final String id;
  final String title;
  final String category;
  final double totalValue;
  final int installmentsCount;
  final int dueDay;
  final String? startDate;
  final String? paymentDate;
  final String? responsibleId;
  final String? creditCardId;
  final List<Installment> installments;

  int get paidInstallments {
    return installments.where((installment) => installment.paid).length;
  }

  bool get isPaid {
    return installments.isNotEmpty && paidInstallments == installments.length;
  }

  static double _readNumber(Object? value) {
    return switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text.replaceAll(',', '.')) ?? 0,
      _ => 0,
    };
  }

  static int _readInt(Object? value) {
    return switch (value) {
      int number => number,
      num number => number.toInt(),
      String text => int.tryParse(text) ?? 0,
      _ => 0,
    };
  }
}

class Installment {
  const Installment({
    required this.id,
    required this.installmentNumber,
    required this.value,
    required this.paid,
    this.expenseId,
    this.dueDate,
  });

  factory Installment.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return Installment(
      id: payload['id']?.toString() ?? '',
      expenseId: payload['expenseId']?.toString(),
      installmentNumber: FixedExpense._readInt(payload['installmentNumber']),
      value: FixedExpense._readNumber(payload['value']),
      dueDate: payload['dueDate']?.toString(),
      paid: payload['paid'] == true,
    );
  }

  final String id;
  final String? expenseId;
  final int installmentNumber;
  final double value;
  final String? dueDate;
  final bool paid;
}
