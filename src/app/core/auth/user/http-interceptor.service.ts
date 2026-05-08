import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { UserService } from './user.service';

export const meuhttpInterceptor: HttpInterceptorFn = (request, next) => {

  const router = inject(Router);
  const userService = inject(UserService);
  const snackBar = inject(MatSnackBar);

  const token = userService.getToken();
  const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };

  if (token && !router.url.includes('/login') && !router.url.includes('/cadastro')) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  request = request.clone({ setHeaders: headers });

  return next(request).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          userService.removerToken();
          router.navigate(['/login']);
        } else if (err.status === 403) {
          snackBar.open('Acesso Negado', '', { duration: 5000 });
        } else {
          console.error('HTTP error:', err);
        }
      } else {
        console.error('An error occurred:', err);
      }

      return throwError(() => err);
    })
  );
};
