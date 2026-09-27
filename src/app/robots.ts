import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://an-11-players.web.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/owner/", "/inbox/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
