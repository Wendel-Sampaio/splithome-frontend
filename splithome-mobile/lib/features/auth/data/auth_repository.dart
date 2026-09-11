import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_session.dart';
import '../../../core/auth/jwt_payload_parser.dart';
import '../../../core/auth/token_storage.dart';
import '../../../core/http/api_exception.dart';
import '../../../core/http/dio_client.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.read(dioProvider),
    tokenStorage: ref.read(tokenStorageProvider),
    jwtPayloadParser: const JwtPayloadParser(),
  );
});

class AuthRepository {
  const AuthRepository({
    required this.dio,
    required this.tokenStorage,
    required this.jwtPayloadParser,
  });

  final Dio dio;
  final TokenStorage tokenStorage;
  final JwtPayloadParser jwtPayloadParser;

  Future<AuthSession> restoreSession() async {
    final token = await tokenStorage.readToken();
    if (token == null || token.isEmpty) {
      return const AuthSession.unauthenticated();
    }

    return AuthSession(token: token, user: jwtPayloadParser.parseUser(token));
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await dio.post<Object?>(
        '/user/auth/login',
        data: {'email': email, 'password': password},
      );
      final token = _extractToken(response.data);

      if (token.isEmpty) {
        throw const ApiException('Resposta de login inválida.');
      }

      await tokenStorage.saveToken(token);
      return AuthSession(token: token, user: jwtPayloadParser.parseUser(token));
    } on DioException catch (error) {
      throw _mapDioError(error);
    }
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      await dio.post<Object?>(
        '/user/auth/register',
        data: {'name': name, 'email': email, 'password': password},
      );
    } on DioException catch (error) {
      throw _mapDioError(error);
    }
  }

  Future<void> logout() async {
    try {
      await dio.post<Object?>('/user/auth/logout');
    } on DioException {
      // Local logout must still happen when the API is unavailable.
    } finally {
      await tokenStorage.clearToken();
    }
  }

  String _extractToken(Object? responseData) {
    if (responseData case {'token': final Object token}) {
      return token.toString();
    }

    if (responseData is String) {
      return responseData;
    }

    return '';
  }

  ApiException _mapDioError(DioException error) {
    final status = error.response?.statusCode;
    final message = switch (status) {
      0 || null => 'Sem conexão. Verifique a API e tente novamente.',
      400 => 'Dados inválidos. Revise as informações.',
      401 => 'Email ou senha inválidos.',
      403 => 'Acesso negado.',
      408 || 504 => 'Tempo esgotado. Tente novamente.',
      >= 500 && <= 599 => 'Erro no servidor. Tente novamente em instantes.',
      _ => 'Não foi possível concluir a operação.',
    };

    return ApiException(message, statusCode: status);
  }
}
