import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { formatDate } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { PaginationMeta } from '../../core/models/api.models';
import { AdminUser, PermissionGroup, Role } from '../../core/models/admin.models';
import { AdminApi } from './admin.api';

type Tab = 'users' | 'roles';

@Component({
  selector: 'app-admin-page',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage implements OnInit {
  private readonly api = inject(AdminApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly auth = inject(AuthService);

  protected readonly tab = signal<Tab>('users');
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly roles = signal<Role[]>([]);
  protected readonly permissionGroups = signal<PermissionGroup[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly panelOpen = signal(false);
  protected readonly editing = signal<AdminUser | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly date = formatDate;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    password_confirmation: [''],
    role_id: [null as number | null],
    phone: [''],
    job_title: [''],
    is_active: [true],
  });

  private currentPage = 1;

  ngOnInit(): void {
    if (this.auth.can('roles.view')) {
      this.api.roles().subscribe({ next: (r) => this.roles.set(r.data), error: () => undefined });
      this.api.permissions().subscribe({ next: (r) => this.permissionGroups.set(r.data), error: () => undefined });
    }

    this.load(1);
  }

  protected canViewRoles(): boolean {
    return this.auth.can('roles.view');
  }

  protected selectTab(tab: Tab): void {
    this.tab.set(tab);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected canCreate(): boolean {
    return this.auth.can('users.create');
  }

  protected canUpdate(): boolean {
    return this.auth.can('users.update');
  }

  protected canDelete(): boolean {
    return this.auth.can('users.delete');
  }

  protected hasPermission(role: Role | undefined, permission: string): boolean {
    return role?.permissions?.includes(permission) ?? false;
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.form.reset({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role_id: null,
      phone: '',
      job_title: '',
      is_active: true,
    });
    this.panelOpen.set(true);
  }

  protected openEdit(user: AdminUser): void {
    this.editing.set(user);
    this.formError.set(null);
    this.form.reset({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
      role_id: user.role?.id ?? null,
      phone: user.phone ?? '',
      job_title: user.job_title ?? '',
      is_active: user.is_active,
    });
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

    const raw = this.form.getRawValue();
    const editing = this.editing();
    const payload = {
      name: raw.name,
      email: raw.email,
      role_id: raw.role_id,
      phone: raw.phone || null,
      job_title: raw.job_title || null,
      is_active: raw.is_active,
      ...(raw.password ? { password: raw.password, password_confirmation: raw.password_confirmation } : {}),
    };

    this.saving.set(true);
    this.formError.set(null);

    const request = editing ? this.api.updateUser(editing.id, payload) : this.api.createUser(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.panelOpen.set(false);
        this.load(editing ? this.currentPage : 1);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(toApiError(error).message);
      },
    });
  }

  protected remove(user: AdminUser): void {
    if (!window.confirm(`Supprimer l'utilisateur ${user.name} ?`)) {
      return;
    }

    this.api.deleteUser(user.id).subscribe({
      next: () => this.load(this.currentPage),
      error: (error: unknown) => this.error.set(toApiError(error).message),
    });
  }

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.users({ page, per_page: 15 }).subscribe({
      next: (response) => {
        this.currentPage = page;
        this.users.set(response.data);
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
