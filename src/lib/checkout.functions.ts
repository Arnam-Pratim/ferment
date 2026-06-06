import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ids = data.items.map((i) => i.id);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price_cents, stock")
      .in("id", ids);
    if (error) throw new Error(error.message);

    let subtotal = 0;
    const lineItems = data.items.map((i) => {
      const p = products?.find((x) => x.id === i.id);
      if (!p) throw new Error(`Product ${i.id} not found`);
      if (p.stock < i.qty) throw new Error(`${p.name} is out of stock`);
      const line_total = p.price_cents * i.qty;
      subtotal += line_total;
      return { id: p.id, name: p.name, qty: i.qty, unit_price_cents: p.price_cents, line_total };
    });

    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + tax;

    // Order reference — payment provider (Stripe) is wired in via enable_stripe_payments.
    const orderId = crypto.randomUUID();

    return {
      orderId,
      userId,
      lineItems,
      subtotal,
      tax,
      total,
      currency: "USD",
      // In a real integration, a Stripe Checkout Session URL would be returned here.
      paymentStatus: "pending_provider" as const,
    };
  });
