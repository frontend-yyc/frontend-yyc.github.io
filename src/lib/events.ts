import { getEntry, type CollectionEntry } from "astro:content";
import { siteConfig } from "@/config/site";

type Event = CollectionEntry<"blog">;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: siteConfig.timeZone,
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
  timeZone: siteConfig.timeZone,
});

// "Tuesday, June 30, 2026"
export const formatEventDate = (event: Event) =>
  dateFormat.format(event.data.startDate);

// "6:00 – 7:00 PM MDT": the zone abbreviation follows daylight saving time.
export const formatEventTime = (event: Event) =>
  timeFormat.formatRange(event.data.startDate, event.data.endDate);

// Evaluated at build time, so a deploy is what moves an event to "past".
export const isUpcoming = (event: Event) => event.data.endDate > new Date();

// reference() isn't checked when content syncs, so a typo in `venue:` would
// otherwise surface as "cannot read properties of undefined" mid-build.
export const getVenue = async (event: Event) => {
  const venue = await getEntry(event.data.venue);
  if (!venue) {
    throw new Error(
      `${event.id}: venue "${event.data.venue.id}" is not in src/data/venues.yaml`,
    );
  }
  return venue.data;
};

// "Calgary Public Library - Memorial Park, Meeting Room 2"
export const formatVenue = (
  event: Event,
  venue: CollectionEntry<"venues">["data"],
) => [venue.name, event.data.room].filter(Boolean).join(", ");

export const eventPath = (event: Event) => `/events/${event.id}/`;

// Cards rendered by src/pages/og/[...path].png.ts.
export const ogImagePath = (event: Event) => `/og/events/${event.id}.png`;

// Google's Event rich result asks for 16:9, 4:3 and 1:1 images.
export const structuredDataRatios = ["16x9", "4x3", "1x1"] as const;
export type StructuredDataRatio = (typeof structuredDataRatios)[number];
export const structuredDataImagePath = (
  event: Event,
  ratio: StructuredDataRatio,
) => `/og/events/${event.id}-${ratio}.png`;
