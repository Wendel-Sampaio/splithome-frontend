import 'package:flutter/material.dart';

import '../../core/theme/app_tokens.dart';

class ShErrorState extends StatelessWidget {
  const ShErrorState({
    required this.message,
    required this.onRetry,
    this.icon = Icons.wifi_off_outlined,
    super.key,
  });

  final String message;
  final VoidCallback onRetry;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShSpacing.xl),
        child: ShErrorPanel(message: message, onRetry: onRetry, icon: icon),
      ),
    );
  }
}

class ShErrorPanel extends StatelessWidget {
  const ShErrorPanel({
    required this.message,
    required this.onRetry,
    this.icon = Icons.wifi_off_outlined,
    super.key,
  });

  final String message;
  final VoidCallback onRetry;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: ShInsets.card,
      decoration: BoxDecoration(
        color: scheme.errorContainer.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(ShRadii.md),
        border: Border.all(color: scheme.error.withValues(alpha: 0.24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: scheme.error, size: 42),
          const SizedBox(height: ShSpacing.sm),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: ShSpacing.md),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }
}
