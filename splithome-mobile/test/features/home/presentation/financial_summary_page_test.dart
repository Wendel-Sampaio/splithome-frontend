import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/home/data/financial_summary.dart';
import 'package:splithome_mobile/features/home/data/financial_summary_repository.dart';
import 'package:splithome_mobile/features/home/presentation/financial_summary_page.dart';

void main() {
  testWidgets('renders financial summary sections', (tester) async {
    const summary = FinancialSummary(
      balances: [
        FinancialMemberBalance(
          memberId: 'user-1',
          memberName: 'Ana',
          netBalance: 120,
        ),
      ],
      debts: [
        FinancialDebt(
          fromMemberId: 'user-2',
          fromMemberName: 'Bruno',
          toMemberId: 'user-1',
          toMemberName: 'Ana',
          amount: 45,
        ),
      ],
      settlements: [],
      totalOutstanding: 45,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          financialSummaryProvider.overrideWith((ref) async => summary),
        ],
        child: const MaterialApp(home: FinancialSummaryPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Resumo financeiro'), findsOneWidget);
    expect(find.text('Total em aberto'), findsOneWidget);
    expect(find.text('Saldos por membro'), findsOneWidget);
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('Bruno deve para Ana'), findsOneWidget);
  });
}
