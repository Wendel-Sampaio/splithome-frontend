import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-optional-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sh-optional-pill">Opcional</span>`,
  styles: `
    .sh-optional-pill {
      align-items: center;
      background: var(--sh-color-bg-strong);
      border: 1px solid var(--sh-color-border);
      border-radius: 999px;
      color: var(--sh-color-text-muted);
      display: inline-flex;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      line-height: 1;
      padding: 3px 8px;
      text-transform: uppercase;
    }
  `,
})
export class OptionalPillComponent {}
