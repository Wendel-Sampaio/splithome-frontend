import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../core/auth/auth_user.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../shared/widgets/detail_row.dart';
import '../../../shared/widgets/sh_section_card.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authControllerProvider);
    final user = session.asData?.value.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meu perfil'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: user == null
          ? const Center(child: Text('Sessão não encontrada.'))
          : ProfileContent(
              user: user,
              onLogout: () {
                ref.read(authControllerProvider.notifier).logout();
              },
            ),
    );
  }
}

class ProfileContent extends StatelessWidget {
  const ProfileContent({required this.user, required this.onLogout, super.key});

  final AuthUser user;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: ShInsets.screen,
      children: [
        _ProfileHeader(user: user),
        const SizedBox(height: ShSpacing.md),
        ShSectionCard(
          title: 'Dados da conta',
          children: [
            DetailRow(label: 'Nome', value: user.name),
            DetailRow(label: 'Email', value: user.email),
            DetailRow(label: 'Plano', value: _planLabel(user.plan)),
            DetailRow(
              label: 'Código da família',
              value: user.familyCode?.trim() ?? '',
            ),
          ],
        ),
        const SizedBox(height: ShSpacing.md),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(Icons.logout),
          label: const Text('Sair da conta'),
        ),
      ],
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user});

  final AuthUser user;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final initials = _initials(user.name);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(ShSpacing.lg),
        child: Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: scheme.primaryContainer,
              foregroundColor: scheme.onPrimaryContainer,
              child: Text(
                initials,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
            const SizedBox(width: ShSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name.isEmpty ? 'Usuário' : user.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: ShSpacing.xxs),
                  Text(
                    _planLabel(user.plan),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _planLabel(String plan) {
  return plan == 'PREMIUM' ? 'Premium' : 'Grátis';
}

String _initials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty);
  final letters = parts.take(2).map((part) => part[0].toUpperCase()).join();
  return letters.isEmpty ? '?' : letters;
}
