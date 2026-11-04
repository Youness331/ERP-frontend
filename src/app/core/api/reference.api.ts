import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Client, Paginated } from '../models/api.models';
import { Product, Supplier, Warehouse } from '../models/catalog.models';

/**
 * Lists used to populate selects across the application.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceApi {
  private readonly http = inject(HttpClient);

  clients(): Observable<Paginated<Client>> {
    return this.http.get<Paginated<Client>>('/clients', { params: this.all() });
  }

  suppliers(): Observable<Paginated<Supplier>> {
    return this.http.get<Paginated<Supplier>>('/suppliers', { params: this.all() });
  }

  warehouses(): Observable<Paginated<Warehouse>> {
    return this.http.get<Paginated<Warehouse>>('/warehouses', { params: this.all() });
  }

  products(): Observable<Paginated<Product>> {
    return this.http.get<Paginated<Product>>('/products', { params: this.all() });
  }

  private all(): HttpParams {
    return new HttpParams().set('per_page', 100);
  }
}
