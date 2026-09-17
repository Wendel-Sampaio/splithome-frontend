import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { Recado, RecadosService } from '../../shared/services/recados/recados.service';

@Component({
  selector: 'app-recados',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './recados.component.html',
  styleUrl: './recados.component.scss'
})
export class RecadosComponent implements OnInit {
  private readonly recadosService = inject(RecadosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly recadoForm = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.maxLength(280)])
  });

  recados: Recado[] = [];
  carregandoRecados = false;
  salvandoRecado = false;
  mensagemErro = '';

  ngOnInit(): void {
    this.carregarRecados();
  }

  salvarRecado(): void {
    if (this.recadoForm.invalid || this.salvandoRecado) {
      this.recadoForm.markAllAsTouched();
      return;
    }

    const content = this.recadoForm.controls.content.value ?? '';
    this.salvandoRecado = true;
    this.mensagemErro = '';

    this.recadosService.criar({
      content
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.salvandoRecado = false;
      })
    ).subscribe({
      next: (recado) => {
        this.recados = [recado, ...this.recados];
        this.recadoForm.reset();
      },
      error: () => {
        this.mensagemErro = 'Não foi possível publicar o recado agora. Tente novamente.';
      }
    });
  }

  get tamanhoAtual(): number {
    return this.recadoForm.controls.content.value?.length ?? 0;
  }

  getAuthorInitial(authorName: string): string {
    return authorName.trim().charAt(0).toUpperCase() || '?';
  }

  private carregarRecados(): void {
    this.carregandoRecados = true;
    this.mensagemErro = '';

    this.recadosService.listar().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.carregandoRecados = false;
      })
    ).subscribe({
      next: (recados) => {
        this.recados = recados;
      },
      error: () => {
        this.mensagemErro = 'Não foi possível carregar os recados da família.';
      }
    });
  }
}
