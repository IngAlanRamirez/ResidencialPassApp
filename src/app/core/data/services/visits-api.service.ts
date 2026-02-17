import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { CreateVisitRequest, VisitResponse } from '../../domain/models/visit.model';

@Injectable({ providedIn: 'root' })
export class VisitsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/visits`;

  create(payload: CreateVisitRequest): Observable<VisitResponse> {
    return this.http.post<VisitResponse>(this.baseUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  getById(id: string): Observable<VisitResponse> {
    return this.http.get<VisitResponse>(`${this.baseUrl}/${id}`);
  }

  /** Lista según rol: vecino/admin = visitas que creó; vigilante = visitas que escaneó. */
  list(): Observable<VisitResponse[]> {
    return this.http.get<VisitResponse[]>(this.baseUrl);
  }

  /** Cancelar visita (solo creador, solo si está pendiente). */
  cancel(id: string): Observable<VisitResponse> {
    return this.http.patch<VisitResponse>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
