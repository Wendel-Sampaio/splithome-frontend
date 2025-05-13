import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { ComprasComponent } from '../../shared/components/compras/compras.component';
import { MeuPerfilComponent } from '../../shared/components/meu-perfil/meu-perfil.component';
import { LogoutComponent } from '../../shared/components/logout/logout.component';

import { User } from '../../core/models/user/user';
import { UserService } from '../../core/auth/user/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIcon,
    MatButtonModule,
    MatToolbarModule,
    ComprasComponent,
    MeuPerfilComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  private readonly loginService = inject(UserService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly user: User = this.loginService.getUser();

  currentView: string = 'inicio';
  currentViewTitle: string = 'Início';

  // Centralização do menu para o HTML usar *ngFor
  readonly menuItems = [
    { label: 'Início', view: 'inicio', icon: 'view_list', action: () => this.alterarView('inicio', 'Início') },
    { label: 'Compras', view: 'compras', icon: 'shopping_cart', action: () => this.alterarView('compras', 'Compras') },
    { label: 'Despesas', view: 'despesas', icon: 'payments', action: () => this.alterarView('despesas', 'Despesas') },
    { label: 'Recados', view: 'recados', icon: 'forum', action: () => this.alterarView('recados', 'Recados') },
    { label: 'Meu perfil', view: 'meuPerfil', icon: 'perm_identity', action: () => this.alterarView('meuPerfil', 'Meu perfil') },
    { label: 'Sair', view: '', icon: 'logout', action: () => this.openDialog('200ms', '200ms') }
  ];

  private alterarView(view: string, title: string): void {
    this.currentView = view;
    this.currentViewTitle = title;
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.dialog.open(LogoutComponent, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }
}
