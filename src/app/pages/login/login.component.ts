import { Component } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import { PasswordInput } from '../../shared/components/password-input/password-input.component';
import { EmailInputComponent } from '../../shared/components/email-input/email-input.component';

@Component({
  selector: 'app-login',
  imports: [MatCardModule, EmailInputComponent,PasswordInput],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {

}
