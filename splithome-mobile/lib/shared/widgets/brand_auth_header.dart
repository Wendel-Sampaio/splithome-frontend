import 'package:flutter/material.dart';

import '../../core/brand/brand_assets.dart';
import '../../core/theme/app_tokens.dart';

class BrandAuthHeader extends StatelessWidget {
  const BrandAuthHeader({required this.subtitle, super.key});

  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Container(
          width: 156,
          height: 104,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(ShRadii.lg),
            boxShadow: [
              BoxShadow(
                color: scheme.primary.withValues(alpha: 0.18),
                blurRadius: 26,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Image.asset(BrandAssets.glowLogo, fit: BoxFit.cover),
        ),
        const SizedBox(height: ShSpacing.md),
        Text(
          'SplitHome',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: scheme.primary,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: ShSpacing.xs),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: scheme.onSurfaceVariant),
        ),
      ],
    );
  }
}
