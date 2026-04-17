import { motion } from "motion/react";
import { Home, Truck, Filter } from "lucide-react";

type LogisticsType = 'all' | 'farm_pickup' | 'road_hauled';

interface LogisticsToggleProps {
  value: LogisticsType;
  onChange: (value: LogisticsType) => void;
}

export function LogisticsToggle({ value, onChange }: LogisticsToggleProps) {
  const options = [
    { value: 'all' as LogisticsType, label: 'All Listings', icon: Filter },
    { value: 'farm_pickup' as LogisticsType, label: 'Farm Pickup', icon: Home },
    { value: 'road_hauled' as LogisticsType, label: 'Road Hauled', icon: Truck }
  ];

  return (
    <div className="inline-flex bg-muted rounded-xl p-1 gap-1">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;

        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2
              ${isActive
                ? 'text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="activeToggle"
                className="absolute inset-0 bg-gradient-to-r from-forest-medium to-leaf-green rounded-lg"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
