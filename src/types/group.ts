export interface GroupParticipant {
  id: number;
  firstName: string;
  surname: string;
  registrationStatus?: string;
  // Added for Vercel build test
  ///u8erur8we
}

export interface GroupOrganizer {
  id: number;
  firstName: string;
  surname: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  maxParticipants?: number;
  createdAt: string;
  organizer: GroupOrganizer;
  participants: GroupParticipant[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  maxParticipants?: number;
  organizerId: number;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  maxParticipants?: number;
}

export interface GroupPermissions {
  isOrganizer: boolean;
  isParticipant: boolean;
  hasSpots: boolean;
  availableSpots: number | string;
}
