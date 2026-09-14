import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://matchmate.live").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated or per-user dynamic routes: no evergreen public content to
      // rank, and crawling them wastes crawl budget. Profile pages are kept
      // out of search results for the same privacy reasons dating apps
      // (Tinder, Bumble, Hinge, ...) don't let individual profiles be indexed.
      disallow: ["/api/", "/messages", "/profile/", "/onboarding/", "/auth/callback"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
