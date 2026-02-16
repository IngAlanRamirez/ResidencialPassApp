import { Injectable } from '@angular/core';

const STORAGE_KEY = 'residencial_pass_device_id';

@Injectable({ providedIn: 'root' })
export class DeviceIdService {
  getDeviceId(): string {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = this.generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  private generateId(): string {
    return `web-${crypto.randomUUID()}`;
  }
}
