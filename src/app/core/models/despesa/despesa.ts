export class Despesa {
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
    familyId!: string;
    responsibleId!: string;
    responsibleName!: string;
    showPaymentButton!: boolean;
    isPaid!: boolean;
}
