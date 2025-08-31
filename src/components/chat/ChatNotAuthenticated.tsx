'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

export default function ChatNotAuthenticated() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <SectionHeader
          icon={<ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto" />}
          title="Zaloguj się"
          subtitle="Musisz się zalogować aby korzystać z czatu z organizatorami."
        />
      </Card>
    </div>
  );
}
