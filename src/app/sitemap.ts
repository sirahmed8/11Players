import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://an-11-players.web.app";
  const now = new Date().toISOString();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/guide", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/communities", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/matches", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/leaderboard", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/stats", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/achievements", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/tos", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refund", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/refunds", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/cookie", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/cookies", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/pro-pass", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/split-bill", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/thank-you", priority: 0.4, changeFrequency: "monthly" as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
