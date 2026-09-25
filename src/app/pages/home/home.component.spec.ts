import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ActivatedRoute, Event, Navigation, NavigationEnd, provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HomeComponent } from './home.component';
import { UserService } from '../../core/auth/user/user.service';
import { environment } from '../../../environments/environment';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar na view "inicio"', () => {
    expect(component.currentView).toBe('inicio');
  });

  it('abrirCompras() deve trocar a view e o título', () => {
    component.abrirCompras();
    expect(component.currentView).toBe('compras');
    expect(component.currentViewTitle).toBe('Compras');
  });

  it('abrirFamilia() deve manter o shell e trocar para a view família', () => {
    component.abrirFamilia();
    expect(component.currentView).toBe('familia');
    expect(component.currentViewTitle).toBe('Família');
  });

  it('alternarMenu() deve minimizar e expandir o menu lateral', () => {
    expect(component.isMenuCollapsed).toBeFalse();

    component.alternarMenu();
    expect(component.isMenuCollapsed).toBeTrue();

    component.alternarMenu();
    expect(component.isMenuCollapsed).toBeFalse();
  });

  it('restaura a view da rota ao abrir uma notificação na mesma URL', () => {
    fixture.destroy();
    const events = new Subject<Event>();
    spyOnProperty(TestBed.inject(Router), 'events', 'get').and.returnValue(events);
    TestBed.inject(ActivatedRoute).snapshot.data = { initialView: 'familia' };
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    component.abrirCompras();
    events.next(new NavigationEnd(1, '/familia', '/familia'));
    expect(component.currentView).toBe('familia');
    expect(component.currentViewTitle).toBe('Família');
  });

  it('aplica a rota uma única vez quando o componente nasce durante uma navegação', () => {
    fixture.destroy();
    const events = new Subject<Event>();
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'events', 'get').and.returnValue(events);
    spyOn(router, 'getCurrentNavigation').and.returnValue({ id: 1 } as Navigation);
    TestBed.inject(ActivatedRoute).snapshot.data = { initialView: 'familia' };
    const abrirFamilia = spyOn(HomeComponent.prototype, 'abrirFamilia').and.callThrough();
    fixture = TestBed.createComponent(HomeComponent);
    expect(abrirFamilia).not.toHaveBeenCalled();
    events.next(new NavigationEnd(1, '/familia', '/familia'));
    expect(abrirFamilia).toHaveBeenCalledTimes(1);
  });
  it('starts after rendering and restores navigation when dismissed', () => {
    fixture.destroy();
    const users = TestBed.inject(UserService);
    spyOn(users, 'getUser').and.returnValue({ ...users.getUser(), id: 'onboarding-user' });
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user/me/onboarding-tour`)
      .flush({ onboardingTourCompletedAt: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-onboarding-tour')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.app-shell').hasAttribute('inert')).toBeTrue();
    fixture.componentInstance.onboardingTour.dismiss();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-onboarding-tour')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-shell').hasAttribute('inert')).toBeFalse();
  });

  it('does not render a tour for users whose completion is persisted', () => {
    fixture.destroy();
    const users = TestBed.inject(UserService);
    spyOn(users, 'getUser').and.returnValue({ ...users.getUser(), id: 'onboarding-user' });
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/user/me/onboarding-tour`)
      .flush({ onboardingTourCompletedAt: '2026-09-22T12:00:00Z', shouldShowOnboardingTour: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-onboarding-tour')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-shell').hasAttribute('inert')).toBeFalse();
  });

  it('replays from the account menu, returning to Home with the sidebar expanded', async () => {
    component.currentView = 'meuPerfil';
    component.isMenuCollapsed = true;
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-tour-id="menu-conta"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const replay = Array.from(overlay.querySelectorAll<HTMLButtonElement>('[mat-menu-item]'))
      .find(button => button.textContent?.includes('Rever Tour'))!;
    expect(replay).toBeDefined();
    replay.click(); fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.currentView).toBe('inicio');
    expect(component.isMenuCollapsed).toBeFalse();
    expect(component.onboardingTour.active()).toBeTrue();
    expect(component.onboardingTour.index()).toBe(0);
    expect(fixture.nativeElement.querySelector('app-onboarding-tour')).not.toBeNull();
    expect(overlay.querySelector('[role="menu"]')).toBeNull();
  });

});
