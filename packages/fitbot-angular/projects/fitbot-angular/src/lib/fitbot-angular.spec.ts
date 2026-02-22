import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FitbotAngular } from './fitbot-angular';

describe('FitbotAngular', () => {
  let component: FitbotAngular;
  let fixture: ComponentFixture<FitbotAngular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FitbotAngular]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FitbotAngular);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
