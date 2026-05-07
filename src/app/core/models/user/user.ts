export class User {
    id!: string;
    name!: string;
    email!: string;
    phoneNumber!: string;
    pixKey!: string;
    familyId?: string;
    familyCode!: string;
    plan!: 'FREE' | 'PREMIUM';
}
