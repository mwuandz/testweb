# Minh Wuan Store v2

Website bán App Pro/Premium – **minhwuan.com**

## Tính năng

### Khách
- UI hiện đại + Dark mode, Cart Drawer
- Chi tiết sản phẩm, tra cứu đơn, tài khoản khách
- VietQR + SePay + Telegram

### Admin
- Dashboard doanh thu, CRUD sản phẩm/voucher/cài đặt

### SEO (mới)
- Metadata đầy đủ (title template, description, keywords)
- Open Graph + Twitter Card + ảnh OG động `/opengraph-image`
- JSON-LD: Organization, WebSite, OnlineStore, Product
- `robots.txt` (chặn /admin, /api, /tai-khoan…)
- `sitemap.xml` động (trang tĩnh + mọi sản phẩm)
- Canonical URL từng trang
- `lang="vi"`, viewport, theme-color

## Chạy

```bash
bun install && bun run dev
```

| URL | Mô tả |
|-----|--------|
| `/` | Trang chủ |
| `/product/[id]` | Chi tiết + SEO product schema |
| `/sitemap.xml` | Sitemap |
| `/robots.txt` | Robots |
| `/admin` | Admin |

## Env

```
NEXT_PUBLIC_BASE_URL=https://www.minhwuan.com
ADMIN_PASSWORD=...
# Redis, Telegram, VietQR, SePay...
```

**Quan trọng SEO:** set đúng `NEXT_PUBLIC_BASE_URL` trên production.

## Sau khi deploy

1. Google Search Console → gửi sitemap: `https://www.minhwuan.com/sitemap.xml`
2. Kiểm tra rich results: https://search.google.com/test/rich-results
3. (Tuỳ chọn) thêm Google Analytics / GTM

---
minhwuan.com · 2026
