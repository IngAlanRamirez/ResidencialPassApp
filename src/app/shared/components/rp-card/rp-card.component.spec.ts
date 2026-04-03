import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RpCardComponent } from './rp-card.component';

describe('RpCardComponent', () => {
  let fixture: ComponentFixture<RpCardComponent>;
  let component: RpCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RpCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should apply rp-card--action class for action variant', () => {
    component.variant = 'action';
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('.rp-card'));
    expect(card.nativeElement.classList).toContain('rp-card--action');
  });

  it('should apply rp-card--list-item class for list-item variant', () => {
    component.variant = 'list-item';
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('.rp-card'));
    expect(card.nativeElement.classList).toContain('rp-card--list-item');
  });
});
