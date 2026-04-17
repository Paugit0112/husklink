# HuskLink Notification System

## Overview

HuskLink implements a real-time notification system that keeps both farmers and buyers informed about marketplace activities.

## Two-Way Notification Flow

### 1. Farmer → Buyer Notifications

When a **farmer posts a new listing**:
- ✅ All buyers in the region are notified
- ✅ Notification appears in buyer's notification bell
- ✅ Toast notification shows confirmation to farmer
- ✅ Buyers can click notification to view the listing

**Notification Types:**
- `new_listing` - New husk listing available

**Example:**
```
Title: "New Husk Listing Available"
Message: "Juan Dela Cruz posted Premium Rice Husks - 1500kg in Nueva Ecija"
```

### 2. Buyer → Farmer Notifications

When a **buyer places a bid**:
- ✅ Farmer receives notification about the new bid
- ✅ Notification appears in farmer's notification bell
- ✅ Toast notification shows confirmation to buyer
- ✅ Farmer can click notification to view bid details

**Notification Types:**
- `new_bid` - New bid received on listing
- `bid_accepted` - Bid has been accepted
- `bid_rejected` - Bid has been rejected

**Example:**
```
Title: "New Bid Received!"
Message: "BioPower Inc. placed a bid of ₱23,000 on your Premium Rice Husks listing"
```

## UI Components

### 1. Notification Bell (Navigation Bar)

**Location:** Top-right corner of navigation bar

**Features:**
- Red badge shows unread notification count
- Click to open notification dropdown
- Displays all notifications with timestamps
- Mark as read / Mark all as read / Clear all options

**Visual States:**
- Unread notifications: Blue dot + highlighted background
- Read notifications: Normal appearance
- Empty state: "No notifications yet" message

### 2. Notification Toast (Popup)

**Location:** Top-right of screen (below navigation)

**Features:**
- Auto-appears when notification is sent
- Shows who was notified (farmers/buyers)
- Auto-dismisses after 5 seconds
- Animated progress bar
- Manual close button

**Trigger Events:**
- Farmer posts listing → "Buyers Notified!" toast
- Buyer places bid → "Farmer Notified!" toast

### 3. Notification Panel (Dropdown)

**Features:**
- Scrollable list of all notifications
- Click notification to navigate to relevant page
- Time ago display (Just now, 30m ago, 2h ago, 1d ago)
- Type-specific icons:
  - 🛍️ New Listing (green shopping bag)
  - 📈 New Bid (blue trending up)
  - ✅ Bid Accepted (green check circle)
  - ❌ Bid Rejected (gray X)

## Technical Implementation

### Current (MVP - Mock Data)

```typescript
// Notification interface
interface Notification {
  id: string;
  type: 'new_listing' | 'new_bid' | 'bid_accepted' | 'bid_rejected';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    listingId?: string;
    bidId?: string;
    amount?: number;
  };
}

// When farmer posts listing
const handleCreateListing = (data) => {
  // Create listing...
  
  // Show toast to farmer
  showNotificationToast({
    title: '🔔 Buyers Notified!',
    message: 'All buyers in the region have been notified'
  });
};

// When buyer places bid
const handlePlaceBid = (listingId, amount) => {
  // Create bid...
  
  // Show toast to buyer
  showNotificationToast({
    title: '🔔 Farmer Notified!',
    message: 'The farmer has been notified about your bid'
  });
};
```

### Production (Supabase Integration)

When connected to Supabase, the system will work as follows:

#### 1. Database Triggers

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: Notify buyers when farmer posts listing
CREATE OR REPLACE FUNCTION notify_buyers_of_new_listing()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all buyers in the region
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    u.id,
    'new_listing',
    'New Husk Listing Available',
    format('%s posted %s in %s', 
      NEW.producer_name, 
      NEW.title, 
      NEW.address
    ),
    jsonb_build_object('listingId', NEW.id)
  FROM users u
  WHERE u.role = 'buyer';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listing_created
AFTER INSERT ON listings
FOR EACH ROW
EXECUTE FUNCTION notify_buyers_of_new_listing();

-- Trigger: Notify farmer when buyer places bid
CREATE OR REPLACE FUNCTION notify_farmer_of_new_bid()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    l.producer_id,
    'new_bid',
    'New Bid Received!',
    format('%s placed a bid of ₱%s on your %s listing',
      NEW.buyer_name,
      NEW.amount,
      l.title
    ),
    jsonb_build_object(
      'listingId', NEW.listing_id,
      'bidId', NEW.id,
      'amount', NEW.amount
    )
  FROM listings l
  WHERE l.id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bid_placed
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION notify_farmer_of_new_bid();
```

#### 2. Real-Time Subscriptions

```typescript
// Subscribe to notifications for current user
const subscribeToNotifications = (userId: string) => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Add new notification to state
        addNotification(payload.new);
        
        // Show toast
        showNotificationToast({
          title: payload.new.title,
          message: payload.new.message
        });
        
        // Play sound (optional)
        playNotificationSound();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

#### 3. Edge Function for Batch Notifications

```typescript
// supabase/functions/send-notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const { type, recipients, notification } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  // Batch insert notifications
  const { error } = await supabase
    .from('notifications')
    .insert(
      recipients.map(userId => ({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      }))
    );

  if (error) throw error;

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## User Experience Flow

### Farmer Posts Listing

1. Farmer uploads husk photo → AI processes
2. Farmer fills listing form → Clicks "Publish Listing"
3. **Notification sent**: Toast appears "🔔 Buyers Notified!"
4. **All buyers receive**: Bell icon shows red badge
5. **Buyers click bell**: See "New Husk Listing Available"
6. **Buyers click notification**: Navigate to map view with listing

### Buyer Places Bid

1. Buyer views listing on map
2. Buyer enters bid amount → Clicks "Place Bid"
3. **Notification sent**: Toast appears "🔔 Farmer Notified!"
4. **Farmer receives**: Bell icon shows red badge
5. **Farmer clicks bell**: See "New Bid Received! BioPower Inc. bid ₱23,000"
6. **Farmer clicks notification**: Navigate to My Listings → View Bids

## Mock Notifications on Login

For demonstration purposes, the MVP creates sample notifications on login:

**Buyer Login:**
- 2 new listing notifications (unread)
- Shows recent listings from farmers

**Farmer Login:**
- 2 new bid notifications (unread)
- 1 bid accepted notification (read)
- Shows recent bids on their listings

## Future Enhancements

### Email Notifications
- Send email digest for important notifications
- Configurable email preferences

### Push Notifications
- Browser push notifications (PWA)
- Mobile app push notifications

### SMS Notifications
- Critical notifications via SMS
- Bid accepted → SMS to both parties

### In-App Notification Settings
- Mute/unmute notification types
- Notification frequency settings
- Do not disturb hours

### Notification Categories
- Urgent (bids, acceptances)
- Marketing (new features, tips)
- Updates (price changes, expirations)

## Testing the System

### As a Farmer:
1. Login with email containing "farmer" (e.g., farmer@test.com)
2. Check notification bell (2 unread notifications about new bids)
3. Create a new listing
4. Watch for "Buyers Notified!" toast

### As a Buyer:
1. Login with any other email (e.g., buyer@test.com)
2. Check notification bell (2 unread notifications about new listings)
3. Browse map and place a bid
4. Watch for "Farmer Notified!" toast

---

**Status**: ✅ Frontend MVP Complete | 🔄 Backend Integration Ready
