"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  LogOut,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { CustomerPublic, Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOKEN_KEY = "mw_customer_token";
const USER_KEY = "mw_customer_user";

const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Chờ thanh toán",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  delivered: {
    label: "Đã giao hàng",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export default function TaiKhoanPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace("/dang-nhap");
      return;
    }

    async function load() {
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch("/api/auth/me", { headers: { "x-customer-token": token! } }),
          fetch("/api/auth/orders", { headers: { "x-customer-token": token! } }),
        ]);

        if (!meRes.ok) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          router.replace("/dang-nhap");
          return;
        }

        const meData = await meRes.json();
        setCustomer(meData.customer);
        localStorage.setItem(USER_KEY, JSON.stringify(meData.customer));

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }
      } catch {
        setError("Không tải được dữ liệu tài khoản");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function handleLogout() {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50 transition"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>

        {/* Profile card */}
        <div className="card-surface mb-6 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-black text-white">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black">{customer.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{customer.contact}</p>
              {customer.email && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{customer.email}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Orders */}
        <div className="card-surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
            <div className="flex items-center gap-2 font-bold">
              <Package className="h-5 w-5 text-blue-500" />
              Lịch sử đơn hàng ({orders.length})
            </div>
            <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
              Mua thêm
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="mb-3 h-12 w-12 text-slate-500 dark:text-slate-400/40" />
              <p className="font-semibold text-slate-500 dark:text-slate-400">Chưa có đơn hàng</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Đơn dùng cùng số Zalo/SĐT sẽ hiện ở đây
              </p>
              <Link href="/" className="btn-primary mt-5">
                Xem bảng giá
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold">MW{order.orderCode}</div>
                      <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </div>
                      <div className="mt-2 space-y-0.5 text-sm">
                        {order.items?.map((item, i) => (
                          <div key={i} className="text-slate-500 dark:text-slate-400">
                            {item.name} × {item.quantity}
                          </div>
                        )) || <div className="text-slate-500 dark:text-slate-400">{order.productName}</div>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-black">{formatMoney(order.amount)}</div>
                      <span
                        className={cn(
                          "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                          statusMap[order.status]?.className
                        )}
                      >
                        {statusMap[order.status]?.icon}
                        {statusMap[order.status]?.label}
                      </span>
                    </div>
                  </div>

                  {order.status === "delivered" && order.deliveredData && (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                      <div className="mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Thông tin bàn giao
                      </div>
                      <pre className="whitespace-pre-wrap text-emerald-800 dark:text-emerald-200">
                        {order.deliveredData}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
