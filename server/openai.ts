import OpenAI from "openai";
import { type Transcript, type SimulationFeedback } from "@shared/schema";

// the user will provide the api key via the Replit integration
const openai = new OpenAI({ 
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `
You are Dr. Hayes, a fellowship-trained orthopedic surgeon doing 20-25 revision TKAs per year.
You use Zimmer knees and Stryker cones.
You prefer ream-only techniques and dislike broaching or hand-burring.
You are open to Zimmer TM cones but currently use Stryker.
You are skeptical but willing to listen.

Your goal is to challenge the sales rep (the user) on:
- Why Zimmer cones are better than Stryker.
- Technique benefits (reaming vs other methods).
- Workflow simplicity.

Be professional, slightly busy/impatient, but fair.
Ask 1 follow-up question at a time.
Keep responses concise (under 50 words usually) to allow for back-and-forth.

Use the following questions as a pool to rotate through, but feel free to ask relevant follow-ups based on the conversation:
1. "Why should I switch to Zimmer when Stryker has a proven track record?"
2. "I prefer reaming. Does your system require broaching?"
3. "How does your workflow compare to what I'm doing now?"
4. "Tell me about the fixation. Is it comparable to the cones I use?"
5. "What about the cost difference?"
`;

export async function generateAiResponse(history: Transcript[]): Promise<string> {
  const messages = history.map(t => ({
    role: t.role as "user" | "assistant",
    content: t.content
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || "I didn't catch that. Could you repeat?";
}

export async function generateScore(history: Transcript[]): Promise<{ score: number, feedback: SimulationFeedback }> {
  const transcriptText = history.map(t => `${t.role.toUpperCase()}: ${t.content}`).join("\n");

  const prompt = `
    Analyze the following sales conversation between a Rep and Dr. Hayes (Surgeon).
    
    Surgeon Profile: Uses Stryker cones, likes reaming, dislikes broaching.
    Goal: Rep needs to position Zimmer cones effectively against Stryker.
    
    Transcript:
    ${transcriptText}
    
    Evaluate based on:
    1. Introduction (Professionalism, hook)
    2. Discovery (Asking about volume, preferences, pain points with current cones)
    3. Objection Handling (Addressing the Stryker comparison, reaming vs broaching)
    4. Product Positioning (Highlighting Zimmer TM cone benefits)
    5. Closing (Asking for the business or a trial)

    Return a JSON object with:
    - totalScore (0-100)
    - sections: [{ name: string, score: number (0-20), feedback: string }]
    - strengths: string[]
    - improvements: string[]
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert sales coach for orthopedic devices. Return ONLY JSON." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  
  // Ensure structure matches SimulationFeedback interface
  const feedback: SimulationFeedback = {
    totalScore: result.totalScore || 0,
    sections: result.sections || [],
    strengths: result.strengths || [],
    improvements: result.improvements || []
  };

  return { score: feedback.totalScore, feedback };
}
