import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description:
    "Tra cứu trạng thái đơn hàng Minh Wuan Store bằng mã đơn MW... hoặc số Zalo/SĐT.",
  alternates: { canonical: "/tra-cuu" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
