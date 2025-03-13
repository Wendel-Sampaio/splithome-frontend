import { Component, inject, signal } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Login } from '../../core/auth/user/login';
import { UserService } from '../../core/auth/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatIcon, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  email!: string;
  password!: string;

  private _snackBar = inject(MatSnackBar);
  router = inject(Router);
  userService = inject(UserService);
  hide1 = signal(true);

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  login() {
    const login: Login = new Login(this.email, this.password);
    this.userService.logar(login).subscribe({
      next: token => {
        this.userService.addToken(token);
        this.router.navigate(["/home"]);
      }, 
      error: erro => {
        this.openSnackBar("Usuário ou senha incorreto!")
      }
    })
  }
  
  openSnackBar(message: string) {
    this._snackBar.open(message, '', { duration: 5000 });
  }

}
