# HuskLink Database Integration

This document describes how to use the database integration hooks and utilities in your HuskLink application.

## Setup Quick Start

1. **Configure Environment Variables**
   - Copy `.env.local` template and fill in your Supabase credentials
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous API key

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Database**
   - Follow the SQL schema in `SUPABASE_SETUP.md`

## Available Hooks

### Authentication (`useAuth.ts`)

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, loading, error, signUp, signIn, signOut } = useAuth();

// Sign up
await signUp(email, password, fullName, 'producer');

// Sign in
await signIn(email, password);

// Sign out
await signOut();
```

### Listings (`useSupabase.ts`)

```typescript
import { useListings } from '@/hooks/useSupabase';

// Fetch active listings
const { listings, loading, error } = useListings({ status: 'active' });

// Filter by logistics type
const { listings } = useListings({ status: 'active', logisticsType: 'farm_pickup' });
```

### Database Mutations (`useDatabase.ts`)

#### Create Listing

```typescript
import { useCreateListing } from '@/hooks/useDatabase';

const { createListing, loading, error } = useCreateListing();

await createListing({
  title: 'Fresh Rice Husks',
  description: 'High quality rice husks from harvest',
  address: 'Nueva Ecija, Philippines',
  location: { lat: 15.4909, lng: 121.0537 },
  imageUrl: 'https://...',
  askingPrice: 5000,
  logisticsType: 'farm_pickup'
});
```

#### Place Bid

```typescript
import { usePlaceBid } from '@/hooks/useDatabase';

const { placeBid, loading, error } = usePlaceBid();

await placeBid(listingId, 4500, 'Can arrange pickup next week');
```

#### Accept Bid

```typescript
import { useAcceptBid } from '@/hooks/useDatabase';

const { acceptBid, loading, error } = useAcceptBid();

await acceptBid(bidId, listingId);
```

#### Update Listing Status

```typescript
import { useUpdateListingStatus } from '@/hooks/useDatabase';

const { updateListingStatus } = useUpdateListingStatus();

await updateListingStatus(listingId, 'sold');
```

#### Update User Profile

```typescript
import { useUpdateProfile } from '@/hooks/useDatabase';

const { updateProfile } = useUpdateProfile();

await updateProfile({
  full_name: 'Juan Dela Cruz',
  phone: '09123456789',
  farm_name: 'Dela Cruz Farm'
});
```

### Real-time Updates (`useSupabase.ts`)

```typescript
import { useRealtimeBids } from '@/hooks/useSupabase';

// Subscribe to bid updates for a listing
const bids = useRealtimeBids(listingId);

// Bids will automatically update when new bids are placed
```

### Geolocation (`useSupabase.ts`)

```typescript
import { useGeolocation } from '@/hooks/useSupabase';

const { location, loading, error } = useGeolocation();
// Returns: { lat: number, lng: number }
```

### Image Upload (`useSupabase.ts`)

```typescript
import { useImageUpload } from '@/hooks/useSupabase';

const { upload, uploading, url, error } = useImageUpload();

// Upload to 'listings' bucket
const publicUrl = await upload(file, 'listings');

// Upload to 'avatars' bucket
const avatarUrl = await upload(avatarFile, 'avatars');
```

## Database Schema

### users
- `id` (UUID): Primary key
- `email` (TEXT): Unique email
- `full_name` (TEXT): User's full name
- `role` (ENUM): 'producer', 'buyer', 'admin'
- `phone` (TEXT): Phone number
- `farm_name` (TEXT): Farm name (for producers)
- `company_name` (TEXT): Company name (for buyers)
- `avatar_url` (TEXT): Avatar image URL
- `bio` (TEXT): User bio
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

### listings
- `id` (UUID): Primary key
- `producer_id` (UUID): Foreign key to users
- `title` (TEXT): Listing title
- `description` (TEXT): Listing description
- `location` (GEOMETRY): Geographic point (lat/lng)
- `address` (TEXT): Text address
- `image_url` (TEXT): Image URL
- `ai_condition_score` (DECIMAL): AI analysis score (0-100)
- `ai_moisture_level` (DECIMAL): Moisture level percentage
- `ai_estimated_weight_kg` (DECIMAL): Estimated weight
- `ai_suggested_price` (DECIMAL): AI suggested price
- `ai_processed_at` (TIMESTAMPTZ): When AI analysis completed
- `asking_price` (DECIMAL): Asking price
- `logistics_type` (ENUM): 'farm_pickup', 'road_hauled'
- `status` (ENUM): 'pending_ai', 'active', 'sold', 'expired'
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp
- `expires_at` (TIMESTAMPTZ): Expiration date

### bids
- `id` (UUID): Primary key
- `listing_id` (UUID): Foreign key to listings
- `buyer_id` (UUID): Foreign key to users
- `amount` (DECIMAL): Bid amount
- `status` (ENUM): 'pending', 'accepted', 'rejected', 'cancelled'
- `message` (TEXT): Bid message
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp

### transactions
- `id` (UUID): Primary key
- `listing_id` (UUID): Foreign key to listings
- `buyer_id` (UUID): Foreign key to users
- `producer_id` (UUID): Foreign key to users
- `winning_bid_id` (UUID): Foreign key to bids
- `final_price` (DECIMAL): Final transaction price
- `completed_at` (TIMESTAMPTZ): Transaction completion timestamp

## Row Level Security (RLS)

The database has RLS enabled with the following policies:

- **users**: Users can only view/update their own profile
- **listings**: Producers can manage their listings, buyers can view active listings
- **bids**: Buyers can manage their bids, producers can view bids on their listings
- **transactions**: Users can only view their own transactions

## Best Practices

1. **Error Handling**: Always check for errors in your components
   ```typescript
   if (error) {
     console.error('Database error:', error.message);
     // Show error to user
   }
   ```

2. **Loading States**: Show loading indicators while fetching data
   ```typescript
   {loading && <Spinner />}
   {!loading && data && <Component data={data} />}
   ```

3. **Real-time Updates**: Use real-time subscriptions for time-sensitive data
   ```typescript
   const bids = useRealtimeBids(listingId);
   ```

4. **Image Optimization**: Compress images before upload
   ```typescript
   const compressedFile = await compressImage(file);
   await upload(compressedFile, 'listings');
   ```

## Troubleshooting

### "CORS Error"
- Make sure your Supabase project allows requests from your domain
- Check Supabase Settings → API → CORS

### "Missing RLS Policy"
- Verify RLS policies are created correctly
- Check Supabase SQL logs for policy errors

### "Authentication Failed"
- Make sure authentication is enabled in Supabase
- Check that email confirmation is not required (or handle it)

### "Geolocation Not Working"
- User must allow location permission
- PostGIS extension must be enabled in database

## Next Steps

1. Integrate authentication into your components
2. Update components to use real database hooks
3. Set up email confirmations
4. Implement AI image processing webhook
5. Add analytics and monitoring

## Support

For issues with Supabase:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)

For issues with this integration:
- Check the examples in each hook file
- Review the SUPABASE_SETUP.md guide
