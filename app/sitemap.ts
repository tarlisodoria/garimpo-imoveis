import type { MetadataRoute } from "next";

import { getPublicSnapshot } from "../lib/public-data";
import { siteUrl } from "../lib/site";

export const dynamic = "force-static";

const staticRoutes = ["/status", "/termos", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  const snapshot = getPublicSnapshot();

  const dynamicRoutes = snapshot.ufs.flatMap((entry) => [
    `/${entry.uf.toLowerCase()}`,
    ...entry.cidades.map(
      (cidade) => `/${entry.uf.toLowerCase()}/${cidade.slug}`,
    ),
  ]);

  const snapshotDate = snapshot.generatedAt
    ? new Date(snapshot.generatedAt)
    : undefined;
  const lastModified =
    snapshotDate && Number.isFinite(snapshotDate.getTime())
      ? snapshotDate
      : undefined;

  return [
    ...["", ...dynamicRoutes].map((route) => ({
      url: `${siteUrl}${route}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.7,
    })),
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
