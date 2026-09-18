import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { EstatisticasComponent } from './estatisticas.component';
import { EstatisticasService } from '../../shared/services/estatisticas/estatisticas.service';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { provideBrDateAdapterTesting } from '../../shared/testing/br-date-adapter-testing';

describe('EstatisticasComponent', () => {
  let component: EstatisticasComponent;
  let fixture: ComponentFixture<EstatisticasComponent>;
  let service: jasmine.SpyObj<EstatisticasService>;
  let notify: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EstatisticasService>('EstatisticasService', ['buscarResumo']);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);
    service.buscarResumo.and.returnValue(of({ totaisPorCategoria: [], totaisPorMes: [] } as any));

    await TestBed.configureTestingModule({
      imports: [EstatisticasComponent],
      providers: [
        provideHttpClient(),
        ...provideBrDateAdapterTesting(),
        { provide: EstatisticasService, useValue: service },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EstatisticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false após ngOnInit completar', () => {
    expect(component.loading()).toBe(false);
    expect(component.resumo).toBeTruthy();
  });

  it('erro ao carregar resumo notifica e zera resumo', () => {
    service.buscarResumo.and.returnValue(throwError(() => ({ status: 500 })));
    component.carregarResumo();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar as estatísticas.');
    expect(component.resumo).toBeNull();
    expect(component.loading()).toBe(false);
  });
});
