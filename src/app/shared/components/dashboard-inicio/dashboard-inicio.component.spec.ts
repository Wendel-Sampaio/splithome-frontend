import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardInicioComponent } from './dashboard-inicio.component';

describe('DashboardInicioComponent', () => {
  let component: DashboardInicioComponent;
  let fixture: ComponentFixture<DashboardInicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardInicioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardInicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formata valores em BRL', () => {
    expect(component.moeda(540)).toContain('540');
    expect(component.moeda(540)).toContain('R$');
  });

  it('emite a view ao clicar em um atalho', () => {
    const spy = spyOn(component.abrirView, 'emit');
    component.ir('compras');
    expect(spy).toHaveBeenCalledWith('compras');
  });
});
