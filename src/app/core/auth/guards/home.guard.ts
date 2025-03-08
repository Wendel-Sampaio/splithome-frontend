import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../user/user.service';

export const homeGuard: CanActivateFn = (route, state) => {

  let loginService = inject(UserService);
  let router = inject(Router);

  if (loginService.getToken() != null) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
