import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';
import 'fixed_expense.dart';
import 'fixed_expense_page.dart';

final fixedExpenseRepositoryProvider = Provider<FixedExpenseRepository>((ref) {
  return FixedExpenseRepository(dio: ref.read(dioProvider));
});

final fixedExpensesProvider = FutureProvider<FixedExpensePage<FixedExpense>>((
  ref,
) {
  return ref.read(fixedExpenseRepositoryProvider).fetchFixedExpenses();
});

class FixedExpenseRepository {
  const FixedExpenseRepository({required this.dio});

  final Dio dio;

  Future<FixedExpensePage<FixedExpense>> fetchFixedExpenses({
    int page = 0,
    int size = 20,
  }) async {
    try {
      final response = await dio.get<Object?>(
        '/transactions/fixed-expenses',
        queryParameters: {'page': page, 'size': size, 'sort': 'createdAt,desc'},
      );

      return FixedExpensePage.fromJson(
        response.data,
        itemBuilder: FixedExpense.fromJson,
      );
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível carregar as despesas fixas.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<FixedExpense> createFixedExpense(
    CreateFixedExpenseRequest request,
  ) async {
    try {
      final response = await dio.post<Object?>(
        '/transactions/new-fixed-expense',
        data: request.toJson(),
      );

      return FixedExpense.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível cadastrar a despesa fixa.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<FixedExpense> updateFixedExpense(
    String id,
    CreateFixedExpenseRequest request,
  ) async {
    try {
      final response = await dio.put<Object?>(
        '/transactions/update-fixed-expense/$id',
        data: request.toJson(),
      );

      return FixedExpense.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível atualizar a despesa fixa.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<void> deleteFixedExpense(String id) async {
    try {
      await dio.delete<Object?>('/transactions/delete-fixed-expense/$id');
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível excluir a despesa fixa.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<Installment> payInstallment(String id) async {
    try {
      final response = await dio.post<Object?>(
        '/transactions/installments/$id/pay',
      );

      return Installment.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível marcar a parcela como paga.',
        statusCode: error.response?.statusCode,
      );
    }
  }
}

class CreateFixedExpenseRequest {
  const CreateFixedExpenseRequest({
    required this.title,
    required this.category,
    required this.totalValue,
    required this.dueDay,
    required this.startDate,
    required this.responsibleId,
    this.installmentsCount,
    this.creditCardId,
    this.payers = const [],
    this.remainingPayers = const [],
  });

  final String title;
  final String category;
  final double totalValue;
  final int? installmentsCount;
  final int dueDay;
  final String startDate;
  final String responsibleId;
  final String? creditCardId;
  final List<String> payers;
  final List<String> remainingPayers;

  Map<String, Object?> toJson() {
    return {
      'title': title,
      'category': category,
      'totalValue': totalValue,
      'installmentsCount': installmentsCount,
      'dueDay': dueDay,
      'startDate': startDate,
      'creditCardId': creditCardId,
      'responsibleId': responsibleId,
      'payers': payers,
      'remainingPayers': remainingPayers,
    };
  }
}
