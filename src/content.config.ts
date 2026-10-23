import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    eventbrite: z.string().optional(),
    // Write these with the Calgary UTC offset, e.g. 2026-06-30T18:00:00-06:00
    // (-07:00 in winter), so the instant is unambiguous.
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    // Maps onto schema.org Place/PostalAddress; Google's Event rich result
    // requires a full street address.
    location: z.object({
      name: z.string(),
      streetAddress: z.string(),
      addressLocality: z.string().default("Calgary"),
      addressRegion: z.string().default("AB"),
      postalCode: z.string(),
      addressCountry: z.string().default("CA"),
    }),
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
  }),
});

export const collections = { blog };
