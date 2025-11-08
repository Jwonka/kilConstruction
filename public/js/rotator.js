(() => {
    const INTERVAL_MS = 5000;  // 5s
    const FADE_MS = 200;
    const SEL = 'img.photo[data-rot-srcs], img.photo[data-rot]';

    // Normalize Drive-style size suffixes so equality works
    const norm = (u) => {
        if (!u) return '';
        const noFrag  = u.split('#')[0];
        const noQuery = noFrag.split('?')[0];
        // strip common size suffixes like =s0, =w1200, =w1200-h900 plus -p / -no
        return noQuery.replace(/=(?:s\d+|w\d+)(?:-h\d+)?(?:-p)?(?:-no)?$/,'');
    };

    const parseList = (img) => {
        // Prefer JSON list
        if (img.dataset.rotSrcs) {
            try {
                const arr = JSON.parse(img.dataset.rotSrcs);
                return Array.isArray(arr) ? arr.filter(Boolean) : [];
            } catch { /* ignore */ }
        }
        // Fallback CSV
        if (img.dataset.rot) return img.dataset.rot.split(',').map(s => s.trim()).filter(Boolean);
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

    const preload = (url) => new Promise((resolve) => {
        const i = new Image();
        i.referrerPolicy = 'no-referrer';
        i.onload = () => resolve(true);
        i.onerror = () => resolve(false);
        i.src = url;
    });

    const MO = new MutationObserver((ms) => {
        for (const m of ms) {
            if (m.type !== 'attributes') continue;
            const el = m.target;
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

        // Build rotation set; exclude the visible cover if present
        const current = norm(img.currentSrc || img.src || '');
        let pool = unique(raw).filter(u => norm(u) !== current);
        if (pool.length < 1) return; // nothing different to rotate to

        // Styling for smooth transitions (but do not hide initially)
        img.style.transition = `opacity ${FADE_MS}ms ease`;
        img.style.willChange = 'opacity';

        let idx = 0;
        let timer = null;

        const tick = async () => {
            // Recompute the rotation pool (exclude whatever is currently visible)
            const currentNow = norm(img.currentSrc || img.src || '');
            const all = unique(parseList(img));
            const pool = all.filter(u => norm(u) !== currentNow);
            if (!pool.length) return;

            if (idx >= pool.length) idx = 0;
            let next = pool[idx];
            idx = (idx + 1) % pool.length;

            // Preload the next image
            const ok = await preload(next);
            if (!ok) return;

            // Swap instantly (no white flash), then fade in
            const prevTransition = img.style.transition;

            img.style.transition = 'none';
            img.srcset = '';        // beat any srcset candidate
            img.src = next;

            try { await img.decode(); } catch {}

            img.style.transition = prevTransition || `opacity ${FADE_MS}ms ease`;
            img.style.opacity = '0.001';
            requestAnimationFrame(() => { img.style.opacity = '1'; });
        };

        const myInterval = INTERVAL_MS + Math.floor(Math.random() * 1500);
        const run  = () => { if (!timer) timer = setInterval(tick, myInterval); };
        const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

        // Pause when offscreen to save bandwidth
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(e => e.isIntersecting ? run() : stop());
            }, { rootMargin: '100px 0px' });
            io.observe(img);
        } else {
            run();
        }

        // Don’t sync-flip every card
        setTimeout(run, 600 + Math.floor(Math.random() * 800));

        // Tab hidden → pause
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') run(); else stop();
        });
    };

    const init = () => {
        document.querySelectorAll(SEL).forEach((img) => {
            try { start(img); } catch { /* never break page rendering */ }
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img.photo').forEach(img => {
            MO.observe(img, { attributes: true, attributeFilter: ['data-rot-srcs', 'data-rot'] });
        });
        init();
    }, { once: true });
})();