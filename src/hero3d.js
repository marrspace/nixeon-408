/* ═══════════════════════════════════════════════════════════════
   nixeon://408 — Hero 3D (three.js)
   Model: assets/3d/unit-002.obj (+ .mtl)
   Micro-animation: idle bob, ring orbit, horn/visor pulse, fringe sway,
   parallax pointer, scroll-driven rotation, intro assemble.

   Progresif: kalau WebGL tidak ada / model gagal dimuat, gambar 2D
   (hero-portrait.webp) tetap tampil. Tidak ada layar kosong.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const slot = document.getElementById('artSlot');
if (slot) initHero3D(slot);

function initHero3D(slot) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── cek WebGL dulu: kalau tidak ada, jangan sentuh apa pun ─────── */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    console.warn('[hero3d] WebGL tidak tersedia — pakai gambar 2D', e);
    return;
  }

  const isMobile = window.matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.6 : 2));
  renderer.setClearColor(0x000000, 0);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const canvas = renderer.domElement;
  canvas.className = 'art-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.22, 4.75);

  /* ── pencahayaan: key + rim crimson + rim cyan ─────────────────── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.78));

  const key = new THREE.DirectionalLight(0xfff4ee, 3.1);
  key.position.set(3.2, 4.4, 4.2);
  scene.add(key);

  const rimR = new THREE.PointLight(0xff3d68, 18, 14, 2);
  rimR.position.set(-3.2, 1.4, 2.0);
  scene.add(rimR);

  const rimC = new THREE.PointLight(0x4dd9e8, 11, 14, 2);
  /* fill dari depan: badan gelap jangan tenggelam ke background */
  const fill = new THREE.PointLight(0xffe8f0, 22, 20, 2);
  fill.position.set(0, 1.6, 6);
  scene.add(fill);
  rimC.position.set(3.0, 2.2, -1.8);
  scene.add(rimC);

  /* ── grup utama ────────────────────────────────────────────────── */
  const group = new THREE.Group();
  scene.add(group);

  const parts = {};
  let model = null;
  let ready = false;

  /* ── muat model OBJ + MTL ──────────────────────────────────────── */
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath('assets/3d/');
  mtlLoader.load(
    'unit-002.mtl',
    (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('assets/3d/');
      objLoader.load('unit-002.obj', onLoaded, undefined, onError);
    },
    undefined,
    onError
  );

  function onError(err) {
    console.warn('[hero3d] gagal muat model — gambar 2D dipertahankan', err);
    dispose();
  }

  function onLoaded(obj) {
    model = obj;

    /* normalisasi: pusatkan + skala seragam */
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    model.position.sub(center);
    model.scale.setScalar(3.85 / maxDim);
    model.position.y -= 0.06;

    /* kumpulkan bagian bernama + siapkan material */
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const name = o.name || '';
      parts[name] = o;

      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        const n = (m.name || '').toLowerCase();
        m.side = THREE.FrontSide;
        /* cerahkan material gelap supaya tidak tenggelam di background */
        if (m.color) {
          const lum = 0.2126 * m.color.r + 0.7152 * m.color.g + 0.0722 * m.color.b;
          if (lum < 0.34) m.color.lerp(new THREE.Color(0x8f93a3), 0.42);
        }

        /* material menyala -> emissive */
        if (n.indexOf('glow') > -1 || n.indexOf('visor') > -1) {
          m.emissive = new THREE.Color(n.indexOf('visor') > -1 ? 0x38cfe6 : 0x4dd9e8);
          m.emissiveIntensity = 1.0;
          m.toneMapped = false;
        } else if (n.indexOf('horn') > -1) {
          m.emissive = new THREE.Color(0xff2a44);
          m.emissiveIntensity = 0.34;
        }
        m.needsUpdate = true;
      });
    });

    group.add(model);
    ready = true;
    slot.classList.add('is-3d');
    canvas.classList.add('is-in');
    observeVisibility();
    resize();
    loop(0);
  }

  /* ── resize ────────────────────────────────────────────────────── */
  function resize() {
    const r = slot.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (canvas.width === Math.round(w * renderer.getPixelRatio()) &&
        canvas.height === Math.round(h * renderer.getPixelRatio())) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ── visibilitas: berhenti render saat di luar layar ───────────── */
  let visible = true;
  function observeVisibility() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; });
    }, { threshold: 0.02 }).observe(slot);
  }

  /* ── pointer parallax ──────────────────────────────────────────── */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduce && !isMobile) {
    window.addEventListener('pointermove', (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      ptr.tx = (e.clientX / w - 0.5) * 2;
      ptr.ty = (e.clientY / h - 0.5) * 2;
    }, { passive: true });
  } else if (!reduce) {
    /* di HP: pakai kemiringan perangkat kalau tersedia */
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      ptr.tx = Math.max(-1, Math.min(1, e.gamma / 32));
      ptr.ty = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 40));
    }, { passive: true });
  }

  /* ── scroll → rotasi ───────────────────────────────────────────── */
  let scrollProg = 0;
  if (!reduce) {
    window.addEventListener('scroll', () => {
      const r = slot.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      scrollProg = Math.max(-1, Math.min(1, (vh * 0.5 - (r.top + r.height * 0.5)) / vh));
    }, { passive: true });
  }

  /* ── loop animasi ──────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  const ease = 0.075;

  function loop() {
    requestAnimationFrame(loop);
    if (!ready || !visible) return;

    const t = clock.getElapsedTime();

    if (reduce) {
      renderer.render(scene, camera);
      return;
    }

    /* parallax halus */
    ptr.x += (ptr.tx - ptr.x) * ease;
    ptr.y += (ptr.ty - ptr.y) * ease;

    /* idle: napas + goyang pelan */
    group.position.y = Math.sin(t * 1.15) * 0.035;
    group.rotation.y = Math.sin(t * 0.42) * 0.14 + ptr.x * 0.32 + scrollProg * 0.42;
    group.rotation.x = Math.sin(t * 0.33) * 0.026 + ptr.y * 0.12;
    group.rotation.z = Math.sin(t * 0.28) * 0.012;

    /* cincin hologram: masing-masing berputar beda kecepatan */
    const rings = [
      ['Ring_1', 0.42, 0.30, 0.16],
      ['Ring_2', -0.30, 0.22, -0.24],
      ['Ring_3', 0.24, -0.34, 0.20],
    ];
    rings.forEach(([name, sy, sx, sz]) => {
      const r = parts[name];
      if (!r) return;
      /* cincin jangan menutupi karakter: kecilkan + redupkan */
      r.scale.setScalar(0.82);
      r.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        o.material.transparent = true;
        o.material.opacity = 0.42;
        o.material.depthWrite = false;
      });
      r.rotation.y += sy * 0.010;
      r.rotation.x += sx * 0.008;
      r.rotation.z += sz * 0.006;
    });

    /* denyut cahaya: visor & tanduk */
    const pulse = 0.72 + Math.sin(t * 2.1) * 0.28;
    const pulse2 = 0.68 + Math.sin(t * 1.45 + 1.1) * 0.32;

    ['Visor', 'Visor_Slit', 'Chest_Glow', 'Collar', 'Pedestal_Rim',
     'Horn_L_Base', 'Horn_R_Base', 'Pauldron_L_Glow', 'Pauldron_R_Glow'
    ].forEach((n) => {
      const p = parts[n];
      if (p && p.material && p.material.emissiveIntensity !== undefined) {
        p.material.emissiveIntensity = 0.55 + pulse * 0.75;
      }
    });

    ['Horn_L', 'Horn_R'].forEach((n) => {
      const p = parts[n];
      if (p && p.material && p.material.emissiveIntensity !== undefined) {
        p.material.emissiveIntensity = 0.18 + pulse2 * 0.55;
      }
    });

    /* poni bergoyang */
    if (parts.Fringe) {
      parts.Fringe.rotation.z = Math.sin(t * 1.05) * 0.055;
      parts.Fringe.rotation.x = 0.28 + Math.sin(t * 0.85) * 0.045;
    }
    /* kepala: anggukan halus */
    if (parts.Head) parts.Head.rotation.y = Math.sin(t * 0.55) * 0.09;
    if (parts.Hair) parts.Hair.rotation.y = Math.sin(t * 0.55) * 0.07;

    /* cahaya rim bergerak: kesan hidup */
    rimR.position.x = -3.2 + Math.sin(t * 0.6) * 0.5;
    rimC.position.y = 2.2 + Math.cos(t * 0.5) * 0.4;

    renderer.render(scene, camera);
  }

  /* ── pemasangan ke DOM ─────────────────────────────────────────── */
  slot.appendChild(canvas);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(slot);
  window.addEventListener('resize', resize, { passive: true });

  function dispose() {
    try { renderer.dispose(); } catch (e) { /* diamkan */ }
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  /* hormati perubahan preferensi gerak saat runtime */
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => {
    if (e.matches) location.reload();
  });
}
