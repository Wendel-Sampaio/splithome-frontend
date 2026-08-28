import { Parcela } from '../parcela/parcela';

export interface DespesaFixa {
  id: string;
  title: string;
  category: string;
  valorTotal: number;
  quantidadeParcelas: number;
  diaVencimento: number;
  dataInicio: string;
  paymentDate: string;
  responsibleId: string;
  responsibleName: string;
  creditCardId: string | null;
  creditCardName?: string;
  payers: Array<string>;
  remainingPayers: Array<string>;
  parcelas: Parcela[];
  showPaymentButton?: boolean;
  isPaid?: boolean;
}
