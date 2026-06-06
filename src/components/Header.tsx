import { Link } from "@tanstack/react-router";
import { ShoppingBag, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="font-display text-xl tracking-tight">
          Ferment<span className="text-accent">·</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Shop</Link>
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => supabase.auth.signOut()}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                <UserIcon className="mr-2 h-4 w-4" /> Sign in
              </Button>
            </Link>
          )}
          <Link to="/cart" className="relative ml-1">
            <Button variant="outline" size="icon" aria-label="Cart">
              <ShoppingBag className="h-4 w-4" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-medium text-accent-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
