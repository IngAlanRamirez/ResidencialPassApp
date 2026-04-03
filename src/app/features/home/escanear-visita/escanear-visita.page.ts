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
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import type { Html5Qrcode } from 'html5-qrcode';

import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import {
  RpBadgeComponent,
  type RpBadgeStatus,
} from '../../../shared/components/rp-badge/rp-badge.component';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import { ToastService } from '../../../core/data/services/toast.service';
import {
  VISIT_REASON_OPTIONS,
  type IdentificationType,
} from '../../../core/domain/models/visit.model';

@Component({
  selector: 'app-escanear-visita',
  templateUrl: './escanear-visita.page.html',
  styleUrls: ['./escanear-visita.page.scss'],
  standalone: true,
  imports: [IonContent, IonSpinner, RpButtonComponent, RpBadgeComponent],
})
export class EscanearVisitaPage implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly toast = inject(ToastService);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly destroy$ = new Subject<void>();

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
  readonly status = signal<
    'idle' | 'scanning' | 'loading_status' | 'scanned' | 'loading' | 'success' | 'error'
  >('scanning');
  readonly message = signal<string>('');

  readonly idType = signal<IdentificationType>('ine');
  readonly entryHasVehicle = signal(false);
  readonly entryLicensePlate = signal('');
  readonly exitComment = signal('');

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
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => this.onScanSuccess(decodedText),
        () => {}
      );
    } catch {
      this.status.set('error');
      this.message.set(
        'No se pudo acceder a la cámara. Revisá los permisos o usá HTTPS.'
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

  scanBadgeStatus(): RpBadgeStatus {
    const st = this.scanStatus();
    if (!st) return 'pending';
    if (st.entryScanned && st.exitScanned) return 'finished';
    if (st.entryScanned) return 'used';
    return 'pending';
  }

  registerAccess(): void {
    if (this.canRegisterEntry()) {
      void this.registerEvent('entry');
    } else if (this.canRegisterExit()) {
      void this.registerEvent('exit');
    }
  }

  async registerEvent(eventType: 'entry' | 'exit'): Promise<void> {
    const visitId = this.scannedVisitId();
    if (!visitId) return;

    if (eventType === 'entry') {
      const idType = this.idType();
      if (!idType) {
        this.toast.error('Seleccioná el medio de identificación.');
        return;
      }
      if (this.entryHasVehicle() && !this.entryLicensePlate().trim()) {
        this.toast.error('Ingresá la placa del vehículo.');
        return;
      }
    }

    this.status.set('loading');
    this.message.set('');

    const options =
      eventType === 'entry'
        ? {
            identificationType: this.idType(),
            hasVehicle: this.entryHasVehicle(),
            licensePlate: this.entryHasVehicle()
              ? this.entryLicensePlate().trim()
              : undefined,
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
          this.idType.set('ine');
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
            'No se pudo registrar. Intentá de nuevo.';
          this.message.set(typeof msg === 'string' ? msg : 'Error al registrar.');
          this.toast.error(typeof msg === 'string' ? msg : 'Error al registrar.');
        },
      });
  }

  scanAgain(): void {
    this.scannedVisitId.set(null);
    this.scanStatus.set(null);
    this.idType.set('ine');
    this.entryHasVehicle.set(false);
    this.entryLicensePlate.set('');
    this.exitComment.set('');
    this.status.set('scanning');
    this.message.set('');
    setTimeout(() => this.startScanner(), 150);
  }

  toggleHasVehicle(): void {
    this.entryHasVehicle.update((h) => !h);
    if (!this.entryHasVehicle()) this.entryLicensePlate.set('');
  }

  onLicensePlateInput(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.entryLicensePlate.set(v);
  }

  onExitCommentInput(ev: Event): void {
    const v = (ev.target as HTMLTextAreaElement).value;
    this.exitComment.set(v);
  }

  canRegisterEntry(): boolean {
    const st = this.scanStatus();
    return st !== null && !st.entryScanned;
  }

  canRegisterExit(): boolean {
    const st = this.scanStatus();
    return st !== null && st.entryScanned && !st.exitScanned;
  }

  isVisitFinished(): boolean {
    const st = this.scanStatus();
    return st !== null && st.entryScanned && st.exitScanned;
  }

  reasonLabel(value: string | null | undefined): string {
    if (value == null) return '—';
    return this.reasonOptions.find((o) => o.value === value)?.label ?? value;
  }

  goBack(): void {
    void this.stopScanner();
    this.router.navigate(['/home']);
  }

  async confirmLogout(): Promise<void> {
    await this.logoutPrompt.prompt();
  }
}
