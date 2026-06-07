import { Injectable, inject } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { PlanService } from '../../plan/plan.service';
import { User } from '../../models/user/user';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private readonly userService = inject(UserService);
  private readonly planService = inject(PlanService);

  private familyUsersCache$: Observable<User[]> | null = null;
  private usersById = new Map<string, User>();

  getFamilyUsers(): Observable<User[]> {
    if (!this.planService.isPremium()) {
      this.clearCache();
      return of([]);
    }

    if (!this.familyUsersCache$) {
      this.familyUsersCache$ = this.userService.getAllUsers().pipe(
        tap((users) => this.updateUsersLookup(users)),
        catchError(() => {
          this.clearCache();
          return of([]);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.familyUsersCache$;
  }

  clearCache(): void {
    this.familyUsersCache$ = null;
    this.usersById.clear();
  }

  private updateUsersLookup(users: User[]): void {
    this.usersById = new Map(users.map((user) => [user.id, user]));
  }
}
