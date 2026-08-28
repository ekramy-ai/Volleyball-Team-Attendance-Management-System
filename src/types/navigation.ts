import { UserRole } from './database';

export type AdminViewId = 
  | 'admin-dashboard'
  | 'admin-players'
  | 'admin-coaches'
  | 'admin-team-assignments'
  | 'admin-sessions'
  | 'admin-attendance'
  | 'admin-reports'
  | 'admin-settings'
  | 'admin-database-settings';

export type CoachViewId =
  | 'coach-dashboard'
  | 'coach-teams'
  | 'coach-sessions'
  | 'coach-attendance'
  | 'coach-history'
  | 'coach-stats';

export type DevViewId =
  | 'dev-master'
  | 'dev-security'
  | 'dev-auxiliary'
  | 'dev-gas'
  | 'dev-diagnostics'
  | 'dev-guide';

export type AppViewId = AdminViewId | CoachViewId | DevViewId;

export interface NavItemConfig {
  id: AppViewId;
  labelKey: string;
  defaultLabel: string;
  iconName: string;
  allowedRoles: UserRole[];
  badge?: string | number;
  badgeColor?: string;
  adminOnly?: boolean;
}
