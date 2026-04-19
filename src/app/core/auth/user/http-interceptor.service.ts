import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const meuhttpInterceptor: HttpInterceptorFn = (request, next) => {

  let router = inject(Router);

  let token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };
  if (token && !router.url.includes('/login') && !router.url.includes('/cadastro')) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  request = request.clone({ setHeaders: headers });

  return next(request).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse) {
	  
	  
        if (err.status === 401) {
          console.log('401 - tratar aqui');
          router.navigate(['/login']);
        } else if (err.status === 403) {
          console.log('403 - tratar aqui');
		  router.navigate(['/login']);
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
