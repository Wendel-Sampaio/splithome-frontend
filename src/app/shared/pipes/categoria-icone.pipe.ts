import { Pipe, PipeTransform } from '@angular/core';
import { getCategoriaIcone } from '../../core/models/categoria/categoriaEnum';

@Pipe({
  name: 'categoriaIcone',
  standalone: true
})
export class CategoriaIconePipe implements PipeTransform {
  transform(categoria: string | null | undefined): string {
    return getCategoriaIcone(categoria);
  }
}
