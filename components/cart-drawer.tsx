"use client";

import { X, Minus, Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { CartItem } from "@/lib/types";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type VoucherState = {
  code: string;
  valid: boolean;
  discountAmount: number;
  message: string;
};

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  voucherInput: string;
  onVoucherInput: (v: string) => void;
  voucher: VoucherState | null;
  voucherLoading: boolean;
  onApplyVoucher: () => void;
  onChangeQuantity: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  cartTotal: number;
  discountAmount: number;
  payableTotal: number;
  onCheckout: (formData: FormData) => void;
  loading: boolean;
  zaloLink?: string;
};

export function CartDrawer({
  open,
  onClose,
  items,
  voucherInput,
  onVoucherInput,
  voucher,
  voucherLoading,
  onApplyVoucher,
  onChangeQuantity,
  onRemove,
  cartTotal,
  discountAmount,
  payableTotal,
  onCheckout,
  loading,
  zaloLink = "https://zalo.me/0359868717",
}: CartDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-black">Giỏ hàng ({items.length})</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <div className="mb-3 text-4xl">🛒</div>
              <p className="font-semibold">Giỏ hàng trống</p>
              <p className="mt-1 text-sm">Thêm sản phẩm để bắt đầu mua sắm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-snug truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.duration}</div>
                    <div className="mt-2 font-black text-sm">{formatMoney(item.price)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => onRemove(item.productId)} className="text-muted-foreground hover:text-rose-500 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1 rounded-xl border border-border">
                      <button
                        onClick={() => onChangeQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-muted rounded-l-xl"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => onChangeQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-muted rounded-r-xl"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer checkout */}
        {items.length > 0 && (
          <div className="border-t border-border bg-card/80 px-5 py-4 space-y-4">
            {/* Voucher */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={voucherInput}
                  onChange={(e) => onVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Mã voucher"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                onClick={onApplyVoucher}
                disabled={voucherLoading}
                className="rounded-xl bg-muted px-4 text-sm font-bold hover:bg-muted/80 transition disabled:opacity-50"
              >
                {voucherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Áp dụng"}
              </button>
            </div>
            {voucher && (
              <p className={cn("text-xs font-medium", voucher.valid ? "text-emerald-600" : "text-rose-500")}>
                {voucher.message}
              </p>
            )}

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span>{formatMoney(cartTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá</span>
                  <span>-{formatMoney(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-1 border-t border-border">
                <span>Cần thanh toán</span>
                <span>{formatMoney(payableTotal)}</span>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onCheckout(new FormData(e.currentTarget));
              }}
              className="space-y-2.5"
            >
              <input
                name="customerName"
                required
                placeholder="Họ tên *"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                name="customerContact"
                required
                placeholder="Zalo / SĐT *"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <input
                name="customerEmail"
                type="email"
                placeholder="Email (tuỳ chọn)"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <textarea
                name="customerNote"
                rows={2}
                placeholder="Ghi chú (tuỳ chọn)"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo đơn...
                  </>
                ) : (
                  `Thanh toán ${formatMoney(payableTotal)}`
                )}
              </button>
            </form>

            <a
              href={zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition"
            >
              Cần hỗ trợ? Nhắn Zalo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
