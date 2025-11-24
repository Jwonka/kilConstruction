(() => {
    const API = "https://kilcon.work/api/gallery";
    const cards = [...document.querySelectorAll(".card.card-media")];
    if (!("IntersectionObserver" in window) || !cards.length) return;

    let inFlight = 0, MAX = 3;
    const q = [];

    const pump = () => {
        while (inFlight < MAX && q.length) {
            const fn = q.shift();
            inFlight++; fn().finally(() => { inFlight--; pump(); });
        }
    };

    const withTimeout = (p, ms = 8000) =>
        Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);

    // Normalize URLs (remove size suffixes etc.)
    const normGE = (u) => (u || '')
        .split('#')[0].split('?')[0]
        .replace(/=(?:s\d+|w\d+)(?:-h\d+)?(?:-p)?(?:-no)?$/, '');

    // Extract Drive file id from ".../d/<id>/..."
    const idOf = (u) => {
        const m = normGE(u).match(/\/d\/([^/]+)/);
        return m ? m[1] : normGE(u); // fall back to normalized URL
    };

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (!e.isIntersecting) continue;
            const card = e.target;
            io.unobserve(card);

            q.push(async () => {
                // Find a link inside the card
                const link = card.querySelector("a[href]");
                if (!link) return;

                const href = link.getAttribute("href") || "";
                const path = href.split("?")[0].split("#")[0];
                const parts = path.split("/").filter(Boolean); // e.g. ["projects","me"] or ["services","furniture","cabinets"]

                let projectParam = null;

                if (parts[0] === "projects" && parts[1]) {
                    // /projects/<slug> → ?project=<slug>
                    projectParam = parts[1];
                } else if (parts[0] === "services" && parts[1] && parts[2]) {
                    // /services/<category>/<slug>/ → ?project=<category>/<slug>
                    const category = parts[1]; // "furniture" | "new-construction" | "remodels"
                    const slug = parts[2];
                    projectParam = `${category}/${slug}`;
                }

                const img = card.querySelector("img.photo");
                if (!projectParam || !img) return;

                try {
                    const r = await withTimeout(
                        fetch(`${API}?project=${encodeURIComponent(projectParam)}`, { cache: "no-store" })
                    );
                    if (!r.ok) return;
                    const j = await r.json();
                    const urlsRaw = (j?.items ?? [])
                        .map(i => i?.thumb || i?.full)
                        .filter(Boolean)
                        .slice(0, 8);
                    if (!urlsRaw.length) return;

                    // de-dup by file id (or normalized URL) so we only keep unique photos
                    const seen = new Set();
                    const urls = [];
                    for (const u of urlsRaw) {
                        const k = idOf(u);
                        if (!k || seen.has(k)) continue;
                        seen.add(k);
                        urls.push(u);
                    }
                    const cover = img.dataset.cover;
                    if (!urls.length) {
                        if (cover && !img.src) {
                            img.src = cover;
                            img.setAttribute("fetchpriority", "high");
                        }
                        return;
                    }

                    img.src = urls[0];
                    img.setAttribute("fetchpriority", "high");

                    if (urls.length > 1) {
                        img.dataset.rotSrcs = JSON.stringify(urls);
                        img.closest(".card-media")?.classList.add("rotatable");
                    }
                } catch { /* ignore */ }
            });
            pump();
        }
    }, { rootMargin: "700px 0px" });

    cards.forEach(el => io.observe(el));
})();
