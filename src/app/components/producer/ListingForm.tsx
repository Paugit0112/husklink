import { useState } from "react";
import { motion } from "motion/react";
import { Truck, Home, MapPin, FileText, DollarSign, Calendar } from "lucide-react";

type LogisticsType = 'farm_pickup' | 'road_hauled';

interface ListingFormData {
  title: string;
  description: string;
  askingPrice: number;
  logisticsType: LogisticsType;
  address: string;
  expiresInDays: number;
}

interface ListingFormProps {
  suggestedPrice?: number;
  initialAddress?: string;
  onSubmit: (data: ListingFormData) => void;
}

export function ListingForm({ suggestedPrice = 0, initialAddress = "", onSubmit }: ListingFormProps) {
  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    askingPrice: suggestedPrice,
    logisticsType: 'farm_pickup',
    address: initialAddress,
    expiresInDays: 7
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-card rounded-2xl border border-border texture-grain"
    >
      <h3 className="text-lg sm:text-xl">Create Listing</h3>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="title" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
            Listing Title
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Fresh Rice Husks - 1500kg Available"
              required
              className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the husk condition, storage method, and any other relevant details..."
            rows={3}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm"
          />
        </div>

        <div>
          <label htmlFor="address" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
            Farm Location Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Barangay San Jose, Cabanatuan City, Nueva Ecija"
              required
              className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs sm:text-sm text-foreground/80 mb-2 sm:mb-3 block">
            Logistics Option
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {[
              { value: 'farm_pickup', label: 'Farm Pickup', icon: Home, desc: 'Buyer collects from farm' },
              { value: 'road_hauled', label: 'Road Hauled', icon: Truck, desc: 'Ready at farm road' }
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = formData.logisticsType === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, logisticsType: option.value as LogisticsType })}
                  className={`
                    p-3 sm:p-4 rounded-xl border-2 transition-all text-left
                    ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-card'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="askingPrice" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
              Asking Price (₱)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                id="askingPrice"
                type="number"
                value={formData.askingPrice}
                onChange={(e) => setFormData({ ...formData, askingPrice: Number(e.target.value) })}
                placeholder="0"
                required
                min="0"
                step="100"
                className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
              />
            </div>
            {suggestedPrice > 0 && formData.askingPrice !== suggestedPrice && (
              <p className="text-xs text-muted-foreground mt-1">
                AI suggested: ₱{suggestedPrice.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="expiresInDays" className="text-xs sm:text-sm text-foreground/80 mb-2 block">
              Expires In (days)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <select
                id="expiresInDays"
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: Number(e.target.value) })}
                className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer text-sm"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
      >
        Publish Listing
      </motion.button>
    </motion.form>
  );
}
