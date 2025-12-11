# KIL Construction Platform
Serverless content platform with secure media management built on **Cloudflare Workers**, **R2**, and **Astro**.

<p>
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudflare-R2-0F1E2E?logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" />
</p>

---

<details>
  <summary><strong>Table of Contents</strong></summary>

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Development Setup](#development-setup)
- [Status](#status)
- [License](#license)

</details>

---

## Overview

KIL Construction's platform delivers a fast, CDN-optimized website paired with secure administrative tools for managing project galleries, rotating images, and structured media categories.

The frontend (Astro) communicates with **two Cloudflare Workers**:

1. **Gallery + Reviews Worker** (external repo)  
   – Handles gallery listing, reviews, admin authentication, and all R2 operations.

2. **Contact Worker (`kilcon-contact`)**  
   – Handles **POST `/api/contact`**, email forwarding, and Turnstile validation.  
   – Lives entirely in Cloudflare, not in this repository.

This repo contains **only the Astro frontend** and no backend secrets or Worker code.

---

## Tech Stack

### Frontend
<p>
  <img height="30" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/astro/astro-original.svg" />
  <img height="30" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" />
  <img height="30" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" />
  <img height="30" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" />
</p>

### Backend
<p>
  <img height="30" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/cloudflare/cloudflare-original.svg" />
  <img height="30" src="https://img.icons8.com/ios-filled/50/000000/server.png" />
</p>

### Storage
📦 Cloudflare R2 Object Storage

---

## Features

- Serverless backend powered by **Cloudflare Workers**
- **Gallery + Reviews Worker** (external repo) for admin operations, R2, and public listing
- **Contact Worker** (`/api/contact`) for email forwarding + Turnstile verification
- Dynamic **Astro** frontend with category/project routing
- Secure cookie-based admin authentication
- Upload, rename, delete, and organize media in R2
- Featured review sorting + homepage review rotation
- Rotating project cards for modern visual previews
- Zero-downtime deployments + global CDN caching

---

## Architecture

<details>
<summary><strong>Click to expand architecture details</strong></summary>

### Frontend (Astro)

- Static + dynamic hybrid rendering  
- Responsive gallery layouts  
- Rotating image card components  
- Integrates directly with Worker API endpoints  

### Backend (Cloudflare Workers)

- **Gallery + Reviews Worker (`kilcon-gallery-worker`)**  (external repository) 
  - Handles all media/gallery operations  
  - Review submission + featured review ordering  
  - Admin authentication (cookie-based)  
  - R2 object reading/writing  
  - Frontend calls it via:  
    - `/api/gallery-api*`  
    - `/api/reviews*`

- **Contact Worker (`kilcon-contact`)**  
  - Handles **POST `/api/contact`**  
  - Sends emails using Resend  
  - Validates Turnstile tokens  
  - Required environment variables:  
    - `RESEND_API_KEY`  
    - `FROM_EMAIL`  
    - `TO_EMAIL`  
    - `TURNSTILE_SECRET`  
  - Deployed in Cloudflare, not stored in this repo

### Storage (R2 Object Storage)
- Category folders: `Projects/`, `Furniture/`, `Remodels/`, etc.  
- Deterministic numeric prefix ordering  
- Scalable object storage  

### Security
- Secret-based admin authentication  
- Cookie session validation  
- Domain-level request verification  

</details>

---

## Screenshots
📸 Visual overview of the platform:

<table>
  <tr>
    <td align="center">
      <strong>Homepage</strong><br/>
      <img src="docs/screenshots/img.png" width="380" alt="KilCon homepage"/>
    </td>
    <td align="center">
      <strong>Project Gallery View</strong><br/>
      <img src="docs/screenshots/img_3.png" width="380" alt="Project gallery view"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Service Gallery View</strong><br/>
      <img src="docs/screenshots/img_8.png" width="380" alt="Service gallery view"/>
    </td>
    <td align="center">
      <strong>Contact Page</strong><br/>
      <img src="docs/screenshots/img_2.png" width="380" alt="Contact page"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Admin – Project List</strong><br/>
      <img src="docs/screenshots/img_4.png" width="380" alt="Admin project list"/>
    </td>
    <td align="center">
      <strong>Admin – Upload & Actions</strong><br/>
      <img src="docs/screenshots/img_5.png" width="380" alt="Admin upload and actions"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Admin – Image Detail</strong><br/>
      <img src="docs/screenshots/img_6.png" width="380" alt="Admin image detail"/>
    </td>
    <td align="center">
      <strong>Admin – Confirmation/Status</strong><br/>
      <img src="docs/screenshots/img_7.png" width="380" alt="Admin status view"/>
    </td>
  </tr>
</table>

---

## Development Setup
Prerequisites
- Node 18+
- Cloudflare account with R2 bucket configured
- Wrangler CLI (optional – only needed if you want to run Workers locally)

Install & Run
npm install
npm run dev

Deploy
npm run deploy

Environment Variables

This repository contains **only frontend-safe** environment variables:

- PUBLIC_GALLERY_API=
- PUBLIC_CONTACT_ENDPOINT=

All sensitive values (ADMIN_SECRET, R2 paths, email API keys, Turnstile secret, etc.)  
are configured directly inside Cloudflare Worker settings and are **not stored in this repo**.
  
---

## Status
This platform is actively deployed for a private construction company.
Source code is provided solely for portfolio/demo purposes.

## License

> **Proprietary Software — KIL Construction**  
> Unauthorized use, reproduction, or distribution of this code is prohibited. [![License](https://img.shields.io/badge/License-©%20KIL%20Construction-blue)](LICENSE)

---

<sub>
<strong>Legal Notice:</strong> All code and assets within this repository are the confidential and proprietary
property of KIL Construction. No part of this project may be copied, modified, published, or distributed
without prior written consent. Access is provided solely for portfolio review and technical evaluation.
</sub>



