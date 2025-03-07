import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ComprasComponent } from '../../shared/components/compras/compras.component';
import { UserService } from '../../core/auth/user.service';
import { User } from '../../core/models/user/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIcon, MatButtonModule, ComprasComponent],
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

  logout() {
    this.loginService.removerToken();
    this.router.navigate(["/login"])
  }

}
