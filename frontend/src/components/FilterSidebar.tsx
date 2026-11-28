import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Category, Tag } from '@/api/types';
import { STATUS_CONFIG, STATUS_STEPS } from '@/lib/constants';
import { Button } from './ui/button';
import { SearchBar } from './SearchBar';

interface FilterSidebarProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory?: string;
  selectedStatus?: string;
  selectedTag?: string;
  selectedLocation?: string;
  onCategoryChange: (slug?: string) => void;
  onStatusChange: (status?: string) => void;
  onTagChange: (slug?: string) => void;
  onLocationChange: (location?: string) => void;
  onReset: () => void;
  className?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  tags,
  selectedCategory,
  selectedStatus,
  selectedTag,
  selectedLocation,
  onCategoryChange,
  onStatusChange,
  onTagChange,
  onLocationChange,
  onReset,
  className = '',
}) => {
  const hasActiveFilters = !!selectedCategory || !!selectedStatus || !!selectedTag || !!selectedLocation;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          City or neighborhood
        </h4>
        <SearchBar
          value={selectedLocation || ''}
          onChange={(value) => onLocationChange(value || undefined)}
          placeholder="e.g. Indiranagar, Bengaluru"
          className="w-full"
        />
      </div>

      {/* Status Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Lifecycle Status
        </h4>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onStatusChange(undefined)}
            aria-pressed={!selectedStatus}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
              !selectedStatus
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>All Statuses</span>
          </button>
          {[...STATUS_STEPS, { key: 'closed' as const, label: STATUS_CONFIG.closed.label }].map((step) => {
            const isSelected = selectedStatus === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => onStatusChange(isSelected ? undefined : step.key)}
                aria-pressed={isSelected}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Categories
        </h4>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => onCategoryChange(undefined)}
            aria-pressed={!selectedCategory}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
              !selectedCategory
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(isSelected ? undefined : cat.slug)}
                aria-pressed={isSelected}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Popular Tags */}
      {tags.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Popular Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag.slug;
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onTagChange(isSelected ? undefined : tag.slug)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground'}`}
                >
                  #{tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
