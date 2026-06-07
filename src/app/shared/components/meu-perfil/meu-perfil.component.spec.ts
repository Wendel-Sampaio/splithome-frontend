import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MeuPerfilComponent } from './meu-perfil.component';
import { UserService } from '../../../core/auth/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';
import { User } from '../../../core/models/user/user';

describe('MeuPerfilComponent', () => {
  let component: MeuPerfilComponent;
  let fixture: ComponentFixture<MeuPerfilComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let notify: jasmine.SpyObj<NotificationService>;

  const fakeUser: User = {
    id: '1', name: 'A', email: 'a@b.com', phoneNumber: '', pixKey: '',
    familyCode: 'F1', plan: 'FREE', profilePhoto: ''
  };

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService',
      ['getUser', 'getUserById', 'atualizarUsuario', 'getProfilePhoto', 'saveProfilePhoto']);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    userService.getUser.and.returnValue(fakeUser);
    userService.getUserById.and.returnValue(of(fakeUser));
    userService.getProfilePhoto.and.returnValue('photo-url');
    userService.atualizarUsuario.and.returnValue(of(fakeUser));

    await TestBed.configureTestingModule({
      imports: [MeuPerfilComponent, FormsModule],
      providers: [
        provideHttpClient(),
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MeuPerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('atualizarUsuario com isEditable=true notifica sucesso', () => {
    component.isEditable = true;
    component.atualizarUsuario();
    expect(userService.atualizarUsuario).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Usuário atualizado com sucesso!');
    expect(component.loading()).toBe(false);
  });

  it('erro de atualização notifica erro de negócio', () => {
    component.isEditable = true;
    userService.atualizarUsuario.and.returnValue(throwError(() => ({ status: 400 })));
    component.atualizarUsuario();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível atualizar o perfil.');
    expect(component.loading()).toBe(false);
  });

  it('atualizarUsuario com isEditable=false não dispara request', () => {
    component.isEditable = false;
    userService.atualizarUsuario.calls.reset();
    component.atualizarUsuario();
    expect(userService.atualizarUsuario).not.toHaveBeenCalled();
  });
});
