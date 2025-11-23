(() => {
    const INTERVAL_MS = 6000;  // 6s
    const FADE_MS = 400;
    const SEL = 'img.photo[data-rot-srcs], img.photo[data-rot]';

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

    const MO = new MutationObserver((ms) => {
        for (const m of ms) {
            if (m.type !== 'attributes') continue;
            const el = /** @type {Element} */ (m.target);
            if (!(el instanceof HTMLImageElement)) continue;
            if (!el.matches('img.photo')) continue;
            if (el.dataset.rotSrcs || el.dataset.rot) {
                try { start(el); } catch {}
            }
        }
    });

    const start = (img) => {
        let raw = parseList(img);
        if (!raw.length) return;

        const current = norm(img.currentSrc || img.src || '');
        let pool = unique(raw).filter((u) => norm(u) !== current);
        if (pool.length < 1) return;

        img.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
        img.style.willChange = 'opacity';
        img.style.opacity = '1';

        let idx = 0;
        let timer = null;

        const fadeTo = (op) =>
            new Promise((resolve) => {
                img.style.opacity = String(op);
                setTimeout(resolve, FADE_MS);
            });

        const swapTo = async (next) => {
            const ok = await preload(next);
            if (!ok) return;

            // 1) fade OUT to reveal black background
            await fadeTo(0);

            // 2) swap while invisible
            img.srcset = '';
            img.src = next;
            try { await img.decode(); } catch {}

            // 3) fade IN new image
            requestAnimationFrame(() => {
                img.style.opacity = '1';
            });
        };

        const tick = async () => {
            const currentNow = norm(img.currentSrc || img.src || '');
            const all = unique(parseList(img));
            const poolNow = all.filter((u) => norm(u) !== currentNow);
            if (!poolNow.length) return;

            if (idx >= poolNow.length) idx = 0;
            const next = poolNow[idx];
            idx = (idx + 1) % poolNow.length;

            await swapTo(next);
        };

        const myInterval = INTERVAL_MS + Math.floor(Math.random() * 1500);
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
            try { start(img); } catch {}
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
})();

