import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Category, Tag } from '@/api/types';
import { STATUS_STEPS } from '@/lib/constants';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface FilterSidebarProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory?: string;
  selectedStatus?: string;
  selectedTag?: string;
  onCategoryChange: (slug?: string) => void;
  onStatusChange: (status?: string) => void;
  onTagChange: (slug?: string) => void;
  onReset: () => void;
  className?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  tags,
  selectedCategory,
  selectedStatus,
  selectedTag,
  onCategoryChange,
  onStatusChange,
  onTagChange,
  onReset,
  className = '',
}) => {
  const hasActiveFilters = !!selectedCategory || !!selectedStatus || !!selectedTag;

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

      {/* Status Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Lifecycle Status
        </h4>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onStatusChange(undefined)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
              !selectedStatus
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>All Statuses</span>
          </button>
          {STATUS_STEPS.map((step) => {
            const isSelected = selectedStatus === step.key;
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => onStatusChange(isSelected ? undefined : step.key)}
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
                <Badge
                  key={tag.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onTagChange(isSelected ? undefined : tag.slug)}
                  className="cursor-pointer text-[11px] font-normal transition-all hover:border-primary/60"
                >
                  #{tag.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
