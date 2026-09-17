import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/category_formatter.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/sh_empty_state.dart';
import '../../../shared/widgets/sh_error_state.dart';
import '../../../shared/widgets/transaction_filter_bar.dart';
import '../data/purchase.dart';
import '../data/purchase_repository.dart';

class PurchasesPage extends ConsumerStatefulWidget {
  const PurchasesPage({super.key});

  @override
  ConsumerState<PurchasesPage> createState() => _PurchasesPageState();
}

class _PurchasesPageState extends ConsumerState<PurchasesPage> {
  String _searchText = '';
  String? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    final purchases = ref.watch(purchasesProvider);
    final categories = ref
        .watch(purchaseCategoriesProvider)
        .maybeWhen(data: (items) => items, orElse: () => const <String>[]);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Compras'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: purchases.when(
        data: (page) {
          if (page.content.isEmpty) {
            return const ShEmptyState(
              message: 'Nenhuma compra encontrada.',
              icon: Icons.shopping_cart_outlined,
            );
          }

          final filtered = page.content.where(_matchesFilters).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(purchasesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: filtered.length + 2,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
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
                  return _PurchasesHeader(
                    visibleElements: filtered.length,
                    totalElements: page.totalElements,
                  );
                }

                return _PurchaseTile(purchase: filtered[index - 2]);
              },
            ),
          );
        },
        error: (error, stackTrace) => ShErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(purchasesProvider),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/purchases/new'),
        icon: const Icon(Icons.add),
        label: const Text('Compra'),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 1,
        onDestinationSelected: (index) {
          if (index == 0) {
            context.go('/home');
          }
          if (index == 2) {
            context.go('/fixed-expenses');
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
            selectedIcon: Icon(Icons.shopping_cart),
            label: 'Compras',
          ),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
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

  bool _matchesFilters(Purchase purchase) {
    final query = _searchText.trim().toLowerCase();
    final matchesSearch =
        query.isEmpty ||
        purchase.title.toLowerCase().contains(query) ||
        purchase.category.toLowerCase().contains(query) ||
        CategoryFormatter.label(
          purchase.category,
        ).toLowerCase().contains(query);
    final matchesCategory =
        _selectedCategory == null || purchase.category == _selectedCategory;

    return matchesSearch && matchesCategory;
  }
}

class _PurchasesHeader extends StatelessWidget {
  const _PurchasesHeader({
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
            ? '$totalElements compras encontradas'
            : '$visibleElements de $totalElements compras',
        style: Theme.of(
          context,
        ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _PurchaseTile extends StatelessWidget {
  const _PurchaseTile({required this.purchase});

  final Purchase purchase;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      child: ListTile(
        onTap: () => context.push('/purchases/detail', extra: purchase),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: scheme.primaryContainer,
          foregroundColor: scheme.onPrimaryContainer,
          child: const Icon(Icons.shopping_cart_outlined),
        ),
        title: Text(
          purchase.title.isEmpty ? 'Compra sem título' : purchase.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          [
            if (purchase.category.isNotEmpty)
              CategoryFormatter.label(purchase.category),
            if (purchase.purchaseDate != null) purchase.purchaseDate!,
          ].join(' • '),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              CurrencyFormatter.brl(purchase.valuePerPayer),
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              purchase.isPaid
                  ? 'Pago'
                  : '${purchase.remainingPayers.length} pend.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: purchase.isPaid ? scheme.primary : scheme.error,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
