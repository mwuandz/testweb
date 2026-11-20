import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Minh Wuan Store - App Pro/Premium",
  description: "Mua App Pro/Premium, Combo AI, Video/Photo, Giải trí. Thanh toán VietQR tự động, bảo hành rõ ràng tại minhwuan.com",
  openGraph: {
    title: "Minh Wuan Store",
    description: "Bảng giá App Pro/Premium cập nhật liên tục",
    url: "https://www.minhwuan.com",
    siteName: "Minh Wuan Store",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
