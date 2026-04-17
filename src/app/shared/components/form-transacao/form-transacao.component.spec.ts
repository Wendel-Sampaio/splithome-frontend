import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTransacaoComponent } from './form-transacao.component';

describe('FormTransacaoComponent', () => {
  let component: FormTransacaoComponent;
  let fixture: ComponentFixture<FormTransacaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTransacaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTransacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
