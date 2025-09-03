'use client';

import { UserIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { Group } from '@/types/group';
import Button from '@/components/ui/Button';

interface GroupDetailsProps {
  group: Group;
  loading: boolean;
  onAddUser: (group: Group) => void;
  onEdit: (group: Group) => void;
  onDelete: (groupId: number) => void;
  onRemoveUser: (userId: number) => void;
  getAvailableSpots: (group: Group) => number | string;
  formatGroupDate: (date: string) => string;
}

export default function GroupDetails({
  group,
  loading,
  onAddUser,
  onEdit,
  onDelete,
  onRemoveUser,
  getAvailableSpots,
  formatGroupDate
}: GroupDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Informacje o grupie</h4>
        <div className="space-y-2 text-sm">
          <p><strong>ID grupy:</strong> {group.id}</p>
          <p><strong>Utworzono:</strong> {formatGroupDate(group.createdAt)}</p>
          <p><strong>Członkowie:</strong> {group.participants?.length || 0}
            {group.maxParticipants && ` / ${group.maxParticipants}`}
          </p>
          <p><strong>Dostępne miejsca:</strong> {getAvailableSpots(group)}</p>
          {group.description && (
            <div>
              <strong>Opis:</strong>
              <p className="mt-1 text-gray-700">{group.description}</p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-3">
          Lista członków ({group.participants?.length || 0})
        </h4>
        {(!group.participants || group.participants.length === 0) ? (
          <p className="text-sm text-gray-600">Brak członków</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {group.participants.map((participant) => (
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
                  onClick={() => onRemoveUser(participant.id)}
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

      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" onClick={() => onAddUser(group)}>
          <UserIcon className="h-4 w-4 mr-2" />
          Dodaj użytkownika
        </Button>
        <Button variant="outline" onClick={() => onEdit(group)}>
          <UserIcon className="h-4 w-4 mr-2" />
          Edytuj grupę
        </Button>
        <Button variant="outline" onClick={() => onDelete(group.id)} className="text-red-600 hover:text-red-700">
          <UserIcon className="h-4 w-4 mr-2" />
          Usuń grupę
        </Button>
      </div>
    </div>
  );
}
