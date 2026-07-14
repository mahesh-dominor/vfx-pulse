import type { PipelineStepInput } from "@/types/planning";

export const DEFAULT_VFX_PIPELINE: readonly PipelineStepInput[] = [
  { code: "PREP", name: "Prep", durationDays: 2, bufferDays: 0 },
  { code: "ROTO", name: "Roto", durationDays: 3, bufferDays: 1 },
  { code: "PAINT", name: "Paint", durationDays: 2, bufferDays: 0 },
  { code: "MM", name: "Matchmove", durationDays: 2, bufferDays: 0 },
  { code: "LAYOUT", name: "Layout", durationDays: 2, bufferDays: 0 },
  { code: "ANIM", name: "Animation", durationDays: 4, bufferDays: 1 },
  { code: "CFX", name: "CFX", durationDays: 2, bufferDays: 0, parallelGroup: "sim" },
  { code: "FX", name: "FX", durationDays: 4, bufferDays: 1, parallelGroup: "sim" },
  { code: "LIGHT", name: "Lighting", durationDays: 3, bufferDays: 1 },
  { code: "COMP", name: "Comp", durationDays: 3, bufferDays: 1 },
  { code: "QC", name: "QC", durationDays: 1, bufferDays: 0 },
  { code: "DELIVERY", name: "Final Delivery", durationDays: 1, bufferDays: 0 },
] as const;
