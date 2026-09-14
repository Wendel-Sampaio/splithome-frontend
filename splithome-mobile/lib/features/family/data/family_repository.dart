import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/auth/jwt_payload_parser.dart';
import '../../../core/auth/token_storage.dart';
import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';
import 'family.dart';

final familyRepositoryProvider = Provider<FamilyRepository>((ref) {
  return FamilyRepository(
    dio: ref.read(dioProvider),
    tokenStorage: ref.read(tokenStorageProvider),
    jwtPayloadParser: const JwtPayloadParser(),
  );
});

final myFamilyProvider = FutureProvider<Family>((ref) {
  return ref.read(familyRepositoryProvider).fetchMyFamily();
});

class FamilyRepository {
  const FamilyRepository({
    required this.dio,
    required this.tokenStorage,
    required this.jwtPayloadParser,
  });

  final Dio dio;
  final TokenStorage tokenStorage;
  final JwtPayloadParser jwtPayloadParser;

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

  Future<AuthSession> createFamily(String name) async {
    try {
      final response = await dio.post<Object?>(
        '/family/create',
        data: {'name': name, 'familyName': name},
      );
      return _saveSessionFromToken(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível criar sua família agora.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<AuthSession> joinFamily(String familyCode) async {
    try {
      final response = await dio.post<Object?>(
        '/family/join',
        data: {'familyCode': familyCode, 'code': familyCode},
      );
      return _saveSessionFromToken(response.data);
    } on DioException catch (error) {
      throw ApiException(
        'Não foi possível entrar na família agora.',
        statusCode: error.response?.statusCode,
      );
    }
  }

  Future<AuthSession> _saveSessionFromToken(Object? data) async {
    final token = _extractToken(data);
    if (token.isEmpty) {
      throw const ApiException('Resposta inválida ao atualizar a família.');
    }

    await tokenStorage.saveToken(token);
    return AuthSession(token: token, user: jwtPayloadParser.parseUser(token));
  }

  String _extractToken(Object? data) {
    if (data is String) {
      return data;
    }

    if (data case {'token': final Object token}) {
      return token.toString();
    }

    if (data case {'accessToken': final Object token}) {
      return token.toString();
    }

    return '';
  }
}
