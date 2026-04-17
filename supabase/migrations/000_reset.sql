-- ============================================================
-- HuskLink — Full Reset
-- Run this in Supabase SQL Editor to wipe everything and
-- start from a clean slate. Then re-run 001_schema.sql.
-- ============================================================

-- Drop tables (order matters — children before parents)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bids        CASCADE;
DROP TABLE IF EXISTS listings    CASCADE;
DROP TABLE IF EXISTS profiles    CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created  ON auth.users;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
DROP TRIGGER IF EXISTS trg_bids_updated_at     ON bids;
DROP TRIGGER IF EXISTS trg_bid_stats           ON bids;

DROP FUNCTION IF EXISTS handle_new_user()       CASCADE;
DROP FUNCTION IF EXISTS set_updated_at()        CASCADE;
DROP FUNCTION IF EXISTS sync_listing_bid_stats() CASCADE;

-- Drop enums
DROP TYPE IF EXISTS user_role      CASCADE;
DROP TYPE IF EXISTS logistics_type CASCADE;
DROP TYPE IF EXISTS listing_status CASCADE;
DROP TYPE IF EXISTS bid_status     CASCADE;

-- Remove realtime publications (ignore error if not set)
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS bids;
-- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS listings;

-- Delete all auth users (clears Supabase Auth too)
DELETE FROM auth.users;

-- Done. Now run 001_schema.sql to recreate everything.
