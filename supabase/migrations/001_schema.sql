-- ============================================================
-- HuskLink Database Schema
-- Run this in your Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('farmer', 'buyer');
CREATE TYPE logistics_type AS ENUM ('farm_pickup', 'road_hauled');
CREATE TYPE listing_status AS ENUM ('pending_ai', 'active', 'sold', 'expired');
CREATE TYPE bid_status     AS ENUM ('pending', 'accepted', 'rejected');

-- ── Profiles ──────────────────────────────────────────────
-- Mirrors auth.users; created automatically by trigger below.
CREATE TABLE profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  full_name    TEXT        NOT NULL,
  role         user_role   NOT NULL DEFAULT 'farmer',
  phone        TEXT,
  farm_name    TEXT,
  company_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Listings ──────────────────────────────────────────────
CREATE TABLE listings (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id           UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT           NOT NULL,
  description           TEXT,
  lat                   DOUBLE PRECISION NOT NULL DEFAULT 0,
  lng                   DOUBLE PRECISION NOT NULL DEFAULT 0,
  address               TEXT           NOT NULL,
  image_url             TEXT           NOT NULL,
  ai_condition_score    DECIMAL(3,2),
  ai_moisture_level     DECIMAL(5,2),
  ai_estimated_weight_kg DECIMAL(10,2),
  ai_suggested_price    DECIMAL(10,2),
  ai_processed_at       TIMESTAMPTZ,
  asking_price          DECIMAL(10,2)  NOT NULL,
  logistics_type        logistics_type NOT NULL DEFAULT 'farm_pickup',
  status                listing_status DEFAULT 'pending_ai',
  bid_count             INTEGER        DEFAULT 0,
  highest_bid           DECIMAL(10,2),
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ    DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX listings_status_idx        ON listings(status);
CREATE INDEX listings_producer_idx      ON listings(producer_id);
CREATE INDEX listings_logistics_idx     ON listings(logistics_type);

-- ── Bids ──────────────────────────────────────────────────
CREATE TABLE bids (
  id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID       NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id    UUID       NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount      DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status      bid_status DEFAULT 'pending',
  message     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX bids_listing_idx ON bids(listing_id);
CREATE INDEX bids_buyer_idx   ON bids(buyer_id);

-- ── Transactions ──────────────────────────────────────────
CREATE TABLE transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     UUID        REFERENCES listings(id),
  buyer_id       UUID        REFERENCES profiles(id),
  producer_id    UUID        REFERENCES profiles(id),
  winning_bid_id UUID        REFERENCES bids(id),
  final_price    DECIMAL(10,2) NOT NULL,
  completed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── updated_at trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_listings_updated_at  BEFORE UPDATE ON listings  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_bids_updated_at      BEFORE UPDATE ON bids      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Auto-create profile on signup ─────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'farmer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Sync bid_count and highest_bid on listings ────────────
CREATE OR REPLACE FUNCTION sync_listing_bid_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  target_id UUID;
BEGIN
  target_id := COALESCE(NEW.listing_id, OLD.listing_id);
  UPDATE listings SET
    bid_count   = (SELECT COUNT(*) FROM bids WHERE listing_id = target_id),
    highest_bid = (SELECT MAX(amount) FROM bids WHERE listing_id = target_id AND status != 'rejected')
  WHERE id = target_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bid_stats
  AFTER INSERT OR UPDATE OR DELETE ON bids
  FOR EACH ROW EXECUTE FUNCTION sync_listing_bid_stats();

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- profiles: users read/update only their own row
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- listings: any authenticated user reads active listings;
--           producers manage their own
CREATE POLICY "listings_select_active"  ON listings FOR SELECT USING (status = 'active' OR producer_id = auth.uid());
CREATE POLICY "listings_insert_own"     ON listings FOR INSERT WITH CHECK (producer_id = auth.uid());
CREATE POLICY "listings_update_own"     ON listings FOR UPDATE USING (producer_id = auth.uid());
CREATE POLICY "listings_delete_own"     ON listings FOR DELETE USING (producer_id = auth.uid());

-- bids: buyers manage their own bids; producers read bids on their listings
CREATE POLICY "bids_select_own"         ON bids FOR SELECT USING (
  buyer_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM listings l WHERE l.id = bids.listing_id AND l.producer_id = auth.uid()
  )
);
CREATE POLICY "bids_insert_buyer"       ON bids FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "bids_update_producer"    ON bids FOR UPDATE USING (
  EXISTS (SELECT 1 FROM listings l WHERE l.id = bids.listing_id AND l.producer_id = auth.uid())
);

-- transactions: read by involved parties
CREATE POLICY "transactions_select"     ON transactions FOR SELECT USING (
  buyer_id = auth.uid() OR producer_id = auth.uid()
);

-- ── Supabase Storage bucket ───────────────────────────────
-- Run this once in Supabase Dashboard → Storage, or via:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('husk-images', 'husk-images', true);

-- Storage policies (run after creating the bucket):
-- CREATE POLICY "husk_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'husk-images');
-- CREATE POLICY "husk_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'husk-images' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "husk_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'husk-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Enable Realtime on bids and listings ──────────────────
-- Run in Supabase Dashboard → Database → Replication, or:
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
