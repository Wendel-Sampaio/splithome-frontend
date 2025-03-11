import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPagamentoComponent } from './dialog-pagamento.component';

describe('DialogPagamentoComponent', () => {
  let component: DialogPagamentoComponent;
  let fixture: ComponentFixture<DialogPagamentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogPagamentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPagamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
