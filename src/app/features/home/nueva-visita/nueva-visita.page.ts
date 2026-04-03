import {
  Component,
  inject,
  signal,
  computed,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import { RpInputComponent } from '../../../shared/components/rp-input/rp-input.component';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { UsersApiService } from '../../../core/data/services/users-api.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import {
  VISIT_REASON_OPTIONS,
  type VisitReason,
} from '../../../core/domain/models/visit.model';
import type { UserProfile } from '../../../core/domain/models/user.model';

@Component({
  selector: 'app-nueva-visita',
  templateUrl: './nueva-visita.page.html',
  styleUrls: ['./nueva-visita.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    RpButtonComponent,
    RpInputComponent,
  ],
})
export class NuevaVisitaPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly destroy$ = new Subject<void>();

  readonly reasonOptions = VISIT_REASON_OPTIONS;
  readonly scheduleType = signal<'open' | 'datetime'>('open');
  readonly loadingSubmit = signal(false);
  readonly profile = signal<UserProfile | null>(null);

  readonly addressLabel = computed(() => {
    const a = this.profile()?.address;
    if (!a?.street && !a?.number) return 'Tu domicilio';
    const base = `${a.street} ${a.number}`.trim();
    return a.letter ? `${base} ${a.letter}` : base;
  });

  form = this.fb.group({
    visitorName: ['', [Validators.required, Validators.maxLength(200)]],
    reason: ['visitante' as VisitReason, Validators.required],
    entryAt: [''],
    exitAt: [''],
    description: [''],
  });

  get minEntryLocal(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  get minExitLocal(): string {
    if (this.scheduleType() === 'open') return this.minEntryLocal;
    const entryVal = this.form.get('entryAt')?.value;
    if (!entryVal) return this.minEntryLocal;
    const entry = new Date(entryVal);
    entry.setMinutes(entry.getMinutes() + 1);
    const y = entry.getFullYear();
    const m = String(entry.getMonth() + 1).padStart(2, '0');
    const d = String(entry.getDate()).padStart(2, '0');
    const h = String(entry.getHours()).padStart(2, '0');
    const min = String(entry.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  ngOnInit(): void {
    this.usersApi
      .getMe()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => this.profile.set(p),
        error: () => this.profile.set(null),
      });
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

  setScheduleType(mode: 'open' | 'datetime'): void {
    this.scheduleType.set(mode);
    if (mode === 'open') {
      this.form.patchValue({ entryAt: '', exitAt: '' });
    }
  }

  onSubmit(): void {
    const raw = this.form.getRawValue();
    const scheduleOpen = this.scheduleType() === 'open';
    const entryOpen = scheduleOpen;
    const exitOpen = scheduleOpen;

    if (!raw.visitorName?.trim() || !raw.reason) {
      this.form.markAllAsTouched();
      return;
    }
    if (!scheduleOpen && !raw.entryAt?.trim()) {
      this.toast.error('Ingresa la fecha y hora de entrada o elegí horario abierto.');
      this.form.get('entryAt')?.markAsTouched();
      return;
    }
    if (!scheduleOpen && !raw.exitAt?.trim()) {
      this.toast.error('Ingresa la fecha y hora de salida o elegí horario abierto.');
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
