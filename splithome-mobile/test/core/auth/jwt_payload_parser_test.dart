import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/core/auth/jwt_payload_parser.dart';

void main() {
  test('parses SplitHome JWT user claims', () {
    final token = _unsignedJwt({
      'sub': 'ana.teste@splithome.dev',
      'id': 'user-123',
      'name': 'Ana',
      'plan': 'PREMIUM',
      'familyCode': 'TESTHOME',
    });

    final user = const JwtPayloadParser().parseUser(token);

    expect(user?.id, 'user-123');
    expect(user?.name, 'Ana');
    expect(user?.email, 'ana.teste@splithome.dev');
    expect(user?.plan, 'PREMIUM');
    expect(user?.familyCode, 'TESTHOME');
  });

  test('returns null when token shape is invalid', () {
    final user = const JwtPayloadParser().parseUser('invalid-token');

    expect(user, isNull);
  });
}

String _unsignedJwt(Map<String, Object?> payload) {
  final header = _base64UrlJson({'alg': 'none', 'typ': 'JWT'});
  final body = _base64UrlJson(payload);
  return '$header.$body.';
}

String _base64UrlJson(Map<String, Object?> value) {
  return base64Url.encode(utf8.encode(jsonEncode(value))).replaceAll('=', '');
}
