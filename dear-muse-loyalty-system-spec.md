# 🌸 DEAR MUSÉ STUDIO — HỆ THỐNG TÍCH ĐIỂM & VOUCHER

> **Tài liệu kỹ thuật dành cho AI Agent / Developer**  
> Phiên bản: 1.0 | Mục tiêu: Implement hệ thống Loyalty Program đầy đủ cho website studio

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Database Schema](#2-database-schema)
3. [Business Logic — Tích điểm Mảnh Sáng](#3-business-logic--tích-điểm-mảnh-sáng)
4. [Hạng thành viên (Musé Card)](#4-hạng-thành-viên-musé-card)
5. [Hệ thống Voucher](#5-hệ-thống-voucher)
6. [Referral System](#6-referral-system)
7. [API Endpoints](#7-api-endpoints)
8. [UI/UX Components](#8-uiux-components)
9. [Edge Cases & Validation Rules](#9-edge-cases--validation-rules)

---

## 1. TỔNG QUAN HỆ THỐNG

### Khái niệm cốt lõi

| Khái niệm | Mô tả |
|-----------|-------|
| **Mảnh Sáng** | Đơn vị tích lũy duy nhất. Tương tự "điểm thưởng" nhưng mang bản sắc thương hiệu studio |
| **Musé Card** | Thẻ thành viên ảo, phân 4 hạng dựa trên tổng Mảnh Sáng tích lũy |
| **Voucher** | Phần thưởng quy đổi từ Mảnh Sáng hoặc cấp tự động theo sự kiện |
| **Referral** | Cơ chế giới thiệu bạn bè, tặng thưởng 2 chiều |

### Luồng tổng quát

```
Khách đặt lịch / chi tiêu / hoạt động
        ↓
Hệ thống tính & cộng Mảnh Sáng
        ↓
Kiểm tra thăng hạng thẻ
        ↓
Khách dùng Mảnh Sáng đổi Voucher
        ↓
Voucher áp dụng khi thanh toán / đặt lịch
```

---

## 2. DATABASE SCHEMA

> **Ghi chú**: Các bảng dưới đây cần được thêm vào DB hiện tại của studio. Sử dụng UUID cho primary key. Timestamps mặc định `created_at`, `updated_at` cho tất cả bảng.

---

### 2.1 Bảng `members`

Lưu thông tin thành viên và trạng thái thẻ Musé Card.

```sql
CREATE TABLE members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mảnh Sáng
  manh_sang_total   INT NOT NULL DEFAULT 0,   -- Tổng tích lũy từ trước đến nay (không giảm)
  manh_sang_balance INT NOT NULL DEFAULT 0,   -- Số hiện tại có thể dùng (giảm khi đổi voucher)
  
  -- Hạng thẻ
  card_tier         VARCHAR(20) NOT NULL DEFAULT 'pearl'
                    CHECK (card_tier IN ('pearl', 'rose', 'gold', 'privilege')),
  
  -- Các cột tracking để tránh tặng điểm 2 lần
  is_first_booking_done   BOOLEAN NOT NULL DEFAULT FALSE,
  is_first_register_done  BOOLEAN NOT NULL DEFAULT FALSE,
  second_booking_rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Referral
  referral_code     VARCHAR(12) UNIQUE NOT NULL,  -- Code của member này để chia sẻ
  referred_by       UUID REFERENCES members(id),   -- Ai giới thiệu member này
  referral_count    INT NOT NULL DEFAULT 0,        -- Số người đã giới thiệu thành công
  
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_referral_code ON members(referral_code);
CREATE INDEX idx_members_card_tier ON members(card_tier);
```

---

### 2.2 Bảng `manh_sang_transactions`

Log toàn bộ lịch sử cộng/trừ Mảnh Sáng.

```sql
CREATE TABLE manh_sang_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  
  amount        INT NOT NULL,  -- Dương = cộng, Âm = trừ (khi đổi voucher)
  balance_after INT NOT NULL,  -- Số dư sau giao dịch (snapshot)
  
  type          VARCHAR(50) NOT NULL CHECK (type IN (
    'spend',              -- Chi tiêu (10k = 1 mảnh)
    'register_bonus',     -- Đăng ký lần đầu
    'first_booking',      -- Đặt lịch lần đầu
    'early_deposit',      -- Cọc sớm
    'second_visit',       -- Quay lại lần 2
    'referral_reward',    -- Giới thiệu thành công
    'feedback_photo',     -- Feedback + ảnh + tag
    'social_share',       -- TikTok/Reels hậu trường
    'birthday_booking',   -- Đặt lịch tháng sinh nhật
    'group_booking',      -- Chụp nhóm 3+ người
    'voucher_redeem',     -- Đổi voucher (âm)
    'admin_adjust',       -- Admin điều chỉnh thủ công
    'referral_milestone'  -- Đạt mốc 3 hoặc 7 người giới thiệu
  )),
  
  description   TEXT,           -- Mô tả chi tiết (hiển thị cho user)
  reference_id  UUID,           -- ID booking / payment / voucher liên quan (nullable)
  reference_type VARCHAR(30),   -- 'booking' | 'payment' | 'voucher' | 'referral'
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mst_member_id ON manh_sang_transactions(member_id);
CREATE INDEX idx_mst_type ON manh_sang_transactions(type);
CREATE INDEX idx_mst_created_at ON manh_sang_transactions(created_at DESC);
```

---

### 2.3 Bảng `vouchers`

Catalog định nghĩa các loại voucher.

```sql
CREATE TABLE vouchers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_prefix       VARCHAR(20) NOT NULL,        -- Tiền tố để gen code, VD: 'GLOW', 'ROSE'
  name              VARCHAR(100) NOT NULL,        -- Tên hiển thị
  description       TEXT,
  
  -- Loại voucher
  voucher_type      VARCHAR(30) NOT NULL CHECK (voucher_type IN (
    'redeem',       -- Quy đổi bằng Mảnh Sáng
    'birthday',     -- Tặng tự động khi đặt lịch tháng sinh nhật
    'seasonal',     -- Dịp đặc biệt (8/3, 20/10, Tết,...)
    'referral',     -- Tặng cho người được giới thiệu
    'milestone',    -- Đạt mốc tích lũy
    'manual'        -- Admin tặng thủ công
  )),
  
  -- Giá trị giảm
  discount_type     VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
  discount_value    NUMERIC(10,2) NOT NULL,       -- VNĐ hoặc %
  max_discount_amount NUMERIC(10,2),              -- Cap tối đa nếu discount_type = 'percent'
  min_order_value   NUMERIC(10,2) DEFAULT 0,      -- Giá trị đơn hàng tối thiểu để áp dụng
  
  -- Chi phí quy đổi (chỉ áp dụng với type = 'redeem')
  manh_sang_cost    INT,
  
  -- Hạn chế hạng thành viên
  required_tier     VARCHAR(20) CHECK (required_tier IN ('pearl', 'rose', 'gold', 'privilege')),
  -- NULL = tất cả hạng đều dùng được
  
  -- Thời hạn hiệu lực (của bản gốc catalog)
  valid_days        INT DEFAULT 90,  -- Số ngày hiệu lực tính từ khi phát hành

  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data cho 4 voucher quy đổi cơ bản
INSERT INTO vouchers (code_prefix, name, voucher_type, discount_type, discount_value, manh_sang_cost) VALUES
('GLOW',      'Glow Voucher',      'redeem', 'fixed', 50000,  80),
('ROSE',      'Rose Voucher',      'redeem', 'fixed', 100000, 200),
('GOLD',      'Gold Voucher',      'redeem', 'fixed', 200000, 400),
('SIGNATURE', 'Signature Voucher', 'redeem', 'fixed', 0,      500);
-- Signature Voucher: discount_value = 0 vì giá trị tùy gói, cần xử lý riêng
```

---

### 2.4 Bảng `member_vouchers`

Voucher đã được phát/đổi cho từng thành viên.

```sql
CREATE TABLE member_vouchers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  voucher_id    UUID NOT NULL REFERENCES vouchers(id),
  
  code          VARCHAR(30) UNIQUE NOT NULL,   -- Code duy nhất, VD: 'GLOW-A3X9KL'
  
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  
  manh_sang_spent INT DEFAULT 0,  -- Số Mảnh Sáng đã dùng để đổi (0 nếu voucher tặng)
  
  -- Thông tin sử dụng
  used_at       TIMESTAMPTZ,
  used_on_booking_id UUID REFERENCES bookings(id),
  
  -- Hiệu lực
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  issued_reason TEXT,   -- Lý do cấp (ví dụ: "Đặt lịch tháng sinh nhật", "Giới thiệu bạn")
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mv_member_id ON member_vouchers(member_id);
CREATE INDEX idx_mv_code ON member_vouchers(code);
CREATE INDEX idx_mv_status ON member_vouchers(status);
CREATE INDEX idx_mv_expires_at ON member_vouchers(expires_at);
```

---

### 2.5 Bảng `referrals`

Theo dõi quan hệ giới thiệu.

```sql
CREATE TABLE referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES members(id),  -- Người giới thiệu
  referee_id      UUID NOT NULL REFERENCES members(id),  -- Người được giới thiệu
  
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'cancelled')),
  -- pending: referee đã đăng ký nhưng chưa đặt lịch lần đầu
  -- completed: referee đã đặt lịch → cả 2 nhận thưởng
  
  referrer_rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  referee_rewarded  BOOLEAN NOT NULL DEFAULT FALSE,
  
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (referrer_id, referee_id)
);
```

---

### 2.6 Bảng `tier_upgrade_log`

Log lịch sử thăng/giảm hạng thẻ.

```sql
CREATE TABLE tier_upgrade_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),
  from_tier   VARCHAR(20) NOT NULL,
  to_tier     VARCHAR(20) NOT NULL,
  manh_sang_at_change INT NOT NULL,  -- Số Mảnh Sáng tại thời điểm đổi hạng
  reason      TEXT,                  -- 'auto_upgrade' | 'referral_milestone' | 'admin'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.7 Quan hệ với bảng hiện có

Bảng `bookings` cần bổ sung các cột:

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  group_size INT DEFAULT 1;             -- Số người trong nhóm (để tính group bonus)

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  is_birthday_month BOOLEAN DEFAULT FALSE;  -- Có đặt trong tháng sinh nhật không

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  applied_voucher_id UUID REFERENCES member_vouchers(id);  -- Voucher áp dụng

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
  manh_sang_earned INT DEFAULT 0;       -- Tổng Mảnh Sáng nhận từ booking này
```

Bảng `payments` cần bổ sung:

```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  is_early_deposit BOOLEAN DEFAULT FALSE;  -- Có phải cọc sớm không

ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  voucher_discount NUMERIC(10,2) DEFAULT 0;  -- Số tiền được giảm bởi voucher
```

---

## 3. BUSINESS LOGIC — TÍCH ĐIỂM MẢNH SÁNG

### 3.1 Bảng quy tắc tích điểm

| Hành động | Mảnh Sáng | Trigger | Điều kiện |
|-----------|-----------|---------|-----------|
| Chi tiêu mỗi 10.000 VNĐ | +1 | `payment.status = 'completed'` | Tính trên `payment.amount` sau khi trừ voucher |
| Đăng ký thành viên lần đầu | +30 | `member.created_at` | `is_first_register_done = false` → set TRUE |
| Đặt lịch lần đầu | +50 | `booking.created_at` | `is_first_booking_done = false` → set TRUE |
| Cọc/đặt lịch sớm | +20 | `payment.is_early_deposit = true` | 1 lần/booking |
| Quay lại lần 2 | +80 | `booking` thứ 2 hoàn thành | `second_booking_rewarded = false` → set TRUE |
| Giới thiệu bạn đặt lịch thành công | +100 | `referral.status = 'completed'` | Cộng cho referrer |
| Feedback + ảnh + tag | +50 | Admin xác nhận thủ công | Gọi API `/admin/approve-feedback` |
| TikTok/Reels hậu trường | +50 | Admin xác nhận thủ công | Gọi API `/admin/approve-social` |
| Đặt lịch tháng sinh nhật | +30 | `booking.is_birthday_month = true` | 1 lần/năm |
| Chụp nhóm 3+ người | +50/người | `booking.group_size >= 3` | VD: 4 người = +200 |

### 3.2 Hàm tính Mảnh Sáng từ chi tiêu

```typescript
function calcSpendManhSang(amountVND: number): number {
  // Làm tròn xuống, không tính phần dư
  return Math.floor(amountVND / 10000);
}
// VD: 155,000 VNĐ → 15 Mảnh Sáng
// VD: 9,999 VNĐ → 0 Mảnh Sáng
```

### 3.3 Logic nhóm chụp

```typescript
function calcGroupBonus(groupSize: number): number {
  if (groupSize < 3) return 0;
  return groupSize * 50;
}
// 3 người → +150 Mảnh Sáng
// 5 người → +250 Mảnh Sáng
```

### 3.4 Quy tắc quan trọng

- **`manh_sang_total`** chỉ tăng, không bao giờ giảm — dùng để xác định hạng thẻ
- **`manh_sang_balance`** tăng khi nhận thưởng, giảm khi đổi voucher — dùng để đổi quà
- Mọi thay đổi Mảnh Sáng phải ghi log vào `manh_sang_transactions`
- Kiểm tra thăng hạng sau **mỗi lần cộng** Mảnh Sáng

---

## 4. HẠNG THÀNH VIÊN (MUSÉ CARD)

### 4.1 Tiêu chí phân hạng

| Hạng | Slug | Ngưỡng `manh_sang_total` | Màu đặc trưng |
|------|------|--------------------------|---------------|
| Muse Pearl | `pearl` | 0 – 299 | Trắng ngọc trai `#F5F0EB` |
| Muse Rose | `rose` | 300 – 799 | Hồng đào `#E8A0A0` |
| Muse Gold | `gold` | 800 – 1499 | Vàng ánh `#D4A847` |
| Musé Privilege | `privilege` | 1500+ | Tím than/đen sang `#2D1B4E` |

### 4.2 Hàm xác định hạng

```typescript
function getTier(totalManhSang: number): MemberTier {
  if (totalManhSang >= 1500) return 'privilege';
  if (totalManhSang >= 800)  return 'gold';
  if (totalManhSang >= 300)  return 'rose';
  return 'pearl';
}
```

### 4.3 Logic thăng hạng

```typescript
async function checkAndUpgradeTier(memberId: string) {
  const member = await getMember(memberId);
  const newTier = getTier(member.manh_sang_total);
  
  if (newTier !== member.card_tier) {
    // Ghi log
    await insertTierUpgradeLog({
      member_id: memberId,
      from_tier: member.card_tier,
      to_tier: newTier,
      manh_sang_at_change: member.manh_sang_total,
      reason: 'auto_upgrade'
    });
    
    // Cập nhật
    await updateMember(memberId, { card_tier: newTier });
    
    // Thông báo cho user (push notification / email)
    await notifyTierUpgrade(memberId, newTier);
  }
}
```

> ⚠️ **Lưu ý**: Hạng thẻ chỉ tăng không giảm (dựa trên `manh_sang_total`). Nếu balance âm do đổi voucher, hạng vẫn giữ nguyên.

### 4.4 Đặc quyền theo hạng (hiển thị UI)

| Đặc quyền | Pearl | Rose | Gold | Privilege |
|-----------|-------|------|------|-----------|
| Giảm sinh nhật | 5% | 10% | 15% | 20% |
| Ưu tiên lịch chụp | ❌ | ❌ | ✅ | ✅ |
| Ảnh retouch thêm | ❌ | +1 ảnh | +2 ảnh | +3 ảnh |
| Early access concept mới | ❌ | ❌ | ✅ | ✅ |
| Voucher kỷ niệm 1 năm | ❌ | ✅ | ✅ | ✅ |
| Trải nghiệm cá nhân hóa | ❌ | ❌ | ❌ | ✅ |

---

## 5. HỆ THỐNG VOUCHER

### 5.1 Voucher quy đổi bằng Mảnh Sáng

| Voucher | Mảnh Sáng cần | Giá trị | Slug |
|---------|---------------|---------|------|
| Glow Voucher | 80 | Giảm 50.000 VNĐ | `glow` |
| Rose Voucher | 200 | Giảm 100.000 VNĐ | `rose` |
| Gold Voucher | 400 | Giảm 200.000 VNĐ | `gold` |
| Signature Voucher | 500–1.500 | Giảm sâu / nâng cấp theo gói | `signature` |

### 5.2 Logic đổi voucher

```typescript
async function redeemVoucher(memberId: string, voucherId: string) {
  const member = await getMember(memberId);
  const voucher = await getVoucher(voucherId);
  
  // Validation
  if (member.manh_sang_balance < voucher.manh_sang_cost)
    throw new Error('INSUFFICIENT_MANH_SANG');
  
  if (voucher.required_tier && TIER_ORDER[member.card_tier] < TIER_ORDER[voucher.required_tier])
    throw new Error('TIER_NOT_ELIGIBLE');
  
  // Tạo member_voucher với code ngẫu nhiên
  const code = generateVoucherCode(voucher.code_prefix);
  const expiresAt = addDays(new Date(), voucher.valid_days);
  
  await db.transaction(async (trx) => {
    // Tạo voucher cho member
    await trx.insert('member_vouchers', {
      member_id: memberId,
      voucher_id: voucherId,
      code,
      status: 'active',
      manh_sang_spent: voucher.manh_sang_cost,
      expires_at: expiresAt,
      issued_reason: 'Đổi bằng Mảnh Sáng'
    });
    
    // Trừ Mảnh Sáng
    await trx.update('members', {
      manh_sang_balance: member.manh_sang_balance - voucher.manh_sang_cost
    }).where({ id: memberId });
    
    // Ghi log
    await trx.insert('manh_sang_transactions', {
      member_id: memberId,
      amount: -voucher.manh_sang_cost,
      balance_after: member.manh_sang_balance - voucher.manh_sang_cost,
      type: 'voucher_redeem',
      description: `Đổi ${voucher.name}`,
      reference_type: 'voucher'
    });
  });
  
  return { code, expiresAt };
}
```

### 5.3 Voucher theo dịp đặc biệt

| Dịp | Điều kiện kích hoạt | Quyền lợi |
|-----|---------------------|-----------|
| Sinh nhật | `booking.is_birthday_month = true` | Giảm theo hạng (5–20%) |
| Mùa tốt nghiệp | Admin tạo campaign | Tặng retouch hoặc voucher nhóm |
| 8/3, 20/10, Valentine | Admin tạo campaign | Ưu đãi concept nàng thơ |
| Khai trương concept mới | Admin tạo campaign | Early access Gold & Privilege |
| Kỷ niệm 1 năm | `member.joined_at` đủ 1 năm | Voucher tri ân hoặc ảnh in |

**Logic birthday voucher:**

```typescript
async function issueBirthdayVoucher(memberId: string) {
  const member = await getMemberWithUser(memberId);
  const user = member.user;
  
  // Kiểm tra tháng sinh nhật
  const now = new Date();
  if (user.birth_month !== now.getMonth() + 1) return;
  
  // Kiểm tra đã tặng năm nay chưa
  const existing = await findMemberVoucher({
    member_id: memberId,
    issued_reason: 'birthday',
    issued_year: now.getFullYear()
  });
  if (existing) return;
  
  // Xác định % giảm theo hạng
  const discountMap = { pearl: 5, rose: 10, gold: 15, privilege: 20 };
  const discountPercent = discountMap[member.card_tier];
  
  // Cấp voucher
  await issueVoucher(memberId, {
    discount_type: 'percent',
    discount_value: discountPercent,
    issued_reason: 'birthday',
    expires_at: endOfMonth(now)  // Hết hiệu lực cuối tháng sinh nhật
  });
}
```

### 5.4 Áp dụng voucher khi thanh toán

```typescript
async function applyVoucher(bookingId: string, voucherCode: string) {
  const voucher = await getMemberVoucherByCode(voucherCode);
  
  // Validations
  if (!voucher || voucher.status !== 'active') 
    throw new Error('VOUCHER_INVALID_OR_USED');
  if (new Date() > voucher.expires_at) 
    throw new Error('VOUCHER_EXPIRED');
  
  const booking = await getBooking(bookingId);
  if (booking.member_id !== voucher.member_id) 
    throw new Error('VOUCHER_NOT_YOURS');
  
  // Tính giá trị giảm
  const discount = calcDiscount(booking.total_amount, voucher);
  
  // Cập nhật booking & đánh dấu voucher đã dùng
  await db.transaction(async (trx) => {
    await trx.update('bookings', {
      applied_voucher_id: voucher.id,
      discount_amount: discount,
      final_amount: booking.total_amount - discount
    });
    await trx.update('member_vouchers', {
      status: 'used',
      used_at: new Date(),
      used_on_booking_id: bookingId
    });
  });
  
  return { discount, finalAmount: booking.total_amount - discount };
}
```

---

## 6. REFERRAL SYSTEM

### 6.1 Luồng giới thiệu

```
Người A chia sẻ referral_code của mình
          ↓
Người B đăng ký với referral_code của A
          → Tạo referral record (status: pending)
          → Người B nhận voucher giảm 5-10% cho lần chụp đầu
          ↓
Người B hoàn tất booking đầu tiên
          → referral.status → 'completed'
          → Người A nhận +100 Mảnh Sáng
          → Cập nhật referral_count của A
          → Kiểm tra milestone
```

### 6.2 Logic milestone

```typescript
async function checkReferralMilestone(referrerId: string) {
  const member = await getMember(referrerId);
  const count = member.referral_count;
  
  // Mốc 3 người: nhận voucher nâng cấp concept hoặc ảnh retouch
  if (count === 3) {
    await issueSpecialVoucher(referrerId, 'concept_upgrade', 'Đạt mốc 3 lượt giới thiệu');
  }
  
  // Mốc 7 người: level up thẻ thành viên (bỏ qua 1 bậc nếu được)
  if (count === 7) {
    const currentTier = member.card_tier;
    const newTier = getNextTier(currentTier);  // Nhảy 1 hạng
    
    if (newTier && newTier !== currentTier) {
      await upgradeTier(referrerId, newTier, 'referral_milestone');
    }
  }
}

function getNextTier(current: string): string | null {
  const order = ['pearl', 'rose', 'gold', 'privilege'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}
```

### 6.3 Quyền lợi người được giới thiệu

```typescript
async function rewardReferee(refereeId: string) {
  // Tặng voucher giảm 5–10% cho booking đầu tiên
  await issueVoucher(refereeId, {
    voucher_type: 'referral',
    discount_type: 'percent',
    discount_value: 10,  // 10% cho lần đầu
    valid_days: 60,
    issued_reason: 'Người được giới thiệu - lần chụp đầu tiên'
  });
}
```

---

## 7. API ENDPOINTS

### Authentication
Tất cả endpoints yêu cầu `Authorization: Bearer <token>` trừ khi ghi chú khác.

---

### 7.1 Member

```
GET    /api/loyalty/me
       → Trả về member info: tier, balance, total, referral_code

GET    /api/loyalty/transactions?page=1&limit=20
       → Lịch sử giao dịch Mảnh Sáng

GET    /api/loyalty/tier-benefits
       → Đặc quyền theo hạng hiện tại
```

### 7.2 Vouchers

```
GET    /api/loyalty/vouchers/catalog
       → Danh sách voucher có thể đổi + Mảnh Sáng cần

POST   /api/loyalty/vouchers/redeem
       Body: { voucher_id: string }
       → Đổi Mảnh Sáng lấy voucher

GET    /api/loyalty/vouchers/my
       → Danh sách voucher của tôi (filter by status)

POST   /api/loyalty/vouchers/apply
       Body: { booking_id: string, code: string }
       → Áp dụng voucher vào booking
```

### 7.3 Referral

```
GET    /api/loyalty/referral/info
       → Referral code, stats, danh sách người đã giới thiệu

POST   /api/loyalty/referral/apply
       Body: { referral_code: string }
       → Áp dụng code giới thiệu (chỉ khi đăng ký hoặc trước booking đầu tiên)
```

### 7.4 Admin (yêu cầu role admin)

```
POST   /api/admin/loyalty/approve-feedback
       Body: { member_id, booking_id, type: 'feedback_photo' | 'social_share' }

POST   /api/admin/loyalty/adjust
       Body: { member_id, amount, reason, description }

POST   /api/admin/loyalty/issue-voucher
       Body: { member_id, voucher_id, reason, expires_at }

GET    /api/admin/loyalty/members
       → Dashboard tổng hợp: phân bổ hạng, tổng Mảnh Sáng, voucher active
```

---

## 8. UI/UX COMPONENTS

### 8.1 Trang "Thẻ của tôi" (`/my-card`)

**Bố cục:**
1. **Card Visual** — Hiển thị Musé Card theo hạng (thiết kế riêng cho mỗi tier: màu sắc, texture)
2. **Mảnh Sáng Counter** — Số dư hiện tại + animated progress bar đến hạng tiếp theo
3. **Đặc quyền hiện tại** — Icon list các quyền lợi theo hạng
4. **Referral Block** — Code + nút copy + QR code

### 8.2 Trang "Đổi quà" (`/redeem`)

**Bố cục:**
1. **Balance display** — Mảnh Sáng hiện có (nổi bật)
2. **Voucher Grid** — Catalog 4 loại, mỗi card có: tên, giá trị, chi phí, nút đổi
3. **Nút "Đổi ngay"** — Disabled nếu balance không đủ; tooltip hiển thị thiếu bao nhiêu
4. **My Vouchers Tab** — Voucher đang có: active / used / expired

### 8.3 Trang "Lịch sử" (`/loyalty/history`)

Timeline giao dịch Mảnh Sáng với icon phân loại từng loại event.

### 8.4 Thông báo thăng hạng

Modal/toast hiển thị khi user vừa thăng hạng:
- Animation confetti
- Hiển thị hạng mới với thiết kế card
- Tóm tắt đặc quyền mới

---

## 9. EDGE CASES & VALIDATION RULES

| Case | Xử lý |
|------|-------|
| Voucher hết hạn khi apply | Trả lỗi `VOUCHER_EXPIRED`, không trừ Mảnh Sáng |
| Apply voucher của người khác | Trả lỗi `VOUCHER_NOT_YOURS` |
| Đổi voucher nhưng balance không đủ | Trả lỗi `INSUFFICIENT_MANH_SANG` |
| Booking bị hủy sau khi đã cộng Mảnh Sáng | Tạo transaction âm hoàn trả; ghi rõ lý do |
| Referral tự giới thiệu chính mình | Check `referrer_id !== referee_id`, throw lỗi |
| Cùng lúc 2 request đổi voucher | Dùng DB transaction + row-level lock |
| Admin tặng Mảnh Sáng thủ công | Dùng type `admin_adjust`, bắt buộc có `description` |
| User có 2 booking trong tháng sinh nhật | Chỉ tặng birthday bonus 1 lần/năm (kiểm tra DB) |
| Group booking: 1 người hủy | Không trừ lại Mảnh Sáng đã cộng trừ khi toàn bộ booking hủy |

---

## CHECKLIST TRIỂN KHAI

- [ ] Chạy migrations tạo 6 bảng mới + alter bảng hiện có
- [ ] Seed catalog vouchers (4 loại cơ bản)
- [ ] Implement `addManhSang()` utility với transaction-safe logic
- [ ] Implement `checkAndUpgradeTier()` chạy sau mỗi lần cộng điểm
- [ ] Implement `redeemVoucher()` với DB transaction
- [ ] Implement `applyVoucher()` trong luồng checkout/booking
- [ ] Setup cron job kiểm tra anniversary (1 năm) và birthday hàng ngày
- [ ] Setup cron job expire voucher hết hạn
- [ ] Build API endpoints (7 nhóm ở trên)
- [ ] Build UI: My Card, Redeem, History, Referral
- [ ] Admin dashboard: approve feedback/social, adjust manual
- [ ] Test edge cases (bảng trên)
- [ ] Notification triggers: thăng hạng, nhận voucher, gần hết hạn voucher

---

*Tài liệu được tạo cho dự án Dear Musé Studio — Loyalty System v1.0*
