import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ComprasComponent } from '../../shared/components/compras/compras.component';
import { User } from '../../core/models/user/user';
import { Router } from '@angular/router';
import { LogoutComponent } from '../../shared/components/logout/logout.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../core/auth/user/user.service';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIcon, MatButtonModule, ComprasComponent, ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  loginService = inject(UserService)
  router = inject(Router)
  user!: User;

  constructor () {
    this.user = this.loginService.getUser();
  }

  readonly dialog = inject(MatDialog);

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.dialog.open(LogoutComponent, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }

}
