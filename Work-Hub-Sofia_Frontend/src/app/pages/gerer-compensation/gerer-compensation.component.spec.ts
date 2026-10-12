import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GererCompensationComponent } from './gerer-compensation.component';

describe('GererCompensationComponent', () => {
  let component: GererCompensationComponent;
  let fixture: ComponentFixture<GererCompensationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GererCompensationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GererCompensationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
