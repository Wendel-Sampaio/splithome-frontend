import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../core/auth/user/user.service';
import { User } from '../../core/models/user/user';
import { Familia, FamiliaMember, FamiliaService } from '../../shared/services/familia/familia.service';

@Component({
  selector: 'app-familia',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './familia.component.html',
  styleUrl: './familia.component.scss'
})
export class FamiliaComponent implements OnInit {
  private readonly familiaService = inject(FamiliaService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  @Output() voltarInicio = new EventEmitter<void>();

  user: User = this.userService.getUser();
  family: Familia | null = null;
  familyMembers: FamiliaMember[] = [];
  codigoEntrada = '';

  carregandoFamilia = false;
  criandoFamilia = false;
  entrandoFamilia = false;
  mensagemErro = '';

  readonly premiumBenefits = [
    {
      icon: 'workspace_premium',
      title: 'Plano Premium',
      description: 'Crie sua família e compartilhe compras e despesas com todos da casa.'
    },
    {
      icon: 'groups',
      title: 'Colaboração real',
      description: 'Todos os membros acompanham as mesmas informações em tempo real.'
    },
    {
      icon: 'payments',
      title: 'Gestão financeira centralizada',
      description: 'Controle gastos domésticos em um único lugar com mais transparência.'
    }
  ];

  ngOnInit(): void {
    const codigoConvite = this.route.snapshot.queryParamMap.get('codigo');
    if (codigoConvite) {
      this.codigoEntrada = codigoConvite.trim().toUpperCase();
    }

    if (this.isPremiumWithFamily) {
      this.carregarFamilia();
    }
  }

  get isPremiumWithFamily(): boolean {
    return this.user.plan === 'PREMIUM' && !!this.user.familyCode;
  }

  get isPremium(): boolean {
    return this.user.plan === 'PREMIUM';
  }

  get podeCriarFamilia(): boolean {
    return !this.criandoFamilia && !this.entrandoFamilia;
  }

  get codigoFamilia(): string {
    return (this.family?.familyCode || this.user.familyCode || '').trim();
  }

  get totalMembros(): number {
    return this.familyMembers.length;
  }

  voltarParaHome(): void {
    this.voltarInicio.emit();
    this.router.navigate(['/home']);
  }

  criarMinhaFamilia(): void {
    if (!this.podeCriarFamilia) {
      return;
    }

    this.mensagemErro = '';
    this.criandoFamilia = true;

    const nomeFamilia = this.buildFamilyName();
    this.familiaService.criarFamilia(nomeFamilia)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (token) => {
          this.userService.addToken(token);
          this.snackBar.open('Família criada com sucesso!', '', { duration: 4000 });
          this.voltarInicio.emit();
          this.router.navigate(['/home']);
        },
        error: () => {
          this.mensagemErro = 'Não foi possível criar sua família agora. Tente novamente.';
          this.criandoFamilia = false;
        }
      });
  }

  entrarComCodigo(): void {
    if (!this.podeCriarFamilia) {
      return;
    }

    const codigoNormalizado = this.codigoEntrada.trim().toUpperCase();
    if (!codigoNormalizado) {
      this.mensagemErro = 'Informe um código de família válido.';
      return;
    }

    this.mensagemErro = '';
    this.entrandoFamilia = true;

    this.familiaService.entrarNaFamilia(codigoNormalizado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (token) => {
          this.userService.addToken(token);
          this.snackBar.open('Você entrou na família com sucesso!', '', { duration: 4000 });
          this.voltarInicio.emit();
          this.router.navigate(['/home']);
        },
        error: () => {
          this.mensagemErro = 'Não foi possível entrar com esse código. Confira e tente novamente.';
          this.entrandoFamilia = false;
        }
      });
  }

  copiarCodigo(): void {
    const codigo = (this.family?.familyCode || this.user.familyCode || '').trim();
    if (!codigo || !navigator.clipboard) {
      return;
    }

    navigator.clipboard.writeText(codigo)
      .then(() => this.snackBar.open('Código da família copiado!', '', { duration: 4000 }))
      .catch(() => this.snackBar.open('Não foi possível copiar o código.', '', { duration: 4000 }));
  }

  compartilharCodigo(): void {
    const codigo = (this.family?.familyCode || this.user.familyCode || '').trim();
    if (!codigo) {
      return;
    }

    const shareUrl = `${window.location.origin}/familia?codigo=${encodeURIComponent(codigo)}`;
    const shareText = `Entre na minha família no SplitHome com o código ${codigo}: ${shareUrl}`;

    const browserNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };

    if (typeof browserNavigator.share === 'function') {
      browserNavigator.share({
        title: 'Convite SplitHome',
        text: `Código da família: ${codigo}`,
        url: shareUrl
      }).catch(() => this.snackBar.open('Não foi possível abrir o compartilhamento.', '', { duration: 4000 }));
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
        .then(() => this.snackBar.open('Link de convite copiado para compartilhar!', '', { duration: 4000 }))
        .catch(() => this.snackBar.open('Não foi possível copiar o link.', '', { duration: 4000 }));
    }
  }

  private carregarFamilia(): void {
    this.carregandoFamilia = true;
    this.mensagemErro = '';

    this.familiaService.obterMinhaFamilia()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (family) => {
          this.family = family;
          this.familyMembers = family?.members ?? [];
          this.carregandoFamilia = false;
        },
        error: () => {
          this.mensagemErro = 'Não foi possível carregar os dados da família.';
          this.family = null;
          this.familyMembers = [];
          this.carregandoFamilia = false;
        }
      });
  }

  private buildFamilyName(): string {
    const firstName = this.user.name.split(' ').filter(Boolean)[0] ?? 'Minha';
    return `Família ${firstName}`;
  }
}
