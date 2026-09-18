import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { CategoriaPipe } from '../../shared/pipes/categoria.pipe';
import { NotificationService } from '../../shared/services/notification/notification.service';
import {
  EstatisticaCategoria,
  EstatisticaMensal,
  EstatisticasResumo,
  EstatisticasService
} from '../../shared/services/estatisticas/estatisticas.service';

@Component({
  selector: 'app-estatisticas',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CategoriaPipe
  ],
  templateUrl: './estatisticas.component.html',
  styleUrl: './estatisticas.component.scss'
})
export class EstatisticasComponent implements OnInit {
  private readonly estatisticasService = inject(EstatisticasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notify = inject(NotificationService);

  readonly periodoForm = new FormGroup({
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null)
  });
  readonly cores = ['#48A75A', '#2F80ED', '#F2994A', '#9B51E0', '#EB5757', '#56CCF2', '#F2C94C', '#27AE60'];

  resumo: EstatisticasResumo | null = null;
  loading = signal(false);

  ngOnInit(): void {
    this.carregarResumo();
  }

  get totalCategorias(): number {
    return this.resumo?.totaisPorCategoria.reduce((total, item) => total + item.total, 0) ?? 0;
  }

  get totaisPorMes(): EstatisticaMensal[] {
    return this.resumo?.totaisPorMes.slice(-6) ?? [];
  }

  get maiorTotalMensal(): number {
    return Math.max(...this.totaisPorMes.map(item => item.total), 0);
  }

  get pieGradient(): string {
    const categorias = this.resumo?.totaisPorCategoria ?? [];

    if (!categorias.length || this.totalCategorias <= 0) {
      return '#eef3ef';
    }

    let inicio = 0;
    const partes = categorias.map((item, index) => {
      const fim = inicio + (item.total / this.totalCategorias) * 360;
      const cor = this.getCor(index);
      const segmento = `${cor} ${inicio}deg ${fim}deg`;
      inicio = fim;
      return segmento;
    });

    return `conic-gradient(${partes.join(', ')})`;
  }

  carregarResumo(): void {
    const dataInicio = this.periodoForm.controls.dataInicio.value;
    const dataFim = this.periodoForm.controls.dataFim.value;
    this.loading.set(true);
    this.estatisticasService.buscarResumo({
      dataInicio: dataInicio ? this.formatarData(dataInicio) : undefined,
      dataFim: dataFim ? this.formatarData(dataFim) : undefined
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: resumo => { this.resumo = resumo; },
      error: () => {
        this.notify.error('Não foi possível carregar as estatísticas.');
        this.resumo = null;
      }
    });
  }

  limparFiltro(): void {
    this.periodoForm.reset();
    this.carregarResumo();
  }

  getCor(index: number): string {
    return this.cores[index % this.cores.length];
  }

  getAlturaBarra(total: number): number {
    if (this.maiorTotalMensal <= 0) {
      return 0;
    }

    return Math.max((total / this.maiorTotalMensal) * 100, 6);
  }

  formatarMes(mes: string): string {
    const [ano, numeroMes] = mes.split('-');
    const data = new Date(Number(ano), Number(numeroMes) - 1, 1);

    if (Number.isNaN(data.getTime())) {
      return mes;
    }

    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', '');
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
