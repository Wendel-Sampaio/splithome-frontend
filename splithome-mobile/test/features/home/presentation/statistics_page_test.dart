import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/home/data/home_repository.dart';
import 'package:splithome_mobile/features/home/data/home_summary.dart';
import 'package:splithome_mobile/features/home/presentation/statistics_page.dart';

void main() {
  testWidgets('renders statistics charts and ranking', (tester) async {
    const summary = HomeSummary(
      categories: [
        SummaryItem(label: 'MERCADO', total: 300),
        SummaryItem(label: 'MORADIA', total: 200),
      ],
      months: [
        SummaryItem(label: '2026-08', total: 500),
        SummaryItem(label: '2026-09', total: 700),
      ],
      grandTotal: 1200,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [homeSummaryProvider.overrideWith((ref) async => summary)],
        child: const MaterialApp(home: StatisticsPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Gráficos'), findsAtLeastNWidgets(1));
    expect(find.text('Total analisado'), findsOneWidget);
    expect(find.text('Gastos por mês'), findsOneWidget);
    expect(find.text('Distribuição por categoria'), findsOneWidget);

    await tester.scrollUntilVisible(find.text('Ranking de categorias'), 300);

    expect(find.text('Ranking de categorias'), findsOneWidget);
    expect(find.text('Mercado'), findsOneWidget);
    expect(find.text('MERCADO'), findsNothing);
  });
}
