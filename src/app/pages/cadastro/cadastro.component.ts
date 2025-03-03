import { Component, inject } from '@angular/core';
import { UserService } from '../../shared/servicos/user/user.service';
import { User } from '../../core/models/user';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-cadastro',
  imports: [],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss'
})
export class CadastroComponent {

  userService = inject(UserService)


  saveUser(user: User){
    this.userService.saveUser(user).subscribe({
      next: retorno => {
        
      }, 
      error: erro => {

      }
    }) 
  }


}
