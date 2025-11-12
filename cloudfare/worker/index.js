export default {
    async fetch(req, env, ctx) {
        if (req.method === 'GET') {
            return new Response(htmlForm, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        if (req.method === 'POST') {
            const contentType = req.headers.get('content-type') || '';
            if (!contentType.includes('multipart/form-data')) {
                return new Response('Expected multipart/form-data', { status: 400 });
            }

            const formData = await req.formData();
            const results = [];
            const allowedDirectories = ['Highlights', 'Projects', 'Services', 'New Construction', 'Remodels', 'Furniture'];

            for (const [path, file] of formData.entries()) {
                if (!(file instanceof File)) continue;

                const topLevelDir = path.split('/')[0];
                if (!allowedDirectories.includes(topLevelDir)) {
                    return new Response(`Invalid top-level directory: ${topLevelDir}`, { status: 400 });
                }

                const key = `uploads/${path}`;
                await env.R2_BUCKET.put(key, file.stream(), {
                    httpMetadata: { contentType: file.type }
                });

                const publicUrl = `https://${env.UPLOAD_HOSTNAME}/${key}`;
                results.push(`<li><a href="${publicUrl}" target="_blank">${publicUrl}</a></li>`);
            }

            return new Response(
                `<p>Uploaded ${results.length} files:</p><ul>${results.join('')}</ul>`,
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
        }

        return new Response('Method not allowed', { status: 405 });
    }
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
  <form id="upload-form">
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
      <input type="text" id="subfolder" required />
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
      const subfolder = document.getElementById('subfolder').value.trim().replace(/\\/+$/, '');

      for (const file of input.files) {
        const relativePath = file.webkitRelativePath || file.name;
        const cleanPath = relativePath.split('/').slice(1).join('/');
        const fullPath = \`\${category}/\${subfolder}/\${cleanPath}\`;
        formData.append(fullPath, file);
      }

      const res = await fetch('/', {
        method: 'POST',
        body: formData
      });

      document.getElementById('result').innerHTML = await res.text();
    });
  </script>
</body>
</html>`;
