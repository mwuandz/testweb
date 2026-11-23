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
  paid: { label: "Đã TT", className: "bg-red-100 text-red-700 dark:bg-blue-950/50 dark:text-blue-300", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function api(path: string, options?: RequestInit) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
        ...(options?.headers || {}),
      },
    });
    if (res.status === 401) {
      setIsAuthed(false);
      throw new Error("Unauthorized");
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function login() {
    setLoading(true);
    setMsg("");
    try {
      await api("/api/admin/orders");
      setIsAuthed(true);
      await loadAll();
    } catch {
      setMsg("Sai mật khẩu admin");
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [o, p, v, s] = await Promise.all([
        api("/api/admin/orders"),
        api("/api/admin/products"),
        api("/api/admin/vouchers"),
        api("/api/admin/settings"),
      ]);
      setOrders(o.orders || []);
      setProducts(p.products || []);
      setVouchers(v.vouchers || []);
      setSettings({ ...defaultSettings, ...(s.settings || {}) });
    } catch (e: any) {
      setMsg(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
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
    const price = value === "" ? undefined : Number(value);
    const nextPrices = { ...(settings.flashSalePrices || {}) };
    if (price === undefined || Number.isNaN(price)) delete nextPrices[productId];
    else nextPrices[productId] = price;
    const currentIds = settings.flashSaleProductIds || [];
    const nextIds = price !== undefined && !Number.isNaN(price) && !currentIds.includes(productId) ? [...currentIds, productId] : currentIds;
    setSettings({ ...settings, flashSaleProductIds: nextIds, flashSalePrices: nextPrices });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ settings }) });
      setMsg("Đã lưu cài đặt");
    } catch (err: any) {
      setMsg(err.message || "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      await api("/api/admin/orders", { method: "PUT", body: JSON.stringify({ id, status }) });
      await loadAll();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      const method = editingProduct.id ? "PUT" : "POST";
      await api("/api/admin/products", { method, body: JSON.stringify({ product: editingProduct }) });
      setEditingProduct(null);
      await loadAll();
      setMsg("Đã lưu sản phẩm");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await api("/api/admin/products", { method: "DELETE", body: JSON.stringify({ id }) });
      await loadAll();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  async function saveVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVoucher) return;
    setSaving(true);
    try {
      const method = editingVoucher.id ? "PUT" : "POST";
      await api("/api/admin/vouchers", { method, body: JSON.stringify({ voucher: editingVoucher }) });
      setEditingVoucher(null);
      await loadAll();
      setMsg("Đã lưu voucher");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteVoucher(id: string) {
    if (!confirm("Xóa voucher này?")) return;
    try {
      await api("/api/admin/vouchers", { method: "DELETE", body: JSON.stringify({ id }) });
      await loadAll();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid" || o.status === "delivered");
    const revenue = paid.reduce((s, o) => s + (o.total || 0), 0);
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      paid: paid.length,
      revenue,
    };
  }, [orders]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg">
          <h1 className="text-xl font-black text-center">Admin Minh Wuan Store</h1>
          <input
            type="password"
            className="input-admin"
            placeholder="Mật khẩu admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {msg && <p className="text-sm text-rose-500 text-center">{msg}</p>}
          <button onClick={login} disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Đăng nhập"}
          </button>
          <Link href="/" className="block text-center text-sm text-slate-500 hover:underline">
            ← Về trang chủ
          </Link>
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
          .btn-primary {
            background: linear-gradient(135deg, #c41e3a, #8b0000);
            color: white;
            border-radius: 0.75rem;
            font-weight: 700;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-black">Admin</h1>
          </div>
          <button onClick={loadAll} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {(
            [
              ["dashboard", LayoutDashboard, "Dashboard"],
              ["orders", ShoppingBag, "Đơn hàng"],
              ["products", Package, "Sản phẩm"],
              ["vouchers", Ticket, "Voucher"],
              ["settings", Settings, "Cài đặt"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                tab === id ? "bg-red-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {msg && (
          <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {msg}
          </div>
        )}

        {tab === "dashboard" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-sm text-slate-500">Tổng đơn</div>
              <div className="mt-1 text-3xl font-black">{stats.total}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-sm text-slate-500">Chờ thanh toán</div>
              <div className="mt-1 text-3xl font-black text-amber-600">{stats.pending}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-sm text-slate-500">Đã thanh toán</div>
              <div className="mt-1 text-3xl font-black text-emerald-600">{stats.paid}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-sm text-slate-500">Doanh thu</div>
              <div className="mt-1 text-2xl font-black text-red-600">{formatMoney(stats.revenue)}</div>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-slate-500 py-12">Chưa có đơn hàng</p>
            ) : (
              orders.map((o) => {
                const st = statusConfig[o.status] || statusConfig.pending;
                return (
                  <div key={o.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{o.id}</div>
                        <div className="text-sm text-slate-500">{o.customerName || o.email || "—"} · {new Date(o.createdAt).toLocaleString("vi-VN")}</div>
                      </div>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", st.className)}>
                        {st.icon} {st.label}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      {(o.items || []).map((it, i) => (
                        <div key={i}>{it.name} × {it.quantity} — {formatMoney(it.price * it.quantity)}</div>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-red-600">{formatMoney(o.total)}</div>
                      <div className="flex gap-1">
                        {o.status === "pending" && (
                          <button onClick={() => updateOrderStatus(o.id, "paid")} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Đã TT</button>
                        )}
                        {(o.status === "paid" || o.status === "pending") && (
                          <button onClick={() => updateOrderStatus(o.id, "delivered")} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">Đã giao</button>
                        )}
                        {o.status !== "cancelled" && (
                          <button onClick={() => updateOrderStatus(o.id, "cancelled")} className="rounded-lg bg-slate-200 dark:bg-slate-700 px-3 py-1 text-xs font-bold">Hủy</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "products" && (
          <div className="space-y-4">
            <button
              onClick={() => setEditingProduct({ ...emptyProduct, id: "" })}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2"
            >
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </button>
            {editingProduct && (
              <form onSubmit={saveProduct} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <h3 className="font-bold">{editingProduct.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
                <input className="input-admin" placeholder="Tên" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
                <input className="input-admin" placeholder="Category" value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-admin" type="number" placeholder="Giá" value={editingProduct.price || ""} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} required />
                  <input className="input-admin" placeholder="Thời hạn" value={editingProduct.duration} onChange={(e) => setEditingProduct({ ...editingProduct, duration: e.target.value })} />
                </div>
                <textarea className="input-admin" rows={3} placeholder="Mô tả" value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                <input className="input-admin" placeholder="URL ảnh" value={editingProduct.image} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} />
                <input className="input-admin" placeholder="Badge" value={editingProduct.badge || ""} onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingProduct.active} onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })} />
                  Đang bán
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary px-4 py-2">{saving ? "Đang lưu..." : "Lưu"}</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="rounded-xl border px-4 py-2">Hủy</button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-slate-500">{formatMoney(p.price)} · {p.duration}</div>
                  </div>
                  <button onClick={() => setEditingProduct(p)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteProduct(p.id)} className="rounded-lg p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "vouchers" && (
          <div className="space-y-4">
            <button onClick={() => setEditingVoucher({ ...emptyVoucher, id: "" })} className="btn-primary inline-flex items-center gap-2 px-4 py-2">
              <Plus className="h-4 w-4" /> Thêm voucher
            </button>
            {editingVoucher && (
              <form onSubmit={saveVoucher} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                <h3 className="font-bold">{editingVoucher.id ? "Sửa voucher" : "Thêm voucher"}</h3>
                <input className="input-admin" placeholder="Mã" value={editingVoucher.code} onChange={(e) => setEditingVoucher({ ...editingVoucher, code: e.target.value.toUpperCase() })} required />
                <input className="input-admin" placeholder="Mô tả" value={editingVoucher.description} onChange={(e) => setEditingVoucher({ ...editingVoucher, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-admin" value={editingVoucher.type} onChange={(e) => setEditingVoucher({ ...editingVoucher, type: e.target.value as any })}>
                    <option value="fixed">Giảm cố định (đ)</option>
                    <option value="percent">Giảm %</option>
                  </select>
                  <input className="input-admin" type="number" placeholder="Giá trị" value={editingVoucher.value || ""} onChange={(e) => setEditingVoucher({ ...editingVoucher, value: Number(e.target.value) })} required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input-admin" type="number" placeholder="Đơn tối thiểu" value={editingVoucher.minOrderAmount || ""} onChange={(e) => setEditingVoucher({ ...editingVoucher, minOrderAmount: Number(e.target.value) })} />
                  <input className="input-admin" type="number" placeholder="Giảm tối đa" value={editingVoucher.maxDiscount || ""} onChange={(e) => setEditingVoucher({ ...editingVoucher, maxDiscount: Number(e.target.value) })} />
                </div>
                <input className="input-admin" type="number" placeholder="Giới hạn dùng" value={editingVoucher.usageLimit || ""} onChange={(e) => setEditingVoucher({ ...editingVoucher, usageLimit: Number(e.target.value) })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editingVoucher.active} onChange={(e) => setEditingVoucher({ ...editingVoucher, active: e.target.checked })} />
                  Đang hoạt động
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary px-4 py-2">{saving ? "Đang lưu..." : "Lưu"}</button>
                  <button type="button" onClick={() => setEditingVoucher(null)} className="rounded-xl border px-4 py-2">Hủy</button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {vouchers.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{v.code}</div>
                    <div className="text-xs text-slate-500">{v.description} · {v.type === "percent" ? `${v.value}%` : formatMoney(v.value)}</div>
                  </div>
                  <button onClick={() => setEditingVoucher(v)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => deleteVoucher(v.id)} className="rounded-lg p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <>
            <form onSubmit={saveSettings} className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <h2 className="text-lg font-black">Thông tin cửa hàng</h2>
                <input className="input-admin" placeholder="Tên cửa hàng" value={settings.storeName || ""} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
                <input className="input-admin" placeholder="Hotline" value={settings.hotline || ""} onChange={(e) => setSettings({ ...settings, hotline: e.target.value })} />
                <input className="input-admin" placeholder="Telegram" value={settings.telegram || ""} onChange={(e) => setSettings({ ...settings, telegram: e.target.value })} />
                <textarea className="input-admin" rows={2} placeholder="Mô tả" value={settings.description || ""} onChange={(e) => setSettings({ ...settings, description: e.target.value })} />
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <h2 className="text-lg font-black flex items-center gap-2">
                  ⚡ Flash Sale
                  <span className="text-sm font-normal text-slate-500">
                    ({(settings.flashSaleProductIds || []).length} sản phẩm)
                  </span>
                </h2>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.flashSaleEnabled !== false}
                    onChange={(e) => setSettings({ ...settings, flashSaleEnabled: e.target.checked })}
                  />
                  Bật Flash Sale (hiện popup + giá sale)
                </label>
                <input
                  className="input-admin"
                  placeholder="Tiêu đề popup (vd: Flash Sale App Premium hôm nay)"
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
                <input
                  className="input-admin"
                  placeholder="Badge (vd: -50%)"
                  value={settings.flashSaleBadge || ""}
                  onChange={(e) => setSettings({ ...settings, flashSaleBadge: e.target.value })}
                />
                <input
                  className="input-admin"
                  placeholder="CTA button (vd: Mua ngay)"
                  value={settings.flashSaleCta || ""}
                  onChange={(e) => setSettings({ ...settings, flashSaleCta: e.target.value })}
                />
                <textarea
                  className="input-admin"
                  rows={2}
                  placeholder="Mô tả flash sale"
                  value={settings.flashSaleDescription || ""}
                  onChange={(e) => setSettings({ ...settings, flashSaleDescription: e.target.value })}
                />

                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Chọn sản phẩm Flash Sale</span>
                    {(settings.flashSaleProductIds || []).length > 0 && (
                      <button type="button" onClick={clearFlashSaleProducts} className="text-xs text-rose-500 hover:underline">
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                    {products.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">Chưa có sản phẩm</p>
                    ) : (
                      products
                        .filter((p) => p.active)
                        .map((p) => {
                          const selected = (settings.flashSaleProductIds || []).includes(p.id);
                          const salePrice = settings.flashSalePrices?.[p.id] ?? "";
                          return (
                            <div key={p.id} className="flex flex-wrap items-center gap-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleFlashSaleProduct(p.id)}
                                />
                                <span className="truncate font-medium">{p.name}</span>
                                <span className="shrink-0 text-xs text-slate-500">{p.duration}</span>
                              </label>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="line-through">{p.price.toLocaleString("vi-VN")}đ</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={1000}
                                  placeholder="Giá sale"
                                  className="input-admin w-28 py-1.5 text-sm"
                                  value={salePrice}
                                  onChange={(e) => setFlashSalePrice(p.id, e.target.value)}
                                />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Tick sản phẩm + nhập giá sale. Bấm <b>Lưu cài đặt</b> để áp dụng. Để trống thời gian kết thúc = Flash Sale luôn mở.
                  </p>
                </div>

                <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu cài đặt"}
                </button>
              </div>
            </form>
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
        .btn-primary {
          background: linear-gradient(135deg, #c41e3a, #8b0000);
          color: white;
          border-radius: 0.75rem;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
