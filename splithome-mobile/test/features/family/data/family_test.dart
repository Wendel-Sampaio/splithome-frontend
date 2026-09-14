import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/family/data/family.dart';

void main() {
  test('parses family payload with members', () {
    final family = Family.fromJson({
      'id': 'family-1',
      'name': 'Casa Silva',
      'familyCode': 'SILVA123',
      'members': [
        {'id': 'user-1', 'name': 'Ana', 'email': 'ana@email.com'},
        {'id': 'user-2', 'name': 'Bruno', 'email': 'bruno@email.com'},
      ],
    });

    expect(family.id, 'family-1');
    expect(family.name, 'Casa Silva');
    expect(family.familyCode, 'SILVA123');
    expect(family.members.map((member) => member.name), ['Ana', 'Bruno']);
  });

  test('supports array wrapped backend response', () {
    final family = Family.fromJson([
      {
        'id': 'family-1',
        'name': 'Casa Silva',
        'familyCode': 'SILVA123',
        'members': <Object?>[],
      },
    ]);

    expect(family.name, 'Casa Silva');
  });
}
