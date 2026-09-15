import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://matchmate.live").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated/per-user routes: no evergreen content to rank. Profiles stay
      // unindexed for the same privacy reasons other dating apps keep them out too.
      disallow: ["/api/", "/messages", "/profile/", "/onboarding/", "/auth/callback"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
