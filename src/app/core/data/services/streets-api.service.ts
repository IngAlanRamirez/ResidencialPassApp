import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Street } from '../../domain/models/street.model';

@Injectable({ providedIn: 'root' })
export class StreetsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/streets`;

  getStreets(): Observable<Street[]> {
    return this.http.get<Street[]>(this.baseUrl);
  }
}
