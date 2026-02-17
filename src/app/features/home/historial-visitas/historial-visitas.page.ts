import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonButton,
} from '@ionic/angular/standalone';

import { AuthStateService } from '../../../core/data/services/auth-state.service';
import { VisitsApiService } from '../../../core/data/services/visits-api.service';
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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonButton,
  ],
})
export class HistorialVisitasPage implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly visitsApi = inject(VisitsApiService);

  readonly visits = signal<VisitResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly isVigilante = this.authState.isVigilancia;
  readonly pageTitle = computed(() =>
    this.isVigilante() ? 'Bitácora de escaneos' : 'Historial de visitas'
  );
  readonly pageSubtitle = computed(() =>
    this.isVigilante()
      ? 'Visitas en las que registraste entrada o salida'
      : 'Tus visitas registradas. Aquí puedes recuperar el código QR.'
  );

  ngOnInit(): void {
    this.visitsApi.list().subscribe({
      next: (list) => {
        this.visits.set(list);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.error?.message ??
          err.error?.error ??
          'No se pudo cargar el historial.';
        this.error.set(typeof msg === 'string' ? msg : 'Error al cargar.');
      },
    });
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

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      used: 'Visita en progreso',
      finished: 'Finalizada',
      expired: 'Expirada',
      cancelled: 'Cancelada',
    };
    return map[status] ?? status;
  }

  canCancel(v: VisitResponse): boolean {
    return v.status === 'pending';
  }

  cancelVisit(v: VisitResponse): void {
    if (!this.canCancel(v)) return;
    if (!confirm(`¿Cancelar la visita de ${v.visitorName}? El código QR dejará de ser válido.`)) {
      return;
    }
    const cancellingId = v.id;
    this.visitsApi.cancel(cancellingId).subscribe({
      next: (updated) => {
        this.visits.update((list) =>
          list.map((item) => (item.id === cancellingId ? updated : item))
        );
      },
      error: (err) => {
        const msg =
          err.error?.message ??
          err.error?.error ??
          'No se pudo cancelar la visita.';
        alert(typeof msg === 'string' ? msg : 'Error al cancelar.');
      },
    });
  }
}
