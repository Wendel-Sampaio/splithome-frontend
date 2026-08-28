export type CreditCardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'OUTROS';

export interface Cartao {
  id: string;
  name: string;
  brand: CreditCardBrand | null;
  lastDigits: string | null;
  billingDay: number;
  dueDay: number;
}
