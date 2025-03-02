import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http = inject(HttpClient)

  API = "http://localhost:8080/api/users"

  constructor() {}

  listAll(): Observable<User[]>{
    return this.http.get<User[]>(this.API+"/listall");
  }
}
