export interface Trip {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  budget: {
    amount: number;
    currency: string;
  };
  participants: TripParticipant[];
  activities: TripActivity[];
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface TripParticipant {
  id: number;
  userId: number;
  tripId: number;
  role: 'organizer' | 'participant';
  name: string;
  imageUrl?: string;
  joinedAt: string;
}

export interface TripActivity {
  id: number;
  tripId: number;
  title: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  startTime?: string;
  endTime?: string;
  cost?: {
    amount: number;
    currency: string;
  };
  category: 'accommodation' | 'transportation' | 'sightseeing' | 'food' | 'other';
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
}