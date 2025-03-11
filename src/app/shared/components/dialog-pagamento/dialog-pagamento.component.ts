import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../core/auth/user/user.service';
import { User } from '../../../core/models/user/user';

@Component({
  selector: 'app-dialog-pagamento',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './dialog-pagamento.component.html',
  styleUrl: './dialog-pagamento.component.scss'
})
export class DialogPagamentoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogPagamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any 
  ) {}

  userService = inject(UserService)
  user!: User;

  ngOnInit(): void {
    this.pegarComprador();
  }

  pegarComprador() {
    this.userService.getUserById(this.data.purchaserId).subscribe({
      next: user => {
        this.user = user;
      }
    })
  }

}
