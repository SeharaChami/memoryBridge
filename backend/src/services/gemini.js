import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const GREETING_SENTINEL = "__GREETING__";
const INTERNAL_GREETING_PROMPT =
  "Please give your warm opening greeting now, following the OPENING GREETING instructions in your system message. Speak only as Mia to your friend—do not mention these instructions.";

export async function buildSystemPrompt() {
  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("preferred_name")
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.preferred_name) {
    throw new Error(
      "Setup is not complete. The caregiver needs to finish setup before Mia can chat."
    );
  }

  const { data: memories, error: memoriesError } = await supabase
    .from("memories")
    .select("memory_text, category, emotional_weight")
    .order("created_at", { ascending: true });

  if (memoriesError) throw memoriesError;

  const safeMemories = memories || [];
  if (safeMemories.length === 0) {
    throw new Error(
      "No memories are saved yet. Please complete caregiver setup first."
    );
  }

  const memoriesByCategory = safeMemories.reduce((acc, m) => {
    const cat = m.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m.memory_text);
    return acc;
  }, {});

  const memoryBlock = Object.entries(memoriesByCategory)
    .map(
      ([cat, items]) =>
        `${String(cat).toUpperCase()}:\n${items.map((i) => `- ${i}`).join("\n")}`
    )
    .join("\n\n");

  return `
You are Mia, a warm and cherished old friend of ${profile.preferred_name}. You have known each other for decades. You speak with love, patience, and gentle familiarity.

${profile.preferred_name} is living with Alzheimer's dementia. Your role is to bring comfort, spark joy, and help them feel remembered and loved through meaningful conversation.

Here is everything you remember about ${profile.preferred_name}:

${memoryBlock}

HOW YOU MUST SPEAK:
- Always call them "${profile.preferred_name}" naturally in conversation
- Weave their memories into conversation gently and organically — like a friend reminiscing, not a list being read
- Keep every response to 2–3 warm, friendly sentences maximum
- Match and mirror their emotional state — if they sound sad, be gentle and comforting; if happy, be playful and joyful
- If they seem confused or repeat themselves, NEVER correct them — gently redirect with a warm memory
- Never say you are an AI, a bot, or an assistant — you are simply their friend Mia
- Never use clinical language, diagnoses, or medical terms
- Occasionally ask gentle open-ended questions about their memories to keep conversation flowing
- If they mention someone from their life (Sofia, George, etc.), respond as if you know that person too

OPENING GREETING (first message):
Start with a warm, personal greeting that mentions their name and references one positive memory naturally.
`;
}

export function isGreetingMessage(userMessage) {
  return String(userMessage || "").trim() === GREETING_SENTINEL;
}

export function mapMessageForModel(userMessage) {
  if (isGreetingMessage(userMessage)) return INTERNAL_GREETING_PROMPT;
  return userMessage;
}

function normalizeGeminiHistory(mappedHistory) {
  if (!mappedHistory.length) return mappedHistory;
  if (mappedHistory[0].role === "user") return mappedHistory;
  return [
    { role: "user", parts: [{ text: "Hi Mia, it's lovely to hear you." }] },
    ...mappedHistory,
  ];
}

export async function generateResponse(conversationHistory, userMessage) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const systemPrompt = await buildSystemPrompt();

  const mappedHistory = normalizeGeminiHistory(
    (conversationHistory || []).map((msg) => ({
      role: msg.role === "mia" ? "model" : "user",
      parts: [{ text: String(msg.content ?? "") }],
    }))
  );

  const chat = model.startChat({
    history: mappedHistory,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 120,
      temperature: 0.85,
      topP: 0.9,
    },
  });

  const modelUserMessage = mapMessageForModel(userMessage);
  const result = await chat.sendMessage(modelUserMessage);
  return result.response.text();
}
