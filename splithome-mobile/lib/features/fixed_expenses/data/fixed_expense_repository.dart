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
}
