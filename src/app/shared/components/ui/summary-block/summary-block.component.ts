import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type ShSummaryVariant = 'primary' | 'success' | 'warning' | 'info';

@Component({
  selector: 'app-summary-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div
      class="sh-summary"
      [class.sh-summary--primary]="variant === 'primary'"
      [class.sh-summary--success]="variant === 'success'"
      [class.sh-summary--warning]="variant === 'warning'"
      [class.sh-summary--info]="variant === 'info'"
      role="status">
      <div class="sh-summary__title-row">
        @if (icon) {
          <mat-icon class="sh-summary__icon" aria-hidden="true">{{ icon }}</mat-icon>
        }
        <span class="sh-summary__title">{{ title }}</span>
      </div>
      <div class="sh-summary__content">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .sh-summary {
      background: var(--sh-color-primary-soft);
      border: 1px solid var(--sh-color-primary-muted);
      border-left: 3px solid var(--sh-color-primary);
      border-radius: var(--sh-radius-md);
      display: grid;
      gap: var(--sh-space-2);
      padding: var(--sh-space-4);
    }
    .sh-summary__title-row {
      align-items: center;
      color: var(--sh-color-primary-strong);
      display: flex;
      font-size: 13px;
      font-weight: 600;
      gap: var(--sh-space-2);
      letter-spacing: 0.01em;
      text-transform: uppercase;
    }
    .sh-summary__icon {
      font-size: 18px;
      height: 18px;
      line-height: 18px;
      width: 18px;
    }
    .sh-summary__content { color: var(--sh-color-text); font-size: 14px; line-height: 1.5; }
    .sh-summary--success {
      background: #e6f4ea;
      border-color: #b6dec0;
      border-left-color: var(--sh-color-success);
    }
    .sh-summary--success .sh-summary__title-row { color: var(--sh-color-success); }
    .sh-summary--warning {
      background: #fff5e6;
      border-color: #f3d9a8;
      border-left-color: var(--sh-color-warning);
    }
    .sh-summary--warning .sh-summary__title-row { color: var(--sh-color-warning); }
    .sh-summary--info {
      background: #e6f0fc;
      border-color: #b9d2f3;
      border-left-color: var(--sh-color-info);
    }
    .sh-summary--info .sh-summary__title-row { color: var(--sh-color-info); }
  `,
})
export class SummaryBlockComponent {
  @Input({ required: true }) title!: string;
  @Input() variant: ShSummaryVariant = 'primary';
  @Input() icon?: string;
}
