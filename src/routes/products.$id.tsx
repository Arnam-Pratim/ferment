import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, formatPrice } from "@/lib/product-images";
import { Button } from "@/components/ui/button";
import { ReviewSection } from "@/components/ReviewSection";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  category: string;
  stock: number;
};

const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price_cents, image_url, category, stock")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

export const Route = createFileRoute("/products/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.id)),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — Ferment` : "Product — Ferment" },
      { name: "description", content: loaderData?.description ?? "Product details" },
      { property: "og:title", content: loaderData?.name ?? "Product" },
      { property: "og:description", content: loaderData?.description ?? "" },
    ],
  }),
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl">Couldn't load product</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/" className="mt-6 inline-block text-sm underline">Back to shop</Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl">Product not found</h1>
      <Link to="/" className="mt-4 inline-block text-sm underline">Back to shop</Link>
    </div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(id));
  const cart = useCart();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link to="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to shop
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-warm/40">
          <img
            src={getProductImage(p.image_url)}
            alt={p.name}
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight">{p.name}</h1>
          <p className="mt-4 text-2xl font-medium">{formatPrice(p.price_cents)}</p>
          <p className="mt-6 leading-relaxed text-foreground/80">{p.description}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
          </p>
          <div className="mt-8 flex gap-3">
            <Button
              size="lg"
              disabled={p.stock <= 0}
              onClick={() => {
                cart.add({ id: p.id, name: p.name, price_cents: p.price_cents, image_key: p.image_url });
                toast.success(`${p.name} added to cart`);
              }}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Add to cart
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <ReviewSection productId={p.id} />
      </div>
    </div>
  );
}
