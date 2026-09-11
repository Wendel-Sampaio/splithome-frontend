import 'auth_user.dart';

class AuthSession {
  const AuthSession({required this.token, required this.user});

  const AuthSession.unauthenticated() : token = null, user = null;

  final String? token;
  final AuthUser? user;

  bool get isAuthenticated => token != null && token!.isNotEmpty;
}
