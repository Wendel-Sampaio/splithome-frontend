import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlanService } from '../../plan/plan.service';
import { FamiliaService } from '../../../shared/services/familia/familia.service';
import { UserService } from './user.service';
import { UserStateService } from './user-state.service';

describe('UserStateService', () => {
  let service: UserStateService;
  let familiaService: jasmine.SpyObj<FamiliaService>;
  let planService: jasmine.SpyObj<PlanService>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    familiaService = jasmine.createSpyObj<FamiliaService>('FamiliaService', ['obterMinhaFamilia']);
    planService = jasmine.createSpyObj<PlanService>('PlanService', ['isPremium']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getProfilePhoto']);
    userService.getProfilePhoto.and.returnValue('assets/perfil.png');

    TestBed.configureTestingModule({
      providers: [
        UserStateService,
        { provide: FamiliaService, useValue: familiaService },
        { provide: PlanService, useValue: planService },
        { provide: UserService, useValue: userService }
      ]
    });

    service = TestBed.inject(UserStateService);
  });

  it('retorna membros da familia usando a mesma fonte da aba Familia', (done) => {
    planService.isPremium.and.returnValue(true);
    familiaService.obterMinhaFamilia.and.returnValue(of({
      id: '',
      name: 'Casa Silva',
      familyCode: 'CASA123',
      members: [
        { id: 'u1', name: 'Ana', email: 'ana@splithome.dev' },
        { id: 'u2', name: 'Bruno', email: 'bruno@splithome.dev' }
      ]
    }));

    service.getFamilyUsers().subscribe((users) => {
      expect(users.map((user) => user.name)).toEqual(['Ana', 'Bruno']);
      expect(users.every((user) => user.familyCode === 'CASA123')).toBeTrue();
      done();
    });
  });

  it('retorna lista vazia quando usuario nao e premium', (done) => {
    planService.isPremium.and.returnValue(false);

    service.getFamilyUsers().subscribe((users) => {
      expect(users).toEqual([]);
      expect(familiaService.obterMinhaFamilia).not.toHaveBeenCalled();
      done();
    });
  });

  it('limpa o cache e retorna vazio quando a familia nao carrega', (done) => {
    planService.isPremium.and.returnValue(true);
    familiaService.obterMinhaFamilia.and.returnValue(throwError(() => new Error('falha')));

    service.getFamilyUsers().subscribe((users) => {
      expect(users).toEqual([]);
      done();
    });
  });
});
