import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/currency_formatter.dart';
import '../data/purchase.dart';
import '../data/purchase_repository.dart';

class PurchasesPage extends ConsumerWidget {
  const PurchasesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final purchases = ref.watch(purchasesProvider);

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
            return const _EmptyPurchases();
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(purchasesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              itemCount: page.content.length + 1,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _PurchasesHeader(totalElements: page.totalElements);
                }

                return _PurchaseTile(purchase: page.content[index - 1]);
              },
            ),
          );
        },
        error: (error, stackTrace) => _ErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(purchasesProvider),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add),
        label: const Text('Compra'),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 1,
        onDestinationSelected: (index) {
          if (index == 0) {
            context.go('/home');
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
}

class _PurchasesHeader extends StatelessWidget {
  const _PurchasesHeader({required this.totalElements});

  final int totalElements;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        '$totalElements compras encontradas',
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
            if (purchase.category.isNotEmpty) purchase.category,
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
              CurrencyFormatter.brl(purchase.value),
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

class _EmptyPurchases extends StatelessWidget {
  const _EmptyPurchases();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text('Nenhuma compra encontrada.'),
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
