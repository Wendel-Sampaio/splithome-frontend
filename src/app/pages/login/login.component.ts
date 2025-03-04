import { Component, inject } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { PasswordInput } from '../../shared/components/password-input/password-input.component';
import { EmailInputComponent } from '../../shared/components/email-input/email-input.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, EmailInputComponent,PasswordInput],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

  email!: string;
  password!: string;

  router = inject(Router);

  getEmail(event: string) {
    this.email = event;
  }

  getPassword(event: string) {
    this.password = event
  }

  login() {
    console.log('User Input:', this.email);
    if(this.email == "admin" && this.password == "123") {
      this.router.navigate(['cadastro']);
    } else {
      alert("Usuário ou senha incorretos!")
    }
  }
  
}
