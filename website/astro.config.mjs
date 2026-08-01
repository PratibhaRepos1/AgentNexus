// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the real production domain once it's registered/deployed.
  site: 'https://agentnexus.app',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});