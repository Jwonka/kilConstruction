# KilCon Construction Platform
Serverless content platform with secure media management built on **Cloudflare Workers**, **R2**, and **Astro**.

<p>
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudflare-R2-0F1E2E?logo=cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white" />
  <img src="https://img.shields.io/badge/Status-Active-success" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" />
</p>

---

## Overview

KilCon Construction's platform delivers a fast, CDN-optimized website paired with secure administrative tools for managing project galleries, rotating images, and structured media categories.

The backend is powered entirely by **Cloudflare Workers**, interacting with **R2 Object Storage**.  
The **Astro** frontend renders dynamic pages, rotating cards, and category routes.

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
- 📦 Cloudflare R2 Object Storage

---

## Features

- Serverless API built with **Cloudflare Workers**  
- Media management backed by **R2 Object Storage**  
- Dynamic **Astro** frontend with category/project routing  
- Secure admin authentication  
- Upload, rename, delete, and list operations  
- Automatic slug generation + numeric ordering  
- Rotating project cards for category previews  
- Zero-downtime deployments + instant CDN caching  

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
- CRUD routes for media assets  
- Admin-guarded routes  
- JSON responses for dashboard and frontend  

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

```text
📸 Coming soon…

```
---
## Development Setup
Prerequisites
- Node 18+
- Wrangler CLI
- Cloudflare account with R2 bucket configured

Install & Run
npm install
npm run dev

Deploy
npm run deploy

Environment Variables
- ADMIN_SECRET=
- R2_BUCKET=
- PUBLIC_DOMAIN=
---
## Status
This platform is actively deployed for a private construction company.
Source code is provided solely for portfolio/demo purposes.

## License
This project is proprietary. See the [License](LICENSE) file for details.
