"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProducts, defaultSettings } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { CartItem, Order, Product, SiteSettings } from "@/lib/types";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { CartDrawer } from "@/components/cart-drawer";
import { Shield, Zap, QrCode, Gift, X, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CART_KEY = "minhwuan_cart";
type LocalCartItem = { productId: string; quantity: number };

type VoucherState = {
  code: string;
  valid: boolean;
  discountAmount: number;
  eligibleAmount?: number;
  eligibleProductNames?: string[];
  message: string;
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days} ngày ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getActiveFlashSalePrice(product: Product, settings: SiteSettings, now: number) {
  const endsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  if (settings.flashSaleEnabled === false) return product.price;
  if (endsAt > 0 && endsAt <= now) return product.price;

  const selectedIds = settings.flashSaleProductIds || [];
  const isSelected = selectedIds.length
    ? selectedIds.includes(product.id)
    : /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`);
  if (!isSelected) return product.price;

  const rawSalePrice = settings.flashSalePrices?.[product.id];
  const salePrice = Number(rawSalePrice || 0);
  if (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= product.price) return product.price;
  return salePrice;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [category, setCategory] = useState("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashDismissed, setFlashDismissed] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState<VoucherState | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products?.length) setProducts(data.products);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => null)
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!paymentOrder?.id || paymentOrder.status !== "pending") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${paymentOrder.id}`);
        const data = await res.json();
        if (res.ok && data.order) setPaymentOrder(data.order);
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [paymentOrder?.id, paymentOrder?.status]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    setVoucher(null);
  }, [cart]);

  // Open cart if ?cart=open
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("cart=open")) {
      setCartOpen(true);
    }
  }, []);

  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const detailedCart = useMemo<CartItem[]>(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        const activePrice = getActiveFlashSalePrice(product, settings, now);
        return {
          productId: product.id,
          name: product.name,
          category: product.category,
          duration: product.duration,
          price: activePrice,
          quantity: item.quantity,
          subtotal: activePrice * item.quantity,
        } satisfies CartItem;
      })
      .filter(Boolean) as CartItem[];
  }, [cart, products, settings, now]);

  const cartTotal = detailedCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = voucher?.valid ? voucher.discountAmount : 0;
  const payableTotal = Math.max(0, cartTotal - discountAmount);
  const cartQuantity = detailedCart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.active === false) return false;
      const matchCategory = category === "Tất cả" || product.category === category;
      const matchKeyword = `${product.name} ${product.category} ${product.description} ${product.duration}`
        .toLowerCase()
        .includes(keyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [category, keyword, products]);

  const flashProducts = useMemo(() => {
    const ids = settings.flashSaleProductIds || [];
    const activeProducts = products.filter((product) => product.active !== false && product.price > 0);
    if (ids.length) {
      return ids
        .map((id) => activeProducts.find((product) => product.id === id))
        .filter(Boolean)
        .slice(0, 6) as Product[];
    }
    return activeProducts
      .filter((product) => /hot|best|combo|giá tốt|rẻ/i.test(`${product.badge || ""} ${product.category}`))
      .slice(0, 6);
  }, [products, settings.flashSaleProductIds]);

  const flashEndsAt = settings.flashSaleEndsAt ? new Date(settings.flashSaleEndsAt).getTime() : 0;
  const flashRemaining = flashEndsAt > 0 ? formatRemaining(flashEndsAt - now) : "Đang mở";
  const flashExpired = flashEndsAt > 0 && flashEndsAt <= now;
  const flashSaleActive = settings.flashSaleEnabled !== false && flashProducts.length > 0 && !flashExpired;

  useEffect(() => {
    if (!settingsLoaded || !flashSaleActive) return;
    try {
      if (sessionStorage.getItem("mw_flash_popup_seen")) {
        setFlashDismissed(true);
        return;
      }
    } catch {}
    const timer = setTimeout(() => setFlashOpen(true), 650);
    return () => clearTimeout(timer);
  }, [settingsLoaded, flashSaleActive]);

  useEffect(() => {
    if (!settingsLoaded || settings.communityPopupEnabled === false) return;
    if (flashSaleActive && !flashDismissed) return;
    try {
      if (sessionStorage.getItem("mw_community_popup_seen")) return;
    } catch {}
    const timer = setTimeout(() => setCommunityOpen(true), 900);
    return () => clearTimeout(timer);
  }, [settingsLoaded, settings.communityPopupEnabled, flashSaleActive, flashDismissed]);

  function addToCart(productId: string) {
    setCart((current) => {
      const existed = current.find((item) => item.productId === productId);
      if (existed)
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      return [...current, { productId, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function changeQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return removeFromCart(productId);
    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.productId !== productId));
  }

  function closeFlashPopup() {
    try {
      sessionStorage.setItem("mw_flash_popup_seen", "1");
    } catch {}
    setFlashOpen(false);
    setFlashDismissed(true);
  }

  function closeCommunityPopup() {
    try {
      sessionStorage.setItem("mw_community_popup_seen", "1");
    } catch {}
    setCommunityOpen(false);
  }

  async function applyVoucher() {
    if (!voucherInput.trim())
      return setVoucher({ code: "", valid: false, discountAmount: 0, message: "Vui lòng nhập mã voucher" });
    if (!cartTotal)
      return setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Giỏ hàng đang trống" });
    setVoucherLoading(true);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherInput.trim(),
          items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const data = await res.json();
      setVoucher({
        code: voucherInput.trim(),
        valid: data.valid,
        discountAmount: data.discountAmount || 0,
        eligibleAmount: data.eligibleAmount,
        eligibleProductNames: data.eligibleProductNames,
        message: data.message || (data.valid ? "Áp dụng thành công" : "Mã không hợp lệ"),
      });
    } catch {
      setVoucher({ code: voucherInput, valid: false, discountAmount: 0, message: "Lỗi kiểm tra voucher" });
    } finally {
      setVoucherLoading(false);
    }
  }

  async function handleCheckout(formData: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: detailedCart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          voucherCode: voucher?.valid ? voucher.code : undefined,
          customerName: formData.get("customerName"),
          customerContact: formData.get("customerContact"),
          customerEmail: formData.get("customerEmail"),
          customerNote: formData.get("customerNote"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không tạo được đơn hàng");
        return;
      }
      localStorage.removeItem(CART_KEY);
      setCart([]);
      setVoucher(null);
      setCartOpen(false);
      setPaymentOrder(data.order);
    } catch {
      alert("Có lỗi xảy ra khi tạo đơn");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top marquee */}
      <div className="overflow-hidden bg-slate-900 text-white">
        <div className="marquee-track py-2.5 text-sm font-medium">
          <span className="px-8">🔥 {settings.warningText}</span>
          <span className="px-8">🔥 {settings.warningText}</span>
          <span className="px-8">🔥 {settings.warningText}</span>
          <span className="px-8">🔥 {settings.warningText}</span>
        </div>
      </div>

      {/* Event strip */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-pink-500/10 py-2.5 text-center text-sm font-bold text-blue-600 dark:text-blue-400">
        ✅ {settings.eventText}
      </div>

      <Header
        siteTitle={settings.siteTitle}
        brandDomain={settings.brandDomain}
        cartCount={cartQuantity}
        onOpenCart={() => setCartOpen(true)}
        onSearch={setKeyword}
      />

      {/* Hero */}
      <section className="container-main py-12 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {settings.siteSubtitle}
            </span>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              {settings.heroTitle}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              {settings.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#products" className="btn-primary">
                Xem bảng giá
              </a>
              <button onClick={() => setCartOpen(true)} className="btn-secondary">
                Mở giỏ hàng
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-500" /> Bảo hành
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-violet-500" /> Kích hoạt 1–5 phút
              </span>
              <span className="flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-pink-500" /> Voucher thanh toán
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative card-surface p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold">Thanh toán tự động</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">VietQR · MB Bank · SePay</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tổng giỏ hàng</span>
                  <span className="font-bold">{formatMoney(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Voucher</span>
                  <span className="font-bold">
                    {discountAmount ? `-${formatMoney(discountAmount)}` : "Có hỗ trợ"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-base">
                  <span className="font-bold">Cần thanh toán</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {formatMoney(payableTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="container-main pb-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Bảng giá App Pro/Premium
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight">Chọn sản phẩm và thêm vào giỏ</h2>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                category === item
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:text-slate-50"
              )}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-16 text-center text-slate-500 dark:text-slate-400">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const activePrice = getActiveFlashSalePrice(product, settings, now);
              const hasFlashSale = product.price > 0 && activePrice < product.price;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  salePrice={hasFlashSale ? activePrice : undefined}
                  onAddToCart={(p) => addToCart(p.id)}
                  onBuyNow={(p) => {
                    addToCart(p.id);
                    setCartOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Trust section */}
      <section className="border-t border-slate-200 dark:border-slate-700 bg-slate-100/30 dark:bg-slate-800/30 py-16">
        <div className="container-main">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: "Bảo hành rõ ràng", desc: "Bảo hành trong thời gian sử dụng. Lỗi hỗ trợ nhanh." },
              { icon: Zap, title: "Kích hoạt nhanh", desc: "Shop xử lý 1–5 phút sau khi xác nhận thanh toán." },
              { icon: QrCode, title: "VietQR tự động", desc: "QR tạo theo đúng số tiền, mã đơn và voucher." },
              { icon: Gift, title: "Event Free", desc: "Tặng Free 2 lần/tuần vào tối thứ 4 và thứ 7." },
            ].map((item) => (
              <div key={item.title} className="card-surface p-5">
                <item.icon className="mb-3 h-8 w-8 text-blue-500" />
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          © {new Date().getFullYear()} {settings.siteTitle} ·{" "}
          <a href={settings.zaloLink} className="font-semibold text-slate-900 dark:text-slate-50 hover:underline">
            Liên hệ Zalo
          </a>
        </p>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={detailedCart}
        voucherInput={voucherInput}
        onVoucherInput={setVoucherInput}
        voucher={voucher}
        voucherLoading={voucherLoading}
        onApplyVoucher={applyVoucher}
        onChangeQuantity={changeQuantity}
        onRemove={removeFromCart}
        cartTotal={cartTotal}
        discountAmount={discountAmount}
        payableTotal={payableTotal}
        onCheckout={handleCheckout}
        loading={loading}
        zaloLink={settings.zaloLink}
      />

      {/* Payment Modal */}
      {paymentOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentOrder(null)} />
          <div className="relative w-full max-w-md card-surface p-6 shadow-2xl">
            <button
              onClick={() => setPaymentOrder(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            {paymentOrder.status === "pending" && (
              <>
                <div className="mb-4 flex items-center gap-2 text-amber-500">
                  <Clock className="h-5 w-5" />
                  <span className="font-bold">Chờ thanh toán</span>
                </div>
                <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                  Quét mã QR bên dưới để thanh toán. Đơn sẽ tự xác nhận khi nhận được tiền.
                </p>
                {paymentOrder.qrCode && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={paymentOrder.qrCode}
                    alt="VietQR"
                    className="mx-auto mb-4 w-56 rounded-2xl border border-slate-200 dark:border-slate-700"
                  />
                )}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Mã đơn</span>
                    <span className="font-bold">MW{paymentOrder.orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Số tiền</span>
                    <span className="font-black text-lg">{formatMoney(paymentOrder.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Nội dung</span>
                    <span className="font-mono text-xs">{paymentOrder.paymentContent}</span>
                  </div>
                </div>
              </>
            )}

            {paymentOrder.status === "paid" && (
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h3 className="text-xl font-black">Đã nhận thanh toán!</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Shop sẽ liên hệ và bàn giao sản phẩm sớm nhất.
                </p>
                <p className="mt-4 text-sm font-bold">Mã đơn: MW{paymentOrder.orderCode}</p>
              </div>
            )}

            {(paymentOrder.status === "delivered" || paymentOrder.status === "cancelled") && (
              <div className="text-center">
                <h3 className="text-xl font-black">
                  {paymentOrder.status === "delivered" ? "Đã giao hàng" : "Đơn đã hủy"}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Mã đơn: MW{paymentOrder.orderCode}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flash Sale Popup */}
      {flashOpen && flashSaleActive && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeFlashPopup} />
          <div className="relative w-full max-w-lg card-surface p-6 shadow-2xl">
            <button onClick={closeFlashPopup} className="absolute right-4 top-4 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
            <div className="mb-2 text-sm font-bold uppercase tracking-wider text-rose-500">
              {settings.flashSaleBadge || "FLASH SALE"}
            </div>
            <h3 className="text-2xl font-black">{settings.flashSaleTitle || "Flash Sale hôm nay"}</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              {settings.flashSaleDescription || "Săn nhanh các gói hot với giá tốt."}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-amber-600">
              <Clock className="h-4 w-4" />
              Còn lại: {flashRemaining}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {flashProducts.slice(0, 4).map((p) => {
                const sale = getActiveFlashSalePrice(p, settings, now);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      addToCart(p.id);
                      closeFlashPopup();
                    }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50 p-3 text-left transition hover:border-blue-500/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="font-bold text-sm">{p.name}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-black text-rose-500">{formatMoney(sale)}</span>
                      {sale < p.price && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 line-through">
                          {formatMoney(p.price)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={closeFlashPopup} className="btn-primary mt-5 w-full">
              {settings.flashSaleCta || "Mua ngay"}
            </button>
          </div>
        </div>
      )}

      {/* Community Popup */}
      {communityOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCommunityPopup} />
          <div className="relative w-full max-w-sm card-surface p-6 text-center shadow-2xl">
            <button
              onClick={closeCommunityPopup}
              className="absolute right-4 top-4 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-3 text-4xl">👥</div>
            <h3 className="text-xl font-black">
              {settings.communityPopupTitle || "Tham gia nhóm cộng đồng Zalo"}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {settings.communityPopupDescription ||
                "Vào nhóm để nhận bảng giá mới, event Free và ưu đãi riêng."}
            </p>
            <a
              href={settings.communityLink || settings.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-5 w-full"
              onClick={closeCommunityPopup}
            >
              Tham gia ngay
            </a>
          </div>
        </div>
      )}

      {/* Floating Flash Sale button */}
      {flashSaleActive && !flashOpen && (
        <button
          onClick={() => setFlashOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:scale-105"
        >
          ⚡ Flash Sale
        </button>
      )}
    </div>
  );
}
