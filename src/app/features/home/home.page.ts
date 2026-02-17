import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  IonButtons,
  IonButton,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { AuthStateService } from '../../core/data/services/auth-state.service';
import { UsersApiService } from '../../core/data/services/users-api.service';
import type { UserProfile } from '../../core/domain/models/user.model';

type BackButtonListenerHandle = { remove: () => Promise<void> };

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
    IonButtons,
    IonButton,
    IonIcon,
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

  readonly welcomeTitle = computed(() => {
    const p = this.profile();
    if (!p) return '';
    const role = (p.role ?? '').toLowerCase();
    if (role === 'vigilancia') return 'Buen día Vigilante';
    return 'Bienvenido Vecino';
  });

  readonly welcomeSubtitle = computed(() => {
    const p = this.profile();
    if (!p) return 'Bienvenido al acceso del fraccionamiento.';
    if ((p.role ?? '').toLowerCase() === 'vigilancia') return '';
    const addr = p.address;
    if (addr && (addr.street || addr.number)) {
      const street = (addr.street ?? '').trim();
      const number = (addr.number ?? '').trim();
      const letter = addr.letter?.trim();
      const parts: string[] = [];
      if (street) parts.push(`Calle ${street}`);
      if (number) parts.push(`Número ${number}`);
      if (letter) parts.push(`Letra ${letter}`);
      if (parts.length) return parts.join(', ');
    }
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
