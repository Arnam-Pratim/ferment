import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price_cents: number;
  image_key: string;
  qty: number;
};

const KEY = "cart_v1";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

let listeners: Array<() => void> = [];

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());

  useEffect(() => {
    const fn = () => setItems(read());
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);

  const persist = (next: CartItem[]) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach(l => l());
  };

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const cur = read();
    const existing = cur.find(i => i.id === item.id);
    const next = existing
      ? cur.map(i => i.id === item.id ? { ...i, qty: i.qty + qty } : i)
      : [...cur, { ...item, qty }];
    persist(next);
  }, []);

  const remove = useCallback((id: string) => {
    persist(read().filter(i => i.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) return remove(id);
    persist(read().map(i => i.id === id ? { ...i, qty } : i));
  }, [remove]);

  const clear = useCallback(() => persist([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price_cents, 0);

  return { items, add, remove, setQty, clear, count, subtotal };
}
