export const travelModes = [
  { mode: 'DRIVE', label: 'Drive' },
  { mode: 'WALK', label: 'Walk' },
  { mode: 'BICYCLE', label: 'Cycle' },
] as const;

export type TravelMode = (typeof travelModes)[number]['mode'];
