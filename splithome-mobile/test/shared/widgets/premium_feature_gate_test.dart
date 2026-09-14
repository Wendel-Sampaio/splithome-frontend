import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:splithome_mobile/shared/widgets/premium_feature_gate.dart';

void main() {
  testWidgets('renders premium gate content', (tester) async {
    final router = GoRouter(
      initialLocation: '/premium',
      routes: [
        GoRoute(
          path: '/premium',
          builder: (context, state) => const PremiumFeatureGate(
            title: 'Recurso Premium',
            message: 'Assine para continuar.',
          ),
        ),
        GoRoute(path: '/home', builder: (context, state) => const Text('Home')),
      ],
    );

    await tester.pumpWidget(MaterialApp.router(routerConfig: router));

    expect(find.text('Recurso Premium'), findsOneWidget);
    expect(find.text('Assine para continuar.'), findsOneWidget);

    await tester.tap(find.text('Voltar ao início'));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
  });

  testWidgets('renders premium hint', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: PremiumFeatureHint(message: 'Pagadores são Premium.'),
      ),
    );

    expect(find.text('Pagadores são Premium.'), findsOneWidget);
  });
}
