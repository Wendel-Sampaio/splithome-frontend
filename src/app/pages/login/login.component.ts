import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Login } from '../../core/auth/user/login';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { CommonModule } from '@angular/common';
import { UserStateService } from '../../core/auth/user/user-state.service';
import { SocialUnavailableComponent, SocialProvider } from '../../shared/components/social-unavailable/social-unavailable.component';
import { ModalService } from '../../shared/components/ui/modal';

@Component({
  selector: 'app-login',
  imports: [
    MatIcon,
    MatProgressSpinnerModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  private modal = inject(ModalService);
  router = inject(Router);
  userService = inject(UserService);
  userStateService = inject(UserStateService);
  hide1 = signal(true);
  hideResetPassword = signal(true);
  hideResetPasswordConfirm = signal(true);
  loading = signal(false);
  resetLoading = signal(false);
  resetMode = signal(false);
  resetCodeSent = signal(false);
  loginForm: FormGroup;
  resetForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)
      ]],
      repeatPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  clickEventResetPassword(event: MouseEvent) {
    this.hideResetPassword.set(!this.hideResetPassword());
    event.stopPropagation();
  }

  clickEventResetPasswordConfirm(event: MouseEvent) {
    this.hideResetPasswordConfirm.set(!this.hideResetPasswordConfirm());
    event.stopPropagation();
  }

  openSocialUnavailable(provider: SocialProvider): void {
    this.modal.open(SocialUnavailableComponent, {
      size: 'md',
      data: { provider }
    });
  }

  isInvalid(control: string): boolean {
    const field = this.loginForm.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  isResetInvalid(control: string): boolean {
    const field = this.resetForm.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  openPasswordReset(): void {
    const email = this.loginForm.get('email')?.value;
    this.resetForm.patchValue({ email: email || '' });
    this.resetMode.set(true);
  }

  backToLogin(): void {
    this.resetMode.set(false);
    this.resetCodeSent.set(false);
    this.resetForm.reset();
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    const login: Login = new Login(email, password);
    this.loading.set(true);

    this.userService.logar(login).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: token => {
        this.userStateService.clearCache();
        this.userService.addToken(token);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.notify.error('Usuário ou senha incorreto!');
      }
    });
  }

  requestPasswordReset(): void {
    const emailControl = this.resetForm.get('email');
    emailControl?.markAsTouched();
    if (!emailControl || emailControl.invalid) {
      return;
    }

    this.resetLoading.set(true);
    this.userService.solicitarCodigoResetSenha(emailControl.value).pipe(
      finalize(() => this.resetLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.resetCodeSent.set(true);
        this.notify.success('Enviamos um código para o e-mail informado.');
      },
      error: () => this.notify.error('Não foi possível enviar o código agora.')
    });
  }

  confirmPasswordReset(): void {
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid) {
      return;
    }

    const { email, code, newPassword } = this.resetForm.value;
    this.resetLoading.set(true);
    this.userService.confirmarResetSenha(email, code, newPassword).pipe(
      finalize(() => this.resetLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Senha alterada com sucesso. Faça login com a nova senha.');
        this.loginForm.patchValue({ email, password: '' });
        this.backToLogin();
      },
      error: () => this.notify.error('Código inválido ou expirado.')
    });
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const repeatPassword = control.get('repeatPassword')?.value;
    return password && repeatPassword && password !== repeatPassword ? { passwordMismatch: true } : null;
  }
}
