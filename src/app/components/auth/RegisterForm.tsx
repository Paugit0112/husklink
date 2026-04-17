import { useState } from "react";
import { motion } from "motion/react";
import { Mail, Lock, User, Phone, Building2, MapPin, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { RoleSelector } from "./RoleSelector";

type UserRole = 'farmer' | 'buyer';

interface RegisterFormProps {
  onRegister: (data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    phone?: string;
    address?: string;
    farmName?: string;
    companyName?: string;
  }) => void;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onRegister, onSwitchToLogin, isLoading = false, error }: RegisterFormProps) {
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: undefined as UserRole | undefined,
    phone: "",
    address: "",
    farmName: "",
    companyName: ""
  });

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role });
    setStep('details');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) return;
    onRegister(formData as any);
  };

  if (step === 'role') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center px-4 sm:px-0"
      >
        <div className="mb-8 sm:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl mb-2 sm:mb-3">Join HuskLink</h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl">
            Select your role to get started with agricultural waste monetization
          </p>
        </div>

        <RoleSelector
          onSelectRole={handleRoleSelect}
          selectedRole={formData.role}
        />

        <button
          onClick={onSwitchToLogin}
          className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Already have an account? <span className="font-medium underline">Sign in</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-md px-4 sm:px-0"
    >
      <button
        onClick={() => setStep('role')}
        className="mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        ← Back to role selection
      </button>

      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl mb-1 sm:mb-2">Complete Your Profile</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create your {formData.role} account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-xs sm:text-sm text-foreground/80">
            Full Name
          </label>
          <div className="relative group">
            <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Juan Dela Cruz"
              required
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-xs sm:text-sm text-foreground/80">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="farmer@example.com"
              required
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-xs sm:text-sm text-foreground/80">
            Phone Number
          </label>
          <div className="relative group">
            <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+63 912 345 6789"
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="text-xs sm:text-sm text-foreground/80">
            Address
          </label>
          <div className="relative group">
            <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Barangay, Municipality, Province"
              required
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        {formData.role === 'farmer' && (
          <div className="space-y-2">
            <label htmlFor="farmName" className="text-xs sm:text-sm text-foreground/80">
              Farm Name
            </label>
            <div className="relative group">
              <Building2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                id="farmName"
                type="text"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                placeholder="Green Valley Farm"
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        {formData.role === 'buyer' && (
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-xs sm:text-sm text-foreground/80">
              Company Name
            </label>
            <div className="relative group">
              <Building2 className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                id="companyName"
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="BioPower Industries"
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs sm:text-sm text-foreground/80">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 sm:py-3.5 bg-gradient-to-r from-forest-medium to-leaf-green text-white rounded-xl font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group mt-4 sm:mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
          ) : (
            <>Create Account <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
