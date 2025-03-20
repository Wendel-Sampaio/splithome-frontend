import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../core/auth/user/user.service';
import { Register } from '../../core/auth/user/register';
import { CommonModule } from '@angular/common';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    FormsModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    CommonModule,

  ],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent {

  cadastroForm: FormGroup;
  router = inject(Router);
  userService = inject(UserService);
  hide1 = signal(true);
  hide2 = signal(true);

  constructor(private fb: FormBuilder) {
    this.cadastroForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)]],
        repeatPassword: ['', [Validators.required], [this.passwordMatchValidator.bind(this)]]      }
    );
  }

  passwordMatchValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    return new Promise((resolve) => {
      const password = this.cadastroForm.get('password')?.value;
      const repeatPassword = control.value;

      if (password !== repeatPassword) {
        resolve({ passwordMismatch: true });
      } else {
        resolve(null);
      }
    });
  }

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  clickEventRepeatPassword(event: MouseEvent) {
    this.hide2.set(!this.hide2());
    event.stopPropagation();
  }

  registrar() {
    if (this.cadastroForm.invalid) {
      return;
    }

    const { name, email, password } = this.cadastroForm.value;
    const register: Register = new Register(name, email, password);
    
    this.userService.cadastrar(register).subscribe({
      next: () => {
        this.router.navigate(["/login"]);
      },
      error: (error) => {
        if (error.status === 409) {
          const errorMessage = JSON.parse(error.error)?.message;
          alert(errorMessage); 
        } else {
          alert("Tivemos um erro interno, lamentamos.");
          console.error('Erro interno', error);
        }
      }
    });
  }

}