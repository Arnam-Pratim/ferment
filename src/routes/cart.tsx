import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { createCheckout } from "@/lib/checkout.functions";
import { getProductImage, formatPrice } from "@/lib/product-images";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — Ferment" },
      { name: "description", content: "Review your cart and check out securely." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const checkoutFn = useServerFn(createCheckout);
  const [submitting, setSubmitting] = useState(false);

  const checkout = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkoutFn({
        data: { items: cart.items.map((i) => ({ id: i.id, qty: i.qty })) },
      });
      toast.success(`Order ${result.orderId.slice(0, 8)} confirmed — ${formatPrice(result.total)}`);
      cart.clear();
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Add a few pieces to get started.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Browse shop</Button>
        </Link>
      </div>
    );
  }

  const tax = Math.round(cart.subtotal * 0.08);
  const total = cart.subtotal + tax;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_22rem]">
      <div>
        <h1 className="font-display text-4xl">Cart</h1>
        <ul className="mt-8 divide-y border-y">
          {cart.items.map((i) => (
            <li key={i.id} className="flex gap-4 py-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-warm/40">
                <img src={getProductImage(i.image_key)} alt={i.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <h3 className="font-display text-lg">{i.name}</h3>
                  <p className="font-medium">{formatPrice(i.price_cents * i.qty)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-md border">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cart.setQty(i.id, i.qty - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{i.qty}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cart.setQty(i.id, i.qty + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => cart.remove(i.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft lg:sticky lg:top-24">
        <h2 className="font-display text-2xl">Summary</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Tax (8%)</dt><dd>{formatPrice(tax)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>Free</dd></div>
          <div className="flex justify-between border-t pt-3 text-base font-medium"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <Button className="mt-6 w-full" size="lg" onClick={checkout} disabled={submitting}>
          {submitting ? "Processing…" : user ? "Checkout" : "Sign in to checkout"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Secured by Ferment payments
        </p>
      </aside>
    </div>
  );
}
