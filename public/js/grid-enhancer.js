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

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (!e.isIntersecting) continue;
            const card = e.target;
            io.unobserve(card);

            q.push(async () => {
                const a = card.closest('a[href^="/projects/"]'); if (!a) return;
                const slug = (a.getAttribute("href") || "").split("/").filter(Boolean).pop();
                const img = card.querySelector("img.photo"); if (!slug || !img) return;

                try {
                    const r = await withTimeout(fetch(`${API}?project=${encodeURIComponent(slug)}`, { cache: "no-store" }));
                    if (!r.ok) return;
                    const j = await r.json();
                    const urls = (j?.items ?? [])
                        .map(i => i?.thumb || i?.full)
                        .filter(Boolean)
                        .slice(0, 8);
                    if (!urls.length) return;

                    if (!img.getAttribute("src")) {
                        img.src = urls[0];
                        img.setAttribute("fetchpriority", "high");
                    }
                    if (urls.length > 1) {
                        img.dataset.rotSrcs = JSON.stringify(urls);
                        img.closest(".card-media")?.classList.add("rotatable");
                    }
                } catch { /* ignore */ }
            });
            pump();
        }
    }, { rootMargin: "200px 0px" });

    cards.forEach(el => io.observe(el));
})();
