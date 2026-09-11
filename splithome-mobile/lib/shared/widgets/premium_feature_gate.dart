import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_tokens.dart';

class PremiumFeatureGate extends StatelessWidget {
  const PremiumFeatureGate({
    required this.title,
    required this.message,
    this.actionLabel = 'Voltar ao início',
    this.actionRoute = '/home',
    super.key,
  });

  final String title;
  final String message;
  final String actionLabel;
  final String actionRoute;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(ShSpacing.xl),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(ShSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  backgroundColor: scheme.tertiaryContainer,
                  foregroundColor: scheme.onTertiaryContainer,
                  child: const Icon(Icons.workspace_premium_outlined),
                ),
                const SizedBox(height: ShSpacing.md),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: ShSpacing.xs),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: scheme.onSurfaceVariant),
                ),
                const SizedBox(height: ShSpacing.md),
                OutlinedButton.icon(
                  onPressed: () => context.go(actionRoute),
                  icon: const Icon(Icons.arrow_back),
                  label: Text(actionLabel),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class PremiumFeatureHint extends StatelessWidget {
  const PremiumFeatureHint({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: ShInsets.card,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.workspace_premium_outlined, color: scheme.tertiary),
            const SizedBox(width: ShSpacing.sm),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: scheme.onSurfaceVariant),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
