import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "@/config/site";
import { eventPath } from "@/lib/events";

export async function GET(context) {
  const blog = await getCollection("blog");

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site,
    items: blog
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: eventPath(post),
        // The glob loader renders Markdown at build time; feed readers expect
        // HTML here, not the raw Markdown in post.body.
        content: post.rendered?.html,
      })),
    // RSS 2.0 wants an RFC 1766 tag (en-ca), not the en_CA locale form.
    customData: `<language>${siteConfig.lang.toLowerCase()}</language>`,
  });
}
