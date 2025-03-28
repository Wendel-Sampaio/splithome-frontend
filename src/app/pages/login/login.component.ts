import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Login } from '../../core/auth/user/login';
import { UserService } from '../../core/auth/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, MatIcon, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {


  private _snackBar = inject(MatSnackBar);
  router = inject(Router);
  userService = inject(UserService);
  hide1 = signal(true);
  loginForm: FormGroup;


  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
      }
    );
  }

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  login() {
    const { email, password } = this.loginForm.value;
    const login: Login = new Login(email, password);

    if (this.loginForm.invalid){
      return;
    }

    this.userService.logar(login).subscribe({
      next: token => {
        this.userService.addToken(token);
        this.router.navigate(["/home"]);
      },
      error: erro => {
        alert("Usuário ou senha incorreto!")
      }
    })
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, '', { duration: 5000 });
  }

}
