import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/home/data/home_summary.dart';

void main() {
  test('parses backend stats summary payload', () {
    final summary = HomeSummary.fromJson({
      'totalByCategory': [
        {'category': 'MERCADO', 'total': 320.75},
        {'category': 'ALUGUEL', 'total': 1200},
      ],
      'totalByMonth': [
        {'month': '2026-08', 'total': 900},
        {'month': '2026-09', 'total': 620.75},
      ],
      'grandTotal': 1520.75,
    });

    expect(summary.grandTotal, 1520.75);
    expect(summary.categories, hasLength(2));
    expect(summary.months, hasLength(2));
    expect(summary.topCategory?.label, 'ALUGUEL');
  });

  test('supports map based category totals', () {
    final summary = HomeSummary.fromJson({
      'totalByCategory': {'MERCADO': '10,5', 'LAZER': 20},
      'grandTotal': '30.5',
    });

    expect(summary.grandTotal, 30.5);
    expect(summary.categories.map((item) => item.label), ['MERCADO', 'LAZER']);
  });
}
