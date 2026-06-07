import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });
    service = TestBed.inject(NotificationService);
  });

  it('success() abre snackbar com panelClass snack-success e 4s', () => {
    service.success('Salvo!');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Salvo!', 'Fechar', {
      duration: 4000,
      panelClass: ['snack-success'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });

  it('error() abre snackbar com panelClass snack-error e 6s', () => {
    service.error('Falhou');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Falhou', 'Fechar', {
      duration: 6000,
      panelClass: ['snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });

  it('info() abre snackbar com panelClass snack-info e 4s', () => {
    service.info('FYI');
    expect(snackBarSpy.open).toHaveBeenCalledWith('FYI', 'Fechar', {
      duration: 4000,
      panelClass: ['snack-info'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });

  it('warning() abre snackbar com panelClass snack-warning e 6s', () => {
    service.warning('Cuidado');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Cuidado', 'Fechar', {
      duration: 6000,
      panelClass: ['snack-warning'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });
});
