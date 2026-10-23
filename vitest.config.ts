/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Loads astro.config.mjs, so tests see the same `site` and aliases as the build.
export default getViteConfig({ test: {} });
