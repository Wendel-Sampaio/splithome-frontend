import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);
  hide1 = signal(true);
  hide2 = signal(true);
  mensagemErro: string | null = null;

  constructor(private fb: FormBuilder) {
    this.cadastroForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)]],
        repeatPassword: ['', [Validators.required], [this.passwordMatchValidator.bind(this)]],
        familyCode: ['', [Validators.required, Validators.minLength(8)]],
      }
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

    const { name, email, password, familyCode } = this.cadastroForm.value;
    const register: Register = new Register(name, email, password, familyCode);
    
    this.userService.cadastrar(register).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(["/login"]);
      },
      error: (error) => {
        if (error.status === 409 || error.status === 404) {
          const errorMessage = JSON.parse(error.error)?.message;
          this.mensagemErro = errorMessage;
        } else {
          this.mensagemErro = "Tivemos um erro interno, lamentamos.";
          console.error('Erro interno', error);
        }
      }
    });
  }

}
