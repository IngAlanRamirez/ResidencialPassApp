import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RpBadgeComponent } from './rp-badge.component';

describe('RpBadgeComponent', () => {
  let fixture: ComponentFixture<RpBadgeComponent>;
  let component: RpBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RpBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RpBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show "Pendiente" label for pending status', () => {
    component.status = 'pending';
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.rp-badge'));
    expect(badge.nativeElement.textContent.trim()).toBe('Pendiente');
  });

  it('should show "Completada" label for finished status', () => {
    component.status = 'finished';
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.rp-badge'));
    expect(badge.nativeElement.textContent.trim()).toBe('Completada');
  });

  it('should show "Cancelada" label for cancelled status', () => {
    component.status = 'cancelled';
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.rp-badge'));
    expect(badge.nativeElement.textContent.trim()).toBe('Cancelada');
  });

  it('should apply correct class for each status', () => {
    component.status = 'pending';
    fixture.detectChanges();
    const badge = fixture.debugElement.query(By.css('.rp-badge'));
    expect(badge.nativeElement.classList).toContain('rp-badge--pending');
  });
});
