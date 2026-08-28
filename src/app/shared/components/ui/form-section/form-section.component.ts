import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OptionalPillComponent } from '../optional-pill/optional-pill.component';

@Component({
  selector: 'app-form-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OptionalPillComponent],
  template: `
    <section
      class="sh-form-section"
      [class.sh-form-section--grid-2]="columns === 2">
      <header class="sh-form-section__header">
        <div class="sh-form-section__title-row">
          <h3 class="sh-form-section__title">{{ title }}</h3>
          @if (optional) {
            <app-optional-pill />
          }
        </div>
        @if (description) {
          <p class="sh-form-section__description">{{ description }}</p>
        }
      </header>

      <div class="sh-form-section__content">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .sh-form-section { display: grid; gap: var(--sh-space-3); }
    .sh-form-section + .sh-form-section { margin-top: var(--sh-space-6); }
    .sh-form-section__header { display: grid; gap: 4px; }
    .sh-form-section__title-row {
      align-items: center;
      display: flex;
      gap: var(--sh-space-2);
    }
    .sh-form-section__title {
      color: var(--sh-color-text);
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.01em;
      margin: 0;
      text-transform: uppercase;
    }
    .sh-form-section__description {
      color: var(--sh-color-text-muted);
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }
    .sh-form-section__content { display: grid; gap: var(--sh-space-3); }
    .sh-form-section--grid-2 .sh-form-section__content {
      grid-template-columns: 1fr 1fr;
      gap: var(--sh-space-3) var(--sh-space-4);
    }
    @media (max-width: 480px) {
      .sh-form-section--grid-2 .sh-form-section__content { grid-template-columns: 1fr; }
    }
  `,
})
export class FormSectionComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() optional = false;
  @Input() columns: 1 | 2 = 1;
}
