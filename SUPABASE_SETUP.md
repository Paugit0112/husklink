# HuskLink Supabase Integration Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Project Name**: `husklink-mvp`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your location (e.g., `Asia Pacific - Singapore`)
4. Click "Create new project" and wait for initialization (2-3 minutes)

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key**: (under "Project API keys")

## Step 3: Create Environment Variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Replace the values with your actual credentials!**

## Step 4: Set Up Database Schema

1. In Supabase, go to **SQL Editor** → **New Query**
2. Copy and paste the entire SQL schema below
3. Click "Run"

### Complete Database Schema

```sql
-- Enable PostGIS extension for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom types
CREATE TYPE user_role AS ENUM ('producer', 'buyer', 'admin');
CREATE TYPE logistics_type AS ENUM ('farm_pickup', 'road_hauled');
CREATE TYPE listing_status AS ENUM ('pending_ai', 'active', 'sold', 'expired');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  farm_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table with geolocation
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location GEOMETRY(POINT, 4326),
  address TEXT,
  image_url TEXT NOT NULL,
  ai_condition_score DECIMAL(3,2),
  ai_moisture_level DECIMAL(5,2),
  ai_estimated_weight_kg DECIMAL(10,2),
  ai_suggested_price DECIMAL(10,2),
  ai_processed_at TIMESTAMPTZ,
  asking_price DECIMAL(10,2) NOT NULL,
  logistics_type logistics_type NOT NULL DEFAULT 'farm_pickup',
  status listing_status DEFAULT 'pending_ai',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT positive_price CHECK (asking_price > 0)
);

-- Create spatial index for better geolocation queries
CREATE INDEX IF NOT EXISTS listings_location_idx ON listings USING GIST(location);
CREATE INDEX IF NOT EXISTS listings_producer_id_idx ON listings(producer_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON listings(status);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status bid_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_bid CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS bids_listing_id_idx ON bids(listing_id);
CREATE INDEX IF NOT EXISTS bids_buyer_id_idx ON bids(buyer_id);
CREATE INDEX IF NOT EXISTS bids_status_idx ON bids(status);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  producer_id UUID NOT NULL REFERENCES users(id),
  winning_bid_id UUID REFERENCES bids(id),
  final_price DECIMAL(10,2) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (final_price > 0)
);

CREATE INDEX IF NOT EXISTS transactions_listing_id_idx ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_id_idx ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS transactions_producer_id_idx ON transactions(producer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Producers can view and manage their own listings
CREATE POLICY "Producers can view their own listings" ON listings
  FOR ALL USING (auth.uid() = producer_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Buyers can view active listings
CREATE POLICY "Buyers can view active listings" ON listings
  FOR SELECT USING (status = 'active' OR auth.uid() = producer_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Buyers can place bids
CREATE POLICY "Buyers can manage their bids" ON bids
  FOR ALL USING (auth.uid() = buyer_id);

-- Producers can view bids on their listings
CREATE POLICY "Producers can view bids on their listings" ON bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = bids.listing_id 
      AND listings.producer_id = auth.uid()
    )
  );

-- View transactions
CREATE POLICY "Users can view their transactions" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = producer_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');
```

## Step 5: Create Storage Buckets

1. Go to **Storage** in Supabase
2. Click **Create a new bucket**
3. Create buckets:
   - **Name**: `listings`
   - **Visibility**: Public
4. Repeat for:
   - **Name**: `avatars`
   - **Visibility**: Public

## Step 6: Update Your Project Configuration

The app is now configured to use Supabase! The following files have been updated:
- `.env.local` - Your environment variables
- `src/utils/supabase/client.ts` - Supabase client configuration
- `src/hooks/useSupabase.ts` - Database integration hooks

## Step 7: Test the Integration

1. Update your `.env.local` file with real Supabase credentials
2. Run `npm run dev`
3. The app should now connect to your real database!

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
Run: `npm install @supabase/supabase-js`

### "Missing environment variables"
Make sure `.env.local` exists in the project root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### "Geolocation queries not working"
Make sure PostGIS extension is enabled in your Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Next Steps

1. **User Authentication**: Set up Supabase Auth in your app
2. **Image Uploads**: Configure Supabase Storage for listing images
3. **Real-time Updates**: Enable Realtime for live bid updates
4. **Analytics**: Track user activity and marketplace metrics

Need help? Check the [Supabase Documentation](https://supabase.com/docs)
