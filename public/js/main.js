/* ══════════════════════════════════════════════
   DEAR MUSÉ — MAIN.JS v2
   Loading · Cursor (dot + ring) · Nav · Reveal
   Mobile menu · Page transitions · GLightbox
══════════════════════════════════════════════ */

// ─── Loading Screen ──────────────────────────
(function() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;

  if (sessionStorage.getItem('dm_loaded')) {
    screen.style.display = 'none';
    return;
  }

  setTimeout(() => {
    screen.classList.add('hide');
    setTimeout(() => {
      screen.style.display = 'none';
      sessionStorage.setItem('dm_loaded', '1');
    }, 600);
  }, 1800);
})();

document.addEventListener('DOMContentLoaded', () => {
  // Remove the page-entering class to prevent transform from breaking position: fixed
  setTimeout(() => {
    document.body.classList.remove('page-entering');
  }, 600);

  // ─── Smooth Scroll (Lenis) ────────────────
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: 0.09, smooth: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  // ─── Nav Scroll / Hero Mode ───────────────
  // (Hero-mode is handled inline in layout.ejs for instant response)
  // Fallback for non-hero pages
  const header = document.getElementById('site-header');
  const hero   = document.getElementById('hero');
  if (header && !hero) {
    header.classList.add('scrolled');
  }

  // ─── Custom Cursor (desktop hover only) ───
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');
  const cursorLbl  = document.getElementById('cursor-label');

  if (cursor && window.matchMedia('(hover: hover)').matches) {
    let mx = 0, my = 0;       // real mouse
    let rx = 0, ry = 0;       // ring (lerped)

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      // Dot follows immediately
      cursor.style.left = mx + 'px';
      cursor.style.top  = my + 'px';
      if (cursorLbl) {
        cursorLbl.style.left = mx + 'px';
        cursorLbl.style.top  = (my + 28) + 'px';
      }
    }, { passive: true });

    // Ring lags behind for premium effect
    function animateRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (cursorRing) {
        cursorRing.style.left = rx + 'px';
        cursorRing.style.top  = ry + 'px';
      }
      requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover: images / cards
    document.querySelectorAll('img, .masonry-item, .service-card, .portfolio-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover-img');
        cursorRing?.classList.add('is-hover-img');
        cursorLbl?.classList.add('visible');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover-img');
        cursorRing?.classList.remove('is-hover-img');
        cursorLbl?.classList.remove('visible');
      });
    });

    // Hover: links / buttons
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hover-link');
        cursorRing?.classList.add('is-hover-link');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover-link');
        cursorRing?.classList.remove('is-hover-link');
      });
    });
  }

  // ─── Scroll Reveal ────────────────────────
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  // ─── Mobile Menu ──────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-menu-close');

  window.closeMobileMenu = function() {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('open');
    document.body.style.overflow = '';
  };

  hamburger?.addEventListener('click', () => {
    const isOpen = mobileMenu?.classList.contains('open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      mobileMenu?.classList.add('open');
      hamburger?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });

  mobileClose?.addEventListener('click', closeMobileMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileMenu(); });

  // ─── Page Transitions ─────────────────────
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        link.hasAttribute('download') || link.target === '_blank' ||
        link.classList.contains('glightbox') || link.classList.contains('no-transition')) return;

    link.addEventListener('click', e => {
      const target = link.getAttribute('href');
      if (!target) return;
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transform = 'translateY(6px)';
      document.body.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      setTimeout(() => { window.location.href = target; }, 230);
    });
  });

  // ─── GLightbox ────────────────────────────
  if (typeof GLightbox !== 'undefined') {
    GLightbox({ touchNavigation: true, loop: true, autoplayVideos: false });
  }

  // ─── Floating Action Button (FAB) ───────────
  const fabToggle = document.getElementById('fab-toggle');
  const fabWrapper = document.getElementById('fab-wrapper');
  
  if (fabToggle && fabWrapper) {
    fabToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      fabWrapper.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
      if (!fabWrapper.contains(e.target)) {
        fabWrapper.classList.remove('open');
      }
    });
  }
  // ─── Ambient Music Player ───────────────────
  const musicWidget = document.getElementById('music-player-widget');
  const musicToggle = document.getElementById('music-toggle');
  const bgAudio      = document.getElementById('bg-audio');

  if (musicWidget && musicToggle && bgAudio) {
    // Set default low volume (15%) for subtle background ambient
    bgAudio.volume = 0.15;

    // Load saved state (muted state, played time)
    const isMuted = localStorage.getItem('music-muted') === 'true';
    const savedTime = localStorage.getItem('music-time');

    if (savedTime) {
      bgAudio.currentTime = parseFloat(savedTime);
    }

    // Set initial classes
    if (isMuted) {
      musicWidget.classList.add('paused');
      musicWidget.classList.remove('playing');
    } else {
      musicWidget.classList.add('playing');
      musicWidget.classList.remove('paused');
    }

    // Try playing the music
    const tryPlay = () => {
      if (localStorage.getItem('music-muted') !== 'true') {
        bgAudio.play().then(() => {
          musicWidget.classList.remove('paused');
          musicWidget.classList.add('playing');
          removeInteractionListeners();
        }).catch(err => {
          // Autoplay blocked by browser policy, waiting for interaction
        });
      }
    };

    const interactionEvents = ['click', 'touchstart', 'scroll'];
    const handleInteraction = () => {
      tryPlay();
    };

    const removeInteractionListeners = () => {
      interactionEvents.forEach(evt => {
        document.removeEventListener(evt, handleInteraction);
      });
    };

    if (!isMuted) {
      interactionEvents.forEach(evt => {
        document.addEventListener(evt, handleInteraction, { passive: true });
      });
      // Also try immediately
      tryPlay();
    }

    // Toggle Button Click Handler
    musicToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (bgAudio.paused) {
        bgAudio.play().then(() => {
          musicWidget.classList.remove('paused');
          musicWidget.classList.add('playing');
          localStorage.setItem('music-muted', 'false');
        }).catch(err => {
          console.error("Playback failed:", err);
        });
      } else {
        bgAudio.pause();
        musicWidget.classList.remove('playing');
        musicWidget.classList.add('paused');
        localStorage.setItem('music-muted', 'true');
      }
    });

    // Save playing timestamp on page unload
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('music-time', bgAudio.currentTime);
    });
  }

});
