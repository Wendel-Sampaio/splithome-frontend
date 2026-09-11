import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/currency_formatter.dart';
import '../data/fixed_expense.dart';
import '../data/fixed_expense_repository.dart';

class FixedExpensesPage extends ConsumerWidget {
  const FixedExpensesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenses = ref.watch(fixedExpensesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Despesas fixas'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: expenses.when(
        data: (page) {
          if (page.content.isEmpty) {
            return const _EmptyFixedExpenses();
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(fixedExpensesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: page.content.length + 1,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _FixedExpensesHeader(
                    totalElements: page.totalElements,
                  );
                }

                return _FixedExpenseTile(expense: page.content[index - 1]);
              },
            ),
          );
        },
        error: (error, stackTrace) => _ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(fixedExpensesProvider),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/fixed-expenses/new'),
        icon: const Icon(Icons.add),
        label: const Text('Despesa'),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 2,
        onDestinationSelected: (index) {
          if (index == 0) {
            context.go('/home');
          }
          if (index == 1) {
            context.go('/purchases');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            label: 'Compras',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long),
            label: 'Despesas',
          ),
          NavigationDestination(
            icon: Icon(Icons.pie_chart_outline),
            label: 'Resumo',
          ),
        ],
      ),
    );
  }
}

class _FixedExpensesHeader extends StatelessWidget {
  const _FixedExpensesHeader({required this.totalElements});

  final int totalElements;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        '$totalElements despesas encontradas',
        style: Theme.of(
          context,
        ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _FixedExpenseTile extends StatelessWidget {
  const _FixedExpenseTile({required this.expense});

  final FixedExpense expense;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      child: ListTile(
        onTap: () => context.push('/fixed-expenses/detail', extra: expense),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: scheme.secondaryContainer,
          foregroundColor: scheme.onSecondaryContainer,
          child: const Icon(Icons.receipt_long_outlined),
        ),
        title: Text(
          expense.title.isEmpty ? 'Despesa sem título' : expense.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          [
            if (expense.category.isNotEmpty) expense.category,
            if (expense.startDate != null) 'desde ${expense.startDate}',
            if (expense.dueDay > 0) 'vence dia ${expense.dueDay}',
          ].join(' • '),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              CurrencyFormatter.brl(expense.totalValue),
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              expense.installments.isEmpty
                  ? '${expense.installmentsCount} parc.'
                  : '${expense.paidInstallments}/${expense.installments.length} pagas',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: expense.isPaid
                    ? scheme.primary
                    : scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyFixedExpenses extends StatelessWidget {
  const _EmptyFixedExpenses();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text('Nenhuma despesa fixa encontrada.'),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_outlined, size: 42),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }
}
