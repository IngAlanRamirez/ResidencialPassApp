import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { RpInputComponent } from './rp-input.component';

@Component({
  standalone: true,
  imports: [RpInputComponent, ReactiveFormsModule],
  template: `<rp-input label="Email" [formControl]="ctrl" />`,
})
class TestHost {
  ctrl = new FormControl('');
}

describe('RpInputComponent', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('should render label', () => {
    const label = fixture.debugElement.query(By.css('.rp-input__label'));
    expect(label.nativeElement.textContent).toContain('Email');
  });

  it('should update form control value on input', () => {
    const host = fixture.componentInstance;
    const input = fixture.debugElement.query(By.css('input'));
    input.nativeElement.value = 'test@example.com';
    input.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.ctrl.value).toBe('test@example.com');
  });

  it('should show error class when errorMessage is provided', () => {
    const rp = fixture.debugElement.query(By.css('rp-input'));
    rp.componentInstance.errorMessage = 'Campo requerido';
    fixture.detectChanges();
    const wrapper = fixture.debugElement.query(By.css('.rp-input__wrapper'));
    expect(wrapper.nativeElement.classList).toContain('rp-input__wrapper--error');
  });
});
