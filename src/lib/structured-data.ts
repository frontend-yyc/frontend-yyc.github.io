import type { CollectionEntry } from "astro:content";
import { siteConfig } from "@/config/site";
import { eventPath, isUpcoming, wideImagePath } from "@/lib/events";

const absolute = (path: string) => new URL(path, siteConfig.url).href;

const organization = {
  "@type": "Organization",
  name: siteConfig.name,
  url: absolute("/"),
};

// Homepage only: WebSite is how Google picks the site name shown in results,
// and its Organization doc asks for that markup on the homepage.
export const homeSchema = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absolute("/#website"),
      name: siteConfig.name,
      alternateName: siteConfig.alternateNames,
      url: absolute("/"),
      inLanguage: siteConfig.lang,
      publisher: { "@id": absolute("/#organization") },
    },
    {
      ...organization,
      "@id": absolute("/#organization"),
      alternateName: siteConfig.alternateNames,
      description: siteConfig.description,
      // Google wants a raster logo of at least 112x112.
      logo: absolute("/logo.png"),
      email: siteConfig.email,
      sameAs: siteConfig.sameAs,
    },
  ],
});

// https://developers.google.com/search/docs/appearance/structured-data/event
export const eventSchema = (event: CollectionEntry<"blog">) => {
  const {
    title,
    description,
    startDate,
    endDate,
    location,
    eventbrite,
    presenters = [],
  } = event.data;
  const { name, ...address } = location;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    description,
    url: absolute(eventPath(event)),
    image: [absolute(wideImagePath(event))],
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name,
      address: { "@type": "PostalAddress", ...address },
    },
    organizer: organization,
    performer: presenters.map((presenter) => ({
      "@type": "Person",
      name: presenter.name,
      jobTitle: presenter.title,
      sameAs: presenter.page,
    })),
    // Every meetup is free (confirmed by the organizers, 2026-10-22).
    isAccessibleForFree: true,
    offers: eventbrite && {
      "@type": "Offer",
      url: eventbrite,
      price: 0,
      priceCurrency: "CAD",
      // Only claim tickets are available while registration can be open.
      ...(isUpcoming(event) && {
        availability: "https://schema.org/InStock",
      }),
    },
  };
};
