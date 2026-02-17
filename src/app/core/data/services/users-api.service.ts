import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { UserProfile } from '../../domain/models/user.model';

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

  createVigilante(payload: CreateVigilanteRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/vigilantes`, payload);
  }
}
