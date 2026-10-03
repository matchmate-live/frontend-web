import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://matchmate.live").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or per-user pages. Profiles stay out of search engines for privacy.
      disallow: ["/api/", "/messages", "/profile/", "/onboarding/", "/auth/callback", "/settings"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
