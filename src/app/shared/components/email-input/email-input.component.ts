import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

/** @title Form field appearance variants */
@Component({
  selector: 'email-input',
  templateUrl: 'email-input.component.html',
  styleUrl: 'email-input.component.scss',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailInputComponent {}