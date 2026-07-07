export type DashboardKpis = {
  totalProjects: number;
  activeProjects: number;
  totalShots: number;
  openShots: number;
  completedShots: number;
  artistCount: number;
  taskOpen: number;
  taskInProgress: number;
  taskCompleted: number;
  timeLogHours: number;
  productionProgressPercent: number;

  artistsLoggedIn: number;
  updatesSubmitted: number;
  hoursLogged: number;
  shotsUpdated: number;
  missingUpdates: number;
};

export type DashboardActivity = {
  id: string;
  time: string;
  user: string;
  task: string;
};

export type AssignedShotItem = {
  id: string;
  code: string;
  status: string;
  dueDate: string | null;
  projectName: string;
};

export type TodayWorkItem = {
  id: string;
  shotCode: string;
  taskType: string;
  hoursWorked: number;
  status: string;
};

export type DashboardNotification = {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
};

export type QuickActionItem = {
  id: string;
  label: string;
  href: string;
};

export type DashboardData = {
  kpis: DashboardKpis;
  recentActivity: DashboardActivity[];
  assignedShots: AssignedShotItem[];
  todaysWork: TodayWorkItem[];
  notifications: DashboardNotification[];
  quickActions: QuickActionItem[];
};
