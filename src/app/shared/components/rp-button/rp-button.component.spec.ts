import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RpButtonComponent } from './rp-button.component';

describe('RpButtonComponent', () => {
  let fixture: ComponentFixture<RpButtonComponent>;
  let component: RpButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpButtonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RpButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have class rp-btn--primary by default', () => {
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.classList).toContain('rp-btn--primary');
  });

  it('should have class rp-btn--secondary when variant is secondary', () => {
    component.variant = 'secondary';
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.classList).toContain('rp-btn--secondary');
  });

  it('should be disabled when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('button'));
    expect(btn.nativeElement.disabled).toBeTrue();
  });

  it('should show spinner when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const spinner = fixture.debugElement.query(By.css('.rp-btn__spinner'));
    expect(spinner).toBeTruthy();
  });
});
