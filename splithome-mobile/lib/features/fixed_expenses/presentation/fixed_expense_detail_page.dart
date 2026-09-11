import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/detail_row.dart';
import '../data/fixed_expense.dart';

class FixedExpenseDetailPage extends StatelessWidget {
  const FixedExpenseDetailPage({required this.expense, super.key});

  final FixedExpense expense;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhe da despesa'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: scheme.secondaryContainer,
                        foregroundColor: scheme.onSecondaryContainer,
                        child: const Icon(Icons.receipt_long_outlined),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              expense.title.isEmpty
                                  ? 'Despesa sem título'
                                  : expense.title,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            Text(
                              CurrencyFormatter.brl(expense.totalValue),
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(color: scheme.secondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DetailRow(label: 'Categoria', value: expense.category),
                  DetailRow(label: 'Início', value: expense.startDate ?? ''),
                  DetailRow(
                    label: 'Pagamento',
                    value: expense.paymentDate ?? '',
                  ),
                  DetailRow(
                    label: 'Vencimento',
                    value: expense.dueDay > 0 ? 'Dia ${expense.dueDay}' : '',
                  ),
                  DetailRow(
                    label: 'Parcelas',
                    value:
                        '${expense.paidInstallments}/${expense.installmentsCount} pagas',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Parcelas',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          if (expense.installments.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('Nenhuma parcela encontrada.'),
              ),
            )
          else
            ...expense.installments.map(_InstallmentTile.new),
        ],
      ),
    );
  }
}

class _InstallmentTile extends StatelessWidget {
  const _InstallmentTile(this.installment);

  final Installment installment;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: installment.paid
                ? scheme.primaryContainer
                : scheme.errorContainer,
            foregroundColor: installment.paid
                ? scheme.onPrimaryContainer
                : scheme.onErrorContainer,
            child: Icon(
              installment.paid
                  ? Icons.check_circle_outline
                  : Icons.schedule_outlined,
            ),
          ),
          title: Text('Parcela ${installment.installmentNumber}'),
          subtitle: Text(installment.dueDate ?? 'Sem vencimento'),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                CurrencyFormatter.brl(installment.value),
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              Text(installment.paid ? 'Paga' : 'Pendente'),
            ],
          ),
        ),
      ),
    );
  }
}
