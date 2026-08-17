import type { TypeExample } from '@/lib/i18n';

export function isPick(product: string, pickName: string) {
  const a = product.toLowerCase();
  const b = pickName.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

export function isTypeSelected(
  item: TypeExample,
  products: string[],
  preference: string
) {
  return (
    products.length === item.products.length &&
    products.every((p, i) => p === item.products[i]) &&
    preference === item.preference
  );
}
