export class Register {
    name!: string;
    email!: string;
    password!: string;

    public constructor(name: string, email: string, password: string) {
        this.name = name
        this.email = email
        this.password = password
    }
}
