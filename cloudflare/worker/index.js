const ALLOWED_ORIGINS = ["https://kilcon.work", "http://localhost:4321"];

export default {
    async fetch(req, env) {
        const url = new URL(req.url);
        const host = url.host || "";
        const isProd = host.includes("kilcon.work");
        const origin = req.headers.get("Origin") || "";
        const corsOrigin = ALLOWED_ORIGINS.includes(origin)
            ? origin
            : "https://kilcon.work";

        if (url.pathname === "/upload" && req.method === "GET") {
            if (isProd) {
                return new Response("Not found", { status: 404 });
            }
            return new Response(htmlForm, {
                headers: { "Content-Type": "text/html; charset=utf-8" },
            });
        }

        if (url.pathname === "/upload" && req.method === "POST") {
            // ---- AUTH CHECK VIA SHARED SECRET ----
            if (!env.UPLOAD_SECRET) {
                console.error("UPLOAD_SECRET is not set");
                return new Response("Upload misconfigured", { status: 500 });
            }

            const header = req.headers.get("x-upload-secret") || "";
            if (!header || header !== env.UPLOAD_SECRET) {
                return new Response("Unauthorized upload", { status: 401 });
            }

            const contentType = req.headers.get("content-type") || "";
            if (!contentType.includes("multipart/form-data")) {
                return new Response("Expected multipart/form-data", { status: 400 });
            }

            const formData = await req.formData();
            if (!formData || [...formData.entries()].length === 0) {
                return new Response("No files submitted", { status: 400 });
            }

            const allowedDirectories = [
                "Highlights",
                "Projects",
                "Services",
                "New Construction",
                "Remodels",
                "Furniture",
                "uploads",
                "Reviews",
            ];

            const results = [];

            for (const [path, file] of formData.entries()) {
                if (!(file instanceof File)) continue;

                const segments = path.split("/");
                const topLevelDir = segments[0];
                const subfolder = segments[1] || "misc";
                const rest = segments.slice(2);
                const filePath = rest.length > 0 ? rest.join("/") : file.name;

                if (!allowedDirectories.includes(topLevelDir)) {
                    return new Response(
                        `Invalid top-level directory: ${topLevelDir}`,
                        { status: 400 },
                    );
                }

                const cleanKey = `${topLevelDir}/${subfolder}/${filePath || file.name}`
                    .replace(/\/+/g, "/");

                await env.R2_BUCKET.put(cleanKey, file.stream(), {
                    httpMetadata: { contentType: file.type },
                });

                const publicUrl = `https://${env.UPLOAD_HOSTNAME}/${cleanKey}`;
                results.push(
                    `<li><a href="${publicUrl}" target="_blank">${publicUrl}</a></li>`,
                );
            }

            return new Response(
            `<p>Uploaded ${results.length} files:</p><ul>${results.join("")}</ul>`,
            { headers: {
                        "Content-Type": "text/html; charset=utf-8",
                        "Access-Control-Allow-Origin": corsOrigin,
                        "Vary": "Origin",
                    }
                },
            );
        }

        return new Response("Not found", { status: 404 });
    },
};

const htmlForm = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Upload Images</title>
  <style>
    body { font-family: sans-serif; padding: 2em; }
    form { display: flex; flex-direction: column; max-width: 400px; gap: 1em; }
  </style>
</head>
<body>
  <h1>Upload Images</h1>
  <p>Upload files by directory path (e.g. "Projects/kitchen/01.jpg").</p>
  <form id="upload-form" method="POST" enctype="multipart/form-data">
    <label>
      Select Folder Category:
      <select id="category" required>
        <option value="Projects">Projects</option>
        <option value="Highlights">Highlights</option>
        <option value="Services">Services</option>
        <option value="New Construction">New Construction</option>
        <option value="Remodels">Remodels</option>
        <option value="Furniture">Furniture</option>
      </select>
    </label>
    <label>
      Subfolder Name:
      <input type="text" id="subfolder" placeholder="Optional, inferred if left blank" />
    </label>
    <input type="file" name="files" id="upload" webkitdirectory multiple required />
    <button type="submit">Upload</button>
  </form>
  <div id="result"></div>

  <script>
    document.getElementById('upload-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('upload');
      const formData = new FormData();
      const category = document.getElementById('category').value.trim();
      let subfolder = document.getElementById('subfolder').value.trim().replace(/\\/+$/, '');

      if (!subfolder) {
        const firstPath = input.files[0]?.webkitRelativePath || '';
        subfolder = firstPath.split('/')[0] || 'misc';
      }

      for (const file of input.files) {
        if (!(file instanceof File)) continue;
        const relativePath = file.webkitRelativePath || file.name;
        const cleanedPath = relativePath.split('/').slice(1).join('/');
        const filename = cleanedPath || file.name;
        const fullPath = \`${category}/${subfolder}/${filename}\`.replace(/\\/+/g, '/');
        formData.append(fullPath, file, filename);
      }

      const res = await fetch('/', {
        method: 'POST',
        body: formData,
      });

      document.getElementById('result').innerHTML = await res.text();
    });
  </script>
</body>
</html>`;
