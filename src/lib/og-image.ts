import { readFile } from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import sharp from "sharp";
import type { CollectionEntry } from "astro:content";
import { siteConfig } from "@/config/site";
import {
  formatEventDate,
  formatEventTime,
  getVenue,
  type StructuredDataRatio,
} from "@/lib/events";

const OG = { ...siteConfig.ogImage, scale: 1 };

// Google's Event rich result wants 16:9, 4:3 and 1:1 images, 1920px wide
// ideally. Each is laid out 1200px wide and rasterised at 1.6x, so the type
// scale matches the Open Graph card.
const STRUCTURED_DATA: Record<
  StructuredDataRatio,
  { width: number; height: number; scale: number }
> = {
  "16x9": { width: 1200, height: 675, scale: 1.6 },
  "4x3": { width: 1200, height: 900, scale: 1.6 },
  "1x1": { width: 1200, height: 1200, scale: 1.6 },
};

const colors = {
  background: "#09090b",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  gradient: "linear-gradient(90deg, #60a5fa, #c084fc, #f472b6)",
};

type JSXNode = Node | string | null | undefined | false;
interface Node {
  type: string;
  props: Record<string, unknown> & { children?: JSXNode[] };
}

// Satori consumes React-element-shaped objects. Not satori/jsx: its
// createElement results don't type-check as children without JSX syntax, and
// JSX here would need Vite's automatic JSX transform enabled project-wide.
const h = (
  type: string,
  props: Record<string, unknown>,
  ...children: JSXNode[]
): Node => ({ type, props: { ...props, children: children.filter(Boolean) } });

const fontFile = (weight: number) =>
  readFile(
    path.resolve(
      `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`,
    ),
  );

let fonts: Promise<Parameters<typeof satori>[1]["fonts"]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all(
    ([400, 600, 800] as const).map(async (weight) => ({
      name: "Inter",
      data: await fontFile(weight),
      weight,
      style: "normal" as const,
    })),
  ));

// Profile photos live in public/ at up to 1200px; shrink them before
// inlining so Satori isn't base64-encoding half a megabyte per card.
const avatar = async (publicPath: string) => {
  const png = await sharp(path.resolve("public", publicPath.replace(/^\//, "")))
    .resize(320, 320, { fit: "cover", position: "top" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
};

const frame = (...children: JSXNode[]) =>
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        // Satori's layout engine follows CSS here: without border-box the
        // padding is added on top of the canvas size and pushes content off.
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        fontFamily: "Inter",
        color: colors.foreground,
        backgroundColor: colors.background,
        // The same two glows BaseLayout paints behind every page.
        backgroundImage:
          "radial-gradient(circle at 0% 0%, rgba(59,130,246,0.32), transparent 55%), radial-gradient(circle at 100% 100%, rgba(168,85,247,0.32), transparent 55%)",
      },
    },
    ...children,
    h("div", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 10,
        backgroundImage: colors.gradient,
      },
    }),
  );

const brand = (size: number) =>
  h(
    "div",
    {
      style: {
        display: "flex",
        // Shrink to the text so the gradient spans the words, not the row.
        alignSelf: "flex-start",
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        backgroundImage: colors.gradient,
        backgroundClip: "text",
        color: "transparent",
      },
    },
    siteConfig.name,
  );

const host = new URL(import.meta.env.SITE).host;

const siteCard = () =>
  frame(
    h(
      "div",
      { style: { display: "flex", fontSize: 28, color: colors.muted } },
      "Meetup community · Calgary",
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      brand(96),
      h(
        "div",
        {
          style: {
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          },
        },
        "Calgary Web Devs",
      ),
      h(
        "div",
        { style: { marginTop: 28, fontSize: 34, color: colors.muted } },
        "Talks, demos and networking for web developers.",
      ),
    ),
    h(
      "div",
      { style: { display: "flex", fontSize: 28, color: colors.muted } },
      host,
    ),
  );

const eventCard = async (event: CollectionEntry<"blog">) => {
  const { title, presenters = [] } = event.data;
  const venue = await getVenue(event);
  const presenter = presenters[0];
  // The card already carries the brand, so don't repeat it in the headline.
  const headline = title.replace(/^Frontend (&|and) Beyond:\s*/i, "");

  return frame(
    brand(36),
    h(
      "div",
      {
        style: {
          display: "flex",
          fontSize: headline.length > 48 ? 64 : 76,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.08,
          maxWidth: 1000,
        },
      },
      headline,
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 30,
          },
        },
        h("div", { style: { fontWeight: 600 } }, formatEventDate(event)),
        h("div", { style: { color: colors.muted } }, formatEventTime(event)),
        h("div", { style: { color: colors.muted } }, venue.name),
      ),
      presenter &&
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 24 } },
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontSize: 28,
              },
            },
            h("div", { style: { color: colors.muted } }, "Presented by"),
            h("div", { style: { fontWeight: 600 } }, presenter.name),
          ),
          presenter.profileUrl &&
            h("img", {
              src: await avatar(presenter.profileUrl),
              width: 150,
              height: 150,
              style: { borderRadius: 9999, border: "4px solid #27272a" },
            }),
        ),
    ),
  );
};

const render = async (
  tree: JSXNode,
  { width, height, scale }: { width: number; height: number; scale: number },
) => {
  // satori types its input as React's ReactNode, which Node mirrors.
  const svg = await satori(tree as never, {
    width,
    height,
    fonts: await loadFonts(),
  });
  // Satori emits text as paths, so librsvg needs no system fonts here.
  return sharp(Buffer.from(svg), { density: 72 * scale })
    .png()
    .toBuffer();
};

export const renderSiteCard = async () => render(siteCard(), OG);

export const renderEventCard = async (
  event: CollectionEntry<"blog">,
  ratio?: StructuredDataRatio,
) => render(await eventCard(event), ratio ? STRUCTURED_DATA[ratio] : OG);
