import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
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
  IonButton,
  IonSpinner,
  IonModal,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { listOutline } from 'ionicons/icons';
import { Subject, takeUntil } from 'rxjs';

import { RegistrationRequestsApiService } from '../../../core/data/services/registration-requests-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import type {
  RegistrationRequestItem,
  RegistrationRequestHistoryItem,
} from '../../../core/domain/models/registration-request.model';

@Component({
  selector: 'app-registros-pendientes',
  templateUrl: './registros-pendientes.page.html',
  styleUrls: ['./registros-pendientes.page.scss'],
  standalone: true,
  imports: [
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
    IonButton,
    IonSpinner,
    IonModal,
    IonIcon,
  ],
})
export class RegistrosPendientesPage implements OnInit, OnDestroy {
  private readonly api = inject(RegistrationRequestsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly list = signal<RegistrationRequestItem[]>([]);
  readonly loading = signal(true);
  readonly processingId = signal<string | null>(null);

  readonly showLogModal = signal(false);
  readonly historyList = signal<RegistrationRequestHistoryItem[]>([]);
  readonly loadingHistory = signal(false);

  constructor() {
    addIcons({ listOutline });
  }

  ngOnInit(): void {
    this.loadList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadList(): void {
    this.loading.set(true);
    this.api
      .getPending()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.list.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar el listado. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
  }

  approve(item: RegistrationRequestItem): void {
    this.updateStatus(item.id, 'approved');
  }

  reject(item: RegistrationRequestItem): void {
    this.updateStatus(item.id, 'rejected');
  }

  private updateStatus(id: string, status: 'approved' | 'rejected'): void {
    this.processingId.set(id);
    this.api
      .updateStatus(id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.processingId.set(null);
          this.toast.success(res.message);
          this.list.update((items) => items.filter((i) => i.id !== id));
        },
        error: (err) => {
          this.processingId.set(null);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo procesar la solicitud.';
          this.toast.error(typeof msg === 'string' ? msg : 'Error al procesar.');
        },
      });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatAddress(item: RegistrationRequestItem): string {
    const part = `${item.street} ${item.number}`.trim();
    return item.letter?.trim() ? `${part} ${item.letter.trim()}` : part;
  }

  openLogModal(): void {
    this.showLogModal.set(true);
    this.loadHistory();
  }

  closeLogModal(): void {
    this.showLogModal.set(false);
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.api
      .getHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.historyList.set(data);
          this.loadingHistory.set(false);
        },
        error: () => {
          this.loadingHistory.set(false);
          this.historyList.set([]);
        },
      });
  }

  formatHistoryDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  statusLabel(status: string): string {
    return status === 'approved' ? 'Aprobado' : 'Rechazado';
  }
}
