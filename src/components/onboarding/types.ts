import { PESPosition, PlayerAttributes } from '@/types';

export interface WizardState {
  firstName: string;
  lastName: string;
  cardName: string;
  dateOfBirth: string;
  calculatedAge: number;
  height: number;
  weight: number;
  preferredFoot: 'Right' | 'Left' | 'Ambidextrous';
  primaryPosition: PESPosition | null;
  secondaryPosition: PESPosition | null;
  tertiaryPosition: PESPosition | null;
  attributes: PlayerAttributes;
  specialSkills: string[];
  playStyle: string;
  photoUrl: string;
}
