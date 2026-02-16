import {
  Component,
  OnDestroy,
  signal,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
  NavController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { AuthApiService } from '../../../core/data/services/auth-api.service';
import { DeviceIdService } from '../../../core/data/services/device-id.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly deviceId = inject(DeviceIdService);
  private readonly navCtrl = inject(NavController);
  private readonly destroy$ = new Subject<void>();

  readonly loadingSubmit = signal(false);
  readonly errorMessage = signal<string | null>(null);

  form = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.loadingSubmit.set(true);

    this.authApi
      .login({
        phone: raw.phone!.trim(),
        password: raw.password!,
        deviceId: this.deviceId.getDeviceId(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingSubmit.set(false);
          // TODO: guardar token
          this.navCtrl.navigateRoot('/home', { replaceUrl: true });
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          const msg =
            err.error?.message ??
            err.message ??
            'Error al iniciar sesión. Revisa tu teléfono y contraseña.';
          this.errorMessage.set(msg);
        },
      });
  }
}
