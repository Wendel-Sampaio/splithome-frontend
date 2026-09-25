import { CategoriaValor } from '../../core/models/categoria/categoria';
import { Pipe, PipeTransform } from '@angular/core';
import { getCategoriaCor } from '../../core/models/categoria/categoriaEnum';

@Pipe({
  name: 'categoriaCor',
  standalone: true
})
export class CategoriaCorPipe implements PipeTransform {
  transform(categoria: CategoriaValor): string {
    return getCategoriaCor(categoria);
  }
}
