import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/family/data/family.dart';
import 'package:splithome_mobile/features/family/data/family_repository.dart';
import 'package:splithome_mobile/features/family/presentation/family_payer_selector.dart';

void main() {
  testWidgets('toggles family member payers', (tester) async {
    const family = Family(
      id: 'family-1',
      name: 'Casa Silva',
      familyCode: 'SILVA123',
      members: [
        FamilyMember(id: 'user-1', name: 'Ana', email: 'ana@email.com'),
        FamilyMember(id: 'user-2', name: 'Bruno', email: 'bruno@email.com'),
      ],
    );
    var selected = <String>[];

    await tester.pumpWidget(
      ProviderScope(
        overrides: [myFamilyProvider.overrideWith((ref) async => family)],
        child: MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return FamilyPayerSelector(
                selectedPayers: selected,
                onChanged: (payers) {
                  setState(() {
                    selected = payers;
                  });
                },
              );
            },
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ana'));
    await tester.pumpAndSettle();

    expect(selected, ['Ana']);
    expect(find.text('1 pagador selecionado.'), findsOneWidget);
  });
}
