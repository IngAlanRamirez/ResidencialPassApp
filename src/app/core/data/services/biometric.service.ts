import { Injectable, inject } from '@angular/core';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';
import { DeviceIdService } from './device-id.service';
import { firstValueFrom } from 'rxjs';

const CRED_PHONE_KEY = 'rp_8f3a1b_cph_x9d2e7';
const CRED_PASSWORD_KEY = 'rp_4c7e9d_cpw_k5f1a3';
const BIO_ENABLED_KEY = 'rp_2d6b8a_ben_m4g7c1';

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly deviceId = inject(DeviceIdService);

  /**
   * Verifica si el dispositivo soporta autenticación biométrica.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const result = await BiometricAuth.checkBiometry();
      return result.isAvailable && result.biometryType !== BiometryType.none;
    } catch {
      return false;
    }
  }

  /**
   * Devuelve el tipo de biometría disponible (para mostrar texto adecuado).
   */
  async getBiometryLabel(): Promise<string> {
    try {
      const result = await BiometricAuth.checkBiometry();
      switch (result.biometryType) {
        case BiometryType.touchId:
        case BiometryType.fingerprintAuthentication:
          return 'huella digital';
        case BiometryType.faceId:
        case BiometryType.faceAuthentication:
          return 'reconocimiento facial';
        case BiometryType.irisAuthentication:
          return 'reconocimiento de iris';
        default:
          return 'biometría';
      }
    } catch {
      return 'biometría';
    }
  }

  /**
   * Verifica si el usuario tiene biometría activada (credenciales guardadas).
   */
  async isEnabled(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result = await SecureStorage.get(BIO_ENABLED_KEY);
      return result === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Guarda las credenciales de forma segura y activa la biometría.
   */
  async enableBiometric(phone: string, password: string): Promise<void> {
    await SecureStorage.set(CRED_PHONE_KEY, phone);
    await SecureStorage.set(CRED_PASSWORD_KEY, password);
    await SecureStorage.set(BIO_ENABLED_KEY, 'true');
  }

  /**
   * Desactiva la biometría y borra las credenciales guardadas.
   */
  async disableBiometric(): Promise<void> {
    try {
      await SecureStorage.remove(CRED_PHONE_KEY);
      await SecureStorage.remove(CRED_PASSWORD_KEY);
      await SecureStorage.remove(BIO_ENABLED_KEY);
    } catch {
      // ignore - keys may not exist
    }
  }

  /**
   * Muestra el prompt biométrico y, si es exitoso, hace login automático.
   * Retorna true si el login fue exitoso, false en caso contrario.
   */
  async authenticateAndLogin(): Promise<boolean> {
    try {
      await BiometricAuth.authenticate({
        reason: 'Inicia sesión con tu huella o rostro',
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
      });

      const phone = String(await SecureStorage.get(CRED_PHONE_KEY) ?? '');
      const password = String(await SecureStorage.get(CRED_PASSWORD_KEY) ?? '');

      if (!phone || !password) {
        await this.disableBiometric();
        return false;
      }

      const deviceIdValue = await this.deviceId.getDeviceId();
      const res = await firstValueFrom(
        this.authApi.login({ phone, password, deviceId: deviceIdValue })
      );

      this.authState.setSession(res.accessToken, {
        id: res.user.id,
        phone: res.user.phone,
        role: res.user.role as 'vecino' | 'admin' | 'vigilancia',
      });

      return true;
    } catch {
      return false;
    }
  }
}
