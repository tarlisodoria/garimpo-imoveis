import type { MetadataRoute } from "next";

import { getPublicSnapshot } from "../lib/public-data";
import { siteUrl } from "../lib/site";

export const dynamic = "force-static";

const staticRoutes = ["", "/status", "/termos", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  const snapshot = getPublicSnapshot();
  const updatedAt = new Date();

  const dynamicRoutes = snapshot.ufs.flatMap((entry) => [
    `/${entry.uf.toLowerCase()}`,
    ...entry.cidades.map(
      (cidade) => `/${entry.uf.toLowerCase()}/${cidade.slug}`,
    ),
  ]);

  const routes = [...staticRoutes, ...dynamicRoutes];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: updatedAt,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
