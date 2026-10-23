import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { renderEventCard, renderSiteCard } from "@/lib/og-image";

// Prerendered into dist/og/: default.png for every page without its own
// card, plus events/<slug>.png (Open Graph) and events/<slug>-16x9.png
// (Event structured data) for each event.
export const getStaticPaths = (async () => {
  const events = await getCollection("blog");
  return [
    { params: { path: "default" }, props: {} },
    ...events.flatMap((event) => [
      {
        params: { path: `events/${event.id}` },
        props: { event, variant: "og" },
      },
      {
        params: { path: `events/${event.id}-16x9` },
        props: { event, variant: "wide" },
      },
    ]),
  ];
}) satisfies GetStaticPaths;

interface Props {
  event?: CollectionEntry<"blog">;
  variant?: "og" | "wide";
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = props.event
    ? await renderEventCard(props.event, props.variant ?? "og")
    : await renderSiteCard();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
