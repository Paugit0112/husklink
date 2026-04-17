import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-fixes.css";
import { Home, Truck } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  location: { lat: number; lng: number };
  logistics_type: 'farm_pickup' | 'road_hauled';
  asking_price: number;
  ai_estimated_weight_kg: number;
  address: string;
}

interface LiveMapProps {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
  center?: [number, number];
}

function createCustomIcon(logisticsType: 'farm_pickup' | 'road_hauled') {
  const color = logisticsType === 'farm_pickup' ? '#4a7c2e' : '#8b4513';

  const svgIcon = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.9"/>
      <circle cx="20" cy="20" r="18" fill="none" stroke="white" stroke-width="3"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
}

export function LiveMap({ listings, onListingClick, center = [8.9475, 125.5406] }: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent double initialization
    if (mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false
    }).setView(center, 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;

    // Force a re-render after map loads
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when listings change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    markersRef.current = [];

    // Add new markers
    listings.forEach((listing) => {
      const marker = L.marker(
        [listing.location.lat, listing.location.lng],
        { icon: createCustomIcon(listing.logistics_type) }
      );

      const popupContent = `
        <div class="p-3 min-w-[240px] max-w-[300px]">
          <h4 class="font-semibold text-sm mb-2" style="color: #3e2723;">${listing.title}</h4>
          <div class="space-y-2 text-xs mb-3">
            <div class="flex items-center justify-between">
              <span style="color: #8a8175;">Type:</span>
              <span class="font-medium" style="color: #3e2723;">${listing.logistics_type === 'farm_pickup' ? 'Farm Pickup' : 'Road Hauled'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span style="color: #8a8175;">Price:</span>
              <span class="font-mono font-semibold" style="color: #4a7c2e;">₱${listing.asking_price.toLocaleString()}</span>
            </div>
            <div class="flex items-center justify-between">
              <span style="color: #8a8175;">Weight:</span>
              <span class="font-mono" style="color: #3e2723;">${listing.ai_estimated_weight_kg.toLocaleString()} kg</span>
            </div>
            <div class="pt-1 border-t" style="border-color: rgba(74, 124, 46, 0.15);">
              <p style="color: #8a8175;">${listing.address}</p>
            </div>
          </div>
          <button
            class="w-full py-2 text-white rounded-lg text-xs font-medium transition-colors"
            style="background: linear-gradient(to right, #4a7c2e, #7cb342);"
            onclick="window.handleListingClick('${listing.id}')"
          >
            View Full Details
          </button>
        </div>
      `;

      // Bind popup with auto-open on hover
      marker.bindPopup(popupContent, {
        autoPan: false,
        closeButton: true,
        className: 'custom-popup'
      });

      // Open popup on hover
      marker.on('mouseover', function() {
        this.openPopup();
      });

      // Keep popup open when hovering over it, close on mouseout from marker
      marker.on('mouseout', function(e) {
        const popup = this.getPopup();
        if (popup) {
          // Small delay to allow moving to popup
          setTimeout(() => {
            if (!popup.getElement()?.matches(':hover')) {
              this.closePopup();
            }
          }, 100);
        }
      });

      // Click to select listing for detailed view
      marker.on('click', () => onListingClick(listing));

      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Set up global click handler for popup buttons
    (window as any).handleListingClick = (listingId: string) => {
      const listing = listings.find(l => l.id === listingId);
      if (listing) {
        onListingClick(listing);
      }
    };

    return () => {
      delete (window as any).handleListingClick;
    };
  }, [listings, onListingClick]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
      />

      {/* Map Legend */}
      <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-border z-[800]">
        <p className="text-xs font-semibold mb-2 text-foreground">Logistics Type</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#4a7c2e]" />
            <span className="text-xs text-foreground">Farm Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#8b4513]" />
            <span className="text-xs text-foreground">Road Hauled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
