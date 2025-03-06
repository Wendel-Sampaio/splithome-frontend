import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { Login } from './login';
import { Usuario } from './usuario';
import { Register } from './register';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http = inject(HttpClient);
  API = "http://localhost:8080/api/user/auth";


  constructor() { }


  logar(login: Login): Observable<string> {
    return this.http.post<string>(this.API+"/login", login, {responseType: 'text' as 'json'});
  }

  cadastrar(register: Register): Observable<string> {
    return this.http.post<string>(this.API+"/register", register, {responseType: 'text' as 'json'})
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

}
