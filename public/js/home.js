/* ══════════════════════════
   HOME.JS v3 — Hero + Counters
══════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  const slides    = document.querySelectorAll('.hero-slide');
  const dots      = document.querySelectorAll('.hero-dot');
  const counterEl = document.getElementById('heroCurrentNum');
  let current = 0;
  let timer;
  let transitioning = false;

  function goTo(index) {
    if (transitioning || index === current || slides.length < 2) return;
    transitioning = true;

    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');

    current = ((index % slides.length) + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current]?.classList.add('active');

    if (counterEl) counterEl.textContent = String(current + 1).padStart(2, '0');
    setTimeout(() => { transitioning = false; }, 1800);
  }

  function next() { goTo(current + 1); }

  function startAuto() {
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(next, 5500);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goTo(i); startAuto(); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { goTo(current + 1); startAuto(); }
    if (e.key === 'ArrowLeft')  { goTo(current - 1); startAuto(); }
  });

  let touchStartX = 0;
  const heroEl = document.getElementById('hero');
  heroEl?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  heroEl?.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
  }, { passive: true });

  startAuto();

  // ─── Subtle parallax on hero images ─────────────────
  if (slides.length && window.matchMedia('(hover: hover)').matches) {
    const heroImgs = document.querySelectorAll('.hero-slide img');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            heroImgs.forEach(img => {
              img.style.transform = `scale(1) translateY(${y * 0.22}px)`;
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ─── Animated number counters for stats ─────────────
  const counters = document.querySelectorAll('.number-big, .snap-stat span');
  if (counters.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const raw = el.textContent.replace(/[^0-9.]/g, '');
          const target = parseFloat(raw);
          if (!raw || isNaN(target)) return;

          const suffix = el.innerHTML.replace(/[\d.]+/, '');
          const prefix = el.innerHTML.replace(/<sup>.*/, '').replace(/[\d.]+/, '').trim();
          let start = 0;
          const step = target / 55;
          const interval = setInterval(() => {
            start = Math.min(start + step, target);
            const display = Number.isInteger(target) ? Math.round(start) : start.toFixed(1);
            el.innerHTML = (target >= 1000 ? (display / 1000).toFixed(1) + 'k' : display) + suffix;
            if (start >= target) clearInterval(interval);
          }, 28);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => io.observe(el));
  }

});
