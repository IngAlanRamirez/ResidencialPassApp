import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';

import { RpButtonComponent } from '../../../shared/components/rp-button/rp-button.component';
import {
  RpBadgeComponent,
  type RpBadgeStatus,
} from '../../../shared/components/rp-badge/rp-badge.component';
import { AuthStateService } from '../../../core/data/services/auth-state.service';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import type { VisitResponse } from '../../../core/domain/models/visit.model';
import {
  VISIT_REASON_OPTIONS,
  IDENTIFICATION_TYPE_OPTIONS,
  type VisitReason,
  type IdentificationType,
} from '../../../core/domain/models/visit.model';

@Component({
  selector: 'app-historial-visitas',
  templateUrl: './historial-visitas.page.html',
  styleUrls: ['./historial-visitas.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    RpButtonComponent,
    RpBadgeComponent,
  ],
})
export class HistorialVisitasPage implements OnInit {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly visitsApi = inject(VisitsApiService);
  private readonly toast = inject(ToastService);
  private readonly alertCtrl = inject(AlertController);
  private readonly logoutPrompt = inject(LogoutPromptService);

  readonly visits = signal<VisitResponse[]>([]);
  readonly loading = signal(true);
  readonly hasError = signal(false);

  readonly activeFilter = signal<'all' | 'pending' | 'past'>('all');
  readonly expandedVisitId = signal<string | null>(null);
  readonly cancellingId = signal<string | null>(null);

  readonly filteredVisits = computed(() => {
    const filter = this.activeFilter();
    const list = this.visits();
    if (filter === 'all') return list;
    if (filter === 'pending') {
      return list.filter((v) => v.status === 'pending' || v.status === 'used');
    }
    return list.filter(
      (v) =>
        v.status === 'finished' ||
        v.status === 'expired' ||
        v.status === 'cancelled'
    );
  });

  readonly isVigilante = this.authState.isVigilancia;
  readonly pageTitle = computed(() =>
    this.isVigilante() ? 'Bitácora' : 'Historial'
  );
  readonly pageSubtitle = computed(() =>
    this.isVigilante()
      ? 'Visitas en las que registraste entrada o salida'
      : 'Tus visitas registradas. Tocá una fila para ver más.'
  );

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    this.visitsApi.list().subscribe({
      next: (list) => {
        this.visits.set(list);
        this.loading.set(false);
        this.hasError.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.hasError.set(true);
        const msg =
          err.error?.message ??
          err.error?.error ??
          'No se pudo cargar el historial.';
        this.toast.error(typeof msg === 'string' ? msg : 'Error al cargar.');
      },
    });
  }

  refresh(event: Event): void {
    const ev = event as CustomEvent<{ target: { complete: () => void } }>;
    this.visitsApi.list().subscribe({
      next: (list) => {
        this.visits.set(list);
        this.hasError.set(false);
        ev.detail.target.complete();
      },
      error: () => {
        this.hasError.set(true);
        this.toast.error('No se pudo actualizar el historial.');
        ev.detail.target.complete();
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  async confirmLogout(): Promise<void> {
    await this.logoutPrompt.prompt();
  }

  toggleExpand(id: string): void {
    this.expandedVisitId.update((current) => (current === id ? null : id));
  }

  badgeFromStatus(status: string): RpBadgeStatus {
    return status as RpBadgeStatus;
  }

  listMetaLine(v: VisitResponse): string {
    return `${this.reasonLabel(v.reason)} · ${this.formatDate(v.createdAt)}`;
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
    return VISIT_REASON_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }

  identificationLabel(value: IdentificationType): string {
    return IDENTIFICATION_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
  }

  addressLabel(v: VisitResponse): string {
    const base = `${v.street} ${v.number}`.trim();
    return v.letter ? `${base} ${v.letter}` : base;
  }

  canCancel(v: VisitResponse): boolean {
    return v.status === 'pending';
  }

  canCancelInline(v: VisitResponse): boolean {
    return !this.isVigilante() && this.canCancel(v);
  }

  goToVisitQr(id: string, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/home/visita', id]);
  }

  async cancelVisit(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    const v = this.visits().find((x) => x.id === id);
    if (!v || !this.canCancelInline(v)) return;
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
    this.cancellingId.set(id);
    this.visitsApi.cancel(id).subscribe({
      next: (updated) => {
        this.cancellingId.set(null);
        this.expandedVisitId.set(null);
        this.visits.update((list) =>
          list.map((item) => (item.id === id ? updated : item))
        );
        this.toast.success('Visita cancelada.');
      },
      error: (err) => {
        this.cancellingId.set(null);
        const msg =
          err.error?.message ??
          err.error?.error ??
          'No se pudo cancelar la visita.';
        this.toast.error(typeof msg === 'string' ? msg : 'Error al cancelar.');
      },
    });
  }
}
