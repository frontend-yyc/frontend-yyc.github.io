# SEO overhaul and link-preview cards: review (PR #2)

Reviewed: branch `seo-improvements` (commits `7f90eeb`, `2ba2172`) against `main`. There is no
plan or spec, so this is checked against the PR description.

Every finding was checked against the **installed** versions in `package-lock.json`:

| Package | Installed | Latest |
| --- | --- | --- |
| astro | 6.1.1 | 7.4.2 |
| zod (via `astro/zod`) | 4.3.6 | — |
| @astrojs/sitemap | 3.7.2 | 3.7.4 |
| @astrojs/rss | 4.0.18 | 4.0.19 |
| satori | 0.57.2 | 0.63.2 (2026-10-20, inside the 7-day age gate) |
| sharp | 0.34.5 | — |
| withastro/action (not used yet) | — | v6.1.4 (2026-10-23); v6.1.3 (2026-09-14) |

Probes ran in a `node:22` container against `npm ci` of this lockfile, matching CI.

## Review Round 1

### Summary

The approach is canonical. Hand-written `<head>` tags, satori + sharp for the cards and
`entry.rendered.html` in the feed are each what the Astro docs show, and the Event and homepage
markup match Google's current docs. Two content-model problems matter, though, and both are about
data being **wrong without anyone noticing**:

- **Addresses (#1).** The address fields hide the city, province and country in schema defaults,
  drop the room, and carry a wrong postal code into Google's structured data.
- **Times (#2).** An event time written without a UTC offset is silently read as UTC.

The rest are smaller replacements of custom code by built-ins.

### Important

#### 1. Venue addresses: hidden defaults, a dropped room, and a wrong postal code

`src/content.config.ts:20-28`, `src/content/blog/*.md` (each `location:` block)

There are three problems:

- **City, province and country are invisible.** `addressLocality`, `addressRegion` and
  `addressCountry` come from `.default("Calgary" | "AB" | "CA")`. The JSON-LD output is complete,
  but the event file shows only street and postal code, so it reads as lost data. An event outside
  Calgary would also be silently labelled Calgary.
- **The room was dropped.** The old `eventLocation` string held "Meeting Room 1" or "Meeting
  Room 2". The migration discarded it, and it now survives only in some post bodies (not in the
  hackathon post).
- **The Memorial Park postal code is wrong.** The content says `T2R 1N8`. The library's own page
  says **`1221 2 Street SW, Calgary AB T2R 0W5`**
  (<https://calgarylibrary.ca/locations/mpark/>). The error predates this PR, since it was in the
  old free-text strings, but this PR now publishes it to Google as a structured `PostalAddress`.
  Platform's address (`407 9th Ave SE, Calgary AB T2G 2K7`) matches
  <https://www.platformcalgary.com/contact>.

The wrong code was copied into five event files and three post bodies. Copy-pasting one address
per event is what let it spread.

**Fix:** make venues a data collection and point to it with Astro's built-in `reference()`. This is
the documented way to relate entries
(<https://docs.astro.build/en/guides/content-collections/#defining-collection-references>):

```ts
// src/content.config.ts
const venues = defineCollection({
  loader: file("src/data/venues.json"),
  schema: z.object({
    name: z.string(),
    streetAddress: z.string(),
    addressLocality: z.string(),
    addressRegion: z.string(),
    postalCode: z.string(),
    addressCountry: z.string(),
  }),
});
// in the blog schema:
venue: reference("venues"),
room: z.string().optional(),
```

```yaml
venue: calgary-public-library-memorial-park
room: "Meeting Room 2"
```

Each address is then written out in full, once, in `src/data/venues.json`, with no defaults. The
event page and the OG card show the room, and the JSON-LD resolves the venue with
`getEntry(event.data.venue)`. Correct `T2R 0W5` there and in the three post bodies that repeat the
address.

#### 2. A start or end time without a UTC offset is silently read as UTC

`src/content.config.ts:17-19`

Astro parses frontmatter with js-yaml (`@astrojs/markdown-remark/dist/frontmatter.js:1`). A probe
of the same parser shows the trap:

```
2026-06-30T18:00:00-06:00        -> Date 2026-07-01T00:00:00.000Z   (correct)
2026-06-30T18:00:00              -> Date 2026-06-30T18:00:00.000Z   (noon in Calgary, no error)
"2026-06-30T18:00:00-06:00"      -> string
```

The schema comment asks authors to include the offset, but `z.coerce.date()` accepts a `Date`
either way. A forgotten offset would publish the wrong time on the page, on the card and to
Google, and the build would still pass.

**Fix:** require a quoted ISO string with an offset, using Zod 4's built-in
`z.iso.datetime({ offset: true })`, then convert it. Add an object-level check that the end comes
after the start:

```ts
const eventTime = z.iso.datetime({ offset: true }).pipe(z.coerce.date());
// ...
startDate: eventTime,
endDate: eventTime,
// ...
}).refine((d) => d.endDate > d.startDate, { path: ["endDate"], error: "endDate must be after startDate" })
```

An unquoted value then fails the build ("expected string, received Date"), so the mistake can't
slip through.

### Minor

#### 3. The `h()` helper and `Node` type duplicate satori's own `satori/jsx`

`src/lib/og-image.ts:26-37`

satori 0.57.2 exports `./jsx`, `./jsx/jsx-runtime` and `./jsx/jsx-dev-runtime`. `satori/jsx`
provides `createElement(type, props, ...children)` with typed `JSXElement` and `CSSProperties`
(`node_modules/satori/dist/jsx/index.d.ts`). Replace the custom helper and types with
`import { createElement as h } from "satori/jsx"`.

The `satori(tree as never, …)` cast stays: satori declares its input as React's `ReactNode`
(`dist/wasm-*.d.ts:180`). But the hand-written element types go, and `style` objects get type
checking.

#### 4. The deploy workflow hand-rolls what `withastro/action` does, on outdated action majors

`.github/workflows/deploy.yml`

Astro's docs call `withastro/action` "the recommended way to deploy to GitHub Pages"
(<https://docs.astro.build/en/guides/deploy/github/>).

**The test gate still fits.** Its `build-cmd` input replaces the build step, and the upload comes
after it (`action.yml` at v6.1.3). So `build-cmd: npm run build && npm test` keeps the gate. It
replaces checkout's sibling steps: setup-node, `npm ci`, build, test and upload.

**The actions are a major or two behind:**

| Action | Used | Latest |
| --- | --- | --- |
| `actions/checkout` | v4 | v7.0.1 |
| `actions/setup-node` | v4 | v7.1.0 |
| `actions/upload-pages-artifact` | v3 | v5.0.0 |
| `actions/deploy-pages` | v4 | v5.0.1 |

**Permissions are broader than needed.** Because this PR makes pull requests run the workflow,
`pages: write` and `id-token: write` at workflow level now reach PR builds. Only `deploy` needs
them, so move them to that job. The build job needs `contents: read`.

**Pin `withastro/action@v6`, which the docs use.** v6.1.4 is from today, so
`withastro/action@v6.1.3` meets the age gate if you want to hold to it.

#### 5. Two sources of truth for the site origin

- `src/config/site.ts:6` (`url`)
- `astro.config.mjs:9` (`site`)
- read in `src/lib/structured-data.ts:5`, `src/pages/robots.txt.ts`, `src/lib/og-image.ts` (`host`)

`Seo.astro` uses `Astro.site`, while the modules use `siteConfig.url`. Astro exposes the config
value to every module as `import.meta.env.SITE` (`readonly SITE: string` in
`node_modules/astro/client.d.ts:19`). Drop `siteConfig.url` and use `import.meta.env.SITE` (or
`context.site` in endpoints), so a domain change is a one-line edit that nothing can miss.

#### 6. The Event markup offers only a 16:9 image

`src/lib/structured-data.ts:54`

Google: "Provide multiple high-resolution images … in 16x9, 4x3, and 1x1 aspect ratios"
(<https://developers.google.com/search/docs/appearance/structured-data/event>, updated
2026-09-08). It's recommended, not required. The generator already takes a size, so the 4:3 and
1:1 variants are another two entries in `getStaticPaths` and in `image: []`. The card layout
needs a check at 1:1, where the presenter row is tight.

### Nits

- **Stale "Upcoming" status.** `isUpcoming()` (`src/lib/events.ts`) is evaluated at build time.
  After an event ends, the "Upcoming Event" badge and the `availability: InStock` offer stay until
  the next deploy. A daily `schedule:` trigger would fix it at no cost (public repo, Ubuntu
  runner), but it's only worth adding if stale badges bother you.
- **Working-directory paths.** `path.resolve("node_modules/@fontsource/…")` and
  `path.resolve("public", …)` depend on the working directory. That's fine, since `astro build`
  runs from the root, and Astro has no runtime accessor for `publicDir`. Keep them.
- **Deliberate copy.** `new Uint8Array(png)` copies the buffer only to satisfy the `BodyInit`
  type. Harmless.

### Native-first audit

| Custom piece | Built-in checked (where) | Verdict |
| --- | --- | --- |
| `Seo.astro` meta tags | Astro ships no head/SEO component; the docs build the canonical the same way (`new URL(Astro.url.pathname, Astro.site)`, API reference → `Astro.url`) | **Keep** |
| satori + sharp card endpoint | Astro has no OG generator; its own Fonts guide uses satori + sharp in a static `og.png.ts` endpoint | **Keep** |
| `h()` / `Node` types | `satori/jsx` `createElement` (satori 0.57.2 exports) | **Replace** (#3) |
| Font loading from `@fontsource/inter` files | Astro Fonts API `fontData` exists in 6.1.1 (`client.d.ts:59`), but the docs' satori recipe needs `experimental_getFontFileURL`, which 6.1.1 lacks | **Keep** until Astro 7 |
| Avatar resize with `sharp` | `getImage()` (astro:assets) returns URLs, not buffers satori can inline | **Keep** |
| Date/time formatting in `events.ts` | Already the built-in: `Intl.DateTimeFormat` and `formatRange` | **Keep** |
| `location` object with defaults | `reference()` + a `file()` loader collection | **Replace** (#1) |
| `z.coerce.date()` for event times | Zod 4 `z.iso.datetime({ offset: true })` | **Replace** (#2) |
| `Schema.astro` with `<` escaping | Astro has no JSON-LD helper; `set:html` with escaped JSON is the standard pattern | **Keep** |
| RSS `content: post.rendered?.html` | Documented `DataEntry.rendered.html`, filled by `glob()` for Markdown (content-loader reference). The RSS recipe's markdown-it + sanitize-html would skip this project's remark plugins and add two deps | **Keep** |
| RSS `<language>` via `customData` | `@astrojs/rss` 4.0.18 has no `language` option (`dist/index.d.ts`) | **Keep** |
| `robots.txt.ts` endpoint | `@astrojs/sitemap` doesn't write robots.txt; a third-party integration isn't worth it for 4 lines | **Keep** |
| `tests/seo.test.ts` over `dist/` | No Astro built-in asserts on built output; uses `ultrahtml`, Astro's own parser | **Keep** |
| Hand-rolled Pages workflow | `withastro/action` with `build-cmd` | **Replace** (#4) |
| `siteConfig.url` | `import.meta.env.SITE` | **Replace** (#5) |

### Upgrade opportunities

- **Astro 7.x (7.4.2).** `experimental_getFontFileURL` would let the cards load their font through
  the Fonts API and drop the `@fontsource/inter` dependency. glob()'s `deferRender` (v7.1) is
  also there. This is a major upgrade, so it belongs in a separate PR.
- **satori 0.63.x.** Once it's past the age gate, read its changelog. It has shipped 10+ releases
  since 0.57.2.
- **Actions.** The major bumps are listed in #4.

### Outside this PR

- **The devcontainer can't install dependencies.** `ghcr.io/gatezh/devcontainer-claude-bun:latest`
  ships Bun 1.3.5 and no npm (`npm: not found`), but `.devcontainer/devcontainer.json` runs
  `postCreateCommand: "npm install"`, and CI uses npm with `package-lock.json`. Either add Node and
  npm to the image, or switch the project to Bun throughout (lockfile, CI, scripts). Don't run
  both package managers.

### Checked and correct

- **Event markup:** carries every property Google lists as required (`name`, `startDate`,
  `location` with a full `PostalAddress`) and all the recommended ones in use; the free offer is
  `price: 0` in `CAD`.
- **Homepage markup:** WebSite and Organization appear on the homepage only, per Google's
  site-name and Organization docs. The logo is a 512px PNG (Google asks for at least 112px).
- **Canonical:** absolute and self-referencing; `og:url` equals it; the 404 is `noindex` with no
  canonical.
- **Trailing slashes:** `trailingSlash: "always"` matches the `directory` build format and GitHub
  Pages. No internal link lacks its slash (pinned by tests).
- **Sitemap:** contains exactly the indexable pages and is advertised in robots.txt.
- **Open Graph:** the tags match the protocol (`og:site_name`, image type, width, height and alt).
  `twitter:*` tags use `name=`.
- **`z` import:** comes from `astro/zod`, since `astro:content`'s `z` is deprecated for removal in
  Astro 7 (`node_modules/astro/types/content.d.ts:16`).
- **Tests can fail:** three hand-made breakages of `dist/` each failed the right test.
- **Security:** no secrets; JSON-LD escapes `<`; no user input reaches the build; new
  dependencies pass the 7-day age gate.
- **Unverified:** X falling back to `og:title`, `og:description` and `og:image` when the `twitter:*`
  equivalents are missing. X's developer docs returned HTTP 402 and 404, so this rests on
  long-standing documented behavior, not a fresh citation.

## Round 1 resolution

| # | Outcome | What was done | Verified by |
| --- | --- | --- | --- |
| 1 | **Fixed** | Venues moved to `src/data/venues.yaml`, loaded with `file()` and referenced from events with `reference("venues")`. Every address field is written out, with no schema defaults. Memorial Park's postal code is corrected to `T2R 0W5` in the venue file and in the three post bodies; Platform's venue name is now "Platform Innovation Centre", as its contact page gives it. A new optional `room` field restores "Meeting Room 1/2" and "Boardroom 2", and the event header shows it (`formatVenue`). `getVenue()` throws a clear error for an unknown venue key. | Built JSON-LD has all six address fields. Probe: `venue: nowhere` builds with `venue "nowhere" is not in src/data/venues.yaml`; without the guard the build crashes with `cannot read properties of undefined`, because `astro sync` doesn't check references. A test now asserts all five `PostalAddress` fields. |
| 2 | **Fixed** | Event times use `z.iso.datetime({ offset: true })` and then become a `Date`; all twelve values are quoted. An object-level `refine` requires `endDate > startDate`. | Probes through `astro sync`: an unquoted value, a value with no offset, and an end before the start each fail with the intended message. |
| 3 | **Not applied, finding wrong** | `satori/jsx`'s `createElement` returns `JSXElement<P>`, which isn't assignable to `JSXNode` (`FC<P>` variance), so composing it without JSX syntax fails `astro check` with 10 errors. JSX syntax via `/** @jsxImportSource satori/jsx */` fails the build: esbuild says "The JSX import source cannot be set without also enabling React's 'automatic' JSX transform", and enabling that means changing Vite's JSX settings for the whole project. The custom `h()` stays, with a comment recording why. | `astro check` run and a throwaway `.tsx` probe build (`React is not defined`). |
| 4 | **Partly applied** | Re-check: `withastro/action` installs with `$PACKAGE_MANAGER install`, i.e. `npm install` (`action.yml` at v6.1.3), not `npm ci`, so lockfile drift would pass silently. The explicit `npm ci` steps stay, with a comment naming the rejected action. Applied: `checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5`, with `pages: write` and `id-token: write` moved to the deploy job (workflow level is now `contents: read`). | Release notes for each major read: v4+ of `upload-pages-artifact` drops dotfiles, and the only one in `dist/` is a stray `.DS_Store`; `setup-node`'s automatic caching needs a `packageManager` field, which this repo lacks. The PR's CI run is the end-to-end check. |
| 5 | **Fixed** | `siteConfig.url` removed. Modules read `import.meta.env.SITE`, `robots.txt.ts` reads the endpoint's `site`, and `Seo.astro` keeps `Astro.site`. Tests run through Astro's documented `getViteConfig()` (`vitest.config.ts`), so they see the same `site`. | `grep siteConfig.url` finds nothing; 63/63 tests pass with the site URL coming from `astro.config.mjs`. |
| 6 | **Fixed** | Event JSON-LD now lists 16:9, 4:3 and 1:1 images (1920×1080, 1920×1440, 1920×1920) from the same card generator. | A test asserts the three ratios at 1920px wide; the 1:1 and 4:3 cards were checked by eye. |
| Nit: stale "Upcoming" | **Not done** | It needs a daily scheduled deploy, and the review marked it worth adding only if stale badges matter. Each new event post already triggers a deploy. | — |
| Nits: working-directory paths, `Uint8Array` | **Kept** | As the review recommended. | — |
| Devcontainer has no npm | **Not done** | Outside this PR; it needs a decision on npm versus Bun. | `docker run … devcontainer-claude-bun` → `npm: not found` |

After the fixes: `npm run build` succeeds, `vitest` passes 63/63, `astro check` reports 0 errors and 0 warnings, and ESLint is clean (all in `node:22`, from `npm ci`).
