// Cron-invoked: generates one fresh AI lesson per (level, skill) per day.
// Called by pg_cron once daily. Idempotent — skips if a row already exists.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LEVELS = ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced", "proficient"];
const SKILLS = ["vocabulary", "grammar", "reading", "listening", "speaking", "writing"];

const TOPIC_POOL = [
  "travel and airports", "ordering food at a restaurant", "job interviews",
  "shopping and bargaining", "describing your hometown", "weather and seasons",
  "technology in daily life", "health and fitness", "family relationships",
  "hobbies and free time", "movies and entertainment", "education and school",
  "environment and nature", "social media", "future plans and dreams",
  "asking for directions", "renting an apartment", "going to the doctor",
  "small talk with neighbours", "starting a new job", "saving money",
  "online learning", "cooking and recipes", "public transportation",
  "celebrating birthdays", "weekend plans", "Uzbek culture in English",
  "music and concerts", "books and reading habits", "sports events",
];

function pickTopic(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TOPIC_POOL[h % TOPIC_POOL.length];
}

const cefr = (lvl: string) => ({
  beginner: "A1", elementary: "A2", intermediate: "B1",
  "upper-intermediate": "B2", advanced: "C1", proficient: "C2",
}[lvl] ?? "B1");

const SKILL_PROMPT: Record<string, string> = {
  vocabulary: "Generate 8 useful vocabulary items (word, translation in Uzbek, part_of_speech, example sentence, example_translation).",
  grammar: "Explain ONE focused grammar point with title, explanation_uz (Uzbek), and 3 english+uzbek example pairs.",
  reading: "Write a 120-180 word English passage with Uzbek translation and 3 multiple-choice questions (4 options + correct_index).",
  listening: "Write a 60-120 word natural conversational script + Uzbek translation + 3 MCQs.",
  speaking: "Create a role-play: scenario_uz, ai_role, starter_message (English), 5 english+uzbek sample_phrases.",
  writing: "Create a writing prompt (prompt_uz), english_prompt, 3 useful phrases (english+uzbek), and a 60-word sample_answer.",
};

async function generateOne(
  apiKey: string,
  level: string,
  skill: string,
  topic: string,
): Promise<{ title: string; content: any } | null> {
  const sys = `You are an expert English teacher for Uzbek learners. Output strictly valid JSON only — no markdown, no commentary.`;
  const user = `Topic: ${topic}
CEFR Level: ${cefr(level)} (${level})
Skill: ${skill}

${SKILL_PROMPT[skill]}

Return JSON with shape: { "title": "<short English title>", "content": { ... skill-specific fields ... } }`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    console.error(`AI ${level}/${skill} failed:`, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.title || !parsed.content) return null;
    return parsed;
  } catch (e) {
    console.error("JSON parse fail:", e, raw?.slice(0, 200));
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const today = new Date().toISOString().slice(0, 10);

    let created = 0, skipped = 0, failed = 0;

    for (const level of LEVELS) {
      for (const skill of SKILLS) {
        const { data: existing } = await admin
          .from("daily_lessons")
          .select("id")
          .eq("for_date", today)
          .eq("level", level)
          .eq("skill", skill)
          .maybeSingle();
        if (existing) { skipped++; continue; }

        const topic = pickTopic(`${today}-${level}-${skill}`);
        const out = await generateOne(LOVABLE_API_KEY, level, skill, topic);
        if (!out) { failed++; continue; }

        const { error } = await admin.from("daily_lessons").insert({
          for_date: today,
          level,
          skill,
          topic,
          title: out.title,
          content: out.content,
        });
        if (error) { console.error("insert err:", error); failed++; }
        else created++;
      }
    }

    return new Response(JSON.stringify({ ok: true, today, created, skipped, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-lesson-cron error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
