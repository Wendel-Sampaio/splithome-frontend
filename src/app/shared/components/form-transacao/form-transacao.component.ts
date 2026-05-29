import { ChangeDetectionStrategy, Component, DestroyRef, Inject, inject, Optional } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import {MatChipsModule} from '@angular/material/chips';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { format } from 'date-fns';
import { CompraService } from '../../services/compra/compra.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Compra } from '../../../core/models/compra/compra';
import { map, shareReplay } from 'rxjs';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { PlanService } from '../../../core/plan/plan.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';

type FormTransacaoData = {
  tipo?: 'compra' | 'despesa';
  compra?: Compra;
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
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTransacaoComponent {
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: FormTransacaoData | null) {}
  
  userService = inject(UserService)
  compraService = inject(CompraService)
  transacaoService = inject(TransacaoService)
  planService = inject(PlanService)
  userStateService = inject(UserStateService);
  private _snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<FormTransacaoComponent>, { optional: true });
  private destroyRef = inject(DestroyRef);
  readonly isPremium = this.planService.isPremium();
  readonly categorias$ = this.transacaoService.listarCategorias().pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly usuarios$ = this.userStateService.getFamilyUsers().pipe(
    map((usuarios) => usuarios.filter((usuario) => this.usuarioPodeSerPagador(usuario))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  pagadores: string[] = [];
  pagadoresRestantes: string[] = [];
  responsavel: string = this.userService.getUser().id
  formTransacao!: FormGroup;

  get isEdicaoCompra(): boolean {
    return !!this.data?.compra;
  }

  get isDespesa(): boolean {
    return this.data?.tipo === 'despesa';
  }

  get tituloDialog(): string {
    if (this.isEdicaoCompra) {
      return 'Editar compra';
    }

    return this.isDespesa ? 'Cadastro de despesa' : 'Cadastro de compra';
  }

  get textoBotaoConfirmacao(): string {
    if (this.isEdicaoCompra) {
      return 'Salvar alterações';
    }

    return this.isDespesa ? 'Cadastrar despesa' : 'Cadastrar';
  }
  

  ngOnInit(): void {
    this.formTransacao = new FormGroup({
      titulo: new FormControl(""),
      categoria: new FormControl(""),
      valor: new FormControl(""),
      dataPagamento: new FormControl(""),
    })
    this.preencherFormularioEdicao();
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

  cadastrarTransacao() {
    if (!this.pagadores.length) {
      this.openSnackBar('Selecione pelo menos um pagador.');
      return;
    }

    const categoriaSelecionada = this.formTransacao.value.categoria;
    const usuarioLogado = this.userService.getUser();
    const familyId = usuarioLogado.familyId ?? usuarioLogado.familyCode;
    const pagadores = this.isPremium ? this.pagadores : [usuarioLogado.name];
    this.pagadoresRestantes = !this.isPremium
      ? []
      : this.isEdicaoCompra
      ? this.getPagadoresRestantesEdicao()
      : [...pagadores];

    const formData = {
      ...(this.isEdicaoCompra ? { id: this.data?.compra?.id } : {}),
      title: this.formTransacao.value.titulo,
      category: categoriaSelecionada,
      value: Number(this.formTransacao.value.valor),
      payers: pagadores,
      paymentDate: format(this.formTransacao.value.dataPagamento, "yyyy-MM-dd'T'HH:mm:ss"),
      remainingPayers: this.pagadoresRestantes,
      familyId,
      ...(this.isDespesa
        ? { responsibleId: this.responsavel }
        : {
          purchaserId: this.responsavel,
          purchaseDate: this.isEdicaoCompra && this.data?.compra?.purchaseDate
            ? format(this.data.compra.purchaseDate, "yyyy-MM-dd'T'HH:mm:ss")
            : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
        })
    }
    const request = this.isEdicaoCompra
      ? this.compraService.atualizarCompra(formData)
      : this.isDespesa
      ? this.compraService.cadastrarDespesa(formData)
      : this.compraService.cadastrarCompra(formData);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        this.openSnackBar(this.getMensagemSucesso())
        this.dialogRef?.close(true);
      },
      error: error => {
        this.openSnackBar(this.getMensagemErro())
      }
    });
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, '', { duration: 5000 });
  }

  private preencherFormularioEdicao(): void {
    if (!this.data?.compra) {
      return;
    }

    this.responsavel = this.data.compra.purchaserId;
    this.formTransacao.patchValue({
      titulo: this.data.compra.title,
      categoria: this.data.compra.category,
      valor: this.data.compra.value,
      dataPagamento: this.data.compra.paymentDate ? new Date(this.data.compra.paymentDate) : ''
    });
    this.preencherPagadoresEdicao();
  }

  private preencherPagadoresEdicao(): void {
    if (!this.data?.compra) {
      return;
    }

    this.pagadores = [...this.data.compra.payers];
  }

  private getPagadoresRestantesEdicao(): string[] {
    const compra = this.data?.compra;

    if (!compra) {
      return [...this.pagadores];
    }

    const pagadoresAntigos = compra.payers ?? [];
    const pagadoresRestantesAntigos = compra.remainingPayers ?? [];
    const novosPagadores = this.pagadores.filter(pagador => !pagadoresAntigos.includes(pagador));
    const pagadoresRestantesMantidos = pagadoresRestantesAntigos.filter(pagador => this.pagadores.includes(pagador));

    return [...new Set([...pagadoresRestantesMantidos, ...novosPagadores])];
  }

  private usuarioPodeSerPagador(usuario: User): boolean {
    const usuarioLogado = this.userService.getUser();
    const familyCodeLogado = usuarioLogado.familyId ?? usuarioLogado.familyCode;
    const familyCodeUsuario = usuario.familyId ?? usuario.familyCode;

    return usuario.plan === 'PREMIUM' && familyCodeUsuario === familyCodeLogado;
  }

  private getMensagemSucesso(): string {
    if (this.isEdicaoCompra) {
      return 'Compra atualizada com sucesso!';
    }

    return this.isDespesa ? 'Despesa cadastrada com sucesso!' : 'Compra cadastrada com sucesso!';
  }

  private getMensagemErro(): string {
    if (this.isEdicaoCompra) {
      return 'Erro ao atualizar compra!';
    }

    return this.isDespesa ? 'Erro ao cadastrar despesa!' : 'Erro ao cadastrar compra!';
  }
}
