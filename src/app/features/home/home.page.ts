import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
} from '@ionic/angular/standalone';

import { AuthStateService } from '../../core/data/services/auth-state.service';
import { UsersApiService } from '../../core/data/services/users-api.service';
import type { UserProfile } from '../../core/domain/models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
  ],
})
export class HomePage implements OnInit {
  readonly authState = inject(AuthStateService);
  private readonly usersApi = inject(UsersApiService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loadingProfile = signal(true);
  readonly profileError = signal(false);

  readonly welcomeTitle = computed(() => {
    const p = this.profile();
    if (!p) return '';
    if (p.role === 'vigilancia') return 'Buenas tardes';
    const addr = p.address;
    if (addr) {
      const parte = `${addr.street} ${addr.number}`.trim();
      const letra = addr.letter?.trim();
      return letra ? `Bienvenido, ${parte} ${letra}` : `Bienvenido, ${parte}`;
    }
    return p.role === 'admin' ? 'Bienvenido, Administrador' : 'Bienvenido';
  });

  readonly welcomeSubtitle = computed(() => {
    const p = this.profile();
    if (!p) return 'Bienvenido al acceso del fraccionamiento.';
    if (p.role === 'vigilancia') return '';
    return 'Bienvenido al acceso del fraccionamiento.';
  });

  ngOnInit(): void {
    this.usersApi.getMe().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loadingProfile.set(false);
        this.profileError.set(false);
      },
      error: () => {
        this.loadingProfile.set(false);
        this.profileError.set(true);
      },
    });
  }
}
