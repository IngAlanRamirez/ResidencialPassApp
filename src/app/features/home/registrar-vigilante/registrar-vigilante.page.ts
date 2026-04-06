import {
  Component,
  OnDestroy,
  signal,
  inject,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import { RpInputComponent } from '../../../shared/components/rp-input/rp-input.component';

@Component({
  selector: 'app-registrar-vigilante',
  templateUrl: './registrar-vigilante.page.html',
  styleUrls: ['./registrar-vigilante.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    RpButtonComponent,
    RpInputComponent,
  ],
})
export class RegistrarVigilantePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly location = inject(Location);
  private readonly destroy$ = new Subject<void>();

  readonly loadingSubmit = signal(false);

  form = this.fb.group(
    {
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: [
        '',
        [Validators.required, Validators.minLength(8)],
      ],
    },
    { validators: (control: AbstractControl) => this.passwordMatchValidator(control) }
  );

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value ?? '';
    const confirm = control.get('confirmPassword')?.value ?? '';
    if (confirm.length > 0 && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.location.back();
  }

  async confirmLogout(): Promise<void> {
    await this.logoutPrompt.prompt();
  }

  confirmPasswordError(): string {
    const c = this.form.get('confirmPassword');
    if (!c?.touched) return '';
    if (c.hasError('required')) return 'Repetí la contraseña';
    if (c.hasError('minlength')) return 'Mínimo 8 caracteres';
    if (this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    const pwd = this.form.get('password')?.value ?? '';
    if (pwd !== (c.value ?? '')) return 'Las contraseñas no coinciden';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.password !== raw.confirmPassword) {
      this.toast.error('Las contraseñas no coinciden.');
      return;
    }

    this.loadingSubmit.set(true);

    this.usersApi
      .createVigilante({
        phone: raw.phone!.trim(),
        password: raw.password!,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadingSubmit.set(false);
          this.toast.success('Vigilante registrado correctamente.');
          this.router.navigate(['/home'], { replaceUrl: true });
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo registrar al vigilante. Intenta de nuevo.';
          this.toast.error(typeof msg === 'string' ? msg : 'Error al registrar.');
        },
      });
  }
}
