import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { Product } from '../../core/models/catalog.models';
import { ProductsPage } from './products.page';

const PRODUCT: Product = {
  id: 7,
  sku: 'REF-0007',
  barcode: null,
  name: 'Ramette A4 80g',
  description: null,
  category_id: 2,
  category: { id: 2, name: 'Papeterie', slug: 'papeterie', description: null, parent_id: null, is_active: true },
  unit: 'carton',
  purchase_price: 180,
  sale_price: 240,
  cost_price: 180,
  tax_rate: 20,
  reorder_level: 15,
  track_stock: true,
  is_active: true,
  stock_quantity: 4,
  reserved_quantity: 0,
  is_low_stock: true,
  created_at: '2026-11-02T10:00:00+01:00',
  updated_at: '2026-11-02T10:00:00+01:00',
};

describe('ProductsPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(ProductsPage);
    fixture.detectChanges();

    controller.expectOne((request) => request.url === `${environment.apiUrl}/categories`).flush({
      data: [{ id: 2, name: 'Papeterie', slug: 'papeterie', description: null, parent_id: null, is_active: true }],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
      links: {},
    });

    controller.expectOne((request) => request.url === `${environment.apiUrl}/products`).flush({
      data: [PRODUCT],
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
      links: {},
    });

    fixture.detectChanges();

    return fixture;
  }

  it('lists the products with their stock state', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Ramette A4 80g');
    expect(text).toContain('REF-0007');
    expect(text).toContain('Papeterie');
    expect(text).toContain('À réapprovisionner');
  });

  it('sends the low stock filter to the API', () => {
    const fixture = createPage();
    const checkbox = (fixture.nativeElement as HTMLElement).querySelector(
      '.toolbar input[type="checkbox"]',
    ) as HTMLInputElement;

    checkbox.click();
    fixture.detectChanges();

    const request = controller.expectOne(
      (req) => req.url === `${environment.apiUrl}/products` && req.params.get('low_stock') === '1',
    );

    expect(request.request.params.get('low_stock')).toBe('1');

    request.flush({ data: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 }, links: {} });
  });
});
