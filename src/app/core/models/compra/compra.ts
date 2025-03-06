import { Data } from "@angular/router";

export class Compra {
    id!: string;
    title!: string;
    category!: string;
    value!: number;
    payers!: Array<string>;
    paymentDate!: Data;
    remainingPayers!: Array<string>;
    purchaserId!: string;
    purchaseDate!: Data;
}
