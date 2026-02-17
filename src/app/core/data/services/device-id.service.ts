import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';

const STORAGE_KEY = 'residencial_pass_device_id';

@Injectable({ providedIn: 'root' })
export class DeviceIdService {
  private deviceIdPromise: Promise<string> | null = null;

  async getDeviceId(): Promise<string> {
    if (!this.deviceIdPromise) {
      this.deviceIdPromise = this.resolve();
    }
    return this.deviceIdPromise;
  }

  private async resolve(): Promise<string> {
    try {
      const info = await Device.getId();
      if (info?.identifier) {
        localStorage.setItem(STORAGE_KEY, info.identifier);
        return info.identifier;
      }
    } catch {
      // Capacitor no disponible (web)
    }
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = `web-${crypto.randomUUID()}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }
}
