import { z } from "zod";

const positionSchema = z.enum([
  "CF", "SS", "LWF", "RWF", "AMF", "LMF", "RMF", "CMF", "DMF", "LB", "RB", "CB", "GK"
]);

export const playerAttributesSchema = z.object({
  offensiveAwareness: z.number().min(40).max(99).optional(),
  ballControl: z.number().min(40).max(99).optional(),
  dribbling: z.number().min(40).max(99).optional(),
  tightPossession: z.number().min(40).max(99).optional(),
  lowPass: z.number().min(40).max(99).optional(),
  loftedPass: z.number().min(40).max(99).optional(),
  finishing: z.number().min(40).max(99).optional(),
  heading: z.number().min(40).max(99).optional(),
  setPieceTaking: z.number().min(40).max(99).optional(),
  curl: z.number().min(40).max(99).optional(),
  speed: z.number().min(40).max(99).optional(),
  acceleration: z.number().min(40).max(99).optional(),
  kickingPower: z.number().min(40).max(99).optional(),
  jump: z.number().min(40).max(99).optional(),
  physicalContact: z.number().min(40).max(99).optional(),
  balance: z.number().min(40).max(99).optional(),
  stamina: z.number().min(40).max(99).optional(),
  defensiveAwareness: z.number().min(40).max(99).optional(),
  ballWinning: z.number().min(40).max(99).optional(),
  aggression: z.number().min(40).max(99).optional(),
  gkAwareness: z.number().min(40).max(99).optional(),
  gkCatching: z.number().min(40).max(99).optional(),
  gkClearing: z.number().min(40).max(99).optional(),
  gkReflexes: z.number().min(40).max(99).optional(),
  gkReach: z.number().min(40).max(99).optional(),
});

export const playerProfileSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  cardName: z.string().min(1, "Card name is required").max(35, "Card name is too long"),
  dateOfBirth: z.string().optional().nullable(),
  height: z.number().min(80, "Height must be at least 80cm").max(250, "Height must be under 250cm").optional().nullable(),
  weight: z.number().min(20, "Weight must be at least 20kg").max(200, "Weight must be under 200kg").optional().nullable(),
  preferredFoot: z.string().optional().nullable(),
  primaryPosition: positionSchema.optional().nullable(),
  secondaryPosition: positionSchema.or(z.literal("")).optional().nullable(),
  tertiaryPosition: positionSchema.or(z.literal("")).optional().nullable(),
  playStyle: z.string().optional().nullable(),
  specialSkills: z.array(z.string()).optional().nullable(),
  attributes: playerAttributesSchema.optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
});

export type PlayerProfileFormData = z.infer<typeof playerProfileSchema>;
