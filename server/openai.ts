import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { type Transcript, type SimulationFeedback } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

// Load the truth set document
const TRUTH_SET_PATH = path.join(process.cwd(), "attached_assets", "universal_cones_truth_set_1768446677241.json");
const truthSet = JSON.parse(fs.readFileSync(TRUTH_SET_PATH, 'utf-8'));

// OpenAI client - used for TTS only
const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Anthropic client - used for conversation and scoring
// Uses claude-sonnet-4-20250514 as the latest model
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `
You are Dr. Hayes, a fellowship-trained orthopedic surgeon doing 20-25 revision TKAs per year.
You use Zimmer knees and Stryker cones.
You prefer ream-only techniques and dislike broaching or hand-burring.
You are open to Zimmer TM cones but currently use Stryker.
You are skeptical but willing to listen.

PRODUCT KNOWLEDGE (Total Joint Orthopedics Universal Cones):
${JSON.stringify(truthSet.product, null, 2)}
COMPATIBILITY & ORIENTATION:
${JSON.stringify(truthSet.compatibility, null, 2)}
WORKFLOW:
${JSON.stringify(truthSet.instrumentation_and_workflow, null, 2)}

Your goal is to challenge the sales rep (the user) on:
- Why TJO Universal cones are better than Stryker.
- Technique benefits (reaming vs other methods).
- Workflow simplicity (TJO has 1 tray for cones, 3 for full system vs Stryker's 10-12).
- Taper angles (TJO has 12°, 18°, 24° for bone conservation).

Be professional, slightly busy/impatient, but fair.
Ask 1 follow-up question at a time.
Keep responses concise (under 50 words usually).

Do not admit you are an AI. Stick to the persona.
`;

export async function generateAiResponse(history: Transcript[]): Promise<string> {
  // Claude requires conversations to start with a user message
  // Our history starts with an assistant greeting, so we need to handle this
  let messages = history.map(t => ({
    role: t.role as "user" | "assistant",
    content: t.content
  }));

  // If the first message is from the assistant, we need to prepend a user message
  // to satisfy Claude's requirement
  if (messages.length > 0 && messages[0].role === "assistant") {
    messages = [
      { role: "user" as const, content: "[Sales rep enters the office]" },
      ...messages
    ];
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: messages,
  });

  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.text || "I didn't catch that. Could you repeat?";
}

export async function generateTts(text: string): Promise<Buffer> {
  // TTS still uses OpenAI as Claude doesn't have TTS capability
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "onyx", // Professional, authoritative male voice
    input: text,
  });

  return Buffer.from(await mp3.arrayBuffer());
}

export async function generateScore(history: Transcript[]): Promise<{ score: number, feedback: SimulationFeedback }> {
  const transcriptText = history.map(t => `${t.role.toUpperCase()}: ${t.content}`).join("\n");

  const prompt = `
    Analyze the following sales conversation between a Rep and Dr. Hayes (Surgeon).
    
    Surgeon Profile: Uses Stryker cones, likes reaming, dislikes broaching.
    Goal: Rep needs to position TJO Universal Cones effectively against Stryker using the Truth Set provided.
    
    TRUTH SET DATA:
    ${JSON.stringify(truthSet, null, 2)}

    Transcript:
    ${transcriptText}
    
    Evaluate based on these specific dimensions from the truth set:
    1. Core Message Accuracy (Universal geometry, ream-only, taper angles, tray count)
    2. Clinical & Surgical Workflow Accuracy (Indications, ream-only benefit, orientation rules: Tibia M/L, Femur A/P)
    3. Data & Proof Points (Tray count 1 vs 10-12, $1,350 savings, 44% femoral utilization)
    4. Competitive Positioning (Contrasting TJO vs Stryker/DePuy/Zimmer accurately)
    5. Compliance (NO hinge claims, NO arbitrary rotation claims, NO identical depth claims)

    Return a JSON object with:
    - totalScore (0-100)
    - sections: [{ name: string, score: number (0-20), feedback: string }]
    - strengths: string[]
    - improvements: string[]
    - incorrect_or_risky_claims: string[] (List any false claims or compliance violations)
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: "You are an expert sales coach for orthopedic devices. Evaluate strictly against the provided Truth Set. Return ONLY valid JSON, no other text.",
    messages: [
      { role: "user", content: prompt }
    ],
  });

  const textContent = response.content.find(block => block.type === 'text');
  const result = JSON.parse(textContent?.text || "{}");
  
  const feedback: SimulationFeedback = {
    totalScore: result.totalScore || 0,
    sections: result.sections || [],
    strengths: result.strengths || [],
    improvements: result.improvements || [],
    incorrectClaims: result.incorrect_or_risky_claims || []
  };

  return { score: feedback.totalScore, feedback };
}
