import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập / Đăng ký",
  description: "Đăng nhập tài khoản Minh Wuan Store để xem lịch sử đơn hàng.",
  alternates: { canonical: "/dang-nhap" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
