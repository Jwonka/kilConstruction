// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const site = process.env.ASTRO_SITE || 'https://kilcon.work';
const base = process.env.ASTRO_BASE || '/';

export default defineConfig({
    site: 'https://kilcon.work',
    base,
    output: 'server',
    adapter: cloudflare(),
});
