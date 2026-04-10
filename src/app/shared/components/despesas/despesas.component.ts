import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardTitle } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { FormCompraComponent } from "../form-compra/form-compra.component";

@Component({
  selector: 'app-despesas',
  imports: [
    MatTableModule,
    CommonModule,
    MatDialogModule,
    MatCardTitle,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent {

  readonly dialog = inject(MatDialog);
  
  abrirFormCompra() {
    const formRef = this.dialog.open(FormCompraComponent, {
      width: '550px',
    });
    formRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      //this.pegarCompras();
    });
  }  
  
  
}