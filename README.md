# nixeon://408 — Portfolio JawaSkrip ⚙️

Portfolio komunitas **JawaSkrip** — tempat belajar bot WhatsApp (Baileys),
AI, dan vibe coding.

**Mobile-first.** Aturan CSS dasar ditulis untuk HP; desktop ditambahkan
lewat `min-width`. Animasi & sentuhan dirancang untuk Android dulu.

## Status

- [x] **Fase 1** — struktur, visual system, semua section
- [x] **Fase 2** — karakter 2D (AI-generate) + kartu maskot
- [x] **Fase 2.5** — mobile-first, animasi sentuh, no blue highlight
- [x] **Fase 3** — maskot **3D** (`.obj`+`.mtl` via three.js) + animasi mikro
- [x] **Fase 3.5** — rombak anti-slop (buang pola template SaaS) + section tqto
- [ ] **Fase 4** — QA final + deploy Vercel

## Struktur

```
nixeon-408/
├── index.html              # single-page, tanpa build step
├── src/
│   ├── style.css           # design tokens + layout dasar (mobile-first)
│   ├── parts/editorial.css # komponen anti-slop (spec line, daftar, tqto)
│   ├── main.js             # nav, reveal, animasi maskot, parallax
│   ├── hero3d.js           # scene three.js + animasi mikro 3D
│   └── vendor/             # three.js + OBJLoader/MTLLoader (lokal, tanpa CDN)
├── assets/
│   ├── 3d/unit-002.obj     # maskot 3D (34 bagian terpisah)
│   ├── 3d/unit-002.mtl     # material 3D
│   ├── 3d/unit-002.glb     # versi glTF (satu file)
│   ├── 3d/unit-002-3d.py   # skrip Blender pembuat model
│   ├── hero-portrait.webp  # karakter 2D (fallback kalau WebGL mati)
│   └── unit-002.svg        # siluet fallback terakhir
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

## Anti-slop (apa yang sengaja DIHINDARI)

Pola template SaaS yang dibuang: **4 kolom statistik**, **grid kartu seragam**,
**pill tag di setiap item**, dan **kata serif italic di setiap heading**.

Penggantinya: garis hairline + tipografi + ritme — *spec line* editorial,
daftar project 2 kolom, roadmap bernomor, dan section tqto.

## Animasi

| Animasi | Pemicu |
|---|---|
| Maskot 3D: idle bob, cincin orbit, pulse visor | loop otomatis |
| Maskot 3D: parallax | gerak pointer (desktop) |
| Maskot 3D: rotasi | drag (desktop) / sentuh-geser (HP) |
| Reveal bertingkat | scroll masuk |
| Marquee | loop otomatis |
| Tombol/kartu mengecil | tekan (`:active`) |

Semua hormati `prefers-reduced-motion`.

## tqto

Terima kasih untuk **marrspace** (arah desain & base portfolio) dan
**Yowtech** (Base Baileys). Lihat section `#tqto`.
