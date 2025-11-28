import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleCuenta } from './detalle-cuenta';

describe('DetalleCuenta', () => {
  let component: DetalleCuenta;
  let fixture: ComponentFixture<DetalleCuenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleCuenta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleCuenta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
