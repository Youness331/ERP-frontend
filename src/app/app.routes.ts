import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { LoginPage } from './features/auth/login.page';
import { BankPage } from './features/bank/bank.page';
import { ClientsPage } from './features/clients/clients.page';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { InvoicesPage } from './features/invoices/invoices.page';
import { OrdersPage } from './features/orders/orders.page';
import { ProductsPage } from './features/products/products.page';
import { QuotesPage } from './features/quotes/quotes.page';
import { StockPage } from './features/stock/stock.page';
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
      {
        path: 'products',
        component: ProductsPage,
        title: 'Produits',
        canActivate: [permissionGuard('products.view')],
      },
      {
        path: 'stock',
        component: StockPage,
        title: 'Stock',
        canActivate: [permissionGuard('stock.view')],
      },
      {
        path: 'orders',
        component: OrdersPage,
        title: 'Commandes',
        canActivate: [permissionGuard('sales_orders.view')],
      },
      {
        path: 'quotes',
        component: QuotesPage,
        title: 'Devis',
        canActivate: [permissionGuard('quotes.view')],
      },
      {
        path: 'invoices',
        component: InvoicesPage,
        title: 'Factures',
        canActivate: [permissionGuard('invoices.view')],
      },
      {
        path: 'bank',
        component: BankPage,
        title: 'Rapprochement bancaire',
        canActivate: [permissionGuard('bank.view')],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
