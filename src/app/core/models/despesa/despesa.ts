export class Despesa {
    id!: string;
    title!: string;
    category!: string;
    value!: number;
    unitValue!: number;
    payers!: Array<string>;
    formatedPayers!: string;
    paymentDate!: string;
    remainingPayers!: Array<string>;
    formatedRemainingPayers!: string;
    familyId!: string;
    responsibleId!: string;
    responsibleName!: string;
    showPaymentButton!: boolean;
    isPaid!: boolean;
}
