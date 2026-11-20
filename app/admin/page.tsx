"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Ticket,
  Settings,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
} from "lucide-react";
import { defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { Order, Product, SiteSettings, Voucher } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "orders" | "products" | "vouchers" | "settings";

const emptyProduct: Product = {
  id: "",
  name: "",
  category: "App AI",
  price: 0,
  duration: "1 tháng",
  description: "",
  deliveryType: "manual",
  active: true,
  image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com",
  badge: "",
};

const emptyVoucher: Voucher = {
  id: "",
  code: "",
  description: "",
  type: "fixed",
  value: 0,
  minOrderAmount: 0,
  maxDiscount: 0,
  usageLimit: 0,
  usedCount: 0,
  active: true,
  applicableProductIds: [],
};

function toDateTimeLocalValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTimeLocalToIso(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ TT", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300", icon: <Clock className="h-3.5 w-3.5" /> },
  paid: { label: "Đã TT", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  delivered: { label: "Đã giao", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300", icon: <Truck className="h-3.5 w-3.5" /> },
  cancelled: { label: "Hủy", className: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [voucherForm, setVoucherForm] = useState<Voucher>(emptyVoucher);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = useMemo(
    () => ({ "x-admin-password": password, "Content-Type": "application/json" }),
    [password]
  );

  // Stats
  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid" || o.status === "delivered");
    const revenue = paid.reduce((s, o) => s + (o.amount || 0), 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = paid.filter((o) => new Date(o.paidAt || o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.amount || 0), 0);

    return {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: orders.filter((o) => o.status === "paid").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      revenue,
      todayRevenue,
      todayCount: todayOrders.length,
      productCount: products.length,
      voucherCount: vouchers.filter((v) => v.active !== false).length,
    };
  }, [orders, products, vouchers]);

  async function loadOrders(currentPassword = password) {
    const res = await fetch(`/api/admin/orders?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải đơn hàng");
    setOrders(data.orders || []);
  }

  async function loadProducts(currentPassword = password) {
    const res = await fetch(`/api/admin/products?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải sản phẩm");
    setProducts(data.products || []);
  }

  async function loadVouchers(currentPassword = password) {
    const res = await fetch(`/api/admin/vouchers?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải voucher");
    setVouchers(data.vouchers || []);
  }

  async function loadSettings(currentPassword = password) {
    const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(currentPassword)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi tải cài đặt");
    setSettings(data.settings || defaultSettings);
  }

  async function loadAll() {
    const currentPassword = password.trim();
    setError("");
    setMessage("");
    if (!currentPassword) {
      setIsAuthed(false);
      setError("Vui lòng nhập mật khẩu admin");
      return;
    }
    try {
      setLoading(true);
      await Promise.all([
        loadOrders(currentPassword),
        loadProducts(currentPassword),
        loadVouchers(currentPassword),
        loadSettings(currentPassword),
      ]);
      setIsAuthed(true);
      localStorage.setItem("mw_admin_password", currentPassword);
      setMessage("Đăng nhập admin thành công.");
    } catch (err) {
      setIsAuthed(false);
      setError(err instanceof Error ? err.message : "Sai mật khẩu admin");
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/products?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(productForm),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không lưu được sản phẩm");
    setProductForm(emptyProduct);
    setMessage("Đã lưu sản phẩm.");
    await loadProducts();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/products/${id}?password=${encodeURIComponent(password)}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không xóa được sản phẩm");
    setMessage("Đã xóa sản phẩm.");
    await loadProducts();
  }

  async function saveVoucher(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/vouchers?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(voucherForm),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không lưu được voucher");
    setVoucherForm(emptyVoucher);
    setMessage("Đã lưu voucher.");
    await loadVouchers();
  }

  async function deleteVoucher(code: string) {
    if (!confirm("Xóa voucher này?")) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/vouchers/${code}?password=${encodeURIComponent(password)}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không xóa được voucher");
    setMessage("Đã xóa voucher.");
    await loadVouchers();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/settings?password=${encodeURIComponent(password)}`, {
      method: "POST",
      headers,
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Không lưu được cài đặt");
    setSettings(data.settings);
    setMessage("Đã lưu cài đặt website.");
  }

  function editProduct(product: Product) {
    setProductForm(product);
    setTab("products");
  }

  function editVoucher(voucher: Voucher) {
    setVoucherForm({ ...voucher, applicableProductIds: voucher.applicableProductIds || [] });
    setTab("vouchers");
  }

  function toggleVoucherProduct(productId: string) {
    const ids = voucherForm.applicableProductIds || [];
    setVoucherForm({
      ...voucherForm,
      applicableProductIds: ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId],
    });
  }

  function clearVoucherProducts() {
    setVoucherForm({ ...voucherForm, applicableProductIds: [] });
  }

  function toggleFlashSaleProduct(productId: string) {
    const ids = settings.flashSaleProductIds || [];
    setSettings({
      ...settings,
      flashSaleProductIds: ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId],
    });
  }

  function clearFlashSaleProducts() {
    setSettings({ ...settings, flashSaleProductIds: [], flashSalePrices: {} });
  }

  function setFlashSalePrice(productId: string, value: string) {
    const price = Number(value);
    const nextPrices = { ...(settings.flashSalePrices || {}) };
    if (!price || price <= 0) delete nextPrices[productId];
    else nextPrices[productId] = price;
    const currentIds = settings.flashSaleProductIds || [];
    const nextIds = currentIds.includes(productId) ? currentIds : [...currentIds, productId];
    setSettings({ ...settings, flashSaleProductIds: nextIds, flashSalePrices: nextPrices });
  }

  function logout() {
    localStorage.removeItem("mw_admin_password");
    setPassword("");
    setIsAuthed(false);
    setOrders([]);
    setProducts([]);
    setVouchers([]);
    setMessage("Đã đăng xuất admin.");
  }

  useEffect(() => {
    const saved = localStorage.getItem("mw_admin_password");
    if (saved) {
      setPassword(saved);
    }
  }, []);

  // Auto login if password saved
  useEffect(() => {
    if (password && !isAuthed && localStorage.getItem("mw_admin_password") === password) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Tổng quan", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "orders", label: "Đơn hàng", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "products", label: "Sản phẩm", icon: <Package className="h-4 w-4" /> },
    { id: "vouchers", label: "Voucher", icon: <Ticket className="h-4 w-4" /> },
    { id: "settings", label: "Cài đặt", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Minh Wuan" className="h-9 w-9 object-contain" />
            <div>
              <div className="text-sm font-black">Admin Panel</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Minh Wuan Store</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Về web</span>
            </Link>
            {isAuthed && (
              <>
                <button
                  onClick={() => loadAll()}
                  className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50 transition"
                  title="Làm mới"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Login */}
        {!isAuthed && (
          <div className="mx-auto max-w-md">
            <div className="card-surface p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                <Settings className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black">Đăng nhập Admin</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Nhập mật khẩu ADMIN_PASSWORD để quản lý shop
              </p>
              <div className="mt-6 space-y-3">
                <input
                  type="password"
                  placeholder="Mật khẩu admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadAll()}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={loadAll} disabled={loading} className="btn-primary w-full py-3">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </button>
              </div>
              {error && (
                <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {isAuthed && (
          <>
            {/* Messages */}
            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {message}
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition",
                    tab === t.id
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:text-slate-50"
                  )}
                >
                  {t.icon}
                  {t.label}
                  {t.id === "orders" && stats.pending > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] text-white">
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ===== DASHBOARD ===== */}
            {tab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="card-surface p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Doanh thu hôm nay</span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-2xl font-black">{formatMoney(stats.todayRevenue)}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.todayCount} đơn đã TT</div>
                  </div>
                  <div className="card-surface p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Tổng doanh thu</span>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="mt-2 text-2xl font-black">{formatMoney(stats.revenue)}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stats.paid + stats.delivered} đơn thành công</div>
                  </div>
                  <div className="card-surface p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Chờ thanh toán</span>
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="mt-2 text-2xl font-black">{stats.pending}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">đơn pending</div>
                  </div>
                  <div className="card-surface p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Sản phẩm / Voucher</span>
                      <Package className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="mt-2 text-2xl font-black">
                      {stats.productCount} / {stats.voucherCount}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">đang hoạt động</div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    { key: "pending", label: "Chờ TT", count: stats.pending },
                    { key: "paid", label: "Đã TT", count: stats.paid },
                    { key: "delivered", label: "Đã giao", count: stats.delivered },
                    { key: "cancelled", label: "Hủy", count: stats.cancelled },
                  ].map((s) => (
                    <div key={s.key} className="card-surface flex items-center gap-3 p-4">
                      <div className={cn("rounded-xl p-2", statusConfig[s.key]?.className)}>
                        {statusConfig[s.key]?.icon}
                      </div>
                      <div>
                        <div className="text-lg font-black">{s.count}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card-surface overflow-hidden">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-4 font-bold">Đơn gần đây</div>
                  <div className="divide-y divide-border">
                    {orders.slice(0, 8).map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-bold">MW{order.orderCode}</div>
                          <div className="truncate text-slate-500 dark:text-slate-400">
                            {order.customerName} · {order.customerContact}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold">{formatMoney(order.amount)}</div>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                              statusConfig[order.status]?.className
                            )}
                          >
                            {statusConfig[order.status]?.icon}
                            {statusConfig[order.status]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">Chưa có đơn hàng</div>
                    )}
                  </div>
                  {orders.length > 8 && (
                    <button
                      onClick={() => setTab("orders")}
                      className="w-full border-t border-slate-200 dark:border-slate-700 py-3 text-sm font-bold text-blue-600 hover:bg-slate-100/50 dark:bg-slate-800/50 transition"
                    >
                      Xem tất cả đơn →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ===== ORDERS ===== */}
            {tab === "orders" && (
              <div className="card-surface overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between">
                  <span className="font-bold">Tất cả đơn hàng ({orders.length})</span>
                  <button onClick={() => loadOrders()} className="text-sm font-semibold text-blue-600 hover:underline">
                    Làm mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/40 dark:bg-slate-800/40 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3 font-bold">Mã</th>
                        <th className="px-4 py-3 font-bold">Khách</th>
                        <th className="px-4 py-3 font-bold">Sản phẩm</th>
                        <th className="px-4 py-3 font-bold">Tiền</th>
                        <th className="px-4 py-3 font-bold">Trạng thái</th>
                        <th className="px-4 py-3 font-bold">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-100/30 dark:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-bold">MW{order.orderCode}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{order.customerName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{order.customerContact}</div>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="truncate text-xs">
                              {order.items?.map((i) => `${i.name}×${i.quantity}`).join(", ") || order.productName}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold">{formatMoney(order.amount)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                                statusConfig[order.status]?.className
                              )}
                            >
                              {statusConfig[order.status]?.icon}
                              {statusConfig[order.status]?.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">Chưa có đơn hàng</div>
                  )}
                </div>
              </div>
            )}

            {/* ===== PRODUCTS ===== */}
            {tab === "products" && (
              <div className="grid gap-6 lg:grid-cols-5">
                <form onSubmit={saveProduct} className="card-surface space-y-3 p-5 lg:col-span-2">
                  <h3 className="font-black">{productForm.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
                  <input
                    className="input-admin"
                    placeholder="ID (vd: chatgpt-plus-1m)"
                    value={productForm.id}
                    onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
                    required
                  />
                  <input
                    className="input-admin"
                    placeholder="Tên sản phẩm"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                  <input
                    className="input-admin"
                    placeholder="Category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input-admin"
                      type="number"
                      placeholder="Giá"
                      value={productForm.price || ""}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      required
                    />
                    <input
                      className="input-admin"
                      placeholder="Duration"
                      value={productForm.duration}
                      onChange={(e) => setProductForm({ ...productForm, duration: e.target.value })}
                    />
                  </div>
                  <input
                    className="input-admin"
                    placeholder="Badge (Hot, Sale, New...)"
                    value={productForm.badge || ""}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  />
                  <input
                    className="input-admin"
                    placeholder="Image URL"
                    value={productForm.image || ""}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                  <textarea
                    className="input-admin resize-none"
                    rows={3}
                    placeholder="Mô tả"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={productForm.active !== false}
                      onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                    />
                    Hiển thị trên web
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">
                      <Plus className="h-4 w-4" />
                      Lưu
                    </button>
                    {productForm.id && (
                      <button
                        type="button"
                        onClick={() => setProductForm(emptyProduct)}
                        className="btn-secondary"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>

                <div className="card-surface overflow-hidden lg:col-span-3">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 font-bold">
                    Danh sách ({products.length})
                  </div>
                  <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="h-10 w-10 rounded-xl object-contain bg-slate-100 dark:bg-slate-800" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{p.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {p.category} · {formatMoney(p.price)} · {p.active === false ? "Ẩn" : "Hiện"}
                          </div>
                        </div>
                        <button onClick={() => editProduct(p)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== VOUCHERS ===== */}
            {tab === "vouchers" && (
              <div className="grid gap-6 lg:grid-cols-5">
                <form onSubmit={saveVoucher} className="card-surface space-y-3 p-5 lg:col-span-2">
                  <h3 className="font-black">{voucherForm.code ? "Sửa voucher" : "Thêm voucher"}</h3>
                  <input
                    className="input-admin"
                    placeholder="Mã (vd: WELCOME10)"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                  <input
                    className="input-admin"
                    placeholder="Mô tả"
                    value={voucherForm.description || ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="input-admin"
                      value={voucherForm.type}
                      onChange={(e) =>
                        setVoucherForm({ ...voucherForm, type: e.target.value as "fixed" | "percent" })
                      }
                    >
                      <option value="fixed">Giảm cố định (đ)</option>
                      <option value="percent">Giảm %</option>
                    </select>
                    <input
                      className="input-admin"
                      type="number"
                      placeholder="Giá trị"
                      value={voucherForm.value || ""}
                      onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input-admin"
                      type="number"
                      placeholder="Đơn tối thiểu"
                      value={voucherForm.minOrderAmount || ""}
                      onChange={(e) =>
                        setVoucherForm({ ...voucherForm, minOrderAmount: Number(e.target.value) })
                      }
                    />
                    <input
                      className="input-admin"
                      type="number"
                      placeholder="Giảm tối đa"
                      value={voucherForm.maxDiscount || ""}
                      onChange={(e) =>
                        setVoucherForm({ ...voucherForm, maxDiscount: Number(e.target.value) })
                      }
                    />
                  </div>
                  <input
                    className="input-admin"
                    type="number"
                    placeholder="Giới hạn lượt dùng (0 = không giới hạn)"
                    value={voucherForm.usageLimit || ""}
                    onChange={(e) => setVoucherForm({ ...voucherForm, usageLimit: Number(e.target.value) })}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={voucherForm.active !== false}
                      onChange={(e) => setVoucherForm({ ...voucherForm, active: e.target.checked })}
                    />
                    Đang hoạt động
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">
                      Lưu voucher
                    </button>
                    {voucherForm.code && (
                      <button
                        type="button"
                        onClick={() => setVoucherForm(emptyVoucher)}
                        className="btn-secondary"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>

                <div className="card-surface overflow-hidden lg:col-span-3">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 font-bold">
                    Danh sách voucher ({vouchers.length})
                  </div>
                  <div className="divide-y divide-border">
                    {vouchers.map((v) => (
                      <div key={v.code} className="flex items-center gap-3 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold">{v.code}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {v.type === "percent" ? `${v.value}%` : formatMoney(v.value)}
                            {v.minOrderAmount ? ` · Đơn từ ${formatMoney(v.minOrderAmount)}` : ""}
                            {v.usageLimit ? ` · ${v.usedCount || 0}/${v.usageLimit} lượt` : ""}
                            · {v.active === false ? "Tắt" : "Bật"}
                          </div>
                        </div>
                        <button onClick={() => editVoucher(v)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteVoucher(v.code)}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {vouchers.length === 0 && (
                      <div className="py-8 text-center text-slate-500 dark:text-slate-400">Chưa có voucher</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ===== SETTINGS ===== */}
            {tab === "settings" && (
              <form onSubmit={saveSettings} className="card-surface max-w-2xl space-y-4 p-6">
                <h3 className="text-lg font-black">Cài đặt website</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Tiêu đề site</label>
                    <input
                      className="input-admin"
                      value={settings.siteTitle}
                      onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Domain</label>
                    <input
                      className="input-admin"
                      value={settings.brandDomain}
                      onChange={(e) => setSettings({ ...settings, brandDomain: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Subtitle</label>
                  <input
                    className="input-admin"
                    value={settings.siteSubtitle}
                    onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Hero title</label>
                  <input
                    className="input-admin"
                    value={settings.heroTitle}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Hero description</label>
                  <textarea
                    className="input-admin resize-none"
                    rows={2}
                    value={settings.heroDescription}
                    onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Warning / Marquee</label>
                  <input
                    className="input-admin"
                    value={settings.warningText}
                    onChange={(e) => setSettings({ ...settings, warningText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Event text</label>
                  <input
                    className="input-admin"
                    value={settings.eventText}
                    onChange={(e) => setSettings({ ...settings, eventText: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Zalo link</label>
                    <input
                      className="input-admin"
                      value={settings.zaloLink}
                      onChange={(e) => setSettings({ ...settings, zaloLink: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">Community link</label>
                    <input
                      className="input-admin"
                      value={settings.communityLink}
                      onChange={(e) => setSettings({ ...settings, communityLink: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="mb-3 font-bold">Flash Sale</h4>
                  <label className="mb-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.flashSaleEnabled !== false}
                      onChange={(e) => setSettings({ ...settings, flashSaleEnabled: e.target.checked })}
                    />
                    Bật Flash Sale
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="input-admin"
                      placeholder="Flash title"
                      value={settings.flashSaleTitle || ""}
                      onChange={(e) => setSettings({ ...settings, flashSaleTitle: e.target.value })}
                    />
                    <input
                      className="input-admin"
                      type="datetime-local"
                      value={toDateTimeLocalValue(settings.flashSaleEndsAt)}
                      onChange={(e) =>
                        setSettings({ ...settings, flashSaleEndsAt: dateTimeLocalToIso(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3">
                  Lưu cài đặt
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        .input-admin {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input-admin:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </div>
  );
}
