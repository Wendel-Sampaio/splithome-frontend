import { Component, inject } from '@angular/core';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-userlist',
  imports: [],
  templateUrl: './userlist.component.html',
  styleUrl: './userlist.component.scss'
})
export class UserlistComponent {

  lista: User[] = [];

  userService = inject(UserService);

  constructor() {

    this.listAll(); 

  }

  listAll(){

    this.userService.listAll().subscribe({
      next: lista => { //Sucesso
        this.lista = lista;
      },
      error: err => { //Fracasso
        alert("Ocorreu algum erro!")
      }
    });


  }

}
