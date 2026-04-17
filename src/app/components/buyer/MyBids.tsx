import { motion } from "motion/react";
import { TrendingUp, Clock, CheckCircle, XCircle, Eye, MapPin } from "lucide-react";

interface Bid {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    address: string;
    asking_price: number;
    ai_estimated_weight_kg?: number;
    image_url?: string;
    status: string;
  };
}

interface MyBidsProps {
  bids: Bid[];
  onViewListing: (listingId: string) => void;
}

export function MyBids({ bids, onViewListing }: MyBidsProps) {
  const pendingBids = bids.filter(b => b.status === 'pending');
  const acceptedBids = bids.filter(b => b.status === 'accepted');
  const rejectedBids = bids.filter(b => b.status === 'rejected');

  const getBidStatusConfig = (status: Bid['status']) => {
    switch (status) {
      case 'accepted':
        return {
          icon: CheckCircle,
          label: 'Accepted',
          color: 'text-success-green',
          bgColor: 'bg-success-green/10',
          borderColor: 'border-success-green/20'
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border'
        };
      default:
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-warning-amber',
          bgColor: 'bg-warning-amber/10',
          borderColor: 'border-warning-amber/20'
        };
    }
  };

  const BidCard = ({ bid }: { bid: Bid }) => {
    const statusConfig = getBidStatusConfig(bid.status);
    const StatusIcon = statusConfig.icon;
    const difference = bid.amount - bid.listing.asking_price;
    const percentDiff = ((difference / bid.listing.asking_price) * 100).toFixed(1);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          bg-card rounded-2xl border-2 overflow-hidden texture-grain
          ${bid.status === 'accepted' ? 'border-success-green/30' : 'border-border'}
          ${bid.status === 'rejected' ? 'opacity-70' : ''}
        `}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          {bid.listing.image_url && (
            <div className="md:w-48 h-48 md:h-auto bg-gradient-to-br from-forest-medium/10 to-leaf-green/10">
              <img
                src={bid.listing.image_url}
                alt={bid.listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg mb-1">{bid.listing.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{bid.listing.address}</span>
                </div>
              </div>

              <div className={`
                px-3 py-1.5 rounded-lg flex items-center gap-2 ${statusConfig.bgColor} border ${statusConfig.borderColor}
              `}>
                <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
                <p className="font-mono font-semibold">₱{bid.listing.asking_price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Your Bid</p>
                <p className="font-mono font-semibold text-primary">₱{bid.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Difference</p>
                <p className={`font-mono text-sm ${difference >= 0 ? 'text-success-green' : 'text-warning-amber'}`}>
                  {difference >= 0 ? '+' : ''}{percentDiff}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                <p className="font-mono text-sm">{bid.listing.ai_estimated_weight_kg.toLocaleString()} kg</p>
              </div>
            </div>

            {bid.message && (
              <div className="p-3 bg-muted rounded-lg mb-4">
                <p className="text-xs text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm">{bid.message}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Placed {new Date(bid.created_at).toLocaleDateString()} at {new Date(bid.created_at).toLocaleTimeString()}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewListing(bid.listing.id)}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Listing
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <TrendingUp className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl mb-2">No Bids Yet</h3>
        <p className="text-muted-foreground text-center max-w-md">
          You haven't placed any bids yet. Browse the map or listings to find agricultural waste that matches your needs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-warning-amber/10 border border-warning-amber/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending Bids</p>
            <Clock className="w-5 h-5 text-warning-amber" />
          </div>
          <p className="text-3xl font-bold text-warning-amber">{pendingBids.length}</p>
        </div>

        <div className="p-6 bg-success-green/10 border border-success-green/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <CheckCircle className="w-5 h-5 text-success-green" />
          </div>
          <p className="text-3xl font-bold text-success-green">{acceptedBids.length}</p>
        </div>

        <div className="p-6 bg-muted border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Bids</p>
            <TrendingUp className="w-5 h-5 text-foreground" />
          </div>
          <p className="text-3xl font-bold">{bids.length}</p>
        </div>
      </div>

      {/* Pending Bids */}
      {pendingBids.length > 0 && (
        <div>
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning-amber" />
            Pending Bids ({pendingBids.length})
          </h3>
          <div className="space-y-4">
            {pendingBids.map(bid => (
              <BidCard key={bid.id} bid={bid} />
            ))}
          </div>
        </div>
      )}

      {/* Accepted Bids */}
      {acceptedBids.length > 0 && (
        <div>
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success-green" />
            Accepted Bids ({acceptedBids.length})
          </h3>
          <div className="space-y-4">
            {acceptedBids.map(bid => (
              <BidCard key={bid.id} bid={bid} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Bids */}
      {rejectedBids.length > 0 && (
        <div>
          <h3 className="text-xl mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-muted-foreground" />
            Previous Bids ({rejectedBids.length})
          </h3>
          <div className="space-y-4">
            {rejectedBids.map(bid => (
              <BidCard key={bid.id} bid={bid} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
