import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/category_formatter.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/detail_row.dart';
import '../../home/data/home_repository.dart';
import '../data/fixed_expense.dart';
import '../data/fixed_expense_repository.dart';

class FixedExpenseDetailPage extends ConsumerStatefulWidget {
  const FixedExpenseDetailPage({required this.expense, super.key});

  final FixedExpense expense;

  @override
  ConsumerState<FixedExpenseDetailPage> createState() =>
      _FixedExpenseDetailPageState();
}

class _FixedExpenseDetailPageState
    extends ConsumerState<FixedExpenseDetailPage> {
  late FixedExpense _expense;

  @override
  void initState() {
    super.initState();
    _expense = widget.expense;
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final expense = _expense;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhe da despesa'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
        actions: [
          PopupMenuButton<_FixedExpenseAction>(
            onSelected: (action) {
              switch (action) {
                case _FixedExpenseAction.edit:
                  context.push('/fixed-expenses/edit', extra: _expense);
                case _FixedExpenseAction.delete:
                  _confirmDelete();
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: _FixedExpenseAction.edit,
                child: Text('Editar'),
              ),
              PopupMenuItem(
                value: _FixedExpenseAction.delete,
                child: Text('Excluir'),
              ),
            ],
          ),
        ],
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
                  DetailRow(
                    label: 'Categoria',
                    value: CategoryFormatter.label(expense.category),
                  ),
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
            ...expense.installments.map(
              (installment) => _InstallmentTile(
                installment,
                onPay: installment.paid
                    ? null
                    : () => _payInstallment(installment),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Excluir despesa fixa?'),
          content: const Text('Esta ação não pode ser desfeita.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Excluir'),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !mounted) {
      return;
    }

    try {
      await ref
          .read(fixedExpenseRepositoryProvider)
          .deleteFixedExpense(_expense.id);
      ref.invalidate(fixedExpensesProvider);
      ref.invalidate(homeSummaryProvider);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Despesa fixa excluída com sucesso.')),
      );
      context.go('/fixed-expenses');
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  Future<void> _payInstallment(Installment installment) async {
    try {
      final paid = await ref
          .read(fixedExpenseRepositoryProvider)
          .payInstallment(installment.id);
      ref.invalidate(fixedExpensesProvider);
      ref.invalidate(homeSummaryProvider);

      if (!mounted) {
        return;
      }

      setState(() {
        _expense = FixedExpense(
          id: _expense.id,
          title: _expense.title,
          category: _expense.category,
          totalValue: _expense.totalValue,
          installmentsCount: _expense.installmentsCount,
          dueDay: _expense.dueDay,
          installments: _expense.installments
              .map((item) => item.id == paid.id ? paid : item)
              .toList(),
          startDate: _expense.startDate,
          paymentDate: _expense.paymentDate,
          responsibleId: _expense.responsibleId,
          creditCardId: _expense.creditCardId,
        );
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Parcela marcada como paga.')),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }
}

class _InstallmentTile extends StatelessWidget {
  const _InstallmentTile(this.installment, {required this.onPay});

  final Installment installment;
  final VoidCallback? onPay;

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
          title: Text(
            'Parcela ${installment.installmentNumber} • ${CurrencyFormatter.brl(installment.value)}',
          ),
          subtitle: Text(installment.dueDate ?? 'Sem vencimento'),
          trailing: onPay == null
              ? Text(installment.paid ? 'Paga' : 'Pendente')
              : TextButton(onPressed: onPay, child: const Text('Pagar')),
        ),
      ),
    );
  }
}

enum _FixedExpenseAction { edit, delete }
