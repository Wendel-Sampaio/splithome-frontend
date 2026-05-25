import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecadosComponent } from './recados.component';

describe('RecadosComponent', () => {
  let component: RecadosComponent;
  let fixture: ComponentFixture<RecadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecadosComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RecadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
