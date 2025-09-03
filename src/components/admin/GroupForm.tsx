'use client';

import { CreateGroupRequest, UpdateGroupRequest } from '@/types/group';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';

interface GroupFormProps {
  isEdit: boolean;
  formData: CreateGroupRequest | UpdateGroupRequest;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (field: keyof CreateGroupRequest, value: string | number | undefined) => void;
}

export default function GroupForm({
  isEdit,
  formData,
  loading,
  onSubmit,
  onCancel,
  onChange
}: GroupFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Nazwa grupy *"
        placeholder="Wprowadź nazwę grupy"
        value={formData.name || ''}
        onChange={(e) => onChange('name', e.target.value)}
        required
        maxLength={255}
      />
      <TextArea
        label="Opis grupy"
        placeholder="Opisz cel i działalność grupy"
        value={formData.description || ''}
        onChange={(e) => onChange('description', e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <Input
        label="Maksymalna liczba członków"
        type="number"
        placeholder="Bez limitu"
        value={formData.maxParticipants || ''}
        onChange={(e) => onChange('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
        min="0"
      />
      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} disabled={!formData.name?.trim() || loading}>
          {loading ? (isEdit ? 'Zapisywanie...' : 'Tworzenie...') : (isEdit ? 'Zapisz zmiany' : 'Utwórz grupę')}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}
