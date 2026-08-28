import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogClose, ModalHeaderComponent, ModalBodyComponent, ModalFooterComponent],
  templateUrl: './logout.component.html',
})
export class LogoutComponent {
  private readonly dialogRef = inject(MatDialogRef<LogoutComponent>);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly userStateService = inject(UserStateService);

  cancel(): void {
    this.dialogRef.close(false);
  }

  logout(): void {
    this.userStateService.clearCache();
    this.userService.removerToken();
    this.dialogRef.close(true);
    this.router.navigate(['/login']);
  }
}
