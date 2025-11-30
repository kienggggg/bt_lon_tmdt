-- ============================================
-- DATABASE: EventPass System
-- Mô tả: Hệ thống quản lý sự kiện và đặt vé
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male','female','other')),
  birth_year INT CHECK (birth_year BETWEEN 1900 AND EXTRACT(YEAR FROM NOW())::INT),
  tax_code TEXT,
  company_name TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Nhóm 2: Event Core (Sản phẩm)
-- =========================

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  speakers JSONB,
  agenda JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_events_is_online ON events(is_online);
CREATE INDEX idx_events_location ON events USING btree (location);

-- Event Categories (many-to-many)
CREATE TABLE event_categories (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

-- Ticket types
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
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

-- =========================
-- Nhóm 3: Transaction
-- =========================

-- Bookings
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

-- Booking items
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  invoice_code TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING','ISSUED','FAILED')),
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Nhóm 4: Personalization
-- =========================

-- User interests
CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id)
);

-- =========================
-- Triggers: Auto update timestamp
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
-- Sample Data
-- =========================

-- Users
INSERT INTO users (email, password_hash, role) VALUES
('admin@example.com', 'admin123', 'admin'),
('kien.pham@example.com', 'password123', 'user'),
('lam.bui@example.com', 'password456', 'organizer');

-- User Profiles
INSERT INTO user_profiles (user_id, full_name, phone, gender, birth_year) VALUES
((SELECT id FROM users WHERE email='admin@example.com'), 'Admin System', '0999999999', 'other', 1985),
((SELECT id FROM users WHERE email='kien.pham@example.com'), 'Phạm Xuân Kiên', '0901234567', 'male', 2002),
((SELECT id FROM users WHERE email='lam.bui@example.com'), 'Bùi Xuân Lâm', '0912345678', 'male', 1995);

-- Categories
INSERT INTO categories (slug, name) VALUES
('ai', 'Trí tuệ nhân tạo'),
('marketing', 'Marketing'),
('music', 'Âm nhạc'),
('tech', 'Công nghệ'),
('business', 'Kinh doanh');

-- Events
INSERT INTO events (slug, title, description, is_online, location, start_time, end_time, speakers, agenda, created_by) VALUES
('workshop-ai-2025', 'Workshop AI cho Sinh viên', 'Giới thiệu AI cơ bản và ứng dụng thực tế', TRUE, NULL,
 '2025-12-01 09:00:00', '2025-12-01 12:00:00',
 '[{"name":"TS. Nguyễn Văn A","bio":"Chuyên gia AI"}]'::jsonb,
 '[{"start":"09:00","end":"10:00","title":"Giới thiệu AI"}]'::jsonb,
 (SELECT id FROM users WHERE username='lambui')),
('talkshow-marketing-2025', 'Talkshow Marketing hiện đại', 'Xu hướng Marketing 2025', FALSE, 'TP.HCM',
 '2025-12-05 14:00:00', '2025-12-05 17:00:00',
 '[{"name":"Chị Trần Thị B","bio":"CMO tại XYZ"}]'::jsonb,
 '[{"start":"14:00","end":"15:00","title":"Chiến lược Marketing"}]'::jsonb,
 (SELECT id FROM users WHERE username='lambui'));

-- Event Categories
INSERT INTO event_categories (event_id, category_id) VALUES
((SELECT id FROM events WHERE slug='workshop-ai-2025'), (SELECT id FROM categories WHERE slug='ai')),
((SELECT id FROM events WHERE slug='talkshow-marketing-2025'), (SELECT id FROM categories WHERE slug='marketing'));

-- Ticket Types
INSERT INTO ticket_types (event_id, name, price, initial_quantity, remaining_quantity, start_sale_date, end_sale_date) VALUES
((SELECT id FROM events WHERE slug='workshop-ai-2025'), 'Vé Early Bird', 50000, 100, 100, '2025-11-20', '2025-11-30'),
((SELECT id FROM events WHERE slug='workshop-ai-2025'), 'Vé Standard', 80000, 200, 200, '2025-11-20', '2025-12-01'),
((SELECT id FROM events WHERE slug='talkshow-marketing-2025'), 'Vé VIP', 200000, 50, 50, '2025-11-25', '2025-12-05');

