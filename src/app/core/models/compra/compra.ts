import { Data } from "@angular/router";

export class Compra {
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
    purchaserId!: string;
    purchaseDate!: string;
    showPaymentButton!: boolean;
}
