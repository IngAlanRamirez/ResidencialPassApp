import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonSpinner, AlertController } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AuthStateService } from '../../core/data/services/auth-state.service';
import { UsersApiService } from '../../core/data/services/users-api.service';
import type { UserProfile } from '../../core/domain/models/user.model';
import { RpButtonComponent } from '../../shared/components/rp-button/rp-button.component';
import { RpCardComponent } from '../../shared/components/rp-card/rp-card.component';
import { RpBadgeComponent } from '../../shared/components/rp-badge/rp-badge.component';

type BackButtonListenerHandle = { remove: () => Promise<void> };

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonSpinner,
    RpButtonComponent,
    RpCardComponent,
    RpBadgeComponent,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersApiService);
  private readonly alertCtrl = inject(AlertController);

  private backButtonHandle: BackButtonListenerHandle | null = null;
  private popstateHandler: (() => void) | null = null;

  readonly profile = signal<UserProfile | null>(null);
  readonly loadingProfile = signal(true);
  readonly profileError = signal(false);

  readonly adminStats = signal({
    activeResidents: 0,
    pendingRegistrations: 0,
    guards: 0,
  });

  readonly homeUserName = computed(() => {
    if (this.authState.isAdmin()) return 'Administrador';
    if (this.authState.isVigilancia()) return 'Vigilancia';
    const p = this.profile();
    const phone = p?.phone ?? this.authState.currentUser()?.phone;
    return phone || 'Vecino';
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

  ionViewWillEnter(): void {
    this.registerBackButtonHandler();
  }

  ionViewWillLeave(): void {
    this.unregisterBackButtonHandler();
  }

  ngOnDestroy(): void {
    this.unregisterBackButtonHandler();
  }

  private registerBackButtonHandler(): void {
    if (Capacitor.getPlatform() === 'android') {
      App.addListener('backButton', () => this.handleBackAction()).then(
        (handle) => {
          this.backButtonHandle = handle;
        }
      );
    } else if (Capacitor.getPlatform() === 'web') {
      this.popstateHandler = () => this.handleBackAction();
      window.history.pushState({ fromHome: true }, '', window.location.href);
      window.addEventListener('popstate', this.popstateHandler);
    }
  }

  private unregisterBackButtonHandler(): void {
    if (this.backButtonHandle) {
      this.backButtonHandle.remove();
      this.backButtonHandle = null;
    }
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }
  }

  private async handleBackAction(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Quieres cerrar la sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            if (Capacitor.getPlatform() === 'web') {
              window.history.pushState({ fromHome: true }, '', window.location.href);
            }
          },
        },
        {
          text: 'Aceptar',
          role: 'confirm',
          handler: () => this.logout(),
        },
      ],
    });
    await alert.present();
  }

  logout(): void {
    this.authState.logout();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
