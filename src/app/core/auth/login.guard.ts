import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './user.service';

export const loginGuard: CanActivateFn = (route, state) => {

  let loginService = inject(UserService);
  let router = inject(Router);

  if(loginService.getToken() == null) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
