import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';

@Component({
  selector: 'app-logout',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.scss'
})
export class LogoutComponent {
  readonly dialogRef = inject(MatDialogRef<LogoutComponent>);

    router = inject(Router)
    userService = inject(UserService)
    userStateService = inject(UserStateService)

    logout() {
      this.userStateService.clearCache();
      this.userService.removerToken();
      this.router.navigate(["/login"])
    } 
}
