import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
};

async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, user_id, rating, comment, created_at, profiles(display_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Review[];
}

export function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviews(productId),
  });

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [comment, setComment] = useState(myReview?.comment ?? "");

  const upsert = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const trimmed = comment.trim();
      if (trimmed.length < 1 || trimmed.length > 1000) throw new Error("Review must be 1–1000 chars");
      if (rating < 1 || rating > 5) throw new Error("Pick a rating");
      const { error } = await supabase
        .from("reviews")
        .upsert(
          { product_id: productId, user_id: user.id, rating, comment: trimmed },
          { onConflict: "product_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(myReview ? "Review updated" : "Review posted");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!myReview) return;
      const { error } = await supabase.from("reviews").delete().eq("id", myReview.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      setComment("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="border-t pt-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Customer reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <StarRating value={Math.round(avg)} />
            <span className="text-muted-foreground">
              {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {user ? (
        <div className="mb-10 rounded-xl border bg-card p-5 shadow-soft">
          <p className="mb-3 text-sm font-medium">
            {myReview ? "Update your review" : "Leave a review"}
          </p>
          <div className="mb-3"><StarRating value={rating} onChange={setRating} size={22} /></div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder="Share your thoughts about this product…"
            className="mb-3 min-h-24"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{comment.length}/1000</span>
            <div className="flex gap-2">
              {myReview && (
                <Button variant="ghost" size="sm" onClick={() => del.mutate()} disabled={del.isPending}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              )}
              <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
                {myReview ? "Update" : "Post review"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 rounded-xl border bg-warm/40 p-5 text-sm">
          <Link to="/auth" className="font-medium text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </div>
      )}

      <div className="space-y-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading reviews…</p>}
        {!isLoading && reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first.</p>
        )}
        {reviews.map((r) => (
          <article key={r.id} className="rounded-lg border bg-card p-5">
            <header className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-warm font-medium text-warm-foreground">
                  {(r.profiles?.display_name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{r.profiles?.display_name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <StarRating value={r.rating} />
            </header>
            <p className="text-sm leading-relaxed text-foreground/90">{r.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
