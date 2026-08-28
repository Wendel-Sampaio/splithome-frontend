import { TestBed } from '@angular/core/testing';
import { PlanService } from './plan.service';
import { UserService } from '../auth/user/user.service';
import { UpgradeComponent } from '../../shared/components/upgrade/upgrade.component';
import { ModalService } from '../../shared/components/ui/modal';

describe('PlanService', () => {
  let service: PlanService;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let modalSpy: jasmine.SpyObj<ModalService>;

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['isPremium']);
    modalSpy = jasmine.createSpyObj<ModalService>('ModalService', ['open']);

    TestBed.configureTestingModule({
      providers: [
        PlanService,
        { provide: UserService, useValue: userServiceSpy },
        { provide: ModalService, useValue: modalSpy }
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

    expect(modalSpy.open).toHaveBeenCalledWith(UpgradeComponent, {
      size: 'md',
      data: { feature: 'split-payments' }
    });
  });

  it('should not open the upgrade dialog for premium users', () => {
    userServiceSpy.isPremium.and.returnValue(true);

    service.requiresPremium('split-payments');

    expect(modalSpy.open).not.toHaveBeenCalled();
  });
});
