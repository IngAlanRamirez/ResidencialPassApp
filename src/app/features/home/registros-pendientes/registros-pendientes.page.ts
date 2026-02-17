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
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { RegistrationRequestsApiService } from '../../../core/data/services/registration-requests-api.service';
import type { RegistrationRequestItem } from '../../../core/domain/models/registration-request.model';

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
  ],
})
export class RegistrosPendientesPage implements OnInit, OnDestroy {
  private readonly api = inject(RegistrationRequestsApiService);
  private readonly destroy$ = new Subject<void>();

  readonly list = signal<RegistrationRequestItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly processingId = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadList(): void {
    this.error.set(null);
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
          this.error.set('No se pudo cargar el listado. Intenta de nuevo.');
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
    this.successMessage.set(null);
    this.processingId.set(id);
    this.api
      .updateStatus(id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.processingId.set(null);
          this.successMessage.set(res.message);
          this.list.update((items) => items.filter((i) => i.id !== id));
        },
        error: (err) => {
          this.processingId.set(null);
          const msg =
            err.error?.message ??
            err.error?.error ??
            'No se pudo procesar la solicitud.';
          this.error.set(typeof msg === 'string' ? msg : 'Error al procesar.');
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
}
