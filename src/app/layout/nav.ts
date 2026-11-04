export interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission: string;
}

/**
 * Sidebar entries, each one gated by the permission required to open it.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Tableau de bord', icon: '◧', route: '/dashboard', permission: 'dashboard.view' },
  { label: 'Clients', icon: '👥', route: '/clients', permission: 'clients.view' },
  { label: 'Produits', icon: '📦', route: '/products', permission: 'products.view' },
  { label: 'Stock', icon: '🏭', route: '/stock', permission: 'stock.view' },
  { label: 'Commandes', icon: '🧾', route: '/orders', permission: 'sales_orders.view' },
  { label: 'Devis', icon: '📝', route: '/quotes', permission: 'quotes.view' },
  { label: 'Factures', icon: '💶', route: '/invoices', permission: 'invoices.view' },
];
