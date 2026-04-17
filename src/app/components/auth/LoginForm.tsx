import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight } from "lucide-react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full max-w-md px-4 sm:px-0"
    >
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl mb-1 sm:mb-2">Welcome Back</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Sign in to access your HuskLink dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs sm:text-sm text-foreground/80">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@example.com"
              required
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs sm:text-sm text-foreground/80">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
        >
          Sign In
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <button
          onClick={onSwitchToRegister}
          className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Don't have an account? <span className="font-medium underline">Create one</span>
        </button>
      </div>

      {/* Quick Demo Login */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center mb-2 sm:mb-3">Quick Demo Login</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setEmail('farmer@demo.com');
              setPassword('demo123');
              onLogin('farmer@demo.com', 'demo123');
            }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-leaf-green/10 hover:bg-leaf-green/20 border border-leaf-green/30 rounded-lg text-xs sm:text-sm font-medium text-forest-dark transition-colors"
          >
            🌾 Farmer
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('buyer@demo.com');
              setPassword('demo123');
              onLogin('buyer@demo.com', 'demo123');
            }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-biomass-brown/10 hover:bg-biomass-brown/20 border border-biomass-brown/30 rounded-lg text-xs sm:text-sm font-medium text-forest-dark transition-colors"
          >
            🏭 Buyer
          </button>
        </div>
      </div>
    </motion.div>
  );
}
