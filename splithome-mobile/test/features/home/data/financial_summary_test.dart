import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/home/data/financial_summary.dart';

void main() {
  test('parses financial summary total outstanding', () {
    final summary = FinancialSummary.fromJson({
      'balances': [
        {'memberId': 'user-1', 'memberName': 'Ana', 'netBalance': 120.5},
      ],
      'debts': [
        {
          'fromMemberId': 'user-2',
          'fromMemberName': 'Bruno',
          'toMemberId': 'user-1',
          'toMemberName': 'Ana',
          'amount': 45.25,
        },
      ],
      'settlements': [
        {
          'fromMemberId': 'user-2',
          'fromMemberName': 'Bruno',
          'toMemberId': 'user-1',
          'toMemberName': 'Ana',
          'amount': 45.25,
        },
      ],
      'totalOutstanding': 145.75,
    });

    expect(summary.totalOutstanding, 145.75);
    expect(summary.balances.single.memberName, 'Ana');
    expect(summary.debts.single.fromMemberName, 'Bruno');
    expect(summary.settlements.single.amount, 45.25);
  });

  test('falls back to zero when payload is invalid', () {
    final summary = FinancialSummary.fromJson(null);

    expect(summary.totalOutstanding, 0);
  });
}
