import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiEnvelope, Client, ClientPayload, Paginated } from '../../core/models/api.models';

export interface ClientListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientsApi {
  private readonly http = inject(HttpClient);

  list(params: ClientListParams = {}): Observable<Paginated<Client>> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page);
    }

    if (params.per_page) {
      httpParams = httpParams.set('per_page', params.per_page);
    }

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<Paginated<Client>>('/clients', { params: httpParams });
  }

  create(payload: ClientPayload): Observable<ApiEnvelope<Client>> {
    return this.http.post<ApiEnvelope<Client>>('/clients', payload);
  }
}
