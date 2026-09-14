import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../../../shared/widgets/premium_feature_gate.dart';
import '../data/financial_summary.dart';
import '../data/financial_summary_repository.dart';

class FinancialSummaryPage extends ConsumerWidget {
  const FinancialSummaryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).asData?.value.user;
    final isFree = user?.isPremium == false;
    final summary = ref.watch(financialSummaryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resumo financeiro'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: isFree
          ? const PremiumFeatureGate(
              title: 'Resumo financeiro é Premium',
              message:
                  'Assine o Premium para acompanhar saldos, dívidas e sugestões de liquidação da família.',
            )
          : summary.when(
              data: (data) => RefreshIndicator(
                onRefresh: () async => ref.invalidate(financialSummaryProvider),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    _TotalOutstandingCard(total: data.totalOutstanding),
                    const SizedBox(height: 16),
                    _BalancesSection(balances: data.balances),
                    const SizedBox(height: 16),
                    _DebtsSection(
                      title: 'Quem deve para quem',
                      emptyText: 'Nenhuma dívida registrada.',
                      debts: data.debts,
                    ),
                    const SizedBox(height: 16),
                    _DebtsSection(
                      title: 'Sugestões de liquidação',
                      emptyText: 'Nada para liquidar no momento.',
                      debts: data.settlements,
                    ),
                  ],
                ),
              ),
              error: (error, stackTrace) => _ErrorState(
                message: error.toString(),
                onRetry: () => ref.invalidate(financialSummaryProvider),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 3,
        onDestinationSelected: (index) {
          if (index == 0) {
            context.go('/home');
          }
          if (index == 1) {
            context.go('/purchases');
          }
          if (index == 2) {
            context.go('/fixed-expenses');
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
            label: 'Despesas',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Resumo',
          ),
        ],
      ),
    );
  }
}

class _TotalOutstandingCard extends StatelessWidget {
  const _TotalOutstandingCard({required this.total});

  final double total;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: scheme.tertiaryContainer,
              foregroundColor: scheme.onTertiaryContainer,
              child: const Icon(Icons.account_balance_wallet_outlined),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Total em aberto',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  Text(
                    CurrencyFormatter.brl(total),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalancesSection extends StatelessWidget {
  const _BalancesSection({required this.balances});

  final List<FinancialMemberBalance> balances;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionTitle('Saldos por membro'),
            const SizedBox(height: 8),
            if (balances.isEmpty)
              const Text('Nenhum saldo encontrado.')
            else
              ...balances.map(_BalanceTile.new),
          ],
        ),
      ),
    );
  }
}

class _BalanceTile extends StatelessWidget {
  const _BalanceTile(this.balance);

  final FinancialMemberBalance balance;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final positive = balance.netBalance >= 0;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: positive
            ? scheme.primaryContainer
            : scheme.errorContainer,
        foregroundColor: positive
            ? scheme.onPrimaryContainer
            : scheme.onErrorContainer,
        child: Icon(positive ? Icons.trending_up : Icons.trending_down),
      ),
      title: Text(balance.memberName.isEmpty ? 'Membro' : balance.memberName),
      trailing: Text(
        CurrencyFormatter.brl(balance.netBalance),
        style: TextStyle(
          color: positive ? scheme.primary : scheme.error,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _DebtsSection extends StatelessWidget {
  const _DebtsSection({
    required this.title,
    required this.emptyText,
    required this.debts,
  });

  final String title;
  final String emptyText;
  final List<FinancialDebt> debts;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionTitle(title),
            const SizedBox(height: 8),
            if (debts.isEmpty) Text(emptyText) else ...debts.map(_DebtTile.new),
          ],
        ),
      ),
    );
  }
}

class _DebtTile extends StatelessWidget {
  const _DebtTile(this.debt);

  final FinancialDebt debt;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const CircleAvatar(child: Icon(Icons.arrow_forward)),
      title: Text('${debt.fromMemberName} deve para ${debt.toMemberName}'),
      trailing: Text(
        CurrencyFormatter.brl(debt.amount),
        style: const TextStyle(fontWeight: FontWeight.w900),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(
        context,
      ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
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
            const Icon(Icons.lock_outline, size: 42),
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
