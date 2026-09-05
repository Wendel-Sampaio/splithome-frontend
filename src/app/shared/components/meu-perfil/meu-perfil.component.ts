import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { FormsModule } from '@angular/forms';
import { CartoesComponent } from '../cartoes/cartoes.component';
import { MatTabsModule } from '@angular/material/tabs';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'meu-perfil',
  templateUrl: 'meu-perfil.component.html',
  styleUrl: 'meu-perfil.component.scss',
  imports: [
    MatCardModule, MatButtonModule, MatIcon, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, CommonModule, FormsModule,
    MatTabsModule, MatTooltipModule, CartoesComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuPerfilComponent implements OnInit {

  isEditable: boolean = false;
  readonly acceptProfilePhoto = 'image/png,image/jpeg,image/webp';
  loading = signal(false);
  @Output() profilePhotoUpdated = new EventEmitter<string>();
  private cdr = inject(ChangeDetectorRef);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  userData: User = {
    id: '', name: '', email: '', phoneNumber: '', pixKey: '',
    familyCode: '', plan: 'FREE', profilePhoto: ''
  };

  userService = inject(UserService);

  ngOnInit(): void {
    const loggedUser = this.userService.getUser();
    this.userData = {
      ...loggedUser,
      profilePhoto: this.userService.getProfilePhoto(loggedUser)
    };
    this.loadUserData();
  }

  toggleEditMode() {
    this.isEditable = !this.isEditable;
  }

  handlePrimaryAction() {
    if (!this.isEditable) {
      this.toggleEditMode();
      return;
    }

    this.atualizarUsuario();
  }

  cancelEdit() {
    this.isEditable = false;
    this.loadUserData();
  }

  get profilePhotoUrl(): string {
    return this.userService.getProfilePhoto(this.userData);
  }

  get userInitials(): string {
    const initials = (this.userData.name || this.userData.email || '?')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');

    return initials || '?';
  }

  get planLabel(): string {
    return this.userData.plan === 'PREMIUM' ? 'Premium' : 'Grátis';
  }

  onProfilePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notify.error('Selecione um arquivo de imagem.');
      input.value = '';
      return;
    }

    this.resizeProfilePhoto(file)
      .then((profilePhoto) => {
        const userId = this.userData.id || this.userService.getUser().id;
        this.userData = { ...this.userData, id: userId, profilePhoto };
        this.userService.saveProfilePhoto(userId, profilePhoto);
        this.profilePhotoUpdated.emit(profilePhoto);
        this.persistProfilePhoto();
        this.notify.success('Foto de perfil atualizada com sucesso!');
        this.cdr.markForCheck();
      })
      .catch(() => this.notify.error('Não foi possível carregar a foto selecionada.'))
      .finally(() => { input.value = ''; });
  }

  copyToClipboard() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.userData.familyCode)
        .then(() => this.notify.success('Código da família copiado com sucesso!'))
        .catch(() => this.notify.error('Não foi possível copiar o código.'));
    } else {
      this.notify.warning('Recurso de cópia não suportado neste navegador.');
    }
  }

  loadUserData() {
    const userId = this.userService.getUser().id;
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.userData = user;
      this.cdr.markForCheck();
    });
  }

  atualizarUsuario() {
    if (this.isEditable !== true) {
      return;
    }

    const userId = this.userService.getUser().id;
    this.loading.set(true);
    this.userService.atualizarUsuario(userId, this.userData).pipe(
      finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Usuário atualizado com sucesso!');
        this.isEditable = false;
        this.loadUserData();
      },
      error: () => {
        this.notify.error('Não foi possível atualizar o perfil.');
      }
    });
  }

  private persistProfilePhoto() {
    const userId = this.userData.id || this.userService.getUser().id;

    if (!userId) {
      return;
    }

    this.userService.atualizarUsuario(userId, {
      ...this.userData,
      id: userId
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private resizeProfilePhoto(file: File): Promise<string> {
    const maxSize = 320;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject();
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const width = Math.round(image.width * scale);
          const height = Math.round(image.height * scale);
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        image.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}
