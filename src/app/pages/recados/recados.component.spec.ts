import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RecadosComponent } from './recados.component';
import { RecadosService } from '../../shared/services/recados/recados.service';

describe('RecadosComponent', () => {
  let component: RecadosComponent;
  let fixture: ComponentFixture<RecadosComponent>;
  let recadosService: jasmine.SpyObj<RecadosService>;

  beforeEach(async () => {
    recadosService = jasmine.createSpyObj<RecadosService>('RecadosService', ['listar', 'criar']);
    recadosService.listar.and.returnValue(of([]));
    recadosService.criar.and.returnValue(of({
      id: 'recado-1',
      content: 'Aviso',
      authorName: 'Ana',
      createdAt: '2026-09-17T10:00:00Z'
    }));

    await TestBed.configureTestingModule({
      imports: [RecadosComponent],
      providers: [
        provideRouter([]),
        { provide: RecadosService, useValue: recadosService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('carrega recados pela API ao iniciar', () => {
    expect(recadosService.listar).toHaveBeenCalled();
  });

  it('publica recado na API e atualiza a lista local', () => {
    component.recadoForm.controls.content.setValue('Aviso');

    component.salvarRecado();

    expect(recadosService.criar).toHaveBeenCalledWith({ content: 'Aviso' });
    expect(component.recados[0].content).toBe('Aviso');
  });
});
