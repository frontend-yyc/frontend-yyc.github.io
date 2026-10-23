---
title: "Zero Servers, Zero Dollars: Shipping Real Apps on Cloudflare"
description: "How a front-end developer runs a full production stack (site, API, auth, database, file storage, AI pipelines) on Cloudflare's free tier, with no servers to manage."
pubDate: 2026-10-20
author: "Frontend YYC"
category: "Event"
tags:
  ["meetup", "cloudflare", "serverless", "workers", "react", "hono", "calgary"]
startDate: "2026-10-20T18:00:00-06:00"
endDate: "2026-10-20T19:00:00-06:00"
venue: calgary-public-library-memorial-park
eventbrite: "https://www.eventbrite.ca/e/zero-servers-zero-dollars-shipping-real-apps-on-cloudflare-tickets-2003265290410"
presenters:
  - name: "Serge Gatezh"
    page: "https://www.linkedin.com/in/gatezh/"
    title: "Seasoned Software Engineer and Simplicity virtuoso"
    profileUrl: "/images/profiles/1517045702484.png"
slideDeck: "/presentations/Zero Servers, Zero Dollars_ Shipping Real Apps on Cloudflare - Slidev.pdf"
---

## Zero Servers, Zero Dollars: Shipping Real Apps on Cloudflare

Nginx configs, certificate renewals, firewall rules, OS updates: "just host it yourself" comes with a lot of settings, and many ways to get them wrong. Serge wanted something simpler. He tells the story of how a personal website went from GitHub Pages to Netlify to Cloudflare, and then grew into full, product-sized web apps that still run on the free tier.

The talk makes two points:

1. **Front-end friendly.** You get a whole backend with no infrastructure to run. If you can ship a React app, you can ship this.
2. **The free tier is production-ready.** Experiment for free. If the project takes off, the Workers Paid plan is $5 a month.

### Event Details

- **Date:** Tuesday, October 20, 2026
- **Time:** 6:00 PM - 7:00 PM MDT
- **Location:** Calgary Public Library - Memorial Park
  - 1221 2 Street Southwest, Calgary, AB T2R 0W5
- **Cost:** Free!
- **Format:** In-person presentation with networking

### The Journey, One Service at a Time

- **Pages:** a Hugo static site that builds in seconds and is served from more than 330 cities
- **Workers + Hono + Resend:** a contact form in about 20 lines of code, compared with $180 a year for a hosted form service
- **Turnstile:** spam protection with no CAPTCHA puzzles to solve
- **Pages → Workers:** why Cloudflare now points new projects to Workers, and how to migrate
- **Tunnel & Access:** a self-hosted comments engine on a Raspberry Pi with no open ports, plus a private staging site behind an email login code
- **Images:** one URL for every size and format, with 5,000 free transformations a month
- **React on Workers:** a full SPA and its API deployed together, using the Cloudflare Vite plugin
- **D1 + Better Auth:** why he dropped Postgres, and how he fit password hashing into the 10 ms CPU limit
- **R2:** file uploads with no egress fees (about $0.60 compared with about $84 on S3 for the same workload)
- **Workflows:** a bill-processing pipeline whose steps retry on their own and survive failures
- **AI Gateway:** logging, caching, rate limits and model fallback for LLM calls, with a one-line code change

### Key Takeaways

- **Bindings do the wiring.** Use D1, R2 and Workflows from `env` with no API keys or connection strings.
- **The first limit you'll hit is CPU, not traffic.** On the free plan, each request gets 10 ms of CPU time, and time spent waiting on I/O doesn't count toward it.
- **Napkin math for 100 daily active users:** they use 4–20% of the free daily limits.
- **Free vs. Paid:** what the $5 a month actually gets you in compute, data, workflows and AI.

### Bonus Round

- **Durable Objects** for live, one-editor-at-a-time collaboration over WebSockets
- **The Cloudflare MCP server and the new `cf` CLI**, so your AI agent can work in your Cloudflare account
- **Cloudflare Registrar:** domains at cost, with no renewal price jump
- **One account per project:** simpler names, clean billing, and separate free-tier limits

### About the Presenter

Serge Gatezh is a Calgary-based full stack developer who has been building web apps since 2018. He works mostly with React, TypeScript and Cloudflare, and he cares about low cognitive load, sensible defaults and secure design. Number of servers he manages: zero.

### Slides

The full deck, with every price and limit sourced and checked in October 2026, is available to download from the presenter section of this page.

### Networking

Stick around after the session to network with fellow developers interested in serverless, edge computing and shipping side projects without the ops overhead.

### Register

Spaces are limited! Register on Eventbrite to secure your spot:
[Register on Eventbrite](https://www.eventbrite.ca/e/zero-servers-zero-dollars-shipping-real-apps-on-cloudflare-tickets-2003265290410)

Have questions? Reach out to us at [frontend.yyc@gmail.com](mailto:frontend.yyc@gmail.com)
