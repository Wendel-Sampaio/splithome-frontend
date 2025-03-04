import {ChangeDetectionStrategy, Component, EventEmitter, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

/** @title Form field appearance variants */
@Component({
  selector: 'email-input',
  templateUrl: 'email-input.component.html',
  styleUrl: 'email-input.component.scss',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailInputComponent {

  inputEmail!: string;

  @Output() inputValue = new EventEmitter();

  inviteEmail(): void {
    this.inputValue.emit(this.inputEmail);
  }

}