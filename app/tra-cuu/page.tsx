"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft, Package, CheckCircle2, Clock, XCircle, Truck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Order } from "@/lib/types";

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ thanh toán", color: "text-amber-500", icon: <Clock className="h-5 w-5" /> },
  paid: { label: "Đã thanh toán", color: "text-blue-500", icon: <CheckCircle2 className="h-5 w-5" /> },
  delivered: { label: "Đã giao hàng", color: "text-emerald-500", icon: <Truck className="h-5 w-5" /> },
  cancelled: { label: "Đã hủy", color: "text-rose-500", icon: <XCircle className="h-5 w-5" /> },
};

export default function TraCuuPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      // Try by order id or order code
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setError(data.message || "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hoặc số liên hệ.");
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-main py-8 max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/30">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Tra cứu đơn hàng</h1>
          <p className="mt-2 text-muted-foreground">
            Nhập mã đơn hàng (MW...) hoặc số điện thoại/Zalo để xem trạng thái
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mã đơn MW... hoặc SĐT / Zalo"
                className="w-full rounded-2xl border border-border bg-card py-3.5 pl-12 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary px-6 disabled:opacity-50"
            >
              {loading ? "Đang tìm..." : "Tra cứu"}
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        )}

        {order && (
          <div className="card-surface overflow-hidden">
            <div className="border-b border-border bg-muted/40 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Mã đơn</div>
                  <div className="text-lg font-black">MW{order.orderCode}</div>
                </div>
                <div className={`flex items-center gap-2 font-bold ${statusMap[order.status]?.color}`}>
                  {statusMap[order.status]?.icon}
                  {statusMap[order.status]?.label}
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <div className="text-sm text-muted-foreground">Khách hàng</div>
                <div className="font-semibold">{order.customerName}</div>
                <div className="text-sm text-muted-foreground">{order.customerContact}</div>
              </div>

              <div>
                <div className="mb-2 text-sm text-muted-foreground">Sản phẩm</div>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold">{formatMoney(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between border-t border-border pt-4 text-base font-bold">
                <span>Tổng thanh toán</span>
                <span>{formatMoney(order.amount)}</span>
              </div>

              {order.status === "delivered" && order.deliveredData && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <div className="mb-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Thông tin bàn giao
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-emerald-800 dark:text-emerald-200">
                    {order.deliveredData}
                  </pre>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Tạo lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
                {order.paidAt && (
                  <> · Thanh toán: {new Date(order.paidAt).toLocaleString("vi-VN")}</>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
