import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OnboardingTourComponent } from './onboarding-tour.component';
import { OnboardingTourService } from '../../../core/onboarding/onboarding-tour.service';
import { UserService } from '../../../core/auth/user/user.service';
import { PlanService } from '../../../core/plan/plan.service';
import { environment } from '../../../../environments/environment';

describe('OnboardingTourComponent', () => {
  let fixture: ComponentFixture<OnboardingTourComponent>;
  let tour: OnboardingTourService;
  let premium: boolean;
  let anchor: HTMLButtonElement;

  beforeEach(() => {
    premium = false;
    TestBed.configureTestingModule({ imports: [OnboardingTourComponent], providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: UserService, useValue: { getUser: () => ({ id: 'user-1' }) } },
      { provide: PlanService, useValue: { isPremium: () => premium, requiresPremium: jasmine.createSpy() } }
    ] });
    anchor = document.createElement('button');
    anchor.dataset['tourId'] = 'menu-inicio';
    document.body.appendChild(anchor);
    spyOn(anchor, 'getBoundingClientRect').and.returnValue(new DOMRect(20, 20, 100, 44));
    spyOn(anchor, 'scrollIntoView');
    tour = TestBed.inject(OnboardingTourService);
    tour.initialize();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user/me/onboarding-tour`).flush({ onboardingTourCompletedAt: null });
    fixture = TestBed.createComponent(OnboardingTourComponent);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    anchor.remove();
    TestBed.inject(HttpTestingController).verify();
  });

  function button(label: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(item => item.textContent?.trim() === label)!;
  }
  function last(): void {
    for (let i = 1; i < tour.steps.length; i++) tour.next();
    fixture.detectChanges();
  }

  it('scrolls to and highlights the current anchor without covering it', fakeAsync(() => {
    window.dispatchEvent(new Event('resize'));
    tick(32); fixture.detectChanges();
    expect(anchor.scrollIntoView).toHaveBeenCalled();
    expect(fixture.componentInstance.highlight()?.width).toBeGreaterThan(0);
    const rect = fixture.componentInstance.highlight()!;
    const position = fixture.componentInstance.position();
    expect(parseFloat(position.left)).toBeGreaterThanOrEqual(rect.left + rect.width);
    expect(fixture.nativeElement.querySelector('[role="dialog"]').getAttribute('aria-modal')).toBe('true');
  }));
  it('supports next/back controls and a missing anchor', fakeAsync(() => {
    button('Próximo').click(); fixture.detectChanges(); tick(32); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Menu lateral');
    expect(fixture.componentInstance.highlight()).toBeNull();
    button('Voltar').click(); fixture.detectChanges();
    expect(tour.index()).toBe(0);
  }));
  it('shows both plan choices to free users and completes via the secondary CTA', () => {
    last();
    expect(button('Fazer upgrade')).toBeDefined();
    const complete = spyOn(tour, 'complete');
    button('Continuar no plano grátis').click();
    expect(complete).toHaveBeenCalledWith();
  });
  it('offers only finalization to premium users', () => {
    premium = true; last();
    expect(button('Fazer upgrade')).toBeUndefined();
    expect(button('Continuar no plano grátis')).toBeUndefined();
    expect(button('Finalizar')).toBeDefined();
    expect(fixture.nativeElement.textContent).toContain('Você já é premium');
  });
  it('dismisses with Escape without completing', () => {
    fixture.nativeElement.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(tour.active()).toBeFalse();
  });
});
