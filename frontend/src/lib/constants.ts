export type ChallengeStatus = 'open' | 'proposed' | 'in_progress' | 'resolved' | 'closed';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  stepIndex: number;
}

export const STATUS_CONFIG: Record<ChallengeStatus, StatusConfig> = {
  open: {
    label: 'Open',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/60',
    borderColor: 'border-blue-200 dark:border-blue-800',
    stepIndex: 0,
  },
  proposed: {
    label: 'Proposed',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    borderColor: 'border-purple-200 dark:border-purple-800',
    stepIndex: 1,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/60',
    borderColor: 'border-amber-200 dark:border-amber-800',
    stepIndex: 2,
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    stepIndex: 3,
  },
  closed: {
    label: 'Closed',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    stepIndex: -1,
  },
};

export const STATUS_STEPS: Array<{ key: ChallengeStatus; label: string; desc: string }> = [
  { key: 'open', label: 'Open', desc: 'Awaiting community validation & proposals' },
  { key: 'proposed', label: 'Solutions Proposed', desc: 'Community has submitted proposals' },
  { key: 'in_progress', label: 'In Progress', desc: 'Accepted solution is being executed' },
  { key: 'resolved', label: 'Resolved', desc: 'Challenge solved and verified' },
];

export const EFFORT_LEVELS = [
  { value: 'low', label: 'Low Effort', color: 'text-green-600 bg-green-50 dark:bg-green-950/50 border-green-200' },
  { value: 'med', label: 'Medium Effort', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200' },
  { value: 'high', label: 'High Effort', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: 'bg-blue-100 text-blue-800 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60',
  environment: 'bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  education: 'bg-amber-100 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  healthcare: 'bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
  safety: 'bg-red-100 text-red-800 border-red-200/80 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60',
  technology: 'bg-indigo-100 text-indigo-800 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60',
  transportation: 'bg-cyan-100 text-cyan-800 border-cyan-200/80 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60',
  community: 'bg-purple-100 text-purple-800 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  infrastructure: 'from-blue-500/15 via-indigo-500/10 to-sky-500/15 text-blue-600 dark:text-blue-400',
  environment: 'from-emerald-500/15 via-teal-500/10 to-green-500/15 text-emerald-600 dark:text-emerald-400',
  education: 'from-amber-500/15 via-orange-500/10 to-yellow-500/15 text-amber-600 dark:text-amber-400',
  healthcare: 'from-rose-500/15 via-pink-500/10 to-red-500/15 text-rose-600 dark:text-rose-400',
  safety: 'from-red-500/15 via-rose-500/10 to-orange-500/15 text-red-600 dark:text-red-400',
  technology: 'from-indigo-500/15 via-violet-500/10 to-blue-500/15 text-indigo-600 dark:text-indigo-400',
  transportation: 'from-cyan-500/15 via-sky-500/10 to-blue-500/15 text-cyan-600 dark:text-cyan-400',
  community: 'from-purple-500/15 via-fuchsia-500/10 to-indigo-500/15 text-purple-600 dark:text-purple-400',
};

export function getCategoryColor(slug?: string): string {
  if (!slug) return 'bg-muted/60 text-foreground border-border/60';
  return CATEGORY_COLORS[slug.toLowerCase()] || 'bg-muted/60 text-foreground border-border/60';
}

export function getCategoryGradient(slug?: string): string {
  if (!slug) return 'from-primary/10 via-indigo-500/10 to-purple-500/10 text-primary';
  return CATEGORY_GRADIENTS[slug.toLowerCase()] || 'from-primary/10 via-indigo-500/10 to-purple-500/10 text-primary';
}
