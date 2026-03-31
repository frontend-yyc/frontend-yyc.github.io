# frontend-yyc.github.io

## Content Management

To add a new blog post, simply create a new `.md` or `.mdx` file inside the `src/content/blog/` directory.

### Frontmatter Schema

Each blog post must include the following frontmatter at the top of the file:

```yaml
---
title: "Your Post Title"
description: "A brief summary of your post for SEO."
pubDate: 2024-03-20
author: "Author Name"
image: "/images/your-cover-image.webp" # Optional
tags: ["Astro", "Tailwind"] # Optional
category: "Web Development" # Optional
---
Your markdown or MDX content goes here...
```

## Commands

| Command             | Action                                             |
| :------------------ | :------------------------------------------------- |
| `npm run dev`       | Starts the development server at `localhost:4321`. |
| `npm run build`     | Generates the static site in the `dist/` folder.   |
| `npm run preview`   | Previews the production build locally.             |
| `npm run lint`      | Runs ESLint to ensure code quality.                |
| `npm run format`    | Formats code with Prettier.                        |
| `npm run fix`       | Runs format and lint auto-fix.                     |
| `npm run check`     | Runs astro check for diagnostics.                  |
| `npm run typecheck` | Verifies TypeScript types.                         |
