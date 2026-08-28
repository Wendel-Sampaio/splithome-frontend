import { ChangeDetectionStrategy, Component, inject, Input, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type ShModalHeaderVariant = 'default' | 'danger' | 'success';

@Component({
  selector: 'app-modal-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogTitle, MatIconModule],
  templateUrl: './modal-header.component.html',
  styleUrl: './modal-header.component.scss',
})
export class ModalHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() icon?: string;
  @Input() variant: ShModalHeaderVariant = 'default';
  @Input() showClose = true;

  private readonly dialogRef = inject<MatDialogRef<unknown> | null>(MatDialogRef, { optional: true });

  close(): void {
    this.dialogRef?.close();
  }
}
