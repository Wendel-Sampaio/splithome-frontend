import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'meu-perfil',
  templateUrl: 'meu-perfil.component.html',
  styleUrl: 'meu-perfil.component.scss',
  imports: [MatCardModule, MatButtonModule, MatIcon, MatFormFieldModule, MatInputModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuPerfilComponent implements OnInit {

  isEditable: boolean = false; 
  private cdr = inject(ChangeDetectorRef);
  
  userData: User = { 
    id: '',
    name: '',
    email: '',
    phoneNumber: '',
    pixKey: '',
  };

  userService = inject(UserService)

  ngOnInit(): void {
    this.loadUserData();
  }

  toggleEditMode() {
    this.isEditable = !this.isEditable;
  }

  cancelEdit() {
    this.isEditable = false;
    this.loadUserData(); 
  }

  loadUserData() {
    const userId = this.userService.getUser().id;
    this.userService.getUserById(userId).subscribe(user => {
      this.userData = user;
      this.cdr.markForCheck(); 
    });
  }


}
