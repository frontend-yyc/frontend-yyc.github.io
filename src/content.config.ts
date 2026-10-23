import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { file, glob } from "astro/loaders";

// A quoted ISO 8601 time with its UTC offset. Unquoted, YAML parses the value
// itself and reads a time without an offset as UTC, which would silently move
// a 6 PM Calgary event to noon.
const eventTime = z.iso
  .datetime({
    offset: true,
    error:
      'Write a quoted time with the Calgary UTC offset, e.g. "2026-06-30T18:00:00-06:00" (-07:00 in winter)',
  })
  .transform((value) => new Date(value));

const venues = defineCollection({
  loader: file("src/data/venues.yaml"),
  // Maps onto schema.org Place/PostalAddress.
  schema: z.object({
    name: z.string(),
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string(),
    postalCode: z.string(),
    addressCountry: z.string().length(2),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      author: z.string(),
      image: z.string().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
      eventbrite: z.string().optional(),
      startDate: eventTime,
      endDate: eventTime,
      venue: reference("venues"),
      room: z.string().optional(),
      presenters: z
        .array(
          z.object({
            name: z.string(),
            title: z.string().optional(),
            page: z.string().optional(),
            profileUrl: z.string().optional(),
          }),
        )
        .optional(),
      slideDeck: z.string().optional(),
    })
    .refine((event) => event.endDate > event.startDate, {
      path: ["endDate"],
      error: "endDate must be after startDate",
    }),
});

export const collections = { venues, blog };
