import { z } from "zod";

export const matchConfigSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required").max(100, "Location is too long"),
  cost: z.string().optional(),
  notes: z.string().max(500, "Notes are too long").optional(),
  matchMode: z.enum(["standard", "turf"]).optional(),
  numTeams: z.number().min(2, "Must be at least 2 teams").max(4, "Maximum 4 teams").optional(),
  playersPerTeam: z.number().min(4, "Minimum 4 players").max(11, "Maximum 11 players").optional(),
  gkMode: z.enum(["fixed", "rotating", "no_gk"]).optional(),
  fixedGkTeamA: z.string().optional(),
  fixedGkTeamB: z.string().optional(),
  gkRotationInterval: z.enum(["time", "goals", "per_match", "per_goal", "per_time"]).optional(),
  gkRotationMinutes: z.number().optional(),
  matchType: z.enum(["friendly", "league", "cup", "knockout", "winner_stays"]).optional(),
  matchDurationMins: z.number().min(5).max(120).optional(),
  endCondition: z.enum(["time", "goals", "both"]).optional(),
  targetGoals: z.number().optional(),
  isOpenRegistration: z.boolean(),
  selectedPlayerUids: z.array(z.string()).optional(),
  enableCardsSystem: z.boolean().optional(),
});

export type MatchConfigFormData = z.infer<typeof matchConfigSchema>;
