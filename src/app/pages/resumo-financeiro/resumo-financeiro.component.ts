import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  ResumoFinanceiro,
  ResumoFinanceiroService,
  SaldoMembro
} from '../../shared/services/resumo-financeiro/resumo-financeiro.service';

@Component({
  selector: 'app-resumo-financeiro',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './resumo-financeiro.component.html',
  styleUrl: './resumo-financeiro.component.scss'
})
export class ResumoFinanceiroComponent implements OnInit {
  private readonly resumoService = inject(ResumoFinanceiroService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periodoForm = new FormGroup({
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null)
  });

  resumo: ResumoFinanceiro | null = null;
  carregando = false;
  erro = '';

  ngOnInit(): void {
    this.carregarResumo();
  }

  carregarResumo(): void {
    const dataInicio = this.periodoForm.controls.dataInicio.value;
    const dataFim = this.periodoForm.controls.dataFim.value;

    this.carregando = true;
    this.erro = '';

    this.resumoService.buscarResumo({
      dataInicio: dataInicio ? this.formatarData(dataInicio) : undefined,
      dataFim: dataFim ? this.formatarData(dataFim) : undefined
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (resumo) => {
        this.resumo = resumo;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Nao foi possivel carregar o resumo financeiro.';
        this.resumo = null;
        this.carregando = false;
      }
    });
  }

  limparFiltro(): void {
    this.periodoForm.reset();
    this.carregarResumo();
  }

  saldoClasse(saldo: SaldoMembro): string {
    if (saldo.netBalance > 0) {
      return 'positivo';
    }

    if (saldo.netBalance < 0) {
      return 'negativo';
    }

    return 'neutro';
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
