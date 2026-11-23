import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.minhwuan.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c41e3a" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0a0f" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "🎄 Minh Wuan Store | Noel Sale – App Pro/Premium giá tốt",
    template: "%s | Minh Wuan Store",
  },
  description:
    "Mua App Pro/Premium giá tốt: ChatGPT Plus/Pro, Gemini, CapCut Pro, Canva, Netflix, YouTube Premium, Spotify. Thanh toán VietQR tự động, bảo hành rõ ràng, kích hoạt 1–5 phút tại minhwuan.com",
  keywords: [
    "mua chatgpt plus",
    "mua capcut pro",
    "netflix premium giá rẻ",
    "youtube premium",
    "gemini pro",
    "app premium việt nam",
    "minhwuan",
    "mua tài khoản pro",
    "combo ai",
    "vietqr thanh toán",
  ],
  authors: [{ name: "Minh Wuan Store", url: siteUrl }],
  creator: "Minh Wuan",
  publisher: "Minh Wuan Store",
  applicationName: "Minh Wuan Store",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName: "Minh Wuan Store",
    title: "Minh Wuan Store | App Pro/Premium giá tốt",
    description:
      "Bảng giá ChatGPT, CapCut, Netflix, YouTube Premium cập nhật liên tục. Thanh toán VietQR, bảo hành rõ ràng.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Minh Wuan Store - App Pro/Premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Minh Wuan Store | App Pro/Premium",
    description: "Mua ChatGPT, CapCut, Netflix Premium – VietQR tự động, kích hoạt nhanh.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/logo-icon.png",
  },
  category: "shopping",
  other: {
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <JsonLd />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
