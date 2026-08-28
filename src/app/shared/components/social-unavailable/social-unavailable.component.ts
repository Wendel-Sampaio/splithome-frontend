import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';
import { SummaryBlockComponent } from '../ui/summary-block/summary-block.component';

export type SocialProvider = 'google' | 'facebook';

export interface SocialUnavailableData {
  provider: SocialProvider;
}

const PROVIDER_LABELS: Record<SocialProvider, string> = {
  google: 'Google',
  facebook: 'Facebook'
};

@Component({
  selector: 'app-social-unavailable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogClose,
    MatIconModule,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
    SummaryBlockComponent,
  ],
  templateUrl: './social-unavailable.component.html',
})
export class SocialUnavailableComponent {
  private readonly dialogRef = inject(MatDialogRef<SocialUnavailableComponent>);
  private readonly router = inject(Router);
  readonly data = inject<SocialUnavailableData>(MAT_DIALOG_DATA);

  get providerName(): string {
    return PROVIDER_LABELS[this.data.provider];
  }

  goToRegister(): void {
    this.dialogRef.close();
    this.router.navigate(['/cadastro']);
  }
}
