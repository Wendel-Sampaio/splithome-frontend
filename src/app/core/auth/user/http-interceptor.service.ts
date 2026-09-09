import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { UserService } from './user.service';

export const meuhttpInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const userService = inject(UserService);
  const notify = inject(NotificationService);

  const token = userService.getToken();
  const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  request = request.clone({ setHeaders: headers });

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const status = err.status;
        if (status === 0) {
          notify.error('Sem conexão. Verifique sua internet.');
        } else if (status === 401) {
          userService.removerToken();
          router.navigate(['/login']);
        } else if (status === 403) {
          notify.error('Acesso negado');
        } else if (status === 408 || status === 504) {
          notify.error('Tempo esgotado. Tente novamente.');
        } else if (status >= 500 && status <= 503) {
          notify.error('Erro no servidor. Tente novamente em instantes.');
        }
      }

      return throwError(() => err);
    })
  );
};
