import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/family/data/family.dart';
import 'package:splithome_mobile/features/family/data/family_repository.dart';
import 'package:splithome_mobile/features/family/presentation/family_page.dart';

void main() {
  testWidgets('renders family members and code', (tester) async {
    const family = Family(
      id: 'family-1',
      name: 'Casa Silva',
      familyCode: 'SILVA123',
      members: [
        FamilyMember(id: 'user-1', name: 'Ana', email: 'ana@email.com'),
        FamilyMember(id: 'user-2', name: 'Bruno', email: 'bruno@email.com'),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [myFamilyProvider.overrideWith((ref) async => family)],
        child: const MaterialApp(home: FamilyPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Casa Silva'), findsOneWidget);
    expect(find.text('Código SILVA123'), findsOneWidget);
    expect(find.text('Membros'), findsOneWidget);
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('bruno@email.com'), findsOneWidget);
  });

  testWidgets('submits create and join family actions', (tester) async {
    final actions = <String>[];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: FamilyOnboardingCard(
            onCreateFamily: (name) async {
              actions.add('create:$name');
            },
            onJoinFamily: (code) async {
              actions.add('join:$code');
            },
          ),
        ),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, 'Casa Silva');
    await tester.tap(find.text('Criar família'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).last, 'silva123');
    await tester.tap(find.text('Entrar na família'));
    await tester.pumpAndSettle();

    expect(actions, ['create:Casa Silva', 'join:SILVA123']);
  });
}
