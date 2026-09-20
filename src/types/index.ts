import { PhoneSpecs, AlgorithmWeights } from '../data/phones.ts';

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface UserStats {
  savedComparisonsCount: number;
  favoritesCount: number;
  customPresetsCount: number;
}

export interface SavedComparisonRecord {
  id: number;
  userId: number;
  title: string;
  phoneIds: string; // JSON string
  weights: string;  // JSON string
  notes: string | null;
  createdAt: string;
}

export interface CustomPresetRecord {
  id: number;
  userId: number;
  name: string;
  performanceWeight: number;
  cameraWeight: number;
  batteryWeight: number;
  displayWeight: number;
  valueWeight: number;
  createdAt: string;
}

export interface CartItem {
  phone: PhoneSpecs;
  quantity: number;
}

export type ActiveTab = 'arena' | 'catalog' | 'algorithm' | 'saved';
