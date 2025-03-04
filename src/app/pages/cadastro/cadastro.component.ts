import { Component, inject } from '@angular/core';
import { UserService } from '../../shared/servicos/user/user.service';
import { User } from '../../core/models/user';
import {MatCardModule} from '@angular/material/card';
import { Router } from '@angular/router';
import { EmailInputComponent } from '../../shared/components/email-input/email-input.component';
import { PasswordInput } from '../../shared/components/password-input/password-input.component';

@Component({
  selector: 'app-cadastro',
  imports: [MatCardModule, EmailInputComponent,PasswordInput],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})
export class CadastroComponent {

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
