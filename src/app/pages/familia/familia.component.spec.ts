import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { FamiliaComponent } from './familia.component';
import { UserService } from '../../core/auth/user/user.service';
import { User } from '../../core/models/user/user';
import { Familia, FamiliaService } from '../../shared/services/familia/familia.service';

describe('FamiliaComponent', () => {
  let component: FamiliaComponent;
  let fixture: ComponentFixture<FamiliaComponent>;
  let familiaService: jasmine.SpyObj<FamiliaService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const premiumUser: User = {
    id: 'user-1',
    name: 'Ana Silva',
    email: 'ana@splithome.dev',
    phoneNumber: '',
    pixKey: '',
    familyCode: 'CASA123',
    plan: 'PREMIUM',
    profilePhoto: ''
  };

  const family: Familia = {
    id: 'family-1',
    name: 'Casa Silva',
    familyCode: 'CASA123',
    members: [
      {
        id: 'user-1',
        name: 'Ana Silva',
        email: 'ana@splithome.dev'
      }
    ]
  };

  beforeEach(async () => {
    familiaService = jasmine.createSpyObj<FamiliaService>(
      'FamiliaService',
      ['criarFamilia', 'entrarNaFamilia', 'obterMinhaFamilia']
    );
    userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'addToken']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    userService.getUser.and.returnValue(premiumUser);
    familiaService.obterMinhaFamilia.and.returnValue(of(family));

    await TestBed.configureTestingModule({
      imports: [FamiliaComponent],
      providers: [
        { provide: FamiliaService, useValue: familiaService },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({})
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FamiliaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mostra a opção de entrar em outra família quando já existe família ativa', () => {
    const textContent = fixture.nativeElement.textContent as string;

    expect(textContent).toContain('Entrar em outra família');
    expect(textContent).toContain('Use o código recebido para trocar a família vinculada à sua conta.');
  });

  it('entra em outra família usando o código informado', () => {
    familiaService.entrarNaFamilia.and.returnValue(of('jwt-token'));
    component.codigoEntrada = ' nova123 ';

    component.entrarComCodigo();

    expect(familiaService.entrarNaFamilia).toHaveBeenCalledWith('NOVA123');
    expect(userService.addToken).toHaveBeenCalledWith('jwt-token');
    expect(snackBar.open).toHaveBeenCalledWith('Você entrou na família com sucesso!', '', { duration: 4000 });
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
