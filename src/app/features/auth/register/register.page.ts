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
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { StreetsApiService } from '../../../core/data/services/streets-api.service';
import { AuthApiService } from '../../../core/data/services/auth-api.service';
import { DeviceIdService } from '../../../core/data/services/device-id.service';
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
  ],
})
export class RegisterPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly streetsApi = inject(StreetsApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly deviceId = inject(DeviceIdService);
  private readonly destroy$ = new Subject<void>();

  readonly streets = signal<Street[]>([]);
  readonly loadingStreets = signal(true);
  readonly loadingSubmit = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

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
          this.errorMessage.set('No se pudo cargar la lista de calles.');
        },
      });
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const letter = raw.letter?.trim() || undefined;
    this.loadingSubmit.set(true);

    this.authApi
      .register({
        street: raw.street.trim(),
        number: raw.number.trim(),
        letter,
        phone: raw.phone.trim(),
        password: raw.password,
        deviceId: this.deviceId.getDeviceId(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loadingSubmit.set(false);
          this.successMessage.set(res.message);
          this.form.reset();
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          const msg =
            err.error?.message ??
            err.message ??
            'Error al registrar. Intenta de nuevo.';
          this.errorMessage.set(msg);
        },
      });
  }
}
