import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValorBrlDirective, formatarValorBrl, parseValorBrl } from './valor-brl.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ValorBrlDirective],
  template: '<input appValorBrl [formControl]="valor" />'
})
class HostComponent {
  valor = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);
}

describe('ValorBrlDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  function digitar(texto: string) {
    input.value = texto;
    input.dispatchEvent(new Event('input'));
  }

  it('converte vírgula decimal em número no FormControl', () => {
    digitar('386,58');
    expect(host.valor.value).toBe(386.58);
  });

  it('aceita ponto como separador decimal', () => {
    digitar('386.58');
    expect(host.valor.value).toBe(386.58);
  });

  it('trata ponto como separador de milhar quando há vírgula', () => {
    digitar('1.234,56');
    expect(host.valor.value).toBe(1234.56);
  });

  it('mantém válido um valor com centavos menor que um real', () => {
    digitar('0,50');
    expect(host.valor.value).toBe(0.5);
    expect(host.valor.valid).toBeTrue();
  });

  it('marca inválido quando o valor é zero', () => {
    digitar('0,00');
    expect(host.valor.hasError('min')).toBeTrue();
  });

  it('ignora caracteres não numéricos digitados', () => {
    digitar('12a,3b4');
    expect(input.value).toBe('12,34');
    expect(host.valor.value).toBe(12.34);
  });

  it('formata no padrão brasileiro ao sair do campo', () => {
    digitar('1234.5');
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('1.234,50');
  });

  it('esvazia o controle quando o campo fica vazio', () => {
    digitar('');
    expect(host.valor.value).toBeNull();
    expect(host.valor.hasError('required')).toBeTrue();
  });

  it('exibe formatado o valor vindo do controle', () => {
    host.valor.setValue(386.58);
    expect(input.value).toBe('386,58');
  });

  it('parseValorBrl devolve null para texto sem número', () => {
    expect(parseValorBrl('R$ abc')).toBeNull();
    expect(parseValorBrl(null)).toBeNull();
    expect(parseValorBrl('R$ 10,91')).toBe(10.91);
  });

  it('formatarValorBrl usa vírgula decimal', () => {
    expect(formatarValorBrl(10.9)).toBe('10,90');
  });
});
