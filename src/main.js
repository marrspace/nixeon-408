/* ═══════════════════════════════════════════════════════════
   nixeon://408 — interaksi dasar
   Tanpa dependency. Semua opsional: kalau JS mati,
   halaman tetap terbaca dan semua link tetap jalan.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Nav: sticky + menu mobile ─────────────────────── */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  function closeMenu() {
    if (!links || !toggle) return;
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Buka menu');
  }

  function openMenu() {
    if (!links || !toggle) return;
    links.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Tutup menu');
  }

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.contains('is-open');
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    // Tutup menu setelah memilih link
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });

    // Tutup dengan Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
    });

    // Tutup kalau klik di luar menu
    document.addEventListener('click', function (e) {
      if (!links.classList.contains('is-open')) return;
      if (nav && !nav.contains(e.target)) closeMenu();
    });

    // Reset saat layar diperbesar ke desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  /* ── 2. Efek nav saat discroll ────────────────────────── */
  if (nav) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (window.scrollY > 24) {
          nav.classList.add('is-stuck');
        } else {
          nav.classList.remove('is-stuck');
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3. Reveal saat masuk viewport ───────────────────── */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    // Hormati preferensi / browser lama: tampilkan semua langsung
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add('is-in');
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger ringan berdasarkan urutan dalam parent
        var siblings = el.parentElement ? el.parentElement.children : [el];
        var idx = Array.prototype.indexOf.call(siblings, el);
        var delay = Math.min(idx, 5) * 70;
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });

    // Jaring pengaman: apa pun yang terjadi, jangan biarkan konten tak terlihat
    setTimeout(function () {
      Array.prototype.forEach.call(revealEls, function (el) {
        el.classList.add('is-in');
      });
    }, 2600);
  }

  /* ── 4. Tandai section aktif di nav ──────────────────── */
  var sections = document.querySelectorAll('main section[id]');
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        Array.prototype.forEach.call(navAnchors, function (a) {
          if (a.getAttribute('href') === id) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Array.prototype.forEach.call(sections, function (s) { navIO.observe(s); });
  }

  /* ── 5. Slot karakter: animasi maskot (Fase 2/3) ─────── */
  window.NIXEON = window.NIXEON || {};
  var artSlot = document.getElementById('artSlot');
  window.NIXEON.artSlot = artSlot;
  window.NIXEON.reduceMotion = reduceMotion;

  var artFrame = document.querySelector('.art-frame');
  if (artFrame) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      artFrame.classList.add('is-in');
    } else {
      var artIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          artFrame.classList.add('is-in');
          artIO.unobserve(e.target);
        });
      }, { threshold: 0.25 });
      artIO.observe(artFrame);
    }

    /* Sentuh/tekan kartu -> maskot bereaksi (HP tidak punya hover) */
    var tapReset = null;
    artFrame.addEventListener('pointerdown', function () {
      if (reduceMotion) return;
      artFrame.classList.add('is-tap');
      if (tapReset) clearTimeout(tapReset);
      tapReset = setTimeout(function () {
        artFrame.classList.remove('is-tap');
      }, 420);
    });
  }

  /* ── 6. Parallax halus pada maskot saat scroll (mobile-friendly) ── */
  if (artFrame && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    var pTick = false;
    window.addEventListener('scroll', function () {
      if (pTick) return;
      pTick = true;
      window.requestAnimationFrame(function () {
        var r = artFrame.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        /* -1 (di bawah layar) .. 1 (di atas layar) */
        var prog = (vh / 2 - (r.top + r.height / 2)) / vh;
        prog = Math.max(-1, Math.min(1, prog));
        artFrame.style.setProperty('--par', (prog * 6).toFixed(2) + 'px');
        pTick = false;
      });
    }, { passive: true });
  }

})();
