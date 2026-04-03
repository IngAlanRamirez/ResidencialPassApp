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
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';

@Component({
  selector: 'app-registrar-vigilante',
  templateUrl: './registrar-vigilante.page.html',
  styleUrls: ['./registrar-vigilante.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonButton,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonIcon,
  ],
})
export class RegistrarVigilantePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly destroy$ = new Subject<void>();

  readonly loadingSubmit = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  form = this.fb.group(
    {
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: (control: AbstractControl) => this.passwordMatchValidator(control) }
  );

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async confirmLogout(): Promise<void> {
    await this.logoutPrompt.prompt();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
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
