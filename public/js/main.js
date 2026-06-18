/* ══════════════════════════════════════════════
   DEAR MUSÉ — MAIN.JS v2
   Loading · Cursor (dot + ring) · Nav · Reveal
   Mobile menu · Page transitions · GLightbox
══════════════════════════════════════════════ */

// ─── Loading Screen ──────────────────────────
(function() {
  if (!sessionStorage.getItem('dm_loaded')) {
    localStorage.setItem('music-muted', 'false');
  }
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

  // ─── Page Transitions (Overlay Curtain) ──────────────
  const pto = document.getElementById('page-transition-overlay');
  const ptoText = pto ? pto.querySelector('.pto-text') : null;

  // When page loads: if we arrived via the overlay, play the "leave" (pull up) animation
  if (pto && sessionStorage.getItem('pto_active') === '1') {
    sessionStorage.removeItem('pto_active');
    // Overlay is currently covering the screen (translateY 0%), now pull it up
    pto.style.transform = 'translateY(0%)';
    pto.style.transition = 'none';
    if (ptoText) {
      ptoText.style.opacity = '1';
      ptoText.style.transform = 'translateY(0)';
    }
    // Brief pause so user sees the text, then slide up
    setTimeout(() => {
      pto.style.transition = 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)';
      pto.style.transform = 'translateY(-110%)';
      if (ptoText) {
        ptoText.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        ptoText.style.opacity = '0';
        ptoText.style.transform = 'translateY(-20px)';
      }
    }, 100);
  }

  // Intercept all internal nav links in the header
  const headerEl = document.getElementById('site-header');
  const mobileMenuEl = document.getElementById('mobile-menu');
  const navLinks = [];

  if (headerEl) {
    headerEl.querySelectorAll('a[href]').forEach(l => navLinks.push(l));
  }
  if (mobileMenuEl) {
    mobileMenuEl.querySelectorAll('a[href]').forEach(l => navLinks.push(l));
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        link.hasAttribute('download') || link.target === '_blank' ||
        link.classList.contains('glightbox') || link.classList.contains('no-transition')) return;

    link.addEventListener('click', e => {
      const target = link.getAttribute('href');
      if (!target || !pto) return;
      e.preventDefault();
      e.stopPropagation();

      // Reset overlay to above viewport, then animate down smoothly
      pto.style.transition = 'none';
      pto.style.transform = 'translateY(-110%)';
      if (ptoText) {
        ptoText.style.transition = 'none';
        ptoText.style.opacity = '0';
        ptoText.style.transform = 'translateY(28px)';
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Smooth, silky slide down to cover screen
          pto.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
          pto.style.transform = 'translateY(0%)';

          // Text fades in gently after overlay is ~halfway down
          setTimeout(() => {
            if (ptoText) {
              ptoText.style.transition = 'opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              ptoText.style.opacity = '1';
              ptoText.style.transform = 'translateY(0)';
            }
          }, 250);

          // Navigate once overlay has fully covered the screen
          setTimeout(() => {
            sessionStorage.setItem('pto_active', '1');
            window.location.href = target;
          }, 800);
        });
      });
    });
  });

  // Also handle all other internal links (non-header) with simple approach
  document.querySelectorAll('a[href]').forEach(link => {
    if (navLinks.includes(link)) return; // already handled above
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel') ||
        link.hasAttribute('download') || link.target === '_blank' ||
        link.classList.contains('glightbox') || link.classList.contains('no-transition')) return;

    link.addEventListener('click', e => {
      const target = link.getAttribute('href');
      if (!target || !pto) return;
      e.preventDefault();

      pto.style.transition = 'none';
      pto.style.transform = 'translateY(-110%)';
      if (ptoText) {
        ptoText.style.transition = 'none';
        ptoText.style.opacity = '0';
        ptoText.style.transform = 'translateY(28px)';
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pto.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
          pto.style.transform = 'translateY(0%)';
          setTimeout(() => {
            if (ptoText) {
              ptoText.style.transition = 'opacity 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
              ptoText.style.opacity = '1';
              ptoText.style.transform = 'translateY(0)';
            }
          }, 250);
          setTimeout(() => {
            sessionStorage.setItem('pto_active', '1');
            window.location.href = target;
          }, 800);
        });
      });
    });
  });

  // ─── GLightbox ────────────────────────────
  if (typeof GLightbox !== 'undefined') {
    // Tự động biến tất cả ảnh thành dạng click để phóng to (Lightbox)
    document.querySelectorAll('img').forEach(img => {
      // Bỏ qua logo, icon, ảnh nền hero động, và ảnh trong card dịch vụ (vì card dịch vụ là link)
      if(img.closest('header') || img.closest('footer') || img.closest('.svc-card') || img.closest('.hero-img-wrap')) return;
      // Bỏ qua ảnh đã nằm trong thẻ <a> để tránh lỗi chuyển trang
      if(img.parentElement && img.parentElement.tagName.toLowerCase() === 'a') return;
      
      img.classList.add('glightbox');
      img.setAttribute('data-href', img.src || img.currentSrc);
      img.setAttribute('data-type', 'image');
      
      // Tạo group gallery dựa trên class của thẻ cha để có thể vuốt/chuyển ảnh
      let groupName = 'gallery';
      if (img.closest('.gallery-mosaic')) groupName = 'home-gallery';
      else if (img.closest('.portfolio-grid')) groupName = 'portfolio-gallery';
      else if (img.closest('.intro-visual')) groupName = 'intro-gallery';
      
      img.setAttribute('data-gallery', groupName);
      
      // Thêm CSS để báo hiệu cho người dùng biết ảnh có thể click
      img.style.cursor = 'zoom-in';
      img.style.pointerEvents = 'auto'; // Đảm bảo không bị CSS nào chặn click
    });

    GLightbox({ 
      selector: '.glightbox',
      touchNavigation: true, 
      loop: true, 
      autoplayVideos: false,
      zoomable: true,
      descPosition: 'bottom'
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
    let audioPlayed = false;
    let isPlaying = false;
    let canPlayNow = false;

    // Bắt đầu tự động phát nhạc sau đúng 3 giây truy cập trang web (đã xác thực)
    setTimeout(() => {
      canPlayNow = true;
      tryPlay();
    }, 3000);

    const tryPlay = () => {
      if (!canPlayNow || audioPlayed || isPlaying) return;
      if (localStorage.getItem('music-muted') !== 'true') {
        isPlaying = true;
        const playPromise = bgAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            musicWidget.classList.remove('paused');
            musicWidget.classList.add('playing');
            audioPlayed = true;
            isPlaying = false;
            removeInteractionListeners();
          }).catch(err => {
            isPlaying = false;
            // Autoplay blocked by browser policy, waiting for interaction
          });
        }
      }
    };

    const interactionEvents = ['click', 'touchstart', 'scroll', 'mousemove', 'keydown'];
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

  // ─── Language Switcher (Google Translate Wrapper) ───
  const langBtns = document.querySelectorAll('.lang-btn');
  
  function triggerGoogleTranslate(langCode) {
    const selectField = document.querySelector('.goog-te-combo');
    if (selectField) {
      selectField.value = langCode;
      selectField.dispatchEvent(new Event('change'));
    }
  }

  function initLanguageState() {
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    let currentLang = 'vi'; // default
    if (match && match[2]) {
      const parts = decodeURIComponent(match[2]).split('/');
      if (parts.length > 2) currentLang = parts[2];
    }
    
    langBtns.forEach(btn => {
      if (btn.dataset.lang === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  setTimeout(initLanguageState, 1000);

  langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = btn.dataset.lang;
      
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      triggerGoogleTranslate(targetLang);
    });
  });

  // ─── Behavioral Tracking Telemetry ───────────
  function trackEvent(eventType, eventValue = '') {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, event_value: eventValue })
    }).catch(err => console.error('Tracking failed:', err));
  }

  // 1. Page view tracking
  trackEvent('page_view', window.location.pathname);

  // 2. Booking button clicks
  document.querySelectorAll('a[href="/booking"], .nav-cta, .btn-hero-primary, .btn-cta-primary, .fab-item[href="/booking"]').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('click_booking', window.location.pathname);
    });
  });

  // 3. Contact form submissions
  const contactForm = document.querySelector('form[action="/contact"]');
  if (contactForm) {
    contactForm.addEventListener('submit', () => {
      trackEvent('submit_contact', 'Form Submitted');
    });
  }

  // 4. Concept card clicks
  document.querySelectorAll('a[href*="booking?service="], .svc-card').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.getAttribute('href') || '';
      const match = href.match(/service=([^&]+)/);
      const slug = match ? match[1] : '';
      const h3 = card.querySelector('h3');
      const name = h3 ? h3.textContent.trim() : slug;
      trackEvent('click_concept', name || 'Concept');
    });
  });

});

