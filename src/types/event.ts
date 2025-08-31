import { User } from './auth';

export interface Event {
  id?: number;
  title: string;
  description: string;
  startTime: string; // ISO string format
  endTime: string;   // ISO string format
  location: string;
  latitude?: number;
  longitude?: number;
  qrcodeUrl?: string;
  maxParticipants?: number;
  organizer?: User;
  // Frontend-specific properties (optional for admin components)
  currentParticipants?: number;
  category?: string;
  isRegistered?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  links?: Array<{ text: string; url: string }>;
}

export interface EventContextType {
  createEvent: (event: Event) => Promise<Event | null>;
  updateEvent: (id: number, event: Event) => Promise<Event | null>;
  deleteEvent: (id: number) => Promise<boolean>;
  getAllEvents: () => Promise<Event[]>;
}
