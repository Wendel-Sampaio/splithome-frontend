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

// Contrato de criação/atualização: o cronograma das parcelas vem da data da
// compra quando há cartão vinculado (o backend lê fechamento e vencimento
// dele), ou do par dia de vencimento + data de início quando não há.
export interface DespesaFixaPayload {
  title: string;
  category: string;
  totalValue: number;
  installmentsCount: number | null;
  creditCardId: string | null;
  responsibleId: string;
  payers: string[];
  remainingPayers: string[];
  purchaseDate?: string;
  dueDay?: number;
  startDate?: string;
}
