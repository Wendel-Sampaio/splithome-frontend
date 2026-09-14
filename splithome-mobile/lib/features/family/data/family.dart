class Family {
  const Family({
    required this.id,
    required this.name,
    required this.familyCode,
    required this.members,
  });

  factory Family.fromJson(Object? json) {
    final candidate = json is List && json.isNotEmpty ? json.first : json;
    final payload = candidate is Map<String, dynamic>
        ? candidate
        : <String, dynamic>{};
    final members = payload['members'] is List
        ? payload['members'] as List
        : const [];

    return Family(
      id: payload['id']?.toString() ?? '',
      name: payload['name']?.toString() ?? '',
      familyCode: payload['familyCode']?.toString() ?? '',
      members: members.map(FamilyMember.fromJson).toList(),
    );
  }

  const Family.empty()
    : id = '',
      name = '',
      familyCode = '',
      members = const [];

  final String id;
  final String name;
  final String familyCode;
  final List<FamilyMember> members;

  bool get isEmpty => id.isEmpty && name.isEmpty && familyCode.isEmpty;
}

class FamilyMember {
  const FamilyMember({
    required this.id,
    required this.name,
    required this.email,
  });

  factory FamilyMember.fromJson(Object? json) {
    final payload = json is Map<String, dynamic> ? json : <String, dynamic>{};

    return FamilyMember(
      id: payload['id']?.toString() ?? '',
      name: payload['name']?.toString() ?? '',
      email: payload['email']?.toString() ?? '',
    );
  }

  final String id;
  final String name;
  final String email;
}
