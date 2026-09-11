import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/core/auth/auth_user.dart';
import 'package:splithome_mobile/features/profile/presentation/profile_page.dart';

void main() {
  testWidgets('renders session profile data and logout action', (tester) async {
    var loggedOut = false;

    await tester.pumpWidget(
      MaterialApp(
        home: ProfileContent(
          user: const AuthUser(
            id: 'user-1',
            name: 'Natan Cesar',
            email: 'natan@email.com',
            plan: 'PREMIUM',
            familyCode: 'CASA123',
          ),
          onLogout: () {
            loggedOut = true;
          },
        ),
      ),
    );

    expect(find.text('Natan Cesar'), findsAtLeastNWidgets(1));
    expect(find.text('natan@email.com'), findsOneWidget);
    expect(find.text('Premium'), findsAtLeastNWidgets(1));
    expect(find.text('CASA123'), findsOneWidget);

    await tester.tap(find.text('Sair da conta'));

    expect(loggedOut, isTrue);
  });
}
