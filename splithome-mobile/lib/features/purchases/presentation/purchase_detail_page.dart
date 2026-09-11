import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/detail_row.dart';
import '../data/purchase.dart';

class PurchaseDetailPage extends StatelessWidget {
  const PurchaseDetailPage({required this.purchase, super.key});

  final Purchase purchase;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhe da compra'),
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
                  DetailRow(label: 'Categoria', value: purchase.category),
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
}

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
