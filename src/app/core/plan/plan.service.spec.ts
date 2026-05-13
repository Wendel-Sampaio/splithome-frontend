import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { PlanService } from './plan.service';
import { UserService } from '../auth/user/user.service';
import { UpgradeComponent } from '../../shared/components/upgrade/upgrade.component';

describe('PlanService', () => {
  let service: PlanService;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['isPremium']);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        PlanService,
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    service = TestBed.inject(PlanService);
  });

  it('should report premium status from the user service', () => {
    userServiceSpy.isPremium.and.returnValue(true);

    expect(service.isPremium()).toBeTrue();
    expect(userServiceSpy.isPremium).toHaveBeenCalled();
  });

  it('should deny premium features for free users', () => {
    userServiceSpy.isPremium.and.returnValue(false);

    expect(service.canAccess()).toBeFalse();
  });

  it('should open the upgrade dialog when a free user needs premium access', () => {
    userServiceSpy.isPremium.and.returnValue(false);

    service.requiresPremium('split-payments');

    expect(dialogSpy.open).toHaveBeenCalledWith(UpgradeComponent, {
      width: '460px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'upgrade-dialog',
      data: { feature: 'split-payments' }
    });
  });

  it('should not open the upgrade dialog for premium users', () => {
    userServiceSpy.isPremium.and.returnValue(true);

    service.requiresPremium('split-payments');

    expect(dialogSpy.open).not.toHaveBeenCalled();
  });
});
