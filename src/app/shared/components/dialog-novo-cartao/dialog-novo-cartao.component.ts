import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CompraService } from '../../services/compra/compra.service';
import { Cartao, CreditCardBrand } from '../../../core/models/cartao/cartao';
import { NotificationService } from '../../services/notification/notification.service';
import { FormSectionComponent } from '../ui/form-section/form-section.component';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';

@Component({
  selector: 'app-dialog-novo-cartao',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
    FormSectionComponent,
  ],
  templateUrl: './dialog-novo-cartao.component.html',
  styleUrl: './dialog-novo-cartao.component.scss',
})
export class DialogNovoCartaoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notify = inject(NotificationService);
  private readonly compraService = inject(CompraService);
  private readonly dialogRef = inject(MatDialogRef<DialogNovoCartaoComponent>);

  readonly marcas: CreditCardBrand[] = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OUTROS'];
  loading = signal(false);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    brand: [null as CreditCardBrand | null],
    lastDigits: ['', [Validators.pattern(/^\d{0,4}$/)]],
    billingDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    dueDay: [10, [Validators.required, Validators.min(1), Validators.max(31)]]
  });

  cancelar(): void {
    this.dialogRef.close(null);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Preencha os campos obrigatórios.');
      return;
    }

    const payload = {
      name: this.form.value.name,
      brand: this.form.value.brand || null,
      lastDigits: this.form.value.lastDigits || null,
      billingDay: Number(this.form.value.billingDay),
      dueDay: Number(this.form.value.dueDay)
    };

    this.loading.set(true);
    this.compraService.cadastrarCartao(payload).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (cartao: Cartao) => {
        this.loading.set(false);
        this.notify.success('Cartão cadastrado!');
        this.dialogRef.close(cartao);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Não foi possível cadastrar o cartão.');
      }
    });
  }
}
