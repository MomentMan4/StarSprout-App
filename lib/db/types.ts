// StarSprout Database Types - Complete domain model

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export type Role = "parent" | "child"
export type AgeBand = "early_child" | "mid_child" | "pre_teen" | "teen"
export type TaskStatus = "pending" | "submitted" | "approved" | "rejected" | "expired"
export type RedemptionStatus = "requested" | "approved" | "rejected" | "fulfilled"
export type FriendshipStatus = "pending" | "approved" | "rejected"
export type QuestCategory = "chores" | "homework" | "hygiene" | "exercise" | "creativity" | "kindness" | "other"
export type BadgeCategory = "first_quest" | "streak" | "milestone" | "special"
export type ConsentType = "coppa" | "ai_features" | "social_features"
export type EventType =
  | "task_assigned"
  | "task_submitted"
  | "task_approved"
  | "task_rejected"
  | "reward_requested"
  | "reward_approved"
  | "reward_fulfilled"
  | "badge_awarded"
  | "friend_requested"
  | "friend_approved"

// ============================================================================
// ADMIN TYPES
// ============================================================================

export type UserStatus = "active" | "disabled"
export type HouseholdStatus = "active" | "flagged" | "disabled"
export type FeatureFlagScope = "global" | "household" | "user"
export type AdminActionType =
  | "UPDATE_USER"
  | "DISABLE_USER"
  | "ENABLE_USER"
  | "UPDATE_HOUSEHOLD"
  | "DISABLE_HOUSEHOLD"
  | "UPDATE_TEMPLATE"
  | "UPDATE_BADGE"
  | "UPDATE_FLAG"
  | "RUN_JOB"
  | "REGENERATE_INVITE_CODE"
  | "PROMOTE_ADMIN"
  | "DEMOTE_ADMIN"
export type AdminEntityType = "household" | "user" | "quest_template" | "badge" | "feature_flag" | "job"

export interface AdminAuditLog {
  id: string
  actor_admin_user_id: string
  actor_email: string
  action_type: AdminActionType
  entity_type: AdminEntityType
  entity_id: string
  before_json: Record<string, any> | null
  after_json: Record<string, any> | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface FeatureFlagNew {
  id: string
  scope_type: FeatureFlagScope
  scope_id: string | null
  key: string
  enabled: boolean
  value_json: Record<string, any> | null
  created_at: string
  updated_at: string
}

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

export interface Household {
  id: string
  name: string
  status: HouseholdStatus
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  household_id: string
  role: Role
  nickname: string
  avatar_url: string | null
  age_band: AgeBand | null
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface Consent {
  id: string
  household_id: string
  parent_id: string
  child_id: string | null
  consent_type: ConsentType
  granted: boolean
  granted_at: string | null
  created_at: string
}

export interface QuestTemplate {
  id: string
  household_id: string | null
  created_by: string | null
  title: string
  description: string | null
  category: QuestCategory
  suggested_points: number
  icon_emoji: string | null
  is_system_template: boolean
  age_band_min: AgeBand | null
  age_band_max: AgeBand | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  household_id: string
  template_id: string | null
  assigned_to: string
  assigned_by: string
  title: string
  description: string | null
  category: QuestCategory
  points: number
  status: TaskStatus
  due_date: string | null
  submitted_at: string | null
  approved_at: string | null
  approved_by: string | null
  reflection_text: string | null
  streak_eligible: boolean
  created_at: string
  updated_at: string
}

export interface Reward {
  id: string
  household_id: string
  created_by: string
  title: string
  description: string | null
  points_cost: number
  icon_emoji: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RewardRedemption {
  id: string
  household_id: string
  reward_id: string
  child_id: string
  points_spent: number
  status: RedemptionStatus
  requested_at: string
  approved_at: string | null
  approved_by: string | null
  fulfilled_at: string | null
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  badge_key: string
  title: string
  description: string | null
  icon_url: string | null
  category: BadgeCategory
  award_criteria: Record<string, any> | null
  created_at: string
}

export interface UserBadge {
  id: string
  household_id: string
  user_id: string
  badge_id: string
  awarded_at: string
}

export interface Streak {
  id: string
  household_id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_completion_date: string | null
  created_at: string
  updated_at: string
}

export interface Friendship {
  id: string
  child_id: string
  friend_id: string
  status: FriendshipStatus
  requested_at: string
  approved_at: string | null
  approved_by: string | null
  created_at: string
}

export interface LeaderboardSnapshot {
  id: string
  user_id: string
  week_start: string
  week_end: string
  points_earned: number
  quests_completed: number
  rank: number | null
  created_at: string
}

export interface ActivityEvent {
  id: string
  household_id: string
  user_id: string | null
  event_type: EventType
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface WeeklySummary {
  id: string
  household_id: string
  week_start: string
  week_end: string
  summary_text: string | null
  strengths: Record<string, any> | null
  opportunities: Record<string, any> | null
  suggested_praise: string | null
  generated_at: string
  ai_generated: boolean
  created_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  email_enabled: boolean
  weekly_summary_email: boolean
  in_app_enabled: boolean
  created_at: string
  updated_at: string
}

export interface FeatureFlag {
  id: string
  flag_key: string
  flag_name: string
  description: string | null
  is_enabled: boolean
  household_id: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface UserPoints {
  id: string
  household_id: string
  user_id: string
  total_points: number
  available_points: number
  spent_points: number
  weekly_points: number
  last_reset_date: string | null
  created_at: string
  updated_at: string
}

export interface InviteCode {
  id: string
  child_id: string
  code: string
  created_at: string
  expires_at: string | null
}

// ============================================================================
// DOMAIN AGGREGATE TYPES (for queries with joins)
// ============================================================================

export interface TaskWithDetails extends Task {
  assignee?: User
  assigner?: User
  template?: QuestTemplate
}

export interface RewardRedemptionWithDetails extends RewardRedemption {
  reward?: Reward
  child?: User
  approver?: User
}

export interface UserWithPoints extends User {
  points?: UserPoints
  badges?: Badge[]
  streak?: Streak
}

export interface FriendshipWithUsers extends Friendship {
  child?: User
  friend?: User
  approver?: User
}

// ============================================================================
// INPUT TYPES (for mutations)
// ============================================================================

export interface CreateHouseholdInput {
  name: string
}

export interface CreateUserInput {
  id: string // Clerk user ID
  household_id: string
  role: Role
  nickname: string
  avatar_url?: string | null
  age_band?: AgeBand | null
}

export interface CreateConsentInput {
  household_id: string
  parent_id: string
  child_id?: string | null
  consent_type: ConsentType
  granted: boolean
}

export interface CreateQuestTemplateInput {
  household_id: string | null
  created_by: string | null
  title: string
  description?: string | null
  category: QuestCategory
  suggested_points?: number
  icon_emoji?: string | null
  is_system_template?: boolean
  age_band_min?: AgeBand | null
  age_band_max?: AgeBand | null
}

export interface AssignTaskInput {
  household_id: string
  template_id?: string | null
  assigned_to: string
  assigned_by: string
  title: string
  description?: string | null
  category: QuestCategory
  points: number
  due_date?: string | null
  streak_eligible?: boolean
}

export interface SubmitTaskInput {
  task_id: string
  reflection_text?: string | null
}

export interface ApproveTaskInput {
  task_id: string
  approved_by: string
}

export interface RejectTaskInput {
  task_id: string
  approved_by: string
}

export interface CreateRewardInput {
  household_id: string
  created_by: string
  title: string
  description?: string | null
  points_cost: number
  icon_emoji?: string | null
}

export interface RequestRedemptionInput {
  household_id: string
  reward_id: string
  child_id: string
  points_spent: number
}

export interface ApproveRedemptionInput {
  redemption_id: string
  approved_by: string
}

export interface FulfillRedemptionInput {
  redemption_id: string
}

export interface CreateInviteCodeInput {
  child_id: string
}

export interface RequestFriendshipInput {
  child_id: string
  friend_code: string
}

export interface ApproveFriendshipInput {
  friendship_id: string
  approved_by: string
}

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

export interface DashboardStats {
  total_children: number
  pending_approvals: number
  pending_redemptions: number
  weekly_completions: number
  active_streaks: number
}

export interface ChildStats {
  total_points: number
  available_points: number
  weekly_points: number
  current_streak: number
  longest_streak: number
  total_badges: number
  total_quests_completed: number
}

export interface LeaderboardEntry {
  user_id: string
  nickname: string
  avatar_url: string | null
  points: number
  quests_completed: number
  rank: number
}
