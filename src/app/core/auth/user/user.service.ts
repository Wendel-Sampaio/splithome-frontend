import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Login } from './login';
import { Register } from './register';
import { User } from '../../models/user/user';
import { API_URL } from '../../../../../api-url';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http = inject(HttpClient);
  API = `${API_URL}/user`;


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
    return this.http.get<User>(`${this.API}/${id}`);
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

  jwtDecode() {
    let token = this.getToken();
    if (token) {
      return jwtDecode<JwtPayload>(token);
    }
    return "";
  }

  getUser() {
    return this.jwtDecode() as User;
  }

}
