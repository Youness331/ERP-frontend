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
];
