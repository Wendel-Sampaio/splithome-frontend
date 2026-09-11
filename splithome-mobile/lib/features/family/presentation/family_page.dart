import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../shared/widgets/sh_empty_state.dart';
import '../../../shared/widgets/sh_error_state.dart';
import '../../../shared/widgets/sh_section_card.dart';
import '../data/family.dart';
import '../data/family_repository.dart';

class FamilyPage extends ConsumerWidget {
  const FamilyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final family = ref.watch(myFamilyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Família'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: family.when(
        data: (data) {
          if (data.isEmpty) {
            return const ShEmptyState(
              message: 'Você ainda não está em uma família.',
              icon: Icons.groups_outlined,
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myFamilyProvider),
            child: ListView(
              padding: ShInsets.screen,
              children: [
                _FamilySummary(family: data),
                const SizedBox(height: ShSpacing.md),
                _MembersSection(members: data.members),
              ],
            ),
          );
        },
        error: (error, stackTrace) => ShErrorState(
          message: error.toString(),
          onRetry: () => ref.invalidate(myFamilyProvider),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

class _FamilySummary extends StatelessWidget {
  const _FamilySummary({required this.family});

  final Family family;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(ShSpacing.lg),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: scheme.primaryContainer,
              foregroundColor: scheme.onPrimaryContainer,
              child: const Icon(Icons.groups_outlined),
            ),
            const SizedBox(width: ShSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    family.name.isEmpty ? 'Minha família' : family.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: ShSpacing.xxs),
                  Text(
                    family.familyCode.isEmpty
                        ? 'Sem código disponível'
                        : 'Código ${family.familyCode}',
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

class _MembersSection extends StatelessWidget {
  const _MembersSection({required this.members});

  final List<FamilyMember> members;

  @override
  Widget build(BuildContext context) {
    return ShSectionCard(
      title: 'Membros',
      children: [
        if (members.isEmpty)
          const Text('Nenhum membro encontrado.')
        else
          ...members.map(
            (member) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                child: Text(
                  member.name.isEmpty ? '?' : member.name[0].toUpperCase(),
                ),
              ),
              title: Text(member.name.isEmpty ? 'Membro' : member.name),
              subtitle: member.email.isEmpty ? null : Text(member.email),
            ),
          ),
      ],
    );
  }
}
