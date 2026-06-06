import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProductImage, formatPrice } from "@/lib/product-images";
import heroImg from "@/assets/hero.jpg";

type Product = {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  category: string;
};

const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price_cents, image_url, category")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ferment — Shop considered everyday objects" },
      { name: "description", content: "A curated catalog of beautifully made everyday goods. Read reviews, add to cart, check out securely." },
      { property: "og:title", content: "Ferment" },
      { property: "og:description", content: "Considered objects for daily life." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-2xl">Couldn't load products</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <p>Not found</p>,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQuery);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-block rounded-full border bg-warm/40 px-3 py-1 text-xs font-medium tracking-wide text-warm-foreground">
              New arrivals · Winter '26
            </span>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-6xl">
              Considered objects<br />for daily life.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              A small catalog of well-made everyday goods. Read what other people
              think, then check out in seconds.
            </p>
            <div className="mt-7 flex gap-3">
              <a href="#shop" className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Shop the catalog
              </a>
            </div>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden rounded-2xl shadow-lift">
            <img
              src={heroImg}
              alt="Curated everyday objects on a warm beige flat lay"
              width={1600}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="shop" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="font-display text-3xl">The catalog</h2>
          <p className="text-sm text-muted-foreground">{products.length} pieces</p>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              to="/products/$id"
              params={{ id: p.id }}
              className="group block"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-warm/40">
                <img
                  src={getProductImage(p.image_url)}
                  alt={p.name}
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
                  <h3 className="mt-0.5 font-display text-lg leading-tight">{p.name}</h3>
                </div>
                <p className="font-medium">{formatPrice(p.price_cents)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
