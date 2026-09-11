import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/login_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/home/presentation/home_page.dart';
import '../../features/home/presentation/splash_page.dart';
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
        path: '/purchases',
        pageBuilder: (context, state) {
          return const NoTransitionPage(child: PurchasesPage());
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
