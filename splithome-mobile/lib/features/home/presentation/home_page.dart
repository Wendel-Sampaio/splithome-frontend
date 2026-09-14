import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../shared/formatters/category_formatter.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/brand_mark.dart';
import '../../fixed_expenses/data/fixed_expense.dart';
import '../../fixed_expenses/data/fixed_expense_page.dart';
import '../../fixed_expenses/data/fixed_expense_repository.dart';
import '../../purchases/data/purchase.dart';
import '../../purchases/data/purchase_page.dart';
import '../../purchases/data/purchase_repository.dart';
import '../data/financial_summary.dart';
import '../data/financial_summary_repository.dart';
import '../data/home_repository.dart';
import '../data/home_summary.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).asData?.value;
    final user = session?.user;
    final summary = ref.watch(homeSummaryProvider);
    final purchases = ref.watch(purchasesProvider);
    final fixedExpenses = ref.watch(fixedExpensesProvider);
    final financialSummary = user?.isPremium == true
        ? ref.watch(financialSummaryProvider)
        : const AsyncValue.data(FinancialSummary.empty());
    final displayName = user?.name.isNotEmpty == true
        ? user!.name.split(' ').first
        : 'por aí';

    return Scaffold(
      appBar: AppBar(
        title: const BrandMark(logoSize: 34),
        actions: [
          IconButton(
            tooltip: 'Meu perfil',
            onPressed: () => context.go('/profile'),
            icon: const Icon(Icons.account_circle_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(homeSummaryProvider);
          ref.invalidate(purchasesProvider);
          ref.invalidate(fixedExpensesProvider);
          if (user?.isPremium == true) {
            ref.invalidate(financialSummaryProvider);
          }
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            _HeroPanel(name: displayName),
            const SizedBox(height: 16),
            _KpiSection(
              summary: summary,
              purchases: purchases,
              financialSummary: financialSummary,
              isPremium: user?.isPremium == true,
            ),
            const SizedBox(height: 16),
            _MonthlyChart(summary: summary),
            const SizedBox(height: 16),
            _RecentActivitySection(
              purchases: purchases,
              fixedExpenses: fixedExpenses,
            ),
            const SizedBox(height: 16),
            _ShortcutGrid(
              totalPurchases: purchases.valueOrNull?.totalElements ?? 0,
              currentMonthTotal: summary.valueOrNull?.currentMonthTotal ?? 0,
              totalOutstanding:
                  financialSummary.valueOrNull?.totalOutstanding ?? 0,
              topCategory: summary.valueOrNull?.topCategory?.label ?? '-',
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        onDestinationSelected: (index) {
          if (index == 1) {
            context.go('/purchases');
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
            selectedIcon: Icon(Icons.home),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
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

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: scheme.outlineVariant),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            scheme.primaryContainer.withValues(alpha: 0.55),
            scheme.surfaceContainerLowest,
          ],
        ),
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Visão geral',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: scheme.primary,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Olá, $name. Bora organizar a casa?',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Text(
            'Registre gastos, acompanhe saldos e mantenha tudo alinhado em um só lugar.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => context.go('/purchases/new'),
                  icon: const Icon(Icons.add_shopping_cart),
                  label: const Text('Compra'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.go('/fixed-expenses/new'),
                  icon: const Icon(Icons.add_card_outlined),
                  label: const Text('Despesa'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _KpiSection extends StatelessWidget {
  const _KpiSection({
    required this.summary,
    required this.purchases,
    required this.financialSummary,
    required this.isPremium,
  });

  final AsyncValue<HomeSummary> summary;
  final AsyncValue<PurchasePage<Purchase>> purchases;
  final AsyncValue<FinancialSummary> financialSummary;
  final bool isPremium;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final data = summary.valueOrNull;
    final purchasePage = purchases.valueOrNull;
    final financial = financialSummary.valueOrNull;

    if (summary.isLoading ||
        purchases.isLoading ||
        financialSummary.isLoading) {
      return const _KpiGrid(
        cards: [
          _KpiCardData(
            Icons.account_balance_wallet_outlined,
            'Em aberto',
            '...',
          ),
          _KpiCardData(Icons.payments_outlined, 'Despesas do mês', '...'),
          _KpiCardData(Icons.shopping_cart_outlined, 'Compras', '...'),
          _KpiCardData(Icons.category_outlined, 'Maior categoria', '...'),
        ],
      );
    }

    return _KpiGrid(
      cards: [
        _KpiCardData(
          Icons.account_balance_wallet_outlined,
          'Em aberto',
          isPremium
              ? CurrencyFormatter.brl(financial?.totalOutstanding ?? 0)
              : 'Premium',
          color: scheme.tertiary,
        ),
        _KpiCardData(
          Icons.payments_outlined,
          'Despesas do mês',
          CurrencyFormatter.brl(data?.currentMonthTotal ?? 0),
          color: scheme.primary,
        ),
        _KpiCardData(
          Icons.shopping_cart_outlined,
          'Compras',
          '${purchasePage?.totalElements ?? 0}',
          color: scheme.secondary,
        ),
        _KpiCardData(
          Icons.category_outlined,
          'Maior categoria',
          _friendlyCategory(data?.topCategory?.label),
          color: scheme.error,
        ),
      ],
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.cards});

  final List<_KpiCardData> cards;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      itemCount: cards.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.18,
      ),
      itemBuilder: (context, index) => _KpiCard(data: cards[index]),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.data});

  final _KpiCardData data;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = data.color ?? scheme.primary;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              height: 38,
              width: 38,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(data.icon, color: color, size: 21),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  data.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MonthlyChart extends StatelessWidget {
  const _MonthlyChart({required this.summary});

  final AsyncValue<HomeSummary> summary;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionHeader(
              title: 'Gastos por mês',
              subtitle: 'Últimos meses',
              actionLabel: 'Ver gráficos',
            ),
            const SizedBox(height: 16),
            summary.when(
              data: (data) => _Bars(items: data.months.takeLast(6).toList()),
              error: (error, stackTrace) => const _InlineState(
                icon: Icons.bar_chart_outlined,
                text: 'Não foi possível carregar os gráficos.',
              ),
              loading: () => const SizedBox(
                height: 150,
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Bars extends StatelessWidget {
  const _Bars({required this.items});

  final List<SummaryItem> items;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (items.isEmpty) {
      return const _InlineState(
        icon: Icons.bar_chart_outlined,
        text: 'Sem dados de gastos ainda.',
      );
    }

    final maxTotal = items.fold<double>(
      0,
      (max, item) => item.total > max ? item.total : max,
    );

    return SizedBox(
      height: 170,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: items.map((item) {
          final heightFactor = maxTotal <= 0 ? 0.05 : (item.total / maxTotal);
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 5),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: FractionallySizedBox(
                        heightFactor: heightFactor.clamp(0.05, 1),
                        child: Container(
                          decoration: BoxDecoration(
                            color: scheme.primary,
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _shortMonth(item.label),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _RecentActivitySection extends StatelessWidget {
  const _RecentActivitySection({
    required this.purchases,
    required this.fixedExpenses,
  });

  final AsyncValue<PurchasePage<Purchase>> purchases;
  final AsyncValue<FixedExpensePage<FixedExpense>> fixedExpenses;

  @override
  Widget build(BuildContext context) {
    final isLoading = purchases.isLoading || fixedExpenses.isLoading;
    final purchaseItems = purchases.valueOrNull?.content ?? const <Purchase>[];
    final expenseItems =
        fixedExpenses.valueOrNull?.content ?? const <FixedExpense>[];
    final activities = <_ActivityItem>[
      ...purchaseItems.map(_ActivityItem.fromPurchase),
      ...expenseItems.map(_ActivityItem.fromFixedExpense),
    ]..sort((a, b) => b.dateLabel.compareTo(a.dateLabel));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionHeader(
              title: 'Últimas atividades',
              subtitle: 'Compras e despesas recentes',
            ),
            const SizedBox(height: 10),
            if (isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (activities.isEmpty)
              const _InlineState(
                icon: Icons.inbox_outlined,
                text: 'Nenhuma atividade ainda.',
              )
            else
              ...activities.take(6).map(_ActivityTile.new),
          ],
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  const _ActivityTile(this.activity);

  final _ActivityItem activity;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = activity.isPurchase ? scheme.primary : scheme.secondary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            height: 38,
            width: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(activity.icon, color: color, size: 21),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                Text(
                  activity.subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text(
            CurrencyFormatter.brl(activity.value),
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _ShortcutGrid extends StatelessWidget {
  const _ShortcutGrid({
    required this.totalPurchases,
    required this.currentMonthTotal,
    required this.totalOutstanding,
    required this.topCategory,
  });

  final int totalPurchases;
  final double currentMonthTotal;
  final double totalOutstanding;
  final String topCategory;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.32,
      children: [
        _ShortcutCard(
          icon: Icons.shopping_cart_outlined,
          title: 'Compras',
          metric: '$totalPurchases registradas',
          onTap: () => context.go('/purchases'),
        ),
        _ShortcutCard(
          icon: Icons.receipt_long_outlined,
          title: 'Despesas',
          metric: '${CurrencyFormatter.brl(currentMonthTotal)} no mês',
          onTap: () => context.go('/fixed-expenses'),
        ),
        _ShortcutCard(
          icon: Icons.account_balance_wallet_outlined,
          title: 'Resumo',
          metric: '${CurrencyFormatter.brl(totalOutstanding)} em aberto',
          onTap: () => context.go('/financial-summary'),
        ),
        _ShortcutCard(
          icon: Icons.bar_chart_outlined,
          title: 'Gráficos',
          metric: 'Maior: $topCategory',
          onTap: () => context.go('/statistics'),
        ),
        _ShortcutCard(
          icon: Icons.groups_outlined,
          title: 'Família',
          metric: 'Membros e código',
          onTap: () => context.go('/family'),
        ),
        _ShortcutCard(
          icon: Icons.account_circle_outlined,
          title: 'Perfil',
          metric: 'Conta e plano',
          onTap: () => context.go('/profile'),
        ),
      ],
    );
  }
}

class _ShortcutCard extends StatelessWidget {
  const _ShortcutCard({
    required this.icon,
    required this.title,
    required this.metric,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String metric;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: scheme.primary),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  Text(
                    metric,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.subtitle,
    this.actionLabel,
  });

  final String title;
  final String subtitle;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              Text(
                subtitle,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
        if (actionLabel != null)
          TextButton(onPressed: () {}, child: Text(actionLabel!)),
      ],
    );
  }
}

class _InlineState extends StatelessWidget {
  const _InlineState({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Column(
          children: [
            Icon(icon, color: scheme.onSurfaceVariant),
            const SizedBox(height: 8),
            Text(text, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _KpiCardData {
  const _KpiCardData(this.icon, this.label, this.value, {this.color});

  final IconData icon;
  final String label;
  final String value;
  final Color? color;
}

class _ActivityItem {
  const _ActivityItem({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.dateLabel,
    required this.icon,
    required this.isPurchase,
  });

  factory _ActivityItem.fromPurchase(Purchase purchase) {
    return _ActivityItem(
      title: purchase.title.isEmpty ? 'Compra sem título' : purchase.title,
      subtitle:
          '${CategoryFormatter.label(purchase.category)} • ${purchase.purchaserName ?? 'compra'}',
      value: purchase.value,
      dateLabel: purchase.purchaseDate ?? '',
      icon: Icons.shopping_cart_outlined,
      isPurchase: true,
    );
  }

  factory _ActivityItem.fromFixedExpense(FixedExpense expense) {
    return _ActivityItem(
      title: expense.title.isEmpty ? 'Despesa sem título' : expense.title,
      subtitle: '${CategoryFormatter.label(expense.category)} • despesa fixa',
      value: expense.totalValue,
      dateLabel: expense.startDate ?? '',
      icon: Icons.receipt_long_outlined,
      isPurchase: false,
    );
  }

  final String title;
  final String subtitle;
  final double value;
  final String dateLabel;
  final IconData icon;
  final bool isPurchase;
}

String _shortMonth(String label) {
  if (label.length >= 7 && label.contains('-')) {
    return label.substring(5, 7);
  }
  return label;
}

String _friendlyCategory(String? category) {
  final label = CategoryFormatter.label(category);
  return label.isEmpty ? '-' : label;
}

extension _AsyncValueX<T> on AsyncValue<T> {
  T? get valueOrNull => asData?.value;
}

extension _IterableTakeLastX<T> on Iterable<T> {
  Iterable<T> takeLast(int count) {
    final list = toList();
    if (list.length <= count) {
      return list;
    }
    return list.sublist(list.length - count);
  }
}
