export type UserRole = 'farmer' | 'buyer'
export type LogisticsType = 'farm_pickup' | 'road_hauled'
export type ListingStatus = 'pending_ai' | 'active' | 'sold' | 'expired'
export type BidStatus = 'pending' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  farm_name?: string
  company_name?: string
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  producer_id: string
  title: string
  description?: string
  lat: number
  lng: number
  address: string
  image_url: string
  ai_condition_score?: number
  ai_moisture_level?: number
  ai_estimated_weight_kg?: number
  ai_suggested_price?: number
  ai_processed_at?: string
  asking_price: number
  logistics_type: LogisticsType
  status: ListingStatus
  bid_count: number
  highest_bid?: number
  expires_at?: string
  created_at: string
  updated_at: string
  producer?: {
    full_name: string
    farm_name?: string
  }
}

export interface Bid {
  id: string
  listing_id: string
  buyer_id: string
  amount: number
  status: BidStatus
  message?: string
  created_at: string
  updated_at: string
  buyer?: {
    full_name: string
    company_name?: string
  }
  listing?: {
    id: string
    title: string
    address: string
    asking_price: number
    ai_estimated_weight_kg?: number
    image_url: string
    status: string
  }
}

export interface AIResult {
  condition_score: number
  moisture_level: number
  estimated_weight_kg: number
  suggested_price: number
}

export interface CreateListingData {
  title: string
  description: string
  askingPrice: number
  logisticsType: LogisticsType
  address: string
  expiresInDays: number
}
