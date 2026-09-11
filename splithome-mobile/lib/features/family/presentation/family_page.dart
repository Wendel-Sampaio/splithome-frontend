import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../core/auth/auth_session.dart';
import '../../../core/theme/app_tokens.dart';
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
            return ListView(
              padding: ShInsets.screen,
              children: [
                FamilyOnboardingCard(
                  onCreateFamily: (name) => _createFamily(context, ref, name),
                  onJoinFamily: (code) => _joinFamily(context, ref, code),
                ),
              ],
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

  Future<void> _createFamily(
    BuildContext context,
    WidgetRef ref,
    String name,
  ) async {
    await _runFamilyAction(
      context,
      ref,
      action: () => ref.read(familyRepositoryProvider).createFamily(name),
      successMessage: 'Família criada com sucesso.',
    );
  }

  Future<void> _joinFamily(
    BuildContext context,
    WidgetRef ref,
    String code,
  ) async {
    await _runFamilyAction(
      context,
      ref,
      action: () => ref.read(familyRepositoryProvider).joinFamily(code),
      successMessage: 'Você entrou na família com sucesso.',
    );
  }

  Future<void> _runFamilyAction(
    BuildContext context,
    WidgetRef ref, {
    required Future<AuthSession> Function() action,
    required String successMessage,
  }) async {
    try {
      final session = await action();
      ref.read(authControllerProvider.notifier).setSession(session);
      ref.invalidate(myFamilyProvider);

      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(successMessage)));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }
}

class FamilyOnboardingCard extends StatefulWidget {
  const FamilyOnboardingCard({
    required this.onCreateFamily,
    required this.onJoinFamily,
    super.key,
  });

  final Future<void> Function(String name) onCreateFamily;
  final Future<void> Function(String code) onJoinFamily;

  @override
  State<FamilyOnboardingCard> createState() => _FamilyOnboardingCardState();
}

class _FamilyOnboardingCardState extends State<FamilyOnboardingCard> {
  final _familyNameController = TextEditingController();
  final _familyCodeController = TextEditingController();
  bool _isCreating = false;
  bool _isJoining = false;

  @override
  void dispose() {
    _familyNameController.dispose();
    _familyCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ShSectionCard(
      title: 'Comece sua família',
      children: [
        Text(
          'Crie uma família para compartilhar compras, despesas e pagadores da casa.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: ShSpacing.md),
        TextFormField(
          controller: _familyNameController,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(
            labelText: 'Nome da família',
            prefixIcon: Icon(Icons.home_outlined),
          ),
        ),
        const SizedBox(height: ShSpacing.sm),
        FilledButton.icon(
          onPressed: _isCreating ? null : _createFamily,
          icon: _isCreating
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.add_home_outlined),
          label: const Text('Criar família'),
        ),
        const SizedBox(height: ShSpacing.xl),
        Text(
          'Já recebeu um código?',
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: ShSpacing.sm),
        TextFormField(
          controller: _familyCodeController,
          textCapitalization: TextCapitalization.characters,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(
            labelText: 'Código da família',
            prefixIcon: Icon(Icons.key_outlined),
          ),
        ),
        const SizedBox(height: ShSpacing.sm),
        OutlinedButton.icon(
          onPressed: _isJoining ? null : _joinFamily,
          icon: _isJoining
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.login),
          label: const Text('Entrar na família'),
        ),
      ],
    );
  }

  Future<void> _createFamily() async {
    final name = _familyNameController.text.trim();
    if (name.isEmpty) {
      _showMessage('Informe o nome da família.');
      return;
    }

    setState(() {
      _isCreating = true;
    });

    try {
      await widget.onCreateFamily(name);
    } finally {
      if (mounted) {
        setState(() {
          _isCreating = false;
        });
      }
    }
  }

  Future<void> _joinFamily() async {
    final code = _familyCodeController.text.trim().toUpperCase();
    if (code.isEmpty) {
      _showMessage('Informe o código da família.');
      return;
    }

    setState(() {
      _isJoining = true;
    });

    try {
      await widget.onJoinFamily(code);
    } finally {
      if (mounted) {
        setState(() {
          _isJoining = false;
        });
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
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
