import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/fixed_expenses/data/fixed_expense.dart';
import 'package:splithome_mobile/features/fixed_expenses/presentation/fixed_expense_detail_page.dart';

void main() {
  testWidgets('renders fixed expense details and installments', (tester) async {
    const expense = FixedExpense(
      id: 'expense-1',
      title: 'Internet',
      category: 'MORADIA',
      totalValue: 120,
      installmentsCount: 2,
      dueDay: 10,
      startDate: '2026-09-01',
      paymentDate: '2026-09-10',
      responsibleId: 'user-1',
      payers: ['Ana', 'Bruno'],
      remainingPayers: ['Bruno'],
      installments: [
        Installment(
          id: 'installment-1',
          expenseId: 'expense-1',
          installmentNumber: 1,
          value: 60,
          dueDate: '2026-09-10',
          paid: true,
        ),
        Installment(
          id: 'installment-2',
          expenseId: 'expense-1',
          installmentNumber: 2,
          value: 60,
          dueDate: '2026-10-10',
          paid: false,
        ),
      ],
    );

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: FixedExpenseDetailPage(expense: expense)),
      ),
    );

    expect(find.text('Internet'), findsOneWidget);
    expect(find.text('Moradia'), findsOneWidget);
    expect(find.text('MORADIA'), findsNothing);
    expect(find.text('Pagadores'), findsOneWidget);
    expect(find.text('Pendências'), findsOneWidget);
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('Bruno'), findsAtLeastNWidgets(1));
    expect(find.text('1/2 pagas'), findsOneWidget);

    await tester.scrollUntilVisible(find.textContaining('Cobrança 1'), 300);

    expect(find.textContaining('Cobrança 1'), findsOneWidget);
    expect(find.textContaining('Cobrança 2'), findsOneWidget);
    expect(find.text('Paga'), findsOneWidget);
    expect(find.text('Pagar'), findsOneWidget);
  });
}
