import {
  Component,
  inject,
  signal,
  OnDestroy,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonSpinner,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonInput,
} from '@ionic/angular/standalone';
import type { Html5Qrcode } from 'html5-qrcode';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import {
  IDENTIFICATION_TYPE_OPTIONS,
  VISIT_REASON_OPTIONS,
  type IdentificationType,
} from '../../../core/domain/models/visit.model';

@Component({
  selector: 'app-escanear-visita',
  templateUrl: './escanear-visita.page.html',
  styleUrls: ['./escanear-visita.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonSpinner,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonInput,
  ],
})
export class EscanearVisitaPage implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly identificationOptions = IDENTIFICATION_TYPE_OPTIONS;
  readonly reasonOptions = VISIT_REASON_OPTIONS;
  readonly scannedVisitId = signal<string | null>(null);
  readonly scanStatus = signal<{
    entryScanned: boolean;
    exitScanned: boolean;
    visitorName: string;
    domicilio: string;
    reason: string;
    description: string | null;
  } | null>(null);
  readonly status = signal<'idle' | 'scanning' | 'loading_status' | 'scanned' | 'loading' | 'success' | 'error'>('scanning');
  readonly message = signal<string>('');
  /** Medio de identificación al registrar entrada (solo cuando canRegisterEntry). */
  entryIdentificationType = signal<IdentificationType>('ine');
  /** Si el visitante entra con vehículo (solo al registrar entrada). */
  entryHasVehicle = signal(false);
  /** Placa del vehículo (solo cuando entryHasVehicle). */
  entryLicensePlate = signal('');
  /** Comentario o incidencia al registrar la salida (solo cuando canRegisterExit). */
  exitComment = signal('');

  private html5QrCode: Html5Qrcode | null = null;
  readonly readerId = 'qr-reader-escanear-visita';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.startScanner(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopScanner();
  }

  private async startScanner(): Promise<void> {
    if (this.html5QrCode?.isScanning) return;
    this.scannedVisitId.set(null);
    this.message.set('');
    this.status.set('scanning');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      await new Promise((r) => setTimeout(r, 50));
      this.html5QrCode = new Html5Qrcode(this.readerId);
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => this.onScanSuccess(decodedText),
        () => {}
      );
    } catch (err) {
      this.status.set('error');
      this.message.set(
        'No se pudo acceder a la cámara. Revisa los permisos o usa HTTPS.'
      );
      this.toast.error(this.message());
    }
  }

  private async onScanSuccess(decodedText: string): Promise<void> {
    const id = decodedText?.trim();
    if (!id) return;
    await this.stopScanner();
    this.scannedVisitId.set(id);
    this.scanStatus.set(null);
    this.status.set('loading_status');
    this.message.set('');

    this.visitsApi
      .getScanStatus(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (st) => {
        this.scanStatus.set(st);
        this.status.set('scanned');
      },
      error: () => {
        this.status.set('error');
        this.message.set('No se pudo obtener el estado de la visita.');
        this.toast.error('No se pudo obtener el estado de la visita.');
      },
    });
  }

  private async stopScanner(): Promise<void> {
    if (!this.html5QrCode) return;
    try {
      if (this.html5QrCode.isScanning) {
        await this.html5QrCode.stop();
      }
    } catch {
      // ignore
    }
    this.html5QrCode = null;
  }

  async registerEvent(eventType: 'entry' | 'exit'): Promise<void> {
    const visitId = this.scannedVisitId();
    if (!visitId) return;

    if (eventType === 'entry') {
      const idType = this.entryIdentificationType();
      if (!idType) {
        this.toast.error('Selecciona el medio de identificación.');
        return;
      }
      if (this.entryHasVehicle() && !this.entryLicensePlate().trim()) {
        this.toast.error('Ingresa la placa del vehículo.');
        return;
      }
    }

    this.status.set('loading');
    this.message.set('');

    const options =
      eventType === 'entry'
        ? {
            identificationType: this.entryIdentificationType(),
            hasVehicle: this.entryHasVehicle(),
            licensePlate: this.entryHasVehicle() ? this.entryLicensePlate().trim() : undefined,
          }
        : { exitComment: this.exitComment() };
    this.visitsApi
      .scan(visitId, eventType, options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: () => {
        const msg =
          eventType === 'entry'
            ? 'Entrada registrada correctamente.'
            : 'Salida registrada correctamente.';
        this.status.set('success');
        this.message.set(msg);
        this.toast.success(msg);
        this.scannedVisitId.set(null);
        this.scanStatus.set(null);
        this.entryIdentificationType.set('ine');
        this.entryHasVehicle.set(false);
        this.entryLicensePlate.set('');
        this.exitComment.set('');
        setTimeout(() => this.router.navigate(['/home'], { replaceUrl: true }), 1500);
      },
      error: (err) => {
        this.status.set('error');
        const msg =
          err.error?.message ??
          err.error?.error ??
          'No se pudo registrar. Intenta de nuevo.';
        this.message.set(typeof msg === 'string' ? msg : 'Error al registrar.');
        this.toast.error(typeof msg === 'string' ? msg : 'Error al registrar.');
      },
    });
  }

  scanAgain(): void {
    this.scannedVisitId.set(null);
    this.scanStatus.set(null);
    this.entryIdentificationType.set('ine');
    this.entryHasVehicle.set(false);
    this.entryLicensePlate.set('');
    this.exitComment.set('');
    this.status.set('scanning');
    this.message.set('');
    setTimeout(() => this.startScanner(), 150);
  }

  /** Solo se puede registrar entrada si aún no se ha escaneado la entrada. */
  canRegisterEntry(): boolean {
    const st = this.scanStatus();
    return st !== null && !st.entryScanned;
  }

  /** Solo se puede registrar salida si ya se registró la entrada y no la salida. */
  canRegisterExit(): boolean {
    const st = this.scanStatus();
    return st !== null && st.entryScanned && !st.exitScanned;
  }

  /** Visita ya completada (entrada y salida registradas). */
  isVisitFinished(): boolean {
    const st = this.scanStatus();
    return st !== null && st.entryScanned && st.exitScanned;
  }

  reasonLabel(value: string | null | undefined): string {
    if (value == null) return '—';
    return this.reasonOptions.find((o) => o.value === value)?.label ?? value;
  }

  onEntryIdentificationChange(ev: Event): void {
    const e = ev as CustomEvent<{ value?: IdentificationType }>;
    const value = e.detail?.value ?? (ev.target as HTMLIonSelectElement)?.value;
    if (value) this.entryIdentificationType.set(value as IdentificationType);
  }

  onEntryHasVehicleChange(ev: Event): void {
    const e = ev as CustomEvent<{ checked?: boolean }>;
    this.entryHasVehicle.set(!!e.detail?.checked);
    if (!e.detail?.checked) this.entryLicensePlate.set('');
  }

  onEntryLicensePlateInput(ev: Event): void {
    const e = ev as CustomEvent<{ value?: string | number }>;
    const raw = e.detail?.value ?? (ev.target as HTMLIonInputElement)?.value ?? '';
    this.entryLicensePlate.set(String(raw ?? ''));
  }

  onExitCommentInput(ev: Event): void {
    const e = ev as CustomEvent<{ value?: string }>;
    const value = e.detail?.value ?? (ev.target as HTMLIonTextareaElement)?.value ?? '';
    this.exitComment.set(value ?? '');
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
