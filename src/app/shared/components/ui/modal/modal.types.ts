import { InjectionToken } from '@angular/core';
import { MatDialogConfig } from '@angular/material/dialog';

export type ShModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ShModalVariant = 'default' | 'danger' | 'success';

export const SH_MODAL_WIDTHS: Readonly<Record<ShModalSize, string>> = Object.freeze({
  xs: '360px',
  sm: '480px',
  md: '560px',
  lg: '720px',
  xl: '880px',
});

export interface ShModalConfig<D = unknown> extends MatDialogConfig<D> {
  size?: ShModalSize;
  variant?: ShModalVariant;
}

export const SH_MODAL_DEFAULT_OPTIONS = new InjectionToken<MatDialogConfig>('SH_MODAL_DEFAULT_OPTIONS', {
  providedIn: 'root',
  factory: () => ({
    hasBackdrop: true,
    restoreFocus: true,
    autoFocus: 'first-tabbable',
    maxWidth: 'calc(100vw - 32px)',
    enterAnimationDuration: '200ms',
    exitAnimationDuration: '150ms',
  }),
});
