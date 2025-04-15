// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';

// CF_PAGES_URL
const deployment_target = process.env.CF_PAGES_URL || "https://paper-eta.0456456.xyz"

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  site: deployment_target
});