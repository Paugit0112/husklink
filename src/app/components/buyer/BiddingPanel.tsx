import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown, User, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Bid {
  id: string;
  amount: number;
  buyer: {
    full_name: string;
    company_name?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface BiddingPanelProps {
  listingId: string;
  askingPrice: number;
  bids: Bid[];
  currentUserId?: string;
  onPlaceBid: (amount: number, message?: string) => void;
  isSubmitting?: boolean;
}

export function BiddingPanel({
  listingId,
  askingPrice,
  bids = [],
  currentUserId,
  onPlaceBid,
  isSubmitting = false
}: BiddingPanelProps) {
  const [bidAmount, setBidAmount] = useState(askingPrice);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : 0;
  const userHasBid = bids.some(b => b.buyer && currentUserId && b.buyer.full_name === currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceBid(bidAmount, message);
    setMessage("");
    setShowForm(false);
  };

  const quickBidOptions = [
    { label: 'Accept Price', amount: askingPrice, variant: 'primary' },
    { label: '-5%', amount: askingPrice * 0.95, variant: 'secondary' },
    { label: '-10%', amount: askingPrice * 0.90, variant: 'secondary' },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-4 sm:space-y-6 texture-grain">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg">Bidding</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Current Price Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-primary">
            ₱{askingPrice.toLocaleString()}
          </p>
        </div>
        {highestBid > 0 && (
          <div className="p-3 sm:p-4 bg-accent/5 border border-accent/20 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Highest Bid</p>
            <p className="text-lg sm:text-xl font-mono font-bold text-accent">
              ₱{highestBid.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Quick Bid Buttons */}
      {!showForm && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Quick actions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickBidOptions.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBidAmount(Math.round(option.amount));
                  setShowForm(true);
                }}
                className={`
                  px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all
                  ${option.variant === 'primary'
                    ? 'bg-gradient-to-r from-forest-medium to-leaf-green text-white shadow-md hover:shadow-lg'
                    : 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20'
                  }
                `}
              >
                <div className="text-xs opacity-80 mb-0.5">{option.label}</div>
                <div className="font-mono text-sm">₱{Math.round(option.amount).toLocaleString()}</div>
              </motion.button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-2 text-sm text-primary hover:underline"
          >
            Or enter custom amount
          </button>
        </div>
      )}

      {/* Bid Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3 sm:space-y-4"
          >
            <div>
              <label htmlFor="bidAmount" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
                Your Bid Amount (₱)
              </label>
              <input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min="0"
                step="100"
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-base sm:text-lg"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {bidAmount > askingPrice && (
                    <span className="text-success-green flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{((bidAmount / askingPrice - 1) * 100).toFixed(1)}% above asking
                    </span>
                  )}
                  {bidAmount < askingPrice && (
                    <span className="text-warning-amber flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {((1 - bidAmount / askingPrice) * 100).toFixed(1)}% below asking
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
                Message (optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note for the producer..."
                rows={2}
                className="w-full px-3 sm:px-4 py-2 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Place Bid
                  </>
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-muted text-foreground rounded-xl font-medium text-sm sm:text-base hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Bid History */}
      {bids.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Bids</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bids.map((bid) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  p-2 sm:p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2
                  ${bid.status === 'accepted'
                    ? 'bg-success-green/5 border-success-green/20'
                    : bid.status === 'rejected'
                    ? 'bg-muted border-border opacity-60'
                    : 'bg-card border-border'
                  }
                `}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-forest-medium to-leaf-green rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {bid.buyer?.company_name || bid.buyer?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bid.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <p className="font-mono font-semibold text-xs sm:text-base">₱{bid.amount.toLocaleString()}</p>
                  {bid.status === 'accepted' && (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success-green flex-shrink-0" />
                  )}
                  {bid.status === 'rejected' && (
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
