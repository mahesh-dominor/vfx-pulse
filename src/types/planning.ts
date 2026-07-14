export type PipelineStepInput = {
  code: string;
  name: string;
  durationDays: number;
  bufferDays: number;
  parallelGroup?: string;
};

export type ReverseScheduleInput = {
  finalDeliveryDate: string;
  includeWeekends: boolean;
  holidays: string[];
  steps: PipelineStepInput[];
};

export type ReverseScheduleMilestone = {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  bufferDays: number;
  parallelGroup?: string;
};

export type ReverseScheduleResult = {
  pipelineStartDate: string;
  finalDeliveryDate: string;
  milestones: ReverseScheduleMilestone[];
};

export type PlanningSnapshot = {
  id: string;
  projectId: string;
  name: string;
  notes: string | null;
  finalDeliveryDate: string;
  pipelineStartDate: string;
  includeWeekends: boolean;
  holidays: string[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  milestones: ReverseScheduleMilestone[];
};

export type DepartmentCapacityItem = {
  department: string;
  pendingHours: number;
  inProgressHours: number;
  availableArtists: number;
  leaveHoursInWindow: number;
  effectiveArtists: number;
  capacityHoursPerDay: number;
  forecastFinishDays: number;
  targetDays: number;
  requiredAdditionalArtists: number;
  risk: "ON_TRACK" | "AT_RISK" | "BLOCKED";
};

export type DepartmentCapacityResult = {
  generatedAt: string;
  items: DepartmentCapacityItem[];
};
