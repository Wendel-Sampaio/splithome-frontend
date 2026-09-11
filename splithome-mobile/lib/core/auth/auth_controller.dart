import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/data/auth_repository.dart';
import 'auth_session.dart';

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSession>(AuthController.new);

class AuthController extends AsyncNotifier<AuthSession> {
  @override
  Future<AuthSession> build() {
    return ref.read(authRepositoryProvider).restoreSession();
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() {
      return ref
          .read(authRepositoryProvider)
          .login(email: email, password: password);
    });
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(AuthSession.unauthenticated());
  }
}
