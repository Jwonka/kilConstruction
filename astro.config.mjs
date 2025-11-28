// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const site = process.env.ASTRO_SITE || 'https://kilcon.work';
const base = process.env.ASTRO_BASE || '/';

export default defineConfig({
    site: 'https://kilcon.work',
    base,
    output: 'server',
    adapter: cloudflare({
        mode: 'directory',        // <-- important for Cloudflare Pages
        routes: {
            strategy: 'include',
            include: ['/api/*'],    // ensure all API routes are wired as Functions
        },
    }),
});