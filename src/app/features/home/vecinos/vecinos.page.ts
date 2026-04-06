import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import { ToastService } from '../../../core/data/services/toast.service';
import type { VecinoListItem } from '../../../core/domain/models/user.model';

@Component({
  selector: 'app-vecinos',
  templateUrl: './vecinos.page.html',
  styleUrls: ['./vecinos.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
  ],
})
export class VecinosPage implements OnInit, OnDestroy {
  private readonly api = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly location = inject(Location);
  private readonly destroy$ = new Subject<void>();

  readonly list = signal<VecinoListItem[]>([]);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly loading = signal(true);
  readonly processingId = signal<string | null>(null);
  readonly dialogState = signal<{ item: VecinoListItem; type: 'suspend' | 'reactivate' } | null>(null);

  readonly countAll = computed(() => this.list().length);
  readonly countActive = computed(() =>
    this.list().filter(i => (i.status ?? '').toLowerCase() === 'active').length
  );
  readonly countInactive = computed(() =>
    this.list().filter(i => (i.status ?? '').toLowerCase() === 'inactive').length
  );

  readonly filteredList = computed(() => {
    let items = this.list();
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    if (q) {
      items = items.filter((item) => {
        const searchable = `${item.phone} ${item.street} ${item.number} ${item.letter ?? ''} ${this.statusLabel(item.status)} ${item.role ?? ''}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    if (status === 'active') {
      items = items.filter(i => (i.status ?? '').toLowerCase() === 'active');
    } else if (status === 'inactive') {
      items = items.filter(i => (i.status ?? '').toLowerCase() === 'inactive');
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

  goBack(): void {
    this.location.back();
  }

  async confirmLogout(): Promise<void> {
    await this.logoutPrompt.prompt();
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
    if (!item.street || item.street === '-') return '—';
    const base = `${item.street} ${item.number}`.trim();
    return item.letter?.trim() ? `${base} ${item.letter.trim()}` : base;
  }

  avatarInitials(item: VecinoListItem): string {
    const words = `${item.street} ${item.number}`
      .split(/\s+/)
      .filter(w => w.replace(/[^a-zA-ZÀ-ÿ]/g, '').length >= 3);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  setStatusFilter(v: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(v);
  }

  onSearchInput(ev: Event): void {
    this.searchQuery.set((ev.target as HTMLInputElement).value);
  }

  openDialog(item: VecinoListItem): void {
    const type = this.isActive(item) ? 'suspend' : 'reactivate';
    this.dialogState.set({ item, type });
  }

  closeDialog(): void {
    this.dialogState.set(null);
  }

  confirmAction(): void {
    const state = this.dialogState();
    if (!state) return;
    this.closeDialog();
    if (state.type === 'suspend') {
      this.suspendVecino(state.item.id);
    } else {
      this.reactivateVecino(state.item.id);
    }
  }

  suspendVecino(id: string): void {
    this.processingId.set(id);
    this.api
      .suspendVecino(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.list.update(arr => arr.map(v => v.id === id ? { ...v, status: 'inactive' } : v));
          this.toast.success('Cuenta suspendida correctamente.');
          this.processingId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo suspender la cuenta.');
          this.processingId.set(null);
        },
      });
  }

  reactivateVecino(id: string): void {
    this.processingId.set(id);
    this.api
      .reactivateVecino(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.list.update(arr => arr.map(v => v.id === id ? { ...v, status: 'active' } : v));
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
