class FinancialSummary {
  const FinancialSummary({
    required this.balances,
    required this.debts,
    required this.settlements,
    required this.totalOutstanding,
  });

  const FinancialSummary.empty()
    : balances = const [],
      debts = const [],
      settlements = const [],
      totalOutstanding = 0;

  factory FinancialSummary.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return FinancialSummary(
      balances: _readList(payload['balances'], FinancialMemberBalance.fromJson),
      debts: _readList(payload['debts'], FinancialDebt.fromJson),
      settlements: _readList(payload['settlements'], FinancialDebt.fromJson),
      totalOutstanding: _readNumber(payload['totalOutstanding']),
    );
  }

  final List<FinancialMemberBalance> balances;
  final List<FinancialDebt> debts;
  final List<FinancialDebt> settlements;
  final double totalOutstanding;

  static List<T> _readList<T>(
    Object? value,
    T Function(Object? json) itemBuilder,
  ) {
    if (value is! List) {
      return const [];
    }

    return value.map(itemBuilder).toList();
  }

  static double _readNumber(Object? value) {
    return switch (value) {
      num number => number.toDouble(),
      String text => double.tryParse(text.replaceAll(',', '.')) ?? 0,
      _ => 0,
    };
  }
}

class FinancialMemberBalance {
  const FinancialMemberBalance({
    required this.memberId,
    required this.memberName,
    required this.netBalance,
  });

  factory FinancialMemberBalance.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return FinancialMemberBalance(
      memberId: payload['memberId']?.toString() ?? '',
      memberName: payload['memberName']?.toString() ?? '',
      netBalance: FinancialSummary._readNumber(payload['netBalance']),
    );
  }

  final String memberId;
  final String memberName;
  final double netBalance;
}

class FinancialDebt {
  const FinancialDebt({
    required this.fromMemberId,
    required this.fromMemberName,
    required this.toMemberId,
    required this.toMemberName,
    required this.amount,
  });

  factory FinancialDebt.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return FinancialDebt(
      fromMemberId: payload['fromMemberId']?.toString() ?? '',
      fromMemberName: payload['fromMemberName']?.toString() ?? '',
      toMemberId: payload['toMemberId']?.toString() ?? '',
      toMemberName: payload['toMemberName']?.toString() ?? '',
      amount: FinancialSummary._readNumber(payload['amount']),
    );
  }

  final String fromMemberId;
  final String fromMemberName;
  final String toMemberId;
  final String toMemberName;
  final double amount;
}
