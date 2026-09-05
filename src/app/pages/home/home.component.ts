import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DashboardInicioComponent, DashboardView } from '../../shared/components/dashboard-inicio/dashboard-inicio.component';
import { UserService } from '../../core/auth/user/user.service';
import { User } from '../../core/models/user/user';
import { PlanFeature, PlanService } from '../../core/plan/plan.service';
import { ComprasComponent } from '../../shared/components/compras/compras.component';
import { DespesasFixasComponent } from '../../shared/components/despesas-fixas/despesas-fixas.component';
import { LogoutComponent } from '../../shared/components/logout/logout.component';
import { MeuPerfilComponent } from '../../shared/components/meu-perfil/meu-perfil.component';
import { EstatisticasComponent } from '../estatisticas/estatisticas.component';
import { UserStateService } from '../../core/auth/user/user-state.service';
import { ResumoFinanceiroComponent } from '../resumo-financeiro/resumo-financeiro.component';
import { ModalService } from '../../shared/components/ui/modal';
import { FamiliaComponent } from '../familia/familia.component';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIcon, MatButtonModule, MatMenuModule, ComprasComponent, DespesasFixasComponent, MeuPerfilComponent, EstatisticasComponent, ResumoFinanceiroComponent, DashboardInicioComponent, FamiliaComponent, CommonModule, MatToolbarModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  loginService = inject(UserService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  planService = inject(PlanService);
  userStateService = inject(UserStateService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private modal = inject(ModalService);
  readonly dialog = inject(MatDialog);

  user!: User;
  currentView = 'inicio';
  currentViewTitle = 'In\u00edcio';
  isMenuCollapsed = false;

  constructor() {
    this.user = this.loginService.getUser();
    this.loginService.profilePhotoUpdates$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.user = {
        ...this.user,
        profilePhoto: this.loginService.getProfilePhoto(this.user)
      };
      this.cdr.markForCheck();
    });

    if (this.isPremium) {
      this.userStateService.getFamilyUsers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }

    if (this.route.snapshot.data['initialView'] === 'familia') {
      this.abrirFamilia();
    }
  }

  get isPremium(): boolean {
    return this.planService.isPremium();
  }

  get planLabel(): string {
    return this.isPremium ? 'PREMIUM' : 'GR\u00c1TIS';
  }

  get profilePhotoUrl(): string {
    return this.loginService.getProfilePhoto(this.user);
  }

  atualizarFotoPerfil(profilePhoto: string): void {
    this.user = {
      ...this.user,
      profilePhoto
    };
  }

  alternarMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
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
    this.currentView = 'despesasFixas';
    this.currentViewTitle = 'Despesas Fixas';
  }

  abrirGraficos(): void {
    this.currentView = 'graficos';
    this.currentViewTitle = 'Gr\u00e1ficos';
  }

  abrirResumoFinanceiro(): void {
    if (!this.canOpenPremiumFeature('financial-summary')) {
      return;
    }

    this.currentView = 'resumoFinanceiro';
    this.currentViewTitle = 'Resumo financeiro';
  }

  abrirDashboardView(view: DashboardView): void {
    switch (view) {
      case 'compras':
        this.abrirCompras();
        break;
      case 'despesas':
        this.abrirDespesas();
        break;
      case 'graficos':
        this.abrirGraficos();
        break;
      case 'resumoFinanceiro':
        this.abrirResumoFinanceiro();
        break;
    }
  }

  abrirFamilia(): void {
    this.currentView = 'familia';
    this.currentViewTitle = 'Família';
  }

  abrirRecados(): void {
    if (!this.canOpenPremiumFeature('messages')) {
      return;
    }

    this.router.navigate(['/recados']);
  }

  abrirMeuPerfil(): void {
    this.currentView = 'meuPerfil';
    this.currentViewTitle = 'Meu perfil';
  }

  openDialog(enterAnimationDuration: string, exitAnimationDuration: string): void {
    this.modal.open(LogoutComponent, {
      size: 'xs',
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
