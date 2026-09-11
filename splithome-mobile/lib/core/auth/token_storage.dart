import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return const TokenStorage();
});

class TokenStorage {
  const TokenStorage();

  static const _tokenKey = 'auth_token';
  static const _storage = FlutterSecureStorage();

  Future<String?> readToken() {
    return _storage.read(key: _tokenKey);
  }

  Future<void> saveToken(String token) {
    return _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clearToken() {
    return _storage.delete(key: _tokenKey);
  }
}
