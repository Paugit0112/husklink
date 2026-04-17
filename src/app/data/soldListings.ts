// Mock data for sold husks in Caraga region
// Caraga coordinates: Latitude 8.5-10.5, Longitude 125.5-126.5

const CARAGA_PROVINCES = [
  { name: 'Agusan del Norte', latRange: [9.0, 9.5], lngRange: [125.4, 125.8] },
  { name: 'Agusan del Sur', latRange: [8.5, 9.0], lngRange: [125.5, 126.0] },
  { name: 'Surigao del Norte', latRange: [9.5, 10.2], lngRange: [125.5, 125.9] },
  { name: 'Surigao del Sur', latRange: [8.8, 9.5], lngRange: [126.0, 126.5] },
  { name: 'Dinagat Islands', latRange: [9.8, 10.5], lngRange: [125.6, 125.8] }
];

const BARANGAYS = [
  'Poblacion', 'San Jose', 'Santa Cruz', 'New Visayas', 'Libertad',
  'Magallanes', 'Magsaysay', 'San Vicente', 'San Roque', 'Maharlika',
  'San Antonio', 'Del Pilar', 'Aguinaldo', 'Roxas', 'Quezon',
  'Bonifacio', 'Rizal', 'Mabini', 'Luna', 'San Pedro',
  'San Juan', 'San Miguel', 'San Rafael', 'San Isidro', 'San Pablo',
  'New Bethlehem', 'Paradise', 'Greenfield', 'Sunrise', 'Valley View'
];

const MUNICIPALITIES = [
  'Butuan City', 'Cabadbaran', 'Bayugan', 'Bunawan', 'Esperanza',
  'La Paz', 'Loreto', 'Prosperidad', 'Rosario', 'San Francisco',
  'Santa Josefa', 'Talacogon', 'Trento', 'Veruela', 'Surigao City',
  'Tandag City', 'Bislig', 'Cantilan', 'Carmen', 'Lanuza',
  'Madrid', 'Marihatag', 'San Agustin', 'San Miguel', 'Tago',
  'Dinagat', 'Basilisa', 'Cagdianao', 'Libjo', 'Loreto'
];

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSoldListing(index: number) {
  const province = randomElement(CARAGA_PROVINCES);
  const lat = randomInRange(province.latRange[0], province.latRange[1]);
  const lng = randomInRange(province.lngRange[0], province.lngRange[1]);

  const logisticsType = Math.random() > 0.4 ? 'farm_pickup' : 'road_hauled';
  const weight = Math.floor(randomInRange(800, 3000));
  const pricePerKg = randomInRange(12, 18);
  const price = Math.round(weight * pricePerKg);

  const municipality = randomElement(MUNICIPALITIES);
  const barangay = randomElement(BARANGAYS);

  const wasteTypes = [
    'Rice Husks',
    'Coconut Husks',
    'Corn Husks',
    'Mixed Agricultural Waste',
    'Premium Rice Husks',
    'Organic Coconut Shells',
    'Fresh Rice Straw'
  ];

  return {
    id: `sold-caraga-${index}`,
    title: `${randomElement(wasteTypes)} - ${weight}kg SOLD`,
    location: {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    },
    address: `Brgy. ${barangay}, ${municipality}, ${province.name}, Caraga`,
    logistics_type: logisticsType as 'farm_pickup' | 'road_hauled',
    asking_price: price,
    ai_estimated_weight_kg: weight,
    sold_price: Math.round(price * randomInRange(0.95, 1.08)),
    sold_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    province: province.name
  };
}

// Generate 120 sold listings in Caraga region
export const CARAGA_SOLD_LISTINGS = Array.from({ length: 120 }, (_, i) => generateSoldListing(i + 1));

// Statistics by province
export const CARAGA_STATS = {
  totalSold: CARAGA_SOLD_LISTINGS.length,
  totalVolume: CARAGA_SOLD_LISTINGS.reduce((sum, l) => sum + l.ai_estimated_weight_kg, 0),
  totalValue: CARAGA_SOLD_LISTINGS.reduce((sum, l) => sum + l.sold_price, 0),
  byProvince: CARAGA_PROVINCES.map(province => {
    const listings = CARAGA_SOLD_LISTINGS.filter(l => l.province === province.name);
    return {
      name: province.name,
      count: listings.length,
      volume: listings.reduce((sum, l) => sum + l.ai_estimated_weight_kg, 0)
    };
  }).sort((a, b) => b.count - a.count)
};
