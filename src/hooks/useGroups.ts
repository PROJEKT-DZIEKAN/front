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

  const getErrorMessage = (status: number): string => {
    switch (status) {
      case 404: return 'Grupa nie została znaleziona';
      case 500: return 'Wystąpił błąd serwera. Spróbuj ponownie.';
      default: return 'Wystąpił nieoczekiwany błąd';
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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

  const createNewGroup = useCallback(async (groupData: CreateGroupRequest): Promise<Group | null> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const newGroup = await createGroup(groupData);
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

  const updateExistingGroup = useCallback(async (groupId: number, groupData: UpdateGroupRequest): Promise<Group | null> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const updatedGroup = await updateGroup(groupId, groupData);
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

  const deleteExistingGroup = useCallback(async (groupId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteGroup(groupId);
      setGroups(prev => prev.filter(group => group.id !== groupId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMessage);
      console.error('Error deleting group:', err);
      fetchAllGroups();
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchAllGroups]);

  const addParticipant = useCallback(async (groupId: number, userId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await addParticipantToGroup(groupId, userId);
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

  const removeParticipant = useCallback(async (groupId: number, userId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await removeParticipantFromGroup(groupId, userId);
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
        results = await getAllGroups();
      } else {
        if (filters.searchType === 'description') {
          results = await searchGroupsByDescription(filters.searchTerm);
        } else {
          results = await searchGroupsByTitle(filters.searchTerm);
        }
      }

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
    groups,
    loading,
    error,
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
    clearError,
    hasAvailableSpots,
    getAvailableSpots,
    formatGroupDate,
    isUserParticipant,
    getErrorMessage
  };
};