import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmDeleteDialogData = {
  itemType: string;
  title: string;
  valueLabel: string;
};

@Component({
  selector: 'app-confirm-delete',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, MatIconModule],
  templateUrl: './confirm-delete.component.html',
  styleUrl: './confirm-delete.component.scss'
})
export class ConfirmDeleteComponent {
  readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
}
