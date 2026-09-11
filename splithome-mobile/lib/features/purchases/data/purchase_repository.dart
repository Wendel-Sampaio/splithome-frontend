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

final purchaseCategoriesProvider = FutureProvider<List<String>>((ref) {
  return ref.read(purchaseRepositoryProvider).fetchCategories();
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

  Future<List<String>> fetchCategories() async {
    try {
      final response = await dio.get<Object?>('/transactions/categories');
      final data = response.data;

      if (data is! List) {
        return const [];
      }

      return data.map((item) => item.toString()).toList();
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível carregar as categorias.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<Purchase> createPurchase(CreatePurchaseRequest request) async {
    try {
      final response = await dio.post<Object?>(
        '/transactions/new-purchase',
        data: request.toJson(),
      );

      return Purchase.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível cadastrar a compra.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<Purchase> updatePurchase(UpdatePurchaseRequest request) async {
    try {
      final response = await dio.put<Object?>(
        '/transactions/update-purchase',
        data: request.toJson(),
      );

      return Purchase.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível atualizar a compra.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<void> deletePurchase(String id) async {
    try {
      await dio.delete<Object?>('/transactions/delete/$id');
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível excluir a compra.',
        statusCode: error.response?.statusCode,
      );
    }
  }
}

class CreatePurchaseRequest {
  const CreatePurchaseRequest({
    required this.title,
    required this.category,
    required this.value,
    required this.paymentDate,
    required this.purchaserId,
    required this.purchaseDate,
    this.payers = const [],
    this.remainingPayers = const [],
  });

  final String title;
  final String category;
  final double value;
  final String paymentDate;
  final String purchaserId;
  final String purchaseDate;
  final List<String> payers;
  final List<String> remainingPayers;

  Map<String, Object?> toJson() {
    return {
      'title': title,
      'category': category,
      'value': value,
      'payers': payers,
      'paymentDate': paymentDate,
      'remainingPayers': remainingPayers,
      'purchaserId': purchaserId,
      'purchaseDate': purchaseDate,
    };
  }
}

class UpdatePurchaseRequest {
  const UpdatePurchaseRequest({
    required this.id,
    required this.title,
    required this.category,
    required this.value,
    required this.paymentDate,
    required this.purchaserId,
    required this.purchaseDate,
    required this.payers,
    required this.remainingPayers,
  });

  final String id;
  final String title;
  final String category;
  final double value;
  final String paymentDate;
  final String purchaserId;
  final String purchaseDate;
  final List<String> payers;
  final List<String> remainingPayers;

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'value': value,
      'payers': payers,
      'paymentDate': paymentDate,
      'remainingPayers': remainingPayers,
      'purchaserId': purchaserId,
      'purchaseDate': purchaseDate,
    };
  }
}
