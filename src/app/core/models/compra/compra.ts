export class Compra {
    id!: string;
    title!: string;
    category!: string;
    value!: number;
    unitValue!: number;
    payers!: Array<string>;
    payerNames?: Array<string>;
    paymentDate!: string;
    remainingPayers!: Array<string>;
    remainingPayerNames?: Array<string>;
    purchaserId!: string;
    purchaserName!: string;
    purchaseDate!: string;
    showPaymentButton!: boolean;
    isPaid!: boolean;
}
