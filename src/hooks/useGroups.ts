import { useState, useCallback } from 'react';
import { Group, CreateGroupRequest, UpdateGroupRequest, GroupPermissions } from '@/types/group';
import { 
  getAllGroups, 
  getGroupById,
  getMyGroups, 
  createGroup, 
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  searchGroupsByName 
} from '@/utils/apiClient';
import { groupManager } from '@/utils/groupManager';
import { useAuth } from '@/context/AuthContext';

export function useGroups() {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobieranie wszystkich grup
  const loadAllGroups = useCallback(async () => {
    if (!isAuthenticated) return [];
    
    try {
      setLoading(true);
      setError(null);
      const allGroups = await getAllGroups();
      setGroups(allGroups);
      return allGroups;
    } catch (err) {
      const errorMessage = 'Błąd ładowania grup';
      setError(errorMessage);
      console.error(errorMessage, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Pobieranie grup użytkownika
  const loadMyGroups = useCallback(async () => {
    if (!isAuthenticated || !user) return [];
    
    try {
      setLoading(true);
      setError(null);
      const userGroups = await getMyGroups(user.id);
      setMyGroups(userGroups);
      return userGroups;
    } catch (err) {
      const errorMessage = 'Błąd ładowania moich grup';
      setError(errorMessage);
      console.error(errorMessage, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Pobieranie wszystkich grup i grup użytkownika
  const loadGroups = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      const [allGroups, userGroups] = await Promise.all([
        getAllGroups(),
        getMyGroups(user.id)
      ]);
      
      setGroups(allGroups);
      setMyGroups(userGroups);
    } catch (err) {
      const errorMessage = 'Błąd ładowania grup';
      setError(errorMessage);
      console.error(errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Wyszukiwanie grup
  const searchGroups = useCallback(async (searchTerm: string) => {
    if (!isAuthenticated) return [];
    
    try {
      setLoading(true);
      setError(null);
      const results = await searchGroupsByName(searchTerm);
      setGroups(results);
      return results;
    } catch (err) {
      const errorMessage = 'Błąd wyszukiwania grup';
      setError(errorMessage);
      console.error(errorMessage, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Tworzenie grupy
  const createNewGroup = useCallback(async (groupData: CreateGroupRequest) => {
    if (!isAuthenticated || !user) return null;
    
    try {
      setLoading(true);
      setError(null);
      const newGroup = await createGroup({
        ...groupData,
        organizerId: user.id
      });
      
      // Odświeżenie list grup
      await loadGroups();
      return newGroup;
    } catch (err) {
      const errorMessage = 'Błąd tworzenia grupy';
      setError(errorMessage);
      console.error(errorMessage, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadGroups]);

  // Aktualizacja grupy
  const updateExistingGroup = useCallback(async (groupId: number, groupData: UpdateGroupRequest) => {
    if (!isAuthenticated) return null;
    
    try {
      setLoading(true);
      setError(null);
      const updatedGroup = await updateGroup(groupId, groupData);
      
      // Odświeżenie list grup
      await loadGroups();
      return updatedGroup;
    } catch (err) {
      const errorMessage = 'Błąd aktualizacji grupy';
      setError(errorMessage);
      console.error(errorMessage, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadGroups]);

  // Usuwanie grupy
  const deleteExistingGroup = useCallback(async (groupId: number) => {
    if (!isAuthenticated) return false;
    
    try {
      setLoading(true);
      setError(null);
      await deleteGroup(groupId);
      
      // Odświeżenie list grup
      await loadGroups();
      return true;
    } catch (err) {
      const errorMessage = 'Błąd usuwania grupy';
      setError(errorMessage);
      console.error(errorMessage, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadGroups]);

  // Dołączanie do grupy
  const joinExistingGroup = useCallback(async (groupId: number) => {
    if (!isAuthenticated || !user) return false;
    
    try {
      setLoading(true);
      setError(null);
      await joinGroup(groupId, user.id);
      
      // Odświeżenie list grup
      await loadGroups();
      return true;
    } catch (err) {
      const errorMessage = 'Błąd dołączania do grupy';
      setError(errorMessage);
      console.error(errorMessage, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadGroups]);

  // Opuszczanie grupy
  const leaveExistingGroup = useCallback(async (groupId: number) => {
    if (!isAuthenticated || !user) return false;
    
    try {
      setLoading(true);
      setError(null);
      await leaveGroup(groupId, user.id);
      
      // Odświeżenie list grup
      await loadGroups();
      return true;
    } catch (err) {
      const errorMessage = 'Błąd opuszczania grupy';
      setError(errorMessage);
      console.error(errorMessage, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, loadGroups]);

  // Pobieranie szczegółów grupy
  const getGroupDetails = useCallback(async (groupId: number) => {
    if (!isAuthenticated) return null;
    
    try {
      setLoading(true);
      setError(null);
      const group = await getGroupById(groupId);
      return group;
    } catch (err) {
      const errorMessage = 'Błąd pobierania szczegółów grupy';
      setError(errorMessage);
      console.error(errorMessage, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Sprawdzanie uprawnień użytkownika dla grupy
  const checkPermissions = useCallback((group: Group): GroupPermissions => {
    if (!user) {
      return {
        isOrganizer: false,
        isParticipant: false,
        hasSpots: groupManager.hasAvailableSpots(group),
        availableSpots: groupManager.getAvailableSpots(group)
      };
    }
    
    return groupManager.checkGroupPermissions(group, user.id);
  }, [user]);

  // Funkcje pomocnicze
  const formatDate = useCallback((dateString: string) => {
    return groupManager.formatGroupDate(dateString);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    groups,
    myGroups,
    loading,
    error,
    
    // Actions
    loadAllGroups,
    loadMyGroups,
    loadGroups,
    searchGroups,
    createNewGroup,
    updateExistingGroup,
    deleteExistingGroup,
    joinExistingGroup,
    leaveExistingGroup,
    getGroupDetails,
    
    // Utils
    checkPermissions,
    formatDate,
    clearError,
    
    // Manager instance
    groupManager
  };
}
