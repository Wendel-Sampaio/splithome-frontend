import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { ComprasComponent } from '../../shared/components/compras/compras.component';
import { User } from '../../core/models/user/user';
import { Router } from '@angular/router';
import { LogoutComponent } from '../../shared/components/logout/logout.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../core/auth/user/user.service';
import { MeuPerfilComponent } from '../../shared/components/meu-perfil/meu-perfil.component';
import { CommonModule } from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIcon, MatButtonModule, ComprasComponent, MeuPerfilComponent, CommonModule, MatToolbarModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  loginService = inject(UserService)
  router = inject(Router)
  user!: User;

  currentView: string = 'inicio';
  currentViewTitle: string = 'Início'; 

  constructor () {
    this.user = this.loginService.getUser();
  }

  readonly dialog = inject(MatDialog);
  
  abrirInicio () {
    this.currentView = 'inicio';
    this.currentViewTitle = 'Início';
  }

  // Função para abrir "Compras"
  abrirCompras() {
    this.currentView = 'compras';
    this.currentViewTitle = 'Compras';
  }

  // Função para abrir "Despesas"
  abrirDespesas() {
    this.currentView = 'despesas';
    this.currentViewTitle = 'Despesas';
  }

  // Função para abrir "Recados"
  abrirRecados() {
    this.currentView = 'recados';
    this.currentViewTitle = 'Recados';
  }

  // Função para abrir "Meu Perfil"
  abrirMeuPerfil() {
    this.currentView = 'meuPerfil';
    this.currentViewTitle = 'Meu perfil';
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.dialog.open(LogoutComponent, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }

}
