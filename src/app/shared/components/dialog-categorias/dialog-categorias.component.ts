import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Categoria } from '../../../core/models/categoria/categoria';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { NotificationService } from '../../services/notification/notification.service';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';

@Component({
  selector: 'app-dialog-categorias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule,
    MatProgressSpinnerModule, ModalHeaderComponent, ModalBodyComponent, ModalFooterComponent],
  templateUrl: './dialog-categorias.component.html',
  styleUrl: './dialog-categorias.component.scss'
})
export class DialogCategoriasComponent {
  private readonly data = inject<Categoria[]>(MAT_DIALOG_DATA);
  private readonly service = inject(TransacaoService);
  private readonly notify = inject(NotificationService);
  private readonly ref = inject(MatDialogRef<DialogCategoriasComponent, Categoria | undefined>);
  private readonly destroyRef = inject(DestroyRef);

  readonly categorias = signal(this.data.filter(c => c.custom && !c.systemDefault));
  readonly nome = new FormControl('', { nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/u), Validators.maxLength(100)] });
  readonly form = new FormGroup({ name: this.nome });
  readonly salvando = signal(false);
  readonly erro = signal('');
  readonly editando = signal<Categoria | null>(null);
  readonly excluindo = signal<Categoria | null>(null);

  editar(categoria: Categoria): void {
    if (this.salvando() || categoria.systemDefault) return;
    this.editando.set(categoria);
    this.excluindo.set(null);
    this.erro.set('');
    this.nome.setValue(categoria.name);
  }

  cancelarEdicao(): void {
    this.editando.set(null);
    this.nome.reset();
    this.erro.set('');
  }

  salvar(): void {
    if (this.salvando()) return;
    if (this.nome.invalid) {
      this.nome.markAsTouched();
      return;
    }
    const name = this.nome.value.trim().replace(/\s+/gu, ' ');
    const categoria = this.editando();
    this.iniciarRequisicao();
    const request = categoria
      ? this.service.atualizarCategoria(categoria.id, name)
      : this.service.criarCategoria(name);
    request.pipe(finalize(() => this.finalizarRequisicao()), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.notify.success(categoria ? 'Categoria atualizada!' : 'Categoria criada para a família!');
        this.ref.close(result);
      },
      error: (error: unknown) => this.mostrarErro(error)
    });
  }

  confirmarExclusao(): void {
    const categoria = this.excluindo();
    if (!categoria || categoria.systemDefault || this.salvando()) return;
    this.iniciarRequisicao();
    this.service.excluirCategoria(categoria.id).pipe(
      finalize(() => this.finalizarRequisicao()), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.categorias.update(items => items.filter(item => item.id !== categoria.id));
        this.excluindo.set(null);
        if (this.editando()?.id === categoria.id) this.cancelarEdicao();
        this.notify.success('Categoria desativada. O histórico foi preservado.');
      },
      error: (error: unknown) => this.mostrarErro(error)
    });
  }

  fechar(): void {
    if (!this.salvando()) this.ref.close();
  }

  private iniciarRequisicao(): void {
    this.erro.set('');
    this.salvando.set(true);
    this.ref.disableClose = true;
    this.nome.disable();
  }

  private finalizarRequisicao(): void {
    this.salvando.set(false);
    this.ref.disableClose = false;
    this.nome.enable();
  }

  private mostrarErro(error: unknown): void {
    const response = error as { status?: number; error?: { message?: string } } | null;
    this.erro.set(response?.status === 409
      ? 'Já existe uma categoria com esse nome na sua família, inclusive entre as desativadas.'
      : response?.error?.message || 'Não foi possível salvar a alteração. Tente novamente.');
  }
}
