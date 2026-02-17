import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { UserProfile, VigilanteListItem } from '../../domain/models/user.model';

export interface CreateVigilanteRequest {
  phone: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/me`);
  }

  getVigilantes(): Observable<VigilanteListItem[]> {
    return this.http.get<VigilanteListItem[]>(`${this.baseUrl}/vigilantes`);
  }

  createVigilante(payload: CreateVigilanteRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/vigilantes`, payload);
  }

  deleteVigilante(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/vigilantes/${id}`);
  }
}
