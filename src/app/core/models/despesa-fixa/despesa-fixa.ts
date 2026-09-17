import { Parcela } from '../parcela/parcela';

export interface DespesaFixa {
  id: string;
  title: string;
  category: string;
  valorTotal: number;
  quantidadeParcelas: number | null;
  diaVencimento: number;
  dataInicio: string;
  paymentDate: string;
  responsibleId: string;
  responsibleName: string;
  creditCardId: string | null;
  creditCardName?: string;
  payers: Array<string>;
  payerNames?: Array<string>;
  remainingPayers: Array<string>;
  remainingPayerNames?: Array<string>;
  parcelas: Parcela[];
  showPaymentButton?: boolean;
  isPaid?: boolean;
}
