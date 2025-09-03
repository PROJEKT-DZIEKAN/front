import { Group, CreateGroupRequest, UpdateGroupRequest, GroupPermissions } from '@/types/group';

const API_BASE_URL = 'https://dziekan-48de5f4dea14.herokuapp.com/api';

/**
 * Klasa do zarządzania grupami - TypeScript wersja skryptu
 */
export class GroupManager {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Pobiera token JWT z localStorage
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Wykonuje żądanie HTTP z obsługą błędów
   */
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Próba odświeżenia tokenu
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Ponowne wykonanie żądania z nowym tokenem
            return this.makeRequest<T>(url, options);
          } else {
            throw new Error('Sesja wygasła. Zaloguj się ponownie.');
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Błąd żądania:', error);
      throw error;
    }
  }

  /**
   * Odświeża token JWT
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Błąd odświeżania tokenu:', error);
      return false;
    }
  }

  // ==================== FUNKCJE DLA WSZYSTKICH UŻYTKOWNIKÓW ====================

  /**
   * Pobiera wszystkie dostępne grupy
   */
  async getAllGroups(): Promise<Group[]> {
    return await this.makeRequest<Group[]>(`${this.baseURL}/groups/all`);
  }

  /**
   * Pobiera szczegóły konkretnej grupy
   */
  async getGroupById(groupId: number): Promise<Group> {
    return await this.makeRequest<Group>(`${this.baseURL}/groups/${groupId}`);
  }

  /**
   * Pobiera grupy, w których użytkownik jest uczestnikiem
   */
  async getMyGroups(userId: number): Promise<Group[]> {
    return await this.makeRequest<Group[]>(`${this.baseURL}/groups/by-user/${userId}`);
  }

  /**
   * Pobiera grupy utworzone przez użytkownika (jako organizator)
   */
  async getMyOrganizedGroups(organizerId: number): Promise<Group[]> {
    return await this.makeRequest<Group[]>(`${this.baseURL}/groups/by-organizer/${organizerId}`);
  }

  /**
   * Wyszukuje grupy po nazwie
   */
  async searchGroupsByName(name: string): Promise<Group[]> {
    return await this.makeRequest<Group[]>(`${this.baseURL}/groups/by-title?title=${encodeURIComponent(name)}`);
  }

  /**
   * Wyszukuje grupy po opisie
   */
  async searchGroupsByDescription(description: string): Promise<Group[]> {
    return await this.makeRequest<Group[]>(`${this.baseURL}/groups/by-description?description=${encodeURIComponent(description)}`);
  }

  /**
   * Pobiera grupy z dostępnymi miejscami
   */
  async getGroupsWithAvailableSpots(): Promise<Group[]> {
    return await this.makeRequest<Group[]>(`${this.baseURL}/groups/with-available-spots`);
  }

  /**
   * Dołącza użytkownika do grupy
   */
  async joinGroup(groupId: number, userId: number): Promise<void> {
    await this.makeRequest(`${this.baseURL}/groups/add-participant/${groupId}/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * Opuszcza grupę
   */
  async leaveGroup(groupId: number, userId: number): Promise<void> {
    await this.makeRequest(`${this.baseURL}/groups/remove-participant/${groupId}/${userId}`, {
      method: 'DELETE'
    });
  }

  // ==================== FUNKCJE DLA ORGANIZATORÓW/ADMINÓW ====================

  /**
   * Tworzy nową grupę
   */
  async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    const group = {
      name: groupData.name,
      description: groupData.description || '',
      maxParticipants: groupData.maxParticipants || null
    };

    return await this.makeRequest<Group>(`${this.baseURL}/groups/create`, {
      method: 'POST',
      body: JSON.stringify(group)
    });
  }

  /**
   * Aktualizuje istniejącą grupę
   */
  async updateGroup(groupId: number, groupData: UpdateGroupRequest): Promise<Group> {
    return await this.makeRequest<Group>(`${this.baseURL}/groups/update/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData)
    });
  }

  /**
   * Usuwa grupę (tylko organizator lub admin)
   */
  async deleteGroup(groupId: number): Promise<void> {
    await this.makeRequest(`${this.baseURL}/groups/delete/${groupId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Dodaje uczestnika do grupy (tylko organizator lub admin)
   */
  async addParticipantToGroup(groupId: number, userId: number): Promise<void> {
    await this.makeRequest(`${this.baseURL}/groups/add-participant/${groupId}/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * Usuwa uczestnika z grupy (tylko organizator lub admin)
   */
  async removeParticipantFromGroup(groupId: number, userId: number): Promise<void> {
    await this.makeRequest(`${this.baseURL}/groups/remove-participant/${groupId}/${userId}`, {
      method: 'DELETE'
    });
  }

  // ==================== FUNKCJE POMOCNICZE ====================

  /**
   * Sprawdza czy użytkownik jest organizatorem grupy
   * Uwaga: W nowym API informacja o organizatorze jest ukryta
   * Ta funkcja zawsze zwróci false - należy używać dedykowanych endpointów
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isGroupOrganizer(_group: Group, _userId: number): boolean {
    // Organizator jest ukryty w API przez @JsonIgnore
    // Należy używać endpointu /api/groups/by-organizer/{userId} do sprawdzenia
    return false;
  }

  /**
   * Sprawdza czy użytkownik jest uczestnikiem grupy
   */
  isGroupParticipant(group: Group, userId: number): boolean {
    return group?.participants?.some(p => p?.id === userId) || false;
  }

  /**
   * Sprawdza czy grupa ma dostępne miejsca
   */
  hasAvailableSpots(group: Group): boolean {
    if (!group?.maxParticipants) return true;
    const currentParticipants = group?.participants?.length || 0;
    return currentParticipants < group.maxParticipants;
  }

  /**
   * Pobiera liczbę dostępnych miejsc w grupie
   */
  getAvailableSpots(group: Group): number | string {
    if (!group?.maxParticipants) return 'Bez limitu';
    const currentParticipants = group?.participants?.length || 0;
    return group.maxParticipants - currentParticipants;
  }

  /**
   * Formatuje datę utworzenia grupy
   */
  formatGroupDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Sprawdza uprawnienia użytkownika dla grupy
   */
  checkGroupPermissions(group: Group, userId: number): GroupPermissions {
    return {
      isOrganizer: this.isGroupOrganizer(group, userId),
      isParticipant: this.isGroupParticipant(group, userId),
      hasSpots: this.hasAvailableSpots(group),
      availableSpots: this.getAvailableSpots(group)
    };
  }
}

// Singleton instance
export const groupManager = new GroupManager();
