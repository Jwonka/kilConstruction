(function () {
    const parseList = (el) => {
        const raw = el.getAttribute('data-rot-srcs') || el.getAttribute('data-rot') || '';
        try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
    };

    const start = (img) => {
        if (img._rotating) return;            // avoid double-start
        const urls = parseList(img);
        if (!urls || urls.length < 2) return;

        img._rotating = true;
        let i = Math.max(0, urls.findIndex(u => img.src.includes(u)));
        const next = () => (i + 1) % urls.length;

        const pre = new Image();
        const swap = () => {
            i = next();
            pre.src = urls[next()];
            img.src = urls[i];
        };

        // prime and go
        pre.src = urls[next()];
        setTimeout(() => {
            swap();
            const id = setInterval(swap, 5000);
            // optional: pause when page hidden
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) clearInterval(id);
            }, { once: true });
        }, 5000);
    };

    const attach = () => {
        const imgs = Array.from(document.querySelectorAll('img[data-rot-srcs], img[data-rot]'));
        if (!imgs.length) return;
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        start(e.target);
                        io.unobserve(e.target);
                    }
                });
            }, { rootMargin: '200px' });
            imgs.forEach(img => io.observe(img));
        } else {
            imgs.forEach(start);
        }
    };

    // run once DOM is ready, and again if the grid announces readiness
    document.addEventListener('DOMContentLoaded', attach);
    window.addEventListener('grid-ready', attach);
})();

