import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, NavController } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { AuthApiService } from '../../../core/data/services/auth-api.service';
import { AuthStateService } from '../../../core/data/services/auth-state.service';
import { DeviceIdService } from '../../../core/data/services/device-id.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import { RpInputComponent } from '../../../shared/components/rp-input/rp-input.component';

const REMEMBER_PHONE_KEY = 'rp_remember_phone';
const REMEMBER_PASS_KEY = 'rp_remember_pass';
const REMEMBER_FLAG_KEY = 'rp_remember_enabled';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    RpButtonComponent,
    RpInputComponent,
  ],
})
export class LoginPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly deviceId = inject(DeviceIdService);
  private readonly toast = inject(ToastService);
  private readonly navCtrl = inject(NavController);
  private readonly location = inject(Location);
  private readonly destroy$ = new Subject<void>();

  readonly loadingSubmit = signal(false);
  readonly rememberPassword = signal(false);

  readonly loginForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly phoneError = computed(() => {
    const ctrl = this.loginForm.get('phone');
    if (ctrl?.invalid && ctrl?.touched) return 'Teléfono requerido';
    return '';
  });

  readonly passwordError = computed(() => {
    const ctrl = this.loginForm.get('password');
    if (ctrl?.invalid && ctrl?.touched) return 'Contraseña requerida';
    return '';
  });

  ngOnInit(): void {
    this.loadSavedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.location.back();
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const raw = this.loginForm.getRawValue();
    const phone = raw.phone!.trim();
    const password = raw.password!;
    this.loadingSubmit.set(true);
    const deviceIdVal = await this.deviceId.getDeviceId();

    this.authApi
      .login({ phone, password, deviceId: deviceIdVal })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingSubmit.set(false);
          this.authState.setSession(res.accessToken, {
            id: res.user.id,
            phone: res.user.phone,
            role: res.user.role as 'vecino' | 'admin' | 'vigilancia',
          });
          this.saveOrClearCredentials(phone, password);
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

  private loadSavedCredentials(): void {
    try {
      const enabled = localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
      if (enabled) {
        const phone = localStorage.getItem(REMEMBER_PHONE_KEY) ?? '';
        const password = localStorage.getItem(REMEMBER_PASS_KEY) ?? '';
        if (phone && password) {
          this.loginForm.patchValue({ phone, password });
          this.rememberPassword.set(true);
        }
      }
    } catch {
      // localStorage no disponible
    }
  }

  private saveOrClearCredentials(phone: string, password: string): void {
    try {
      if (this.rememberPassword()) {
        localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
        localStorage.setItem(REMEMBER_PHONE_KEY, phone);
        localStorage.setItem(REMEMBER_PASS_KEY, password);
      } else {
        localStorage.removeItem(REMEMBER_FLAG_KEY);
        localStorage.removeItem(REMEMBER_PHONE_KEY);
        localStorage.removeItem(REMEMBER_PASS_KEY);
      }
    } catch {
      // localStorage no disponible
    }
  }
}
