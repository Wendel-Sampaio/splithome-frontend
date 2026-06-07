import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RecadosComponent } from './recados.component';

describe('RecadosComponent', () => {
  let component: RecadosComponent;
  let fixture: ComponentFixture<RecadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecadosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
