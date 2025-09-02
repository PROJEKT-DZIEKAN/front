'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  UserIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserMinusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { Group, CreateGroupRequest } from '@/types/group';
import { 
  getAllGroups, 
  getMyGroups, 
  createGroup, 
  deleteGroup,
  searchGroupsByName 
} from '@/utils/apiClient';
import { groupManager } from '@/utils/groupManager';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Groups() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Formularz tworzenia grupy
  const [newGroup, setNewGroup] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    maxParticipants: undefined,
    organizerId: user?.id || 0
  });

  // Ładowanie grup
  const loadGroups = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      console.log('🔄 Ładowanie grup dla użytkownika:', user.id);
      
      // Ładujemy równolegle, ale obsługujemy błędy osobno
      const [allGroupsData, myGroupsData] = await Promise.all([
        getAllGroups().catch(error => {
          console.error('Błąd ładowania wszystkich grup:', error);
          return []; // Zwracamy pustą tablicę w przypadku błędu
        }),
        getMyGroups(user.id).catch(error => {
          console.error('Błąd ładowania moich grup:', error);
          return []; // Zwracamy pustą tablicę w przypadku błędu
        })
      ]);
      
      console.log('✅ Załadowano grupy:', { all: allGroupsData.length, my: myGroupsData.length });
      setGroups(allGroupsData);
      setMyGroups(myGroupsData);
    } catch (error) {
      console.error('❌ Nieoczekiwany błąd ładowania grup:', error);
      // W przypadku całkowitego błędu, ustawiamy puste tablice
      setGroups([]);
      setMyGroups([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Wyszukiwanie grup
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadGroups();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await searchGroupsByName(searchTerm);
      setGroups(searchResults);
    } catch (error) {
      console.error('Błąd wyszukiwania grup:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tworzenie grupy
  const handleCreateGroup = async () => {
    if (!user || !newGroup.name.trim()) return;

    try {
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
    }
  };

  // Dołączanie do grupy
  const handleJoinGroup = async (groupId: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/add-participant/${groupId}/${user.id}`, {
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
    } catch (error) {
      console.error('Błąd dołączania do grupy:', error);
      alert('Nie udało się dołączyć do grupy. Sprawdź czy masz dostęp.');
    } finally {
      setLoading(false);
    }
  };

  // Opuszczanie grupy
  const handleLeaveGroup = async (groupId: number) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`https://dziekan-48de5f4dea14.herokuapp.com/api/groups/remove-participant/${groupId}/${user.id}`, {
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
      console.error('Błąd opuszczania grupy:', error);
      alert('Nie udało się opuścić grupy.');
    } finally {
      setLoading(false);
    }
  };

  // Usuwanie grupy (tylko organizator/admin)
  const handleDeleteGroup = async (groupId: number) => {
    if (!user) return;

    if (confirm('Czy na pewno chcesz usunąć tę grupę?')) {
      try {
        await deleteGroup(groupId);
        await loadGroups();
        setShowDetailsModal(false);
      } catch (error) {
        console.error('Błąd usuwania grupy:', error);
      }
    }
  };

  // Wyświetlanie szczegółów grupy
  const showGroupDetails = (group: Group) => {
    setSelectedGroup(group);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated, user, loadGroups]);

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Zaloguj się, aby zobaczyć grupy</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const currentGroups = activeTab === 'all' ? groups : myGroups;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <UserGroupIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Grupy</h1>
        <p className="text-gray-600">Zarządzaj grupami i członkostwem</p>
      </div>

      {/* Kontrolki */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Wyszukiwarka */}
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Wyszukaj grupy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} variant="outline">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Przycisk tworzenia grupy - tylko dla adminów */}
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Utwórz grupę
            </Button>
          )}
        </div>

        {/* Zakładki */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Wszystkie grupy ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'my'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Moje grupy ({myGroups.length})
          </button>
        </div>

        {/* Lista grup */}
        {currentGroups.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {activeTab === 'all' ? 'Brak dostępnych grup' : 'Nie należysz do żadnej grupy'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentGroups.map((group) => {
              const permissions = groupManager.checkGroupPermissions(group, user?.id || 0);
              
              return (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-600">
                        Organizator: {group.organizer?.firstName || 'Nieznany'} {group.organizer?.surname || ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showGroupDetails(group)}
                      >
                        Szczegóły
                      </Button>
                      {permissions.isOrganizer && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Członkowie: {group.participants?.length || 0}
                      {group.maxParticipants && ` / ${group.maxParticipants}`}
                      {!permissions.hasSpots && ' (Pełna)'}
                    </div>
                    
                    <div className="flex gap-2">
                      {!permissions.isParticipant && !permissions.isOrganizer && permissions.hasSpots && (
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          <UserPlusIcon className="h-4 w-4 mr-1" />
                          Dołącz
                        </Button>
                      )}
                      
                      {permissions.isParticipant && !permissions.isOrganizer && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                        >
                          <UserMinusIcon className="h-4 w-4 mr-1" />
                          Opuść
                        </Button>
                      )}
                      
                      {permissions.isOrganizer && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Organizator
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            <Button onClick={handleCreateGroup} disabled={!newGroup.name.trim()}>
              Utwórz grupę
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Anuluj
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal szczegółów grupy */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedGroup?.name || ''}
      >
        {selectedGroup && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informacje o grupie</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Organizator:</strong> {selectedGroup.organizer?.firstName || 'Nieznany'} {selectedGroup.organizer?.surname || ''}</p>
                <p><strong>Utworzono:</strong> {groupManager.formatGroupDate(selectedGroup.createdAt)}</p>
                <p><strong>Członkowie:</strong> {selectedGroup.participants?.length || 0}{selectedGroup.maxParticipants && ` / ${selectedGroup.maxParticipants}`}</p>
                {selectedGroup.description && (
                  <p><strong>Opis:</strong> {selectedGroup.description}</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Lista członków</h4>
              {(!selectedGroup.participants || selectedGroup.participants.length === 0) ? (
                <p className="text-sm text-gray-600">Brak członków</p>
              ) : (
                <div className="space-y-2">
                  {selectedGroup.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{participant.firstName || 'Nieznany'} {participant.surname || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}