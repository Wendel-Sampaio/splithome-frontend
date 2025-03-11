import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

@Component({
  selector: 'dialog-content-example-dialog',
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
  transacaoService = inject(TransacaoService)

  categorias!: string[];
  categoriasOriginal!: string[];
  usuarios!: User[];
  pagadores: string[] = [];
  comprador: string = this.userService.getUser().id
  formCompra!: FormGroup;
  

  ngOnInit(): void {
    this.listarCategorias();
    this.listarUsuarios();
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

  removeUsuario(usuario: User): void {
    const index = this.pagadores.indexOf(usuario.name);
    if (index >= 0) {
      this.pagadores.splice(index, 1);
    }
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
      }
    })
  } 

  cadastrarCompra() {
    const categoriaSelecionada = this.formCompra.value.categoria;
    const categoriaOriginal = this.categoriasOriginal.find(
      categoria => CategoriaEnum[categoria as keyof typeof CategoriaEnum] === categoriaSelecionada
    );  
    const formData = {
      title: this.formCompra.value.titulo,
      category: categoriaOriginal,
      value: this.formCompra.value.valor,
      payers: this.pagadores,
      paymentDate: moment(this.formCompra.value.dataPagamento).format('YYYY-MM-DD'),
      remainingPayers: this.pagadores,
      purchaserId: this.comprador,
      purchaseDate: moment(this.formCompra.value.dataPagamento).format('YYYY-MM-DD'),
    }
    this.transacaoService.cadastrarCompra(formData).subscribe({
      next: response => {
        console.log('Compra cadastrada com sucesso', response);
      },
      error: error => {
        console.error('Erro ao cadastrar compra', error);
      }
    });
  }

  
}

