import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
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
import moment, { Moment } from 'moment/moment';
import { CompraService } from '../../services/compra/compra.service';

@Component({
  selector: 'dialog-content-example-dialog',
  styleUrl: 'form-compra.component.scss',
  templateUrl: 'form-compra.component.html',
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
export class FormCompraComponent {
  
  userService = inject(UserService)
  compraService = inject(CompraService)
  transacaoService = inject(TransacaoService)
  cdRef = inject(ChangeDetectorRef)

  categorias!: string[];
  categoriasOriginal!: string[];
  usuarios!: User[];
  pagadores: string[] = [];
  pagadoresRestantes: string[] = [];
  comprador: string = this.userService.getUser().id
  formCompra!: FormGroup;
  

  ngOnInit(): void {
    this.listarUsuarios();
    this.listarCategorias();
    this.formCompra = new FormGroup({
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
      },
      error: error => {
        console.log("Erro ao carregar categorias");
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

  cadastrarCompra() {
    const categoriaSelecionada = this.formCompra.value.categoria;
    const categoriaOriginal = this.categoriasOriginal.find(
      categoria => CategoriaEnum[categoria as keyof typeof CategoriaEnum] === categoriaSelecionada
    );  
    const nomeUsuarioLogado = this.userService.getUser().name
    this.pagadoresRestantes = [...this.pagadores];
    if (this.pagadoresRestantes.indexOf(nomeUsuarioLogado) !== -1) {
      this.pagadoresRestantes.splice(this.pagadoresRestantes.indexOf(nomeUsuarioLogado), 1);
    }
    const formData = {
      title: this.formCompra.value.titulo,
      category: categoriaOriginal,
      value: this.formCompra.value.valor,
      payers: this.pagadores,
      paymentDate: moment(this.formCompra.value.dataPagamento).format('YYYY-MM-DD'),
      remainingPayers: this.pagadoresRestantes,
      purchaserId: this.comprador,
      purchaseDate: new Date(),
    }
    this.compraService.cadastrarCompra(formData).subscribe({
      next: response => {
        console.log('Compra cadastrada com sucesso', response);
      },
      error: error => {
        console.error('Erro ao cadastrar compra', error);
      }
    });
  }

  
}

