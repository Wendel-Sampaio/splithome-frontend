import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/home/data/financial_summary.dart';

void main() {
  test('parses financial summary total outstanding', () {
    final summary = FinancialSummary.fromJson({'totalOutstanding': 145.75});

    expect(summary.totalOutstanding, 145.75);
  });

  test('falls back to zero when payload is invalid', () {
    final summary = FinancialSummary.fromJson(null);

    expect(summary.totalOutstanding, 0);
  });
}
