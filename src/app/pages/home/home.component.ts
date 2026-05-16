import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UserService } from '../../core/auth/user/user.service';
import { User } from '../../core/models/user/user';
import { PlanFeature, PlanService } from '../../core/plan/plan.service';
import { ComprasComponent } from '../../shared/components/compras/compras.component';
import { DespesasComponent } from '../../shared/components/despesas/despesas.component';
import { LogoutComponent } from '../../shared/components/logout/logout.component';
import { MeuPerfilComponent } from '../../shared/components/meu-perfil/meu-perfil.component';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIcon, MatButtonModule, ComprasComponent, DespesasComponent, MeuPerfilComponent, CommonModule, MatToolbarModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  loginService = inject(UserService);
  router = inject(Router);
  planService = inject(PlanService);
  readonly dialog = inject(MatDialog);

  user!: User;
  currentView = 'inicio';
  currentViewTitle = 'In\u00edcio';

  constructor() {
    this.user = this.loginService.getUser();
  }

  get isPremium(): boolean {
    return this.planService.isPremium();
  }

  get planLabel(): string {
    return this.isPremium ? 'PREMIUM' : 'GR\u00c1TIS';
  }

  abrirInicio(): void {
    this.currentView = 'inicio';
    this.currentViewTitle = 'In\u00edcio';
  }

  abrirCompras(): void {
    this.currentView = 'compras';
    this.currentViewTitle = 'Compras';
  }

  abrirDespesas(): void {
    this.currentView = 'despesas';
    this.currentViewTitle = 'Despesas';
  }

  abrirGraficos(): void {
    this.currentView = 'graficos';
    this.currentViewTitle = 'Gr\u00e1ficos';
  }

  abrirFamilia(): void {
    if (!this.canOpenPremiumFeature('family-sharing')) {
      return;
    }

    this.currentView = 'familia';
    this.currentViewTitle = 'Fam\u00edlia';
  }

  abrirRecados(): void {
    if (!this.canOpenPremiumFeature('messages')) {
      return;
    }

    this.currentView = 'recados';
    this.currentViewTitle = 'Recados';
  }

  abrirMeuPerfil(): void {
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

  private canOpenPremiumFeature(feature: PlanFeature): boolean {
    if (this.isPremium) {
      return true;
    }

    this.planService.requiresPremium(feature);
    return false;
  }
}
