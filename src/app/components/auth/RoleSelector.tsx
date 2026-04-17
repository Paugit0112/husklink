import { motion } from "motion/react";
import { Sprout, Factory } from "lucide-react";

type UserRole = 'farmer' | 'buyer';

interface RoleSelectorProps {
  onSelectRole: (role: UserRole) => void;
  selectedRole?: UserRole;
}

export function RoleSelector({ onSelectRole, selectedRole }: RoleSelectorProps) {
  const roles = [
    {
      id: 'farmer' as UserRole,
      title: 'Farmer',
      description: 'I grow rice/coconut and have agricultural waste to sell',
      icon: Sprout,
      gradient: 'from-leaf-green to-forest-medium'
    },
    {
      id: 'buyer' as UserRole,
      title: 'Buyer',
      description: 'I need biomass for energy production',
      icon: Factory,
      gradient: 'from-biomass-brown to-earth-tan'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      {roles.map((role, index) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;

        return (
          <motion.button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-8 rounded-2xl border-2 transition-all duration-300
              texture-grain overflow-hidden group
              ${isSelected
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50 bg-card'
              }
            `}
          >
            {/* Gradient overlay on hover */}
            <div className={`
              absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
              bg-gradient-to-br ${role.gradient}
            `} />

            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <div className={`
                p-4 rounded-xl bg-gradient-to-br ${role.gradient}
                transform group-hover:scale-110 transition-transform duration-300
              `}>
                <Icon className="w-8 h-8 text-white" strokeWidth={2} />
              </div>

              <div>
                <h3 className="text-xl mb-2">{role.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {role.description}
                </p>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
