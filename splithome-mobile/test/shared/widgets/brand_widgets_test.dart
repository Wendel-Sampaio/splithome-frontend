import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/shared/widgets/brand_auth_header.dart';
import 'package:splithome_mobile/shared/widgets/brand_mark.dart';

void main() {
  testWidgets('renders brand mark with logo and name', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: BrandMark()));

    expect(find.byType(Image), findsOneWidget);
    expect(find.text('SplitHome'), findsOneWidget);
  });

  testWidgets('renders auth brand header with subtitle', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: BrandAuthHeader(subtitle: 'Organize os gastos da casa.'),
      ),
    );

    expect(find.byType(Image), findsOneWidget);
    expect(find.text('SplitHome'), findsOneWidget);
    expect(find.text('Organize os gastos da casa.'), findsOneWidget);
  });
}
