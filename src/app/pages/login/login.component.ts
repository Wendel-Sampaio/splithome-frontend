import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Login } from '../../core/auth/user/login';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { CommonModule } from '@angular/common';
import { UserStateService } from '../../core/auth/user/user-state.service';
import { SocialUnavailableComponent, SocialProvider } from '../../shared/components/social-unavailable/social-unavailable.component';

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
  private dialog = inject(MatDialog);
  router = inject(Router);
  userService = inject(UserService);
  userStateService = inject(UserStateService);
  hide1 = signal(true);
  loading = signal(false);
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  openSocialUnavailable(provider: SocialProvider): void {
    this.dialog.open(SocialUnavailableComponent, {
      data: { provider },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      width: '440px',
      maxWidth: '95vw'
    });
  }

  isInvalid(control: string): boolean {
    const field = this.loginForm.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
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
}
