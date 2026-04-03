import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';

@Component({
  selector: 'rp-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rp-input.component.html',
  styleUrls: ['./rp-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RpInputComponent),
      multi: true,
    },
  ],
})
export class RpInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'password' | 'tel' | 'email' | 'datetime-local' =
    'text';
  @Input() placeholder = '';
  @Input() errorMessage = '';
  /** HTML `min` for `datetime-local` / `date` inputs (omit when empty). */
  @Input() min = '';
  /** HTML `max` for `datetime-local` / `date` inputs (omit when empty). */
  @Input() max = '';

  value = '';
  disabled = false;
  showPassword = signal(false);

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  get inputType(): string {
    if (this.type === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type;
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value = val;
    this.onChange(val);
  }

  onBlur(): void {
    this.onTouched();
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  writeValue(val: string | null): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
