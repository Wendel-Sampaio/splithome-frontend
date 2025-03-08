
export class Login {
  email!: string;
  password!: string;

  public constructor(email: string, password: string) {
    this.email = email
    this.password = password
  }
}
