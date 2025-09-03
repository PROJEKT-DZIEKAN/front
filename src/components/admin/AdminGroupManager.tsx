'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  UserIcon, 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { Group, CreateGroupRequest, UpdateGroupRequest, GroupSearchFilters } from '@/types/group';
import { User } from '@/types/auth';
import { useGroups } from '@/hooks/useGroups';
import { getAllUsers, searchUsersByName } from '@/utils/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import Select from '@/components/ui/Select';

export default function AdminGroupManager() {
  const { user, isAuthenticated } = useAuth();
  const {
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
    clearError,
    hasAvailableSpots,
    getAvailableSpots,
    formatGroupDate,
    isUserParticipant
  } = useGroups();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Form state
  const [newGroup, setNewGroup] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    maxParticipants: undefined
  });

  const [editGroup, setEditGroup] = useState<UpdateGroupRequest>({
    name: '',
    description: '',
    maxParticipants: undefined
  });

  // Filters
  const [filters, setFilters] = useState<GroupSearchFilters>({
    searchTerm: '',
    searchType: 'title',
    hasAvailableSpots: false
  });

  // Load users
  const loadUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setUsersLoading(true);
      setUsersError(null);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsersError('Nie można załadować użytkowników. Sprawdź uprawnienia administratora.');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [isAuthenticated]);

  // Search users
  const handleUserSearch = useCallback(async () => {
    if (!userSearchTerm.trim()) {
      loadUsers();
      return;
    }

    try {
      setUsersLoading(true);
      setUsersError(null);
      const searchResults = await searchUsersByName(userSearchTerm);
      setUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsersError('Błąd wyszukiwania użytkowników');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearchTerm, loadUsers]);

  // Search groups
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      fetchAllGroups();
      return;
    }

    const searchFilters: GroupSearchFilters = {
      searchTerm,
      searchType: 'title'
    };

    await searchGroups(searchFilters);
  }, [searchTerm, searchGroups, fetchAllGroups]);

  // Create group
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;

    try {
      const createdGroup = await createNewGroup(newGroup);
      
      if (createdGroup) {
        // Reset form
        setNewGroup({
          name: '',
          description: '',
          maxParticipants: undefined
        });
        
        setShowCreateModal(false);
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Update group
  const handleUpdateGroup = async () => {
    if (!selectedGroup || !editGroup.name?.trim()) return;

    try {
      const updatedGroup = await updateExistingGroup(selectedGroup.id, editGroup);
      
      if (updatedGroup) {
        setShowEditModal(false);
        setSelectedGroup(null);
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę grupę? Ta operacja jest nieodwracalna.')) {
      return;
    }

    try {
      const success = await deleteExistingGroup(groupId);
      if (success) {
        setShowDetailsModal(false);
        setSelectedGroup(null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  // Add user to group
  const handleAddUserToGroup = async (userId: number) => {
    if (!selectedGroup) return;

    try {
      const success = await addParticipant(selectedGroup.id, userId);
      
      if (success) {
        setShowAddUserModal(false);
        
        // Refresh group details
        const updatedGroup = await getGroup(selectedGroup.id);
        if (updatedGroup) {
          setSelectedGroup(updatedGroup);
        }
        
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
    }
  };

  // Remove user from group
  const handleRemoveUserFromGroup = async (userId: number) => {
    if (!selectedGroup) return;

    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika z grupy?')) {
      return;
    }

    try {
      const success = await removeParticipant(selectedGroup.id, userId);
      
      if (success) {
        // Refresh group details
        const updatedGroup = await getGroup(selectedGroup.id);
        if (updatedGroup) {
          setSelectedGroup(updatedGroup);
        }
        
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
    }
  };

  // Open modals
  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setEditGroup({
      name: group.name,
      description: group.description || '',
      maxParticipants: group.maxParticipants
    });
    setShowEditModal(true);
  };

  const openAddUserModal = (group: Group) => {
    setSelectedGroup(group);
    setShowAddUserModal(true);
    loadUsers();
  };

  const showGroupDetails = async (group: Group) => {
    // Get fresh group data with participants
    const freshGroup = await getGroup(group.id);
    setSelectedGroup(freshGroup || group);
    setShowDetailsModal(true);
  };

  // Apply advanced filters
  const handleApplyFilters = async () => {
    await searchGroups(filters);
    setShowFiltersModal(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      searchType: 'title',
      hasAvailableSpots: false
    });
    setSearchTerm('');
    fetchAllGroups();
  };

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllGroups();
      loadUsers();
    }
  }, [isAuthenticated, fetchAllGroups, loadUsers]);

  if (!isAuthenticated) {
    return (
      <Alert type="warning" title="Brak autoryzacji">
        Musisz być zalogowany jako administrator
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Zarządzanie grupami</h2>
          <p className="text-sm text-gray-600">Administracja wszystkich grup w systemie</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Utwórz grupę
          </Button>
          <Button variant="outline" onClick={fetchAllGroups} disabled={loading}>
            Odśwież
          </Button>
        </div>
      </div>

      {/* Error Alerts */}
      {error && (
        <Alert type="error" title="Błąd grup">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearError}
            className="mt-2"
          >
            Zamknij
          </Button>
        </Alert>
      )}

      {usersError && (
        <Alert type="warning" title="Błąd użytkowników">
          {usersError}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setUsersError(null)}
            className="mt-2"
          >
            Zamknij
          </Button>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Wyszukaj grupy po nazwie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} variant="outline" disabled={loading}>
            <MagnifyingGlassIcon className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowFiltersModal(true)} variant="outline">
            <FunnelIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Statistics */}
        {!loading && groups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
              <div className="text-sm text-gray-600">Wszystkich grup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {groups.reduce((sum, group) => sum + (group.participants?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Łączna liczba członków</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {groups.filter(group => hasAvailableSpots(group)).length}
              </div>
              <div className="text-sm text-gray-600">Grup z dostępnymi miejscami</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {groups.filter(group => !group.maxParticipants).length}
              </div>
              <div className="text-sm text-gray-600">Grup bez limitu</div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Groups List */}
      {!loading && groups.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Nie znaleziono grup' : 'Brak grup w systemie'}
          </p>
        </div>
      ) : !loading && (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {group.name}
                  </h3>
                  
                  {group.description && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{group.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      ID: {group.id}
                    </span>
                    <span className="flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      Utworzono: {formatGroupDate(group.createdAt)}
                    </span>
                    <span className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Członkowie: {group.participants?.length || 0}
                      {group.maxParticipants && ` / ${group.maxParticipants}`}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      hasAvailableSpots(group) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {hasAvailableSpots(group) ? `Wolne miejsca: ${getAvailableSpots(group)}` : 'Pełna'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showGroupDetails(group)}
                  >
                    Szczegóły
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddUserModal(group)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(group)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Utwórz nową grupę"
      >
        <div className="space-y-4">
          <Input
            label="Nazwa grupy *"
            placeholder="Wprowadź nazwę grupy"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
            maxLength={255}
          />
          
          <TextArea
            label="Opis grupy"
            placeholder="Opisz cel i działalność grupy"
            value={newGroup.description || ''}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            rows={3}
            maxLength={2000}
          />
          
          <Input
            label="Maksymalna liczba członków"
            type="number"
            placeholder="Bez limitu"
            value={newGroup.maxParticipants || ''}
            onChange={(e) => setNewGroup({ 
              ...newGroup, 
              maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            min="0"
          />
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleCreateGroup} 
              disabled={!newGroup.name.trim() || loading}
            >
              {loading ? 'Tworzenie...' : 'Utwórz grupę'}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edytuj grupę: ${selectedGroup?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Nazwa grupy *"
            placeholder="Wprowadź nazwę grupy"
            value={editGroup.name || ''}
            onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
            required
            maxLength={255}
          />
          
          <TextArea
            label="Opis grupy"
            placeholder="Opisz cel i działalność grupy"
            value={editGroup.description || ''}
            onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })}
            rows={3}
            maxLength={2000}
          />
          
          <Input
            label="Maksymalna liczba członków"
            type="number"
            placeholder="Bez limitu"
            value={editGroup.maxParticipants || ''}
            onChange={(e) => setEditGroup({ 
              ...editGroup, 
              maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            min="0"
          />
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleUpdateGroup} 
              disabled={!editGroup.name?.trim() || loading}
            >
              {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title={`Dodaj użytkownika do grupy: ${selectedGroup?.name}`}
      >
        <div className="space-y-4">
          {/* User Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Wyszukaj użytkowników..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
              />
            </div>
            <Button onClick={handleUserSearch} variant="outline" disabled={usersLoading}>
              <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Users List */}
          <div className="max-h-60 overflow-y-auto">
            {usersLoading && (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            )}
            
            {usersError && (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 mb-2">Błąd ładowania użytkowników</p>
                <Button size="sm" variant="outline" onClick={loadUsers}>
                  Spróbuj ponownie
                </Button>
              </div>
            )}
            
            {!usersLoading && !usersError && users.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">
                {userSearchTerm ? 'Nie znaleziono użytkowników' : 'Brak użytkowników'}
              </p>
            )}
            
            {!usersLoading && !usersError && users.length > 0 && (
              <div className="space-y-2">
                {users
                  .filter(user => !selectedGroup?.participants?.some(p => p.id === user.id))
                  .map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {user.firstName} {user.surname}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddUserToGroup(user.id)}
                        disabled={loading}
                      >
                        Dodaj
                      </Button>
                    </div>
                  ))}
                
                {users.filter(user => !selectedGroup?.participants?.some(p => p.id === user.id)).length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    Wszyscy użytkownicy są już członkami tej grupy
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
              Zamknij
            </Button>
          </div>
        </div>
      </Modal>

      {/* Group Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Szczegóły grupy: ${selectedGroup?.name}`}
      >
        {selectedGroup && (
          <div className="space-y-6">
            {/* Group Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>ID grupy:</strong> {selectedGroup.id}</div>
              <div><strong>Utworzono:</strong> {formatGroupDate(selectedGroup.createdAt)}</div>
              <div><strong>Członkowie:</strong> {selectedGroup.participants?.length || 0}
                {selectedGroup.maxParticipants && ` / ${selectedGroup.maxParticipants}`}
              </div>
              <div><strong>Dostępne miejsca:</strong> {getAvailableSpots(selectedGroup)}</div>
            </div>
            
            {selectedGroup.description && (
              <div>
                <strong>Opis:</strong>
                <p className="mt-1 text-sm text-gray-700">{selectedGroup.description}</p>
              </div>
            )}
            
            {/* Members List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Lista członków ({selectedGroup.participants?.length || 0})
              </h4>
              {(!selectedGroup.participants || selectedGroup.participants.length === 0) ? (
                <p className="text-sm text-gray-600">Brak członków</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedGroup.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-sm font-medium">
                            {participant.firstName || 'Nieznany'} {participant.surname || ''}
                          </span>
                          <div className="text-xs text-gray-500">ID: {participant.id}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveUserFromGroup(participant.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => openAddUserModal(selectedGroup)}
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Dodaj użytkownika
              </Button>
              <Button
                variant="outline"
                onClick={() => openEditModal(selectedGroup)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edytuj grupę
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeleteGroup(selectedGroup.id)}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Usuń grupę
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Filters Modal */}
      <Modal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        title="Zaawansowane filtry"
      >
        <div className="space-y-4">
          <Input
            label="Wyszukaj"
            placeholder="Wprowadź frazę do wyszukania"
            value={filters.searchTerm || ''}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          />
          
          <Select
            label="Wyszukaj w"
            value={filters.searchType || 'title'}
            onChange={(e) => setFilters({ ...filters, searchType: e.target.value as 'title' | 'description' })}
            options={[
              { value: 'title', label: 'Nazwa grupy' },
              { value: 'description', label: 'Opis grupy' }
            ]}
          />
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSpots"
              checked={filters.hasAvailableSpots || false}
              onChange={(e) => setFilters({ ...filters, hasAvailableSpots: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="hasSpots" className="text-sm">
              Tylko grupy z wolnymi miejscami
            </label>
          </div>
          
          <Input
            label="Data utworzenia"
            type="date"
            value={filters.createdAt || ''}
            onChange={(e) => setFilters({ ...filters, createdAt: e.target.value })}
          />
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleApplyFilters} disabled={loading}>
              Zastosuj filtry
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Resetuj
            </Button>
            <Button variant="outline" onClick={() => setShowFiltersModal(false)}>
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}