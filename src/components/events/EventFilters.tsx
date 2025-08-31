'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface EventFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  categories: Category[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: string) => void;
}

export default function EventFilters({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange
}: EventFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        type="text"
        placeholder="Szukaj wydarzeń..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        icon={<MagnifyingGlassIcon className="h-5 w-5" />}
      />

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <Button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            variant={selectedCategory === category.id ? 'primary' : 'ghost'}
            size="sm"
            className="flex-shrink-0"
          >
            {category.name} ({category.count})
          </Button>
        ))}
      </div>
    </div>
  );
}
