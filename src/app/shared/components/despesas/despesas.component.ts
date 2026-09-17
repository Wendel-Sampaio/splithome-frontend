import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, switchMap, tap } from "rxjs";
import { NotificationService } from "../../services/notification/notification.service";
import { UserService } from "../../../core/auth/user/user.service";
import { Despesa } from "../../../core/models/despesa/despesa";
import { CompraService } from "../../services/compra/compra.service";
import { CategoriaPipe } from "../../pipes/categoria.pipe";
import { CategoriaIconePipe } from "../../pipes/categoria-icone.pipe";
import { CategoriaCorPipe } from "../../pipes/categoria-cor.pipe";
import { PagadoresPipe } from "../../pipes/pagadores.pipe";
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from "../confirm-delete/confirm-delete.component";
import { DialogPagamentoComponent } from "../dialog-pagamento/dialog-pagamento.component";
import { FormTransacaoComponent } from "../form-transacao/form-transacao.component";
import { parseOfxExpenses } from "../../services/ofx/ofx-parser";
import { ModalService } from "../ui/modal";
import { UserStateService } from "../../../core/auth/user/user-state.service";

@Component({
  selector: 'tabela-despesas',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CategoriaPipe,
    CategoriaIconePipe,
    CategoriaCorPipe,
    PagadoresPipe
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent {
  readonly dialog = inject(MatDialog);
  private modal = inject(ModalService);
  private destroyRef = inject(DestroyRef);
  private notify = inject(NotificationService);
  despesaService = inject(CompraService);
  userService = inject(UserService);
  private userStateService = inject(UserStateService);
  loadingLista = signal(true);
  loadingAcao = signal(false);
  private readonly recarregarDespesasSubject = new BehaviorSubject<void>(undefined);
  readonly despesas$ = this.recarregarDespesasSubject.pipe(
    switchMap(() => {
      this.loadingLista.set(true);
      return this.despesaService.listarDespesas().pipe(
        switchMap(despesas => this.tratamentoLista(despesas)),
        tap(() => this.loadingLista.set(false)),
        catchError(() => {
          this.loadingLista.set(false);
          this.notify.error('Não foi possível carregar as despesas.');
          return of([]);
        })
      );
    })
  );

  displayedColumns: string[] = [
    'title',
    'category',
    'paymentDate',
    'value',
    'payers',
    'unitValue',
    'responsibleName',
    'payment',
    'remainingPayers',
    'actions'
  ];

  abrirFormDespesa(): void {
    const formRef = this.modal.open(FormTransacaoComponent, {
      size: 'lg',
      data: { tipo: 'despesa' }
    });
    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.recarregarDespesas();
    });
  }

  importarOfx(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.ofx')) {
      this.notify.error('Selecione um arquivo OFX válido.');
      return;
    }

    this.loadingAcao.set(true);

    this.lerArquivo(file).pipe(
      map(content => parseOfxExpenses(content)),
      switchMap(despesas => {
        if (!despesas.length) {
          this.notify.info('Nenhuma despesa encontrada no arquivo OFX.');
          return of([]);
        }

        return forkJoin(despesas.map(despesa => this.despesaService.cadastrarDespesa(this.criarPayloadOfx(despesa))));
      }),
      finalize(() => this.loadingAcao.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: despesasImportadas => {
        if (!despesasImportadas.length) {
          return;
        }

        this.notify.success(`${despesasImportadas.length} despesa(s) importada(s) com sucesso!`);
        this.recarregarDespesas();
      },
      error: () => {
        this.notify.error('Não foi possível importar o arquivo OFX.');
      }
    });
  }

  private criarPayloadOfx(despesa: { title: string; value: number; paymentDate: string }): Record<string, unknown> {
    const user = this.userService.getUser();

    return {
      title: despesa.title,
      category: 'OTHERS',
      value: despesa.value,
      paymentDate: despesa.paymentDate,
      responsibleId: user.id,
      payers: [user.id],
      remainingPayers: [user.id]
    };
  }

  private lerArquivo(file: File): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        observer.next(String(reader.result ?? ''));
        observer.complete();
      };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsText(file);
    });
  }

  efetuarPagamento(element: Despesa): void {
    if (!this.verificaUserRemainingPayers(element)) {
      const user = this.userService.getUser();
      element.remainingPayers.push(user.id);
      element.isPaid = false;
      this.loadingAcao.set(true);
      this.despesaService.atualizarDespesa({
        ...element,
        remainingPayers: element.remainingPayers
      }).pipe(
        finalize(() => this.loadingAcao.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.notify.success('Pagamento registrado!');
          this.recarregarDespesas();
        },
        error: () => {
          this.notify.error('Não foi possível registrar o pagamento.');
        }
      });
      return;
    }

    const dialogRef = this.modal.open(DialogPagamentoComponent, {
      size: 'sm',
      data: { ...element, tipo: 'despesa' }
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.recarregarDespesas();
      console.log(`Dialog result: ${result}`);
    });
  }

  recarregarDespesas(): void {
    this.recarregarDespesasSubject.next();
  }

  tratamentoLista(despesas: Despesa[]): Observable<Despesa[]> {
    if (!despesas.length) {
      return of([]);
    }

    const currentUser = this.userService.getUser();
    if (currentUser.plan !== 'PREMIUM') {
      const usersById = new Map([[currentUser.id, currentUser.name]]);
      return of(despesas.map(despesa => this.prepararDespesa(despesa, usersById)));
    }

    return this.userStateService.getFamilyUsers().pipe(
      map(users => {
        const usersById = new Map(users.map(user => [user.id, user.name]));
        usersById.set(currentUser.id, currentUser.name);
        return despesas.map(despesa => this.prepararDespesa(despesa, usersById));
      }),
      catchError(() => {
        const usersById = new Map([[currentUser.id, currentUser.name]]);
        return of(despesas.map(despesa => this.prepararDespesa(despesa, usersById)));
      })
    );
  }

  isLastDespesa(despesa: Despesa, despesas: Despesa[]): boolean {
    return despesas[despesas.length - 1] === despesa;
  }

  verificaUserRemainingPayers(despesa: Despesa): boolean {
    const user = this.userService.getUser();
    return (despesa.remainingPayers ?? []).includes(user.id)
      || (despesa.remainingPayers ?? []).includes(user.name);
  }

  verificarPagamento(element: Despesa): boolean {
    if (element.responsibleId === this.userService.getUser().id && (element.remainingPayers ?? []).length !== 0) {
      return element.isPaid = false;
    }
    return element.isPaid;
  }

  deleteDespesa(despesa: Despesa): void {
    const dialogRef = this.modal.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      size: 'sm',
      data: {
        itemType: 'a despesa',
        title: despesa.title,
        valueLabel: this.formatCurrency(despesa.value)
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.confirmDeleteDespesa(despesa.id);
    });
  }

  private confirmDeleteDespesa(contaId: string): void {
    this.despesaService.deleteDespesa(contaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.success('Despesa excluída!');
        this.recarregarDespesas();
      },
      error: () => {
        this.notify.error('Não foi possível excluir a despesa.');
      }
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private prepararDespesa(despesa: Despesa, usersById: Map<string, string>): Despesa {
    const currentUser = this.userService.getUser();
    const isNotResponsible = despesa.responsibleId !== currentUser.id;
    const payers = despesa.payers ?? [];
    const remainingPayers = despesa.remainingPayers ?? [];
    const unitValue = payers.length ? despesa.value / payers.length : 0;
    const despesaNormalizada = { ...despesa, payers, remainingPayers };
    const responsibleName = usersById.get(despesa.responsibleId)
      ?? (despesa.responsibleId === currentUser.id ? currentUser.name : '');

    return {
      ...despesaNormalizada,
      unitValue,
      responsibleName,
      payerNames: this.displayNamesFor(payers, usersById),
      remainingPayerNames: this.displayNamesFor(remainingPayers, usersById),
      showPaymentButton: isNotResponsible && (payers.includes(currentUser.id) || payers.includes(currentUser.name)),
      isPaid: !this.verificaUserRemainingPayers(despesaNormalizada)
    };
  }

  private displayNamesFor(references: string[], usersById: Map<string, string>): string[] {
    return references.map((reference) => usersById.get(reference) ?? reference);
  }
}
