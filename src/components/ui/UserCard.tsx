'use client';

import { UserIcon } from '@heroicons/react/24/outline';
import Card from './Card';
import StatusBadge from './StatusBadge';

interface User {
  id: number;
  firstName: string;
  surname: string;
  roles?: string[];
  registrationStatus?: string;
}

interface UserCardProps {
  user: User;
  showId?: boolean;
  showRoles?: boolean;
  showStatus?: boolean;
  className?: string;
}

export default function UserCard({
  user,
  showId = true,
  showRoles = true,
  showStatus = true,
  className = ''
}: UserCardProps) {
  const isAdmin = user.roles?.includes('admin') || 
                  user.roles?.some((role: string | { roleName?: string }) => 
                    typeof role === 'object' && role?.roleName === 'admin'
                  );
  
  return (
    <Card className={`text-center space-y-4 ${className}`}>
      <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
        <UserIcon className="h-12 w-12 text-blue-600" />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          {user.firstName} {user.surname}
        </h2>
        <p className="text-gray-600">Student</p>
        
        {showId && (
          <p className="text-sm text-gray-500">ID: {user.id}</p>
        )}
        
        {showStatus && user.registrationStatus && (
          <div className="mt-2">
            <StatusBadge status="success">
              Status: {user.registrationStatus}
            </StatusBadge>
          </div>
        )}
        
        {showRoles && user.roles && user.roles.length > 0 && (
          <div className="mt-2">
            <StatusBadge status={isAdmin ? 'warning' : 'info'}>
              {isAdmin ? '👑 Administrator' : 'Użytkownik'}
            </StatusBadge>
          </div>
        )}
      </div>
    </Card>
  );
}
