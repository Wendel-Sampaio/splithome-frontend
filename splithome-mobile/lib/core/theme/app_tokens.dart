import 'package:flutter/material.dart';

class ShSpacing {
  const ShSpacing._();

  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;
}

class ShRadii {
  const ShRadii._();

  static const sm = 8.0;
  static const md = 8.0;
  static const lg = 8.0;
}

class ShInsets {
  const ShInsets._();

  static const screen = EdgeInsets.fromLTRB(
    ShSpacing.md,
    ShSpacing.xs,
    ShSpacing.md,
    ShSpacing.xl,
  );
  static const card = EdgeInsets.all(ShSpacing.md);
  static const compactCard = EdgeInsets.all(ShSpacing.sm);
}
