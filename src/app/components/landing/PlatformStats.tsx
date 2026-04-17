import { motion } from "motion/react";
import { TrendingUp, Package, MapPin, Users, Leaf, ShoppingBag } from "lucide-react";
import { LiveMap } from "../buyer/LiveMap";
import { CARAGA_SOLD_LISTINGS, CARAGA_STATS } from "../../data/soldListings";

// Platform stats will be calculated dynamically
const getPlatformStats = () => {
  const totalVolume = (CARAGA_STATS.totalVolume / 1000).toFixed(1);
  const totalValue = (CARAGA_STATS.totalValue / 1000000).toFixed(2);

  return [
    {
      icon: Package,
      label: "Total Volume Traded",
      value: totalVolume,
      unit: "tons",
      color: "text-leaf-green",
      bgColor: "bg-leaf-green/10",
      gradient: "from-leaf-green to-forest-medium"
    },
    {
      icon: TrendingUp,
      label: "Total Value",
      value: `₱${totalValue}M`,
      unit: "",
      color: "text-primary",
      bgColor: "bg-primary/10",
      gradient: "from-forest-medium to-forest-dark"
    },
    {
      icon: ShoppingBag,
      label: "Husks Sold",
      value: CARAGA_STATS.totalSold.toString(),
      unit: "in Caraga",
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
};

// Top trading municipalities in Caraga
const getTopMunicipalities = () => {
  const municipalities = CARAGA_SOLD_LISTINGS.reduce((acc, listing) => {
    // Extract municipality from address
    const parts = listing.address.split(',');
    const municipality = parts[1]?.trim() || 'Unknown';

    if (!acc[municipality]) {
      acc[municipality] = {
        municipality,
        transactions: 0,
        volume: 0
      };
    }

    acc[municipality].transactions += 1;
    acc[municipality].volume += listing.ai_estimated_weight_kg;

    return acc;
  }, {} as Record<string, { municipality: string; transactions: number; volume: number }>);

  return Object.values(municipalities)
    .sort((a, b) => b.transactions - a.transactions)
    .slice(0, 5)
    .map(m => ({
      province: m.municipality,
      transactions: m.transactions,
      volume: `${(m.volume / 1000).toFixed(1)}t`
    }));
};

interface Listing {
  id: string;
  title: string;
  location: { lat: number; lng: number };
  logistics_type: 'farm_pickup' | 'road_hauled';
  asking_price: number;
  ai_estimated_weight_kg: number;
  address: string;
}

interface PlatformStatsProps {
  listings?: Listing[];
  onListingClick?: (listing: Listing) => void;
}

export function PlatformStats({ listings = [], onListingClick }: PlatformStatsProps) {
  const platformStats = getPlatformStats();
  const topMunicipalities = getTopMunicipalities();
  const maxTransactions = topMunicipalities.length > 0 ? topMunicipalities[0].transactions : 1;

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
          Real-time statistics of agricultural waste transactions in Caraga, Mindanao
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformStats.map((stat, index) => {
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
                {/* Gradient overlay on hover */}
                <div className={`
                  absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300
                  bg-gradient-to-br ${stat.gradient}
                `} />

                <div className="relative z-10">
                  <div className={`
                    w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-4xl font-bold font-mono ${stat.color}`}>
                      {stat.value}
                    </p>
                    {stat.unit && (
                      <p className="text-sm text-muted-foreground">{stat.unit}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Top Locations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card rounded-2xl border-2 border-border p-8 texture-grain"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-forest-medium to-leaf-green rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Top Trading Municipalities in Caraga</h3>
            <p className="text-sm text-muted-foreground">Cities and municipalities with the highest husk sales</p>
          </div>
        </div>

        <div className="space-y-3">
          {topMunicipalities.map((location, index) => (
            <motion.div
              key={location.province}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl hover:bg-primary/5 transition-colors group"
            >
              {/* Rank */}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                ${index === 0 ? 'bg-gradient-to-br from-leaf-green to-forest-medium text-white' :
                  index === 1 ? 'bg-gradient-to-br from-forest-medium to-forest-dark text-white' :
                  index === 2 ? 'bg-gradient-to-br from-biomass-brown to-earth-tan text-white' :
                  'bg-muted text-foreground'}
              `}>
                {index + 1}
              </div>

              {/* Location Name */}
              <div className="flex-1">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {location.province}
                </p>
                <p className="text-xs text-muted-foreground">
                  {location.transactions} transactions completed
                </p>
              </div>

              {/* Volume */}
              <div className="text-right">
                <p className="font-mono font-bold text-primary">{location.volume}</p>
                <p className="text-xs text-muted-foreground">total volume</p>
              </div>

              {/* Progress Bar */}
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(location.transactions / maxTransactions) * 100}%` }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-forest-medium to-leaf-green"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coverage Info */}
        <div className="mt-6 p-6 bg-gradient-to-br from-forest-medium/5 to-leaf-green/5 rounded-xl border border-primary/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">Caraga Region Coverage</p>
                <p className="text-sm text-muted-foreground">
                  Serving all 5 provinces across Caraga, Mindanao
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{CARAGA_STATS.totalSold}</p>
                <p className="text-xs text-muted-foreground">Husks Sold</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-success-green">{(CARAGA_STATS.totalVolume / 1000).toFixed(0)}t</p>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Location Map - Caraga Sold Husks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="bg-card rounded-2xl border-2 border-border p-8 texture-grain"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Where Husks Have Been Sold</h3>
          </div>
          <p className="text-muted-foreground mb-2">
            Completed transactions in the Caraga region, Mindanao
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-success-green rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {CARAGA_STATS.totalSold} husks sold in Caraga
            </span>
          </div>
        </div>

        {/* Live Interactive Map */}
        <div className="mb-8 h-[600px] rounded-2xl overflow-hidden border border-border shadow-lg">
          <LiveMap
            listings={CARAGA_SOLD_LISTINGS as any}
            onListingClick={onListingClick || (() => {})}
            center={[8.9475, 125.5406]}
          />
        </div>

        {/* Caraga Region Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-success-green/10 to-leaf-green/5 rounded-xl border border-success-green/20 text-center">
            <ShoppingBag className="w-6 h-6 text-success-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-success-green mb-1">{CARAGA_STATS.totalSold}</p>
            <p className="text-sm text-muted-foreground">Total Sold</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-primary/10 to-forest-medium/5 rounded-xl border border-primary/20 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary mb-1">{(CARAGA_STATS.totalVolume / 1000).toFixed(1)}t</p>
            <p className="text-sm text-muted-foreground">Total Volume</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-leaf-green/10 to-forest-medium/5 rounded-xl border border-leaf-green/20 text-center">
            <TrendingUp className="w-6 h-6 text-leaf-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-leaf-green mb-1">₱{(CARAGA_STATS.totalValue / 1000000).toFixed(2)}M</p>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </div>
        </div>

        {/* Province Breakdown */}
        <div className="mt-8">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Sales by Province in Caraga
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CARAGA_STATS.byProvince.map((province, index) => (
              <motion.div
                key={province.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-gradient-to-br from-leaf-green to-forest-medium text-white' :
                      index === 1 ? 'bg-gradient-to-br from-forest-medium to-forest-dark text-white' :
                      'bg-muted text-foreground'}
                  `}>
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{province.name}</p>
                    <p className="text-xs text-muted-foreground">{province.count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-primary text-sm">
                    {(province.volume / 1000).toFixed(1)}t
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="text-center"
      >
        <p className="text-muted-foreground mb-4">
          Join our thriving marketplace in Caraga region - Mindanao's agricultural waste trading hub
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-success-green rounded-full animate-pulse" />
          <span>Live platform • {CARAGA_STATS.totalSold} husks sold and counting</span>
        </div>
      </motion.div>
    </div>
  );
}
