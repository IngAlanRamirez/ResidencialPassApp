import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';

import { AuthStateService } from './auth-state.service';

/**
 * Diálogo de confirmación y cierre de sesión reutilizable (inicio, historial, etc.).
 */
@Injectable({ providedIn: 'root' })
export class LogoutPromptService {
  private readonly alertCtrl = inject(AlertController);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  /** Muestra confirmación y, si aceptan, cierra sesión y envía al login. */
  async prompt(options?: { fromHardwareBack?: boolean }): Promise<void> {
    const fromHardwareBack = options?.fromHardwareBack ?? false;
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Quieres cerrar la sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            if (fromHardwareBack && Capacitor.getPlatform() === 'web') {
              window.history.pushState(
                { fromHome: true },
                '',
                window.location.href
              );
            }
          },
        },
        {
          text: 'Cerrar sesión',
          role: 'confirm',
          handler: () => this.logoutNow(),
        },
      ],
    });
    await alert.present();
  }

  logoutNow(): void {
    this.authState.logout();
    void this.router.navigate(['/auth/login'], { replaceUrl: true });
  }
}
