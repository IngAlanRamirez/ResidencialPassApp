import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type {
  RegistrationRequestItem,
  UpdateStatusPayload,
} from '../../domain/models/registration-request.model';

@Injectable({ providedIn: 'root' })
export class RegistrationRequestsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/registration-requests`;

  getPending(): Observable<RegistrationRequestItem[]> {
    return this.http.get<RegistrationRequestItem[]>(this.baseUrl);
  }

  updateStatus(
    id: string,
    payload: UpdateStatusPayload
  ): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/${id}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
