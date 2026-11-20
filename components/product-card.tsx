"use client";

import Link from "next/link";
import { ShoppingCart, Zap } from "lucide-react";
import { Product, SiteSettings } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  salePrice?: number;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
};

function getBadgeClass(badge?: string) {
  if (!badge) return "";
  const b = badge.toLowerCase();
  if (/hot|best|combo/.test(b)) return "badge-hot";
  if (/sale|giá tốt|rẻ/.test(b)) return "badge-sale";
  if (/new|mới/.test(b)) return "badge-new";
  return "badge-combo";
}

export function ProductCard({ product, salePrice, onAddToCart, onBuyNow }: ProductCardProps) {
  const isSale = salePrice !== undefined && salePrice < product.price;
  const displayPrice = isSale ? salePrice : product.price;
  const discountPercent = isSale
    ? Math.round(((product.price - salePrice!) / product.price) * 100)
    : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:border-blue-500/30">
      {/* Image / Icon area */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-muted/80 to-muted/40 p-4">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-16 w-16 rounded-2xl object-contain shadow-md transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-2xl font-black text-white shadow-lg">
            {product.name.charAt(0)}
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <span className={cn("absolute left-3 top-3", getBadgeClass(product.badge))}>
            {product.badge}
          </span>
        )}

        {isSale && (
          <span className="absolute right-3 top-3 badge bg-rose-500 text-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {product.category}
        </div>
        <Link href={`/product/${product.id}`} className="group/title">
          <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-slate-50 transition group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {product.duration}
        </p>
        <p className="mt-2 line-clamp-2 text-xs text-slate-500 dark:text-slate-400/80">
          {product.description}
        </p>

        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 dark:text-slate-50">
              {formatMoney(displayPrice)}
            </span>
            {isSale && (
              <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
                {formatMoney(product.price)}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onAddToCart?.(product)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ShoppingCart className="h-4 w-4" />
              Thêm
            </button>
            <button
              onClick={() => onBuyNow?.(product)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg"
            >
              <Zap className="h-4 w-4" />
              Mua
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
