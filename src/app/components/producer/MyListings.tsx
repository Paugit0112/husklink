import { motion } from "motion/react";
import { Package, Eye, TrendingUp, Clock, CheckCircle, MapPin, Edit, Trash2 } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description?: string;
  address: string;
  asking_price: number;
  ai_estimated_weight_kg: number;
  ai_condition_score?: number;
  ai_moisture_level?: number;
  logistics_type: 'farm_pickup' | 'road_hauled';
  status: 'pending_ai' | 'active' | 'sold' | 'expired';
  image_url?: string;
  created_at: string;
  expires_at?: string;
  bid_count: number;
  highest_bid?: number;
}

interface MyListingsProps {
  listings: Listing[];
  onViewBids: (listingId: string) => void;
  onEdit: (listingId: string) => void;
  onDelete: (listingId: string) => void;
}

export function MyListings({ listings, onViewBids, onEdit, onDelete }: MyListingsProps) {
  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');
  const expiredListings = listings.filter(l => l.status === 'expired');

  const getStatusConfig = (status: Listing['status']) => {
    switch (status) {
      case 'active':
        return {
          icon: Package,
          label: 'Active',
          color: 'text-success-green',
          bgColor: 'bg-success-green/10',
          borderColor: 'border-success-green/20'
        };
      case 'sold':
        return {
          icon: CheckCircle,
          label: 'Sold',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20'
        };
      case 'expired':
        return {
          icon: Clock,
          label: 'Expired',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border'
        };
      default:
        return {
          icon: Clock,
          label: 'Processing',
          color: 'text-warning-amber',
          bgColor: 'bg-warning-amber/10',
          borderColor: 'border-warning-amber/20'
        };
    }
  };

  const ListingCard = ({ listing }: { listing: Listing }) => {
    const statusConfig = getStatusConfig(listing.status);
    const StatusIcon = statusConfig.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          bg-card rounded-2xl border-2 overflow-hidden texture-grain
          ${listing.status === 'sold' ? 'border-primary/30' : 'border-border'}
          ${listing.status === 'expired' ? 'opacity-70' : ''}
        `}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          {listing.image_url && (
            <div className="md:w-56 h-56 md:h-auto bg-gradient-to-br from-forest-medium/10 to-leaf-green/10 relative">
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <div className={`
                absolute top-3 right-3 px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-2
                ${statusConfig.bgColor} border ${statusConfig.borderColor}
              `}>
                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg mb-1">{listing.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.address}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
                <p className="font-mono font-semibold text-primary">₱{listing.asking_price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                <p className="font-mono text-sm">{listing.ai_estimated_weight_kg.toLocaleString()} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bids Received</p>
                <p className="font-mono text-sm flex items-center gap-1">
                  {listing.bid_count}
                  {listing.bid_count > 0 && <TrendingUp className="w-3 h-3 text-success-green" />}
                </p>
              </div>
              {listing.highest_bid && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Highest Bid</p>
                  <p className="font-mono text-sm text-success-green">₱{listing.highest_bid.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* AI Metrics */}
            {(listing.ai_condition_score || listing.ai_moisture_level) && (
              <div className="flex gap-2 mb-4">
                {listing.ai_condition_score && (
                  <div className="px-3 py-1.5 bg-success-green/10 border border-success-green/20 rounded-lg text-xs">
                    Condition: <span className="font-mono font-semibold">{(listing.ai_condition_score * 100).toFixed(0)}%</span>
                  </div>
                )}
                {listing.ai_moisture_level && (
                  <div className="px-3 py-1.5 bg-[#2196f3]/10 border border-[#2196f3]/20 rounded-lg text-xs">
                    Moisture: <span className="font-mono font-semibold">{listing.ai_moisture_level.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                <p>Listed {new Date(listing.created_at).toLocaleDateString()}</p>
                {listing.expires_at && listing.status === 'active' && (
                  <p>Expires {new Date(listing.expires_at).toLocaleDateString()}</p>
                )}
              </div>

              <div className="flex gap-2">
                {listing.status === 'active' && (
                  <>
                    {listing.bid_count > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onViewBids(listing.id)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Bids ({listing.bid_count})
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(listing.id)}
                      className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-sm font-medium hover:bg-secondary/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(listing.id)}
                      className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl mb-2">No Listings Yet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          You haven't created any listings yet. Upload a photo of your husk pile to get started with AI-powered pricing.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
        >
          Create First Listing
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-success-green/10 border border-success-green/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Active</p>
            <Package className="w-5 h-5 text-success-green" />
          </div>
          <p className="text-3xl font-bold text-success-green">{activeListings.length}</p>
        </div>

        <div className="p-6 bg-primary/10 border border-primary/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Sold</p>
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">{soldListings.length}</p>
        </div>

        <div className="p-6 bg-warning-amber/10 border border-warning-amber/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Bids</p>
            <TrendingUp className="w-5 h-5 text-warning-amber" />
          </div>
          <p className="text-3xl font-bold text-warning-amber">
            {listings.reduce((sum, l) => sum + l.bid_count, 0)}
          </p>
        </div>

        <div className="p-6 bg-muted border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total</p>
            <Package className="w-5 h-5 text-foreground" />
          </div>
          <p className="text-3xl font-bold">{listings.length}</p>
        </div>
      </div>

      {/* Active Listings */}
      {activeListings.length > 0 && (
        <div>
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-success-green" />
            Active Listings ({activeListings.length})
          </h3>
          <div className="space-y-4">
            {activeListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Sold Listings */}
      {soldListings.length > 0 && (
        <div>
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Sold Listings ({soldListings.length})
          </h3>
          <div className="space-y-4">
            {soldListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Expired Listings */}
      {expiredListings.length > 0 && (
        <div>
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Expired Listings ({expiredListings.length})
          </h3>
          <div className="space-y-4">
            {expiredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
