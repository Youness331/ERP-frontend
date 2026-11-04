import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import { AdminUser, PermissionGroup, Role, UserPayload } from '../../core/models/admin.models';

export interface UserQuery {
  page?: number;
  per_page?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  users(query: UserQuery = {}): Observable<Paginated<AdminUser>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.per_page ?? 15);

    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http.get<Paginated<AdminUser>>('/users', { params });
  }

  createUser(payload: UserPayload): Observable<{ data: AdminUser }> {
    return this.http.post<{ data: AdminUser }>('/users', payload);
  }

  updateUser(id: number, payload: UserPayload): Observable<{ data: AdminUser }> {
    return this.http.patch<{ data: AdminUser }>(`/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/users/${id}`);
  }

  roles(): Observable<{ data: Role[] }> {
    return this.http.get<{ data: Role[] }>('/roles');
  }

  permissions(): Observable<{ data: PermissionGroup[] }> {
    return this.http.get<{ data: PermissionGroup[] }>('/permissions');
  }
}
