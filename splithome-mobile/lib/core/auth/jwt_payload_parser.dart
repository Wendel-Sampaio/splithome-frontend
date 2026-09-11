import 'dart:convert';

import 'auth_user.dart';

class JwtPayloadParser {
  const JwtPayloadParser();

  AuthUser? parseUser(String token) {
    final payload = _decodePayload(token);
    if (payload == null) {
      return null;
    }

    return AuthUser(
      id: payload['id']?.toString() ?? '',
      name: payload['name']?.toString() ?? '',
      email: payload['sub']?.toString() ?? '',
      plan: payload['plan']?.toString() == 'PREMIUM' ? 'PREMIUM' : 'FREE',
      familyCode: payload['familyCode']?.toString(),
    );
  }

  Map<String, dynamic>? _decodePayload(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      return null;
    }

    try {
      final normalized = base64Url.normalize(parts[1]);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final payload = jsonDecode(decoded);
      return payload is Map<String, dynamic> ? payload : null;
    } on FormatException {
      return null;
    }
  }
}
