import { TestBed } from '@angular/core/testing';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ModalService } from './modal.service';
import { SH_MODAL_DEFAULT_OPTIONS, SH_MODAL_WIDTHS, ShModalConfig, ShModalSize } from './modal.types';

class HostComponent {}

describe('ModalService', () => {
  let service: ModalService;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    const ref = {} as MatDialogRef<unknown>;
    dialog.open.and.returnValue(ref);

    TestBed.configureTestingModule({
      providers: [
        ModalService,
        { provide: MatDialog, useValue: dialog },
        { provide: SH_MODAL_DEFAULT_OPTIONS, useValue: {} satisfies MatDialogConfig },
      ],
    });

    service = TestBed.inject(ModalService);
  });

  it('deve mapear o tamanho "lg" para 720px e aplicar a classe sh-modal', () => {
    const size: ShModalSize = 'lg';
    service.open<HostComponent>(HostComponent as ComponentType<HostComponent>, { size });

    expect(dialog.open).toHaveBeenCalled();
    const [_, config] = dialog.open.calls.mostRecent().args as [ComponentType<unknown>, ShModalConfig];
    expect(config.width).toBe(SH_MODAL_WIDTHS[size]);
    expect(config.panelClass).toContain('sh-modal');
    expect(config.panelClass).toContain('sh-modal--lg');
  });

  it('deve usar "md" como tamanho padrão quando omitido', () => {
    service.open<HostComponent>(HostComponent as ComponentType<HostComponent>);

    const [, config] = dialog.open.calls.mostRecent().args as [ComponentType<unknown>, ShModalConfig];
    expect(config.width).toBe(SH_MODAL_WIDTHS.md);
  });

  it('deve aplicar a variant "danger" no panelClass', () => {
    service.open<HostComponent>(HostComponent as ComponentType<HostComponent>, { variant: 'danger' });

    const [, config] = dialog.open.calls.mostRecent().args as [ComponentType<unknown>, ShModalConfig];
    expect(config.panelClass).toContain('sh-modal--danger');
  });

  it('deve propagar a data e o disableClose do chamador', () => {
    service.open<HostComponent, { id: string }>(HostComponent as ComponentType<HostComponent>, {
      size: 'sm',
      data: { id: 'abc' },
      disableClose: true,
    });

    const [, config] = dialog.open.calls.mostRecent().args as [ComponentType<unknown>, ShModalConfig];
    expect(config.data).toEqual({ id: 'abc' });
    expect(config.disableClose).toBeTrue();
  });
});
