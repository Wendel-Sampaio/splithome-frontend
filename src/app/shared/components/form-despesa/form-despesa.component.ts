import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { CategoriaEnum } from '../../../core/models/categoria/categoriaEnum';
import moment from 'moment/moment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-form-despesa',
  styleUrl: 'form-despesa.component.scss',
  templateUrl: 'form-despesa.component.html',
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
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDespesaComponent {
  transacaoService = inject(TransacaoService)
  private _snackBar = inject(MatSnackBar);

  categorias!: string[];
  categoriasOriginal!: string[];
  formDespesa!: FormGroup;

  ngOnInit(): void {
    this.listarCategorias();
    this.formDespesa = new FormGroup({
      titulo: new FormControl(''),
      categoria: new FormControl(''),
      valor: new FormControl(''),
      dataDespesa: new FormControl(''),
    });
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

  cadastrarDespesa() {
    const categoriaSelecionada = this.formDespesa.value.categoria;
    const categoriaOriginal = this.categoriasOriginal.find(
      categoria => CategoriaEnum[categoria as keyof typeof CategoriaEnum] === categoriaSelecionada
    );

    const formData = {
      title: this.formDespesa.value.titulo,
      category: categoriaOriginal,
      value: this.formDespesa.value.valor,
      expenseDate: moment(this.formDespesa.value.dataDespesa).format('YYYY-MM-DD'),
    };

    this.transacaoService.cadastrarDespesa(formData).subscribe({
      next: () => {
        this.openSnackBar('Despesa cadastrada com sucesso!');
      },
      error: () => {
        this.openSnackBar('Erro ao cadastrar despesa!');
      }
    });
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, '', { duration: 5000 });
  }
}
