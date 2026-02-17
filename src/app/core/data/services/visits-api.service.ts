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

  /** Estado de escaneo (entrada/salida ya registradas) para mostrar el botón correcto. Solo vigilante. */
  getScanStatus(visitId: string): Observable<{ entryScanned: boolean; exitScanned: boolean }> {
    return this.http.get<{ entryScanned: boolean; exitScanned: boolean }>(
      `${this.baseUrl}/${visitId}/scan-status`
    );
  }

  /** Registrar escaneo de entrada o salida (solo vigilante). exitComment solo se usa cuando eventType es 'exit'. */
  scan(visitId: string, eventType: 'entry' | 'exit', exitComment?: string): Observable<VisitResponse> {
    const body: { eventType: 'entry' | 'exit'; exitComment?: string } = { eventType };
    if (eventType === 'exit' && exitComment?.trim()) {
      body.exitComment = exitComment.trim();
    }
    return this.http.post<VisitResponse>(
      `${this.baseUrl}/${visitId}/scan`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
