# Frontend and Beyond - Calgary Web Developers Meetup

> A recurring meetup website for web developers in Calgary built with Astro, Tailwind CSS, and modern web technologies.

## Development Setup

### Option 1: VS Code Dev Container (Recommended)

The easiest way to get started is using VS Code's Dev Container feature. This provides a consistent development environment without manual setup.

#### Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows, macOS) or Docker (Linux)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

#### Steps to Start

1. **Clone and open the repository:**

   ```bash
   git clone https://github.com/frontend-yyc/frontend-yyc.github.io.git
   cd frontend-yyc.github.io
   code .
   ```

2. **Reopen in Dev Container:**
   - VS Code will detect the `.devcontainer` configuration
   - Click **"Reopen in Container"** in the notification popup
   - Or use Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and search for **"Dev Containers: Reopen in Container"**

3. **Wait for container setup:**
   - Docker will build the image (first time only, ~1-2 minutes)
   - VS Code will install extensions automatically
   - Dependencies will be installed via `npm install`

4. **Start developing:**

   ```bash
   npm run dev          # Start with npm
   # or
   bun run dev:bun      # Start with Bun (faster alternative)
   ```

5. **Access the dev server:**
   - Open browser to `http://localhost:4321`
   - VS Code will notify you when the port is available

#### Dev Container Features

- ✅ Node.js 22 pre-installed
- ✅ Bun runtime/package manager included
- ✅ Essential dev tools (git, curl, build tools)
- ✅ VS Code extensions auto-installed:
  - Astro
  - Tailwind CSS
  - ESLint
  - Prettier
  - GitLens
  - GitHub Copilot
  - Docker

---

### Option 2: Local Setup

If you prefer local development without containers:

#### Prerequisites

- Node.js 22+ ([Download](https://nodejs.org/))
- npm or Bun ([Bun install](https://bun.sh))
- Git

#### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/frontend-yyc/frontend-yyc.github.io.git
   cd frontend-yyc.github.io
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or with Bun
   bun install
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   # or with Bun
   bun run dev:bun
   ```

---

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

### Using npm

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

### Using Bun (Faster Alternative)

| Command               | Action                                             |
| :-------------------- | :------------------------------------------------- |
| `bun run dev:bun`     | Starts the development server at `localhost:4321`. |
| `bun run build:bun`   | Generates the static site in the `dist/` folder.   |
| `bun run preview:bun` | Previews the production build locally.             |
| `bun run fix:bun`     | Runs format and lint auto-fix.                     |

> **Tip:** Bun is significantly faster for dev, build, and package installation. Both npm and Bun are fully supported and compatible.
