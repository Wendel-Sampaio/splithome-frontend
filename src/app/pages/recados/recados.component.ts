import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../core/auth/user/user.service';
import { Recado, RecadosService } from '../../shared/services/recados/recados.service';

@Component({
  selector: 'app-recados',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './recados.component.html',
  styleUrl: './recados.component.scss'
})
export class RecadosComponent implements OnInit {
  private readonly recadosService = inject(RecadosService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly recadoForm = new FormGroup({
    content: new FormControl('', [Validators.required, Validators.maxLength(280)])
  });

  recados: Recado[] = [];

  ngOnInit(): void {
    this.recadosService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(recados => {
      this.recados = recados;
    });
  }

  salvarRecado(): void {
    if (this.recadoForm.invalid) {
      this.recadoForm.markAllAsTouched();
      return;
    }

    const content = this.recadoForm.controls.content.value ?? '';
    const authorName = this.userService.getUser().name || 'Você';

    this.recadosService.criar({
      content,
      authorName
    });

    this.recadoForm.reset();
  }

  voltarParaHome(): void {
    this.router.navigate(['/home']);
  }

  get tamanhoAtual(): number {
    return this.recadoForm.controls.content.value?.length ?? 0;
  }
}
