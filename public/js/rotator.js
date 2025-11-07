
(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const cards = document.querySelectorAll('.rotatable img.photo[data-rot-srcs]');
    const preload = (url) => {
        setTimeout(() => {
            const i = new Image();
            i.referrerPolicy = 'no-referrer';
            i.src = url;
        }, Math.random() * 1000);
    };

    const start = (img) => {
    const list = JSON.parse(img.getAttribute('data-rot-srcs') || '[]').slice(0, 4);
    if (!Array.isArray(list) || list.length < 2) return;
    let i = 0;
    let t;
    const tick = () => {
        const next = list[(i + 1) % list.length];
        preload(next);
        t = setTimeout(() => {
            i = (i + 1) % list.length;
            img.src = next;
            tick();
        }, 10000);
    };
    tick();
    return () => clearTimeout(t);
};
const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        const img = e.target;
        if (e.isIntersecting) {
            if (!img._stop) {
                img._stop = start(img);
            }
        } else {
            if (img._stop) {
                img._stop();
                img._stop = null;
            }
        }
    });
    }, { rootMargin: '100px' });

    cards.forEach((img) => io.observe(img));
})();
