// The scoring rubric structure. Layer A + C apply to every session; Layer B
// (shared decision-making) only applies when sessionType === 'consult'.
// Every dimension is scored 1-5 (1 = needs significant work, 5 = excellent) —
// consistent, simple, and enough resolution to see a trend without false
// precision on what's ultimately a qualitative LLM read.

export type SessionType = 'consult' | 'meeting';

export interface RubricDimension {
  key: string;
  label: string;
  description: string;
}

export const LAYER_A: RubricDimension[] = [
  { key: 'building_relationship', label: 'Building the relationship', description: 'Rapport, respect, and partnership established with the other person.' },
  { key: 'opening_discussion', label: 'Opening the discussion', description: 'Clear agenda-setting at the start — what the conversation is for.' },
  { key: 'gathering_information', label: 'Gathering information', description: 'Effective, open-ended questions; genuinely listens before responding.' },
  { key: 'understanding_perspective', label: "Understanding the other person's perspective", description: "Explicitly checks and reflects the other person's viewpoint, concerns, or priorities." },
  { key: 'sharing_information', label: 'Sharing information', description: 'Clear, jargon-appropriate, well-paced information delivery.' },
  { key: 'reaching_agreement', label: 'Reaching agreement', description: 'Explicit alignment on next steps or a shared plan, not left implicit.' },
  { key: 'providing_closure', label: 'Providing closure', description: 'A clear, deliberate close rather than the conversation just trailing off.' },
];

export const LAYER_B: RubricDimension[] = [
  { key: 'alternatives_presented', label: 'Alternatives presented', description: 'Real alternatives were laid out, not just the recommended path.' },
  { key: 'preference_invited', label: 'Patient preference invited', description: "The patient's preference was explicitly asked for and incorporated, not just informed-consented past." },
  { key: 'risk_benefit_clarity', label: 'Risk/benefit clarity', description: 'Risks and benefits were explained in a way an average patient could actually weigh.' },
  { key: 'safety_netting', label: 'Follow-up / safety-netting', description: 'Clear arrangements for what happens next and what to do if something goes wrong.' },
];

export const LAYER_C: RubricDimension[] = [
  { key: 'pacing', label: 'Pacing', description: 'Appropriate speaking pace — not rushed, not dragging.' },
  { key: 'filler_words', label: 'Filler word rate', description: 'Frequency of "um," "uh," "like," and other filler speech.' },
  { key: 'talk_listen_ratio', label: 'Talk-to-listen ratio', description: 'Balance of speaking vs. letting the other person talk, appropriate to session type.' },
  { key: 'meandering', label: 'Meandering', description: 'Did the speaker stay on track, or circle back and wander off-topic.' },
];

export function dimensionsFor(sessionType: SessionType): { layerA: RubricDimension[]; layerB: RubricDimension[] | null; layerC: RubricDimension[] } {
  return {
    layerA: LAYER_A,
    layerB: sessionType === 'consult' ? LAYER_B : null,
    layerC: LAYER_C,
  };
}

export interface DimensionScore {
  score: number; // 1-5
  note: string;  // one-line rationale for this specific score
}

export interface SessionScores {
  layerA: Record<string, DimensionScore>;
  layerB: Record<string, DimensionScore> | null;
  layerC: Record<string, DimensionScore>;
}

export interface Session {
  id: number;
  createdAt: string;
  sessionDate: string;
  sessionType: SessionType;
  label: string;
  // De-identified index key for consult sessions (initials/code Julian
  // chooses — deliberately never a real patient name). Blank for meetings.
  patientHandle: string;
  transcript: string;
  scores: SessionScores;
  coachingNotes: string;
}
