import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Router } from '@angular/router';

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
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, MatIconModule],
  templateUrl: './social-unavailable.component.html',
  styleUrl: './social-unavailable.component.scss'
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
