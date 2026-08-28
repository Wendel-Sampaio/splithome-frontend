import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject, inject, Optional, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { format } from 'date-fns';
import { CompraService } from '../../services/compra/compra.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { Compra } from '../../../core/models/compra/compra';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { finalize, map, shareReplay, switchMap } from 'rxjs';
import { NotificationService } from '../../services/notification/notification.service';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { PlanService } from '../../../core/plan/plan.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { Cartao, CreditCardBrand } from '../../../core/models/cartao/cartao';
import { DialogNovoCartaoComponent } from '../dialog-novo-cartao/dialog-novo-cartao.component';

type FormTransacaoData = {
  tipo?: 'compra' | 'despesa-fixa';
  compra?: Compra;
  despesaFixa?: DespesaFixa;
};

@Component({
  selector: 'dialog-content-example-dialog',
  styleUrl: 'form-transacao.component.scss',
  templateUrl: 'form-transacao.component.html',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatChipsModule,
    CommonModule,
    CategoriaPipe,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTransacaoComponent {
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: FormTransacaoData | null) {}

  userService = inject(UserService);
  compraService = inject(CompraService);
  transacaoService = inject(TransacaoService);
  planService = inject(PlanService);
  userStateService = inject(UserStateService);
  private notify = inject(NotificationService);
  loading = signal(false);
  private dialogRef = inject(MatDialogRef<FormTransacaoComponent>, { optional: true });
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  readonly isPremium = this.planService.isPremium();
  readonly categorias$ = this.transacaoService.listarCategorias().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly usuarios$ = this.userStateService.getFamilyUsers().pipe(
    map((usuarios) => usuarios.filter((usuario) => this.usuarioPodeSerPagador(usuario))),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly cartoes$ = this.compraService.listarCartoes().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly NOVO_CARTAO_ID = '__novo_cartao__';

  readonly marcasCartao: CreditCardBrand[] = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OUTROS'];

  pagadores: string[] = [];
  pagadoresRestantes: string[] = [];
  responsavel: string = this.userService.getUser().id;
  tentouEnviar = false;
  formTransacao!: FormGroup;
  cartoes: Cartao[] = [];
  cartaoSelecionado: string | null = null;
  valorTotal: number | null = null;
  quantidadeParcelas: number | null = null;
  dataInicio: Date | null = null;
  diaVencimento: number | null = null;

  get isEdicaoCompra(): boolean {
    return !!this.data?.compra;
  }

  get isEdicaoDespesaFixa(): boolean {
    return !!this.data?.despesaFixa;
  }

  get isDespesaFixa(): boolean {
    return this.data?.tipo === 'despesa-fixa';
  }

  get isEdicao(): boolean {
    return this.isEdicaoCompra || this.isEdicaoDespesaFixa;
  }

  get tituloDialog(): string {
    if (this.isEdicaoCompra) {
      return 'Editar compra';
    }
    if (this.isEdicaoDespesaFixa) {
      return 'Editar despesa fixa';
    }
    return this.isDespesaFixa ? 'Nova despesa fixa' : 'Nova compra';
  }

  get textoBotaoConfirmacao(): string {
    if (this.isEdicao) {
      return 'Salvar alterações';
    }
    return this.isDespesaFixa ? 'Cadastrar despesa fixa' : 'Cadastrar compra';
  }

  get valorParcela(): number | null {
    if (!this.valorTotal || !this.quantidadeParcelas || this.quantidadeParcelas <= 0) {
      return null;
    }
    return this.valorTotal / this.quantidadeParcelas;
  }

  get primeiraDataVencimento(): Date | null {
    if (!this.dataInicio || !this.diaVencimento) {
      return null;
    }
    const data = new Date(this.dataInicio);
    const dia = Math.min(this.diaVencimento, this.diasNoMes(data.getFullYear(), data.getMonth()));
    return new Date(data.getFullYear(), data.getMonth(), dia);
  }

  ngOnInit(): void {
    this.formTransacao = new FormGroup({
      titulo: new FormControl('', [Validators.required]),
      categoria: new FormControl('', [Validators.required]),
      valor: new FormControl('', [Validators.required, Validators.min(0.01)]),
      dataPagamento: new FormControl('', [Validators.required]),
    });

    this.cartoes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => this.cartoes = c);

    if (this.isDespesaFixa) {
      this.formTransacao.addControl('valorTotal', new FormControl('', [Validators.required, Validators.min(0.01)]));
      this.formTransacao.addControl('quantidadeParcelas', new FormControl(1, [Validators.required, Validators.min(1), Validators.max(240)]));
      this.formTransacao.addControl('diaVencimento', new FormControl(10, [Validators.required, Validators.min(1), Validators.max(31)]));
      this.formTransacao.addControl('dataInicio', new FormControl(new Date(), [Validators.required]));
      this.formTransacao.addControl('cartaoId', new FormControl(null));

      this.formTransacao.get('cartaoId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
        if (value === this.NOVO_CARTAO_ID) {
          this.formTransacao.get('cartaoId')?.setValue(null, { emitEvent: false });
          this.abrirDialogNovoCartao();
        }
      });

      this.formTransacao.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(values => {
        this.valorTotal = values.valorTotal || null;
        this.quantidadeParcelas = values.quantidadeParcelas || null;
        this.dataInicio = values.dataInicio ? new Date(values.dataInicio) : null;
        this.diaVencimento = values.diaVencimento || null;
        this.cartaoSelecionado = values.cartaoId || null;
      });
    }

    this.preencherFormularioEdicao();
  }

  private abrirDialogNovoCartao(): void {
    const ref = this.dialog.open(DialogNovoCartaoComponent, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: false
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((novoCartao: Cartao | null) => {
      if (novoCartao) {
        this.recarregarCartoes(novoCartao.id);
      }
    });
  }

  private recarregarCartoes(selecionarId?: string): void {
    this.compraService.listarCartoes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => {
      this.cartoes = c;
      if (selecionarId) {
        this.formTransacao.get('cartaoId')?.setValue(selecionarId);
        this.cartaoSelecionado = selecionarId;
      }
      this.cdr.markForCheck();
    });
  }

  private diasNoMes(ano: number, mes: number): number {
    return new Date(ano, mes + 1, 0).getDate();
  }

  mudarSelecaoUsuario(usuario: User): void {
    const index = this.pagadores.indexOf(usuario.name);
    if (index === -1) {
      this.pagadores.push(usuario.name);
    } else {
      this.pagadores.splice(index, 1);
    }
  }

  usuarioSelecionado(usuario: User): boolean {
    return this.pagadores.includes(usuario.name);
  }

  getProfilePhoto(usuario: User): string {
    return this.userService.getProfilePhoto(usuario);
  }

  getPagadoresSelecionados(): string[] {
    return this.pagadores;
  }

  get isFormularioProntoParaEnvio(): boolean {
    if (!this.formTransacao) {
      return false;
    }
    return this.formTransacao.valid && (!this.isPremium || this.pagadores.length > 0);
  }

  controlInvalido(controlName: string): boolean {
    if (!this.formTransacao) {
      return false;
    }
    const control = this.formTransacao.get(controlName);
    return !!control && control.invalid && (control.touched || this.tentouEnviar);
  }

  getMensagemErroCampo(controlName: string): string {
    const control = this.formTransacao.get(controlName);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'Campo obrigatório.';
    }
    if (control.errors['min']) {
      return 'Informe um valor maior que zero.';
    }
    return 'Valor inválido.';
  }

  cadastrarTransacao() {
    this.tentouEnviar = true;

    if (this.formTransacao.invalid) {
      this.formTransacao.markAllAsTouched();
      this.notify.warning('Preencha todos os campos obrigatórios antes de continuar.');
      return;
    }

    if (this.isPremium && !this.pagadores.length) {
      this.notify.warning('Selecione pelo menos um pagador.');
      return;
    }

    const usuarioLogado = this.userService.getUser();
    const pagadores = this.isPremium ? this.pagadores : [usuarioLogado.name];
    this.pagadoresRestantes = !this.isPremium
      ? []
      : this.isEdicao
      ? this.getPagadoresRestantesEdicao()
      : [...pagadores];

    if (this.isDespesaFixa) {
      this.enviarDespesaFixa(usuarioLogado, pagadores);
    } else {
      this.enviarCompra(usuarioLogado, pagadores);
    }
  }

  private enviarDespesaFixa(usuarioLogado: User, pagadores: string[]): void {
    const v = this.formTransacao.value;
    const payload: any = {
      title: v.titulo,
      category: v.categoria,
      totalValue: Number(v.valorTotal),
      installmentsCount: Number(v.quantidadeParcelas),
      dueDay: Number(v.diaVencimento),
      startDate: format(v.dataInicio, "yyyy-MM-dd"),
      creditCardId: v.cartaoId || null,
      responsibleId: this.responsavel,
      payers: pagadores,
      remainingPayers: this.pagadoresRestantes
    };
    const request = this.isEdicaoDespesaFixa && this.data?.despesaFixa
      ? this.compraService.atualizarDespesaFixa(this.data.despesaFixa.id, payload)
      : this.compraService.cadastrarDespesaFixa(payload);

    this.loading.set(true);
    request.pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success(this.isEdicaoDespesaFixa ? 'Despesa fixa atualizada!' : 'Despesa fixa cadastrada!');
        this.dialogRef?.close(true);
      },
      error: (err) => {
        this.notify.error(this.extrairMensagemErro(err) || 'Erro ao salvar despesa fixa.');
      }
    });
  }

  private enviarCompra(usuarioLogado: User, pagadores: string[]): void {
    const formData = {
      ...(this.isEdicaoCompra ? { id: this.data?.compra?.id } : {}),
      title: this.formTransacao.value.titulo,
      category: this.formTransacao.value.categoria,
      value: Number(this.formTransacao.value.valor),
      payers: pagadores,
      paymentDate: format(this.formTransacao.value.dataPagamento, "yyyy-MM-dd'T'HH:mm:ss"),
      remainingPayers: this.pagadoresRestantes,
      ...(this.isDespesaFixa
        ? { responsibleId: this.responsavel }
        : {
          purchaserId: this.responsavel,
          purchaseDate: this.isEdicaoCompra && this.data?.compra?.purchaseDate
            ? format(this.data.compra.purchaseDate, "yyyy-MM-dd'T'HH:mm:ss")
            : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
        })
    };
    const request = this.isEdicaoCompra
      ? this.compraService.atualizarCompra(formData)
      : this.compraService.cadastrarCompra(formData);

    this.loading.set(true);
    request.pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success(this.isEdicaoCompra ? 'Compra atualizada!' : 'Compra cadastrada!');
        this.dialogRef?.close(true);
      },
      error: (err) => {
        this.notify.error(this.extrairMensagemErro(err) || 'Erro ao salvar compra.');
      }
    });
  }

  private preencherFormularioEdicao(): void {
    if (this.data?.compra) {
      this.responsavel = this.data.compra.purchaserId;
      this.formTransacao.patchValue({
        titulo: this.data.compra.title,
        categoria: this.data.compra.category,
        valor: this.data.compra.value,
        dataPagamento: this.data.compra.paymentDate ? new Date(this.data.compra.paymentDate) : ''
      });
      this.pagadores = [...(this.data.compra.payers ?? [])];
      return;
    }

    if (this.data?.despesaFixa) {
      const d = this.data.despesaFixa;
      this.responsavel = d.responsibleId;
      this.formTransacao.patchValue({
        titulo: d.title,
        categoria: d.category,
        valorTotal: d.valorTotal,
        quantidadeParcelas: d.quantidadeParcelas,
        diaVencimento: d.diaVencimento,
        dataInicio: d.dataInicio ? new Date(d.dataInicio) : new Date(),
        cartaoId: d.creditCardId || null
      });
      this.pagadores = [...(d.payers ?? [])];
    }
  }

  private getPagadoresRestantesEdicao(): string[] {
    const antiga = this.data?.compra?.payers ?? this.data?.despesaFixa?.payers ?? [];
    const antigosRestantes = this.data?.compra?.remainingPayers ?? this.data?.despesaFixa?.remainingPayers ?? [];
    const novosPagadores = this.pagadores.filter(p => !antiga.includes(p));
    const mantidos = antigosRestantes.filter(p => this.pagadores.includes(p));
    return [...new Set([...mantidos, ...novosPagadores])];
  }

  private usuarioPodeSerPagador(usuario: User): boolean {
    const usuarioLogado = this.userService.getUser();
    const familyCodeLogado = usuarioLogado.familyId ?? usuarioLogado.familyCode;
    const familyCodeUsuario = usuario.familyId ?? usuario.familyCode;
    return usuario.plan === 'PREMIUM' && familyCodeUsuario === familyCodeLogado;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private extrairMensagemErro(error: any): string {
    if (!error) return '';
    if (typeof error?.error === 'string' && error.error.trim()) return error.error.trim();
    if (typeof error?.error?.message === 'string' && error.error.message.trim()) return error.error.message.trim();
    if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
    return '';
  }
}
