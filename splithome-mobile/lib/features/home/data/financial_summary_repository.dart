import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';
import 'financial_summary.dart';

final financialSummaryRepositoryProvider = Provider<FinancialSummaryRepository>(
  (ref) {
    return FinancialSummaryRepository(dio: ref.read(dioProvider));
  },
);

final financialSummaryProvider = FutureProvider<FinancialSummary>((ref) {
  return ref.read(financialSummaryRepositoryProvider).fetchFinancialSummary();
});

class FinancialSummaryRepository {
  const FinancialSummaryRepository({required this.dio});

  final Dio dio;

  Future<FinancialSummary> fetchFinancialSummary() async {
    try {
      final response = await dio.get<Object?>('/stats/financial-summary');
      return FinancialSummary.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível carregar o resumo financeiro.',
        statusCode: error.response?.statusCode,
      );
    }
  }
}
