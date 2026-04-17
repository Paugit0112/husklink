import { motion } from "motion/react";
import { Home, MapPin, User, LogOut, Sprout } from "lucide-react";
import { NotificationBell, Notification } from "./NotificationBell";

type UserRole = 'farmer' | 'buyer';

interface NavigationProps {
  role: UserRole;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userName?: string;
  notifications?: Notification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onClearAllNotifications?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function Navigation({
  role,
  currentView,
  onNavigate,
  onLogout,
  userName,
  notifications = [],
  onMarkNotificationRead = () => {},
  onMarkAllNotificationsRead = () => {},
  onClearAllNotifications = () => {},
  onNotificationClick = () => {}
}: NavigationProps) {
  // Common home item for all roles
  const homeItem = { id: 'home', label: 'Home', icon: Home };

  const menuItems = {
    farmer: [
      homeItem,
      { id: 'dashboard', label: 'Sell Husks', icon: Sprout },
      { id: 'my-listings', label: 'My Listings', icon: Sprout }
    ],
    buyer: [
      homeItem,
      { id: 'map', label: 'Map View', icon: MapPin },
      { id: 'listings', label: 'All Listings', icon: Sprout },
      { id: 'my-bids', label: 'My Bids', icon: User }
    ]
  };

  const items = menuItems[role];

  return (
    <nav className="bg-sidebar border-b border-sidebar-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-leaf-green to-forest-medium rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">HuskLink</h1>
              <p className="text-xs text-sidebar-foreground/60">Agricultural Waste Marketplace</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex items-center gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                    ${isActive
                      ? 'text-white'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-forest-medium to-leaf-green rounded-xl"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkNotificationRead}
              onMarkAllAsRead={onMarkAllNotificationsRead}
              onClearAll={onClearAllNotifications}
              onNotificationClick={onNotificationClick}
            />

            {userName && (
              <div className="text-right">
                <p className="text-sm font-medium text-sidebar-foreground">{userName}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
              </div>
            )}
            <motion.button
              onClick={onLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-sidebar-foreground" />
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
