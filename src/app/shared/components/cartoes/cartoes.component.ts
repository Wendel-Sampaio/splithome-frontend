import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Cartao, CreditCardBrand } from '../../../core/models/cartao/cartao';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from '../confirm-delete/confirm-delete.component';
import { ModalService } from '../ui/modal';

@Component({
  selector: 'tabela-cartoes',
  styleUrl: './cartoes.component.scss',
  templateUrl: './cartoes.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ]
})
export class CartoesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly modal = inject(ModalService);
  readonly dialog = inject(MatDialog);
  readonly compraService = inject(CompraService);

  readonly marcas: CreditCardBrand[] = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OUTROS'];
  cartoes: Cartao[] = [];
  loading = signal(false);
  formCartao!: FormGroup;
  editandoId: string | null = null;

  displayedColumns: string[] = ['name', 'brand', 'lastDigits', 'dueDay', 'billingDay', 'actions'];

  ngOnInit(): void {
    this.formCartao = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      brand: [null as CreditCardBrand | null],
      lastDigits: ['', [Validators.pattern(/^\d{0,4}$/)]],
      billingDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      dueDay: [10, [Validators.required, Validators.min(1), Validators.max(31)]]
    });
    this.recarregar();
  }

  recarregar(): void {
    this.loading.set(true);
    this.compraService.listarCartoes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: carts => {
        this.cartoes = carts;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Não foi possível carregar os cartões.');
      }
    });
  }

  iniciarEdicao(cartao: Cartao): void {
    this.editandoId = cartao.id;
    this.formCartao.patchValue({
      name: cartao.name,
      brand: cartao.brand,
      lastDigits: cartao.lastDigits,
      billingDay: cartao.billingDay,
      dueDay: cartao.dueDay
    });
  }

  cancelarEdicao(): void {
    this.editandoId = null;
    this.formCartao.reset({
      brand: null, billingDay: 1, dueDay: 10
    });
  }

  salvar(): void {
    if (this.formCartao.invalid) {
      this.formCartao.markAllAsTouched();
      this.notify.warning('Preencha os campos obrigatórios.');
      return;
    }

    const payload = {
      name: this.formCartao.value.name,
      brand: this.formCartao.value.brand || null,
      lastDigits: this.formCartao.value.lastDigits || null,
      billingDay: Number(this.formCartao.value.billingDay),
      dueDay: Number(this.formCartao.value.dueDay)
    };

    this.loading.set(true);
    const req = this.editandoId
      ? this.compraService.atualizarCartao(this.editandoId, payload)
      : this.compraService.cadastrarCartao(payload);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.success(this.editandoId ? 'Cartão atualizado!' : 'Cartão cadastrado!');
        this.cancelarEdicao();
        this.recarregar();
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.error('Não foi possível salvar o cartão.');
      }
    });
  }

  excluir(cartao: Cartao): void {
    const ref = this.modal.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      size: 'sm',
      data: {
        itemType: 'o cartão',
        title: cartao.name,
        valueLabel: cartao.lastDigits ? `**** ${cartao.lastDigits}` : ''
      }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);
        this.compraService.excluirCartao(cartao.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.notify.success('Cartão excluído!');
            this.recarregar();
          },
          error: () => {
            this.loading.set(false);
            this.notify.error('Não foi possível excluir o cartão.');
          }
        });
      }
    });
  }
}
