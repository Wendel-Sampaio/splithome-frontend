import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { HomeComponent } from './home.component';

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
});
