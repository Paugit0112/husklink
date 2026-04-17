import { motion } from "motion/react";
import { CheckCircle2, Droplets, Weight, TrendingUp, Sparkles } from "lucide-react";

interface AIResult {
  condition_score: number;
  moisture_level: number;
  estimated_weight_kg: number;
  suggested_price: number;
}

interface AIProcessingStatusProps {
  result: AIResult | null;
  isProcessing: boolean;
}

export function AIProcessingStatus({ result, isProcessing }: AIProcessingStatusProps) {
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-primary/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
          </div>
          <h3 className="text-lg">AI Analysis in Progress...</h3>
        </div>
        <div className="space-y-2">
          {['Analyzing husk condition', 'Measuring moisture levels', 'Estimating weight', 'Calculating market price'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {step}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const metrics = [
    {
      icon: CheckCircle2,
      label: 'Condition Score',
      value: `${(result.condition_score * 100).toFixed(0)}%`,
      color: 'text-success-green',
      bgColor: 'bg-success-green/10'
    },
    {
      icon: Droplets,
      label: 'Moisture Level',
      value: `${result.moisture_level.toFixed(1)}%`,
      color: 'text-[#2196f3]',
      bgColor: 'bg-[#2196f3]/10'
    },
    {
      icon: Weight,
      label: 'Est. Weight',
      value: `${result.estimated_weight_kg.toLocaleString()} kg`,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      icon: TrendingUp,
      label: 'Suggested Price',
      value: `₱${result.suggested_price.toLocaleString()}`,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg">AI Analysis Complete</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-card rounded-xl border border-border texture-grain"
            >
              <div className={`w-10 h-10 ${metric.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className={`font-mono ${metric.color}`}>{metric.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">AI Recommendation:</span> Based on current market conditions
          and husk quality, we suggest listing at ₱{result.suggested_price.toLocaleString()}. You can adjust this
          price in the listing form below.
        </p>
      </div>
    </motion.div>
  );
}
