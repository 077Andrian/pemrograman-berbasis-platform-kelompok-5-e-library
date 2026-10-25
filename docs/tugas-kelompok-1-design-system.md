# Tugas Kelompok 1 — Design System E-Library

**Status:** Draft usulan. Bahas melalui GitHub Issue dan tandai sebagai final setelah disetujui kelompok.

## 1. Tujuan
Menyepakati token visual dan pola komponen bersama agar halaman publik dan admin terlihat konsisten.

## 2. Usulan token visual

### Warna utama
| Token | Hex | Penggunaan |
|---|---|---|
| Primary | `#1E3A5F` | Navigasi utama, tombol utama, judul yang ditekankan |
| Accent | `#14B8A6` | Aksen, indikator terpilih, elemen pendukung |
| Surface | `#F8FAFC` | Latar halaman dan area konten |

Warna status seperti error adalah warna semantik untuk memberi informasi validasi, bukan warna merek utama. Contoh error menggunakan `#DC2626`; pastikan kontrasnya memadai saat implementasi.

### Tipografi
- **Font judul:** Inter, bobot 600–700.
- **Font isi:** Inter, bobot 400–500.
- Jika Inter belum tersedia pada lingkungan target, gunakan fallback sans-serif yang sesuai.

### Radius sudut
- Kecil: `4px`
- Sedang: `8px`
- Besar: `12px`

### Skala spacing
Gunakan kelipatan 4 px: `4, 8, 12, 16, 24, 32, 48 px`.

### Shadow
- Elevasi rendah untuk kartu: `0 1px 3px rgba(15, 23, 42, 0.10)`
- Elevasi menengah untuk dropdown/modal: `0 8px 24px rgba(15, 23, 42, 0.12)`

Semua token di bagian ini masih usulan sampai disetujui anggota kelompok.

## 3. Pendekatan komponen
**Usulan:** gunakan komponen siap pakai yang konsisten untuk Button, Card, dan Input. Gunakan utility/style helpers untuk layout dan spacing yang sederhana.

Alasan: komponen interaktif lebih mudah diuji, memiliki state yang konsisten, dan dapat digunakan ulang pada banyak halaman. Utility tetap berguna untuk tata letak sederhana tanpa menduplikasi perilaku komponen.

Keputusan final dan framework web harus disepakati oleh kelompok terlebih dahulu.

## 4. Contoh komponen
Contoh berikut adalah ilustrasi HTML/CSS netral. Adaptasikan implementasi ke framework web yang disepakati.

### Button
**Normal state**
```html
<button class='button button-primary'>Masuk</button>
```

**Contoh style**
```css
.button {
  border: 0;
  border-radius: 8px;
  padding: 10px 16px;
  font: 600 1rem/1.4 Inter, sans-serif;
  cursor: pointer;
}
.button-primary {
  color: #fff;
  background: #1E3A5F;
}
.button-primary:hover {
  filter: brightness(1.12);
}
.button-primary:focus-visible {
  outline: 3px solid #14B8A6;
  outline-offset: 2px;
}
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```
**State yang perlu ditampilkan:** normal, hover/focus, dan disabled.

### Card
**Normal state**
```html
<article class='book-card'>
  <h3>Judul Buku</h3>
  <p>Nama penulis</p>
</article>
```

**Contoh style**
```css
.book-card {
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.10);
}
```
**State yang perlu ditampilkan:** normal dan hover/focus jika kartu dapat dipilih atau diklik.

### Input
**Normal state**
```html
<label for='email'>Email</label>
<input id='email' type='email' placeholder='nama@contoh.com' />
```

**Contoh style**
```css
input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font: 400 1rem Inter, sans-serif;
}
input:focus-visible {
  outline: 3px solid #14B8A6;
  outline-offset: 1px;
}
input[aria-invalid='true'] {
  border-color: #DC2626;
}
```

**Error state**
```html
<label for='email-error'>Email</label>
<input id='email-error' type='email' aria-invalid='true' aria-describedby='email-help' />
<p id='email-help'>Format email belum benar.</p>
```

## 5. Pendekatan halaman publik dan admin
**Usulan awal:**
- Gunakan token warna, tipografi, radius, spacing, dan komponen dasar yang sama.
- Halaman publik berfokus pada pencarian/penjelajahan buku dan informasi E-Library.
- Halaman admin menggunakan pola komponen dasar yang sama, tetapi navigasi dan akses fiturnya mengikuti role admin.
- Perbedaan tampilan atau navigasi tidak menggantikan pemeriksaan otorisasi oleh backend.

Bahas pendekatan ini melalui GitHub Issue. Catat perubahan keputusan di Issue dan perbarui bagian keputusan akhir pada dokumen ini.

## 6. Bukti visual
Screenshot belum dilampirkan pada draft awal. Tambahkan screenshot dari implementasi yang benar-benar dijalankan pada folder `docs/assets/` setelah dibuat.

- [ ] Screenshot Button: normal dan state interaktif/disabled.
- [ ] Screenshot Card: normal dan hover/focus jika relevan.
- [ ] Screenshot Input: normal dan error.
- [ ] Pastikan semua screenshot memperlihatkan style yang sama dengan token yang telah disepakati.

## 7. Keputusan akhir kelompok
- Warna final: Menunggu keputusan kelompok.
- Font final: Menunggu keputusan kelompok.
- Radius, spacing, shadow final: Menunggu keputusan kelompok.
- Pendekatan komponen: Menunggu keputusan kelompok.
- Pendekatan halaman publik/admin: Menunggu keputusan kelompok.

## 8. Checklist penyelesaian
- [ ] Token 2–3 warna utama dengan hex disepakati.
- [ ] Font judul dan isi ditetapkan.
- [ ] Radius, spacing, dan shadow ditetapkan.
- [ ] Contoh Button, Card, dan Input berisi kode serta screenshot.
- [ ] State normal dan state interaktif/error ditunjukkan.
- [ ] Pendekatan komponen dan halaman publik/admin diputuskan melalui Issue.
- [ ] Dokumen direview oleh anggota lain dan di-merge sebelum Tugas Kelompok 2 dimulai.