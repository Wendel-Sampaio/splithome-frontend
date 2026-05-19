import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pagadores',
  standalone: true
})
export class PagadoresPipe implements PipeTransform {
  transform(pagadores: string[] | null | undefined, emptyMessage = ''): string {
    if (!pagadores?.length) {
      return emptyMessage;
    }

    if (pagadores.length === 1) {
      return pagadores[0];
    }

    const ultimoPagador = pagadores[pagadores.length - 1];
    const demaisPagadores = pagadores.slice(0, -1);

    return `${demaisPagadores.join(', ')} e ${ultimoPagador}`;
  }
}
