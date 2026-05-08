import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
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


  constructor() { }

  logar(login: Login): Observable<string> {
    return this.http.post<string>(this.API+"/auth/login", login, {responseType: 'text' as 'json'});
  }

  cadastrar(register: Register): Observable<string> {
    return this.http.post<string>(this.API+"/auth/register", register, {responseType: 'text' as 'json'})
  }

  atualizarUsuario(id: string, user: User): Observable<User> {
    return this.http.put<User>(`${this.API}/${id}/edit-user`, user)
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API}/${id}`).pipe(
      map((user) => ({
        ...user,
        plan: user.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE'
      }))
    );
  }
  
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API+"/listall")
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
        plan: userFromToken.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE'
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
      plan: 'FREE'
    };
  }

  isPremium(): boolean {
    const user = this.jwtDecode();
    return user !== null && user.plan === 'PREMIUM';
  }

}
