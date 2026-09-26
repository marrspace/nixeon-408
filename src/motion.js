/* ═══════════════════════════════════════════════════════════════
   nixeon://408 — MOTION SYSTEM
   Satu bahasa gerak, bukan satu animasi diulang:
     · lead    : terminal mengetik (momen fokus milik halaman ini)
     · primary : wordmark scramble/decode
     · follow  : eyebrow blur-in, lede, tombol
     · settle  : reveal per-section dengan arah berbeda

   Aturan:
     - hanya transform + opacity (tidak menyentuh layout)
     - satu ticker (Lenis -> ScrollTrigger), bukan 3 rAF terpisah
     - semua hormat prefers-reduced-motion
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* Tanpa GSAP: tampilkan semuanya apa adanya (tidak ada yang tersembunyi) */
  if (typeof window.gsap === 'undefined') { return; }

  var gsap = window.gsap;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Tandai JS aktif -> CSS baru menyembunyikan elemen awal */
  if (!reduced) { root.classList.add('js-motion'); }

  /* ── token gerak (Material-3-ish, bukan `ease` bawaan) ───── */
  var EASE = {
    enter:  'power3.out',
    exit:   'power2.in',
    emph:   'expo.out'
  };
  var DUR = { lead: 0.9, primary: 0.8, follow: 0.5, settle: 0.65 };

  /* ═══════════════ 1. SATU TICKER (Lenis + ScrollTrigger) ═══ */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduced) {
    lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.6
    });
    if (window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  if (window.ScrollTrigger) { gsap.registerPlugin(window.ScrollTrigger); }

  /* ═══════════════ 2. LEAD: terminal mengetik ═══════════════ */
  var termBody = doc.getElementById('termBody');
  if (termBody) {
    var LINES = [
      { t: '$ ', c: 't-prompt', rest: 'nixeon --connect jawaSkrip' },
      { t: '',  c: '',          rest: 'menghubungkan sesi…' },
      { t: '✓ ', c: 't-ok',     rest: 'Baileys siap · Node.js v24' },
      { t: '→ ', c: 't-arrow',  rest: 'ngulik AI, bikin tools, tanya apa saja' },
      { t: '',  c: 't-dim',     rest: 'ketik !join buat masuk grup' }
    ];
    var caretEl = '<span class="term-caret"></span>';

    var renderLine = function (i, upto, showCaret) {
      var html = '';
      for (var k = 0; k < i; k++) {
        var L = LINES[k];
        html += '<span class="' + L.c + '">' + L.t + '</span>' + L.rest + '\n';
      }
      if (i < LINES.length) {
        var L2 = LINES[i];
        html += '<span class="' + L2.c + '">' + L2.t + '</span>' +
                L2.rest.slice(0, upto) + (showCaret ? caretEl : '');
      }
      termBody.innerHTML = html;
    };

    if (reduced) {
      var all = '';
      LINES.forEach(function (L) {
        all += '<span class="' + L.c + '">' + L.t + '</span>' + L.rest + '\n';
      });
      termBody.innerHTML = all;
    } else {
      renderLine(0, 0, true);
      var st = { line: 0, ch: 0 };
      var tl = gsap.timeline({ delay: 0.35 });

      var typeNext = function () {
        var L = LINES[st.line];
        if (st.ch < L.rest.length) {
          var step = L.rest[st.ch] === ' ' ? 2 : 1;   /* spasi lebih cepat */
          st.ch += step;
          renderLine(st.line, st.ch, true);
          tl.to({}, { duration: 0.028, onComplete: typeNext });
        } else if (st.line < LINES.length - 1) {
          st.line += 1; st.ch = 0;
          tl.to({}, { duration: 0.34, onComplete: typeNext });
        } else {
          /* Selesai mengetik: JANGAN berhenti. Sesi dijaga tetap "hidup" —
             baris terakhir terus berganti (instruksi nyata, bukan klaim angka). */
          var LIVE = [
            'ketik !join buat masuk grup',
            'ketik !repo buat lihat source',
            'tanya apa saja — dibantu bareng'
          ];
          var li = 0;
          var loopTL = gsap.timeline();

          var renderLive = function (upto) {
            var html = '';
            for (var k = 0; k < LINES.length - 1; k++) {
              var L3 = LINES[k];
              html += '<span class="' + L3.c + '">' + L3.t + '</span>' + L3.rest + '\n';
            }
            html += '<span class="t-dim">' + LIVE[li].slice(0, upto) + caretEl + '</span>';
            termBody.innerHTML = html;
          };

          var typeLive = function () {
            var txt = LIVE[li];
            var c = 0;
            var stepLive = function () {
              c += 1;
              renderLive(c);
              if (c < txt.length) {
                loopTL.to({}, { duration: 0.03, onComplete: stepLive });
              } else {
                loopTL.to({}, { duration: 2.8, onComplete: function () {
                  li = (li + 1) % LIVE.length;
                  typeLive();
                } });
              }
            };
            stepLive();
          };

          renderLive(0);
          typeLive();
        }
      };
      typeNext();
    }
  }

  /* ═══════════════ 3. PRIMARY: wordmark scramble ═══════════ */
  var wordmark = doc.getElementById('wordmark');
  if (wordmark && !reduced) {
    var TARGET = wordmark.getAttribute('data-scramble') || 'nixeon://408';
    var GLYPHS = '!<>-_\\/[]{}—=+*^?#01';
    var spanName = wordmark.querySelector('.wm-name');
    var spanPort = wordmark.querySelector('.wm-port');
    var spanScheme = wordmark.querySelector('.wm-scheme');

    /* Susun ulang: bagian nama+scheme dulu, lalu port menyala */
    var head = TARGET.slice(0, 8);   /* "nixeon:/" */
    var tail = TARGET.slice(8);      /* "/408" */
    var frame = 0;
    var total = 22;

    var scramble = function () {
      frame++;
      var prog = Math.min(1, frame / total);
      var reveal = Math.floor(prog * head.length);
      var out = '';
      for (var i = 0; i < head.length; i++) {
        out += i < reveal ? head[i]
                          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      spanName.textContent = out.slice(0, 6);
      spanScheme.textContent = out.slice(6);
      if (prog < 1) {
        requestAnimationFrame(scramble);
      } else {
        spanName.textContent = 'nixeon';
        spanScheme.textContent = '://';
        /* settle: port menyala */
        gsap.fromTo(spanPort,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: EASE.emph, delay: 0.05 });
      }
    };

    gsap.set(spanPort, { opacity: 0 });
    gsap.delayedCall(0.15, scramble);
  }

  /* ═══════════════ 4. FOLLOW: eyebrow, lede, aksi ═══════════ */
  if (!reduced) {
    gsap.fromTo('.eyebrow', { opacity: 0, filter: 'blur(7px)' },
      { opacity: 1, filter: 'blur(0px)', duration: DUR.follow, ease: EASE.enter, delay: 0.1 });

    gsap.fromTo('.caret', { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.5 });

    gsap.fromTo('.hero-lede', { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: DUR.follow, ease: EASE.enter, delay: 0.55 });

    gsap.fromTo('.hero-actions', { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: DUR.follow, ease: EASE.enter, delay: 0.68 });

    gsap.fromTo('.hero-facts li', { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.42, ease: EASE.enter, stagger: 0.07, delay: 0.78 });

    gsap.fromTo('.hero-term', { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.8, ease: EASE.emph, delay: 0.2 });

    /* spec-line ada di dalam hero, jadi tidak ikut loop ScrollTrigger.
       Tanpa ini dia tetap opacity:0 -> teks hilang. */
    gsap.fromTo('.spec-line', { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: DUR.follow, ease: EASE.enter, delay: 0.9 });
  }

  /* ═══════════════ 5. SETTLE: reveal per-section ════════════ */
  if (window.ScrollTrigger && !reduced) {
    var ST = window.ScrollTrigger;

    /* arah berbeda per jenis elemen — bukan satu pola diulang */
    var rules = {
      'slide-left': { x: -22, y: 0 },
      'lede':       { y: 18, x: 0 },
      'list':       { y: 16, x: 0, stagger: 0.06 },
      'row':        { y: 16, x: 0 },
      'spec':       { y: 14, x: 0 },
      'pop':        { y: 20, x: 0, scale: 0.985 }
    };

    doc.querySelectorAll('[data-anim]').forEach(function (el) {
      var kind = el.getAttribute('data-anim');
      var r = rules[kind];
      if (!r) { return; }
      if (el.closest('.hero')) { return; }   /* hero sudah dianimasikan di atas */

      var children = (kind === 'list') ? el.children : null;
      var targets = children && children.length ? children : el;

      /* PENTING: CSS menyembunyikan WADAH-nya. Kalau kita hanya
         menganimasikan anak, wadah tetap opacity:0 dan isinya tidak
         pernah terlihat. Jadi wadah selalu dibuka eksplisit. */
      gsap.set(el, { opacity: 1 });
      if (targets !== el) { gsap.set(targets, { opacity: 0 }); }

      var from = { opacity: 0, y: r.y || 0, x: r.x || 0 };
      if (r.scale) { from.scale = r.scale; }

      gsap.fromTo(targets, from, {
        opacity: 1, y: 0, x: 0, scale: 1,
        duration: DUR.settle,
        ease: EASE.enter,
        stagger: r.stagger || 0,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* garis aksen tumbuh saat masuk */
    gsap.utils.toArray('.pl-row').forEach(function (row) {
      gsap.fromTo(row, { '--grow': 0 }, { '--grow': 1, duration: .5, ease: EASE.enter,
        scrollTrigger: { trigger: row, start: 'top 90%', once: true } });
    });

    /* roadmap: garis progres tumbuh mengikuti scroll (scrubbed) */
    var rm = doc.querySelector('.roadmap');
    if (rm) {
      gsap.fromTo(rm, { '--rm-fill': 0 }, {
        '--rm-fill': 1, ease: 'none',
        scrollTrigger: { trigger: rm, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 }
      });
    }

    /* terminal: sedikit parallax (hubungan scroll yang bermakna) */
    gsap.to('.hero-term', {
      yPercent: -7, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 }
    });

    /* scroll progress */
    var bar = doc.getElementById('scrollProgress');
    if (bar) {
      gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: doc.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
      });
    }

    window.addEventListener('load', function () { ST.refresh(); });

    /* ── PENGAMAN ────────────────────────────────────────────────
       Bug sebelumnya: CSS menyembunyikan [data-anim] (opacity:0), tapi
       satu elemen terlewat dari semua animasi -> teksnya hilang permanen.
       Apa pun yang masih tersembunyi setelah semua animasi selesai
       dipaksa tampil. Lebih baik tanpa animasi daripada tanpa konten. */
    var safety = function () {
      doc.querySelectorAll('[data-anim]').forEach(function (el) {
        var cs = window.getComputedStyle(el);
        var hidden = parseFloat(cs.opacity) < 0.05;
        var noMotion = el.getAnimations && el.getAnimations().length === 0;
        if (hidden && noMotion) {
          gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'transform' });
          el.style.opacity = '1';
        }
      });
    };
    setTimeout(safety, 2500);
    window.addEventListener('load', function () { setTimeout(safety, 1200); });
  } else if (reduced) {
    /* reduced motion: pastikan semua terlihat */
    doc.querySelectorAll('[data-anim]').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
    });
  }
})();
