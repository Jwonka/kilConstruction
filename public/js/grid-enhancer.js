(() => {
    const API_URL = "https://kilcon.work/api/gallery";
    const cardEls = document.querySelectorAll(".card.card-media");

    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(async (entries, obs) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            const card = entry.target;
            const anchor = card.closest('a[href^="/projects/"]');
            if (!anchor) { obs.unobserve(card); continue; }

            const href = anchor.getAttribute("href") || "";
            const slug = href.split("/").filter(Boolean).pop();
            const img = card.querySelector("img.photo");
            if (!slug || !img) { obs.unobserve(card); continue; }

            try {
                const resp = await fetch(`${API_URL}?project=${encodeURIComponent(slug)}`, { cache: "no-store" });
                if (!resp.ok) { obs.unobserve(card); continue; }
                const data = await resp.json();

                const urls = (data?.items ?? [])
                    .map(i => i?.thumb || i?.full)
                    .filter(Boolean)
                    .slice(0, 8);

                if (urls.length) {
                    if (!img.getAttribute("src")) img.src = urls[0]; // visible cover
                    if (urls.length > 1) {
                        img.dataset.rotSrcs = JSON.stringify(urls);     // enable rotation
                        img.closest(".card-media")?.classList.add("rotatable");
                    }
                }
            } catch { /* ignore network errors */ }

            obs.unobserve(card);
        }
    }, { rootMargin: "200px 0px" });

    cardEls.forEach(el => io.observe(el));
})();
