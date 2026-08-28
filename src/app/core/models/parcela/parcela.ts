export interface Parcela {
  id: string;
  expenseId: string;
  numero: number;
  valor: number;
  dataVencimento: string;
  pago: boolean;
  pagadores: Array<string>;
  remainingPayers: Array<string>;
  showPaymentButton?: boolean;
  isPaid?: boolean;
}
