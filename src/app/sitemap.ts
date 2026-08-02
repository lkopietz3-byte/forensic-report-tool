import type { MetadataRoute } from "next";
import { SITE_ROUTES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
