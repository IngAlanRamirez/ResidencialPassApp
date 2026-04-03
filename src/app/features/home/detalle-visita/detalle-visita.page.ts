import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  IonContent,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import * as QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import {
  RpBadgeComponent,
  type RpBadgeStatus,
} from '../../../shared/components/rp-badge/rp-badge.component';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { AuthStateService } from '../../../core/data/services/auth-state.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import {
  VISIT_REASON_OPTIONS,
  type VisitReason,
  type VisitResponse,
} from '../../../core/domain/models/visit.model';

@Component({
  selector: 'app-detalle-visita',
  templateUrl: './detalle-visita.page.html',
  styleUrls: ['./detalle-visita.page.scss'],
  standalone: true,
  imports: [IonContent, IonSpinner, RpButtonComponent, RpBadgeComponent],
})
export class DetalleVisitaPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly toast = inject(ToastService);
  private readonly alertCtrl = inject(AlertController);
  private readonly authState = inject(AuthStateService);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly destroy$ = new Subject<void>();

  readonly reasonOptions = VISIT_REASON_OPTIONS;
  readonly visit = signal<VisitResponse | null>(null);
  readonly qrDataUrl = signal<string | null>(null);
  readonly loading = signal(true);
  readonly hasError = signal(false);
  readonly sharing = signal(false);
  readonly cancelling = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('Visita no encontrada');
      this.hasError.set(true);
      this.loading.set(false);
      return;
    }

    this.visitsApi
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (v) => {
          this.visit.set(v);
          if (v.status !== 'cancelled') {
            this.generateQR(v.id);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.hasError.set(true);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo cargar la visita.';
          this.toast.error(typeof msg === 'string' ? msg : 'Error al cargar.');
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
        width: 220,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      this.qrDataUrl.set(url);
    } catch {
      this.qrDataUrl.set(null);
    }
  }

  goBack(): void {
    this.location.back();
  }

  async confirmLogout(): Promise<void> {
    await this.logoutPrompt.prompt();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  badgeStatus(status: string): RpBadgeStatus {
    return status as RpBadgeStatus;
  }

  detailLine(v: VisitResponse): string {
    const reason = this.reasonLabel(v.reason);
    if (v.entryOpenSchedule && v.exitOpenSchedule) {
      return `${reason} · Horario abierto`;
    }
    const ref = v.entryAt ?? v.createdAt;
    return `${reason} · ${this.formatDate(ref)}`;
  }

  canCancel(): boolean {
    const v = this.visit();
    if (!v || v.status !== 'pending') return false;
    return !this.authState.isVigilancia();
  }

  async cancelVisit(): Promise<void> {
    const v = this.visit();
    if (!v || !this.canCancel()) return;
    const alert = await this.alertCtrl.create({
      header: 'Cancelar visita',
      message: `¿Cancelar la visita de ${v.visitorName}? El código QR dejará de ser válido.`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => this.doCancelVisit(v.id),
        },
      ],
    });
    await alert.present();
  }

  private doCancelVisit(id: string): void {
    this.cancelling.set(true);
    this.visitsApi
      .cancel(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.cancelling.set(false);
          this.visit.set(updated);
          this.qrDataUrl.set(null);
          this.toast.success('Visita cancelada.');
        },
        error: (err) => {
          this.cancelling.set(false);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo cancelar la visita.';
          this.toast.error(typeof msg === 'string' ? msg : 'Error al cancelar.');
        },
      });
  }

  async shareQR(): Promise<void> {
    const dataUrl = this.qrDataUrl();
    const v = this.visit();
    if (!dataUrl || !v) return;

    this.sharing.set(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await this.shareNative(dataUrl);
      } else {
        this.shareWeb(dataUrl);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.shareWeb(dataUrl);
      }
    } finally {
      this.sharing.set(false);
    }
  }

  private readonly SHARE_LEGEND =
    'Para brindar tu acceso se necesita una identificación y las únicas permitidas son INE, Licencia y Pasaporte.';

  private async shareNative(dataUrl: string): Promise<void> {
    const base64Data = dataUrl.split(',')[1];
    const fileName = `qr-visita-${Date.now()}.png`;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Código QR - Visita',
      text: this.SHARE_LEGEND,
      files: [savedFile.uri],
      dialogTitle: 'Compartir código QR',
    });

    Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }).catch(() => {});
  }

  private shareWeb(dataUrl: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'qr-visita.png';
    link.click();
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

  reasonLabel(value: VisitReason): string {
    return this.reasonOptions.find((o) => o.value === value)?.label ?? value;
  }

  goToNewVisit(): void {
    this.router.navigate(['/home/nueva-visita']);
  }
}
