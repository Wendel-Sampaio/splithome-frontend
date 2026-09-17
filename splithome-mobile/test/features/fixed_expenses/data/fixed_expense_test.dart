import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/fixed_expenses/data/fixed_expense.dart';
import 'package:splithome_mobile/features/fixed_expenses/data/fixed_expense_page.dart';
import 'package:splithome_mobile/features/fixed_expenses/data/fixed_expense_repository.dart';

void main() {
  test('parses fixed expense response payload', () {
    final expense = FixedExpense.fromJson({
      'id': 'expense-1',
      'title': 'Internet',
      'category': 'MORADIA',
      'responsibleId': 'user-1',
      'valorTotal': 120.0,
      'quantidadeParcelas': 12,
      'diaVencimento': 10,
      'dataInicio': '2026-09-01',
      'paymentDate': '2026-09-10',
      'payers': ['Ana', 'Bruno'],
      'remainingPayers': ['Bruno'],
      'parcelas': [
        {
          'id': 'installment-1',
          'expenseId': 'expense-1',
          'installmentNumber': 1,
          'value': 10,
          'dueDate': '2026-09-10',
          'paid': true,
        },
        {
          'id': 'installment-2',
          'expenseId': 'expense-1',
          'installmentNumber': 2,
          'value': 10,
          'dueDate': '2026-10-10',
          'paid': false,
        },
      ],
    });

    expect(expense.title, 'Internet');
    expect(expense.totalValue, 120);
    expect(expense.installmentsCount, 12);
    expect(expense.payers, ['Ana', 'Bruno']);
    expect(expense.remainingPayers, ['Bruno']);
    expect(expense.paidInstallments, 1);
    expect(expense.isPaid, isFalse);
  });

  test('parses Spring page payload', () {
    final page = FixedExpensePage.fromJson({
      'content': [
        {'id': 'expense-1', 'title': 'Internet', 'valorTotal': 120},
      ],
      'totalElements': 1,
      'totalPages': 1,
      'number': 0,
      'size': 20,
      'first': true,
      'last': true,
    }, itemBuilder: FixedExpense.fromJson);

    expect(page.content, hasLength(1));
    expect(page.totalElements, 1);
    expect(page.isFirst, isTrue);
    expect(page.isLast, isTrue);
  });

  test('serializes create fixed expense request for backend contract', () {
    const request = CreateFixedExpenseRequest(
      title: 'Internet',
      category: 'MORADIA',
      totalValue: 120,
      installmentsCount: 12,
      dueDay: 10,
      startDate: '2026-09-01',
      responsibleId: 'user-1',
      payers: ['Ana'],
      remainingPayers: ['Ana'],
    );

    expect(request.toJson(), {
      'title': 'Internet',
      'category': 'MORADIA',
      'totalValue': 120.0,
      'installmentsCount': 12,
      'dueDay': 10,
      'startDate': '2026-09-01',
      'creditCardId': null,
      'responsibleId': 'user-1',
      'payers': ['Ana'],
      'remainingPayers': ['Ana'],
    });
  });

  test('serializes recurring fixed expense without installments count', () {
    const request = CreateFixedExpenseRequest(
      title: 'Aluguel',
      category: 'MORADIA',
      totalValue: 1800,
      installmentsCount: null,
      dueDay: 5,
      startDate: '2026-09-01',
      responsibleId: 'user-1',
    );

    expect(request.toJson()['installmentsCount'], isNull);
  });
}
