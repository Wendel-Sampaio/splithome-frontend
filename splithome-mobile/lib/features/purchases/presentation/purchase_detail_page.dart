import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/category_formatter.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/detail_row.dart';
import '../../home/data/home_repository.dart';
import '../data/purchase.dart';
import '../data/purchase_repository.dart';

class PurchaseDetailPage extends ConsumerWidget {
  const PurchaseDetailPage({required this.purchase, super.key});

  final Purchase purchase;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhe da compra'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
        actions: [
          PopupMenuButton<_PurchaseAction>(
            onSelected: (action) {
              switch (action) {
                case _PurchaseAction.edit:
                  context.push('/purchases/edit', extra: purchase);
                case _PurchaseAction.delete:
                  _confirmDelete(context, ref);
              }
            },
            itemBuilder: (context) => const [
              PopupMenuItem(value: _PurchaseAction.edit, child: Text('Editar')),
              PopupMenuItem(
                value: _PurchaseAction.delete,
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
                        backgroundColor: scheme.primaryContainer,
                        foregroundColor: scheme.onPrimaryContainer,
                        child: const Icon(Icons.shopping_cart_outlined),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              purchase.title.isEmpty
                                  ? 'Compra sem título'
                                  : purchase.title,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            Text(
                              CurrencyFormatter.brl(purchase.value),
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(color: scheme.primary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DetailRow(
                    label: 'Categoria',
                    value: CategoryFormatter.label(purchase.category),
                  ),
                  DetailRow(
                    label: 'Data da compra',
                    value: purchase.purchaseDate ?? '',
                  ),
                  DetailRow(
                    label: 'Pagamento',
                    value: purchase.paymentDate ?? '',
                  ),
                  DetailRow(
                    label: 'Comprador',
                    value: purchase.purchaserName ?? purchase.purchaserId ?? '',
                  ),
                  DetailRow(
                    label: 'Status',
                    value: purchase.isPaid ? 'Pago' : 'Pendente',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _PeopleCard(
            title: 'Pagadores',
            emptyText: 'Sem pagadores vinculados.',
            people: purchase.payers,
          ),
          const SizedBox(height: 12),
          _PeopleCard(
            title: 'Pendências',
            emptyText: 'Nenhuma pendência.',
            people: purchase.remainingPayers,
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Excluir compra?'),
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

    if (confirmed != true || !context.mounted) {
      return;
    }

    try {
      await ref.read(purchaseRepositoryProvider).deletePurchase(purchase.id);
      ref.invalidate(purchasesProvider);
      ref.invalidate(homeSummaryProvider);

      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Compra excluída com sucesso.')),
      );
      context.go('/purchases');
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }
}

enum _PurchaseAction { edit, delete }

class _PeopleCard extends StatelessWidget {
  const _PeopleCard({
    required this.title,
    required this.emptyText,
    required this.people,
  });

  final String title;
  final String emptyText;
  final List<String> people;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            if (people.isEmpty)
              Text(emptyText)
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: people
                    .map((person) => Chip(label: Text(person)))
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}
