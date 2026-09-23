import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { UserService } from '../auth/user/user.service';
import { PlanService } from '../plan/plan.service';

export interface OnboardingTourStatus {
  onboardingTourCompletedAt: string | null;
  shouldShowOnboardingTour?: boolean;
}

export const ONBOARDING_STEPS = [
  { anchor: 'menu-inicio', title: 'Início', description: 'Aqui você acompanha um resumo geral da sua organização financeira.' },
  { anchor: 'menu-lateral', title: 'Menu lateral', description: 'Use este menu para navegar entre as principais áreas do SplitHome.' },
  { anchor: 'menu-compras', title: 'Compras', description: 'Registre compras pontuais e acompanhe quem participou de cada gasto.' },
  { anchor: 'menu-despesas-fixas', title: 'Despesas Fixas', description: 'Cadastre gastos recorrentes, como aluguel, internet, energia e assinaturas.' },
  { anchor: 'menu-graficos', title: 'Gráficos', description: 'Visualize seus gastos por categoria, período e comportamento financeiro.' },
  { anchor: 'menu-resumo-financeiro', title: 'Resumo financeiro', description: 'Veja um consolidado financeiro mais completo. Esta é uma funcionalidade premium.' },
  { anchor: 'menu-familia', title: 'Família', description: 'Crie ou entre em uma família para compartilhar despesas com outras pessoas.' },
  { anchor: 'menu-recados', title: 'Recados', description: 'Use recados para se comunicar com os membros da família. Esta é uma funcionalidade premium.' },
  { anchor: 'menu-meu-perfil', title: 'Meu perfil', description: 'Atualize seus dados pessoais e informações da sua conta.' },
  { anchor: null, title: 'Planos grátis e premium', description: 'No plano grátis, organize seus gastos pessoais. Com o premium, desbloqueie recursos para organizar as finanças em família.' }
] as const;

@Injectable({ providedIn: 'root' })
export class OnboardingTourService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly planService = inject(PlanService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly endpoint = `${environment.apiUrl}/user/me/onboarding-tour`;
  private initialized = false;
  private manuallyStarted = false;
  private readonly activeState = signal(false);
  private readonly indexState = signal(0);
  private readonly savingState = signal(false);
  private readonly errorState = signal('');

  readonly active = this.activeState.asReadonly();
  readonly index = this.indexState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly steps = ONBOARDING_STEPS;
  readonly step = computed(() => this.steps[this.index()]);
  readonly isLast = computed(() => this.index() === this.steps.length - 1);

  // The Home owns an instance: leaving it cancels pending requests and discards dismissal state.
  initialize(): void {
    if (this.initialized || !this.userService.getUser().id) return;
    this.initialized = true;
    this.http.get<OnboardingTourStatus>(this.endpoint).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: status => {
        if (this.manuallyStarted) return;
        if (status.onboardingTourCompletedAt === null || status.shouldShowOnboardingTour === true) {
          this.start();
        }
      },
      // An unavailable status must never block the Home or guess that a user is new.
      error: () => { this.initialized = false; }
    });
  }

  replay(): void {
    if (this.saving()) return;
    this.manuallyStarted = true;
    this.start();
  }

  private start(): void {
    this.indexState.set(0);
    this.errorState.set('');
    this.activeState.set(true);
  }

  next(): void {
    if (this.active() && !this.saving() && !this.isLast()) this.indexState.update(index => index + 1);
  }

  previous(): void {
    if (this.active() && !this.saving() && this.index() > 0) {
      this.errorState.set('');
      this.indexState.update(index => index - 1);
    }
  }

  dismiss(): void {
    if (!this.saving()) this.activeState.set(false);
  }

  complete(upgrade = false): void {
    if (!this.isLast()) return;
    this.finish(upgrade);
  }

  skip(): void {
    this.finish();
  }

  private finish(upgrade = false): void {
    if (!this.active() || this.saving()) return;
    this.savingState.set(true);
    this.errorState.set('');
    this.http.put<OnboardingTourStatus>(this.endpoint, {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.savingState.set(false);
        this.activeState.set(false);
        if (upgrade) this.planService.requiresPremium('family-sharing');
      },
      error: () => {
        this.savingState.set(false);
        this.errorState.set('Não foi possível salvar a conclusão. Tente novamente ou feche o tour para continuar.');
      }
    });
  }
}
