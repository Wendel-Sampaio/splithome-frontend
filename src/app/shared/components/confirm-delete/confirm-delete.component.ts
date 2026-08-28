import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';

export type ConfirmDeleteDialogData = {
  itemType: string;
  title: string;
  valueLabel: string;
};

@Component({
  selector: 'app-confirm-delete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogClose,
    MatIconModule,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
  ],
  templateUrl: './confirm-delete.component.html',
})
export class ConfirmDeleteComponent {
  readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
}
