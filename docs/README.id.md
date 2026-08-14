<div align="center">

<img src="../assets/banner.png" alt="Isenax - Alat Diagram Isometrik" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## Catatan:

Repositori ini (Isenax) adalah turunan dari [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), yang itu sendiri adalah fork dari stan-smith/FossFLOW (yang pada gilirannya merupakan fork dari [markmanx/isoflow](https://github.com/markmanx/isoflow)), awalnya dibuat untuk tujuan berkontribusi ke repositori asli melalui PR. Namun nama pengguna GitHub penulis tampaknya telah diubah menjadi [mug-book-droid](https://github.com/mug-book-droid) dan aktivitasnya diatur menjadi privat (mungkin akun ditangguhkan?), sehingga repositori asli tidak dapat diakses.

Untuk saat ini, saya bermaksud menjadikan repositori ini (sekarang bernama Isenax) sebagai kelanjutan pengembangan dari FossFLOW, dan kontribusi apa pun melalui PR juga diterima dengan baik.

Anda dapat melihat status terakhir repositori asli yang saya ambil di branch `backup/stan-smith-FossFLOW`.

---

Isenax adalah aplikasi web progresif (PWA) open-source yang powerful untuk membuat diagram isometrik yang indah. Dibangun dengan React dan library <a href="https://github.com/markmanx/isoflow">Isoflow</a> (di-fork dan dipublikasikan ke npm sebagai fossflow, dan sebagai isenax di fork ini), berjalan sepenuhnya di browser Anda dengan dukungan offline.

---
<p align="center">
<b>Coba secara online --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Deploy Cepat dengan Docker

```bash
# Menggunakan Docker Compose (disarankan - termasuk penyimpanan persisten)
docker compose up

# Atau jalankan langsung dari Docker Hub dengan penyimpanan persisten
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Penyimpanan server diaktifkan secara default di Docker. Diagram Anda akan disimpan (secara default sebagai root) ke `./diagrams` di host. Untuk mengubah pengguna atau ID grup yang digunakan saat menyimpan, atur variabel lingkungan `PUID` dan `PGID`.

Untuk menonaktifkan penyimpanan server, atur `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### Autentikasi Dasar HTTP (Opsional)

Lindungi instance Isenax Anda dengan HTTP Basic Auth:

```bash
# Dengan Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# Atau dengan docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Catatan**: Kedua variabel harus diatur untuk mengaktifkan autentikasi. Jika salah satu kosong, aplikasi dapat diakses tanpa login.

## Mulai Cepat (Pengembangan Lokal)

```bash
# Clone repositori
git clone https://github.com/nyangko/Isenax
cd Isenax

# Install dependensi
npm install

# Build library (diperlukan pertama kali)
npm run build:lib

# Mulai development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Struktur Monorepo

Ini adalah monorepo yang berisi empat paket:

- `packages/isenax-lib` - Library komponen React untuk menggambar diagram jaringan (dibangun dengan Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App yang membungkus dan menampilkan library (dibangun dengan RSBuild)
- `packages/isenax-backend` - Server Express yang menyediakan penyimpanan self-hosted opsional untuk diagram (digunakan dalam deployment Docker)
- `packages/isenax-mcp` - Server MCP (Model Context Protocol) yang memungkinkan agen AI eksternal membaca, membuat, dan mengedit diagram Anda secara langsung (stdio atau Streamable HTTP)

### Perintah Pengembangan

```bash
# Pengembangan
npm run dev          # Mulai development server aplikasi
npm run dev:lib      # Mode watch untuk pengembangan library

# Build
npm run build        # Build library dan aplikasi
npm run build:lib    # Build library saja
npm run build:app    # Build aplikasi saja

# Testing & Linting
npm test             # Jalankan unit test
npm run lint         # Periksa error linting

# E2E Tests (Selenium)
cd e2e-tests
./run-tests.sh       # Jalankan end-to-end tests (memerlukan Docker & Python)

# Publishing
npm run publish:lib  # Publish library ke npm
```

## Cara Menggunakan

### Membuat Diagram

1. **Tambahkan Item**:
   - Tekan tombol "+" di menu kanan atas, library komponen akan muncul di kiri
   - Seret dan lepas komponen dari library ke kanvas
   - Atau klik kanan pada grid dan pilih "Add node"

2. **Hubungkan Item**:
   - Pilih alat Konektor (tekan 'C' atau klik ikon konektor)
   - **Mode klik** (default): Klik node pertama, lalu klik node kedua
   - **Mode seret** (opsional): Klik dan seret dari node pertama ke node kedua
   - Beralih mode di Pengaturan → tab Konektor

3. **Simpan Pekerjaan Anda**:
   - **Simpan Cepat** - Menyimpan ke sesi browser
   - **Ekspor** - Unduh sebagai file JSON
   - **Impor** - Muat dari file JSON

4. **Atur lewat panel Layers**:
   - Buka Layers dari toolbar untuk melihat semua node, konektor, area, dan kotak teks dalam satu daftar
   - Pilih item di daftar untuk menyuntingnya di tab "Edit" pada panel yang sama
   - Di layar sempit, panel terbuka sebagai bottom sheet lewat tombol di kanan bawah kanvas

### Opsi Penyimpanan

- **Penyimpanan Sesi**: Simpan sementara yang dihapus saat browser ditutup
- **Ekspor/Impor**: Penyimpanan permanen sebagai file JSON
- **Auto-Save**: Secara otomatis menyimpan perubahan setiap 5 detik ke sesi

### Integrasi MCP (Agen AI)

Isenax dilengkapi server MCP agar agen AI eksternal (Claude, dll.) dapat membaca, membuat, dan mengedit diagram Anda secara langsung:

1. Buka **Pengaturan → MCP** lalu aktifkan — URL koneksi dan token Bearer akan ditampilkan.
2. Hubungkan klien MCP Anda ke URL/token tersebut (`packages/isenax-mcp` mendukung transport stdio maupun Streamable HTTP).
3. Perubahan yang dibuat agen langsung muncul di tab mana pun yang membuka diagram tersebut, tanpa perlu refresh — indikator "MCP sedang menulis..." muncul saat prosesnya berlangsung.

Ikon bawaan hanya dikirim melalui id (data base64 tidak dikirim ke agen), dan `update_diagram_patch` memungkinkan agen mengirim hanya field yang berubah alih-alih mengirim ulang seluruh model.

## Baru ditambahkan

### Multiplexing konektor
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### Menyalin dan menempel item
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## Berkontribusi

Kami menyambut kontribusi! Silakan lihat [CONTRIBUTING.md](../CONTRIBUTING.md) untuk panduan.

## Dokumentasi

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - Panduan lengkap untuk codebase
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Panduan kontribusi

## Lisensi

MIT
