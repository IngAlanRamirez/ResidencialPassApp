import {
  Component,
  OnInit,
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
  IonIcon,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fingerPrintOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';

import { AuthApiService } from '../../../core/data/services/auth-api.service';
import { AuthStateService } from '../../../core/data/services/auth-state.service';
import { DeviceIdService } from '../../../core/data/services/device-id.service';
import { BiometricService } from '../../../core/data/services/biometric.service';
import { ToastService } from '../../../core/data/services/toast.service';

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
    IonIcon,
  ],
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly deviceId = inject(DeviceIdService);
  private readonly biometric = inject(BiometricService);
  private readonly toast = inject(ToastService);
  private readonly alertCtrl = inject(AlertController);
  private readonly navCtrl = inject(NavController);
  private readonly destroy$ = new Subject<void>();

  readonly loadingSubmit = signal(false);
  readonly loadingBiometric = signal(false);
  readonly biometricAvailable = signal(false);
  readonly biometricLabel = signal('biometría');

  constructor() {
    addIcons({ fingerPrintOutline });
  }

  form = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async ngOnInit(): Promise<void> {
    const enabled = await this.biometric.isEnabled();
    const available = await this.biometric.isAvailable();
    this.biometricAvailable.set(enabled && available);
    if (enabled && available) {
      this.biometricLabel.set(await this.biometric.getBiometryLabel());
      this.loginWithBiometric();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loginWithBiometric(): Promise<void> {
    this.loadingBiometric.set(true);
    const success = await this.biometric.authenticateAndLogin();
    this.loadingBiometric.set(false);

    if (success) {
      this.navCtrl.navigateRoot('/home', { replaceUrl: true });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const phone = raw.phone!.trim();
    const password = raw.password!;
    this.loadingSubmit.set(true);
    const deviceIdVal = await this.deviceId.getDeviceId();

    this.authApi
      .login({ phone, password, deviceId: deviceIdVal })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          this.loadingSubmit.set(false);
          this.authState.setSession(res.accessToken, {
            id: res.user.id,
            phone: res.user.phone,
            role: res.user.role as 'vecino' | 'admin' | 'vigilancia',
          });
          await this.offerBiometricSetup(phone, password);
          this.navCtrl.navigateRoot('/home', { replaceUrl: true });
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          const msg =
            err.error?.message ??
            err.message ??
            'Error al iniciar sesión. Revisa tu teléfono y contraseña.';
          this.toast.error(msg);
        },
      });
  }

  private async offerBiometricSetup(phone: string, password: string): Promise<void> {
    const alreadyEnabled = await this.biometric.isEnabled();
    if (alreadyEnabled) {
      await this.biometric.enableBiometric(phone, password);
      return;
    }

    const available = await this.biometric.isAvailable();
    if (!available) return;

    const label = await this.biometric.getBiometryLabel();

    return new Promise<void>((resolve) => {
      this.alertCtrl
        .create({
          header: 'Inicio rápido',
          message: `¿Deseas activar el inicio de sesión con ${label}?`,
          buttons: [
            {
              text: 'No, gracias',
              role: 'cancel',
              handler: () => resolve(),
            },
            {
              text: 'Activar',
              handler: async () => {
                await this.biometric.enableBiometric(phone, password);
                this.toast.success(`Inicio con ${label} activado.`);
                resolve();
              },
            },
          ],
        })
        .then((alert) => alert.present());
    });
  }
}
