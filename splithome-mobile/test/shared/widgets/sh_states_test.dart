import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/shared/widgets/sh_empty_state.dart';
import 'package:splithome_mobile/shared/widgets/sh_error_state.dart';
import 'package:splithome_mobile/shared/widgets/sh_person_chip.dart';
import 'package:splithome_mobile/shared/widgets/sh_section_card.dart';

void main() {
  testWidgets('renders shared empty and error states', (tester) async {
    var retried = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Column(
          children: [
            const ShEmptyState(message: 'Nada por aqui.'),
            ShErrorState(
              message: 'Falhou.',
              onRetry: () {
                retried = true;
              },
            ),
          ],
        ),
      ),
    );

    expect(find.text('Nada por aqui.'), findsOneWidget);
    expect(find.text('Falhou.'), findsOneWidget);

    await tester.tap(find.text('Tentar novamente'));

    expect(retried, isTrue);
  });

  testWidgets('renders section card and person chip', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ShSectionCard(
          title: 'Pagadores',
          children: [ShPersonChip(name: 'Ana')],
        ),
      ),
    );

    expect(find.text('Pagadores'), findsOneWidget);
    expect(find.text('Ana'), findsOneWidget);
    expect(find.text('A'), findsOneWidget);
  });
}
