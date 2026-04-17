import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
import { Loader2 } from "lucide-react";

// Supabase
import { supabase } from "../lib/supabase";
import {
  signIn, signUp, signOut,
  uploadHuskImage, processAIImage,
  fetchActiveListings, fetchMyListings, createListing, deleteListing,
  fetchListingBids, fetchMyBids, placeBid,
  subscribeToListingBids, subscribeToFarmerBids,
} from "../lib/api";
import type { Profile, Listing, Bid, AIResult, LogisticsType } from "../lib/types";

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

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);  // resolves once session checked
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('home');

  // ── Listings (buyer) ──────────────────────────────────────────────────────
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [logisticsFilter, setLogisticsFilter] = useState<LogisticsType | 'all'>('all');

  // ── Bids ──────────────────────────────────────────────────────────────────
  const [listingBids, setListingBids] = useState<Bid[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [bidSubmitting, setBidSubmitting] = useState(false);

  // ── My Listings (farmer) ──────────────────────────────────────────────────
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myListingsLoading, setMyListingsLoading] = useState(false);

  // ── Farmer upload flow ────────────────────────────────────────────────────
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [capturedAddress, setCapturedAddress] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const aiResultRef = useRef<HTMLDivElement>(null);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [notificationToastData, setNotificationToastData] = useState({ title: '', message: '' });

  // ── Helper: add notification ──────────────────────────────────────────────
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => [{
      ...notification,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      read: false,
    }, ...prev]);
  }, []);

  // ── Auto-scroll to AI result ──────────────────────────────────────────────
  useEffect(() => {
    if ((aiProcessing || aiResult) && aiResultRef.current) {
      aiResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [aiProcessing, aiResult]);

  // ── Auth state listener ───────────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            setUser(data as Profile);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data when user changes ───────────────────────────────────────────
  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const data = await fetchActiveListings(logisticsFilter);
      setListings(data);
    } catch (err) {
      toast.error('Failed to load listings');
    } finally {
      setListingsLoading(false);
    }
  }, [logisticsFilter]);

  const loadMyListings = useCallback(async () => {
    if (!user || user.role !== 'farmer') return;
    setMyListingsLoading(true);
    try {
      const data = await fetchMyListings(user.id);
      setMyListings(data);
    } catch {
      toast.error('Failed to load your listings');
    } finally {
      setMyListingsLoading(false);
    }
  }, [user]);

  const loadMyBids = useCallback(async () => {
    if (!user || user.role !== 'buyer') return;
    try {
      const data = await fetchMyBids(user.id);
      setMyBids(data);
    } catch {
      toast.error('Failed to load your bids');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadListings();
    if (user.role === 'farmer') loadMyListings();
    if (user.role === 'buyer') loadMyBids();
  }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Reload listings when logistics filter changes
  useEffect(() => {
    if (user) loadListings();
  }, [logisticsFilter]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch bids for selected listing ──────────────────────────────────────
  useEffect(() => {
    if (!selectedListing) {
      setListingBids([]);
      return;
    }

    fetchListingBids(selectedListing.id)
      .then(setListingBids)
      .catch(() => toast.error('Failed to load bids'));

    const unsubscribe = subscribeToListingBids(selectedListing.id, (newBid) => {
      setListingBids(prev => [newBid, ...prev]);
    });
    return unsubscribe;
  }, [selectedListing?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Farmer real-time bid notifications ────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== 'farmer') return;

    const unsubscribe = subscribeToFarmerBids(user.id, (bid, listingTitle) => {
      const buyerName = bid.buyer?.company_name || bid.buyer?.full_name || 'A buyer';
      addNotification({
        type: 'new_bid',
        title: 'New Bid Received!',
        message: `${buyerName} placed a bid of ₱${bid.amount.toLocaleString()} on "${listingTitle}"`,
        data: { listingId: bid.listing_id, amount: bid.amount },
      });
      setNotificationToastData({
        title: 'New Bid!',
        message: `${buyerName} offered ₱${bid.amount.toLocaleString()} on "${listingTitle}"`,
      });
      setShowNotificationToast(true);
      loadMyListings();
    });

    return unsubscribe;
  }, [user?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string) => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const profile = await signIn(email, password);
      setUser(profile);
      toast.success(`Welcome back, ${profile.full_name}!`);
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegister = async (data: {
    email: string; password: string; fullName: string;
    role: 'farmer' | 'buyer'; phone?: string; farmName?: string; companyName?: string;
  }) => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const profile = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
        farmName: data.farmName,
        companyName: data.companyName,
      });
      setUser(profile);
      toast.success('Account created! Welcome to HuskLink.');
      addNotification({
        type: data.role === 'buyer' ? 'new_listing' : 'new_bid',
        title: 'Welcome to HuskLink!',
        message: data.role === 'farmer'
          ? 'Start by uploading your first husk listing!'
          : 'Browse available listings on the map!',
      });
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentView('home');
    setListings([]);
    setMyListings([]);
    setMyBids([]);
    setNotifications([]);
    setAiResult(null);
    setUploadedImageUrl(null);
    toast.info('Logged out successfully');
  };

  // ── Notification handlers ─────────────────────────────────────────────────
  const handleMarkNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleMarkAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleClearAllNotifications = () => setNotifications([]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'new_listing' && user?.role === 'buyer') setCurrentView('map');
    else if (notification.type === 'new_bid' && user?.role === 'farmer') setCurrentView('my-listings');
    else if (notification.type === 'bid_accepted' && user?.role === 'buyer') setCurrentView('my-bids');
  };

  // ── Farmer: image upload → AI ─────────────────────────────────────────────
  const handleImageUpload = async (
    file: File,
    location: { lat: number; lng: number } | null,
    address: string | null
  ) => {
    if (!user) return;

    setAiProcessing(true);
    setAiResult(null);
    if (location) setCapturedLocation(location);
    if (address) setCapturedAddress(address);

    try {
      const imageUrl = await uploadHuskImage(file, user.id);
      setUploadedImageUrl(imageUrl);

      const result = await processAIImage(imageUrl);
      setAiResult(result);
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error('Failed to process image: ' + (err as Error).message);
      setAiResult(null);
    } finally {
      setAiProcessing(false);
    }
  };

  // ── Farmer: create listing ────────────────────────────────────────────────
  const handleCreateListing = async (formData: any) => {
    if (!user || !uploadedImageUrl || !aiResult) return;

    try {
      await createListing({
        producerId: user.id,
        imageUrl: uploadedImageUrl,
        lat: capturedLocation?.lat ?? null,
        lng: capturedLocation?.lng ?? null,
        aiResult,
        formData,
      });
      toast.success('Listing published successfully!');
      setNotificationToastData({
        title: 'Listing Published!',
        message: `Your listing is now live on the marketplace.`,
      });
      setShowNotificationToast(true);
      // Reset upload flow
      setUploadedImageUrl(null);
      setCapturedLocation(null);
      setCapturedAddress('');
      setAiResult(null);
      setCurrentView('my-listings');
      loadMyListings();
      loadListings();
    } catch (err) {
      toast.error('Failed to publish listing: ' + (err as Error).message);
    }
  };

  // ── Farmer: delete listing ────────────────────────────────────────────────
  const handleDeleteListing = async (listingId: string) => {
    try {
      await deleteListing(listingId);
      toast.success('Listing deleted');
      setMyListings(prev => prev.filter(l => l.id !== listingId));
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  // ── Buyer: place bid ──────────────────────────────────────────────────────
  const handlePlaceBid = async (listingId: string, amount: number, message?: string) => {
    if (!user) return;
    setBidSubmitting(true);
    try {
      const newBid = await placeBid(listingId, user.id, amount, message);
      setListingBids(prev => [newBid, ...prev]);
      toast.success(`Bid of ₱${amount.toLocaleString()} placed!`);
      loadMyBids();
    } catch (err) {
      toast.error('Failed to place bid: ' + (err as Error).message);
    } finally {
      setBidSubmitting(false);
    }
  };

  const filteredListings = logisticsFilter === 'all'
    ? listings
    : listings.filter(l => l.logistics_type === logisticsFilter);

  // ── Loading screen while checking session ─────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Auth screen ───────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-gradient-to-br from-off-white via-cream to-leaf-green/5">
          <div className="w-full max-w-6xl mx-auto px-6 py-12">
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

            <div className="flex items-center justify-center">
              <AnimatePresence mode="wait">
                {authView === 'login' ? (
                  <LoginForm
                    key="login"
                    onLogin={handleLogin}
                    onSwitchToRegister={() => { setAuthView('register'); setAuthError(null); }}
                    isLoading={authSubmitting}
                    error={authError}
                  />
                ) : (
                  <RegisterForm
                    key="register"
                    onRegister={handleRegister}
                    onSwitchToLogin={() => { setAuthView('login'); setAuthError(null); }}
                    isLoading={authSubmitting}
                    error={authError}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
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
          userName={user.full_name}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onNotificationClick={handleNotificationClick}
        />

        <main>
          <AnimatePresence mode="wait">
            {/* ── Home ─────────────────────────────────────────────────── */}
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
                      setCurrentView(user.role === 'buyer' ? 'map' : 'dashboard');
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Farmer: Dashboard ─────────────────────────────────────── */}
            {user.role === 'farmer' && currentView === 'dashboard' && (
              <motion.div
                key="farmer-dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8"
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

            {/* ── Farmer: My Listings ───────────────────────────────────── */}
            {user.role === 'farmer' && currentView === 'my-listings' && (
              <motion.div
                key="farmer-my-listings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
              >
                <div>
                  <h2 className="text-3xl mb-2">My Listings</h2>
                  <p className="text-muted-foreground">Manage your active and past listings</p>
                </div>

                {myListingsLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <MyListings
                    listings={myListings}
                    onViewBids={(listingId) => {
                      const listing = myListings.find(l => l.id === listingId);
                      if (listing) { setSelectedListing(listing); setCurrentView('map'); }
                    }}
                    onEdit={() => toast.info('Edit functionality coming soon!')}
                    onDelete={handleDeleteListing}
                  />
                )}
              </motion.div>
            )}

            {/* ── Buyer: Map ────────────────────────────────────────────── */}
            {user.role === 'buyer' && currentView === 'map' && (
              <motion.div
                key="buyer-map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full h-[calc(100vh-80px)] relative"
              >
                <div className="absolute top-0 left-0 right-0 z-[900] bg-white/95 backdrop-blur-sm border-b border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl mb-2">Live Map</h2>
                      <p className="text-muted-foreground">Browse available listings on the map</p>
                    </div>
                    <LogisticsToggle value={logisticsFilter} onChange={setLogisticsFilter} />
                  </div>
                </div>

                <div className="w-full h-full pt-[100px]">
                  {listingsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <LiveMap listings={filteredListings} onListingClick={setSelectedListing} />
                  )}
                </div>

                {selectedListing && (
                  <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className="absolute top-[100px] right-0 bottom-0 w-full sm:w-[400px] bg-white border-l border-border shadow-2xl overflow-y-auto z-[900]"
                  >
                    <div className="p-6 space-y-6">
                      <button
                        onClick={() => setSelectedListing(null)}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        ✕
                      </button>
                      <ListingCard listing={selectedListing} onPlaceBid={() => {}} />
                      <BiddingPanel
                        listingId={selectedListing.id}
                        askingPrice={selectedListing.asking_price}
                        bids={listingBids}
                        currentUserId={user.id}
                        isSubmitting={bidSubmitting}
                        onPlaceBid={(amount, message) =>
                          handlePlaceBid(selectedListing.id, amount, message)
                        }
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Buyer: All Listings ───────────────────────────────────── */}
            {user.role === 'buyer' && currentView === 'listings' && (
              <motion.div
                key="buyer-listings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl mb-2">All Listings</h2>
                    <p className="text-muted-foreground">{filteredListings.length} available listings</p>
                  </div>
                  <LogisticsToggle value={logisticsFilter} onChange={setLogisticsFilter} />
                </div>

                {listingsLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map(listing => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        onPlaceBid={() => setSelectedListing(listing)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Buyer: My Bids ────────────────────────────────────────── */}
            {user.role === 'buyer' && currentView === 'my-bids' && (
              <motion.div
                key="buyer-my-bids"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6"
              >
                <div>
                  <h2 className="text-3xl mb-2">My Bids</h2>
                  <p className="text-muted-foreground">Track all your bids and their status</p>
                </div>
                <MyBids
                  bids={myBids}
                  onViewListing={(listingId) => {
                    const listing = listings.find(l => l.id === listingId);
                    if (listing) { setSelectedListing(listing); setCurrentView('map'); }
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
