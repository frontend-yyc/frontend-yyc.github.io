import type { CollectionEntry } from "astro:content";
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

export const eventPath = (event: Event) => `/events/${event.id}/`;

// Cards rendered by src/pages/og/[...path].png.ts.
export const ogImagePath = (event: Event) => `/og/events/${event.id}.png`;
export const wideImagePath = (event: Event) =>
  `/og/events/${event.id}-16x9.png`;
