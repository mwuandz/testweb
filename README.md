# Minh Wuan Store v2 – Nâng cấp toàn diện

Website bán App Pro/Premium cho **minhwuan.com**.

## Những gì đã nâng cấp (v2)

### UI/UX
- Tailwind CSS 3 + design system hiện đại
- Dark mode (next-themes) – theo hệ thống hoặc thủ công
- Header mới: search, theme toggle, giỏ hàng badge, menu mobile
- Product Card đẹp hơn (ảnh, badge, giá sale, hover)
- Trang chi tiết sản phẩm `/product/[id]`
- Trang tra cứu đơn hàng `/tra-cuu`
- Responsive tốt hơn trên mobile

### Tính năng mới
- Tra cứu đơn theo mã MW... hoặc số điện thoại/Zalo
- API lookup `/api/orders/lookup`
- Helpers Redis: `getOrderByCode`, `getOrdersByContact`

### Giữ nguyên (tương thích 100%)
- Toàn bộ logic thanh toán VietQR + SePay webhook
- Telegram thông báo
- Admin panel (sản phẩm, voucher, settings, đơn hàng)
- Giỏ hàng + voucher
- Flash sale
- Deploy Vercel + Upstash Redis

## Cài đặt & chạy

```bash
# Cài dependency (dùng bun hoặc npm)
bun install
# hoặc
npm install

# Dev
bun run dev

# Build
bun run build
```

## Environment Variables (giống bản cũ)

```
NEXT_PUBLIC_BASE_URL=https://www.minhwuan.com
ADMIN_PASSWORD=mat-khau-admin

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

VIETQR_BANK_BIN=970422
VIETQR_ACCOUNT_NO=so-tai-khoan-mb
VIETQR_ACCOUNT_NAME=DOAN MINH QUAN
VIETQR_TEMPLATE=compact2

SEPAY_WEBHOOK_TOKEN=
```

## Cấu trúc mới

```
app/
  page.tsx              # Homepage (có thể refactor thêm)
  product/[id]/page.tsx # Chi tiết sản phẩm (mới)
  tra-cuu/page.tsx      # Tra cứu đơn (mới)
  admin/page.tsx        # Admin (giữ nguyên)
  api/...               # API (giữ + thêm lookup)
components/
  header.tsx
  product-card.tsx
  theme-provider.tsx
lib/
  utils.ts              # cn() helper
  ...
```

## Roadmap tiếp theo (bạn có thể làm dần)

1. Refactor `app/page.tsx` để dùng `Header` + `ProductCard` + Tailwind hoàn toàn
2. Cart Drawer component đẹp (slide-over)
3. Admin dashboard có biểu đồ doanh thu
4. Hệ thống tài khoản khách (NextAuth / Clerk)
5. Affiliate / mã giới thiệu
6. Review sản phẩm
7. PWA

## Deploy

Giống bản cũ trên Vercel. Chỉ cần set lại env và deploy folder này.

---

Made for minhwuan.com · 2026
