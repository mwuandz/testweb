import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.minhwuan.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/tai-khoan", "/dang-nhap", "/checkout"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
