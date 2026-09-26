/* ═══════════════════════════════════════════════════════════════
   nixeon://408 — Partikel hero + animasi teks
   Canvas 2D murni (tanpa library). Hormati prefers-reduced-motion.
   Ringan di HP: jumlah partikel menyesuaikan ukuran layar & DPR.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('artParticles');

  /* ── 1. Partikel di sekitar maskot ─────────────────────────── */
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d', { alpha: true });
    var host = canvas.parentElement;
    var W = 0, H = 0, DPR = 1;
    var parts = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var running = true;

    function size() {
      var r = host.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      /* jumlah partikel: lebih sedikit di HP supaya hemat baterai */
      var base = W < 520 ? 74 : (W < 900 ? 120 : 175);
      if (parts.length > base) parts.length = base;
      while (parts.length < base) parts.push(spawn(true));
    }

    function spawn(anywhere) {
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : H + 12,
        r: 0.7 + Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(0.10 + Math.random() * 0.34),
        a: 0.22 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,       /* fase kedipan */
        tws: 0.006 + Math.random() * 0.018,    /* kecepatan kedipan */
        cyan: Math.random() < 0.3,             /* sebagian kecil cyan */
        blob: Math.random() < 0.12             /* blob besar = kedalaman */
      };
    }

    var last = 0;
    function frame(t) {
      if (!running) return;
      /* batasi ~40fps: cukup halus, hemat CPU di HP */
      if (t - last < 24) { requestAnimationFrame(frame); return; }
      last = t;

      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.tws;

        /* tolakan halus dari kursor (desktop) */
        if (mouse.active) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 7200 && d2 > 1) {
            var f = (1 - d2 / 7200) * 0.34;
            var d = Math.sqrt(d2);
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }

        if (p.y < -14 || p.x < -20 || p.x > W + 20) {
          parts[i] = spawn(false);
          continue;
        }

        var alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        var rad = p.blob ? p.r * 3.4 : p.r;
        if (p.blob) alpha *= 0.42;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, 6.2832);
        ctx.fillStyle = p.cyan
          ? 'rgba(77,217,232,' + alpha.toFixed(3) + ')'
          : 'rgba(255,61,104,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    size();
    requestAnimationFrame(frame);

    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(size, 160);
    }, { passive: true });

    /* pointer: dorong partikel sedikit (hanya perangkat presisi) */
    if (window.matchMedia('(pointer:fine)').matches) {
      host.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
        mouse.active = true;
      }, { passive: true });
      host.addEventListener('pointerleave', function () { mouse.active = false; });
    }

    /* hemat CPU: hentikan saat hero tidak terlihat */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; requestAnimationFrame(frame); }
        else if (!vis) { running = false; }
      }, { threshold: 0 }).observe(host);
    }

    /* hormati tab tersembunyi */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; requestAnimationFrame(frame); }
    });
  }

  /* ── 2. Animasi teks: wordmark per-huruf + parallax ────────── */
  var wordmark = document.querySelector('.wordmark');
  if (wordmark && !reduce) {
    var spans = wordmark.querySelectorAll('.wm-name, .wm-scheme, .wm-port');
    /* pecah tiap bagian jadi huruf, beri delay bertingkat */
    var idx = 0;
    Array.prototype.forEach.call(spans, function (el) {
      var txt = el.textContent;
      el.textContent = '';
      Array.prototype.forEach.call(txt, function (ch) {
        var s = document.createElement('span');
        s.className = 'wm-ch';
        s.textContent = ch === ' ' ? '\u00a0' : ch;
        s.style.setProperty('--i', idx++);
        el.appendChild(s);
      });
    });
    wordmark.classList.add('wm-split');
  }

  /* Parallax halus: hero copy & art bergerak beda kecepatan */
  var heroCopy = document.querySelector('.hero-copy');
  var heroArt = document.getElementById('heroArt');
  if (!reduce && heroArt && window.matchMedia('(pointer:fine)').matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, tick = false;

    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!tick) { tick = true; requestAnimationFrame(loop); }
    }, { passive: true });

    function loop() {
      cx += (tx - cx) * 0.075;
      cy += (ty - cy) * 0.075;
      heroArt.style.setProperty('--px', (cx * -9).toFixed(2) + 'px');
      heroArt.style.setProperty('--py', (cy * -7).toFixed(2) + 'px');
      if (heroCopy) {
        heroCopy.style.setProperty('--px', (cx * 3.4).toFixed(2) + 'px');
        heroCopy.style.setProperty('--py', (cy * 2.6).toFixed(2) + 'px');
      }
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        requestAnimationFrame(loop);
      } else { tick = false; }
    }
  }
})();
