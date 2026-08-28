import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  SH_MODAL_DEFAULT_OPTIONS,
  SH_MODAL_WIDTHS,
  ShModalConfig,
  ShModalSize,
  ShModalVariant,
} from './modal.types';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly dialog = inject(MatDialog);
  private readonly defaults = inject(SH_MODAL_DEFAULT_OPTIONS);

  open<T, D = unknown, R = unknown>(
    component: ComponentType<T>,
    opts: ShModalConfig<D> = {}
  ): MatDialogRef<T, R> {
    const size: ShModalSize = opts.size ?? 'md';
    const variant: ShModalVariant = opts.variant ?? 'default';
    const merged: ShModalConfig<D> = {
      ...this.defaults,
      ...opts,
      width: opts.width ?? SH_MODAL_WIDTHS[size],
      maxWidth: opts.maxWidth ?? this.defaults.maxWidth,
      panelClass: this.buildPanelClass(opts.panelClass, size, variant),
    };
    return this.dialog.open<T, D, R>(component, merged);
  }

  private buildPanelClass(
    existing: string | string[] | undefined,
    size: ShModalSize,
    variant: ShModalVariant
  ): string[] {
    const base = ['sh-modal', `sh-modal--${size}`, `sh-modal--${variant}`];
    if (!existing) return base;
    return Array.isArray(existing) ? [...base, ...existing] : [...base, existing];
  }
}
