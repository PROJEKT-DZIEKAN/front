import { useState, useCallback } from 'react';
import { Group, CreateGroupRequest, UpdateGroupRequest, GroupSearchFilters } from '@/types/group';
import { 
  getAllGroups, 
  getGroupById,
  createGroup, 
  updateGroup,
  deleteGroup,
  addParticipantToGroup,
  removeParticipantFromGroup,
  searchGroupsByTitle,
  searchGroupsByDescription,
  getGroupsWithAvailableSpots,
  getGroupsCreatedAt,
  getMyGroups
} from '@/utils/apiClient';
import { useAuth } from '@/context/AuthContext';

export const useGroups = () => {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get error message based on status
  const getErrorMessage = (status: number): string => {
    switch (status) {
      case 404: return 'Grupa nie została znaleziona';
      case 500: return 'Wystąpił błąd serwera. Spróbuj ponownie.';
      default: return 'Wystąpił nieoczekiwany błąd';
    }
  };

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch all groups
  const fetchAllGroups = useCallback(async (): Promise<Group[]> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getAllGroups();
      setGroups(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error fetching groups:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get group by ID
  const getGroup = useCallback(async (groupId: number): Promise<Group | null> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const group = await getGroupById(groupId);
      return group;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error fetching group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Create new group
  const createNewGroup = useCallback(async (groupData: CreateGroupRequest): Promise<Group | null> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const newGroup = await createGroup(groupData);
      
      // Optimistic update
      setGroups(prev => [...prev, newGroup]);
      
      return newGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error creating group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update group
  const updateExistingGroup = useCallback(async (groupId: number, groupData: UpdateGroupRequest): Promise<Group | null> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const updatedGroup = await updateGroup(groupId, groupData);
      
      // Optimistic update
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      
      return updatedGroup;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error updating group:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Delete group
  const deleteExistingGroup = useCallback(async (groupId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      await deleteGroup(groupId);
      
      // Optimistic update
      setGroups(prev => prev.filter(group => group.id !== groupId));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error deleting group:', err);
      
      // Rollback on error
      fetchAllGroups();
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchAllGroups]);

  // Add participant to group
  const addParticipant = useCallback(async (groupId: number, userId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      await addParticipantToGroup(groupId, userId);
      
      // Refresh groups to get updated participant list
      await fetchAllGroups();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error adding participant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchAllGroups]);

  // Remove participant from group
  const removeParticipant = useCallback(async (groupId: number, userId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      await removeParticipantFromGroup(groupId, userId);
      
      // Refresh groups to get updated participant list
      await fetchAllGroups();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error removing participant:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchAllGroups]);

  // Search groups with debounced functionality
  const searchGroups = useCallback(async (filters: GroupSearchFilters): Promise<Group[]> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      let results: Group[] = [];

      if (!filters.searchTerm || filters.searchTerm.trim() === '') {
        // If no search term, get all groups or apply other filters
        results = await getAllGroups();
      } else {
        // Search by title or description
        if (filters.searchType === 'description') {
          results = await searchGroupsByDescription(filters.searchTerm);
        } else {
          results = await searchGroupsByTitle(filters.searchTerm);
        }
      }

      // Apply additional filters
      if (filters.hasAvailableSpots) {
        results = results.filter(group => {
          if (!group.maxParticipants) return true;
          const participantCount = group.participants?.length || 0;
          return participantCount < group.maxParticipants;
        });
      }

      if (filters.createdAt) {
        const filterDate = new Date(filters.createdAt).toDateString();
        results = results.filter(group => {
          const groupDate = new Date(group.createdAt).toDateString();
          return groupDate === filterDate;
        });
      }

      setGroups(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error searching groups:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get groups with available spots
  const fetchGroupsWithSpots = useCallback(async (): Promise<Group[]> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getGroupsWithAvailableSpots();
      setGroups(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error fetching groups with spots:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get groups created at specific date
  const fetchGroupsCreatedAt = useCallback(async (dateTime: string): Promise<Group[]> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getGroupsCreatedAt(dateTime);
      setGroups(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error fetching groups by date:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get user's groups
  const fetchMyGroups = useCallback(async (): Promise<Group[]> => {
    if (!isAuthenticated || !user) {
      setError('Musisz być zalogowany');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await getMyGroups(user.id);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error fetching my groups:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Utility functions
  const hasAvailableSpots = useCallback((group: Group): boolean => {
    if (!group.maxParticipants) return true;
    const participantCount = group.participants?.length || 0;
    return participantCount < group.maxParticipants;
  }, []);

  const getAvailableSpots = useCallback((group: Group): number | string => {
    if (!group.maxParticipants) return 'Unlimited';
    const participantCount = group.participants?.length || 0;
    return Math.max(0, group.maxParticipants - participantCount);
  }, []);

  const formatGroupDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }, []);

  const isUserParticipant = useCallback((group: Group, userId: number): boolean => {
    return group.participants?.some(participant => participant.id === userId) || false;
  }, []);

  return {
    // State
    groups,
    loading,
    error,
    
    // Actions
    fetchAllGroups,
    getGroup,
    createNewGroup,
    updateExistingGroup,
    deleteExistingGroup,
    addParticipant,
    removeParticipant,
    searchGroups,
    fetchGroupsWithSpots,
    fetchGroupsCreatedAt,
    fetchMyGroups,
    
    // Utils
    clearError,
    hasAvailableSpots,
    getAvailableSpots,
    formatGroupDate,
    isUserParticipant,
    getErrorMessage
  };
};