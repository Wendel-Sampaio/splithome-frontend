import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http = inject(HttpClient);

  API = "http://localhost:8080/api/users";

  constructor() { }

  saveUser(user: User): Observable<User>{
    return this.http.post<User>(this.API+"new-user", {responseType: 'json'});
  }
}
