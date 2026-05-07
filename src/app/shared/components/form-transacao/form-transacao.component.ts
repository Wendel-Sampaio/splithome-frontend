import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, inject, Optional } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import {MatChipsModule} from '@angular/material/chips';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { CommonModule } from '@angular/common';
import { CategoriaEnum } from '../../../core/models/categoria/categoriaEnum';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import moment from 'moment/moment';
import { CompraService } from '../../services/compra/compra.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'dialog-content-example-dialog',
  styleUrl: 'form-transacao.component.scss',
  templateUrl: 'form-transacao.component.html',
  imports: [
    MatDialogModule, 
    MatButtonModule, 
    MatCardModule, 
    MatSelectModule, 
    MatButtonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatChipsModule,
    CommonModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTransacaoComponent {
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: { tipo?: 'compra' | 'despesa' } | null) {}
  
  userService = inject(UserService)
  compraService = inject(CompraService)
  transacaoService = inject(TransacaoService)
  private _snackBar = inject(MatSnackBar);
  cdRef = inject(ChangeDetectorRef)

  categorias!: string[];
  categoriasOriginal!: string[];
  usuarios!: User[];
  pagadores: string[] = [];
  pagadoresRestantes: string[] = [];
  responsavel: string = this.userService.getUser().id
  formTransacao!: FormGroup;

  get isDespesa(): boolean {
    return this.data?.tipo === 'despesa';
  }

  get tituloDialog(): string {
    return this.isDespesa ? 'Cadastro de despesa' : 'Cadastro de compra';
  }

  get textoBotaoConfirmacao(): string {
    return this.isDespesa ? 'Cadastrar despesa' : 'Cadastrar';
  }
  

  ngOnInit(): void {
    this.listarUsuarios();
    this.listarCategorias();
    this.formTransacao = new FormGroup({
      titulo: new FormControl(""),
      categoria: new FormControl(""),
      valor: new FormControl(""),
      dataPagamento: new FormControl(""),
    })
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


  getPagadoresSelecionados(): string[] {
    return this.pagadores;
  }

  listarCategorias() {
    this.transacaoService.listarCategorias().subscribe({
      next: categorias => {
        this.categorias = categorias.map(categoria => 
          CategoriaEnum[categoria as keyof typeof CategoriaEnum] || categoria
        );
        this.categoriasOriginal = categorias;
      }
    });
  }

  listarUsuarios() {
    this.userService.getAllUsers().subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.cdRef.detectChanges();
      }
    })
  } 

  cadastrarTransacao() {
    const categoriaSelecionada = this.formTransacao.value.categoria;
    const categoriaOriginal = this.categoriasOriginal.find(
      categoria => CategoriaEnum[categoria as keyof typeof CategoriaEnum] === categoriaSelecionada
    ) ?? categoriaSelecionada;
    const usuarioLogado = this.userService.getUser();
    const familyId = usuarioLogado.familyId ?? usuarioLogado.familyCode;
    this.pagadoresRestantes = [...this.pagadores];

    const formData = {
      title: this.formTransacao.value.titulo,
      category: categoriaOriginal,
      value: Number(this.formTransacao.value.valor),
      payers: this.pagadores,
      paymentDate: moment(this.formTransacao.value.dataPagamento).format('YYYY-MM-DDTHH:mm:ss'),
      remainingPayers: this.pagadoresRestantes,
      familyId,
      ...(this.isDespesa
        ? { responsibleId: this.responsavel }
        : {
          purchaserId: this.responsavel,
          purchaseDate: moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
        })
    }
    const request = this.isDespesa
      ? this.compraService.cadastrarDespesa(formData)
      : this.compraService.cadastrarCompra(formData);

    request.subscribe({
      next: response => {
        this.openSnackBar(this.isDespesa ? "Despesa cadastrada com sucesso!" : "Compra cadastrada com sucesso!")
      },
      error: error => {
        this.openSnackBar(this.isDespesa ? "Erro ao cadastrar despesa!" : "Erro ao cadastrar compra!")
      }
    });
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, '', { duration: 5000 });
  }
}
