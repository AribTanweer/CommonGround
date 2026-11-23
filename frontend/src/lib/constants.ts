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
  infrastructure: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  environment: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  education: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  healthcare: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  safety: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  technology: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  transportation: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
  community: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};
