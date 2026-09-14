import 'package:flutter/material.dart';

import '../../core/brand/brand_assets.dart';
import '../../core/theme/app_tokens.dart';

class BrandMark extends StatelessWidget {
  const BrandMark({
    this.compact = false,
    this.logoSize = 38,
    this.textColor,
    super.key,
  });

  final bool compact;
  final double logoSize;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(ShRadii.sm),
          child: Image.asset(
            BrandAssets.logo,
            width: logoSize,
            height: logoSize,
            fit: BoxFit.cover,
          ),
        ),
        if (!compact) ...[
          const SizedBox(width: ShSpacing.xs),
          Text(
            'SplitHome',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: textColor,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ],
    );
  }
}
