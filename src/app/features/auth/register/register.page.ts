import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonText,
  IonBackButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';

import { Router } from '@angular/router';
import { StreetsApiService } from '../../../core/data/services/streets-api.service';
import { AuthApiService } from '../../../core/data/services/auth-api.service';
import { DeviceIdService } from '../../../core/data/services/device-id.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { Street } from '../../../core/domain/models/street.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
    IonText,
    IonBackButton,
    IonButtons,
    IonIcon,
  ],
})
export class RegisterPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly streetsApi = inject(StreetsApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly deviceId = inject(DeviceIdService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly streets = signal<Street[]>([]);
  readonly loadingStreets = signal(true);
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

  readonly hasStreetsError = computed(
    () => !this.loadingStreets() && this.streets().length === 0
  );

  form: FormGroup = this.fb.group({
    street: ['', Validators.required],
    number: ['', [Validators.required, Validators.maxLength(20)]],
    letter: [''],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadStreets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStreets(): void {
    this.loadingStreets.set(true);
    this.streetsApi
      .getStreets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => {
          this.streets.set(list);
          this.loadingStreets.set(false);
        },
        error: () => {
          this.loadingStreets.set(false);
          this.toast.error('No se pudo cargar la lista de calles.');
        },
      });
  }

  async onSubmit(): Promise<void> {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      this.toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const letter = raw.letter?.trim() || undefined;
    this.loadingSubmit.set(true);
    const deviceId = await this.deviceId.getDeviceId();

    this.authApi
      .register({
        street: raw.street.trim(),
        number: raw.number.trim(),
        letter,
        phone: raw.phone.trim(),
        password: raw.password,
        deviceId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          this.loadingSubmit.set(false);
          this.form.reset();
          await this.toast.success(res.message);
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          const msg =
            err.error?.message ??
            err.message ??
            'Error al registrar. Intenta de nuevo.';
          this.toast.error(msg);
        },
      });
  }
}
