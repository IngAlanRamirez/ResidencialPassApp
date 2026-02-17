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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import { ToastService } from '../../../core/data/services/toast.service';

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
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonBackButton,
    IonButtons,
  ],
})
export class RegistrarVigilantePage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly loadingSubmit = signal(false);

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
