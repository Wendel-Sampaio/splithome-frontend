import 'package:flutter/material.dart';

class ShPersonChip extends StatelessWidget {
  const ShPersonChip({required this.name, super.key});

  final String name;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();

    return Chip(
      avatar: CircleAvatar(
        backgroundColor: scheme.primaryContainer,
        foregroundColor: scheme.onPrimaryContainer,
        child: Text(initial),
      ),
      label: Text(name),
    );
  }
}
