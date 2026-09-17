export type PaymentPerson = {
    reference: string;
    name: string;
    profilePhoto?: string;
};

export class Compra {
    id!: string;
    title!: string;
    category!: string;
    value!: number;
    unitValue!: number;
    payers!: Array<string>;
    payerNames?: Array<string>;
    payerProfiles?: Array<PaymentPerson>;
    paymentDate!: string;
    remainingPayers!: Array<string>;
    remainingPayerNames?: Array<string>;
    remainingPayerProfiles?: Array<PaymentPerson>;
    purchaserId!: string;
    purchaserName!: string;
    purchaseDate!: string;
    showPaymentButton!: boolean;
    isPaid!: boolean;
}
