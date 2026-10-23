import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { renderEventCard, renderSiteCard } from "@/lib/og-image";
import { structuredDataRatios, type StructuredDataRatio } from "@/lib/events";

// Prerendered into dist/og/: default.png for every page without its own
// card, plus, for each event, events/<slug>.png (Open Graph) and
// events/<slug>-<ratio>.png (Event structured data).
export const getStaticPaths = (async () => {
  const events = await getCollection("blog");
  return [
    { params: { path: "default" }, props: {} },
    ...events.flatMap((event) => [
      { params: { path: `events/${event.id}` }, props: { event } },
      ...structuredDataRatios.map((ratio) => ({
        params: { path: `events/${event.id}-${ratio}` },
        props: { event, ratio },
      })),
    ]),
  ];
}) satisfies GetStaticPaths;

interface Props {
  event?: CollectionEntry<"blog">;
  ratio?: StructuredDataRatio;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = props.event
    ? await renderEventCard(props.event, props.ratio)
    : await renderSiteCard();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
