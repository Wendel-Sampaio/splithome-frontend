import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../shared/formatters/currency_formatter.dart';
import '../data/home_repository.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider).asData?.value;
    final summary = ref.watch(homeSummaryProvider);
    final user = session?.user;
    final scheme = Theme.of(context).colorScheme;
    final displayName = user?.name.isNotEmpty == true
        ? user!.name
        : 'usuário SplitHome';

    return Scaffold(
      appBar: AppBar(
        title: const Text('SplitHome'),
        actions: [
          IconButton(
            tooltip: 'Sair',
            onPressed: () {
              ref.read(authControllerProvider.notifier).logout();
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Olá, $displayName',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            user?.familyCode == null
                ? 'Sua sessão mobile já está conectada ao backend.'
                : 'Família ${user!.familyCode}',
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: scheme.onSurfaceVariant),
          ),
          const SizedBox(height: 20),
          summary.when(
            data: (data) => _SummaryGrid(
              cards: [
                _SummaryCardData(
                  icon: Icons.payments_outlined,
                  label: 'Total registrado',
                  value: CurrencyFormatter.brl(data.grandTotal),
                  color: scheme.primary,
                ),
                _SummaryCardData(
                  icon: Icons.calendar_month_outlined,
                  label: 'Mês atual',
                  value: CurrencyFormatter.brl(data.currentMonthTotal),
                  color: scheme.secondary,
                ),
                _SummaryCardData(
                  icon: Icons.category_outlined,
                  label: 'Maior categoria',
                  value: data.topCategory?.label ?? '-',
                  color: scheme.tertiary,
                ),
                _SummaryCardData(
                  icon: user?.isPremium == true
                      ? Icons.workspace_premium_outlined
                      : Icons.person_outline,
                  label: 'Plano',
                  value: user?.plan ?? 'FREE',
                  color: scheme.error,
                ),
              ],
            ),
            error: (error, stackTrace) => _ErrorCard(
              message: error.toString(),
              onRetry: () => ref.invalidate(homeSummaryProvider),
            ),
            loading: () => const _LoadingSummaryGrid(),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Próximo passo',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    summary.hasValue
                        ? 'A Home já está lendo o resumo real da API. O próximo marco é listar compras recentes.'
                        : 'Quando a API responder, os cards acima mostram os dados reais do seu SplitHome.',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
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

class _LoadingSummaryGrid extends StatelessWidget {
  const _LoadingSummaryGrid();

  @override
  Widget build(BuildContext context) {
    return const _SummaryGrid(
      cards: [
        _SummaryCardData(
          icon: Icons.payments_outlined,
          label: 'Total registrado',
          value: 'Carregando',
          color: Colors.grey,
        ),
        _SummaryCardData(
          icon: Icons.calendar_month_outlined,
          label: 'Mês atual',
          value: 'Carregando',
          color: Colors.grey,
        ),
        _SummaryCardData(
          icon: Icons.category_outlined,
          label: 'Maior categoria',
          value: 'Carregando',
          color: Colors.grey,
        ),
        _SummaryCardData(
          icon: Icons.person_outline,
          label: 'Plano',
          value: 'Carregando',
          color: Colors.grey,
        ),
      ],
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Resumo indisponível',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(message),
            const SizedBox(height: 12),
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

class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.cards});

  final List<_SummaryCardData> cards;

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
        childAspectRatio: 1.38,
      ),
      itemBuilder: (context, index) {
        return _SummaryCard(data: cards[index]);
      },
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.data});

  final _SummaryCardData data;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(data.icon, color: data.color),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  data.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCardData {
  const _SummaryCardData({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
}
