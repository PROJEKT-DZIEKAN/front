'use client';

import { UserGroupIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Group } from '@/types/group';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface GroupListProps {
  groups: Group[];
  loading: boolean;
  searchTerm: string;
  onShowDetails: (group: Group) => void;
  onAddUser: (group: Group) => void;
  onEdit: (group: Group) => void;
  onDelete: (groupId: number) => void;
  hasAvailableSpots: (group: Group) => boolean;
  getAvailableSpots: (group: Group) => number | string;
  formatGroupDate: (date: string) => string;
}

export default function GroupList({
  groups,
  loading,
  searchTerm,
  onShowDetails,
  onAddUser,
  onEdit,
  onDelete,
  hasAvailableSpots,
  getAvailableSpots,
  formatGroupDate
}: GroupListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          {searchTerm ? 'Nie znaleziono grup' : 'Brak grup w systemie'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
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
                  hasAvailableSpots(group) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hasAvailableSpots(group) ? `Wolne miejsca: ${getAvailableSpots(group)}` : 'Pełna'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => onShowDetails(group)}>
                Szczegóły
              </Button>
              <Button variant="outline" size="sm" onClick={() => onAddUser(group)} className="text-green-600 hover:text-green-700">
                <UserIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(group)}>
                <UserIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(group.id)} className="text-red-600 hover:text-red-700">
                <UserIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
