import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastCtrl = inject(ToastController);

  async success(message: string, duration = 3000): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();
  }

  async error(message: string, duration = 4000): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }
}
