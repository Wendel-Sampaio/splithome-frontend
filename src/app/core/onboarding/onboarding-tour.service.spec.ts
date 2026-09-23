import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from '../auth/user/user.service';
import { PlanService } from '../plan/plan.service';
import { OnboardingTourService } from './onboarding-tour.service';
import { environment } from '../../../environments/environment';

describe('OnboardingTourService', () => {
  let service: OnboardingTourService;
  let http: HttpTestingController;
  let plan: jasmine.SpyObj<PlanService>;
  const endpoint = `${environment.apiUrl}/user/me/onboarding-tour`;
  const pending = { onboardingTourCompletedAt: null, shouldShowOnboardingTour: true };

  beforeEach(() => {
    plan = jasmine.createSpyObj('PlanService', ['requiresPremium']);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: UserService, useValue: { getUser: () => ({ id: 'user-1' }) } },
      { provide: PlanService, useValue: plan }
    ] });
    service = TestBed.inject(OnboardingTourService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function start(): void {
    service.initialize();
    http.expectOne(endpoint).flush(pending);
  }
  function last(): void {
    for (let i = 1; i < service.steps.length; i++) service.next();
  }

  it('checks persisted status once and starts only when pending', () => {
    start();
    service.initialize();
    http.expectNone(endpoint);
    expect(service.active()).toBeTrue();
    expect(service.index()).toBe(0);
  });
  it('does not show the tour again for a completed user', () => {
    service.initialize();
    http.expectOne(endpoint).flush({ onboardingTourCompletedAt: '2026-09-22T12:00:00Z', shouldShowOnboardingTour: false });
    expect(service.active()).toBeFalse();
  });
  it('accepts an explicit shouldShow flag', () => {
    service.initialize();
    http.expectOne(endpoint).flush({ shouldShowOnboardingTour: true });
    expect(service.active()).toBeTrue();
  });
  it('leaves Home usable when the status request fails', () => {
    service.initialize();
    http.expectOne(endpoint).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.active()).toBeFalse();
  });
  it('bounds navigation and does not persist an early exit', () => {
    start();
    service.previous();
    expect(service.index()).toBe(0);
    service.complete();
    http.expectNone(endpoint);
    last();
    service.next();
    expect(service.index()).toBe(9);
    service.previous();
    expect(service.index()).toBe(8);
    service.dismiss();
    expect(service.active()).toBeFalse();
    http.expectNone(endpoint);
  });
  it('waits for successful persistence and prevents duplicate completion', () => {
    start(); last();
    service.complete(true);
    service.complete(true);
    service.dismiss();
    expect(service.active()).toBeTrue();
    expect(service.saving()).toBeTrue();
    expect(plan.requiresPremium).not.toHaveBeenCalled();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('PUT');
    request.flush({ onboardingTourCompletedAt: '2026-09-22T12:00:00Z', shouldShowOnboardingTour: false });
    expect(service.active()).toBeFalse();
    expect(plan.requiresPremium).toHaveBeenCalledOnceWith('family-sharing');
  });
  it('allows retry after failed persistence and does not offer upgrade prematurely', () => {
    start(); last();
    service.complete(true);
    http.expectOne(endpoint).flush({}, { status: 500, statusText: 'Error' });
    expect(service.active()).toBeTrue();
    expect(service.saving()).toBeFalse();
    expect(service.error()).toContain('Tente novamente');
    expect(plan.requiresPremium).not.toHaveBeenCalled();
    service.complete();
    http.expectOne(endpoint).flush({ onboardingTourCompletedAt: '2026-09-22T12:00:00Z' });
    expect(service.active()).toBeFalse();
    expect(plan.requiresPremium).not.toHaveBeenCalled();
  });
  it('persists skipping from an intermediate step only once and never opens upgrade', () => {
    start(); service.next();
    service.skip();
    service.skip();
    service.replay();
    expect(service.index()).toBe(1);
    expect(service.active()).toBeTrue();
    expect(service.saving()).toBeTrue();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('PUT');
    request.flush({ onboardingTourCompletedAt: '2026-09-23T12:00:00Z', shouldShowOnboardingTour: false });
    expect(service.active()).toBeFalse();
    expect(plan.requiresPremium).not.toHaveBeenCalled();
  });

  it('keeps the tour open when skipping fails and allows retry', () => {
    start();
    service.skip();
    http.expectOne(endpoint).flush({}, { status: 500, statusText: 'Error' });
    expect(service.active()).toBeTrue();
    expect(service.saving()).toBeFalse();
    expect(service.error()).toContain('Tente novamente');
    service.skip();
    http.expectOne(endpoint).flush({ onboardingTourCompletedAt: '2026-09-23T12:00:00Z' });
    expect(service.active()).toBeFalse();
  });

  it('replays for completed users without clearing their saved completion', () => {
    service.initialize();
    http.expectOne(endpoint).flush({ onboardingTourCompletedAt: '2026-09-23T12:00:00Z', shouldShowOnboardingTour: false });
    service.replay();
    expect(service.active()).toBeTrue();
    expect(service.index()).toBe(0);
    service.next(); service.dismiss(); service.replay();
    expect(service.index()).toBe(0);
    http.expectNone(endpoint);
  });

  it('allows replay after skipping and resets progress', () => {
    start(); service.next(); service.skip();
    http.expectOne(endpoint).flush({ onboardingTourCompletedAt: '2026-09-23T12:00:00Z' });
    service.replay();
    expect(service.active()).toBeTrue();
    expect(service.index()).toBe(0);
    expect(service.error()).toBe('');
    http.expectNone(endpoint);
  });

  it('does not restart a manually replayed tour when a delayed status arrives', () => {
    service.initialize();
    const status = http.expectOne(endpoint);
    service.replay(); service.next();
    status.flush(pending);
    expect(service.index()).toBe(1);
    service.dismiss();
    expect(service.active()).toBeFalse();
  });

});
