# KilConstruction – Internal Development Context

This document is the single source of truth for how the kilConstruction system works.
Update it whenever we change architecture, security, or APIs.

---

## 1. High-level overview

**Goal:** Public marketing site + project gallery + client reviews for KIL Construction.

**Stack**

- **Frontend:** Astro, static pages rendered on **Cloudflare Pages**.
- **Backend:** A single **Cloudflare Worker** that handles **all production API endpoints**.
- **Storage:** Cloudflare **R2** for all photos and review JSON.
- **Spam protection:** Cloudflare **Turnstile** (contact + reviews).
- **Admin auth:** Cookie-based (`admin_auth`), backed by an `ADMIN_SECRET` shared between:
    - the Worker (`requireAdmin`)
    - the Astro admin auth helper (`adminAuth.ts`).

The public site is served from Cloudflare Pages at `https://kilcon.work`.

The Worker is mounted on:

- `kilcon.work/api/reviews*`
- `kilcon.work/api/gallery-api*`

There may be leftover code for Cloudflare Pages Functions in `src/pages/api/*`, but **production traffic for gallery and reviews goes through the Worker only**.

---

## 2. Architecture diagram

```text
Browser (public + admin)
  |
  |  HTTPS requests
  v
Cloudflare Pages (Astro site at kilcon.work)
  |
  |  /api/reviews* and /api/gallery-api*
  v
Cloudflare Worker (canonical backend)
  |
  |  R2 read/write
  v
R2 bucket (GALLERY_BUCKET)
