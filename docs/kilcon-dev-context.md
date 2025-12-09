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

This repository contains:

- Astro frontend deployed on **Cloudflare Pages**.
- A single **Cloudflare Pages Function**:
    - `src/pages/api/cloudflare-worker-contact.ts` → `POST /api/contact`
    - Handles contact form submissions and forwards them to Resend, with optional Turnstile verification.

The gallery and review APIs used by the frontend:

- `kilcon.work/api/reviews*`
- `kilcon.work/api/gallery-api*`

are implemented in a **separate Cloudflare Worker**, in a different codebase. That Worker is not part of this repository, but this site depends on it at runtime.

---

## 2. Architecture diagram

```text
Browser (public)
  |
  |  HTML/CSS/JS + form posts
  v
Cloudflare Pages (this repo)
  |
  |  POST /api/contact
  v
Pages Function (cloudflare-worker-contact.ts)
  |
  |  Resend API + Turnstile verify
  v
Email delivery / spam protection

Browser (public + admin)
  |
  |  /api/gallery-api* and /api/reviews*
  v
External Cloudflare Worker (separate repo)
  |
  |  R2, Turnstile, admin_auth, etc.
  v
R2 bucket + review storage
