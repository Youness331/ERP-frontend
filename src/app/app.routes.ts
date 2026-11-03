import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { LoginPage } from './features/auth/login.page';
import { ClientsPage } from './features/clients/clients.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  { path: 'login', component: LoginPage, title: 'Connexion' },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: DashboardPage,
        title: 'Tableau de bord',
        canActivate: [permissionGuard('dashboard.view')],
      },
      {
        path: 'clients',
        component: ClientsPage,
        title: 'Clients',
        canActivate: [permissionGuard('clients.view')],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
