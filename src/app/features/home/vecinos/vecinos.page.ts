import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  AlertController,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import { ToastService } from '../../../core/data/services/toast.service';
import type { VecinoListItem } from '../../../core/domain/models/user.model';

@Component({
  selector: 'app-vecinos',
  templateUrl: './vecinos.page.html',
  styleUrls: ['./vecinos.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonBackButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonSpinner,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class VecinosPage implements OnInit, OnDestroy {
  private readonly api = inject(UsersApiService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly list = signal<VecinoListItem[]>([]);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly loading = signal(true);
  readonly processingId = signal<string | null>(null);

  readonly filteredList = computed(() => {
    let items = this.list();
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (q) {
      items = items.filter((item) => {
        const address = this.formatAddress(item);
        const searchable = `${item.phone} ${address} ${item.street} ${item.number} ${item.letter ?? ''} ${this.statusLabel(item.status)}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    if (status === 'active') {
      items = items.filter((item) => (item.status ?? '').toLowerCase() === 'active');
    } else if (status === 'inactive') {
      items = items.filter((item) => (item.status ?? '').toLowerCase() === 'inactive');
    }

    return items;
  });

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
      .getVecinos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.list.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar la lista de vecinos.');
          this.loading.set(false);
        },
      });
  }

  handleRefresh(event: Event): void {
    const ev = event as CustomEvent<{ target: HTMLIonRefresherElement }>;
    this.api
      .getVecinos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.list.set(data);
          ev.detail.target.complete();
        },
        error: () => {
          this.toast.error('No se pudo actualizar la lista.');
          ev.detail.target.complete();
        },
      });
  }

  isActive(item: VecinoListItem): boolean {
    return (item.status ?? '').toLowerCase() === 'active';
  }

  statusLabel(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'active') return 'Activo';
    if (s === 'inactive') return 'Suspendido';
    if (s === 'pending') return 'Pendiente';
    return status ?? '';
  }

  formatAddress(item: VecinoListItem): string {
    const base = `${item.street} ${item.number}`.trim();
    return item.letter?.trim() ? `${base} ${item.letter.trim()}` : base;
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  async confirmSuspend(item: VecinoListItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Suspender cuenta',
      message: `¿Suspender la cuenta de ${item.phone} (${this.formatAddress(item)})? El vecino no podrá iniciar sesión hasta que se reactive.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Suspender',
          role: 'destructive',
          handler: () => this.suspendVecino(item.id),
        },
      ],
    });
    await alert.present();
  }

  async confirmReactivate(item: VecinoListItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Reactivar cuenta',
      message: `¿Reactivar la cuenta de ${item.phone} (${this.formatAddress(item)})? El vecino podrá volver a iniciar sesión.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Reactivar',
          handler: () => this.reactivateVecino(item.id),
        },
      ],
    });
    await alert.present();
  }

  suspendVecino(id: string): void {
    this.processingId.set(id);
    this.api
      .suspendVecino(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.list.update((arr) =>
            arr.map((v) => (v.id === id ? { ...v, status: 'inactive' } : v))
          );
          this.toast.success('Cuenta suspendida correctamente.');
          this.processingId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo suspender la cuenta.');
          this.processingId.set(null);
        },
      });
  }

  onSearchInput(ev: Event): void {
    const e = ev as CustomEvent<{ value?: string }>;
    this.searchQuery.set(e.detail?.value ?? '');
  }

  onStatusFilterChange(ev: Event): void {
    const e = ev as CustomEvent<{ value?: string }>;
    const v = e.detail?.value ?? 'all';
    this.statusFilter.set((v === 'active' || v === 'inactive' ? v : 'all') as 'all' | 'active' | 'inactive');
  }

  reactivateVecino(id: string): void {
    this.processingId.set(id);
    this.api
      .reactivateVecino(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.list.update((arr) =>
            arr.map((v) => (v.id === id ? { ...v, status: 'active' } : v))
          );
          this.toast.success('Cuenta reactivada correctamente.');
          this.processingId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo reactivar la cuenta.');
          this.processingId.set(null);
        },
      });
  }
}
