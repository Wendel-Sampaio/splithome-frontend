import {ChangeDetectionStrategy, Component, EventEmitter, Output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

/** @title Form field with prefix & suffix */
@Component({
  selector: 'password-input',
  templateUrl: 'password-input.component.html',
  styleUrl: 'password-input.component.scss',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInput {

  inputPassword!: string;

  @Output() inputValue = new EventEmitter();

  hide = signal(true);

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  invitePassword(): void {
    this.inputValue.emit(this.inputPassword)
  }

}
