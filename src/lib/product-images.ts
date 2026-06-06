import headphones from "@/assets/product-headphones.jpg";
import keyboard from "@/assets/product-keyboard.jpg";
import coffee from "@/assets/product-coffee.jpg";
import bag from "@/assets/product-bag.jpg";
import lamp from "@/assets/product-lamp.jpg";
import watch from "@/assets/product-watch.jpg";

export const productImages: Record<string, string> = {
  headphones,
  keyboard,
  coffee,
  bag,
  lamp,
  watch,
};

export function getProductImage(key: string): string {
  return productImages[key] ?? headphones;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
