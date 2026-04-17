import { motion } from "motion/react";
import { MapPin, Weight, Droplets, CheckCircle2, Home, Truck, TrendingUp } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description?: string;
  location: { lat: number; lng: number };
  address: string;
  logistics_type: 'farm_pickup' | 'road_hauled';
  asking_price: number;
  ai_condition_score?: number;
  ai_moisture_level?: number;
  ai_estimated_weight_kg: number;
  image_url?: string;
  producer?: {
    full_name: string;
    farm_name?: string;
  };
}

interface ListingCardProps {
  listing: Listing;
  onPlaceBid?: (listingId: string) => void;
  compact?: boolean;
}

export function ListingCard({ listing, onPlaceBid, compact = false }: ListingCardProps) {
  const LogisticsIcon = listing.logistics_type === 'farm_pickup' ? Home : Truck;

  if (compact) {
    return (
      <div className="p-4 bg-card rounded-xl border border-border">
        <h4 className="font-semibold mb-2 text-sm">{listing.title}</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <LogisticsIcon className="w-3 h-3" />
            {listing.logistics_type === 'farm_pickup' ? 'Farm Pickup' : 'Road Hauled'}
          </p>
          <p className="font-mono font-bold text-base text-primary">
            ₱{listing.asking_price.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 texture-grain"
    >
      {listing.image_url && (
        <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-forest-medium/10 to-leaf-green/10">
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-card/95 backdrop-blur-sm rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">Est. Weight</p>
            <p className="font-mono font-bold text-xs sm:text-sm">{listing.ai_estimated_weight_kg.toLocaleString()} kg</p>
          </div>
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base sm:text-lg leading-tight flex-1">{listing.title}</h3>
            <div className={`
              px-2 sm:px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 flex-shrink-0
              ${listing.logistics_type === 'farm_pickup'
                ? 'bg-forest-medium/10 text-forest-medium border border-forest-medium/20'
                : 'bg-accent/10 text-accent border border-accent/20'
              }
            `}>
              <LogisticsIcon className="w-3 h-3" />
              {listing.logistics_type === 'farm_pickup' ? 'Farm' : 'Road'}
            </div>
          </div>

          {listing.producer && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {listing.producer.farm_name || listing.producer.full_name}
            </p>
          )}
        </div>

        {listing.description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="line-clamp-1">{listing.address}</span>
        </div>

        {/* AI Metrics */}
        {(listing.ai_condition_score || listing.ai_moisture_level) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {listing.ai_condition_score && (
              <div className="p-2 sm:p-2 bg-success-green/10 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-success-green flex-shrink-0" />
                  <p className="text-[10px] text-success-green font-medium">Condition</p>
                </div>
                <p className="text-xs font-mono font-semibold text-success-green">
                  {(listing.ai_condition_score * 100).toFixed(0)}%
                </p>
              </div>
            )}
            {listing.ai_moisture_level && (
              <div className="p-2 sm:p-2 bg-[#2196f3]/10 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <Droplets className="w-3 h-3 text-[#2196f3] flex-shrink-0" />
                  <p className="text-[10px] text-[#2196f3] font-medium">Moisture</p>
                </div>
                <p className="text-xs font-mono font-semibold text-[#2196f3]">
                  {listing.ai_moisture_level.toFixed(1)}%
                </p>
              </div>
            )}
            <div className="p-2 sm:p-2 bg-accent/10 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Weight className="w-3 h-3 text-accent flex-shrink-0" />
                <p className="text-[10px] text-accent font-medium">Weight</p>
              </div>
              <p className="text-xs font-mono font-semibold text-accent">
                {(listing.ai_estimated_weight_kg / 1000).toFixed(1)}t
              </p>
            </div>
          </div>
        )}

        {/* Price & Action */}
        <div className="pt-3 sm:pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-primary">
              ₱{listing.asking_price.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              ~₱{(listing.asking_price / listing.ai_estimated_weight_kg).toFixed(2)}/kg
            </p>
          </div>

          {onPlaceBid && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPlaceBid(listing.id)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Place Bid
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
