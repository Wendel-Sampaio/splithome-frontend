export class Register {
    name!: string;
    email!: string;
    password!: string;
    familyCode!: string;

    public constructor(name: string, email: string, password: string, familyCode: string) {
        this.name = name
        this.email = email
        this.password = password
        this.familyCode = familyCode
    }
}
