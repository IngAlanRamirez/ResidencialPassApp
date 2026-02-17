import {
  Component,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonText,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import {
  VISIT_REASON_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
  type VisitReason,
  type IdentificationType,
} from '../../../core/domain/models/visit.model';

@Component({
  selector: 'app-nueva-visita',
  templateUrl: './nueva-visita.page.html',
  styleUrls: ['./nueva-visita.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonText,
    IonCheckbox,
  ],
})
export class NuevaVisitaPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly reasonOptions = VISIT_REASON_OPTIONS;
  readonly identificationOptions = IDENTIFICATION_TYPE_OPTIONS;
  readonly loadingSubmit = signal(false);

  form = this.fb.group({
    visitorName: ['', [Validators.required, Validators.maxLength(200)]],
    identificationType: ['ine' as IdentificationType, Validators.required],
    reason: ['visitante' as VisitReason, Validators.required],
    entryOpenSchedule: [false],
    exitOpenSchedule: [false],
    entryAt: [''],
    exitAt: [''],
    description: [''],
  });

  /** Mínimo para entrada: inicio del día de hoy (solo visitas de hoy en adelante). */
  get minEntryLocal(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  /** Mínimo para salida: igual a la entrada (para que sea posterior) o hoy si entrada abierta. */
  get minExitLocal(): string {
    const entryOpen = this.form.get('entryOpenSchedule')?.value;
    const entryVal = this.form.get('entryAt')?.value;
    if (entryOpen || !entryVal) return this.minEntryLocal;
    const entry = new Date(entryVal);
    entry.setMinutes(entry.getMinutes() + 1);
    const y = entry.getFullYear();
    const m = String(entry.getMonth() + 1).padStart(2, '0');
    const d = String(entry.getDate()).padStart(2, '0');
    const h = String(entry.getHours()).padStart(2, '0');
    const min = String(entry.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    const raw = this.form.getRawValue();
    const entryOpen = !!raw.entryOpenSchedule;
    const exitOpen = !!raw.exitOpenSchedule;

    if (!raw.visitorName?.trim() || !raw.identificationType || !raw.reason) {
      this.form.markAllAsTouched();
      return;
    }
    if (!entryOpen && !raw.entryAt?.trim()) {
      this.toast.error('Ingresa la fecha y hora de entrada o marca entrada abierta.');
      this.form.get('entryAt')?.markAsTouched();
      return;
    }
    if (!exitOpen && !raw.exitAt?.trim()) {
      this.toast.error('Ingresa la fecha y hora de salida o marca salida abierta.');
      this.form.get('exitAt')?.markAsTouched();
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let entryAt: string | null = null;
    let exitAt: string | null = null;
    if (!entryOpen && raw.entryAt) {
      entryAt = this.toISOWithTimezone(raw.entryAt) ?? raw.entryAt;
      if (new Date(entryAt) < startOfToday) {
        this.toast.error('La fecha de entrada debe ser hoy o en el futuro.');
        return;
      }
    }
    if (!exitOpen && raw.exitAt) {
      exitAt = this.toISOWithTimezone(raw.exitAt) ?? raw.exitAt;
      if (entryAt && new Date(exitAt) <= new Date(entryAt)) {
        this.toast.error('La hora de salida debe ser posterior a la de entrada.');
        return;
      }
      if (new Date(exitAt) < startOfToday) {
        this.toast.error('La fecha de salida debe ser hoy o en el futuro.');
        return;
      }
    }

    this.loadingSubmit.set(true);
    this.visitsApi
      .create({
        visitorName: raw.visitorName!.trim(),
        identificationType: raw.identificationType!,
        reason: raw.reason!,
        entryOpenSchedule: entryOpen,
        exitOpenSchedule: exitOpen,
        entryAt: entryOpen ? null : (entryAt ?? undefined),
        exitAt: exitOpen ? null : (exitAt ?? undefined),
        description: raw.description?.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (visit) => {
          this.loadingSubmit.set(false);
          this.router.navigate(['/home/visita', visit.id], { replaceUrl: true });
        },
        error: (err) => {
          this.loadingSubmit.set(false);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo registrar la visita. Intenta de nuevo.';
          this.toast.error(typeof msg === 'string' ? msg : 'Error al registrar.');
        },
      });
  }

  private toISOWithTimezone(localDateTime: string): string | null {
    if (!localDateTime) return null;
    const d = new Date(localDateTime);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
}
