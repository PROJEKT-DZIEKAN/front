'use client';

import { UserIcon } from '@heroicons/react/24/outline';
import { User } from '@/types/auth';
import { Group } from '@/types/group';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface UserListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedGroup: Group | null;
  onSearch: () => void;
  onSearchTermChange: (term: string) => void;
  onAddUser: (userId: number) => void;
  onRetry: () => void;
}

export default function UserList({
  users,
  loading,
  error,
  searchTerm,
  selectedGroup,
  onSearch,
  onSearchTermChange,
  onAddUser,
  onRetry
}: UserListProps) {
  const availableUsers = users.filter(user => 
    !selectedGroup?.participants?.some(p => p.id === user.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Wyszukaj użytkowników..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button onClick={onSearch} variant="outline" disabled={loading}>
          <UserIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        )}
        
        {error && (
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">Błąd ładowania użytkowników</p>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Spróbuj ponownie
            </Button>
          </div>
        )}
        
        {!loading && !error && users.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-4">
            {searchTerm ? 'Nie znaleziono użytkowników' : 'Brak użytkowników'}
          </p>
        )}
        
        {!loading && !error && users.length > 0 && (
          <div className="space-y-2">
            {availableUsers.map((user) => (
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
                <Button size="sm" onClick={() => onAddUser(user.id)} disabled={loading}>
                  Dodaj
                </Button>
              </div>
            ))}
            
            {availableUsers.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">
                Wszyscy użytkownicy są już członkami tej grupy
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
