import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../core/auth/user.service';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { PasswordInput } from '../../shared/components/password-input/password-input.component';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Register } from '../../core/auth/register';

@Component({
  selector: 'app-cadastro',
  imports: [MatCardModule, MatButtonModule, PasswordInput, MatIcon, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})
export class CadastroComponent {

  name!: string;
  email!: string;
  password!: string;
  repeatPassword!: string;

  router = inject(Router);
  userService = inject(UserService);
  hide1 = signal(true);
  hide2 = signal(true);

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  clickEventRepeatPassword(event: MouseEvent) {
    this.hide2.set(!this.hide2());
    event.stopPropagation();
  }

  registrar() {
    if (this.password != this.repeatPassword) {
      alert("As senhas não coincidem!")
    } else {
      const register: Register = new Register(this.name, this.email, this.password);
      this.userService.cadastrar(register).subscribe({
        next: string => {
          alert("Usuário cadastrado com sucesso!")
        }, error: erro => {
          alert("Algo saiu errado!")
        }
      })
    }
  }

}
