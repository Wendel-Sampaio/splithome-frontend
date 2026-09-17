import { Pipe, PipeTransform } from '@angular/core';
import { getCategoriaCor } from '../../core/models/categoria/categoriaEnum';

@Pipe({
  name: 'categoriaCor',
  standalone: true
})
export class CategoriaCorPipe implements PipeTransform {
  transform(categoria: string | null | undefined): string {
    return getCategoriaCor(categoria);
  }
}
