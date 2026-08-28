import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialogActions, MatDialogClose } from '@angular/material/dialog';

export type ShModalFooterAlign = 'start' | 'end' | 'space-between';

@Component({
  selector: 'app-modal-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogActions, MatDialogClose],
  template: `
    <mat-dialog-actions
      class="sh-modal-footer"
      [class.sh-modal-footer--start]="align === 'start'"
      [class.sh-modal-footer--space-between]="align === 'space-between'"
      [align]="align === 'space-between' ? 'start' : align">
      <ng-content />
    </mat-dialog-actions>
  `,
  styles: `
    :host { display: block; }
    .sh-modal-footer {
      align-items: center;
      background: var(--sh-color-surface);
      border-top: 1px solid var(--sh-color-border);
      display: flex;
      flex-wrap: wrap;
      gap: var(--sh-space-3);
      justify-content: flex-end;
      padding: var(--sh-modal-footer-padding, var(--sh-space-4) var(--sh-space-6));
    }
    .sh-modal-footer--start { justify-content: flex-start; }
    .sh-modal-footer--space-between { justify-content: space-between; }
    @media (max-width: 480px) {
      .sh-modal-footer { flex-direction: column-reverse; align-items: stretch; }
      .sh-modal-footer ::ng-deep .mat-mdc-button-base { width: 100%; }
    }
  `,
})
export class ModalFooterComponent {
  @Input() align: ShModalFooterAlign = 'end';
}
