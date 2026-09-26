# nixeon://408 — Portfolio JawaSkrip ⚙️

Portfolio komunitas **JawaSkrip** — tempat belajar bot WhatsApp (Baileys),
AI, dan vibe coding.

**Mobile-first.** Aturan CSS dasar ditulis untuk HP; desktop ditambahkan
lewat `min-width`. Animasi & sentuhan dirancang untuk Android dulu.

## Status

- [x] **Fase 1** — struktur, visual system, semua section
- [x] **Fase 2** — karakter 2D (AI-generate) + kartu maskot
- [x] **Fase 2.5** — mobile-first, animasi sentuh, no blue highlight
- [ ] **Fase 3** — scene 3D interaktif (three.js)
- [ ] **Fase 4** — QA final + deploy Vercel

## Struktur

```
nixeon-408/
├── index.html              # single-page, tanpa build step
├── src/
│   ├── style.css           # design tokens + semua style (mobile-first)
│   └── main.js             # nav, reveal, animasi maskot, parallax
├── assets/
│   ├── hero-portrait.webp  # karakter 2D (900x1200, 74 KB)
│   ├── hero-wide.webp      # latar 16:9 (1920x919, 58 KB)
│   └── unit-002.svg        # siluet fallback (kalau gambar gagal)
├── docs/
│   ├── process-hero.py     # crop + optimasi hero art
│   └── preview-*.png       # screenshot verifikasi
└── vercel.json             # config deploy (cache + header keamanan)
```

## Design tokens

```
--bg      #0A0A0C   near-black
--surface #121216
--ink     #F2F0EB   bone
--ink-dim #A8A8B2   (dinaikkan dari #94949E utk kontras WCAG)
--accent  #FF3D68   crimson
--cyan    #4DD9E8   aksen HUD saja
```

## Cara jalankan lokal

```bash
cd ~/nixeon-408
python3 -m http.server 8137 --bind 127.0.0.1
# buka http://127.0.0.1:8137/
```

## Mobile-first (Fase 2.5) — yang dikerjakan

- CSS dikonversi dari `max-width` → **`min-width`** (HP jadi basis, bukan pengecualian)
- **Tidak ada kotak biru** saat elemen ditahan: `-webkit-tap-highlight-color:transparent`
- **Tidak ada select/copy tak sengaja**: `user-select:none` pada tombol/kartu/nav,
  tapi **teks tetap bisa di-copy** (paragraf, kode, istilah teknis)
- **Umpan balik sentuh**: tombol & kartu mengecil halus saat ditekan (`:active`)
- **Animasi maskot**: muncul saat di-scroll masuk, bereaksi saat disentuh
- **Parallax halus** (hanya perangkat presisi, biar HP hemat baterai)
- **Blok kode** bisa digeser + ada isyarat visual tepi

## Catatan penting

- **Karakter**: orisinil, *terinspirasi* bahasa desain Zero Two
  (tanduk, rambut putih-pink, pilot suit) — **bukan jiplakan langsung**,
  supaya aman dipakai publik.
- **Nama**: `nixeon://408` = nama website; `JawaSkrip` = nama komunitas.
- **Bahasa**: Indonesia, istilah teknis tetap Inggris.
- Hero art di-generate dengan skill `imagen` (doctrine anti-slop).

## Kredit

- Base Baileys oleh **[Yowtech](https://github.com/Yowtech/Base)** — *"Mengembangkan Baileys Tingkat Lanjut"*

## Deploy

Static site — tanpa build step.

```bash
npx vercel --prod
```

Team ID: `team_RIVpnPJvSBx2nvaqfzxBgq6l`
