import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { UserService } from '../../core/auth/user/user.service';
import { Register } from '../../core/auth/user/register';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { CommonModule } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    CommonModule,
  ],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent {
  cadastroForm: FormGroup;
  router = inject(Router);
  userService = inject(UserService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  hide1 = signal(true);
  hide2 = signal(true);
  loading = signal(false);

  constructor(private fb: FormBuilder) {
    this.cadastroForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)]],
      repeatPassword: ['', [Validators.required], [this.passwordMatchValidator.bind(this)]],
    });
  }

  passwordMatchValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    return new Promise((resolve) => {
      const password = this.cadastroForm.get('password')?.value;
      const repeatPassword = control.value;
      resolve(password !== repeatPassword ? { passwordMismatch: true } : null);
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

  isInvalid(control: string): boolean {
    const field = this.cadastroForm.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  registrar() {
    if (this.cadastroForm.invalid) {
      return;
    }

    const { name, email, password } = this.cadastroForm.value;
    const register: Register = new Register(name, email, password);
    this.loading.set(true);

    this.userService.cadastrar(register).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Cadastro realizado com sucesso!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        if (error?.status === 409 || error?.status === 404) {
          const parsed = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
          this.notify.error(parsed?.message ?? 'Não foi possível concluir o cadastro.');
        } else {
          this.notify.error('Não foi possível concluir o cadastro.');
        }
      }
    });
  }
}
