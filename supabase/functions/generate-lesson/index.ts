import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const cefr = (level: string) => {
  const m: Record<string, string> = {
    beginner: "A1",
    elementary: "A2",
    intermediate: "B1",
    "upper-intermediate": "B2",
    advanced: "C1",
    proficient: "C2",
  };
  return m[level] ?? "B1";
};

const SECTION_TOOLS: Record<string, any> = {
  full: {
    name: "create_lesson",
    description: "Return a complete English lesson with all sections",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        vocabulary: vocabSchema(),
        grammar: grammarSchema(),
        reading: readingSchema(),
        listening: listeningSchema(),
        speaking: speakingSchema(),
      },
      required: ["title", "description", "vocabulary", "grammar", "reading", "listening", "speaking"],
    },
  },
  vocabulary: {
    name: "create_vocabulary",
    description: "Return only the vocabulary section",
    parameters: { type: "object", properties: { vocabulary: vocabSchema() }, required: ["vocabulary"] },
  },
  grammar: {
    name: "create_grammar",
    description: "Return only the grammar section",
    parameters: { type: "object", properties: { grammar: grammarSchema() }, required: ["grammar"] },
  },
  reading: {
    name: "create_reading",
    description: "Return only the reading section",
    parameters: { type: "object", properties: { reading: readingSchema() }, required: ["reading"] },
  },
  listening: {
    name: "create_listening",
    description: "Return only the listening section",
    parameters: { type: "object", properties: { listening: listeningSchema() }, required: ["listening"] },
  },
  speaking: {
    name: "create_speaking",
    description: "Return only the speaking section",
    parameters: { type: "object", properties: { speaking: speakingSchema() }, required: ["speaking"] },
  },
};

function vocabSchema() {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        word: { type: "string" },
        translation: { type: "string" },
        part_of_speech: { type: "string" },
        example: { type: "string" },
        example_translation: { type: "string" },
      },
      required: ["word", "translation", "part_of_speech", "example", "example_translation"],
    },
  };
}
function grammarSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      explanation_uz: { type: "string" },
      examples: {
        type: "array",
        items: {
          type: "object",
          properties: { english: { type: "string" }, uzbek: { type: "string" } },
          required: ["english", "uzbek"],
        },
      },
    },
    required: ["title", "explanation_uz", "examples"],
  };
}
function readingSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      passage: { type: "string", description: "English reading passage, 120-200 words" },
      translation_uz: { type: "string", description: "Uzbek translation of the passage" },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct_index: { type: "integer" },
          },
          required: ["question", "options", "correct_index"],
        },
      },
    },
    required: ["title", "passage", "translation_uz", "questions"],
  };
}
function listeningSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      script: { type: "string", description: "English script that will be turned into audio (60-120 words, conversational)" },
      translation_uz: { type: "string" },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            correct_index: { type: "integer" },
          },
          required: ["question", "options", "correct_index"],
        },
      },
    },
    required: ["title", "script", "translation_uz", "questions"],
  };
}
function speakingSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      scenario_uz: { type: "string", description: "Situation description in Uzbek" },
      ai_role: { type: "string", description: "Who the AI plays (e.g. waiter, friend)" },
      starter_message: { type: "string", description: "First message AI says in English" },
      sample_phrases: {
        type: "array",
        items: {
          type: "object",
          properties: { english: { type: "string" }, uzbek: { type: "string" } },
          required: ["english", "uzbek"],
        },
      },
    },
    required: ["title", "scenario_uz", "ai_role", "starter_message", "sample_phrases"],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, level, section = "full" } = await req.json();
    if (!topic || !level) {
      return new Response(JSON.stringify({ error: "topic and level required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const tool = SECTION_TOOLS[section] ?? SECTION_TOOLS.full;

    const systemPrompt = `You are an expert English teacher creating CEFR-aligned lessons for Uzbek learners. All Uzbek text must be proper Uzbek (latin script). Output ONLY through the provided tool.`;

    const sectionInstr: Record<string, string> = {
      full: "Generate a COMPLETE lesson including title, description, vocabulary (8 items), grammar (1 focused point with 3 examples), reading (passage + 3 MCQ), listening (script + 3 MCQ), speaking (role-play scenario).",
      vocabulary: "Generate ONLY vocabulary: 8 useful words for the topic.",
      grammar: "Generate ONLY one focused grammar point with explanation_uz and 3 examples.",
      reading: "Generate ONLY a reading passage (120-200 words) with Uzbek translation and 3 multiple-choice questions (4 options each).",
      listening: "Generate ONLY a conversational listening script (60-120 words, suitable for TTS audio) with Uzbek translation and 3 multiple-choice questions.",
      speaking: "Generate ONLY a speaking role-play scenario: scenario_uz, ai_role, starter_message (English), and 5 sample_phrases (english+uzbek).",
    };

    const userPrompt = `Topic: ${topic}\nLevel: ${level} (CEFR ${cefr(level)})\n\n${sectionInstr[section]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{ type: "function", function: tool }],
        tool_choice: { type: "function", function: { name: tool.name } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Biroz kutib qayta urining." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI kreditlari tugadi. Workspace > Usage'dan to'ldiring." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI xato: " + t.slice(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI tool call topilmadi" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ result, section }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
