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
  AlertController,
} from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';

import { UsersApiService } from '../../../core/data/services/users-api.service';
import type { VigilanteListItem } from '../../../core/domain/models/user.model';

@Component({
  selector: 'app-vigilantes',
  templateUrl: './vigilantes.page.html',
  styleUrls: ['./vigilantes.page.scss'],
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
export class VigilantesPage implements OnInit, OnDestroy {
  private readonly api = inject(UsersApiService);
  private readonly alertCtrl = inject(AlertController);
  private readonly destroy$ = new Subject<void>();

  readonly list = signal<VigilanteListItem[]>([]);
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
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getVigilantes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.list.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la lista de vigilantes.');
          this.loading.set(false);
        },
      });
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
    this.error.set(null);
    this.successMessage.set(null);
    this.api
      .deleteVigilante(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.list.update((arr) => arr.filter((v) => v.id !== id));
          this.successMessage.set('Vigilante dado de baja correctamente.');
          this.processingId.set(null);
        },
        error: () => {
          this.error.set('No se pudo dar de baja al vigilante.');
          this.processingId.set(null);
        },
      });
  }
}
