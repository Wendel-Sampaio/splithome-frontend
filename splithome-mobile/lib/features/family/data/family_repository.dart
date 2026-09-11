import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';
import 'family.dart';

final familyRepositoryProvider = Provider<FamilyRepository>((ref) {
  return FamilyRepository(dio: ref.read(dioProvider));
});

final myFamilyProvider = FutureProvider<Family>((ref) {
  return ref.read(familyRepositoryProvider).fetchMyFamily();
});

class FamilyRepository {
  const FamilyRepository({required this.dio});

  final Dio dio;

  Future<Family> fetchMyFamily() async {
    try {
      final response = await dio.get<Object?>('/family');
      return Family.fromJson(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível carregar os dados da família.',
        statusCode: error.response?.statusCode,
      );
    }
  }
}
