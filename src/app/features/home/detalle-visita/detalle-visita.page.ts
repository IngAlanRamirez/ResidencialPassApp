import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import * as QRCode from 'qrcode';

import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import {
  VISIT_REASON_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
  type VisitReason,
  type VisitResponse,
  type IdentificationType,
} from '../../../core/domain/models/visit.model';

@Component({
  selector: 'app-detalle-visita',
  templateUrl: './detalle-visita.page.html',
  styleUrls: ['./detalle-visita.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonSpinner,
    IonIcon,
  ],
})
export class DetalleVisitaPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly destroy$ = new Subject<void>();

  readonly reasonOptions = VISIT_REASON_OPTIONS;
  readonly identificationOptions = IDENTIFICATION_TYPE_OPTIONS;
  readonly visit = signal<VisitResponse | null>(null);
  readonly qrDataUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly sharing = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Visita no encontrada');
      this.loading.set(false);
      return;
    }

    this.visitsApi
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (v) => {
          this.visit.set(v);
          this.generateQR(v.id);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo cargar la visita.';
          this.error.set(typeof msg === 'string' ? msg : 'Error al cargar.');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async generateQR(visitId: string): Promise<void> {
    try {
      const url = await QRCode.toDataURL(visitId, {
        width: 260,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      this.qrDataUrl.set(url);
    } catch {
      this.qrDataUrl.set(null);
    }
  }

  async shareQR(): Promise<void> {
    const dataUrl = this.qrDataUrl();
    const v = this.visit();
    if (!dataUrl || !v) return;

    this.sharing.set(true);
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'qr-visita.png', { type: 'image/png' });

      const title = 'Código QR - Visita';
      const text = `Visita registrada: ${v.visitorName}. Código único de un solo uso.`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({
          title,
          text: `${text} (comparte la captura del QR si tu app no permite enviar la imagen).`,
        });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'qr-visita.png';
        link.click();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'qr-visita.png';
        link.click();
      }
    } finally {
      this.sharing.set(false);
    }
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatEntryExitLabel(v: VisitResponse): { entry: string; exit: string } {
    const entry = v.entryOpenSchedule
      ? 'Abierta (se registrará al escanear en entrada)'
      : this.formatDate(v.entryAt);
    const exit = v.exitOpenSchedule
      ? 'Abierta (se registrará al escanear en salida)'
      : this.formatDate(v.exitAt);
    return { entry, exit };
  }

  reasonLabel(value: VisitReason): string {
    return this.reasonOptions.find((o) => o.value === value)?.label ?? value;
  }

  identificationLabel(value: IdentificationType): string {
    return this.identificationOptions.find((o) => o.value === value)?.label ?? value;
  }

  goToNewVisit(): void {
    this.router.navigate(['/home/nueva-visita']);
  }
}
