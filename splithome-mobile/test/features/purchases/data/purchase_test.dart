import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/features/purchases/data/purchase.dart';
import 'package:splithome_mobile/features/purchases/data/purchase_page.dart';
import 'package:splithome_mobile/features/purchases/data/purchase_repository.dart';

void main() {
  test('parses purchase payload', () {
    final purchase = Purchase.fromJson({
      'id': 'purchase-1',
      'title': 'Mercado',
      'category': 'MERCADO',
      'value': 120.5,
      'payers': ['Ana', 'Bruno'],
      'remainingPayers': ['Bruno'],
      'paymentDate': '2026-09-20',
      'purchaseDate': '2026-09-10',
      'purchaserId': 'user-1',
      'purchaserName': 'Ana',
    });

    expect(purchase.id, 'purchase-1');
    expect(purchase.title, 'Mercado');
    expect(purchase.value, 120.5);
    expect(purchase.remainingPayers, ['Bruno']);
    expect(purchase.isPaid, isFalse);
  });

  test('parses Spring page payload', () {
    final page = PurchasePage.fromJson({
      'content': [
        {'id': 'purchase-1', 'title': 'Mercado', 'value': 10},
      ],
      'totalElements': 1,
      'totalPages': 1,
      'number': 0,
      'size': 20,
      'first': true,
      'last': true,
    }, itemBuilder: Purchase.fromJson);

    expect(page.content, hasLength(1));
    expect(page.totalElements, 1);
    expect(page.isFirst, isTrue);
    expect(page.isLast, isTrue);
  });

  test('serializes create purchase request for backend contract', () {
    const request = CreatePurchaseRequest(
      title: 'Mercado',
      category: 'MERCADO',
      value: 120.5,
      paymentDate: '2026-09-20',
      purchaserId: 'user-1',
      purchaseDate: '2026-09-11',
    );

    expect(request.toJson(), {
      'title': 'Mercado',
      'category': 'MERCADO',
      'value': 120.5,
      'payers': <String>[],
      'paymentDate': '2026-09-20',
      'remainingPayers': <String>[],
      'purchaserId': 'user-1',
      'purchaseDate': '2026-09-11',
    });
  });
}
