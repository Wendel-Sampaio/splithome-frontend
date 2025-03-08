import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCompraComponent } from './form-compra.component';

describe('FormCompraComponent', () => {
  let component: FormCompraComponent;
  let fixture: ComponentFixture<FormCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormCompraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
