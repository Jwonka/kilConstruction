(() => {
    // Hero (index highlights)
    const HERO_INTERVAL_MS = 6000;   // 6s between hero swaps
    const HERO_FADE_MS = 900;        // 0.9s hero fade

    // Gallery (projects / services / furniture / apparel grids)
    const GALLERY_INTERVAL_MS = 1000; // pause *after* a card finishes fading, in ms
    const GALLERY_FADE_MS = 800;     // 0.8s fade per gallery card

    const MIN_OPACITY = 0;
    const SEL = 'img.photo[data-rot-srcs], img.photo[data-rot]';

    // Baton-pass gallery state
    const galleryItems = [];
    let galleryIndex = 0;
    let galleryTimer = null;

    const norm = (u) => {
        if (!u) return '';
        const noFrag  = u.split('#')[0];
        const noQuery = noFrag.split('?')[0];
        return noQuery.replace(/=(?:s\d+|w\d+)(?:-h\d+)?(?:-p)?(?:-no)?$/, '');
    };

    const parseList = (img) => {
        if (img.dataset.rotSrcs) {
            try {
                const arr = JSON.parse(img.dataset.rotSrcs);
                return Array.isArray(arr) ? arr.filter(Boolean) : [];
            } catch { /* ignore */ }
        }
        if (img.dataset.rot) {
            return img.dataset.rot.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [];
    };

    const unique = (urls) => {
        const seen = new Set();
        const out = [];
        for (const u of urls) {
            const n = norm(u);
            if (!n || seen.has(n)) continue;
            seen.add(n);
            out.push(u);
        }
        return out;
    };

    const preload = (url) =>
        new Promise((resolve) => {
            const i = new Image();
            i.referrerPolicy = 'no-referrer';
            i.onload = () => resolve(true);
            i.onerror = () => resolve(false);
            i.src = url;
        });

    const isHeroImage = (img) =>
        img.classList.contains('hero-photo') || !!img.closest('.hero');

    const registerGalleryImage = (img) => {
        // Don’t register hero as gallery
        if (isHeroImage(img)) return;

        // Avoid duplicates
        if (galleryItems.some(item => item.img === img)) return;

        const raw = parseList(img);
        const urls = unique(raw);
        if (!urls || urls.length <= 1) {
            // Single-image cards never rotate
            return;
        }

        const current = norm(img.currentSrc || img.src || '');
        let startIdx = 0;
        if (current) {
            const pos = urls.findIndex(u => norm(u) === current);
            if (pos >= 0) {
                startIdx = (pos + 1) % urls.length;
            }
        }

        // Make sure the image has a transition configured
        img.style.transition = `opacity ${GALLERY_FADE_MS}ms ease-in-out`;
        img.style.willChange = 'opacity';
        img.style.opacity = img.style.opacity || '1';

        galleryItems.push({ img, urls, idx: startIdx });
        startGalleryTimer();
    };

    const rotateGalleryItem = async (item) => {
        const { img, urls } = item;
        if (!img.isConnected || !urls || urls.length <= 1) return;

        if (item.idx >= urls.length) item.idx = 0;
        const next = urls[item.idx];
        item.idx = (item.idx + 1) % urls.length;

        const ok = await preload(next);
        if (!ok) return;

        try {
            const tmp = new Image();
            tmp.src = next;
            await tmp.decode();
        } catch {}

        const link = img.closest('a');

        // fade out towards black (MIN_OPACITY background shows through)
        await new Promise((resolve) => {
            img.style.opacity = String(MIN_OPACITY);
            setTimeout(resolve, GALLERY_FADE_MS);
        });

        // swap the image while “hidden”
        img.srcset = '';
        img.src = next;

        if (link && link.classList.contains('rotatable')) {
            link.href = next;
        }

        // fade back in
        requestAnimationFrame(() => {
            img.style.opacity = '1';
        });
    };

    const runGalleryLoop = async () => {
        if (!galleryItems.length) {
            galleryTimer = null;
            return;
        }

        if (galleryIndex >= galleryItems.length) galleryIndex = 0;
        const item = galleryItems[galleryIndex++];

        await rotateGalleryItem(item);

        // As soon as the fade is done, wait a short pause, then move to the next card
        galleryTimer = setTimeout(runGalleryLoop, GALLERY_INTERVAL_MS);
    };

    const startGalleryTimer = () => {
        if (galleryTimer || !galleryItems.length) return;
        galleryTimer = setTimeout(runGalleryLoop, GALLERY_INTERVAL_MS);
    };

    const stopGalleryTimer = () => {
        if (galleryTimer) {
            clearTimeout(galleryTimer);
            galleryTimer = null;
        }
    };

    const MO = new MutationObserver((ms) => {
        for (const m of ms) {
            if (m.type !== 'attributes') continue;
            const el = /** @type {Element} */ (m.target);
            if (!(el instanceof HTMLImageElement)) continue;
            if (!el.matches('img.photo')) continue;
            if (el.dataset.rotSrcs || el.dataset.rot) {
                try {
                    if (isHeroImage(el)) {
                        start(el);                 // hero independent rotator
                    } else {
                        registerGalleryImage(el); // gallery baton-pass
                    }
                } catch {}
            }
        }
    });

    const start = (img) => {
        if (img.dataset.rotInit === '1') return;
        img.dataset.rotInit = '1';

        let raw = parseList(img);
        if (!raw.length) return;

        const current = norm(img.currentSrc || img.src || '');
        let pool = unique(raw).filter((u) => norm(u) !== current);
        if (pool.length < 1) return;
        const link = img.closest('a');

        img.style.transition = `opacity ${HERO_FADE_MS}ms ease-in-out`;
        img.style.willChange = 'opacity';
        img.style.opacity = '1';

        let idx = 0;
        let timer = null;
        let busy = false;

        const fadeTo = (op) =>
            new Promise((resolve) => {
                const target = Math.max(op, MIN_OPACITY);
                img.style.opacity = String(target);
                setTimeout(resolve, HERO_FADE_MS);
            });


        const swapTo = async (next) => {
            const ok = await preload(next);
            if (!ok) return;
            
            try {
                const tmp = new Image();
                tmp.src = next;
                await tmp.decode();
            } catch {}

            // 1) fade OUT to reveal black background
            await fadeTo(MIN_OPACITY);

            // 2) swap while invisible
            img.srcset = '';
            img.src = next;

            // Only rewrite href for "highlights" image cards, NOT album cards
            if (link && link.classList.contains('rotatable')) {
                link.href = next;
            }

            // 3) fade IN new image
            requestAnimationFrame(() => {
                img.style.opacity = '1';
            });
            return true;
        };

        let lastSwitch = 0;

        const tick = async () => {
            if (busy) return;
            const now = performance.now();
            if (now - lastSwitch < HERO_INTERVAL_MS * 0.9) return;

            busy = true;
            try {
                const currentNow = norm(img.currentSrc || img.src || '');
                const all = unique(parseList(img));
                const poolNow = all.filter((u) => norm(u) !== currentNow);
                if (!poolNow.length) return;

                // Try up to poolNow.length candidates so a single failed preload
                // doesn't produce a visible "A → A" no-op rotation.
                let swapped = false;

                for (let attempts = 0; attempts < poolNow.length; attempts++) {
                    if (idx >= poolNow.length) idx = 0;

                    const next = poolNow[idx];
                    idx = (idx + 1) % poolNow.length;

                    // swapTo returns true only if a swap actually happened
                    if (await swapTo(next)) {
                        swapped = true;
                        break;
                    }
                }

                if (swapped) {
                    lastSwitch = performance.now();
                }
            } finally {
                busy = false;
            }
        };

        const myInterval = HERO_INTERVAL_MS + Math.floor(Math.random() * 1500);
        const run = () => { if (!timer) timer = setInterval(tick, myInterval); };
        const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((e) => (e.isIntersecting ? run() : stop()));
                },
                { rootMargin: '100px 0px' }
            );
            io.observe(img);
        } else {
            run();
        }

        setTimeout(run, 600 + Math.floor(Math.random() * 800));

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') run();
            else stop();
        });
    };

    const init = () => {
        document.querySelectorAll(SEL).forEach((img) => {
            try {
                if (isHeroImage(img)) {
                    start(img);              // hero
                } else {
                    registerGalleryImage(img); // gallery
                }
            } catch {}
        });
    };

    document.addEventListener(
        'DOMContentLoaded',
        () => {
            document.querySelectorAll('img.photo').forEach((img) => {
                MO.observe(img, {
                    attributes: true,
                    attributeFilter: ['data-rot-srcs', 'data-rot'],
                });
            });
            init();
        },
        { once: true }
    );

    // Pause gallery spotlight when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            startGalleryTimer();
        } else {
            stopGalleryTimer();
        }
    });
})();

