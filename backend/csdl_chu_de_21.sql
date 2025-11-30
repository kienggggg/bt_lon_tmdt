-- Enable UUID generation (PostgreSQL 13+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clean slate so we can re-run the script without dropping the database manually
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'user_interests',
    'booking_items',
    'invoices',
    'bookings',
    'ticket_types',
    'event_categories',
    'events',
    'categories',
    'user_profiles',
    'users',
    'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', tbl);
  END LOOP;
END $$;

-- =========================
-- Nhóm 1: Identity (Người dùng)
-- =========================

-- Users: bảng lõi
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','user','organizer')),
  interests TEXT[],
  provider TEXT,
  provider_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles: tách riêng để giảm tải khi query login
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male','female','other')),
  birth_year INT CHECK (birth_year BETWEEN 1900 AND EXTRACT(YEAR FROM NOW())::INT),
  -- Thông tin VAT
  tax_code TEXT,
  company_name TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Nhóm 2: Event Core (Sản phẩm)
-- =========================

-- Categories / tags (phục vụ Recommendation và filter)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events: thông tin chung
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,                          -- Dùng cho SEO
  title TEXT NOT NULL,
  description TEXT,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  location TEXT,                                      -- city/address khi offline
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  -- JSONB cho speakers & agenda để render nhanh
  speakers JSONB,                                     -- [{name, bio, links...}, ...]
  agenda JSONB,                                       -- [{start, end, title, speaker_id?}, ...]
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Index cho truy vấn nhanh theo online/offline và location
CREATE INDEX idx_events_is_online ON events(is_online);
CREATE INDEX idx_events_location ON events USING btree (location);
CREATE INDEX idx_events_speakers_gin ON events USING gin (speakers);
CREATE INDEX idx_events_agenda_gin   ON events USING gin (agenda);

-- Liên kết sự kiện - categories (nhiều-nhiều)
CREATE TABLE event_categories (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

-- Ticket types: nhiều loại vé cho một sự kiện
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                                 -- Ví dụ: Early Bird, VIP
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
  remaining_quantity INT NOT NULL CHECK (remaining_quantity >= 0),
  start_sale_date TIMESTAMPTZ,
  end_sale_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (start_sale_date IS NULL AND end_sale_date IS NULL)
    OR (start_sale_date IS NOT NULL AND end_sale_date IS NOT NULL AND end_sale_date > start_sale_date)
  )
);

CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_sale_window ON ticket_types(start_sale_date, end_sale_date);

-- =========================
-- Nhóm 3: Transaction (Tiền nong)
-- =========================

-- ENUM-like bằng CHECK hoặc tạo TYPE; dùng CHECK cho linh hoạt CICD
-- bookings: đơn hàng tổng
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING','PAID','CANCELLED')),
  payment_gateway TEXT CHECK (payment_gateway IN ('MOMO','VNPAY','ZALOPAY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- booking_items: chi tiết đơn hàng
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),    -- lưu giá tại thời điểm mua
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_booking_items_ticket_type ON booking_items(ticket_type_id);

-- invoices: quản lý xuất hóa đơn
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE, -- mỗi booking 1 hóa đơn
  invoice_code TEXT,                            -- Mã cơ quan thuế trả về
  pdf_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING','ISSUED','FAILED')),
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Nhóm 4: Personalization (Cá nhân hóa)
-- =========================

-- user_interests: lưu sở thích người dùng theo category
CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id)
);

-- audit_logs: lịch sử ai làm gì
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                 -- ví dụ: 'UPDATE_TICKET_PRICE'
  entity_type TEXT NOT NULL,            -- ví dụ: 'event','ticket_type','booking'
  entity_id UUID,                       -- id của thực thể
  metadata JSONB,                       -- dữ liệu bổ sung (diff, trước/sau)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_metadata_gin ON audit_logs USING gin (metadata);

-- =========================
-- Ràng buộc & Trigger gợi ý (tuỳ chọn cho concurrency vé)
-- =========================

-- Đảm bảo remaining_quantity không vượt initial_quantity
ALTER TABLE ticket_types
  ADD CONSTRAINT ticket_qty_bounds CHECK (remaining_quantity <= initial_quantity);

-- Gợi ý: khi tạo booking_items, nên có logic transactional ở ứng dụng:
-- 1) LOCK hàng ticket_types FOR UPDATE
-- 2) Kiểm tra remaining_quantity >= quantity
-- 3) Trừ remaining_quantity
-- 4) Tạo booking_items
-- Có thể dùng trigger, nhưng nên xử lý ở service để kiểm soát lỗi tốt hơn.

-- =========================
-- Cập nhật timestamp tự động (optional)
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_ticket_types_updated_at
BEFORE UPDATE ON ticket_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================
-- Nhóm 1: Identity
-- =========================
INSERT INTO users (email, password_hash, role)
VALUES 
('kien.pham@example.com', 'password123', 'user'),
('lam.bui@example.com', 'password456', 'organizer'),
('admin@example.com', 'admin123', 'admin');

INSERT INTO user_profiles (user_id, full_name, phone, gender, birth_year, tax_code, company_name, address)
VALUES
((SELECT id FROM users WHERE email='kien.pham@example.com'), 'Phạm Xuân Kiên', '0901234567', 'male', 2002, NULL, NULL, NULL),
((SELECT id FROM users WHERE email='lam.bui@example.com'), 'Bùi Xuân Lâm', '0912345678', 'male', 1995, '123456789', 'Công ty ABC', 'Hà Nội'),
((SELECT id FROM users WHERE email='admin@example.com'), 'Admin System', '0999999999', 'other', 1985, NULL, NULL, NULL);

-- =========================
-- Nhóm 2: Event Core
-- =========================
INSERT INTO categories (slug, name)
VALUES 
('ai', 'Trí tuệ nhân tạo'),
('marketing', 'Marketing'),
('music', 'Âm nhạc');

INSERT INTO events (slug, title, description, is_online, location, start_time, end_time, speakers, agenda, created_by)
VALUES
('workshop-ai-2025', 'Workshop AI cho Sinh viên', 'Giới thiệu AI cơ bản', TRUE, NULL,
 '2025-12-01 09:00:00', '2025-12-01 12:00:00',
 '[{"name":"TS. Nguyễn Văn A","bio":"Chuyên gia AI"}]'::jsonb,
 '[{"start":"09:00","end":"10:00","title":"Giới thiệu AI"}]'::jsonb,
 (SELECT id FROM users WHERE email='lam.bui@example.com')),

('talkshow-marketing-2025', 'Talkshow Marketing hiện đại', 'Xu hướng Marketing 2025', FALSE, 'TP.HCM',
 '2025-12-05 14:00:00', '2025-12-05 17:00:00',
 '[{"name":"Chị Trần Thị B","bio":"CMO tại XYZ"}]'::jsonb,
 '[{"start":"14:00","end":"15:00","title":"Chiến lược Marketing"}]'::jsonb,
 (SELECT id FROM users WHERE email='lam.bui@example.com'));

-- Gắn categories cho sự kiện
INSERT INTO event_categories (event_id, category_id)
VALUES
((SELECT id FROM events WHERE slug='workshop-ai-2025'), (SELECT id FROM categories WHERE slug='ai')),
((SELECT id FROM events WHERE slug='talkshow-marketing-2025'), (SELECT id FROM categories WHERE slug='marketing'));

-- Ticket types
INSERT INTO ticket_types (event_id, name, price, initial_quantity, remaining_quantity, start_sale_date, end_sale_date)
VALUES
((SELECT id FROM events WHERE slug='workshop-ai-2025'), 'Vé Early Bird', 50000, 100, 100, '2025-11-20', '2025-11-30'),
((SELECT id FROM events WHERE slug='workshop-ai-2025'), 'Vé Standard', 80000, 200, 200, '2025-11-20', '2025-12-01'),
((SELECT id FROM events WHERE slug='talkshow-marketing-2025'), 'Vé VIP', 200000, 50, 50, '2025-11-25', '2025-12-05');

-- =========================
-- Nhóm 3: Transaction
-- =========================
INSERT INTO bookings (user_id, total_amount, status, payment_gateway)
VALUES
((SELECT id FROM users WHERE email='kien.pham@example.com'), 130000, 'PAID', 'MOMO');

INSERT INTO booking_items (booking_id, ticket_type_id, quantity, price)
VALUES
((SELECT id FROM bookings WHERE user_id=(SELECT id FROM users WHERE email='kien.pham@example.com')),
 (SELECT id FROM ticket_types WHERE name='Vé Early Bird' AND event_id=(SELECT id FROM events WHERE slug='workshop-ai-2025')), 1, 50000),
((SELECT id FROM bookings WHERE user_id=(SELECT id FROM users WHERE email='kien.pham@example.com')),
 (SELECT id FROM ticket_types WHERE name='Vé Standard' AND event_id=(SELECT id FROM events WHERE slug='workshop-ai-2025')), 1, 80000);

INSERT INTO invoices (booking_id, invoice_code, pdf_url, status, issued_at)
VALUES
((SELECT id FROM bookings WHERE user_id=(SELECT id FROM users WHERE email='kien.pham@example.com')), 'INV-2025-001', 'https://invoice.example.com/inv-2025-001.pdf', 'ISSUED', NOW());

-- =========================
-- Nhóm 4: Personalization
-- =========================
INSERT INTO user_interests (user_id, category_id)
VALUES
((SELECT id FROM users WHERE email='kien.pham@example.com'), (SELECT id FROM categories WHERE slug='ai')),
((SELECT id FROM users WHERE email='kien.pham@example.com'), (SELECT id FROM categories WHERE slug='music'));

-- =========================
-- Migration: Cập nhật database đã tồn tại (chạy nếu database cũ thiếu các cột mới)
-- =========================

-- 1. Thêm cột username (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username TEXT;
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
END $$;

-- 2. Thêm cột interests (nếu chưa có)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'interests'
    ) THEN
        ALTER TABLE users ADD COLUMN interests TEXT[];
    END IF;
END $$;

-- 3. Cập nhật email thành nullable (nếu đang là NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    END IF;
END $$;

-- 4. Cập nhật password_hash thành nullable (nếu đang là NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    END IF;
END $$;

-- 5. Thêm cột provider và provider_id nếu chưa có
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'provider'
    ) THEN
        ALTER TABLE users ADD COLUMN provider TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'provider_id'
    ) THEN
        ALTER TABLE users ADD COLUMN provider_id TEXT;
    END IF;
END $$;

-- 6. Đảm bảo email là NOT NULL (nếu đang là nullable)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email' 
        AND is_nullable = 'YES'
    ) THEN
        -- Tạo email mặc định cho các user không có email
        UPDATE users 
        SET email = 'user_' || SUBSTRING(id::TEXT, 1, 8) || '@example.com'
        WHERE email IS NULL;
        
        ALTER TABLE users ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);