import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Login } from './login';
import { Register } from './register';
import { User } from '../../models/user/user';
import { environment } from '../../../../environments/environment';

type JwtUserPayload = JwtPayload & Partial<User>;

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http = inject(HttpClient);
  API = `${environment.apiUrl}/user`;
  readonly defaultProfilePhoto = 'assets/perfil.png';
  private readonly profilePhotoStoragePrefix = 'profilePhoto:';
  private readonly profilePhotoUpdatesSubject = new BehaviorSubject<void>(undefined);
  readonly profilePhotoUpdates$ = this.profilePhotoUpdatesSubject.asObservable();


  constructor() { }

  logar(login: Login): Observable<string> {
    return this.http.post<string>(this.API+"/auth/login", login, {responseType: 'text' as 'json'});
  }

  cadastrar(register: Register): Observable<string> {
    return this.http.post<string>(this.API+"/auth/register", register, {responseType: 'text' as 'json'})
  }

  atualizarUsuario(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.API}/${id}/edit-user`, user).pipe(
      map((updatedUser) => this.normalizeUser(updatedUser))
    )
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API}/${id}`).pipe(
      map((user) => this.normalizeUser(user))
    );
  }
  
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API+"/listall").pipe(
      map((users) => users.map((user) => this.normalizeUser(user)))
    )
  }

  addToken(token: string) {
    localStorage.setItem('token', token);
  }

  removerToken() {
    localStorage.removeItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  jwtDecode() : User | null {
    const token = this.getToken();
    if (token) {
      const userFromToken = jwtDecode<JwtUserPayload>(token);

      return {
        id: userFromToken.id ?? '',
        name: userFromToken.name ?? '',
        email: userFromToken.email ?? '',
        phoneNumber: userFromToken.phoneNumber ?? '',
        pixKey: userFromToken.pixKey ?? '',
        familyCode: userFromToken.familyCode ?? '',
        plan: userFromToken.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE',
        profilePhoto: userFromToken.profilePhoto ?? this.getStoredProfilePhoto(userFromToken.id)
      } as User;
    }
    return null;
  }

  getUser() : User {
    return this.jwtDecode() ?? {
      id: '',
      name: '',
      email: '',
      phoneNumber: '',
      pixKey: '',
      familyCode: '',
      plan: 'FREE',
      profilePhoto: this.defaultProfilePhoto
    };
  }

  getProfilePhoto(user?: Partial<User> | null): string {
    return user?.profilePhoto || this.getStoredProfilePhoto(user?.id) || this.defaultProfilePhoto;
  }

  saveProfilePhoto(userId: string, profilePhoto: string): void {
    if (!userId) {
      return;
    }

    localStorage.setItem(this.getProfilePhotoStorageKey(userId), profilePhoto);
    this.profilePhotoUpdatesSubject.next();
  }

  isPremium(): boolean {
    const user = this.jwtDecode();
    return user !== null && user.plan === 'PREMIUM';
  }

  private normalizeUser(user: User): User {
    return {
      ...user,
      plan: user.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE',
      profilePhoto: user.profilePhoto || this.getStoredProfilePhoto(user.id)
    };
  }

  private getStoredProfilePhoto(userId?: string): string | undefined {
    if (!userId) {
      return undefined;
    }

    return localStorage.getItem(this.getProfilePhotoStorageKey(userId)) ?? undefined;
  }

  private getProfilePhotoStorageKey(userId: string): string {
    return `${this.profilePhotoStoragePrefix}${userId}`;
  }

}
