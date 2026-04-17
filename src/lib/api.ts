import { supabase } from './supabase'
import type { Profile, Listing, Bid, AIResult, CreateListingData, LogisticsType } from './types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const profile = await getProfileById(data.user.id)
  return profile
}

export async function signUp(data: {
  email: string
  password: string
  fullName: string
  role: 'farmer' | 'buyer'
  phone?: string
  address?: string
  farmName?: string
  companyName?: string
}): Promise<Profile> {
  console.log('[signUp] step 1 — calling supabase.auth.signUp for', data.email)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        role: data.role,
      },
    },
  })
  console.log('[signUp] step 1 result — user:', authData?.user?.id, '| session:', !!authData?.session, '| error:', authError)
  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Sign up failed — no user returned.')

  const now = new Date().toISOString()

  // When email confirmation is disabled, session is available immediately
  if (authData.session) {
    console.log('[signUp] step 2 — upserting profile row')
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        phone: data.phone || null,
        farm_name: data.farmName || null,
        company_name: data.companyName || null,
      })
    console.log('[signUp] step 2 result — profileError:', profileError)
    if (profileError) throw new Error(profileError.message)

    console.log('[signUp] step 3 — fetching profile from DB')
    try {
      const profile = await getProfileById(authData.user.id)
      console.log('[signUp] step 3 success:', profile)
      return profile
    } catch (e) {
      console.warn('[signUp] step 3 failed (DB fetch), using constructed profile:', e)
    }
  } else {
    console.log('[signUp] no session — email confirmation likely required, returning constructed profile')
  }

  // Email confirmation required or DB fetch failed — return profile from form data
  return {
    id: authData.user.id,
    email: data.email,
    full_name: data.fullName,
    role: data.role,
    phone: data.phone || undefined,
    farm_name: data.farmName || undefined,
    company_name: data.companyName || undefined,
    created_at: now,
    updated_at: now,
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null
  return getProfileById(session.user.id)
}

async function getProfileById(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data as Profile
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export async function uploadHuskImage(file: File, producerId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${producerId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('husk-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from('husk-images')
    .getPublicUrl(path)

  return publicUrl
}

// ─── AI Processing ───────────────────────────────────────────────────────────

export async function processAIImage(imageUrl: string): Promise<AIResult> {
  try {
    const { data, error } = await supabase.functions.invoke('process-ai-image', {
      body: { imageUrl },
    })
    if (error) throw error
    return data as AIResult
  } catch {
    // Fallback simulation when edge function is not yet deployed
    return simulateAI()
  }
}

function simulateAI(): AIResult {
  const conditionScore = Math.round((0.75 + Math.random() * 0.2) * 100) / 100
  const moistureLevel = Math.round((8 + Math.random() * 12) * 10) / 10
  const estimatedWeight = Math.round((500 + Math.random() * 2000) / 50) * 50
  const suggestedPrice = Math.round((estimatedWeight * 15 * conditionScore) / 100) * 100
  return {
    condition_score: conditionScore,
    moisture_level: moistureLevel,
    estimated_weight_kg: estimatedWeight,
    suggested_price: suggestedPrice,
  }
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function fetchActiveListings(logisticsFilter: LogisticsType | 'all' = 'all'): Promise<Listing[]> {
  let query = supabase
    .from('listings')
    .select('*, producer:profiles!producer_id(full_name, farm_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (logisticsFilter !== 'all') {
    query = query.eq('logistics_type', logisticsFilter)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((item: any) => ({ ...item, location: { lat: item.lat, lng: item.lng } })) as Listing[]
}

export async function fetchMyListings(producerId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((item: any) => ({ ...item, location: { lat: item.lat, lng: item.lng } })) as Listing[]
}

export async function createListing(params: {
  producerId: string
  imageUrl: string
  lat: number | null
  lng: number | null
  aiResult: AIResult
  formData: CreateListingData
}): Promise<Listing> {
  const { producerId, imageUrl, lat, lng, aiResult, formData } = params
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + formData.expiresInDays)

  const { data, error } = await supabase
    .from('listings')
    .insert({
      producer_id: producerId,
      title: formData.title,
      description: formData.description,
      lat: lat ?? 8.9475,
      lng: lng ?? 125.5406,
      address: formData.address,
      image_url: imageUrl,
      ai_condition_score: aiResult.condition_score,
      ai_moisture_level: aiResult.moisture_level,
      ai_estimated_weight_kg: aiResult.estimated_weight_kg,
      ai_suggested_price: aiResult.suggested_price,
      ai_processed_at: new Date().toISOString(),
      asking_price: formData.askingPrice,
      logistics_type: formData.logisticsType,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return { ...data, location: { lat: data.lat, lng: data.lng } } as Listing
}

export async function deleteListing(listingId: string): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
  if (error) throw new Error(error.message)
}

// ─── Bids ─────────────────────────────────────────────────────────────────────

export async function fetchListingBids(listingId: string): Promise<Bid[]> {
  const { data, error } = await supabase
    .from('bids')
    .select('*, buyer:profiles!buyer_id(full_name, company_name)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Bid[]
}

export async function fetchMyBids(buyerId: string): Promise<Bid[]> {
  const { data, error } = await supabase
    .from('bids')
    .select(`
      *,
      listing:listings!listing_id(
        id, title, address, asking_price,
        ai_estimated_weight_kg, image_url, status
      )
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Bid[]
}

export async function placeBid(
  listingId: string,
  buyerId: string,
  amount: number,
  message?: string
): Promise<Bid> {
  const { data, error } = await supabase
    .from('bids')
    .insert({ listing_id: listingId, buyer_id: buyerId, amount, message: message || null })
    .select('*, buyer:profiles!buyer_id(full_name, company_name)')
    .single()
  if (error) throw new Error(error.message)
  return data as Bid
}

export async function acceptBid(bidId: string, listingId: string): Promise<void> {
  // Mark this bid accepted
  const { error: bidError } = await supabase
    .from('bids')
    .update({ status: 'accepted' })
    .eq('id', bidId)
  if (bidError) throw new Error(bidError.message)

  // Reject all other pending bids on the same listing
  await supabase
    .from('bids')
    .update({ status: 'rejected' })
    .eq('listing_id', listingId)
    .eq('status', 'pending')
    .neq('id', bidId)

  // Mark listing as sold
  const { error: listingError } = await supabase
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', listingId)
  if (listingError) throw new Error(listingError.message)
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToListingBids(
  listingId: string,
  onNewBid: (bid: Bid) => void
) {
  const channel = supabase
    .channel(`listing-bids-${listingId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bids', filter: `listing_id=eq.${listingId}` },
      async (payload) => {
        // Fetch the full bid with buyer profile joined
        const { data } = await supabase
          .from('bids')
          .select('*, buyer:profiles!buyer_id(full_name, company_name)')
          .eq('id', (payload.new as Bid).id)
          .single()
        if (data) onNewBid(data as Bid)
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

export function subscribeToFarmerBids(
  producerId: string,
  onNewBid: (bid: Bid, listingTitle: string) => void
) {
  const channel = supabase
    .channel(`farmer-bids-${producerId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bids' },
      async (payload) => {
        const newBid = payload.new as Bid

        // Only process bids on this farmer's listings
        const { data: listing } = await supabase
          .from('listings')
          .select('id, title, producer_id')
          .eq('id', newBid.listing_id)
          .eq('producer_id', producerId)
          .single()

        if (listing) {
          const { data: fullBid } = await supabase
            .from('bids')
            .select('*, buyer:profiles!buyer_id(full_name, company_name)')
            .eq('id', newBid.id)
            .single()
          if (fullBid) onNewBid(fullBid as Bid, listing.title)
        }
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
