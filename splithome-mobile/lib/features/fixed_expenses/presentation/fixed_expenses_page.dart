import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../shared/formatters/category_formatter.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/premium_feature_gate.dart';
import '../../../shared/widgets/sh_empty_state.dart';
import '../../../shared/widgets/sh_error_state.dart';
import '../../../shared/widgets/transaction_filter_bar.dart';
import '../../purchases/data/purchase_repository.dart';
import '../data/fixed_expense.dart';
import '../data/fixed_expense_repository.dart';

class FixedExpensesPage extends ConsumerStatefulWidget {
  const FixedExpensesPage({super.key});

  @override
  ConsumerState<FixedExpensesPage> createState() => _FixedExpensesPageState();
}

class _FixedExpensesPageState extends ConsumerState<FixedExpensesPage> {
  String _searchText = '';
  String? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).asData?.value.user;
    final isFree = user?.isPremium == false;
    final expenses = ref.watch(fixedExpensesProvider);
    final categories = ref
        .watch(purchaseCategoriesProvider)
        .maybeWhen(data: (items) => items, orElse: () => const <String>[]);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Despesas fixas'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: isFree
          ? const PremiumFeatureGate(
              title: 'Despesas fixas são Premium',
              message:
                  'Assine o Premium para parcelar despesas recorrentes e acompanhar pagamentos da família.',
            )
          : expenses.when(
              data: (page) {
                if (page.content.isEmpty) {
                  return const ShEmptyState(
                    message: 'Nenhuma despesa fixa encontrada.',
                    icon: Icons.receipt_long_outlined,
                  );
                }

                final filtered = page.content.where(_matchesFilters).toList();

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(fixedExpensesProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: filtered.length + 2,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return TransactionFilterBar(
                          searchText: _searchText,
                          selectedCategory: _selectedCategory,
                          categories: categories,
                          onSearchChanged: (value) {
                            setState(() {
                              _searchText = value;
                            });
                          },
                          onCategoryChanged: (value) {
                            setState(() {
                              _selectedCategory = value;
                            });
                          },
                          onClear: () {
                            setState(() {
                              _searchText = '';
                              _selectedCategory = null;
                            });
                          },
                        );
                      }

                      if (index == 1) {
                        return _FixedExpensesHeader(
                          visibleElements: filtered.length,
                          totalElements: page.totalElements,
                        );
                      }

                      return _FixedExpenseTile(expense: filtered[index - 2]);
                    },
                  ),
                );
              },
              error: (error, stackTrace) => ShErrorState(
                message: error.toString(),
                onRetry: () => ref.invalidate(fixedExpensesProvider),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
      floatingActionButton: isFree
          ? null
          : FloatingActionButton.extended(
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
          if (index == 3) {
            context.go('/financial-summary');
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

  bool _matchesFilters(FixedExpense expense) {
    final query = _searchText.trim().toLowerCase();
    final matchesSearch =
        query.isEmpty ||
        expense.title.toLowerCase().contains(query) ||
        expense.category.toLowerCase().contains(query) ||
        CategoryFormatter.label(expense.category).toLowerCase().contains(query);
    final matchesCategory =
        _selectedCategory == null || expense.category == _selectedCategory;

    return matchesSearch && matchesCategory;
  }
}

class _FixedExpensesHeader extends StatelessWidget {
  const _FixedExpensesHeader({
    required this.visibleElements,
    required this.totalElements,
  });

  final int visibleElements;
  final int totalElements;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        visibleElements == totalElements
            ? '$totalElements despesas encontradas'
            : '$visibleElements de $totalElements despesas',
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
            if (expense.category.isNotEmpty)
              CategoryFormatter.label(expense.category),
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
