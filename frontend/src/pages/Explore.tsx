import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  ThumbsUp,
  PlusCircle,
  AlertCircle,
  RotateCcw,
  Lightbulb,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { STATUS_CONFIG, ChallengeStatus } from '@/lib/constants';
import { useChallenges, useCategories, useTags } from '@/api/challenges';
import { ChallengeCard } from '@/components/ChallengeCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const Explore: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const category = searchParams.get('category') || undefined;
  const status = searchParams.get('status') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const search = searchParams.get('search') || '';
  const ordering = searchParams.get('ordering') || 'trending';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();

  const {
    data: challengesData,
    isLoading,
    isError,
    refetch,
  } = useChallenges({
    category,
    status,
    tag,
    search: search || undefined,
    ordering,
    page,
  });

  const challenges = challengesData?.results || [];
  const totalCount = challengesData?.count || 0;
  const pageSize = 12;
  const totalPages = Math.ceil(totalCount / pageSize);

  const updateParam = (key: string, value: string | undefined) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Reset to page 1 on filter changes
    if (key !== 'page') {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const sortTabs = [
    { label: 'Trending', value: 'trending', icon: TrendingUp },
    { label: 'Most Supported', value: '-support_count', icon: ThumbsUp },
    { label: 'Newest', value: '-created_at', icon: Clock },
    { label: 'Most Solutions', value: '-_solutions_count', icon: Lightbulb },
  ];

  const activeCategoryLabel = categories.find((c) => c.slug === category || String(c.id) === category)?.name || category;
  const activeStatusLabel = status ? (STATUS_CONFIG[status as ChallengeStatus]?.label || status) : undefined;
  const activeTagLabel = tags.find((t) => t.slug === tag || String(t.id) === tag)?.name || tag;
  const hasActiveFilters = Boolean(category || status || tag || search);

  return (
    <div className="container px-4 py-8 max-w-7xl">
      {/* Top Header & Search */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Community Challenges
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover real problems posted by citizens, support ideas, and collaborate on solutions.
            </p>
          </div>

          <Link to="/challenges/new">
            <Button variant="cta" className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Post New Challenge</span>
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={search}
            onChange={(val) => updateParam('search', val || undefined)}
            className="flex-1 w-full"
          />

          {/* Mobile Filter Button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="lg:hidden w-full sm:w-auto gap-2 border-border/80"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters {(category || status || tag) ? '• Active' : ''}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FilterSidebar
                  categories={categories}
                  tags={tags}
                  selectedCategory={category}
                  selectedStatus={status}
                  selectedTag={tag}
                  onCategoryChange={(cat) => {
                    updateParam('category', cat);
                    setMobileFilterOpen(false);
                  }}
                  onStatusChange={(st) => {
                    updateParam('status', st);
                    setMobileFilterOpen(false);
                  }}
                  onTagChange={(tg) => {
                    updateParam('tag', tg);
                    setMobileFilterOpen(false);
                  }}
                  onReset={() => {
                    handleResetFilters();
                    setMobileFilterOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sort Tabs, View Toggle & Count */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/70 rounded-xl">
            {sortTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = ordering === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => updateParam('ordering', tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {totalCount > 0 ? (
                <>Showing <strong>{challenges.length}</strong> of <strong>{totalCount}</strong> challenges</>
              ) : (
                '0 challenges found'
              )}
            </span>

            <div className="inline-flex items-center rounded-xl border border-border/80 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
            {category && (
              <button
                type="button"
                onClick={() => updateParam('category', undefined)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <span>Category: {activeCategoryLabel}</span>
                <X className="h-3 w-3" />
              </button>
            )}
            {status && (
              <button
                type="button"
                onClick={() => updateParam('status', undefined)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <span>Status: {activeStatusLabel}</span>
                <X className="h-3 w-3" />
              </button>
            )}
            {tag && (
              <button
                type="button"
                onClick={() => updateParam('tag', undefined)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <span>Tag: #{activeTagLabel}</span>
                <X className="h-3 w-3" />
              </button>
            )}
            {search && (
              <button
                type="button"
                onClick={() => updateParam('search', undefined)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <span>Search: "{search}"</span>
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Grid & Desktop Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <FilterSidebar
              categories={categories}
              tags={tags}
              selectedCategory={category}
              selectedStatus={status}
              selectedTag={tag}
              onCategoryChange={(cat) => updateParam('category', cat)}
              onStatusChange={(st) => updateParam('status', st)}
              onTagChange={(tg) => updateParam('tag', tg)}
              onReset={handleResetFilters}
            />
          </div>
        </aside>

        {/* Feed List */}
        <main className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-96 rounded-2xl border bg-card p-5 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between pt-4 border-t">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <h3 className="font-semibold text-foreground">Could not load challenges</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                There was an issue connecting to the CommonGround API. Check your connection or retry.
              </p>
              <Button size="sm" onClick={() => refetch()} variant="outline" className="gap-2">
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </Button>
            </div>
          ) : challenges.length === 0 ? (
            <EmptyState
              title="No challenges found"
              description="No challenges match your current search and filter criteria. Try clearing some filters or post the first one!"
              actionLabel="Clear Filters"
              onAction={handleResetFilters}
            />
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} variant="list" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} variant="grid" />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', (page - 1).toString())}
                className="gap-1 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-1 px-2 text-xs font-semibold text-muted-foreground">
                Page {page} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParam('page', (page + 1).toString())}
                className="gap-1 rounded-xl"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
