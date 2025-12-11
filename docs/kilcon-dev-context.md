# KilConstruction – Internal Development Context

This document is the single source of truth for how the kilConstruction system works.
Update it whenever we change architecture, security, or APIs.

---

## 1. High-level overview

**Goal:** Public marketing site + project gallery + client reviews for KIL Construction.

**Overall system stack**

- **Frontend:** Astro, static pages rendered on **Cloudflare Pages**.
- **Backend (system-wide):**
    - A **Cloudflare Worker** (`kilcon-gallery-worker`, defined and deployed directly in Cloudflare)  
      that handles `/api/gallery-api*` and `/api/reviews*` for gallery, reviews, and admin operations.
    - A **Cloudflare Worker** (`kilcon-contact`, also defined and deployed directly in Cloudflare)  
      that handles `POST /api/contact`, forwards form submissions to Resend, and always performs  
      Turnstile verification in production. This worker also does not live in this repository.

- **Storage:** Cloudflare **R2** for all photos and review JSON.
- **Spam protection:** Cloudflare **Turnstile** (contact + reviews).
- **Admin auth:** Cookie-based (`admin_auth`), backed by an `ADMIN_SECRET` in the external Worker
  and an Astro admin auth helper (`adminAuth.ts`) used by the admin frontend.

The public site is served from Cloudflare Pages at `https://kilcon.work`.

**This repository contains:**

- The **Astro frontend** deployed on Cloudflare Pages.

The gallery and review APIs used by the frontend:

- `kilcon.work/api/reviews*`
- `kilcon.work/api/gallery-api*`

> NOTE: The gallery and reviews endpoints described below are implemented in an
> external Cloudflare Worker, not in this repository. They are documented here
> so this repo’s frontend has a clear contract with the backend.
---

## 2. Architecture diagram

```text
Browser (public)
  |
  |  HTML/CSS/JS + POST /api/contact
  v
Cloudflare Pages (this repo)
  |
  |  forwards request to /api/contact (Cloudflare Worker)
  v
Contact Worker (kilcon-contact)
  |
  |  Resend API + Turnstile verify
  v
Email delivery

Browser (public + admin)
  |
  |  /api/gallery-api* and /api/reviews*
  v
Gallery + Reviews Worker (kilcon-gallery-worker)
  |
  |  R2 operations, Turnstile, admin_auth
  v
R2 bucket + review storage
