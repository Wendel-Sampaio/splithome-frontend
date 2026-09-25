import { CategoriaValor } from '../../core/models/categoria/categoria';
import { Pipe, PipeTransform } from '@angular/core';
import { getCategoriaIcone } from '../../core/models/categoria/categoriaEnum';

@Pipe({
  name: 'categoriaIcone',
  standalone: true
})
export class CategoriaIconePipe implements PipeTransform {
  transform(categoria: CategoriaValor): string {
    return getCategoriaIcone(categoria);
  }
}
