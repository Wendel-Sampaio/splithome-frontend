import 'package:flutter/material.dart';

import '../../core/theme/app_tokens.dart';

class ShSectionCard extends StatelessWidget {
  const ShSectionCard({
    required this.children,
    this.title,
    this.padding = ShInsets.card,
    super.key,
  });

  final String? title;
  final EdgeInsetsGeometry padding;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null) ...[
              Text(
                title!,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: ShSpacing.xs),
            ],
            ...children,
          ],
        ),
      ),
    );
  }
}
