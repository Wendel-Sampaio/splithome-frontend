export interface Parcela {
  id: string;
  expenseId: string;
  numero: number;
  valor: number;
  dataVencimento: string;
  pago: boolean;
  pagadores: Array<string>;
  pagadorNames?: Array<string>;
  remainingPayers: Array<string>;
  remainingPayerNames?: Array<string>;
  showPaymentButton?: boolean;
  isPaid?: boolean;
}
