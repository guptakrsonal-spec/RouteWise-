export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  passengers: number;
  capacity: number;
  status: 'OPTIMAL' | 'NEAR_CAPACITY' | 'OVERCROWDED' | 'UNDERUTILIZED';
  recommendation: string;
  loadFactor: number;
}

export const INITIAL_ROUTES: Route[] = [
  {
    id: '12',
    name: 'Route 12',
    from: 'Sitabuldi',
    to: 'Koradi',
    passengers: 147,
    capacity: 120,
    status: 'OVERCROWDED',
    recommendation: 'Add 2 extra buses',
    loadFactor: 122.5
  },
  {
    id: '5',
    name: 'Route 5',
    from: 'Dharampeth',
    to: 'Airport',
    passengers: 82,
    capacity: 120,
    status: 'OPTIMAL',
    recommendation: 'Maintain current frequency',
    loadFactor: 68.3
  },
  {
    id: '7',
    name: 'Route 7',
    from: 'Medical Sq',
    to: 'Manish Nagar',
    passengers: 108,
    capacity: 120,
    status: 'NEAR_CAPACITY',
    recommendation: 'Monitor closely',
    loadFactor: 90.0
  },
  {
    id: '21',
    name: 'Route 21',
    from: 'VNIT',
    to: 'Itwari',
    passengers: 44,
    capacity: 120,
    status: 'UNDERUTILIZED',
    recommendation: 'Reduce frequency to save fuel',
    loadFactor: 36.7
  }
];

export const PREDICTION_DATA = [
  { time: '08:00', demand: 45 },
  { time: '09:00', demand: 85 },
  { time: '10:00', demand: 110 },
  { time: '11:00', demand: 95 },
  { time: '12:00', demand: 70 },
  { time: '13:00', demand: 65 },
  { time: '14:00', demand: 80 },
  { time: '15:00', demand: 105 },
  { time: '16:00', demand: 130 },
  { time: '17:00', demand: 150 },
  { time: '18:00', demand: 140 },
  { time: '19:00', demand: 90 },
];
