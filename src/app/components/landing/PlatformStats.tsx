import { motion } from "motion/react";
import { TrendingUp, Package, MapPin, Leaf, ShoppingBag } from "lucide-react";
import { LiveMap } from "../buyer/LiveMap";

interface Listing {
  id: string;
  title: string;
  location: { lat: number; lng: number };
  logistics_type: 'farm_pickup' | 'road_hauled';
  asking_price: number;
  ai_estimated_weight_kg?: number;
  address: string;
}

interface PlatformStatsProps {
  listings?: Listing[];
  onListingClick?: (listing: Listing) => void;
}

export function PlatformStats({ listings = [], onListingClick }: PlatformStatsProps) {
  const totalVolume = listings.reduce((sum, l) => sum + (l.ai_estimated_weight_kg ?? 0), 0);
  const totalValue  = listings.reduce((sum, l) => sum + l.asking_price, 0);

  const stats = [
    {
      icon: Package,
      label: "Total Volume Listed",
      value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}` : totalVolume.toFixed(0),
      unit: totalVolume >= 1000 ? "tons" : "kg",
      color: "text-leaf-green",
      bgColor: "bg-leaf-green/10",
      gradient: "from-leaf-green to-forest-medium"
    },
    {
      icon: TrendingUp,
      label: "Total Listed Value",
      value: totalValue >= 1_000_000
        ? `₱${(totalValue / 1_000_000).toFixed(2)}M`
        : `₱${totalValue.toLocaleString()}`,
      unit: "",
      color: "text-primary",
      bgColor: "bg-primary/10",
      gradient: "from-forest-medium to-forest-dark"
    },
    {
      icon: ShoppingBag,
      label: "Active Listings",
      value: listings.length.toString(),
      unit: "available",
      color: "text-accent",
      bgColor: "bg-accent/10",
      gradient: "from-biomass-brown to-earth-tan"
    },
    {
      icon: MapPin,
      label: "Provinces Covered",
      value: "5",
      unit: "in Caraga region",
      color: "text-success-green",
      bgColor: "bg-success-green/10",
      gradient: "from-success-green to-leaf-green"
    }
  ];

  // Top locations derived from real listings
  const locationMap = listings.reduce((acc, l) => {
    const parts = l.address.split(',');
    const place = parts[1]?.trim() || parts[0]?.trim() || 'Unknown';
    if (!acc[place]) acc[place] = { name: place, count: 0, volume: 0 };
    acc[place].count += 1;
    acc[place].volume += l.ai_estimated_weight_kg ?? 0;
    return acc;
  }, {} as Record<string, { name: string; count: number; volume: number }>);

  const topLocations = Object.values(locationMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCount = topLocations[0]?.count ?? 1;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <Leaf className="w-6 h-6 text-leaf-green" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-forest-dark to-leaf-green bg-clip-text text-transparent">
            Platform Impact - Caraga Region
          </h2>
        </div>
        <p className="text-muted-foreground">
          Live statistics of agricultural waste listings in Caraga, Mindanao
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="relative group"
            >
              <div className="p-6 bg-card rounded-2xl border-2 border-border hover:border-primary/30 transition-all duration-300 texture-grain overflow-hidden">
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${stat.gradient}`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
                    {stat.unit && <p className="text-sm text-muted-foreground">{stat.unit}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card rounded-2xl border-2 border-border p-8 texture-grain"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Active Listings Map</h3>
          </div>
          <p className="text-muted-foreground mb-2">
            Current husk listings available in the Caraga region
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-success-green rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {listings.length} active {listings.length === 1 ? 'listing' : 'listings'}
            </span>
          </div>
        </div>

        <div className="mb-8 h-[500px] rounded-2xl overflow-hidden border border-border shadow-lg">
          {listings.length > 0 ? (
            <LiveMap
              listings={listings}
              onListingClick={onListingClick || (() => {})}
              center={[8.9475, 125.5406]}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-muted/30 text-muted-foreground gap-3">
              <MapPin className="w-10 h-10 opacity-30" />
              <p className="text-sm">No listings yet — be the first to post one!</p>
            </div>
          )}
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-forest-medium/5 rounded-xl border border-primary/20 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary mb-1">
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${totalVolume.toFixed(0)}kg`}
            </p>
            <p className="text-sm text-muted-foreground">Total Volume</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-leaf-green/10 to-forest-medium/5 rounded-xl border border-leaf-green/20 text-center">
            <TrendingUp className="w-6 h-6 text-leaf-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-leaf-green mb-1">
              {totalValue >= 1_000_000 ? `₱${(totalValue / 1_000_000).toFixed(2)}M` : `₱${totalValue.toLocaleString()}`}
            </p>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </div>
        </div>
      </motion.div>

      {/* Top Locations */}
      {topLocations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-card rounded-2xl border-2 border-border p-8 texture-grain"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-forest-medium to-leaf-green rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Top Listing Locations</h3>
              <p className="text-sm text-muted-foreground">Areas with the most active listings</p>
            </div>
          </div>

          <div className="space-y-3">
            {topLocations.map((loc, index) => (
              <motion.div
                key={loc.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl hover:bg-primary/5 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                  ${index === 0 ? 'bg-gradient-to-br from-leaf-green to-forest-medium text-white' :
                    index === 1 ? 'bg-gradient-to-br from-forest-medium to-forest-dark text-white' :
                    index === 2 ? 'bg-gradient-to-br from-biomass-brown to-earth-tan text-white' :
                    'bg-muted text-foreground'}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.count} {loc.count === 1 ? 'listing' : 'listings'}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-primary">
                    {loc.volume >= 1000 ? `${(loc.volume / 1000).toFixed(1)}t` : `${loc.volume.toFixed(0)}kg`}
                  </p>
                  <p className="text-xs text-muted-foreground">volume</p>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(loc.count / maxCount) * 100}%` }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-forest-medium to-leaf-green"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="text-center"
      >
        <p className="text-muted-foreground mb-4">
          Join the marketplace in Caraga region — Mindanao's agricultural waste trading hub
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-success-green rounded-full animate-pulse" />
          <span>Live platform • {listings.length} active {listings.length === 1 ? 'listing' : 'listings'}</span>
        </div>
      </motion.div>
    </div>
  );
}
