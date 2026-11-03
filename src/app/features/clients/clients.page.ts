import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { formatMoney, formatNumber } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { Client, PaginationMeta } from '../../core/models/api.models';
import { ClientsApi } from './clients.api';

@Component({
  selector: 'app-clients-page',
  imports: [ReactiveFormsModule],
  templateUrl: './clients.page.html',
  styleUrl: './clients.page.scss',
})
export class ClientsPage implements OnInit {
  private readonly api = inject(ClientsApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly auth = inject(AuthService);

  protected readonly clients = signal<Client[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');

  protected readonly panelOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly money = formatMoney;
  protected readonly number = formatNumber;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    company_name: [''],
    email: ['', [Validators.email]],
    phone: [''],
    city: [''],
    ice: [''],
    credit_limit: [0, [Validators.min(0)]],
  });

  private currentPage = 1;

  ngOnInit(): void {
    this.load(1);
  }

  protected submitSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchTerm.set(value);
    this.load(1);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected openPanel(): void {
    this.form.reset({ credit_limit: 0 });
    this.formError.set(null);
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    this.api.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.panelOpen.set(false);
        this.load(1);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(toApiError(error).message);
      },
    });
  }

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list({ page, per_page: 15, search: this.searchTerm() }).subscribe({
      next: (response) => {
        this.currentPage = page;
        this.clients.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiError(error).message);
        this.loading.set(false);
      },
    });
  }
}
