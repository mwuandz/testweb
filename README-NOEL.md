# 🎄 Minh Wuan Store – Noel 2026 Full Theme

Nâng cấp **toàn bộ giao diện** theo chủ đề Giáng Sinh.

## Phạm vi đã làm

### Core styles
- `app/globals.css` – Màu Noel, snowfall, btn-primary/gold, badge, chip, glow, hero bg
- `tailwind.config.ts` – Palette `noel` + brand đỏ

### Components
- `components/snow.tsx` – Tuyết rơi
- `components/header.tsx` – Accent Noel, cart badge đỏ
- `components/product-card.tsx` – Card gradient Noel, nút Mua đỏ→gold
- `components/cart-drawer.tsx` – Giỏ hàng Noel

### Pages
| Trang | File |
|-------|------|
| Trang chủ | `app/page.tsx` |
| Product detail | `app/product/[id]/product-client.tsx` |
| Tra cứu đơn | `app/tra-cuu/page.tsx` |
| Tài khoản | `app/tai-khoan/page.tsx` |
| Đăng nhập / Đăng ký | `app/dang-nhap/page.tsx` |
| Checkout | `app/checkout/[id]/page.tsx` |
| Admin | `app/admin/page.tsx` (màu primary) |
| Layout | `app/layout.tsx` |

## Cách áp dụng

Từ thư mục **repo gốc** của bạn:

```bash
# Copy styles + components + pages
cp -r path/to/testweb-noel/app/* ./app/
cp -r path/to/testweb-noel/components/* ./components/
cp path/to/testweb-noel/tailwind.config.ts ./
```

Rồi chạy:

```bash
bun install
bun run dev
```

## Màu chủ đạo
| Token | Hex |
|-------|-----|
| Noel Red | `#c41e3a` |
| Red Dark | `#9b1b2e` |
| Green | `#1a7a4c` |
| Gold | `#d4a017` |
| Gold Light | `#f0c14b` |

## Tắt tuyết
Xóa dòng `<Snow count={35} />` trong `app/page.tsx`.

---
minhwuan.com · Noel 2026
