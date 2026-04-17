# HuskLink MVP - Implementation Guide

## Overview

HuskLink is an AI-powered, geolocated agricultural waste marketplace with two main actors:
- **Farmers**: Sell agricultural waste (rice/coconut husks)
- **Buyers**: Purchase biomass for energy production

This frontend MVP demonstrates the complete user experience with mock data.

## Current Status: Frontend MVP Complete ✅

The frontend application is fully implemented with:
- ✅ Eco-friendly design system (greens, browns, earth tones)
- ✅ Role-based authentication UI (Producer, Buyer, Admin)
- ✅ Producer dashboard with image upload and AI processing simulation
- ✅ Buyer dashboard with live Leaflet map and listing cards
- ✅ Real-time bidding interface
- ✅ Analytics dashboard with Recharts
- ✅ Responsive design with Tailwind CSS
- ✅ Motion animations and micro-interactions

## Next Steps: Connect Supabase

To make this application fully functional, you need to:

### 1. Connect Supabase Project

1. Go to the **Make settings page**
2. Click "Connect Supabase"
3. Enter your Supabase project credentials
4. Make will auto-generate the connection files

### 2. Set Up Database

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create enums
CREATE TYPE user_role AS ENUM ('farmer', 'buyer');
CREATE TYPE logistics_type AS ENUM ('farm_pickup', 'road_hauled');
CREATE TYPE listing_status AS ENUM ('pending_ai', 'active', 'sold', 'expired');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create tables (see full schema in main README)
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  farm_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table with PostGIS
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location GEOMETRY(POINT, 4326) NOT NULL,
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
  expires_at TIMESTAMPTZ
);

-- Create spatial index
CREATE INDEX listings_location_idx ON listings USING GIST(location);

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status bid_status DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_bid CHECK (amount > 0)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES users(id),
  producer_id UUID REFERENCES users(id),
  winning_bid_id UUID REFERENCES bids(id),
  final_price DECIMAL(10,2) NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY producer_listings ON listings
  FOR ALL USING (auth.uid() = producer_id);

CREATE POLICY buyer_view_listings ON listings
  FOR SELECT USING (status = 'active');

CREATE POLICY buyer_bids ON bids
  FOR ALL USING (auth.uid() = buyer_id);

CREATE POLICY producer_view_bids ON bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = bids.listing_id 
      AND listings.producer_id = auth.uid()
    )
  );
```

### 3. Configure AI Service API Keys

In the Supabase settings page, add your AI service credentials:
- `AI_SERVICE_URL`: Your Python/FastAPI microservice base URL
- `AI_SERVICE_API_KEY`: Authentication token

### 4. Deploy Supabase Edge Functions

Deploy the following Edge Functions to your Supabase project:

- `process-ai-image`: Sends images to AI service for analysis
- `create-listing`: Creates listings with geolocation
- `place-bid`: Handles bid placement with real-time broadcasts
- `accept-bid`: Processes bid acceptance and creates transactions
- `get-nearby-listings`: PostGIS proximity search

### 5. Update Frontend to Use Supabase

Replace mock data in `src/app/App.tsx` with actual Supabase calls:

```typescript
// Example: Replace mock login
import { supabase } from './utils/supabase/client';

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    toast.error(error.message);
    return;
  }
  
  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  setUser(profile);
};
```

### 6. Enable Real-Time Subscriptions

Set up Supabase Realtime for live bidding:

```typescript
// Subscribe to bid updates
const channel = supabase
  .channel(`bids:listing_id=eq.${listingId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bids',
    filter: `listing_id=eq.${listingId}`
  }, (payload) => {
    // Update bids in real-time
    handleNewBid(payload.new);
  })
  .subscribe();
```

## Design System

### Color Palette
- **Primary Green**: `#4a7c2e` (Forest Medium)
- **Secondary Green**: `#7cb342` (Leaf Green)
- **Accent Brown**: `#8b4513` (Biomass Brown)
- **Background**: `#faf8f3` (Off-white)
- **Text**: `#3e2723` (Soil Dark)

### Typography
- **Display**: Sora (geometric, modern)
- **Body**: Manrope (warm, readable)
- **Monospace**: JetBrains Mono (data display)

## Features Implemented

### Farmer Dashboard
- Image uploader with GPS extraction
- AI processing status display
- Listing form with logistics options
- Price suggestion integration

### Buyer Dashboard
- Interactive Leaflet map with custom markers
- Logistics type filtering
- Listing cards with AI metrics
- Real-time bidding panel
- Quick bid options

## Technology Stack

- **Frontend**: React 18.3 + TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (Framer Motion)
- **Maps**: React Leaflet + Leaflet
- **Charts**: Recharts
- **UI Components**: Radix UI
- **Notifications**: Sonner
- **Backend** (to implement): Supabase + PostGIS
- **AI Service** (to implement): Python/FastAPI

## File Structure

```
src/
├── app/
│   ├── App.tsx                          # Main application
│   └── components/
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   └── RoleSelector.tsx
│       ├── producer/          # Farmer components (folder name kept for compatibility)
│       │   ├── ImageUploader.tsx
│       │   ├── AIProcessingStatus.tsx
│       │   ├── ListingForm.tsx
│       │   └── MyListings.tsx
│       ├── buyer/
│       │   ├── LiveMap.tsx
│       │   ├── ListingCard.tsx
│       │   ├── BiddingPanel.tsx
│       │   ├── LogisticsToggle.tsx
│       │   └── MyBids.tsx
│       ├── landing/
│       │   └── PlatformStats.tsx
│       └── shared/
│           └── Navigation.tsx
└── styles/
    ├── fonts.css                        # Font imports
    ├── theme.css                        # Color palette & theme
    └── custom.css                       # Additional styles
```

## Two Main Actors

The platform has two user types:
- **Farmer**: Upload husk photos, create listings, manage sales
- **Buyer**: Browse map, view listings, place bids, purchase biomass

## Production Checklist

Before deploying to production:

- [ ] Connect Supabase project
- [ ] Set up database schema with PostGIS
- [ ] Deploy Edge Functions
- [ ] Configure AI service integration
- [ ] Replace mock data with Supabase queries
- [ ] Set up real-time subscriptions
- [ ] Configure authentication (Supabase Auth)
- [ ] Set up image storage (Supabase Storage)
- [ ] Add error boundaries and loading states
- [ ] Implement proper error handling
- [ ] Add form validation
- [ ] Test geolocation across devices
- [ ] Optimize images and assets
- [ ] Set up environment variables
- [ ] Configure CORS and security policies
- [ ] Add analytics tracking
- [ ] Set up monitoring and logging

## Support

For issues or questions:
- Supabase Documentation: https://supabase.com/docs
- Leaflet Documentation: https://leafletjs.com/
- Recharts Documentation: https://recharts.org/

---

**Status**: Frontend MVP Complete ✅ | Backend Integration Pending ⏳
