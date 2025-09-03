// Model danych zgodny z dokumentacją API
export interface Group {
  id: number;                    // Auto-generated
  name: string;                  // Required, max 255 chars
  description?: string;          // Optional, max 2000 chars
  createdAt: string;            // ISO DateTime, auto-set to now()
  maxParticipants?: number;     // Optional, min 0
  // Relacje (ukryte w JSON przez @JsonIgnore w backendzie)
  participants?: GroupParticipant[]; // Many-to-Many
  events?: GroupEvent[];        // Many-to-Many
}

export interface GroupParticipant {
  id: number;
  firstName: string;
  surname: string;
  registrationStatus?: string;
}

export interface GroupEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

// Request types dla API
export interface CreateGroupRequest {
  name: string;                  // Required, max 255 chars
  description?: string;          // Optional, max 2000 chars
  maxParticipants?: number;     // Optional, min 0
}

export interface UpdateGroupRequest {
  name?: string;                 // Optional, max 255 chars
  description?: string;          // Optional, max 2000 chars
  maxParticipants?: number;     // Optional, min 0
}

// Utility types
export interface GroupPermissions {
  isOrganizer: boolean;
  isParticipant: boolean;
  hasSpots: boolean;
  availableSpots: number | string;
}

export interface GroupSearchFilters {
  searchTerm?: string;
  searchType?: 'title' | 'description';
  hasAvailableSpots?: boolean;
  createdAt?: string;
}
