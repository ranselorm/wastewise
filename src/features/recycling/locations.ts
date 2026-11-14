export type Coordinate = { latitude: number; longitude: number };
export type Category =
  | 'battery' | 'general_waste' | 'glass' | 'metal' | 'organic_waste'
  | 'paper_cardboard' | 'plastic' | 'textile' | 'e_waste';

export type RecyclingLocation = {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  coordinateSource: string;
  hours: string;
  materials: Partial<Record<Category, string>>;
  sources: string[];
  reviewed: string;
};

const directory = 'https://www.greatercambridgewaste.org/recycling/find-a-recycling-point';
const council = 'https://www.cambridgeshire.gov.uk/residents/waste-and-recycling/household-recycling-centres/';
const materials = {
  battery: 'Household and car batteries',
  general_waste: 'Separated black-bag waste from your own household',
  glass: 'Glass',
  metal: 'Metals',
  paper_cardboard: 'Cardboard and books',
  plastic: 'Rigid plastics such as buckets and storage boxes',
  textile: 'Clothes and textiles',
  e_waste: 'Small and large electrical equipment',
};

export const locations: RecyclingLocation[] = [
  {
    id: 'milton',
    name: 'Milton Household Recycling Centre',
    address: 'Butt Lane, Milton, Cambridge CB24 6DQ',
    coordinate: { latitude: 52.2472244, longitude: 0.1455229 },
    coordinateSource: 'https://planning-records.uk/cambridgeshire/2025/ccc25114nmw/',
    hours: 'Oct–Mar: daily 9 am–4 pm. Apr–Sep: weekdays 9 am–8 pm, weekends 9 am–6 pm. Holiday hours and redevelopment may affect access.',
    materials,
    sources: [directory, council + 'what-can-i-take-to-a-household-recycling-centre', council + 'household-recycling-centre-locations-and-opening-hours', 'https://www.cambridgeshire.gov.uk/residents/waste-and-recycling/milton-household-recycling-centre-improvements'],
    reviewed: '2026-11-13',
  },
  {
    id: 'thriplow',
    name: 'Thriplow Household Recycling Centre',
    address: 'Gravel Pit Hill, Thriplow SG8 7HZ',
    coordinate: { latitude: 52.08730, longitude: 0.10988 },
    coordinateSource: 'https://your.dsposal.uk/recycling-centres/thriplow-recycling-centre-royston',
    hours: 'Oct–Mar: daily 8 am–4 pm. Apr–Sep: daily 8 am–5 pm. Holiday hours may differ.',
    materials,
    sources: [directory, council + 'what-can-i-take-to-a-household-recycling-centre', council + 'household-recycling-centre-locations-and-opening-hours'],
    reviewed: '2026-11-13',
  },
];

export const cambridge = { latitude: 52.2053, longitude: 0.1218 };

export function distanceKm(a: Coordinate, b: Coordinate) {
  const radians = Math.PI / 180;
  const lat = (b.latitude - a.latitude) * radians;
  const lon = (b.longitude - a.longitude) * radians;
  const h = Math.sin(lat / 2) ** 2 +
    Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
