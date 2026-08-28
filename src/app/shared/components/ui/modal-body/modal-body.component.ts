import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogContent } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogContent],
  template: `<mat-dialog-content class="sh-modal-body"><ng-content /></mat-dialog-content>`,
  styles: `
    :host { display: block; }
    .sh-modal-body { padding: var(--sh-modal-body-padding, var(--sh-space-2) var(--sh-space-6) var(--sh-space-6)); }
  `,
})
export class ModalBodyComponent {}
