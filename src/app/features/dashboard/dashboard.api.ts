import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { ApiEnvelope, DashboardSummary } from '../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);

  load(): Observable<DashboardSummary> {
    return this.http
      .get<ApiEnvelope<DashboardSummary>>('/dashboard')
      .pipe(map((response) => response.data));
  }
}
