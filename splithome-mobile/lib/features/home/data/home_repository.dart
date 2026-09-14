import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';
import 'home_summary.dart';

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  return HomeRepository(dio: ref.read(dioProvider));
});

final homeSummaryProvider = FutureProvider<HomeSummary>((ref) {
  return ref.read(homeRepositoryProvider).fetchSummary();
});

class HomeRepository {
  const HomeRepository({required this.dio});

  final Dio dio;

  Future<HomeSummary> fetchSummary() async {
    try {
      final response = await dio.get<Object?>('/stats/summary');
      return HomeSummary.fromJson(response.data);
    } on DioException catch (error) {
      final status = error.response?.statusCode;
      throw ApiException(
        status == 401
            ? 'Sua sessão expirou. Entre novamente.'
            : 'Não foi possível carregar o resumo.',
        statusCode: status,
      );
    }
  }
}
