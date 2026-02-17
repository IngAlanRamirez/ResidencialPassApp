import {
  Component,
  inject,
  signal,
  OnDestroy,
  AfterViewInit,
  PLATFORM_ID,
} from '@angular/core';
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
} from '@ionic/angular/standalone';
import type { Html5Qrcode } from 'html5-qrcode';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';

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
  ],
})
export class EscanearVisitaPage implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly visitsApi = inject(VisitsApiService);

  readonly scannedVisitId = signal<string | null>(null);
  readonly scanStatus = signal<{ entryScanned: boolean; exitScanned: boolean } | null>(null);
  readonly status = signal<'idle' | 'scanning' | 'loading_status' | 'scanned' | 'loading' | 'success' | 'error'>('scanning');
  readonly message = signal<string>('');
  /** Comentario o incidencia al registrar la salida (solo cuando canRegisterExit). */
  exitComment = signal('');

  private html5QrCode: Html5Qrcode | null = null;
  readonly readerId = 'qr-reader-escanear-visita';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.startScanner(), 100);
  }

  ngOnDestroy(): void {
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

    this.visitsApi.getScanStatus(id).subscribe({
      next: (st) => {
        this.scanStatus.set(st);
        this.status.set('scanned');
      },
      error: () => {
        this.status.set('error');
        this.message.set('No se pudo obtener el estado de la visita.');
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

    this.status.set('loading');
    this.message.set('');

    const comment = eventType === 'exit' ? this.exitComment() : undefined;
    this.visitsApi.scan(visitId, eventType, comment).subscribe({
      next: () => {
        this.status.set('success');
        this.message.set(
          eventType === 'entry'
            ? 'Entrada registrada correctamente.'
            : 'Salida registrada correctamente.'
        );
        this.scannedVisitId.set(null);
        this.scanStatus.set(null);
        this.exitComment.set('');
        setTimeout(() => this.startScanner(), 2000);
      },
      error: (err) => {
        this.status.set('error');
        const msg =
          err.error?.message ??
          err.error?.error ??
          'No se pudo registrar. Intenta de nuevo.';
        this.message.set(typeof msg === 'string' ? msg : 'Error al registrar.');
      },
    });
  }

  scanAgain(): void {
    this.scannedVisitId.set(null);
    this.scanStatus.set(null);
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

  onExitCommentInput(ev: Event): void {
    const e = ev as CustomEvent<{ value?: string }>;
    const value = e.detail?.value ?? (ev.target as HTMLIonTextareaElement)?.value ?? '';
    this.exitComment.set(value ?? '');
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
