import { defineCollection, z } from "astro:content";
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
    eventDate: z.string().optional(),
    eventTime: z.string().optional(),
    eventLocation: z.string().optional(),
  }),
});

export const collections = { blog };
