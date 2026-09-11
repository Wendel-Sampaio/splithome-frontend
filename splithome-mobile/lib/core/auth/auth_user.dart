class AuthUser {
  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.plan,
    this.familyCode,
  });

  final String id;
  final String name;
  final String email;
  final String plan;
  final String? familyCode;

  bool get isPremium => plan == 'PREMIUM';
}
