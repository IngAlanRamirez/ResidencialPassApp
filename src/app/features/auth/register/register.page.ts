import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';

import { Router } from '@angular/router';
import { StreetsApiService } from '../../../core/data/services/streets-api.service';
import { AuthApiService } from '../../../core/data/services/auth-api.service';
import { DeviceIdService } from '../../../core/data/services/device-id.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { Street } from '../../../core/domain/models/street.model';
import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import { RpInputComponent } from '../../../shared/components/rp-input/rp-input.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonSpinner,
    RpButtonComponent,
    RpInputComponent,
  ],
})
export class RegisterPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly streetsApi = inject(StreetsApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly deviceId = inject(DeviceIdService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly streets = signal<Street[]>([]);
  readonly loadingStreets = signal(true);
  readonly loadingSubmit = signal(false);
  readonly currentStep = signal<1 | 2 | 3>(1);

  readonly hasStreetsError = computed(
    () => !this.loadingStreets() && this.streets().length === 0
  );

  readonly registerForm: FormGroup = this.fb.group({
    street: ['', Validators.required],
    number: ['', [Validators.required, Validators.maxLength(20)]],
    letter: [''],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{10,}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  /** Validez paso 1 vía `toSignal` + `registerForm.events` (misma idea que merge(statusChanges, valueChanges)). */
  readonly step1Valid = toSignal(
    this.registerForm.events.pipe(map(() => this.computeStep1Valid())),
    { initialValue: this.computeStep1Valid() }
  );

  readonly step2Valid = toSignal(
    this.registerForm.events.pipe(map(() => this.computeStep2Valid())),
    { initialValue: this.computeStep2Valid() }
  );

  private computeStep1Valid(): boolean {
    const street = this.registerForm.get('street');
    const numberCtrl = this.registerForm.get('number');
    return !!(street?.valid && numberCtrl?.valid);
  }

  private computeStep2Valid(): boolean {
    const f = this.registerForm;
    const passwordsMatch =
      f.get('password')?.value === f.get('confirmPassword')?.value;
    return !!(
      f.get('phone')?.valid &&
      f.get('password')?.valid &&
      f.get('confirmPassword')?.valid &&
      passwordsMatch
    );
  }

  ngOnInit(): void {
    this.loadStreets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.location.back();
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step < 3) this.currentStep.set((step + 1) as 1 | 2 | 3);
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 1) this.currentStep.set((step - 1) as 1 | 2 | 3);
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
    if (this.currentStep() !== 3) {
      return;
    }

    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      this.registerForm.get('confirmPassword')?.setErrors({ mismatch: true });
      this.toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const raw = this.registerForm.getRawValue();
    const letter = raw.letter?.trim() || undefined;
    this.loadingSubmit.set(true);
    const deviceIdVal = await this.deviceId.getDeviceId();

    this.authApi
      .register({
        street: raw.street.trim(),
        number: raw.number.trim(),
        letter,
        phone: raw.phone.trim(),
        password: raw.password,
        deviceId: deviceIdVal,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          this.loadingSubmit.set(false);
          this.registerForm.reset();
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
