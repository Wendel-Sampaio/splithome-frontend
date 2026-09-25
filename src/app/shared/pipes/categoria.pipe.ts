import { CategoriaValor } from '../../core/models/categoria/categoria';
import { Pipe, PipeTransform } from '@angular/core';
import { CategoriaEnum } from '../../core/models/categoria/categoriaEnum';

@Pipe({
  name: 'categoria',
  standalone: true
})
export class CategoriaPipe implements PipeTransform {
  transform(categoria: CategoriaValor): string {
    if (!categoria) {
      return '';
    }

    if (typeof categoria !== 'string') {
      return categoria.systemDefault
        ? CategoriaEnum[categoria.name as keyof typeof CategoriaEnum] ?? categoria.name
        : categoria.name;
    }
    return CategoriaEnum[categoria as keyof typeof CategoriaEnum] ?? categoria;
  }
}
