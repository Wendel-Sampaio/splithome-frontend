import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_page.dart';
import '../../features/fixed_expenses/data/fixed_expense.dart';
import '../../features/fixed_expenses/presentation/fixed_expense_detail_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/fixed_expenses/presentation/fixed_expenses_page.dart';
import '../../features/fixed_expenses/presentation/new_fixed_expense_page.dart';
import '../../features/home/presentation/financial_summary_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/home/presentation/splash_page.dart';
import '../../features/home/presentation/statistics_page.dart';
import '../../features/purchases/presentation/new_purchase_page.dart';
import '../../features/purchases/data/purchase.dart';
import '../../features/purchases/presentation/purchase_detail_page.dart';
import '../../features/purchases/presentation/purchases_page.dart';
import '../auth/auth_controller.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/home',
    redirect: (context, state) {
      final location = state.matchedLocation;
      final isLoading = authState.isLoading;
      final isAuthPage = location == '/login' || location == '/register';
      final isSplash = location == '/splash';
      final isAuthenticated = authState.asData?.value.isAuthenticated ?? false;

      if (isLoading) {
        return isSplash ? null : '/splash';
      }

      if (!isAuthenticated && !isAuthPage) {
        return '/login';
      }

      if (isAuthenticated && (isAuthPage || isSplash)) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/home',
        pageBuilder: (context, state) {
          return const NoTransitionPage(child: HomePage());
        },
      ),
      GoRoute(
        path: '/financial-summary',
        pageBuilder: (context, state) {
          return const NoTransitionPage(child: FinancialSummaryPage());
        },
      ),
      GoRoute(
        path: '/statistics',
        pageBuilder: (context, state) {
          return const NoTransitionPage(child: StatisticsPage());
        },
      ),
      GoRoute(
        path: '/purchases',
        pageBuilder: (context, state) {
          return const NoTransitionPage(child: PurchasesPage());
        },
      ),
      GoRoute(
        path: '/purchases/new',
        builder: (context, state) => const NewPurchasePage(),
      ),
      GoRoute(
        path: '/purchases/edit',
        builder: (context, state) {
          final purchase = state.extra;
          if (purchase is Purchase) {
            return NewPurchasePage(purchase: purchase);
          }

          return const _MissingRoutePayloadPage(
            title: 'Editar compra',
            message: 'Abra a compra pela lista para editar.',
            fallbackLocation: '/purchases',
          );
        },
      ),
      GoRoute(
        path: '/purchases/detail',
        builder: (context, state) {
          final purchase = state.extra;
          if (purchase is Purchase) {
            return PurchaseDetailPage(purchase: purchase);
          }

          return const _MissingRoutePayloadPage(
            title: 'Compra',
            message: 'Abra a compra pela lista para ver os detalhes.',
            fallbackLocation: '/purchases',
          );
        },
      ),
      GoRoute(
        path: '/fixed-expenses',
        pageBuilder: (context, state) {
          return const NoTransitionPage(child: FixedExpensesPage());
        },
      ),
      GoRoute(
        path: '/fixed-expenses/new',
        builder: (context, state) => const NewFixedExpensePage(),
      ),
      GoRoute(
        path: '/fixed-expenses/edit',
        builder: (context, state) {
          final expense = state.extra;
          if (expense is FixedExpense) {
            return NewFixedExpensePage(expense: expense);
          }

          return const _MissingRoutePayloadPage(
            title: 'Editar despesa fixa',
            message: 'Abra a despesa pela lista para editar.',
            fallbackLocation: '/fixed-expenses',
          );
        },
      ),
      GoRoute(
        path: '/fixed-expenses/detail',
        builder: (context, state) {
          final expense = state.extra;
          if (expense is FixedExpense) {
            return FixedExpenseDetailPage(expense: expense);
          }

          return const _MissingRoutePayloadPage(
            title: 'Despesa fixa',
            message: 'Abra a despesa pela lista para ver os detalhes.',
            fallbackLocation: '/fixed-expenses',
          );
        },
      ),
    ],
    errorBuilder: (context, state) {
      return Scaffold(
        appBar: AppBar(title: const Text('SplitHome')),
        body: const Center(child: Text('Tela não encontrada.')),
      );
    },
  );
});

class _MissingRoutePayloadPage extends StatelessWidget {
  const _MissingRoutePayloadPage({
    required this.title,
    required this.message,
    required this.fallbackLocation,
  });

  final String title;
  final String message;
  final String fallbackLocation;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => context.go(fallbackLocation),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Voltar para lista'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
