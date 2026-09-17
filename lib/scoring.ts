import Anthropic from '@anthropic-ai/sdk';
import { LAYER_A, LAYER_B, LAYER_C, type SessionType, type SessionScores } from './rubric';

const MODEL = process.env.SCORING_MODEL || 'claude-sonnet-5';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function dimensionList(dims: { key: string; label: string; description: string }[]): string {
  return dims.map((d) => `- "${d.key}" (${d.label}): ${d.description}`).join('\n');
}

function buildSystemPrompt(sessionType: SessionType): string {
  const layerBBlock = sessionType === 'consult'
    ? `\nLAYER B — Shared Decision-Making & Consent Quality (this IS a consult, score this layer):\n${dimensionList(LAYER_B)}\nThe key distinction to score on throughout Layer B: genuine shared decision-making (real alternatives presented, patient preference actually invited and incorporated) versus mere informed consent (explain-then-sign). A high score requires evidence the patient's own preference shaped the plan, not just that risks were disclosed.\n`
    : '';

  return `You are a communication-skills coach scoring a transcript for Julian, a psychiatric nurse practitioner, so he can track whether his delivery is improving over time. Session type: ${sessionType}.

Score every dimension below from 1-5 (1 = needs significant work, 3 = adequate, 5 = excellent). Base every score and note ONLY on what's actually in the transcript — never invent an example that didn't happen, and if a dimension genuinely isn't demonstrated either way (e.g. no closure occurred because the recording cuts off), say so plainly in the note and score conservatively rather than guessing high.

LAYER A — General Communication Competency (Kalamazoo Essential Elements, always scored):
${dimensionList(LAYER_A)}
${layerBBlock}
LAYER C — Delivery Metrics (always scored):
${dimensionList(LAYER_C)}
For filler_words and talk_listen_ratio specifically, base the score on the actual transcript text (count-like impression, not a guess) — a heavily hedged, "um"/"uh"-dense transcript should score low; a transcript where Julian talks over the other person for the large majority of turns should score low on talk_listen_ratio regardless of content quality.

Return ONLY a JSON object, no prose, in this exact shape:
{
  "layerA": { "<dimension_key>": { "score": number, "note": string }, ... one entry per Layer A dimension ... },
  ${sessionType === 'consult' ? '"layerB": { "<dimension_key>": { "score": number, "note": string }, ... one entry per Layer B dimension ... },' : '"layerB": null,'}
  "layerC": { "<dimension_key>": { "score": number, "note": string }, ... one entry per Layer C dimension ... },
  "coachingNotes": string
}

coachingNotes: 150-350 words of direct, specific coaching — what to keep doing, what to change next time, grounded in concrete moments from this transcript. Written to Julian directly ("you"), not about him in the third person. No filler praise — be honest about weak spots, this is a private coaching tool, not a performance review.`;
}

export async function scoreTranscript(transcript: string, sessionType: SessionType): Promise<{ scores: SessionScores; coachingNotes: string }> {
  const msg = await client.messages.create({
    model: MODEL,
    // 15 dimensions × a detailed, quote-grounded note each + 150-350 words of
    // coaching notes can genuinely exceed 4096 tokens for a long/dense real
    // session (confirmed live — same failure mode already fixed once for
    // clinical-agent's Interventional Plans at this same 8192 ceiling).
    max_tokens: 8192,
    system: buildSystemPrompt(sessionType),
    messages: [{ role: 'user', content: `TRANSCRIPT:\n${transcript.slice(0, 100000)}` }],
  });
  const raw = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('').trim();
  const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const truncated = msg.stop_reason === 'max_tokens';
    throw new Error(`Scoring model did not return valid JSON${truncated ? ' (response was truncated — transcript may be too long for one pass)' : ''}: ${raw.slice(0, 300)}`);
  }
  return {
    scores: { layerA: parsed.layerA, layerB: parsed.layerB ?? null, layerC: parsed.layerC },
    coachingNotes: parsed.coachingNotes || '',
  };
}
