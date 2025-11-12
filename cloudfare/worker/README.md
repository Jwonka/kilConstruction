
# Cloudflare R2 Image Uploader

This is a minimal Worker-based image uploader for Cloudflare R2. It provides a simple form UI and uploads images to your public R2 bucket under a clean domain like `images.kilcon.work`.

---

## 📁 Folder Structure

```
cloudflare/worker/
├── index.js          # Worker handler
├── wrangler.toml     # Deployment config
└── README.md         # This file
```

---

## 🚀 Setup Instructions

### 1. Create an R2 Bucket
- Name it: `kilcon-gallery`
- In the dashboard, go to **R2 > Bucket > Custom Domains**
- Bind the subdomain `images.kilcon.work`
- Enable **public read access**

### 2. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 3. Authenticate Wrangler
```bash
wrangler login
```

### 4. Deploy the Worker
From the `cloudflare/worker/` directory:
```bash
wrangler deploy
```

This will publish the Worker and expose a form at a URL like:
```
https://r2-uploader.your-account.workers.dev
```

---

## 🔐 Secure the Form (Recommended)

Go to Cloudflare **Zero Trust > Access > Applications**:
- Protect the Worker route (e.g. `/upload`) using an email login rule
- This ensures only the contractor can upload

---

## ✅ Upload Behavior
- POSTs images as multipart/form-data
- Stores in: `uploads/<timestamp>_<originalname>`
- Publicly accessible via: `https://images.kilcon.work/uploads/xyz.jpg`

---

## 🧪 Dev Preview
If you want to test locally:
```bash
wrangler dev
```

It’ll launch on a local URL with hot reload.

---

## 🧼 Notes
- `UPLOAD_HOSTNAME` must match the custom R2 public domain.
- File type detection uses the browser-provided MIME type.
- You can customize the HTML form in `index.js`.

---

