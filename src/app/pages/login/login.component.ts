import { Component, inject } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { PasswordInput } from '../../shared/components/password-input/password-input.component';
import { EmailInputComponent } from '../../shared/components/email-input/email-input.component';
import { Router } from '@angular/router';
import { LoginService } from '../../core/auth/login.service';
import { Login } from '../../core/auth/login';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatButtonModule, EmailInputComponent,PasswordInput],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  email!: string;
  password!: string;

  router = inject(Router);
  loginService = inject(LoginService);

  getEmail(event: string) {
    this.email = event;
  }

  getPassword(event: string) {
    this.password = event
  }

  login() {
    const login: Login = new Login(this.email, this.password);
    this.loginService.logar(login).subscribe({
      next: token => {
        this.loginService.addToken(token);
        this.router.navigate(["/home"]);
      }, 
      error: erro => {
        alert("Usuário ou senha incorreto!")
      }
    })
  }
  
}
