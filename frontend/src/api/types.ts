export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string | null;
  location?: string;
  reputation: number;
  is_email_verified?: boolean;
  email_notifications_enabled?: boolean;
  date_joined?: string;
  challenges_count?: number;
  solutions_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Challenge {
  id: number;
  slug: string;
  author: User;
  title: string;
  description: string;
  category: Category;
  tags: Tag[];
  location?: string;
  image?: string | null;
  status: 'open' | 'proposed' | 'in_progress' | 'resolved' | 'closed';
  support_count: number;
  has_supported?: boolean;
  is_supported?: boolean;
  category_name?: string;
  author_username?: string;
  is_following?: boolean;
  solutions_count?: number;
  comments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ChallengeUpdate {
  id: number;
  challenge?: number;
  author: User;
  body: string;
  status?: Challenge['status'] | '';
  evidence_url?: string;
  created_at: string;
}

export interface ChallengeCreatePayload {
  title: string;
  description: string;
  category: number;
  tags?: number[];
  location?: string;
  image?: File | null;
}

export interface Solution {
  id: number;
  challenge: number;
  challenge_title?: string;
  author: User;
  title: string;
  summary: string;
  estimated_cost?: string;
  effort_level: 'low' | 'med' | 'high';
  score: number;
  is_accepted: boolean;
  user_vote?: number; // 1, -1, or 0
  created_at: string;
  revisions_count?: number;
}

export interface SolutionCreatePayload {
  title: string;
  summary: string;
  estimated_cost?: string;
  effort_level: 'low' | 'med' | 'high';
}

export interface SolutionRevision {
  id: number;
  solution: number;
  editor: User;
  content: string;
  note?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  author: User;
  challenge?: number | null;
  solution?: number | null;
  parent?: number | null;
  body: string;
  created_at: string;
  replies?: Comment[];
}

export interface Notification {
  id: number;
  actor: User;
  verb: string;
  target_type: string;
  target_id: number;
  challenge?: {
    id: number;
    title: string;
  } | null;
  is_read: boolean;
  created_at: string;
}

export interface OverviewStats {
  total_challenges: number;
  resolved_count: number;
  active_users: number;
  total_solutions: number;
  top_categories: Array<{
    name: string;
    count: number;
    slug: string;
  }>;
  resolved_over_time?: Array<{
    month: string;
    resolved: number;
    challenges: number;
  }>;
}

export interface LeaderboardUser extends User {
  rank?: number;
  accepted_count?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}
