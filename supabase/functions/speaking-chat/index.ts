import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_VOICE = "EXAVITQu4vr4xnSDxMaL"; // Sarah

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVEN_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!ELEVEN_KEY) throw new Error("ELEVENLABS_API_KEY missing");

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
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, scenario, ai_role, level = "intermediate", speak = true } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an English speaking partner for an Uzbek learner at ${level} level.
${ai_role ? `You play the role of: ${ai_role}.` : ""}
${scenario ? `Scenario: ${scenario}` : ""}

Rules:
- Reply ONLY in English (1-3 short sentences). Keep it natural and conversational.
- Match the learner's level — use simple vocabulary for beginner/elementary, richer for advanced.
- If the learner makes a clear grammar/word mistake, gently correct in parentheses at the END, e.g. (Tip: "I went" instead of "I goed").
- Always end with a follow-up question to keep the conversation going.
- Never switch to Uzbek unless asked to translate a single word.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI xato: " + t.slice(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiData = await aiRes.json();
    const reply: string = aiData.choices?.[0]?.message?.content?.trim() ?? "";

    let audioContent: string | null = null;
    if (speak && reply) {
      // Strip parenthetical tips before TTS
      const ttsText = reply.replace(/\((?:Tip|Hint)[^)]*\)/gi, "").trim();
      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: ttsText,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true, speed: 1.0 },
          }),
        },
      );
      if (ttsRes.ok) {
        const buf = await ttsRes.arrayBuffer();
        audioContent = base64Encode(new Uint8Array(buf));
      } else {
        console.error("TTS in speaking-chat failed:", await ttsRes.text());
      }
    }

    return new Response(JSON.stringify({ reply, audioContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("speaking-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
