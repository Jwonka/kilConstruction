export default {
    async fetch(req, env, ctx) {
        const url = new URL(req.url);

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
            const file = formData.get('file');
            if (!(file instanceof File)) {
                return new Response('File missing', { status: 400 });
            }

            const key = `uploads/${Date.now()}_${file.name}`;

            await env.R2_BUCKET.put(key, file.stream(), {
                httpMetadata: { contentType: file.type }
            });

            const publicUrl = `https://${env.UPLOAD_HOSTNAME}/${key}`;

            return new Response(`Uploaded successfully: <a href="${publicUrl}" target="_blank">${publicUrl}</a>`, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        return new Response('Method not allowed', { status: 405 });
    }
};

const htmlForm = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Upload Photo</title>
  <style>
    body { font-family: sans-serif; padding: 2em; }
    form { display: flex; flex-direction: column; max-width: 400px; gap: 1em; }
  </style>
</head>
<body>
  <h1>Upload a Photo</h1>
  <form method="POST" enctype="multipart/form-data">
    <input type="file" name="file" required />
    <button type="submit">Upload</button>
  </form>
</body>
</html>`;
