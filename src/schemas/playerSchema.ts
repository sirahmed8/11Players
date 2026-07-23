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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  cardName: z.string().min(1, "Card name is required").max(15, "Card name too long"),
  dateOfBirth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 10 && age <= 60;
  }, "Age must be between 10 and 60"),
  height: z.number().min(100, "Height must be at least 100cm").max(250, "Height must be under 250cm"),
  weight: z.number().min(30, "Weight must be at least 30kg").max(150, "Weight must be under 150kg"),
  preferredFoot: z.enum(["Right", "Left", "Both", "Ambidextrous"]),
  primaryPosition: positionSchema,
  secondaryPosition: positionSchema.nullable().optional(),
  tertiaryPosition: positionSchema.nullable().optional(),
  playStyle: z.string().optional(),
  specialSkills: z.array(z.string()).optional(),
  attributes: playerAttributesSchema.optional(),
  photoUrl: z.string().url("Invalid photo URL").optional().nullable(),
  email: z.string().email("Invalid email").optional(),
});

export type PlayerProfileFormData = z.infer<typeof playerProfileSchema>;
