import { motion } from "motion/react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Package, DollarSign, Users, Activity } from "lucide-react";

interface AnalyticsData {
  dailyData: Array<{
    date: string;
    volume_kg: number;
    value: number;
    transactions: number;
  }>;
  totalStats: {
    totalVolume: number;
    totalValue: number;
    avgPricePerKg: number;
    totalListings: number;
    totalTransactions: number;
    activeProducers: number;
    activeBuyers: number;
  };
  logisticsBreakdown: Array<{
    name: string;
    value: number;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const stats = [
    {
      icon: Package,
      label: 'Total Volume',
      value: `${(data.totalStats.totalVolume / 1000).toFixed(1)}t`,
      subtext: `${data.totalStats.totalListings} listings`,
      color: 'text-leaf-green',
      bgColor: 'bg-leaf-green/10'
    },
    {
      icon: DollarSign,
      label: 'Total Value',
      value: `₱${(data.totalStats.totalValue / 1000000).toFixed(2)}M`,
      subtext: `${data.totalStats.totalTransactions} transactions`,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: TrendingUp,
      label: 'Avg Price',
      value: `₱${data.totalStats.avgPricePerKg.toFixed(2)}`,
      subtext: 'per kilogram',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      icon: Users,
      label: 'Active Users',
      value: `${data.totalStats.activeProducers + data.totalStats.activeBuyers}`,
      subtext: `${data.totalStats.activeProducers}P / ${data.totalStats.activeBuyers}B`,
      color: 'text-forest-medium',
      bgColor: 'bg-forest-medium/10'
    }
  ];

  const COLORS = ['#4a7c2e', '#7cb342', '#8b4513', '#d2b48c'];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-card rounded-2xl border border-border texture-grain hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono mb-1 ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.subtext}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 p-6 bg-card rounded-2xl border border-border texture-grain"
        >
          <h3 className="text-lg mb-4">Volume & Revenue Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 124, 46, 0.1)" />
              <XAxis
                dataKey="date"
                stroke="#8a8175"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#8a8175"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(74, 124, 46, 0.2)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="volume_kg"
                stroke="#7cb342"
                strokeWidth={2}
                name="Volume (kg)"
                dot={{ fill: '#7cb342', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4a7c2e"
                strokeWidth={2}
                name="Revenue (₱)"
                dot={{ fill: '#4a7c2e', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Logistics Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-card rounded-2xl border border-border texture-grain"
        >
          <h3 className="text-lg mb-4">Logistics Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.logisticsBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.logisticsBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(74, 124, 46, 0.2)',
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Transaction Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 bg-card rounded-2xl border border-border texture-grain"
      >
        <h3 className="text-lg mb-4">Daily Transactions</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 124, 46, 0.1)" />
            <XAxis
              dataKey="date"
              stroke="#8a8175"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#8a8175"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(74, 124, 46, 0.2)',
                borderRadius: '12px',
                padding: '12px'
              }}
            />
            <Bar dataKey="transactions" fill="#8b4513" radius={[8, 8, 0, 0]} name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
