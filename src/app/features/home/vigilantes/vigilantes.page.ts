import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Location } from '@angular/common';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import { LogoutPromptService } from '../../../core/data/services/logout-prompt.service';
import { ToastService } from '../../../core/data/services/toast.service';
import type { VigilanteListItem } from '../../../core/domain/models/user.model';

@Component({
  selector: 'app-vigilantes',
  templateUrl: './vigilantes.page.html',
  styleUrls: ['./vigilantes.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
  ],
})
export class VigilantesPage implements OnInit, OnDestroy {
  private readonly api = inject(UsersApiService);
  private readonly alertCtrl = inject(AlertController);
  private readonly logoutPrompt = inject(LogoutPromptService);
  private readonly toast = inject(ToastService);
  private readonly location = inject(Location);
  private readonly destroy$ = new Subject<void>();

  readonly list = signal<VigilanteListItem[]>([]);
  readonly loading = signal(true);
  readonly processingId = signal<string | null>(null);

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
      .getVigilantes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.list.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar la lista de vigilantes.');
          this.loading.set(false);
        },
      });
  }

  handleRefresh(event: Event): void {
    const ev = event as CustomEvent<{ target: HTMLIonRefresherElement }>;
    this.api
      .getVigilantes()
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

  avatarInitials(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 4 ? digits.slice(-4, -2) : digits.slice(0, 2);
  }

  isActive(item: VigilanteListItem): boolean {
    return (item.status ?? '').toLowerCase() === 'active';
  }

  statusLabel(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'active') return 'Activo';
    if (s === 'inactive') return 'Inactivo';
    if (s === 'pending') return 'Pendiente';
    return status ?? '';
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

  async confirmDelete(item: VigilanteListItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar vigilante',
      message: `¿Dar de baja al vigilante con teléfono ${item.phone}? Dejará de poder acceder a la aplicación.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteVigilante(item.id),
        },
      ],
    });
    await alert.present();
  }

  deleteVigilante(id: string): void {
    this.processingId.set(id);
    this.api
      .deleteVigilante(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.list.update((arr) => arr.filter((v) => v.id !== id));
          this.toast.success('Vigilante dado de baja correctamente.');
          this.processingId.set(null);
        },
        error: () => {
          this.toast.error('No se pudo dar de baja al vigilante.');
          this.processingId.set(null);
        },
      });
  }
}
