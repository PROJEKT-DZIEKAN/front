'use client';

import { GroupSearchFilters } from '@/types/group';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface GroupFiltersProps {
  filters: GroupSearchFilters;
  loading: boolean;
  onFiltersChange: (filters: GroupSearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onCancel: () => void;
}

export default function GroupFilters({
  filters,
  loading,
  onFiltersChange,
  onApply,
  onReset,
  onCancel
}: GroupFiltersProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Wyszukaj"
        placeholder="Wprowadź frazę do wyszukania"
        value={filters.searchTerm || ''}
        onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
      />
      
      <Select
        label="Wyszukaj w"
        value={filters.searchType || 'title'}
        onChange={(e) => onFiltersChange({ ...filters, searchType: e.target.value as 'title' | 'description' })}
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
          onChange={(e) => onFiltersChange({ ...filters, hasAvailableSpots: e.target.checked })}
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
        onChange={(e) => onFiltersChange({ ...filters, createdAt: e.target.value })}
      />
      
      <div className="flex gap-2 pt-4">
        <Button onClick={onApply} disabled={loading}>
          Zastosuj filtry
        </Button>
        <Button variant="outline" onClick={onReset}>
          Resetuj
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}
