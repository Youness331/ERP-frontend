const decimalFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('fr-FR');

/** Formats an amount with the French thousand/decimal separators. */
export function formatMoney(value: number | null | undefined, symbol = 'DH'): string {
  return `${decimalFormatter.format(Number(value ?? 0))} ${symbol}`;
}

export function formatNumber(value: number | null | undefined): string {
  return integerFormatter.format(Number(value ?? 0));
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return `${value > 0 ? '+' : ''}${decimalFormatter.format(value)} %`;
}

/**
 * Formats an ISO date (`YYYY-MM-DD`) without shifting it through the local
 * timezone, which a plain `new Date('2026-11-02')` would do.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
