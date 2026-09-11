import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/purchases/data/purchase.dart';
import 'package:splithome_mobile/features/purchases/presentation/purchase_detail_page.dart';

void main() {
  testWidgets('renders purchase details', (tester) async {
    const purchase = Purchase(
      id: 'purchase-1',
      title: 'Mercado',
      category: 'MERCADO',
      value: 120.5,
      payers: ['Ana', 'Bruno'],
      remainingPayers: ['Bruno'],
      paymentDate: '2026-09-20',
      purchaseDate: '2026-09-11',
      purchaserId: 'user-1',
      purchaserName: 'Ana',
    );

    await tester.pumpWidget(
      const MaterialApp(home: PurchaseDetailPage(purchase: purchase)),
    );

    expect(find.text('Mercado'), findsOneWidget);
    expect(find.text('MERCADO'), findsOneWidget);
    expect(find.text('Ana'), findsAtLeastNWidgets(1));
    expect(find.text('Bruno'), findsAtLeastNWidgets(1));
    expect(find.text('Pendente'), findsOneWidget);
  });
}
