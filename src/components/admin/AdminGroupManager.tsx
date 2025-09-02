'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  UserIcon, 
  PlusIcon, 
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { Group, CreateGroupRequest, UpdateGroupRequest } from '@/types/group';
import { User } from '@/types/auth';
import { 
  getAllGroups, 
  createGroup, 
  updateGroup, 
  deleteGroup,
  searchGroupsByName,
  getAllUsers,
  searchUsersByName
} from '@/utils/apiClient';
import { groupManager } from '@/utils/groupManager';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';

export default function AdminGroupManager() {
  const { user, isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formularz tworzenia grupy
  const [newGroup, setNewGroup] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    maxParticipants: undefined,
    organizerId: user?.id || 0
  });

  // Formularz edycji grupy
  const [editGroup, setEditGroup] = useState<UpdateGroupRequest>({
    name: '',
    description: '',
    maxParticipants: undefined
  });

  // Ładowanie wszystkich grup
  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const allGroups = await getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      console.error('Błąd ładowania grup:', error);
      setError('Nie można załadować grup');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Ładowanie wszystkich użytkowników
  const loadUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setError(null);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Błąd ładowania użytkowników:', error);
      setError('Nie można załadować użytkowników');
    }
  }, [isAuthenticated]);

  // Wyszukiwanie grup
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadGroups();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResults = await searchGroupsByName(searchTerm);
      setGroups(searchResults);
    } catch (error) {
      console.error('Błąd wyszukiwania grup:', error);
      setError('Błąd wyszukiwania grup');
    } finally {
      setLoading(false);
    }
  };

  // Wyszukiwanie użytkowników
  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) {
      loadUsers();
      return;
    }

    try {
      setError(null);
      const searchResults = await searchUsersByName(userSearchTerm);
      setUsers(searchResults);
    } catch (error) {
      console.error('Błąd wyszukiwania użytkowników:', error);
      setError('Błąd wyszukiwania użytkowników');
    }
  };

  // Tworzenie grupy
  const handleCreateGroup = async () => {
    if (!user || !newGroup.name.trim()) return;

    try {
      setLoading(true);
      const groupData = {
        ...newGroup,
        organizerId: user.id
      };

      await createGroup(groupData);
      
      // Resetowanie formularza
      setNewGroup({
        name: '',
        description: '',
        maxParticipants: undefined,
        organizerId: user.id
      });
      
      setShowCreateModal(false);
      await loadGroups();
    } catch (error) {
      console.error('Błąd tworzenia grupy:', error);
      setError('Błąd tworzenia grupy');
    } finally {
      setLoading(false);
    }
  };

  // Edycja grupy
  const handleEditGroup = async () => {
    if (!selectedGroup || !editGroup.name?.trim()) return;

    try {
      setLoading(true);
      await updateGroup(selectedGroup.id, editGroup);
      
      setShowEditModal(false);
      setSelectedGroup(null);
      await loadGroups();
    } catch (error) {
      console.error('Błąd edycji grupy:', error);
      setError('Błąd edycji grupy');
    } finally {
      setLoading(false);
    }
  };

  // Usuwanie grupy
  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę grupę? Ta operacja jest nieodwracalna.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteGroup(groupId);
      await loadGroups();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Błąd usuwania grupy:', error);
      setError('Błąd usuwania grupy');
    } finally {
      setLoading(false);
    }
  };

  // Dodawanie użytkownika do grupy
  const handleAddUserToGroup = async (userId: number) => {
    if (!selectedGroup) return;

    try {
      setLoading(true);
      // Używamy API do dodania uczestnika
      const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/add-participant/${selectedGroup.id}/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await loadGroups();
      setShowAddUserModal(false);
    } catch (error) {
      console.error('Błąd dodawania użytkownika do grupy:', error);
      setError('Błąd dodawania użytkownika do grupy');
    } finally {
      setLoading(false);
    }
  };

  // Usuwanie użytkownika z grupy
  const handleRemoveUserFromGroup = async (userId: number) => {
    if (!selectedGroup) return;

    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika z grupy?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/remove-participant/${selectedGroup.id}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await loadGroups();
    } catch (error) {
      console.error('Błąd usuwania użytkownika z grupy:', error);
      setError('Błąd usuwania użytkownika z grupy');
    } finally {
      setLoading(false);
    }
  };

  // Otwieranie modalu dodawania użytkownika
  const openAddUserModal = (group: Group) => {
    setSelectedGroup(group);
    setShowAddUserModal(true);
    loadUsers();
  };

  // Otwieranie modalu edycji
  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setEditGroup({
      name: group.name,
      description: group.description || '',
      maxParticipants: group.maxParticipants
    });
    setShowEditModal(true);
  };

  // Wyświetlanie szczegółów grupy
  const showGroupDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
      loadUsers();
    }
  }, [isAuthenticated, loadGroups, loadUsers]);

  if (!isAuthenticated) {
    return (
      <Alert type="warning" title="Brak autoryzacji">
        Musisz być zalogowany jako administrator
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header i kontrolki */}
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
          <Button variant="outline" onClick={loadGroups} disabled={loading}>
            Odśwież
          </Button>
        </div>
      </div>

      {/* Wyszukiwarka */}
      <div className="flex gap-2">
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
      </div>

      {/* Błędy */}
      {error && (
        <Alert type="error" title="Błąd">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setError(null)}
            className="mt-2"
          >
            Zamknij
          </Button>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Statystyki */}
      {!loading && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
              <div className="text-sm text-gray-600">Wszystkich grup</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {groups.reduce((sum, group) => sum + group.participants.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Łączna liczba członków</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {groups.filter(group => groupManager.hasAvailableSpots(group)).length}
              </div>
              <div className="text-sm text-gray-600">Grup z dostępnymi miejscami</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista grup */}
      {!loading && groups.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Nie znaleziono grup' : 'Brak grup w systemie'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Organizator:</strong> {group.organizer.firstName} {group.organizer.surname} (ID: {group.organizer.id})
                  </p>
                  {group.description && (
                    <p className="text-sm text-gray-700 mb-2">{group.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>ID: {group.id}</span>
                    <span>Utworzono: {groupManager.formatGroupDate(group.createdAt)}</span>
                    <span>
                      Członkowie: {group.participants.length}
                      {group.maxParticipants && ` / ${group.maxParticipants}`}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      groupManager.hasAvailableSpots(group) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {groupManager.hasAvailableSpots(group) ? 'Dostępne miejsca' : 'Pełna'}
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
                    <UserIcon className="h-4 w-4" />
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

      {/* Modal tworzenia grupy */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Utwórz nową grupę"
      >
        <div className="space-y-4">
          <Input
            label="Nazwa grupy"
            placeholder="Wprowadź nazwę grupy"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            required
          />
          
          <TextArea
            label="Opis grupy"
            placeholder="Opisz cel i działalność grupy"
            value={newGroup.description || ''}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            rows={3}
          />
          
          <Input
            label="Maksymalna liczba członków (opcjonalne)"
            type="number"
            placeholder="Bez limitu"
            value={newGroup.maxParticipants || ''}
            onChange={(e) => setNewGroup({ 
              ...newGroup, 
              maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            min="1"
          />
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateGroup} disabled={!newGroup.name.trim() || loading}>
              Utwórz grupę
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal edycji grupy */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edytuj grupę: ${selectedGroup?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Nazwa grupy"
            placeholder="Wprowadź nazwę grupy"
            value={editGroup.name || ''}
            onChange={(e) => setEditGroup({ ...editGroup, name: e.target.value })}
            required
          />
          
          <TextArea
            label="Opis grupy"
            placeholder="Opisz cel i działalność grupy"
            value={editGroup.description || ''}
            onChange={(e) => setEditGroup({ ...editGroup, description: e.target.value })}
            rows={3}
          />
          
          <Input
            label="Maksymalna liczba członków (opcjonalne)"
            type="number"
            placeholder="Bez limitu"
            value={editGroup.maxParticipants || ''}
            onChange={(e) => setEditGroup({ 
              ...editGroup, 
              maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            min="1"
          />
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleEditGroup} disabled={!editGroup.name?.trim() || loading}>
              Zapisz zmiany
            </Button>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal dodawania użytkownika do grupy */}
      <Modal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title={`Dodaj użytkownika do grupy: ${selectedGroup?.name}`}
      >
        <div className="space-y-4">
          {/* Wyszukiwarka użytkowników */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Wyszukaj użytkowników..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
              />
            </div>
            <Button onClick={handleUserSearch} variant="outline">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista użytkowników */}
          <div className="max-h-60 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">
                {userSearchTerm ? 'Nie znaleziono użytkowników' : 'Ładowanie użytkowników...'}
              </p>
            ) : (
              <div className="space-y-2">
                {users
                  .filter(user => !selectedGroup?.participants.some(p => p.id === user.id))
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
                {users.filter(user => !selectedGroup?.participants.some(p => p.id === user.id)).length === 0 && (
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

      {/* Modal szczegółów grupy */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Szczegóły grupy: ${selectedGroup?.name}`}
      >
        {selectedGroup && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID grupy:</strong> {selectedGroup.id}
              </div>
              <div>
                <strong>Utworzono:</strong> {groupManager.formatGroupDate(selectedGroup.createdAt)}
              </div>
              <div>
                <strong>Organizator:</strong> {selectedGroup.organizer.firstName} {selectedGroup.organizer.surname}
              </div>
              <div>
                <strong>ID organizatora:</strong> {selectedGroup.organizer.id}
              </div>
              <div>
                <strong>Członkowie:</strong> {selectedGroup.participants.length}
                {selectedGroup.maxParticipants && ` / ${selectedGroup.maxParticipants}`}
              </div>
              <div>
                <strong>Dostępne miejsca:</strong> {groupManager.getAvailableSpots(selectedGroup)}
              </div>
            </div>
            
            {selectedGroup.description && (
              <div>
                <strong>Opis:</strong>
                <p className="mt-1 text-sm text-gray-700">{selectedGroup.description}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Lista członków ({selectedGroup.participants.length})
              </h4>
              {selectedGroup.participants.length === 0 ? (
                <p className="text-sm text-gray-600">Brak członków</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedGroup.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {participant.firstName} {participant.surname}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">ID: {participant.id}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveUserFromGroup(participant.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Usuń
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => openAddUserModal(selectedGroup)}
              >
                <UserIcon className="h-4 w-4 mr-2" />
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
    </div>
  );
}
