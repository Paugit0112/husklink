/**
 * Database Hooks - Mutations
 *
 * Hooks for creating, updating, and managing database records.
 */

import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

/**
 * Hook to create a new listing
 *
 * Usage:
 * const { createListing, loading, error } = useCreateListing();
 * await createListing({ title: '...', description: '...', ... });
 */
export function useCreateListing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createListing = async (listingData: {
    title: string;
    description: string;
    address: string;
    location?: { lat: number; lng: number };
    imageUrl: string;
    askingPrice: number;
    logisticsType: 'farm_pickup' | 'road_hauled';
  }) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const locationGeometry = listingData.location
        ? `POINT(${listingData.location.lng} ${listingData.location.lat})`
        : null;

      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          producer_id: user.id,
          title: listingData.title,
          description: listingData.description,
          address: listingData.address,
          location: locationGeometry,
          image_url: listingData.imageUrl,
          asking_price: listingData.askingPrice,
          logistics_type: listingData.logisticsType,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createListing, loading, error };
}

/**
 * Hook to place a bid on a listing
 *
 * Usage:
 * const { placeBid, loading, error } = usePlaceBid();
 * await placeBid(listingId, amount, message);
 */
export function usePlaceBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const placeBid = async (listingId: string, amount: number, message?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('bids')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          amount,
          message,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { placeBid, loading, error };
}

/**
 * Hook to update listing status
 *
 * Usage:
 * const { updateListingStatus, loading, error } = useUpdateListingStatus();
 * await updateListingStatus(listingId, 'sold');
 */
export function useUpdateListingStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateListingStatus = async (
    listingId: string,
    status: 'pending_ai' | 'active' | 'sold' | 'expired'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('listings')
        .update({ status, updated_at: new Date() })
        .eq('id', listingId)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateListingStatus, loading, error };
}

/**
 * Hook to accept a bid
 *
 * Usage:
 * const { acceptBid, loading, error } = useAcceptBid();
 * await acceptBid(bidId, listingId);
 */
export function useAcceptBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const acceptBid = async (bidId: string, listingId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get bid details
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (bidError) throw bidError;

      // Update bid status
      await supabase
        .from('bids')
        .update({ status: 'accepted', updated_at: new Date() })
        .eq('id', bidId);

      // Update all other bids to rejected
      await supabase
        .from('bids')
        .update({ status: 'rejected', updated_at: new Date() })
        .eq('listing_id', listingId)
        .neq('id', bidId);

      // Update listing to sold
      await supabase
        .from('listings')
        .update({ status: 'sold', updated_at: new Date() })
        .eq('id', listingId);

      // Get listing producer
      const { data: listing } = await supabase
        .from('listings')
        .select('producer_id')
        .eq('id', listingId)
        .single();

      // Create transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          listing_id: listingId,
          buyer_id: bid.buyer_id,
          producer_id: listing?.producer_id,
          winning_bid_id: bidId,
          final_price: bid.amount
        })
        .select()
        .single();

      if (txError) throw txError;
      return transaction;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { acceptBid, loading, error };
}

/**
 * Hook to fetch user profile
 *
 * Usage:
 * const { user, loading, error } = useUserProfile();
 */
export function useUserProfile(userId?: string) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    try {
      let id = userId;
      
      if (!id) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        id = authUser?.id;
        if (!id) throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setUser(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, refetch: fetchProfile };
}

/**
 * Hook to update user profile
 *
 * Usage:
 * const { updateProfile, loading, error } = useUpdateProfile();
 * await updateProfile({ full_name: '...', phone: '...' });
 */
export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = async (updates: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: updateError } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error };
}
