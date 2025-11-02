// @ts-check
import { defineConfig } from 'astro/config';

const site = process.env.ASTRO_SITE || 'https://kilcon.work';
const base = process.env.ASTRO_BASE || '/';

export default defineConfig({ site, base });
