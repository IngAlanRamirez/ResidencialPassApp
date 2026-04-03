import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RpBadgeStatus =
  | 'pending'
  | 'used'
  | 'finished'
  | 'expired'
  | 'cancelled'
  | 'active'
  | 'suspended';
export type RpBadgeRole = 'vecino' | 'admin' | 'vigilancia';

const STATUS_LABELS: Record<RpBadgeStatus, string> = {
  pending: 'Pendiente',
  used: 'En curso',
  finished: 'Completada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
  active: 'Activo',
  suspended: 'Suspendido',
};

const ROLE_LABELS: Record<RpBadgeRole, string> = {
  vecino: 'Vecino',
  admin: 'Administrador',
  vigilancia: 'Vigilancia',
};

@Component({
  selector: 'rp-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rp-badge.component.html',
  styleUrls: ['./rp-badge.component.scss'],
})
export class RpBadgeComponent {
  @Input() status?: RpBadgeStatus;
  @Input() role?: RpBadgeRole;

  get label(): string {
    if (this.status) return STATUS_LABELS[this.status] ?? this.status;
    if (this.role) return ROLE_LABELS[this.role] ?? this.role;
    return '';
  }

  get modifier(): string {
    return this.status ?? this.role ?? '';
  }
}
