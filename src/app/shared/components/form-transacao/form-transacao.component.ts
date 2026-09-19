import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject, inject, Optional, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogClose, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize, map, shareReplay, tap } from 'rxjs';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { format } from 'date-fns';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { NotificationService } from '../../services/notification/notification.service';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { CategoriaIconePipe } from '../../pipes/categoria-icone.pipe';
import { CategoriaCorPipe } from '../../pipes/categoria-cor.pipe';
import { PlanService } from '../../../core/plan/plan.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { Cartao, CreditCardBrand } from '../../../core/models/cartao/cartao';
import { DialogNovoCartaoComponent } from '../dialog-novo-cartao/dialog-novo-cartao.component';
import { ModalService } from '../ui/modal';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';
import { FormSectionComponent } from '../ui/form-section/form-section.component';
import { SummaryBlockComponent } from '../ui/summary-block/summary-block.component';
import { ValorBrlDirective, parseValorBrl } from '../../directives/valor-brl.directive';

type FormTransacaoData = {
  tipo?: 'compra' | 'despesa-fixa';
  compra?: Compra;
  despesaFixa?: DespesaFixa;
};

type ModoCobrancaDespesa = 'recorrente' | 'parcelada';

@Component({
  selector: 'dialog-content-example-dialog',
  standalone: true,
  styleUrl: 'form-transacao.component.scss',
  templateUrl: 'form-transacao.component.html',
  imports: [
    AsyncPipe,
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogClose,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatChipsModule,
    CategoriaPipe,
    CategoriaIconePipe,
    CategoriaCorPipe,
    MatProgressSpinnerModule,
    MatIconModule,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
    FormSectionComponent,
    SummaryBlockComponent,
    ValorBrlDirective,
  ],
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
  private modal = inject(ModalService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  readonly isPremium = this.planService.isPremium();
  readonly categorias$ = this.transacaoService.listarCategorias().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly usuarios$ = this.userStateService.getFamilyUsers().pipe(
    map((usuarios) => {
      const usuarioLogado = this.userService.getUser();
      const usuariosComLogado = usuarioLogado.id
        ? [usuarioLogado, ...usuarios.filter((usuario) => usuario.id !== usuarioLogado.id)]
        : usuarios;
      return usuariosComLogado.filter((usuario) => this.usuarioPodeSerPagador(usuario));
    }),
    tap((usuarios) => {
      this.usuariosFamilia = usuarios;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly cartoes$ = this.compraService.listarCartoes().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly NOVO_CARTAO_ID = '__novo_cartao__';

  readonly marcasCartao: CreditCardBrand[] = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OUTROS'];

  pagadores: string[] = [];
  pagadoresRestantes: string[] = [];
  private usuariosFamilia: User[] = [];
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

  get descricaoDialog(): string {
    if (this.isEdicaoCompra) {
      return 'Atualize as informações da compra.';
    }
    if (this.isEdicaoDespesaFixa) {
      return 'Edite a despesa fixa e o parcelamento.';
    }
    return this.isDespesaFixa
      ? 'Cadastre uma despesa mensal ou parcelada.'
      : 'Registre uma nova compra avulsa.';
  }

  get isDespesaRecorrente(): boolean {
    return this.formTransacao?.get('modoCobranca')?.value === 'recorrente';
  }

  get textoBotaoConfirmacao(): string {
    if (this.isEdicao) {
      return 'Salvar alterações';
    }
    return this.isDespesaFixa ? 'Cadastrar despesa fixa' : 'Cadastrar compra';
  }

  get valorParcela(): number | null {
    if (this.isDespesaRecorrente) {
      return this.valorTotal;
    }
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
    const baseControls: Record<string, FormControl> = {
      titulo: new FormControl('', [Validators.required]),
      categoria: new FormControl('', [Validators.required]),
      responsavel: new FormControl(this.responsavel, [Validators.required]),
    };

    if (this.isDespesaFixa) {
      baseControls['valorTotal'] = new FormControl('', [Validators.required, Validators.min(0.01)]);
      baseControls['modoCobranca'] = new FormControl<ModoCobrancaDespesa>('recorrente', [Validators.required]);
      baseControls['quantidadeParcelas'] = new FormControl(null);
      baseControls['diaVencimento'] = new FormControl(10, [Validators.required, Validators.min(1), Validators.max(31)]);
      baseControls['dataInicio'] = new FormControl(new Date(), [Validators.required]);
      baseControls['cartaoId'] = new FormControl(null);
    } else {
      baseControls['valor'] = new FormControl('', [Validators.required, Validators.min(0.01)]);
      baseControls['dataPagamento'] = new FormControl('', [Validators.required]);
    }

    this.formTransacao = new FormGroup(baseControls);

    this.cartoes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => this.cartoes = c);

    if (this.isDespesaFixa) {
      this.formTransacao.get('cartaoId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
        if (value === this.NOVO_CARTAO_ID) {
          this.formTransacao.get('cartaoId')?.setValue(null, { emitEvent: false });
          this.abrirDialogNovoCartao();
        }
      });

      this.formTransacao.get('modoCobranca')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
        this.atualizarValidadoresParcelas(value);
      });
      this.atualizarValidadoresParcelas(this.formTransacao.get('modoCobranca')?.value);

      this.formTransacao.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(values => {
        this.valorTotal = parseValorBrl(values.valorTotal);
        this.quantidadeParcelas = values.modoCobranca === 'parcelada' ? values.quantidadeParcelas || null : null;
        this.dataInicio = values.dataInicio ? new Date(values.dataInicio) : null;
        this.diaVencimento = values.diaVencimento || null;
        this.cartaoSelecionado = values.cartaoId || null;
      });
    }

    this.preencherFormularioEdicao();
  }

  private abrirDialogNovoCartao(): void {
    const ref = this.modal.open<DialogNovoCartaoComponent, unknown, Cartao | null>(DialogNovoCartaoComponent, { size: 'sm' });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((novoCartao) => {
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

  private atualizarValidadoresParcelas(modo: ModoCobrancaDespesa | null): void {
    const control = this.formTransacao.get('quantidadeParcelas');
    if (!control) {
      return;
    }

    if (modo === 'parcelada') {
      control.setValidators([Validators.required, Validators.min(1), Validators.max(240)]);
      if (!control.value) {
        control.setValue(1, { emitEvent: false });
      }
    } else {
      control.clearValidators();
      control.setValue(null, { emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }

  mudarSelecaoUsuario(usuario: User): void {
    const index = this.pagadores.findIndex((pagador) => this.isMesmoUsuario(pagador, usuario));
    if (index === -1) {
      this.pagadores.push(usuario.id);
    } else {
      this.pagadores.splice(index, 1);
    }
  }

  usuarioSelecionado(usuario: User): boolean {
    return this.pagadores.some((pagador) => this.isMesmoUsuario(pagador, usuario));
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
    return this.formTransacao.valid;
  }

  get pagadoresObrigatoriosInvalidos(): boolean {
    return this.isPremium && this.pagadores.length === 0;
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

  cadastrarTransacao(): void {
    this.tentouEnviar = true;

    if (this.formTransacao.invalid) {
      this.formTransacao.markAllAsTouched();
      this.notify.warning('Preencha todos os campos obrigatórios antes de continuar.');
      return;
    }

    if (!this.isPremium && this.isDespesaFixa) {
      this.notify.warning('Esta funcionalidade é exclusiva do plano Premium.');
      return;
    }

    const usuarioLogado = this.userService.getUser();
    const pagadores = this.isPremium ? this.normalizarPagadoresSelecionados() : [];
    if (this.isPremium && pagadores.length === 0) {
      this.notify.warning('Selecione pelo menos um pagador para a conta.');
      return;
    }

    this.pagadoresRestantes = !this.isPremium
      ? []
      : this.isEdicao
      ? this.getPagadoresRestantesEdicao(pagadores)
      : [...pagadores];

    if (this.isDespesaFixa) {
      this.enviarDespesaFixa(usuarioLogado, pagadores);
    } else {
      this.enviarCompra(usuarioLogado, pagadores);
    }
  }

  private enviarDespesaFixa(usuarioLogado: User, pagadores: string[]): void {
    const v = this.formTransacao.value;
    const responsavel = v.responsavel || this.responsavel || usuarioLogado.id;
    const valorTotal = parseValorBrl(v.valorTotal);
    if (valorTotal === null || valorTotal <= 0) {
      this.notify.warning('Informe um valor maior que R$ 0,00.');
      return;
    }

    const payload: any = {
      title: v.titulo,
      category: v.categoria,
      totalValue: valorTotal,
      installmentsCount: v.modoCobranca === 'parcelada' ? Number(v.quantidadeParcelas) : null,
      dueDay: Number(v.diaVencimento),
      startDate: this.formatDateOnly(v.dataInicio),
      creditCardId: v.cartaoId || null,
      responsibleId: responsavel,
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
    const responsavel = this.formTransacao.value.responsavel || this.responsavel || usuarioLogado.id;
    const valor = parseValorBrl(this.formTransacao.value.valor);
    if (valor === null || valor <= 0) {
      this.notify.warning('Informe um valor maior que R$ 0,00.');
      return;
    }

    const pagadoresRestantes = this.isPremium
      ? this.getPagadoresRestantesCompra(pagadores)
      : [];
    this.pagadoresRestantes = pagadoresRestantes;
    const formData = {
      ...(this.isEdicaoCompra ? { id: this.data?.compra?.id } : {}),
      title: this.formTransacao.value.titulo,
      category: this.formTransacao.value.categoria,
      value: valor,
      payers: pagadores,
      paymentDate: this.formatDateOnly(this.formTransacao.value.dataPagamento),
      remainingPayers: pagadoresRestantes,
      ...(this.isDespesaFixa
        ? { responsibleId: responsavel }
        : {
          purchaserId: responsavel,
          purchaseDate: this.isEdicaoCompra && this.data?.compra?.purchaseDate
            ? this.formatDateOnly(this.data.compra.purchaseDate)
            : this.formatDateOnly(new Date())
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
        this.notify.success(this.isEdicaoCompra ? 'Compra atualizada com sucesso!' : 'Compra cadastrada com sucesso!');
        this.dialogRef?.close(true);
      },
      error: (err) => {
        this.notify.error(this.extrairMensagemErro(err) || 'Erro ao cadastrar compra.');
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
        dataPagamento: this.data.compra.paymentDate ? new Date(this.data.compra.paymentDate) : '',
        responsavel: this.responsavel
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
        modoCobranca: d.quantidadeParcelas ? 'parcelada' : 'recorrente',
        quantidadeParcelas: d.quantidadeParcelas,
        diaVencimento: d.diaVencimento,
        dataInicio: d.dataInicio ? new Date(d.dataInicio) : new Date(),
        cartaoId: d.creditCardId || null,
        responsavel: this.responsavel
      });
      this.pagadores = [...(d.payers ?? [])];
    }
  }

  private getPagadoresRestantesEdicao(pagadores: string[]): string[] {
    const antiga = this.normalizarReferenciasPagadores(this.data?.compra?.payers ?? this.data?.despesaFixa?.payers ?? []);
    const antigosRestantes = this.normalizarReferenciasPagadores(this.data?.compra?.remainingPayers ?? this.data?.despesaFixa?.remainingPayers ?? []);
    const novosPagadores = pagadores.filter(p => !antiga.includes(p));
    const mantidos = antigosRestantes.filter(p => pagadores.includes(p));
    return [...new Set([...mantidos, ...novosPagadores])];
  }

  private getPagadoresRestantesCompra(pagadores: string[]): string[] {
    return this.isEdicaoCompra
      ? this.getPagadoresRestantesEdicao(pagadores)
      : [...pagadores];
  }

  private formatDateOnly(value: Date | string): string {
    if (typeof value === 'string') {
      return value.includes('T') ? value.slice(0, 10) : value;
    }

    return format(value, 'yyyy-MM-dd');
  }


  private usuarioPodeSerPagador(usuario: User): boolean {
    const usuarioLogado = this.userService.getUser();
    if (usuario.id === usuarioLogado.id) {
      return true;
    }

    const familyCodeLogado = usuarioLogado.familyId ?? usuarioLogado.familyCode;
    const familyCodeUsuario = usuario.familyId ?? usuario.familyCode;
    return !!familyCodeLogado && familyCodeUsuario === familyCodeLogado;
  }

  private isMesmoUsuario(reference: string, usuario: User): boolean {
    return reference === usuario.id || reference === usuario.name;
  }

  private normalizarPagadoresSelecionados(): string[] {
    return this.normalizarReferenciasPagadores(this.pagadores);
  }

  private normalizarReferenciasPagadores(referencias: string[]): string[] {
    const pagadores = referencias
      .map((pagador) => this.usuariosFamilia.find((usuario) => this.isMesmoUsuario(pagador, usuario))?.id ?? pagador)
      .map((pagador) => pagador.trim())
      .filter(Boolean);

    return [...new Set(pagadores)];
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
