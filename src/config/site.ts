export const siteConfig = {
  name: "Frontend and Beyond",
  // Other names the meetup goes by: Eventbrite lists the organizer as
  // "Frontend & Beyond", and the GitHub org is frontend-yyc.
  alternateNames: ["Frontend & Beyond", "Frontend YYC"],
  description: "A recurring meetup for web developers in Calgary",
  // The site origin is `site` in astro.config.mjs: read it as Astro.site,
  // context.site or import.meta.env.SITE.
  // BCP 47 tag for <html lang>; Open Graph wants the underscore form.
  lang: "en-CA",
  locale: "en_CA",
  timeZone: "America/Edmonton",
  author: "Frontend YYC",
  email: "frontend.yyc@gmail.com",
  // TODO: confirm the meetup owns this handle before relying on it.
  twitter: "@FrontendYYC",
  sameAs: ["https://github.com/frontend-yyc"],
  // 1.91:1 is what Open Graph consumers (LinkedIn, Facebook, Slack, iMessage,
  // X's summary_large_image) display without cropping.
  ogImage: { width: 1200, height: 630 },
  navLinks: [
    { text: "Home", href: "/" },
    { text: "Events", href: "/events/" },
    { text: "Contact", href: "/contact/" },
  ],
};
