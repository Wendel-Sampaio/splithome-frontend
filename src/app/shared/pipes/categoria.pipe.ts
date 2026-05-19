import { Pipe, PipeTransform } from '@angular/core';
import { CategoriaEnum } from '../../core/models/categoria/categoriaEnum';

@Pipe({
  name: 'categoria',
  standalone: true
})
export class CategoriaPipe implements PipeTransform {
  transform(categoria: string | null | undefined): string {
    if (!categoria) {
      return '';
    }

    return CategoriaEnum[categoria as keyof typeof CategoriaEnum] ?? categoria;
  }
}
