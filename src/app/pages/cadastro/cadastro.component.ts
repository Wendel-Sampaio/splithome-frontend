import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../core/auth/user/user.service';
import { Register } from '../../core/auth/user/register';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-cadastro',
  imports: [MatCardModule, MatButtonModule, MatIcon, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})
export class CadastroComponent {

  name!: string;
  email!: string;
  password!: string;
  repeatPassword!: string;

  router = inject(Router);
  private _snackBar = inject(MatSnackBar);
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
      this.openSnackBar("As senhas não coincidem!")
    } else {
      const register: Register = new Register(this.name, this.email, this.password);
      this.userService.cadastrar(register).subscribe({
        next: string => {
          this.openSnackBar("Usuário cadastrado com sucesso!");
          this.router.navigate(["/login"])
        }, error: erro => {
          alert("Algo saiu errado!")
        }
      })
    }
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, '', { duration: 5000 });
  }
}
