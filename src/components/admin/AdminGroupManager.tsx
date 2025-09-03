'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { Group, CreateGroupRequest, UpdateGroupRequest, GroupSearchFilters } from '@/types/group';
import { User } from '@/types/auth';
import { useGroups } from '@/hooks/useGroups';
import { getAllUsers, searchUsersByName } from '@/utils/apiClient';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import GroupList from './GroupList';
import GroupStats from './GroupStats';
import GroupForm from './GroupForm';
import UserList from './UserList';
import GroupDetails from './GroupDetails';
import GroupFilters from './GroupFilters';

export default function AdminGroupManager() {
  const { isAuthenticated } = useAuth();
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
    clearError,
    hasAvailableSpots,
    getAvailableSpots,
    formatGroupDate
  } = useGroups();

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

  const [filters, setFilters] = useState<GroupSearchFilters>({
    searchTerm: '',
    searchType: 'title',
    hasAvailableSpots: false
  });

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

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      fetchAllGroups();
      return;
    }
    const searchFilters: GroupSearchFilters = { searchTerm, searchType: 'title' };
    await searchGroups(searchFilters);
  }, [searchTerm, searchGroups, fetchAllGroups]);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    try {
      const createdGroup = await createNewGroup(newGroup);
      if (createdGroup) {
        setNewGroup({ name: '', description: '', maxParticipants: undefined });
        setShowCreateModal(false);
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

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

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę grupę? Ta operacja jest nieodwracalna.')) return;
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

  const handleAddUserToGroup = async (userId: number) => {
    if (!selectedGroup) return;
    try {
      const success = await addParticipant(selectedGroup.id, userId);
      if (success) {
        setShowAddUserModal(false);
        const updatedGroup = await getGroup(selectedGroup.id);
        if (updatedGroup) setSelectedGroup(updatedGroup);
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error adding user to group:', error);
    }
  };

  const handleRemoveUserFromGroup = async (userId: number) => {
    if (!selectedGroup) return;
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika z grupy?')) return;
    try {
      const success = await removeParticipant(selectedGroup.id, userId);
      if (success) {
        const updatedGroup = await getGroup(selectedGroup.id);
        if (updatedGroup) setSelectedGroup(updatedGroup);
        await fetchAllGroups();
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
    }
  };

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
    const freshGroup = await getGroup(group.id);
    setSelectedGroup(freshGroup || group);
    setShowDetailsModal(true);
  };

  const handleApplyFilters = async () => {
    await searchGroups(filters);
    setShowFiltersModal(false);
  };

  const handleResetFilters = () => {
    setFilters({ searchTerm: '', searchType: 'title', hasAvailableSpots: false });
    setSearchTerm('');
    fetchAllGroups();
  };

  const handleFormChange = (field: keyof CreateGroupRequest, value: string | number | undefined) => {
    if (showEditModal) {
      setEditGroup(prev => ({ ...prev, [field]: value }));
    } else {
      setNewGroup(prev => ({ ...prev, [field]: value }));
    }
  };

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

      {error && (
        <Alert type="error" title="Błąd grup">
          {error}
          <Button variant="outline" size="sm" onClick={clearError} className="mt-2">
            Zamknij
          </Button>
        </Alert>
      )}

      {usersError && (
        <Alert type="warning" title="Błąd użytkowników">
          {usersError}
          <Button variant="outline" size="sm" onClick={() => setUsersError(null)} className="mt-2">
            Zamknij
          </Button>
        </Alert>
      )}

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

        <GroupStats groups={groups} hasAvailableSpots={hasAvailableSpots} />
      </div>

      <GroupList
        groups={groups}
        loading={loading}
        searchTerm={searchTerm}
        onShowDetails={showGroupDetails}
        onAddUser={openAddUserModal}
        onEdit={openEditModal}
        onDelete={handleDeleteGroup}
        hasAvailableSpots={hasAvailableSpots}
        getAvailableSpots={getAvailableSpots}
        formatGroupDate={formatGroupDate}
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Utwórz nową grupę">
        <GroupForm
          isEdit={false}
          formData={newGroup}
          loading={loading}
          onSubmit={handleCreateGroup}
          onCancel={() => setShowCreateModal(false)}
          onChange={handleFormChange}
        />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edytuj grupę: ${selectedGroup?.name}`}>
        <GroupForm
          isEdit={true}
          formData={editGroup}
          loading={loading}
          onSubmit={handleUpdateGroup}
          onCancel={() => setShowEditModal(false)}
          onChange={handleFormChange}
        />
      </Modal>

      <Modal isOpen={showAddUserModal} onClose={() => setShowAddUserModal(false)} title={`Dodaj użytkownika do grupy: ${selectedGroup?.name}`}>
        <div className="space-y-4">
          <UserList
            users={users}
            loading={usersLoading}
            error={usersError}
            searchTerm={userSearchTerm}
            selectedGroup={selectedGroup}
            onSearch={handleUserSearch}
            onSearchTermChange={setUserSearchTerm}
            onAddUser={handleAddUserToGroup}
            onRetry={loadUsers}
          />

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
              Zamknij
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Szczegóły grupy: ${selectedGroup?.name}`}>
        {selectedGroup && (
          <GroupDetails
            group={selectedGroup}
            loading={loading}
            onAddUser={openAddUserModal}
            onEdit={openEditModal}
            onDelete={handleDeleteGroup}
            onRemoveUser={handleRemoveUserFromGroup}
            getAvailableSpots={getAvailableSpots}
            formatGroupDate={formatGroupDate}
          />
        )}
      </Modal>

      <Modal isOpen={showFiltersModal} onClose={() => setShowFiltersModal(false)} title="Zaawansowane filtry">
        <GroupFilters
          filters={filters}
          loading={loading}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onCancel={() => setShowFiltersModal(false)}
        />
      </Modal>
    </div>
  );
}