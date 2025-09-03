'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  UserGroupIcon, 
  UserIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserMinusIcon,
  FunnelIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { Group, CreateGroupRequest, GroupSearchFilters } from '@/types/group';
import { useGroups } from '@/hooks/useGroups';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import Select from '@/components/ui/Select';

export default function Groups() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const {
    groups,
    loading,
    error,
    fetchAllGroups,
    createNewGroup,
    addParticipant,
    removeParticipant,
    searchGroups,
    fetchGroupsWithSpots,
    fetchMyGroups,
    clearError,
    hasAvailableSpots,
    getAvailableSpots,
    formatGroupDate,
    isUserParticipant
  } = useGroups();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'description'>('title');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'available'>('all');
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  // Form state
  const [newGroup, setNewGroup] = useState<CreateGroupRequest>({
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

  // Load groups based on active tab
  const loadGroupsForTab = useCallback(async () => {
    try {
      switch (activeTab) {
        case 'all':
          await fetchAllGroups();
          break;
        case 'my':
          if (user) {
            const userGroups = await fetchMyGroups();
            setMyGroups(userGroups);
          }
          break;
        case 'available':
          await fetchGroupsWithSpots();
          break;
      }
    } catch (error) {
      console.error('Error loading groups for tab:', error);
    }
  }, [activeTab, fetchAllGroups, fetchMyGroups, fetchGroupsWithSpots, user]);

  // Search groups
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      loadGroupsForTab();
      return;
    }

    const searchFilters: GroupSearchFilters = {
      searchTerm,
      searchType,
      hasAvailableSpots: activeTab === 'available'
    };

    await searchGroups(searchFilters);
  }, [searchTerm, searchType, activeTab, searchGroups, loadGroupsForTab]);

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
        await loadGroupsForTab();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Join group
  const handleJoinGroup = async (groupId: number) => {
    if (!user) return;

    const success = await addParticipant(groupId, user.id);
    if (success) {
      await loadGroupsForTab();
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId: number) => {
    if (!user) return;

    const success = await removeParticipant(groupId, user.id);
    if (success) {
      await loadGroupsForTab();
      if (activeTab === 'my') {
        const userGroups = await fetchMyGroups();
        setMyGroups(userGroups);
      }
    }
  };

  // Show group details
  const showGroupDetails = (group: Group) => {
    setSelectedGroup(group);
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
    setSearchType('title');
    loadGroupsForTab();
  };

  // Load groups on mount and tab change
  useEffect(() => {
    if (isAuthenticated) {
      loadGroupsForTab();
    }
  }, [isAuthenticated, activeTab, loadGroupsForTab]);

  // Get current groups based on active tab
  const getCurrentGroups = () => {
    switch (activeTab) {
      case 'my':
        return myGroups;
      case 'all':
      case 'available':
      default:
        return groups;
    }
  };

  const currentGroups = getCurrentGroups();

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Zaloguj się, aby zobaczyć grupy</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <UserGroupIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Grupy</h1>
        <p className="text-gray-600">Znajdź i dołącz do grup które Cię interesują</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" title="Błąd">
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

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={`Wyszukaj grupy po ${searchType === 'title' ? 'nazwie' : 'opisie'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'title' | 'description')}
              className="w-32"
              options={[
                { value: 'title', label: 'Nazwa' },
                { value: 'description', label: 'Opis' }
              ]}
            />
            <Button onClick={handleSearch} variant="outline">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setShowFiltersModal(true)} variant="outline">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtry
            </Button>
            
            {isAdmin && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Utwórz grupę
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
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
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Z wolnymi miejscami
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Groups List */}
        {!loading && currentGroups.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {activeTab === 'all' && 'Brak dostępnych grup'}
              {activeTab === 'my' && 'Nie należysz do żadnej grupy'}
              {activeTab === 'available' && 'Brak grup z wolnymi miejscami'}
            </p>
          </div>
        ) : !loading && (
          <div className="space-y-4">
            {currentGroups.map((group) => {
              const userIsParticipant = user ? isUserParticipant(group, user.id) : false;
              const groupHasSpots = hasAvailableSpots(group);
              const availableSpots = getAvailableSpots(group);
              
              return (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                        Utworzono: {formatGroupDate(group.createdAt)}
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
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Członkowie: {group.participants?.length || 0}
                        {group.maxParticipants && ` / ${group.maxParticipants}`}
                      </span>
                      
                      {!groupHasSpots && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          Pełna
                        </span>
                      )}
                      
                      {groupHasSpots && group.maxParticipants && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Wolne miejsca: {availableSpots}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {!userIsParticipant && groupHasSpots && (
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={loading}
                        >
                          <UserPlusIcon className="h-4 w-4 mr-1" />
                          Dołącz
                        </Button>
                      )}
                      
                      {userIsParticipant && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                          disabled={loading}
                        >
                          <UserMinusIcon className="h-4 w-4 mr-1" />
                          Opuść
                        </Button>
                      )}
                      
                      {userIsParticipant && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full self-center">
                          Członek
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

      {/* Group Details Modal*/}
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
                <p><strong>Utworzono:</strong> {formatGroupDate(selectedGroup.createdAt)}</p>
                <p><strong>Członkowie:</strong> {selectedGroup.participants?.length || 0}
                  {selectedGroup.maxParticipants && ` / ${selectedGroup.maxParticipants}`}
                </p>
                <p><strong>Dostępne miejsca:</strong> {getAvailableSpots(selectedGroup)}</p>
                {selectedGroup.description && (
                  <div>
                    <strong>Opis:</strong>
                    <p className="mt-1 text-gray-700">{selectedGroup.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Lista członków ({selectedGroup.participants?.length || 0})
              </h4>
              {(!selectedGroup.participants || selectedGroup.participants.length === 0) ? (
                <p className="text-sm text-gray-600">Brak członków</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedGroup.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {participant.firstName || 'Nieznany'} {participant.surname || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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