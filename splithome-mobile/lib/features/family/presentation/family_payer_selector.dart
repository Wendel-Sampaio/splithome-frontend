import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../shared/widgets/sh_error_state.dart';
import '../../../shared/widgets/sh_person_chip.dart';
import '../../../shared/widgets/sh_section_card.dart';
import '../data/family.dart';
import '../data/family_repository.dart';

class FamilyPayerSelector extends ConsumerWidget {
  const FamilyPayerSelector({
    required this.selectedPayers,
    required this.onChanged,
    super.key,
  });

  final List<String> selectedPayers;
  final ValueChanged<List<String>> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final family = ref.watch(myFamilyProvider);

    return family.when(
      data: (data) => _PayerPanel(
        members: data.members,
        selectedPayers: selectedPayers,
        onChanged: onChanged,
      ),
      error: (error, stackTrace) => ShSectionCard(
        title: 'Pagadores',
        children: [
          ShErrorPanel(
            message: error.toString(),
            onRetry: () => ref.invalidate(myFamilyProvider),
          ),
        ],
      ),
      loading: () => const LinearProgressIndicator(),
    );
  }
}

class _PayerPanel extends StatelessWidget {
  const _PayerPanel({
    required this.members,
    required this.selectedPayers,
    required this.onChanged,
  });

  final List<FamilyMember> members;
  final List<String> selectedPayers;
  final ValueChanged<List<String>> onChanged;

  @override
  Widget build(BuildContext context) {
    final description = selectedPayers.isEmpty
        ? 'Nenhum pagador selecionado. Você será o único responsável.'
        : selectedPayers.length == 1
        ? '1 pagador selecionado.'
        : '${selectedPayers.length} pagadores selecionados.';

    return ShSectionCard(
      title: 'Pagadores',
      children: [
        Text(
          description,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: ShSpacing.sm),
        if (members.isEmpty)
          const Text('Nenhum membro encontrado nesta família.')
        else
          Wrap(
            spacing: ShSpacing.xs,
            runSpacing: ShSpacing.xs,
            children: members.map((member) {
              final selected = selectedPayers.contains(member.name);
              return FilterChip(
                selected: selected,
                avatar: selected ? const Icon(Icons.check, size: 18) : null,
                label: Text(member.name.isEmpty ? 'Membro' : member.name),
                onSelected: (_) => _toggle(member.name),
              );
            }).toList(),
          ),
      ],
    );
  }

  void _toggle(String memberName) {
    if (memberName.isEmpty) {
      return;
    }

    final next = [...selectedPayers];
    if (next.contains(memberName)) {
      next.remove(memberName);
    } else {
      next.add(memberName);
    }
    onChanged(next);
  }
}

class FamilyMemberChipList extends StatelessWidget {
  const FamilyMemberChipList({required this.members, super.key});

  final List<FamilyMember> members;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: ShSpacing.xs,
      runSpacing: ShSpacing.xs,
      children: members
          .map(
            (member) => ShPersonChip(
              name: member.name.isEmpty ? 'Membro' : member.name,
            ),
          )
          .toList(),
    );
  }
}
