import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const FORMATADOR = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/** Lê um valor monetário no padrão brasileiro (vírgula decimal, ponto de milhar). */
export function parseValorBrl(valor: unknown): number | null {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null;
  }

  const limpo = String(valor ?? '').replace(/[^\d,.-]/g, '');
  if (!limpo) {
    return null;
  }

  const normalizado = limpo
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

export function formatarValorBrl(valor: number): string {
  return FORMATADOR.format(valor);
}

/**
 * Campo de valor em reais: aceita vírgula (padrão brasileiro) ou ponto na digitação,
 * exibe o valor formatado como 1.234,56 e entrega um número ao FormControl.
 */
@Directive({
  selector: 'input[appValorBrl]',
  standalone: true,
  host: {
    inputmode: 'decimal',
    autocomplete: 'off'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ValorBrlDirective),
      multi: true
    }
  ]
})
export class ValorBrlDirective implements ControlValueAccessor {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private onChange: (valor: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('input')
  aoDigitar(): void {
    const digitado = this.input.value;
    const permitido = digitado.replace(/[^\d.,]/g, '');

    if (permitido !== digitado) {
      const cursor = (this.input.selectionStart ?? permitido.length) - (digitado.length - permitido.length);
      this.input.value = permitido;
      this.input.setSelectionRange(cursor, cursor);
    }

    this.onChange(parseValorBrl(permitido));
  }

  @HostListener('blur')
  aoSair(): void {
    const valor = parseValorBrl(this.input.value);
    this.input.value = valor === null ? '' : formatarValorBrl(valor);
    this.onTouched();
  }

  writeValue(valor: unknown): void {
    const numero = parseValorBrl(valor);
    this.input.value = numero === null ? '' : formatarValorBrl(numero);
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.input.disabled = desabilitado;
  }
}
