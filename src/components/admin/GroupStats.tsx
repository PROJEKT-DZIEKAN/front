'use client';

import { Group } from '@/types/group';

interface GroupStatsProps {
  groups: Group[];
  hasAvailableSpots: (group: Group) => boolean;
}

export default function GroupStats({ groups, hasAvailableSpots }: GroupStatsProps) {
  if (groups.length === 0) return null;

  const totalMembers = groups.reduce((sum, group) => sum + (group.participants?.length || 0), 0);
  const groupsWithSpots = groups.filter(group => hasAvailableSpots(group)).length;
  const groupsWithoutLimit = groups.filter(group => !group.maxParticipants).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
        <div className="text-sm text-gray-600">Wszystkich grup</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{totalMembers}</div>
        <div className="text-sm text-gray-600">Łączna liczba członków</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{groupsWithSpots}</div>
        <div className="text-sm text-gray-600">Grup z dostępnymi miejscami</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-600">{groupsWithoutLimit}</div>
        <div className="text-sm text-gray-600">Grup bez limitu</div>
      </div>
    </div>
  );
}
