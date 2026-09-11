import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';
import 'purchase.dart';
import 'purchase_page.dart';

final purchaseRepositoryProvider = Provider<PurchaseRepository>((ref) {
  return PurchaseRepository(dio: ref.read(dioProvider));
});

final purchasesProvider = FutureProvider<PurchasePage<Purchase>>((ref) {
  return ref.read(purchaseRepositoryProvider).fetchPurchases();
});

class PurchaseRepository {
  const PurchaseRepository({required this.dio});

  final Dio dio;

  Future<PurchasePage<Purchase>> fetchPurchases({
    int page = 0,
    int size = 20,
  }) async {
    try {
      final response = await dio.get<Object?>(
        '/transactions/purchases',
        queryParameters: {
          'page': page,
          'size': size,
          'sort': 'purchaseDate,desc',
        },
      );

      return PurchasePage.fromJson(
        response.data,
        itemBuilder: Purchase.fromJson,
      );
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível carregar as compras.',
        statusCode: error.response?.statusCode,
      );
    }
  }
}
