"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, ShoppingBag, Package, Ticket, Settings,
  ArrowLeft, RefreshCw, Pencil, Trash2, Plus, Clock,
  CheckCircle2, Truck, XCircle, Loader2,
} from "lucide-react";
import { defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { Order, Product, SiteSettings, Voucher } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "orders" | "products" | "vouchers" | "settings";

const emptyProduct: Product = {
  id: "", name: "", category: "App AI", price: 0, duration: "1 tháng",
  description: "", deliveryType: "manual", active: true,
  image: "https://www.google.com/s2/favicons?sz=128&domain=chatgpt.com", badge: "",
};

const emptyVoucher: Voucher = {
  id: "", code: "", description: "", type: "fixed", value: 0,
  minOrderAmount: 0, maxDiscount: 0, usageLimit: 0, usedCount: 0,
  active: true, applicableProductIds: [],
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
  pending: { label: "Chờ TT", className: "bg-amber-100 text-amber-700", icon: <Clock className="h-3.5 w-3.5" /> },
  paid: { label: "Đã TT", className: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  delivered: { label: "Đã giao", className: "bg-emerald-100 text-emerald-700", icon: <Truck className="h-3.5 w-3.5" /> },
  cancelled: { label: "Hủy", className: "bg-rose-100 text-rose-700", icon: <XCircle className="h-3.5 w-3.5" /> },
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
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
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
    const nextIds =
      price !== undefined && !Number.isNaN(price) && !currentIds.includes(productId)
        ? [...currentIds, productId]
        : currentIds;
    setSettings({ ...settings, flashSaleProductIds: nextIds, flashSalePrices: nextPrices });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/settings", { method: "POST", body: JSON.stringify(settings) });
      setMsg("Đã lưu cài đặt");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      await api("/api/admin/orders", { method: "PUT", body: JSON.stringify({ id, status }) });
      await loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Lỗi");
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      await api("/api/admin/products", { method: "POST", body: JSON.stringify(editingProduct) });
      setEditingProduct(null);
      await loadAll();
      setMsg("Đã lưu sản phẩm");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await api("/api/admin/products", { method: "DELETE", body: JSON.stringify({ id }) });
      await loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Lỗi");
    }
  }

  async function saveVoucher(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVoucher) return;
    setSaving(true);
    try {
      await api("/api/admin/vouchers", { method: "POST", body: JSON.stringify(editingVoucher) });
      setEditingVoucher(null);
      await loadAll();
      setMsg("Đã lưu voucher");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVoucher(code: string) {
    if (!confirm("Xóa voucher này?")) return;
    try {
      await api("/api/admin/vouchers", { method: "DELETE", body: JSON.stringify({ code }) });
      await loadAll();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Lỗi");
    }
  }

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid" || o.status === "delivered");
    const revenue = paid.reduce((s, o) => s + (o.amount || 0), 0);
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
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Mật khẩu admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {msg && <p className="text-sm text-rose-500 text-center">{msg}</p>}
          <button onClick={login} disabled={loading} className="w-full rounded-xl bg-red-700 py-3 font-bold text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Đăng nhập"}
          </button>
          <Link href="/" className="block text-center text-sm text-slate-500 hover:underline">
            ← Về trang chủ
          </Link>
        </div>
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
          {([
            ["dashboard", LayoutDashboard, "Dashboard"],
            ["orders", ShoppingBag, "Đơn hàng"],
            ["products", Package, "Sản phẩm"],
            ["vouchers", Ticket, "Voucher"],
            ["settings", Settings, "Cài đặt"],
          ] as const).map(([id, Icon, label]) => (
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
          <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2 text-sm text-emerald-700">
            {msg}
          </div>
        )}

        {tab === "dashboard" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Tổng đơn", stats.total, ""],
              ["Chờ thanh toán", stats.pending, "text-amber-600"],
              ["Đã thanh toán", stats.paid, "text-emerald-600"],
              ["Doanh thu", formatMoney(stats.revenue), "text-red-600"],
            ].map(([label, val, color]) => (
              <div key={String(label)} className="rounded-2xl border bg-white dark:bg-slate-900 p-5">
                <div className="text-sm text-slate-500">{label}</div>
                <div className={`mt-1 text-2xl font-black ${color}`}>{val}</div>
              </div>
            ))}
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
                  <div key={o.id} className="rounded-2xl border bg-white dark:bg-slate-900 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{o.id}</div>
                        <div className="text-sm text-slate-500">
                          {o.customerName || o.customerContact || "—"} · {new Date(o.createdAt).toLocaleString("vi-VN")}
                        </div>
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
                      <div className="font-bold text-red-600">{formatMoney(o.amount)}</div>
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
            <button onClick={() => setEditingProduct({ ...emptyProduct })} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </button>
            {editingProduct && (
              <form onSubmit={saveProduct} className="rounded-2xl border bg-white dark:bg-slate-900 p-4 space-y-3">
                <h3 className="font-bold">{editingProduct.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Tên" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} required />
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Category" value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="w-full rounded-xl border px-3 py-2" type="number" placeholder="Giá" value={editingProduct.price || ""} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} required />
                  <input className="w-full rounded-xl border px-3 py-2" placeholder="Thời hạn" value={editingProduct.duration} onChange={(e) => setEditingProduct({ ...editingProduct, duration: e.target.value })} />
                </div>
                <textarea className="w-full rounded-xl border px-3 py-2" rows={2} placeholder="Mô tả" value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} />
                <input className="w-full rounded-xl border px-3 py-2" placeholder="URL ảnh" value={editingProduct.image || ""} onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(editingProduct.active)} onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })} />
                  Đang bán
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="rounded-xl bg-red-700 px-4 py-2 font-bold text-white">{saving ? "..." : "Lưu"}</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="rounded-xl border px-4 py-2">Hủy</button>
                </div>
              </form>
            )}
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-2xl border bg-white dark:bg-slate-900 p-4">
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.category} · {p.duration} · {formatMoney(p.price)}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingProduct(p)} className="rounded-lg p-2 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "vouchers" && (
          <div className="space-y-4">
            <button onClick={() => setEditingVoucher({ ...emptyVoucher })} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 font-bold text-white">
              <Plus className="h-4 w-4" /> Thêm voucher
            </button>
            {editingVoucher && (
              <form onSubmit={saveVoucher} className="rounded-2xl border bg-white dark:bg-slate-900 p-4 space-y-3">
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Mã" value={editingVoucher.code} onChange={(e) => setEditingVoucher({ ...editingVoucher, code: e.target.value.toUpperCase() })} required />
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full rounded-xl border px-3 py-2" value={editingVoucher.type} onChange={(e) => setEditingVoucher({ ...editingVoucher, type: e.target.value as "fixed" | "percent" })}>
                    <option value="fixed">Giảm cố định</option>
                    <option value="percent">Giảm %</option>
                  </select>
                  <input className="w-full rounded-xl border px-3 py-2" type="number" placeholder="Giá trị" value={editingVoucher.value || ""} onChange={(e) => setEditingVoucher({ ...editingVoucher, value: Number(e.target.value) })} required />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(editingVoucher.active)} onChange={(e) => setEditingVoucher({ ...editingVoucher, active: e.target.checked })} />
                  Active
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="rounded-xl bg-red-700 px-4 py-2 font-bold text-white">Lưu</button>
                  <button type="button" onClick={() => setEditingVoucher(null)} className="rounded-xl border px-4 py-2">Hủy</button>
                </div>
              </form>
            )}
            {vouchers.map((v) => (
              <div key={v.id || v.code} className="flex items-center justify-between rounded-2xl border bg-white dark:bg-slate-900 p-4">
                <div>
                  <div className="font-bold">{v.code}</div>
                  <div className="text-sm text-slate-500">{v.type === "percent" ? `${v.value}%` : formatMoney(v.value)}</div>
                </div>
                <button onClick={() => deleteVoucher(v.code)} className="rounded-lg p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <form onSubmit={saveSettings} className="space-y-6">
            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="text-lg font-black">Thông tin cửa hàng</h2>
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Tiêu đề site" value={settings.siteTitle || ""} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Phụ đề" value={settings.siteSubtitle || ""} onChange={(e) => setSettings({ ...settings, siteSubtitle: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Hero title" value={settings.heroTitle || ""} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} />
              <textarea className="w-full rounded-xl border px-3 py-2" rows={2} placeholder="Hero mô tả" value={settings.heroDescription || ""} onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Link Zalo" value={settings.zaloLink || ""} onChange={(e) => setSettings({ ...settings, zaloLink: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Link cộng đồng" value={settings.communityLink || ""} onChange={(e) => setSettings({ ...settings, communityLink: e.target.value })} />
            </div>

            <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-3">
              <h2 className="text-lg font-black">⚡ Flash Sale ({(settings.flashSaleProductIds || []).length} SP)</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.flashSaleEnabled !== false} onChange={(e) => setSettings({ ...settings, flashSaleEnabled: e.target.checked })} />
                Bật Flash Sale
              </label>
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Tiêu đề" value={settings.flashSaleTitle || ""} onChange={(e) => setSettings({ ...settings, flashSaleTitle: e.target.value })} />
              <input className="w-full rounded-xl border px-3 py-2" type="datetime-local" value={toDateTimeLocalValue(settings.flashSaleEndsAt)} onChange={(e) => setSettings({ ...settings, flashSaleEndsAt: dateTimeLocalToIso(e.target.value) })} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="Badge" value={settings.flashSaleBadge || ""} onChange={(e) => setSettings({ ...settings, flashSaleBadge: e.target.value })} />
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Chọn sản phẩm</span>
                {(settings.flashSaleProductIds || []).length > 0 && (
                  <button type="button" onClick={clearFlashSaleProducts} className="text-rose-500 text-xs">Bỏ chọn</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto rounded-xl border divide-y">
                {products.filter((p) => p.active).map((p) => {
                  const selected = (settings.flashSaleProductIds || []).includes(p.id);
                  const salePrice = settings.flashSalePrices?.[p.id] ?? "";
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-2 p-3">
                      <label className="flex flex-1 items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={selected} onChange={() => toggleFlashSaleProduct(p.id)} />
                        <span className="truncate font-medium">{p.name}</span>
                      </label>
                      <input type="number" min={0} step={1000} placeholder="Giá sale" className="w-28 rounded-lg border px-2 py-1 text-sm" value={salePrice} onChange={(e) => setFlashSalePrice(p.id, e.target.value)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="w-full rounded-xl bg-red-700 py-3 font-bold text-white" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
