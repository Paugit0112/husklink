import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";

// Auth Components
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";

// Shared Components
import { Navigation } from "./components/shared/Navigation";
import { Notification } from "./components/shared/NotificationBell";
import { NotificationToast } from "./components/shared/NotificationToast";

// Farmer Components
import { ImageUploader } from "./components/producer/ImageUploader";
import { AIProcessingStatus } from "./components/producer/AIProcessingStatus";
import { ListingForm } from "./components/producer/ListingForm";
import { MyListings } from "./components/producer/MyListings";

// Buyer Components
import { LiveMap } from "./components/buyer/LiveMap";
import { ListingCard } from "./components/buyer/ListingCard";
import { BiddingPanel } from "./components/buyer/BiddingPanel";
import { LogisticsToggle } from "./components/buyer/LogisticsToggle";
import { MyBids } from "./components/buyer/MyBids";

// Landing Components
import { PlatformStats } from "./components/landing/PlatformStats";

type UserRole = 'farmer' | 'buyer';
type LogisticsType = 'all' | 'farm_pickup' | 'road_hauled';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  farmName?: string;
  companyName?: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  location: { lat: number; lng: number };
  address: string;
  logistics_type: 'farm_pickup' | 'road_hauled';
  asking_price: number;
  ai_condition_score: number;
  ai_moisture_level: number;
  ai_estimated_weight_kg: number;
  image_url?: string;
  producer?: {
    full_name: string;
    farm_name?: string;
  };
}

// Mock data - All locations in Caraga region
const MOCK_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Premium Rice Husks - 1500kg',
    description: 'Freshly harvested rice husks from organic farm. Stored in dry conditions.',
    location: { lat: 8.9475, lng: 125.5406 },
    address: 'Brgy. Libertad, Butuan City, Agusan del Norte',
    logistics_type: 'farm_pickup',
    asking_price: 22500,
    ai_condition_score: 0.92,
    ai_moisture_level: 12.3,
    ai_estimated_weight_kg: 1500,
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    producer: { full_name: 'Juan Dela Cruz', farm_name: 'Green Valley Farm' }
  },
  {
    id: '2',
    title: 'Coconut Husks - Road Ready',
    description: 'Large quantity of coconut husks. Already hauled to farm road for easy pickup.',
    location: { lat: 9.0789, lng: 126.1986 },
    address: 'Brgy. Telaje, Tandag City, Surigao del Sur',
    logistics_type: 'road_hauled',
    asking_price: 18000,
    ai_condition_score: 0.85,
    ai_moisture_level: 15.8,
    ai_estimated_weight_kg: 1200,
    image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    producer: { full_name: 'Maria Santos', farm_name: 'Coco Paradise Farm' }
  },
  {
    id: '3',
    title: 'Mixed Agricultural Waste - 2000kg',
    description: 'Combination of rice and corn husks. Great for biomass energy production.',
    location: { lat: 8.6193, lng: 126.0472 },
    address: 'Brgy. Poblacion, Prosperidad, Agusan del Sur',
    logistics_type: 'farm_pickup',
    asking_price: 28000,
    ai_condition_score: 0.88,
    ai_moisture_level: 13.5,
    ai_estimated_weight_kg: 2000,
    image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
    producer: { full_name: 'Pedro Reyes', farm_name: 'Harvest Gold Farm' }
  }
];

const MOCK_BIDS = [
  {
    id: 'bid1',
    amount: 23000,
    buyer: { full_name: 'BioPower Inc.', company_name: 'BioPower Inc.' },
    status: 'pending' as const,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'bid2',
    amount: 22000,
    buyer: { full_name: 'EcoEnergy Corp.', company_name: 'EcoEnergy Corp.' },
    status: 'pending' as const,
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

const MOCK_FARMER_LISTINGS = [
  {
    id: 'prod1',
    title: 'Premium Rice Husks - 1500kg',
    description: 'Freshly harvested rice husks from organic farm. Stored in dry conditions.',
    address: 'Brgy. Libertad, Butuan City, Agusan del Norte',
    asking_price: 22500,
    ai_estimated_weight_kg: 1500,
    ai_condition_score: 0.92,
    ai_moisture_level: 12.3,
    logistics_type: 'farm_pickup' as const,
    status: 'active' as const,
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    bid_count: 3,
    highest_bid: 23500
  },
  {
    id: 'prod2',
    title: 'Coconut Husks Bulk - 2200kg',
    description: 'Large quantity available. Perfect for biomass energy.',
    address: 'Brgy. San Juan, Tandag City, Surigao del Sur',
    asking_price: 28000,
    ai_estimated_weight_kg: 2200,
    ai_condition_score: 0.88,
    ai_moisture_level: 14.1,
    logistics_type: 'road_hauled' as const,
    status: 'active' as const,
    image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 9).toISOString(),
    bid_count: 5,
    highest_bid: 29000
  },
  {
    id: 'prod3',
    title: 'Organic Rice Husks - 1200kg SOLD',
    description: 'Previously listed, now sold to BioPower Inc.',
    address: 'Brgy. Roxas, Bayugan City, Agusan del Sur',
    asking_price: 18000,
    ai_estimated_weight_kg: 1200,
    ai_condition_score: 0.85,
    ai_moisture_level: 13.5,
    logistics_type: 'farm_pickup' as const,
    status: 'sold' as const,
    image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    bid_count: 7,
    highest_bid: 19500
  }
];

const MOCK_MY_BIDS = [
  {
    id: 'mybid1',
    amount: 23000,
    status: 'pending' as const,
    message: 'Interested in this lot. Can pick up tomorrow.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    listing: {
      id: '1',
      title: 'Premium Rice Husks - 1500kg',
      address: 'Brgy. Libertad, Butuan City, Agusan del Norte',
      asking_price: 22500,
      ai_estimated_weight_kg: 1500,
      image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
      status: 'active'
    }
  },
  {
    id: 'mybid2',
    amount: 18500,
    status: 'accepted' as const,
    message: 'Looking forward to working with you!',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    listing: {
      id: '2',
      title: 'Coconut Husks - Road Ready',
      address: 'Brgy. Washington, Surigao City, Surigao del Norte',
      asking_price: 18000,
      ai_estimated_weight_kg: 1200,
      image_url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
      status: 'sold'
    }
  },
  {
    id: 'mybid3',
    amount: 25000,
    status: 'pending' as const,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    listing: {
      id: '3',
      title: 'Mixed Agricultural Waste - 2000kg',
      address: 'Brgy. Poblacion, Prosperidad, Agusan del Sur',
      asking_price: 28000,
      ai_estimated_weight_kg: 2000,
      image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
      status: 'active'
    }
  },
  {
    id: 'mybid4',
    amount: 15000,
    status: 'rejected' as const,
    message: 'This is below our budget. Best offer.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    listing: {
      id: '4',
      title: 'Organic Farm Waste - 1800kg',
      address: 'Brgy. San Jose, Dinagat, Dinagat Islands',
      asking_price: 21000,
      ai_estimated_weight_kg: 1800,
      image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
      status: 'active'
    }
  }
];

export default function App() {
  // Auth state
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(null);

  // App state
  const [currentView, setCurrentView] = useState('home');
  const [listings] = useState<Listing[]>(MOCK_LISTINGS);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [logisticsFilter, setLogisticsFilter] = useState<LogisticsType>('all');

  // Farmer state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [capturedAddress, setCapturedAddress] = useState<string>("");
  const aiResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((aiProcessing || aiResult) && aiResultRef.current) {
      aiResultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [aiProcessing, aiResult]);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [notificationToastData, setNotificationToastData] = useState({ title: '', message: '' });

  // Handlers
  const handleLogin = (email: string, password: string) => {
    // Mock login - in production, call Supabase auth
    toast.success('Login successful!');
    const role = email.includes('farmer') ? 'farmer' : 'buyer';

    setUser({
      id: '1',
      email,
      fullName: 'Demo User',
      role,
      companyName: role === 'buyer' ? 'Demo Company' : undefined,
      farmName: role === 'farmer' ? 'Demo Farm' : undefined
    });

    // Add mock notifications based on role
    if (role === 'buyer') {
      setNotifications([
        {
          id: '1',
          type: 'new_listing',
          title: 'New Husk Listing Available',
          message: 'Juan Dela Cruz posted Premium Rice Husks - 1500kg in Nueva Ecija',
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          read: false,
          data: { listingId: '1' }
        },
        {
          id: '2',
          type: 'new_listing',
          title: 'New Listing Near You',
          message: 'Maria Santos posted Coconut Husks - Road Ready in Laguna',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          read: false,
          data: { listingId: '2' }
        }
      ]);
    } else if (role === 'farmer') {
      setNotifications([
        {
          id: '3',
          type: 'new_bid',
          title: 'New Bid Received!',
          message: 'BioPower Inc. placed a bid of ₱23,000 on your Premium Rice Husks listing',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: false,
          data: { listingId: '1', amount: 23000 }
        },
        {
          id: '4',
          type: 'new_bid',
          title: 'New Bid Received!',
          message: 'EcoEnergy Corp. placed a bid of ₱29,000 on your Coconut Husks listing',
          timestamp: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
          read: false,
          data: { listingId: '2', amount: 29000 }
        },
        {
          id: '5',
          type: 'bid_accepted',
          title: 'Bid Accepted - Payment Pending',
          message: 'You accepted BioPower Inc.\'s bid of ₱18,500. Awaiting payment confirmation.',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: true,
          data: { listingId: '3', amount: 18500 }
        }
      ]);
    }
  };

  const handleRegister = (data: any) => {
    // Mock registration - in production, call Supabase auth
    toast.success('Account created successfully!');
    setUser({
      id: '1',
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      farmName: data.farmName,
      companyName: data.companyName
    });

    // Add welcome notification
    const welcomeNotification: Notification = {
      id: 'welcome',
      type: data.role === 'buyer' ? 'new_listing' : 'new_bid',
      title: 'Welcome to HuskLink!',
      message: `Your ${data.role} account has been created successfully. ${
        data.role === 'farmer'
          ? 'Start by uploading your first husk listing!'
          : 'Browse available listings on the map!'
      }`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications([welcomeNotification]);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
    setNotifications([]);
    toast.info('Logged out successfully');
  };

  // Notification handlers
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type and user role
    if (notification.type === 'new_listing' && user?.role === 'buyer') {
      setCurrentView('map');
    } else if ((notification.type === 'new_bid' || notification.type === 'bid_accepted') && user?.role === 'farmer') {
      setCurrentView('my-listings');
    } else if (notification.type === 'bid_accepted' && user?.role === 'buyer') {
      setCurrentView('my-bids');
    }
  };

  const handleImageUpload = async (file: File, location: { lat: number; lng: number } | null, address: string | null) => {
    setUploadedImage(file);
    if (address) setCapturedAddress(address);
    setAiProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      setAiResult({
        condition_score: 0.85,
        moisture_level: 12.5,
        estimated_weight_kg: 1500,
        suggested_price: 22500
      });
      setAiProcessing(false);
      toast.success('AI analysis complete!');
    }, 3000);
  };

  const handleCreateListing = (data: any) => {
    // Mock listing creation - in production, call Supabase
    toast.success('Listing published successfully!');

    // Notify all buyers about new listing (in production, this would be done server-side)
    if (user?.role === 'farmer') {
      // Simulate notification to buyers
      setTimeout(() => {
        setNotificationToastData({
          title: '🔔 Buyers Notified!',
          message: `All buyers in ${data.address.split(',').pop()?.trim()} region have been notified about your new listing!`
        });
        setShowNotificationToast(true);
      }, 1000);
    }

    setUploadedImage(null);
    setAiResult(null);
    setCapturedAddress("");
    setCurrentView('my-listings');
  };

  const handlePlaceBid = (listingId: string, amount: number, message?: string) => {
    // Mock bid placement - in production, call Supabase
    toast.success(`Bid of ₱${amount.toLocaleString()} placed successfully!`);

    // Notify the farmer about the new bid (in production, this would be done server-side)
    if (user?.role === 'buyer') {
      const listing = listings.find(l => l.id === listingId);
      if (listing) {
        // In production, this notification would be sent to the farmer's account
        setTimeout(() => {
          setNotificationToastData({
            title: '🔔 Farmer Notified!',
            message: `${listing.producer?.farm_name || listing.producer?.full_name || 'The farmer'} has been notified about your ₱${amount.toLocaleString()} bid!`
          });
          setShowNotificationToast(true);
        }, 500);
      }
    }
  };

  const filteredListings = listings.filter(listing => {
    if (logisticsFilter === 'all') return true;
    return listing.logistics_type === logisticsFilter;
  });

  // Auth screen
  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-gradient-to-br from-off-white via-cream to-leaf-green/5">
          <div className="w-full max-w-6xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-leaf-green to-forest-medium rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-forest-dark via-forest-medium to-leaf-green bg-clip-text text-transparent">
                HuskLink
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AI-Powered Agricultural Waste Marketplace
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Connecting farmers with biomass energy producers for a sustainable future
              </p>
            </motion.div>

            {/* Auth Forms */}
            <div className="flex items-center justify-center">
              <AnimatePresence mode="wait">
                {authView === 'login' ? (
                  <LoginForm
                    key="login"
                    onLogin={handleLogin}
                    onSwitchToRegister={() => setAuthView('register')}
                  />
                ) : (
                  <RegisterForm
                    key="register"
                    onRegister={handleRegister}
                    onSwitchToLogin={() => setAuthView('login')}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main app
  return (
    <>
      <Toaster position="top-right" richColors />
      <NotificationToast
        show={showNotificationToast}
        title={notificationToastData.title}
        message={notificationToastData.message}
        onClose={() => setShowNotificationToast(false)}
      />
      <div className="min-h-screen bg-background">
      <Navigation
        role={user.role}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        userName={user.fullName}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onNotificationClick={handleNotificationClick}
      />

      <main>
        <AnimatePresence mode="wait">
          {/* Home View - Available to All Roles */}
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="bg-gradient-to-br from-off-white via-cream to-leaf-green/5 py-16 px-6 min-h-[calc(100vh-80px)]">
                <div className="max-w-7xl mx-auto text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-forest-dark via-forest-medium to-leaf-green bg-clip-text text-transparent">
                    Welcome to HuskLink
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                    Transforming agricultural waste into sustainable energy opportunities across the Philippines
                  </p>
                </div>

                <PlatformStats
                  listings={listings}
                  onListingClick={(listing) => {
                    setSelectedListing(listing);
                    if (user.role === 'buyer') {
                      setCurrentView('map');
                    } else if (user.role === 'farmer') {
                      setCurrentView('dashboard');
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Farmer Views */}
          {user.role === 'farmer' && currentView === 'dashboard' && (
            <motion.div
              key="farmer-dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto p-6 space-y-8"
            >
              <div>
                <h2 className="text-3xl mb-2">Sell Your Agricultural Waste</h2>
                <p className="text-muted-foreground">
                  Upload a photo of your husk pile and let our AI estimate its value
                </p>
              </div>

              <ImageUploader
                onImageUpload={handleImageUpload}
                isProcessing={aiProcessing}
              />

              {(aiProcessing || aiResult) && (
                <div ref={aiResultRef}>
                  <AIProcessingStatus result={aiResult} isProcessing={aiProcessing} />
                </div>
              )}

              {aiResult && !aiProcessing && (
                <ListingForm
                  suggestedPrice={aiResult.suggested_price}
                  initialAddress={capturedAddress}
                  onSubmit={handleCreateListing}
                />
              )}
            </motion.div>
          )}

          {user.role === 'farmer' && currentView === 'my-listings' && (
            <motion.div
              key="farmer-my-listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto p-6 space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2">My Listings</h2>
                <p className="text-muted-foreground">
                  Manage your active and past listings
                </p>
              </div>

              <MyListings
                listings={MOCK_FARMER_LISTINGS}
                onViewBids={(listingId) => {
                  toast.info('Viewing bids for listing ' + listingId);
                }}
                onEdit={(listingId) => {
                  toast.info('Edit functionality coming soon!');
                }}
                onDelete={(listingId) => {
                  toast.info('Delete functionality coming soon!');
                }}
              />
            </motion.div>
          )}

          {/* Buyer Views */}
          {user.role === 'buyer' && currentView === 'map' && (
            <motion.div
              key="buyer-map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-[calc(100vh-80px)] relative"
            >
              {/* Header Bar */}
              <div className="absolute top-0 left-0 right-0 z-[900] bg-white/95 backdrop-blur-sm border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl mb-2">Live Map</h2>
                    <p className="text-muted-foreground">
                      Browse available listings on the map
                    </p>
                  </div>
                  <LogisticsToggle value={logisticsFilter} onChange={setLogisticsFilter} />
                </div>
              </div>

              {/* Full Width Map */}
              <div className="w-full h-full pt-[100px]">
                <LiveMap
                  listings={filteredListings}
                  onListingClick={setSelectedListing}
                />
              </div>

              {/* Sidebar for Selected Listing */}
              {selectedListing && (
                <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  className="absolute top-[100px] right-0 bottom-0 w-[400px] bg-white border-l border-border shadow-2xl overflow-y-auto z-[900]"
                >
                  <div className="p-6 space-y-6">
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      ✕
                    </button>
                    <ListingCard
                      listing={selectedListing}
                      onPlaceBid={() => {}}
                    />
                    <BiddingPanel
                      listingId={selectedListing.id}
                      askingPrice={selectedListing.asking_price}
                      bids={MOCK_BIDS}
                      onPlaceBid={(amount, message) => handlePlaceBid(selectedListing.id, amount, message)}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {user.role === 'buyer' && currentView === 'listings' && (
            <motion.div
              key="buyer-listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl mb-2">All Listings</h2>
                  <p className="text-muted-foreground">
                    {filteredListings.length} available listings
                  </p>
                </div>
                <LogisticsToggle value={logisticsFilter} onChange={setLogisticsFilter} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onPlaceBid={(id) => setSelectedListing(listing)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {user.role === 'buyer' && currentView === 'my-bids' && (
            <motion.div
              key="buyer-my-bids"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto p-6 space-y-6"
            >
              <div>
                <h2 className="text-3xl mb-2">My Bids</h2>
                <p className="text-muted-foreground">
                  Track all your bids and their status
                </p>
              </div>

              <MyBids
                bids={MOCK_MY_BIDS}
                onViewListing={(listingId) => {
                  const listing = listings.find(l => l.id === listingId);
                  if (listing) {
                    setSelectedListing(listing);
                    setCurrentView('map');
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </>
  );
}