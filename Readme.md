# 🎞 DEAR MUSÉ — AI AGENT BUILD PROMPT
> Dùng file này để giao cho AI agent (Cursor, Claude Code, v.v.) tự động build website hoàn chỉnh.

---

## 0. OVERVIEW

**Tên dự án:** Dear Musé  
**Mô tả:** Studio nhiếp ảnh chuyên lưu giữ những khoảnh khắc ý nghĩa thông qua nghệ thuật và cảm xúc. Chụp cá nhân (portrait, birthday, graduation), sự kiện, và sản phẩm thương hiệu (commercial). Hình thức: studio và ngoại cảnh tùy concept.  
**Stack:** Node.js + Express + EJS + MySQL  
**Ngôn ngữ:** Tiếng Việt là chính  
**Mục tiêu UX:** Khách vào website là muốn book lịch ngay — cảm giác điện ảnh, thơ mộng, mang hơi thở của người làm thủ công chứ không phải AI.

---

## 1. PALETTE & DESIGN TOKENS

```css
:root {
  /* Brand Colors */
  --avocado-cream:  #D4DB74;  /* accent chính — nổi bật, sống động */
  --vanilla-cream:  #FFF7E6;  /* nền chủ đạo — ấm, dịu */
  --blush-petal:    #F7C8D3;  /* accent phụ — lãng mạn, nữ tính */

  /* Logo color (lấy từ logo gốc) */
  --logo-taupe:     #9C8474;  /* màu monogram DM trong logo */
  --logo-mocha:     #7A5C4A;  /* màu chữ "dear musé" trong logo */

  /* Neutrals */
  --ink:            #1A1916;  /* text chính */
  --smoke:          #6B6860;  /* text phụ */
  --parchment:      #F2EDE4;  /* nền section xen kẽ */
  --bone:           #EDE8DF;  /* border, divider */

  /* Typography */
  --font-display:   'Playfair Display', serif;  /* heading, quote lớn */
  --font-body:      'DM Sans', sans-serif;       /* body, nav, button, form */

  /* Spacing */
  --section-gap:    120px;
  --container:      1280px;

  /* Motion */
  --ease-silk:      cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-snap:      cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**Google Fonts cần import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet">
```

**Nguyên tắc dùng font:**
- `Playfair Display 400/500` — heading section, tagline, quote, tên dịch vụ
- `Playfair Display italic` — tagline nhỏ, caption ảnh, tên studio khi cần text
- `DM Sans 300/400` — body text, mô tả, paragraph
- `DM Sans 500` — nav links, button, label form, giá tiền
- **KHÔNG dùng Playfair Display cho đoạn văn dài** — mỏi mắt, chỉ dùng cho display text

---

## 2. LOGO & BRAND IDENTITY

### Thông tin logo
- **File:** `public/logo/logo.jpg`
- **Style:** Monogram "DM" serif cổ điển, màu warm taupe (#9C8474), có nhánh hoa botanical mảnh vẽ tay bên trái
- **Tagline trong logo:** "dear *musé*" (chữ thường, "musé" italic) + gạch ngang trang trí + "photo studio" letter-spaced
- **Nền logo:** Trắng — cần xử lý khi đặt trên nền màu (dùng `mix-blend-mode: multiply` hoặc dùng bản PNG nền trong nếu có)

### Cách dùng logo trên website
```
- Header desktop: logo ở giữa, navigation chia đều 2 bên (xem mục 5 — NAV)
- Header mobile: logo căn giữa, hamburger icon bên phải
- Footer: logo nhỏ hơn, căn giữa hoặc trái
- Favicon: crop phần monogram "DM"
- Kích thước header: logo height = 64px (desktop), 48px (mobile)
```

---

## 3. NAVIGATION — HEADER

### Cấu trúc split-center nav (DESKTOP)
```
|  Trang chủ   Dịch vụ   Portfolio  |  [LOGO]  |  Bảng giá   Về chúng tôi   Liên hệ  |
```

**HTML structure:**
```html
<header class="site-header">
  <nav class="nav-inner">
    <!-- Nhóm trái: 3 links -->
    <ul class="nav-left">
      <li><a href="/">Trang chủ</a></li>
      <li><a href="/services">Dịch vụ</a></li>
      <li><a href="/portfolio">Portfolio</a></li>
    </ul>

    <!-- Logo trung tâm -->
    <a href="/" class="nav-logo">
      <img src="/logo/logo.jpg" alt="Dear Musé Photo Studio" height="64">
    </a>

    <!-- Nhóm phải: 3 links + CTA -->
    <ul class="nav-right">
      <li><a href="/pricing">Bảng giá</a></li>
      <li><a href="/about">Về chúng tôi</a></li>
      <li><a href="/contact">Liên hệ</a></li>
      <li><a href="/booking" class="nav-cta">Đặt lịch</a></li>
    </ul>
  </nav>
</header>
```

**CSS cho split-center nav:**
```css
.site-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(255, 247, 230, 0.92); /* vanilla-cream + blur */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 0.5px solid var(--bone);
  transition: background 0.3s var(--ease-silk);
}

/* Khi scroll xuống: header trong suốt hơn */
.site-header.scrolled {
  background: rgba(255, 247, 230, 0.97);
  box-shadow: 0 1px 20px rgba(26, 25, 22, 0.06);
}

.nav-inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 2rem;
  height: 80px;
  display: grid;
  grid-template-columns: 1fr auto 1fr; /* KEY: trái | logo | phải */
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: flex-end; /* đẩy về phía logo */
  list-style: none;
  margin: 0; padding: 0;
  padding-right: 2.5rem;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: flex-start; /* đẩy về phía logo */
  list-style: none;
  margin: 0; padding: 0;
  padding-left: 2.5rem;
}

.nav-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-logo img {
  height: 64px;
  width: auto;
  display: block;
}

.nav-left a,
.nav-right a {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--smoke);
  text-decoration: none;
  transition: color 0.2s;
}

.nav-left a:hover,
.nav-right a:hover,
.nav-left a.active,
.nav-right a.active {
  color: var(--ink);
}

/* CTA button trong nav */
.nav-cta {
  font-family: var(--font-body) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  letter-spacing: 0.1em !important;
  text-transform: uppercase !important;
  color: var(--vanilla-cream) !important;
  background: var(--ink);
  padding: 10px 20px;
  border-radius: 2px;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}

.nav-cta:hover {
  background: var(--logo-mocha);
  transform: translateY(-1px);
}
```

### Navigation MOBILE (< 768px)
```
Layout: Logo căn giữa | Hamburger icon bên phải
Khi mở: full-screen overlay, nền vanilla-cream, links dọc căn giữa, font lớn Playfair Display
Animation: slide từ trên xuống hoặc fade in
```

```css
@media (max-width: 767px) {
  .nav-left, .nav-right { display: none; }

  .nav-inner {
    grid-template-columns: 1fr auto 1fr;
    height: 60px;
  }

  .nav-logo img { height: 48px; }

  .nav-hamburger {
    grid-column: 3;
    justify-self: end;
    /* icon hamburger 24px */
  }
}

/* Mobile menu overlay */
.mobile-menu {
  position: fixed;
  inset: 0;
  background: var(--vanilla-cream);
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s var(--ease-silk);
}

.mobile-menu.open {
  opacity: 1;
  pointer-events: all;
}

.mobile-menu a {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 400;
  color: var(--ink);
  text-decoration: none;
  letter-spacing: 0.02em;
}
```

---

## 4. CẤU TRÚC DỰ ÁN

```
dear-muse/
├── app.js
├── config/
│   └── db.js
├── routes/
│   ├── index.js
│   └── admin.js
├── controllers/
│   ├── homeController.js
│   ├── portfolioController.js
│   ├── bookingController.js
│   ├── contactController.js
│   └── adminController.js
├── models/
│   ├── Booking.js
│   ├── Portfolio.js
│   ├── Service.js
│   └── Contact.js
├── views/
│   ├── layouts/
│   │   └── main.ejs
│   ├── partials/
│   │   ├── nav.ejs          ← split-center nav như mô tả trên
│   │   ├── footer.ejs
│   │   └── mobile-menu.ejs
│   ├── home.ejs
│   ├── portfolio.ejs
│   ├── portfolio-detail.ejs
│   ├── services.ejs
│   ├── pricing.ejs
│   ├── booking.ejs
│   ├── about.ejs
│   ├── contact.ejs
│   └── admin/
│       ├── dashboard.ejs
│       ├── bookings.ejs
│       └── portfolio.ejs
├── public/
│   ├── css/
│   │   ├── main.css
│   │   ├── home.css
│   │   ├── portfolio.css
│   │   └── booking.css
│   ├── js/
│   │   ├── main.js
│   │   ├── home.js
│   │   └── booking.js
│   ├── logo/
│   │   └── logo.jpg         ← logo chính (warm taupe, white bg)
│   └── source/              ← ảnh gốc của studio
├── .env
└── package.json
```

---

## 5. XỬ LÝ ẢNH TỪ `public/source`

> **AGENT: Trước khi code bất kỳ thứ gì liên quan đến ảnh, hãy thực hiện bước này.**

### Bước 1 — Scan và phân loại ảnh
```bash
ls public/source/
```
Đọc tên file và đường dẫn subfolder. Phân loại ảnh theo các nhóm:
- `portrait` — chụp cá nhân, chân dung
- `event` — sự kiện, sinh nhật, tốt nghiệp
- `commercial` — sản phẩm, thương hiệu
- `outdoor` — ngoại cảnh, thiên nhiên
- `studio` — trong phòng, set ánh sáng
- `misc` — còn lại

### Bước 2 — Chọn ảnh hero
Chọn **1 ảnh** đẹp nhất, nét nhất, có không khí điện ảnh nhất làm hero fullscreen. Nếu có nhiều ảnh đẹp ngang nhau, tạo mảng `heroImages[]` để slideshow tối đa 3 ảnh.

### Bước 3 — Tạo gallery data
Trong `homeController.js`, hardcode array ảnh đã chọn:
```js
const featuredImages = [
  { src: '/source/[tên-file]', category: 'portrait', alt: '...' },
  // ...min 6 ảnh, mix category
];
```

### Bước 4 — Tối ưu
- `loading="lazy"` cho tất cả ảnh dưới fold
- Hero image: `fetchpriority="high"`
- Wrap trong `aspect-ratio` container

---

## 6. DATABASE SCHEMA (MySQL)

```sql
CREATE DATABASE IF NOT EXISTS dear_muse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dear_muse;

CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_desc VARCHAR(500),
  price_from INT,
  duration_minutes INT,
  cover_image VARCHAR(500),
  is_featured TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  category ENUM('portrait','event','commercial','outdoor','studio') NOT NULL,
  description TEXT,
  cover_image VARCHAR(500) NOT NULL,
  images JSON,
  shoot_date DATE,
  is_featured TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(20) UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  service_id INT,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  backup_date DATE,
  location_type ENUM('studio','outdoor','both') DEFAULT 'studio',
  location_note TEXT,
  message TEXT,
  status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE TABLE contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO services (name, slug, description, short_desc, price_from, duration_minutes, is_featured, sort_order) VALUES
('Portrait Cá Nhân', 'portrait-ca-nhan', 'Chụp chân dung nghệ thuật — nắm bắt cá tính và cảm xúc của bạn trong từng khung hình.', 'Lưu giữ khoảnh khắc của chính bạn', 1500, 90, 1, 1),
('Sinh Nhật & Tốt Nghiệp', 'sinh-nhat-tot-nghiep', 'Những cột mốc quan trọng xứng đáng được ghi lại theo cách đẹp nhất.', 'Cột mốc cuộc đời đáng nhớ', 1800, 120, 1, 2),
('Sự Kiện', 'su-kien', 'Ghi lại không khí và cảm xúc của những buổi sự kiện đặc biệt.', 'Khoảnh khắc tập thể, cảm xúc riêng tư', 3000, 180, 0, 3),
('Thương Hiệu & Sản Phẩm', 'thuong-hieu-san-pham', 'Ảnh thương mại chuyên nghiệp — nâng tầm hình ảnh thương hiệu của bạn.', 'Hình ảnh bán hàng, hình ảnh thương hiệu', 2500, 120, 1, 4);
```

---

## 7. TRANG HOME (`home.ejs`)

### 7.1 — Hero Section (fullscreen)
```
Layout: 100dvh, ảnh fullscreen
- Ảnh nền: lấy từ public/source (ảnh đẹp nhất)
- Overlay: linear-gradient(to bottom, rgba(26,25,22,0.15) 0%, rgba(26,25,22,0.45) 100%)
- Text: bottom-left, padding 4rem
  · [DM Sans 11px, letter-spacing 0.2em, uppercase, color: vanilla-cream/70%] "STUDIO NHIẾP ẢNH NGHỆ THUẬT"
  · [Playfair Display italic 72–96px, color: vanilla-cream] "dear musé"
  · [DM Sans 300 16px, color: vanilla-cream/80%] "Lưu giữ khoảnh khắc — bằng ánh sáng, bằng cảm xúc"
  · [CTA button] "Đặt lịch chụp" — outline style (border vanilla-cream, text vanilla-cream)
    hover: fill vanilla-cream, text ink
- Hiệu ứng: chữ stagger fade-in từ dưới lên khi load (delay 0.2s mỗi dòng)
- Parallax: ảnh nền scroll chậm hơn 0.5x so với content (transform: translateY)
- Scroll indicator: dấu mũi tên nhỏ + chữ "cuộn xuống" animate bounce, bottom-center
```

### 7.2 — Intro Manifesto
```
Layout: Centered, max-width 700px, padding 100px 0, nền vanilla-cream
- Quote (Playfair Display italic 32–38px, line-height 1.6):
  "Mỗi bức ảnh là một khoảnh khắc được chọn lọc —
   không phải bởi máy móc, mà bởi con người biết nhìn."
- Attribution: "— Dear Musé Studio" (DM Sans 13px, letter-spacing 0.1em)
- Đường kẻ trang trí mảnh trên và dưới quote (giống divider trong logo)
- Hiệu ứng: từng dòng text reveal khi scroll (Intersection Observer + CSS transition)
```

### 7.3 — Featured Works (Masonry Gallery)
```
Layout: CSS columns masonry, 3 cột desktop / 2 cột tablet / 1 cột mobile
- Lấy 6–9 ảnh từ public/source, mix dọc ngang
- Heading: [trái] "Những khoảnh khắc" (Playfair Display 36px) | [phải] "xem tất cả →" (DM Sans 13px)
- Hover mỗi ảnh:
  · scale(1.02) transition 0.4s
  · overlay màu blush-petal với opacity 0.15
  · hiện category label nhỏ ở góc dưới phải
- Click → link đến /portfolio
- Images reveal stagger khi scroll vào viewport
```

### 7.4 — Services Teaser
```
Layout: 4 card dạng grid, nền parchment (#F2EDE4)
- Mỗi card:
  · Icon line-art SVG 32px (tự tạo hoặc dùng Lucide)
  · Tên dịch vụ (Playfair Display 20px)
  · Mô tả ngắn (DM Sans 300 14px)
  · "Từ X.XXX.000đ" (DM Sans 500 13px, màu logo-mocha)
  · Hover: card lift translateY(-4px), border-color đậm hơn
- CTA: "Xem toàn bộ dịch vụ" link → /services
```

### 7.5 — About Teaser (split)
```
Layout: 50/50 grid
- Trái: ảnh đứng (portrait ratio 3:4) từ public/source
- Phải: text
  · Label nhỏ: "VỀ CHÚNG TÔI" (DM Sans uppercase)
  · Heading: "Người đứng sau ống kính" (Playfair Display 36px)
  · Text 3–4 dòng về studio (DM Sans 300 16px, line-height 1.8)
  · Link: "Câu chuyện của chúng tôi →"
- Animation: ảnh slide từ trái, text từ phải (Intersection Observer)
```

### 7.6 — Booking CTA Banner
```
Layout: Fullwidth, padding 80px, nền avocado-cream (#D4DB74)
- Heading lớn (Playfair Display italic 48px, ink): "Sẵn sàng tạo nên khoảnh khắc?"
- Sub (DM Sans 16px, ink/70%): "Liên hệ đặt lịch — phản hồi trong 24h"
- Button: "Đặt lịch ngay" — solid ink background, vanilla-cream text
```

### 7.7 — Footer
```
Nền: ink (#1A1916)
Layout: Logo + tagline | 3 cột links | Social icons
- Logo: white filter hoặc dùng lại logo (mix-blend-mode: screen nếu nền tối)
- Font: DM Sans 13px, màu vanilla-cream/60%
- Links hover: vanilla-cream/100%
- Bottom bar: "© 2025 Dear Musé · Crafted with care."
```

---

## 8. CÁC TRANG KHÁC

### `/portfolio`
- Filter tabs: Tất cả | Chân dung | Sự kiện | Thương hiệu | Ngoại cảnh
- Grid masonry, lazy load
- Lightbox: GLightbox
- Load more button

### `/services`
- Card mỗi dịch vụ: ảnh cover, tên, mô tả, giá từ, duration
- Nút "Đặt lịch dịch vụ này" → `/booking?service=slug`
- FAQ accordion ở cuối

### `/pricing`
- Card 2–3 tier
- Highlight gói featured
- Note: "Giá có thể thay đổi tùy concept, liên hệ để báo giá chính xác"

### `/booking` ⭐
```
Form fields:
  1. Họ tên *
  2. Số điện thoại * (validate VN: 0[3-9][0-9]{8})
  3. Email
  4. Dịch vụ (select từ DB)
  5. Ngày mong muốn * (date picker, min = tomorrow)
  6. Giờ (select: 7–9h | 9–11h | 14–16h | 16–18h | 18–20h)
  7. Ngày dự phòng
  8. Hình thức: Studio / Ngoại cảnh / Cả hai
  9. Địa điểm (hiện khi chọn ngoại cảnh)
  10. Lời nhắn (textarea)

POST → save DB, generate booking_code (DM-YYYYMMDD-XXXX) → trang confirm
Nodemailer: gửi email xác nhận nếu có email
```

### `/about`
- Hero ảnh lớn + overlay text
- Câu chuyện studio (Playfair Display heading, DM Sans body)
- Triết lý chụp ảnh
- Behind-the-scenes gallery nhỏ

### `/contact`
- Form: Tên, SĐT, Email, Tiêu đề, Nội dung
- Thông tin liên hệ: SĐT, Email, Facebook, Instagram
- Google Maps embed nếu có địa chỉ

---

## 9. ADMIN PANEL

### Auth
- Session: express-session + bcrypt
- Middleware protect `/admin/*`
- Login: `/admin/login`

### Dashboard
- Count: pending / confirmed / completed bookings
- Booking mới nhất 7 ngày
- Tin nhắn chưa đọc

### `/admin/bookings`
- Bảng filter theo status, ngày
- Actions: Xác nhận / Hoàn thành / Huỷ / Chi tiết
- Ghi chú admin

### `/admin/portfolio`
- Upload ảnh (multer)
- CRUD album
- Toggle featured

---

## 10. GLOBAL UX & ANIMATION

### Custom Cursor (desktop only)
```js
// Vòng tròn 20px theo chuột, border 1px logo-taupe
// Hover ảnh: scale lên 48px + label "xem" xuất hiện
// Hover button/link: cursor merge (scale 0, button highlight)
// Mobile: ẩn cursor tùy chỉnh
```

### Scroll Reveal
```css
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s var(--ease-silk), transform 0.7s var(--ease-silk);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger cho list items */
.reveal:nth-child(2) { transition-delay: 0.1s; }
.reveal:nth-child(3) { transition-delay: 0.2s; }
.reveal:nth-child(4) { transition-delay: 0.3s; }
```

### Loading Screen
```
- Nền vanilla-cream toàn màn hình
- Chữ "dear musé" (Playfair Display italic 48px, logo-taupe) fade in → 0.8s delay → fade out
- Tổng thời gian: ~1.4s
- Dùng sessionStorage để chỉ hiện lần đầu
```

### Page Transitions
- Fade out 200ms → navigate → fade in 300ms
- Vanilla JS + CSS class `.page-leaving`

### Smooth Scroll
- Lenis.js (CDN) hoặc CSS `scroll-behavior: smooth`

---

## 11. PACKAGES

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "mysql2": "^3.6.0",
    "express-session": "^1.17.3",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "connect-flash": "^0.1.1"
  }
}
```

**CDN (trong layout EJS):**
- GLightbox — `https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css`
- Lenis — `https://cdn.jsdelivr.net/npm/@studio-freight/lenis/bundled/lenis.min.js`
- Google Fonts (Playfair Display + DM Sans)

---

## 12. ENV

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dear_muse

SESSION_SECRET=dear_muse_secret_key_change_this

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="Dear Musé Studio <your@gmail.com>"
```

---

## 13. CHECKLIST BUILD ORDER

- [ ] **B1:** `npm init` + cài packages + cấu trúc thư mục
- [ ] **B2:** MySQL schema + seed data
- [ ] **B3:** Scan `public/source` → phân loại ảnh → data arrays
- [ ] **B4:** Express app + EJS layout (`main.ejs`) + Google Fonts
- [ ] **B5:** `nav.ejs` — split-center layout, logo giữa, scroll behavior
- [ ] **B6:** `footer.ejs`
- [ ] **B7:** `main.css` — CSS variables, reset, typography, scroll reveal, loading screen
- [ ] **B8:** **HOME PAGE** — 7 sections theo thứ tự mục 7
- [ ] **B9:** Trang Portfolio
- [ ] **B10:** Trang Services + Pricing
- [ ] **B11:** Trang Booking (form + validate + controller + DB + email)
- [ ] **B12:** Trang About + Contact
- [ ] **B13:** Admin panel
- [ ] **B14:** Mobile responsive (breakpoints 768 / 1024)
- [ ] **B15:** Test toàn bộ + fix

---

## 14. TONE & COPY

- **Ấm, gần gũi, tinh tế** — không formal quá, không casual quá
- **Thơ mộng** — ẩn dụ nhẹ, để ảnh nói chuyện
- **Tránh:** "chuyên nghiệp", "uy tín", "giá cả hợp lý", "đội ngũ kinh nghiệm"

Ví dụ tốt: *"Không phải mọi khoảnh khắc đều cần được ghi lại — chỉ những khoảnh khắc xứng đáng."*

---

*Dear Musé Photo Studio · 2025*